const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
async function runtime() {
  const chess = await import('chess.js');
  const mod = { exports: {} };
  new Function(
    'module',
    'exports',
    'require',
    ts.transpileModule(
      fs.readFileSync('src/lib/chess/practice-exploration.ts', 'utf8'),
      { compilerOptions: { module: ts.ModuleKind.CommonJS } }
    ).outputText
  )(mod, mod.exports, () => chess);
  return { ...chess, ...mod.exports };
}

async function extractionRuntime() {
  const chess = await import('chess.js');
  const mod = { exports: {} };
  new Function(
    'module',
    'exports',
    'require',
    ts.transpileModule(
      fs.readFileSync('src/lib/chess/beginner-tactic-extraction.ts', 'utf8'),
      {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2022,
        },
      }
    ).outputText
  )(mod, mod.exports, (name) => {
    assert.equal(
      name,
      'chess.js',
      'the extractor remains independent of data, UI and server modules'
    );
    return chess;
  });
  return { ...chess, ...mod.exports };
}

test('automatic extraction finds the motif-creating move after preparation without consuming the payoff', async () => {
  const { Chess, beginnerTacticFrames } = await extractionRuntime();
  const source = Object.freeze({
    fen: '8/8/2P5/8/4KN2/6r1/2k5/8 w - - 0 1',
    moves: Object.freeze(['Ke5', 'Kc1', 'Ne2+', 'Kd1', 'Nxg3']),
    outcome: 'fork',
  });
  const before = JSON.stringify(source);
  const result = beginnerTacticFrames(source, 'fork');
  assert.equal(result.detection, 'geometry');
  assert.equal(result.suggestedPly, 2);
  assert.deepEqual(
    result.positions.map(({ ply, move, detected }) => [ply, move, detected]),
    [
      [0, 'Ke5', false],
      [2, 'Ne2+', true],
      [4, 'Nxg3', false],
    ]
  );
  const board = new Chess(source.fen);
  board.move('Ke5');
  const beforeReply = board.fen();
  board.move('Kc1');
  assert.equal(result.positions[1].fen, board.fen());
  assert.deepEqual(result.positions[1].previousMove, {
    fen: beforeReply,
    move: 'Kc1',
  });
  assert.equal(JSON.stringify(source), before);
  assert.equal(
    beginnerTacticFrames(
      {
        fen: '2K5/8/6R1/5n2/4k3/2p5/8/8 b - - 0 1',
        moves: ['Ne7+', 'Kd8', 'Nxg6'],
        outcome: 'fork',
      },
      'fork'
    ).suggestedPly,
    0,
    'Black uses the same solver-relative indexing'
  );
  assert.equal(
    beginnerTacticFrames(
      {
        fen: '8/8/5R2/8/2K5/8/k7/4b2n w - - 0 1',
        moves: ['Rf1', 'Bf2', 'Rxh1'],
        outcome: 'fork',
      },
      'fork'
    ).suggestedPly,
    0,
    'a quiet line fork need not give check'
  );
});

test('shared geometry identifies pin, skewer, en passant discovery, promotion and actual mate leads', async () => {
  const { beginnerTacticFrames } = await extractionRuntime();
  const cases = [
    ['pin', '6Q1/8/8/8/8/2k2n2/8/2K5 w - - 0 1', ['Qg3', 'Kd4', 'Qxf3']],
    ['pin', '4k3/4n3/2p5/8/Q7/8/8/K3R3 w - - 0 1', ['Qxc6+', 'Kf8']],
    ['skewer', '3q4/8/8/3k3K/8/8/8/7R w - - 0 1', ['Rd1+', 'Ke6', 'Rxd8']],
    ['discovery', '8/8/8/R4pPk/8/8/8/K7 w - f6 0 2', ['gxf6+', 'Kh4', 'f7']],
    ['underpromotion', '8/k1P5/8/8/8/8/8/K7 w - - 0 1', ['c8=N+']],
    ['promotion', '8/k1P5/8/8/8/8/8/K7 w - - 0 1', ['c8=Q+']],
    ['checkmate', '7k/5Q2/6K1/8/8/8/8/8 w - - 0 1', ['Qg7#']],
  ];
  for (const [motif, fen, moves] of cases) {
    const result = beginnerTacticFrames(
      { fen, moves, outcome: 'manual' },
      motif
    );
    assert.equal(result.suggestedPly, 0, `${motif}: ${fen}`);
    assert.equal(result.detection, 'geometry');
    assert.equal(result.positions[0].fen, fen);
    assert.equal(
      result.positions[0].previousMove,
      undefined,
      'no preceding move is invented'
    );
  }
  const notMate = beginnerTacticFrames(
    {
      fen: '7k/5Q2/6K1/8/8/8/8/8 w - - 0 1',
      moves: ['Qg8+'],
      outcome: 'checkmate',
    },
    'checkmate'
  );
  assert.equal(
    notMate.suggestedPly,
    null,
    'a check is not a mating-move marker'
  );
});

