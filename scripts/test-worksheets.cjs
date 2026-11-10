const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
let chess;
function load(path, overrides = {}) {
  const mod = { exports: {} };
  new Function(
    'module',
    'exports',
    'require',
    ts.transpileModule(fs.readFileSync(path, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        esModuleInterop: true,
        target: ts.ScriptTarget.ES2020,
      },
    }).outputText
  )(mod, mod.exports, (id) => {
    if (id === 'chess.js') return chess;
    if (id === './draw-levels') return load('src/lib/chess/draw-levels.ts');
    if (id === './practice-goals')
      return load('src/lib/chess/practice-goals.ts');
    if (id === './worksheet-layout')
      return load('src/lib/chess/worksheet-layout.ts');
    if (id === './worksheet-notation')
      return load('src/lib/chess/worksheet-notation.ts', {
        './worksheet': model,
      });
    return overrides[id] ?? require(id);
  });
  return mod.exports;
}
let model;
const library = load('src/lib/server/private-hub.ts').privatePages;
let topics;
const plan = (sections, catalog) =>
  model.planWorksheet(sections, catalog, topics);
test.before(async () => {
  chess = await import('chess.js');
  model = load('src/lib/chess/worksheet.ts');
  topics = model.worksheetTopicsFromLibrary(library);
});
test('worksheet level choices match the shared catalog order', () => {
  const { practiceLevels } = load('src/lib/chess/draw-levels.ts');
  assert.deepEqual(model.worksheetLevels, practiceLevels);
  assert.equal(
    topics.find((topic) => topic.id === 'skewer').endpoint,
    '/api/skewer-exercises'
  );
  for (const [level, solverMoves] of [
    ['D*', 4],
    ['E', 6],
    ['E*', 6],
  ]) {
    const exercise = {
      ...fork.find((item) => item.difficulty?.level === 'A'),
      difficulty: { level, solverMoves },
    };
    const [chapter] = plan([row(1, 'fork', level, 1)], { fork: [exercise] });
    assert.equal(chapter.level, level);
    assert.equal(chapter.exercises[0].exercise, exercise);
  }
});
const pin = require('../src/lib/server/pin-exercises.json');
const forkBeginners = require('../src/lib/server/fork-beginner-exercises.json');
const fork = [
  ...forkBeginners,
  ...require('../src/lib/server/fork-exercises.json'),
];
const row = (id, topic, level, count) => ({ id, topic, level, count });
test('ordered sections, partial pages, numbering and duplicate avoidance', () => {
  const pinBeginnerCount = model.levelExercises(pin, 'Beginner').length;
  const pages = plan(
    [
      row(1, 'fork', 'A', 7),
      row(2, 'pin', 'Beginner', 6),
      row(3, 'fork', 'A', 2),
    ],
    { pin, fork }
  );
  assert.deepEqual(
    pages.map((p) => p.exercises.length),
    [6, 1, 6, 2]
  );
  assert.equal(pages[2].title, 'Đòn ghim');
  const flat = pages.flatMap((p) => p.exercises);
  assert.deepEqual(
    flat.map((e) => e.number),
    Array.from({ length: 15 }, (_, i) => i + 1)
  );
  assert.equal(
    new Set(flat.map((e) => model.positionKey(e.exercise))).size,
    15
  );
  assert.throws(
    () =>
      plan([row(1, 'fork', 'Beginner', forkBeginners.length + 1)], { fork }),
    new RegExp(`còn ${forkBeginners.length}`)
  );
  assert.throws(
    () => plan([row(1, 'pin', 'Beginner', pinBeginnerCount + 1)], { pin }),
    new RegExp(`còn ${pinBeginnerCount}`)
  );
  for (const count of [0, -1, 1.5, NaN, 121])
    assert.throws(() => plan([row(1, 'pin', 'Beginner', count)], { pin }));
  assert.throws(() => plan([], {}));
});
test('Fork Beginner exports the verified compositions through the existing worksheet source', () => {
  assert.equal(forkBeginners.length, 7);
  assert.equal(
    topics.find((topic) => topic.id === 'fork').endpoint,
    '/api/fork-exercises'
  );
  assert.deepEqual(model.levelExercises(fork, 'Beginner'), forkBeginners);
  const pages = plan([row(1, 'fork', 'Beginner', forkBeginners.length)], {
    fork,
  });
  assert.deepEqual(
    pages.map((page) => page.exercises.length),
    [6, 1]
  );
  const exported = pages.flatMap((page) =>
    page.exercises.map((item) => item.exercise)
  );
  assert.equal(
    new Set(exported.map((exercise) => model.positionKey(exercise))).size,
    forkBeginners.length
  );
  for (const exercise of exported) {
    assert.equal(exercise.goal, 'material');
    assert.equal(model.worksheetSolutionText(exercise), exercise.solution);
    assert.deepEqual(model.worksheetSourceLines(exercise), [
      'Xuất xứ: thế cờ biên soạn.',
    ]);
    for (const line of [exercise.moves, ...(exercise.alternativeLines ?? [])])
      assert.equal(model.explainLine(exercise.fen, line).length, line.length);
  }
});
test('solutionless Beginner positions print diagrams without invented answers; A-D still require moves', () => {
  const exercise = {
    ...forkBeginners[0],
    manualId: 'author-fen-only',
    moves: [],
    alternativeLines: [],
    solution: '',
  };
  const pages = plan([row(1, 'fork', 'Beginner', 1)], { fork: [exercise] });
  assert.equal(pages[0].exercises[0].exercise, exercise);
  assert.equal(model.worksheetSolutionText(exercise), 'Chưa có lời giải.');
  assert.deepEqual(model.explainLine(exercise.fen, exercise.moves), []);
  const advanced = { ...exercise, beginner: false, difficulty: { level: 'A' } };
  assert.deepEqual(model.levelExercises([advanced], 'A'), []);
  assert.throws(
    () => plan([row(1, 'fork', 'A', 1)], { fork: [advanced] }),
    /còn 0/
  );
});
test('Vietnamese explanation, previous move and every eligible saved continuation', () => {
  for (const [path, items] of Object.entries({
    pin,
    fork,
    discovery: require('../src/lib/server/discovery-exercises.json'),
    discoveryBeginner: require('../src/lib/server/discovery-beginner-exercises.json'),
  })) {
    for (const e of items) {
      if (e.mode === 'recognition') continue;
      assert.equal(
        model.explainLine(e.fen, e.moves).length,
        e.moves.length,
        path
      );
      model.previousMoveLabel(e);
      for (const alt of e.alternativeLines ?? []) model.explainLine(e.fen, alt);
    }
  }
  assert.match(
    model.explainLine(pin[0].fen, pin[0].moves)[0],
    /Qg3 - Hậu từ g8 đến g3/
  );
  assert.equal(model.previousMoveLabel(pin[0]), '');
  assert.throws(() =>
    model.previousMoveLabel({
      ...pin[0],
      previousMove: { fen: pin[1].fen, move: 'Rg5' },
    })
  );
});
test('previous-move comparison preserves only available en passant rights', () => {
  const exercise =
    require('../src/lib/server/removing-defender-exercises.json').find(
      (item) => item.id === 'removing-defender-b-boulrens-amdouni-2026'
    );
  assert.match(model.previousMoveLabel(exercise), /g5/);
  const previousMove = { fen: '4k3/3p4/8/4P3/8/8/8/4K3 b - - 0 1', move: 'd5' };
  assert.throws(
    () =>
      model.previousMoveLabel({
        fen: '4k3/8/8/3pP3/8/8/8/4K3 w - - 0 2',
        previousMove,
      }),
    /không khớp/
  );
  assert.match(
    model.previousMoveLabel({
      fen: '4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 2',
      previousMove,
    }),
    /d5/
  );
});
test('generated PDF page counts, A4 size and separate answers', async () => {
  const pdf = load('src/lib/chess/worksheet-pdf.ts', { './worksheet': model });
  const original = global.fetch;
  global.fetch = async (path) => {
    const data = fs.readFileSync('public' + path);
    return {
      ok: true,
      arrayBuffer: async () =>
        data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
    };
  };
  try {
    const pages = plan(
      [
        row(1, 'pin', 'Beginner', 6),
        row(2, 'fork', 'A', 7),
        row(3, 'rook-bishop-mate', 'Beginner', 6),
        row(4, 'arabian-mate', 'Beginner', 6),
        row(5, 'anastasia-mate', 'Beginner', 6),
        row(6, 'promotion', 'Beginner', 2),
        row(7, 'underpromotion', 'A', 2),
        row(8, 'passed-pawn-simplification', 'D', 6),
        row(9, 'promotion-mate', 'C*', 6),
      ],
      {
        pin,
        fork,
        ...Object.fromEntries(
          [
            'underpromotion',
            'passed-pawn-simplification',
            'promotion-mate',
          ].map((id) => [
            id,
            require(`../src/lib/server/${id}-exercises.json`).flatMap(
              (c) => c.exercises
            ),
          ])
        ),
        promotion:
          require('../src/lib/server/promotion-exercises.json').flatMap(
            (c) => c.exercises
          ),
        'anastasia-mate':
          require('../src/lib/server/anastasia-mate-exercises.json').flatMap(
            (c) => c.exercises
          ),
        'arabian-mate':
          require('../src/lib/server/arabian-mate-exercises.json').flatMap(
            (c) => c.exercises
          ),
        'rook-bishop-mate':
          require('../src/lib/server/rook-bishop-mate-exercises.json').flatMap(
            (c) => c.exercises
          ),
      }
    );
    const result = await pdf.createWorksheetPdfs(
      pages,
      'PHIẾU LUYỆN TẬP CỜ VUA',
      undefined,
      'LIMA CHESS'
    );
    const { PDFDocument, PDFName } = require('pdf-lib');
    const contentsTargets = (doc, page = 1) => {
      const refs = doc.getPages().map((p) => p.ref.toString());
      return (doc.getPage(page).node.Annots()?.asArray() ?? []).map((ref) => {
        const annotation = doc.context.lookup(ref);
        assert.equal(annotation.get(PDFName.of('Subtype')).toString(), '/Link');
        const destination = annotation.lookup(PDFName.of('Dest'));
        return refs.indexOf(destination.get(0).toString()) + 1;
      });
    };
    const sheet = await PDFDocument.load(result.worksheet),
      answers = await PDFDocument.load(result.answers);
    assert.equal(sheet.getPageCount(), 10);
    assert.ok(answers.getPageCount() > 0);
    assert.equal(sheet.getPage(0).getWidth(), 595.28);
    const bookPages = model.planWorksheetBook(
      [row(1, 'pin', 'Beginner', 4), row(2, 'fork', 'A', 6)],
      [row(3, 'pin', 'Beginner', 2), row(4, 'fork', 'A', 4)],
      { pin, fork },
      topics
    );
    const bookResult = await pdf.createWorksheetPdfs(
      bookPages,
      'BÀI TẬP CHIẾN THUẬT CỜ VUA',
      undefined,
      'LIMA CHESS',
      model.defaultBookOptions
    );
    const bookDoc = await PDFDocument.load(bookResult.worksheet);
    assert.equal(bookDoc.getPageCount(), 8); // Cover, contents, intro, notation, 2 chapters, review, closing.
    assert.deepEqual(contentsTargets(bookDoc), [3, 4, 5, 6, 7, 8]);
    const answerDoc = await PDFDocument.load(bookResult.answers);
    const answerTargets = contentsTargets(answerDoc);
    assert.equal(answerTargets.length, 3);
    assert.ok(
      answerTargets.every((n) => n >= 3 && n <= answerDoc.getPageCount())
    );
    assert.deepEqual(
      [...answerTargets].sort((a, b) => a - b),
      answerTargets
    );
    assert.notDeepEqual(
      answerTargets,
      [5, 6, 7],
      'answers use their own actual pagination'
    );
    const longBook = await pdf.createWorksheetPdfs(
      bookPages,
      'BÀI TẬP CHIẾN THUẬT VÀ RÈN LUYỆN TƯ DUY CỜ VUA DÀNH CHO NGƯỜI MỚI BẮT ĐẦU',
      undefined,
      '',
      {
        showLevelGuide: true,
        introduction: {
          title: 'Mở đầu',
          body: (
            'Dòng nội dung dài có dấu tiếng Việt. '.repeat(12) + '\n\n'
          ).repeat(20),
        },
        closing: { title: '', body: '' },
      }
    );
    assert.ok((await PDFDocument.load(longBook.worksheet)).getPageCount() > 6);
    const noGuide = await pdf.createWorksheetPdfs(
      bookPages,
      'Sách không có lộ trình',
      undefined,
      '',
      {
        ...model.defaultBookOptions,
        showLevelGuide: false,
        showNotationGuide: false,
      }
    );
    const noGuideDoc = await PDFDocument.load(noGuide.worksheet);
    assert.equal(noGuideDoc.getPageCount(), 7);
    assert.deepEqual(contentsTargets(noGuideDoc), [3, 4, 5, 6, 7]);
    const noContents = await pdf.createWorksheetPdfs(
      bookPages,
      'Sách không có mục lục',
      undefined,
      '',
      {
        ...model.defaultBookOptions,
        showContents: false,
      }
    );
    assert.equal(
      (await PDFDocument.load(noContents.worksheet)).getPageCount(),
      7
    );
    assert.equal(
      (await PDFDocument.load(noContents.answers)).getPageCount(),
      answerDoc.getPageCount() - 1
    );
    // Stress wrapping and multi-page contents without adding any practice data.
    const contentsPages = Array.from({ length: 22 }, (_, i) => ({
      ...bookPages[0],
      sectionId: i + 1,
      title: `Chủ đề ${i + 1}: Phối hợp quân và tính toán phương án với nhiều khả năng phòng thủ trong các thế cờ tấn công và phòng thủ`,
      exercises: [{ ...bookPages[0].exercises[0], number: i + 2 }],
    }));
    // A continuation stays under the first entry; a separate chapter with the
    // same title/level still gets its own entry through its section identity.
    contentsPages.splice(0, 0, {
      ...contentsPages[0],
      exercises: [{ ...bookPages[0].exercises[0], number: 1 }],
    });
    contentsPages[2].title = contentsPages[0].title;
    const manyContents = await pdf.createWorksheetPdfs(
      contentsPages,
      'Sách nhiều chủ đề',
      undefined,
      '',
      {
        ...model.defaultBookOptions,
        introduction: { title: '', body: '' },
        closing: { title: '', body: '' },
      }
    );
    const manyDoc = await PDFDocument.load(manyContents.worksheet);
    const firstTargets = contentsTargets(manyDoc);
    assert.ok(firstTargets.length > 0 && firstTargets.length < 22);
    const secondTargets = contentsTargets(manyDoc, 2);
    assert.equal(firstTargets.length + secondTargets.length, 22);
    assert.deepEqual(
      [...firstTargets, ...secondTargets],
      [4, ...Array.from({ length: 21 }, (_, i) => i + 6)]
    );
    if (process.env.WORKSHEET_RENDER) {
      fs.mkdirSync('tmp/pdfs', { recursive: true });
      fs.writeFileSync('tmp/pdfs/book-no-guide.pdf', noGuide.worksheet);
      fs.writeFileSync('tmp/pdfs/book-worksheet.pdf', bookResult.worksheet);
      fs.writeFileSync('tmp/pdfs/book-answers.pdf', bookResult.answers);
      fs.writeFileSync('tmp/pdfs/book-long.pdf', longBook.worksheet);
      fs.writeFileSync(
        'tmp/pdfs/book-many-contents.pdf',
        manyContents.worksheet
      );
      fs.writeFileSync('tmp/pdfs/book-many-answers.pdf', manyContents.answers);
      fs.writeFileSync('tmp/pdfs/builder-worksheet.pdf', result.worksheet);
      fs.writeFileSync('tmp/pdfs/builder-answers.pdf', result.answers);
    }
  } finally {
    global.fetch = original;
  }
});

