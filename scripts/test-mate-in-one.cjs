const test = require('node:test');
const assert = require('node:assert/strict');
const { catalogLoader } = require('./render-tactic-batch.cjs');

const scope = '/tactic-positions?theme=mateIn1';

async function get(load, endpoint, query = {}) {
  let body;
  await load(`src/pages/api/${endpoint}.ts`).default({ method: 'GET', query }, {
    status(code) {
      assert.equal(code, 200);
      return this;
    },
    json(data) { body = data; },
  });
  return body;
}

test('mate in one uses the shared catalog, trainer, worksheets and Beginner importer', async () => {
  const chess = await import('chess.js');
  const load = catalogLoader(process.cwd(), chess);
  const { categories } = await get(load, 'manual-tactic-exercises', { theme: 'mateIn1' });
  const [{ exercises, managementScope }] = categories;
  assert.equal(managementScope, scope);
  const { worksheetTopicsFromLibrary, levelExercises } = load('src/lib/chess/worksheet.ts');
  const topics = worksheetTopicsFromLibrary(load('src/lib/server/private-hub.ts').privatePages);
  assert.equal(topics.find((row) => row.id === scope.slice(1))?.endpoint,
    '/api/manual-tactic-exercises?theme=mateIn1');
  for (const level of ['Beginner', 'A', 'B']) {
    assert.ok(levelExercises(exercises, level).some((row) => row.gameReference?.collection === 'mate-in-one'));
  }

  const sources = await get(load, 'mate-in-one-game-sources');
  const published = load('src/lib/server/mate-in-one-exercises.json');
  const { gameExerciseContext } = load('src/lib/chess/draw-game-viewer.ts');
  const { tryDrawMove } = load('src/lib/chess/draw-trainer.ts');
  for (const exercise of published) {
    const ref = exercise.gameReference;
    const { fen, previousMove } = gameExerciseContext(sources[ref.id], ref);
    assert.equal(fen, exercise.fen);
    assert.deepEqual(previousMove, exercise.previousMove);
    const board = new chess.Chess(exercise.fen);
    const expected = [exercise.moves, ...exercise.alternativeLines].map(([san]) => san).sort();
    if (exercise.beginner) {
      assert.equal(expected.length, 1);
      assert.ok(board.board().flat().filter(Boolean).length <= 10);
    }
    assert.deepEqual(board.moves().filter((san) => san.endsWith('#')).sort(), expected);
    for (const san of expected) assert.equal(tryDrawMove(exercise, [], san).complete, true);
    const other = board.moves().find((san) => !san.endsWith('#'));
    if (other) assert.equal(tryDrawMove(exercise, [], other).complete, false);
  }

  const { beginnerTacticCandidates } = load('src/lib/server/beginner-tactic-candidates.ts');
  const { candidates } = await beginnerTacticCandidates(scope);
  const source = candidates.find(({ entry }) => entry.reference?.collection === 'mate-in-one');
  assert.equal(source?.entry.beginnerSourceLevel, 'B');
  assert.equal(source.suggestedPly, 0);
  assert.ok(source.entry.previousMove);

  const { curatedPositionLevel } = load('src/lib/server/manual-tactics.ts');
  const { manualPositionKey } = load('src/lib/chess/manual-tactics.ts');
  const key = manualPositionKey(published.find((row) => row.difficulty?.level === 'B').fen);
  assert.equal(await curatedPositionLevel('mateIn1', key), 'B');
  assert.equal(await curatedPositionLevel('mateIn1', key, undefined, true), undefined);
  const beginnerKey = manualPositionKey(published.find((row) => row.beginner).fen);
  assert.equal(await curatedPositionLevel('mateIn1', beginnerKey, undefined, true), 'Beginner');
});