test('future motifs reuse explicit anchors or manual frames while invalid source lines fail closed', async () => {
  const { Chess, beginnerTacticFrames } = await extractionRuntime();
  const source = {
    fen: '8/8/2P5/8/4KN2/6r1/2k5/8 w - - 0 1',
    moves: ['Ke5', 'Kc1', 'Ne2+', 'Kd1', 'Nxg3'],
    outcome: 'manual',
  };
  const unknown = beginnerTacticFrames(source, 'future-lesson');
  assert.equal(unknown.suggestedPly, null);
  assert.equal(unknown.detection, 'manual');
  assert.deepEqual(
    unknown.positions.map((position) => position.ply),
    [0, 2, 4]
  );
  const explicit = beginnerTacticFrames(
    { ...source, tacticPly: 2 },
    'future-lesson'
  );
  assert.equal(explicit.suggestedPly, 2);
  assert.equal(explicit.detection, 'explicit');
  assert.equal(explicit.positions[1].detected, true);
  for (const tacticPly of [-1, 1, 5, 1.5]) {
    const result = beginnerTacticFrames({ ...source, tacticPly }, 'fork');
    assert.deepEqual(result.positions, []);
    assert.equal(result.reason, 'invalid-tactic-ply');
  }
  assert.deepEqual(
    beginnerTacticFrames({ ...source, moves: [...source.moves, 'Ke8'] }, 'fork')
      .positions,
    [],
    'an illegal late move cannot leave an apparently valid early candidate'
  );
  assert.equal(
    beginnerTacticFrames({ ...source, moves: Array(121).fill('Ke5') }, 'fork')
      .reason,
    'invalid-line'
  );
  assert.equal(
    beginnerTacticFrames({ ...source, fen: 'invalid' }, 'fork').reason,
    'invalid-fen'
  );
  const before = '7k/3p4/8/4P3/8/8/8/K7 b - - 0 1';
  const board = new Chess(before);
  board.move('d5');
  const contextual = {
    fen: board.fen(),
    moves: ['exd6'],
    outcome: 'manual',
    previousMove: { fen: before, move: 'd5' },
  };
  const result = beginnerTacticFrames(contextual, 'future-lesson');
  assert.deepEqual(result.positions[0].previousMove, contextual.previousMove);
  assert.equal(result.positions[0].move, 'exd6');
  assert.equal(
    result.positions.length,
    1,
    'the opponent move remains outside the teaching line'
  );
  assert.deepEqual(
    beginnerTacticFrames(
      { ...contextual, previousMove: { fen: before, move: 'd6' } },
      'future-lesson'
    ).positions,
    []
  );
});

