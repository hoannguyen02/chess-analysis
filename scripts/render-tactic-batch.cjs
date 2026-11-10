#!/usr/bin/env node
// Offline QA through the same protected catalog and PDF generator as the app.
// Only this local loader stubs access; no API guard is changed.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const ts = require('typescript');

const TOPICS = {
  discovery: { id: 'discovered-attack', endpoint: 'discovery-exercises' },
  fork: { id: 'fork', endpoint: 'fork-exercises' },
  pin: { id: 'pin', endpoint: 'pin-exercises' },
  'defensive-move': {
    id: 'tactic-positions?theme=defensiveMove',
    endpoint: 'manual-tactic-exercises',
    query: { theme: 'defensiveMove' },
  },
  'mate-in-one': {
    id: 'tactic-positions?theme=mateIn1',
    endpoint: 'manual-tactic-exercises',
    query: { theme: 'mateIn1' },
  },
  'hanging-piece': { id: 'hanging-piece', endpoint: 'hanging-piece-exercises' },
  'two-rook-mate': { id: 'two-rook-mate', endpoint: 'two-rook-mate-exercises' },
};

function options(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 2) {
    if (!argv[i].startsWith('--') || argv[i + 1] === undefined)
      throw new Error('Use --topic, --ids, --output-dir and optional --root.');
    out[argv[i].slice(2)] = argv[i + 1];
  }
  if (!TOPICS[out.topic]) throw new Error('Implement a topic catalog adapter first.');
  if (!out.ids || !out['output-dir']) throw new Error('--ids and --output-dir are required.');
  return out;
}

function catalogLoader(root, chess) {
  const cache = new Map();
  function load(file) {
    file = path.resolve(root, file);
    if (!path.extname(file))
      file += fs.existsSync(file + '.ts') ? '.ts' : '.json';
    if (cache.has(file)) return cache.get(file).exports;
    if (file.endsWith('.json')) return JSON.parse(fs.readFileSync(file, 'utf8'));
    if (file.endsWith('/server/practice-access.ts'))
      return { requirePracticeAccess: () => true };
    const mod = { exports: {} };
    cache.set(file, mod);
    const local = (id) => {
      if (id === 'chess.js') return chess;
      if (id.startsWith('@/')) return load('src/' + id.slice(2));
      if (id.startsWith('.')) return load(path.join(path.dirname(file), id));
      return require(id);
    };
    new Function('module', 'exports', 'require', ts.transpileModule(
      fs.readFileSync(file, 'utf8'), { compilerOptions: {
        module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
        esModuleInterop: true,
      } }
    ).outputText)(mod, mod.exports, local);
    return mod.exports;
  }
  return load;
}

async function renderBatch({ topic, ids, outputDir, root = path.resolve(__dirname, '..') }) {
  if (!TOPICS[topic]) throw new Error('Implement a topic catalog adapter first.');
  if (!ids.length || new Set(ids).size !== ids.length)
    throw new Error('Select at least one distinct exercise ID.');
  root = path.resolve(root);
  outputDir = path.resolve(outputDir);
  const chess = await import('chess.js');
  const load = catalogLoader(root, chess);
  const model = load('src/lib/chess/worksheet.ts');
  const adapter = TOPICS[topic];
  const source = model.worksheetTopicsFromLibrary(
    load('src/lib/server/private-hub.ts').privatePages
  ).find((entry) => entry.id === adapter.id);
  if (!source) throw new Error('Topic is missing its protected worksheet registration.');
  let payload;
  await load(`src/pages/api/${adapter.endpoint}.ts`).default({ method: 'GET', query: adapter.query }, {
    status(code) {
      if (code !== 200) throw new Error(`Protected catalog returned ${code}.`);
      return this;
    },
    json(body) { payload = body; },
  });
  const all = payload.categories[0].exercises;
  const identity = (exercise) => exercise.manualId ?? exercise.id ?? exercise.gameReference?.id;
  const levelOf = (exercise) => exercise.beginner ? 'Beginner' : exercise.difficulty?.level;
  const byId = new Map(all.map((exercise) => [identity(exercise), exercise]));
  const selected = ids.map((id) => {
    if (!byId.has(id)) throw new Error(`${id}: unavailable after current owner decisions.`);
    return byId.get(id);
  });
  const levels = model.worksheetLevels.filter((level) =>
    selected.some((exercise) => levelOf(exercise) === level));
  const pages = model.planWorksheet(levels.map((level, index) => ({
    id: index + 1, topic: source.id, level,
    count: selected.filter((exercise) => levelOf(exercise) === level).length,
  })), { [source.id]: selected }, [source]);
  const planned = pages.flatMap((page) => page.exercises).map((item) => identity(item.exercise));
  if (planned.length !== ids.length || new Set(planned).size !== ids.length)
    throw new Error('Worksheet plan omitted or duplicated a selected position.');
  const previousFetch = global.fetch;
  global.fetch = async (url) => {
    const publicRoot = path.join(root, 'public');
    const target = path.resolve(publicRoot, '.' + url);
    if (!target.startsWith(publicRoot + path.sep)) throw new Error('Invalid local PDF asset path.');
    const bytes = fs.readFileSync(target);
    return { ok: true, arrayBuffer: async () =>
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) };
  };
  let files;
  try {
    files = await load('src/lib/chess/worksheet-pdf.ts').createWorksheetPdfs(
      pages, source.title || payload.categories[0].title, undefined,
      'LIMA Chess', { ...model.defaultBookOptions });
  } finally {
    global.fetch = previousFetch;
  }
  fs.mkdirSync(outputDir, { recursive: true });
  const { PDFDocument } = require('pdf-lib');
  const outputs = {};
  for (const key of ['worksheet', 'answers']) {
    const file = path.join(outputDir, `${topic}-${key}.pdf`);
    const bytes = files[key];
    const doc = await PDFDocument.load(bytes);
    if (!doc.getPageCount()) throw new Error('Empty PDF output.');
    fs.writeFileSync(file, bytes);
    outputs[key] = { path: file, pages: doc.getPageCount(),
      sha256: crypto.createHash('sha256').update(bytes).digest('hex') };
  }
  const result = { topic, ids, plannedIds: planned, levels, outputs,
    activeCounts: Object.fromEntries(model.worksheetLevels.map((level) =>
      [level, all.filter((exercise) => levelOf(exercise) === level).length])),
    status: 'awaiting-visual-review' };
  fs.writeFileSync(path.join(outputDir, 'render-report.json'), JSON.stringify(result, null, 2) + '\n');
  return result;
}

module.exports = { renderBatch, catalogLoader, options };
if (require.main === module) {
  const args = options(process.argv.slice(2));
  renderBatch({ topic: args.topic, ids: args.ids.split(','), outputDir: args['output-dir'], root: args.root })
    .then((result) => process.stdout.write(JSON.stringify(result) + '\n'))
    .catch((error) => { console.error(error.message); process.exitCode = 1; });
}
