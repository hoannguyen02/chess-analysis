const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const exercises = require('../src/lib/server/fork-exercises.json');
const beginners = require('../src/lib/server/fork-beginner-exercises.json');
const sources = require('../src/lib/server/fork-game-sources.json');
test('forks: complete games, legal alternative replies and capture-before-completion', async () => {
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
      new Set(games.map((e) => e.gameReference.id)).size >= 20,
      `20 distinct games in ${level}`
    );
  }
  for (const e of exercises) {
    const ref = e.gameReference;
    assert.equal(ref.collection, 'fork');
    const source = sources[ref.id];
    const b = new Chess(source.fen);
    const fens = [b.fen()];
    for (const san of source.lines[0]) {
      assert.ok(b.move(san));
      fens.push(b.fen());
    }
    assert.equal(fens[ref.ply], e.fen);
    assert.equal(fens[ref.ply - 1], e.previousMove.fen);
    for (const line of [e.moves, ...e.alternativeLines]) {
      const game = new Chess(e.fen);
      for (const san of line) assert.ok(game.move(san));
      assert.ok(game.history({ verbose: true }).at(-1).captured);
      const before = line.slice(0, -1);
      assert.equal(
        mod.exports.tryDrawMove(e, before, line.at(-1)).complete,
        true
      );
      const prefix = line.slice(0, -3);
      assert.equal(
        mod.exports.tryDrawMove(e, prefix, line.at(-3)).complete,
        false
      );
    }
  }
});

test('Beginner forks retain every immediate defence, material recovery and trainer completion', async () => {
  const chess = await import('chess.js');
  const { Chess } = chess;
  const mod = { exports: {} };
  new Function(
    'module',
    'exports',
    'require',
    ts.transpileModule(
      fs.readFileSync('src/lib/chess/draw-trainer.ts', 'utf8'),
      {
        compilerOptions: { module: ts.ModuleKind.CommonJS },
      }
    ).outputText
  )(mod, mod.exports, () => chess);
  const values = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
  const balance = (board, side) =>
    board
      .board()
      .flat()
      .reduce(
        (total, piece) =>
          total +
          (piece ? values[piece.type] * (piece.color === side ? 1 : -1) : 0),
        0
      );
  assert.equal(beginners.length, 7);
  assert.equal(
    new Set(beginners.map((e) => e.fen.split(' ').slice(0, 4).join(' '))).size,
    beginners.length
  );
  for (const e of beginners) {
    assert.equal(e.beginner, true);
    assert.equal(e.goal, 'material');
    assert.equal(e.outcome, 'fork');
    assert.equal(e.source, 'original-composition');
    assert.equal(e.gameReference, undefined);
    assert.equal(e.difficulty, undefined);
    const initial = new Chess(e.fen);
    const solver = initial.turn();
    const before = balance(initial, solver);
    const lines = [e.moves, ...(e.alternativeLines ?? [])];
    for (const first of new Set(lines.map((line) => line[0]))) {
      const board = new Chess(e.fen);
      assert.ok(board.move(first));
      assert.deepEqual(
        [
          ...new Set(
            lines.filter((line) => line[0] === first).map((line) => line[1])
          ),
        ].sort(),
        board.moves().sort(),
        `all legal responses to ${first} at ${e.fen}`
      );
    }
    for (const line of lines) {
      const board = new Chess(e.fen);
      for (const san of line) assert.ok(board.move(san), `${e.title}: ${san}`);
      assert.ok(board.history({ verbose: true }).at(-1).captured);
      assert.equal(board.in_stalemate(), false);
      assert.equal(board.insufficient_material(), false);
      assert.equal(board.in_checkmate(), false);
      assert.ok(balance(board, solver) > before);
      for (const reply of board.moves()) {
        const after = new Chess(board.fen());
        after.move(reply);
        assert.ok(
          balance(after, solver) > before,
          `${e.title}: recovery ${reply}`
        );
        assert.equal(after.in_checkmate(), false);
      }
      for (let index = 0; index < line.length; index += 2) {
        const played = mod.exports.tryDrawMove(
          e,
          line.slice(0, index),
          line[index]
        );
        assert.equal(played.status, 'accepted');
        assert.equal(played.complete, index === line.length - 1);
      }
    }
    const unsaved = initial
      .moves()
      .find((move) => !lines.some((line) => line[0] === move));
    if (unsaved) {
      const result = mod.exports.tryDrawMove(e, [], unsaved);
      assert.equal(result.status, 'unrecorded');
      assert.equal(result.complete, false);
    }
  }
});

