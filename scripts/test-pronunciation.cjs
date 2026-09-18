const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const mod = { exports: {} };
new Function(
  'exports',
  'module',
  ts.transpileModule(
    fs.readFileSync('src/lib/english/pronunciation.ts', 'utf8'),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    }
  ).outputText
)(mod.exports, mod);
const { dictionaryWord, selectDictionaryPronunciation: select } = mod.exports;
const entry = (
  word,
  text,
  audio = 'https://api.dictionaryapi.dev/media/pronunciations/en/hello-uk.mp3'
) => ({ word, phonetics: [{ text, audio }] });
test('normalizes words but never synthesizes phrases, sentences or URLs', () => {
  assert.equal(dictionaryWord(' Hello '), 'hello');
  for (const input of [
    'try again',
    'Please listen.',
    'https://example.com',
    '../hello',
    '',
    'a'.repeat(81),
  ])
    assert.equal(dictionaryWord(input), null);
});
test('returns explicitly UK sourced IPA and canonical source', () => {
  assert.deepEqual(select('hello', [entry('hello', '/həˈləʊ/')]), {
    status: 'found',
    ipa: '/həˈləʊ/',
    accent: 'UK',
    source: 'https://api.dictionaryapi.dev/api/v2/entries/en/hello',
  });
  assert.equal(
    select('hello', [
      entry(
        'hello',
        'həˈləʊ',
        'https://ssl.gstatic.com/dictionary/static/sounds/hello--_gb_1.mp3'
      ),
    ]).status,
    'found'
  );
});
test('does not mislabel unknown accents, US audio, mismatches or missing records', () => {
  for (const data of [
    null,
    {},
    [],
    [entry('other', '/x/')],
    [entry('hello', '/x/', '')],
    [entry('hello', '/x/', 'https://example.com/hello-us.mp3')],
    [entry('hello', '/x/', 'http://example.com/hello-uk.mp3')],
  ])
    assert.equal(select('hello', data).status, 'unavailable');
});
test('withholds conflicting UK pronunciations and incomplete homographs', () => {
  assert.equal(
    select('read', [entry('read', '/riːd/'), entry('read', '/rɛd/')]).status,
    'ambiguous'
  );
  assert.equal(
    select('read', [entry('read', '/riːd/'), { word: 'read', phonetics: [] }])
      .status,
    'unavailable'
  );
  assert.equal(
    select('hello', [entry('hello', '/həˈləʊ/'), entry('hello', '/həˈləʊ/')])
      .status,
    'found'
  );
});

test('reviewed starter pronunciations work without a network and retain sources', () => {
  const { reviewedPronunciation } = mod.exports;
  assert.deepEqual(reviewedPronunciation(' Listen '), {
    status: 'found',
    accent: 'UK',
    ipa: '/ˈlɪs.ən/',
    source: 'https://dictionary.cambridge.org/pronunciation/english/listen',
  });
  for (const word of ['hello', 'repeat'])
    assert.equal(reviewedPronunciation(word).status, 'found');
  for (const word of ['read', 'try again', 'constructor', 'unknown'])
    assert.equal(reviewedPronunciation(word), null);
});

test('teaching word renders sourced listen IPA before any request or effect', () => {
  const component = { exports: {} };
  const code = ts.transpileModule(
    fs.readFileSync('src/components/english/WordPronunciation.tsx', 'utf8'),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    }
  ).outputText;
  const imports = (name) => {
    if (name === '@/lib/english/pronunciation') return mod.exports;
    if (name === './LearnerLanguage')
      return { useLearnerText: () => (text) => text };
    if (name.endsWith('.module.css')) return {};
    return require(name);
  };
  new Function('exports', 'module', 'require', code)(
    component.exports,
    component,
    imports
  );
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const html = renderToStaticMarkup(
    React.createElement(component.exports.default, {
      word: 'listen',
      pronunciations: mod.exports.reviewedPronunciations('listen'),
    })
  );
  assert.match(html, /ˈlɪs.ən/);
  assert.match(
    html,
    /https:\/\/dictionary.cambridge.org\/pronunciation\/english\/listen/
  );
  assert.doesNotMatch(html, /Loading pronunciation/);
  const phrase = renderToStaticMarkup(
    React.createElement(component.exports.default, { word: 'try again' })
  );
  assert.doesNotMatch(phrase, /<a|Loading pronunciation/);
});

