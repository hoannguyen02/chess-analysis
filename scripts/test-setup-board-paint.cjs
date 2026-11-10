const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const ts = require('typescript');

function harness(orientation = 'white', callbacks = {}) {
  const refs = [];
  let cursor = 0;
  let effects = [];
  let drag = { item: null, isDragging: false, offset: null };
  const painted = [];
  const element = {
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 800 }),
    setPointerCapture() {},
    releasePointerCapture() {},
  };
  const module = { exports: {} };
  const source = ts.transpileModule(
    fs.readFileSync('src/components/SetupBoardPaintLayer.tsx', 'utf8'),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
      },
    }
  ).outputText;
  new Function('require', 'module', 'exports', source)(
    (name) => {
      if (name === 'react')
        return {
          useRef: (initial) => (refs[cursor++] ??= { current: initial }),
          useEffect: (effect) => effects.push(effect),
        };
      if (name === 'react-dnd') return { useDragLayer: () => drag.isDragging };
      if (name === 'react/jsx-runtime')
        return {
          jsx: (type, props) => ({ type, props }),
          jsxs: (type, props) => ({ type, props }),
        };
      throw new Error(name);
    },
    module,
    module.exports
  );
  const render = (enabled = false) => {
    cursor = 0;
    effects = [];
    const tree = module.exports.SetupBoardPaintLayer({
      orientation,
      enabled,
      occupiedSquares: new Set(),
      onPaint: (square, piece) => painted.push([square, piece]),
      label: (square) => square,
      ...callbacks,
    });
    effects.forEach((effect) => effect());
    return tree.props;
  };
  return {
    painted,
    render,
    drag: (x, y, isSpare = true) => {
      drag = {
        item: { piece: 'wR', isSpare, id: 'ManualBoardEditor' },
        isDragging: true,
        offset: { x, y },
      };
      return render();
    },
    end: () => {
      drag = { item: null, isDragging: false, offset: null };
      return render(true);
    },
    pointer: (x, y) => ({
      button: 0,
      pointerId: 1,
      clientX: x,
      clientY: y,
      currentTarget: element,
      preventDefault() {},
    }),
  };
}

test('tray and existing-piece drags never paint squares along their path', () => {
  const h = harness();
  for (const isSpare of [true, false]) {
    h.drag(50, -50, isSpare);
    h.drag(50, 50, isSpare);
    h.drag(450, 50, isSpare);
    h.end();
  }
  assert.deepEqual(h.painted, []);
});

test('board painting respects flipped orientation and visits squares once', () => {
  const h = harness('black');
  h.render(true).onPointerDown(h.pointer(50, 50));
  h.render(true).onPointerMove(h.pointer(250, 50));
  h.render(true).onPointerMove(h.pointer(50, 50));
  h.render(true).onPointerUp(h.pointer(50, 50));
  assert.deepEqual(
    h.painted.map(([square]) => square),
    ['h1', 'g1', 'f1']
  );
});

test('pointer painting still works after a tray drag finishes', () => {
  const h = harness();
  h.drag(50, 50);
  const props = h.end();
  assert.equal(props.children[8].props.style.pointerEvents, 'auto');
  props.onPointerDown(h.pointer(50, 150));
  h.render(true).onPointerMove(h.pointer(250, 150));
  h.render(true).onPointerUp(h.pointer(350, 150));
  assert.deepEqual(
    h.painted.map(([square]) => square),
    ['a7', 'b7', 'c7', 'd7']
  );
  h.render(true).onPointerMove(h.pointer(550, 150));
  assert.equal(h.painted.length, 4);
});

test('each pointer stroke ends once, including cancellation and lost capture', () => {
  const events = [];
  const h = harness('white', {
    onStrokeStart: () => events.push('start'),
    onStrokeEnd: () => events.push('end'),
  });
  let layer = h.render(true);
  layer.onPointerDown(h.pointer(50, 150));
  layer.onPointerUp(h.pointer(250, 150));
  layer.onLostPointerCapture();
  assert.deepEqual(events, ['start', 'end']);
  layer = h.render(true);
  layer.onPointerDown(h.pointer(50, 250));
  layer.onPointerCancel();
  layer.onLostPointerCapture();
  assert.deepEqual(events, ['start', 'end', 'start', 'end']);
});

