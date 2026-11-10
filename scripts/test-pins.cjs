const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const exercises = require('../src/lib/server/pin-exercises.json');
const sources = require('../src/lib/server/pin-game-sources.json');
const isReviewedComposition = (exercise) => exercise.id?.startsWith('pin-composed-');
const isLegacyBeginnerRecognition = (exercise) =>
  exercise.beginner && !exercise.gameReference && !exercise.pinSetup &&
  !exercise.pinCreation && !isReviewedComposition(exercise);
function aligned(a, f, b) {
  const xy = (s) => [s.charCodeAt(0) - 97, +s[1] - 1];
  const [x, y, z] = [a, f, b].map(xy);
  const dx = z[0] - x[0],
    dy = z[1] - x[1];
  const dot = (y[0] - x[0]) * dx + (y[1] - x[1]) * dy;
  return (
    (y[0] - x[0]) * dy === (y[1] - x[1]) * dx &&
    dot > 0 &&
    dot < dx * dx + dy * dy
  );
}
test('pin practice: forced beginner captures and exact master-game references', async () => {
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
  assert.equal(new Set(exercises.map((e) => e.fen)).size, exercises.length);
  const counts = {};
  for (const level of ['A', 'B', 'C', 'C*', 'D']) {
    const games = exercises.filter(
      (e) => e.gameReference && e.difficulty?.level === level
    );
    assert.ok(
      new Set(games.map((e) => e.gameReference.id)).size >= 20,
      `20 distinct real games in ${level}`
    );
  }
  for (const e of exercises) {
    assert.equal(e.outcome, 'pin');
    if (e.pinCreation) {
      assert.equal(mod.exports.tryDrawMove(e, [], e.moves[0]).complete, false,
        'creating the pin alone must not complete a material-gain exercise');
    }
    for (const line of [e.moves, ...e.alternativeLines]) {
      const b = new Chess(e.fen);
      if (e.beginner) assert.equal(b.in_check(), false);
      for (const san of line) assert.ok(b.move(san));
      assert.equal(
        mod.exports.tryDrawMove(e, line.slice(0, -1), line.at(-1)).complete,
        true
      );
      if (isLegacyBeginnerRecognition(e)) {
        assert.equal(line.length, 3);
        assert.equal(
          mod.exports.tryDrawMove(e, [], line[0]).complete,
          false,
          'creating a pin must not complete the exercise'
        );
        const finish = new Chess(e.fen);
        const value = (game) =>
          game
            .board()
            .flat()
            .filter(Boolean)
            .reduce(
              (sum, p) =>
                sum +
                (p.color === 'w' ? 1 : -1) *
                  { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 }[p.type],
              0
            );
        const baseline = value(finish);
        for (const san of line) finish.move(san);
        assert.ok(value(finish) - baseline >= 100);
        for (const reply of finish.moves()) {
          finish.move(reply);
          assert.ok(
            value(finish) - baseline >= 100,
            'no immediate material recovery'
          );
          assert.equal(finish.in_checkmate(), false);
          finish.undo();
        }
        // Geometry is checked immediately after the pin, before the capture.
        b.reset();
        b.load(e.fen);
        b.move(line[0]);
        const move = b.history({ verbose: true })[0];
        const pieces = b.board().flat().filter(Boolean);
        const knight = pieces.find((p) => p.type === 'n');
        const back = pieces.find(
          (p) =>
            p.color === 'b' &&
            p.type === (e.beginnerKind === 'king' ? 'k' : 'q')
        );
        assert.ok(aligned(move.to, knight.square, back.square));
        assert.equal(b.in_check(), false);
        assert.equal(
          b.moves({ verbose: true }).some((m) => m.to === move.to),
          false,
          'attacker not immediately capturable'
        );
        if (e.beginnerKind === 'king')
          assert.equal(
            b.moves({ verbose: true }).some((m) => m.from === knight.square),
            false
          );
      }
    }
    if (isLegacyBeginnerRecognition(e)) {
      assert.equal(e.gameReference, undefined);
      const b = new Chess(e.fen);
      const move = b.move(e.moves[0]);
      const lines = [e.moves, ...e.alternativeLines];
      for (const root of new Set(lines.map((line) => line[0]))) {
        const pinned = new Chess(e.fen);
        pinned.move(root);
        assert.deepEqual(
          new Set(
            lines.filter((line) => line[0] === root).map((line) => line[1])
          ),
          new Set(pinned.moves()),
          'every legal defence has a saved winning capture'
        );
      }
      const key = e.beginnerKind + move.piece;
      counts[key] = (counts[key] || 0) + 1;
    } else if (e.gameReference) {
      const ref = e.gameReference;
      assert.equal(ref.collection, 'pin');
      const s = sources[ref.id];
      assert.ok(s);
      const b = new Chess(s.fen);
      const fens = [b.fen()];
      for (const san of s.lines[0]) {
        assert.ok(b.move(san));
        fens.push(b.fen());
      }
      assert.equal(fens[ref.ply], e.fen);
      assert.equal(fens[ref.ply - 1], e.previousMove.fen);
    }
  }
  assert.deepEqual(new Set(Object.keys(counts)), new Set(['kingr', 'kingq']));
  const audit = require('./fixtures/pin/beginner-audit.json');
  assert.equal(audit.length, 60);
  assert.equal(
    audit.filter((r) => r.accepted).length,
      exercises.filter(isLegacyBeginnerRecognition).length
  );
  for (const rejected of audit.filter((r) => !r.accepted)) {
    assert.ok(!exercises.some((e) => e.fen === rejected.fen));
  }
  // The three reported positions were original king-pin exercises 1, 2 and 8.
  for (const index of [0, 1, 7]) assert.equal(audit[index].accepted, false);
  assert.ok(exercises.some((e) => e.gameReference));
});

