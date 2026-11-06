const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const exercises = require('../src/lib/server/discovery-exercises.json');
const beginners = require('../src/lib/server/discovery-beginner-exercises.json');
const sources = require('../src/lib/server/discovery-game-sources.json');
test('discovery: complete games, legal alternative replies and capture-before-completion', async () => {
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
  for (const level of ['A', 'B', 'C', 'C*', 'D']) {
    const games = exercises.filter((e) => e.difficulty.level === level);
    assert.ok(
      new Set(games.map((e) => e.gameReference.id)).size > 0,
      `reviewed games remain available in ${level}`
    );
  }
  for (const e of [...exercises, ...beginners]) {
    if (!e.beginner) {
      const ref = e.gameReference;
      assert.equal(ref.collection, 'discovery');
      const source = sources[ref.id];
      const b = new Chess(source.fen);
      const fens = [b.fen()];
      for (const san of source.lines[0]) {
        assert.ok(b.move(san));
        fens.push(b.fen());
      }
      assert.equal(fens[ref.ply], e.fen);
      assert.equal(fens[ref.ply - 1], e.previousMove.fen);
    }
    if (e.goal === 'checkmate') {
      const start = new Chess(e.fen);
      for (const move of start.moves()) {
        const after = new Chess(e.fen);
        after.move(move);
        if (after.in_checkmate()) {
          assert.equal(
            mod.exports.tryDrawMove({ ...e, alternativeLines: [] }, [], move)
              .complete,
            true
          );
        }
      }
    }
    for (const line of [e.moves, ...e.alternativeLines]) {
      const game = new Chess(e.fen);
      for (const san of line) assert.ok(game.move(san));
      assert.ok(
        game.history({ verbose: true }).at(-1).captured || game.in_checkmate()
      );
      const before = line.slice(0, -1);
      assert.equal(
        mod.exports.tryDrawMove(e, before, line.at(-1)).complete,
        true
      );
      for (let i = 0; i < line.length - 1; i += 2) {
        // Auto reply is included by tryDrawMove, but an unfinished solver turn is not success.
        assert.equal(
          mod.exports.tryDrawMove(e, line.slice(0, i), line[i]).complete,
          false
        );
      }
    }
  }
});

test('topic filters partition the real-game collection', async () => {
  const mod = { exports: {} };
  const js = ts.transpileModule(
    fs.readFileSync('src/pages/api/discovery-exercises.ts', 'utf8'),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        esModuleInterop: true,
      },
    }
  ).outputText;
  new Function('module', 'exports', 'require', js)(mod, mod.exports, (name) => {
    if (name.endsWith('/manual-tactics'))
      return { includeManualExercises: async (_route, data) => data };
    if (name.endsWith('/practice-access'))
      return { requirePracticeAccess: () => true };
    if (name.endsWith('/private-hub'))
      return { privateHubPath: () => '/test-hub' };
    if (name.endsWith('/discovery-exercises.json')) return exercises;
    if (name.endsWith('/discovery-beginner-exercises.json')) return beginners;
    if (name.endsWith('/practice-game-caption'))
      return {
        practiceGameCaption: () => '',
        practiceGameOpening: () => '',
        practicePlayerTitle: () => '',
        practicePlayers: () => [],
      };
    throw new Error(`Unexpected import ${name}`);
  });
  let payload;
  await mod.exports.default(
    { method: 'GET' },
    {
      status(code) {
        assert.equal(code, 200);
        return this;
      },
      json(body) {
        payload = body;
      },
    }
  );
  const [all, check, attack] = payload.categories;
  assert.equal(all.shortLabel, 'Tất cả');
  assert.equal(all.exercises.length, exercises.length + beginners.length);
  assert.ok(check.exercises.length && attack.exercises.length);
  assert.equal(
    check.exercises.length + attack.exercises.length,
    exercises.length + beginners.length
  );
  assert.ok(check.exercises.every((e) => e.discoveryKind === 'check'));
  assert.ok(attack.exercises.every((e) => e.discoveryKind === 'attack'));
});

test('Beginner discoveries have explicit goals and no invented game provenance', () => {
  assert.equal(beginners.length, 24);
  for (const e of beginners) {
    assert.equal(e.beginner, true);
    assert.equal(e.goal, 'material');
    assert.equal(e.source, 'original-composition');
    assert.equal(e.gameReference, undefined);
  }
  assert.deepEqual(
    new Set(beginners.map((e) => e.discoveryKind)),
    new Set(['check', 'attack'])
  );
});

