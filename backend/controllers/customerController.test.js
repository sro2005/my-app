const test = require('node:test');
const assert = require('node:assert/strict');
const Customer = require('../models/Customer');
const { getProfile, updateCustomer } = require('./customerController');

const customerId = '507f1f77bcf86cd799439011';
const anotherCustomerId = '507f1f77bcf86cd799439012';

const createResponse = () => ({
  statusCode: null,
  body: null,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; }
});

const restore = (t, values) => t.after(() => {
  for (const [target, key, value] of values) target[key] = value;
});

test('updateCustomer refuses to change another customer profile for a regular user', async t => {
  const originalUpdate = Customer.findByIdAndUpdate;
  restore(t, [[Customer, 'findByIdAndUpdate', originalUpdate]]);
  let calls = 0;
  Customer.findByIdAndUpdate = async () => { calls += 1; return null; };

  const response = createResponse();
  await updateCustomer({
    params: { id: customerId },
    user: { _id: anotherCustomerId, role: 'user' },
    body: { firstName: 'Unauthorized Change' }
  }, response);

  assert.equal(response.statusCode, 403);
  assert.equal(calls, 0);
});

test('updateCustomer rejects role/password mass assignment when no editable profile field is supplied', async t => {
  const originalUpdate = Customer.findByIdAndUpdate;
  restore(t, [[Customer, 'findByIdAndUpdate', originalUpdate]]);
  let calls = 0;
  Customer.findByIdAndUpdate = async () => { calls += 1; return null; };

  const response = createResponse();
  await updateCustomer({
    params: { id: customerId },
    user: { _id: customerId, role: 'user' },
    body: { role: 'admin', password: 'AttackerPass1!', status: 'Active' }
  }, response);

  assert.equal(response.statusCode, 400);
  assert.equal(calls, 0);
});

test('updateCustomer normalizes allowed fields and ignores privileged fields', async t => {
  const originalUpdate = Customer.findByIdAndUpdate;
  restore(t, [[Customer, 'findByIdAndUpdate', originalUpdate]]);
  let received;
  Customer.findByIdAndUpdate = async (...args) => {
    received = args;
    return {
      toJSON: () => ({
        _id: customerId,
        firstName: 'Demo Person',
        email: 'demo@example.com',
        preferences: ['Televisores']
      })
    };
  };

  const response = createResponse();
  await updateCustomer({
    params: { id: customerId },
    user: { _id: customerId, role: 'user' },
    body: {
      firstName: '  Demo Person  ',
      email: 'DEMO@EXAMPLE.COM',
      preferences: ['Televisores'],
      role: 'admin',
      password: 'MustNotBeSaved1!'
    }
  }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(received[0], customerId);
  assert.deepEqual(received[1].$set, {
    firstName: 'Demo Person',
    email: 'demo@example.com',
    preferences: ['Televisores']
  });
  assert.deepEqual(received[2], { new: true, runValidators: true, context: 'query' });
  assert.equal(response.body.updatedCustomer.email, 'demo@example.com');
  assert.equal(response.body.updatedCustomer.role, undefined);
});

test('updateCustomer rejects a minor birth date before querying MongoDB', async t => {
  const originalUpdate = Customer.findByIdAndUpdate;
  restore(t, [[Customer, 'findByIdAndUpdate', originalUpdate]]);
  let calls = 0;
  Customer.findByIdAndUpdate = async () => { calls += 1; return null; };

  const response = createResponse();
  await updateCustomer({
    params: { id: customerId },
    user: { _id: customerId, role: 'user' },
    body: { birthDate: '2015-01-01' }
  }, response);

  assert.equal(response.statusCode, 400);
  assert.equal(calls, 0);
});

test('getProfile serialization does not expose the password or reset-password fields', async t => {
  const originalFindById = Customer.findById;
  restore(t, [[Customer, 'findById', originalFindById]]);

  const customer = new Customer({
    _id: customerId,
    firstName: 'Demo',
    lastName: 'Customer',
    identificationNumber: '1.234.567',
    birthDate: new Date('1990-01-01T12:00:00.000Z'),
    phone: '+57 300 123 4567',
    preferences: ['Televisores'],
    email: 'demo@example.com',
    password: 'stored-password-hash',
    role: 'user',
    lastActivityDate: new Date()
  });
  customer.resetPasswordToken = 'private-reset-token';
  customer.resetPasswordExpires = new Date(Date.now() + 60_000);
  Customer.findById = async id => {
    assert.equal(String(id), customerId);
    return customer;
  };

  const response = createResponse();
  await getProfile({ user: { _id: customerId } }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.email, 'demo@example.com');
  const serializedProfile = JSON.stringify(response.body);
  assert.doesNotMatch(serializedProfile, /stored-password-hash|private-reset-token|resetPasswordToken|resetPasswordExpires/);
});


test('updateCustomer rejects malformed customer ids before querying MongoDB', async t => {
  const originalUpdate = Customer.findByIdAndUpdate;
  restore(t, [[Customer, 'findByIdAndUpdate', originalUpdate]]);
  let calls = 0;
  Customer.findByIdAndUpdate = async () => { calls += 1; return null; };

  const response = createResponse();
  await updateCustomer({
    params: { id: 'not-a-valid-object-id' },
    user: { _id: customerId, role: 'user' },
    body: { firstName: 'Someone' }
  }, response);

  assert.equal(response.statusCode, 400);
  assert.equal(calls, 0);
});

test('updateCustomer rejects invalid editable values before querying MongoDB', async t => {
  const originalUpdate = Customer.findByIdAndUpdate;
  restore(t, [[Customer, 'findByIdAndUpdate', originalUpdate]]);
  let calls = 0;
  Customer.findByIdAndUpdate = async () => { calls += 1; return null; };

  const response = createResponse();
  await updateCustomer({
    params: { id: customerId },
    user: { _id: customerId, role: 'user' },
    body: { email: 'not-an-email' }
  }, response);

  assert.equal(response.statusCode, 400);
  assert.match(response.body.message, /perfil inválidos/i);
  assert.equal(calls, 0);
});

test('updateCustomer converts a duplicate-key database error into a safe conflict response', async t => {
  const originalUpdate = Customer.findByIdAndUpdate;
  restore(t, [[Customer, 'findByIdAndUpdate', originalUpdate]]);
  Customer.findByIdAndUpdate = async () => {
    throw Object.assign(new Error('duplicate key: private database detail'), { code: 11000 });
  };

  const response = createResponse();
  await updateCustomer({
    params: { id: customerId },
    user: { _id: customerId, role: 'user' },
    body: { email: 'existing@example.com' }
  }, response);

  assert.equal(response.statusCode, 409);
  assert.match(response.body.message, /correo o número de identificación ya está registrado/i);
  assert.doesNotMatch(JSON.stringify(response.body), /private database detail/);
});

test('getProfile returns 404 when the authenticated customer record no longer exists', async t => {
  const originalFindById = Customer.findById;
  restore(t, [[Customer, 'findById', originalFindById]]);
  Customer.findById = async () => null;

  const response = createResponse();
  await getProfile({ user: { _id: customerId } }, response);

  assert.equal(response.statusCode, 404);
  assert.match(response.body.message, /no encontrado/i);
});
