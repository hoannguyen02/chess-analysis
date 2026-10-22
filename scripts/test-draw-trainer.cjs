const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

function loadTS(filename, chess) {
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const loaded = { exports: {} };
  new Function('module', 'exports', 'require', compiled)(
    loaded,
    loaded.exports,
    (name) =>
      name === 'chess.js'
        ? chess
        : loadTS(path.resolve(path.dirname(filename), name + '.ts'), chess)
  );
  return loaded.exports;
}

async function setup() {
  const chess = await import('chess.js');
  return {
    ...chess,
    ...loadTS('src/lib/chess/draw-trainer.ts', chess),
    ...loadTS('src/lib/chess/draw-practice.ts', chess),
  };
}

test('every stored exercise can be completed locally with replies and full history', async () => {
  const {
    drawCategories,
    tryDrawMove,
    replayDrawExercise,
    drawPositionOutcome,
  } = await setup();
  for (const category of drawCategories) {
    for (const exercise of category.exercises) {
      let played = [],
        complete = false;
      if (!exercise.moves.length) {
        assert.equal(
          drawPositionOutcome(replayDrawExercise(exercise)),
          exercise.outcome
        );
        continue;
      }
      while (!complete) {
        const result = tryDrawMove(
          exercise,
          played,
          exercise.moves[played.length]
        );
        assert.equal(result.status, 'accepted', exercise.title);
        assert.ok(result.played.length > played.length, exercise.title);
        played = result.played;
        complete = result.complete;
      }
      if (exercise.outcome !== 'fortress') {
        assert.equal(
          drawPositionOutcome(replayDrawExercise(exercise, played)),
          exercise.outcome,
          exercise.title
        );
      }
    }
  }
});

test('illegal and unrecorded legal moves do not advance the puzzle', async () => {
  const { tryDrawMove } = await setup();
  // A focused engine fixture, independent of the published game collection.
  const exercise = {
    fen: 'R7/1kp5/2p5/R7/1K6/7p/6q1/8 w - - 0 1',
    moves: ['R5a7+', 'Kb6', 'Ra6+', 'Kb7', 'R6a7+'],
    outcome: 'repetition',
  };
  assert.equal(tryDrawMove(exercise, [], 'a5b6').status, 'illegal');
  const alternative = tryDrawMove(exercise, [], 'R8a7+');
  assert.equal(alternative.status, 'unrecorded');
  assert.deepEqual(alternative.played, []);
  const accepted = tryDrawMove(exercise, [], 'a5a7');
  assert.deepEqual(accepted.played, ['R5a7+', 'Kb6']);
  assert.equal(accepted.complete, false);
  assert.deepEqual(
    tryDrawMove(exercise, [], 'a5a7'),
    accepted,
    'restart has no stale history'
  );
});

test('promotion choice and alternative terminal draws are respected', async () => {
  const { tryDrawMove } = await setup();
  const exercise = {
    fen: '8/k1P5/8/8/8/8/8/K7 w - - 0 1',
    moves: ['c8=N'],
    outcome: 'material',
  };
  assert.equal(tryDrawMove(exercise, [], 'c7c8q').status, 'unrecorded');
  assert.equal(tryDrawMove(exercise, [], 'c7c8n').complete, true);
  assert.equal(
    tryDrawMove(exercise, [], { from: 'c7', to: 'c8', promotion: 'b' })
      .complete,
    true
  );
});

test('castling and en passant preserve chess semantics', async () => {
  const { tryDrawMove } = await setup();
  const castle = {
    fen: '4k3/8/8/8/8/8/8/4K2R w K - 0 1',
    moves: ['O-O'],
    outcome: 'fortress',
  };
  assert.deepEqual(tryDrawMove(castle, [], 'e1g1').played, ['O-O']);
  const ep = {
    fen: '7k/8/8/3pP3/8/8/8/K7 w - d6 0 2',
    moves: ['exd6'],
    outcome: 'fortress',
  };
  assert.deepEqual(tryDrawMove(ep, [], 'e5d6').played, ['exd6']);
});

test('preceding move is optional, validated, and not consumed as a solution move', async () => {
  const { Chess, previousDrawPosition, replayDrawExercise, tryDrawMove } =
    await setup();
  const before = '7k/3p4/8/4P3/8/8/8/K7 b - - 0 1';
  const game = new Chess(before);
  game.move('d5');
  const exercise = {
    fen: game.fen(),
    previousMove: { fen: before, move: 'd5' },
    moves: ['exd6'],
    outcome: 'fortress',
  };
  assert.equal(previousDrawPosition(exercise).move.san, 'd5');
  assert.equal(replayDrawExercise(exercise).history().length, 0);
  assert.equal(tryDrawMove(exercise, [], 'exd6').complete, true);
  assert.equal(previousDrawPosition({ fen: game.fen() }), null);
  assert.throws(() =>
    previousDrawPosition({
      ...exercise,
      previousMove: { fen: before, move: 'd6' },
    })
  );
});