test('worksheet topics follow the private library metadata and future additions', () => {
  assert.equal(
    topics.length,
    library.filter((p) => p.worksheetEndpoint).length
  );
  assert.ok(topics.some((t) => t.id === 'queen-mate'));
  assert.equal(
    topics.find((topic) => topic.id === 'hanging-piece').endpoint,
    '/api/hanging-piece-exercises'
  );
  assert.ok(
    !topics.some((t) =>
      [
        'worksheets',
        'saved-games',
        'lich-hoc',
        'london',
        'don-chien-thuat',
      ].includes(t.id)
    )
  );
  const future = model.worksheetTopicsFromLibrary([
    ...library,
    {
      href: '/future-topic',
      title: 'Chủ đề mới',
      worksheetEndpoint: '/api/future-exercises',
    },
  ]);
  const pages = model.planWorksheet(
    [row(1, 'future-topic', 'Beginner', 1)],
    { 'future-topic': pin },
    future
  );
  assert.equal(pages[0].title, 'Chủ đề mới');
  assert.equal(
    model.worksheetTopicsFromLibrary([
      { href: '/bad', title: 'Bad', worksheetEndpoint: 'https://example.com' },
    ]).length,
    0
  );
});

test('eligible worksheet topics and default book chapters follow teaching order', () => {
  const { inPracticeTeachingOrder } = load(
    'src/lib/chess/practice-topic-order.ts',
    {
      './manual-tactics': load('src/lib/chess/manual-tactics.ts'),
    }
  );
  const selection = load('src/lib/chess/worksheet-selection.ts', {
    './worksheet': model,
  });
  const twoRook =
    require('../src/lib/server/two-rook-mate-exercises.json').flatMap(
      (category) => category.exercises
    );
  const hanging = 'tactic-positions?theme=hangingPiece';
  const catalog = {
    pin,
    fork,
    'two-rook-mate': twoRook,
    'back-rank-mate':
      require('../src/lib/server/back-rank-mate-exercises.json').flatMap(
        (category) => category.exercises
      ),
    'one-rook-mate':
      require('../src/lib/server/one-rook-mate-exercises.json').flatMap(
        (category) => category.exercises
      ),
    [hanging]: pin,
    'hanging-piece': pin,
    future: pin,
  };
  const choices = model.worksheetTopicsFromLibrary([
    ...library,
    { href: '/future', title: 'Future', worksheetEndpoint: '/api/future' },
    {
      href: `/${hanging}`,
      title: 'Quân treo',
      worksheetEndpoint: '/api/manual-tactic-exercises?theme=hangingPiece',
    },
  ]);
  const ranked = inPracticeTeachingOrder(choices, (topic) => `/${topic.id}`);
  assert.deepEqual(
    selection
      .eligibleWorksheetTopics(ranked, ['Beginner'], catalog)
      .map((topic) => topic.id),
    [
      'hanging-piece',
      hanging,
      'back-rank-mate',
      'fork',
      'pin',
      'one-rook-mate',
      'future',
    ]
  );

  const draft = ['pin', 'two-rook-mate', 'fork'].map((topic, id) => ({
    id,
    topic,
    count: '6',
  }));
  const ordered = inPracticeTeachingOrder(
    draft,
    (section) => `/${section.topic}`
  );
  const chapters = (rows) =>
    model
      .planWorksheetBookBlocks(
        selection
          .expandWorksheetTopics(rows, ['A'], catalog)
          .map((section) => ({ ...section, count: Number(section.count) })),
        [],
        catalog,
        ranked
      )
      .map((page) => page.title);
  assert.deepEqual(chapters(ordered), [
    'Chiếu hết bằng hai Xe',
    'Tấn công đôi',
    'Đòn ghim',
  ]);
  assert.deepEqual(chapters(draft), [
    'Đòn ghim',
    'Chiếu hết bằng hai Xe',
    'Tấn công đôi',
  ]);
});

