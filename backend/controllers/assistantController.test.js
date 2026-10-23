const test = require('node:test');
const assert = require('node:assert/strict');
const { extractOutputText } = require('./assistantController');

test('extracts plain text from a completed Responses API message', () => {
  assert.equal(extractOutputText({
    output: [{ type: 'message', content: [{ type: 'output_text', text: '  Una recomendación útil.  ' }] }]
  }), 'Una recomendación útil.');
});

test('does not treat refusal or other response items as product advice', () => {
  assert.equal(extractOutputText({
    output: [{ type: 'message', content: [{ type: 'refusal', refusal: 'No puedo ayudar con eso.' }] }]
  }), '');
  assert.equal(extractOutputText({ output: [{ type: 'reasoning', summary: 'private' }] }), '');
});
