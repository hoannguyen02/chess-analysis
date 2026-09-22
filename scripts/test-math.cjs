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
const { isMathPracticeEnabled } = load('availability');
const { encodeMathLesson, decodeMathLesson } = load('share');
const clone = () => structuredClone(packLessons(exampleLessons));
test('math practice is local-only unless production explicitly opts in', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalFlag = process.env.NEXT_PUBLIC_ENABLE_MATH_PRACTICE;
  try {
    process.env.NODE_ENV = 'development';
    delete process.env.NEXT_PUBLIC_ENABLE_MATH_PRACTICE;
    assert.equal(isMathPracticeEnabled(), true);

    process.env.NODE_ENV = 'production';
    assert.equal(isMathPracticeEnabled(), false);

    process.env.NEXT_PUBLIC_ENABLE_MATH_PRACTICE = 'true';
    assert.equal(isMathPracticeEnabled(), true);
  } finally {
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
    if (originalFlag === undefined)
      delete process.env.NEXT_PUBLIC_ENABLE_MATH_PRACTICE;
    else process.env.NEXT_PUBLIC_ENABLE_MATH_PRACTICE = originalFlag;
  }
});
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
  assert.deepEqual(
    load('workbook').importMathWorkbook(bytes),
    packLessons(exampleLessons.map(load('knowledge-summary').withKnowledgeSummary))
  );
});

