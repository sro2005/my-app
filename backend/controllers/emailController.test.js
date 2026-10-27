const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const Customer = require('../models/Customer');

const capturedMail = [];
let mailFailure = null;
const memoryTransport = {
  sendMail: async options => {
    capturedMail.push(options);
    if (mailFailure) throw mailFailure;
    return { accepted: [options.to], messageId: 'ci-memory-mail' };
  }
};
const originalCreateTransport = nodemailer.createTransport;
nodemailer.createTransport = () => memoryTransport;
delete require.cache[require.resolve('./emailController')];
const { resetPassword, forgotPassword } = require('./emailController');
nodemailer.createTransport = originalCreateTransport;

const createResponse = () => ({
  statusCode: null,
  body: null,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; }
});


const setRecoveryMailConfig = t => {
  const previousAddress = process.env.NO_REPLY_EMAIL_ADDRESS;
  const previousPassword = process.env.NO_REPLY_EMAIL_PASSWORD;
  process.env.NO_REPLY_EMAIL_ADDRESS = 'no-reply@example.test';
  process.env.NO_REPLY_EMAIL_PASSWORD = 'mock-only-smtp-password';
  t.after(() => {
    if (previousAddress === undefined) delete process.env.NO_REPLY_EMAIL_ADDRESS;
    else process.env.NO_REPLY_EMAIL_ADDRESS = previousAddress;
    if (previousPassword === undefined) delete process.env.NO_REPLY_EMAIL_PASSWORD;
    else process.env.NO_REPLY_EMAIL_PASSWORD = previousPassword;
  });
};

test('forgotPassword does not query customer records when SMTP configuration is missing', async t => {
  const originalAddress = process.env.NO_REPLY_EMAIL_ADDRESS;
  const originalPassword = process.env.NO_REPLY_EMAIL_PASSWORD;
  delete process.env.NO_REPLY_EMAIL_ADDRESS;
  delete process.env.NO_REPLY_EMAIL_PASSWORD;
  const originalFindOne = Customer.findOne;
  let lookups = 0;
  Customer.findOne = async () => { lookups += 1; return null; };
  capturedMail.length = 0;
  mailFailure = null;
  t.after(() => {
    Customer.findOne = originalFindOne;
    if (originalAddress === undefined) delete process.env.NO_REPLY_EMAIL_ADDRESS;
    else process.env.NO_REPLY_EMAIL_ADDRESS = originalAddress;
    if (originalPassword === undefined) delete process.env.NO_REPLY_EMAIL_PASSWORD;
    else process.env.NO_REPLY_EMAIL_PASSWORD = originalPassword;
    capturedMail.length = 0;
    mailFailure = null;
  });

  const response = createResponse();
  await forgotPassword({ body: { email: 'buyer@example.test' } }, response);

  assert.equal(response.statusCode, 200);
  assert.match(response.body.message, /Si el correo está registrado/i);
  assert.equal(lookups, 0);
  assert.equal(capturedMail.length, 0);
});

