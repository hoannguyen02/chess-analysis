const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const ts = require('typescript');
const project = process.cwd();
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'manual-tactics-'));
fs.mkdirSync(path.join(root, 'src/lib/server'), { recursive: true });
const file = path.join(root, 'src/lib/server/manual-tactics.json');
fs.writeFileSync(file, '[]');
const env = { NODE_ENV: 'development' };
const cache = new Map();
let chess,
  store,
  handler,
  allowed = true;
function load(fileName) {
  const filePath = path.resolve(project, fileName);
  if (cache.has(filePath)) return cache.get(filePath);
  if (filePath.endsWith('.json'))
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const mod = { exports: {} };
  const resolve = (id) => {
    if (id === 'chess.js') return chess;
    if (id.endsWith('/practice-access'))
      return {
        requirePracticeAccess: (_req, res) => {
          if (!allowed) res.status(401).end();
          return allowed;
        },
      };
    if (id.endsWith('/private-hub'))
      return { privateHubPath: () => '/tactics' };
    if (id.endsWith('/practice-game-caption'))
      return {
        practiceGameCaption: () => '',
        practiceGameOpening: () => '',
        practicePlayerTitle: () => '',
        practicePlayers: () => [],
      };
    if (id.startsWith('@/') || id.startsWith('.')) {
      let target = id.startsWith('@/')
        ? path.join(project, 'src', id.slice(2))
        : path.resolve(path.dirname(filePath), id);
      if (!/\.(ts|json)$/.test(target)) target += '.ts';
      return load(target);
    }
    return require(id);
  };
  new Function(
    'require',
    'module',
    'exports',
    'process',
    ts.transpileModule(fs.readFileSync(filePath, 'utf8'), {
      compilerOptions: {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.CommonJS,
        esModuleInterop: true,
      },
    }).outputText
  )(resolve, mod, mod.exports, { env, cwd: () => root });
  cache.set(filePath, mod.exports);
  return mod.exports;
}
function response() {
  return {
    code: 200,
    headers: {},
    status(code) {
      this.code = code;
      return this;
    },
    setHeader(k, v) {
      this.headers[k] = v;
    },
    json(body) {
      this.body = body;
      return this;
    },
    end() {
      return this;
    },
  };
}
async function call(method, body, query = {}) {
  const res = response();
  await handler({ method, body, query }, res);
  return res;
}
const sample = {
  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  themeId: 'fork',
  level: 'D',
  goal: 'material',
  moves: '1. e4 e5 2. Nf3',
  title: 'Manual test position',
  solution: 'Author-selected teaching line',
};
test.before(async () => {
  chess = await import('chess.js');
  store = load('src/lib/server/manual-tactics.ts');
  handler = load('src/pages/api/manual-tactics.ts').default;
});
test.after(() => fs.rmSync(root, { recursive: true, force: true }));