test('newly available checkmate and endgame topics have printable legal lines', () => {
  for (const name of [
    'queen-rook-mate',
    'back-rank-mate',
    'queen-mate',
    'one-rook-mate',
    'two-rook-mate',
    'promotion',
    'anastasia-mate',
    'arabian-mate',
    'simplification',
  ]) {
    const raw = require(`../src/lib/server/${name}-exercises.json`);
    const items = raw.flatMap((item) => item.exercises ?? [item]);
    for (const level of model.worksheetLevels) {
      for (const exercise of model.levelExercises(items, level)) {
        model.explainLine(exercise.fen, exercise.moves);
        model.previousMoveLabel(exercise);
        for (const alt of exercise.alternativeLines ?? [])
          model.explainLine(exercise.fen, alt);
      }
    }
  }
});

test('rook-and-bishop practice is available to PDF worksheet selection', () => {
  const topic = topics.find((t) => t.id === 'rook-bishop-mate');
  assert.ok(topic);
  assert.equal(topic.endpoint, '/api/rook-bishop-mate-exercises');
  const categories = require('../src/lib/server/rook-bishop-mate-exercises.json');
  for (const level of ['Beginner', 'A', 'B', 'C', 'C*', 'D']) {
    const available = categories
      .flatMap((c) => c.exercises)
      .filter((e) =>
        level === 'Beginner' ? e.beginner : e.difficulty?.level === level
      );
    if (!available.length) continue;
    const pages = plan([row(1, topic.id, level, 1)], {
      [topic.id]: categories.flatMap((c) => c.exercises),
    });
    assert.equal(pages.length, 1);
    assert.equal(pages[0].exercises[0].exercise.goal, 'checkmate');
    assert.ok(pages[0].exercises[0].exercise.moves.length);
  }
});

