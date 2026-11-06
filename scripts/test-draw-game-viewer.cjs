const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const index = require('../src/lib/chess/draw-game-index.json');
const sources = require('../src/lib/server/draw-game-sources.json');
let chess, viewer;
test.before(async () => {
  chess = await import('chess.js');
  const code = ts.transpileModule(
    fs.readFileSync('src/lib/chess/draw-game-viewer.ts', 'utf8'),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        esModuleInterop: true,
      },
    }
  ).outputText;
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', code)(mod, mod.exports, (id) =>
    id === 'chess.js' ? chess : index
  );
  viewer = mod.exports;
});
test('all viewer branches replay legally and references land on the exercise position', async () => {
  const refModule = { exports: {} };
  const refCode = ts.transpileModule(
    fs.readFileSync('src/lib/chess/draw-game-reference.ts', 'utf8'),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        esModuleInterop: true,
      },
    }
  ).outputText;
  new Function('module', 'exports', 'require', refCode)(
    refModule,
    refModule.exports,
    () => index
  );
  const cache = {};
  for (const [id, source] of Object.entries(sources)) {
    cache[id] = source.lines.map((_, i) => viewer.gameFrames(source, i));
    for (const [i, frames] of cache[id].entries())
      assert.equal(frames.length, source.lines[i].length + 1);
  }
  for (const [fen, ref] of Object.entries(index)) {
    const frames = cache[ref.id][ref.branch];
    assert.equal(frames[ref.ply].fen.split(' ').slice(0, 4).join(' '), fen);
    assert.equal(refModule.exports.gameReference(fen).id, ref.id);
  }
  assert.equal(refModule.exports.gameReference('missing'), undefined);
});

test('illustrative Aronian–Praggnanandhaa position opens separately from its unchanged original game', () => {
  const exercises = require('../src/lib/server/fork-exercises.json');
  const games = require('../src/lib/server/fork-game-sources.json');
  const original = exercises.find(
    (e) => e.gameReference?.id === 'fae98a5b202d9fc8'
  );
  const source = games[original.gameReference.id];
  const before = structuredClone(source);
  const board = new chess.Chess(original.fen);
  let previousMove;
  for (const san of original.moves.slice(0, 8)) {
    previousMove = { fen: board.fen(), move: san };
    assert.ok(board.move(san));
  }
  const position = {
    fen: board.fen(),
    moves: ['Qb3+', 'Ka1', 'Qxc3+'],
    alternativeLines: [['Qb3+', 'Kc1', 'Qxc3+']],
    previousMove,
  };
  const reference = original.gameReference;
  const preview = viewer.exerciseGamePreview(source, reference, position);
  assert.ok(preview, 'the teaching continuation differs from the played frame');
  assert.equal(preview.source.kind, 'study');
  assert.equal(preview.markerPly, 1);
  for (const branch of [0, 1]) {
    const frames = viewer.gameFrames(preview.source, branch);
    assert.equal(frames[preview.markerPly].fen, position.fen);
    assert.equal(frames[preview.markerPly].label, '48. e4');
    assert.equal(frames[0].fen, previousMove.fen);
  }
  assert.notEqual(
    viewer.gameFrames(source, reference.branch)[reference.ply].fen,
    position.fen
  );
  assert.deepEqual(preview.source.headers, source.headers);
  assert.deepEqual(source, before);
});

test('matching game positions need no separate preview, including move-counter and harmless en-passant differences', () => {
  const source = {
    kind: 'game',
    headers: {},
    fen: new chess.Chess().fen(),
    lines: [['e4', 'e5']],
  };
  const reference = { branch: 0, ply: 1 };
  const fen = viewer.gameFrames(source, 0)[1].fen;
  assert.equal(
    viewer.exerciseGamePreview(source, reference, { fen, moves: [] }),
    null
  );
  const fields = fen.split(' ');
  fields[3] = '-';
  fields[4] = '15';
  fields[5] = '30';
  assert.equal(
    viewer.exerciseGamePreview(source, reference, {
      fen: fields.join(' '),
      moves: [],
    }),
    null
  );
  assert.equal(
    viewer.exerciseGamePreview(source, reference),
    null,
    'saved game bookmarks retain the original viewer'
  );
});

test('modified positions retain only a preceding move that actually reaches their board', () => {
  const source = {
    kind: 'game',
    headers: {},
    fen: new chess.Chess().fen(),
    lines: [['e4', 'e5']],
  };
  const board = new chess.Chess();
  board.move('d4');
  const position = {
    fen: board.fen(),
    moves: [],
    previousMove: { fen: source.fen, move: 'e4' },
  };
  const preview = viewer.exerciseGamePreview(
    source,
    { branch: 0, ply: 1 },
    position
  );
  assert.equal(preview.markerPly, 0);
  assert.equal(viewer.gameFrames(preview.source, 0)[0].fen, position.fen);
  assert.deepEqual(preview.source.lines, [[]]);
});

test('game playlists preserve the active exercise context and its exact source marker when deduplicating games', () => {
  const reference = {
    collection: 'fork',
    id: 'same-game',
    kind: 'game',
    branch: 0,
    ply: 87,
  };
  const active = {
    reference,
    position: { fen: new chess.Chess().fen(), moves: [] },
  };
  const list = viewer.referenceGameList(
    [
      { reference: { ...reference, ply: 10 } },
      { reference: { ...reference, id: 'other-game' } },
    ],
    active
  );
  assert.equal(list.length, 2);
  assert.equal(list[0], active);
  assert.equal(list[0].reference.ply, 87);
});
