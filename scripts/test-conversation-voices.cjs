const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const compiled = ts.transpileModule(
  fs.readFileSync(
    require('node:path').join(__dirname, '../src/lib/english/voices.ts'),
    'utf8'
  ),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } }
).outputText;
const target = { exports: {} };
new Function('exports', 'module', compiled)(target.exports, target);
const { conversationLine, chooseConversationVoice, voiceKey } = target.exports;
const voice = (name) => ({
  name,
  lang: 'en-GB',
  voiceURI: name,
  default: false,
});
const male = voice('Google UK English Male');
const female = voice('Google UK English Female');
const saved = voice('Daniel');
test('speaker labels select the corresponding Google voice, including replayed B lines', () => {
  const voices = [saved, female, male];
  for (const [text, expected] of [
    ['A: Hello.', male],
    ['B: Hi!', female],
    ['b: Please repeat.', female],
  ]) {
    const line = conversationLine(text);
    assert.equal(
      chooseConversationVoice(voices, line.speaker, voiceKey(saved)),
      expected
    );
    assert.ok(!/^[ab]:/i.test(line.text));
  }
  assert.equal(
    conversationLine('A: Read the word: hello.').text,
    'Read the word: hello.'
  );
});
test('unavailable role voices fall back to the selected voice; unlabelled lines keep it', () => {
  assert.equal(
    chooseConversationVoice([male, saved], 'B', voiceKey(saved)),
    saved
  );
  assert.equal(
    chooseConversationVoice([male, female, saved], undefined, voiceKey(saved)),
    saved
  );
  assert.equal(conversationLine('Hello there.').speaker, undefined);
  assert.equal(chooseConversationVoice([], 'B', ''), undefined);
});