test('required solution and objective, SAN/UCI replay and six author-selected levels', () => {
  const position = store.validateManualTactic(sample);
  assert.deepEqual(position.moves, ['e4', 'e5', 'Nf3']);
  assert.deepEqual(
    store.validateManualTactic({ ...sample, moves: 'e2e4 e7e5 g1f3' }).moves,
    position.moves
  );
  for (const level of ['Beginner', 'A', 'B', 'C', 'C*', 'D'])
    assert.equal(store.validateManualTactic({ ...sample, level }).level, level);
  for (const overrides of [
    { moves: '' },
    { moves: [] },
    { moves: 'e5' },
    { goal: '' },
    { goal: ['material'] },
    { level: 'B*' },
    { themeId: 'unknown' },
    { fen: 'bad' },
    { goal: 'checkmate' },
  ])
    assert.throws(() =>
      store.validateManualTactic({ ...sample, ...overrides })
    );
  assert.equal(
    store.validateManualTactic({
      ...sample,
      fen: '7k/5Q2/5K2/8/8/8/8/8 w - - 0 1',
      moves: 'Qg7#',
      goal: 'checkmate',
    }).moves[0],
    'Qg7#'
  );
});
test('human move separators and spaced ellipses preserve legal moves, castling, checks and promotions', () => {
  const fen =
    '2r2rk1/2q2pp1/p2bp3/1p1b2Qp/2nN4/P2B1P1P/1PP2BP1/1K1RR3 b - - 5 21';
  const expected = ['Nxb2', 'Nf5', 'exf5', 'Bd4', 'f6'];
  for (const moves of [
    '1. ... Nxb2, Nf5 - exf5, Bd4 - f6',
    '21...Nxb2,22.Nf5 exf5 23.Bd4 f6',
    '21… Nxb2; 22. Nf5 – exf5; 23. Bd4 — f6',
    '... Nxb2\nNf5,exf5\nBd4;f6',
  ])
    assert.deepEqual(
      store.validateManualTactic({ ...sample, fen, moves }).moves,
      expected
    );
  assert.deepEqual(
    store.validateManualTactic({
      ...sample,
      fen: 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1',
      moves: '1. O-O - O-O-O',
    }).moves,
    ['O-O', 'O-O-O']
  );
  assert.deepEqual(
    store.validateManualTactic({
      ...sample,
      fen: '7k/P7/8/8/8/8/8/7K w - - 0 29',
      moves: '29. a8=Q+, Kh7',
    }).moves,
    ['a8=Q+', 'Kh7']
  );
  for (const moves of ['1. ... , - ;', 'Nxb9, Nf5', 'Nxb2, Nf5 - not-a-move'])
    assert.throws(() => store.validateManualTactic({ ...sample, fen, moves }));
});
test('only the position, solution and source marker are retained; no full game or review status', () => {
  const entry = store.validateManualTactic({
    ...sample,
    source: { lines: [['e4', 'e5']] },
    status: 'pending-review',
    headers: { White: 'One', Black: 'Two' },
    reference: {
      id: 'source-id',
      collection: 'fork',
      kind: 'game',
      branch: 0,
      ply: 0,
    },
  });
  assert.equal(entry.source, undefined);
  assert.equal(entry.lines, undefined);
  assert.equal(entry.status, undefined);
  assert.equal(entry.reference.id, 'source-id');
  const game = new chess.Chess(sample.fen);
  game.move('e4');
  assert.equal(
    store.validateManualTactic({
      ...sample,
      fen: game.fen(),
      moves: 'e5',
      previousMove: { fen: sample.fen, move: 'e4' },
    }).previousMove.move,
    'e4'
  );
  assert.throws(() =>
    store.validateManualTactic({
      ...sample,
      previousMove: { fen: sample.fen, move: 'e4' },
    })
  );
});
test('source context retains the exact preceding move on either branch, including special moves and line starts', () => {
  const { gameExerciseContext } = load('src/lib/chess/draw-game-viewer.ts');
  const source = {
    kind: 'game',
    headers: {},
    fen: sample.fen,
    lines: [
      ['e4', 'e5'],
      ['d4', 'd5'],
    ],
  };
  assert.deepEqual(gameExerciseContext(source, { branch: 0, ply: 0 }), {
    fen: sample.fen,
    previousMove: undefined,
  });
  const e4 = gameExerciseContext(source, { branch: 0, ply: 1 });
  assert.deepEqual(e4.previousMove, { fen: sample.fen, move: 'e4' });
  const variation = gameExerciseContext(source, { branch: 1, ply: 2 });
  const beforeD5 = new chess.Chess(sample.fen);
  beforeD5.move('d4');
  assert.deepEqual(variation.previousMove, { fen: beforeD5.fen(), move: 'd5' });
  for (const [fen, move] of [
    ['r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 7 24', 'O-O'],
    ['4k3/3p4/8/4P3/8/8/8/4K3 b - - 0 1', 'd5'],
    ['7k/P7/8/8/8/8/8/7K w - - 0 29', 'a8=Q+'],
  ]) {
    const context = gameExerciseContext(
      { ...source, fen, lines: [[move]] },
      { branch: 0, ply: 1 }
    );
    const board = new chess.Chess(fen);
    const played = board.move(move);
    assert.equal(context.fen, board.fen());
    assert.deepEqual(context.previousMove, { fen, move: played.san });
    assert.deepEqual(
      store.validateManualPreviousMove(context.fen, context.previousMove),
      context.previousMove
    );
  }
  assert.throws(() => gameExerciseContext(source, { branch: 2, ply: 1 }));
  assert.throws(() => gameExerciseContext(source, { branch: 0, ply: 3 }));
  assert.throws(() =>
    store.validateManualPreviousMove(
      e4.fen.replace('0 1', '1 1'),
      e4.previousMove
    )
  );
  const ep = gameExerciseContext(
    { ...source, fen: '4k3/3p4/8/4P3/8/8/8/4K3 b - - 0 1', lines: [['d5']] },
    { branch: 0, ply: 1 }
  );
  assert.throws(() =>
    store.validateManualPreviousMove(
      ep.fen.replace(' d6 ', ' - '),
      ep.previousMove
    )
  );
});
test('the preceding move survives API save, reload and level-only edits, separately from the solution', async () => {
  const { gameExerciseContext } = load('src/lib/chess/draw-game-viewer.ts');
  const context = gameExerciseContext(
    { kind: 'game', headers: {}, fen: sample.fen, lines: [['e4', 'e5']] },
    { branch: 0, ply: 1 }
  );
  let result = await call('POST', {
    ...sample,
    ...context,
    moves: 'e5 Nf3',
    level: 'D',
  });
  assert.equal(result.code, 200);
  const first = result.body.position;
  const reloaded = (await call('GET')).body.positions.find(
    (e) => e.id === first.id
  );
  assert.deepEqual(reloaded.previousMove, context.previousMove);
  assert.deepEqual(reloaded.moves, ['e5', 'Nf3']);
  const exercise = store.manualExercise(reloaded);
  const { previousDrawPosition } = load('src/lib/chess/draw-trainer.ts');
  assert.equal(previousDrawPosition(exercise).move.san, 'e4');
  assert.match(
    load('src/lib/chess/worksheet.ts').previousMoveLabel(exercise),
    /e4/
  );
  // Omitted context in an edit must not erase the saved preceding move.
  result = await call('POST', {
    ...sample,
    fen: context.fen,
    moves: 'e5 Nf3',
    level: 'B',
    expectedUpdatedAt: first.updatedAt,
  });
  assert.equal(result.code, 200);
  assert.deepEqual(result.body.position.previousMove, context.previousMove);
  assert.equal(result.body.position.id, first.id);
  assert.equal(result.body.position.level, 'B');
  assert.equal(
    previousDrawPosition(store.manualExercise(result.body.position)).move.san,
    'e4'
  );
  assert.equal(
    (
      await call('DELETE', {
        id: first.id,
        expectedUpdatedAt: result.body.position.updatedAt,
      })
    ).code,
    200
  );
});
test('atomic authoring updates one topic/position, moves levels, preserves other topics, and blocks stale writes', async () => {
  allowed = false;
  assert.equal((await call('GET')).code, 401);
  assert.equal((await call('POST', sample)).code, 401);
  assert.deepEqual(await store.readManualTactics(), []);
  allowed = true;
  let result = await call('POST', sample);
  assert.equal(result.code, 200);
  let first = result.body.position;
  assert.match(result.body.href, /\/fork\?level=D&exercise=/);
  assert.equal(first.status, undefined);
  assert.equal(first.source, undefined);
  const entry = store.manualExercise(first);
  assert.equal(entry.difficulty.status, 'manual');
  assert.equal(entry.difficulty.sacrificeCount, undefined);
  assert.equal(entry.goal, 'material');
  assert.equal((await call('POST', sample)).code, 400);
  result = await call('POST', {
    ...sample,
    level: 'B',
    expectedUpdatedAt: first.updatedAt,
  });
  assert.equal(result.code, 200);
  assert.equal(result.body.position.id, first.id);
  assert.equal(result.body.position.createdAt, first.createdAt);
  assert.equal((await store.readManualTactics()).length, 1);
  assert.equal(
    (await call('DELETE', { id: first.id, expectedUpdatedAt: first.updatedAt }))
      .code,
    400
  );
  first = result.body.position;
  result = await call('POST', { ...sample, themeId: 'exposedKing' });
  assert.equal(result.code, 200);
  assert.match(result.body.href, /tactic-positions\?theme=exposedKing&level=D/);
  assert.equal((await store.readManualTactics()).length, 2);
  const topics = store.manualTopicPages(await store.readManualTactics());
  assert.equal(
    topics[0].worksheetEndpoint,
    '/api/manual-tactic-exercises?theme=exposedKing'
  );
  env.NODE_ENV = 'production';
  assert.equal((await call('POST', sample)).code, 403);
  assert.equal((await call('DELETE', { id: first.id })).code, 403);
  env.NODE_ENV = 'development';
  assert.equal(
    (await call('DELETE', { id: first.id, expectedUpdatedAt: first.updatedAt }))
      .code,
    200
  );
  assert.equal((await store.readManualTactics()).length, 1);
  const before = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(file + '.lock', '');
  await assert.rejects(
    store.mutateManualTactics(() => []),
    /Đang lưu/
  );
  fs.unlinkSync(file + '.lock');
  assert.equal(fs.readFileSync(file, 'utf8'), before);
});
test('manual Fork exercises appear in the existing protected API and shared worksheet levels without duplicate positions', async () => {
  await store.mutateManualTactics(() => []);
  const added = (await call('POST', sample)).body.position;
  const forkHandler = load('src/pages/api/fork-exercises.ts').default;
  const res = response();
  await forkHandler({ method: 'GET', headers: {} }, res);
  assert.equal(res.code, 200);
  const baseline = JSON.parse(
    fs.readFileSync('src/lib/server/fork-exercises.json', 'utf8')
  );
  const beginners = JSON.parse(
    fs.readFileSync('src/lib/server/fork-beginner-exercises.json', 'utf8')
  );
  const all = res.body.categories[0].exercises;
  assert.equal(all.length, beginners.length + baseline.length + 1);
  assert.equal(all.filter((e) => e.beginner).length, beginners.length);
  assert.ok(all.some((e) => e.manualId === added.id));
  const worksheet = load('src/lib/chess/worksheet.ts');
  assert.equal(
    worksheet.levelExercises(all, 'D').length,
    worksheet.levelExercises(baseline, 'D').length + 1
  );
  assert.deepEqual(worksheet.explainLine(added.fen, added.moves).length, 3);
  if (process.env.MANUAL_PDF_RENDER) {
    const originalFetch = global.fetch;
    global.fetch = async (url) => {
      const bytes = fs.readFileSync('public' + url);
      return {
        ok: true,
        arrayBuffer: async () =>
          bytes.buffer.slice(
            bytes.byteOffset,
            bytes.byteOffset + bytes.byteLength
          ),
      };
    };
    try {
      const pdf = load('src/lib/chess/worksheet-pdf.ts');
      const pages = worksheet.planWorksheet(
        [{ id: 1, topic: 'fork', level: 'D', count: 1 }],
        {
          fork: [
            store.manualExercise({
              ...added,
              alternativeLines: [
                ['e4', 'c5', 'Nf3'],
                ['d4', 'd5', 'c4'],
              ],
            }),
          ],
        },
        [{ id: 'fork', title: 'Tấn công đôi', endpoint: '/api/fork-exercises' }]
      );
      const files = await pdf.createWorksheetPdfs(
        pages,
        'KIỂM TRA BỐ CỤC THẾ CỜ TỰ THÊM'
      );
      fs.mkdirSync('tmp/pdfs/manual-tactics', { recursive: true });
      fs.writeFileSync(
        'tmp/pdfs/manual-tactics/worksheet.pdf',
        files.worksheet
      );
      fs.writeFileSync('tmp/pdfs/manual-tactics/answers.pdf', files.answers);
    } finally {
      global.fetch = originalFetch;
    }
  }
  const merged = store.mergeManualCategories(
    '/fork',
    [
      {
        id: 'fork',
        title: 'Fork',
        description: '',
        exercises: [store.manualExercise(added)],
      },
    ],
    [added]
  );
  assert.equal(merged[0].exercises.length, 1);
  allowed = false;
  const denied = response();
  await forkHandler({ method: 'GET', headers: {} }, denied);
  assert.equal(denied.code, 401);
  allowed = true;
  fs.writeFileSync(
    path.join(root, 'src/lib/server/fork-exercises.json'),
    JSON.stringify([{ ...baseline[0] }])
  );
  const duplicate = await call('POST', {
    ...sample,
    fen: baseline[0].fen,
    moves: baseline[0].moves,
  });
  assert.equal(duplicate.code, 409);
  fs.writeFileSync(
    path.join(root, 'src/lib/server/fork-beginner-exercises.json'),
    JSON.stringify([beginners[0]])
  );
  assert.equal(
    (
      await call('POST', {
        ...sample,
        level: 'Beginner',
        fen: beginners[0].fen,
        moves: beginners[0].moves,
      })
    ).code,
    409,
    'manual authoring cannot duplicate a curated Beginner fork'
  );
});
test('discovery subcategories, new manual topics and worksheet sources retain their own contents', async () => {
  const make = (themeId, id) => ({
    ...store.validateManualTactic({ ...sample, themeId }),
    id,
    createdAt: 'now',
    updatedAt: 'now',
  });
  const entries = [
    make('discoveredAttack', 'attack'),
    make('discoveredCheck', 'check'),
  ];
  // Use distinct positions for the combined category.
  const game = new chess.Chess(sample.fen);
  game.move('e4');
  entries[1].fen = game.fen();
  entries[1].moves = ['e5'];
  const categories = ['discovery', 'discovered-check', 'discovered-attack'].map(
    (id) => ({ id, title: id, description: '', exercises: [] })
  );
  const merged = store.mergeManualCategories(
    '/discovered-attack',
    categories,
    entries
  );
  assert.deepEqual(
    merged.map((c) => c.exercises.length),
    [2, 1, 1]
  );
  const own = make('exposedKing', 'king');
  await store.mutateManualTactics(() => [own]);
  const api = load('src/pages/api/manual-tactic-exercises.ts').default;
  allowed = false;
  const denied = response();
  await api({ method: 'GET', query: { theme: 'exposedKing' } }, denied);
  assert.equal(denied.code, 401);
  assert.equal(denied.body, undefined);
  allowed = true;
  const res = response();
  await api({ method: 'GET', query: { theme: 'exposedKing' } }, res);
  assert.equal(res.body.categories[0].exercises[0].manualId, 'king');
  const missing = response();
  await api({ method: 'GET', query: { theme: 'fork' } }, missing);
  assert.equal(missing.code, 404);
  const worksheet = load('src/lib/chess/worksheet.ts');
  assert.equal(
    worksheet.worksheetTopicsFromLibrary(store.manualTopicPages([own]))[0]
      .endpoint,
    '/api/manual-tactic-exercises?theme=exposedKing'
  );
  assert.equal(
    worksheet.worksheetTopicsFromLibrary([
      {
        href: '/x',
        title: 'x',
        worksheetEndpoint: 'https://evil.example/api/manual-tactic-exercises',
      },
    ]).length,
    0
  );
});

