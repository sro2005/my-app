const test = require('node:test');
const assert = require('node:assert/strict');
const { LoginLog, registerOrUpdateLoginLog } = require('./LoginLog');

const captureConsole = t => {
  const originalLog = console.log;
  const originalError = console.error;
  const calls = [];
  console.log = (...args) => calls.push(['log', ...args]);
  console.error = (...args) => calls.push(['error', ...args]);
  t.after(() => {
    console.log = originalLog;
    console.error = originalError;
  });
  return calls;
};

test('does not log email or identifiers when updating an existing login record', async t => {
  const originalFindOne = LoginLog.findOne;
  const existing = {
    userId: 'sensitive-user-id',
    email: 'private-customer@example.test',
    loginTime: new Date('2026-01-01T00:00:00.000Z'),
    async save() { return this; }
  };
  const calls = captureConsole(t);
  LoginLog.findOne = async () => existing;
  t.after(() => { LoginLog.findOne = originalFindOne; });

  await registerOrUpdateLoginLog({ _id: existing.userId, email: existing.email });

  assert.deepEqual(calls, []);
});

test('does not log a newly created login record', async t => {
  const originalFindOne = LoginLog.findOne;
  const originalSave = LoginLog.prototype.save;
  const calls = captureConsole(t);
  LoginLog.findOne = async () => null;
  LoginLog.prototype.save = async function save() { return this; };
  t.after(() => {
    LoginLog.findOne = originalFindOne;
    LoginLog.prototype.save = originalSave;
  });

  await registerOrUpdateLoginLog({
    _id: 'sensitive-user-id',
    email: 'private-customer@example.test'
  });

  assert.deepEqual(calls, []);
});

test('does not include driver error details in operational logs', async t => {
  const originalFindOne = LoginLog.findOne;
  const calls = captureConsole(t);
  LoginLog.findOne = async () => {
    throw new Error('private-customer@example.test and sensitive-user-id');
  };
  t.after(() => { LoginLog.findOne = originalFindOne; });

  await registerOrUpdateLoginLog({
    _id: 'sensitive-user-id',
    email: 'private-customer@example.test'
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], 'error');
  assert.equal(calls[0][1], 'No fue posible guardar la actividad de inicio de sesión.');
  assert.doesNotMatch(JSON.stringify(calls), /private-customer@example\.test|sensitive-user-id/);
});
