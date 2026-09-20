const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const cache = {};
function load(name) {
  if (cache[name]) return cache[name];
  const code = ts.transpileModule(
    fs.readFileSync(
      path.join(__dirname, '../src/lib/math', name + '.ts'),
      'utf8'
    ),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }
  ).outputText;
  const module = { exports: {} };
  new Function('exports', 'module', 'require', 'crypto', code)(
    module.exports,
    module,
    (p) =>
      p.startsWith('.') ? load(path.join(path.dirname(name), p)) : require(p),
    require('node:crypto').webcrypto
  );
  cache[name] = module.exports;
  return module.exports;
}
const { parseMathPack, packLessons, checkAnswer, applyImport } =
  load('lessons');
const { exampleLessons } = load('examples');
const { encodeMathLesson, decodeMathLesson } = load('share');
const clone = () => structuredClone(packLessons(exampleLessons));
test('all example lessons validate and have correct model answers', () => {
  assert.deepEqual(parseMathPack(clone()), clone());
  for (const lesson of exampleLessons)
    for (const e of lesson.exercises)
      assert.equal(
        checkAnswer(e, e.answer, e.unit).correct,
        e.kind !== 'written',
        e.id
      );
});
test('fraction equivalence, simplification, invalid denominator, and tailored mistakes', () => {
  const e = exampleLessons[0].exercises[3];
  assert.equal(checkAnswer(e, '3/6').correct, true);
  assert.equal(checkAnswer({ ...e, simplified: true }, '3/6').correct, false);
  assert.equal(checkAnswer(e, '1/0').correct, false);
  assert.equal(checkAnswer(e, 'NaN/2').correct, false);
  assert.match(
    checkAnswer(exampleLessons[0].exercises[2], '5/24').message,
    /cộng cả mẫu/
  );
});
test('decimal commas, tolerance and units are checked', () => {
  const e = {
    ...exampleLessons[2].exercises[2],
    answer: '2.5',
    tolerance: 0.01,
  };
  assert.equal(checkAnswer(e, '2,5', 'cm²').correct, true);
  assert.equal(checkAnswer(e, '2.509', 'cm²').correct, true);
  assert.equal(checkAnswer(e, '2.52', 'cm²').correct, false);
  assert.equal(checkAnswer(e, '2.5', 'cm').correct, false);
  assert.equal(checkAnswer(e, 'Infinity', 'cm²').correct, false);
  assert.equal(checkAnswer(e, '', 'cm²').correct, false);
});
test('imports reject malformed or mismatched data without altering originals', () => {
  for (const change of [
    (p) => (p.subject = 'english'),
    (p) => (p.lessons[0].exercises[0].id = '__proto__'),
    (p) => (p.lessons[0].exercises[0].unit = 'cm'),
    (p) => p.lessons.push(p.lessons[0]),
    (p) => (p.lessons[0].grade = 13),
    (p) => (p.lessons[0].exercises[0].answer = 'not an option'),
    (p) => (p.lessons[0].blocks[1].values = [1, 0, 1, 3]),
    (p) => (p.lessons[0].exercises[0].kind = 'eval'),
    (p) => (p.lessons[0].blocks[0].section = '__proto__'),
  ]) {
    const pack = clone();
    change(pack);
    assert.throws(() => parseMathPack(pack));
  }
  const existing = clone().lessons;
  const updated = applyImport(
    existing,
    [{ ...existing[0], title: 'Updated' }],
    { [existing[0].id]: existing[0].id }
  );
  assert.equal(updated[0].title, 'Updated');
  assert.equal(existing[0].title, exampleLessons[0].title);
  const added = applyImport(existing, [existing[0]], {});
  assert.equal(added.length, existing.length + 1);
  assert.notEqual(added.at(-1).id, existing[0].id);
  assert.throws(() =>
    applyImport(existing, [existing[0], existing[1]], {
      [existing[0].id]: existing[0].id,
      [existing[1].id]: existing[0].id,
    })
  );
  assert.deepEqual(parseMathPack(packLessons([])).lessons, []);
});
test('share round trips strip private notes and snapshots remain independent', async () => {
  const original = structuredClone(exampleLessons[0]);
  const token = await encodeMathLesson(original);
  original.title = 'Changed after sharing';
  const decoded = await decodeMathLesson(token);
  assert.equal(decoded.teacherNotes, '');
  assert.equal(decoded.title, exampleLessons[0].title);
  assert.deepEqual(decoded.exercises, exampleLessons[0].exercises);
  await assert.rejects(decodeMathLesson('v1.invalid'));
  await assert.rejects(decodeMathLesson('m1.' + 'a'.repeat(16000)));
  await assert.rejects(decodeMathLesson(token.slice(0, 20)));
});
test('share decoder bounds decompression and strips unexpected fields', async () => {
  async function tokenFor(value) {
    const compressed = await new Response(
      new Blob([JSON.stringify(value)])
        .stream()
        .pipeThrough(new CompressionStream('gzip'))
    ).arrayBuffer();
    return 'm1.' + Buffer.from(compressed).toString('base64url');
  }
  await assert.rejects(
    decodeMathLesson(await tokenFor({ text: 'a'.repeat(300000) }))
  );
  const pack = clone();
  pack.lessons = [pack.lessons[0]];
  pack.lessons[0].privateData = 'do not carry this';
  const decoded = await decodeMathLesson(await tokenFor(pack));
  assert.equal(decoded.privateData, undefined);
  assert.equal(decoded.teacherNotes, '');
});
test('Excel export/import round trips all lessons and question types', () => {
  const XLSX = require('xlsx');
  let workbook;
  const original = XLSX.writeFile;
  XLSX.writeFile = (book) => {
    workbook = book;
  };
  try {
    load('workbook').exportMathWorkbook(exampleLessons);
  } finally {
    XLSX.writeFile = original;
  }
  const bytes = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  assert.deepEqual(load('workbook').importMathWorkbook(bytes), clone());
});