test('Discovery B publication snapshot and live worksheet preserve owner decisions', async () => {
  const path = require('node:path');
  const modules = new Map();
  const chess = await import('chess.js');
  function load(file) {
    file = path.resolve(file);
    if (!path.extname(file))
      file += fs.existsSync(file + '.ts') ? '.ts' : '.json';
    if (modules.has(file)) return modules.get(file).exports;
    if (file.endsWith('.json'))
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    if (file.endsWith('/server/practice-access.ts'))
      return { requirePracticeAccess: () => true };
    const mod = { exports: {} };
    modules.set(file, mod);
    const local = (id) => {
      if (id === 'chess.js') return chess;
      if (id.startsWith('@/')) return load('src/' + id.slice(2));
      if (id.startsWith('.')) return load(path.join(path.dirname(file), id));
      return require(id);
    };
    new Function(
      'module',
      'exports',
      'require',
      ts.transpileModule(fs.readFileSync(file, 'utf8'), {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2020,
          esModuleInterop: true,
        },
      }).outputText
    )(mod, mod.exports, local);
    return mod.exports;
  }
  let payload;
  await load('src/pages/api/discovery-exercises.ts').default(
    { method: 'GET' },
    {
      status(code) {
        assert.equal(code, 200);
        return this;
      },
      json(body) {
        payload = body;
      },
    }
  );
  const batch = require('./fixtures/discovery/level-b-expansion-20261105.json');
  const all = payload.categories[0].exercises;
  const activeB = all.filter((e) => e.difficulty?.level === 'B');
  const historical = load(
    'src/lib/server/practice-management.ts'
  ).applyPracticeAdjustments(
    '/discovered-attack',
    [
      {
        id: 'discovery',
        exercises: [
          ...beginners,
          ...exercises.filter((e) =>
            [...batch.preservedSourceIds, ...batch.order].includes(
              e.gameReference.id
            )
          ),
        ],
      },
    ],
    batch.managementAtPublication,
    false
  )[0].exercises;
  assert.deepEqual(
    historical
      .filter((e) => e.difficulty?.level === 'B')
      .map((e) => e.gameReference.id),
    [...batch.baseActiveOrder, ...batch.order]
  );
  for (const [level, count] of Object.entries(batch.expectedEffectiveCounts))
    assert.equal(
      historical.filter((e) => e.difficulty?.level === level).length,
      count,
      level
    );
  const choices = require('../src/lib/server/practice-adjustments.json');
  const key = (fen) => fen.split(' ').slice(0, 4).join(' ');
  const expectedB = exercises.filter((e) => {
    const choice = choices.find(
      (x) =>
        x.reference.scope === '/discovered-attack' &&
        key(x.reference.fen) === key(e.fen)
    );
    return (
      !choice?.removed &&
      (!choice?.destinationScope ||
        choice.destinationScope === '/discovered-attack') &&
      (choice?.level || e.difficulty?.level) === 'B'
    );
  });
  const sourceIds = new Set(exercises.map((e) => e.gameReference.id));
  assert.deepEqual(
    activeB
      .filter((e) => sourceIds.has(e.gameReference?.id))
      .map((e) => e.gameReference.id),
    expectedB.map((e) => e.gameReference.id)
  );
  const model = load('src/lib/chess/worksheet.ts');
  const topics = model.worksheetTopicsFromLibrary(
    load('src/lib/server/private-hub.ts').privatePages
  );
  const topic = topics.find((t) => t.id === 'discovered-attack');
  assert.ok(topic);
  const pages = model.planWorksheet(
    [{ id: 1, topic: topic.id, level: 'B', count: activeB.length }],
    { [topic.id]: all },
    [topic]
  );
  const ids = pages
    .flatMap((p) => p.exercises)
    .map((x) => x.exercise.gameReference.id);
  assert.equal(new Set(ids).size, activeB.length);
  assert.deepEqual(
    ids,
    activeB.map((e) => e.gameReference.id)
  );
  assert.throws(() =>
    model.planWorksheet(
      [{ id: 1, topic: topic.id, level: 'B', count: activeB.length + 1 }],
      { [topic.id]: all },
      [topic]
    )
  );
});