test('UK and US are independent and neither is relabelled as the other', () => {
  const { selectDictionaryPronunciations: both } = mod.exports;
  const uk = entry('hello', '/heˈləʊ/');
  const us = entry(
    'hello',
    '/heˈloʊ/',
    'https://api.dictionaryapi.dev/hello-us.mp3'
  );
  const combined = [
    { word: 'hello', phonetics: [...uk.phonetics, ...us.phonetics] },
  ];
  assert.equal(both('hello', combined).UK.ipa, '/heˈləʊ/');
  assert.equal(both('hello', combined).US.ipa, '/heˈloʊ/');
  assert.equal(both('hello', [us]).UK, undefined);
  assert.equal(both('hello', [uk]).US, undefined);
});

function loadModule(file, imports = require) {
  const result = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    fileName: file,
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  new Function('exports', 'module', 'require', code)(
    result.exports,
    result,
    imports
  );
  return result.exports;
}
test('question words receive both reviewed accents during offline update', async () => {
  const { enrichPronunciations } = loadModule(
    'src/lib/english/enrich-pronunciations.ts',
    (name) => (name === './pronunciation' ? mod.exports : require(name))
  );
  const originalFetch = global.fetch;
  let calls = 0;
  global.fetch = async () => { calls++; throw new Error('offline'); };
  try {
    const result = await enrichPronunciations([{
      vocabulary: ['what', 'where', 'when', 'why'].map(word => ({ word, example: '' })),
    }]);
    assert.equal(calls, 0);
    assert.equal(result.found, 4);
    const expected = [['/wɒt/', '/wɑːt/'], ['/weəʳ/', '/wer/'], ['/wen/', '/wen/'], ['/waɪ/', '/waɪ/']];
    result.lessons[0].vocabulary.forEach((entry, i) => {
      assert.deepEqual([entry.pronunciations.UK.ipa, entry.pronunciations.US.ipa], expected[i]);
      assert.deepEqual(mod.exports.validPronunciations(entry.pronunciations), entry.pronunciations);
    });
  } finally { global.fetch = originalFetch; }
});
test('JSON validation preserves both accents and rejects unsafe source URLs', () => {
  const { parseLessonPack, starterLessons } = loadModule(
    'src/lib/english/lessons.ts'
  );
  const pack = { version: 2, lessons: structuredClone(starterLessons) };
  pack.lessons[0].vocabulary[0].pronunciations =
    mod.exports.reviewedPronunciations('hello');
  const result = parseLessonPack(JSON.parse(JSON.stringify(pack)));
  assert.deepEqual(
    result.lessons[0].vocabulary[0].pronunciations,
    pack.lessons[0].vocabulary[0].pronunciations
  );
  pack.lessons[0].vocabulary[0].pronunciations.UK.source =
    'javascript:alert(1)';
  assert.throws(() => parseLessonPack(pack), /HTTPS/);
});
test('import deduplicates lookups, keeps saved IPA on outage and leaves phrases alone', async () => {
  const { enrichPronunciations } = loadModule(
    'src/lib/english/enrich-pronunciations.ts',
    (name) => (name === './pronunciation' ? mod.exports : require(name))
  );
  const calls = [];
  const originalFetch = global.fetch;
  global.fetch = async (url) => {
    calls.push(url);
    throw new Error('offline');
  };
  try {
    const saved = {
      US: { ipa: '/raɪt/', source: 'https://example.org/write' },
    };
    const lessons = [
      {
        id: 'one',
        vocabulary: [
          { word: 'hello' },
          { word: 'write', pronunciations: saved },
          { word: 'write' },
          { word: 'try again' },
        ],
      },
    ];
    const result = await enrichPronunciations(lessons);
    assert.equal(calls.length, 1);
    assert.ok(result.lessons[0].vocabulary[0].pronunciations.UK);
    assert.ok(result.lessons[0].vocabulary[0].pronunciations.US);
    assert.deepEqual(result.lessons[0].vocabulary[1].pronunciations, saved);
    assert.equal(result.missing, 2);
    assert.equal(lessons[0].vocabulary[0].pronunciations, undefined);
  } finally {
    global.fetch = originalFetch;
  }
});

