const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const exercises = require('../src/lib/server/queen-skewer-pilot.json');
const pilot = require('./fixtures/skewer/queen-pilot.json');
const altAudit = require('./fixtures/skewer/queen-pilot-web-alternatives.json');
function load(path, resolve) {
  const mod = { exports: {} };
  new Function(
    'module',
    'exports',
    'require',
    ts.transpileModule(fs.readFileSync(path, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        esModuleInterop: true,
      },
    }).outputText
  )(mod, mod.exports, resolve);
  return mod.exports;
}

test('private endpoint puts 10 compositions before the six preserved pilot exercises', async () => {
  const handler = load('src/pages/api/skewer-exercises.ts', (name) => {
    if (name.endsWith('private-hub'))
      return { privateHubPath: () => '/test-hub' };
    if (name.endsWith('practice-access'))
      return { requirePracticeAccess: () => true };
    if (name.endsWith('practice-game-caption'))
      return {
        practiceGameCaption: () => undefined,
        practicePlayerTitle: () => undefined,
        practicePlayers: () => undefined,
      };
    return require('../src/' + name.slice(2));
  }).default;
  let payload;
  await handler(
    { method: 'GET' },
    {
      status(code) {
        assert.equal(code, 200);
        return this;
      },
      json(data) {
        payload = data;
      },
    }
  );
  const all = payload.categories[0].exercises;
  const queens = all.filter((e) => e.beginnerKind === 'queen');
  assert.equal(queens.length, 16);
  assert.deepEqual(queens.slice(10).map((e) => e.fen), exercises.map((e) => e.fen));
  assert.ok(queens.slice(0, 10).every((e) => e.source === 'original-composition' && !e.gameReference));
  assert.deepEqual(queens.map((e) => e.title), Array.from({ length: 16 }, (_, i) => `Xiên Hậu · ${i + 1}`));
  assert.equal(all.filter((e) => e.beginner && !e.beginnerKind).length, 57);
  assert.equal(all.filter((e) => !e.beginner).length, 246);
  assert.equal(all.filter((e) => e.decision).length, 1);
  for (const e of all) {
    assert.equal(e.rootChecks, undefined);
    assert.equal(e.continuationChecks, undefined);
    assert.equal(e.rootCandidates, undefined);
    assert.equal(e.engine, undefined);
  }
});

test('shared trainer completes every pilot solution and the near-best Bxd6 alternative', async () => {
  const chess = await import('chess.js');
  const trainer = load('src/lib/chess/draw-trainer.ts', () => chess);
  for (const [i, e] of exercises.entries()) {
    assert.equal(e.fen, pilot.exercises[i].fen);
    assert.deepEqual(e.moves, pilot.exercises[i].line);
    assert.deepEqual(e.gameReference, pilot.exercises[i].gameReference);
    if (e.decision) continue;
    for (const line of [e.moves, ...e.alternativeLines]) {
      let played = [];
      let result;
      while (played.length < line.length) {
        result = trainer.tryDrawMove(e, played, line[played.length]);
        assert.equal(result.status, 'accepted');
        assert.ok(result.played.length > played.length);
        played = result.played;
      }
      assert.equal(result.complete, true);
      assert.deepEqual(played, line);
    }
  }
  const alternate = exercises[3].alternativeLines[0];
  assert.equal(alternate[0], 'Bxd6');
  assert.deepEqual(alternate, altAudit[0].line);
  const b = new chess.Chess(exercises[3].fen);
  b.move(alternate[0]);
  for (let i = 1; i < alternate.length; i++) {
    assert.equal(b.fen(), altAudit[0].checks[i - 1].fen);
    assert.equal(alternate[i], altAudit[0].checks[i - 1].candidates[0].move);
    b.move(alternate[i]);
  }
});

test('failed skewer is a decision, never a winning move-sequence exercise', async () => {
  const chess = await import('chess.js');
  const trainer = load('src/lib/chess/draw-trainer.ts', () => chess);
  const e = exercises[5];
  assert.equal(trainer.evaluateDrawDecision(e, 'works'), false);
  assert.equal(trainer.evaluateDrawDecision(e, 'fails'), true);
  assert.equal(trainer.evaluateDrawDecision(e, 'invalid'), null);
  assert.equal(trainer.evaluateDrawDecision(exercises[0], 'fails'), null);
  assert.deepEqual(trainer.tryDrawMove(e, [], 'Ba3'), {
    status: 'unrecorded',
    played: [],
    complete: false,
  });
  assert.equal(
    trainer.replayDrawExercise(e, e.moves).fen(),
    pilot.exercises[5].finalFen
  );
});

test('all 10 composed lessons complete through the shared trainer', async () => {
  const chess = await import('chess.js');
  const trainer = load('src/lib/chess/draw-trainer.ts', () => chess);
  const intro = require('../src/lib/server/queen-skewer-intro.json');
  for (const exercise of intro) {
    if (exercise.decision) {
      assert.equal(trainer.evaluateDrawDecision(exercise, 'gain'), true);
      assert.equal(trainer.evaluateDrawDecision(exercise, 'no-gain'), false);
      assert.equal(trainer.tryDrawMove(exercise, [], 'Bxb7').complete, false);
      assert.ok(trainer.replayDrawExercise(exercise, exercise.moves));
      continue;
    }
    let played = [];
    let result;
    while (played.length < exercise.moves.length) {
      result = trainer.tryDrawMove(exercise, played, exercise.moves[played.length]);
      assert.equal(result.status, 'accepted', exercise.title);
      assert.ok(result.played.length > played.length);
      played = result.played;
    }
    assert.equal(result.complete, true, exercise.title);
  }
});
