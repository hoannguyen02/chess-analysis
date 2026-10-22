const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const ts = require('typescript');
const path = require('node:path');
function loadTS(filename) {
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const loaded = { exports: {} };
  new Function('module', 'exports', 'require', compiled)(
    loaded,
    loaded.exports,
    (name) => loadTS(path.resolve(path.dirname(filename), name + '.ts'))
  );
  return loaded.exports;
}
const { drawCategories, drawExerciseUrl } = loadTS(
  'src/lib/chess/draw-practice.ts'
);

test('library has unique positions and links, with a substantial collection in every category', () => {
  const positions = new Set();
  const links = new Set();
  const viewerIndex = JSON.parse(
    fs.readFileSync('src/lib/chess/draw-game-index.json', 'utf8')
  );
  const viewerSources = JSON.parse(
    fs.readFileSync('src/lib/server/draw-game-sources.json', 'utf8')
  );
  for (const category of drawCategories) {
    assert.ok(
      category.exercises.length >= 100,
      `${category.id} needs at least 100 distinct positions`
    );
    for (const exercise of category.exercises) {
      const key = exercise.fen.split(' ').slice(0, 4).join(' ');
      assert.ok(!positions.has(key), `duplicate position: ${exercise.title}`);
      positions.add(key);
      const reference = viewerIndex[key];
      assert.ok(reference, 'every exercise has a local full-game viewer');
      assert.equal(reference.kind, 'game');
      assert.equal(viewerSources[reference.id].headers.Result, '1/2-1/2');
      const url = drawExerciseUrl(exercise);
      assert.ok(!links.has(url), `duplicate link: ${url}`);
      links.add(url);
    }
  }
  assert.ok(positions.size >= 90);
});

for (const category of drawCategories) {
  for (const exercise of category.exercises) {
    test(`${category.id}: ${exercise.title}`, async () => {
      const { Chess } = await import('chess.js');
      const chess = new Chess();
      assert.equal(chess.load(exercise.fen), true, 'valid starting FEN');
      for (const [index, move] of exercise.moves.entries()) {
        // The opponent must have no escape from these forcing draw lines.
        if (index % 2 === 1 && exercise.forcedReplies) {
          assert.equal(chess.in_check(), true);
          assert.deepEqual(chess.moves(), [move], 'defensive reply is forced');
        }
        assert.ok(chess.move(move), `legal solution move: ${move}`);
        if (category.id === 'perpetual-check' && index % 2 === 0) {
          assert.equal(chess.in_check(), true, 'perpetual line keeps checking');
        }
      }
      if (exercise.outcome === 'stalemate')
        assert.equal(chess.in_stalemate(), true);
      if (exercise.outcome === 'material')
        assert.equal(chess.insufficient_material(), true);
      if (exercise.outcome === 'repetition')
        assert.equal(chess.in_threefold_repetition(), true);
      if (exercise.outcome === 'checkmate') {
        assert.equal(chess.in_checkmate(), true);
        assert.equal(chess.insufficient_material(), false);
      }
      const url = new URL(drawExerciseUrl(exercise));
      assert.equal(url.hostname, 'lichess.org');
      if (!exercise.url) {
        const fen = decodeURIComponent(
          url.pathname.split('/standard/')[1]
        ).replace(/_/g, ' ');
        assert.equal(
          fen,
          exercise.fen,
          'analysis link preserves the starting position'
        );
      }
    });
  }
}
