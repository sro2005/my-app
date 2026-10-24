const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const bcrypt = require('bcrypt');
const Customer = require('../models/Customer');
const { resetPassword } = require('./emailController');

const createResponse = () => ({
  statusCode: null,
  body: null,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; }
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
