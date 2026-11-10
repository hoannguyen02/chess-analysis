const test = require('node:test');
const assert = require('node:assert/strict');
const { catalogLoader } = require('./render-tactic-batch.cjs');

const scope = '/tactic-positions?theme=defensiveMove';

async function payload(load, endpoint, query = {}) {
  let body;
  await load(`src/pages/api/${endpoint}.ts`).default(
    { method: 'GET', query },
    {
      status(code) {
        assert.equal(code, 200);
        return this;
      },
      json(data) {
        body = data;
      },
    }
  );
  return body;
}

test('Defensive Move shares the protected catalog, worksheets, original games and Beginner importer', async () => {
  const chess = await import('chess.js');
  const load = catalogLoader(process.cwd(), chess);
  const { categories } = await payload(load, 'manual-tactic-exercises', { theme: 'defensiveMove' });
  const { exercises, managementScope } = categories[0];
  assert.equal(managementScope, scope);
  const owner = exercises.find((e) => e.manualId === 'cf96424dc69eb2bc49135217');
  assert.deepEqual(owner?.moves, ['Be2']);

  const { worksheetTopicsFromLibrary, worksheetLevels, levelExercises } = load('src/lib/chess/worksheet.ts');
  const pages = load('src/lib/server/private-hub.ts').privatePages;
  const topic = worksheetTopicsFromLibrary(pages).find((row) => row.id === scope.slice(1));
  assert.equal(topic?.endpoint, '/api/manual-tactic-exercises?theme=defensiveMove');
  assert.deepEqual(worksheetLevels, ['Beginner', 'A', 'B', 'C', 'C*', 'D', 'D*', 'E', 'E*']);
  const baseline = load('scripts/fixtures/defensive-move/published.json').records;
  for (const level of ['Beginner', 'A', 'B', 'C', 'D']) {
    if (!baseline.some((row) => row.level === level)) continue;
    assert.ok(levelExercises(exercises, level).some((e) => e.outcome === 'defensive-move'), level);
  }

  const gameSources = await payload(load, 'defensive-move-game-sources');
  const { gameFrames } = load('src/lib/chess/draw-game-viewer.ts');
  const { tryDrawMove, previousDrawPosition } = load('src/lib/chess/draw-trainer.ts');
  const position = (fen) => fen.split(' ').slice(0, 3).join(' ');
  let testedRefutation = false;
  for (const exercise of load('src/lib/server/defensive-move-exercises.json')) {
    const ref = exercise.gameReference;
    const frames = gameFrames(gameSources[ref.id], ref.branch);
    assert.equal(position(frames[ref.ply].fen), position(exercise.fen));
    assert.equal(previousDrawPosition(exercise).move.san, exercise.previousMove.move);
    assert.equal(exercise.goal, 'defend');
    const original = baseline.find((row) => row.gameId === ref.id);
    if (original?.level === 'Beginner') {
      assert.equal(exercise.beginner, true);
      assert.equal(exercise.moves.length, 1);
      assert.deepEqual(exercise.alternativeLines, []);
    }
    if (original?.level === 'D') {
      assert.equal(exercise.difficulty.level, 'D');
      assert.ok([7, 9].includes(exercise.moves.length));
      assert.ok(exercise.difficulty.sacrificeCount >= 1);
    }
    for (const line of [exercise.moves, ...exercise.alternativeLines]) {
      let played = [];
      for (let i = 0; i < line.length; i += 2) {
        const step = tryDrawMove(exercise, played, line[i]);
        assert.equal(step.status, 'accepted', line.join(' '));
        assert.equal(step.complete, i === line.length - 1);
        played = step.played;
      }
      assert.deepEqual(played, line);
    }
    if (!testedRefutation) {
      const board = new chess.Chess(exercise.fen);
      for (const san of board.moves()) {
        board.move(san);
        const loses = board.moves().some((reply) => reply.endsWith('#'));
        board.undo();
        if (!loses) continue;
        assert.equal(tryDrawMove(exercise, [], san).status, 'unrecorded');
        // Completion must check the objective even if a stored line is invalid.
        assert.equal(tryDrawMove({ ...exercise, moves: [san] }, [], san).complete, false);
        testedRefutation = true;
        break;
      }
    }
  }
  assert.ok(testedRefutation);

  const { beginnerTacticCandidates } = load('src/lib/server/beginner-tactic-candidates.ts');
  const imported = await beginnerTacticCandidates(scope);
  const source = imported.candidates.find((row) =>
    row.entry.reference?.collection === 'defensive-move' && row.entry.beginnerSourceLevel !== 'A'
  );
  assert.ok(source, 'Beginner importer includes reviewed source games');
});
