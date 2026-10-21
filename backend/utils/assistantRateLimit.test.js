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

test('assistant rate limit counts requests by the trusted Render client IP and resets', () => {
  let currentTime = 1000;
  const middleware = createAssistantRateLimiter({ windowMs: 1000, maxRequests: 2, now: () => currentTime });
  const request = { ip: 'proxy', get: name => name === 'cf-connecting-ip' ? '198.51.100.7' : undefined };
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

test('assistant rate limit gives separate buckets to different client IPs', () => {
  const middleware = createAssistantRateLimiter({ maxRequests: 1 });
  const makeRequest = address => ({ ip: 'proxy', get: name => name === 'cf-connecting-ip' ? address : undefined });
  let nextCalls = 0;

  middleware(makeRequest('198.51.100.7'), createResponse(), () => { nextCalls += 1; });
  middleware(makeRequest('198.51.100.8'), createResponse(), () => { nextCalls += 1; });

  assert.equal(nextCalls, 2);
});