test('Arabian Mate has a protected worksheet source and shared level selection', () => {
  const topic = topics.find((t) => t.id === 'arabian-mate');
  assert.ok(topic);
  assert.equal(topic.endpoint, '/api/arabian-mate-exercises');
  const categories = require('../src/lib/server/arabian-mate-exercises.json');
  assert.ok(categories[0].exercises.some((exercise) => exercise.beginner));
});

test('shared practice pages register their protected exercise endpoint for worksheets', () => {
  for (const page of library) {
    const path = `src/pages${page.href}.tsx`;
    if (!fs.existsSync(path)) continue;
    const source = fs.readFileSync(path, 'utf8');
    if (!source.includes('ChessPractice')) continue;
    const endpoint = source.match(/endpoint="(\/api\/[a-z0-9-]+-exercises)"/);
    if (endpoint) assert.equal(page.worksheetEndpoint, endpoint[1], page.href);
  }
});

test('book review reserves fresh positions, interleaves topics, and preserves answer metadata', () => {
  const pinBeginnerCount = model.levelExercises(pin, 'Beginner').length;
  const sections = [row(1, 'pin', 'Beginner', 4), row(2, 'fork', 'A', 6)];
  const reviews = [row(3, 'pin', 'Beginner', 2), row(4, 'fork', 'A', 4)];
  const build = (seed = 1) =>
    model.planWorksheetBook(
      sections,
      reviews,
      { pin, fork },
      topics,
      false,
      seed
    );
  const pages = build();
  const entries = pages.flatMap((p) => p.exercises);
  assert.equal(
    new Set(entries.map((e) => model.positionKey(e.exercise))).size,
    16
  );
  assert.deepEqual(
    entries.map((e) => e.number),
    Array.from({ length: 16 }, (_, i) => i + 1)
  );
  assert.deepEqual(
    pages
      .at(-1)
      .exercises.slice(0, 4)
      .map((e) => e.topicTitle),
    ['Đòn ghim', 'Tấn công đôi', 'Đòn ghim', 'Tấn công đôi']
  );
  assert.equal(pages.at(-1).review, true);
  assert.deepEqual(build(), pages);
  assert.deepEqual(
    new Set(build(10).flatMap((p) => p.exercises.map((e) => e.exercise.id))),
    new Set(entries.map((e) => e.exercise.id))
  );
  assert.throws(
    () =>
      model.planWorksheetBook(
        [row(1, 'pin', 'Beginner', pinBeginnerCount)],
        reviews,
        { pin, fork },
        topics
      ),
    new RegExp(`còn ${pinBeginnerCount - 2}`)
  );
  const reused = model.planWorksheetBook(
    sections,
    reviews,
    { pin, fork },
    topics,
    true
  );
  const chapterKeys = new Set(
    reused
      .filter((p) => !p.review)
      .flatMap((p) => p.exercises.map((e) => model.positionKey(e.exercise)))
  );
  assert.ok(
    reused
      .filter((p) => p.review)
      .flatMap((p) => p.exercises)
      .every((e) => chapterKeys.has(model.positionKey(e.exercise)))
  );
  assert.throws(() =>
    model.planWorksheetBook(
      sections,
      [row(1, 'pin', 'Beginner', -1)],
      { pin, fork },
      topics
    )
  );
  assert.throws(() =>
    model.planWorksheetBook(
      sections,
      [row(1, 'pin', 'Beginner', 5)],
      { pin, fork },
      topics,
      true
    )
  );
  assert.deepEqual(
    model.planWorksheetBook(
      sections,
      [row(1, 'pin', 'Beginner', 0)],
      { pin, fork },
      topics
    ),
    plan(sections, { pin, fork })
  );
});

test('printed move descriptions distinguish en passant, promotion, castling, mate and stalemate', () => {
  assert.equal(
    model.explainLine('7k/8/8/3pP3/8/8/8/K7 w - d6 0 1', ['exd6'])[0],
    'Trắng: exd6 - Tốt từ e5 đến d6, bắt Tốt qua đường ở d5.'
  );
  assert.equal(
    model.explainLine('7k/8/8/8/3Pp3/8/8/K7 b - d3 0 20', ['exd3'], true)[0],
    '20... exd3 - Tốt từ e4 đến d3, bắt Tốt qua đường ở d4.'
  );
  assert.match(
    model.explainLine('7k/P7/8/8/8/8/8/K7 w - - 0 1', ['a8=N'])[0],
    /phong thành Mã/
  );
  assert.match(
    model.explainLine(
      'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1',
      ['O-O', 'O-O-O'],
      true
    )[1],
    /^1\.\.\. O-O-O - Nhập thành cánh Hậu/
  );
  assert.match(
    model.explainLine('7k/8/5KQ1/8/8/8/8/8 w - - 0 1', ['Qg7#'])[0],
    /chiếu hết\.$/
  );
  assert.match(
    model.explainLine('7k/8/5KQ1/8/8/8/8/8 w - - 0 1', ['Qf7'])[0],
    /hòa do hết nước đi \(pat\)/
  );
  const previous = { fen: '7k/8/8/3pP3/8/8/8/K7 w - d6 0 1', move: 'exd6' };
  const board = new chess.Chess(previous.fen);
  board.move(previous.move);
  assert.match(
    model.previousMoveLabel({ fen: board.fen(), previousMove: previous }),
    /^Trắng vừa đi: exd6 .* ở d5\.$/
  );
  assert.equal(
    model.previousMoveLabel(
      { fen: board.fen(), previousMove: previous },
      'compact'
    ),
    'Tốt trắng vừa đi e5 → d6, bắt Tốt qua đường ở d5 (exd6)'
  );
  const knightMove = { fen: '7k/8/8/8/8/5n2/8/K7 b - - 0 1', move: 'Nd2' };
  const knightBoard = new chess.Chess(knightMove.fen);
  assert.ok(knightBoard.move(knightMove.move));
  assert.equal(
    model.previousMoveLabel(
      { fen: knightBoard.fen(), previousMove: knightMove },
      'compact'
    ),
    'Mã đen vừa đi f3 → d2 (Nd2)'
  );
});

test('PDF editorial notes retain tactical data and distinguish sources from analysis', () => {
  const e = {
    ...pin[0],
    solution:
      'Hy sinh Hậu trên g3 để mở đường cho đòn phối hợp. Nhánh mẫu: ' +
      pin[0].moves.join(' · ') +
      '.',
  };
  const original = JSON.stringify(e);
  const edited = model.worksheetSolutionText(e);
  assert.match(edited, /^Thí Hậu/);
  assert.ok(!edited.includes('Nhánh mẫu'));
  assert.equal(JSON.stringify(e), original);
  assert.match(
    model.worksheetSolutionText({ ...e, solution: 'Ghi chú. Nhánh mẫu: Ka2.' }),
    /Phương án minh họa: Ka2/
  );
  assert.match(
    model.worksheetSolutionText({
      ...e,
      outcome: 'repetition',
      solution: 'Thế cờ lặp lại ba lần.',
    }),
    /quyền yêu cầu hòa; ván đấu chưa tự động kết thúc/
  );
  assert.deepEqual(
    model.worksheetSourceLines({ ...e, source: 'original-composition' }),
    ['Xuất xứ: thế cờ biên soạn.']
  );
  const source = model.worksheetSourceLines({
    ...e,
    players: [
      { name: 'A', title: '', rating: '' },
      { name: 'B', title: '', rating: '' },
    ],
    gameCaption: '2020 · Event',
    source: 'https://example.org/game.pgn',
  });
  assert.deepEqual(source, [
    'Ván đấu: A - B · 2020 · Event',
    'Nguồn tư liệu: https://example.org/game.pgn',
  ]);
});