test('three recorded variants survive save, reopening, level changes and worksheet export, and all solver branches are accepted', async () => {
  await store.mutateManualTactics(() => []);
  const lines = [
    ['e4', 'e5', 'Nf3'],
    ['e4', 'c5', 'Nf3'],
    ['d4', 'd5', 'c4'],
  ];
  let result = await call('POST', {
    ...sample,
    moves: lines[0],
    alternativeLines: lines.slice(1),
  });
  assert.equal(result.code, 200);
  const id = result.body.position.id;
  let saved = (await call('GET')).body.positions.find(
    (entry) => entry.id === id
  );
  assert.deepEqual([saved.moves, ...saved.alternativeLines], lines);
  const exercise = store.manualExercise(saved);
  assert.deepEqual(exercise.alternativeLines, lines.slice(1));
  const { tryDrawMove } = load('src/lib/chess/draw-trainer.ts');
  assert.equal(tryDrawMove(exercise, [], 'e4').status, 'accepted');
  const alternate = tryDrawMove(exercise, [], 'd4');
  assert.equal(alternate.status, 'accepted');
  assert.deepEqual(alternate.played, ['d4', 'd5']);
  assert.equal(tryDrawMove(exercise, alternate.played, 'c4').complete, true);
  assert.equal(tryDrawMove(exercise, ['e4', 'c5'], 'Nf3').complete, true);
  const worksheet = load('src/lib/chess/worksheet.ts');
  for (const line of [exercise.moves, ...exercise.alternativeLines])
    assert.equal(worksheet.explainLine(exercise.fen, line).length, 3);
  const pages = worksheet.planWorksheet(
    [{ id: 1, topic: 'fork', level: 'D', count: 1 }],
    { fork: [exercise] },
    [{ id: 'fork', title: 'Fork', endpoint: '/api/fork-exercises' }]
  );
  assert.deepEqual(
    pages[0].exercises[0].exercise.alternativeLines,
    lines.slice(1)
  );
  result = await call('POST', {
    ...sample,
    level: 'B',
    expectedUpdatedAt: saved.updatedAt,
  });
  assert.equal(result.code, 200);
  assert.deepEqual(result.body.position.alternativeLines, lines.slice(1));
  saved = result.body.position;
  result = await call('POST', {
    ...sample,
    level: 'B',
    alternativeLines: [],
    expectedUpdatedAt: saved.updatedAt,
  });
  assert.equal(result.code, 200);
  assert.deepEqual(result.body.position.alternativeLines, []);
  await store.mutateManualTactics(() => []);
});
test('each alternative is legally replayed and mate examples must end in mate on every saved line', () => {
  const valid = store.validateManualTactic({
    ...sample,
    alternativeLines: [
      ['d4', 'd5'],
      ['d4', 'd5'],
      ['e4', 'e5', 'Nf3'],
    ],
  });
  assert.deepEqual(valid.alternativeLines, [['d4', 'd5']]);
  for (const alternativeLines of [
    null,
    [[]],
    [['e5']],
    Array.from({ length: 12 }, () => ['d4']),
  ])
    assert.throws(() =>
      store.validateManualTactic({ ...sample, alternativeLines })
    );
  const mate = {
    ...sample,
    fen: '7k/5Q2/5K2/8/8/8/8/8 w - - 0 1',
    goal: 'checkmate',
    moves: ['Qg7#'],
  };
  assert.deepEqual(
    store.validateManualTactic({
      ...mate,
      alternativeLines: [['Qe7', 'Kg8', 'Qg7#']],
    }).alternativeLines,
    [['Qe7', 'Kg8', 'Qg7#']]
  );
  assert.throws(
    () => store.validateManualTactic({ ...mate, alternativeLines: [['Qe7']] }),
    /Mỗi phương án/
  );
});

