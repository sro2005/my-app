const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcrypt');
const Customer = require('../models/Customer');
const loginLogModule = require('../models/LoginLog');
const tokenUtils = require('../utils/tokenUtils');

// Replace external side effects before loading the controller; these functions
// are imported by value in authController.js.
const originalLoginLogger = loginLogModule.registerOrUpdateLoginLog;
const originalGenerateToken = tokenUtils.generateToken;
loginLogModule.registerOrUpdateLoginLog = async () => {};
tokenUtils.generateToken = () => 'unit-test-token';
delete require.cache[require.resolve('./authController')];
const { registerCustomer, loginCustomer } = require('./authController');
loginLogModule.registerOrUpdateLoginLog = originalLoginLogger;
tokenUtils.generateToken = originalGenerateToken;

const createResponse = () => ({
  statusCode: null,
  body: null,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; }
});

const validRegistration = overrides => ({
  firstName: 'Demo',
  lastName: 'Customer',
  email: 'DEMO@example.test',
  identificationNumber: '1.234.567',
  birthDate: '1990-01-01',
  phone: '3001234567',
  preferences: ['Televisores'],
  password: 'StrongPass1!',
  ...overrides
});

const restore = (t, values) => t.after(() => {
  for (const [target, key, value] of values) target[key] = value;
});

test('registerCustomer forces the public registration role to user and stores a normalized email and password hash', async t => {
  const originalFindOne = Customer.findOne;
  const originalSave = Customer.prototype.save;
  const originalHash = bcrypt.hash;
  restore(t, [
    [Customer, 'findOne', originalFindOne],
    [Customer.prototype, 'save', originalSave],
    [bcrypt, 'hash', originalHash]
  ]);

  let lookup;
  let savedCustomer;
  Customer.findOne = async filter => { lookup = filter; return null; };
  Customer.prototype.save = async function () { savedCustomer = this; return this; };
  bcrypt.hash = async (password, rounds) => `hashed:${password}:${rounds}`;

  const response = createResponse();
  await registerCustomer({ body: validRegistration({ role: 'admin' }) }, response);

  assert.equal(response.statusCode, 201);
  assert.equal(lookup.email, 'demo@example.test');
  assert.equal(savedCustomer.role, 'user');
  assert.equal(savedCustomer.email, 'demo@example.test');
  assert.equal(savedCustomer.password, 'hashed:StrongPass1!:12');
  assert.equal(savedCustomer.preferences[0], 'Televisores');
});

test('registerCustomer rejects underage customers before querying the database', async t => {
  const originalFindOne = Customer.findOne;
  restore(t, [[Customer, 'findOne', originalFindOne]]);
  let queries = 0;
  Customer.findOne = async () => { queries += 1; return null; };

  const response = createResponse();
  await registerCustomer({ body: validRegistration({ birthDate: '2012-01-01' }) }, response);

  assert.equal(response.statusCode, 400);
  assert.match(response.body.message, /al menos 18 años/i);
  assert.equal(queries, 0);
});

test('registerCustomer returns the same generic conflict for an already registered email', async t => {
  const originalFindOne = Customer.findOne;
  const originalSave = Customer.prototype.save;
  const originalHash = bcrypt.hash;
  restore(t, [
    [Customer, 'findOne', originalFindOne],
    [Customer.prototype, 'save', originalSave],
    [bcrypt, 'hash', originalHash]
  ]);
  let saves = 0;
  Customer.findOne = async () => ({ _id: 'existing-customer' });
  Customer.prototype.save = async function () { saves += 1; };
  bcrypt.hash = async password => `hashed:${password}`;

  const response = createResponse();
  await registerCustomer({ body: validRegistration() }, response);

  assert.equal(response.statusCode, 409);
  assert.match(response.body.message, /no se pudo completar el registro/i);
  assert.equal(saves, 0);
});

test('loginCustomer returns a generic 401 for invalid credentials', async t => {
  const originalFindOne = Customer.findOne;
  const originalCompare = bcrypt.compare;
  restore(t, [
    [Customer, 'findOne', originalFindOne],
    [bcrypt, 'compare', originalCompare]
  ]);
  Customer.findOne = async () => ({ password: 'stored-hash' });
  bcrypt.compare = async () => false;

  const response = createResponse();
  await loginCustomer({ body: { email: ' UNKNOWN@example.test ', password: 'WrongPass1!' } }, response);

  assert.equal(response.statusCode, 401);
  assert.equal(response.body.message, 'Correo o contraseña incorrectos.');
});

test('loginCustomer returns a token without serializing password or password-reset fields', async t => {
  const originalFindOne = Customer.findOne;
  const originalSave = Customer.prototype.save;
  const originalCompare = bcrypt.compare;
  restore(t, [
    [Customer, 'findOne', originalFindOne],
    [Customer.prototype, 'save', originalSave],
    [bcrypt, 'compare', originalCompare]
  ]);

  const customer = new Customer({
    firstName: 'Demo',
    lastName: 'Customer',
    email: 'demo@example.test',
    identificationNumber: '1.234.567',
    birthDate: new Date('1990-01-01T12:00:00.000Z'),
    phone: '+57 300 123 4567',
    preferences: ['Televisores'],
    password: 'hashed-password-value',
    role: 'user'
  });
  customer.resetPasswordToken = 'private-reset-token';
  customer.resetPasswordExpires = new Date(Date.now() + 60_000);
  Customer.findOne = async () => customer;
  Customer.prototype.save = async function () { return this; };
  bcrypt.compare = async (password, hash) => password === 'StrongPass1!' && hash === 'hashed-password-value';

  const response = createResponse();
  await loginCustomer({ body: { email: ' DEMO@EXAMPLE.TEST ', password: 'StrongPass1!' } }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.token, 'unit-test-token');
  assert.equal(response.body.user.role, 'user');
  const serializedResponse = JSON.stringify(response.body);
  assert.doesNotMatch(serializedResponse, /hashed-password-value|private-reset-token|resetPasswordToken|resetPasswordExpires/);
});