test('published tactics use the same solution prose on web and PDF', () => {
  const paths = [
    '../src/lib/server/fork-exercises.json',
    '../src/lib/server/fork-beginner-exercises.json',
    '../src/lib/server/pin-exercises.json',
    '../src/lib/server/discovery-exercises.json',
    '../src/lib/server/discovery-beginner-exercises.json',
  ];
  for (const path of paths) {
    for (const exercise of require(path)) {
      assert.equal(
        model.worksheetSolutionText(exercise),
        exercise.solution,
        `${path}: web/PDF solution differs at ${exercise.fen}`
      );
      for (const text of [
        exercise.prompt,
        exercise.solution,
        ...(exercise.hints ?? []),
      ])
        assert.doesNotMatch(
          text,
          /Nhánh mẫu:|[Hh]y sinh|bạn lời|biến mẫu lời|giáo viên nên/
        );
    }
  }
});

test('review shuffle can be disabled without changing selection or answer numbering', () => {
  const sections = [row(1, 'pin', 'Beginner', 4), row(2, 'fork', 'A', 6)];
  const reviews = [row(3, 'fork', 'A', 4), row(4, 'pin', 'Beginner', 2)];
  for (const reuse of [false, true]) {
    const build = (shuffle) =>
      model.planWorksheetBook(
        sections,
        reviews,
        { pin, fork },
        topics,
        reuse,
        1,
        shuffle
      );
    const ordered = build(false);
    const mixed = build(true);
    const review = ordered.filter((p) => p.review).flatMap((p) => p.exercises);
    const expected = model
      .planWorksheet(reviews, { pin, fork }, topics)
      .flatMap((p) => p.exercises);
    assert.deepEqual(
      review.map((e) => e.exercise.fen),
      expected.map((e) => e.exercise.fen)
    );
    assert.deepEqual(
      review.map((e) => e.topicTitle),
      [
        'Tấn công đôi',
        'Tấn công đôi',
        'Tấn công đôi',
        'Tấn công đôi',
        'Đòn ghim',
        'Đòn ghim',
      ]
    );
    assert.deepEqual(
      review.map((e) => e.number),
      [11, 12, 13, 14, 15, 16]
    );
    assert.deepEqual(
      new Set(review.map((e) => e.exercise.fen)),
      new Set(
        mixed
          .filter((p) => p.review)
          .flatMap((p) => p.exercises.map((e) => e.exercise.fen))
      )
    );
    assert.deepEqual(
      ordered.filter((p) => !p.review),
      mixed.filter((p) => !p.review)
    );
  }
});

test('large worksheets and books are bounded by available positions, not 120', async () => {
  const discovery = require('../src/lib/server/discovery-exercises.json').map(
    (e) => ({ ...e, difficulty: { ...e.difficulty, level: 'D' } })
  );
  // Keep the size regression independent of the curated level counts.
  const largePool = pin
    .filter((e) => !e.beginner)
    .map((e) => ({ ...e, difficulty: { ...e.difficulty, level: 'A' } }));
  const catalog = { pin: largePool, 'discovered-attack': discovery };
  const sections = [
    row(1, 'pin', 'A', 74),
    row(2, 'discovered-attack', 'D', 50),
  ];
  const pages = model.planWorksheet(sections, catalog, topics);
  assert.equal(pages.flatMap((p) => p.exercises).length, 124);
  // A single row can also exceed the former input max when its pool permits it.
  const poolSize = model.levelExercises(largePool, 'A').length;
  assert.ok(poolSize > 120);
  assert.equal(
    model
      .planWorksheet([row(1, 'pin', 'A', poolSize)], { pin: largePool }, topics)
      .flatMap((p) => p.exercises).length,
    poolSize
  );
  assert.throws(
    () =>
      model.planWorksheet(
        [row(1, 'pin', 'A', poolSize + 1)],
        { pin: largePool },
        topics
      ),
    /chưa dùng/
  );
  for (const reuse of [false, true]) {
    const book = model.planWorksheetBook(
      [row(1, 'pin', 'A', 60), row(2, 'discovered-attack', 'D', 40)],
      [row(3, 'pin', 'A', 14), row(4, 'discovered-attack', 'D', 10)],
      catalog,
      topics,
      reuse
    );
    assert.equal(book.flatMap((p) => p.exercises).length, 124);
  }
  assert.throws(
    () =>
      model.planWorksheetBook(
        sections,
        [row(3, 'pin', 'A', poolSize - sections[0].count + 1)],
        catalog,
        topics
      ),
    /chưa dùng/
  );
  const pdf = load('src/lib/chess/worksheet-pdf.ts', { './worksheet': model });
  const original = global.fetch;
  global.fetch = async (path) => ({
    ok: true,
    arrayBuffer: async () =>
      Uint8Array.from(fs.readFileSync('public' + path)).buffer,
  });
  try {
    const files = await pdf.createWorksheetPdfs(pages, 'Large export');
    const { PDFDocument } = require('pdf-lib');
    assert.equal(
      (await PDFDocument.load(files.worksheet)).getPageCount(),
      pages.length
    );
    assert.ok((await PDFDocument.load(files.answers)).getPageCount() > 1);
  } finally {
    global.fetch = original;
  }
});

test('discovery Beginner worksheet includes all 24 compositions and solutions', () => {
  const items = require('../src/lib/server/discovery-beginner-exercises.json');
  const pages = plan([row(1, 'discovered-attack', 'Beginner', 24)], {
    'discovered-attack': items,
  });
  const selected = pages.flatMap((page) => page.exercises);
  assert.equal(selected.length, 24);
  for (const item of selected) {
    assert.equal(item.exercise.goal, 'material');
    assert.equal(
      model.explainLine(item.exercise.fen, item.exercise.moves).length,
      3
    );
  }
});

test('curated discovery levels export every published position without repeats', () => {
  const items = require('../src/lib/server/discovery-exercises.json');
  const curation = require('./fixtures/discovery/upper-curation.json');
  const catalog = { 'discovered-attack': items };
  for (const [level, count] of Object.entries({ A: 24, ...curation.counts })) {
    const pages = plan([row(1, 'discovered-attack', level, count)], catalog);
    const selected = pages.flatMap((page) => page.exercises);
    assert.equal(selected.length, count);
    assert.equal(
      new Set(selected.map((item) => item.exercise.fen)).size,
      count
    );
    assert.throws(() =>
      plan([row(1, 'discovered-attack', level, count + 1)], catalog)
    );
  }
});

