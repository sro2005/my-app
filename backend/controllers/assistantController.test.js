const test = require('node:test');
const assert = require('node:assert/strict');
const { getStatus, chat } = require('./assistantController');

const responseMock = () => ({
  headers: {},
  statusCode: 200,
  body: null,
  set(name, value) { this.headers[name] = value; return this; },
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; }
});

test('assistant status stays local even if an OpenAI key exists in the environment', () => {
  const previousKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = 'not-a-real-key';
  try {
    const res = responseMock();
    getStatus({}, res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { enabled: false, mode: 'local' });
    assert.equal(res.headers['Cache-Control'], 'no-store');
  } finally {
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;
  }
});

test('chat endpoint is disabled so requests can never call a paid AI provider', () => {
  const previousFetch = global.fetch;
  let fetchCalled = false;
  global.fetch = async () => { fetchCalled = true; throw new Error('Network call must not happen'); };
  try {
    const res = responseMock();
    chat({ body: { messages: [] } }, res);
    assert.equal(res.statusCode, 503);
    assert.match(res.body.message, /modo local/i);
    assert.equal(res.headers['Cache-Control'], 'no-store');
    assert.equal(fetchCalled, false);
  } finally {
    if (previousFetch === undefined) delete global.fetch;
    else global.fetch = previousFetch;
  }
});