test('forgotPassword stores only a hash and emails a short-lived reset link through the mocked transport', async t => {
  setRecoveryMailConfig(t);
  const originalFindOne = Customer.findOne;
  const originalFrontendUrl = process.env.FRONTEND_URL;
  capturedMail.length = 0;
  mailFailure = null;
  process.env.FRONTEND_URL = 'https://preview.example.test';
  const customer = {
    email: 'demo@example.com',
    resetPasswordToken: undefined,
    resetPasswordExpires: undefined,
    saves: 0,
    async save() { this.saves += 1; return this; }
  };
  Customer.findOne = async filter => {
    assert.deepEqual(filter, { email: 'demo@example.com' });
    return customer;
  };
  t.after(() => {
    Customer.findOne = originalFindOne;
    if (originalFrontendUrl === undefined) delete process.env.FRONTEND_URL;
    else process.env.FRONTEND_URL = originalFrontendUrl;
    mailFailure = null;
    capturedMail.length = 0;
  });

  const response = createResponse();
  await forgotPassword({ body: { email: '  DEMO@EXAMPLE.COM  ' } }, response);

  assert.equal(response.statusCode, 200);
  assert.match(response.body.message, /Si el correo está registrado/i);
  assert.equal(customer.saves, 1);
  assert.match(customer.resetPasswordToken, /^[a-f0-9]{64}$/);
  assert.ok(customer.resetPasswordExpires instanceof Date);
  assert.ok(customer.resetPasswordExpires.getTime() > Date.now() + 29 * 60 * 1000);
  assert.ok(customer.resetPasswordExpires.getTime() <= Date.now() + 30 * 60 * 1000 + 1000);
  assert.equal(capturedMail.length, 1);
  assert.equal(capturedMail[0].to, 'demo@example.com');
  assert.match(capturedMail[0].text, /\/#\/reset-password\/[a-f0-9]{64}/);
  assert.match(capturedMail[0].html, /href="https:\/\/preview\.example\.test\/#\/reset-password\/[a-f0-9]{64}"/);
  assert.match(capturedMail[0].html, /Crear nueva contraseña/i);
  assert.match(capturedMail[0].html, /30 minutos/i);
  const tokenMatch = capturedMail[0].text.match(/reset-password\/([a-f0-9]{64})/);
  assert.ok(tokenMatch);
  assert.equal(
    customer.resetPasswordToken,
    crypto.createHash('sha256').update(tokenMatch[1]).digest('hex')
  );
  assert.doesNotMatch(capturedMail[0].text, new RegExp(customer.resetPasswordToken));
});

test('forgotPassword responds generically for an unregistered email and sends no message', async t => {
  setRecoveryMailConfig(t);
  const originalFindOne = Customer.findOne;
  capturedMail.length = 0;
  mailFailure = null;
  Customer.findOne = async filter => {
    assert.deepEqual(filter, { email: 'unknown@example.com' });
    return null;
  };
  t.after(() => {
    Customer.findOne = originalFindOne;
    mailFailure = null;
    capturedMail.length = 0;
  });

  const response = createResponse();
  await forgotPassword({ body: { email: 'UNKNOWN@example.com' } }, response);

  assert.equal(response.statusCode, 200);
  assert.match(response.body.message, /Si el correo está registrado/i);
  assert.equal(capturedMail.length, 0);
});

test('forgotPassword removes the reset token if the mocked mail transport fails', async t => {
  setRecoveryMailConfig(t);
  const originalFindOne = Customer.findOne;
  const originalFrontendUrl = process.env.FRONTEND_URL;
  capturedMail.length = 0;
  mailFailure = new Error('simulated SMTP failure');
  process.env.FRONTEND_URL = 'https://preview.example.test';
  const customer = {
    email: 'demo@example.com',
    resetPasswordToken: undefined,
    resetPasswordExpires: undefined,
    saves: 0,
    async save() { this.saves += 1; return this; }
  };
  Customer.findOne = async () => customer;
  t.after(() => {
    Customer.findOne = originalFindOne;
    if (originalFrontendUrl === undefined) delete process.env.FRONTEND_URL;
    else process.env.FRONTEND_URL = originalFrontendUrl;
    mailFailure = null;
    capturedMail.length = 0;
  });

  const response = createResponse();
  await forgotPassword({ body: { email: 'demo@example.com' } }, response);

  assert.equal(response.statusCode, 200);
  assert.match(response.body.message, /Si el correo está registrado/i);
  assert.equal(capturedMail.length, 1);
  assert.equal(customer.saves, 2, 'The controller saves the token, then clears it after delivery failure');
  assert.equal(customer.resetPasswordToken, undefined);
  assert.equal(customer.resetPasswordExpires, undefined);
});

test('resetPassword consumes a valid token atomically and hashes the new password', async t => {
  const originalHash = bcrypt.hash;
  const originalFindOneAndUpdate = Customer.findOneAndUpdate;
  t.after(() => {
    bcrypt.hash = originalHash;
    Customer.findOneAndUpdate = originalFindOneAndUpdate;
  });

  let received;
  bcrypt.hash = async password => `hashed:${password}`;
  Customer.findOneAndUpdate = async (...args) => {
    received = args;
    return { _id: 'customer-id' };
  };

  const token = 'a'.repeat(64);
  const response = createResponse();
  await resetPassword({ params: { token }, body: { password: 'StrongPass1!' } }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(received[0].resetPasswordToken, crypto.createHash('sha256').update(token).digest('hex'));
  assert.ok(received[0].resetPasswordExpires.$gt instanceof Date);
  assert.equal(received[1].$set.password, 'hashed:StrongPass1!');
  assert.equal(received[1].$unset.resetPasswordToken, 1);
  assert.equal(received[1].$unset.resetPasswordExpires, 1);
  assert.equal(received[2].runValidators, true);
});

test('resetPassword rejects weak passwords before querying the database', async t => {
  const originalFindOneAndUpdate = Customer.findOneAndUpdate;
  t.after(() => { Customer.findOneAndUpdate = originalFindOneAndUpdate; });
  let calls = 0;
  Customer.findOneAndUpdate = async () => { calls += 1; };

  const response = createResponse();
  await resetPassword({ params: { token: 'b'.repeat(64) }, body: { password: 'weakpassword' } }, response);

  assert.equal(response.statusCode, 400);
  assert.equal(calls, 0);
});

test('resetPassword rejects a token that was already consumed or expired', async t => {
  const originalHash = bcrypt.hash;
  const originalFindOneAndUpdate = Customer.findOneAndUpdate;
  t.after(() => {
    bcrypt.hash = originalHash;
    Customer.findOneAndUpdate = originalFindOneAndUpdate;
  });

  bcrypt.hash = async () => 'hashed-password';
  Customer.findOneAndUpdate = async () => null;

  const response = createResponse();
  await resetPassword({ params: { token: 'c'.repeat(64) }, body: { password: 'StrongPass1!' } }, response);

  assert.equal(response.statusCode, 400);
  assert.match(response.body.message, /expiró o ya fue utilizado/);
});