test('extra practice covers four groups and both PDF variants export', () => {
  const extra = exampleLessons[0].exercises.filter(
    (e) => e.section === 'extra'
  );
  assert.equal(extra.length, 20);
  assert.deepEqual(
    ['foundation', 'skills', 'application', 'challenge'].map(
      (group) => extra.filter((e) => e.group === group).length
    ),
    [4, 8, 6, 2]
  );
  const font = fs.readFileSync(
    path.join(__dirname, '../public/fonts/DejaVuSans.ttf')
  );
  for (const mode of ['worksheet', 'solutions']) {
    const bytes = load('pdf').createPracticePdf(exampleLessons[0], mode, font);
    assert.equal(Buffer.from(bytes).subarray(0, 8).toString(), '%PDF-1.7');
    if (process.env.MATH_PDF_QA_DIR) {
      fs.mkdirSync(process.env.MATH_PDF_QA_DIR, { recursive: true });
      fs.writeFileSync(
        path.join(process.env.MATH_PDF_QA_DIR, mode + '.pdf'),
        bytes
      );
    }
  }
});

test('saved fraction lesson receives built-in extra section without replacing teacher content', () => {
  const upgrade = load('migrations').addBuiltInFractionPractice;
  const old = structuredClone(exampleLessons[0]);
  old.exercises = old.exercises.filter((e) => e.section !== 'extra');
  old.teacherNotes = 'Teacher notes';
  old.blocks[0].text = 'Edited teaching content';
  const original = structuredClone(old);
  const [updated] = upgrade([old]);
  assert.equal(
    updated.exercises.filter((e) => e.section === 'extra').length,
    20
  );
  assert.deepEqual(updated.blocks, original.blocks);
  assert.equal(updated.teacherNotes, original.teacherNotes);
  assert.deepEqual(
    updated.exercises.slice(0, original.exercises.length),
    original.exercises
  );
  assert.deepEqual(old, original);
  assert.deepEqual(upgrade([updated]), [updated]);
  assert.deepEqual(upgrade([]), []);
  assert.deepEqual(upgrade([exampleLessons[1]]), [exampleLessons[1]]);
  assert.deepEqual(parseMathPack(packLessons([updated])).lessons, [updated]);
});