const wiki = loadModule('src/lib/english/wiktionary-pronunciation.ts');
test('real dictionary pages cover reported words without requiring an audio filename', () => {
  for (const word of [
    'start',
    'check',
    'complete',
    'arrange',
    'match',
    'choose',
    'look',
    'say',
    'write',
  ]) {
    const result = wiki.parseWiktionary(
      word,
      fs.readFileSync(`scripts/fixtures/pronunciations/${word}.html`, 'utf8')
    );
    assert.equal(result.status, 'found', word);
    assert.ok(Object.keys(result.pronunciations).length, word);
  }
  assert.equal(
    wiki.parseWiktionary(
      'read',
      fs.readFileSync('scripts/fixtures/pronunciations/read.html', 'utf8')
    ).status,
    'needs-context'
  );
  assert.equal(
    mod.exports.contextPronunciations('read', 'Read the word: hello.').UK.ipa,
    '/riːd/'
  );
  assert.deepEqual(
    mod.exports.contextPronunciations('read', 'I read it yesterday.'),
    {}
  );
});
test('general IPA is not invented UK/US, regional qualifiers after IPA are respected', () => {
  const result = wiki.parseWiktionary(
    'look',
    fs.readFileSync('scripts/fixtures/pronunciations/look.html', 'utf8')
  );
  assert.equal(result.pronunciations.IPA.ipa, '/lʊk/');
  assert.equal(result.pronunciations.UK, undefined);
  assert.throws(() =>
    wiki.parseWiktionary('word', '<h1>Service unavailable</h1>')
  );
});
test('batch import resumes from persistent cache and never persists network failures', async () => {
  const { enrichPronunciations } = loadModule(
    'src/lib/english/enrich-pronunciations.ts',
    (name) => (name === './pronunciation' ? mod.exports : require(name))
  );
  const originalFetch = global.fetch,
    originalStorage = global.localStorage;
  const store = new Map();
  global.localStorage = {
    getItem: (k) => store.get(k),
    setItem: (k, v) => store.set(k, v),
  };
  const names = Array.from(
    { length: 40 },
    (_, i) =>
      'word' +
      String.fromCharCode(97 + (i % 26)) +
      String.fromCharCode(97 + Math.floor(i / 26))
  );
  const lessons = [
    { vocabulary: names.map((word) => ({ word, example: '' })) },
  ];
  const seen = [];
  let fail = true;
  global.fetch = async (_, options) => {
    const words = JSON.parse(options.body).words;
    seen.push(words);
    if (fail && seen.length === 2) throw new Error('offline');
    return {
      ok: true,
      json: async () => ({
        results: Object.fromEntries(
          words.map((w) => [
            w,
            {
              status: 'found',
              pronunciations: {
                IPA: {
                  ipa: '/wɜːd/',
                  source: 'https://en.wiktionary.org/wiki/' + w,
                },
              },
            },
          ])
        ),
      }),
    };
  };
  try {
    const first = await enrichPronunciations(lessons);
    assert.equal(first.found, 16);
    assert.equal(first.unchecked, 24);
    fail = false;
    seen.length = 0;
    const second = await enrichPronunciations(first.lessons);
    assert.equal(second.found, 40);
    assert.equal(second.unchecked, 0);
    assert.equal(seen.flat().length, 24);
    assert.ok(seen.every((batch) => batch.length <= 16));
    seen.length = 0;
    await enrichPronunciations(second.lessons);
    assert.equal(seen.length, 0);
    const controller = new AbortController();
    controller.abort();
    const canceled = await enrichPronunciations(
      [{ vocabulary: [{ word: 'unseen', example: '' }] }],
      { signal: controller.signal }
    );
    assert.equal(canceled.unchecked, 1);
    assert.equal(seen.length, 0);
  } finally {
    global.fetch = originalFetch;
    global.localStorage = originalStorage;
  }
});
test('full lesson template batches unique words and warm updates make zero requests', async () => {
  const xlsx = require('xlsx'),
    book = xlsx.readFile('public/templates/english-lessons.xlsx');
  const lessons = book.SheetNames.filter((n) => n !== 'Guide').map((n) => {
    const rows = xlsx.utils.sheet_to_json(book.Sheets[n], { header: 1 });
    const start = rows.findIndex((r) => r[0] === 'Word' && r[1] === 'Meaning'),
      end = rows.findIndex((r) => r[0] === 'Activity');
    return {
      vocabulary: rows
        .slice(start + 1, end)
        .filter((r) => r[0] && r[1])
        .map((r) => ({ word: r[0], example: r[2] || '' })),
    };
  });
  const { enrichPronunciations } = loadModule(
    'src/lib/english/enrich-pronunciations.ts',
    (name) => (name === './pronunciation' ? mod.exports : require(name))
  );
  const oldFetch = global.fetch,
    oldStorage = global.localStorage,
    storage = new Map();
  let requests = 0,
    total = 0;
  global.localStorage = {
    getItem: (k) => storage.get(k),
    setItem: (k, v) => storage.set(k, v),
  };
  global.fetch = async (_, options) => {
    requests++;
    const words = JSON.parse(options.body).words;
    total += words.length;
    return {
      ok: true,
      json: async () => ({
        results: Object.fromEntries(
          words.map((w) => [w, { status: 'not-found', pronunciations: {} }])
        ),
      }),
    };
  };
  try {
    const start = performance.now();
    const result = await enrichPronunciations(lessons);
    const cold = requests;
    await enrichPronunciations(result.lessons);
    assert.equal(requests, cold);
    assert.equal(cold, Math.ceil(total / 16));
    console.log(
      `Template benchmark (mocked transport): ${lessons.length} lessons, ${lessons.reduce((n, l) => n + l.vocabulary.length, 0)} entries, ${total} unique lookups, ${cold} batches, zero warm requests, ${Math.round(performance.now() - start)}ms local processing`
    );
  } finally {
    global.fetch = oldFetch;
    global.localStorage = oldStorage;
  }
});

