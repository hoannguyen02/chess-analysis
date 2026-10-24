const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

async function harness() {
  const chess = await import('chess.js');
  const effects = [];
  let options;
  let listener;
  let clears = 0;
  class Element {
    constructor(editable = false, blocked = false) {
      this.isContentEditable = editable;
      this.blocked = blocked;
    }
    closest() {
      return this.blocked;
    }
  }
  const windowMock = {
    addEventListener: (_, fn) => {
      listener = fn;
    },
    removeEventListener: (_, fn) => {
      if (listener === fn) listener = undefined;
    },
  };
  const mod = { exports: {} };
  const source = ts.transpileModule(
    fs.readFileSync('src/hooks/usePracticeBoardTools.ts', 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } }
  ).outputText;
  new Function('module', 'exports', 'require', 'window', 'HTMLElement', source)(
    mod,
    mod.exports,
    (name) => {
      if (name === 'chess.js') return chess;
      if (name === 'react')
        return {
          useMemo: (fn) => fn(),
          useEffect: (fn) => effects.push(fn),
        };
      return {
        useTeachingHighlights: (args) => {
          options = args;
          return {
            clearHighlights: () => {
              clears++;
            },
          };
        },
      };
    },
    windowMock,
    Element
  );
  return {
    ...mod.exports,
    ...chess,
    Element,
    get options() {
      return options;
    },
    get clears() {
      return clears;
    },
    flush: () => effects.splice(0).map((fn) => fn()),
    key: (key, overrides = {}) => {
      const event = {
        key,
        target: new Element(),
        prevented: false,
        preventDefault() {
          this.prevented = true;
        },
        ...overrides,
      };
      listener?.(event);
      return event;
    },
  };
}

test('shortcuts respect input, modifier, disabled-mode and cleanup boundaries', async () => {
  const h = await harness();
  let flips = 0;
  h.usePracticeBoardTools(new h.Chess().fen(), { f: () => flips++ });
  const cleanups = h.flush();
  assert.equal(h.key('F').prevented, true);
  assert.equal(flips, 1);
  for (const overrides of [
    { defaultPrevented: true },
    { repeat: true },
    { isComposing: true },
    { ctrlKey: true },
    { metaKey: true },
    { altKey: true },
    { shiftKey: true },
    { target: new h.Element(true) },
    { target: new h.Element(false, true) },
  ])
    assert.equal(h.key('f', overrides).prevented, false);
  assert.equal(h.key('ArrowLeft').prevented, false);
  assert.equal(flips, 1);
  cleanups.forEach((cleanup) => cleanup?.());
  h.key('f');
  assert.equal(flips, 1);
  h.usePracticeBoardTools(new h.Chess().fen(), { f: () => flips++ }, false);
  h.flush();
  h.key('f');
  assert.equal(flips, 1);
});

test('annotations inspect the displayed position and clear when applied', async () => {
  const h = await harness();
  const game = new h.Chess();
  game.move('e4');
  h.usePracticeBoardTools(game.fen(), {});
  h.flush();
  assert.equal(h.clears, 1);
  assert.equal(h.options.getActiveTurn(), 'b');
  assert.equal(h.options.getPieceAtSquare('e4'), 'wP');
  assert.equal(h.options.getPieceAtSquare('e2'), null);
  assert.equal(h.options.getAllPieces().length, 32);
  assert.deepEqual(h.options.getLegalSquaresForPiece('e7').sort(), [
    'e5',
    'e6',
  ]);
  const checking = new h.Chess('4k3/8/8/8/8/8/R7/4K3 w - - 0 1');
  h.usePracticeBoardTools(checking.fen(), {});
  assert.ok(h.options.getCheckSquaresForPiece('a2').includes('e2'));
  assert.ok(!h.options.getCheckSquaresForPiece('a2').includes('b2'));
});
