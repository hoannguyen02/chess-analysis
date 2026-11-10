const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const ts = require('typescript');
let chess;
let store;
const tacticsCatalog = require('./fixtures/tactics-index/tactics-map.json');
test.before(async () => {
  chess = await import('chess.js');
  store = load(
    'src/lib/server/saved-games-store.ts',
    {
      './saved-games.json': [],
      'chess.js': chess,
      './tactics-catalog': { tacticsCatalog },
      '../chess/draw-levels': load('src/lib/chess/draw-levels.ts'),
    },
    { process: { env, cwd: () => root } }
  );
});
const load = (file, deps = {}, globals = {}) => {
  const mod = { exports: {} };
  new Function(
    'require',
    'module',
    'exports',
    ...Object.keys(globals),
    ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: {
        target: ts.ScriptTarget.ES2017,
        module: ts.ModuleKind.CommonJS,
        esModuleInterop: true,
      },
    }).outputText
  )(
    (name) => (name in deps ? deps[name] : require(name)),
    mod,
    mod.exports,
    ...Object.values(globals)
  );
  return mod.exports;
};
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'saved-games-'));
fs.mkdirSync(path.join(root, 'src/lib/server'), { recursive: true });
const file = path.join(root, 'src/lib/server/saved-games.json');
fs.writeFileSync(file, '[]');
const env = { NODE_ENV: 'development' };
const loadSavedGames = () =>
  load('src/lib/chess/saved-games.ts', {
    './draw-levels': load('src/lib/chess/draw-levels.ts'),
  });

