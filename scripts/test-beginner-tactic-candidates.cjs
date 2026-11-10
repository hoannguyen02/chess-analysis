const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createHash } = require('node:crypto');
const ts = require('typescript');

const project = process.cwd();
let chess;
test.before(async () => {
  chess = await import('chess.js');
});

function loader({
  root = project,
  catalog,
  access = () => true,
  intercept,
} = {}) {
  const cache = new Map();
  function load(file) {
    file = path.resolve(project, file);
    if (!path.extname(file))
      file += fs.existsSync(file + '.ts') ? '.ts' : '.json';
    if (file.endsWith('/server/tactics-catalog.ts') && catalog)
      return { tacticsCatalog: catalog };
    if (file.endsWith('/server/practice-access.ts'))
      return { requirePracticeAccess: access };
    const replacement = intercept?.(file);
    if (replacement !== undefined) return replacement;
    if (cache.has(file)) return cache.get(file).exports;
    if (file.endsWith('.json'))
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    const mod = { exports: {} };
    cache.set(file, mod);
    const local = (id) =>
      id === 'chess.js'
        ? chess
        : id.startsWith('@/')
          ? load('src/' + id.slice(2))
          : id.startsWith('.')
            ? load(path.join(path.dirname(file), id))
            : require(id);
    new Function(
      'module',
      'exports',
      'require',
      'process',
      ts.transpileModule(fs.readFileSync(file, 'utf8'), {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2022,
          esModuleInterop: true,
        },
      }).outputText
    )(mod, mod.exports, local, {
      cwd: () => root,
      env: { NODE_ENV: 'development' },
    });
    return mod.exports;
  }
  return load;
}