test('Beginner position-only authoring validates basic playability while A–D still require moves', () => {
  const input = {
    ...sample,
    level: 'Beginner',
    moves: [],
    solution: '',
    previousMove: null,
  };
  const position = store.validateManualTactic(input);
  assert.deepEqual(position.moves, []);
  assert.equal(position.solution, '');
  assert.equal(
    store.manualExercise({
      ...position,
      id: 'position',
      createdAt: 'now',
      updatedAt: 'now',
    }).solution,
    ''
  );
  assert.deepEqual(
    store.validateManualTactic({ ...input, goal: 'checkmate' }).moves,
    []
  );
  for (const level of ['A', 'B', 'C', 'C*', 'D'])
    assert.throws(() => store.validateManualTactic({ ...input, level }));
  for (const fen of [
    '8/8/8/8/8/8/8/K7 w - - 0 1',
    '8/8/8/8/8/8/4k3/4K3 w - - 0 1',
    'P6k/8/8/8/8/8/8/K7 w - - 0 1',
    '7k/8/8/8/8/8/8/K7 w K - 0 1',
  ])
    assert.throws(() => store.validateManualTactic({ ...input, fen }));
  assert.throws(() => store.validateManualTactic({ ...input, moves: ['e5'] }));
  assert.throws(() =>
    store.validateManualTactic({ ...input, alternativeLines: [['e4']] })
  );
  assert.throws(() =>
    store.validateManualTactic({ ...input, beginnerSourceLevel: 'B*' })
  );
});