test('generic Beginner import requires an owner anchor and imports its exact frame without leaking preview edits', async () => {
  const chess = await import('chess.js');
  const load = (file, dependency, globals = {}) => {
    const mod = { exports: {} };
    new Function(
      'module',
      'exports',
      'require',
      ...Object.keys(globals),
      ts.transpileModule(fs.readFileSync(file, 'utf8'), {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2022,
          jsx: ts.JsxEmit.ReactJSX,
          esModuleInterop: true,
        },
      }).outputText
    )(mod, mod.exports, dependency, ...Object.values(globals));
    return mod.exports;
  };
  const trainer = load('src/lib/chess/draw-trainer.ts', (name) =>
    name === 'chess.js' ? chess : {}
  );
  const makeCandidate = (id, sourceTitle, moves) => {
    const board = new chess.Chess(),
      positions = [];
    let previousMove;
    for (const [ply, san] of moves.entries()) {
      const fen = board.fen();
      if (ply % 2 === 0)
        positions.push({
          ply,
          move: san,
          sourceKind: 'game',
          entry: {
            themeId: 'futureLesson',
            level: 'Beginner',
            goal: 'material',
            fen,
            moves: [],
            alternativeLines: [],
            solution: '',
            title: sourceTitle,
            reference: { id, kind: 'game', collection: 'fork', branch: 0, ply },
            ...(previousMove ? { previousMove } : {}),
            beginnerOriginalFen: fen,
            beginnerSourceLevel: 'B',
          },
        });
      const move = board.move(san);
      assert.ok(move);
      previousMove = { fen, move: move.san };
    }
    return {
      id,
      sourceTitle,
      sourceKind: 'game',
      pieceCount: 32,
      suggestedPly: null,
      detection: 'manual',
      entry: positions[0].entry,
      positions,
    };
  };
  const first = makeCandidate('first-source', 'First source', [
    'e4',
    'e5',
    'Nf3',
    'Nc6',
    'Bb5',
  ]);
  const second = makeCandidate('second-source', 'Second source', [
    'd4',
    'd5',
    'c4',
    'e6',
    'Nc3',
  ]);
  const bank = {
    candidates: [first, second],
    suggestedCount: 2,
    sourceSnapshot: 'unchanged-source',
    writable: true,
    topic: {
      themeId: 'futureLesson',
      label: 'Future lesson',
      scope: '/tactic-positions?theme=futureLesson',
    },
  };
  const before = structuredClone(bank),
    writes = [],
    reads = [],
    routes = [];
  const state = [],
    effects = [];
  let cursor = 0,
    tree;
  const jsx = (type, props) => ({ type, props });
  const same = (a, b) =>
    a &&
    b &&
    a.length === b.length &&
    a.every((value, index) => Object.is(value, b[index]));
  const memo = (factory, dependencies) => {
    const index = cursor++;
    if (!state[index] || !same(state[index].dependencies, dependencies))
      state[index] = { dependencies, value: factory() };
    return state[index].value;
  };
  const router = {
    asPath: bank.topic.scope,
    push: async (href) => routes.push(href),
    reload: () => routes.push('reload'),
  };
  const component = load(
    'src/components/BeginnerTacticImport.tsx',
    (name) => {
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
      if (name === 'react')
        return {
          useState(initial) {
            const index = cursor++;
            if (!(index in state))
              state[index] =
                typeof initial === 'function' ? initial() : initial;
            return [
              state[index],
              (value) => {
                state[index] =
                  typeof value === 'function' ? value(state[index]) : value;
              },
            ];
          },
          useRef(current) {
            const index = cursor++;
            if (!(index in state)) state[index] = { current };
            return state[index];
          },
          useMemo: memo,
          useCallback: (callback, dependencies) =>
            memo(() => callback, dependencies),
          useEffect(effect, dependencies) {
            const index = cursor++,
              old = state[index];
            if (!old || !same(old.dependencies, dependencies)) {
              const entry = { dependencies };
              state[index] = entry;
              effects.push(() => {
                old?.cleanup?.();
                entry.cleanup = effect();
              });
            }
          },
        };
      if (name === 'next/router') return { useRouter: () => router };
      if (name === 'chess.js') return chess;
      if (name.endsWith('/draw-trainer')) return trainer;
      if (name.endsWith('/manual-tactics'))
        return load('src/lib/chess/manual-tactics.ts', () => ({}));
      if (name.endsWith('/practice-access'))
        return {
          practiceAccessHeaders: () => ({ 'x-test-access': 'authorized' }),
        };
      if (name.endsWith('/usePracticeBoardTools'))
        return { usePracticeBoardTools: () => ({}) };
      if (name.endsWith('/PracticeBoard'))
        return {
          __esModule: true,
          default: 'PracticeBoard',
          PreviousMoveControl: 'PreviousMoveControl',
        };
      if (name.endsWith('/PracticePositionEditor'))
        return { PracticePositionDialog: 'PracticePositionDialog' };
      if (name.endsWith('/PracticePositionSetup'))
        return { __esModule: true, default: 'PracticePositionSetup' };
      if (name.endsWith('.module.css')) return {};
      throw new Error(`Unexpected generic-import dependency: ${name}`);
    },
    {
      document: {
        body: { style: { overflow: '' } },
        activeElement: { focus() {} },
      },
      ResizeObserver: class {
        observe() {}
        disconnect() {}
      },
      fetch: async (url, options) => {
        if (url.startsWith('/api/beginner-tactic-candidates?scope=')) {
          reads.push(url);
          return { ok: true, json: async () => structuredClone(bank) };
        }
        assert.equal(url, '/api/manual-tactics');
        assert.equal(options.method, 'POST');
        writes.push(JSON.parse(options.body));
        return {
          ok: true,
          status: 200,
          json: async () => ({
            href: '/tactic-positions?theme=futureLesson&level=Beginner&exercise=added',
          }),
        };
      },
    }
  ).default;
  const nodes = (node, type) =>
    !node || typeof node !== 'object'
      ? []
      : Array.isArray(node)
        ? node.flatMap((child) => nodes(child, type))
        : [
            ...(node.type === type ? [node] : []),
            ...nodes(node.props?.children, type),
          ];
  const text = (node) =>
    typeof node === 'string' || typeof node === 'number'
      ? String(node)
      : Array.isArray(node)
        ? node.map(text).join('')
        : node?.props
          ? text(node.props.children)
          : '';
  const button = (prefix) =>
    nodes(tree, 'button').find((node) => text(node).startsWith(prefix)).props;
  const frameSelect = () =>
    nodes(tree, 'select').find(
      (node) => node.props['aria-label'] === 'Chọn nước tạo đòn chiến thuật'
    ).props;
  const checkbox = () =>
    nodes(tree, 'input').find(
      (node) => node.props['aria-label'] === 'Chọn thế 1'
    ).props;
  const shownBoard = () => nodes(tree, 'PracticeBoard')[0].props;
  const render = () => {
    cursor = 0;
    tree = component({
      writable: true,
      scope: bank.topic.scope,
      exercises: [{ manualId: 'authored' }, { fen: 'curated' }],
    });
    for (const node of [...nodes(tree, 'dialog'), ...nodes(tree, 'div')])
      if (node.props.ref)
        node.props.ref.current = { showModal() {}, close() {}, focus() {} };
    while (effects.length) effects.shift()();
  };
  const settle = async () => {
    await new Promise((resolve) => setImmediate(resolve));
    render();
  };
  render();
  button('Lấy thế cờ').onClick();
  render();
  await settle();
  assert.equal(checkbox().disabled, true);
  assert.equal(button('Xác nhận thêm').disabled, true);
  button('Chọn tất cả').onClick();
  render();
  assert.equal(
    checkbox().checked,
    false,
    'bulk selection does not select unidentified anchors'
  );
  await button('Xác nhận thêm').onClick();
  await settle();
  assert.equal(writes.length, 0, 'an unchosen anchor cannot be posted');

  frameSelect().onChange({ target: { value: '2' } });
  render();
  assert.equal(checkbox().disabled, false);
  assert.equal(shownBoard().fen, first.positions[1].entry.fen);
  checkbox().onChange({ target: { checked: true } });
  render();
  button('Chỉnh sửa thế cờ đang xem').onClick();
  render();
  const editedBoard = new chess.Chess(first.positions[1].entry.fen);
  editedBoard.remove('a2');
  const editedFen = editedBoard.fen();
  nodes(tree, 'PracticePositionSetup')[0].props.onConfirm(editedFen);
  render();
  assert.equal(shownBoard().fen, editedFen);

  button('2. Second source').onClick();
  render();
  frameSelect().onChange({ target: { value: '2' } });
  render();
  assert.equal(
    shownBoard().fen,
    second.positions[1].entry.fen,
    'same ply in another candidate has independent edits'
  );
  button('1. First source').onClick();
  render();
  assert.equal(
    shownBoard().fen,
    editedFen,
    'returning to the edited candidate and ply retains its draft'
  );
  frameSelect().onChange({ target: { value: '4' } });
  render();
  const selectedEntry = first.positions[2].entry;
  assert.equal(
    shownBoard().fen,
    selectedEntry.fen,
    'switching anchors does not inherit the other FEN edit'
  );
  const previous = nodes(tree, 'PreviousMoveControl')[0].props;
  assert.deepEqual(previous.previousMove, selectedEntry.previousMove);
  previous.onToggle();
  render();
  assert.equal(shownBoard().fen, selectedEntry.previousMove.fen);
  assert.equal(button('Chỉnh sửa thế cờ đang xem').disabled, true);
  assert.equal(button('Xác nhận thêm').disabled, false);
  await button('Xác nhận thêm').onClick();
  await settle();
  assert.equal(writes.length, 1);
  assert.equal(
    writes[0].fen,
    selectedEntry.fen,
    'context preview cannot replace the selected exercise FEN'
  );
  assert.deepEqual(writes[0].previousMove, selectedEntry.previousMove);
  assert.deepEqual(writes[0].reference, selectedEntry.reference);
  assert.equal(writes[0].expectedUpdatedAt, null);
  assert.deepEqual(writes[0].moves, []);
  assert.equal(routes.length, 1);
  assert.ok(
    reads.every((url) => url.includes(encodeURIComponent(bank.topic.scope)))
  );
  await button('Thêm thế cờ Nhập môn').onClick();
  await settle();
  const blankDialog = nodes(tree, 'PracticePositionDialog')[0].props;
  assert.deepEqual(blankDialog.insertionTargets, ['authored', 'curated']);
  assert.equal(blankDialog.defaults.themeId, bank.topic.themeId);
  assert.equal(blankDialog.defaults.level, 'Beginner');
  assert.deepEqual(
    bank,
    before,
    'preview selection does not mutate the source response'
  );
});