test('batch API validates input, deduplicates words and bounds upstream concurrency', async () => {
  const handler = loadModule(
    'src/pages/api/english/pronunciation.ts',
    (name) => {
      if (name === '@/lib/english/pronunciation') return mod.exports;
      if (name === '@/lib/english/wiktionary-pronunciation') return wiki;
      return require(name);
    }
  ).default;
  const original = global.fetch;
  let active = 0,
    peak = 0,
    count = 0;
  global.fetch = async (url) => {
    count++;
    active++;
    peak = Math.max(peak, active);
    await new Promise((r) => setTimeout(r, 2));
    active--;
    const word = decodeURIComponent(url.split('/').at(-2));
    return new Response(
      fs.readFileSync(`scripts/fixtures/pronunciations/${word}.html`, 'utf8')
    );
  };
  async function call(words) {
    const output = {};
    await handler(
      { method: 'POST', body: { words } },
      {
        setHeader() {},
        status(n) {
          output.status = n;
          return this;
        },
        json(value) {
          output.body = value;
        },
        end() {},
      }
    );
    return output;
  }
  try {
    assert.equal((await call(Array(17).fill('start'))).status, 400);
    assert.equal((await call(['https://example.com'])).status, 400);
    assert.equal(count, 0);
    const output = await call([
      'start',
      'check',
      'choose',
      'write',
      'arrange',
      'match',
      'start',
    ]);
    assert.equal(output.status, 200);
    assert.equal(count, 6);
    assert.ok(peak <= 4);
    assert.equal(Object.keys(output.body.results).length, 6);
    await call(['start', 'check']);
    assert.equal(count, 6);
  } finally {
    global.fetch = original;
  }
});

test('excludes historical discussion and regional variants; preserves calendar case', () => {
  const parse = (word) =>
    wiki.parseWiktionary(
      word,
      fs.readFileSync(`scripts/fixtures/pronunciations/${word}.html`, 'utf8')
    );
  assert.equal(parse('one').pronunciations.UK.ipa, '/wʌn/');
  assert.equal(parse('one').pronunciations.US.ipa, '/wʌn/');
  assert.equal(parse('food').pronunciations.IPA.ipa, '/fuːd/');
  assert.equal(parse('food').pronunciations.US, undefined);
  assert.equal(parse('then').pronunciations.US.ipa, '/ðɛn/');
  assert.equal(parse('name').status, 'needs-context');
  assert.equal(
    mod.exports.contextPronunciations('name', 'My name is Mai.').UK.ipa,
    '/neɪm/'
  );
  assert.equal(mod.exports.dictionaryWord('August'), 'August');
  assert.equal(mod.exports.dictionaryWord('august'), 'august');
  assert.equal(mod.exports.dictionaryWord('A'), 'A');
  assert.equal(parse('August').pronunciations.UK.ipa, '/ˈɔː.ɡəst/');
});

test('keeps documented regional alternatives instead of discarding an entire accent', () => {
  const result = wiki.parseWiktionary(
    'complete',
    fs.readFileSync('scripts/fixtures/pronunciations/complete.html', 'utf8')
  );
  assert.equal(result.pronunciations.UK.ipa, '/kəmˈpliːt/ · /kɒmˈpliːt/');
  assert.ok(result.pronunciations.US);
  assert.deepEqual(
    mod.exports.validPronunciations(result.pronunciations),
    result.pronunciations
  );
});

test('pronunciation examples match whole vocabulary entries without synthesizing sentence IPA', () => {
  const { examplePronunciations } = loadModule(
    'src/components/english/LessonNotes.tsx',
    () => ({})
  );
  const ipa = mod.exports.reviewedPronunciations('listen');
  const vocabulary = [{ word: 'listen', pronunciations: ipa }];
  assert.deepEqual(examplePronunciations('Listen.', vocabulary), ipa);
  assert.equal(examplePronunciations('Listen to the teacher.', vocabulary), undefined);
  assert.equal(examplePronunciations('Write.', vocabulary), undefined);
  assert.equal(examplePronunciations('Listen.', [...vocabulary, { word: 'listen', pronunciations: { UK: { ipa: '/other/', source: 'https://example.com' } } }]), undefined);
});
