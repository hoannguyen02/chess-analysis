const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const ts = require('typescript');
let chess;
let store;
test.before(async () => {
  chess = await import('chess.js');
  store = load(
    'src/lib/server/saved-games-store.ts',
    { './saved-games.json': [], 'chess.js': chess },
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
  const { winningPlayer } = load('src/lib/chess/saved-games.ts');
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
  allowed = true;
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
  env.NODE_ENV = 'production';
  assert.equal((await call('DELETE', { id: first.id })).code, 403);
  env.NODE_ENV = 'development';
  result = await call('DELETE', {
    id: first.id,
    expectedUpdatedAt: result.data.games[0].updatedAt,
  });
  assert.deepEqual(result.data.games, []);
});
