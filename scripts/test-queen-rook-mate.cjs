const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const categories = require('../src/lib/server/queen-rook-mate-exercises.json');
test('queen-rook lessons reach mate through shared practice; introductions cover both colors', async () => {
  const chess = await import('chess.js');
  const mod = { exports: {} };
  new Function(
    'module',
    'exports',
    'require',
    ts.transpileModule(
      fs.readFileSync('src/lib/chess/draw-trainer.ts', 'utf8'),
      { compilerOptions: { module: ts.ModuleKind.CommonJS } }
    ).outputText
  )(mod, mod.exports, () => chess);
  const intro = categories[0].exercises.filter((e) => e.beginner);
  assert.equal(intro.length, 20);
  const distribution = new Map();
  for (const e of categories[0].exercises) {
    const board = new chess.Chess(e.fen);
    assert.equal(e.goal, 'checkmate');
    assert.ok(!board.game_over());
    if (e.beginner) {
      assert.equal(e.moves.length, 1);
      assert.ok(board.board().flat().filter(Boolean).length <= 6);
      assert.equal(board.board().flat().filter(Boolean).length, 4);
      const key = board.turn();
      distribution.set(key, (distribution.get(key) || 0) + 1);
    }
    let played = [];
    while (played.length < e.moves.length) {
      const result = mod.exports.tryDrawMove(e, played, e.moves[played.length]);
      assert.equal(result.status, 'accepted');
      assert.ok(result.played.length > played.length);
      played = result.played;
      assert.equal(
        result.complete,
        mod.exports.replayDrawExercise(e, played).in_checkmate()
      );
    }
    for (const move of played) assert.ok(board.move(move));
    assert.ok(board.in_checkmate());
  }
  assert.deepEqual(Object.fromEntries([...distribution].sort()), {
    b: 10,
    w: 10,
  });
});
