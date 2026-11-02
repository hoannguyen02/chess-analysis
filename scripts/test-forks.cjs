const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const exercises = require('../src/lib/server/fork-exercises.json');
const sources = require('../src/lib/server/fork-game-sources.json');
test('forks: complete games, legal alternative replies and capture-before-completion', async () => {
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
  for (const level of ['A', 'B', 'C', 'C*', 'D']) {
    const games = exercises.filter((e) => e.difficulty.level === level);
    assert.ok(
      new Set(games.map((e) => e.gameReference.id)).size >= 20,
      `20 distinct games in ${level}`
    );
  }
  for (const e of exercises) {
    const ref = e.gameReference;
    assert.equal(ref.collection, 'fork');
    const source = sources[ref.id];
    const b = new Chess(source.fen);
    const fens = [b.fen()];
    for (const san of source.lines[0]) {
      assert.ok(b.move(san));
      fens.push(b.fen());
    }
    assert.equal(fens[ref.ply], e.fen);
    assert.equal(fens[ref.ply - 1], e.previousMove.fen);
    for (const line of [e.moves, ...e.alternativeLines]) {
      const game = new Chess(e.fen);
      for (const san of line) assert.ok(game.move(san));
      assert.ok(game.history({ verbose: true }).at(-1).captured);
      const before = line.slice(0, -1);
      assert.equal(
        mod.exports.tryDrawMove(e, before, line.at(-1)).complete,
        true
      );
      const prefix = line.slice(0, -3);
      assert.equal(
        mod.exports.tryDrawMove(e, prefix, line.at(-3)).complete,
        false
      );
    }
  }
});
