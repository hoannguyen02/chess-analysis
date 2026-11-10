const assert = require('node:assert/strict');
const test = require('node:test');
const { catalogLoader } = require('./render-tactic-batch.cjs');
const { activePositionIndex } = require('./practice-position-index.cjs');

test('cross-topic FEN identity ignores clocks and keeps only legal en passant', async () => {
  const { practicePositionKey: key } = catalogLoader(process.cwd(), await import('chess.js'))(
    'src/lib/chess/practice-position-key.ts'
  );
  const legal = '4k3/8/8/3pP3/8/8/8/4K3 w -';
  const pinned = 'k3r3/8/8/3pP3/8/8/8/4K3 w -';
  assert.equal(key(`${legal} d6 0 4`), key(`${legal} d6 21 42`));
  assert.notEqual(key(`${legal} d6 0 4`), key(`${legal} - 0 4`));
  assert.equal(key(`${pinned} d6 0 4`), key(`${pinned} - 0 4`));
  const castle = 'r3k2r/8/8/8/8/8/8/R3K2R';
  assert.notEqual(key(`${castle} w KQkq - 0 1`), key(`${castle} w - - 0 1`));
  assert.notEqual(key(`${castle} w KQkq - 0 1`), key(`${castle} b KQkq - 0 1`));
});

test('the shared index reads active mate-in-one and specialist catalogs', async () => {
  const index = await activePositionIndex(process.cwd());
  const rows = Object.values(index).flat();
  assert.ok(rows.some((row) => row.scope === '/tactic-positions?theme=mateIn1'));
  assert.ok(rows.some((row) => row.scope === '/two-rook-mate'));
  assert.ok(rows.some((row) => row.scope === '/one-rook-mate'));
});

test('manual save checks other topics and reports the matching topic title', async () => {
  const load = catalogLoader(process.cwd(), await import('chess.js'));
  const { otherPracticeTopics } = load('src/lib/chess/practice-position-conflicts.ts');
  const fen = '7k/8/6K1/8/8/8/8/R7 w - - 0 1';
  const request = global.fetch;
  const called = [];
  global.fetch = async (url) => {
    called.push(url);
    return { ok: true, json: async () => url === '/api/private-pages' ? {
      pages: [
        { href: '/mine', title: 'Mine', worksheetEndpoint: '/api/mine' },
        { href: '/other', title: 'Other', worksheetEndpoint: '/api/other' },
      ],
    } : { categories: [{ exercises: [{ fen: fen.replace('0 1', '4 20') }] }] } };
  };
  try {
    assert.deepEqual(await otherPracticeTopics(fen, '/mine'), ['Other']);
    assert.deepEqual(called, ['/api/private-pages', '/api/other']);
  } finally {
    global.fetch = request;
  }
});
