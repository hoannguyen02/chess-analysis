const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function load(path, imports = require) {
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX }
  }).outputText)(imports, mod, mod.exports);
  return mod.exports;
}
const lessons = load('src/lib/english/lessons.ts');
const pronunciation = load('src/lib/english/pronunciation.ts');
function harness(target) {
  const state = []; let cursor = 0, saved = [], lookups = [], spoken = [], accept = true;
  let lesson = structuredClone(lessons.starterLessons[0]);
  const initial = structuredClone(lesson);
  global.window = { speechSynthesis: { cancel() {} } };
  const component = load('src/components/english/QuickLessonEdit.tsx', n => {
    if (n === 'react') return {
      useEffect() {},
      useState(initial) { const i = cursor++; if (!(i in state)) state[i] = initial; return [state[i], v => state[i] = typeof v === 'function' ? v(state[i]) : v]; },
      useRef(initial) { const i = cursor++; if (!(i in state)) state[i] = { current: initial }; return state[i]; }
    };
    if (n === 'react/jsx-runtime') return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
    if (n.endsWith('/lessons')) return lessons;
    if (n.endsWith('/pronunciation')) return pronunciation;
    if (n.endsWith('/enrich-pronunciations')) return { enrichPronunciations: async items => { lookups.push(items); return { lessons: items, missing: 1 }; } };
    if (n === './LearnerLanguage') return { useLearnerText: () => x => x };
    if (n === './VoiceSettings') return { useReadText: () => ({ read: x => spoken.push(x), stop() {}, playing: false }) };
    return { default: n };
  }).default;
  const render = () => { cursor = 0; return component({ lesson, target: typeof target === 'function' ? target(lesson) : target, onSave: next => { if (!accept) return false; saved.push(next); lesson = next; return true; } }); };
  const all = (node, type) => { if (!node) return []; if (Array.isArray(node)) return node.flatMap(n => all(n, type)); return [...(node.type === type ? [node] : []), ...all(node.props?.children, type)]; };
  const text = n => typeof n === 'string' ? n : Array.isArray(n) ? n.map(text).join('') : n?.props ? text(n.props.children) : '';
  const click = label => { const button = all(render(), 'button').find(n => text(n).includes(label)); assert.ok(button, label); button.props.onClick(); };
  const edit = (label, value) => { const field = all(render(), 'label').find(n => text(n).startsWith(label)); assert.ok(field, label); all(field, 'textarea')[0].props.onChange({ target: { value } }); };
  return { render, all, click, edit, saved, lookups, spoken, initial, failSave: () => accept = false };
}
const flush = () => new Promise(resolve => setImmediate(resolve));
test('word edit previews, refreshes changed IPA, saves and undoes without changing IDs', async () => {
  const h = harness({ word: 0 }); h.click('Quick edit'); h.edit('Word or phrase', 'where'); h.edit('Example', 'Where do you live?');
  h.click('Play model'); assert.equal(h.spoken[0], 'Where do you live?');
  h.click('Save & continue'); await flush();
  assert.equal(h.lookups.length, 1); assert.equal(h.saved[0].vocabulary[0].word, 'where'); assert.equal(h.saved[0].id, h.initial.id);
  h.click('Copy updated share link');
  assert.deepEqual(h.all(h.render(), './ShareLesson')[0].props.lesson, h.saved[0]);
  h.click('Cancel');
  h.click('Undo'); assert.deepEqual(h.saved[1], h.initial);
});
test('cancel discards draft and accepted-answer edits invalidate old fingerprints', async () => {
  const h = harness(l => ({ activity: l.activities[0].id }));
  h.click('Quick edit'); h.edit('Accepted answers', 'A different answer.'); h.click('Cancel'); assert.equal(h.saved.length, 0);
  h.click('Quick edit'); h.edit('Accepted answers', 'A different answer.'); h.edit('Model text', 'A different answer.'); h.click('Save & continue'); await flush();
  assert.equal(h.saved[0].activities[0].id, h.initial.activities[0].id);
  assert.notEqual(lessons.fingerprint(h.saved[0].activities[0]), lessons.fingerprint(h.initial.activities[0]));
  assert.equal(h.lookups.length, 0);
});
test('failed storage keeps the draft open and does not offer undo', async () => {
  const h = harness({ word: 0 }); h.failSave(); h.click('Quick edit'); h.edit('Meaning', 'New meaning'); h.click('Save & continue'); await flush();
  assert.equal(h.saved.length, 0); assert.ok(h.all(h.render(), 'textarea').length); assert.ok(h.all(h.render(), 'p').some(n => n.props.role === 'alert'));
});
test('rejects unsafe manual pronunciation sources', async () => {
  const h = harness({ word: 0 }); h.click('Quick edit'); h.edit('UK IPA', '/test/'); h.edit('UK source URL', 'javascript:alert(1)'); h.click('Save & continue'); await flush();
  assert.equal(h.saved.length, 0); assert.ok(h.all(h.render(), 'p').some(n => n.props.role === 'alert'));
});

test('each note section edits only its own fields and can be undone', async () => {
  for (const note of ['beforeYouStart', 'quickCheck', 'grammar', 'phrases', 'pronunciation', 'mistakes', 'dialogue']) {
    const h = harness({ note });
    h.click('Quick edit');
    const fields = h.all(h.render(), 'textarea');
    assert.equal(fields.length, note === 'pronunciation' ? 2 : 1);
    h.edit(lessons.NOTE_LABELS[note], 'Updated section content.');
    if (note === 'pronunciation') h.edit('Pronunciation model (English)', 'Listen. Repeat.');
    h.click('Save & continue'); await flush();
    const changed = h.saved[0];
    assert.equal(changed.notes[note], 'Updated section content.');
    if (note === 'pronunciation') assert.equal(changed.notes.pronunciationModel, 'Listen. Repeat.');
    assert.deepEqual(changed.activities, h.initial.activities);
    assert.deepEqual(changed.vocabulary, h.initial.vocabulary);
    assert.equal(h.lookups.length, 0);
    h.click('Undo');
    assert.equal(h.saved[1].notes[note], h.initial.notes?.[note] || '');
  }
});