test('Beginner FEN edits retain stable identity and source but clear stale solutions and context', async () => {
  await store.mutateManualTactics(() => []);
  fs.writeFileSync(
    path.join(root, 'src/lib/server/practice-adjustments.json'),
    '[]'
  );
  fs.writeFileSync(path.join(root, 'src/lib/server/fork-exercises.json'), '[]');
  fs.writeFileSync(
    path.join(root, 'src/lib/server/fork-beginner-exercises.json'),
    '[]'
  );
  const board = new chess.Chess(sample.fen);
  board.move('e4');
  let result = await call('POST', {
    ...sample,
    level: 'Beginner',
    fen: board.fen(),
    moves: ['e5'],
    alternativeLines: [['c5']],
    previousMove: { fen: sample.fen, move: 'e4' },
    beginnerOriginalFen: board.fen(),
    beginnerSourceLevel: 'A',
    reference: {
      id: 'original-game',
      collection: 'fork',
      kind: 'game',
      branch: 0,
      ply: 1,
    },
    headers: {
      White: 'Source white',
      Black: 'Source black',
      Event: 'Source event',
    },
  });
  assert.equal(result.code, 200);
  const original = result.body.position;
  const changed = new chess.Chess(sample.fen);
  changed.move('d4');
  result = await call('POST', {
    ...sample,
    id: original.id,
    level: 'Beginner',
    fen: changed.fen(),
    moves: [],
    solution: '',
    previousMove: null,
    expectedUpdatedAt: original.updatedAt,
  });
  assert.equal(result.code, 200);
  const updated = result.body.position;
  assert.equal(updated.id, original.id);
  assert.equal(updated.createdAt, original.createdAt);
  assert.notEqual(updated.updatedAt, original.updatedAt);
  assert.equal(updated.beginnerOriginalFen, original.fen);
  assert.deepEqual(updated.reference, original.reference);
  assert.deepEqual(updated.headers, original.headers);
  assert.deepEqual(updated.moves, []);
  assert.equal(updated.alternativeLines, undefined);
  assert.equal(updated.previousMove, undefined);
  assert.match(store.manualExercise(updated).gameCaption, /đã chỉnh sửa/);
  assert.equal(
    (
      await call('POST', {
        ...updated,
        fen: original.fen,
        expectedUpdatedAt: original.updatedAt,
      })
    ).code,
    400,
    'a stale edit must not overwrite the changed FEN'
  );
  assert.equal(
    (
      await call('POST', {
        ...updated,
        beginnerOriginalFen: sample.fen,
        expectedUpdatedAt: updated.updatedAt,
      })
    ).code,
    400,
    'the imported original position is immutable'
  );
  const other = await call('POST', {
    ...sample,
    level: 'Beginner',
    moves: [],
    solution: '',
  });
  assert.equal(other.code, 200);
  assert.equal(
    (
      await call('POST', {
        ...updated,
        fen: sample.fen,
        expectedUpdatedAt: updated.updatedAt,
      })
    ).code,
    409,
    'editing cannot create a second Beginner entry at the same topic/FEN'
  );
  const advanced = await call('POST', { ...sample, level: 'A' });
  assert.equal(advanced.code, 200);
  assert.equal(
    (
      await call('POST', {
        ...sample,
        id: advanced.body.position.id,
        level: 'A',
        fen: changed.fen(),
        moves: ['d5'],
        expectedUpdatedAt: advanced.body.position.updatedAt,
      })
    ).code,
    400,
    'A–D board edits remain unavailable'
  );
});

