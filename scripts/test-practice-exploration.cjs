const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
async function runtime() {
  const chess = await import('chess.js');
  const mod = { exports: {} };
  new Function(
    'module',
    'exports',
    'require',
    ts.transpileModule(
      fs.readFileSync('src/lib/chess/practice-exploration.ts', 'utf8'),
      { compilerOptions: { module: ts.ModuleKind.CommonJS } }
    ).outputText
  )(mod, mod.exports, () => chess);
  return { ...chess, ...mod.exports };
}
test('revisit the opponent decision without modifying the saved exercise', async () => {
  const { explorationStartPly, explorationPosition, exploreMove } =
    await runtime();
  const e = require('../src/lib/chess/skewer-exercises.json').find((e) =>
    e.title.includes('Djurhuus')
  );
  const seen = Object.freeze(e.moves.slice(0, 2));
  assert.equal(explorationStartPly(seen, false), 1);
  assert.equal(explorationStartPly(seen, true), 2);
  assert.equal(explorationStartPly([], false), 0);
  assert.equal(explorationStartPly(e.moves, false), 5);
  const start = explorationPosition(e.fen, seen, 1);
  assert.equal(start.turn(), 'w');
  const alternative = exploreMove(e.fen, seen, 1, { from: 'f1', to: 'g2' });
  assert.deepEqual(alternative, ['Rd1+', 'Kg2']);
  assert.deepEqual(seen, ['Rd1+', 'Ke2']);
  assert.equal(explorationPosition(e.fen, seen, 2).get('e2').type, 'k');
  assert.equal(explorationPosition(e.fen, alternative, 2).get('g2').type, 'k');
  assert.equal(exploreMove(e.fen, seen, 1, { from: 'f1', to: 'f4' }), null);
});
test('retains repetition history and supports castling, en passant, and underpromotion', async () => {
  const { Chess, explorationPosition, exploreMove } = await runtime();
  const initial = new Chess().fen();
  const cycle = ['Nf3', 'Nf6', 'Ng1', 'Ng8', 'Nf3', 'Nf6', 'Ng1', 'Ng8'];
  assert.equal(
    explorationPosition(initial, cycle, 8).in_threefold_repetition(),
    true
  );
  assert.equal(
    explorationPosition(initial, cycle, 4).in_threefold_repetition(),
    false
  );
  assert.deepEqual(
    exploreMove('4k3/8/8/8/8/8/8/4K2R w K - 0 1', [], 0, {
      from: 'e1',
      to: 'g1',
    }),
    ['O-O']
  );
  assert.deepEqual(
    exploreMove('7k/8/8/3pP3/8/8/8/K7 w - d6 0 2', [], 0, {
      from: 'e5',
      to: 'd6',
    }),
    ['exd6']
  );
  assert.deepEqual(
    exploreMove('8/k1P5/8/8/8/8/8/K7 w - - 0 1', [], 0, {
      from: 'c7',
      to: 'c8',
      promotion: 'n',
    }),
    ['c8=N+']
  );
  assert.throws(() => explorationPosition(initial, [], -1));
  assert.throws(() => explorationPosition(initial, [], 1));
});
test('terminal positions cannot accept moves', async () => {
  const { exploreMove } = await runtime();
  assert.equal(
    exploreMove('7k/6Q1/6K1/8/8/8/8/8 b - - 0 1', [], 0, {
      from: 'h8',
      to: 'h7',
    }),
    null
  );
  assert.equal(
    exploreMove('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1', [], 0, {
      from: 'h8',
      to: 'h7',
    }),
    null
  );
});
