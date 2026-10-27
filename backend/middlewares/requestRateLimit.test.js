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

const request = (address, email = 'demo@example.com', spoofedEdgeAddress = '203.0.113.99') => ({
  ip: address,
  body: { email },
  get: name => name === 'cf-connecting-ip' ? spoofedEdgeAddress : undefined
});

test('uses Express-resolved client IP and ignores an arbitrary Cloudflare header', () => {
  assert.equal(getClientAddress(request('198.51.100.10', 'demo@example.com', '192.0.2.44')), '198.51.100.10');
  assert.equal(getClientAddress({ ip: '127.0.0.1', get: () => '192.0.2.44' }), '127.0.0.1');
  assert.equal(getClientAddress({ socket: { remoteAddress: '127.0.0.2' } }), '127.0.0.2');
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


test('throttles public registration attempts by client IP', () => {
  let nextCalls = 0;
  const req = request('192.0.2.150');

  const limiter = createRequestRateLimiter({
    maxRequests: 10,
    message: 'Demasiados intentos de registro desde esta conexión. Intenta más tarde.'
  });
  for (let attempt = 0; attempt < 10; attempt += 1) {
    limiter(req, createResponse(), () => { nextCalls += 1; });
  }

  const blocked = createResponse();
  limiter(req, blocked, () => { nextCalls += 1; });

  assert.equal(nextCalls, 10);
  assert.equal(blocked.statusCode, 429);
  assert.match(blocked.body.message, /registro/i);
  assert.match(blocked.headers['Retry-After'], /^\d+$/);
});