test('a Beginner overlay replaces only its original curated Beginner after the board changes', async () => {
  await store.mutateManualTactics(() => []);
  fs.writeFileSync(
    path.join(root, 'src/lib/server/practice-adjustments.json'),
    '[]'
  );
  fs.writeFileSync(path.join(root, 'src/lib/server/fork-exercises.json'), '[]');
  const curated = {
    ...sample,
    moves: ['e4'],
    beginner: true,
    difficulty: undefined,
    outcome: 'fork',
  };
  const beginnerFile = path.join(
    root,
    'src/lib/server/fork-beginner-exercises.json'
  );
  fs.writeFileSync(beginnerFile, JSON.stringify([curated]));
  const originalBytes = fs.readFileSync(beginnerFile, 'utf8');
  const board = new chess.Chess(sample.fen);
  board.move('d4');
  const saved = await call('POST', {
    ...sample,
    level: 'Beginner',
    fen: board.fen(),
    moves: [],
    solution: '',
    beginnerOriginalFen: sample.fen,
    beginnerBaseFen: sample.fen,
  });
  assert.equal(saved.code, 200);
  const categories = [
    { id: 'fork', title: 'Fork', description: '', exercises: [curated] },
  ];
  const merged = store.mergeManualCategories(
    '/fork',
    categories,
    await store.readManualTactics()
  );
  assert.equal(merged[0].exercises.length, 1);
  assert.equal(merged[0].exercises[0].fen, board.fen());
  assert.equal(merged[0].exercises[0].manualId, saved.body.position.id);
  assert.equal(fs.readFileSync(beginnerFile, 'utf8'), originalBytes);
  assert.equal(
    (
      await call('POST', {
        ...sample,
        level: 'Beginner',
        moves: [],
        solution: '',
        beginnerBaseFen: board.fen(),
      })
    ).code,
    400,
    'an arbitrary position is not a curated Beginner base'
  );
  fs.writeFileSync(
    path.join(root, 'src/lib/server/fork-exercises.json'),
    JSON.stringify([
      { ...curated, beginner: undefined, difficulty: { level: 'A' } },
    ])
  );
  fs.writeFileSync(beginnerFile, '[]');
  assert.equal(
    (
      await call('POST', {
        ...sample,
        level: 'Beginner',
        fen: board.fen(),
        moves: [],
        solution: '',
        beginnerBaseFen: sample.fen,
      })
    ).code,
    400,
    'A–D curated positions cannot be overlaid'
  );
});

