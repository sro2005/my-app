const test = require('node:test');
const assert = require('node:assert/strict');
const { createRequestRateLimiter, getClientAddress } = require('./requestRateLimit');

const createResponse = () => ({
  headers: {},
  statusCode: null,
  body: null,
  set(name, value) { this.headers[name] = value; return this; },
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; }
});

const request = (address, email = 'demo@example.com') => ({
  ip: 'proxy',
  body: { email },
  get: name => name === 'cf-connecting-ip' ? address : undefined
});

test('uses the trusted edge address and falls back to Express IP', () => {
  assert.equal(getClientAddress(request('198.51.100.10')), '198.51.100.10');
  assert.equal(getClientAddress({ ip: '127.0.0.1', get: () => undefined }), '127.0.0.1');
});

test('blocks requests beyond the limit and sets Retry-After', () => {
  let currentTime = 5000;
  const limiter = createRequestRateLimiter({
    windowMs: 2000, maxRequests: 2, now: () => currentTime,
    message: 'Límite de prueba.'
  });
  const req = request('198.51.100.10');
  let calls = 0;
  limiter(req, createResponse(), () => { calls += 1; });
  limiter(req, createResponse(), () => { calls += 1; });

  const blocked = createResponse();
  limiter(req, blocked, () => { calls += 1; });
  assert.equal(calls, 2);
  assert.equal(blocked.statusCode, 429);
  assert.equal(blocked.body.message, 'Límite de prueba.');
  assert.equal(blocked.headers['Retry-After'], '2');

  currentTime = 7000;
  limiter(req, createResponse(), () => { calls += 1; });
  assert.equal(calls, 3);
});

test('keeps independent request buckets for different clients', () => {
  const limiter = createRequestRateLimiter({ maxRequests: 1 });
  let calls = 0;
  limiter(request('198.51.100.10'), createResponse(), () => { calls += 1; });
  limiter(request('198.51.100.11'), createResponse(), () => { calls += 1; });
  assert.equal(calls, 2);
});

test('supports a separate account-aware key without exposing the email in responses', () => {
  const limiter = createRequestRateLimiter({
    maxRequests: 1,
    keyGenerator: req => `account:${getClientAddress(req)}:${String(req.body.email).toLowerCase()}`
  });
  let calls = 0;
  limiter(request('198.51.100.10', 'demo@example.com'), createResponse(), () => { calls += 1; });
  const blocked = createResponse();
  limiter(request('198.51.100.10', 'DEMO@example.com'), blocked, () => { calls += 1; });
  assert.equal(calls, 1);
  assert.equal(blocked.statusCode, 429);
  assert.equal(JSON.stringify(blocked.body).includes('demo@example.com'), false);
});
