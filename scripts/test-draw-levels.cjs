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
const { drawLevels, practiceLevels, filterDrawLevel } = load(
  'src/lib/chess/draw-levels.ts'
);

test('reviewed levels and theme routes expose their actual counts and objectives', () => {
  assert.deepEqual(drawLevels, ['A', 'B', 'C', 'C*', 'D']);
  assert.deepEqual(practiceLevels, ['Beginner', 'A', 'B', 'C', 'C*', 'D']);
  const manifest = JSON.parse(
    fs.readFileSync(
      'scripts/fixtures/draw-practice/curated-selection.json',
      'utf8'
    )
  );
  const additions = JSON.parse(
    fs.readFileSync(
      'scripts/fixtures/draw-practice/published-additions.json',
      'utf8'
    )
  );
  const approved = new Map(
    [...manifest.selected, ...additions.records].map((r) => [r.fen, r])
  );
  const counts = { Beginner: 0, A: 0, B: 0, C: 0, 'C*': 0, D: 0 };
  for (const category of drawCategories)
    for (const exercise of category.exercises) {
      const record = approved.get(exercise.fen);
      assert.ok(record, exercise.fen);
      assert.equal(exercise.goal, 'draw');
      const level = exercise.beginner ? 'Beginner' : exercise.difficulty.level;
      assert.equal(level, record.level);
      counts[level]++;
      if (level === 'C' || level === 'D')
        assert.ok(exercise.difficulty.sacrificeCount > 0);
      if (level === 'D') assert.ok(exercise.difficulty.solverMoves > 3);
    }
  assert.deepEqual(counts, {
    Beginner: 24,
    A: 24,
    B: 28,
    C: 29,
    'C*': 25,
    D: 27,
  });
  assert.deepEqual(counts, additions.counts);
  assert.equal(manifest.decisions.length, 706);
  assert.equal(
    manifest.decisions.filter((r) => r.status === 'selected').length,
    32
  );
  assert.ok(
    !manifest.selected.some((r) => r.id === 'draw-ddfb063b9566b703'),
    'Rxh7 permits Ng3+ and mate; never restore the recorded blunder'
  );
  const routeCounts = Object.fromEntries(
    drawCategories.map((category) => [
      category.id,
      Object.fromEntries([
        ['Beginner', category.exercises.filter((e) => e.beginner).length],
        ...drawLevels.map((level) => [
          level,
          category.exercises.filter((e) => e.difficulty?.level === level)
            .length,
        ]),
      ]),
    ])
  );
  assert.deepEqual(routeCounts['perpetual-check'], {
    Beginner: 0,
    A: 16,
    B: 24,
    C: 23,
    'C*': 24,
    D: 24,
  });
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
        category.exercises.filter((item) => item.difficulty?.level === level)
      );
      return actual;
    });
    assert.equal(
      selected.length,
      category.exercises.filter((e) => !e.beginner).length
    );
    assert.equal(
      new Set(selected.map((item) => item.fen)).size,
      category.exercises.filter((e) => !e.beginner).length
    );
  }
  assert.deepEqual(filterDrawLevel([], 'D'), []);
});

test('draw theme and level navigation omit combined options and empty themes', () => {
  const {
    drawPracticeChoices,
    drawPracticeLevelChoices,
    drawThemeLinks,
    initialDrawPracticeLevel,
  } = load('src/lib/chess/draw-practice-view.ts');
  const choices = drawPracticeChoices(drawCategories);
  assert.deepEqual(
    choices,
    drawCategories.filter((c) => c.exercises.length > 0)
  );
  assert.ok(!choices.some((c) => c.id === 'all-draw-ideas'));
  assert.equal(choices.flatMap((c) => c.exercises).length, 157);
  assert.deepEqual(
    drawThemeLinks(choices).map(({ id, href, count }) => [id, href, count]),
    [
      ['perpetual-check', '/perpetual-check', 111],
      ['stalemate', '/stalemate', 16],
      ['insufficient-material', '/insufficient-material', 17],
      ['repetition', '/repetition-draw', 1],
      ['fortress', '/fortress-draw', 12],
    ]
  );
  const privatePages = load('src/lib/server/private-hub.ts').privatePages;
  const routedThemes = privatePages.filter((page) => page.group === 'Hòa cờ');
  assert.deepEqual(
    routedThemes.map(({ href, worksheetEndpoint }) => [
      href,
      worksheetEndpoint,
    ]),
    [
      ['/perpetual-check', '/api/perpetual-check-exercises'],
      ['/stalemate', '/api/stalemate-exercises'],
      ['/insufficient-material', '/api/insufficient-material-exercises'],
      ['/repetition-draw', '/api/repetition-draw-exercises'],
      ['/fortress-draw', '/api/fortress-draw-exercises'],
    ]
  );
  const allPositions = {
    id: 'review-only',
    title: 'Review',
    description: '',
    exercises: choices.flatMap((category) => category.exercises),
  };
  assert.deepEqual(
    drawPracticeLevelChoices(allPositions).map(({ id, label, count }) => ({
      id,
      label,
      count,
    })),
    [
      { id: 'beginner', label: 'Nhập môn / Beginner', count: 24 },
      { id: 'A', label: 'Cấp độ A', count: 24 },
      { id: 'B', label: 'Cấp độ B', count: 28 },
      { id: 'C', label: 'Cấp độ C', count: 29 },
      { id: 'C*', label: 'Cấp độ C*', count: 25 },
      { id: 'D', label: 'Cấp độ D', count: 27 },
    ]
  );
  assert.equal(
    initialDrawPracticeLevel(
      choices.filter((category) => category.id === 'repetition')
    ),
    'C*'
  );
});
