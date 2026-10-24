const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const cache = {};
function load(file) {
  file = path.resolve(file);
  if (cache[file]) return cache[file];
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  new Function('module', 'exports', 'require', code)(
    module,
    module.exports,
    (name) => load(path.resolve(path.dirname(file), name + '.ts'))
  );
  return (cache[file] = module.exports);
}
const { drawCategories } = load('src/lib/chess/draw-practice.ts');
const { drawLevels, filterDrawLevel } = load('src/lib/chess/draw-levels.ts');

test('every exercise has an auditable suggested level using the requested labels', () => {
  assert.deepEqual(drawLevels, ['A', 'B', 'C', 'C*', 'D']);
  const audit = JSON.parse(
    fs.readFileSync(
      'scripts/fixtures/draw-practice/draw-level-audit.json',
      'utf8'
    )
  );
  const byFen = new Map(audit.records.map((record) => [record.fen, record]));
  for (const category of drawCategories)
    for (const exercise of category.exercises) {
      const rating = exercise.difficulty;
      assert.ok(drawLevels.includes(rating.level));
      assert.equal(rating.status, 'suggested');
      assert.ok(rating.reason.length > 30);
      const record = byFen.get(exercise.fen);
      assert.equal(record.category, category.id);
      assert.deepEqual(record.rating, rating);
      assert.ok(record.horizonPlies <= exercise.moves.length);
      if (rating.level === 'A') {
        assert.equal(rating.solverMoves, 1);
        assert.equal(rating.sacrificeCount, 0);
      }
      if (rating.level === 'C' || rating.level === 'D')
        assert.ok(rating.sacrificeCount > 0);
      if (rating.level === 'D') assert.ok(rating.solverMoves > 3);
    }
});

test('filters partition each theme, preserve game order, and allow empty levels', () => {
  for (const category of drawCategories) {
    assert.strictEqual(
      filterDrawLevel(category.exercises, 'all'),
      category.exercises
    );
    const selected = drawLevels.flatMap((level) => {
      const actual = filterDrawLevel(category.exercises, level);
      assert.deepEqual(
        actual,
        category.exercises.filter((item) => item.difficulty.level === level)
      );
      return actual;
    });
    assert.equal(selected.length, category.exercises.length);
    assert.equal(
      new Set(selected.map((item) => item.fen)).size,
      category.exercises.length
    );
  }
  assert.deepEqual(filterDrawLevel([], 'D'), []);
});
