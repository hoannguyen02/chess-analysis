const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const ts = require('typescript');

function harness(orientation = 'white') {
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
    for (const touch of [false, true]) {
      global.window = touch ? { ontouchstart: null } : {};
      delete global[key];
      let boardManager;
      let appManager;
      // This probe sits inside the bundled provider, before the app provider.
      function CaptureBoardManager({ children }) {
        boardManager = global[key].dragDropManager;
        return children;
      }
      function CaptureAppManager() {
        appManager = dnd.useDragDropManager();
        return null;
      }
      const html = renderToString(
        React.createElement(
          chessboard.ChessboardDnDProvider,
          null,
          React.createElement(
            CaptureBoardManager,
            null,
            React.createElement(
              SetupBoardDnDProvider,
              null,
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