test('protected Fork API exposes Beginner first and preserves worksheet registration and real games', async () => {
  let allowed = false;
  let privateReads = 0;
  let candidateImports = 0;
  const candidatePayload = {
    candidates: [],
    existingCount: 7,
    suggestedCount: 0,
    writable: false,
  };
  const mod = { exports: {} };
  new Function(
    'module',
    'exports',
    'require',
    ts.transpileModule(
      fs.readFileSync('src/pages/api/fork-exercises.ts', 'utf8'),
      {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          esModuleInterop: true,
        },
      }
    ).outputText
  )(mod, mod.exports, (name) => {
    if (name.endsWith('/practice-access'))
      return {
        requirePracticeAccess: (_req, res) => {
          if (!allowed) res.status(401).end();
          return allowed;
        },
      };
    if (name.endsWith('/private-hub'))
      return { privateHubPath: () => '/test-hub' };
    privateReads++;
    if (name.endsWith('/fork-beginner-candidates')) {
      candidateImports++;
      return { forkBeginnerCandidates: async () => candidatePayload };
    }
    if (name.endsWith('/fork-exercises.json')) return exercises;
    if (name.endsWith('/fork-beginner-exercises.json')) return beginners;
    if (name.endsWith('/manual-tactics'))
      return {
        includeManualExercises: async (route, data) => {
          assert.equal(route, '/fork');
          return data;
        },
      };
    if (name.endsWith('/practice-game-caption'))
      return {
        practiceGameCaption: () => '',
        practiceGameOpening: () => '',
        practicePlayerTitle: () => '',
        practicePlayers: () => [],
      };
    throw new Error(`Unexpected import ${name}`);
  });
  const response = () => ({
    headers: {},
    status(code) {
      this.code = code;
      return this;
    },
    setHeader(key, value) {
      this.headers[key] = value;
    },
    json(data) {
      this.data = data;
      return this;
    },
    end() {
      return this;
    },
  });
  const denied = response();
  await mod.exports.default(
    { method: 'GET', query: { beginnerCandidates: '1' } },
    denied
  );
  assert.equal(denied.code, 401);
  assert.equal(privateReads, 0);
  assert.equal(candidateImports, 0);
  allowed = true;
  const post = response();
  await mod.exports.default(
    { method: 'POST', query: { beginnerCandidates: '1' } },
    post
  );
  assert.equal(post.code, 405);
  assert.equal(post.headers.Allow, 'GET');
  assert.equal(privateReads, 0);
  assert.equal(candidateImports, 0);
  const candidateRes = response();
  await mod.exports.default(
    { method: 'GET', query: { beginnerCandidates: '1' } },
    candidateRes
  );
  assert.equal(candidateRes.code, 200);
  assert.equal(candidateRes.data, candidatePayload);
  assert.equal(candidateImports, 1);
  const res = response();
  await mod.exports.default({ method: 'GET' }, res);
  assert.equal(res.code, 200);
  const items = res.data.categories[0].exercises;
  assert.equal(items.length, beginners.length + exercises.length);
  assert.ok(
    items
      .slice(0, beginners.length)
      .every((e) => e.beginner && !e.gameReference)
  );
  assert.deepEqual(
    items.slice(beginners.length).map((e) => e.gameReference),
    exercises.map((e) => e.gameReference)
  );
  const library = { exports: {} };
  new Function(
    'module',
    'exports',
    ts.transpileModule(
      fs.readFileSync('src/lib/server/private-hub.ts', 'utf8'),
      { compilerOptions: { module: ts.ModuleKind.CommonJS } }
    ).outputText
  )(library, library.exports);
  assert.equal(
    library.exports.privatePages.find((page) => page.href === '/fork')
      .worksheetEndpoint,
    '/api/fork-exercises'
  );
});

test('the legacy Fork candidate lookup delegates to the shared topic extractor', async () => {
  const module = { exports: {} };
  const payload = { candidates: [], topic: { scope: '/fork' } };
  const calls = [];
  new Function(
    'module',
    'exports',
    'require',
    ts.transpileModule(
      fs.readFileSync('src/lib/server/fork-beginner-candidates.ts', 'utf8'),
      { compilerOptions: { module: ts.ModuleKind.CommonJS } }
    ).outputText
  )(module, module.exports, (name) => {
    assert.equal(name, './beginner-tactic-candidates');
    return {
      beginnerTacticCandidates: async (scope) => {
        calls.push(scope);
        return payload;
      },
    };
  });
  assert.equal(await module.exports.forkBeginnerCandidates(), payload);
  assert.deepEqual(calls, ['/fork']);
});

