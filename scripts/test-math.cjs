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
const { formatCalculationSteps } = load('format');
const { exampleLessons } = load('examples');
const { isMathPracticeEnabled } = load('availability');
const { encodeMathLesson, decodeMathLesson } = load('share');
const clone = () => structuredClone(packLessons(exampleLessons));
test('calculation continuations omit only a repeated question expression', () => {
  const { calculationContinuation: continuation } = load('format');
  assert.equal(continuation('Tính (-2)^2.', '(-2)^2 = (-2) × (-2) = 4.'), '= (-2) × (-2)\n= 4.');
  assert.equal(continuation('Tính (1/2)^2.', '(1/2)^2\n= 1/2 × 1/2\n= 1/4.'), '= 1/2 × 1/2\n= 1/4.');
  assert.equal(continuation('Tính 2^0.', '2^0 = 1.'), '= 1.');
  assert.equal(continuation('Tính 2^3 : 2^2.', '2^(3 - 2) = 2.'), '2^(3 - 2) = 2.');
  assert.equal(continuation('Tính (-2)^2.', '2^2 = 4.'), '2^2 = 4.');
  assert.equal(continuation('Tính 2^3.', 'Vì 2^3 = 8.'), 'Vì 2^3 = 8.');
});
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
test('pure calculation chains use aligned continuation steps without changing prose', () => {
  assert.equal(
    formatCalculationSteps('1/2 + 1/4 = 2/4 + 1/4 = 3/4.'),
    '1/2 + 1/4\n= 2/4 + 1/4\n= 3/4.'
  );
  assert.equal(
    formatCalculationSteps('Vậy 1/2 = 2/4 = 0,5.'),
    'Vậy 1/2 = 2/4 = 0,5.'
  );
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
test('math text renders centered question boxes for blanks without changing punctuation or fractions', () => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const source = ts.transpileModule(
    fs.readFileSync(
      path.join(__dirname, '../src/components/math/MathText.tsx'),
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
  const module = { exports: {} };
  new Function('exports', 'module', 'require', source)(
    module.exports,
    module,
    (name) => {
      if (name === '@/lib/math/format') return load('format');
      if (name === '@/lib/math/math-variable-glyph') return load('math-variable-glyph');
      if (name === './MathLesson.module.css')
        return { default: new Proxy({}, { get: (_, key) => key }) };
      return require(name);
    }
  );
  const { MathText } = module.exports;
  const render = (text) =>
    renderToStaticMarkup(React.createElement(MathText, null, text));
  const marker =
    '<span class="questionBox" role="img" aria-label="Ô trống cần điền"><span aria-hidden="true">?</span></span>';
  for (const text of [
    '□ × 7 = 42.',
    '□ : 5 = 8.',
    '54 : □ = 6.',
    '□ + □ = 12.',
    '2 □ 3',
  ]) {
    const html = render(text);
    assert.equal(html, text.replaceAll('□', marker));
  }
  assert.equal(render('Có bao nhiêu số?'), 'Có bao nhiêu số?');
  assert.equal(render('6 × 7 = 42.'), '6 × 7 = 42.');
  const variableHtml = render('6 × x = 2^x');
  assert.equal((variableHtml.match(/<svg /g) || []).length, 2);
  assert.ok(variableHtml.includes(load('math-variable-glyph').mathXPath));
  assert.ok(variableHtml.includes(`stroke-width="${load('math-variable-glyph').mathXStrokeWidth}"`));
  assert.ok(variableHtml.includes('>x</span>'));
  assert.equal(render('xe xanh'), 'xe xanh');
  assert.equal(
    render('(-3/5)^4'),
    '<span class="fractionPower"><span class="fractionGroup"><span aria-hidden="true" class="fractionBracket">(</span><span class="fraction" role="img" aria-label="-3 phần 5"><span aria-hidden="true">-3</span><span aria-hidden="true">5</span></span><span aria-hidden="true" class="fractionBracket">)</span></span><sup class="exponent">4</sup></span>'
  );
  assert.match(
    render('[(-1/2)^2]^2'),
    /class="nestedFractionPower"[\s\S]*class="outerFractionBracket">\[[\s\S]*<sup class="exponent">2<\/sup><\/span>/
  );
  assert.equal(
    render('a^m × a^n = a^(m + n).'),
    'a<sup class="exponent">m</sup> × a<sup class="exponent">n</sup> = a<sup class="exponent">m + n</sup>.'
  );
  assert.equal(
    render('(a^m)^n = a^(m × n).'),
    '(a<sup class="exponent">m</sup>)<sup class="exponent">n</sup> = a<sup class="exponent">m × n</sup>.'
  );
  assert.match(
    render('(1 + 1/2)^2 × 4/9.'),
    /class="groupedExpressionPower"><span class="groupedExpressionGroup"><span aria-hidden="true" class="fractionBracket">\([\s\S]*<span aria-hidden="true" class="fractionBracket">\)<\/span><\/span><sup class="exponent">2<\/sup><\/span> × <span class="fraction"/
  );
  assert.match(
    render('4 × (1/2 - 1/4)^2.'),
    /class="groupedExpressionPower"><span class="groupedExpressionGroup"><span aria-hidden="true" class="fractionBracket">\(<\/span><span><span class="fraction"[\s\S]* - <span class="fraction"[\s\S]*class="fractionBracket">\)<\/span><\/span><sup class="exponent">2<\/sup><\/span>/
  );
  const fraction = render('3/5 = □/20; 1/□; (□ + 1)/3');
  assert.equal((fraction.match(/class="questionBox"/g) || []).length, 3);
  assert.equal((fraction.match(/class="fraction"/g) || []).length, 4);
  assert.match(fraction, /aria-label="ô trống cần điền phần 20"/);
  assert.match(fraction, /aria-label="1 phần ô trống cần điền"/);
  assert.match(fraction, /aria-label="ô trống cần điền \+ 1 phần 3"/);
  assert.match(
    render('(~□~ × 2)/3'),
    /class="cancelledFactor"><span class="questionBox"/
  );
  const reciprocalCancellation = render('1/~4~ × (~4~ × 4)/1');
  assert.equal(
    (reciprocalCancellation.match(/class="cancelledFactor"/g) || []).length,
    2
  );
  assert.doesNotMatch(reciprocalCancellation, /~4~/);
  assert.match(
    render('4 × (1/4)^2\n= 1/4.'),
    /class="mathCalculationLine"><span>4 × [\s\S]*class="mathCalculationLine mathCalculationContinuation"><span class="mathCalculationEquals">=<\/span><span><span class="fraction"/
  );
  for (const lesson of [
    load('addition-subtraction-lesson').additionSubtractionLesson,
    load('multiplication-division-lesson').multiplicationDivisionLesson,
  ]) {
    const before = structuredClone(lesson);
    const texts = [
      ...lesson.blocks.map((block) => block.text),
      ...lesson.exercises.flatMap((exercise) => [
        exercise.prompt,
        exercise.solution,
      ]),
    ].filter((text) => text.includes('□'));
    assert.ok(texts.length > 0, lesson.id);
    for (const text of texts)
      assert.equal(
        (render(text).match(/class="questionBox"/g) || []).length,
        text.split('□').length - 1
      );
    assert.deepEqual(
      lesson,
      before,
      'previous lessons use the shared rendering without data migrations'
    );
  }
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
    ...exampleLessons.find((l) => l.id === 'math-rectangle-4').exercises[2],
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
    packLessons(
      exampleLessons.map(load('knowledge-summary').withKnowledgeSummary)
    )
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

test('every worksheet and solution page has the approved light background watermark, including custom lessons', () => {
  const { createPracticePdf } = load('pdf');
  const { numberLineLesson } = load('number-line-lesson');
  const font = fs.readFileSync(
    path.join(__dirname, '../public/fonts/DejaVuSans.ttf')
  );
  const custom = {
    ...structuredClone(numberLineLesson),
    id: 'future-custom-lesson',
    title: 'Bài học mới của giáo viên',
    knowledgeSummary: 'Ghi nhớ: Các đoạn đơn vị bằng nhau.\n'.repeat(70),
  };
  const before = structuredClone(custom);
  for (const lesson of [numberLineLesson, custom]) {
    for (const mode of ['worksheet', 'solutions']) {
      for (const includeKnowledgeSummary of [true, false]) {
        const bytes = createPracticePdf(lesson, mode, font, {
          includeKnowledgeSummary,
        });
        const source = Buffer.from(bytes).toString('latin1');
        const pageCount = Number(
          source.match(/\/Type \/Pages[^\n]+\/Count (\d+)/)[1]
        );
        assert.ok(pageCount > 1, 'exercise both first and continuation pages');
        const streams = [
          ...source.matchAll(
            /\d+ 0 obj\n<< \/Length \d+\s+>>\nstream\n([\s\S]*?)\nendstream/g
          ),
        ]
          .map((m) => m[1])
          .filter((s) => s.includes('BT /F1'));
        assert.equal(streams.length, pageCount);
        const unicode = new Map();
        for (const block of source.matchAll(
          /beginbfchar\n([\s\S]*?)endbfchar/g
        ))
          for (const pair of block[1].matchAll(/<([0-9a-f]+)> <([0-9a-f]+)>/g))
            unicode.set(pair[1], String.fromCodePoint(parseInt(pair[2], 16)));
        let positions;
        for (const stream of streams) {
          const background = stream.match(
            /^\/Artifact << \/Type \/Pagination \/Subtype \/Watermark >> BDC\nq\n([\s\S]*?)\nQ\nEMC\n/
          );
          assert.ok(
            background,
            'watermark comes before every foreground object, in isolated graphics state'
          );
          const marks = [
            ...background[1].matchAll(
              /BT \/F1 30 Tf 0\.975 0\.975 0\.975 rg 0\.866025 0\.5 -0\.5 0\.866025 ([\d.]+) ([\d.]+) Tm <([0-9a-f]+)> Tj ET/g
            ),
          ];
          assert.equal(marks.length, 1);
          assert.equal(background[1].split('\n').length, 1);
          for (const mark of marks)
            assert.equal(
              mark[3]
                .match(/.{4}/g)
                .map((g) => unicode.get(g))
                .join(''),
              'LIMA'
            );
          const current = marks.map((m) => [Number(m[1]), Number(m[2])]);
          if (positions)
            assert.deepEqual(
              current,
              positions,
              'same approved placement on continuation pages'
            );
          positions = current;
          assert.ok(current.every(([x, y]) => x > 44 && y > 100 && y < 700));
        }
      }
    }
  }
  assert.deepEqual(custom, before, 'watermark never changes lesson content');
});

test('PDF placeholders use centered vector question boxes in equations, fractions, summaries and solutions', () => {
  const { createPracticePdf } = load('pdf');
  const { multiplicationDivisionLesson } = load(
    'multiplication-division-lesson'
  );
  const font = fs.readFileSync(
    path.join(__dirname, '../public/fonts/DejaVuSans.ttf')
  );
  const base = multiplicationDivisionLesson.exercises.find(
    (e) => e.section === 'extra'
  );
  const lesson = {
    ...multiplicationDivisionLesson,
    knowledgeSummary: 'Ví dụ: □ + 18 = 45.',
    exercises: [
      {
        ...base,
        prompt: 'Điền số: □/20 = 3/5; 1/□ = 2/8. Vì sao?',
        solution: '□ = 12; □ = 4.',
      },
    ],
  };
  const before = structuredClone(lesson);
  for (const mode of ['worksheet', 'solutions']) {
    const bytes = createPracticePdf(lesson, mode, font);
    const source = Buffer.from(bytes).toString('latin1');
    const boxes = [
      ...source.matchAll(
        /\/Span << \/ActualText <FEFF25A1> >> BDC\nq [\d. ]+ RG [\d.]+ w ([\d.]+) ([\d.]+) ([\d.]+) ([\d.]+) re S Q\nBT \/F1 ([\d.]+) Tf [\d. ]+ rg 1 0 0 1 ([\d.]+) ([\d.]+) Tm <([0-9a-f]+)> Tj ET\nEMC/g
      ),
    ];
    assert.equal(boxes.length, mode === 'worksheet' ? 3 : 4);
    const spans = pdfTextRows(bytes, true);
    for (const match of boxes) {
      const [, x, y, width, height, size, tx, ty] = match.map((v, i) =>
        i === 0 ? v : Number(v)
      );
      assert.equal(width, height, 'square, not rectangular');
      const question = spans.find(
        (s) =>
          s.text === '?' &&
          Math.abs(s.left - tx) < 0.01 &&
          Math.abs(s.y - ty) < 0.01
      );
      assert.ok(question, 'question mark is real embedded-font text');
      assert.ok(
        Math.abs((question.left + question.right) / 2 - (x + width / 2)) < 0.02,
        'horizontally centered'
      );
      assert.ok(
        Math.abs(ty + size * 0.365 - (y + height / 2)) < 0.02,
        'vertically centered'
      );
    }
    assert.ok(
      spans.some((s) => s.text === 'sao?'),
      'ordinary question punctuation is not boxed'
    );
  }
  assert.deepEqual(lesson, before);
});

test('PDF missing-value answers precede the preserved method and never leak into worksheets', () => {
  const { createPracticePdf } = load('pdf');
  const { additionSubtractionLesson } = load('addition-subtraction-lesson');
  const { multiplicationDivisionLesson } = load(
    'multiplication-division-lesson'
  );
  const font = fs.readFileSync(
    path.join(__dirname, '../public/fonts/DejaVuSans.ttf')
  );
  for (const source of [
    additionSubtractionLesson,
    multiplicationDivisionLesson,
  ]) {
    for (const exercise of source.exercises.filter(
      (e) => e.section === 'extra' && e.prompt.includes('□') && !e.table
    )) {
      const lesson = { ...source, exercises: [exercise] };
      const before = structuredClone(lesson);
      const rows = pdfTextRows(createPracticePdf(lesson, 'solutions', font));
      const answer = rows.findIndex(
        (row) => row.text === `Đáp án: ${exercise.answer}`
      );
      const method = rows.findIndex((row) => row.text.startsWith('Cách làm:'));
      assert.ok(answer >= 0 && method > answer, exercise.prompt);
      assert.ok(
        rows[answer].page === rows[method].page &&
          rows[answer].y > rows[method].y
      );
      assert.ok(rows.some((row) => row.text.startsWith('Thử lại:')));
      const worksheet = pdfTextRows(
        createPracticePdf(lesson, 'worksheet', font)
      );
      assert.ok(
        !worksheet.some(
          (row) =>
            row.text.startsWith('Đáp án:') || row.text.startsWith('Cách làm:')
        )
      );
      assert.deepEqual(lesson, before);
    }
  }
});

test('all lessons share answer-first formatting except calculation-only working', () => {
  const {
    createPracticePdf,
    printableShortSolution,
    printableWordProblemRows,
  } = load('pdf');
  const font = fs.readFileSync(
    path.join(__dirname, '../public/fonts/DejaVuSans.ttf')
  );
  const before = structuredClone(exampleLessons);
  for (const lesson of exampleLessons) {
    if (!lesson.exercises.some((e) => e.section === 'extra')) continue;
    const eligible = lesson.exercises.filter(
      (e) =>
        e.section === 'extra' &&
        !e.table &&
        e.kind !== 'written' &&
        !printableWordProblemRows(e)
    );
    for (const e of eligible) {
      const answer =
        e.kind === 'choice'
          ? String.fromCharCode(65 + e.options.indexOf(e.answer))
          : `${e.answer}${e.unit ? ` ${e.unit}` : ''}`;
      const text = printableShortSolution(e);
      if (load('format').isCalculationOnlySolution(text))
        assert.equal(text, load('format').calculationContinuation(e.prompt, e.solution));
      else assert.ok(text.startsWith(`Đáp án: ${answer}`));
      if (e.solutionStyle !== 'answer-only' && text.includes('\n') && !load('format').isCalculationOnlySolution(text))
        assert.ok(text.endsWith(formatCalculationSteps(e.solution)));
    }
    const rows = pdfTextRows(createPracticePdf(lesson, 'solutions', font));
    assert.equal(
      rows.filter((r) => r.text.startsWith('Đáp án:')).length,
      eligible.filter(e => printableShortSolution(e).startsWith('Đáp án:')).length,
      lesson.id
    );
    assert.equal(
      rows.filter((r) => /^(Cách làm|Giải thích):/u.test(r.text)).length,
      eligible.filter((e) => /\n(Cách làm|Giải thích):/u.test(printableShortSolution(e))).length,
      lesson.id
    );
    const worksheet = pdfTextRows(createPracticePdf(lesson, 'worksheet', font));
    assert.ok(
      !worksheet.some((r) => /^(Đáp án|Cách làm|Giải thích):/u.test(r.text)),
      lesson.id
    );
  }
  const custom = {
    ...exampleLessons[0].exercises[0],
    kind: 'choice',
    table: undefined,
    options: ['3/4', '4/6', '2/6', '4/3'],
    answer: '4/6',
    solution: '2/3 = 4/6.',
  };
  assert.equal(
    printableShortSolution(custom),
    'Đáp án: B\nCách làm: 2/3 = 4/6.'
  );
  assert.ok(
    printableShortSolution({ ...custom, options: ['4/6', '3/4'] }).startsWith(
      'Đáp án: A\n'
    )
  );
  assert.deepEqual(exampleLessons, before);
});

test('conceptual solutions explain why, reading answers omit repetition, and upgrades preserve edits', async () => {
  const { unitFractionLesson, upgradeUnitFractionSolutions } = load(
    'unit-fraction-lesson'
  );
  const { printableShortSolution } = load('pdf');
  const lesson = structuredClone(unitFractionLesson);
  const pizza = lesson.exercises.find((e) => e.id === 'unit-3-e11');
  const reading = lesson.exercises.find((e) => e.id === 'unit-3-e13');
  assert.match(
    printableShortSolution(pizza),
    /\nGiải thích:.*8 miếng bằng nhau/u
  );
  assert.equal(printableShortSolution(reading), 'Đáp án: B. Một phần tư');
  assert.equal(
    printableShortSolution({
      ...reading,
      solutionStyle: undefined,
      solution: 'Một phần tư.',
    }),
    'Đáp án: B. Một phần tư'
  );
  assert.match(
    printableShortSolution({ ...pizza, solutionStyle: 'method' }),
    /\nCách làm:/u
  );
  assert.equal(
    parseMathPack(packLessons([lesson])).lessons[0].exercises.find(
      (e) => e.id === reading.id
    ).solutionStyle,
    'answer-only'
  );
  assert.equal(
    (await decodeMathLesson(await encodeMathLesson(lesson))).exercises.find(
      (e) => e.id === reading.id
    ).solutionStyle,
    'answer-only'
  );
  const invalid = structuredClone(packLessons([lesson]));
  invalid.lessons[0].exercises[0].solutionStyle = 'invalid';
  assert.throws(() => parseMathPack(invalid), /trình bày/u);
  pizza.solution = 'Nam đã ăn 1/8 chiếc pizza.';
  delete reading.solutionStyle;
  const upgraded = upgradeUnitFractionSolutions([lesson]);
  assert.match(
    upgraded[0].exercises.find((e) => e.id === pizza.id).solution,
    /8 miếng bằng nhau/u
  );
  assert.equal(
    upgraded[0].exercises.find((e) => e.id === reading.id).solutionStyle,
    'answer-only'
  );
  assert.deepEqual(upgradeUnitFractionSolutions(upgraded), upgraded);
  assert.equal(
    pizza.solution,
    'Nam đã ăn 1/8 chiếc pizza.',
    'input not mutated'
  );
  pizza.solution = 'Giáo viên giải thích theo hình minh họa.';
  assert.deepEqual(
    upgradeUnitFractionSolutions([lesson])[0].exercises.find(
      (e) => e.id === pizza.id
    ),
    pizza
  );
});

test('adaptive PDF columns preserve numbering, gutters, page bounds and full-width word problems', () => {
  const { createPracticePdf } = load('pdf');
  const font = fs.readFileSync(path.join(__dirname, '../public/fonts/DejaVuSans.ttf'));
  const base = exampleLessons.flatMap(l => l.exercises).find(e => e.section === 'extra' && e.kind === 'number');
  const exercises = Array.from({ length: 24 }, (_, i) => ({ ...base, task: undefined, id: `compact-${i}`, prompt: 'Tính 2 + 3.', answer: '5', solution: '2 + 3 = 5.', options: [], unit: '' }));
  exercises.push({ ...base, task: undefined, id: 'full-word', prompt: 'Có 10 quyển vở, chia đều cho 2 bạn. Mỗi bạn nhận bao nhiêu quyển?', answer: '5', solution: 'Số vở mỗi bạn nhận là:\n10 : 2 = 5 (quyển).\nĐáp số: 5 quyển.' });
  const lesson = { ...exampleLessons[0], exercises, knowledgeSummary: '' };
  for (const mode of ['worksheet', 'solutions']) {
    const rows = pdfTextRows(createPracticePdf(lesson, mode, font));
    const prompts = rows.filter(row => /^Bài \d+\./u.test(row.text));
    assert.deepEqual(prompts.map(r => Number(r.text.match(/^Bài (\d+)/u)[1])), exercises.map((_, i) => i + 1));
    assert.equal(prompts[0].y, prompts[1].y);
    assert.equal(prompts[1].y, prompts[2].y);
    assert.ok(prompts[0].right + 10 < prompts[1].left);
    assert.ok(prompts[1].right + 10 < prompts[2].left);
    assert.equal(prompts.at(-1).left, 44);
    for (const row of rows) {
      assert.ok(row.left >= 43.98 && row.right <= 551.3, row.text);
      assert.ok(row.y > 0 && row.y < 842, row.text);
    }
  }
});

test('grouped powers share the label and equation baseline with and without real fractions', () => {
  const { createPracticePdf } = load('pdf');
  const font = fs.readFileSync(path.join(__dirname, '../public/fonts/DejaVuSans.ttf'));
  const base = exampleLessons.flatMap(l => l.exercises).find(e => e.section === 'extra' && e.kind === 'number');
  for (const prompt of ['(x + 1)^2 = 2^2.', '(x - 2)^3 = 3^3.', '(x + 1)^2 = 1/2.', '(x + 1/2)^2 = 2.']) {
    const lesson = { ...exampleLessons[0], exercises: [{ ...base, task: undefined, prompt, solution: '1 = 1.', answer: '1' }], knowledgeSummary: '' };
    for (const mode of ['worksheet', 'solutions']) {
      const spans = pdfTextRows(createPracticePdf(lesson, mode, font), true);
      const start = spans.findIndex(row => row.text === 'Bài' && row.left === 44);
      const equals = spans.findIndex((row, i) => i > start && row.text === '=');
      const label = spans[start];
      const x = spans.slice(start, equals).find(row => row.text === 'x');
      assert.ok(x && equals > start, prompt);
      assert.ok(Math.abs(label.y - x.y) < 0.01, `${prompt}: base and label ${JSON.stringify(spans.slice(start, equals + 1))}`);
      assert.ok(Math.abs(label.y - spans[equals].y) < 0.01, `${prompt}: equals sign`);
      const exponent = spans.slice(start, equals).find(row => (row.text === '2' || row.text === '3') && row.y > label.y);
      assert.ok(exponent, 'exponent remains raised');
    }
  }
});

test('worksheet choices omit ruled lines and reserved workspace for every saved size', () => {
  const { createPracticePdf } = load('pdf');
  const { naturalLesson } = load('natural-example');
  const font = fs.readFileSync(
    path.join(__dirname, '../public/fonts/DejaVuSans.ttf')
  );
  const choice = naturalLesson.exercises.find(
    (e) => e.section === 'extra' && e.kind === 'choice'
  );
  const lesson = {
    ...naturalLesson,
    knowledgeSummary: '',
    exercises: Array.from({ length: 16 }, (_, i) => ({
      ...choice,
      id: `choice-${i}`,
    })),
  };
  for (const mode of ['worksheet', 'solutions']) {
    const baseline = createPracticePdf(lesson, mode, font);
    assert.equal(
      Buffer.from(baseline).toString('latin1').includes('0.85 0.88 0.92 RG'),
      false
    );
    for (const workspace of ['small', 'medium', 'large']) {
      const resized = {
        ...lesson,
        exercises: lesson.exercises.map((e) => ({ ...e, workspace })),
      };
      assert.deepEqual(createPracticePdf(resized, mode, font), baseline);
    }
  }
});

test('worksheets use solution-sized dotted writing rows, not saved fixed workspace sizes', () => {
  const { createPracticePdf } = load('pdf');
  const font = fs.readFileSync(
    path.join(__dirname, '../public/fonts/DejaVuSans.ttf')
  );
  const extra = exampleLessons
    .flatMap((lesson) => lesson.exercises)
    .filter((e) => e.section === 'extra');
  const lesson = {
    ...exampleLessons[0],
    knowledgeSummary: '',
    exercises: ['choice', 'number', 'fraction', 'written'].map((kind, i) => ({
      ...extra.find((e) => e.kind === kind),
      id: `mixed-${i}`,
      workspace: ['large', 'small', 'medium', 'large'][i],
    })),
  };
  assert.deepEqual(
    lesson.exercises.map((e) => e.kind),
    ['choice', 'number', 'fraction', 'written']
  );
  const lineCount = (mode) =>
    (
      Buffer.from(createPracticePdf(lesson, mode, font))
        .toString('latin1')
        .match(/1 J \[0 3\] 0 d/g) || []
    ).length;
  assert.ok(lineCount('worksheet') >= 6);
  assert.equal(lineCount('solutions'), 0);
  const base = lesson.exercises[1];
  const count = (solution, extra = {}) => (Buffer.from(createPracticePdf({ ...lesson, exercises: [{ ...base, ...extra, solution }] }, 'worksheet', font)).toString('latin1').match(/1 J \[0 3\] 0 d/g) || []).length;
  assert.equal(count('2 + 3 = 5.'), 1);
  assert.ok(count('2 + 3 = 5.\n5 + 4 = 9.\n9 + 1 = 10.') > count('2 + 3 = 5.'));
  assert.ok(count('1/2 + 1/3 = 5/6.') > count('2 + 3 = 5.'));
  assert.ok(count('Giải thích dài. '.repeat(50)) > count('2 + 3 = 5.'));
  assert.equal(count('2 + 3 = 5.', { workspace: 'small' }), count('2 + 3 = 5.', { workspace: 'large' }));
});

test('basic powers reserve only continuation steps and share the longest row', () => {
  const { rationalExponentsLesson: source } = load('rational-exponents-lesson');
  const exercises = source.exercises.filter(e => /^re-review-[1-5]$/.test(e.id));
  const font = fs.readFileSync(path.join(__dirname, '../public/fonts/DejaVuSans.ttf'));
  const exportWorksheet = items => load('pdf').createPracticePdf({ ...source, exercises: items }, 'worksheet', font, { includeKnowledgeSummary: false });
  const dots = bytes => [...Buffer.from(bytes).toString('latin1').matchAll(/1 J \[0 3\] 0 d ([\d.]+) ([\d.]+) m/g)];
  assert.deepEqual(exercises.map(e => dots(exportWorksheet([e])).length), [1, 1, 2, 2, 2]);
  const shared = dots(exportWorksheet(exercises.slice(0, 3)));
  assert.equal(shared.length, 6);
  const baselines = new Map();
  for (const [, left, y] of shared) baselines.set(left, [...(baselines.get(left) || []), y]);
  assert.equal(baselines.size, 3);
  for (const rows of baselines.values()) assert.deepEqual(rows, [...baselines.values()][0]);
});

test('both PDF exports omit practice-group headings and reserved space without changing question order', () => {
  const { createPracticePdf } = load('pdf');
  const font = fs.readFileSync(
    path.join(__dirname, '../public/fonts/DejaVuSans.ttf')
  );
  const groups = ['foundation', 'skills', 'application', 'challenge'];
  const lesson = structuredClone(exampleLessons[0]);
  lesson.exercises = lesson.exercises
    .filter((e) => e.section === 'extra')
    .map((e, i) => ({ ...e, task: undefined, group: groups[i % groups.length] }));
  const before = structuredClone(lesson);
  const withoutGroups = {
    ...lesson,
    exercises: lesson.exercises.map(({ group, ...e }) => e),
  };
  const headings = Object.values(load('lessons').EXTRA_GROUPS).map((label) =>
    label.toLocaleUpperCase('vi')
  );
  for (const mode of ['worksheet', 'solutions']) {
    const bytes = createPracticePdf(lesson, mode, font);
    assert.deepEqual(bytes, createPracticePdf(withoutGroups, mode, font));
    const rows = pdfTextRows(bytes);
    assert.ok(!rows.some((row) => headings.includes(row.text)), mode);
    assert.deepEqual(
      rows
        .filter((row) => /^Bài \d+\./u.test(row.text))
        .map((row) => Number(row.text.match(/^Bài (\d+)\./u)[1])),
      lesson.exercises.map((_, i) => i + 1)
    );
  }
  assert.deepEqual(lesson, before);
});

test('PDF filenames identify the brand, grade, specific lesson and document type', () => {
  const { practicePdfFilename } = load('pdf');
  const lesson = {
    grade: 6,
    topic: 'Số nguyên',
    title: 'Số nguyên: nhận biết, so sánh và tính toán',
  };
  assert.equal(
    practicePdfFilename(lesson, 'worksheet'),
    'LIMA - Lớp 6 - Số nguyên - nhận biết, so sánh và tính toán - Bài tập.pdf'
  );
  assert.equal(
    practicePdfFilename(lesson, 'solutions'),
    'LIMA - Lớp 6 - Số nguyên - nhận biết, so sánh và tính toán - Lời giải.pdf'
  );
  assert.notEqual(
    practicePdfFilename(lesson, 'worksheet'),
    practicePdfFilename(
      { ...lesson, title: 'Cộng và trừ số nguyên' },
      'worksheet'
    )
  );
  const filenames = exampleLessons.flatMap((item) =>
    ['worksheet', 'solutions'].map((mode) => practicePdfFilename(item, mode))
  );
  assert.equal(new Set(filenames).size, filenames.length);
});

test('PDF filenames normalize Vietnamese and remain safe and bounded for custom titles', () => {
  const { practicePdfFilename } = load('pdf');
  const lesson = {
    grade: 6,
    topic: 'Số học',
    title: '  .. Đếm: ước / bội \\ "nâng cao" <>?*|\u0000\u202E\n..  ',
  };
  const expected = 'LIMA - Lớp 6 - Đếm - ước bội nâng cao - Bài tập.pdf';
  assert.equal(practicePdfFilename(lesson, 'worksheet'), expected);
  assert.equal(
    practicePdfFilename(
      { ...lesson, title: lesson.title.normalize('NFD') },
      'worksheet'
    ),
    expected
  );
  assert.equal(
    practicePdfFilename({ ...lesson, title: ' /:*? ' }, 'worksheet'),
    'LIMA - Lớp 6 - Số học - Bài tập.pdf'
  );
  assert.equal(
    practicePdfFilename({ ...lesson, title: '', topic: '' }, 'solutions'),
    'LIMA - Lớp 6 - Bài học - Lời giải.pdf'
  );
  for (const mode of ['worksheet', 'solutions']) {
    const filename = practicePdfFilename(
      { ...lesson, grade: 12, title: 'Đếm số tự nhiên 🧮 '.repeat(40) },
      mode
    );
    assert.ok(Buffer.byteLength(filename, 'utf8') <= 240);
    assert.match(filename, /^LIMA - Lớp 12 - /u);
    assert.ok(
      filename.endsWith(
        `… - ${mode === 'worksheet' ? 'Bài tập' : 'Lời giải'}.pdf`
      )
    );
    assert.equal(Buffer.from(filename).toString('utf8'), filename);
    assert.equal(filename, filename.normalize('NFC'));
  }
});

test('PDF downloads use the descriptive filename for both document types', async (t) => {
  const { downloadPracticePdf, practicePdfFilename } = load('pdf');
  const font = fs.readFileSync(
    path.join(__dirname, '../public/fonts/DejaVuSans.ttf')
  );
  const downloads = [];
  const revoked = [];
  const originalDocument = Object.getOwnPropertyDescriptor(
    globalThis,
    'document'
  );
  globalThis.document = {
    createElement(tag) {
      assert.equal(tag, 'a');
      return {
        click() {
          downloads.push({ name: this.download, url: this.href });
        },
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
      assert.deepEqual(downloads.at(-1), {
        name: practicePdfFilename(lesson, mode),
        url: 'blob:math-pdf',
      });
    }
    assert.equal(downloads.length, 2);
    assert.deepEqual(revoked, ['blob:math-pdf', 'blob:math-pdf']);
  } finally {
    if (originalDocument)
      Object.defineProperty(globalThis, 'document', originalDocument);
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
  await assert.rejects(
    startPdfTask(async () => {
      throw new Error('PDF failed');
    }).promise,
    /PDF failed/
  );
  assert.equal(released, 3);
});

test('cancelling a stalled PDF import ignores late results and prevents late downloads', async () => {
  const { startPdfTask, waitForPdfTask } = load('pdf-task');
  let completeImport;
  let downloads = 0;
  const pendingImport = new Promise((resolve) => {
    completeImport = resolve;
  });
  const task = startPdfTask(async (signal) => {
    const exporter = await waitForPdfTask(pendingImport, signal);
    signal.throwIfAborted();
    await exporter.download();
  });
  await Promise.resolve();
  task.cancel();
  await assert.rejects(task.promise, /Đã hủy/);
  completeImport({
    download: async () => {
      downloads++;
    },
  });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(downloads, 0);
  const alreadyCancelled = startPdfTask(async () => {
    downloads++;
  });
  alreadyCancelled.cancel();
  await assert.rejects(alreadyCancelled.promise, /Đã hủy/);
  assert.equal(downloads, 0);
});

test('PDF font loading is cancellable before headers and during a stalled response body', async (t) => {
  const { downloadPracticePdf } = load('pdf');
  for (const stage of ['headers', 'body']) {
    let release;
    let entered;
    const started = new Promise((resolve) => {
      entered = resolve;
    });
    const pending = new Promise((resolve) => {
      release = resolve;
    });
    const controller = new AbortController();
    const fetchMock = t.mock.method(
      globalThis,
      'fetch',
      async (url, options) => {
        assert.equal(url, '/fonts/DejaVuSans.ttf');
        assert.equal(options.signal, controller.signal);
        if (stage === 'headers') {
          entered();
          return pending;
        }
        return {
          ok: true,
          arrayBuffer() {
            entered();
            return pending;
          },
        };
      }
    );
    const download = downloadPracticePdf(
      exampleLessons[0],
      'worksheet',
      {},
      controller.signal
    );
    await started;
    controller.abort(new Error('Stopped font loading'));
    await assert.rejects(download, /Stopped font loading/);
    release(
      stage === 'headers' ? new Response(new Uint8Array()) : new ArrayBuffer(0)
    );
    await new Promise((resolve) => setImmediate(resolve));
    fetchMock.mock.restore();
  }
  const aborted = new AbortController();
  aborted.abort(new Error('Already stopped'));
  await assert.rejects(
    downloadPracticePdf(exampleLessons[0], 'solutions', {}, aborted.signal),
    /Already stopped/
  );
});

test('knowledge summaries have sample defaults, preserve edits and do not guess custom content', () => {
  const { getKnowledgeSummary, withKnowledgeSummary } =
    load('knowledge-summary');
  for (const lesson of exampleLessons) {
    const summary = getKnowledgeSummary(lesson);
    assert.ok(summary.includes('Ví dụ:'));
    assert.ok(summary.includes('Lưu ý:'));
    assert.ok(summary.length < 1100);
    const saved = withKnowledgeSummary(lesson);
    assert.equal(getKnowledgeSummary({ ...saved, title: 'Tên mới' }), summary);
    assert.equal(getKnowledgeSummary({ ...lesson, knowledgeSummary: '' }), '');
    assert.equal(
      getKnowledgeSummary({ ...lesson, knowledgeSummary: 'Nội dung riêng.' }),
      'Nội dung riêng.'
    );
    assert.equal(
      getKnowledgeSummary({
        ...lesson,
        knowledgeSummary: undefined,
        title: 'Bài tự soạn khác',
      }),
      ''
    );
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
  const lesson = {
    ...structuredClone(exampleLessons[0]),
    knowledgeSummary: 'Ôn quy đồng.\nVí dụ: 2/7 + 1/3 = 13/21.',
  };
  for (const summary of [lesson.knowledgeSummary, '']) {
    lesson.knowledgeSummary = summary;
    const pack = packLessons([lesson]);
    assert.deepEqual(parseMathPack(JSON.parse(JSON.stringify(pack))), pack);
    const decoded = await decodeMathLesson(await encodeMathLesson(lesson));
    assert.equal(decoded.knowledgeSummary, summary);
    assert.equal(
      load('lessons').duplicateLesson(lesson).knowledgeSummary,
      summary
    );
    const XLSX = require('xlsx');
    const original = XLSX.writeFile;
    let book;
    XLSX.writeFile = (value) => {
      book = value;
    };
    try {
      load('workbook').exportMathWorkbook([lesson, exampleLessons[1]]);
    } finally {
      XLSX.writeFile = original;
    }
    const imported = load('workbook').importMathWorkbook(
      XLSX.write(book, { bookType: 'xlsx', type: 'array' })
    );
    assert.equal(imported.lessons[0].knowledgeSummary, summary);
    assert.equal(
      imported.lessons[1].knowledgeSummary,
      getKnowledgeSummary(exampleLessons[1])
    );
  }
  const defaultSnapshot = await decodeMathLesson(
    await encodeMathLesson(exampleLessons[0])
  );
  assert.equal(
    defaultSnapshot.knowledgeSummary,
    getKnowledgeSummary(exampleLessons[0])
  );
  for (const value of [null, 12, {}, 'a'.repeat(4001)]) {
    assert.throws(
      () =>
        parseMathPack(packLessons([{ ...lesson, knowledgeSummary: value }])),
      /Kiến thức cần nhớ/
    );
  }
});

test('PDF summaries are worksheet-only, optional, independent of answers and safely paginated', () => {
  const { createPracticePdf } = load('pdf');
  const font = fs.readFileSync(
    path.join(__dirname, '../public/fonts/DejaVuSans.ttf')
  );
  const lesson = structuredClone(exampleLessons[0]);
  const before = structuredClone(lesson);
  const withoutSummary = { ...lesson, knowledgeSummary: '' };
  const plain = createPracticePdf(withoutSummary, 'worksheet', font);
  const reviewed = createPracticePdf(lesson, 'worksheet', font);
  assert.notDeepEqual(reviewed, plain);
  assert.deepEqual(
    createPracticePdf(lesson, 'worksheet', font, {
      includeKnowledgeSummary: false,
    }),
    plain
  );
  assert.deepEqual(
    createPracticePdf(lesson, 'solutions', font, {
      includeKnowledgeSummary: true,
    }),
    createPracticePdf(withoutSummary, 'solutions', font, {
      includeKnowledgeSummary: false,
    })
  );
  const privateEdit = {
    ...lesson,
    teacherNotes: 'Riêng tư 🧮',
    exercises: lesson.exercises.map((e) => ({
      ...e,
      solution: 'Lời giải không in 🧮',
    })),
  };
  // Solution length may now change writing space, but its content stays hidden.
  const privateRows = pdfTextRows(createPracticePdf(privateEdit, 'worksheet', font));
  assert.ok(!privateRows.some(row => /Riêng tư|Lời giải không in/u.test(row.text)));
  const longSummary = {
    ...lesson,
    knowledgeSummary: 'Ghi nhớ quy tắc.\n'.repeat(180),
  };
  const pageCount = (bytes) =>
    Number(
      Buffer.from(bytes)
        .toString('latin1')
        .match(/\/Count (\d+)/)[1]
    );
  assert.ok(
    pageCount(createPracticePdf(longSummary, 'worksheet', font)) >
      pageCount(reviewed)
  );
  const unsupported = { ...lesson, knowledgeSummary: 'Ký tự chưa hỗ trợ 🧮' };
  assert.throws(
    () => createPracticePdf(unsupported, 'worksheet', font),
    /Phông PDF/
  );
  assert.deepEqual(
    createPracticePdf(unsupported, 'worksheet', font, {
      includeKnowledgeSummary: false,
    }),
    plain
  );
  assert.deepEqual(lesson, before);
});

test('PDF exports ignore input instructions regardless of their wording', () => {
  const { createPracticePdf } = load('pdf');
  const font = fs.readFileSync(
    path.join(__dirname, '../public/fonts/DejaVuSans.ttf')
  );
  const lesson = structuredClone(load('rational-example').rationalLesson);
  // This is legitimate question content, not UI guidance to be stripped.
  lesson.exercises.find((e) => e.id === 'r-ex-22').prompt =
    'Giải thích ý nghĩa của yêu cầu “Nhập phân số.”';
  const withoutInstructions = structuredClone(lesson);
  const withInstructions = structuredClone(lesson);
  for (const e of withoutInstructions.exercises) delete e.inputInstruction;
  for (const e of withInstructions.exercises)
    e.inputInstruction =
      'Hướng dẫn hoàn toàn mới: chọn ô bên phải rồi bấm nút tiếp tục. 🧮';
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
  const updated = parseMathPack(legacy).lessons.find(
    (l) => l.id === rational.id
  );
  assert.deepEqual(
    updated.exercises.find((e) => e.id === custom.id),
    custom
  );
  assert.deepEqual(
    updated.exercises.find((e) => e.id === explicit.id),
    explicit
  );
});

test('input instructions validate and survive JSON, sharing and duplication', async () => {
  const lesson = structuredClone(exampleLessons[0]);
  lesson.exercises[0].inputInstruction =
    'Chọn một trong các đáp án rồi tiếp tục.';
  const pack = packLessons([lesson]);
  assert.deepEqual(parseMathPack(JSON.parse(JSON.stringify(pack))), pack);
  const decoded = await decodeMathLesson(await encodeMathLesson(lesson));
  assert.equal(
    decoded.exercises[0].inputInstruction,
    lesson.exercises[0].inputInstruction
  );
  const copied = applyImport([], [lesson], {});
  assert.equal(
    copied[0].exercises[0].inputInstruction,
    lesson.exercises[0].inputInstruction
  );
  for (const value of [null, 12, {}, 'a'.repeat(1001)]) {
    lesson.exercises[0].inputInstruction = value;
    assert.throws(
      () => parseMathPack(packLessons([lesson])),
      /Hướng dẫn nhập đáp án/
    );
  }
});

test('PDF word problems use Vietnamese statements, direct calculations and answers', () => {
  const { printableWordProblemSolution } = load('pdf');
  const cases = [
    ['i-extra-13', 'Nhiệt độ mới là:', '(-4) + 9', '5 (°C)', '5 °C'],
    ['i-extra-14', 'Độ cao mới là:', '(-12) − 7', '-19 (m)', '-19 m'],
    [
      'i-extra-15',
      'An được số điểm là:',
      '4 × 5 + 3 × (-2)',
      '14 (điểm)',
      '14 điểm',
    ],
    [
      'i-extra-18',
      'Tổng thay đổi điểm là:',
      '4 × (-3)',
      '-12 (điểm)',
      '-12 điểm',
    ],
    [
      'fraction-extra-15',
      'Tổng chiều dài là:',
      '2/5 + 1/4',
      '13/20 (m)',
      '13/20 m',
    ],
    [
      'fraction-extra-16',
      'Mai đã đọc số phần quyển sách là:',
      '1/3 + 1/6',
      '1/2 (quyển sách)',
      '1/2 quyển sách',
    ],
    [
      'fraction-extra-17',
      'Trong bình có số lít nước là:',
      '3/8 + 1/4',
      '5/8 (lít)',
      '5/8 lít',
    ],
    [
      'fraction-extra-18',
      'Tổng thời gian là:',
      '1/2 + 1/3',
      '5/6 (giờ)',
      '5/6 giờ',
    ],
    ['r-ex-21', 'Nhiệt độ mới là:', '-2,5 + 3,75', '1,25 (°C)', '1,25 °C'],
    [
      'r-ex-22',
      'Số lít còn lại là:',
      '3/4 − 1/3 + 1/6',
      '7/12 (lít)',
      '7/12 lít',
    ],
    ['r-ex-23', 'Tổng quãng đường là:', '2/5 + 3/4', '23/20 (km)', '23/20 km'],
    [
      'r-ex-24',
      'Số nghìn đồng còn lại là:',
      '150 − 62,5 + 20',
      '107,5 (nghìn đồng)',
      '107,5 nghìn đồng',
    ],
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
    {
      solution:
        'Điểm câu đúng: 4 × 5 = 20. Điểm câu sai: 3 × (-2) = -6. Tổng: 14 điểm.',
    },
    { solution: '4 × 5 + 3 × (-2) = 20 + (-6) = 15 (điểm).' },
    { prompt: e.prompt + ' An trả lời đúng bao nhiêu câu?' },
    { unit: 'm' },
    { kind: 'written' },
  ])
    assert.equal(printableWordProblemSolution({ ...e, ...change }), null);
});

test('word-problem PDF rows preserve authored steps and select workbook alignments', () => {
  const { printableWordProblemRows } = load('pdf');
  const natural = load('natural-example').naturalLesson;
  const single = natural.exercises.find((e) =>
    e.solution.startsWith('Số vở mỗi bạn')
  );
  const multiple = natural.exercises.find((e) =>
    e.solution.startsWith('Tổng số bút')
  );
  const before = structuredClone(multiple);
  for (const exercise of [single, multiple]) {
    const rows = printableWordProblemRows(exercise);
    assert.deepEqual(rows[0], {
      text: 'Bài giải:',
      role: 'heading',
      align: 'center',
    });
    assert.equal(
      rows
        .slice(1)
        .map((row) => row.text)
        .join('\n'),
      exercise.solution
    );
    assert.deepEqual(
      rows.map((row) => row.align),
      exercise === single
        ? ['center', 'center', 'center', 'left']
        : ['center', 'center', 'center', 'center', 'center', 'left']
    );
  }
  assert.deepEqual(multiple, before);
  assert.deepEqual(
    printableWordProblemRows({
      ...single,
      solution: `Lời giải: ${single.solution}`,
    }),
    printableWordProblemRows(single)
  );
  assert.deepEqual(
    printableWordProblemRows({
      ...single,
      solution: `Bài giải:\n${single.solution}`,
    }),
    printableWordProblemRows(single)
  );
  const prose = natural.exercises.find((e) => e.solution.startsWith('53 ='));
  assert.equal(printableWordProblemRows(prose)[1].align, 'center');
  const fraction = load('rational-example').rationalLesson.exercises.find(
    (e) => e.id === 'r-ex-22'
  );
  const fractionRows = printableWordProblemRows(fraction);
  assert.equal(fractionRows[2].text, '3/4 − 1/3 + 1/6 = 7/12 (lít)');
  assert.equal(fractionRows[2].align, 'center');
  assert.equal(fractionRows[3].text, 'Đáp số: 7/12 lít');
  const divisibility = load('natural-example').divisibilityLesson;
  const gcd = divisibility.exercises.find((e) =>
    e.solution.includes('Đáp số: 6 túi.')
  );
  assert.equal(
    printableWordProblemRows(gcd).find((row) => row.text.startsWith('ƯCLN'))
      .align,
    'center'
  );
  assert.equal(printableWordProblemRows({ ...single, kind: 'choice' }), null);
  assert.equal(
    printableWordProblemRows({ ...single, solution: '48 : 6 = 8.' }),
    null
  );
});

test('all lessons share the Grade 4 word-problem format, including fraction cancellation', () => {
  const { printableWordProblemRows } = load('pdf');
  const before = structuredClone(exampleLessons);
  const reference = exampleLessons
    .find((l) => l.id === 'math-fraction-of-number-4')
    .exercises.find((e) => e.id === 'math-fraction-of-number-4-q17');
  const shape = printableWordProblemRows(reference).map(({ role, align }) => ({
    role,
    align,
  }));
  const lesson = exampleLessons.find(
    (l) => l.id === 'math-fraction-multiply-6'
  );
  const cases = [
    ['q19', '(3/4) × (2/3) = 1/2 (cốc).', 'Đáp số: 1/2 cốc.'],
    ['q20', '(3/4) : (1/8) = 6 (chai).', 'Đáp số: 6 chai.'],
    ['q21', '(5/6) × (3/5) = 1/2 (ha).', 'Đáp số: 1/2 ha.'],
    ['q22', '(7/8) : (7/32) = 4 (đoạn).', 'Đáp số: 4 đoạn.'],
  ];
  for (const [id, calculation, answer] of cases) {
    const e = lesson.exercises.find((e) => e.id === `${lesson.id}-${id}`);
    const rows = printableWordProblemRows(e);
    assert.deepEqual(
      rows.map(({ role, align }) => ({ role, align })),
      shape,
      id
    );
    assert.equal(rows[1].text, e.solution.split('\n')[0]);
    assert.equal(rows[2].text, calculation, id);
    assert.equal(rows[3].text, answer, id);
  }
  for (const l of exampleLessons)
    for (const e of l.exercises) {
      if (
        e.section !== 'extra' ||
        e.kind === 'choice' ||
        !/\nĐáp số:/u.test(e.solution)
      )
        continue;
      const rows = printableWordProblemRows(e);
      assert.ok(rows, e.id);
      assert.equal(rows[0].text, 'Bài giải:', e.id);
      assert.equal(rows.at(-1).align, 'left', e.id);
      assert.ok(
        rows.slice(0, -1).every((row) => row.align === 'center'),
        e.id
      );
    }
  assert.deepEqual(
    exampleLessons,
    before,
    'formatting must not change stored or online working'
  );
});

test('future authored solutions opt into workbook layout by structure, not arithmetic notation', () => {
  const { printableWordProblemRows } = load('pdf');
  const exercise = {
    ...exampleLessons[0].exercises[0],
    kind: 'written',
    id: 'future-word-problem',
  };
  for (const working of [
    'Cạnh hình vuông là:\n√64 = 8 (m).',
    'Cạnh hình vuông là:\nx = 24 : 3 = 8 (m).',
    '24 : 3 = 8 (m).',
    'Đếm trên hình có tám đoạn bằng nhau.',
  ]) {
    const rows = printableWordProblemRows({
      ...exercise,
      solution: `  Bài giải:\n${working}\nĐÁP SỐ: 8 (m).\n`,
    });
    assert.equal(rows[0].text, 'Bài giải:');
    assert.equal(
      rows
        .slice(1, -1)
        .map((row) => row.text)
        .join('\n'),
      working
    );
    assert.ok(rows.slice(0, -1).every((row) => row.align === 'center'));
    assert.deepEqual(rows.at(-1), {
      text: 'Đáp số: 8 m.',
      role: 'answer',
      align: 'left',
    });
  }
  const multiple = {
    ...exercise,
    solution:
      'Số bút ban đầu là:\n12 × 5 = 12 + 12 + 12 + 12 + 12 = 60 (chiếc).\nSố bút còn lại là:\n60 − 18 = 60 − 10 − 8 = 42 (chiếc).\nĐáp số: 42 chiếc bút.',
  };
  assert.deepEqual(
    printableWordProblemRows(multiple).map((row) => row.text),
    [
      'Bài giải:',
      'Số bút ban đầu là:',
      '12 × 5 = 60 (chiếc).',
      'Số bút còn lại là:',
      '60 − 18 = 42 (chiếc).',
      'Đáp số: 42 chiếc bút.',
    ]
  );
  assert.equal(
    printableWordProblemRows({ ...exercise, solution: 'Đáp số: 8 m.' }),
    null
  );
  assert.equal(printableWordProblemRows({ ...multiple, kind: 'choice' }), null);
});

// Decode our uncompressed PDF text operators to test physical alignment, not
// just the formatting metadata. Fractions also receive visual render checks.
function pdfTextRows(bytes, separateSpans = false) {
  const source = Buffer.from(bytes).toString('latin1');
  const unicode = new Map();
  for (const block of source.matchAll(/beginbfchar\n([\s\S]*?)endbfchar/g))
    for (const pair of block[1].matchAll(/<([0-9a-f]+)> <([0-9a-f]+)>/g))
      unicode.set(pair[1], String.fromCodePoint(parseInt(pair[2], 16)));
  const widths = new Map(
    [...source.match(/\/W \[(.*)\] >>/)[1].matchAll(/(\d+) \[([\d.]+)\]/g)].map(
      (match) => [Number(match[1]), Number(match[2])]
    )
  );
  const rows = [];
  let page = 0;
  for (const stream of source.matchAll(
    /\d+ 0 obj\n<< \/Length \d+\s+>>\nstream\n([\s\S]*?)\nendstream/g
  )) {
    if (!stream[1].includes('BT /F1')) continue;
    const baselines = new Map();
    for (const op of stream[1].matchAll(
      /BT \/F1 ([\d.]+) Tf [\d. ]+ rg 1 0 (?:0|0\.2) 1 ([\d.-]+) ([\d.-]+) Tm <([0-9a-f]+)> Tj ET/g
    )) {
      const [, size, x, y, hex] = op;
      const glyphs = hex.match(/.{4}/g);
      const text = glyphs.map((glyph) => unicode.get(glyph)).join('');
      const width = glyphs.reduce(
        (sum, glyph) =>
          sum + (widths.get(parseInt(glyph, 16)) * Number(size)) / 1000,
        0
      );
      if (separateSpans) {
        rows.push({
          text,
          left: Number(x),
          right: Number(x) + width,
          y: Number(y),
          page,
        });
        continue;
      }
      // Independent column cells can share a baseline but are separate text rows.
      const block = stream[1].slice(0, op.index).split('/Exercise BMC').length;
      const baselineKey = `${block}:${y}`;
      const row = baselines.get(baselineKey) || {
        text: '',
        left: Number(x),
        right: Number(x),
        y: Number(y),
        page,
      };
      row.text += text;
      row.left = Math.min(row.left, Number(x));
      row.right = Math.max(row.right, Number(x) + width);
      baselines.set(baselineKey, row);
    }
    rows.push(...baselines.values());
    page++;
  }
  return rows;
}

test('exported fraction word problems physically match the reference workbook layout', () => {
  const { createPracticePdf } = load('pdf');
  const font = fs.readFileSync(
    path.join(__dirname, '../public/fonts/DejaVuSans.ttf')
  );
  const lesson = structuredClone(
    exampleLessons.find((l) => l.id === 'math-fraction-multiply-6')
  );
  lesson.id = 'future-fraction-word-problems';
  lesson.title = 'Bài toán có lời văn';
  lesson.grade = 5;
  lesson.exercises = lesson.exercises.filter((e) =>
    /-q(19|20|21|22)$/u.test(e.id)
  ).map(({ task, ...e }) => e);
  const rows = pdfTextRows(createPracticePdf(lesson, 'solutions', font));
  assert.equal(rows.filter((row) => row.text === 'Bài giải:').length, 4);
  assert.ok(!rows.some((row) => row.text.startsWith('Lời giải:')));
  const answers = rows.filter((row) => row.text.startsWith('Đáp số:'));
  assert.equal(answers.length, 4);
  for (const answer of answers) {
    const calculation = rows
      .slice(0, rows.indexOf(answer))
      .findLast((row) => row.text.includes(' = '));
    assert.ok(Math.abs(answer.left - 595.28 / 2) < 0.02, answer.text);
    assert.ok(answer.y < calculation.y);
    assert.equal(answer.page, calculation.page);
    assert.equal((calculation.text.match(/=/gu) || []).length, 1);
  }
  for (const row of rows.filter(
    (row) => row.text === 'Bài giải:' || row.text.endsWith('là:')
  )) {
    assert.ok(
      Math.abs((row.left + row.right) / 2 - 595.28 / 2) < 0.02,
      row.text
    );
  }
  const worksheet = pdfTextRows(createPracticePdf(lesson, 'worksheet', font));
  assert.ok(
    !worksheet.some((row) => /Bài giải:|Lời giải:|Đáp số:/u.test(row.text))
  );
  assert.equal(
    worksheet.filter((row) => /^Bài \d+\./u.test(row.text)).length,
    4
  );
});

test('mixed solution PDFs keep the next calculation question with its working', () => {
  const { createPracticePdf } = load('pdf');
  const font = fs.readFileSync(
    path.join(__dirname, '../public/fonts/DejaVuSans.ttf')
  );
  const lesson = exampleLessons.find(
    (l) => l.id === 'math-fraction-multiply-6'
  );
  const rows = pdfTextRows(createPracticePdf(lesson, 'solutions', font));
  const { exerciseLabels } = load('exercise-groups');
  const expected = exerciseLabels(lesson.exercises.filter(e => e.section === 'extra'))[18].prompt;
  const promptIndex = rows.findIndex((row) => row.text.startsWith(expected.slice(0, 12)));
  const solution = rows[promptIndex + 1];
  assert.ok(promptIndex >= 0 && solution);
  assert.equal(rows[promptIndex].page, solution.page);
});

test('PDF omits redundant fraction parentheses but keeps negative operands grouped', () => {
  const { createPracticePdf } = load('pdf');
  const font = fs.readFileSync(
    path.join(__dirname, '../public/fonts/DejaVuSans.ttf')
  );
  const lesson = structuredClone(
    load('fraction-lessons').fractionLessons.find(
      (item) => item.id === 'math-fraction-multiply-6'
    )
  );
  lesson.knowledgeSummary = '';
  lesson.exercises = lesson.exercises.filter((e) =>
    ['math-fraction-multiply-6-q5', 'math-fraction-multiply-6-q7'].includes(
      e.id
    )
  );
  for (const mode of ['worksheet', 'solutions']) {
    const bytes = createPracticePdf(lesson, mode, font);
    const rows = pdfTextRows(bytes);
    const positive = rows.find((row) => row.text.startsWith('Bài 1. Tính'));
    const negative = rows.find((row) => row.text.startsWith('Bài 2. Tính'));
    assert.ok(positive && negative, mode);
    assert.doesNotMatch(positive.text, /[()]/u, mode);
    // Tall delimiters use a vertically transformed text matrix, which this
    // lightweight extractor intentionally does not include in its text rows.
    assert.equal((negative.text.match(/[()]/gu) || []).length, 0, mode);
    if (mode === 'solutions') {
      const solution = rows[rows.indexOf(positive) + 1];
      assert.ok(solution, mode);
      assert.doesNotMatch(solution.text, /[()]/u, mode);
    }
    if (process.env.MATH_PDF_QA_DIR) {
      fs.mkdirSync(process.env.MATH_PDF_QA_DIR, { recursive: true });
      fs.writeFileSync(
        path.join(
          process.env.MATH_PDF_QA_DIR,
          `fraction-parentheses-${mode}.pdf`
        ),
        bytes
      );
    }
  }
});

test('solution PDF centers working and starts the answer below the midpoint of the final calculation', () => {
  const { createPracticePdf } = load('pdf');
  const font = fs.readFileSync(
    path.join(__dirname, '../public/fonts/DejaVuSans.ttf')
  );
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
  const statementIndex = rows.findIndex(
    (row) => row.text === 'Tổng số bút là:'
  );
  assert.ok(statementIndex > 0);
  const block = rows.slice(
    statementIndex - 1,
    statementIndex - 1 + expected.length
  );
  const calculationMidpoint = (block.at(-2).left + block.at(-2).right) / 2;
  const prompt = rows
    .slice(0, statementIndex - 1)
    .findLast((row) => row.text.startsWith('Bài 12.'));
  assert.equal(prompt.left, 44);
  const singleStatement = rows.find(
    (row) => row.text === 'Số vở mỗi bạn nhận được là:'
  );
  assert.ok(
    Math.abs((singleStatement.left + singleStatement.right) / 2 - 595.28 / 2) <
      0.02
  );
  for (const [index, [text, align]] of expected.entries()) {
    const row = block[index];
    assert.equal(row.text, text);
    const actual = align === 'center' ? (row.left + row.right) / 2 : row.left;
    const target = align === 'center' ? 595.28 / 2 : calculationMidpoint;
    assert.ok(
      Math.abs(actual - target) < 0.02,
      `${text}: ${actual} vs ${target}`
    );
    assert.equal(row.page, prompt.page);
    if (index) assert.ok(row.y < block[index - 1].y);
  }
  assert.ok(!rows.some((row) => row.text.startsWith('Lời giải: Số vở')));
  const singleAnswer = rows.find((row) => row.text === 'Đáp số: 8 quyển vở.');
  const singleCalculation = rows.find(
    (row) => row.text === '48 : 6 = 8 (quyển).'
  );
  assert.ok(
    Math.abs(
      singleAnswer.left - (singleCalculation.left + singleCalculation.right) / 2
    ) < 0.02
  );
  assert.ok(singleAnswer.y < singleCalculation.y);
  const busCalculation = rows.find((row) => row.text === '6 + 1 = 7 (xe).');
  const busAnswer = rows.find((row) => row.text === 'Đáp số: 7 xe.');
  assert.ok(
    Math.abs(
      busAnswer.left - (busCalculation.left + busCalculation.right) / 2
    ) < 0.02
  );
  assert.ok(busAnswer.y < busCalculation.y);
});

test('answer starts at the midpoint for fractions and wrapped calculations, with margin-safe long answers', () => {
  const { createPracticePdf } = load('pdf');
  const font = fs.readFileSync(
    path.join(__dirname, '../public/fonts/DejaVuSans.ttf')
  );
  const lesson = structuredClone(load('natural-example').naturalLesson);
  const exercise = lesson.exercises.find((e) =>
    e.solution.startsWith('Số vở mỗi bạn')
  );
  exercise.solution =
    'Số phần là:\n1/12 + 2/12 + 3/12 + 1/12 = 7/12 (phần).\nĐáp số: 7/12 phần.';
  lesson.exercises = [exercise];
  const fractionRows = pdfTextRows(
    createPracticePdf(lesson, 'solutions', font)
  );
  const calculation = fractionRows.find(
    (row) => row.text.includes(' = ') && row.text.endsWith('(phần).')
  );
  const answer = fractionRows.find((row) => row.text.startsWith('Đáp số:'));
  assert.ok(Math.abs(answer.left - 595.28 / 2) < 0.02);
  assert.ok(answer.y < calculation.y);
  assert.ok(answer.right < 595.28 - 44);

  for (const count of [24, 40]) {
    exercise.solution = `Số vở là:\n${Array(count).fill('1').join(' + ')} = ${count} (quyển).\nĐáp số: ${count} quyển vở.`;
    const wrappedRows = pdfTextRows(
      createPracticePdf(lesson, 'solutions', font)
    );
    assert.ok(
      wrappedRows.filter((row) => row.text.startsWith('1 +')).length > 1
    );
    const finalCalculationLine = wrappedRows.find((row) =>
      row.text.endsWith(`= ${count} (quyển).`)
    );
    const wrappedAnswer = wrappedRows.find(
      (row) => row.text === `Đáp số: ${count} quyển vở.`
    );
    const answerWidth = wrappedAnswer.right - wrappedAnswer.left;
    const midpoint =
      (finalCalculationLine.left + finalCalculationLine.right) / 2;
    const expectedStart = Math.min(midpoint, 595.28 - 44 - answerWidth);
    assert.ok(Math.abs(wrappedAnswer.left - expectedStart) < 0.02);
    assert.ok(wrappedAnswer.y < finalCalculationLine.y);
  }

  for (const explanation of [
    'Số vở mỗi bạn nhận được là:',
    'Giải thích các bước tính thật cẩn thận. '.repeat(16).trim(),
  ]) {
    exercise.solution = `${explanation}\n48 : 6 = 8 (quyển).\nĐáp số: ${'8 quyển vở cho mỗi bạn; '.repeat(12).trim()}`;
    const rows = pdfTextRows(createPracticePdf(lesson, 'solutions', font));
    const answerIndex = rows.findIndex((row) => row.text.startsWith('Đáp số:'));
    const answers = rows.slice(answerIndex).filter((row) => row.y > 50);
    assert.ok(answers.length > 1, 'long answers wrap');
    for (const row of answers) {
      assert.equal(row.left, 44, row.text);
      assert.ok(row.right <= 595.28 - 44 + 0.02, row.text);
    }
  }
});

test('long workbook solutions wrap safely and keep every step without orphaning the heading', () => {
  const { createPracticePdf } = load('pdf');
  const font = fs.readFileSync(
    path.join(__dirname, '../public/fonts/DejaVuSans.ttf')
  );
  const lesson = structuredClone(load('natural-example').naturalLesson);
  const exercise = lesson.exercises.find((e) =>
    e.solution.startsWith('Số vở mỗi bạn')
  );
  exercise.solution = [
    ...Array.from(
      { length: 45 },
      (_, i) =>
        `Bước ${i + 1}: Số quyển vở mỗi bạn nhận được là:\n48 : 6 = 8 (quyển).`
    ),
    'Đáp số: ' + '8 quyển vở cho mỗi bạn; '.repeat(20),
  ].join('\n');
  lesson.exercises = [exercise];
  const rows = pdfTextRows(createPracticePdf(lesson, 'solutions', font));
  assert.equal(
    rows.filter((row) => row.text === '48 : 6 = 8 (quyển).').length,
    45
  );
  const titleIndex = rows.findIndex((row) => row.text === 'Bài giải:');
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
            ...(!type || node.type === type ? [node] : []),
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
  assert.equal(
    rationalLesson.exercises.filter((e) => e.section === 'extra').length,
    24
  );
  const full = Array.from({ length: 100 }, (_, i) => ({
    ...existing,
    id: `custom-${i}`,
  }));
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
  const full = Array.from({ length: 100 }, (_, i) => ({
    ...saved,
    id: `saved-${i}`,
  }));
  assert.equal(addBuiltInIntegerLesson(full), full);
  const extra = integerLesson.exercises.filter((e) => e.section === 'extra');
  assert.equal(extra.length, 24);
  assert.deepEqual(
    ['foundation', 'skills', 'application', 'challenge'].map(
      (group) => extra.filter((e) => e.group === group).length
    ),
    [5, 9, 7, 3]
  );
  const signed = extra.find((e) => e.id === 'i-extra-13');
  assert.equal(checkAnswer(signed, '5').correct, true);
  assert.equal(checkAnswer(signed, '-5').correct, false);
  const font = fs.readFileSync(
    path.join(__dirname, '../public/fonts/DejaVuSans.ttf')
  );
  for (const mode of ['worksheet', 'solutions']) {
    const bytes = load('pdf').createPracticePdf(integerLesson, mode, font);
    assert.equal(Buffer.from(bytes).subarray(0, 8).toString(), '%PDF-1.7');
  }
});

test('set content upgrades preserve edits and are idempotent', () => {
  const { addSetContent } = load('migrations');
  const originals = exampleLessons.filter((l) =>
    ['math-integers-6', 'math-rational-7'].includes(l.id)
  );
  const old = structuredClone(originals).map((l) => ({
    ...l,
    blocks: l.blocks.filter((b) => !b.id.includes('-sets-')),
    exercises: l.exercises.filter((e) => !e.id.includes('-sets-')),
  }));
  const upgraded = addSetContent(old);
  parseMathPack(packLessons(upgraded));
  assert.deepEqual(addSetContent(upgraded), upgraded);
  upgraded[0].blocks.find((b) => b.id.includes('-sets-')).text =
    'Teacher version';
  assert.deepEqual(addSetContent(upgraded), upgraded);
  for (const l of upgraded) {
    assert.equal(l.exercises.filter((e) => e.id.includes('-sets-')).length, 6);
    const font = fs.readFileSync(
      path.join(__dirname, '../public/fonts/DejaVuSans.ttf')
    );
    for (const mode of ['worksheet', 'solutions'])
      load('pdf').createPracticePdf(l, mode, font);
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
  const full = Array.from({ length: 100 }, (_, i) => ({
    ...existing,
    id: `full-${i}`,
  }));
  assert.equal(addBuiltInNaturalLesson(full), full);
  const extra = naturalLesson.exercises.filter((e) => e.section === 'extra');
  assert.equal(extra.length, 15);
  assert.deepEqual(
    ['foundation', 'skills', 'application', 'challenge'].map(
      (g) => extra.filter((e) => e.group === g).length
    ),
    [4, 6, 4, 1]
  );
  assert.equal(
    checkAnswer(
      extra.find((e) => e.id === 'n-extra-17'),
      '6'
    ).correct,
    false
  );
  assert.equal(
    checkAnswer(
      extra.find((e) => e.id === 'n-extra-17'),
      '7'
    ).correct,
    true
  );
  const font = fs.readFileSync(
    path.join(__dirname, '../public/fonts/DejaVuSans.ttf')
  );
  for (const mode of ['worksheet', 'solutions']) {
    const bytes = load('pdf').createPracticePdf(naturalLesson, mode, font);
    assert.equal(Buffer.from(bytes).subarray(0, 8).toString(), '%PDF-1.7');
    if (process.env.MATH_PDF_QA_DIR) {
      fs.mkdirSync(process.env.MATH_PDF_QA_DIR, { recursive: true });
      fs.writeFileSync(
        path.join(process.env.MATH_PDF_QA_DIR, `natural-${mode}.pdf`),
        bytes
      );
    }
  }
});

test('common factor content upgrades preserve edits and numeric answers are correct', () => {
  const { combinedNaturalLesson: naturalLesson } = load('natural-example');
  const { commonFactorBlocks, commonFactorExercises } = load('gcd-lcm-content');
  const { addNaturalCommonFactors } = load('migrations');
  const old = structuredClone(naturalLesson);
  old.blocks = old.blocks.filter((b) => !b.id.startsWith('n-common-'));
  old.exercises = old.exercises.filter((e) => !e.id.startsWith('n-common-'));
  old.title = 'My title';
  old.blocks.push({ ...commonFactorBlocks[0], text: 'My explanation' });
  const result = addNaturalCommonFactors([old])[0];
  assert.equal(result.title, 'My title');
  assert.equal(
    result.blocks.find((b) => b.id === commonFactorBlocks[0].id).text,
    'My explanation'
  );
  assert.deepEqual(addNaturalCommonFactors([result])[0], result);
  assert.equal(old.exercises.length, 28);
  assert.equal(result.exercises.length, 44);
  assert.deepEqual(addNaturalCommonFactors([]), []);
  const full = {
    ...old,
    blocks: Array.from({ length: 50 }, (_, i) => ({
      ...old.blocks[0],
      id: `custom-${i}`,
    })),
  };
  assert.equal(addNaturalCommonFactors([full])[0], full);
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  for (const e of commonFactorExercises) {
    const match = e.prompt.match(/^Tìm (ƯCLN|BCNN)\(([\d, ]+)\)/);
    if (!match) continue;
    const nums = match[2].split(',').map(Number);
    const answer = nums.reduce((a, b) =>
      match[1] === 'ƯCLN' ? gcd(a, b) : (a * b) / gcd(a, b)
    );
    assert.equal(Number(e.answer), answer, e.id);
    assert.equal(checkAnswer(e, String(answer)).correct, true);
    assert.equal(checkAnswer(e, String(answer + 1)).correct, false);
  }
  assert.equal(
    checkAnswer(
      commonFactorExercises.find((e) => e.id === 'n-common-extra-2'),
      '0'
    ).correct,
    false
  );
});

test('splitting divisibility moves saved edits without loss and exports the new lesson', () => {
  const { naturalLesson, combinedNaturalLesson, divisibilityLesson } =
    load('natural-example');
  const { splitNaturalDivisibility } = load('migrations');
  const source = structuredClone(combinedNaturalLesson);
  source.exercises.find((e) => e.id === 'n-extra-12').hint = 'Teacher hint';
  source.blocks.find((b) => b.id === 'n-divisibility').text = 'Teacher text';
  const result = splitNaturalDivisibility([source]);
  assert.equal(result.length, 2);
  assert.equal(result[0].title, naturalLesson.title);
  assert.equal(result[0].exercises.length, 20);
  assert.equal(
    result[1].exercises.find((e) => e.id === 'n-extra-12').hint,
    'Teacher hint'
  );
  assert.equal(
    result[1].blocks.find((b) => b.id === 'n-divisibility').text,
    'Teacher text'
  );
  assert.equal(source.exercises.length, 44);
  assert.deepEqual(splitNaturalDivisibility(result), result);
  assert.deepEqual(splitNaturalDivisibility([]), []);
  assert.equal(
    splitNaturalDivisibility([naturalLesson])[1].exercises.length,
    divisibilityLesson.exercises.length
  );
  const full = [
    source,
    ...Array.from({ length: 99 }, (_, i) => ({
      ...naturalLesson,
      id: `custom-${i}`,
    })),
  ];
  assert.equal(splitNaturalDivisibility(full), full);
  const conflict = structuredClone(divisibilityLesson);
  conflict.exercises.find((e) => e.id === 'n-extra-12').hint = 'Different edit';
  const merged = splitNaturalDivisibility([source, conflict]);
  assert.equal(
    merged[0].exercises.find((e) => e.id === 'n-extra-12').hint,
    'Teacher hint'
  );
  assert.equal(
    merged[1].exercises.find((e) => e.id === 'n-extra-12').hint,
    'Different edit'
  );
  assert.equal(
    divisibilityLesson.exercises.filter((e) => e.section === 'extra').length,
    17
  );
  const font = fs.readFileSync(
    path.join(__dirname, '../public/fonts/DejaVuSans.ttf')
  );
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
    assert.doesNotMatch(
      JSON.stringify(lesson) + getKnowledgeSummary(lesson),
      /ước dương|nguyên dương/
    );
  }
  const old = structuredClone(divisibilityLesson);
  old.knowledgeSummary =
    'Với các số nguyên dương, phân tích ra thừa số nguyên tố.';
  old.blocks[0].text = 'Ghi chú riêng: có hai ước dương.';
  old.exercises[0].hint = 'Xét các ước dương.';
  const unrelated = { ...old, id: 'custom-lesson' };
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
  const custom = {
    ...structuredClone(fractionLessons[0]),
    title: 'Teacher title',
  };
  const updated = addFractionLessons([exampleLessons[0], custom]);
  assert.equal(updated.length, 6);
  assert.equal(updated[0], exampleLessons[0]);
  assert.equal(updated[1], custom);
  assert.equal(addFractionLessons(updated), updated);
  const full = Array.from({ length: 100 }, (_, i) => ({
    ...custom,
    id: `custom-${i}`,
  }));
  assert.equal(addFractionLessons(full), full);
  const font = fs.readFileSync(
    path.join(__dirname, '../public/fonts/DejaVuSans.ttf')
  );
  for (const lesson of fractionLessons) {
    assert.equal(
      lesson.exercises.filter((e) => e.section === 'extra').length,
      20
    );
    for (const mode of ['worksheet', 'solutions']) {
      const bytes = load('pdf').createPracticePdf(lesson, mode, font);
      assert.equal(Buffer.from(bytes).subarray(0, 8).toString(), '%PDF-1.7');
      if (process.env.MATH_PDF_QA_DIR) {
        fs.mkdirSync(process.env.MATH_PDF_QA_DIR, { recursive: true });
        fs.writeFileSync(
          path.join(process.env.MATH_PDF_QA_DIR, `${lesson.id}-${mode}.pdf`),
          bytes
        );
      }
    }
  }
  // Independently calculate the authored arithmetic questions.
  for (const lesson of fractionLessons)
    for (const e of lesson.exercises) {
      const m = e.prompt.match(
        /^Tính \((-?\d+)\/(\d+)\) ([×:−]) \((-?\d+)\/(\d+)\)\.$/
      );
      if (!m) continue;
      const a = Number(m[1]) / Number(m[2]),
        b = Number(m[4]) / Number(m[5]);
      const expected = m[3] === '×' ? a * b : m[3] === ':' ? a / b : a - b;
      const parts = e.answer.split('/').map(Number);
      assert.ok(Math.abs(expected - parts[0] / (parts[1] || 1)) < 1e-12, e.id);
    }
});

test('grade 4 fractions respect curriculum scope and grade upgrades preserve teacher edits', () => {
  const { primaryFractionLessons } = load('primary-fraction-lessons');
  const { fractionLessons } = load('fraction-lessons');
  const { updateFractionLevels } = load('fraction-level-migration');
  assert.equal(primaryFractionLessons.length, 5);
  for (const lesson of primaryFractionLessons) {
    assert.equal(lesson.grade, 4);
    assert.equal(
      lesson.exercises.filter((e) => e.section === 'extra').length,
      20
    );
    const visible = JSON.stringify([
      lesson.blocks,
      lesson.exercises,
      lesson.knowledgeSummary,
    ]);
    assert.doesNotMatch(visible, /ƯCLN|BCNN|số nguyên|âm|-(?:[1-9]\d*)\//);
    for (const e of lesson.exercises) {
      const m = e.prompt.match(/^Tính (\d+)\/(\d+) ([+−×:]) (\d+)\/(\d+)\.$/);
      if (!m) continue;
      const [a, b, c, d] = [m[1], m[2], m[4], m[5]].map(Number);
      const op = m[3];
      if (op === '+' || op === '−') assert.ok(b % d === 0 || d % b === 0, e.id);
      const expected =
        op === '+'
          ? a / b + c / d
          : op === '−'
            ? a / b - c / d
            : op === '×'
              ? ((a / b) * c) / d
              : a / b / (c / d);
      assert.ok(expected >= 0, e.id);
      const answer = e.answer.split('/').map(Number);
      assert.ok(
        Math.abs(answer[0] / (answer[1] || 1) - expected) < 1e-12,
        e.id
      );
    }
  }
  const ordering = primaryFractionLessons
    .find((lesson) => lesson.id === 'math-fraction-compare-4')
    .exercises.filter((exercise) => exercise.section === 'extra')
    .slice(-2);
  assert.deepEqual(
    ordering.map((exercise) => exercise.id),
    ['math-fraction-compare-4-q23', 'math-fraction-compare-4-q24']
  );
  assert.deepEqual(
    ordering.map((exercise) => exercise.answer),
    ['1/2 < 1 < 3/2 < 2', '2 > 3/2 > 5/4 > 7/8']
  );
  const value = (text) => {
    const [numerator, denominator = '1'] = text.split('/');
    return Number(numerator) / Number(denominator);
  };
  for (const exercise of ordering) {
    assert.equal(exercise.kind, 'choice');
    assert.ok(exercise.options.includes(exercise.answer));
    const values = exercise.answer.split(/ [<>] /).map(value);
    const ascending = exercise.answer.includes(' < ');
    assert.ok(
      values
        .slice(1)
        .every((current, index) =>
          ascending ? values[index] < current : values[index] > current
        ),
      exercise.id
    );
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
  const custom = { ...old, title: 'Teacher title', goal: 'Teacher goal' };
  assert.equal(updateFractionLevels([custom])[0].title, 'Teacher title');
  assert.equal(updateFractionLevels([custom])[0].goal, 'Teacher goal');
  const full = Array.from({ length: 100 }, (_, i) => ({
    ...custom,
    id: `full-${i}`,
  }));
  assert.equal(updateFractionLevels(full).length, 100);
  const font = fs.readFileSync(
    path.join(__dirname, '../public/fonts/DejaVuSans.ttf')
  );
  for (const lesson of primaryFractionLessons)
    for (const mode of ['worksheet', 'solutions']) {
      const bytes = load('pdf').createPracticePdf(lesson, mode, font);
      assert.equal(Buffer.from(bytes).subarray(0, 8).toString(), '%PDF-1.7');
      if (process.env.MATH_PDF_QA_DIR) {
        fs.mkdirSync(process.env.MATH_PDF_QA_DIR, { recursive: true });
        fs.writeFileSync(
          path.join(process.env.MATH_PDF_QA_DIR, `${lesson.id}-${mode}.pdf`),
          bytes
        );
      }
    }
});

test('saved Grade 4 ordering challenges update without overwriting teacher edits', () => {
  const { primaryFractionLessons } = load('primary-fraction-lessons');
  const { updatePrimaryFractionOrdering } = load('fraction-level-migration');
  const original = structuredClone(
    primaryFractionLessons.find(
      (lesson) => lesson.id === 'math-fraction-compare-4'
    )
  );
  Object.assign(
    original.exercises.find(
      (exercise) => exercise.id === 'math-fraction-compare-4-q23'
    ),
    {
      kind: 'choice',
      prompt: 'Chọn dãy phân số theo thứ tự tăng dần.',
      answer: '1/4 < 1/2 < 3/4',
      hint: 'Đưa về mẫu 4.',
      solution: '1/4 < 2/4 < 3/4.',
      options: ['1/4 < 1/2 < 3/4', '1/2 < 1/4 < 3/4', '3/4 < 1/2 < 1/4'],
    }
  );
  Object.assign(
    original.exercises.find(
      (exercise) => exercise.id === 'math-fraction-compare-4-q24'
    ),
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
    (exercise) => exercise.id === 'math-fraction-compare-4-q23'
  ).hint = 'Teacher hint';
  const migrated = updatePrimaryFractionOrdering([original, customized]);
  assert.deepEqual(
    migrated[0].exercises.slice(-2).map((exercise) => exercise.answer),
    ['1/2 < 1 < 3/2 < 2', '2 > 3/2 > 5/4 > 7/8']
  );
  const customChallenge = migrated[1].exercises.find(
    (exercise) => exercise.id === 'math-fraction-compare-4-q23'
  );
  assert.equal(customChallenge.hint, 'Teacher hint');
  assert.equal(customChallenge.answer, '1/4 < 1/2 < 3/4');
  assert.equal(
    migrated[1].exercises.find(
      (exercise) => exercise.id === 'math-fraction-compare-4-q24'
    ).answer,
    '2 > 3/2 > 5/4 > 7/8'
  );
  assert.deepEqual(updatePrimaryFractionOrdering(migrated), migrated);
});

test('Grade 6 fractions consolidate into three lessons while preserving saved work', () => {
  const { legacyExampleLessons, exampleLessons } = load('examples');
  const { consolidateFractionLessons } = load('fraction-consolidation');
  const scope = exampleLessons.filter(
    (l) => l.grade === 6 && l.topic === 'Phân số mở rộng'
  );
  assert.deepEqual(
    scope.map((l) => l.title),
    [
      'Cộng trừ phân số',
      'Nhân chia phân số',
      'Hai bài toán cơ bản về phân số',
      'So sánh và sắp xếp các số',
    ]
  );
  const app = legacyExampleLessons.find(
    (l) => l.id === 'math-fraction-applications-6'
  );
  assert.deepEqual({ ...scope[2], exercises: scope[2].exercises.map(({ task, ...e }) => e) }, app);
  assert.equal(scope[0].exercises.length, 98);
  assert.deepEqual(
    consolidateFractionLessons(exampleLessons, legacyExampleLessons),
    exampleLessons
  );
  const saved = structuredClone(legacyExampleLessons);
  const compare = saved.find((l) => l.id === 'math-fraction-compare-6');
  compare.blocks[0].text = 'Teacher prerequisite';
  compare.exercises[0].hint = 'Teacher hint';
  compare.knowledgeSummary = 'Teacher summary';
  const result = consolidateFractionLessons(saved, legacyExampleLessons);
  const merged = result.find((l) => l.id === 'math-fractions-6');
  assert.ok(merged.blocks.some((b) => b.text === 'Teacher prerequisite'));
  assert.equal(
    merged.exercises.find((e) => e.id === compare.exercises[0].id).hint,
    'Teacher hint'
  );
  assert.equal(merged.knowledgeSummary, 'Teacher summary');
  assert.equal(
    result.find((l) => l.id === app.id),
    saved.find((l) => l.id === app.id)
  );
  const full = structuredClone(saved);
  const source = full.find((l) => l.id === 'math-fractions-6');
  source.exercises.push(
    ...Array.from({ length: 3 }, (_, i) => ({
      ...source.exercises[0],
      id: `custom-${i}`,
    }))
  );
  assert.ok(
    consolidateFractionLessons(full, legacyExampleLessons).some(
      (l) => l.id === compare.id
    )
  );
});

test('mixed-format comparison and ordering lesson has mathematically correct unique choices', () => {
  const { fractionOrderLesson: lesson, addFractionOrderLesson } = load(
    'fraction-order-lesson'
  );
  const value = (text) => {
    const s = text.trim();
    if (s.includes(' ')) {
      const [whole, part] = s.split(' ');
      return Number(whole) + value(part);
    }
    if (s.includes('/')) {
      const [a, b] = s.split('/').map(Number);
      return a / b;
    }
    return Number(s.replace(',', '.'));
  };
  const extra = lesson.exercises.filter((e) => e.section === 'extra');
  assert.equal(extra.length, 20);
  assert.equal(extra.filter((e) => e.prompt.includes('tăng dần')).length, 4);
  assert.equal(extra.filter((e) => e.prompt.includes('giảm dần')).length, 4);
  for (const e of lesson.exercises) {
    let valid;
    if (e.prompt.startsWith('Điền dấu')) {
      const [a, b] = e.prompt
        .replace('Điền dấu thích hợp: ', '')
        .replace(/\.$/, '')
        .split(' □ ')
        .map(value);
      valid = e.options.filter((op) =>
        op === '<' ? a < b : op === '>' ? a > b : a === b
      );
    } else if (e.prompt.startsWith('Sắp xếp')) {
      const input = e.prompt
        .split(': ')[1]
        .replace(/\.$/, '')
        .split('; ')
        .sort();
      const asc = e.prompt.includes('tăng dần');
      valid = e.options.filter((option) => {
        assert.deepEqual(option.split('; ').sort(), input);
        const nums = option.split('; ').map(value);
        return nums.every(
          (n, i) => !i || (asc ? nums[i - 1] <= n : nums[i - 1] >= n)
        );
      });
    } else {
      const min = Math.min(...e.options.map(value));
      valid = e.options.filter((o) => value(o) === min);
    }
    assert.deepEqual(valid, [e.answer], e.id);
  }
  const saved = { ...structuredClone(lesson), title: 'Edited title' };
  const items = [saved];
  assert.equal(addFractionOrderLesson(items), items);
  assert.equal(addFractionOrderLesson([]).length, 1);
  const full = Array.from({ length: 100 }, (_, i) => ({
    ...saved,
    id: `custom-${i}`,
  }));
  assert.equal(addFractionOrderLesson(full), full);
  const font = fs.readFileSync(
    path.join(__dirname, '../public/fonts/DejaVuSans.ttf')
  );
  for (const mode of ['worksheet', 'solutions']) {
    const bytes = load('pdf').createPracticePdf(lesson, mode, font);
    assert.equal(Buffer.from(bytes).subarray(0, 8).toString(), '%PDF-1.7');
    if (process.env.MATH_PDF_QA_DIR) {
      fs.mkdirSync(process.env.MATH_PDF_QA_DIR, { recursive: true });
      fs.writeFileSync(
        path.join(process.env.MATH_PDF_QA_DIR, `order-${mode}.pdf`),
        bytes
      );
    }
  }
});

test('integer-to-fraction examples retain denominator one without changing final simplification', () => {
  const { wholeNumberFraction: format } = load('format');
  assert.equal(
    format('-2', '1', 'Số nguyên có thể viết thành phân số: -2 = '),
    null
  );
  assert.equal(format('3', '1', '3 = '), null);
  assert.equal(format('0', '1', '0 = '), null);
  assert.equal(format('1', '1', '6/6 = '), '1');
  assert.equal(format('-2', '1', '-4/2 = '), '-2');
  assert.equal(format('1', '1'), '1');
});

test('number-line lesson validates diagrams, preserves saves and round-trips through sharing', async () => {
  const { numberLineLesson: lesson, addNumberLineLesson } =
    load('number-line-lesson');
  assert.equal(lesson.grade, 7);
  assert.equal(
    lesson.exercises.filter((e) => e.section === 'extra').length,
    20
  );
  const diagrams = lesson.blocks.filter((b) => b.visual === 'number-line');
  assert.equal(diagrams.length, 6);
  assert.deepEqual(parseMathPack(packLessons([lesson])).lessons[0], lesson);
  const saved = { ...structuredClone(lesson), title: 'Teacher title' };
  const items = [saved];
  assert.equal(addNumberLineLesson(items), items);
  assert.equal(addNumberLineLesson([]).length, 1);
  const full = Array.from({ length: 100 }, (_, i) => ({
    ...saved,
    id: `custom-${i}`,
  }));
  assert.equal(addNumberLineLesson(full), full);
  for (const values of [
    [-1, 1, 0, 0],
    [-1, 1, 13, 0],
    [-10, 10, 12, 0],
    [1, 3, 2, 2],
    [-1, 1, 4, 2],
    [-1, 1, 4, 0.3],
    [0, 0, 1, 0],
  ]) {
    const bad = structuredClone(lesson);
    bad.blocks[1].values = values;
    assert.throws(() => parseMathPack(packLessons([bad])));
  }
  const decoded = await decodeMathLesson(await encodeMathLesson(lesson));
  assert.deepEqual(decoded.blocks, lesson.blocks);
  const font = fs.readFileSync(
    path.join(__dirname, '../public/fonts/DejaVuSans.ttf')
  );
  for (const mode of ['worksheet', 'solutions']) {
    const bytes = load('pdf').createPracticePdf(lesson, mode, font);
    assert.equal(Buffer.from(bytes).subarray(0, 8).toString(), '%PDF-1.7');
  }
});

test('solution number lines validate numeric labels and use a uniform mathematical scale', () => {
  const { numberLineValue, parseSolutionNumberLine, numberLineGeometry } = load(
    'solution-number-line'
  );
  for (const [text, value] of [
    ['-3/2', -1.5],
    ['1 1/2', 1.5],
    ['-1 1/2', -1.5],
    ['−3/4', -0.75],
    ['0,5', 0.5],
    ['0', 0],
  ])
    assert.equal(numberLineValue(text), value);
  for (const text of ['1/0', '1/-2', '1 3/2', 'NaN', '1+2', ''])
    assert.equal(numberLineValue(text), null);
  const base = {
    min: -2,
    max: 2,
    divisions: 4,
    points: [{ value: '-3/2' }, { value: '1 1/2' }],
  };
  assert.deepEqual(parseSolutionNumberLine(base), base);
  assert.equal(parseSolutionNumberLine(null), null);
  const geometry = numberLineGeometry(base);
  assert.equal(geometry.ticks.length, 17);
  assert.deepEqual(
    geometry.points.map((p) => p.position),
    [1 / 8, 7 / 8]
  );
  assert.equal(geometry.ticks.find((t) => t.value === 0).position, 0.5);
  for (let i = 1; i < geometry.ticks.length; i++)
    assert.equal(
      geometry.ticks[i].position - geometry.ticks[i - 1].position,
      1 / 16
    );
  for (const patch of [
    { min: 1 },
    { max: -1 },
    { max: Infinity },
    { min: -1.5 },
    { divisions: 0 },
    { divisions: 13 },
    { min: -10, max: 10, divisions: 4 },
    { points: [] },
    { points: [{ value: '3' }] },
    { points: [{ value: '1/3' }] },
    { points: [{ value: '1/0' }] },
    { points: [{ value: 'NaN' }] },
    { points: [{ value: '1/2' }, { value: '2/4' }] },
    { points: [{ value: '1/2', emphasis: 'true' }] },
    { points: [{ value: '1/2', name: 'A\nB' }] },
    { caption: 123 },
  ])
    assert.throws(
      () => parseSolutionNumberLine({ ...base, ...patch }),
      /Trục số lời giải/
    );
  const sixths = numberLineGeometry({
    min: 0,
    max: 1,
    divisions: 6,
    points: [{ value: '1/2' }, { value: '2/3' }],
  });
  assert.equal(sixths.ticks.length, 7, 'six intervals, not six ticks');
  assert.deepEqual(
    sixths.points.map((p) => p.position),
    [0.5, 2 / 3]
  );
});

test('number-line solution metadata survives sharing and saved-copy defaults preserve teacher edits', async () => {
  const { numberLineLesson, withNumberLineSolution } =
    load('number-line-lesson');
  const lesson = structuredClone(numberLineLesson);
  const before = structuredClone(lesson);
  const supported = lesson.exercises.filter((e) => e.solutionNumberLine);
  assert.equal(supported.length, 5);
  for (const exercise of supported) {
    const saved = { ...exercise };
    delete saved.solutionNumberLine;
    assert.deepEqual(withNumberLineSolution(saved), exercise);
    assert.equal(saved.solutionNumberLine, undefined);
    for (const change of [
      { prompt: 'Đề khác' },
      { solution: 'Lời giải khác' },
      { answer: '8' },
      { id: 'custom-id' },
    ]) {
      const custom = { ...saved, ...change };
      assert.equal(withNumberLineSolution(custom), custom);
    }
    const hidden = { ...exercise, solutionNumberLine: null };
    assert.equal(withNumberLineSolution(hidden), hidden);
  }
  assert.deepEqual(lesson, before);
  const decoded = await decodeMathLesson(await encodeMathLesson(lesson));
  assert.deepEqual(decoded.exercises, lesson.exercises);
  const bad = structuredClone(lesson);
  bad.exercises.find(
    (e) => e.solutionNumberLine
  ).solutionNumberLine.points[0].value = '999';
  assert.throws(() => parseMathPack(packLessons([bad])), /Trục số lời giải/);
});

test('PDF solution diagrams plot all five tasks without exposing answers in worksheets', () => {
  const { createPracticePdf } = load('pdf');
  const { numberLineLesson } = load('number-line-lesson');
  const { numberLineGeometry } = load('solution-number-line');
  const font = fs.readFileSync(
    path.join(__dirname, '../public/fonts/DejaVuSans.ttf')
  );
  const lesson = structuredClone(numberLineLesson);
  const before = structuredClone(lesson);
  const bytes = createPracticePdf(lesson, 'solutions', font);
  const rows = pdfTextRows(bytes);
  const points = [
    ...Buffer.from(bytes)
      .toString('latin1')
      .matchAll(
        /q [\d. ]+ RG [\d. ]+ rg 0\.9 w ([\d.]+) ([\d.]+) m [^\n]+ c f Q/gu
      ),
  ].map((match) => ({ x: Number(match[1]) - 2.8, y: Number(match[2]) }));
  assert.equal(points.length, 17);
  const diagrams = lesson.exercises.filter((e) => e.solutionNumberLine);
  let at = 0;
  for (const e of diagrams) {
    const geometry = numberLineGeometry(e.solutionNumberLine);
    const actual = points.slice(at, at + geometry.points.length);
    for (const [index, point] of geometry.points.entries()) {
      const expectedX = 44 + 24 + point.position * (595.28 - 2 * (44 + 24));
      assert.ok(
        Math.abs(actual[index].x - expectedX) < 0.02,
        `${e.id}: ${point.value}`
      );
      assert.equal(actual[index].y, actual[0].y, 'points share one axis');
    }
    at += geometry.points.length;
  }
  const axes = rows.filter((row) => row.text === 'x');
  assert.equal(axes.length, 5);
  axes.forEach((axis, index) => {
    const prompt = rows.find((row) =>
      row.text.startsWith(`Bài ${16 + index}.`)
    );
    assert.equal(
      prompt.page,
      axis.page,
      'ordinary question and diagram stay together'
    );
    assert.ok(prompt.y > axis.y);
  });
  for (const row of rows) {
    assert.ok(row.left >= 43.98, row.text);
    assert.ok(row.right <= 595.28 - 44 + 0.02, row.text);
  }
  const old = structuredClone(lesson);
  old.exercises.forEach((e) => delete e.solutionNumberLine);
  assert.deepEqual(
    createPracticePdf(old, 'solutions', font),
    bytes,
    'old saved built-ins also get diagrams'
  );
  const hidden = structuredClone(lesson);
  hidden.exercises.forEach((e) => {
    e.solutionNumberLine = null;
  });
  for (const worksheetLesson of [hidden, lesson]) {
    assert.equal(pdfTextRows(createPracticePdf(worksheetLesson, 'worksheet', font)).filter(row => row.text === 'x').length, 0);
  }
  assert.equal(
    pdfTextRows(createPracticePdf(hidden, 'solutions', font)).filter(
      (row) => row.text === 'x'
    ).length,
    0
  );
  const custom = {
    ...lesson,
    id: 'custom-number-line',
    exercises: diagrams.map((e) => ({ ...e, id: `copy-${e.id}` })),
  };
  assert.equal(
    pdfTextRows(createPracticePdf(custom, 'solutions', font)).filter(
      (row) => row.text === 'x'
    ).length,
    5
  );
  assert.deepEqual(lesson, before);
});

test('PDF number-line values sit below the axis and point names align above their coordinates', () => {
  const { createPracticePdf } = load('pdf');
  const { numberLineLesson } = load('number-line-lesson');
  const font = fs.readFileSync(
    path.join(__dirname, '../public/fonts/DejaVuSans.ttf')
  );
  const cases = numberLineLesson.exercises.filter((e) => e.solutionNumberLine);
  for (const exercise of cases) {
    const e = {
      ...exercise,
      solution: 'Quan sát trục số.',
      solutionNumberLine: {
        ...exercise.solutionNumberLine,
        caption: 'Hết hình.',
      },
    };
    const bytes = createPracticePdf(
      { ...numberLineLesson, exercises: [e] },
      'solutions',
      font
    );
    const spans = pdfTextRows(bytes, true);
    const dots = [
      ...Buffer.from(bytes)
        .toString('latin1')
        .matchAll(
          /q [\d. ]+ RG [\d. ]+ rg 0\.9 w ([\d.]+) ([\d.]+) m [^\n]+ c f Q/gu
        ),
    ].map((match) => ({ x: Number(match[1]) - 2.8, y: Number(match[2]) }));
    const axisY = dots[0].y;
    const endY = spans.find((span) => span.text === 'Hết').y;
    const startY = spans.find((span) => span.text === 'Quan').y;
    const diagramSpans = spans.filter(
      (span) => span.y < startY && span.y > endY
    );
    const numeric = diagramSpans.filter((span) =>
      /^[+-]?\d+$/u.test(span.text)
    );
    assert.ok(numeric.length > 0, exercise.id);
    assert.ok(
      numeric.every((span) => span.y < axisY),
      `${exercise.id}: all numbers below`
    );
    assert.ok(
      !diagramSpans.some((span) => span.text.includes('=')),
      'no A = value labels'
    );
    for (const point of e.solutionNumberLine.points.filter(
      (point) => point.name
    )) {
      const name = diagramSpans.find((span) => span.text === point.name);
      assert.ok(name && name.y > axisY, point.name);
      const center = (name.left + name.right) / 2;
      assert.ok(
        dots.some((dot) => Math.abs(dot.x - center) < 0.02),
        point.name
      );
      for (const token of point.value.split('/')) {
        assert.ok(
          numeric.some(
            (span) =>
              span.text === token &&
              Math.abs((span.left + span.right) / 2 - center) < 0.02
          ),
          `${point.name}: ${token} aligned below`
        );
      }
    }
    for (const value of ['-1', '0']) {
      const { min, max } = e.solutionNumberLine;
      const tickX = 68 + ((Number(value) - min) / (max - min)) * (595.28 - 136);
      // A fraction numerator may also read "-1" at a different coordinate.
      assert.ok(
        numeric.filter(
          (span) =>
            span.text === value &&
            Math.abs((span.left + span.right) / 2 - tickX) < 0.02
        ).length <= 1,
        `${exercise.id}: no duplicate ${value}`
      );
    }
  }
});

test('crowded number-line labels stay below, separated and within the page margins', () => {
  const { createPracticePdf } = load('pdf');
  const { numberLineLesson } = load('number-line-lesson');
  const font = fs.readFileSync(
    path.join(__dirname, '../public/fonts/DejaVuSans.ttf')
  );
  const base = numberLineLesson.exercises.at(-1);
  for (const diagram of [
    {
      min: 0,
      max: 5,
      divisions: 12,
      points: [
        { value: '1/12', name: 'A' },
        { value: '1/6', name: 'B' },
        { value: '1/4', name: 'C' },
        { value: '1/3', name: 'D' },
        { value: '5/12', name: 'E' },
      ],
    },
    {
      min: -2,
      max: 2,
      divisions: 2,
      points: [
        { value: '-2', name: 'WWWWWWWWWWWWWWWW' },
        { value: '2', name: 'MMMMMMMMMMMMMMMM' },
      ],
    },
  ]) {
    const e = {
      ...base,
      solution: 'Quan sát.',
      solutionNumberLine: { ...diagram, caption: 'Hết hình.' },
    };
    const bytes = createPracticePdf(
      { ...numberLineLesson, exercises: [e] },
      'solutions',
      font
    );
    const spans = pdfTextRows(bytes, true);
    const startY = spans.find((span) => span.text === 'Quan').y;
    const endY = spans.find((span) => span.text === 'Hết').y;
    const labels = spans.filter((span) => span.y < startY && span.y > endY);
    const axisY = Number(
      Buffer.from(bytes)
        .toString('latin1')
        .match(
          /q [\d. ]+ RG [\d. ]+ rg 0\.9 w ([\d.]+) ([\d.]+) m [^\n]+ c f Q/u
        )[2]
    );
    assert.ok(
      labels
        .filter((span) => /^[+-]?\d+$/u.test(span.text))
        .every((span) => span.y < axisY)
    );
    for (const span of labels) {
      assert.ok(
        span.left >= 43.98 && span.right <= 595.28 - 44 + 0.02,
        span.text
      );
      const sameRow = labels.filter(
        (other) => other !== span && other.y === span.y
      );
      assert.ok(
        sameRow.every(
          (other) => other.right <= span.left || other.left >= span.right
        ),
        span.text
      );
    }
  }
});

test('grade 3 replacement preserves other lessons and existing edits', () => {
  const {
    additionSubtractionLesson: lesson,
    replaceGradeThreeLesson: replace,
  } = load('addition-subtraction-lesson');
  const other = { ...exampleLessons[0], id: 'custom-grade-3', grade: 3 };
  const old = { ...other, id: 'math-arithmetic-3' };
  const original = [other, old];
  const updated = replace(original);
  assert.equal(updated[0], other);
  assert.equal(updated[1].id, lesson.id);
  assert.equal(original[1], old);
  const edited = { ...lesson, title: 'Teacher edited title' };
  assert.deepEqual(replace([old, edited, other]), [edited, other]);
  assert.equal(replace([edited])[0], edited);
  const full = Array.from({ length: 100 }, (_, i) => ({
    ...other,
    id: `custom-${i}`,
  }));
  assert.equal(replace(full), full);
  assert.equal(replace([...full.slice(0, 99), old]).length, 100);
  assert.equal(
    exampleLessons.some((l) => l.id === old.id),
    false
  );
  assert.equal(lesson.exercises.length, 24);
  assert.equal(
    lesson.exercises.filter((e) => e.section === 'extra').length,
    20
  );
  // Independently substitute every missing-number answer into its equation.
  for (const exercise of lesson.exercises) {
    const match = exercise.prompt.match(/(□|\d+) ([+−]) (□|\d+) = (\d+)/);
    if (!match) continue;
    const left = match[1] === '□' ? Number(exercise.answer) : Number(match[1]);
    const right = match[3] === '□' ? Number(exercise.answer) : Number(match[3]);
    assert.equal(
      match[2] === '+' ? left + right : left - right,
      Number(match[4]),
      exercise.id
    );
  }
});

test('semester placement validates and round trips without changing lesson identity', async () => {
  const { matchesPlacement, semesterLabel } = load('placement');
  const original = { ...exampleLessons[1] };
  delete original.semester;
  const moved = { ...original, grade: 4, semester: '2' };
  const parsed = parseMathPack(packLessons([moved])).lessons[0];
  assert.equal(parsed.id, original.id);
  assert.deepEqual(parsed.exercises, original.exercises);
  assert.equal(parsed.semester, '2');
  const shared = await decodeMathLesson(await encodeMathLesson(moved));
  assert.equal(shared.semester, '2');
  assert.equal(shared.grade, 4);
  assert.equal(matchesPlacement(moved, '4', '2'), true);
  assert.equal(matchesPlacement(moved, '3', '2'), false);
  assert.equal(matchesPlacement(moved, '4', '1'), false);
  assert.equal(matchesPlacement(moved, '', 'unassigned'), false);
  assert.equal(matchesPlacement(original, '', 'unassigned'), true);
  assert.equal(matchesPlacement(original, '', ''), true);
  assert.equal(semesterLabel(undefined), 'Chưa phân loại');
  assert.equal(
    parseMathPack(packLessons([original])).lessons[0].semester,
    undefined
  );
  assert.equal(
    parseMathPack(packLessons([{ ...moved, semester: '' }])).lessons[0]
      .semester,
    undefined
  );
  for (const invalid of ['3', 1, null, 'Học kỳ 1']) {
    assert.throws(
      () => parseMathPack(packLessons([{ ...original, semester: invalid }])),
      /Học kỳ/
    );
  }
  const XLSX = require('xlsx');
  const write = XLSX.writeFile;
  let book;
  XLSX.writeFile = (value) => {
    book = value;
  };
  try {
    load('workbook').exportMathWorkbook([
      moved,
      { ...original, id: 'legacy-unclassified' },
    ]);
  } finally {
    XLSX.writeFile = write;
  }
  const imported = load('workbook').importMathWorkbook(
    XLSX.write(book, { bookType: 'xlsx', type: 'array' })
  );
  assert.equal(imported.lessons[0].semester, '2');
  assert.equal(imported.lessons[1].semester, undefined);
});

test('component tables replace challenges before word problems and export', async () => {
  const { additionSubtractionLesson: lesson, addComponentTables } = load(
    'addition-subtraction-lesson'
  );
  const extra = lesson.exercises.filter((e) => e.section === 'extra');
  assert.equal(extra.length, 20);
  assert.equal(extra[12].id, 'components-3-table-addition');
  assert.equal(extra[13].id, 'components-3-table-subtraction');
  assert.equal(extra[14].id, 'components-3-e17');
  for (const [i, e] of extra.slice(12, 14).entries()) {
    for (let c = 1; c < e.table.rows[0].length; c++) {
      const [a, b, total] = e.table.solution.map((row) => Number(row[c]));
      assert.equal(i === 0 ? a + b : a - b, total);
      assert.equal(e.table.rows.filter((row) => row[c] === '?').length, 1);
    }
  }
  const old = {
    ...lesson,
    title: 'Edited',
    exercises: [
      ...lesson.exercises.filter((e) => !e.table),
      { ...extra[0], id: 'components-3-e23' },
      { ...extra[0], id: 'components-3-e24' },
    ],
  };
  const migrated = addComponentTables([old])[0];
  assert.equal(migrated.title, 'Edited');
  assert.deepEqual(migrated.exercises, lesson.exercises);
  assert.deepEqual(addComponentTables([migrated]), [migrated]);
  assert.deepEqual(
    (await decodeMathLesson(await encodeMathLesson(lesson))).exercises,
    lesson.exercises
  );
  const malformed = structuredClone(lesson);
  malformed.exercises.find((e) => e.table).table.solution[0].pop();
  assert.throws(() => parseMathPack(packLessons([malformed])), /Bảng/);
  const font = fs.readFileSync(
    path.join(__dirname, '../public/fonts/DejaVuSans.ttf')
  );
  for (const mode of ['worksheet', 'solutions']) {
    const pdf = load('pdf').createPracticePdf(lesson, mode, font);
    assert.ok(Buffer.from(pdf).includes(Buffer.from(' re S')));
    if (process.env.MATH_PDF_QA_DIR) {
      fs.mkdirSync(process.env.MATH_PDF_QA_DIR, { recursive: true });
      fs.writeFileSync(
        path.join(process.env.MATH_PDF_QA_DIR, `tables-${mode}.pdf`),
        pdf
      );
    }
  }
});

test('grade 3 multiplication and division components have correct answers and safe insertion', () => {
  const {
    multiplicationDivisionLesson: lesson,
    addMultiplicationDivisionLesson: add,
  } = load('multiplication-division-lesson');
  assert.equal(lesson.grade, 3);
  assert.equal(lesson.semester, '1');
  const extra = lesson.exercises.filter((e) => e.section === 'extra');
  assert.equal(extra.length, 20);
  assert.ok(extra[12].table);
  assert.ok(extra[13].table);
  for (const e of lesson.exercises) {
    const match = e.prompt.match(/(□|\d+) ([×:]) (□|\d+) = (\d+)/);
    if (match) {
      const a = Number(match[1] === '□' ? e.answer : match[1]);
      const b = Number(match[3] === '□' ? e.answer : match[3]);
      if (match[2] === ':') assert.notEqual(b, 0);
      assert.equal(match[2] === '×' ? a * b : a / b, Number(match[4]), e.id);
    }
  }
  extra.slice(12, 14).forEach((e, index) => {
    for (let c = 1; c < e.table.rows[0].length; c++) {
      const [a, b, result] = e.table.solution.map((row) => Number(row[c]));
      assert.equal(index === 0 ? a * b : a / b, result);
      assert.equal(e.table.rows.filter((row) => row[c] === '?').length, 1);
    }
  });
  const existing = { ...lesson, title: 'Edited lesson' };
  assert.equal(add([existing])[0], existing);
  const addition = exampleLessons.find(
    (l) => l.id === 'math-add-subtract-components-3'
  );
  const original = [addition];
  assert.deepEqual(
    add(original).map((l) => l.id),
    [addition.id, lesson.id]
  );
  assert.equal(original.length, 1);
  const full = Array.from({ length: 100 }, (_, i) => ({
    ...addition,
    id: `custom-${i}`,
  }));
  assert.equal(add(full), full);
  const font = fs.readFileSync(
    path.join(__dirname, '../public/fonts/DejaVuSans.ttf')
  );
  for (const mode of ['worksheet', 'solutions']) {
    const bytes = load('pdf').createPracticePdf(lesson, mode, font);
    assert.equal(Buffer.from(bytes).subarray(0, 8).toString(), '%PDF-1.7');
  }
});

test('grade 3 unit fractions cover equal parts and preserve saved lessons', () => {
  const { unitFractionLesson: lesson, addUnitFractionLesson: add } = load(
    'unit-fraction-lesson'
  );
  assert.equal(lesson.grade, 3);
  assert.equal(lesson.semester, '1');
  assert.equal(lesson.exercises.length, 22);
  assert.equal(
    lesson.exercises.filter((e) => e.section === 'extra').length,
    18
  );
  assert.deepEqual(
    lesson.blocks
      .filter((b) => b.section === 'explore' && b.values[1] === 0)
      .map((b) => b.values[0]),
    [2, 3, 4, 5, 6, 7, 8, 9]
  );
  const parsed = parseMathPack(packLessons([lesson])).lessons[0];
  assert.deepEqual(parsed, lesson);
  for (const values of [[1, 0], [10, 0], [3, 10], [3, -1], [3.5, 0], [3]]) {
    const invalid = structuredClone(lesson);
    invalid.blocks.find((b) => b.visual === 'unit-fraction').values = values;
    assert.throws(() => parseMathPack(packLessons([invalid])));
  }
  const edited = { ...lesson, title: 'Edited' };
  assert.equal(add([edited])[0], edited);
  const before = exampleLessons.filter((l) => l.id !== lesson.id);
  const after = add(before);
  assert.equal(after.filter((l) => l.id === lesson.id).length, 1);
  assert.equal(
    before.some((l) => l.id === lesson.id),
    false
  );
  assert.equal(add(after), after);
  const full = Array.from({ length: 100 }, (_, i) => ({
    ...edited,
    id: `custom-${i}`,
  }));
  assert.equal(add(full), full);
  for (const e of lesson.exercises.filter((e) => e.group === 'application')) {
    const [total, groups] = e.prompt.match(/\d+/g).map(Number);
    assert.equal(Number(e.answer), total / groups);
  }
  const font = fs.readFileSync(
    path.join(__dirname, '../public/fonts/DejaVuSans.ttf')
  );
  for (const mode of ['worksheet', 'solutions']) {
    const pdf = load('pdf').createPracticePdf(lesson, mode, font);
    assert.equal(Buffer.from(pdf).subarray(0, 8).toString(), '%PDF-1.7');
  }
});

test('grade 3 measurement placement, conversions and library updates', () => {
  const { measurementLesson: lesson, addMeasurementLesson: add } =
    load('measurement-lesson');
  assert.equal(lesson.grade, 3);
  assert.equal(lesson.semester, '1');
  assert.equal(lesson.exercises.length, 38);
  assert.equal(
    lesson.exercises.filter((e) => e.section === 'extra').length,
    34
  );
  assert.deepEqual(parseMathPack(packLessons([lesson])).lessons[0], lesson);
  const factors = {
    mm: 1,
    cm: 10,
    dm: 100,
    m: 1000,
    km: 1000000,
    g: 1,
    kg: 1000,
    ml: 1,
    l: 1000,
  };
  for (const e of lesson.exercises.filter((e) => e.group === 'foundation')) {
    const match = e.prompt.match(
      /^Điền số: ([\d ]+) (mm|cm|dm|km|m|kg|g|ml|l) =/
    );
    assert.ok(match, e.id);
    const expected =
      (Number(match[1].replaceAll(' ', '')) * factors[match[2]]) /
      factors[e.unit];
    assert.equal(Number(e.answer), expected, e.id);
  }
  const edited = { ...lesson, title: 'Edited' };
  assert.equal(add([edited])[0], edited);
  const unit = load('unit-fraction-lesson').unitFractionLesson;
  const original = [unit];
  assert.deepEqual(
    add(original).map((l) => l.id),
    [unit.id, lesson.id]
  );
  assert.equal(original.length, 1);
  const full = Array.from({ length: 100 }, (_, i) => ({
    ...edited,
    id: `custom-${i}`,
  }));
  assert.equal(add(full), full);
  const { removeUnitFractionDrawingQuestions: remove } = load(
    'unit-fraction-lesson'
  );
  const old = {
    ...unit,
    exercises: [
      ...unit.exercises,
      ...['unit-3-e23', 'unit-3-e24'].map((id) => ({
        ...unit.exercises[0],
        id,
      })),
    ],
  };
  const cleaned = remove([old, edited]);
  assert.deepEqual(cleaned[0].exercises, unit.exercises);
  assert.equal(cleaned[1], edited);
  assert.deepEqual(remove(cleaned), cleaned);
  const font = fs.readFileSync(
    path.join(__dirname, '../public/fonts/DejaVuSans.ttf')
  );
  for (const mode of ['worksheet', 'solutions']) {
    const pdf = load('pdf').createPracticePdf(lesson, mode, font);
    assert.equal(Buffer.from(pdf).subarray(0, 8).toString(), '%PDF-1.7');
  }
});

test('measurement arithmetic and revision preserve placement and custom questions', () => {
  const { measurementLesson: lesson, reviseMeasurementPractice: revise } =
    load('measurement-lesson');
  const calculations = lesson.exercises.filter((e) => e.group === 'skills');
  assert.equal(calculations.length, 12);
  for (const e of calculations) {
    const terms = e.prompt
      .replace(/^Tính: /, '')
      .replace(/\.$/, '')
      .replace(/mm|ml|g/g, '')
      .trim()
      .split(/\s+/);
    let result = Number(terms[0]);
    for (let i = 1; i < terms.length; i += 2) {
      const n = Number(terms[i + 1]);
      result =
        terms[i] === '+'
          ? result + n
          : terms[i] === '−'
            ? result - n
            : terms[i] === '×'
              ? result * n
              : result / n;
    }
    assert.equal(Number(e.answer), result, e.id);
  }
  const custom = { ...lesson.exercises[0], id: 'teacher-custom' };
  const old = {
    ...lesson,
    grade: 4,
    semester: '2',
    title: 'Teacher title',
    blocks: [],
    exercises: [{ ...custom, id: 'measure-3-e1' }, custom],
  };
  const updated = revise([old])[0];
  assert.equal(updated.grade, 4);
  assert.equal(updated.semester, '2');
  assert.equal(updated.title, 'Teacher title');
  assert.equal(updated.exercises.at(-1), custom);
  assert.equal(
    updated.exercises.some((e) => e.id === 'measure-3-e1'),
    false
  );
  assert.deepEqual(revise([updated]), [updated]);
});

test('measurement word problems include worked answers and migrate once without duplication', () => {
  const { measurementLesson: lesson, addMeasurementWordProblems: add } =
    load('measurement-lesson');
  const words = lesson.exercises.filter((e) =>
    e.id.startsWith('measure-word-')
  );
  assert.equal(words.length, 6);
  for (const unit of ['mm', 'g', 'ml'])
    assert.equal(words.filter((e) => e.unit === unit).length, 2);
  for (const e of words) {
    assert.match(e.solution, /^Bài giải:/);
    assert.match(e.solution, /Đáp số:/);
    const rows = load('pdf').printableWordProblemRows(e);
    assert.ok(rows, e.id);
    assert.equal(rows.filter((r) => r.role === 'heading').length, 1);
    assert.equal(rows.at(-1).role, 'answer');
  }
  const old = {
    ...lesson,
    exercises: lesson.exercises.filter(
      (e) => !e.id.startsWith('measure-word-')
    ),
  };
  assert.deepEqual(add([old])[0].exercises, lesson.exercises);
  assert.equal(add([lesson])[0], lesson);
  const edited = { ...words[0], prompt: 'Teacher edited question' };
  assert.equal(
    add([{ ...old, exercises: [...old.exercises, edited] }])[0].exercises.find(
      (e) => e.id === edited.id
    ),
    edited
  );
});

test('grade 3 midpoint diagrams distinguish between and midpoint and survive exports', async () => {
  const { midpointLesson: lesson, addMidpointLesson: add } =
    load('midpoint-lesson');
  const { parseSegment, segmentGeometry } = load('segment');
  assert.equal(lesson.grade, 3);
  assert.equal(lesson.semester, '1');
  assert.equal(lesson.exercises.length, 24);
  assert.equal(
    lesson.exercises.filter((e) => e.section === 'extra').length,
    20
  );
  assert.equal(segmentGeometry([3, 3, 0, 1]).middle, 240);
  assert.ok(segmentGeometry([2, 4, 0, 1]).middle < 240);
  for (const values of [
    [0, 2, 0, 0],
    [2, 2, 1, 1],
    [2, 2, 2, 0],
    [2, 2, 0],
    [2, Infinity, 0, 0],
  ])
    assert.throws(() => parseSegment(values));
  for (const e of lesson.exercises.filter(
    (e) => e.segment && e.segment[3] && e.kind === 'choice'
  )) {
    assert.equal(e.answer, e.segment[0] === e.segment[1] ? 'Có' : 'Không');
  }
  assert.deepEqual(
    (await decodeMathLesson(await encodeMathLesson(lesson))).exercises,
    lesson.exercises
  );
  const edited = { ...lesson, title: 'Edited' };
  assert.equal(add([edited])[0], edited);
  const original = [exampleLessons[0]];
  assert.equal(add(original).length, 2);
  assert.equal(original.length, 1);
  const full = Array.from({ length: 100 }, (_, i) => ({
    ...edited,
    id: `custom-${i}`,
  }));
  assert.equal(add(full), full);
  const font = fs.readFileSync(
    path.join(__dirname, '../public/fonts/DejaVuSans.ttf')
  );
  for (const mode of ['worksheet', 'solutions']) {
    const pdf = load('pdf').createPracticePdf(lesson, mode, font);
    assert.equal(Buffer.from(pdf).subarray(0, 8).toString(), '%PDF-1.7');
    if (process.env.MATH_PDF_QA_DIR) {
      fs.mkdirSync(process.env.MATH_PDF_QA_DIR, { recursive: true });
      fs.writeFileSync(
        path.join(process.env.MATH_PDF_QA_DIR, `midpoint-${mode}.pdf`),
        pdf
      );
    }
  }
});

function createMathComponentHooks() {
  const slots = [];
  let cursor = 0;
  let pendingEffects = [];
  let dirty = false;
  const sameDependencies = (left, right) =>
    left !== undefined &&
    right !== undefined &&
    left.length === right.length &&
    left.every((value, index) => Object.is(value, right[index]));
  const hooks = {
    useState(initial) {
      const index = cursor++;
      if (!slots[index])
        slots[index] = {
          kind: 'state',
          value: typeof initial === 'function' ? initial() : initial,
        };
      const slot = slots[index];
      return [
        slot.value,
        (next) => {
          const value = typeof next === 'function' ? next(slot.value) : next;
          if (!Object.is(value, slot.value)) {
            slot.value = value;
            dirty = true;
          }
        },
      ];
    },
    useRef(initial) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { kind: 'ref', current: initial };
      return slots[index];
    },
    useMemo(factory, dependencies) {
      const index = cursor++;
      const previous = slots[index];
      if (!previous || !sameDependencies(previous.dependencies, dependencies))
        slots[index] = {
          kind: 'memo',
          dependencies,
          value: factory(),
        };
      return slots[index].value;
    },
    useCallback(callback, dependencies) {
      return hooks.useMemo(() => callback, dependencies);
    },
    useEffect(effect, dependencies) {
      const index = cursor++;
      const previous = slots[index];
      if (!previous || !sameDependencies(previous.dependencies, dependencies))
        pendingEffects.push(() => {
          previous?.cleanup?.();
          const cleanup = effect();
          slots[index] = {
            kind: 'effect',
            dependencies,
            cleanup: typeof cleanup === 'function' ? cleanup : undefined,
          };
        });
    },
  };
  return {
    hooks,
    render(component) {
      for (let attempts = 0; attempts < 20; attempts++) {
        cursor = 0;
        pendingEffects = [];
        dirty = false;
        const tree = component();
        for (const run of pendingEffects) run();
        if (!dirty) return tree;
      }
      throw new Error('Math component harness did not settle.');
    },
    unmount() {
      for (const slot of slots) slot?.cleanup?.();
    },
  };
}

function loadMathComponent(file, hooks) {
  const module = { exports: {} };
  const jsx = (type, props) => ({ type, props: props || {} });
  const styles = new Proxy({}, { get: (_, key) => String(key) });
  const code = ts.transpileModule(
    fs.readFileSync(
      path.join(__dirname, '../src/components/math', file),
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
      if (name === 'react') return hooks;
      if (name === 'react/jsx-runtime')
        return { jsx, jsxs: jsx, Fragment: 'Fragment' };
      if (name.startsWith('@/lib/math/')) return load(name.slice('@/lib/math/'.length));
      if (name === '@/lib/math/placement') return load('placement');
      if (name === 'next/dynamic') return { default: () => 'TeachingTimer' };
      if (name === './MathLesson.module.css') return { default: styles };
      if (name === './MathText')
        return { MathText: 'MathText', Fraction: 'Fraction', MathNotationGrade: { Provider: 'MathNotationGrade' } };
      return { default: name.replace(/^\.\//, '') };
    },
    module,
    module.exports
  );
  return module.exports.default;
}

function mathComponentNodes(node, type) {
  if (!node) return [];
  if (Array.isArray(node))
    return node.flatMap((child) => mathComponentNodes(child, type));
  if (typeof node !== 'object') return [];
  return [
    ...(!type || node.type === type ? [node] : []),
    ...mathComponentNodes(node.props?.children, type),
  ];
}

function mathComponentText(node) {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(mathComponentText).join('');
  return node?.props ? mathComponentText(node.props.children) : '';
}

function teachingModeFixture() {
  const block = (id, section, title) => ({
    id,
    section,
    title,
    text: `${title} text`,
    visual: 'none',
    values: [],
  });
  return {
    id: 'teaching-mode-fixture',
    title: 'Teaching mode fixture',
    grade: 3,
    semester: '1',
    topic: 'Hình học',
    goal: 'Move through one item at a time.',
    textbook: '',
    teacherNotes: 'Private',
    blocks: [
      block('foundation-block', 'foundation', 'Foundation block'),
      block('explore-block-1', 'explore', 'Explore block one'),
      block('explore-block-2', 'explore', 'Explore block two'),
    ],
    exercises: [
      {
        id: 'foundation-draft',
        section: 'foundation',
        kind: 'number',
        prompt: 'Core draft question',
        answer: '12',
        options: [],
        unit: 'cm',
        hint: 'Try again.',
        solution: '12 cm.',
        simplified: false,
        tolerance: 0,
        mistakes: [],
      },
    ],
  };
}

function createTeachingModeHarness(options = {}) {
  const runtime = createMathComponentHooks();
  const listeners = new Map();
  const data = { ...(options.storage || {}) };
  const writes = [];
  let blurCount = 0;
  class HarnessElement {
    constructor({
      contentEditable = false,
      interactive = false,
      navigation = false,
    } = {}) {
      this.isContentEditable = contentEditable;
      this.interactive = interactive;
      this.navigation = navigation;
    }
    blur() {
      blurCount++;
    }
    closest(selector) {
      if (selector === '[data-teaching-navigation]')
        return this.navigation ? this : null;
      return this.interactive ? this : null;
    }
  }
  const body = { style: { overflow: 'clip' } };
  const activeElement = new HarnessElement({ interactive: true });
  const fakeWindow = {
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    removeEventListener(type, listener) {
      if (listeners.get(type) === listener) listeners.delete(type);
    },
  };
  const fakeDocument = {
    body,
    activeElement,
    querySelector() {
      return null;
    },
  };
  const fakeStorage = {
    getItem(key) {
      return Object.hasOwn(data, key) ? data[key] : null;
    },
    setItem(key, value) {
      data[key] = value;
      writes.push([key, value]);
    },
  };
  const replacements = {
    window: fakeWindow,
    document: fakeDocument,
    localStorage: fakeStorage,
    HTMLElement: HarnessElement,
    requestAnimationFrame(callback) {
      callback();
      return 1;
    },
  };
  const originals = new Map();
  for (const [name, value] of Object.entries(replacements)) {
    originals.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, {
      configurable: true,
      writable: true,
      value,
    });
  }
  const Component = loadMathComponent('MathLesson.tsx', runtime.hooks);
  const props = {
    lesson: options.lesson || teachingModeFixture(),
    preview: options.preview || false,
    initialReviewMode: options.initialReviewMode || false,
    onBack() {},
    ...(options.withSave ? { onSave: () => true } : {}),
  };
  const render = () => runtime.render(() => Component(props));
  const button = (label) =>
    mathComponentNodes(render(), 'button').find((node) =>
      mathComponentText(node).includes(label)
    );
  const click = (label) => {
    const target = button(label);
    assert.ok(target, `Missing button: ${label}`);
    target.props.onClick({ preventDefault() {} });
    return render();
  };
  render();
  return {
    body,
    button,
    click,
    data,
    writes,
    element: (attributes) => new HarnessElement(attributes),
    get blurCount() {
      return blurCount;
    },
    render,
    dispatchKey(key, attributes = {}) {
      const event = {
        key,
        defaultPrevented: false,
        repeat: false,
        ctrlKey: false,
        metaKey: false,
        altKey: false,
        shiftKey: false,
        target: new HarnessElement(),
        ...attributes,
        preventDefault() {
          this.defaultPrevented = true;
        },
      };
      listeners.get('keydown')?.(event);
      render();
      return event;
    },
    hasKeyListener: () => listeners.has('keydown'),
    restore() {
      runtime.unmount();
      for (const [name, descriptor] of originals) {
        if (descriptor) Object.defineProperty(globalThis, name, descriptor);
        else delete globalThis[name];
      }
    },
  };
}

test('teaching mode toggles review chrome and moves one active item across sections', () => {
  const harness = createTeachingModeHarness({
    initialReviewMode: true,
    withSave: true,
  });
  const activeItems = () =>
    mathComponentNodes(harness.render(), 'div').filter(
      (node) => node.props.className === 'teachingItem' && !node.props.hidden
    );
  try {
    assert.equal(harness.button('Giảng bài').props['aria-pressed'], false);
    assert.ok(harness.button('Kết thúc rà soát'));
    assert.equal(activeItems().length, 2);

    let tree = harness.click('Giảng bài');
    assert.equal(harness.button('Thoát giảng bài').props['aria-pressed'], true);
    assert.match(tree.props.className, /\bteachingMode\b/);
    assert.equal(harness.button('Kết thúc rà soát'), undefined);
    assert.equal(harness.body.style.overflow, 'hidden');
    assert.equal(harness.blurCount, 1);
    assert.equal(activeItems().length, 1);
    assert.match(mathComponentText(activeItems()[0]), /Foundation block/);

    harness.click('Tiếp →');
    assert.equal(activeItems().length, 1);
    assert.equal(mathComponentNodes(activeItems()[0], 'Exercise').length, 1);
    assert.match(mathComponentText(harness.render()), /Câu 1\/1/);

    harness.click('Tiếp →');
    assert.equal(activeItems().length, 1);
    assert.match(mathComponentText(activeItems()[0]), /Explore block one/);
    assert.match(mathComponentText(harness.render()), /Nội dung 1\/2/);

    harness.click('← Trước');
    assert.equal(mathComponentNodes(activeItems()[0], 'Exercise').length, 1);
    harness.click('Thoát giảng bài');
    tree = harness.render();
    assert.doesNotMatch(tree.props.className, /\bteachingMode\b/);
    assert.equal(harness.body.style.overflow, 'clip');
    assert.ok(harness.button('Rà soát bài học'));
    assert.equal(activeItems().length, 2);
  } finally {
    harness.restore();
  }
});

test('teaching keyboard navigation respects boundaries, modifiers and editable controls', () => {
  const harness = createTeachingModeHarness();
  const activeItem = () =>
    mathComponentNodes(harness.render(), 'div').find(
      (node) => node.props.className === 'teachingItem' && !node.props.hidden
    );
  const activeText = () => mathComponentText(activeItem());
  try {
    harness.click('Giảng bài');
    assert.equal(harness.hasKeyListener(), true);
    assert.match(activeText(), /Foundation block/);

    let event = harness.dispatchKey('ArrowLeft');
    assert.equal(event.defaultPrevented, false);
    assert.match(activeText(), /Foundation block/);

    event = harness.dispatchKey('ArrowRight', { ctrlKey: true });
    assert.equal(event.defaultPrevented, false);
    assert.match(activeText(), /Foundation block/);

    event = harness.dispatchKey('ArrowRight', {
      target: harness.element({ interactive: true }),
    });
    assert.equal(event.defaultPrevented, false);
    assert.match(activeText(), /Foundation block/);

    event = harness.dispatchKey('ArrowRight', {
      target: harness.element({ contentEditable: true }),
    });
    assert.equal(event.defaultPrevented, false);
    assert.match(activeText(), /Foundation block/);

    event = harness.dispatchKey('ArrowRight', {
      target: harness.element({ interactive: true, navigation: true }),
    });
    assert.equal(event.defaultPrevented, true);
    assert.equal(
      mathComponentNodes(activeItem(), 'Exercise').some(
        (node) => node.props.exercise.id === 'foundation-draft'
      ),
      true
    );

    event = harness.dispatchKey('ArrowLeft', { repeat: true });
    assert.equal(event.defaultPrevented, false);
    assert.match(mathComponentText(harness.render()), /Câu 1\/1/);
    event = harness.dispatchKey('ArrowLeft');
    assert.equal(event.defaultPrevented, true);
    assert.match(activeText(), /Foundation block/);

    harness.click('Tự kiểm tra');
    assert.equal(harness.button('Tiếp →').props.disabled, true);
    event = harness.dispatchKey('ArrowRight');
    assert.equal(event.defaultPrevented, false);
    assert.match(mathComponentText(harness.render()), /Tự kiểm tra · Nội dung/);

    event = harness.dispatchKey('Escape', {
      target: harness.element({ interactive: true }),
    });
    assert.equal(event.defaultPrevented, false);
    assert.ok(harness.button('Thoát giảng bài'));
    event = harness.dispatchKey('Escape');
    assert.equal(event.defaultPrevented, true);
    assert.ok(harness.button('Giảng bài'));
    assert.equal(harness.hasKeyListener(), false);
  } finally {
    harness.restore();
  }
});

test('unfinished core answers emit immediately and survive teaching navigation and reload', () => {
  const changes = [];
  const timers = [];
  const cleared = [];
  const originalSetTimeout = globalThis.setTimeout;
  const originalClearTimeout = globalThis.clearTimeout;
  globalThis.setTimeout = (callback, delay) => {
    assert.equal(delay, 800);
    const timer = { callback };
    timers.push(timer);
    return timer;
  };
  globalThis.clearTimeout = (timer) => cleared.push(timer);
  const exerciseRuntime = createMathComponentHooks();
  const Exercise = loadMathComponent('Exercise.tsx', exerciseRuntime.hooks);
  const exercise = teachingModeFixture().exercises[0];
  try {
    const tree = exerciseRuntime.render(() =>
      Exercise({
        exercise,
        result: {
          answer: '1',
          unit: 'cm',
          assisted: true,
          solved: false,
          attempted: true,
        },
        onChange: (result) => changes.push(result),
      })
    );
    const input = mathComponentNodes(tree, 'input').find(
      (node) => node.props.id === 'foundation-draft-answer'
    );
    input.props.onChange({ target: { value: '12' } });
    assert.deepEqual(changes, [
      {
        answer: '12',
        unit: 'cm',
        assisted: true,
        solved: false,
        attempted: true,
      },
    ]);
    assert.equal(timers.length, 0, 'typing a draft must not schedule grading');
  } finally {
    exerciseRuntime.unmount();
    globalThis.setTimeout = originalSetTimeout;
    globalThis.clearTimeout = originalClearTimeout;
  }
  assert.deepEqual(cleared, timers);

  const first = createTeachingModeHarness();
  let saved;
  try {
    first.click('Giảng bài');
    first.click('Tiếp →');
    const exerciseNode = mathComponentNodes(first.render(), 'Exercise').find(
      (node) => node.props.exercise.id === 'foundation-draft'
    );
    const draft = {
      answer: '12',
      unit: 'cm',
      assisted: true,
      solved: false,
      attempted: true,
    };
    exerciseNode.props.onChange(draft);
    first.render();
    first.click('Tiếp →');
    first.click('← Trước');
    assert.deepEqual(
      mathComponentNodes(first.render(), 'Exercise').find(
        (node) => node.props.exercise.id === 'foundation-draft'
      ).props.result,
      draft
    );
    const key = 'lima-math-progress-v1:teaching-mode-fixture';
    saved = { [key]: first.data[key] };
    assert.deepEqual(
      JSON.parse(first.data[key]).results['foundation-draft'],
      draft
    );
  } finally {
    first.restore();
  }

  const reloaded = createTeachingModeHarness({ storage: saved });
  try {
    assert.deepEqual(
      mathComponentNodes(reloaded.render(), 'Exercise').find(
        (node) => node.props.exercise.id === 'foundation-draft'
      ).props.result,
      {
        answer: '12',
        unit: 'cm',
        assisted: true,
        solved: false,
        attempted: true,
      }
    );
  } finally {
    reloaded.restore();
  }
});

test('exponent review precedes application questions and preserves saved work', () => {
  const { rationalExponentsLesson: lesson, rationalExponentReview: review, addRationalExponentReview: add } = load('rational-exponents-lesson');
  assert.equal(review.length, 10);
  const values = [2**0,2**1,2**4,(-2)**2,(-2)**3,2**2*2**3,(2**3)**2,(2**2)**3,2**3/2**2,1/4];
  review.forEach((e,i) => {
    const value = e.kind === 'fraction' ? e.answer.split('/').map(Number).reduce((a,b) => a/b) : Number(e.answer);
    assert.equal(value, values[i]);
  });
  const rest = lesson.exercises.filter(e => !e.id.startsWith('re-review-'));
  const edited = { ...review[0], hint: 'Teacher hint' };
  const original = { ...lesson, exercises: [...rest, edited] };
  const updated = add([original])[0];
  assert.equal(updated.exercises[0], edited);
  assert.deepEqual(updated.exercises.slice(10), rest);
  assert.deepEqual(add([updated]), [updated]);
  assert.equal(original.exercises.length, rest.length + 1);
  assert.deepEqual(lesson.exercises.filter(e => e.section === 'extra').slice(0,10), review);
  assert.doesNotThrow(() => parseMathPack(packLessons([updated])));
});

test('grouped exercises keep independent IDs, labels, progress and PDF exports', () => {
  const { exerciseLabels, sameExerciseContent } = load('exercise-groups');
  const { rationalExponentsLesson: lesson, groupRationalExponentExercises: group } = load('rational-exponents-lesson');
  const exercises = lesson.exercises.filter(e => e.section === 'extra');
  const labels = exerciseLabels(exercises);
  assert.equal(labels[0].label, 'Bài 1(a)');
  assert.equal(labels[4].label, 'Bài 1(e)');
  assert.equal(labels[5].label, 'Bài 2(a)');
  assert.equal(labels[0].prompt, 'a) 2^0.');
  const old = exercises.map(({ task, ...e }) => e);
  assert.ok(sameExerciseContent(JSON.stringify(old), exercises));
  assert.equal(sameExerciseContent(JSON.stringify(old), exercises.map((e,i) => i ? e : { ...e, answer: '99' })), false);
  const grouped = group([{ ...lesson, exercises: old }])[0];
  assert.deepEqual(grouped.exercises, exercises);
  assert.deepEqual(group([grouped]), [grouped]);
  const custom = { ...old[0], prompt: 'Teacher custom prompt' };
  assert.equal(group([{ ...lesson, exercises: [custom] }])[0].exercises[0], custom);
  const mixed = exerciseLabels([exercises[0], {...exercises[1],task:undefined}, exercises[2]]);
  assert.deepEqual(mixed.map(e => e.label), ['Bài 1(a)','Bài 2','Bài 3(a)']);
  assert.equal(exerciseLabels(Array.from({ length: 28 }, () => exercises[0]))[26].part, 'aa');
  const font = fs.readFileSync(path.join(__dirname, '../public/fonts/DejaVuSans.ttf'));
  for (const mode of ['worksheet','solutions']) {
    const bytes = load('pdf').createPracticePdf(lesson, mode, font);
    if (process.env.MATH_PDF_QA_DIR) {
      fs.mkdirSync(process.env.MATH_PDF_QA_DIR, { recursive: true });
      fs.writeFileSync(path.join(process.env.MATH_PDF_QA_DIR, `grouped-${mode}.pdf`), bytes);
    }
  }
});


test('tall exponent workings share two columns and the taller writing area', () => {
  const { rationalExponentsLesson: source } = load('rational-exponents-lesson');
  const lesson = { ...source, knowledgeSummary: '', exercises: source.exercises.filter(e => ['re-ex-35', 're-ex-36'].includes(e.id)) };
  const font = fs.readFileSync(path.join(__dirname, '../public/fonts/DejaVuSans.ttf'));
  for (const mode of ['worksheet', 'solutions']) {
    const bytes = load('pdf').createPracticePdf(lesson, mode, font);
    const rows = pdfTextRows(bytes);
    const prompts = rows.filter(row => /^[ab]\)/u.test(row.text));
    assert.equal(prompts.length, 2);
    assert.equal(prompts[0].left, 44);
    assert.ok(prompts[1].left > 290);
    assert.equal(prompts[0].page, prompts[1].page);
    assert.equal(prompts[0].y, prompts[1].y);
    if (mode === 'worksheet') {
      const dots = [...Buffer.from(bytes).toString('latin1').matchAll(/1 J \[0 3\] 0 d ([\d.]+) ([\d.]+) m ([\d.]+) ([\d.]+) l S Q/g)];
      const left = dots.filter(d => Number(d[1]) === 44).map(d => d[2]);
      const right = dots.filter(d => Number(d[1]) > 290).map(d => d[2]);
      assert.equal(left.length, 6);
      assert.deepEqual(right, left, 'both columns have identical dotted row baselines');
    }
    if (mode === 'worksheet') assert.ok(rows.every(row => !/Đáp án:|Cách làm:/u.test(row.text)));
  }
});


test('reviewed task groups cover other lessons without changing questions or saved progress', () => {
  const { legacyExampleLessons } = load('examples');
  const { consolidateFractionLessons } = load('fraction-consolidation');
  const { groupExampleExercises, upgradeExampleExerciseGroups } = load('example-exercise-groups');
  const { sameExerciseContent, exerciseLabels } = load('exercise-groups');
  const before = consolidateFractionLessons(legacyExampleLessons, legacyExampleLessons);
  const after = groupExampleExercises(before);
  assert.deepEqual(after, exampleLessons);
  assert.deepEqual(groupExampleExercises(after), after);
  for (const lesson of after) {
    const source = before.find(l => l.id === lesson.id);
    assert.ok(sameExerciseContent(JSON.stringify(source.exercises), lesson.exercises), lesson.id);
    assert.deepEqual(lesson.exercises.map(e => e.id), source.exercises.map(e => e.id));
    if (lesson.exercises.some(e => e.section === 'extra'))
      assert.ok(lesson.exercises.some(e => e.task), lesson.id);
  }
  const source = after.find(l => l.id === 'math-measurement-units-3');
  const old = { ...source, exercises: source.exercises.map(({ task, ...e }) => e) };
  const updated = upgradeExampleExerciseGroups([old], after)[0];
  assert.deepEqual(updated, source);
  assert.deepEqual(upgradeExampleExerciseGroups([updated], after), [updated]);
  const index = old.exercises.findIndex(e => e.section === 'extra');
  for (const edit of [{ prompt: 'Custom question' }, { task: 'Custom group' }, { answer: '999' }]) {
    const custom = { ...old, exercises: old.exercises.map((e, i) => i === index ? { ...e, ...edit } : e) };
    assert.equal(upgradeExampleExerciseGroups([custom], after)[0].exercises[index], custom.exercises[index]);
  }
  const customLesson = { ...old, id: 'teacher-lesson' };
  assert.equal(upgradeExampleExerciseGroups([customLesson], after)[0], customLesson);
  const labels = exerciseLabels(source.exercises.filter(e => e.section === 'extra'));
  assert.equal(labels[0].prompt, 'a) 1 cm = … mm.');
  assert.equal(labels[8].prompt, 'a) 250 mm + 100 mm.');
  const components = after.find(l => l.id === 'math-add-subtract-components-3');
  assert.equal(exerciseLabels(components.exercises.filter(e => e.section === 'extra'))[0].prompt, 'a) □ + 18 = 45.');
});

test('all grouped lesson PDFs retain every part in order and stay within page bounds', () => {
  const { exerciseLabels } = load('exercise-groups');
  const { createPracticePdf } = load('pdf');
  const font = fs.readFileSync(path.join(__dirname, '../public/fonts/DejaVuSans.ttf'));
  for (const lesson of exampleLessons) {
    const extra = lesson.exercises.filter(e => e.section === 'extra');
    if (!extra.length) continue;
    const labels = exerciseLabels(extra);
    for (const mode of ['worksheet', 'solutions']) {
      const bytes = createPracticePdf(lesson, mode, font);
      const rows = pdfTextRows(bytes);
      const actual = rows.filter(r => /^(?:Bài \d+\.|[a-z]+\))/u.test(r.text));
      const expected = labels.flatMap(l => [
        ...(l.title && l.first ? [`Bài ${l.number}.`] : []),
        l.part ? `${l.part})` : `Bài ${l.number}.`,
      ]);
      assert.deepEqual(actual.map(r => r.text.match(/^(?:Bài \d+\.|[a-z]+\))/u)[0]), expected, `${lesson.id}: ${mode}`);
      for (const row of rows) {
        assert.ok(row.left >= 43.9 && row.right <= 551.4 && row.y > 0 && row.y < 842, `${lesson.id}: ${row.text}`);
      }
      if (mode === 'worksheet') assert.ok(!rows.some(r => /^(?:Đáp án:|Cách làm:|Bài giải:|Đáp số:)/u.test(r.text)), lesson.id);
    }
  }
});

test('find-x exponent questions cover the rules and have correct unique or complete answers', () => {
  const { rationalExponentEquations: questions, addRationalExponentEquations: add } = load('rational-exponent-equations');
  const { rationalExponentsLesson: lesson } = load('rational-exponents-lesson');
  assert.equal(questions.length, 33);
  const value = text => text.split('/').map(Number).reduce((a,b) => a/b);
  const checks = [
    x=>x===2**0, x=>x===(-3/5)**0, x=>x===-2/3, x=>2**x===1, x=>2**x===16, x=>2**x===2, x=>3**x===3**2,
    x=>2**x*2**3===2**7, x=>3**2*3**x===3**5, x=>x>=2&&5**x/5**2===5**3,
    x=>x<=6&&7**6/7**x===7**2, x=>(1/2)**x*(1/2)**2===(1/2)**5, x=>(-2)**x*(-2)**3===(-2)**7,
    x=>(2**x)**3===2**12, x=>(3**2)**x===3**6, x=>((-.5)**2)**x===(-.5)**8,
    x=>x>=1&&(5**x)**2/5**2===5**4,
    x=>Math.abs((2/3)**x-8/27)<1e-12, x=>(-.5)**x===1/16, x=>.5**x===.125, x=>(-.5)**x===(-.5)**3,
    x=>x+2**3===11, x=>x-(-2)**3===5, x=>.5**2*x===3/8, x=>x/(-2)**3===1/4,
    x=>2**(x+1)===32, x=>4**x===2**6,
    x=>Number.isInteger(x)&&x>=0&&(x+1)**2===2**2,
    x=>Number.isInteger(x)&&x>=2&&(x-2)**3===3**3,
    x=>Number.isInteger(x)&&x>=0&&(2*x)**2===4**2,
    x=>Number.isInteger(2*x)&&2*x>=0&&2**(2*x)===2,
    x=>Number.isInteger(x)&&x>=0&&3**(x+2)===3**5,
    x=>Number.isInteger(3*x)&&3*x>=0&&.5**(3*x)===.5**2,
  ];
  checks.forEach((check,i)=> {
    const q=questions[i]; const answer=value(q.answer);
    assert.ok(check(answer), q.id);
    assert.ok(checkAnswer(q, q.answer, '').correct, q.id);
    const candidates=[...new Set([answer,...Array.from({length:41},(_,j)=>(j-20)/2)])];
    assert.deepEqual(candidates.filter(check), [answer], q.id);
  });
  assert.ok(questions.every(q=>q.kind !== 'choice'));
  assert.ok(lesson.exercises.length<=100);
  assert.doesNotThrow(()=>parseMathPack(packLessons([lesson])));
  const old={...lesson,exercises:lesson.exercises.filter(e=>!e.id.startsWith('re-find-x-'))};
  const upgraded=add([old])[0];
  assert.deepEqual(upgraded.exercises.slice(0,old.exercises.length),old.exercises);
  assert.deepEqual(upgraded,lesson);
  assert.deepEqual(add([upgraded]),[upgraded]);
  const edited={...questions[0],prompt:'Custom prompt'};
  const partial={...old,exercises:[...old.exercises,edited]};
  assert.equal(add([partial])[0].exercises.find(e=>e.id===edited.id),edited);
  const full={...old,exercises:Array.from({length:100},(_,i)=>({...old.exercises[0],id:`custom-${i}`}))};
  assert.equal(add([full])[0],full);
});

test('find-x solutions use authored equation rows and safely upgrade saved examples', () => {
  const { rationalExponentEquations: questions, updateExponentCoefficientNotation: upgrade } = load('rational-exponent-equations');
  const { rationalExponentsLesson: lesson } = load('rational-exponents-lesson');
  const q = questions.find(e => e.id === 're-find-x-1-3');
  assert.equal(q.solution, 'x^1 = -2/3\nx^1 = (-2/3)^1\nx = -2/3');
  for (const e of questions) {
    assert.ok(e.solution.includes('\n'), e.id);
    assert.equal(formatCalculationSteps(e.solution), e.solution);
    assert.equal(e.solution.split('\n').at(-1), `x = ${e.answer}`, e.id);
    assert.ok(e.solution.split('\n').every(line => line.includes('=') || line.startsWith('Vì ')), e.id);
    const x = e.answer.split('/').map(Number).reduce((a, b) => a / b);
    const evaluate = expression => Function('x', `return ${expression.replace(/(\d)x/g, '$1*x').replace(/,/g, '.').replace(/×/g, '*').replace(/:/g, '/').replace(/\^/g, '**').replace(/\[/g, '(').replace(/\]/g, ')')}`)(x);
    for (const line of e.solution.split('\n').filter(line => !line.startsWith('Vì '))) {
      const [left, right] = line.split('=');
      assert.ok(Math.abs(evaluate(left) - evaluate(right)) < 1e-10, `${e.id}: ${line}`);
    }
  }
  const old = { ...q, solution: 'x^1 = x nên x = -2/3.' };
  assert.equal(upgrade([{ ...lesson, exercises: [old] }])[0].exercises[0].solution, q.solution);
  for (const edit of [{ solution: 'Teacher explanation' }, { prompt: 'Teacher question' }, { answer: '2' }]) {
    const custom = { ...old, ...edit };
    assert.equal(upgrade([{ ...lesson, exercises: [custom] }])[0].exercises[0].solution, custom.solution);
  }
  assert.deepEqual(upgrade(upgrade([lesson])), upgrade([lesson]));
});

test('multiplication notation follows grade while preserving authored unknowns', () => {
  const { formatMultiplicationNotation: format, variableParts } = load('format');
  for (let grade = 1; grade <= 5; grade++) {
    assert.equal(format('□ × 7 = 42', grade), '□ × 7 = 42');
    assert.equal(format('Tìm x: 6 × x = 42', grade), 'Tìm x: 6 × x = 42');
  }
  for (const grade of [6, 7]) {
    assert.equal(format('(1/2)^2 × x = 3/8', grade), '(1/2)^2 · x = 3/8');
    assert.equal(format('x × 6 = 42', grade), 'x · 6 = 42');
    assert.equal(format('6 × 7 = 42; □ × 7 = 42; xe xanh', grade), '6 × 7 = 42; □ × 7 = 42; xe xanh');
  }
  assert.deepEqual(variableParts('xe xanh; 2x; x^2'), ['xe xanh; 2', 'x', '; ', 'x', '^2']);
  const { createPracticePdf } = load('pdf');
  const { rationalExponentsLesson: lesson } = load('rational-exponents-lesson');
  const font = fs.readFileSync(path.join(__dirname, '../public/fonts/DejaVuSans.ttf'));
  const source = lesson.exercises.find(e => e.id === 're-find-x-5-3');
  for (const grade of [3, 5, 6, 7]) {
    const exercise = { ...source, id: 'notation-test', task: undefined, prompt: 'Tìm x: 6 × x = 42.', answer: '7', kind: 'number', solution: 'x = 42 : 6\nx = 7' };
    const bytes = createPracticePdf({ ...lesson, grade, exercises: [exercise] }, 'solutions', font, { includeKnowledgeSummary: false });
    const text = pdfTextRows(bytes).map(row => row.text).join(' ');
    assert.ok(text.includes(grade < 6 ? '×' : '·'), `grade ${grade}`);
    assert.match(Buffer.from(bytes).toString('latin1'), /q BT 3 Tr ET/);
    assert.ok(Buffer.from(bytes).toString('latin1').includes(load('math-variable-glyph').mathXPdfPath));
    assert.ok(Buffer.from(bytes).toString('latin1').includes(`${load('math-variable-glyph').mathXStrokeWidth} w 1 j`));
    assert.equal(exercise.prompt, 'Tìm x: 6 × x = 42.');
  }
});

test('interactive labs preserve legacy lessons and survive cloning, import and sharing', async () => {
  const { interactiveLabFor } = load('interactive-lab');
  const { duplicateLesson } = load('lessons');
  for (const [id, kind] of [['math-unit-fractions-3', 'sharing'], ['math-number-line-7', 'number-line'], ['math-rational-exponents-7', 'powers']]) {
    const lesson = exampleLessons.find(l => l.id === id);
    const before = JSON.stringify(lesson);
    assert.equal(interactiveLabFor(lesson), kind);
    assert.equal(JSON.stringify(lesson), before, 'opening the lab must not change the progress fingerprint');
    const copied = duplicateLesson(lesson);
    assert.notEqual(copied.id, id);
    assert.equal(interactiveLabFor(copied), kind);
    const parsed = parseMathPack(packLessons([copied])).lessons[0];
    assert.equal(parsed.interactiveLab, kind);
    const shared = await decodeMathLesson(await encodeMathLesson(parsed));
    assert.equal(shared.interactiveLab, kind);
    assert.equal(shared.teacherNotes, '');
    assert.equal(interactiveLabFor({ ...lesson, interactiveLab: 'none' }), 'none');
    assert.equal(interactiveLabFor({ ...lesson, grade: 12 }), 'none');
  }
  const invalid = { ...exampleLessons[0], interactiveLab: 'unknown' };
  assert.throws(() => parseMathPack(packLessons([invalid])), /Hoạt động tương tác/);
});

test('interactive checkpoints assess mathematical relationships across fresh rounds', () => {
  const { SHARING_ROUNDS, LINE_ROUNDS, checkSharing, checkPlacement, fractionLabel } = load('interactive-lab');
  for (const { total, groups } of SHARING_ROUNDS) {
    assert.equal(checkSharing(Array(groups).fill(total / groups), total).correct, true);
    assert.equal(checkSharing(Array(groups).fill(0), total).correct, false);
    assert.equal(checkSharing([total, ...Array(groups - 1).fill(0)], total).correct, false);
  }
  for (const { numerator, denominator } of LINE_ROUNDS) {
    assert.equal(checkPlacement(numerator, numerator, denominator).correct, true);
    assert.equal(checkPlacement(-numerator, numerator, denominator).correct, false);
    assert.match(checkPlacement(-numerator, numerator, denominator).message, /Khoảng cách/);
    assert.equal(checkPlacement(numerator + 1, numerator, denominator).correct, false);
  }
  assert.equal(fractionLabel(-2, 4), '-1/2');
  assert.equal(fractionLabel(-8, 4), '-2');
  assert.equal(fractionLabel(0, 3), '0');
});

test('number placement waits for a pause, replaces pending checks, and cancels on leaving', () => {
  const shell = createMathComponentHooks();
  const runtime = createMathComponentHooks();
  let activeRuntime = shell;
  const hooks = Object.fromEntries(Object.keys(shell.hooks).map(name => [name, (...args) => activeRuntime.hooks[name](...args)]));
  hooks.useId = () => 'placement-test';
  const Lab = loadMathComponent('InteractiveLab.tsx', hooks);
  const outer = shell.render(() => Lab({ kind: 'number-line' }));
  const Placement = mathComponentNodes(outer).find(n => typeof n.type === 'function' && n.type.name === 'NumberPlacement').type;
  activeRuntime = runtime;
  const originalSet = globalThis.setTimeout;
  const originalClear = globalThis.clearTimeout;
  const pending = new Map();
  let id = 0;
  let completed = 0;
  globalThis.setTimeout = (callback, delay) => {
    assert.equal(delay, 650);
    pending.set(++id, callback);
    return id;
  };
  globalThis.clearTimeout = timer => pending.delete(timer);
  const render = () => runtime.render(() => Placement({ round: 0, onComplete: () => completed++ }));
  const feedback = tree => mathComponentNodes(tree).find(n => typeof n.type === 'function' && n.type.name === 'FeedbackMessage').props.value;
  try {
    let tree = render();
    assert.equal(pending.size, 0);
    assert.equal(feedback(tree), null);
    assert.ok(!mathComponentText(tree).includes('Kiểm tra vị trí'));
    assert.equal(mathComponentText(mathComponentNodes(tree, 'label')[0]), 'Di chuyển điểm A');
    mathComponentNodes(tree, 'input')[0].props.onChange({ target: { value: '-2' } });
    tree = render();
    assert.equal(feedback(tree), null);
    mathComponentNodes(tree, 'button').find(n => n.props['aria-label'].startsWith('Sang trái')).props.onClick();
    tree = render();
    assert.equal(pending.size, 1);
    const callback = [...pending.values()][0];
    pending.clear();
    callback();
    tree = render();
    assert.equal(feedback(tree).correct, true);
    assert.match(feedback(tree).message, /Em đặt A tại -3\/4/);
    assert.equal(feedback(tree).title, 'Đúng rồi!');
    assert.equal(completed, 1);
    mathComponentNodes(tree, 'input')[0].props.onChange({ target: { value: '0' } });
    tree = render();
    assert.equal(feedback(tree), null);
    assert.equal(pending.size, 1);
    const incorrectCheck = [...pending.values()][0];
    pending.clear();
    incorrectCheck();
    tree = render();
    assert.equal(feedback(tree).correct, false);
    assert.equal(feedback(tree).title, 'Chưa đúng — thử lại nhé.');
    mathComponentNodes(tree, 'input')[0].props.onChange({ target: { value: '1' } });
    render();
    runtime.unmount();
    assert.equal(pending.size, 0);
  } finally {
    runtime.unmount();
    shell.unmount();
    globalThis.setTimeout = originalSet;
    globalThis.clearTimeout = originalClear;
  }
});

test('powers warmup waits for an attempt before explaining and supports correction', () => {
  const runtime = createMathComponentHooks();
  const Warmup = loadMathComponent('FoundationWarmup.tsx', runtime.hooks);
  const render = () => runtime.render(() => Warmup({ kind: 'powers' }));
  try {
    let tree = render();
    const status = () => mathComponentNodes(tree).find(n => n.props?.role === 'status');
    assert.equal(mathComponentText(status()), '');
    for (const choice of ['3^2', '2 × 3', '2^3']) {
      mathComponentNodes(tree, 'button').find(n => mathComponentText(n) === choice).props.onClick();
      tree = render();
      assert.match(mathComponentText(status()), choice === '2^3' ? /Đúng rồi!/ : /Chưa đúng/);
      assert.equal(mathComponentNodes(tree, 'button').filter(n => n.props['aria-pressed']).length, 1);
    }
    assert.match(mathComponentText(status()), /Cơ số 2/);
  } finally { runtime.unmount(); }
});

test('typed answers remain drafts until explicit submission and composition does not submit', () => {
  const runtime = createMathComponentHooks();
  const Exercise = loadMathComponent('Exercise.tsx', runtime.hooks);
  const exercise = { ...teachingModeFixture().exercises[0], unit: '', answer: '12' };
  let result;
  const render = () => runtime.render(() => Exercise({ exercise, result, onChange: r => { result = r; } }));
  try {
    let tree = render();
    mathComponentNodes(tree, 'input')[0].props.onChange({ target: { value: '1' } });
    tree = render();
    assert.equal(result.solved, false);
    assert.equal(result.attempted, undefined);
    assert.equal(result.assisted, false);
    mathComponentNodes(tree, 'input')[0].props.onChange({ target: { value: '12' } });
    tree = render();
    assert.equal(result.solved, false);
    const inputs = mathComponentNodes(tree, 'div').find(n => n.props.onCompositionStart);
    inputs.props.onCompositionStart();
    tree.props.onSubmit({ preventDefault() {} });
    assert.equal(result.solved, false);
    inputs.props.onCompositionEnd();
    tree = render();
    tree.props.onSubmit({ preventDefault() {} });
    assert.equal(result.solved, true);
    assert.equal(result.assisted, false);
    assert.equal(result.attempted, true);
  } finally { runtime.unmount(); }
});

test('teaching mode sequences a lab before explanations without rewriting saved lesson content', () => {
  const lesson = { ...teachingModeFixture(), interactiveLab: 'number-line' };
  const harness = createTeachingModeHarness({ lesson });
  try {
    harness.click('Giảng bài');
    harness.click('Khám phá');
    let tree = harness.render();
    const lab = mathComponentNodes(tree, 'InteractiveLab')[0];
    assert.equal(lab.props.kind, 'number-line');
    assert.match(mathComponentText(tree), /Khám phá tương tác/);
    harness.click('Tiếp →');
    tree = harness.render();
    assert.match(mathComponentText(tree), /Nội dung 1\//);
    assert.equal(mathComponentNodes(tree, 'div').find(n => n.props.children?.type === 'InteractiveLab').props.hidden, true);
    harness.click('← Trước');
    tree = harness.render();
    assert.equal(mathComponentNodes(tree, 'div').find(n => n.props.children?.type === 'InteractiveLab').props.hidden, false);
  } finally { harness.restore(); }
});

test('remaining Grade 3 and Grade 7 lessons resolve interactive activities without changing saved content', async () => {
  const { interactiveLabFor } = load('interactive-lab');
  const { duplicateLesson } = load('lessons');
  const presets = {
    'math-add-subtract-components-3': 'missing-parts',
    'math-multiply-divide-components-3': 'equal-groups',
    'math-measurement-units-3': 'measurement',
    'math-midpoint-3': 'midpoint',
    'math-rational-7': 'rational',
  };
  for (const [id, kind] of Object.entries(presets)) {
    const source = exampleLessons.find(l => l.id === id);
    const before = JSON.stringify(source);
    assert.equal(interactiveLabFor(source), kind);
    assert.equal(JSON.stringify(source), before);
    assert.equal(interactiveLabFor({ ...source, interactiveLab: 'none' }), 'none');
    const clone = duplicateLesson(source);
    assert.equal(clone.interactiveLab, kind);
    const shared = await decodeMathLesson(await encodeMathLesson(clone));
    assert.equal(shared.interactiveLab, kind);
  }
});

test('new models distinguish whole/part, group count/size, and both midpoint conditions', () => {
  const { partResult, groupResult, isMidpoint, RATIONAL_ROUNDS } = load('concept-labs');
  [24, 39, 15].forEach((answer, round) => {
    assert.equal(partResult(round, answer).correct, true);
    assert.equal(partResult(round, answer + 1).correct, false);
  });
  [6, 4, 20].forEach((answer, round) => {
    assert.equal(groupResult(round, answer).correct, true);
    assert.equal(groupResult(round, answer + 1).correct, false);
  });
  assert.equal(groupResult(0, 4).total, 16);
  assert.equal(groupResult(1, 6).total, 36);
  assert.equal(isMidpoint(8, 4, true), true);
  assert.equal(isMidpoint(8, 3, true), false);
  assert.equal(isMidpoint(8, 4, false), false);
  assert.equal(isMidpoint(8, 0, true), false);
  const expected = [1/2, -2/3, -1/2+3/4];
  RATIONAL_ROUNDS.forEach((r, i) => assert.equal(r.values[r.choices.indexOf(r.answer)], expected[i]));
});

test('rational comparison keeps both fractions visible before and after either answer', () => {
  const runtime = createMathComponentHooks();
  const Component = loadMathComponent('ConceptLab.tsx', runtime.hooks);
  let completions = 0;
  const render = () => runtime.render(() => {
    const child = Component({ kind: 'rational', round: 1, onComplete: () => completions++ });
    return child.type(child.props);
  });
  try {
    let tree = render();
    const diagram = () => mathComponentNodes(tree).find(n => n.props?.role === 'img');
    const initialDiagram = mathComponentText(diagram());
    const highlighted = () => mathComponentNodes(diagram()).filter(n => n.props?.['data-selected'] === true);
    assert.equal(highlighted().length, 0);
    assert.match(initialDiagram, /-3\/4 = -9\/12/);
    assert.match(initialDiagram, /-2\/3 = -8\/12/);
    for (const choice of ['-3/4', '-2/3']) {
      mathComponentNodes(tree, 'button').find(n => mathComponentText(n) === choice).props.onClick();
      tree = render();
      assert.equal(mathComponentText(diagram()), initialDiagram);
      assert.equal(highlighted().length, 1);
      assert.ok(mathComponentText(highlighted()[0]).startsWith(choice));
      const feedback = mathComponentNodes(tree).find(n => typeof n.type === 'function' && n.type.name === 'Feedback');
      assert.equal(feedback.props.correct, choice === '-2/3');
    }
    assert.equal(completions, 1);
  } finally { runtime.unmount(); }
});

test('new choice activities give feedback on selection and permit correction immediately', () => {
  for (const [kind, incorrect, correct] of [['missing-parts', 54, 24], ['equal-groups', 4, 6], ['measurement', 8, 6]]) {
    const runtime = createMathComponentHooks();
    const Component = loadMathComponent('ConceptLab.tsx', runtime.hooks);
    let completions = 0;
    const render = () => runtime.render(() => {
      const child = Component({ kind, round: 0, onComplete: () => completions++ });
      return child.type(child.props);
    });
    try {
      let tree = render();
      let choices = mathComponentNodes(tree).find(n => typeof n.type === 'function' && n.type.name === 'Choices');
      choices.props.onChoose(incorrect);
      tree = render();
      let feedback = mathComponentNodes(tree).find(n => typeof n.type === 'function' && n.type.name === 'Feedback');
      assert.equal(feedback.props.correct, false, kind);
      assert.equal(completions, 0);
      choices = mathComponentNodes(tree).find(n => typeof n.type === 'function' && n.type.name === 'Choices');
      choices.props.onChoose(correct);
      tree = render();
      feedback = mathComponentNodes(tree).find(n => typeof n.type === 'function' && n.type.name === 'Feedback');
      assert.equal(feedback.props.correct, true, kind);
      assert.equal(completions, 1);
    } finally { runtime.unmount(); }
  }
});