test('review blocks follow chapter anchors, reserve globally and keep answer metadata', () => {
  const discovery = require('../src/lib/server/discovery-exercises.json');
  const sections = [
    row(11, 'pin', 'B', 6),
    row(22, 'fork', 'A', 6),
    row(33, 'discovered-attack', 'A', 6),
  ];
  const blocks = [
    { id: 100, afterSectionId: 11, rows: [row(101, 'pin', 'B', 2)] },
    {
      id: 200,
      afterSectionId: 33,
      rows: [
        row(201, 'pin', 'B', 2),
        row(202, 'fork', 'A', 2),
        row(203, 'discovered-attack', 'A', 2),
      ],
    },
  ];
  const catalog = { pin, fork, 'discovered-attack': discovery };
  const build = (rs = sections, bs = blocks, reuse = false, shuffle = true) =>
    model.planWorksheetBookBlocks(rs, bs, catalog, topics, reuse, 1, shuffle);
  const pages = build();
  assert.deepEqual(
    pages.map((p) => (p.review ? p.title : p.title)),
    [
      'Đòn ghim',
      'Ôn tập tổng hợp 1',
      'Tấn công đôi',
      'Chiếu mở và tấn công mở',
      'Ôn tập tổng hợp 2',
    ]
  );
  const all = pages.flatMap((p) => p.exercises);
  assert.equal(new Set(all.map((e) => model.positionKey(e.exercise))).size, 26);
  assert.deepEqual(
    all.map((e) => e.number),
    Array.from({ length: 26 }, (_, i) => i + 1)
  );
  assert.ok(
    pages
      .filter((p) => p.review)
      .flatMap((p) => p.exercises)
      .every((e) => e.topicTitle && e.level)
  );
  assert.deepEqual(build(), pages);
  assert.deepEqual(
    new Set(
      build(sections, blocks, false, false).flatMap((p) =>
        p.exercises.map((e) => e.exercise.fen)
      )
    ),
    new Set(all.map((e) => e.exercise.fen))
  );
  const reordered = build([sections[1], sections[0], sections[2]]);
  assert.equal(reordered[2].title, 'Ôn tập tổng hợp 1');
  assert.throws(() => build(sections.slice(1)), /chọn lại vị trí/);
  assert.throws(
    () => build(sections, [{ ...blocks[1], afterSectionId: 11 }]),
    /chỉ chọn chủ đề/
  );
  assert.throws(
    () => build(sections, [{ ...blocks[0], rows: [row(1, 'pin', 'B', NaN)] }]),
    /số nguyên/
  );
  assert.throws(
    () =>
      build(sections, [{ ...blocks[0], rows: [row(1, 'pin', 'B', 100000)] }]),
    /Ôn tập 1/
  );
  const reused = build(sections, blocks, true);
  const seen = new Set();
  for (const page of reused)
    for (const e of page.exercises) {
      if (page.review) assert.ok(seen.has(model.positionKey(e.exercise)));
      else seen.add(model.positionKey(e.exercise));
    }
  const zero = build(sections, [
    { ...blocks[0], rows: [row(1, 'pin', 'B', 0)] },
  ]);
  assert.equal(zero.filter((p) => p.review).length, 0);
});

test('dynamic reviews: page budgets, separate final review and live chapter order', () => {
  const {
    automaticReviewBlocks: auto,
    defaultReviewSettings: baseDefaults,
    resolveReviewBlocks: resolve,
  } = load('src/lib/chess/worksheet-review.ts');
  const defaults = { ...baseDefaults, finalPages: '2' };
  assert.equal(baseDefaults.pages, '1');
  assert.equal(baseDefaults.finalPages, '1');
  const chapters = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    topic: `topic-${i + 1}`,
    level: i % 2 ? 'A' : 'Beginner',
    count: '6',
  }));
  const blocks = auto(chapters, defaults);
  assert.deepEqual(
    blocks.map((b) => b.afterSectionId),
    [2, 4, 6, 8, 10, 10]
  );
  assert.deepEqual(
    blocks.map((b) => b.rows.length),
    [2, 2, 2, 2, 2, 10]
  );
  assert.deepEqual(
    blocks[1].rows.map((r) => r.topic),
    ['topic-3', 'topic-4']
  );
  assert.ok(
    blocks.slice(0, -1).every((b) => b.rows.every((r) => r.count === '3'))
  );
  assert.equal(
    blocks.at(-1).rows.reduce((n, r) => n + Number(r.count), 0),
    12
  );
  assert.equal(auto(chapters.slice(0, 9), defaults).length, 5);
  assert.equal(auto(chapters.slice(0, 1), defaults).length, 1);
  assert.deepEqual(auto([], defaults), []);
  assert.deepEqual(auto(chapters, { ...defaults, enabled: false }), []);
  assert.deepEqual(
    auto(chapters, { ...defaults, final: false }).map((b) => b.afterSectionId),
    [2, 4, 6, 8, 10]
  );
  assert.deepEqual(
    auto(chapters, { ...defaults, cumulative: true, pages: '2' }).map(
      (b) => b.rows.length
    ),
    [2, 4, 6, 8, 10, 10]
  );
  assert.deepEqual(
    auto(chapters, { ...defaults, interval: '4' }).map((b) => b.afterSectionId),
    [4, 8, 10]
  );
  const reordered = [...chapters].reverse();
  assert.equal(auto(reordered, defaults)[0].rows[0].topic, 'topic-10');
  const custom = {
    ...blocks[0],
    rows: [{ ...blocks[0].rows[0], count: '4', level: 'B' }],
  };
  const resolved = resolve(auto(reordered, defaults), [custom], true);
  assert.equal(resolved[0].afterSectionId, 9);
  assert.equal(resolved[0].rows[0].count, '4');
  assert.equal(resolved[0].rows[0].level, 'B');
  assert.equal(
    resolve(auto(chapters.slice(0, 1), defaults), [custom], true).length,
    2,
    'custom orphan stays visible'
  );
  assert.equal(resolve(blocks, [custom], false).length, 0);
  assert.deepEqual(
    resolve(blocks, [], true),
    blocks,
    'reset restores automatic values'
  );
  const threeTopics = auto(chapters, {
    ...defaults,
    interval: '3',
    pages: '1',
  });
  assert.deepEqual(
    threeTopics.map((b) => b.afterSectionId),
    [3, 6, 9, 10]
  );
  assert.deepEqual(
    threeTopics.map((b) => b.rows.length),
    [3, 3, 3, 10]
  );
  assert.ok(
    threeTopics.slice(0, -1).every((b) => b.rows.every((r) => r.count === '2'))
  );
  const defaultReviewPages = model.planWorksheetBookBlocks(
    [row(1, 'pin', 'A', 6), row(2, 'fork', 'A', 6)].map((r) => ({ ...r })),
    auto([row(1, 'pin', 'A', '6'), row(2, 'fork', 'A', '6')], baseDefaults).map(
      (b) => ({
        ...b,
        pageCount: Number(b.pageCount),
        rows: b.rows.map((r) => ({ ...r, count: Number(r.count) })),
      })
    ),
    { pin, fork },
    topics
  );
  assert.deepEqual(
    defaultReviewPages.filter((p) => p.review).map((p) => p.exercises.length),
    [6, 6]
  );
  assert.deepEqual(
    defaultReviewPages.filter((p) => p.review).map((p) => p.title),
    ['Ôn tập theo nhóm 1', 'Ôn tập cuối sách']
  );
  for (const interval of ['', '0', '-1', '2.5', 'NaN'])
    assert.throws(() => auto(chapters, { ...defaults, interval }));
  for (const pages of ['', '0', '-1', '1.5']) {
    assert.throws(() => auto(chapters, { ...defaults, pages }));
    assert.throws(() => auto(chapters, { ...defaults, finalPages: pages }));
  }
});

