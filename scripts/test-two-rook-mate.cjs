const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const categories = require('../src/lib/server/two-rook-mate-exercises.json');
const validation = require('./fixtures/two-rook-mate/validation.json');

test('two-rook lessons: complete legal mates, both colors, and shared trainer completion', async () => {
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
  assert.equal(categories.length, 1);
  const exercises = categories[0].exercises.filter((e) =>
    ['A', 'B'].includes(e.difficulty?.level)
  );
  assert.ok(categories[0].exercises.every((e) => !e.beginner));
  const levels = [
    { exercises: exercises.filter((e) => e.difficulty?.level === 'A') },
    { exercises: exercises.filter((e) => e.difficulty?.level === 'B') },
  ];
  assert.ok(
    exercises
      .filter((e) => e.difficulty?.level === 'A')
      .every((e) => [1, 3].includes(e.moves.length))
  );
  assert.ok(
    exercises
      .filter((e) => e.difficulty?.level === 'B')
      .every((e) => e.gameReference ? e.moves.length === 5 : [5, 7].includes(e.moves.length))
  );
  const seen = new Set();
  for (const category of levels) {
    assert.ok(category.exercises.length > 0);
    const colors = new Set();
    for (const e of category.exercises) {
      assert.equal(e.goal, 'checkmate');
      assert.equal(e.outcome, 'checkmate');
      assert.ok(!seen.has(e.fen));
      seen.add(e.fen);
      const game = new Chess(e.fen);
      colors.add(game.turn());
      const pieces = game.board().flat().filter(Boolean);
      assert.equal(pieces.filter((p) => p.type === 'k').length, 2);
      assert.equal(
        pieces.filter((p) => p.type === 'r' && p.color === game.turn()).length,
        2
      );
      assert.ok(!game.game_over());
      const audit = !e.gameReference && validation.find((r) => r.fen === e.fen);
      if (!e.gameReference) {
        assert.equal(pieces.length, 4);
        assert.ok(audit);
      }
      for (const line of [e.moves, ...(e.alternativeLines || [])]) {
        const board = new Chess(e.fen);
        for (const san of line) {
          assert.ok(!board.game_over());
          assert.ok(board.move(san), san);
        }
        assert.ok(board.in_checkmate(), e.fen);
        assert.ok(Math.ceil(line.length / 2) <= (audit ? audit.mateIn : e.difficulty.solverMoves));
      }
      let played = [];
      while (played.length < e.moves.length) {
        const result = mod.exports.tryDrawMove(
          e,
          played,
          e.moves[played.length]
        );
        assert.equal(result.status, 'accepted');
        played = result.played;
        const board = mod.exports.replayDrawExercise(e, played);
        assert.equal(result.complete, board.in_checkmate());
      }
      // Any immediate mate is accepted, including moves absent from saved lines.
      const start = new Chess(e.fen);
      for (const move of start.moves()) {
        const board = new Chess(e.fen);
        board.move(move);
        if (board.in_checkmate()) {
          const result = mod.exports.tryDrawMove(e, [], move);
          assert.equal(result.status, 'accepted');
          assert.equal(result.complete, true);
        }
      }
    }
    assert.equal(colors.size, 2);
  }
  assert.equal(seen.size, exercises.length);
});

test('master-game lessons retain complete replay, source marker, and actual mating payoff', async () => {
  const { Chess } = await import('chess.js');
  const sources = require('../src/lib/server/two-rook-mate-game-sources.json');
  const real = categories[0].exercises.filter((e) => e.gameReference);
  assert.ok(real.length >= 70);
  for (const e of real) {
    assert.equal(e.gameReference.collection, 'two-rook-mate');
    assert.equal(e.goal, 'checkmate');
    const source = sources[e.gameReference.id];
    const game = new Chess(source.fen);
    const frames = [game.fen()];
    for (const san of source.lines[0]) {
      assert.ok(game.move(san));
      frames.push(game.fen());
    }
    assert.equal(frames[e.gameReference.ply], e.fen);
    assert.equal(frames[e.gameReference.ply - 1], e.previousMove.fen);
    const board = new Chess(e.fen);
    for (const san of e.moves) {
      assert.ok(!board.game_over());
      assert.ok(board.move(san));
    }
    assert.ok(board.in_checkmate());
  }
});
