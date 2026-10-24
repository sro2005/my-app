const test = require('node:test');
const assert = require('node:assert/strict');
const { createAssistantRateLimiter } = require('./assistantRateLimit');

const createResponse = () => ({
  headers: {},
  statusCode: null,
  body: null,
  set(name, value) { this.headers[name] = value; return this; },
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; }
});

const makeRequest = (ip, spoofedHeader = '203.0.113.99') => ({
  ip,
  get: name => name === 'cf-connecting-ip' ? spoofedHeader : undefined
});

test('assistant rate limit counts requests by Express-resolved client IP and resets', () => {
  let currentTime = 1000;
  const middleware = createAssistantRateLimiter({ windowMs: 1000, maxRequests: 2, now: () => currentTime });
  const request = makeRequest('198.51.100.7');
  let nextCalls = 0;

  middleware(request, createResponse(), () => { nextCalls += 1; });
  middleware(request, createResponse(), () => { nextCalls += 1; });
  const blockedResponse = createResponse();
  middleware(request, blockedResponse, () => { nextCalls += 1; });

  assert.equal(nextCalls, 2);
  assert.equal(blockedResponse.statusCode, 429);
  assert.equal(blockedResponse.headers['Retry-After'], '1');

  currentTime = 2000;
  middleware(request, createResponse(), () => { nextCalls += 1; });
  assert.equal(nextCalls, 3);
});

test('assistant limiter ignores a spoofed forwarding header', () => {
  const middleware = createAssistantRateLimiter({ maxRequests: 1 });
  let nextCalls = 0;

  middleware(makeRequest('198.51.100.7', '192.0.2.44'), createResponse(), () => { nextCalls += 1; });
  const blocked = createResponse();
  middleware(makeRequest('198.51.100.7', '198.51.100.8'), blocked, () => { nextCalls += 1; });

  assert.equal(nextCalls, 1);
  assert.equal(blocked.statusCode, 429);
});

test('assistant limiter gives separate buckets to different resolved client IPs', () => {
  const middleware = createAssistantRateLimiter({ maxRequests: 1 });
  let nextCalls = 0;

  middleware(makeRequest('198.51.100.7'), createResponse(), () => { nextCalls += 1; });
  middleware(makeRequest('198.51.100.8'), createResponse(), () => { nextCalls += 1; });

  assert.equal(nextCalls, 2);
});