test('fraction formatting hides denominator one and preserves intermediate ratios', () => {
  const { wholeNumberFraction: format } = load('format');
  for (const [n, d, value] of [
    ['1', '1', '1'],
    ['2', '1', '2'],
    ['0', '1', '0'],
    ['-6', '1', '-6'],
    ['9007199254740993', '1', '9007199254740993'],
  ])
    assert.equal(format(n, d), value);
  for (const [n, d] of [
    ['6', '6'],
    ['6', '3'],
    ['0', '7'],
    ['6', '-3'],
    ['5', '6'],
    ['7', '3'],
    ['1', '0'],
    ['0', '0'],
    ['2 × 3', '3'],
    ['□', '3'],
  ])
    assert.equal(format(n, d), null);
});

test('quick edit validates drafts and keeps them open after failed storage', () => {
  const states = [];
  let cursor = 0,
    closes = 0,
    writes = 0,
    accept = false;
  const jsx = (type, props) => ({ type, props });
  const module = { exports: {} };
  const code = ts.transpileModule(
    fs.readFileSync(
      path.join(__dirname, '../src/components/math/QuickLessonEdit.tsx'),
      'utf8'
    ),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
      },
    }
  ).outputText;
  new Function('require', 'module', 'exports', code)(
    (name) => {
      if (name === 'react')
        return {
          useState(initial) {
            const i = cursor++;
            if (!(i in states))
              states[i] = typeof initial === 'function' ? initial() : initial;
            return [states[i], (value) => (states[i] = value)];
          },
          useRef(initial) {
            const i = cursor++;
            if (!(i in states)) states[i] = { current: initial };
            return states[i];
          },
          useEffect() {},
        };
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
      if (name.endsWith('/lessons')) return load('lessons');
      return { default: name };
    },
    module,
    module.exports
  );
  const all = (node, type) =>
    !node
      ? []
      : Array.isArray(node)
        ? node.flatMap((child) => all(child, type))
        : [
            ...(node.type === type ? [node] : []),
            ...all(node.props?.children, type),
          ];
  const render = () => {
    cursor = 0;
    return module.exports.default({
      lesson: exampleLessons[0],
      target: { exercise: exampleLessons[0].exercises[0].id },
      onClose: () => closes++,
      onSave: () => {
        writes++;
        return accept;
      },
    });
  };
  const editor = () => all(render(), './LessonEditor')[0].props;
  const invalid = structuredClone(exampleLessons[0]);
  invalid.exercises[0].answer = 'not an option';
  editor().onChange(invalid);
  editor().onSave();
  assert.equal(writes, 0);
  assert.equal(closes, 0);
  assert.equal(
    all(render(), 'p').some((p) => p.props.role === 'alert'),
    true
  );
  const changed = structuredClone(exampleLessons[0]);
  changed.blocks[0].title = 'Updated heading';
  editor().onChange(changed);
  editor().onSave();
  assert.equal(writes, 1);
  assert.equal(closes, 0);
  assert.equal(editor().draft.blocks[0].title, 'Updated heading');
  assert.equal(exampleLessons[0].blocks[0].title, 'Em cần biết gì trước?');
  accept = true;
  editor().onSave();
  assert.equal(writes, 2);
  assert.equal(closes, 1);
});

test('rational lesson is added once and preserves existing teacher edits', () => {
  const { addBuiltInRationalLesson } = load('migrations');
  const { rationalLesson } = load('rational-example');
  const existing = structuredClone(exampleLessons[0]);
  existing.title = 'Teacher custom title';
  const upgraded = addBuiltInRationalLesson([existing]);
  assert.equal(upgraded.length, 2);
  assert.equal(upgraded[0], existing);
  assert.equal(upgraded[1].id, rationalLesson.id);
  upgraded[1].title = 'Edited rational lesson';
  assert.equal(addBuiltInRationalLesson(upgraded), upgraded);
  assert.notEqual(rationalLesson.title, upgraded[1].title);
  assert.equal(rationalLesson.exercises.filter(e => e.section === 'extra').length, 20);
  const full = Array.from({length: 100}, (_, i) => ({...existing, id: `custom-${i}`}));
  assert.equal(addBuiltInRationalLesson(full), full);
});