test('beginner pin variety, explicit objectives and durable exclusions', () => {
  const beginners = exercises.filter((e) => e.beginner && !e.gameReference && !isReviewedComposition(e));
  assert.equal(beginners.length, 24);
  const records = require('./fixtures/pin/beginner-reviewed.json');
  assert.equal(records.length, 29);
  assert.deepEqual(
    new Set(records.map((r) => r.exercise.beginnerKind)),
    new Set(['king', 'queen', 'rook'])
  );
  assert.ok(beginners.some((e) => e.fen.split(' ')[1] === 'b'));
  for (const e of beginners) {
    assert.equal(e.goal, 'material');
    assert.equal(e.source, 'original-composition');
  }
  for (const e of require('./fixtures/pin/beginner-excluded.json')) {
    assert.ok(!beginners.some((b) => b.fen === e.fen));
  }
});

 test('beginner editorial review publishes only retained positions', () => {
  const review = require('./fixtures/pin/beginner-quality-review.json').records;
  const beginners = exercises.filter((e) => e.source === 'original-composition' && !isReviewedComposition(e));
  assert.equal(review.length, 52);
  assert.equal(review.filter((r) => r.decision === 'exclude').length, 11);
  assert.deepEqual(new Set(beginners.map((e) => e.fen)),
    new Set(review.filter((r) => r.decision === 'retain').map((r) => r.fen)));
  for (const e of beginners) {
    const record = review.find((r) => r.fen === e.fen);
    assert.deepEqual(e.moves, record.moves);
    assert.ok(record.reason && record.engine.probes.length);
  }
});

for (const id of ['pin-beginner-20261027-10', 'pin-beginner-20261027-11']) {
test(`user-selected queen sacrifice ${id} is published only in C`, () => {
  const record = require('./fixtures/pin/beginner-reviewed.json').find((r) => r.id === id);
  const matches = exercises.filter((e) => e.fen === record.exercise.fen);
  assert.equal(matches.length, 1);
  const exercise = matches[0];
  assert.equal(exercise.beginner, undefined);
  assert.equal(exercise.difficulty.level, 'C');
  assert.equal(exercise.source, 'original-composition');
  assert.equal(exercise.gameReference, undefined);
  for (const field of ['moves', 'alternativeLines', 'goal', 'solution', 'hints']) {
    assert.deepEqual(exercise[field], record.exercise[field]);
  }
});

}

test('requested screenshot positions are published once in A', () => {
  const rows = require('./fixtures/pin/user-level-a-20261027.json').records;
  assert.equal(rows.length, 15);
  for (const row of rows) {
    const matches = exercises.filter((e) => e.fen === row.fen);
    assert.equal(matches.length, 1);
    assert.equal(matches[0].beginner, undefined);
    assert.equal(matches[0].difficulty.level, 'A');
    assert.deepEqual(matches[0].moves, row.moves);
  }
});

test('new Beginner pin creation stays connected to the shared trainer', async () => {
  const { Chess } = await import('chess.js');
  const records = require('./fixtures/pin/beginner-creation.json');
  assert.equal(records.length, 17);
  for (const { exercise: e } of records) {
    const b = new Chess(e.fen);
    assert.ok(!b.moves({verbose:true}).some((m) => m.captured));
    const move = b.move(e.moves[0]);
    assert.equal(move.captured, undefined);
    assert.equal(b.in_check(), false);
    assert.ok(aligned(move.to, e.pinCreation.front, e.pinCreation.back));
    const lines = [e.moves, ...e.alternativeLines];
    assert.deepEqual(new Set(lines.map((l) => l[1])), new Set(b.moves()));
    assert.ok(lines.every((l) => l.length === 3));
    assert.ok(exercises.some((x) => x.fen === e.fen && x.beginner));
  }
});