const sample = {
  source: {
    kind: 'game',
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    headers: { White: 'One', Black: 'Two', Result: '1-0' },
    lines: [['e4', 'e5']],
  },
  reference: { id: 'example', kind: 'game', branch: 0, ply: 1 },
  squares: ['f7'],
  tags: ['Attack'],
  note: 'A note',
};
const position = {
  themeId: 'exposedKing',
  level: 'D',
  squares: ['f7'],
  tags: ['King attack'],
  note: 'Check the defensive replies',
};
test('validates legal full replay, tags and bookmarked boundaries', () => {
  assert.equal(store.validateSavedGame(sample).note, 'A note');
  for (const bad of [
    { ...sample, squares: ['f9'] },
    { ...sample, reference: { ...sample.reference, ply: 3 } },
    { ...sample, source: { ...sample.source, lines: [['e5']] } },
    { ...sample, source: { ...sample.source, fen: 'bad' } },
  ])
    assert.throws(() => store.validateSavedGame(bad));
});
test('position classification uses the catalog and nine levels; FEN is derived from legal replay', () => {
  const game = new chess.Chess(sample.source.fen);
  game.move('e4');
  const input = store.validateSavedGame({
    ...sample,
    position: { ...position, fen: sample.source.fen, status: 'approved' },
  });
  assert.equal(input.position.fen, game.fen());
  assert.equal(input.position.status, undefined);
  for (const level of ['Beginner', 'A', 'B', 'C', 'C*', 'D', 'D*', 'E', 'E*'])
    assert.equal(
      store.validateSavedGame({ ...sample, position: { ...position, level } })
        .position.level,
      level
    );
  for (const invalid of [
    null,
    { ...position, themeId: 'invented-topic' },
    { ...position, level: 'B*' },
    { ...position, level: 'C**' },
    { ...position, squares: ['a9'] },
    { ...position, tags: [''] },
    { ...position, note: 'x'.repeat(4001) },
  ])
    assert.throws(() =>
      store.validateSavedGame({ ...sample, position: invalid })
    );
});
test('topic and level filters must match one saved position and support legacy games', () => {
  const { matchingSavedPositions, savedMoveLabel } = loadSavedGames();
  assert.deepEqual(
    matchingSavedPositions(sample, { themeId: '', level: '' }),
    []
  );
  const game = {
    ...sample,
    positions: [
      position,
      { ...position, themeId: 'discoveredAttack', level: 'B' },
    ],
  };
  assert.equal(
    matchingSavedPositions(game, { themeId: 'exposedKing', level: 'B' }).length,
    0
  );
  assert.equal(
    matchingSavedPositions(game, { themeId: 'exposedKing', level: 'D' }).length,
    1
  );
  assert.equal(savedMoveLabel(sample.source, sample.reference), 'Sau 1. e4');
  assert.equal(
    savedMoveLabel(sample.source, { ...sample.reference, ply: 2 }),
    'Sau 1… e5'
  );
  assert.equal(
    savedMoveLabel(sample.source, { ...sample.reference, ply: 0 }),
    'Vị trí bắt đầu'
  );
  assert.equal(
    savedMoveLabel(
      {
        ...sample.source,
        fen: sample.source.fen.replace(' w ', ' b ').replace('0 1', '0 17'),
        lines: [['e5']],
      },
      sample.reference
    ),
    'Sau 17… e5'
  );
});
test('saved-position links accept catalog themes and nine levels, ignoring invalid or repeated query values', () => {
  const { savedPositionFilters } = loadSavedGames();
  const themes = tacticsCatalog.themes;
  assert.deepEqual(savedPositionFilters({ theme: 'exposedKing' }, themes), {
    themeId: 'exposedKing',
    level: '',
  });
  for (const level of ['Beginner', 'A', 'B', 'C', 'C*', 'D', 'D*', 'E', 'E*'])
    assert.deepEqual(
      savedPositionFilters({ theme: 'exposedKing', level }, themes),
      { themeId: 'exposedKing', level }
    );
  for (const query of [
    {},
    { theme: 'unknown', level: 'B*' },
    { theme: ['exposedKing', 'fork'], level: ['D'] },
  ])
    assert.deepEqual(savedPositionFilters(query, themes), {
      themeId: '',
      level: '',
    });
});
test('same game shares identity across collections and moments', () => {
  assert.equal(
    store.gameId(sample.source),
    store.gameId({ ...sample.source, gameOpening: 'Updated opening' })
  );
  assert.notEqual(
    store.gameId(sample.source),
    store.gameId({ ...sample.source, lines: [['d4']] })
  );
});
test('atomic save persists, rejects concurrent writes, and preserves data after failure', async () => {
  await store.mutateSavedGames(() => [{ id: 'test' }]);
  assert.equal((await store.readSavedGames())[0].id, 'test');
  await assert.rejects(
    store.mutateSavedGames(() => {
      throw new Error('conflict');
    }),
    /conflict/
  );
  assert.equal((await store.readSavedGames())[0].id, 'test');
  fs.writeFileSync(`${file}.lock`, '');
  await assert.rejects(
    store.mutateSavedGames(() => []),
    /đang được cập nhật/
  );
  fs.unlinkSync(`${file}.lock`);
  await store.mutateSavedGames(() => []);
  assert.deepEqual(await store.readSavedGames(), []);
});
test('deployed collection is read-only and winner is result-specific', () => {
  env.NODE_ENV = 'production';
  assert.equal(store.writable(), false);
  env.NODE_ENV = 'development';
  const { winningPlayer } = loadSavedGames();
  assert.equal(winningPlayer(sample.source), 'One');
  assert.equal(
    winningPlayer({
      ...sample.source,
      headers: { ...sample.source.headers, Result: '0-1' },
    }),
    'Two'
  );
  assert.equal(
    winningPlayer({
      ...sample.source,
      headers: { ...sample.source.headers, Result: '1/2-1/2' },
    }),
    ''
  );
});
test.after(() => fs.rmSync(root, { recursive: true, force: true }));