test('solutionless Beginner uses neutral free legal play and every Beginner exposes its position editor', async () => {
  const chess = await import('chess.js');
  const runtime = { exports: {} };
  new Function(
    'module',
    'exports',
    'require',
    ts.transpileModule(
      fs.readFileSync('src/lib/chess/draw-trainer.ts', 'utf8'),
      { compilerOptions: { module: ts.ModuleKind.CommonJS } }
    ).outputText
  )(runtime, runtime.exports, () => chess);
  const module = { exports: {} };
  const jsx = (type, props) => ({ type, props });
  new Function(
    'module',
    'exports',
    'require',
    ts.transpileModule(
      fs.readFileSync('src/components/DrawTrainer.tsx', 'utf8'),
      {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          jsx: ts.JsxEmit.ReactJSX,
          esModuleInterop: true,
        },
      }
    ).outputText
  )(module, module.exports, (name) => {
    if (name === 'react/jsx-runtime')
      return { jsx, jsxs: jsx, Fragment: 'fragment' };
    if (name === 'react')
      return {
        useState: (initial) => [
          typeof initial === 'function' ? initial() : initial,
          () => {},
        ],
        useMemo: (factory) => factory(),
        useEffect: () => {},
        useRef: (current) => ({ current }),
      };
    if (name.endsWith('/draw-trainer')) return runtime.exports;
    if (name.endsWith('/practice-goals'))
      return { practiceGoalLabels: { material: 'Thắng vật chất' } };
    if (name.endsWith('/worksheet'))
      return { explainLine: () => [], previousMoveLabel: () => '' };
    if (name.endsWith('/practice-exploration'))
      return { explorationStartPly: () => 0 };
    if (name.endsWith('/usePracticeBoardTools'))
      return { usePracticeBoardTools: () => ({}) };
    if (name.endsWith('.module.css')) return {};
    if (name.endsWith('/PracticePositionEditor'))
      return { ManualPositionControl: 'ManualPositionControl' };
    if (name.endsWith('/PracticeManagement'))
      return { ExerciseManagementControl: 'ExerciseManagementControl' };
    if (name.endsWith('/PracticeExploration')) return 'PracticeExploration';
    if (name === 'next/dynamic') return () => 'DrawGameViewer';
    if (name === 'react-icons/fi') return {};
    if (name === 'flowbite-react') return { Tooltip: 'Tooltip' };
    return name;
  });
  function nodes(tree, type) {
    if (!tree || typeof tree !== 'object') return [];
    if (Array.isArray(tree)) return tree.flatMap((item) => nodes(item, type));
    return [
      ...(tree.type === type ? [tree] : []),
      ...nodes(tree.props?.children, type),
    ];
  }
  function text(tree) {
    if (typeof tree === 'string') return tree;
    if (Array.isArray(tree)) return tree.map(text).join('');
    return tree?.props ? text(tree.props.children) : '';
  }
  const original = beginners[0];
  const exercise = {
    ...original,
    moves: [],
    alternativeLines: [],
    solution: '',
    beginnerOriginalFen: original.fen,
    management: { scope: '/fork', writable: true },
  };
  const free = module.exports.default({
    exercise,
    onComplete: () => assert.fail('free play must not complete an exercise'),
  });
  assert.equal(free.type, 'PracticeExploration');
  assert.equal(free.props.freePlay, true);
  assert.deepEqual(free.props.moves, []);
  assert.equal(free.props.onConfirm, undefined);
  assert.equal(free.props.onComplete, undefined);
  const sourceExercise = exercises[0];
  const freeWithContext = module.exports.default({
    exercise: {
      ...sourceExercise,
      beginner: true,
      moves: [],
      alternativeLines: [],
    },
  });
  assert.deepEqual(
    freeWithContext.props.previousMove,
    sourceExercise.previousMove
  );
  assert.match(text(free.props.header), /Chưa có lời giải/);
  assert.doesNotMatch(text(free.props.header), /chọn kết luận|Hoàn thành|Đúng/);
  const editor = nodes(free.props.header, 'ManualPositionControl')[0];
  assert.equal(editor.props.defaults.themeId, 'fork');
  assert.equal(editor.props.defaults.level, 'Beginner');
  assert.equal(editor.props.beginnerBaseFen, exercise.fen);
  assert.equal(editor.props.beginnerOriginalFen, original.fen);
  const curated = module.exports.default({
    exercise: { ...original, management: { scope: '/fork', writable: true } },
  });
  assert.equal(nodes(curated, 'ManualPositionControl').length, 1);
  const advanced = module.exports.default({ exercise: exercises[0] });
  assert.equal(nodes(advanced, 'ManualPositionControl').length, 0);
});
