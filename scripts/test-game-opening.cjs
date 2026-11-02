const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const mod = { exports: {} };
new Function(
  'module',
  'exports',
  ts.transpileModule(fs.readFileSync('src/lib/chess/game-opening.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText
)(mod, mod.exports);
const { gameOpeningCaption } = mod.exports;
test('recorded opening and variation take priority; result never changes the opening label', () => {
  const headers = {
    Opening: 'Sicilian Defense',
    Variation: 'Najdorf',
    ECO: 'B90',
    Result: '0-1',
  };
  assert.equal(
    gameOpeningCaption(headers, { name: 'Other', eco: 'A00' }),
    'Khai cuộc: Sicilian Defense: Najdorf · B90'
  );
  assert.equal(
    gameOpeningCaption({ ...headers, Result: '1-0' }),
    'Khai cuộc: Sicilian Defense: Najdorf · B90'
  );
  assert.match(
    gameOpeningCaption({ ...headers, Result: '1/2-1/2' }),
    /^Khai cuộc:/
  );
});
test('missing names use verified match or valid ECO, never fabricated names', () => {
  assert.equal(
    gameOpeningCaption(
      { Opening: '?', ECO: 'A04' },
      { name: 'Réti Opening', eco: 'A09' }
    ),
    'Khai cuộc: Réti Opening · A09'
  );
  assert.equal(gameOpeningCaption({ ECO: 'A04' }), 'Khai cuộc: ECO A04');
  assert.equal(gameOpeningCaption({ Opening: '?', ECO: '?' }), '');
});
test('classifier matches transposed positions and skips studies/custom starts', async () => {
  const { classify, positionKey } = await import(
    './build-practice-openings.mjs'
  );
  const { Chess } = await import('chess.js');
  const game = new Chess();
  for (const move of ['d4', 'Nf6', 'Nf3', 'd5']) game.move(move);
  const known = { name: 'Test transposition', eco: 'D02' };
  const positions = new Map([[positionKey(game), known]]);
  const source = {
    kind: 'game',
    fen: new Chess().fen(),
    lines: [['Nf3', 'd5', 'd4', 'Nf6']],
  };
  assert.deepEqual(classify(source, positions), known);
  assert.equal(classify({ ...source, kind: 'study' }, positions), undefined);
  assert.equal(classify({ ...source, fen: game.fen() }, positions), undefined);
});
test('pictured Gelfand–Artemiev game has a locally saved classification', () => {
  const sources = require('../src/lib/server/two-rook-mate-game-sources.json');
  const openings = require('../src/lib/server/practice-openings.json');
  const [id, game] = Object.entries(sources).find(
    ([, game]) =>
      game.headers.White === 'Gelfand,B' && game.headers.Black === 'Artemiev,V'
  );
  assert.ok(openings[`two-rook-mate/${id}`]?.name);
  assert.match(
    gameOpeningCaption(game.headers, openings[`two-rook-mate/${id}`]),
    /^Khai cuộc:/
  );
  console.log(
    gameOpeningCaption(game.headers, openings[`two-rook-mate/${id}`])
  );
});

test('Nunn–Pritchett reaches the recorded B89 Sozin position by transposition', async () => {
  const { Chess } = await import('chess.js');
  const { positionKey } = await import('./build-practice-openings.mjs');
  const sources = require('../src/lib/server/two-rook-mate-game-sources.json');
  const source = sources['5ea9584689df1f30'];
  const actual = new Chess();
  for (const move of source.lines[0].slice(0, 13)) actual.move(move);
  const opening = new Chess();
  opening.load_pgn(
    '1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 d6 6. Bc4 e6 7. Be3'
  );
  assert.equal(positionKey(actual), positionKey(opening));
  const matched = require('../src/lib/server/practice-openings.json')[
    'two-rook-mate/5ea9584689df1f30'
  ];
  assert.equal(source.headers.Result, '1-0');
  assert.equal(
    gameOpeningCaption(source.headers, matched),
    'Khai cuộc: Sicilian Defense: Sozin Attack, Main Line · B89'
  );
});