test('API requires access, rejects stale writes, merges moments, and deletes', async () => {
  let allowed = false;
  const handler = load('src/pages/api/saved-games.ts', {
    '@/lib/server/practice-access': {
      requirePracticeAccess: (_req, res) => {
        if (!allowed) res.status(401).end();
        return allowed;
      },
    },
    '@/lib/server/private-hub': { privateHubPath: () => '' },
    '@/lib/server/saved-games-store': store,
    '@/lib/server/tactics-catalog': { tacticsCatalog },
  }).default;
  async function call(method, body) {
    const res = {
      code: 200,
      status(c) {
        this.code = c;
        return this;
      },
      json(data) {
        this.data = data;
        return this;
      },
      end() {},
      setHeader() {},
    };
    await handler({ method, body }, res);
    return res;
  }
  assert.equal((await call('GET')).code, 401);
  assert.equal((await call('POST', { ...sample, position })).code, 401);
  allowed = true;
  const catalog = (await call('GET')).data.themes;
  assert.ok(catalog.some((theme) => theme.id === 'exposedKing'));
  let result = await call('POST', sample);
  assert.equal(result.code, 200);
  const first = result.data.games[0];
  assert.equal((await call('POST', sample)).code, 400);
  result = await call('POST', {
    ...sample,
    reference: { ...sample.reference, ply: 2 },
    expectedUpdatedAt: first.updatedAt,
  });
  assert.equal(result.data.games.length, 1);
  assert.equal(result.data.games[0].moments.length, 2);
  const save = async (overrides) => {
    result = await call('POST', {
      ...sample,
      expectedUpdatedAt: result.data.games[0].updatedAt,
      ...overrides,
    });
    assert.equal(result.code, 200, result.data?.error);
    return result.data.games[0];
  };
  const firstPosition = await save({
    position: { ...position, status: 'approved' },
  });
  const saved = firstPosition.positions[0];
  assert.equal(saved.status, 'pending-review');
  assert.equal(saved.reference.ply, sample.reference.ply);
  assert.equal(
    saved.fen,
    store.validateSavedGame({ ...sample, position }).position.fen
  );
  assert.equal(firstPosition.note, sample.note);
  assert.deepEqual(firstPosition.squares, sample.squares);
  const edited = await save({
    position: { ...position, level: 'C*', note: 'Revised idea' },
    note: 'Do not overwrite game notes',
  });
  assert.equal(edited.positions.length, 1);
  assert.equal(edited.positions[0].id, saved.id);
  assert.equal(edited.positions[0].createdAt, saved.createdAt);
  assert.equal(edited.positions[0].level, 'C*');
  assert.equal(edited.note, sample.note);
  const stale = await call('POST', {
    ...sample,
    position,
    expectedUpdatedAt: firstPosition.updatedAt,
  });
  assert.equal(stale.code, 400);
  assert.equal(
    (await store.readSavedGames())[0].positions[0].note,
    'Revised idea'
  );
  // A second topic at one move and a second move retain independent notes/grades.
  await save({
    position: {
      ...position,
      themeId: 'discoveredAttack',
      level: 'B',
      note: 'Another motif',
    },
  });
  const secondMove = await save({
    reference: { ...sample.reference, ply: 2 },
    position,
  });
  assert.equal(secondMove.positions.length, 3);
  assert.equal(
    secondMove.positions.find((p) => p.id === saved.id).note,
    'Revised idea'
  );
  await save({ note: 'Updated game note' });
  assert.equal(result.data.games[0].positions.length, 3);
  // Different incoming branch orders remap to the stored source line.
  const branched = await save({
    source: { ...sample.source, lines: [...sample.source.lines, ['d4', 'd5']] },
  });
  const branchInput = {
    source: { ...sample.source, lines: [...sample.source.lines, ['c4', 'e5']] },
    reference: { ...sample.reference, branch: 1 },
    position,
  };
  const merged = await save(branchInput);
  const branchPosition = merged.positions.find((p) => p.reference.branch === 2);
  assert.ok(branchPosition);
  assert.deepEqual(merged.source.lines[branchPosition.reference.branch], [
    'c4',
    'e5',
  ]);
  const c4 = new chess.Chess(sample.source.fen);
  c4.move('c4');
  assert.equal(branchPosition.fen, c4.fen());
  const updatedBranch = await save({
    ...branchInput,
    source: merged.source,
    reference: { ...sample.reference, branch: 2 },
    position: { ...position, note: 'Branch edit' },
  });
  assert.equal(updatedBranch.positions.length, 4);
  assert.equal(
    updatedBranch.positions.find((p) => p.id === branchPosition.id).note,
    'Branch edit'
  );
  assert.deepEqual(updatedBranch.source.lines[1], branched.source.lines[1]);
  const beforeRemoval = result.data.games[0];
  const removedPosition = await call('DELETE', {
    id: first.id,
    positionId: saved.id,
    expectedUpdatedAt: beforeRemoval.updatedAt,
  });
  assert.equal(removedPosition.code, 200);
  result = removedPosition;
  assert.equal(result.data.games.length, 1);
  assert.equal(result.data.games[0].positions.length, 3);
  assert.equal(result.data.games[0].note, sample.note);
  assert.equal(
    (
      await call('DELETE', {
        id: first.id,
        positionId: branchPosition.id,
        expectedUpdatedAt: beforeRemoval.updatedAt,
      })
    ).code,
    400
  );
  env.NODE_ENV = 'production';
  assert.equal((await call('DELETE', { id: first.id })).code, 403);
  assert.equal((await call('POST', { ...sample, position })).code, 403);
  env.NODE_ENV = 'development';
  result = await call('DELETE', {
    id: first.id,
    expectedUpdatedAt: result.data.games[0].updatedAt,
  });
  assert.deepEqual(result.data.games, []);
});
