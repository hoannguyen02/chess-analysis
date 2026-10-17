const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
(async () => {
  const chess = await import('chess.js');
  const { Chess } = chess;
  const compiled = ts.transpileModule(
    fs.readFileSync('src/lib/lesson-import.ts', 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } }
  ).outputText;
  const loaded = { exports: {} };
  new Function('require', 'module', 'exports', compiled)(
    (name) => (name === 'chess.js' ? chess : require(name)),
    loaded,
    loaded.exports
  );
  const { parseLessonSpreadsheet, resolveLessonPosition } = loaded.exports;
  const start = new Chess().fen();
  const sample = '2r5/6R1/3npk2/pp6/5P2/4P3/P1p4r/2K3R1 b - - 1 49';

  test('imports spreadsheet pairs by level with optional moves and blank cells', () => {
    const result = parseLessonSpreadsheet(
      `Level A\t\tLevel B/B*\t\n${sample}\tNf5?\t${start}\te4!\n${start}\t\t${start}\td4`
    );
    assert.deepEqual(result.errors, []);
    assert.deepEqual(
      result.positions.map((p) => p.title),
      ['Level A — 1', 'Level A — 2', 'Level B/B* — 1', 'Level B/B* — 2']
    );
    assert.equal(result.positions[0].previousMove, 'Nf5?');
    assert.equal(result.positions[1].previousMove, undefined);
  });

  test('plays screenshot move, highlights its endpoints, and never mutates saved FEN', () => {
    const position = { fen: sample, previousMove: 'Nf5?' };
    const result = resolveLessonPosition(position);
    assert.equal(result.move.from, 'd6');
    assert.equal(result.move.to, 'f5');
    assert.equal(new Chess(result.fen).turn(), 'w');
    assert.equal(position.fen, sample);
    assert.deepEqual(
      resolveLessonPosition(position),
      result,
      'reloading replays exactly once from saved FEN'
    );
    assert.equal(resolveLessonPosition({ fen: start }).move, null);
  });

  test('supports castling, promotion, captures, check annotations and move numbers', () => {
    assert.equal(
      resolveLessonPosition({
        fen: 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1',
        previousMove: '1. 0-0!',
      }).move.to,
      'g1'
    );
    assert.equal(
      resolveLessonPosition({
        fen: '7k/8/8/8/8/8/1p6/7K b - - 0 1',
        previousMove: '1... b1=Q+?',
      }).move.promotion,
      'q'
    );
    const game = new Chess();
    game.move('e4');
    game.move('d5');
    assert.equal(
      resolveLessonPosition({ fen: game.fen(), previousMove: 'exd5!' }).move
        .captured,
      'p'
    );
  });

  test('reports invalid FEN, missing FEN and illegal moves without losing valid rows', () => {
    const result = parseLessonSpreadsheet(
      `${start}\te4\nbad/fen\t\n${start}\tQh8\n\tNf3`
    );
    assert.equal(result.positions.length, 1);
    assert.deepEqual(result.errors, [
      { row: 2, column: 1, reason: 'fen' },
      { row: 3, column: 1, reason: 'move' },
      { row: 4, column: 1, reason: 'fen' },
    ]);
  });

  test('supports headerless FEN lists, CRLF, empty input and JSON round trips', () => {
    const result = parseLessonSpreadsheet(`${start}\r\n${sample}\tNf5?\r\n`);
    assert.equal(result.positions.length, 2);
    assert.deepEqual(parseLessonSpreadsheet(' \n\t'), {
      positions: [],
      errors: [],
    });
    for (const position of JSON.parse(JSON.stringify(result.positions)))
      assert.doesNotThrow(() => resolveLessonPosition(position));
  });
})();
