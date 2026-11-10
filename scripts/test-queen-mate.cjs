const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const categories = require('../src/lib/server/queen-mate-exercises.json');
const validation = require('./fixtures/queen-mate/validation.json');

test('queen-mate lessons: complete legal mates, both colors, and shared trainer completion', async () => {
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
  const exercises = categories[0].exercises.filter((e) => !e.gameReference);
  assert.equal(exercises.length, 44);
  const levels = [
    { exercises: exercises.filter((e) => e.beginner) },
    { exercises: exercises.filter((e) => e.difficulty?.level === 'A') },
    { exercises: exercises.filter((e) => e.difficulty?.level === 'B') },
  ];
  assert.ok(
    exercises.every(
      (e) => e.beginner || ['A', 'B'].includes(e.difficulty?.level)
    )
  );
  assert.ok(
    exercises.filter((e) => e.beginner).every((e) => e.moves.length === 1)
  );
  assert.ok(
    exercises
      .filter((e) => e.difficulty?.level === 'A')
      .every((e) => e.moves.length === 3)
  );
  assert.ok(
    exercises
      .filter((e) => e.difficulty?.level === 'B')
      .every((e) => [5, 7].includes(e.moves.length))
  );
  const seen = new Set();
  for (const category of levels) {
    assert.equal(
      category.exercises.length,
      category.exercises[0].beginner ? 24 : 10
    );
    const colors = new Set();
    for (const e of category.exercises) {
      assert.equal(e.goal, 'checkmate');
      assert.equal(e.outcome, 'checkmate');
      assert.equal(
        e.gameReference,
        undefined,
        'Composed positions must not claim a source game'
      );
      assert.ok(!seen.has(e.fen));
      seen.add(e.fen);
      const game = new Chess(e.fen);
      colors.add(game.turn());
      const pieces = game.board().flat().filter(Boolean);
      assert.ok(
        e.beginner ? [3, 4].includes(pieces.length) : pieces.length === 3
      );
      assert.equal(pieces.filter((p) => p.type === 'k').length, 2);
      assert.equal(
        pieces.filter((p) => p.type === 'q' && p.color === game.turn()).length,
        1
      );
      assert.ok(!game.game_over());
      const audit = validation.find((r) => r.fen === e.fen);
      assert.ok(audit);
      for (const line of [e.moves, ...(e.alternativeLines || [])]) {
        const board = new Chess(e.fen);
        for (const san of line) {
          assert.ok(!board.game_over());
          assert.ok(board.move(san), san);
          assert.equal(
            board.board().flat().filter(Boolean).length,
            pieces.length
          );
        }
        assert.ok(board.in_checkmate(), e.fen);
        assert.ok(Math.ceil(line.length / 2) <= audit.mateIn);
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
  assert.equal(seen.size, 44);
});

test('master-game lessons retain complete replay, source marker, and actual mating payoff', async () => {
  const { Chess } = await import('chess.js');
  const sources = require('../src/lib/server/queen-mate-game-sources.json');
  const real = categories[0].exercises.filter((e) => e.gameReference);
  assert.ok(real.length >= 80);
  for (const e of real) {
    assert.equal(e.gameReference.collection, 'queen-mate');
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

test('Beginner support is essential, diverse, and exhaustively reviewed', async () => {
  const { Chess } = await import('chess.js');
  const review = require('./fixtures/queen-mate/beginner-reviewed.json');
  const beginners = categories[0].exercises.filter((e) => e.beginner);
  assert.deepEqual(
    beginners,
    review.records.map((r) => r.exercise)
  );
  const counts = {},
    colors = {};
  for (const r of review.records) {
    counts[r.piece] = (counts[r.piece] || 0) + 1;
    const start = new Chess(r.exercise.fen);
    (colors[r.piece] ||= new Set()).add(start.turn());
    const audit = validation.find((a) => a.id === r.id);
    assert.ok(audit);
    assert.deepEqual(
      audit.startingMoves.map((m) => m.move).sort(),
      start.moves().sort()
    );
    const mates = [];
    for (const move of start.moves({ verbose: true })) {
      const end = new Chess(r.exercise.fen);
      end.move(move.san);
      const row = audit.startingMoves.find((m) => m.move === move.san);
      assert.equal(row.checkmate, end.in_checkmate());
      assert.deepEqual(row.legalReplies.slice().sort(), end.moves().sort());
      if (!end.in_checkmate()) continue;
      mates.push(move.san);
      assert.equal(move.piece, 'q');
      assert.equal(move.captured, undefined);
      if (r.piece !== 'K') {
        end.remove(r.support);
        assert.equal(
          end.in_checkmate(),
          false,
          `${r.id}: support must matter for ${move.san}`
        );
        assert.ok(end.moves().length);
        assert.deepEqual(
          row.withoutSupportReplies.slice().sort(),
          end.moves().sort()
        );
      }
    }
    assert.deepEqual(mates.sort(), audit.matingMoves.slice().sort());
    assert.ok(mates.includes(r.exercise.moves[0]));
  }
  assert.deepEqual(counts, { K: 8, R: 4, B: 4, N: 4, P: 4 });
  for (const sides of Object.values(colors)) assert.equal(sides.size, 2);
  assert.ok(
    review.records.some((r) => r.piece !== 'K' && r.role === 'escape-control')
  );
  assert.ok(
    review.replaced.every((r) => !beginners.some((e) => e.fen === r.fen))
  );
});