async function beginnerSetupHarness() {
  const chess = await import('chess.js');
  const load = (file, dependency) => {
    const mod = { exports: {} };
    new Function(
      'require',
      'module',
      'exports',
      ts.transpileModule(fs.readFileSync(file, 'utf8'), {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2020,
          jsx: ts.JsxEmit.ReactJSX,
          esModuleInterop: true,
        },
      }).outputText
    )(dependency, mod, mod.exports);
    return mod.exports;
  };
  const setup = load('src/lib/chess/position-setup.ts', () => chess);
  const cells = [],
    saved = [];
  let cursor = 0,
    closed = 0;
  const component = load('src/components/PracticePositionSetup.tsx', (name) => {
    if (name === 'react')
      return {
        useRef(initial) {
          const i = cursor++;
          return (cells[i] ??= { current: initial });
        },
        useState(initial) {
          const i = cursor++;
          if (!(i in cells))
            cells[i] = typeof initial === 'function' ? initial() : initial;
          return [
            cells[i],
            (value) => {
              cells[i] = typeof value === 'function' ? value(cells[i]) : value;
            },
          ];
        },
        useEffect() {},
      };
    if (name === 'react/jsx-runtime')
      return {
        jsx: (type, props) => ({ type, props }),
        jsxs: (type, props) => ({ type, props }),
      };
    if (name.endsWith('/position-setup')) return setup;
    if (name.endsWith('/usePracticeBoardTools'))
      return { usePracticeBoardTools: () => ({}) };
    if (name === 'react-chessboard') return { SparePiece: 'SparePiece' };
    if (name === 'react-icons/fi') return require(name);
    if (name === './PracticeBoard')
      return { __esModule: true, default: 'PracticeBoard' };
    if (name === './SetupBoardDnDProvider')
      return { SetupBoardDnDProvider: 'SetupBoardDnDProvider' };
    if (name === './SetupBoardPaintLayer')
      return { SetupBoardPaintLayer: 'SetupBoardPaintLayer' };
    if (name.endsWith('.module.css')) return { default: {} };
    throw new Error(name);
  }).default;
  const fen = '7k/8/8/8/8/8/8/K7 w - - 0 1';
  const render = () => {
    cursor = 0;
    return component({
      fen,
      hasLines: true,
      onConfirm: (value) => saved.push(value),
      onClose: () => closed++,
    });
  };
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
    typeof node === 'string'
      ? node
      : Array.isArray(node)
        ? node.map(text).join('')
        : node?.props
          ? text(node.props.children)
          : '';
  return {
    fen,
    saved,
    setup,
    closed: () => closed,
    board: () => nodes(render(), 'PracticeBoard')[0].props,
    paint: () => nodes(render(), 'SetupBoardPaintLayer')[0].props,
    click(label) {
      const button = nodes(render(), 'button').find(
        (node) => node.props['aria-label'] === label || text(node) === label
      );
      assert.ok(button, label);
      assert.ok(!button.props.disabled, label);
      button.props.onClick();
    },
    selected: (label) =>
      nodes(render(), 'button').find(
        (node) => node.props['aria-label'] === label
      )?.props['aria-pressed'],
  };
}

test('Beginner setup retains every square in a batched sweep and undoes the whole stroke', async () => {
  const h = await beginnerSetupHarness();
  h.click('Tốt Trắng');
  assert.equal(
    h.board().canMove,
    true,
    'selected palette pieces do not disable existing-piece drags'
  );
  const layer = h.paint();
  assert.equal(layer.enabled, true);
  layer.onStrokeStart();
  // A quick pointer sweep can invoke all these callbacks before React renders.
  ['a2', 'b2', 'c2', 'd2', 'a1'].forEach(layer.onPaint);
  layer.onStrokeEnd();
  const position = h.setup.setupFromFen(h.board().fen);
  for (const square of ['a2', 'b2', 'c2', 'd2'])
    assert.equal(position.pieces[square], 'wP');
  assert.equal(position.pieces.a1, 'wK', 'sweeps leave existing pieces intact');
  assert.deepEqual(h.saved, [], 'setup is a draft until Apply');
  h.click('Hoàn tác');
  assert.equal(h.board().fen, h.fen);
});