test('real repetition positions reproduce the recorded drawn games exactly', async () => {
  const { Chess, drawCategories, previousDrawPosition } = await setup();
  const fixtures = JSON.parse(
    fs.readFileSync(
      'scripts/fixtures/draw-practice/real-repetition-games.json',
      'utf8'
    )
  );
  const exercises = drawCategories.find(
    (category) => category.id === 'repetition'
  ).exercises;
  assert.equal(exercises.length, fixtures.length);
  assert.ok(exercises.length >= 100);
  let previousGameLength = 0;
  for (const [index, exercise] of exercises.entries()) {
    const fixture = fixtures[index];
    assert.ok(fixture.startPly >= 10, 'repetition starts after move 5');
    const full = new Chess();
    assert.ok(full.load_pgn(fixture.pgn));
    assert.equal(full.header().Result, '1/2-1/2');
    const moves = full.history();
    assert.ok(moves.length >= previousGameLength, 'shortest games come first');
    previousGameLength = moves.length;
    assert.deepEqual(moves.slice(fixture.startPly), exercise.moves);
    const prefix = new Chess();
    for (const move of moves.slice(0, fixture.startPly))
      assert.ok(prefix.move(move));
    assert.equal(prefix.fen(), exercise.fen);
    const previous = prefix.undo();
    assert.deepEqual(exercise.previousMove, {
      fen: prefix.fen(),
      move: previous.san,
    });
    assert.ok(previousDrawPosition(exercise));
    const local = new Chess(exercise.fen);
    assert.equal(local.game_over(), false);
    assert.equal(local.in_check(), false);
    for (const [ply, move] of exercise.moves.entries()) {
      assert.ok(local.move(move));
      assert.equal(local.in_check(), false, exercise.title);
      if (ply < exercise.moves.length - 1)
        assert.equal(local.game_over(), false);
    }
    assert.equal(local.in_threefold_repetition(), true);
    assert.equal(local.fen(), full.fen());
  }
});

test('expanded game exercises retain the exact source position, preceding move and ending', async () => {
  const { Chess, drawCategories, previousDrawPosition } = await setup();
  const fixture = JSON.parse(
    fs.readFileSync(
      'scripts/fixtures/draw-practice/expanded-draw-sources.json',
      'utf8'
    )
  );
  for (const [category, records] of Object.entries(fixture.games)) {
    const exercises = drawCategories.find(
      (item) => item.id === category
    ).exercises;
    assert.equal(records.length, exercises.length);
    assert.ok(records.length >= 100);
    const uniqueGames = new Set();
    let previousGameLength = 0;
    for (const record of records) {
      const exercise = exercises.find((item) => item.fen === record.fen);
      assert.ok(exercise);
      const game = new Chess();
      assert.ok(game.load_pgn(record.pgn));
      assert.equal(game.header().Result, '1/2-1/2');
      const moves = game.history();
      assert.ok(
        moves.length >= previousGameLength,
        'shortest original games first'
      );
      previousGameLength = moves.length;
      const identity = JSON.stringify([
        record.headers.White,
        record.headers.Black,
        moves,
      ]);
      assert.ok(
        !uniqueGames.has(identity),
        'one exercise per source game in each category'
      );
      uniqueGames.add(identity);
      const prefix = new Chess();
      for (const move of moves.slice(0, record.startPly))
        assert.ok(prefix.move(move));
      assert.equal(prefix.fen(), exercise.fen);
      assert.deepEqual(
        moves.slice(record.startPly, record.endPly),
        exercise.moves
      );
      assert.ok(previousDrawPosition(exercise));
      const previous = prefix.undo();
      assert.deepEqual(exercise.previousMove, {
        fen: prefix.fen(),
        move: previous.san,
      });
      const line = new Chess(exercise.fen);
      for (const [ply, move] of exercise.moves.entries()) {
        assert.equal(
          line.game_over(),
          false,
          'no terminal position before completion'
        );
        assert.ok(line.move(move));
        if (category === 'perpetual-check' && ply % 2 === 0)
          assert.ok(line.in_check());
      }
      if (category !== 'fortress') assert.equal(line.fen(), game.fen());
      else {
        assert.equal(
          record.validation.positions.length,
          exercise.moves.length + 1
        );
        assert.ok(
          record.validation.positions.every((position) => position.wdl === 0)
        );
        assert.equal(line.fen(), record.validation.positions.at(-1).fen);
      }
    }
  }
});