test('a same-FEN Beginner source copy has separate management identity and never changes its A–D source', async () => {
  await store.mutateManualTactics(() => []);
  const adjustmentFile = path.join(
    root,
    'src/lib/server/practice-adjustments.json'
  );
  fs.writeFileSync(adjustmentFile, '[]');
  const curated = {
    ...sample,
    moves: ['e4'],
    outcome: 'fork',
    difficulty: { level: 'A' },
  };
  fs.writeFileSync(
    path.join(root, 'src/lib/server/fork-exercises.json'),
    JSON.stringify([curated])
  );
  fs.writeFileSync(
    path.join(root, 'src/lib/server/fork-beginner-exercises.json'),
    '[]'
  );
  const saved = await call('POST', {
    ...sample,
    level: 'Beginner',
    moves: [],
    solution: '',
    beginnerOriginalFen: sample.fen,
    beginnerSourceLevel: 'A',
  });
  assert.equal(saved.code, 200);
  let position = saved.body.position;
  assert.notEqual(position.id, store.manualTacticId('fork', sample.fen));
  const categories = [
    { id: 'fork', title: 'Fork', description: '', exercises: [curated] },
  ];
  let merged = await store.includeManualExercises('/fork', { categories });
  assert.equal(merged.categories[0].exercises.length, 2);
  const beginner = merged.categories[0].exercises.find(
    (e) => e.manualId === position.id
  );
  const advanced = merged.categories[0].exercises.find((e) => !e.manualId);
  assert.notEqual(beginner.management.id, advanced.management.id);
  const originalManagementId = beginner.management.id;
  const management = load('src/pages/api/practice-management.ts').default;
  const { practiceReviewReference } = load(
    'src/lib/chess/practice-management.ts'
  );
  async function manage(exercise, action, extra = {}) {
    const res = response();
    await management(
      {
        method: 'POST',
        body: {
          scope: exercise.management.scope,
          id: exercise.management.id,
          signature: exercise.management.signature,
          reference: practiceReviewReference(
            exercise.management.scope,
            exercise
          ),
          expectedUpdatedAt: exercise.management.updatedAt,
          action,
          level: 'A',
          note: '',
          ...extra,
        },
      },
      res
    );
    return res;
  }
  assert.equal(
    (await manage(beginner, 'move')).code,
    400,
    'solutionless Beginner entries cannot move to A–D'
  );
  assert.equal((await manage(beginner, 'remove')).code, 200);
  merged = await store.includeManualExercises('/fork', { categories });
  assert.equal(merged.categories[0].exercises.length, 1);
  assert.equal(merged.categories[0].exercises[0].difficulty.level, 'A');
  const board = new chess.Chess(sample.fen);
  board.move('d4');
  const edited = await call('POST', {
    ...sample,
    id: position.id,
    level: 'Beginner',
    fen: board.fen(),
    moves: [],
    solution: '',
    previousMove: null,
    expectedUpdatedAt: position.updatedAt,
  });
  assert.equal(edited.code, 200);
  position = edited.body.position;
  merged = await store.includeManualExercises('/fork', { categories });
  assert.equal(
    merged.categories[0].exercises.length,
    1,
    'removal follows the manual ID after a FEN edit'
  );
  const adjustment = JSON.parse(fs.readFileSync(adjustmentFile, 'utf8'))[0];
  const restored = response();
  await management(
    {
      method: 'POST',
      body: {
        scope: '/fork',
        id: originalManagementId,
        action: 'restore',
        note: '',
        expectedUpdatedAt: adjustment.updatedAt,
      },
    },
    restored
  );
  assert.equal(restored.code, 200);
  merged = await store.includeManualExercises('/fork', { categories });
  assert.equal(merged.categories[0].exercises.length, 2);
  assert.equal(
    merged.categories[0].exercises.find((e) => e.manualId).management.id,
    originalManagementId
  );
  assert.deepEqual(
    merged.categories[0].exercises.find((e) => !e.manualId).moves,
    curated.moves
  );
  await store.mutateManualTactics(() => []);
  fs.writeFileSync(adjustmentFile, '[]');
});