test('Beginner tray drops keep the tool active while existing pieces can move, be removed, flipped and undone', async () => {
  const h = await beginnerSetupHarness();
  h.board().onSparePieceDrop('wN', 'c3');
  assert.equal(h.selected('Mã Trắng'), true);
  assert.equal(h.paint().enabled, true);
  const sweep = h.paint();
  sweep.onStrokeStart();
  sweep.onPaint('b1');
  sweep.onPaint('c1');
  sweep.onStrokeEnd();
  assert.equal(h.board().onPieceDrop('c3', 'd5', 'wN'), true);
  assert.equal(h.board().position.c3, undefined);
  assert.equal(h.board().position.d5, 'wN');
  assert.equal(h.selected('Mã Trắng'), true);
  const before = h.board().fen;
  assert.equal(h.board().onPieceDrop('d5', 'd5', 'wN'), false);
  assert.equal(h.board().fen, before);
  h.board().onPieceDropOffBoard('d5');
  assert.equal(h.board().position.d5, undefined);
  h.click('Hoàn tác');
  assert.equal(h.board().position.d5, 'wN');
  h.click('Lật bàn');
  assert.equal(h.board().orientation, 'black');
  assert.equal(h.paint().orientation, 'black');
  h.click('Di chuyển quân');
  assert.equal(h.paint().enabled, false);
  h.click('Áp dụng thế cờ');
  assert.equal(h.saved[0], h.setup.validateSetupFen(h.board().fen));
  h.click('Hủy');
  assert.equal(h.closed(), 1);
});

// Use the real providers and hooks: mocking useDragLayer hides mismatched
// React contexts between react-chessboard's bundle and the app's react-dnd.
test('real chessboard provider shares its manager with the paint layer on mouse and touch', async () => {
  const React = require('react');
  const { renderToString } = require('react-dom/server');
  const chessboard = require('react-chessboard');
  const dnd = await import('react-dnd');
  const backend = await import('react-dnd-html5-backend');
  const dependencies = {
    react: React,
    'react/jsx-runtime': require('react/jsx-runtime'),
    'react-chessboard': chessboard,
    'react-dnd': dnd,
    'react-dnd-html5-backend': backend,
  };
  const load = (file) => {
    const module = { exports: {} };
    const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
      },
    }).outputText;
    new Function('require', 'module', 'exports', source)(
      (name) => dependencies[name],
      module,
      module.exports
    );
    return module.exports;
  };
  const { SetupBoardDnDProvider } = load(
    'src/components/SetupBoardDnDProvider.tsx'
  );
  const { SetupBoardPaintLayer } = load(
    'src/components/SetupBoardPaintLayer.tsx'
  );
  const key = Symbol.for('__REACT_DND_CONTEXT_INSTANCE__');
  const previousWindow = global.window;
  const previousImage = global.Image;
  global.Image = class Image {};
  const previousManager = global[key];
  try {
    for (const { touch, explicitContext } of [
      { touch: false, explicitContext: false },
      { touch: true, explicitContext: false },
      { touch: false, explicitContext: true },
      { touch: true, explicitContext: true },
    ]) {
      global.window = touch ? { ontouchstart: null } : {};
      delete global[key];
      const context = explicitContext ? global.window : undefined;
      const managerContext = context || global;
      let boardManager;
      let appManager;
      // This probe sits inside the bundled provider, before the app provider.
      function CaptureBoardManager({ children }) {
        boardManager = managerContext[key].dragDropManager;
        return children;
      }
      function CaptureAppManager() {
        appManager = dnd.useDragDropManager();
        return null;
      }
      const html = renderToString(
        React.createElement(
          chessboard.ChessboardDnDProvider,
          { context },
          React.createElement(
            CaptureBoardManager,
            null,
            React.createElement(
              SetupBoardDnDProvider,
              { context },
              React.createElement(CaptureAppManager),
              React.createElement(chessboard.SparePiece, {
                piece: 'wR',
                width: 60,
                dndId: 'ManualBoardEditor',
              }),
              React.createElement(SetupBoardPaintLayer, {
                orientation: 'white',
                occupiedSquares: new Set(),
                enabled: false,
                onPaint() {},
                label: (square) => square,
              })
            )
          )
        )
      );
      assert.equal(
        appManager,
        boardManager,
        'both contexts must use the same drag manager'
      );
      assert.match(html, /aria-label="a8"/);
      assert.equal((html.match(/<button/g) || []).length, 64);
    }
  } finally {
    if (previousImage === undefined) delete global.Image;
    else global.Image = previousImage;
    if (previousWindow === undefined) delete global.window;
    else global.window = previousWindow;
    if (previousManager === undefined) delete global[key];
    else global[key] = previousManager;
  }
});
