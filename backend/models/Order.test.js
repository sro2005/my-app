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
  const validOrder = new Order({ idempotencyKey: 'request-key-1234567890' });
  const invalidOrder = new Order({ idempotencyKey: 'invalid key with spaces' });

  assert.equal(validOrder.validateSync()?.errors?.idempotencyKey, undefined);
  assert.ok(invalidOrder.validateSync()?.errors?.idempotencyKey);
});
