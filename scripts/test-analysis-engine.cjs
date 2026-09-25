const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const ts = require('typescript');
const compiled = ts.transpileModule(
  fs.readFileSync('src/utils/analysis-engine.ts', 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } }
).outputText;
const loaded = { exports: {} };
new Function('module', 'exports', compiled)(loaded, loaded.exports);
const { createAnalysisEngine } = loaded.exports;

function setup(t) {
  const sent = [];
  const infos = [];
  let errors = 0;
  const worker = {
    postMessage: (message) => sent.push(message),
    terminate() { this.terminated = true; },
    emit(data) { this.onmessage?.({ data }); },
  };
  const engine = createAnalysisEngine(worker, (...args) => infos.push(args), () => errors++);
  t.after(() => engine.dispose());
  return { worker, engine, sent, infos, errors: () => errors };
}

test('waits for UCI readiness before searching and forwards the position with results', (t) => {
  const h = setup(t);
  h.engine.search('position-one', 18);
  assert.deepEqual(h.sent, ['uci']);
  h.worker.emit('uciok');
  assert.deepEqual(h.sent, ['uci', 'isready']);
  h.worker.emit('readyok');
  assert.deepEqual(h.sent.slice(-2), ['position fen position-one', 'go depth 18']);
  h.worker.emit('info depth 1 score cp 23 pv e2e4');
  assert.deepEqual(h.infos, [['info depth 1 score cp 23 pv e2e4', 'position-one']]);
});

test('stops the old search, ignores stale output, and searches only the latest request', (t) => {
  const h = setup(t);
  h.engine.search('one', 18);
  h.worker.emit('uciok\nreadyok');
  h.engine.search('two', 20);
  h.engine.search('three', 25);
  assert.equal(h.sent.filter((s) => s === 'stop').length, 1);
  h.worker.emit('info depth 10 pv e2e4');
  assert.deepEqual(h.infos, []);
  assert.equal(h.sent.at(-1), 'stop');
  h.worker.emit('bestmove e2e4');
  assert.deepEqual(h.sent.slice(-2), ['position fen three', 'go depth 25']);
  h.worker.emit('info depth 1 pv d2d4');
  assert.deepEqual(h.infos, [['info depth 1 pv d2d4', 'three']]);
});

test('worker failures surface once and terminate the worker', (t) => {
  const h = setup(t);
  h.worker.onerror();
  assert.equal(h.errors(), 1);
  assert.equal(h.worker.terminated, true);
  h.engine.search('one', 18);
  assert.deepEqual(h.sent, ['uci']);
});

test('cleanup terminates the actual worker and detaches its handlers', (t) => {
  const h = setup(t);
  h.engine.dispose();
  assert.equal(h.worker.terminated, true);
  assert.equal(h.worker.onmessage, null);
  assert.equal(h.worker.onerror, null);
});