test('viewing the preceding move is read-only context and preserves free-play branches', async () => {
  const chess = await import('chess.js');
  const load = (file, dependency) => {
    const mod = { exports: {} };
    new Function(
      'module',
      'exports',
      'require',
      ts.transpileModule(fs.readFileSync(file, 'utf8'), {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2022,
          jsx: ts.JsxEmit.ReactJSX,
          esModuleInterop: true,
        },
      }).outputText
    )(mod, mod.exports, dependency);
    return mod.exports;
  };
  const exploration = await runtime();
  const trainer = load('src/lib/chess/draw-trainer.ts', (name) =>
    name === 'chess.js' ? chess : {}
  );
  const state = [];
  let cursor = 0;
  const jsx = (type, props) => ({ type, props });
  const component = load('src/components/PracticeExploration.tsx', (name) => {
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if (name === 'react')
      return {
        useState(initial) {
          const index = cursor++;
          if (!(index in state))
            state[index] = typeof initial === 'function' ? initial() : initial;
          return [
            state[index],
            (value) => {
              state[index] =
                typeof value === 'function' ? value(state[index]) : value;
            },
          ];
        },
        useRef(current) {
          const index = cursor++;
          if (!(index in state)) state[index] = { current };
          return state[index];
        },
        useMemo: (factory) => factory(),
        useEffect() {},
      };
    if (name.endsWith('/draw-trainer')) return trainer;
    if (name.endsWith('/practice-exploration')) return exploration;
    if (name.endsWith('/usePracticeBoardTools'))
      return { usePracticeBoardTools: () => ({}) };
    if (name.endsWith('/PracticeBoard'))
      return {
        __esModule: true,
        default: 'PracticeBoard',
        PreviousMoveControl: 'PreviousMoveControl',
      };
    return name;
  }).default;
  const nodes = (tree, type) =>
    !tree || typeof tree !== 'object'
      ? []
      : Array.isArray(tree)
        ? tree.flatMap((child) => nodes(child, type))
        : [
            ...(tree.type === type ? [tree] : []),
            ...nodes(tree.props?.children, type),
          ];
  const before = '7k/3p4/8/4P3/8/8/8/K7 b - - 0 1';
  const board = new chess.Chess(before);
  board.move('d5');
  const props = {
    fen: board.fen(),
    moves: [],
    initialPly: 0,
    orientation: 'white',
    freePlay: true,
    onClose() {},
    previousMove: { fen: before, move: 'd5' },
  };
  const original = structuredClone({
    fen: props.fen,
    moves: props.moves,
    previousMove: props.previousMove,
  });
  const render = () => {
    cursor = 0;
    return component(props);
  };
  let tree = render();
  let shown = nodes(tree, 'PracticeBoard')[0].props;
  assert.equal(shown.fen, props.fen);
  assert.ok(shown.squareStyles.d7 && shown.squareStyles.d5);
  nodes(tree, 'PreviousMoveControl')[0].props.onToggle();
  tree = render();
  shown = nodes(tree, 'PracticeBoard')[0].props;
  assert.equal(shown.fen, before);
  assert.equal(shown.canMove, false);
  assert.equal(shown.onPieceDrop('d7', 'd5'), false);
  nodes(tree, 'PreviousMoveControl')[0].props.onToggle();
  tree = render();
  shown = nodes(tree, 'PracticeBoard')[0].props;
  assert.equal(shown.fen, props.fen);
  assert.equal(shown.canMove, true);
  assert.equal(
    shown.onPieceDrop('e5', 'd6'),
    true,
    'the en passant reply remains the first learner move'
  );
  board.move('exd6');
  tree = render();
  assert.equal(nodes(tree, 'PracticeBoard')[0].props.fen, board.fen());
  nodes(tree, 'PreviousMoveControl')[0].props.onToggle();
  tree = render();
  assert.equal(nodes(tree, 'PracticeBoard')[0].props.fen, before);
  nodes(tree, 'PreviousMoveControl')[0].props.onToggle();
  tree = render();
  assert.equal(
    nodes(tree, 'PracticeBoard')[0].props.fen,
    board.fen(),
    'viewing context preserves the explored line'
  );
  assert.deepEqual(
    { fen: props.fen, moves: props.moves, previousMove: props.previousMove },
    original
  );
  delete props.previousMove;
  assert.equal(
    nodes(render(), 'PreviousMoveControl').length,
    0,
    'no historical move is invented'
  );
});
test('Beginner piece setup is free arrangement with strict save validation', async () => {
  const chess = await import('chess.js');
  const mod = { exports: {} };
  new Function(
    'module',
    'exports',
    'require',
    ts.transpileModule(
      fs.readFileSync('src/lib/chess/position-setup.ts', 'utf8'),
      {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2020,
        },
      }
    ).outputText
  )(mod, mod.exports, () => chess);
  const { setupFromFen, setupToFen, changeSetupPiece, validateSetupFen } =
    mod.exports;
  const initial = new chess.Chess().fen();
  assert.equal(validateSetupFen(initial), initial);
  let board = setupFromFen(initial);
  board = changeSetupPiece(board, 'e4', 'wP', 'e2');
  assert.equal(board.turn, 'w', 'arranging a piece does not play a move');
  assert.equal(board.pieces.e2, undefined);
  assert.equal(board.pieces.e4, 'wP');
  assert.equal(board.castling, 'KQkq');
  board = changeSetupPiece(board, 'd3', 'wK');
  assert.equal(
    board.pieces.e1,
    undefined,
    'placing King relocates the existing King'
  );
  assert.equal(board.pieces.d3, 'wK');
  assert.equal(
    board.castling,
    'kq',
    'moving King removes only its castling rights'
  );
  assert.throws(
    () => validateSetupFen('8/8/8/8/8/8/8/8 w - - 0 1'),
    /đúng một Vua/
  );
  assert.throws(
    () => validateSetupFen('8/8/8/8/8/8/4k3/4K3 w - - 0 1'),
    /cạnh nhau/
  );
  assert.throws(() => validateSetupFen('7k/8/8/8/8/8/8/P5K1 w - - 0 1'), /Tốt/);
  assert.throws(
    () => validateSetupFen('7k/8/8/8/8/8/8/K7 w K - 0 1'),
    /nhập thành/
  );
  assert.throws(
    () => validateSetupFen('7k/8/8/8/8/8/8/K7 w - e6 0 1'),
    /qua đường/
  );
  assert.throws(
    () => validateSetupFen('7k/8/8/8/8/8/8/K6R w - - 0 1'),
    /chưa đến lượt/
  );
  assert.equal(
    validateSetupFen('7k/8/8/3pP3/8/8/8/K7 w - d6 0 2').split(' ')[3],
    'd6'
  );
  const incomplete = changeSetupPiece(
    setupFromFen('7k/8/8/8/8/8/8/K7 w - - 0 1'),
    'a1'
  );
  assert.ok(
    setupToFen(incomplete).startsWith('7k/'),
    'incomplete arrangements can be edited'
  );
  assert.throws(() => validateSetupFen(setupToFen(incomplete)), /đúng một Vua/);
});
test('revisit the opponent decision without modifying the saved exercise', async () => {
  const { explorationStartPly, explorationPosition, exploreMove } =
    await runtime();
  const e = require('../src/lib/chess/skewer-exercises.json').find((e) =>
    e.title.includes('Djurhuus')
  );
  const seen = Object.freeze(e.moves.slice(0, 2));
  assert.equal(explorationStartPly(seen, false), 1);
  assert.equal(explorationStartPly(seen, true), 2);
  assert.equal(explorationStartPly([], false), 0);
  assert.equal(explorationStartPly(e.moves, false), 5);
  const start = explorationPosition(e.fen, seen, 1);
  assert.equal(start.turn(), 'w');
  const alternative = exploreMove(e.fen, seen, 1, { from: 'f1', to: 'g2' });
  assert.deepEqual(alternative, ['Rd1+', 'Kg2']);
  assert.deepEqual(seen, ['Rd1+', 'Ke2']);
  assert.equal(explorationPosition(e.fen, seen, 2).get('e2').type, 'k');
  assert.equal(explorationPosition(e.fen, alternative, 2).get('g2').type, 'k');
  assert.equal(exploreMove(e.fen, seen, 1, { from: 'f1', to: 'f4' }), null);
});
test('retains repetition history and supports castling, en passant, and underpromotion', async () => {
  const { Chess, explorationPosition, exploreMove } = await runtime();
  const initial = new Chess().fen();
  const cycle = ['Nf3', 'Nf6', 'Ng1', 'Ng8', 'Nf3', 'Nf6', 'Ng1', 'Ng8'];
  assert.equal(
    explorationPosition(initial, cycle, 8).in_threefold_repetition(),
    true
  );
  assert.equal(
    explorationPosition(initial, cycle, 4).in_threefold_repetition(),
    false
  );
  assert.deepEqual(
    exploreMove('4k3/8/8/8/8/8/8/4K2R w K - 0 1', [], 0, {
      from: 'e1',
      to: 'g1',
    }),
    ['O-O']
  );
  assert.deepEqual(
    exploreMove('7k/8/8/3pP3/8/8/8/K7 w - d6 0 2', [], 0, {
      from: 'e5',
      to: 'd6',
    }),
    ['exd6']
  );
  assert.deepEqual(
    exploreMove('8/k1P5/8/8/8/8/8/K7 w - - 0 1', [], 0, {
      from: 'c7',
      to: 'c8',
      promotion: 'n',
    }),
    ['c8=N+']
  );
  assert.throws(() => explorationPosition(initial, [], -1));
  assert.throws(() => explorationPosition(initial, [], 1));
});
test('terminal positions cannot accept moves', async () => {
  const { exploreMove } = await runtime();
  assert.equal(
    exploreMove('7k/6Q1/6K1/8/8/8/8/8 b - - 0 1', [], 0, {
      from: 'h8',
      to: 'h7',
    }),
    null
  );
  assert.equal(
    exploreMove('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1', [], 0, {
      from: 'h8',
      to: 'h7',
    }),
    null
  );
});
test('recording extends lines, branches from earlier moves, and revisits existing variants without overwriting', async () => {
  const {
    Chess,
    recordVariationMove,
    recordedVariationLines,
    formatPracticeVariation,
  } = await runtime();
  const fen = new Chess().fen();
  let state = { lines: [[]], branchIndex: 0, ply: 0 };
  const play = (move) => {
    const result = recordVariationMove(fen, state, move);
    assert.equal(result.status, 'recorded');
    state = result.state;
  };
  play('e4');
  play('e5');
  play('Nf3');
  const first = [...state.lines[0]];
  state = { ...state, ply: 1 };
  play('c5');
  play('Nf3');
  state = { ...state, ply: 0 };
  play('d4');
  play('d5');
  play('c4');
  assert.deepEqual(state.lines, [
    ['e4', 'e5', 'Nf3'],
    ['e4', 'c5', 'Nf3'],
    ['d4', 'd5', 'c4'],
  ]);
  assert.deepEqual(first, state.lines[0]);
  state = { ...state, branchIndex: 0, ply: 1 };
  play('c5');
  assert.equal(state.branchIndex, 1);
  assert.equal(state.ply, 2);
  assert.equal(state.lines.length, 3);
  const parent = Object.freeze(
    state.lines.map((line) => Object.freeze([...line]))
  );
  const result = recordVariationMove(
    fen,
    { ...state, lines: parent, ply: 2 },
    'Nc3'
  );
  assert.equal(result.status, 'recorded');
  assert.equal(parent[1].at(-1), 'Nf3');
  const confirmed = recordedVariationLines([
    ...state.lines,
    [],
    [...state.lines[0]],
  ]);
  assert.equal(confirmed.length, 3);
  assert.notEqual(confirmed[0], state.lines[0]);
  confirmed[0].push('Nc6');
  assert.deepEqual(state.lines[0], first);
  assert.equal(
    formatPracticeVariation(
      '2r2rk1/2q2pp1/p2bp3/1p1b2Qp/2nN4/P2B1P1P/1PP2BP1/1K1RR3 b - - 5 21',
      ['Nxb2', 'Nf5', 'exf5']
    ),
    '21… Nxb2 22. Nf5 22… exf5'
  );
});
test('recording bounds and special moves preserve legal position history', async () => {
  const {
    Chess,
    recordVariationMove,
    MAX_RECORDED_VARIATIONS,
    MAX_VARIATION_PLIES,
  } = await runtime();
  const fen = new Chess().fen();
  const lines = [
    'a3',
    'a4',
    'b3',
    'b4',
    'c3',
    'c4',
    'd3',
    'd4',
    'e3',
    'e4',
    'f3',
    'f4',
  ].map((move) => [move]);
  assert.equal(lines.length, MAX_RECORDED_VARIATIONS);
  assert.equal(
    recordVariationMove(fen, { lines, branchIndex: 0, ply: 0 }, 'Nf3').status,
    'line-limit'
  );
  assert.equal(
    recordVariationMove(fen, { lines, branchIndex: 0, ply: 0 }, 'b3').status,
    'recorded'
  );
  const long = Array.from(
    { length: MAX_VARIATION_PLIES },
    (_, i) => ['Nf3', 'Nf6', 'Ng1', 'Ng8'][i % 4]
  );
  assert.equal(
    recordVariationMove(
      fen,
      { lines: [long], branchIndex: 0, ply: long.length },
      'Nf3'
    ).status,
    'move-limit'
  );
  assert.equal(
    recordVariationMove(fen, { lines: [[]], branchIndex: 0, ply: 0 }, 'e5')
      .status,
    'illegal'
  );
  for (const [start, move, expected] of [
    ['4k3/8/8/8/8/8/8/4K2R w K - 0 1', { from: 'e1', to: 'g1' }, 'O-O'],
    ['7k/8/8/3pP3/8/8/8/K7 w - d6 0 2', { from: 'e5', to: 'd6' }, 'exd6'],
    [
      '8/k1P5/8/8/8/8/8/K7 w - - 0 1',
      { from: 'c7', to: 'c8', promotion: 'n' },
      'c8=N+',
    ],
  ]) {
    const result = recordVariationMove(
      start,
      { lines: [[]], branchIndex: 0, ply: 0 },
      move
    );
    assert.equal(result.status, 'recorded');
    assert.deepEqual(result.state.lines, [[expected]]);
  }
});