function response() {
  return {
    code: 200,
    headers: {},
    status(code) {
      this.code = code;
      return this;
    },
    setHeader(key, value) {
      this.headers[key] = value;
    },
    json(body) {
      this.body = body;
      return this;
    },
    end() {
      return this;
    },
  };
}
const key = (fen) => fen.split(' ').slice(0, 4).join(' ');
function comparable(fen) {
  const board = new chess.Chess(fen),
    fields = board.fen().split(' ');
  if (
    fields[3] !== '-' &&
    !board.moves({ verbose: true }).some((move) => move.flags.includes('e'))
  )
    fields[3] = '-';
  return fields.join(' ');
}
function checkPosition(position) {
  const { entry } = position;
  assert.ok(['B', 'C', 'C*', 'D', 'D*', 'E', 'E*'].includes(entry.beginnerSourceLevel));
  assert.equal(entry.level, 'Beginner');
  assert.deepEqual(entry.moves, []);
  assert.deepEqual(entry.alternativeLines, []);
  assert.equal(entry.solution, '');
  assert.equal(entry.beginnerOriginalFen, entry.fen);
  const board = new chess.Chess(entry.fen);
  assert.ok(board.move(position.move), 'the selected teaching move is legal');
  if (entry.previousMove) {
    const before = new chess.Chess(entry.previousMove.fen);
    assert.ok(before.move(entry.previousMove.move));
    assert.equal(comparable(before.fen()), comparable(entry.fen));
  }
  assert.equal(entry.gameMoves, undefined);
  assert.equal(entry.gameFen, undefined);
  assert.equal(entry.source?.lines, undefined);
}
function flatten(value) {
  if (Array.isArray(value)) return value.flatMap(flatten);
  if (!value || typeof value !== 'object') return [];
  if (value.fen && Array.isArray(value.moves)) return [value];
  return ['exercises', 'categories'].flatMap((name) => flatten(value[name]));
}
function write(root, name, value) {
  const file = path.join(root, name);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
}
function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'beginner-candidates-'));
  const catalog = {
    version: 1,
    themes: [
      {
        id: 'futureWeave',
        label: 'Future weave',
        dedicatedPage: '/future-weave',
        detector: null,
        kind: 'tactic',
        status: 'available',
        lichessTheme: null,
      },
      {
        id: 'futureOther',
        label: 'Future other',
        dedicatedPage: '/future-other',
        detector: null,
        kind: 'tactic',
        status: 'available',
        lichessTheme: null,
      },
      {
        id: 'futureManual',
        label: 'Future manual',
        dedicatedPage: null,
        detector: null,
        kind: 'tactic',
        status: 'not-built',
        lichessTheme: null,
      },
    ],
  };
  write(root, 'src/lib/server/manual-tactics.json', []);
  write(root, 'src/lib/server/practice-adjustments.json', []);
  const load = loader({ root, catalog });
  return {
    root,
    catalog,
    load,
    bank: () =>
      load(
        'src/lib/server/beginner-tactic-candidates.ts'
      ).beginnerTacticCandidates('/future-weave'),
    close: () => fs.rmSync(root, { recursive: true, force: true }),
  };
}
function exercise(title, prefix, moves, level = 'B', marker = 2) {
  const board = new chess.Chess();
  let previousMove;
  for (const san of prefix) {
    previousMove = { fen: board.fen(), move: san };
    board.move(san);
  }
  return {
    title,
    fen: board.fen(),
    moves,
    previousMove,
    goal: 'material',
    prompt: 'Owner-review position',
    solution: 'Existing A–D solution remains stored.',
    outcome: 'manual',
    difficulty: { level },
    ...(marker === null ? {} : { tacticPly: marker }),
  };
}
function samples() {
  const rows = [
    exercise('Source B', ['e4', 'e5'], ['Nf3', 'Nc6', 'Bb5'], 'B'),
    exercise('Source C', ['d4', 'd5'], ['c4', 'e6', 'Nc3'], 'C'),
    exercise('Source C*', ['c4', 'e5'], ['Nc3', 'Nf6', 'g3'], 'C*'),
    exercise('Source D', ['Nf3', 'Nf6'], ['g3', 'g6', 'Bg2'], 'D'),
    exercise('Source A', ['a3', 'a6'], ['h3', 'h6', 'Nf3'], 'A'),
    exercise('Source D*', ['d3', 'd6'], ['Nf3', 'Nf6', 'g3'], 'D*'),
    exercise(
      'Needs owner anchor',
      ['g3', 'g6'],
      ['Bg2', 'Bg7', 'Nf3'],
      'B',
      null
    ),
    exercise('Missing objective', ['b3', 'b6'], ['Bb2', 'Bb7', 'Nf3'], 'B'),
  ];
  delete rows.at(-1).goal;
  return rows;
}
function atMarker(source) {
  const board = new chess.Chess(source.fen);
  for (const san of source.moves.slice(0, source.tacticPly)) board.move(san);
  return board.fen();
}

test('candidate endpoint checks access and method before importing source data', async () => {
  let allowed = false,
    imports = 0;
  const payload = {
    candidates: [],
    topic: { themeId: 'fork', scope: '/fork', label: 'Fork' },
  };
  const load = loader({
    access: (_req, res) => {
      if (!allowed) res.status(401).end();
      return allowed;
    },
    intercept: (file) =>
      file.endsWith('/server/beginner-tactic-candidates.ts')
        ? (imports++, { beginnerTacticCandidates: async () => payload })
        : undefined,
  });
  const handler = load('src/pages/api/beginner-tactic-candidates.ts').default;
  let res = response();
  await handler({ method: 'GET', query: { scope: '/fork' } }, res);
  assert.equal(res.code, 401);
  assert.equal(imports, 0);
  allowed = true;
  res = response();
  await handler({ method: 'POST', query: { scope: '/fork' } }, res);
  assert.equal(res.code, 405);
  assert.equal(imports, 0);
  assert.equal(res.headers.Allow, 'GET');
  res = response();
  await handler({ method: 'GET', query: { scope: ['/fork', '/pin'] } }, res);
  assert.equal(res.code, 400);
  assert.equal(imports, 0);
  res = response();
  await handler({ method: 'GET', query: { scope: '/fork' } }, res);
  assert.equal(res.code, 200);
  assert.equal(res.body, payload);
  assert.equal(res.headers['Cache-Control'], 'private, no-store');
  assert.equal(imports, 1);
});

