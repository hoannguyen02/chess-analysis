// Local editorial audit of the same protected catalogs used by WorksheetBuilder.
// The access stub is confined to this offline harness; API guards are unchanged.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const ts = require('typescript');
const cache = new Map();
let chess;
function load(file) {
  file = path.resolve(file);
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
  new Function(
    'module',
    'exports',
    'require',
    ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        esModuleInterop: true,
      },
    }).outputText
  )(mod, mod.exports, local);
  return mod.exports;
}
// Coordinates/numbers and the duplicated SAN suffix vary within editorial templates.
function template(text) {
  return text
    .replace(/Nhánh mẫu:.*/, '')
    .replace(
      /\b(?:[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?[+#]?|O-O(?:-O)?)\b/g,
      '<ô/nước>'
    )
    .replace(/\d+/g, '<số>')
    .trim();
}
(async () => {
  chess = await import('chess.js');
  const model = load('src/lib/chess/worksheet.ts');
  const library = load('src/lib/server/private-hub.ts').privatePages.filter(
    (p) => p.worksheetEndpoint
  );
  const report = [],
    catalog = {},
    sourceTopics = model.worksheetTopicsFromLibrary(library);
  let total = 0,
    changed = 0,
    alternatives = 0,
    previous = 0;
  for (const page of library) {
    let body;
    await load('src/pages' + page.worksheetEndpoint + '.ts').default(
      { method: 'GET' },
      {
        status() {
          return this;
        },
        json(value) {
          body = value;
        },
        setHeader() {},
      }
    );
    const entries = body.categories
      .flatMap((c) => c.exercises)
      .filter((e) => e.moves.length && e.mode !== 'recognition');
    const topic = page.href.slice(1);
    catalog[topic] = entries;
    const templates = new Map();
    for (const e of entries) {
      const before = JSON.stringify(e);
      const after = model.worksheetSolutionText(e);
      model.explainLine(e.fen, e.moves, true);
      model.previousMoveLabel(e);
      previous += !!e.previousMove;
      for (const alt of e.alternativeLines ?? []) {
        model.explainLine(e.fen, alt, true);
        alternatives++;
      }
      const source = model.worksheetSourceLines(e).join('\n');
      assert.doesNotMatch(after, /Nhánh mẫu:|Mở ván gốc|bạn lời|biến mẫu lời/);
      assert.doesNotMatch(source, /original-composition|modified-comparison/);
      if (e.source?.startsWith('http')) assert.ok(source.includes(e.source));
      assert.equal(
        JSON.stringify(e),
        before,
        'Editorial adaptation mutated source data'
      );
      changed += after !== e.solution;
      total++;
      const key = template(e.solution);
      if (!templates.has(key))
        templates.set(key, {
          count: 0,
          template: key,
          sample: {
            key: crypto
              .createHash('sha256')
              .update(topic + '\n' + e.fen + '\n' + e.moves.join(' '))
              .digest('hex')
              .slice(0, 16),
            fen: e.fen,
            moves: e.moves,
            before: e.solution,
            after,
          },
        });
      templates.get(key).count++;
    }
    report.push({
      topic,
      title: page.title,
      exercises: entries.length,
      templates: [...templates.values()],
    });
  }
  fs.mkdirSync('tmp/pdf-copy-audit', { recursive: true });
  fs.writeFileSync(
    'tmp/pdf-copy-audit/report.json',
    JSON.stringify(report, null, 2) + '\n'
  );
  const summary = {
    total,
    changed,
    alternatives,
    previous,
    templates: report.reduce((n, r) => n + r.templates.length, 0),
    topics: report.map((r) => ({
      topic: r.topic,
      exercises: r.exercises,
      templates: r.templates.length,
    })),
  };
  fs.writeFileSync(
    'tmp/pdf-copy-audit/summary.json',
    JSON.stringify(summary, null, 2) + '\n'
  );
  if (process.env.WORKSHEET_RENDER) {
    // One six-position page per topic, using the level with its longest note.
    const sections = sourceTopics.map((topic, i) => {
      const longest = [...catalog[topic.id]].sort(
        (a, b) => b.solution.length - a.solution.length
      )[0];
      const level = longest.beginner ? 'Beginner' : longest.difficulty?.level;
      assert.ok(model.worksheetLevels.includes(level), topic.id);
      catalog[topic.id] = [
        longest,
        ...catalog[topic.id].filter((e) => e !== longest),
      ];
      return {
        id: i,
        topic: topic.id,
        level,
        count: Math.min(
          6,
          model.levelExercises(catalog[topic.id], level).length
        ),
      };
    });
    const originalFetch = global.fetch;
    global.fetch = async (url) => {
      const data = fs.readFileSync('public' + url);
      return {
        ok: true,
        arrayBuffer: async () =>
          data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
      };
    };
    try {
      const files = await load(
        'src/lib/chess/worksheet-pdf.ts'
      ).createWorksheetPdfs(
        model.planWorksheet(sections, catalog, sourceTopics),
        'BÀI TẬP CHIẾN THUẬT CỜ VUA',
        undefined,
        'LIMA Chess',
        model.defaultBookOptions
      );
      fs.writeFileSync('tmp/pdf-copy-audit/worksheet.pdf', files.worksheet);
      fs.writeFileSync('tmp/pdf-copy-audit/answers.pdf', files.answers);
    } finally {
      global.fetch = originalFetch;
    }
  }
  console.log(JSON.stringify(summary, null, 2));
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
