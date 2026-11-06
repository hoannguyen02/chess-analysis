const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

function load(path, resolve = require) {
  const mod = { exports: {} };
  const js = ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  new Function('module', 'exports', 'require', js)(mod, mod.exports, (id) =>
    id.endsWith('/manual-tactics')
      ? {
          includeManualExercises: async (_route, data) => data,
          readManualTactics: async () => [],
          manualTopicPages: () => [],
        }
      : resolve(id)
  );
  return mod.exports;
}
function response() {
  return {
    code: 200,
    headers: {},
    setHeader(k, v) {
      this.headers[k] = v;
    },
    status(code) {
      this.code = code;
      return this;
    },
    json(value) {
      this.body = value;
      return this;
    },
    end() {
      return this;
    },
  };
}

test('protected topic returns the reviewed collection and registers worksheet source', async () => {
  const exercises = require('../src/lib/server/removing-defender-exercises.json');
  const auth = load('src/lib/server/practice-access.ts');
  const hub = load('src/lib/server/private-hub.ts');
  process.env.PRACTICE_PASSWORD = 'removing-defender-test';
  const handler = load('src/pages/api/removing-defender-exercises.ts', (id) => {
    if (id === '@/lib/server/practice-access') return auth;
    if (id === '@/lib/server/private-hub') return hub;
    if (id === '@/lib/server/removing-defender-exercises.json')
      return exercises;
    if (id === '@/lib/server/practice-game-caption')
      return {
        practiceGameCaption: () => '',
        practiceGameOpening: () => '',
        practicePlayerTitle: () => '',
        practicePlayers: () => [],
      };
    throw new Error(id);
  }).default;
  const denied = response();
  await handler({ method: 'GET', headers: {} }, denied);
  assert.equal(denied.code, 401);
  const request = {
    method: 'GET',
    headers: { authorization: `Bearer ${auth.issueAccessToken()}` },
  };
  const allowed = response();
  await handler(request, allowed);
  assert.equal(allowed.code, 200);
  assert.equal(allowed.headers['Cache-Control'], 'private, no-store');
  assert.equal(allowed.body.categories[0].id, 'removing-defender');
  assert.equal(allowed.body.categories[0].exercises.length, exercises.length);
  const wrongMethod = response();
  await handler({ ...request, method: 'POST' }, wrongMethod);
  assert.equal(wrongMethod.code, 405);
  assert.equal(wrongMethod.headers.Allow, 'GET');
  const topic = hub.privatePages.find((p) => p.href === '/removing-defender');
  assert.equal(topic.worksheetEndpoint, '/api/removing-defender-exercises');
  delete process.env.PRACTICE_PASSWORD;
});

test('worksheet uses available exercises and does not invent missing positions', async () => {
  const chess = await import('chess.js');
  const model = load('src/lib/chess/worksheet.ts', (id) =>
    id === 'chess.js'
      ? chess
      : id === './worksheet-layout'
        ? load('src/lib/chess/worksheet-layout.ts')
        : require(id)
  );
  const hub = load('src/lib/server/private-hub.ts');
  const exercises = require('../src/lib/server/removing-defender-exercises.json');
  const topics = model.worksheetTopicsFromLibrary(hub.privatePages);
  assert.ok(topics.some((topic) => topic.id === 'removing-defender'));
  for (const level of model.worksheetLevels) {
    const available = model.levelExercises(exercises, level);
    const section = [{ id: 1, topic: 'removing-defender', level, count: 1 }];
    const catalog = { 'removing-defender': exercises };
    if (available.length) {
      const pages = model.planWorksheet(section, catalog, topics);
      assert.equal(pages[0].exercises[0].exercise, available[0]);
      model.explainLine(available[0].fen, available[0].moves);
    } else {
      assert.throws(
        () => model.planWorksheet(section, catalog, topics),
        /còn 0 thế cờ/
      );
    }
  }
});