test('a future registered topic uses conventional files and explicit anchors without a new adapter', async () => {
  const f = fixture();
  try {
    const rows = samples();
    write(f.root, 'src/lib/server/future-weave-exercises.json', [
      { id: 'future', exercises: rows },
    ]);
    const result = await f.bank();
    assert.deepEqual(result.topic, {
      themeId: 'futureWeave',
      label: 'Future weave',
      scope: '/future-weave',
    });
    assert.equal(result.candidates.length, 6);
    assert.equal(result.existingCount, 0);
    assert.equal(result.suggestedCount, 5);
    assert.equal(result.diagnostics.missingGoal, 1);
    assert.equal(result.writable, true);
    for (const candidate of result.candidates) {
      assert.ok(!candidate.sourceTitle.includes('Source A'));
      const source = rows.find(
        (entry) => entry.title === candidate.sourceTitle
      );
      assert.ok(source);
      for (const position of candidate.positions) {
        checkPosition(position);
        assert.equal(
          position.entry.beginnerSourceLevel,
          source.difficulty.level
        );
        const board = new chess.Chess(source.fen);
        for (const san of source.moves.slice(0, position.ply)) board.move(san);
        assert.equal(position.entry.fen, board.fen());
      }
      if (source.tacticPly === undefined) {
        assert.equal(candidate.suggestedPly, null);
        assert.equal(candidate.detection, 'manual');
      } else {
        assert.equal(candidate.suggestedPly, source.tacticPly);
        assert.equal(candidate.detection, 'explicit');
        assert.equal(candidate.entry.fen, atMarker(source));
      }
    }
    assert.ok(
      result.candidates.some((candidate) => candidate.sourceTitle === 'Source D*')
    );
    await assert.rejects(() =>
      f
        .load('src/lib/server/beginner-tactic-candidates.ts')
        .beginnerTacticCandidates('/../../private')
    );
    await assert.rejects(() =>
      f
        .load('src/lib/server/beginner-tactic-candidates.ts')
        .beginnerTacticCandidates('/not-registered')
    );
  } finally {
    f.close();
  }
});

test('current owner decisions, imported FENs and stale preview snapshots stay authoritative', async () => {
  const f = fixture();
  try {
    const rows = samples();
    write(f.root, 'src/lib/server/future-weave-exercises.json', rows);
    const before = await f.bank();
    const management = f.load('src/lib/server/practice-management.ts');
    const { practiceReviewReference } = f.load(
      'src/lib/chess/practice-management.ts'
    );
    const adjustment = (source, change) => ({
      id: management.practiceAdjustmentId('/future-weave', source.fen),
      reference: practiceReviewReference('/future-weave', source),
      level: null,
      removed: false,
      note: '',
      updatedAt: '2026-11-06T00:00:00.000Z',
      history: [],
      ...change,
    });
    write(f.root, 'src/lib/server/practice-adjustments.json', [
      adjustment(rows[0], { removed: true }),
      adjustment(rows[1], { destinationScope: '/future-other' }),
      adjustment(rows[2], { level: 'A' }),
      adjustment(rows[4], { level: 'B' }),
    ]);
    const owner = await f.bank();
    assert.notEqual(owner.sourceSnapshot, before.sourceSnapshot);
    assert.ok(
      owner.candidates.some(
        (candidate) =>
          candidate.sourceTitle === 'Source A' &&
          candidate.entry.beginnerSourceLevel === 'B'
      )
    );
    assert.ok(
      !owner.candidates.some((candidate) =>
        ['Source B', 'Source C', 'Source C*'].includes(candidate.sourceTitle)
      )
    );
    const authored = {
      id: 'a'.repeat(24),
      themeId: 'futureWeave',
      level: 'Beginner',
      fen: atMarker(rows[3]),
      beginnerOriginalFen: atMarker(rows[0]),
      goal: 'material',
      moves: [],
      alternativeLines: [],
      solution: '',
      title: 'Imported draft',
      createdAt: '2026-11-06T00:00:00.000Z',
      updatedAt: '2026-11-06T00:00:00.000Z',
    };
    write(f.root, 'src/lib/server/manual-tactics.json', [authored]);
    const imported = await f.bank();
    assert.notEqual(imported.sourceSnapshot, owner.sourceSnapshot);
    assert.equal(imported.existingCount, 1);
    const excluded = new Set([
      key(authored.fen),
      key(authored.beginnerOriginalFen),
    ]);
    assert.ok(
      imported.candidates.every((candidate) =>
        candidate.positions.every(
          (position) => !excluded.has(key(position.entry.fen))
        )
      )
    );
    rows[3].title = 'Changed source title';
    write(f.root, 'src/lib/server/future-weave-exercises.json', rows);
    assert.notEqual((await f.bank()).sourceSnapshot, imported.sourceSnapshot);
  } finally {
    f.close();
  }
});

