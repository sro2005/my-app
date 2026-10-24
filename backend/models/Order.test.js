const test = require('node:test');
const assert = require('node:assert/strict');
const Order = require('./Order');

test('order idempotency keys are unique, sparse, immutable, and excluded from JSON queries', () => {
  const options = Order.schema.path('idempotencyKey').options;
  assert.equal(options.unique, true);
  assert.equal(options.sparse, true);
  assert.equal(options.immutable, true);
  assert.equal(options.select, false);
});

test('order idempotency keys accept a sufficiently long safe key format', () => {
  const validator = Order.schema.path('idempotencyKey');
  assert.equal(validator.validateSync('request-key-1234567890'), undefined);
  assert.ok(validator.validateSync('invalid key with spaces'));
});