test('effective owner levels prevent solutionless saves or board edits outside Beginner', async () => {
  await store.mutateManualTactics(() => []);
  const adjustmentFile = path.join(
    root,
    'src/lib/server/practice-adjustments.json'
  );
  fs.writeFileSync(adjustmentFile, '[]');
  fs.writeFileSync(path.join(root, 'src/lib/server/fork-exercises.json'), '[]');
  fs.writeFileSync(
    path.join(root, 'src/lib/server/fork-beginner-exercises.json'),
    '[]'
  );
  const saved = await call('POST', {
    ...sample,
    level: 'Beginner',
    moves: ['e4'],
  });
  assert.equal(saved.code, 200);
  const position = saved.body.position;
  const catalog = await store.includeManualExercises('/fork', {
    categories: [{ id: 'fork', title: 'Fork', description: '', exercises: [] }],
  });
  const exercise = catalog.categories[0].exercises[0];
  const { practiceReviewReference } = load(
    'src/lib/chess/practice-management.ts'
  );
  const moved = response();
  await load('src/pages/api/practice-management.ts').default(
    {
      method: 'POST',
      body: {
        scope: '/fork',
        id: exercise.management.id,
        reference: practiceReviewReference('/fork', exercise),
        signature: exercise.management.signature,
        expectedUpdatedAt: null,
        action: 'move',
        level: 'A',
        note: '',
      },
    },
    moved
  );
  assert.equal(moved.code, 200);
  assert.equal((await call('GET')).body.levelOverrides[position.id], 'A');
  assert.equal(
    (
      await call('POST', {
        ...sample,
        id: position.id,
        level: 'Beginner',
        moves: [],
        solution: '',
        expectedUpdatedAt: position.updatedAt,
      })
    ).code,
    400
  );
  const board = new chess.Chess(sample.fen);
  board.move('d4');
  assert.equal(
    (
      await call('POST', {
        ...sample,
        id: position.id,
        level: 'Beginner',
        fen: board.fen(),
        moves: ['d5'],
        expectedUpdatedAt: position.updatedAt,
      })
    ).code,
    400
  );
  const legalEdit = await call('POST', {
    ...sample,
    id: position.id,
    level: 'Beginner',
    moves: ['d4'],
    expectedUpdatedAt: position.updatedAt,
  });
  assert.equal(legalEdit.code, 200);
  assert.match(legalEdit.body.href, /level=A/);
  await store.mutateManualTactics(() => []);
  fs.writeFileSync(adjustmentFile, '[]');
});

test('legacy Beginner decisions follow stable manual identity only without an A–D collision', async () => {
  const adjustmentFile = path.join(
    root,
    'src/lib/server/practice-adjustments.json'
  );
  fs.writeFileSync(path.join(root, 'src/lib/server/fork-exercises.json'), '[]');
  fs.writeFileSync(
    path.join(root, 'src/lib/server/fork-beginner-exercises.json'),
    '[]'
  );
  const position = {
    ...sample,
    id: store.manualTacticId('fork', sample.fen),
    level: 'Beginner',
    moves: [],
    solution: '',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };
  await store.mutateManualTactics(() => [position]);
  const management = load('src/lib/server/practice-management.ts');
  const { practiceReviewReference } = load(
    'src/lib/chess/practice-management.ts'
  );
  const legacy = {
    id: management.practiceAdjustmentId('/fork', sample.fen),
    reference: practiceReviewReference('/fork', store.manualExercise(position)),
    level: null,
    removed: true,
    note: '',
    updatedAt: '2026-01-02',
    history: [],
  };
  fs.writeFileSync(adjustmentFile, JSON.stringify([legacy]));
  const categories = [
    { id: 'fork', title: 'Fork', description: '', exercises: [] },
  ];
  assert.equal(
    (await store.includeManualExercises('/fork', { categories })).categories[0]
      .exercises.length,
    0
  );
  const board = new chess.Chess(sample.fen);
  board.move('d4');
  const edited = await call('POST', {
    ...sample,
    id: position.id,
    level: 'Beginner',
    fen: board.fen(),
    moves: [],
    solution: '',
    previousMove: null,
    expectedUpdatedAt: position.updatedAt,
  });
  assert.equal(edited.code, 200);
  assert.equal(
    (await store.includeManualExercises('/fork', { categories })).categories[0]
      .exercises.length,
    0
  );
  const sourceA = {
    ...sample,
    fen: board.fen(),
    moves: ['d5'],
    outcome: 'fork',
    difficulty: { level: 'A' },
  };
  fs.writeFileSync(
    path.join(root, 'src/lib/server/fork-exercises.json'),
    JSON.stringify([sourceA])
  );
  const collision = await store.includeManualExercises('/fork', {
    categories: [{ ...categories[0], exercises: [sourceA] }],
  });
  assert.equal(
    collision.categories[0].exercises.length,
    2,
    'an old Beginner decision is not applied when it could affect an A–D source'
  );
  assert.equal(
    collision.categories[0].exercises.find((e) => !e.manualId).difficulty.level,
    'A'
  );
  assert.notEqual(
    collision.categories[0].exercises.find((e) => e.manualId).management.id,
    collision.categories[0].exercises.find((e) => !e.manualId).management.id
  );
  await store.mutateManualTactics(() => []);
  fs.writeFileSync(adjustmentFile, '[]');
});
