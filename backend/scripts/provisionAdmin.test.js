const test = require('node:test');
const assert = require('node:assert/strict');
const {
  getProvisioningConfig,
  provisionAdmin,
  ProvisioningError,
  CONFIRMATION_PHRASE
} = require('./provisionAdmin');

const validEnv = overrides => ({
  NODE_ENV: 'production',
  ALLOW_ADMIN_PROVISIONING: 'true',
  ADMIN_BOOTSTRAP_CONFIRM: CONFIRMATION_PHRASE,
  MONGO_URI: 'mongodb://demo.invalid/electrovibehome_test',
  ADMIN_BOOTSTRAP_EMAIL: ' ADMIN@EXAMPLE.TEST ',
  ADMIN_BOOTSTRAP_PASSWORD: 'Example-Strong-Password-902!',
  ...overrides
});

test('provisioning config normalizes email and requires an explicit production confirmation', () => {
  const config = getProvisioningConfig(validEnv());
  assert.equal(config.email, 'admin@example.test');
  assert.equal(config.mongoUri, 'mongodb://demo.invalid/electrovibehome_test');
  assert.equal(config.password, 'Example-Strong-Password-902!');
});

test('provisioning refuses to run without the confirmation phrase', () => {
  assert.throws(() => getProvisioningConfig(validEnv({ ADMIN_BOOTSTRAP_CONFIRM: '' })), ProvisioningError);
});

test('production provisioning requires the temporary allow flag', () => {
  assert.throws(() => getProvisioningConfig(validEnv({ ALLOW_ADMIN_PROVISIONING: 'false' })), /ALLOW_ADMIN_PROVISIONING/);
});

test('provisioning rejects weak passwords and invalid emails', () => {
  assert.throws(() => getProvisioningConfig(validEnv({ ADMIN_BOOTSTRAP_PASSWORD: 'short' })), /16 caracteres/);
  assert.throws(() => getProvisioningConfig(validEnv({ ADMIN_BOOTSTRAP_EMAIL: 'not-an-email' })), /correo válida/);
});

test('provisions a new administrator using a password hash and never returns the password', async () => {
  const saved = [];
  const calls = [];
  class FakeCustomer {
    constructor(fields) { Object.assign(this, fields); this._id = 'admin-id-1'; }
    async save() { saved.push(this); }
    static findOne(query) {
      calls.push(query);
      return { select: async () => null };
    }
  }
  const database = {
    connect: async (...args) => { calls.push({ connect: args[0] }); },
    disconnect: async () => { calls.push({ disconnect: true }); }
  };
  const result = await provisionAdmin({
    env: validEnv(),
    database,
    CustomerModel: FakeCustomer,
    hashPassword: async (password, rounds) => {
      assert.equal(password, 'Example-Strong-Password-902!');
      assert.equal(rounds, 12);
      return 'bcrypt-hash-placeholder';
    }
  });

  assert.equal(result.id, 'admin-id-1');
  assert.equal(result.email, 'admin@example.test');
  assert.equal(Object.hasOwn(result, 'password'), false);
  assert.equal(saved.length, 1);
  assert.equal(saved[0].role, 'admin');
  assert.equal(saved[0].password, 'bcrypt-hash-placeholder');
  assert.equal(saved[0].firstName, undefined);
  assert.equal(calls.some(call => call.disconnect), true);
});

test('refuses to change an existing account into an administrator', async () => {
  let saved = 0;
  class FakeCustomer {
    constructor() { }
    async save() { saved += 1; }
    static findOne() {
      return { select: async () => ({ _id: 'existing-id', role: 'user' }) };
    }
  }
  const database = { connect: async () => {}, disconnect: async () => {} };
  await assert.rejects(
    provisionAdmin({ env: validEnv(), database, CustomerModel: FakeCustomer, hashPassword: async () => 'hash' }),
    /no cambia roles/
  );
  assert.equal(saved, 0);
});
