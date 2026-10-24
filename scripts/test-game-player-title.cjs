const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function load(file, resolve) {
  const mod = { exports: {} };
  new Function(
    'module',
    'exports',
    'require',
    ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText
  )(mod, mod.exports, resolve);
  return mod.exports;
}
const verified = load('src/lib/chess/verified-player-titles.ts');
const { gamePlayers, gamePlayerTitle } = load(
  'src/lib/chess/game-player-title.ts',
  () => verified
);
test('verified titles use game dates, preserving recorded ratings', () => {
  const headers = {
    White: 'Praggnanandhaa,R',
    Black: 'Anand,V',
    Date: '2018.11.13',
    WhiteElo: '2530',
    BlackElo: '2773',
  };
  assert.equal(
    gamePlayerTitle(headers),
    'GM Praggnanandhaa,R (2530) — GM Anand,V (2773)'
  );
  assert.equal(gamePlayers({ ...headers, Date: '2017.01.01' })[0].title, 'IM');
  assert.equal(gamePlayers({ ...headers, Date: '2014.01.01' })[0].title, 'FM');
  assert.equal(gamePlayers({ ...headers, Date: '2012.01.01' })[0].title, '');
  assert.equal(gamePlayers({ ...headers, Date: '?' })[0].title, '');
});
test('PGN titles take priority; unknown data is not invented', () => {
  const players = gamePlayers({
    White: 'Example',
    Black: 'Another',
    WhiteTitle: 'FM',
    WhiteElo: '2200',
    BlackElo: '?',
  });
  assert.deepEqual(players[0], {
    name: 'Example',
    title: 'FM',
    rating: '2200',
  });
  assert.deepEqual(players[1], { name: 'Another', title: '', rating: '' });
  assert.deepEqual(gamePlayers({ White: 'Example' }), []);
});