test('review page allocation shares a fixed total across topics and levels', () => {
  const {
    allocateReviewRows: allocate,
    reviewDistribution: distribution,
    reviewBudgetError: budgetError,
    automaticReviewBlocks: auto,
    defaultReviewSettings: defaults,
    resolveReviewBlocks: resolve,
  } = load('src/lib/chess/worksheet-review.ts');
  const drafts = (n) =>
    Array.from({ length: n }, (_, i) => row(i + 1, `topic-${i + 1}`, 'A', '6'));
  const numbers = (rows) => rows.map((r) => Number(r.count));
  for (const [topics, pages, expected] of [
    [2, '1', [3, 3]],
    [2, '2', [6, 6]],
    [3, '1', [2, 2, 2]],
    [3, '2', [4, 4, 4]],
    [4, '1', [2, 2, 1, 1]],
  ]) {
    const rows = allocate(drafts(topics), pages);
    assert.deepEqual(numbers(rows), expected);
    assert.equal(
      budgetError({ id: 1, afterSectionId: 1, pageCount: pages, rows }),
      ''
    );
  }
  assert.equal(distribution(4, '1').uneven, true);
  assert.equal(distribution(4, '1').suggestedPages, 2);
  assert.equal(distribution(4, '2').uneven, false);
  assert.equal(distribution(5, '1').suggestedPages, 5);
  assert.deepEqual(numbers(allocate(drafts(4), '1', 1)), [1, 2, 2, 1]);
  assert.equal(
    auto(drafts(4), {
      ...defaults,
      interval: '4',
      final: false,
    })[0].rows.reduce((n, r) => n + Number(r.count), 0),
    6,
    'uneven allocation remains exportable'
  );
  const multiple = [
    { ...row(1, 'one', 'A', '6'), topicGroupId: 1 },
    { ...row(2, 'one', 'B', '6'), topicGroupId: 1 },
    { ...row(3, 'two', 'A', '6'), topicGroupId: 2 },
    { ...row(4, 'two', 'B', '6'), topicGroupId: 2 },
  ];
  assert.deepEqual(numbers(allocate(multiple, '1')), [2, 1, 1, 2]);
  assert.equal(
    numbers(allocate(multiple, '2')).reduce((n, x) => n + x, 0),
    12,
    'levels do not multiply page count'
  );
  assert.deepEqual(
    numbers(
      allocate(
        [
          ...drafts(2),
          row(3, 'topic-3', 'A', '6'),
          row(4, 'topic-3', 'B', '6'),
          row(5, 'topic-4', 'A', '6'),
          row(6, 'topic-4', 'B', '6'),
        ],
        '1'
      )
    ),
    [1, 1, 1, 1, 1, 1],
    'level coverage can receive remainder slots'
  );
  assert.throws(() => allocate(drafts(7), '1'), /ít nhất 2 trang/);
  assert.throws(
    () =>
      allocate(
        [...multiple, row(5, 'one', 'C', '6'), row(6, 'one', 'D', '6')],
        '1'
      ),
    /ít nhất 2 trang/
  );
  const varied = [
    ...drafts(10),
    ...drafts(3).map((r, i) => ({ ...r, id: 20 + i, level: 'B' })),
  ];
  assert.throws(() => allocate(varied, '2'), /ít nhất 3 trang/);
  assert.equal(
    numbers(allocate(varied, '3')).reduce((n, x) => n + x, 0),
    18
  );
  for (const pages of [
    '',
    '0',
    '-1',
    '1.5',
    'Infinity',
    String(Number.MAX_SAFE_INTEGER),
  ])
    assert.throws(() => allocate(drafts(2), pages));
  const original = auto(drafts(2), defaults);
  const override = {
    ...original[0],
    rows: original[0].rows.map((r, i) => ({ ...r, count: i ? '2' : '4' })),
  };
  const larger = resolve(
    auto(drafts(2), { ...defaults, pages: '2' }),
    [override],
    true
  );
  assert.deepEqual(numbers(larger[0].rows), [6, 6]);
  assert.equal(larger[0].pageCount, '2');
  assert.equal(larger.at(-1).pageCount, '1', 'final pages remain independent');
  assert.deepEqual(
    numbers(resolve(original, [override], true)[0].rows),
    [4, 2],
    'manual distribution survives an unchanged budget'
  );
  const invalid = {
    ...original[0],
    rows: [{ ...original[0].rows[0], count: '5' }],
  };
  assert.match(budgetError(invalid), /cần 6 thế; hiện có 5/);
  const realSections = [row(1, 'pin', 'A', 6), row(2, 'fork', 'A', 6)];
  assert.throws(
    () =>
      model.planWorksheetBookBlocks(
        realSections,
        [
          {
            ...invalid,
            pageCount: 1,
            rows: invalid.rows.map((r) => ({
              ...r,
              topic: 'pin',
              count: Number(r.count),
            })),
          },
        ],
        { pin, fork },
        topics
      ),
    /mỗi trang 6 thế/
  );
});

test('repetition notes already explaining a claim are not duplicated in print', () => {
  const solution =
    'Thế cờ lặp lại ba lần, cho phép yêu cầu hòa hợp lệ; ván chưa tự động kết thúc.';
  assert.equal(
    model.worksheetSolutionText({ moves: [], outcome: 'repetition', solution }),
    solution
  );
});

test('Anastasia Mate has 24 selectable printable positions in every level', () => {
  const topic = topics.find((t) => t.id === 'anastasia-mate');
  assert.ok(topic);
  assert.equal(topic.endpoint, '/api/anastasia-mate-exercises');
  const exercises =
    require('../src/lib/server/anastasia-mate-exercises.json').flatMap(
      (c) => c.exercises
    );
  for (const level of ['Beginner', 'A', 'B', 'C', 'C*', 'D']) {
    assert.equal(model.levelExercises(exercises, level).length, 24);
    const planned = plan([row(1, topic.id, level, 24)], {
      [topic.id]: exercises,
    });
    assert.equal(planned.length, 4);
  }
});

test('all four promotion topics expose their actual printable levels', () => {
  for (const id of [
    'promotion',
    'underpromotion',
    'passed-pawn-simplification',
    'promotion-mate',
  ]) {
    const topic = topics.find((t) => t.id === id);
    assert.ok(topic, id);
    assert.equal(topic.endpoint, `/api/${id}-exercises`);
    const exercises = require(`../src/lib/server/${id}-exercises.json`).flatMap(
      (c) => c.exercises
    );
    for (const level of ['Beginner', 'A', 'B', 'C', 'C*', 'D']) {
      const count = exercises.filter((e) =>
        level === 'Beginner' ? e.beginner : e.difficulty?.level === level
      ).length;
      assert.equal(model.levelExercises(exercises, level).length, count);
      if (count)
        assert.ok(
          plan([row(1, id, level, Math.min(count, 24))], { [id]: exercises })
            .length
        );
      if (id === 'promotion-mate')
        assert.equal(
          count,
          { Beginner: 5, A: 20, B: 18, C: 17, 'C*': 21, D: 22 }[level]
        );
    }
  }
});

