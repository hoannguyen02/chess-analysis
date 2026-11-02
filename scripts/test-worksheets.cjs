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
  )(mod, mod.exports, (id) =>
    id === 'chess.js' ? chess : (overrides[id] ?? require(id))
  );
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
const pin = require('../src/lib/server/pin-exercises.json');
const fork = require('../src/lib/server/fork-exercises.json');
const row = (id, topic, level, count) => ({ id, topic, level, count });
test('ordered sections, partial pages, numbering and duplicate avoidance', () => {
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
  assert.throws(() => plan([row(1, 'fork', 'Beginner', 1)], { fork }), /còn 0/);
  assert.throws(() => plan([row(1, 'pin', 'Beginner', 25)], { pin }), /còn 24/);
  for (const count of [0, -1, 1.5, NaN, 121])
    assert.throws(() => plan([row(1, 'pin', 'Beginner', count)], { pin }));
  assert.throws(() => plan([], {}));
});
test('Vietnamese explanation, previous move and every eligible saved continuation', () => {
  for (const [path, items] of Object.entries({
    pin,
    fork,
    skewer: require('../src/lib/chess/skewer-exercises.json'),
    beginner: require('../src/lib/chess/skewer-beginner-exercises.json'),
    intro: require('../src/lib/server/queen-skewer-intro.json'),
    pilot: require('../src/lib/server/queen-skewer-pilot.json'),
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
        row(6, 'promotion', 'Beginner', 3),
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
    const { PDFDocument } = require('pdf-lib');
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
    assert.equal(bookDoc.getPageCount(), 6); // Cover, intro, 2 chapters, review, closing.
    assert.ok((await PDFDocument.load(bookResult.answers)).getPageCount() > 1);
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
      }
    );
    assert.equal((await PDFDocument.load(noGuide.worksheet)).getPageCount(), 6);
    if (process.env.WORKSHEET_RENDER) {
      fs.mkdirSync('tmp/pdfs', { recursive: true });
      fs.writeFileSync('tmp/pdfs/book-no-guide.pdf', noGuide.worksheet);
      fs.writeFileSync('tmp/pdfs/book-worksheet.pdf', bookResult.worksheet);
      fs.writeFileSync('tmp/pdfs/book-answers.pdf', bookResult.answers);
      fs.writeFileSync('tmp/pdfs/book-long.pdf', longBook.worksheet);
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
  assert.ok(
    !topics.some((t) =>
      [
        'worksheets',
        'saved-games',
        'lich-hoc',
        'london',
        'chien-thuat',
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
        [row(1, 'pin', 'Beginner', 24)],
        reviews,
        { pin, fork },
        topics
      ),
    /còn 22/
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
    '../src/lib/server/pin-exercises.json',
    '../src/lib/server/discovery-exercises.json',
    '../src/lib/server/discovery-beginner-exercises.json',
    '../src/lib/chess/skewer-exercises.json',
    '../src/lib/chess/skewer-beginner-exercises.json',
    '../src/lib/server/queen-skewer-intro.json',
    '../src/lib/server/queen-skewer-pilot.json',
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
  const skewer = require('../src/lib/chess/skewer-exercises.json');
  const catalog = { pin, skewer };
  const sections = [row(1, 'pin', 'B', 74), row(2, 'skewer', 'D', 50)];
  const pages = model.planWorksheet(sections, catalog, topics);
  assert.equal(pages.flatMap((p) => p.exercises).length, 124);
  // A single row can also exceed the former input max when its pool permits it.
  const largePool = pin
    .filter((e) => !e.beginner)
    .map((e) => ({ ...e, difficulty: { ...e.difficulty, level: 'A' } }));
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
      [row(1, 'pin', 'B', 60), row(2, 'skewer', 'D', 40)],
      [row(3, 'pin', 'B', 14), row(4, 'skewer', 'D', 10)],
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
        [row(3, 'pin', 'B', 1)],
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
  const skewer = require('../src/lib/chess/skewer-exercises.json');
  const sections = [
    row(11, 'pin', 'B', 6),
    row(22, 'fork', 'A', 6),
    row(33, 'skewer', 'A', 6),
  ];
  const blocks = [
    { id: 100, afterSectionId: 11, rows: [row(101, 'pin', 'B', 2)] },
    {
      id: 200,
      afterSectionId: 33,
      rows: [
        row(201, 'pin', 'B', 2),
        row(202, 'fork', 'A', 2),
        row(203, 'skewer', 'A', 2),
      ],
    },
  ];
  const catalog = { pin, fork, skewer };
  const build = (rs = sections, bs = blocks, reuse = false, shuffle = true) =>
    model.planWorksheetBookBlocks(rs, bs, catalog, topics, reuse, 1, shuffle);
  const pages = build();
  assert.deepEqual(
    pages.map((p) => (p.review ? p.title : p.title)),
    [
      'Đòn ghim',
      'Ôn tập tổng hợp 1',
      'Tấn công đôi',
      'Đòn xiên',
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

test('dynamic reviews: recent-group defaults, final deduplication and live chapter order', () => {
  const {
    automaticReviewBlocks: auto,
    defaultReviewSettings: defaults,
    resolveReviewBlocks: resolve,
  } = load('src/lib/chess/worksheet-review.ts');
  const chapters = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    topic: `topic-${i + 1}`,
    level: i % 2 ? 'A' : 'Beginner',
    count: '6',
  }));
  const blocks = auto(chapters, defaults);
  assert.deepEqual(
    blocks.map((b) => b.afterSectionId),
    [3, 6, 9, 10]
  );
  assert.deepEqual(
    blocks.map((b) => b.rows.length),
    [3, 3, 3, 10]
  );
  assert.deepEqual(
    blocks[1].rows.map((r) => r.topic),
    ['topic-4', 'topic-5', 'topic-6']
  );
  assert.ok(blocks.every((b) => b.rows.every((r) => r.count === '6')));
  assert.equal(auto(chapters.slice(0, 9), defaults).length, 3);
  assert.equal(auto(chapters.slice(0, 1), defaults).length, 1);
  assert.deepEqual(auto([], defaults), []);
  assert.deepEqual(auto(chapters, { ...defaults, enabled: false }), []);
  assert.deepEqual(
    auto(chapters, { ...defaults, final: false }).map((b) => b.afterSectionId),
    [3, 6, 9]
  );
  assert.deepEqual(
    auto(chapters, { ...defaults, cumulative: true }).map((b) => b.rows.length),
    [3, 6, 9, 10]
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
  assert.equal(resolved[0].afterSectionId, 8);
  assert.equal(resolved[0].rows[0].count, '4');
  assert.equal(resolved[0].rows[0].level, 'B');
  assert.equal(
    resolve(auto(chapters.slice(0, 2), defaults), [custom], true).length,
    2,
    'custom orphan stays visible'
  );
  assert.equal(resolve(blocks, [custom], false).length, 0);
  assert.deepEqual(
    resolve(blocks, [], true),
    blocks,
    'reset restores automatic values'
  );
  for (const interval of ['', '0', '-1', '2.5', 'NaN'])
    assert.throws(() => auto(chapters, { ...defaults, interval }));
  for (const count of ['', '0', '-1', '1.5'])
    assert.throws(() => auto(chapters, { ...defaults, count }));
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
      if (id === 'promotion-mate') assert.equal(count, { Beginner: 5, A: 20, B: 18, C: 17, 'C*': 21, D: 22 }[level]);
    }
  }
});