test('extra practice covers four groups and both PDF variants export', () => {
  const extra = exampleLessons[0].exercises.filter(
    (e) => e.section === 'extra'
  );
  assert.equal(extra.length, 80);
  assert.deepEqual(
    ['foundation', 'skills', 'application', 'challenge'].map(
      (group) => extra.filter((e) => e.group === group).length
    ),
    [16, 32, 24, 8]
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

test('worksheet choices omit ruled lines and reserved workspace for every saved size', () => {
  const { createPracticePdf } = load('pdf');
  const { naturalLesson } = load('natural-example');
  const font = fs.readFileSync(path.join(__dirname, '../public/fonts/DejaVuSans.ttf'));
  const choice = naturalLesson.exercises.find(e => e.section === 'extra' && e.kind === 'choice');
  const lesson = {
    ...naturalLesson,
    knowledgeSummary: '',
    exercises: Array.from({ length: 16 }, (_, i) => ({ ...choice, id: `choice-${i}` })),
  };
  for (const mode of ['worksheet', 'solutions']) {
    const baseline = createPracticePdf(lesson, mode, font);
    assert.equal(Buffer.from(baseline).toString('latin1').includes('0.85 0.88 0.92 RG'), false);
    for (const workspace of ['small', 'medium', 'large']) {
      const resized = { ...lesson, exercises: lesson.exercises.map(e => ({ ...e, workspace })) };
      assert.deepEqual(createPracticePdf(resized, mode, font), baseline);
    }
  }
});

test('mixed worksheets keep configured writing lines for number, fraction and written questions', () => {
  const { createPracticePdf } = load('pdf');
  const font = fs.readFileSync(path.join(__dirname, '../public/fonts/DejaVuSans.ttf'));
  const extra = exampleLessons.flatMap(lesson => lesson.exercises).filter(e => e.section === 'extra');
  const lesson = {
    ...exampleLessons[0],
    knowledgeSummary: '',
    exercises: ['choice', 'number', 'fraction', 'written'].map((kind, i) => ({
      ...extra.find(e => e.kind === kind),
      id: `mixed-${i}`,
      workspace: ['large', 'small', 'medium', 'large'][i],
    })),
  };
  assert.deepEqual(lesson.exercises.map(e => e.kind), ['choice', 'number', 'fraction', 'written']);
  const lineCount = mode =>
    (Buffer.from(createPracticePdf(lesson, mode, font)).toString('latin1').match(/0\.85 0\.88 0\.92 RG/g) || []).length;
  assert.equal(lineCount('worksheet'), 2 + 4 + 6);
  assert.equal(lineCount('solutions'), 0);
});

test('both PDF exports omit practice-group headings and reserved space without changing question order', () => {
  const { createPracticePdf } = load('pdf');
  const font = fs.readFileSync(path.join(__dirname, '../public/fonts/DejaVuSans.ttf'));
  const groups = ['foundation', 'skills', 'application', 'challenge'];
  const lesson = structuredClone(exampleLessons[0]);
  lesson.exercises = lesson.exercises
    .filter(e => e.section === 'extra')
    .map((e, i) => ({ ...e, group: groups[i % groups.length] }));
  const before = structuredClone(lesson);
  const withoutGroups = { ...lesson, exercises: lesson.exercises.map(({ group, ...e }) => e) };
  const headings = Object.values(load('lessons').EXTRA_GROUPS).map(label => label.toLocaleUpperCase('vi'));
  for (const mode of ['worksheet', 'solutions']) {
    const bytes = createPracticePdf(lesson, mode, font);
    assert.deepEqual(bytes, createPracticePdf(withoutGroups, mode, font));
    const rows = pdfTextRows(bytes);
    assert.ok(!rows.some(row => headings.includes(row.text)), mode);
    assert.deepEqual(
      rows.filter(row => /^Bài \d+\./u.test(row.text)).map(row => Number(row.text.match(/^Bài (\d+)\./u)[1])),
      lesson.exercises.map((_, i) => i + 1)
    );
  }
  assert.deepEqual(lesson, before);
});

test('PDF filenames identify the brand, grade, specific lesson and document type', () => {
  const { practicePdfFilename } = load('pdf');
  const lesson = { grade: 6, topic: 'Số nguyên', title: 'Số nguyên: nhận biết, so sánh và tính toán' };
  assert.equal(
    practicePdfFilename(lesson, 'worksheet'),
    'LIMAMath - Lớp 6 - Số nguyên - nhận biết, so sánh và tính toán - Bài tập.pdf'
  );
  assert.equal(
    practicePdfFilename(lesson, 'solutions'),
    'LIMAMath - Lớp 6 - Số nguyên - nhận biết, so sánh và tính toán - Lời giải.pdf'
  );
  assert.notEqual(
    practicePdfFilename(lesson, 'worksheet'),
    practicePdfFilename({ ...lesson, title: 'Cộng và trừ số nguyên' }, 'worksheet')
  );
  const filenames = exampleLessons.flatMap((item) =>
    ['worksheet', 'solutions'].map((mode) => practicePdfFilename(item, mode))
  );
  assert.equal(new Set(filenames).size, filenames.length);
});

test('PDF filenames normalize Vietnamese and remain safe and bounded for custom titles', () => {
  const { practicePdfFilename } = load('pdf');
  const lesson = { grade: 6, topic: 'Số học', title: '  .. Đếm: ước / bội \\ "nâng cao" <>?*|\u0000\u202E\n..  ' };
  const expected = 'LIMAMath - Lớp 6 - Đếm - ước bội nâng cao - Bài tập.pdf';
  assert.equal(practicePdfFilename(lesson, 'worksheet'), expected);
  assert.equal(practicePdfFilename({ ...lesson, title: lesson.title.normalize('NFD') }, 'worksheet'), expected);
  assert.equal(practicePdfFilename({ ...lesson, title: ' /:*? ' }, 'worksheet'), 'LIMAMath - Lớp 6 - Số học - Bài tập.pdf');
  assert.equal(practicePdfFilename({ ...lesson, title: '', topic: '' }, 'solutions'), 'LIMAMath - Lớp 6 - Bài học - Lời giải.pdf');
  for (const mode of ['worksheet', 'solutions']) {
    const filename = practicePdfFilename({ ...lesson, grade: 12, title: 'Đếm số tự nhiên 🧮 '.repeat(40) }, mode);
    assert.ok(Buffer.byteLength(filename, 'utf8') <= 240);
    assert.match(filename, /^LIMAMath - Lớp 12 - /u);
    assert.ok(filename.endsWith(`… - ${mode === 'worksheet' ? 'Bài tập' : 'Lời giải'}.pdf`));
    assert.equal(Buffer.from(filename).toString('utf8'), filename);
    assert.equal(filename, filename.normalize('NFC'));
  }
});

test('PDF downloads use the descriptive filename for both document types', async (t) => {
  const { downloadPracticePdf, practicePdfFilename } = load('pdf');
  const font = fs.readFileSync(path.join(__dirname, '../public/fonts/DejaVuSans.ttf'));
  const downloads = [];
  const revoked = [];
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  globalThis.document = {
    createElement(tag) {
      assert.equal(tag, 'a');
      return {
        click() { downloads.push({ name: this.download, url: this.href }); },
        remove() {},
      };
    },
    body: { appendChild() {} },
  };
  t.mock.method(globalThis, 'fetch', async (url) => {
    assert.equal(url, '/fonts/DejaVuSans.ttf');
    return new Response(font);
  });
  t.mock.method(URL, 'createObjectURL', (blob) => {
    assert.equal(blob.type, 'application/pdf');
    return 'blob:math-pdf';
  });
  t.mock.method(URL, 'revokeObjectURL', (url) => revoked.push(url));
  t.mock.method(globalThis, 'setTimeout', (callback, delay) => {
    assert.equal(delay, 60000);
    callback();
    return 0;
  });
  try {
    const lesson = exampleLessons[0];
    for (const mode of ['worksheet', 'solutions']) {
      await downloadPracticePdf(lesson, mode);
      assert.deepEqual(downloads.at(-1), { name: practicePdfFilename(lesson, mode), url: 'blob:math-pdf' });
    }
    assert.equal(downloads.length, 2);
    assert.deepEqual(revoked, ['blob:math-pdf', 'blob:math-pdf']);
  } finally {
    if (originalDocument) Object.defineProperty(globalThis, 'document', originalDocument);
    else delete globalThis.document;
  }
});

test('PDF tasks time out, release their timer and allow a fresh retry', async (t) => {
  const { startPdfTask, PDF_EXPORT_TIMEOUT_MS } = load('pdf-task');
  let timeout;
  let released = 0;
  t.mock.method(globalThis, 'setTimeout', (callback, ms) => {
    assert.equal(ms, PDF_EXPORT_TIMEOUT_MS);
    timeout = callback;
    return 123;
  });
  t.mock.method(globalThis, 'clearTimeout', (timer) => {
    assert.equal(timer, 123);
    released++;
  });
  let signal;
  const stalled = startPdfTask((value) => {
    signal = value;
    return new Promise(() => {});
  });
  await Promise.resolve();
  timeout();
  await assert.rejects(stalled.promise, /quá 20 giây/);
  assert.equal(signal.aborted, true);
  assert.equal(released, 1);
  await startPdfTask(async () => {}).promise;
  assert.equal(released, 2);
  await assert.rejects(startPdfTask(async () => { throw new Error('PDF failed'); }).promise, /PDF failed/);
  assert.equal(released, 3);
});

test('cancelling a stalled PDF import ignores late results and prevents late downloads', async () => {
  const { startPdfTask, waitForPdfTask } = load('pdf-task');
  let completeImport;
  let downloads = 0;
  const pendingImport = new Promise(resolve => { completeImport = resolve; });
  const task = startPdfTask(async (signal) => {
    const exporter = await waitForPdfTask(pendingImport, signal);
    signal.throwIfAborted();
    await exporter.download();
  });
  await Promise.resolve();
  task.cancel();
  await assert.rejects(task.promise, /Đã hủy/);
  completeImport({ download: async () => { downloads++; } });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(downloads, 0);
  const alreadyCancelled = startPdfTask(async () => { downloads++; });
  alreadyCancelled.cancel();
  await assert.rejects(alreadyCancelled.promise, /Đã hủy/);
  assert.equal(downloads, 0);
});

test('PDF font loading is cancellable before headers and during a stalled response body', async (t) => {
  const { downloadPracticePdf } = load('pdf');
  for (const stage of ['headers', 'body']) {
    let release;
    let entered;
    const started = new Promise(resolve => { entered = resolve; });
    const pending = new Promise(resolve => { release = resolve; });
    const controller = new AbortController();
    const fetchMock = t.mock.method(globalThis, 'fetch', async (url, options) => {
      assert.equal(url, '/fonts/DejaVuSans.ttf');
      assert.equal(options.signal, controller.signal);
      if (stage === 'headers') {
        entered();
        return pending;
      }
      return { ok: true, arrayBuffer() { entered(); return pending; } };
    });
    const download = downloadPracticePdf(exampleLessons[0], 'worksheet', {}, controller.signal);
    await started;
    controller.abort(new Error('Stopped font loading'));
    await assert.rejects(download, /Stopped font loading/);
    release(stage === 'headers' ? new Response(new Uint8Array()) : new ArrayBuffer(0));
    await new Promise(resolve => setImmediate(resolve));
    fetchMock.mock.restore();
  }
  const aborted = new AbortController();
  aborted.abort(new Error('Already stopped'));
  await assert.rejects(downloadPracticePdf(exampleLessons[0], 'solutions', {}, aborted.signal), /Already stopped/);
});

test('knowledge summaries have sample defaults, preserve edits and do not guess custom content', () => {
  const { getKnowledgeSummary, withKnowledgeSummary } = load('knowledge-summary');
  for (const lesson of exampleLessons) {
    const summary = getKnowledgeSummary(lesson);
    assert.ok(summary.includes('Ví dụ:'));
    assert.ok(summary.includes('Lưu ý:'));
    assert.ok(summary.length < 1100);
    const saved = withKnowledgeSummary(lesson);
    assert.equal(getKnowledgeSummary({ ...saved, title: 'Tên mới' }), summary);
    assert.equal(getKnowledgeSummary({ ...lesson, knowledgeSummary: '' }), '');
    assert.equal(getKnowledgeSummary({ ...lesson, knowledgeSummary: 'Nội dung riêng.' }), 'Nội dung riêng.');
    assert.equal(getKnowledgeSummary({ ...lesson, knowledgeSummary: undefined, title: 'Bài tự soạn khác' }), '');
  }
});

test('natural-number review keeps the requested topics without the place-value bullet', () => {
  const { getKnowledgeSummary } = load('knowledge-summary');
  const { naturalLesson } = load('natural-example');
  const summary = getKnowledgeSummary(naturalLesson);
  assert.equal(summary.split('\n').length, 5);
  assert.ok(summary.includes('Tập hợp số tự nhiên'));
  assert.ok(summary.includes('Lũy thừa'));
  assert.ok(summary.includes('Thứ tự tính'));
  assert.ok(summary.includes('Ví dụ: 7 + 4 × (9 - 6)'));
  assert.ok(summary.includes('Lưu ý:'));
  assert.ok(!summary.includes('Trong hệ thập phân'));
});

test('knowledge summaries validate and round trip through JSON, Excel, sharing and copies', async () => {
  const { getKnowledgeSummary } = load('knowledge-summary');
  const lesson = { ...structuredClone(exampleLessons[0]), knowledgeSummary: 'Ôn quy đồng.\nVí dụ: 2/7 + 1/3 = 13/21.' };
  for (const summary of [lesson.knowledgeSummary, '']) {
    lesson.knowledgeSummary = summary;
    const pack = packLessons([lesson]);
    assert.deepEqual(parseMathPack(JSON.parse(JSON.stringify(pack))), pack);
    const decoded = await decodeMathLesson(await encodeMathLesson(lesson));
    assert.equal(decoded.knowledgeSummary, summary);
    assert.equal(load('lessons').duplicateLesson(lesson).knowledgeSummary, summary);
    const XLSX = require('xlsx');
    const original = XLSX.writeFile;
    let book;
    XLSX.writeFile = (value) => { book = value; };
    try { load('workbook').exportMathWorkbook([lesson, exampleLessons[1]]); }
    finally { XLSX.writeFile = original; }
    const imported = load('workbook').importMathWorkbook(XLSX.write(book, { bookType: 'xlsx', type: 'array' }));
    assert.equal(imported.lessons[0].knowledgeSummary, summary);
    assert.equal(imported.lessons[1].knowledgeSummary, getKnowledgeSummary(exampleLessons[1]));
  }
  const defaultSnapshot = await decodeMathLesson(await encodeMathLesson(exampleLessons[0]));
  assert.equal(defaultSnapshot.knowledgeSummary, getKnowledgeSummary(exampleLessons[0]));
  for (const value of [null, 12, {}, 'a'.repeat(4001)]) {
    assert.throws(() => parseMathPack(packLessons([{ ...lesson, knowledgeSummary: value }])), /Kiến thức cần nhớ/);
  }
});

test('PDF summaries are worksheet-only, optional, independent of answers and safely paginated', () => {
  const { createPracticePdf } = load('pdf');
  const font = fs.readFileSync(path.join(__dirname, '../public/fonts/DejaVuSans.ttf'));
  const lesson = structuredClone(exampleLessons[0]);
  const before = structuredClone(lesson);
  const withoutSummary = { ...lesson, knowledgeSummary: '' };
  const plain = createPracticePdf(withoutSummary, 'worksheet', font);
  const reviewed = createPracticePdf(lesson, 'worksheet', font);
  assert.notDeepEqual(reviewed, plain);
  assert.deepEqual(createPracticePdf(lesson, 'worksheet', font, { includeKnowledgeSummary: false }), plain);
  assert.deepEqual(
    createPracticePdf(lesson, 'solutions', font, { includeKnowledgeSummary: true }),
    createPracticePdf(withoutSummary, 'solutions', font, { includeKnowledgeSummary: false })
  );
  const privateEdit = { ...lesson, teacherNotes: 'Riêng tư 🧮', exercises: lesson.exercises.map(e => ({ ...e, solution: 'Lời giải không in 🧮' })) };
  assert.deepEqual(createPracticePdf(privateEdit, 'worksheet', font), reviewed);
  const longSummary = { ...lesson, knowledgeSummary: 'Ghi nhớ quy tắc.\n'.repeat(180) };
  const pageCount = bytes => Number(Buffer.from(bytes).toString('latin1').match(/\/Count (\d+)/)[1]);
  assert.ok(pageCount(createPracticePdf(longSummary, 'worksheet', font)) > pageCount(reviewed));
  const unsupported = { ...lesson, knowledgeSummary: 'Ký tự chưa hỗ trợ 🧮' };
  assert.throws(() => createPracticePdf(unsupported, 'worksheet', font), /Phông PDF/);
  assert.deepEqual(createPracticePdf(unsupported, 'worksheet', font, { includeKnowledgeSummary: false }), plain);
  assert.deepEqual(lesson, before);
});

test('PDF exports ignore input instructions regardless of their wording', () => {
  const { createPracticePdf } = load('pdf');
  const font = fs.readFileSync(path.join(__dirname, '../public/fonts/DejaVuSans.ttf'));
  const lesson = structuredClone(load('rational-example').rationalLesson);
  // This is legitimate question content, not UI guidance to be stripped.
  lesson.exercises.find((e) => e.id === 'r-ex-22').prompt =
    'Giải thích ý nghĩa của yêu cầu “Nhập phân số.”';
  const withoutInstructions = structuredClone(lesson);
  const withInstructions = structuredClone(lesson);
  for (const e of withoutInstructions.exercises) delete e.inputInstruction;
  for (const e of withInstructions.exercises)
    e.inputInstruction = 'Hướng dẫn hoàn toàn mới: chọn ô bên phải rồi bấm nút tiếp tục. 🧮';
  const before = structuredClone(withInstructions);
  for (const mode of ['worksheet', 'solutions']) {
    assert.deepEqual(
      createPracticePdf(withInstructions, mode, font),
      createPracticePdf(withoutInstructions, mode, font)
    );
  }
  assert.deepEqual(withInstructions, before);
});

test('legacy example prompts migrate to separate input instructions without changing custom content', () => {
  const legacy = structuredClone(packLessons(exampleLessons));
  let count = 0;
  for (const lesson of legacy.lessons)
    for (const e of lesson.exercises) {
      if (!e.inputInstruction) continue;
      e.prompt += ' ' + e.inputInstruction;
      if (e.skill) e.skill = e.prompt;
      delete e.inputInstruction;
      count++;
    }
  assert.equal(count, 8);
  const before = structuredClone(legacy);
  const migrated = parseMathPack(legacy);
  assert.deepEqual(migrated, packLessons(exampleLessons));
  assert.deepEqual(parseMathPack(migrated), migrated);
  assert.deepEqual(legacy, before);

  const rational = legacy.lessons.find((l) => l.id === 'math-rational-7');
  const custom = rational.exercises.find((e) => e.id === 'r-ex-22');
  custom.prompt = 'Bài toán do giáo viên sửa. Nhập phân số.';
  custom.skill = 'Kỹ năng riêng';
  const explicit = rational.exercises.find((e) => e.id === 'r-ex-23');
  explicit.inputInstruction = 'Hướng dẫn riêng';
  const updated = parseMathPack(legacy).lessons.find((l) => l.id === rational.id);
  assert.deepEqual(updated.exercises.find((e) => e.id === custom.id), custom);
  assert.deepEqual(updated.exercises.find((e) => e.id === explicit.id), explicit);
});

test('input instructions validate and survive JSON, sharing and duplication', async () => {
  const lesson = structuredClone(exampleLessons[0]);
  lesson.exercises[0].inputInstruction = 'Chọn một trong các đáp án rồi tiếp tục.';
  const pack = packLessons([lesson]);
  assert.deepEqual(parseMathPack(JSON.parse(JSON.stringify(pack))), pack);
  const decoded = await decodeMathLesson(await encodeMathLesson(lesson));
  assert.equal(decoded.exercises[0].inputInstruction, lesson.exercises[0].inputInstruction);
  const copied = applyImport([], [lesson], {});
  assert.equal(copied[0].exercises[0].inputInstruction, lesson.exercises[0].inputInstruction);
  for (const value of [null, 12, {}, 'a'.repeat(1001)]) {
    lesson.exercises[0].inputInstruction = value;
    assert.throws(() => parseMathPack(packLessons([lesson])), /Hướng dẫn nhập đáp án/);
  }
});

test('PDF word problems use Vietnamese statements, direct calculations and answers', () => {
  const { printableWordProblemSolution } = load('pdf');
  const cases = [
    ['i-extra-13', 'Nhiệt độ mới là:', '(-4) + 9', '5 (°C)', '5 °C'],
    ['i-extra-14', 'Độ cao mới là:', '(-12) − 7', '-19 (m)', '-19 m'],
    ['i-extra-15', 'An được số điểm là:', '4 × 5 + 3 × (-2)', '14 (điểm)', '14 điểm'],
    ['i-extra-18', 'Tổng thay đổi điểm là:', '4 × (-3)', '-12 (điểm)', '-12 điểm'],
    ['fraction-extra-15', 'Tổng chiều dài là:', '2/5 + 1/4', '13/20 (m)', '13/20 m'],
    ['fraction-extra-16', 'Mai đã đọc số phần quyển sách là:', '1/3 + 1/6', '1/2 (quyển sách)', '1/2 quyển sách'],
    ['fraction-extra-17', 'Trong bình có số lít nước là:', '3/8 + 1/4', '5/8 (lít)', '5/8 lít'],
    ['fraction-extra-18', 'Tổng thời gian là:', '1/2 + 1/3', '5/6 (giờ)', '5/6 giờ'],
    ['r-ex-21', 'Nhiệt độ mới là:', '-2,5 + 3,75', '1,25 (°C)', '1,25 °C'],
    ['r-ex-22', 'Số lít còn lại là:', '3/4 − 1/3 + 1/6', '7/12 (lít)', '7/12 lít'],
    ['r-ex-23', 'Tổng quãng đường là:', '2/5 + 3/4', '23/20 (km)', '23/20 km'],
    ['r-ex-24', 'Số nghìn đồng còn lại là:', '150 − 62,5 + 20', '107,5 (nghìn đồng)', '107,5 nghìn đồng'],
  ];
  const exercises = exampleLessons.flatMap((lesson) => lesson.exercises);
  const before = structuredClone(exercises);
  for (const [id, statement, expression, result, answer] of cases) {
    assert.equal(
      printableWordProblemSolution(exercises.find((e) => e.id === id)),
      `${statement}\n${expression} = ${result}\nĐáp số: ${answer}`,
      id
    );
  }
  assert.deepEqual(exercises, before);
  for (const e of exercises.filter((e) => !cases.some(([id]) => id === e.id)))
    assert.equal(printableWordProblemSolution(e), null, e.id);
});

test('PDF word problem formatting preserves explanations and rejects inconsistent results', () => {
  const { printableWordProblemSolution } = load('pdf');
  const e = load('integer-example').integerLesson.exercises.find(
    (e) => e.id === 'i-extra-15'
  );
  for (const change of [
    { solution: 'Điểm câu đúng: 4 × 5 = 20. Điểm câu sai: 3 × (-2) = -6. Tổng: 14 điểm.' },
    { solution: '4 × 5 + 3 × (-2) = 20 + (-6) = 15 (điểm).' },
    { prompt: e.prompt + ' An trả lời đúng bao nhiêu câu?' },
    { unit: 'm' },
    { kind: 'written' },
  ]) assert.equal(printableWordProblemSolution({ ...e, ...change }), null);
});

test('word-problem PDF rows preserve authored steps and select workbook alignments', () => {
  const { printableWordProblemRows } = load('pdf');
  const natural = load('natural-example').naturalLesson;
  const single = natural.exercises.find(e => e.solution.startsWith('Số vở mỗi bạn'));
  const multiple = natural.exercises.find(e => e.solution.startsWith('Tổng số bút'));
  const before = structuredClone(multiple);
  for (const exercise of [single, multiple]) {
    const rows = printableWordProblemRows(exercise);
    assert.deepEqual(rows[0], { text: 'Bài giải:', role: 'heading', align: 'center' });
    assert.equal(rows.slice(1).map(row => row.text).join('\n'), exercise.solution);
    assert.deepEqual(rows.map(row => row.align), exercise === single
      ? ['center', 'center', 'center', 'left']
      : ['center', 'center', 'center', 'center', 'center', 'left']);
  }
  assert.deepEqual(multiple, before);
  assert.deepEqual(printableWordProblemRows({ ...single, solution: `Lời giải: ${single.solution}` }), printableWordProblemRows(single));
  assert.deepEqual(printableWordProblemRows({ ...single, solution: `Bài giải:\n${single.solution}` }), printableWordProblemRows(single));
  const prose = natural.exercises.find(e => e.solution.startsWith('53 ='));
  assert.equal(printableWordProblemRows(prose)[1].align, 'center');
  const fraction = load('rational-example').rationalLesson.exercises.find(e => e.id === 'r-ex-22');
  const fractionRows = printableWordProblemRows(fraction);
  assert.equal(fractionRows[2].text, '3/4 − 1/3 + 1/6 = 7/12 (lít)');
  assert.equal(fractionRows[2].align, 'center');
  assert.equal(fractionRows[3].text, 'Đáp số: 7/12 lít');
  const divisibility = load('natural-example').divisibilityLesson;
  const gcd = divisibility.exercises.find(e => e.solution.includes('Đáp số: 6 túi.'));
  assert.equal(printableWordProblemRows(gcd).find(row => row.text.startsWith('ƯCLN')).align, 'center');
  assert.equal(printableWordProblemRows({ ...single, kind: 'choice' }), null);
  assert.equal(printableWordProblemRows({ ...single, solution: '48 : 6 = 8.' }), null);
});

test('all lessons share the Grade 4 word-problem format, including fraction cancellation', () => {
  const { printableWordProblemRows } = load('pdf');
  const before = structuredClone(exampleLessons);
  const reference = exampleLessons.find(l => l.id === 'math-fraction-of-number-4')
    .exercises.find(e => e.id === 'math-fraction-of-number-4-q17');
  const shape = printableWordProblemRows(reference).map(({ role, align }) => ({ role, align }));
  const lesson = exampleLessons.find(l => l.id === 'math-fraction-multiply-6');
  const cases = [
    ['q19', '(3/4) × (2/3) = 1/2 (cốc).', 'Đáp số: 1/2 cốc.'],
    ['q20', '(3/4) : (1/8) = 6 (chai).', 'Đáp số: 6 chai.'],
    ['q21', '(5/6) × (3/5) = 1/2 (ha).', 'Đáp số: 1/2 ha.'],
    ['q22', '(7/8) : (7/32) = 4 (đoạn).', 'Đáp số: 4 đoạn.'],
  ];
  for (const [id, calculation, answer] of cases) {
    const e = lesson.exercises.find(e => e.id === `${lesson.id}-${id}`);
    const rows = printableWordProblemRows(e);
    assert.deepEqual(rows.map(({ role, align }) => ({ role, align })), shape, id);
    assert.equal(rows[1].text, e.solution.split('\n')[0]);
    assert.equal(rows[2].text, calculation, id);
    assert.equal(rows[3].text, answer, id);
  }
  for (const l of exampleLessons) for (const e of l.exercises) {
    if (e.section !== 'extra' || e.kind === 'choice' || !/\nĐáp số:/u.test(e.solution)) continue;
    const rows = printableWordProblemRows(e);
    assert.ok(rows, e.id);
    assert.equal(rows[0].text, 'Bài giải:', e.id);
    assert.equal(rows.at(-1).align, 'left', e.id);
    assert.ok(rows.slice(0, -1).every(row => row.align === 'center'), e.id);
  }
  assert.deepEqual(exampleLessons, before, 'formatting must not change stored or online working');
});

test('future authored solutions opt into workbook layout by structure, not arithmetic notation', () => {
  const { printableWordProblemRows } = load('pdf');
  const exercise = { ...exampleLessons[0].exercises[0], kind: 'written', id: 'future-word-problem' };
  for (const working of [
    'Cạnh hình vuông là:\n√64 = 8 (m).',
    'Cạnh hình vuông là:\nx = 24 : 3 = 8 (m).',
    '24 : 3 = 8 (m).',
    'Đếm trên hình có tám đoạn bằng nhau.',
  ]) {
    const rows = printableWordProblemRows({ ...exercise,
      solution: `  Bài giải:\n${working}\nĐÁP SỐ: 8 (m).\n`,
    });
    assert.equal(rows[0].text, 'Bài giải:');
    assert.equal(rows.slice(1, -1).map(row => row.text).join('\n'), working);
    assert.ok(rows.slice(0, -1).every(row => row.align === 'center'));
    assert.deepEqual(rows.at(-1), { text: 'Đáp số: 8 m.', role: 'answer', align: 'left' });
  }
  const multiple = {
    ...exercise,
    solution: 'Số bút ban đầu là:\n12 × 5 = 12 + 12 + 12 + 12 + 12 = 60 (chiếc).\nSố bút còn lại là:\n60 − 18 = 60 − 10 − 8 = 42 (chiếc).\nĐáp số: 42 chiếc bút.',
  };
  assert.deepEqual(printableWordProblemRows(multiple).map(row => row.text), [
    'Bài giải:', 'Số bút ban đầu là:', '12 × 5 = 60 (chiếc).',
    'Số bút còn lại là:', '60 − 18 = 42 (chiếc).', 'Đáp số: 42 chiếc bút.',
  ]);
  assert.equal(printableWordProblemRows({ ...exercise, solution: 'Đáp số: 8 m.' }), null);
  assert.equal(printableWordProblemRows({ ...multiple, kind: 'choice' }), null);
});

// Decode our uncompressed PDF text operators to test physical alignment, not
// just the formatting metadata. Fractions also receive visual render checks.
function pdfTextRows(bytes) {
  const source = Buffer.from(bytes).toString('latin1');
  const unicode = new Map();
  for (const block of source.matchAll(/beginbfchar\n([\s\S]*?)endbfchar/g))
    for (const pair of block[1].matchAll(/<([0-9a-f]+)> <([0-9a-f]+)>/g))
      unicode.set(pair[1], String.fromCodePoint(parseInt(pair[2], 16)));
  const widths = new Map([...source.match(/\/W \[(.*)\] >>/)[1].matchAll(/(\d+) \[([\d.]+)\]/g)]
    .map(match => [Number(match[1]), Number(match[2])]));
  const rows = [];
  let page = 0;
  for (const stream of source.matchAll(/\d+ 0 obj\n<< \/Length \d+\s+>>\nstream\n([\s\S]*?)\nendstream/g)) {
    if (!stream[1].includes('BT /F1')) continue;
    const baselines = new Map();
    for (const op of stream[1].matchAll(/BT \/F1 ([\d.]+) Tf [\d. ]+ rg 1 0 0 1 ([\d.-]+) ([\d.-]+) Tm <([0-9a-f]+)> Tj ET/g)) {
      const [, size, x, y, hex] = op;
      const glyphs = hex.match(/.{4}/g);
      const text = glyphs.map(glyph => unicode.get(glyph)).join('');
      const width = glyphs.reduce((sum, glyph) => sum + widths.get(parseInt(glyph, 16)) * Number(size) / 1000, 0);
      const row = baselines.get(y) || { text: '', left: Number(x), right: Number(x), y: Number(y), page };
      row.text += text;
      row.left = Math.min(row.left, Number(x));
      row.right = Math.max(row.right, Number(x) + width);
      baselines.set(y, row);
    }
    rows.push(...baselines.values());
    page++;
  }
  return rows;
}

test('exported fraction word problems physically match the reference workbook layout', () => {
  const { createPracticePdf } = load('pdf');
  const font = fs.readFileSync(path.join(__dirname, '../public/fonts/DejaVuSans.ttf'));
  const lesson = structuredClone(exampleLessons.find(l => l.id === 'math-fraction-multiply-6'));
  lesson.id = 'future-fraction-word-problems';
  lesson.title = 'Bài toán có lời văn';
  lesson.grade = 5;
  lesson.exercises = lesson.exercises.filter(e => /-q(19|20|21|22)$/u.test(e.id));
  const rows = pdfTextRows(createPracticePdf(lesson, 'solutions', font));
  assert.equal(rows.filter(row => row.text === 'Bài giải:').length, 4);
  assert.ok(!rows.some(row => row.text.startsWith('Lời giải:')));
  const answers = rows.filter(row => row.text.startsWith('Đáp số:'));
  assert.equal(answers.length, 4);
  for (const answer of answers) {
    const calculation = rows.slice(0, rows.indexOf(answer)).findLast(row => row.text.includes(' = '));
    assert.ok(Math.abs(answer.left - 595.28 / 2) < 0.02, answer.text);
    assert.ok(answer.y < calculation.y);
    assert.equal(answer.page, calculation.page);
    assert.equal((calculation.text.match(/=/gu) || []).length, 1);
  }
  for (const row of rows.filter(row => row.text === 'Bài giải:' || row.text.endsWith('là:'))) {
    assert.ok(Math.abs((row.left + row.right) / 2 - 595.28 / 2) < 0.02, row.text);
  }
  const worksheet = pdfTextRows(createPracticePdf(lesson, 'worksheet', font));
  assert.ok(!worksheet.some(row => /Bài giải:|Lời giải:|Đáp số:/u.test(row.text)));
  assert.equal(worksheet.filter(row => /^Bài \d+\./u.test(row.text)).length, 4);
});

test('mixed solution PDFs keep the next calculation question with its working', () => {
  const { createPracticePdf } = load('pdf');
  const font = fs.readFileSync(path.join(__dirname, '../public/fonts/DejaVuSans.ttf'));
  const lesson = exampleLessons.find(l => l.id === 'math-fraction-multiply-6');
  const rows = pdfTextRows(createPracticePdf(lesson, 'solutions', font));
  const promptIndex = rows.findIndex(row => row.text.startsWith('Bài 19.'));
  const solution = rows.slice(promptIndex + 1).find(row => row.text.startsWith('Lời giải:'));
  assert.ok(promptIndex >= 0 && solution);
  assert.equal(rows[promptIndex].page, solution.page);
});

test('PDF omits redundant fraction parentheses but keeps negative operands grouped', () => {
  const { createPracticePdf } = load('pdf');
  const font = fs.readFileSync(path.join(__dirname, '../public/fonts/DejaVuSans.ttf'));
  const lesson = structuredClone(
    load('fraction-lessons').fractionLessons.find(
      item => item.id === 'math-fraction-multiply-6'
    )
  );
  lesson.knowledgeSummary = '';
  lesson.exercises = lesson.exercises.filter(e =>
    ['math-fraction-multiply-6-q5', 'math-fraction-multiply-6-q7'].includes(e.id)
  );
  for (const mode of ['worksheet', 'solutions']) {
    const bytes = createPracticePdf(lesson, mode, font);
    const rows = pdfTextRows(bytes);
    const positive = rows.find(row => row.text.startsWith('Bài 1. Tính'));
    const negative = rows.find(row => row.text.startsWith('Bài 2. Tính'));
    assert.ok(positive && negative, mode);
    assert.doesNotMatch(positive.text, /[()]/u, mode);
    assert.equal((negative.text.match(/\(/gu) || []).length, 1, mode);
    assert.equal((negative.text.match(/\)/gu) || []).length, 1, mode);
    if (mode === 'solutions') {
      const solution = rows.find(row => row.text.startsWith('Lời giải:'));
      assert.ok(solution, mode);
      assert.doesNotMatch(solution.text, /[()]/u, mode);
    }
    if (process.env.MATH_PDF_QA_DIR) {
      fs.mkdirSync(process.env.MATH_PDF_QA_DIR, { recursive: true });
      fs.writeFileSync(
        path.join(process.env.MATH_PDF_QA_DIR, `fraction-parentheses-${mode}.pdf`),
        bytes
      );
    }
  }
});

test('solution PDF centers working and starts the answer below the midpoint of the final calculation', () => {
  const { createPracticePdf } = load('pdf');
  const font = fs.readFileSync(path.join(__dirname, '../public/fonts/DejaVuSans.ttf'));
  const lesson = load('natural-example').naturalLesson;
  const rows = pdfTextRows(createPracticePdf(lesson, 'solutions', font));
  const expected = [
    ['Bài giải:', 'center'],
    ['Tổng số bút là:', 'center'],
    ['12 × 5 = 60 (chiếc).', 'center'],
    ['Số bút còn lại là:', 'center'],
    ['60 − 18 = 42 (chiếc).', 'center'],
    ['Đáp số: 42 chiếc bút.', 'left'],
  ];
  const statementIndex = rows.findIndex(row => row.text === 'Tổng số bút là:');
  assert.ok(statementIndex > 0);
  const block = rows.slice(statementIndex - 1, statementIndex - 1 + expected.length);
  const calculationMidpoint = (block.at(-2).left + block.at(-2).right) / 2;
  const prompt = rows.slice(0, statementIndex - 1).findLast(row => row.text.startsWith('Bài 12.'));
  assert.equal(prompt.left, 44);
  const singleStatement = rows.find(row => row.text === 'Số vở mỗi bạn nhận được là:');
  assert.ok(Math.abs((singleStatement.left + singleStatement.right) / 2 - 595.28 / 2) < 0.02);
  for (const [index, [text, align]] of expected.entries()) {
    const row = block[index];
    assert.equal(row.text, text);
    const actual = align === 'center' ? (row.left + row.right) / 2 : row.left;
    const target = align === 'center' ? 595.28 / 2 : calculationMidpoint;
    assert.ok(Math.abs(actual - target) < 0.02, `${text}: ${actual} vs ${target}`);
    assert.equal(row.page, prompt.page);
    if (index) assert.ok(row.y < block[index - 1].y);
  }
  assert.ok(!rows.some(row => row.text.startsWith('Lời giải: Số vở')));
  const singleAnswer = rows.find(row => row.text === 'Đáp số: 8 quyển vở.');
  const singleCalculation = rows.find(row => row.text === '48 : 6 = 8 (quyển).');
  assert.ok(Math.abs(singleAnswer.left - (singleCalculation.left + singleCalculation.right) / 2) < 0.02);
  assert.ok(singleAnswer.y < singleCalculation.y);
  const busCalculation = rows.find(row => row.text === '6 + 1 = 7 (xe).');
  const busAnswer = rows.find(row => row.text === 'Đáp số: 7 xe.');
  assert.ok(Math.abs(busAnswer.left - (busCalculation.left + busCalculation.right) / 2) < 0.02);
  assert.ok(busAnswer.y < busCalculation.y);
});

test('answer starts at the midpoint for fractions and wrapped calculations, with margin-safe long answers', () => {
  const { createPracticePdf } = load('pdf');
  const font = fs.readFileSync(path.join(__dirname, '../public/fonts/DejaVuSans.ttf'));
  const lesson = structuredClone(load('natural-example').naturalLesson);
  const exercise = lesson.exercises.find(e => e.solution.startsWith('Số vở mỗi bạn'));
  exercise.solution = 'Số phần là:\n1/12 + 2/12 + 3/12 + 1/12 = 7/12 (phần).\nĐáp số: 7/12 phần.';
  lesson.exercises = [exercise];
  const fractionRows = pdfTextRows(createPracticePdf(lesson, 'solutions', font));
  const calculation = fractionRows.find(row => row.text.includes(' = ') && row.text.endsWith('(phần).'));
  const answer = fractionRows.find(row => row.text.startsWith('Đáp số:'));
  assert.ok(Math.abs(answer.left - 595.28 / 2) < 0.02);
  assert.ok(answer.y < calculation.y);
  assert.ok(answer.right < 595.28 - 44);

  for (const count of [24, 40]) {
    exercise.solution = `Số vở là:\n${Array(count).fill('1').join(' + ')} = ${count} (quyển).\nĐáp số: ${count} quyển vở.`;
    const wrappedRows = pdfTextRows(createPracticePdf(lesson, 'solutions', font));
    assert.ok(wrappedRows.filter(row => row.text.startsWith('1 +')).length > 1);
    const finalCalculationLine = wrappedRows.find(row => row.text.endsWith(`= ${count} (quyển).`));
    const wrappedAnswer = wrappedRows.find(row => row.text === `Đáp số: ${count} quyển vở.`);
    const answerWidth = wrappedAnswer.right - wrappedAnswer.left;
    const midpoint = (finalCalculationLine.left + finalCalculationLine.right) / 2;
    const expectedStart = Math.min(midpoint, 595.28 - 44 - answerWidth);
    assert.ok(Math.abs(wrappedAnswer.left - expectedStart) < 0.02);
    assert.ok(wrappedAnswer.y < finalCalculationLine.y);
  }

  for (const explanation of ['Số vở mỗi bạn nhận được là:', 'Giải thích các bước tính thật cẩn thận. '.repeat(16).trim()]) {
    exercise.solution = `${explanation}\n48 : 6 = 8 (quyển).\nĐáp số: ${'8 quyển vở cho mỗi bạn; '.repeat(12).trim()}`;
    const rows = pdfTextRows(createPracticePdf(lesson, 'solutions', font));
    const answerIndex = rows.findIndex(row => row.text.startsWith('Đáp số:'));
    const answers = rows.slice(answerIndex).filter(row => row.y > 50);
    assert.ok(answers.length > 1, 'long answers wrap');
    for (const row of answers) {
      assert.equal(row.left, 44, row.text);
      assert.ok(row.right <= 595.28 - 44 + 0.02, row.text);
    }
  }
});

test('long workbook solutions wrap safely and keep every step without orphaning the heading', () => {
  const { createPracticePdf } = load('pdf');
  const font = fs.readFileSync(path.join(__dirname, '../public/fonts/DejaVuSans.ttf'));
  const lesson = structuredClone(load('natural-example').naturalLesson);
  const exercise = lesson.exercises.find(e => e.solution.startsWith('Số vở mỗi bạn'));
  exercise.solution = [
    ...Array.from({ length: 45 }, (_, i) => `Bước ${i + 1}: Số quyển vở mỗi bạn nhận được là:\n48 : 6 = 8 (quyển).`),
    'Đáp số: ' + '8 quyển vở cho mỗi bạn; '.repeat(20),
  ].join('\n');
  lesson.exercises = [exercise];
  const rows = pdfTextRows(createPracticePdf(lesson, 'solutions', font));
  assert.equal(rows.filter(row => row.text === '48 : 6 = 8 (quyển).').length, 45);
  const titleIndex = rows.findIndex(row => row.text === 'Bài giải:');
  assert.equal(rows[titleIndex].page, 0);
  assert.equal(rows[titleIndex + 1].page, rows[titleIndex].page);
  assert.ok(rows.at(-1).page > 0);
  for (const row of rows) {
    assert.ok(row.left >= 43.98, row.text);
    assert.ok(row.right <= 595.28 - 44 + 0.02, row.text);
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

test('fraction formatting removes only redundant unsigned operand parentheses', () => {
  const { stripRedundantFractionParentheses: format } = load('format');
  for (const [source, expected] of [
    ['(2/3) × (3/5)', '2/3 × 3/5'],
    ['20 × (3/4)', '20 × 3/4'],
    ['(3/5) : (9/10)', '3/5 : 9/10'],
    ['(5/6) − (1/4)', '5/6 − 1/4'],
    ['(-3/4) × (2/9)', '(-3/4) × 2/9'],
    ['(0/1) × (2/5)', '0/1 × 2/5'],
    ['(1/0) × (2/3)', '(1/0) × 2/3'],
  ])
    assert.equal(format(source), expected);
  for (const source of [
    '(-3/4)',
    '(2 × 3)/(3 × 5)',
    '(1/2 + 1/3)',
    '1/(2/3)',
    'f(2/3)',
    '(2/3)^2',
    '(2/3)²',
  ])
    assert.equal(format(source), source);
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
  assert.equal(rationalLesson.exercises.filter(e => e.section === 'extra').length, 24);
  const full = Array.from({length: 100}, (_, i) => ({...existing, id: `custom-${i}`}));
  assert.equal(addBuiltInRationalLesson(full), full);
});

test('integer lesson upgrades saved libraries without replacing edits or exceeding capacity', () => {
  const { integerLesson } = load('integer-example');
  const { addBuiltInIntegerLesson } = load('migrations');
  const saved = structuredClone(exampleLessons[0]);
  saved.title = 'Teacher custom lesson';
  const upgraded = addBuiltInIntegerLesson([saved]);
  assert.equal(upgraded.length, 2);
  assert.equal(upgraded[0], saved);
  upgraded[1].title = 'Teacher integer lesson';
  assert.equal(addBuiltInIntegerLesson(upgraded), upgraded);
  assert.notEqual(integerLesson.title, upgraded[1].title);
  const full = Array.from({ length: 100 }, (_, i) => ({ ...saved, id: `saved-${i}` }));
  assert.equal(addBuiltInIntegerLesson(full), full);
  const extra = integerLesson.exercises.filter(e => e.section === 'extra');
  assert.equal(extra.length, 24);
  assert.deepEqual(['foundation', 'skills', 'application', 'challenge'].map(group => extra.filter(e => e.group === group).length), [5, 9, 7, 3]);
  const signed = extra.find(e => e.id === 'i-extra-13');
  assert.equal(checkAnswer(signed, '5').correct, true);
  assert.equal(checkAnswer(signed, '-5').correct, false);
  const font = fs.readFileSync(path.join(__dirname, '../public/fonts/DejaVuSans.ttf'));
  for (const mode of ['worksheet', 'solutions']) {
    const bytes = load('pdf').createPracticePdf(integerLesson, mode, font);
    assert.equal(Buffer.from(bytes).subarray(0, 8).toString(), '%PDF-1.7');
  }
});


test('set content upgrades preserve edits and are idempotent', () => {
  const { addSetContent } = load('migrations');
  const originals = exampleLessons.filter(l => ['math-integers-6', 'math-rational-7'].includes(l.id));
  const old = structuredClone(originals).map(l => ({...l, blocks: l.blocks.filter(b => !b.id.includes('-sets-')), exercises: l.exercises.filter(e => !e.id.includes('-sets-'))}));
  const upgraded = addSetContent(old);
  parseMathPack(packLessons(upgraded));
  assert.deepEqual(addSetContent(upgraded), upgraded);
  upgraded[0].blocks.find(b => b.id.includes('-sets-')).text = 'Teacher version';
  assert.deepEqual(addSetContent(upgraded), upgraded);
  for (const l of upgraded) {
    assert.equal(l.exercises.filter(e => e.id.includes('-sets-')).length, 6);
    const font = fs.readFileSync(path.join(__dirname, '../public/fonts/DejaVuSans.ttf'));
    for (const mode of ['worksheet', 'solutions']) load('pdf').createPracticePdf(l, mode, font);
  }
});

test('natural lesson upgrades preserve edits and all practice exports', () => {
  const { naturalLesson } = load('natural-example');
  const { addBuiltInNaturalLesson } = load('migrations');
  const existing = structuredClone(exampleLessons[0]);
  existing.title = 'Teacher lesson';
  const updated = addBuiltInNaturalLesson([existing]);
  assert.equal(updated[0], existing);
  assert.equal(updated.length, 2);
  updated[1].title = 'Custom natural lesson';
  assert.equal(addBuiltInNaturalLesson(updated), updated);
  assert.notEqual(naturalLesson.title, updated[1].title);
  const full = Array.from({length: 100}, (_, i) => ({...existing, id: `full-${i}`}));
  assert.equal(addBuiltInNaturalLesson(full), full);
  const extra = naturalLesson.exercises.filter(e => e.section === 'extra');
  assert.equal(extra.length, 15);
  assert.deepEqual(['foundation', 'skills', 'application', 'challenge'].map(g => extra.filter(e => e.group === g).length), [4, 6, 4, 1]);
  assert.equal(checkAnswer(extra.find(e => e.id === 'n-extra-17'), '6').correct, false);
  assert.equal(checkAnswer(extra.find(e => e.id === 'n-extra-17'), '7').correct, true);
  const font = fs.readFileSync(path.join(__dirname, '../public/fonts/DejaVuSans.ttf'));
  for (const mode of ['worksheet', 'solutions']) {
    const bytes = load('pdf').createPracticePdf(naturalLesson, mode, font);
    assert.equal(Buffer.from(bytes).subarray(0, 8).toString(), '%PDF-1.7');
    if (process.env.MATH_PDF_QA_DIR) {
      fs.mkdirSync(process.env.MATH_PDF_QA_DIR, { recursive: true });
      fs.writeFileSync(path.join(process.env.MATH_PDF_QA_DIR, `natural-${mode}.pdf`), bytes);
    }
  }
});

test('common factor content upgrades preserve edits and numeric answers are correct', () => {
  const { combinedNaturalLesson: naturalLesson } = load('natural-example');
  const { commonFactorBlocks, commonFactorExercises } = load('gcd-lcm-content');
  const { addNaturalCommonFactors } = load('migrations');
  const old = structuredClone(naturalLesson);
  old.blocks = old.blocks.filter(b => !b.id.startsWith('n-common-'));
  old.exercises = old.exercises.filter(e => !e.id.startsWith('n-common-'));
  old.title = 'My title';
  old.blocks.push({...commonFactorBlocks[0], text: 'My explanation'});
  const result = addNaturalCommonFactors([old])[0];
  assert.equal(result.title, 'My title');
  assert.equal(result.blocks.find(b => b.id === commonFactorBlocks[0].id).text, 'My explanation');
  assert.deepEqual(addNaturalCommonFactors([result])[0], result);
  assert.equal(old.exercises.length, 28);
  assert.equal(result.exercises.length, 44);
  assert.deepEqual(addNaturalCommonFactors([]), []);
  const full = {...old, blocks: Array.from({length: 50}, (_, i) => ({...old.blocks[0], id: `custom-${i}`}))};
  assert.equal(addNaturalCommonFactors([full])[0], full);
  const gcd = (a, b) => b ? gcd(b, a % b) : a;
  for (const e of commonFactorExercises) {
    const match = e.prompt.match(/^Tìm (ƯCLN|BCNN)\(([\d, ]+)\)/);
    if (!match) continue;
    const nums = match[2].split(',').map(Number);
    const answer = nums.reduce((a, b) => match[1] === 'ƯCLN' ? gcd(a,b) : a*b/gcd(a,b));
    assert.equal(Number(e.answer), answer, e.id);
    assert.equal(checkAnswer(e, String(answer)).correct, true);
    assert.equal(checkAnswer(e, String(answer + 1)).correct, false);
  }
  assert.equal(checkAnswer(commonFactorExercises.find(e => e.id === 'n-common-extra-2'), '0').correct, false);
});

test('splitting divisibility moves saved edits without loss and exports the new lesson', () => {
  const { naturalLesson, combinedNaturalLesson, divisibilityLesson } = load('natural-example');
  const { splitNaturalDivisibility } = load('migrations');
  const source = structuredClone(combinedNaturalLesson);
  source.exercises.find(e => e.id === 'n-extra-12').hint = 'Teacher hint';
  source.blocks.find(b => b.id === 'n-divisibility').text = 'Teacher text';
  const result = splitNaturalDivisibility([source]);
  assert.equal(result.length, 2);
  assert.equal(result[0].title, naturalLesson.title);
  assert.equal(result[0].exercises.length, 20);
  assert.equal(result[1].exercises.find(e => e.id === 'n-extra-12').hint, 'Teacher hint');
  assert.equal(result[1].blocks.find(b => b.id === 'n-divisibility').text, 'Teacher text');
  assert.equal(source.exercises.length, 44);
  assert.deepEqual(splitNaturalDivisibility(result), result);
  assert.deepEqual(splitNaturalDivisibility([]), []);
  assert.equal(splitNaturalDivisibility([naturalLesson])[1].exercises.length, divisibilityLesson.exercises.length);
  const full = [source, ...Array.from({length: 99}, (_, i) => ({...naturalLesson, id: `custom-${i}`}))];
  assert.equal(splitNaturalDivisibility(full), full);
  const conflict = structuredClone(divisibilityLesson);
  conflict.exercises.find(e => e.id === 'n-extra-12').hint = 'Different edit';
  const merged = splitNaturalDivisibility([source, conflict]);
  assert.equal(merged[0].exercises.find(e => e.id === 'n-extra-12').hint, 'Teacher hint');
  assert.equal(merged[1].exercises.find(e => e.id === 'n-extra-12').hint, 'Different edit');
  assert.equal(divisibilityLesson.exercises.filter(e => e.section === 'extra').length, 17);
  const font = fs.readFileSync(path.join(__dirname, '../public/fonts/DejaVuSans.ttf'));
  for (const mode of ['worksheet', 'solutions']) {
    const bytes = load('pdf').createPracticePdf(divisibilityLesson, mode, font);
    assert.equal(Buffer.from(bytes).subarray(0, 8).toString(), '%PDF-1.7');
  }
});

test('natural-number terminology updates stored content and PDF summaries only in relevant lessons', () => {
  const { naturalLesson, divisibilityLesson } = load('natural-example');
  const { getKnowledgeSummary } = load('knowledge-summary');
  const { updateNaturalTerminology } = load('migrations');
  for (const lesson of [naturalLesson, divisibilityLesson]) {
    assert.doesNotMatch(JSON.stringify(lesson) + getKnowledgeSummary(lesson), /ước dương|nguyên dương/);
  }
  const old = structuredClone(divisibilityLesson);
  old.knowledgeSummary = 'Với các số nguyên dương, phân tích ra thừa số nguyên tố.';
  old.blocks[0].text = 'Ghi chú riêng: có hai ước dương.';
  old.exercises[0].hint = 'Xét các ước dương.';
  const unrelated = {...old, id: 'custom-lesson'};
  const result = updateNaturalTerminology([old, unrelated]);
  assert.match(result[0].knowledgeSummary, /số tự nhiên lớn hơn 1/);
  assert.equal(result[0].blocks[0].text, 'Ghi chú riêng: có hai ước.');
  assert.equal(result[0].exercises[0].hint, 'Xét các ước.');
  assert.equal(result[1], unrelated);
  assert.deepEqual(updateNaturalTerminology(result), result);
  assert.match(old.blocks[0].text, /ước dương/);
});

test('fraction sequence adds five lessons without overwriting edits and exports all practice', () => {
  const { fractionLessons } = load('fraction-lessons');
  const { addFractionLessons } = load('migrations');
  assert.equal(fractionLessons.length, 5);
  const custom = {...structuredClone(fractionLessons[0]), title: 'Teacher title'};
  const updated = addFractionLessons([exampleLessons[0], custom]);
  assert.equal(updated.length, 6);
  assert.equal(updated[0], exampleLessons[0]);
  assert.equal(updated[1], custom);
  assert.equal(addFractionLessons(updated), updated);
  const full = Array.from({length: 100}, (_, i) => ({...custom, id: `custom-${i}`}));
  assert.equal(addFractionLessons(full), full);
  const font = fs.readFileSync(path.join(__dirname, '../public/fonts/DejaVuSans.ttf'));
  for (const lesson of fractionLessons) {
    assert.equal(lesson.exercises.filter(e => e.section === 'extra').length, 20);
    for (const mode of ['worksheet', 'solutions']) {
      const bytes = load('pdf').createPracticePdf(lesson, mode, font);
      assert.equal(Buffer.from(bytes).subarray(0, 8).toString(), '%PDF-1.7');
      if (process.env.MATH_PDF_QA_DIR) {
        fs.mkdirSync(process.env.MATH_PDF_QA_DIR, {recursive: true});
        fs.writeFileSync(path.join(process.env.MATH_PDF_QA_DIR, `${lesson.id}-${mode}.pdf`), bytes);
      }
    }
  }
  // Independently calculate the authored arithmetic questions.
  for (const lesson of fractionLessons) for (const e of lesson.exercises) {
    const m = e.prompt.match(/^Tính \((-?\d+)\/(\d+)\) ([×:−]) \((-?\d+)\/(\d+)\)\.$/);
    if (!m) continue;
    const a = Number(m[1])/Number(m[2]), b = Number(m[4])/Number(m[5]);
    const expected = m[3] === '×' ? a*b : m[3] === ':' ? a/b : a-b;
    const parts = e.answer.split('/').map(Number);
    assert.ok(Math.abs(expected - parts[0]/(parts[1] || 1)) < 1e-12, e.id);
  }
});

test('grade 4 fractions respect curriculum scope and grade upgrades preserve teacher edits', () => {
  const { primaryFractionLessons } = load('primary-fraction-lessons');
  const { fractionLessons } = load('fraction-lessons');
  const { updateFractionLevels } = load('fraction-level-migration');
  assert.equal(primaryFractionLessons.length, 5);
  for (const lesson of primaryFractionLessons) {
    assert.equal(lesson.grade, 4);
    assert.equal(lesson.exercises.filter(e => e.section === 'extra').length, 20);
    const visible = JSON.stringify([lesson.blocks, lesson.exercises, lesson.knowledgeSummary]);
    assert.doesNotMatch(visible, /ƯCLN|BCNN|số nguyên|âm|-(?:[1-9]\d*)\//);
    for (const e of lesson.exercises) {
      const m = e.prompt.match(/^Tính (\d+)\/(\d+) ([+−×:]) (\d+)\/(\d+)\.$/);
      if (!m) continue;
      const [a,b,c,d] = [m[1],m[2],m[4],m[5]].map(Number);
      const op = m[3];
      if (op === '+' || op === '−') assert.ok(b%d === 0 || d%b === 0, e.id);
      const expected = op === '+' ? a/b+c/d : op === '−' ? a/b-c/d : op === '×' ? a/b*c/d : (a/b)/(c/d);
      assert.ok(expected >= 0, e.id);
      const answer = e.answer.split('/').map(Number);
      assert.ok(Math.abs(answer[0]/(answer[1] || 1)-expected) < 1e-12, e.id);
    }
  }
  const ordering = primaryFractionLessons
    .find(lesson => lesson.id === 'math-fraction-compare-4')
    .exercises.filter(exercise => exercise.section === 'extra')
    .slice(-2);
  assert.deepEqual(ordering.map(exercise => exercise.id), [
    'math-fraction-compare-4-q23',
    'math-fraction-compare-4-q24',
  ]);
  assert.deepEqual(ordering.map(exercise => exercise.answer), [
    '1/2 < 1 < 3/2 < 2',
    '2 > 3/2 > 5/4 > 7/8',
  ]);
  const value = text => {
    const [numerator, denominator = '1'] = text.split('/');
    return Number(numerator) / Number(denominator);
  };
  for (const exercise of ordering) {
    assert.equal(exercise.kind, 'choice');
    assert.ok(exercise.options.includes(exercise.answer));
    const values = exercise.answer.split(/ [<>] /).map(value);
    const ascending = exercise.answer.includes(' < ');
    assert.ok(values.slice(1).every((current, index) =>
      ascending ? values[index] < current : values[index] > current
    ), exercise.id);
  }
  const old = structuredClone(fractionLessons[0]);
  old.title = 'Phân số: khái niệm, tính chất và rút gọn';
  old.goal = 'Nhận biết tử, mẫu; viết phân số bằng nhau và rút gọn.';
  old.blocks[0].text = 'Teacher custom text';
  const result = updateFractionLevels([old]);
  assert.equal(result.length, 6);
  assert.equal(result[0].title, fractionLessons[0].title);
  assert.equal(result[0].blocks[0].text, 'Teacher custom text');
  assert.deepEqual(updateFractionLevels(result), result);
  const custom = {...old, title: 'Teacher title', goal: 'Teacher goal'};
  assert.equal(updateFractionLevels([custom])[0].title, 'Teacher title');
  assert.equal(updateFractionLevels([custom])[0].goal, 'Teacher goal');
  const full = Array.from({length: 100}, (_, i) => ({...custom, id: `full-${i}`}));
  assert.equal(updateFractionLevels(full).length, 100);
  const font = fs.readFileSync(path.join(__dirname, '../public/fonts/DejaVuSans.ttf'));
  for (const lesson of primaryFractionLessons) for (const mode of ['worksheet', 'solutions']) {
    const bytes = load('pdf').createPracticePdf(lesson, mode, font);
    assert.equal(Buffer.from(bytes).subarray(0,8).toString(), '%PDF-1.7');
    if (process.env.MATH_PDF_QA_DIR) {
      fs.mkdirSync(process.env.MATH_PDF_QA_DIR, {recursive: true});
      fs.writeFileSync(path.join(process.env.MATH_PDF_QA_DIR, `${lesson.id}-${mode}.pdf`), bytes);
    }
  }
});

test('saved Grade 4 ordering challenges update without overwriting teacher edits', () => {
  const { primaryFractionLessons } = load('primary-fraction-lessons');
  const { updatePrimaryFractionOrdering } = load('fraction-level-migration');
  const original = structuredClone(
    primaryFractionLessons.find(lesson => lesson.id === 'math-fraction-compare-4')
  );
  Object.assign(
    original.exercises.find(exercise => exercise.id === 'math-fraction-compare-4-q23'),
    {
      kind: 'choice',
      prompt: 'Chọn dãy phân số theo thứ tự tăng dần.',
      answer: '1/4 < 1/2 < 3/4',
      hint: 'Đưa về mẫu 4.',
      solution: '1/4 < 2/4 < 3/4.',
      options: [
        '1/4 < 1/2 < 3/4',
        '1/2 < 1/4 < 3/4',
        '3/4 < 1/2 < 1/4',
      ],
    }
  );
  Object.assign(
    original.exercises.find(exercise => exercise.id === 'math-fraction-compare-4-q24'),
    {
      kind: 'number',
      prompt: 'Điền số tự nhiên vào ô trống: 2/7 < □/7 < 4/7.',
      answer: '3',
      hint: 'So sánh các tử số.',
      solution: '2 < 3 < 4 nên số cần điền là 3.',
      options: [],
    }
  );
  const customized = structuredClone(original);
  customized.exercises.find(
    exercise => exercise.id === 'math-fraction-compare-4-q23'
  ).hint = 'Teacher hint';
  const migrated = updatePrimaryFractionOrdering([original, customized]);
  assert.deepEqual(migrated[0].exercises.slice(-2).map(exercise => exercise.answer), [
    '1/2 < 1 < 3/2 < 2',
    '2 > 3/2 > 5/4 > 7/8',
  ]);
  const customChallenge = migrated[1].exercises.find(
    exercise => exercise.id === 'math-fraction-compare-4-q23'
  );
  assert.equal(customChallenge.hint, 'Teacher hint');
  assert.equal(customChallenge.answer, '1/4 < 1/2 < 3/4');
  assert.equal(
    migrated[1].exercises.find(
      exercise => exercise.id === 'math-fraction-compare-4-q24'
    ).answer,
    '2 > 3/2 > 5/4 > 7/8'
  );
  assert.deepEqual(updatePrimaryFractionOrdering(migrated), migrated);
});

test('Grade 6 fractions consolidate into three lessons while preserving saved work', () => {
  const {legacyExampleLessons, exampleLessons} = load('examples');
  const {consolidateFractionLessons} = load('fraction-consolidation');
  const scope = exampleLessons.filter(l => l.grade === 6 && l.topic === 'Phân số mở rộng');
  assert.deepEqual(scope.map(l => l.title), ['Cộng trừ phân số', 'Nhân chia phân số', 'Hai bài toán cơ bản về phân số', 'So sánh và sắp xếp các số']);
  const app = legacyExampleLessons.find(l => l.id === 'math-fraction-applications-6');
  assert.equal(scope[2], app);
  assert.equal(scope[0].exercises.length, 98);
  assert.deepEqual(consolidateFractionLessons(exampleLessons, legacyExampleLessons), exampleLessons);
  const saved = structuredClone(legacyExampleLessons);
  const compare = saved.find(l => l.id === 'math-fraction-compare-6');
  compare.blocks[0].text = 'Teacher prerequisite';
  compare.exercises[0].hint = 'Teacher hint';
  compare.knowledgeSummary = 'Teacher summary';
  const result = consolidateFractionLessons(saved, legacyExampleLessons);
  const merged = result.find(l => l.id === 'math-fractions-6');
  assert.ok(merged.blocks.some(b => b.text === 'Teacher prerequisite'));
  assert.equal(merged.exercises.find(e => e.id === compare.exercises[0].id).hint, 'Teacher hint');
  assert.equal(merged.knowledgeSummary, 'Teacher summary');
  assert.equal(result.find(l => l.id === app.id), saved.find(l => l.id === app.id));
  const full = structuredClone(saved);
  const source = full.find(l => l.id === 'math-fractions-6');
  source.exercises.push(...Array.from({length: 3}, (_, i) => ({...source.exercises[0], id: `custom-${i}`})));
  assert.ok(consolidateFractionLessons(full, legacyExampleLessons).some(l => l.id === compare.id));
});

test('mixed-format comparison and ordering lesson has mathematically correct unique choices', () => {
  const {fractionOrderLesson: lesson, addFractionOrderLesson} = load('fraction-order-lesson');
  const value = text => {
    const s = text.trim();
    if (s.includes(' ')) { const [whole, part] = s.split(' '); return Number(whole) + value(part); }
    if (s.includes('/')) { const [a,b] = s.split('/').map(Number); return a/b; }
    return Number(s.replace(',', '.'));
  };
  const extra = lesson.exercises.filter(e => e.section === 'extra');
  assert.equal(extra.length, 20);
  assert.equal(extra.filter(e => e.prompt.includes('tăng dần')).length, 4);
  assert.equal(extra.filter(e => e.prompt.includes('giảm dần')).length, 4);
  for (const e of lesson.exercises) {
    let valid;
    if (e.prompt.startsWith('Điền dấu')) {
      const [a,b] = e.prompt.replace('Điền dấu thích hợp: ', '').replace(/\.$/, '').split(' □ ').map(value);
      valid = e.options.filter(op => op === '<' ? a < b : op === '>' ? a > b : a === b);
    } else if (e.prompt.startsWith('Sắp xếp')) {
      const input = e.prompt.split(': ')[1].replace(/\.$/, '').split('; ').sort();
      const asc = e.prompt.includes('tăng dần');
      valid = e.options.filter(option => {
        assert.deepEqual(option.split('; ').sort(), input);
        const nums = option.split('; ').map(value);
        return nums.every((n,i) => !i || (asc ? nums[i-1] <= n : nums[i-1] >= n));
      });
    } else {
      const min = Math.min(...e.options.map(value));
      valid = e.options.filter(o => value(o) === min);
    }
    assert.deepEqual(valid, [e.answer], e.id);
  }
  const saved = {...structuredClone(lesson), title: 'Edited title'};
  const items = [saved];
  assert.equal(addFractionOrderLesson(items), items);
  assert.equal(addFractionOrderLesson([]).length, 1);
  const full = Array.from({length:100}, (_,i) => ({...saved, id: `custom-${i}`}));
  assert.equal(addFractionOrderLesson(full), full);
  const font = fs.readFileSync(path.join(__dirname, '../public/fonts/DejaVuSans.ttf'));
  for (const mode of ['worksheet', 'solutions']) {
    const bytes = load('pdf').createPracticePdf(lesson, mode, font);
    assert.equal(Buffer.from(bytes).subarray(0,8).toString(), '%PDF-1.7');
    if (process.env.MATH_PDF_QA_DIR) {
      fs.mkdirSync(process.env.MATH_PDF_QA_DIR, {recursive:true});
      fs.writeFileSync(path.join(process.env.MATH_PDF_QA_DIR, `order-${mode}.pdf`), bytes);
    }
  }
});

test('integer-to-fraction examples retain denominator one without changing final simplification', () => {
  const {wholeNumberFraction: format} = load('format');
  assert.equal(format('-2', '1', 'Số nguyên có thể viết thành phân số: -2 = '), null);
  assert.equal(format('3', '1', '3 = '), null);
  assert.equal(format('0', '1', '0 = '), null);
  assert.equal(format('1', '1', '6/6 = '), '1');
  assert.equal(format('-2', '1', '-4/2 = '), '-2');
  assert.equal(format('1', '1'), '1');
});