test('global level selection requires a full A4 page and shares the pagination default', () => {
  const { POSITIONS_PER_PAGE } = load('src/lib/chess/worksheet-layout.ts');
  const selection = load('src/lib/chess/worksheet-selection.ts', {
    './worksheet': model,
  });
  const review = load('src/lib/chess/worksheet-review.ts');
  const sample = (fen, level, extra = {}) => ({
    fen,
    moves: ['e4'],
    beginner: level === 'Beginner',
    difficulty: { level },
    ...extra,
  });
  const batch = (prefix, count, level) =>
    Array.from({ length: count }, (_, i) =>
      sample(`${prefix}-${i} w - - 0 1`, level)
    );
  const catalog = {
    empty: [],
    one: batch('one', 1, 'A'),
    five: batch('five', POSITIONS_PER_PAGE - 1, 'A'),
    exact: batch('exact', POSITIONS_PER_PAGE, 'A'),
    duplicate: [
      ...batch('dup', POSITIONS_PER_PAGE - 1, 'A'),
      sample('dup-0 w - - 0 2', 'A'),
    ],
    recognition: [
      ...batch('rec', POSITIONS_PER_PAGE - 1, 'A'),
      sample('recognition w - - 0 1', 'A', { mode: 'recognition' }),
    ],
    mixed: [
      ...batch('beginner', POSITIONS_PER_PAGE, 'Beginner'),
      ...batch('a', POSITIONS_PER_PAGE, 'A'),
      ...batch('sparse', 1, 'D'),
    ],
    advanced: batch('d', POSITIONS_PER_PAGE + 1, 'D'),
  };
  const topics = Object.keys(catalog).map((id) => ({
    id,
    title: id,
    endpoint: `/api/${id}`,
  }));
  const eligible = (levels) =>
    selection.eligibleWorksheetTopics(topics, levels, catalog).map((t) => t.id);
  assert.deepEqual(eligible(['Beginner']), ['mixed']);
  assert.deepEqual(eligible(['A']), ['exact', 'mixed']);
  assert.deepEqual(eligible(['Beginner', 'A']), ['exact', 'mixed']);
  assert.deepEqual(eligible(['D']), ['advanced']);
  assert.deepEqual(eligible([]), []);
  assert.deepEqual(
    selection.availableWorksheetLevels(
      'mixed',
      ['D', 'A', 'Beginner'],
      catalog
    ),
    ['Beginner', 'A']
  );
  assert.equal(selection.defaultWorksheetCount, String(POSITIONS_PER_PAGE));
  assert.equal(review.defaultReviewSettings.pages, '1');
  assert.equal(review.defaultReviewSettings.finalPages, '1');
  const rows = [
    { id: 1, topic: 'mixed', count: '6' },
    { id: 2, topic: 'exact', count: '6' },
    { id: 3, topic: 'advanced', count: '6' },
  ];
  const expanded = selection.expandWorksheetTopics(
    rows,
    ['D', 'A', 'Beginner'],
    catalog
  );
  assert.deepEqual(
    expanded.map((s) => [s.topic, s.level]),
    [
      ['mixed', 'Beginner'],
      ['mixed', 'A'],
      ['exact', 'A'],
      ['advanced', 'D'],
    ]
  );
  assert.equal(new Set(expanded.map((s) => s.id)).size, 4);
  const blocks = review.automaticReviewBlocks(expanded, {
    ...review.defaultReviewSettings,
    final: false,
  });
  assert.equal(blocks.length, 1, 'reviews count topics, not levels');
  assert.equal(blocks[0].afterSectionId, expanded[2].id);
  assert.equal(blocks[0].rows.length, 3);
  const moved = selection.expandWorksheetTopics(
    [rows[2], rows[0], rows[1]],
    ['Beginner', 'A', 'D'],
    catalog
  );
  assert.equal(moved[0].id, expanded[3].id);
  const chapters = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    topic: `mixed-${i}`,
    count: '6',
  }));
  const multiCatalog = Object.fromEntries(
    chapters.map((c) => [c.topic, catalog.mixed])
  );
  const multiple = selection.expandWorksheetTopics(
    chapters,
    ['Beginner', 'A'],
    multiCatalog
  );
  const multipleBlocks = review.automaticReviewBlocks(multiple, {
    ...review.defaultReviewSettings,
    finalPages: '4',
  });
  assert.deepEqual(
    multipleBlocks.map((b) => b.rows.length),
    [4, 4, 4, 4, 4, 20]
  );
  assert.ok(
    multipleBlocks
      .slice(0, -1)
      .every((b) => b.rows.reduce((n, r) => n + Number(r.count), 0) === 6)
  );
  assert.equal(
    multipleBlocks.at(-1).rows.reduce((n, r) => n + Number(r.count), 0),
    24
  );
  const paginated = plan([row(1, 'pin', 'Beginner', POSITIONS_PER_PAGE + 1)], {
    pin,
  });
  assert.deepEqual(
    paginated.map((p) => p.exercises.length),
    [POSITIONS_PER_PAGE, 1]
  );
});

test('notation examples replay legally with accurate SAN and Vietnamese explanations', () => {
  const guide = load('src/lib/chess/worksheet-notation.ts', {
    './worksheet': model,
  });
  for (const [id, example] of Object.entries(guide.notationExamples)) {
    const board = new chess.Chess(example.fen);
    assert.equal(board.validate_fen(example.fen).valid, true, id);
    const move = board.move(example.move);
    assert.ok(move, id);
    assert.equal(move.san, example.move, id);
    assert.ok(guide.notationExampleText(id).includes(move.san), id);
    if (example.move.endsWith('+')) {
      assert.ok(board.in_check());
      assert.equal(board.in_checkmate(), false);
    }
    if (example.move.endsWith('#')) assert.ok(board.in_checkmate());
  }
  assert.match(
    guide.notationExampleText('enPassant'),
    /đến d6, bắt Tốt qua đường ở d5/
  );
  assert.match(
    guide.notationExampleText('capturePromotion'),
    /bắt Xe ở d8, phong thành Mã/
  );
  assert.equal(
    guide.notationExampleText('promotionCheck'),
    'e8=Q+ - Tốt từ e7 đến e8, phong thành Hậu, chiếu Vua.'
  );
  assert.equal(
    guide.notationExampleText('promotionMate'),
    'e8=Q# - Tốt từ e7 đến e8, phong thành Hậu, chiếu hết.'
  );
  assert.match(guide.notationExampleText('file'), /Mã từ b1 đến d2/);
  assert.match(guide.notationExampleText('rank'), /Xe từ e1 đến e2/);
  assert.match(guide.notationExampleText('square'), /Mã từ b1 đến d2/);
});
