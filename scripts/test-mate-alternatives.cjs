const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

async function trainer() {
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
  return { ...mod.exports, ...chess };
}
const exercise = {
  fen: '8/8/8/7K/8/4r3/4r3/3k4 b - - 0 1',
  outcome: 'checkmate',
  goal: 'checkmate',
  moves: ['Rg2', 'Kh4', 'Rg8', 'Kh5', 'Rh3#'],
};

test('unrecorded preparation is proved and followed through actual mate', async () => {
  const { tryDrawMove, replayDrawExercise } = await trainer();
  const result = tryDrawMove(exercise, ['Rg2', 'Kh4'], 'Reg3');
  assert.equal(result.status, 'accepted');
  assert.equal(result.complete, false);
  assert.deepEqual(result.played, ['Rg2', 'Kh4', 'Reg3', 'Kh5']);
  assert.deepEqual(result.continuation, [...result.played, 'Rh3#']);
  const finished = tryDrawMove(
    { ...exercise, alternativeLines: [result.continuation] },
    result.played,
    'Rh3#'
  );
  assert.equal(finished.complete, true);
  assert.ok(replayDrawExercise(exercise, finished.played).in_checkmate());
});

test('a capturable rook does not pass by assuming cooperative defence', async () => {
  const { tryDrawMove } = await trainer();
  const result = tryDrawMove(exercise, ['Rg2', 'Kh4'], 'Rg4+');
  assert.equal(result.status, 'unrecorded');
  assert.equal(result.complete, false);
});

test('alternative must fit remaining solver moves; other objectives stay unchanged', async () => {
  const { tryDrawMove } = await trainer();
  const fen = '8/8/8/8/7K/4r3/6r1/3k4 b - - 2 2';
  assert.equal(
    tryDrawMove({ ...exercise, fen, moves: ['Rh3#'] }, [], 'Reg3').status,
    'unrecorded'
  );
  assert.equal(
    tryDrawMove(
      { ...exercise, outcome: 'skewer', goal: 'material' },
      ['Rg2', 'Kh4'],
      'Reg3'
    ).status,
    'unrecorded'
  );
});

test('white alternatives are verified too; stalemate is never mate', async () => {
  const { tryDrawMove } = await trainer();
  const white = {
    ...exercise,
    fen: '3K4/6R1/4R3/7k/8/8/8/8 w - - 0 1',
    moves: ['Rg1', 'Kh4', 'Rh6#'],
  };
  const result = tryDrawMove(white, [], 'Reg6');
  assert.equal(result.status, 'accepted');
  assert.equal(result.complete, false);
  const stalemate = {
    ...exercise,
    fen: '7k/5K2/6Q1/8/8/8/8/8 w - - 0 1',
    moves: ['Qg7#'],
  };
  assert.equal(tryDrawMove(stalemate, [], 'Qf5').status, 'unrecorded');
});

test('search timeout leaves the move unverified and history unchanged', async () => {
  const { tryDrawMove } = await trainer();
  const originalNow = Date.now;
  let ticks = 0;
  const played = ['Rg2', 'Kh4'];
  try {
    Date.now = () => (ticks += 200);
    const result = tryDrawMove(exercise, played, 'Reg3');
    assert.equal(result.status, 'unrecorded');
    assert.equal(result.complete, false);
    assert.deepEqual(result.played, ['Rg2', 'Kh4']);
  } finally {
    Date.now = originalNow;
  }
});
