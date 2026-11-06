const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const ts = require('typescript');
const project = process.cwd();
const temporary = fs.mkdtempSync(
  path.join(os.tmpdir(), 'practice-management-')
);
fs.mkdirSync(path.join(temporary, 'src/lib/server'), { recursive: true });
const file = path.join(temporary, 'src/lib/server/practice-adjustments.json');
const manualFile = path.join(temporary, 'src/lib/server/manual-tactics.json');
const env = {
  NODE_ENV: 'development',
  PRACTICE_PASSWORD: 'test-only-password',
};
const cache = new Map();
let chess,
  store,
  api,
  shared,
  access = true;
function load(name) {
  let target = path.resolve(project, name);
  if (!path.extname(target))
    target += fs.existsSync(target + '.ts') ? '.ts' : '.json';
  if (cache.has(target)) return cache.get(target).exports;
  if (target.endsWith('.json'))
    return JSON.parse(fs.readFileSync(target, 'utf8'));
  const mod = { exports: {} };
  cache.set(target, mod);
  const local = (id) => {
    if (id === 'chess.js') return chess;
    if (id.endsWith('/practice-access'))
      return {
        requirePracticeAccess: (_req, res) => {
          if (!access) res.status(401).end();
          return access;
        },
      };
    if (id.endsWith('/private-hub'))
      return { privateHubPath: () => '/tactics' };
    if (id.endsWith('/practice-game-caption'))
      return {
        practiceGameCaption: () => '',
        practicePlayerTitle: () => '',
        practicePlayers: () => [],
        practiceGameOpening: () => '',
      };
    if (id.startsWith('@/')) return load('src/' + id.slice(2));
    if (id.startsWith('.')) return load(path.join(path.dirname(target), id));
    return require(id);
  };
  new Function(
    'module',
    'exports',
    'require',
    'process',
    ts.transpileModule(fs.readFileSync(target, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        esModuleInterop: true,
      },
    }).outputText
  )(mod, mod.exports, local, { env, cwd: () => temporary });
  return mod.exports;
}
function response() {
  return {
    statusCode: 200,
    headers: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(name, value) {
      this.headers[name] = value;
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
async function call(body, method = 'POST', query = {}) {
  const res = response();
  await api({ method, body, query }, res);
  return res;
}
async function catalog(endpoint = 'discovery-exercises', query = {}) {
  const res = response();
  await load(`src/pages/api/${endpoint}.ts`).default(
    { method: 'GET', query },
    res
  );
  assert.equal(res.statusCode, 200);
  return res.body.categories;
}
const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const sample = {
  fen,
  title: 'Test position',
  moves: ['e4', 'e5', 'Nf3'],
  alternativeLines: [['d4', 'd5']],
  solution: 'Sample solution',
  goal: 'material',
  outcome: 'fork',
  difficulty: {
    level: 'B',
    status: 'manual',
    reason: 'Original review',
    solverMoves: 2,
  },
};
function annotated(scope = '/fork', exercise = sample) {
  return store.applyPracticeAdjustments(
    scope,
    [{ id: 'test', exercises: [exercise] }],
    []
  )[0].exercises[0];
}
function action(exercise, action = 'move', overrides = {}) {
  return {
    scope: exercise.management.scope,
    id: exercise.management.id,
    reference: shared.practiceReviewReference(
      exercise.management.scope,
      exercise
    ),
    signature: exercise.management.signature,
    expectedUpdatedAt: exercise.management.updatedAt,
    action,
    level: 'C*',
    note: 'Manual review: longer non-sacrificial line',
    ...overrides,
  };
}
test.before(async () => {
  chess = await import('chess.js');
  store = load('src/lib/server/practice-management.ts');
  shared = load('src/lib/chess/practice-management.ts');
  api = load('src/pages/api/practice-management.ts').default;
});
test.beforeEach(() => {
  fs.writeFileSync(file, '[]');
  fs.writeFileSync(manualFile, '[]');
  access = true;
  env.NODE_ENV = 'development';
  delete env.VERCEL;
});
test.after(() => fs.rmSync(temporary, { recursive: true, force: true }));

test('move, remove, restore and reset preserve exact solutions and record durable decisions', async () => {
  const original = JSON.stringify(sample);
  const first = annotated();
  const moved = await call(action(first));
  assert.equal(moved.statusCode, 200);
  assert.match(moved.body.href, /level=C\*&exercise=/);
  let categories = store.applyPracticeAdjustments(
    '/fork',
    [{ id: 'fork', exercises: [sample] }],
    await store.readPracticeAdjustments()
  );
  let exercise = categories[0].exercises[0];
  assert.equal(exercise.difficulty.level, 'C*');
  assert.equal(exercise.management.baseLevel, 'B');
  assert.equal(exercise.difficulty.status, 'manual');
  assert.deepEqual(exercise.moves, sample.moves);
  assert.deepEqual(exercise.alternativeLines, sample.alternativeLines);
  assert.equal(exercise.solution, sample.solution);
  assert.equal(JSON.stringify(sample), original);
  const removed = await call(
    action(exercise, 'remove', { note: 'Motif is incidental' })
  );
  assert.equal(removed.statusCode, 200);
  categories = store.applyPracticeAdjustments(
    '/fork',
    [{ id: 'fork', exercises: [sample] }],
    await store.readPracticeAdjustments()
  );
  assert.equal(categories[0].exercises.length, 0);
  assert.equal(categories[0].removedCount, 1);
  const listed = await call(undefined, 'GET', { scope: '/fork' });
  assert.equal(listed.body.entries[0].reference.fen, fen);
  assert.deepEqual(listed.body.entries[0].reference.moves, sample.moves);
  const restored = await call({
    scope: '/fork',
    id: first.management.id,
    action: 'restore',
    note: '',
    expectedUpdatedAt: removed.body.entry.updatedAt,
  });
  assert.equal(restored.statusCode, 200);
  assert.equal(restored.body.entry.level, 'C*');
  categories = store.applyPracticeAdjustments(
    '/fork',
    [{ id: 'fork', exercises: [sample] }],
    await store.readPracticeAdjustments()
  );
  exercise = categories[0].exercises[0];
  const reset = await call(
    action(exercise, 'reset', { note: 'Return to original review' })
  );
  assert.equal(reset.statusCode, 200);
  assert.match(reset.body.href, /level=B&exercise=/);
  const final = store.applyPracticeAdjustments(
    '/fork',
    [{ id: 'fork', exercises: [sample] }],
    await store.readPracticeAdjustments()
  )[0].exercises[0];
  assert.deepEqual(final.difficulty, sample.difficulty);
  assert.deepEqual(
    reset.body.entry.history.map((e) => e.action),
    ['move', 'remove', 'restore', 'reset']
  );
});

test('Beginner moves keep six levels separate and identity ignores game counters, not topic', async () => {
  const exercise = annotated();
  const moved = await call(action(exercise, 'move', { level: 'Beginner' }));
  assert.equal(moved.statusCode, 200);
  let adjusted = store.applyPracticeAdjustments(
    '/fork',
    [{ id: 'fork', exercises: [sample] }],
    await store.readPracticeAdjustments()
  )[0].exercises[0];
  assert.equal(adjusted.beginner, true);
  assert.equal(adjusted.difficulty, undefined);
  const view = load('src/lib/chess/draw-practice-view.ts');
  assert.deepEqual(
    view
      .drawPracticeLevelChoices({ exercises: [adjusted] })
      .map((e) => e.count),
    [1, 0, 0, 0, 0, 0]
  );
  assert.equal(
    (await call(action(adjusted, 'move', { level: 'D' }))).statusCode,
    200
  );
  adjusted = store.applyPracticeAdjustments(
    '/fork',
    [{ id: 'fork', exercises: [sample] }],
    await store.readPracticeAdjustments()
  )[0].exercises[0];
  assert.equal(adjusted.beginner, false);
  assert.equal(adjusted.difficulty.level, 'D');
  assert.equal(
    store.practiceAdjustmentId('/fork', fen),
    store.practiceAdjustmentId('/fork', fen.replace('0 1', '9 30'))
  );
  assert.notEqual(
    store.practiceAdjustmentId('/fork', fen),
    store.practiceAdjustmentId('/pin', fen)
  );
});

test('access, production, malformed input, tampered source and concurrent edits are rejected', async () => {
  const exercise = annotated();
  const request = action(exercise);
  access = false;
  assert.equal((await call(request)).statusCode, 401);
  assert.equal((await call(null, 'GET', { scope: '/fork' })).statusCode, 401);
  access = true;
  assert.equal((await call(request, 'DELETE')).statusCode, 405);
  for (const bad of [
    { level: 'B*' },
    { level: ['C'] },
    { scope: '/unknown' },
    { scope: ['/fork'] },
    { note: 'x'.repeat(1001) },
    { note: {} },
    { signature: '0'.repeat(64) },
    { id: 'bad' },
    { action: 'purge' },
    { reference: { ...request.reference, moves: ['d4'] } },
    { reference: { ...request.reference, fen: 'bad' } },
  ])
    assert.equal((await call({ ...request, ...bad })).statusCode, 400);
  assert.deepEqual(await store.readPracticeAdjustments(), []);
  const saved = await call(request);
  assert.equal(saved.statusCode, 200);
  assert.equal((await call(request)).statusCode, 409);
  assert.equal(
    (
      await call({
        ...action(exercise, 'restore'),
        expectedUpdatedAt: saved.body.entry.updatedAt,
        scope: '/pin',
      })
    ).statusCode,
    409
  );
  env.NODE_ENV = 'production';
  assert.equal((await call(request)).statusCode, 403);
  assert.equal(
    (await call(null, 'GET', { scope: '/fork' })).body.writable,
    false
  );
  const production = store.applyPracticeAdjustments(
    '/fork',
    [{ exercises: [sample] }],
    [],
    false
  )[0].exercises[0];
  assert.equal(production.management.writable, false);
  assert.equal(production.management.signature, undefined);
});

test('exclusive writes fail safely and corrupt files are never replaced', async () => {
  fs.writeFileSync(file + '.lock', '');
  assert.equal((await call(action(annotated()))).statusCode, 400);
  assert.equal(fs.readFileSync(file, 'utf8'), '[]');
  fs.unlinkSync(file + '.lock');
  fs.writeFileSync(file, 'broken json');
  assert.equal((await call(action(annotated()))).statusCode, 400);
  assert.equal(fs.readFileSync(file, 'utf8'), 'broken json');
  assert.equal(fs.existsSync(file + '.lock'), false);
});

test('real discovery API, its subcategories and worksheet selections share moves and exclusions', async () => {
  const rawPath = 'src/lib/server/discovery-exercises.json';
  const raw = fs.readFileSync(rawPath, 'utf8');
  const categories = await catalog();
  const source = categories[0].exercises.find(
    (e) => e.difficulty?.level === 'B'
  );
  const oldB = categories[0].exercises.filter(
    (e) => e.difficulty?.level === 'B'
  ).length;
  const oldC = categories[0].exercises.filter(
    (e) => e.difficulty?.level === 'C*'
  ).length;
  assert.equal((await call(action(source))).statusCode, 200);
  let next = await catalog();
  assert.equal(
    next[0].exercises.filter((e) => e.difficulty?.level === 'B').length,
    oldB - 1
  );
  assert.equal(
    next[0].exercises.filter((e) => e.difficulty?.level === 'C*').length,
    oldC + 1
  );
  for (const category of next)
    for (const e of category.exercises.filter((e) => e.fen === source.fen))
      assert.equal(e.difficulty.level, 'C*');
  const worksheet = load('src/lib/chess/worksheet.ts');
  assert.ok(
    worksheet
      .levelExercises(next[0].exercises, 'C*')
      .some((e) => e.fen === source.fen)
  );
  const moved = next[0].exercises.find((e) => e.fen === source.fen);
  assert.equal((await call(action(moved, 'remove'))).statusCode, 200);
  next = await catalog();
  assert.ok(next.every((c) => !c.exercises.some((e) => e.fen === source.fen)));
  assert.ok(
    !worksheet
      .levelExercises(next[0].exercises, 'C*')
      .some((e) => e.fen === source.fen)
  );
  assert.equal(fs.readFileSync(rawPath, 'utf8'), raw);
});

test('manual entries, source moves and generic topics use the same reversible management', async () => {
  const manual = load('src/lib/server/manual-tactics.ts');
  const position = {
    id: manual.manualTacticId('exposedKing', fen),
    themeId: 'exposedKing',
    level: 'B',
    fen,
    moves: ['e4', 'e5'],
    alternativeLines: [['d4', 'd5']],
    goal: 'win',
    solution: 'Test explanation',
    title: 'Manual position',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };
  fs.writeFileSync(manualFile, JSON.stringify([position]));
  let categories = await catalog('manual-tactic-exercises', {
    theme: 'exposedKing',
  });
  const entry = categories[0].exercises[0];
  assert.equal(
    (await call(action(entry, 'move', { level: 'D' }))).statusCode,
    200
  );
  categories = await catalog('manual-tactic-exercises', {
    theme: 'exposedKing',
  });
  assert.equal(categories[0].exercises[0].difficulty.level, 'D');
  assert.deepEqual(
    categories[0].exercises[0].alternativeLines,
    position.alternativeLines
  );
  const getManual = response();
  await load('src/pages/api/manual-tactics.ts').default(
    { method: 'GET' },
    getManual
  );
  assert.equal(getManual.body.levelOverrides[position.id], 'D');
  assert.deepEqual(await manual.readManualTactics(), [position]);
  const edited = response();
  await load('src/pages/api/manual-tactics.ts').default(
    {
      method: 'POST',
      body: {
        ...position,
        title: 'Revised explanation',
        expectedUpdatedAt: position.updatedAt,
      },
    },
    edited
  );
  assert.equal(edited.statusCode, 200);
  assert.match(edited.body.href, /theme=exposedKing&level=D&exercise=/);
  categories = await catalog('manual-tactic-exercises', {
    theme: 'exposedKing',
  });
  assert.equal(categories[0].exercises[0].difficulty.level, 'D');
  assert.deepEqual(
    categories[0].exercises[0].alternativeLines,
    position.alternativeLines
  );
  const changed = categories[0].exercises[0];
  assert.equal((await call(action(changed, 'remove'))).statusCode, 200);
  categories = await catalog('manual-tactic-exercises', {
    theme: 'exposedKing',
  });
  assert.equal(categories[0].exercises.length, 0);
  assert.equal(categories[0].removedCount, 1);
});

test('standalone Draw topic navigation uses adjusted counts', async () => {
  const source = (await catalog('perpetual-check-exercises'))[0].exercises.find(
    (e) => e.management
  );
  const allBefore = await catalog('draw-exercises');
  const countBefore = allBefore.find((c) => c.id === 'perpetual-check')
    .exercises.length;
  assert.equal((await call(action(source, 'remove'))).statusCode, 200);
  const res = response();
  await load('src/pages/api/perpetual-check-exercises.ts').default(
    { method: 'GET', query: {} },
    res
  );
  assert.equal(res.statusCode, 200);
  const link = res.body.themeLinks.find(
    (link) => link.id === 'perpetual-check'
  );
  assert.equal(link.count, countBefore - 1);
  assert.equal(res.body.categories[0].exercises.length, countBefore - 1);
});

test('Draw route aliases share decisions and empty topics retain restoration and all six levels', async () => {
  const exercise = annotated('/perpetual-check', {
    ...sample,
    outcome: 'repetition',
  });
  const removed = await call(action(exercise, 'remove'));
  assert.equal(removed.statusCode, 200);
  const decisions = await store.readPracticeAdjustments();
  const combined = store.applyPracticeAdjustments(
    '/draw',
    [
      {
        id: 'perpetual-check',
        exercises: [{ ...sample, outcome: 'repetition' }],
      },
    ],
    decisions
  );
  const standalone = store.applyPracticeAdjustments(
    '/perpetual-check',
    [
      {
        id: 'perpetual-check',
        exercises: [{ ...sample, outcome: 'repetition' }],
      },
    ],
    decisions
  );
  assert.deepEqual(combined, standalone);
  const view = load('src/lib/chess/draw-practice-view.ts');
  assert.equal(view.drawPracticeChoices(combined).length, 1);
  assert.deepEqual(
    view.drawPracticeLevelChoices(combined[0]).map((e) => e.count),
    [0, 0, 0, 0, 0, 0]
  );
});

test('cross-topic transfer preserves the full real exercise and moves worksheet membership atomically', async () => {
  const before = await catalog();
  const source = before[0].exercises.find((e) => e.title.includes('Quinteros'));
  assert.ok(source);
  const request = action(source, 'move', {
    level: 'B',
    destinationScope: '/tactic-positions?theme=exposedKing',
  });
  assert.equal(
    (
      await call({
        ...request,
        reference: {
          ...request.reference,
          exercise: { ...request.reference.exercise, solution: 'tampered' },
        },
      })
    ).statusCode,
    400
  );
  assert.equal(
    (await call({ ...request, destinationScope: '/unknown-page' })).statusCode,
    400
  );
  assert.deepEqual(await store.readPracticeAdjustments(), []);
  const moved = await call(request);
  assert.equal(moved.statusCode, 200);
  assert.match(moved.body.href, /theme=exposedKing&level=B&exercise=/);
  const origin = await catalog();
  assert.ok(
    origin.every((c) => !c.exercises.some((e) => e.fen === source.fen))
  );
  assert.equal(origin[0].transferredCount, 1);
  const target = (
    await catalog('manual-tactic-exercises', { theme: 'exposedKing' })
  )[0].exercises[0];
  assert.equal(target.management.id, source.management.id);
  assert.equal(target.management.scope, '/discovered-attack');
  assert.equal(
    target.management.currentScope,
    '/tactic-positions?theme=exposedKing'
  );
  assert.equal(target.difficulty.level, 'B');
  for (const key of [
    'fen',
    'moves',
    'alternativeLines',
    'previousMove',
    'gameReference',
    'players',
    'gameCaption',
    'gameOpening',
    'goal',
    'solution',
    'hints',
    'source',
    'outcome',
    'mode',
    'forcedReplies',
    'promotionGain',
    'pinSetup',
  ])
    assert.deepEqual(target[key], source[key], key);
  const worksheet = load('src/lib/chess/worksheet.ts');
  assert.equal(
    worksheet
      .levelExercises(origin[0].exercises, 'B')
      .some((e) => e.fen === source.fen),
    false
  );
  assert.equal(worksheet.levelExercises([target], 'B').length, 1);
  for (const line of [target.moves, ...target.alternativeLines]) {
    const board = new chess.Chess(target.fen);
    for (const move of line) assert.ok(board.move(move));
    assert.equal(board.in_checkmate(), true);
  }
  const state = (await store.readPracticeAdjustments())[0];
  assert.equal(state.reference.exercise.management, undefined);
  assert.equal(state.reference.exercise.solution, source.solution);
  assert.equal(state.history[0].scope, request.destinationScope);
});

test('transferred exercises can change levels, move again, be removed/restored and return to origin', async () => {
  const source = annotated();
  assert.equal(
    (
      await call(
        action(source, 'move', {
          destinationScope: '/tactic-positions?theme=exposedKing',
        })
      )
    ).statusCode,
    200
  );
  let target = (
    await catalog('manual-tactic-exercises', { theme: 'exposedKing' })
  )[0].exercises[0];
  assert.equal(
    (
      await call(
        action(target, 'move', {
          destinationScope: '/tactic-positions?theme=exposedKing',
          level: 'D',
        })
      )
    ).statusCode,
    200
  );
  target = (
    await catalog('manual-tactic-exercises', { theme: 'exposedKing' })
  )[0].exercises[0];
  assert.equal(target.difficulty.level, 'D');
  assert.equal(
    (
      await call(
        action(target, 'move', { destinationScope: '/pin', level: 'A' })
      )
    ).statusCode,
    200
  );
  assert.equal(
    (await catalog('manual-tactic-exercises', { theme: 'exposedKing' }))[0]
      .exercises.length,
    0
  );
  target = (await catalog('pin-exercises'))[0].exercises.find(
    (e) => e.management.id === source.management.id
  );
  assert.equal(target.management.currentScope, '/pin');
  assert.equal((await call(action(target, 'remove'))).statusCode, 200);
  assert.equal((await catalog('pin-exercises'))[0].removedCount, 1);
  const removedList = (await call(null, 'GET', { scope: '/pin' })).body.entries;
  assert.equal(removedList.length, 1);
  const row = removedList[0];
  const restored = await call({
    id: row.id,
    scope: row.reference.scope,
    action: 'restore',
    expectedUpdatedAt: row.updatedAt,
    note: '',
  });
  assert.equal(restored.statusCode, 200);
  assert.match(restored.body.href, /\/pin\?level=A&exercise=/);
  target = (await catalog('pin-exercises'))[0].exercises.find(
    (e) => e.management.id === source.management.id
  );
  const reset = await call(action(target, 'reset'));
  assert.equal(reset.statusCode, 200);
  assert.match(reset.body.href, /\/fork\?level=B&exercise=/);
  assert.equal(reset.body.entry.destinationScope, undefined);
  const original = store.applyPracticeAdjustments(
    '/fork',
    [{ exercises: [sample] }],
    await store.readPracticeAdjustments()
  )[0].exercises[0];
  assert.deepEqual(original.difficulty, sample.difficulty);
  assert.equal(
    (await catalog('pin-exercises'))[0].exercises.some(
      (e) => e.fen === source.fen
    ),
    false
  );
});

test('target collisions preserve both pages and concurrent transfers cannot overwrite a position', async () => {
  const source = annotated('/fork');
  const manual = load('src/lib/server/manual-tactics.ts');
  const position = {
    id: manual.manualTacticId('exposedKing', fen),
    themeId: 'exposedKing',
    level: 'B',
    fen,
    moves: ['d4'],
    title: 'Already authored',
    goal: 'material',
    solution: '',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };
  fs.writeFileSync(manualFile, JSON.stringify([position]));
  assert.equal(
    (
      await call(
        action(source, 'move', {
          destinationScope: '/tactic-positions?theme=exposedKing',
        })
      )
    ).statusCode,
    400
  );
  assert.deepEqual(await store.readPracticeAdjustments(), []);
  assert.deepEqual(await manual.readManualTactics(), [position]);
  fs.writeFileSync(manualFile, '[]');
  const first = await call(
    action(source, 'move', {
      destinationScope: '/tactic-positions?theme=exposedKing',
    })
  );
  assert.equal(first.statusCode, 200);
  const other = annotated('/pin');
  assert.equal(
    (
      await call(
        action(other, 'move', {
          destinationScope: '/tactic-positions?theme=exposedKing',
        })
      )
    ).statusCode,
    400
  );
  assert.equal(
    (await call(action(source, 'move', { destinationScope: '/pin' })))
      .statusCode,
    409
  );
  assert.equal((await store.readPracticeAdjustments()).length, 1);
  // Existing curated destination data is protected too.
  fs.writeFileSync(file, '[]');
  const curated = (await catalog('fork-exercises'))[0].exercises.find(
    (exercise) => !exercise.beginner
  );
  const fromOtherTopic = annotated(
    '/tactic-positions?theme=exposedKing',
    curated
  );
  const curatedFixture = path.join(
    temporary,
    'src/lib/server/fork-exercises.json'
  );
  fs.copyFileSync('src/lib/server/fork-exercises.json', curatedFixture);
  assert.equal(
    (await call(action(fromOtherTopic, 'move', { destinationScope: '/fork' })))
      .statusCode,
    400
  );
  assert.deepEqual(await store.readPracticeAdjustments(), []);
  fs.unlinkSync(curatedFixture);
});

test('discovery subcategory membership and newly registered generic topics follow transfers', async () => {
  const source = annotated('/tactic-positions?theme=exposedKing', {
    ...sample,
    discoveryKind: 'check',
  });
  assert.equal(
    (
      await call(
        action(source, 'move', { destinationScope: '/discovered-attack' })
      )
    ).statusCode,
    200
  );
  const categories = await catalog();
  assert.ok(categories[0].exercises.some((e) => e.fen === fen));
  assert.ok(categories[1].exercises.some((e) => e.fen === fen));
  assert.ok(!categories[2].exercises.some((e) => e.fen === fen));
  const current = categories[0].exercises.find((e) => e.fen === fen);
  const generic = '/tactic-positions?theme=sacrifice';
  assert.equal(
    (await call(action(current, 'move', { destinationScope: generic })))
      .statusCode,
    200
  );
  const entries = await store.readPracticeAdjustments();
  const pages = load('src/lib/server/manual-tactics.ts').manualTopicPages(
    [],
    entries
  );
  const page = pages.find((page) => page.href === generic);
  assert.equal(
    page.worksheetEndpoint,
    '/api/manual-tactic-exercises?theme=sacrifice'
  );
  assert.ok(
    !(await catalog()).some((c) => c.exercises.some((e) => e.fen === fen))
  );
  assert.equal(
    (await catalog('manual-tactic-exercises', { theme: 'sacrifice' }))[0]
      .exercises.length,
    1
  );
});

test('authored solution edits remain live after a cross-topic move and return to the current destination', async () => {
  const manual = load('src/lib/server/manual-tactics.ts');
  const position = {
    id: manual.manualTacticId('exposedKing', fen),
    themeId: 'exposedKing',
    level: 'B',
    fen,
    moves: ['e4', 'e5'],
    alternativeLines: [['d4', 'd5']],
    title: 'Authored position',
    goal: 'material',
    solution: 'Original note',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };
  fs.writeFileSync(manualFile, JSON.stringify([position]));
  const source = (
    await catalog('manual-tactic-exercises', { theme: 'exposedKing' })
  )[0].exercises[0];
  assert.equal(
    (await call(action(source, 'move', { destinationScope: '/fork' })))
      .statusCode,
    200
  );
  const get = response();
  await load('src/pages/api/manual-tactics.ts').default({ method: 'GET' }, get);
  assert.equal(get.body.topicOverrides[position.id], '/fork');
  const saved = response();
  await load('src/pages/api/manual-tactics.ts').default(
    {
      method: 'POST',
      body: {
        ...position,
        moves: ['e4', 'e5', 'Nf3'],
        expectedUpdatedAt: position.updatedAt,
        solution: 'Edited note',
      },
    },
    saved
  );
  assert.equal(saved.statusCode, 200);
  assert.match(saved.body.href, /\/fork\?level=C\*&exercise=/);
  const transferred = (await catalog('fork-exercises'))[0].exercises.find(
    (e) => e.manualId === position.id
  );
  assert.deepEqual(transferred.moves, ['e4', 'e5', 'Nf3']);
  assert.deepEqual(transferred.alternativeLines, position.alternativeLines);
  assert.equal(transferred.solution, 'Edited note');
  assert.equal(
    (await catalog('manual-tactic-exercises', { theme: 'exposedKing' }))[0]
      .exercises.length,
    0
  );
  assert.equal(
    (
      await call(
        action(transferred, 'move', { destinationScope: '/fork', level: 'D' })
      )
    ).statusCode,
    200
  );
});

test('a transferred Beginner queen skewer remains visible outside the skewer-only split', async () => {
  const raw = {
    ...sample,
    beginner: true,
    beginnerKind: 'queen',
    difficulty: undefined,
  };
  const source = annotated('/skewer', raw);
  assert.equal(
    (
      await call(
        action(source, 'move', {
          destinationScope: '/tactic-positions?theme=exposedKing',
          level: 'Beginner',
        })
      )
    ).statusCode,
    200
  );
  const target = (
    await catalog('manual-tactic-exercises', { theme: 'exposedKing' })
  )[0];
  const view = load('src/lib/chess/draw-practice-view.ts');
  assert.equal(view.beginnerPracticeExercises(target).length, 1);
  assert.equal(view.beginnerPracticeExercises(target, 'queen').length, 1);
  assert.equal(view.beginnerPracticeExercises(target, 'king').length, 0);
  assert.equal(target.exercises[0].management.baseLevel, 'Beginner');
});

test('owner solution edits preserve source context, classification and signed identity across transfers and resets', async () => {
  const raw = {
    ...sample,
    previousMove: undefined,
    gameReference: {
      collection: 'test',
      id: 'source',
      kind: 'game',
      ply: 0,
      branch: 0,
    },
    hints: ['Keep the teaching hint'],
  };
  const original = structuredClone(raw);
  const source = annotated('/fork', raw);
  const solution = {
    moves: ['e4', 'e5', 'Nf3'],
    alternativeLines: [
      ['e4', 'c5', 'Nf3'],
      ['e4', 'e6', 'd4'],
    ],
    solution: 'Owner teaching explanation',
  };
  const saved = await call(action(source, 'solution', { solution }));
  assert.equal(saved.statusCode, 200);
  let entries = await store.readPracticeAdjustments();
  const read = () =>
    store.applyPracticeAdjustments(
      '/fork',
      [{ id: 'fork', exercises: [raw] }],
      entries
    )[0].exercises[0];
  let edited = read();
  assert.deepEqual(edited.moves, solution.moves);
  assert.deepEqual(edited.alternativeLines, solution.alternativeLines);
  assert.equal(edited.solution, solution.solution);
  for (const field of ['fen', 'goal', 'gameReference', 'hints', 'difficulty'])
    assert.deepEqual(edited[field], original[field]);
  assert.deepEqual(raw, original);
  assert.equal(edited.management.id, source.management.id);
  assert.equal(edited.management.solutionEdited, true);
  assert.ok(
    store.validPracticeReference(
      shared.practiceReviewReference('/fork', edited),
      edited.management.signature
    )
  );
  assert.deepEqual(entries[0].reference.moves, sample.moves);
  assert.deepEqual(entries[0].history[0].solution, solution);
  const stale = await call(action(source, 'solution', { solution }));
  assert.equal(stale.statusCode, 409);
  assert.deepEqual(await store.readPracticeAdjustments(), entries);
  const moved = await call(
    action(edited, 'move', { destinationScope: '/pin', level: 'D' })
  );
  assert.equal(moved.statusCode, 200);
  let target = (await catalog('pin-exercises'))[0].exercises.find(
    (e) => e.management?.id === source.management.id
  );
  assert.deepEqual(target.alternativeLines, solution.alternativeLines);
  const updatedSolution = { ...solution, solution: 'Edited after transfer' };
  assert.equal(
    (await call(action(target, 'solution', { solution: updatedSolution })))
      .statusCode,
    200
  );
  target = (await catalog('pin-exercises'))[0].exercises.find(
    (e) => e.management?.id === source.management.id
  );
  assert.equal(target.solution, updatedSolution.solution);
  assert.equal(target.difficulty.level, 'D');
  assert.equal((await call(action(target, 'reset'))).statusCode, 200);
  entries = await store.readPracticeAdjustments();
  edited = read();
  assert.equal(edited.solution, updatedSolution.solution);
  assert.deepEqual(edited.difficulty, original.difficulty);
  assert.equal((await call(action(edited, 'reset-solution'))).statusCode, 200);
  entries = await store.readPracticeAdjustments();
  edited = read();
  assert.deepEqual(edited.moves, original.moves);
  assert.deepEqual(edited.alternativeLines, original.alternativeLines);
  assert.equal(edited.solution, original.solution);
  assert.equal(edited.management.solutionEdited, undefined);
  assert.equal(
    entries[0].history.filter((item) => item.action === 'solution').length,
    2
  );
});

test('solution updates validate every branch, bounds, access and the signed source before any write', async () => {
  const source = annotated();
  const valid = {
    moves: ['e4', 'e5'],
    alternativeLines: [['d4', 'd5']],
    solution: '',
  };
  for (const solution of [
    { ...valid, moves: [] },
    { ...valid, alternativeLines: [['e4', 'e5', 'e4']] },
    { ...valid, alternativeLines: Array(12).fill(['e4']) },
    { ...valid, solution: 'x'.repeat(4001) },
  ]) {
    assert.equal(
      (await call(action(source, 'solution', { solution }))).statusCode,
      400
    );
    assert.deepEqual(await store.readPracticeAdjustments(), []);
  }
  const tampered = action(source, 'solution', { solution: valid });
  tampered.reference = {
    ...tampered.reference,
    fen: '8/8/8/8/8/4k3/8/4K3 w - - 0 1',
  };
  assert.equal((await call(tampered)).statusCode, 400);
  access = false;
  assert.equal(
    (await call(action(source, 'solution', { solution: valid }))).statusCode,
    401
  );
  access = true;
  env.NODE_ENV = 'production';
  assert.equal(
    (await call(action(source, 'solution', { solution: valid }))).statusCode,
    403
  );
  env.NODE_ENV = 'development';
  assert.deepEqual(await store.readPracticeAdjustments(), []);
  // Keep the existing manual/Beginner authoring store as the only editor.
  for (const raw of [
    { ...sample, manualId: 'owner-entry' },
    { ...sample, beginner: true },
  ]) {
    assert.equal(
      (
        await call(
          action(annotated('/fork', raw), 'solution', { solution: valid })
        )
      ).statusCode,
      400
    );
  }
});

test('mate solution updates require mate by the solver; all stored branches remain usable by the trainer', async () => {
  const raw = {
    ...sample,
    fen: '7k/8/5KQ1/8/8/8/8/8 w - - 0 1',
    moves: ['Qg7#'],
    alternativeLines: [],
    outcome: 'checkmate',
    goal: 'checkmate',
  };
  const source = annotated('/fork', raw);
  const bad = await call(
    action(source, 'solution', {
      solution: { moves: ['Qg7#'], alternativeLines: [['Qg4']], solution: '' },
    })
  );
  assert.equal(bad.statusCode, 400);
  assert.deepEqual(await store.readPracticeAdjustments(), []);
  const saved = await call(
    action(source, 'solution', {
      solution: {
        moves: ['Qg7#'],
        alternativeLines: [['Qg3', 'Kh7', 'Qg7#']],
        solution: '',
      },
    })
  );
  assert.equal(saved.statusCode, 200);
  const edited = store.applyPracticeAdjustments(
    '/fork',
    [{ id: 'fork', exercises: [raw] }],
    await store.readPracticeAdjustments()
  )[0].exercises[0];
  const trainer = load('src/lib/chess/draw-trainer.ts');
  assert.equal(trainer.tryDrawMove(edited, [], 'Qg3').status, 'accepted');
  assert.equal(
    trainer.tryDrawMove(edited, ['Qg3', 'Kh7'], 'Qg7#').complete,
    true
  );
});

test('real fork solution edits reach practice and worksheet catalogs without adding a position', async () => {
  const before = (await catalog('fork-exercises'))[0];
  const source = before.exercises.find(
    (e) => !e.beginner && e.moves.length && !e.manualId
  );
  const snapshot = structuredClone(source);
  const solution = {
    moves: source.moves,
    alternativeLines: source.alternativeLines ?? [],
    solution: 'Owner explanation for worksheet and practice',
  };
  assert.equal(
    (await call(action(source, 'solution', { solution }))).statusCode,
    200
  );
  const after = (await catalog('fork-exercises'))[0];
  assert.equal(after.exercises.length, before.exercises.length);
  const edited = after.exercises.find(
    (e) => e.management?.id === source.management.id
  );
  assert.equal(edited.solution, solution.solution);
  assert.deepEqual(edited.previousMove, snapshot.previousMove);
  const worksheet = load('src/lib/chess/worksheet.ts');
  const selection = worksheet.levelExercises(
    after.exercises,
    source.difficulty.level
  );
  assert.ok(selection.some((e) => e.solution === solution.solution));
});

test('editing a transferred solution keeps its number among other incoming positions', async () => {
  const sources = ['e4', 'd4', 'c4'].map((san) => {
    const board = new chess.Chess(fen);
    board.move(san);
    return annotated('/fork', {
      ...sample,
      fen: board.fen(),
      moves: ['e5'],
      alternativeLines: [],
      title: san,
    });
  });
  const destinationScope = '/tactic-positions?theme=exposedKing';
  for (const source of sources) {
    assert.equal(
      (await call(action(source, 'move', { destinationScope, level: 'B' })))
        .statusCode,
      200
    );
  }
  const before = (
    await catalog('manual-tactic-exercises', { theme: 'exposedKing' })
  )[0].exercises;
  const ids = before.map((e) => e.management.id);
  const middle = before[1];
  const saved = await call(
    action(middle, 'solution', {
      solution: {
        moves: ['e5', 'Nf3'],
        alternativeLines: [],
        solution: 'Updated in place',
      },
    })
  );
  assert.equal(saved.statusCode, 200);
  const after = (
    await catalog('manual-tactic-exercises', { theme: 'exposedKing' })
  )[0].exercises;
  assert.deepEqual(
    after.map((e) => e.management.id),
    ids
  );
  assert.equal(after[1].solution, 'Updated in place');
  assert.deepEqual(
    (await store.readPracticeAdjustments()).map((e) => e.id),
    ids
  );
});