test('manual-only registered themes share the same extraction and require an owner anchor for unknown motifs', async () => {
  const f = fixture();
  try {
    const source = samples()[0];
    write(f.root, 'src/lib/server/manual-tactics.json', [
      {
        id: 'b'.repeat(24),
        themeId: 'futureManual',
        level: 'C*',
        ...source,
        difficulty: undefined,
        tacticPly: undefined,
        createdAt: '2026-11-06T00:00:00.000Z',
        updatedAt: '2026-11-06T00:00:00.000Z',
      },
    ]);
    const result = await f
      .load('src/lib/server/beginner-tactic-candidates.ts')
      .beginnerTacticCandidates('/tactic-positions?theme=futureManual');
    assert.equal(result.candidates.length, 1);
    assert.equal(result.topic.themeId, 'futureManual');
    assert.equal(result.candidates[0].suggestedPly, null);
    assert.equal(result.candidates[0].detection, 'manual');
    assert.equal(result.suggestedCount, 0);
    assert.ok(result.candidates[0].positions.length > 1);
    result.candidates[0].positions.forEach(checkPosition);
  } finally {
    f.close();
  }
});

test('played and illustrative source prefixes preserve accurate game references and preceding moves', async () => {
  const f = fixture();
  try {
    const source = samples()[0];
    delete source.previousMove;
    source.gameReference = {
      collection: 'future-weave',
      kind: 'game',
      id: 'original',
      branch: 0,
      ply: 2,
    };
    write(f.root, 'src/lib/server/future-weave-game-sources.json', {
      original: {
        kind: 'game',
        headers: { White: 'White Player', Black: 'Black Player' },
        fen: new chess.Chess().fen(),
        lines: [['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6']],
      },
    });
    write(f.root, 'src/lib/server/future-weave-exercises.json', [source]);
    const played = (await f.bank()).candidates[0];
    assert.equal(played.sourceKind, 'game');
    assert.equal(played.entry.reference.ply, 4);
    assert.equal(
      played.positions[0].entry.previousMove.move,
      'e5',
      'recorded source context can be recovered when absent from the exercise'
    );
    played.positions.forEach(checkPosition);
    source.moves = ['Nc3', 'Nc6', 'Nf3'];
    write(f.root, 'src/lib/server/future-weave-exercises.json', [source]);
    const analysis = (await f.bank()).candidates[0];
    assert.equal(analysis.sourceKind, 'analysis');
    assert.equal(analysis.entry.reference.ply, 2);
    assert.match(analysis.entry.title, /Phương án minh họa/);
    analysis.positions.forEach(checkPosition);
  } finally {
    f.close();
  }
});

