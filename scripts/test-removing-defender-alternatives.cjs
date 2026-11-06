const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

async function loadTrainer() {
  const chess = await import('chess.js');
  function load(path, resolve) {
    const mod = { exports: {} };
    const source = ts.transpileModule(fs.readFileSync(path, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText;
    new Function('module', 'exports', 'require', source)(
      mod,
      mod.exports,
      resolve
    );
    return mod.exports;
  }
  const verifier = load(
    'src/lib/chess/removing-defender-alternatives.ts',
    () => chess
  );
  return load('src/lib/chess/draw-trainer.ts', (id) =>
    id === './removing-defender-alternatives' ? verifier : chess
  );
}
const example = {
  fen: '8/K7/8/8/4k3/3b4/1R2B3/1r6 w - - 0 1',
  outcome: 'removing-defender',
  goal: 'material',
  removingDefender: { target: 'b1', minimumGain: 5 },
  moves: ['Rxb1', 'Bxb1'],
};

test('previous position accepts an unavailable en passant square but preserves a legal one', async () => {
  const { previousDrawPosition } = await loadTrainer();
  const exercise = require('../src/lib/server/removing-defender-exercises.json')
    .find((item) => item.id === 'removing-defender-b-boulrens-amdouni-2026');
  assert.equal(previousDrawPosition(exercise).move.san, 'g5');
  const previousMove = { fen: '4k3/3p4/8/4P3/8/8/8/4K3 b - - 0 1', move: 'd5' };
  assert.throws(() => previousDrawPosition({
    fen: '4k3/8/8/3pP3/8/8/8/4K3 w - - 0 2', previousMove,
  }), /does not reach/);
  assert.equal(previousDrawPosition({
    fen: '4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 2', previousMove,
  }).move.san, 'd5');
});

test('proves an unsaved defender capture against all replies and follows through', async () => {
  const { tryDrawMove, replayDrawExercise } = await loadTrainer();
  const result = tryDrawMove(example, [], 'Bxd3+');
  assert.equal(result.status, 'accepted');
  assert.equal(result.complete, false);
  assert.equal(result.continuation.length, 4);
  const followup = result.continuation[2];
  const final = tryDrawMove(
    { ...example, alternativeLines: [result.continuation] },
    result.played,
    followup
  );
  assert.equal(final.complete, true);
  const board = replayDrawExercise(example, final.played);
  assert.ok(
    board
      .board()
      .flat()
      .every((p) => !p || p.color === 'w' || p.type === 'k')
  );
});

test('the same bounded proof works for Black', async () => {
  const { tryDrawMove } = await loadTrainer();
  const black = {
    ...example,
    fen: '1R6/1r2b3/3B4/4K3/8/8/k7/8 b - - 0 1',
    removingDefender: { target: 'b8', minimumGain: 5 },
    moves: ['Rxb8', 'Bxb8'],
  };
  assert.equal(tryDrawMove(black, [], 'Bxd6+').status, 'accepted');
});

test('other objectives, a false defender, defensive refutations and budget exhaustion are unverified', async () => {
  const { tryDrawMove } = await loadTrainer();
  assert.equal(
    tryDrawMove({ ...example, goal: 'draw' }, [], 'Bxd3+').status,
    'unrecorded'
  );
  assert.equal(
    tryDrawMove(
      { ...example, removingDefender: { target: 'b1', minimumGain: 9 } },
      [],
      'Bxd3+'
    ).status,
    'unrecorded'
  );
  assert.equal(
    tryDrawMove(
      { ...example, fen: '3r4/K7/8/8/4k3/3b4/1R2B3/1r6 w - - 0 1' },
      [],
      'Bxd3+'
    ).status,
    'unrecorded'
  );
  const now = Date.now;
  let time = 0;
  Date.now = () => (time += 200);
  try {
    assert.equal(tryDrawMove(example, [], 'Bxd3+').status, 'unrecorded');
  } finally {
    Date.now = now;
  }
});
