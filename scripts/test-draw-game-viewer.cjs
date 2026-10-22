const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const index = require('../src/lib/chess/draw-game-index.json');
const sources = require('../src/lib/server/draw-game-sources.json');
test('all viewer branches replay legally and references land on the exercise position', async () => {
  const chess = await import('chess.js');
  const code = ts.transpileModule(
    fs.readFileSync('src/lib/chess/draw-game-viewer.ts', 'utf8'),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        esModuleInterop: true,
      },
    }
  ).outputText;
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', code)(mod, mod.exports, (id) =>
    id === 'chess.js' ? chess : index
  );
  const refModule = { exports: {} };
  const refCode = ts.transpileModule(
    fs.readFileSync('src/lib/chess/draw-game-reference.ts', 'utf8'),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        esModuleInterop: true,
      },
    }
  ).outputText;
  new Function('module', 'exports', 'require', refCode)(
    refModule,
    refModule.exports,
    () => index
  );
  const cache = {};
  for (const [id, source] of Object.entries(sources)) {
    cache[id] = source.lines.map((_, i) => mod.exports.gameFrames(source, i));
    for (const [i, frames] of cache[id].entries())
      assert.equal(frames.length, source.lines[i].length + 1);
  }
  for (const [fen, ref] of Object.entries(index)) {
    const frames = cache[ref.id][ref.branch];
    assert.equal(frames[ref.ply].fen.split(' ').slice(0, 4).join(' '), fen);
    assert.equal(refModule.exports.gameReference(fen).id, ref.id);
  }
  assert.equal(refModule.exports.gameReference('missing'), undefined);
});