test('existing tactic, nested promotion and typed draw catalogs extract read-only legal frames', async (t) => {
  const scopes = [
    '/fork',
    '/pin',
    '/skewer',
    '/discovered-attack',
    '/promotion',
    '/stalemate',
  ];
  const files = [
    'src/lib/server/manual-tactics.json',
    'src/lib/server/practice-adjustments.json',
    'src/lib/server/fork-exercises.json',
    'src/lib/server/pin-exercises.json',
    'src/lib/chess/skewer-exercises.json',
    'src/lib/server/discovery-exercises.json',
    'src/lib/server/promotion-exercises.json',
    'src/lib/server/fork-game-sources.json',
    'src/lib/server/pin-game-sources.json',
    'src/lib/server/skewer-game-sources.json',
    'src/lib/server/discovery-game-sources.json',
    'src/lib/server/promotion-game-sources.json',
    'src/lib/server/draw-game-sources.json',
    'src/lib/chess/draw-practice.ts',
    'scripts/fixtures/fork/published.json',
    'scripts/fixtures/discovery/published.json',
  ];
  const snapshot = () =>
    files.map((file) =>
      createHash('sha256').update(fs.readFileSync(file)).digest('hex')
    );
  const before = snapshot(),
    load = loader();
  const sourceFiles = files.filter((name) => name.endsWith('-exercises.json'));
  const extraFiles = [
    'src/lib/server/queen-skewer-intro.json',
    'src/lib/server/queen-skewer-pilot.json',
  ];
  const sourceRows = [...sourceFiles, ...extraFiles].flatMap((file) =>
    flatten(JSON.parse(fs.readFileSync(file, 'utf8')))
  );
  sourceRows.push(
    ...JSON.parse(
      fs.readFileSync('src/lib/server/practice-adjustments.json', 'utf8')
    ).flatMap((entry) =>
      entry.reference.exercise ? [entry.reference.exercise] : []
    )
  );
  const manual = load('src/lib/server/manual-tactics.ts');
  sourceRows.push(
    ...(await manual.readManualTactics()).map(manual.manualExercise)
  );
  sourceRows.push(
    ...flatten(load('src/lib/chess/draw-practice.ts').drawCategories)
  );
  const legalFrames = new Set();
  for (const source of sourceRows) {
    try {
      const board = new chess.Chess(source.fen),
        side = board.turn();
      for (const san of source.moves.slice(0, 120)) {
        if (board.turn() === side) legalFrames.add(comparable(board.fen()));
        if (!board.move(san)) break;
      }
    } catch {
      /* Old excluded source rows are not publication candidates. */
    }
  }
  for (const scope of scopes) {
    const started = performance.now();
    const result = await load(
      'src/lib/server/beginner-tactic-candidates.ts'
    ).beginnerTacticCandidates(scope);
    assert.ok(result.candidates.length > 0, scope);
    assert.ok(result.candidates.length <= 24, scope);
    const seen = new Set();
    for (const candidate of result.candidates) {
      for (const position of candidate.positions) {
        checkPosition(position);
        assert.ok(
          legalFrames.has(comparable(position.entry.fen)),
          'each FEN is a legal existing teaching-line frame'
        );
        assert.ok(
          !seen.has(key(position.entry.fen)),
          'candidate positions are deduplicated'
        );
        seen.add(key(position.entry.fen));
      }
      if (candidate.suggestedPly === null)
        assert.equal(candidate.detection, 'manual');
      else
        assert.ok(
          candidate.positions.some(
            (position) => position.ply === candidate.suggestedPly
          )
        );
    }
    assert.ok(result.suggestedCount <= 24 - Math.min(24, result.existingCount));
    assert.equal(JSON.stringify(result).includes('gameMoves'), false);
    t.diagnostic(
      `${scope}: ${result.candidates.length} sources, ${seen.size} frames, ${(performance.now() - started).toFixed(0)} ms`
    );
  }
  assert.deepEqual(
    snapshot(),
    before,
    'candidate reads cannot mutate published sources or owner data'
  );
});
