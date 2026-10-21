const test = require('node:test');
const assert = require('node:assert/strict');
const {
  secureEquals,
  calculateIntegritySignature,
  calculateEventChecksum
} = require('./wompiSecurity');

test('creates the expected Wompi integrity signature for a fixed checkout', () => {
  assert.equal(
    calculateIntegritySignature('EVH-123-abc', 259900, 'COP', 'test_integrity'),
    'f8d933a4773e382741b2e304f6873078464df53352d83e398fb517c8618a73ff'
  );
});

test('validates event checksum properties in the declared order', () => {
  const event = {
    data: { transaction: { id: 'tx-123', status: 'APPROVED', amount_in_cents: 259900 } },
    signature: { properties: ['transaction.id', 'transaction.status', 'transaction.amount_in_cents'] },
    timestamp: 1700000000
  };
  assert.equal(
    calculateEventChecksum(event, 'test_events'),
    'a3a0edb51335bfdd706baa38733d86445f9fa7a5f56046b821317b9c244f16f1'
  );
});

test('rejects missing signed properties', () => {
  assert.throws(() => calculateEventChecksum({
    data: { transaction: { id: 'tx-123' } },
    signature: { properties: ['transaction.status'] },
    timestamp: 1700000000
  }, 'test_events'), /Propiedad de firma faltante/);
});

test('compares equal-length checksums safely and rejects mismatches', () => {
  assert.equal(secureEquals('abcdef', 'abcdef'), true);
  assert.equal(secureEquals('abcdef', 'abcdeg'), false);
  assert.equal(secureEquals('abcdef', 'abc'), false);
  assert.equal(secureEquals(undefined, 'abc'), false);
});
