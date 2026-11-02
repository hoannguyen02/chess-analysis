const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const exercises = require('../src/lib/server/simplification-exercises.json');
const sources = require('../src/lib/server/simplification-game-sources.json');
test('simplification: full-game FEN and completion only after the complete exchange', async () => {
  const chess = await import('chess.js');
  const { Chess } = chess;
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
  assert.ok(exercises.length);
  for (const e of exercises) {
    assert.equal(e.gameReference.collection, 'simplification');
    const source = sources[e.gameReference.id];
    const game = new Chess(source.fen);
    const frames = [game.fen()];
    for (const san of source.lines[0]) {
      assert.ok(game.move(san));
      frames.push(game.fen());
    }
    assert.equal(frames[e.gameReference.ply], e.fen);
    assert.equal(frames[e.gameReference.ply - 1], e.previousMove.fen);
    let played = [];
    while (played.length < e.moves.length) {
      const next = mod.exports.tryDrawMove(e, played, e.moves[played.length]);
      assert.equal(next.status, 'accepted');
      assert.equal(
        next.complete,
        next.played.length === e.moves.length,
        e.title
      );
      played = next.played;
    }
    const end = new Chess(e.fen);
    for (const san of played) assert.ok(end.move(san));
    assert.ok(
      end
        .board()
        .flat()
        .filter(Boolean)
        .every((p) => ['k', 'p'].includes(p.type))
    );
  }
});
