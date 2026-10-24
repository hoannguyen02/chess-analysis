const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const mod = { exports: {} };
const source = ts.transpileModule(
  fs.readFileSync('src/components/PracticeBoard.tsx', 'utf8'),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }
).outputText;
new Function('module', 'exports', 'require', source)(
  mod,
  mod.exports,
  (name) => {
    if (name === 'react-chessboard') return { Chessboard: 'board' };
    if (name.includes('useCustomBoard'))
      return {
        useCustomBoard: () => ({
          customPieces: {},
          bgDark: '#123',
          bgLight: '#fff',
        }),
      };
    return require(name);
  }
);
const Board = mod.exports.default;
function setup(overrides = {}) {
  const events = [];
  const tools = {
    boardRenderKey: 0,
    customSquareStyles: { e4: { backgroundColor: 'green' } },
    selectedColor: { arrow: 'red' },
    handleSquareClick: () => events.push('clear'),
    handleSquareRightClick: () => events.push('mark'),
    handleArrowsChange: () => events.push('arrow'),
  };
  const props = {
    id: 'test',
    fen: 'position',
    width: 400,
    orientation: 'black',
    tools,
    canMove: true,
    pendingPromotion: null,
    onSquareClick: (square, piece) => events.push([square, piece]),
    onPieceDrop: () => true,
    onPromotionPieceSelect: () => false,
    ...overrides,
  };
  return { node: Board(props), events, props };
}
test('practice boards preserve annotation gestures alongside legal-move input', () => {
  const { node, events } = setup();
  node.props.onSquareClick('e4', 'wP');
  node.props.onSquareRightClick('e4');
  node.props.onArrowsChange([]);
  assert.deepEqual(events, ['clear', ['e4', 'wP'], 'mark', 'arrow']);
  assert.equal(node.props.boardOrientation, 'black');
  assert.equal(node.props.customArrowColor, 'red');
  assert.equal(node.props.animationDuration, 0);
  assert.equal(node.props.onPieceDrop('e2', 'e4'), true);
});
test('promotion blocks dragging and uses the shared on-board picker; review is read-only', () => {
  const { node } = setup({ pendingPromotion: { from: 'a7', to: 'a8' } });
  assert.equal(node.props.arePiecesDraggable, false);
  assert.equal(node.props.showPromotionDialog, true);
  assert.equal(node.props.promotionToSquare, 'a8');
  assert.equal(node.props.onPromotionCheck(), false);
  assert.equal(node.props.onPromotionPieceSelect('wN'), false);
  assert.equal(setup({ canMove: false }).node.props.arePiecesDraggable, false);
  assert.notEqual(setup().node.key, setup({ fen: 'next-position' }).node.key);
});
