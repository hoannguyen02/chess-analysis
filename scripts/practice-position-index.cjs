// Read the effective catalogs, including owner edits, through the same API
// handlers used by practice and worksheets. Access is stubbed only offline.
const { catalogLoader } = require('./render-tactic-batch.cjs');

async function activePracticeCatalogs(root) {
  const load = catalogLoader(root, await import('chess.js'));
  async function request(endpoint) {
    const url = new URL(endpoint, 'http://practice.invalid');
    let payload;
    await load(`src/pages${url.pathname}.ts`).default(
      { method: 'GET', query: Object.fromEntries(url.searchParams) },
      {
        status(code) {
          if (code !== 200) throw Error(`${endpoint} returned ${code}`);
          return this;
        },
        json(body) { payload = body; },
      }
    );
    return payload;
  }
  const { pages } = await request('/api/private-pages');
  return Promise.all(pages.filter((page) => page.worksheetEndpoint).map(async (page) => {
    const { categories } = await request(page.worksheetEndpoint);
    return { page, exercises: categories.flatMap((category) => category.exercises) };
  }));
}

async function activePositionIndex(root) {
  const { practicePositionKey } = catalogLoader(root, await import('chess.js'))(
    'src/lib/chess/practice-position-key.ts'
  );
  const index = new Map();
  for (const { page, exercises } of await activePracticeCatalogs(root)) {
    for (const exercise of exercises) {
      const key = practicePositionKey(exercise.fen);
      const hits = index.get(key) ?? [];
      hits.push({
        scope: page.href,
        topic: page.title,
        level: exercise.beginner ? 'Beginner' : exercise.difficulty?.level,
        exercise: exercise.management?.id ?? exercise.manualId ?? exercise.gameReference?.id ?? exercise.title,
      });
      index.set(key, hits);
    }
  }
  return Object.fromEntries(index);
}

module.exports = { activePracticeCatalogs, activePositionIndex };
if (require.main === module) {
  activePositionIndex(process.cwd()).then(
    (index) => process.stdout.write(JSON.stringify(index)),
    (error) => { console.error(error.message); process.exitCode = 1; }
  );
}
