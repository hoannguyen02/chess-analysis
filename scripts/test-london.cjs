const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
let Chess, lib;
test.before(async () => {
  ({ Chess } = await import('chess.js'));
  lib = load('src/lib/chess/london-course.ts', (name) =>
    name === 'chess.js' ? { Chess } : require(name)
  );
});
const course = require('../src/lib/server/london-course.json');
const audit = {
  exercises: [
    ...require('./fixtures/london/audit.json').exercises,
    ...require('./fixtures/london/library-audit.json').exercises,
    ...require('./fixtures/london/expansion-audit.json').exercises,
  ],
};
function load(path, resolve = require) {
  const mod = { exports: {} };
  const js = ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  new Function('module', 'exports', 'require', js)(mod, mod.exports, resolve);
  return mod.exports;
}

test('every original game replays to every exact exercise position', () => {
  assert.ok(course.games.length >= 200);
  assert.ok(course.games.filter((g) => g.result === '0-1').length >= 50);
  assert.ok(course.games.filter((g) => g.result === '1-0').length >= 50);
  assert.ok(course.games.filter((g) => g.result === '1/2-1/2').length >= 10);
  assert.equal(
    new Set(course.games.map((g) => g.moves.join(' '))).size,
    course.games.length
  );
  const covered = new Set(
    course.lessons.flatMap((l) => l.exercises.map((e) => e.gameId))
  );
  assert.equal(covered.size, course.games.length);
  for (const g of course.games) {
    const parsed = new Chess();
    assert.equal(parsed.load_pgn(g.pgn), true);
    assert.equal(parsed.header().Result, g.result);
    assert.equal(parsed.header().White, g.white);
    assert.equal(parsed.header().Black, g.black);
    assert.equal(parsed.header().Date, g.date);
    assert.deepEqual(parsed.history(), g.moves);
    const board = new Chess();
    const canonicalFen = (b) => {
      const fields = b.fen().split(' ');
      if (!b.moves({ verbose: true }).some((m) => m.flags.includes('e')))
        fields[3] = '-';
      return fields.join(' ');
    };
    assert.equal(g.fens[0], canonicalFen(board));
    for (let i = 0; i < g.moves.length; i++) {
      assert.ok(board.move(g.moves[i]));
      assert.equal(canonicalFen(board), g.fens[i + 1]);
    }
    assert.match(g.source, /^https:\/\//);
  }
  const ids = new Set();
  for (const level of ['A', 'B', 'C', 'C*', 'D']) {
    const lessons = course.lessons.filter((l) => l.level === level);
    assert.ok(lessons.filter((l) => l.track !== 'jobava').length >= 3);
    assert.equal(lessons.filter((l) => l.track === 'jobava').length, 2);
    for (const l of lessons) {
      assert.deepEqual(
        [...new Set(l.exercises.map((e) => e.side))],
        ['white', 'black']
      );
      for (const e of l.exercises) {
        assert.ok(!ids.has(e.id));
        ids.add(e.id);
        const g = course.games.find((g) => g.id === e.gameId);
        assert.equal(e.fen, g.fens[e.ply]);
        assert.equal(new Chess(e.fen).turn(), e.side === 'white' ? 'w' : 'b');
      }
    }
  }
  assert.equal(ids.size, course.games.length + 27);
});
test('all saved alternatives and opponent replies complete legally from both colors', () => {
  for (const e of course.lessons.flatMap((l) => l.exercises)) {
    for (const line of e.lines) {
      let played = [];
      for (let i = 0; i < line.length; i += 2) {
        const next = lib.playLondonMove(e, played, line[i]);
        assert.equal(next.kind, 'accepted', e.id);
        assert.deepEqual(
          next.moves,
          line.slice(0, Math.min(i + 2, line.length)),
          e.id
        );
        assert.equal(next.complete, next.moves.length === line.length);
        played = next.moves;
      }
      lib.londonPosition(e.fen, played);
    }
    const check = audit.exercises.find((a) => a.id === e.id);
    assert.deepEqual(check.lines, e.lines);
    for (const c of check.checks)
      assert.ok(check.bestScoreLearner - c.rootScoreLearner <= 60, e.id);
  }
});
test('unreviewed legal moves are neutral and never modify the practice position', () => {
  for (const e of course.lessons.flatMap((l) => l.exercises)) {
    const legal = new Chess(e.fen).moves();
    const other = legal.find((m) => !e.lines.some((l) => l[0] === m));
    if (other)
      assert.deepEqual(lib.playLondonMove(e, [], other), {
        kind: 'unreviewed',
        moves: [],
      });
    assert.equal(lib.playLondonMove(e, [], 'not-a-move').kind, 'illegal');
  }
});
test('progress rejects corrupted and unrelated browser data', () => {
  assert.deepEqual(lib.parseLondonProgress('{', ['x']), {});
  assert.deepEqual(lib.parseLondonProgress('["independent"]', ['0']), {});
  assert.deepEqual(
    lib.parseLondonProgress('{"x":"independent","y":"assisted","z":true}', [
      'x',
      'z',
    ]),
    { x: 'independent' }
  );
});
test('London endpoint denies access before loading course and supports authenticated GET only', async () => {
  let reads = 0;
  const handler = load('src/pages/api/london-course.ts', (name) => {
    if (name === '@/lib/server/practice-access')
      return {
        requirePracticeAccess(req, res) {
          res.setHeader('Cache-Control', 'private, no-store');
          if (req.headers.authorization === 'Bearer test') return true;
          res.status(401).end();
          return false;
        },
      };
    if (name === '@/lib/server/private-hub')
      return { privateHubPath: () => '/test-hub' };
    reads++;
    return course;
  }).default;
  function res() {
    return {
      code: 200,
      headers: {},
      setHeader(k, v) {
        this.headers[k] = v;
      },
      status(c) {
        this.code = c;
        return this;
      },
      json(v) {
        this.body = v;
        return this;
      },
      end() {},
    };
  }
  let r = res();
  await handler({ method: 'GET', headers: {} }, r);
  assert.equal(r.code, 401);
  assert.equal(reads, 0);
  r = res();
  await handler(
    { method: 'POST', headers: { authorization: 'Bearer test' } },
    r
  );
  assert.equal(r.code, 405);
  assert.equal(reads, 0);
  r = res();
  await handler(
    { method: 'GET', headers: { authorization: 'Bearer test' } },
    r
  );
  assert.equal(r.code, 200);
  assert.equal(r.body.lessons.length, 31);
  assert.equal(r.headers['Cache-Control'], 'private, no-store');
  const registry = load('src/lib/server/private-hub.ts').privatePages;
  assert.ok(registry.some((p) => p.href === '/london'));
});

test('additional game positions use the actual played move and a classical London setup', () => {
  const library = require('./fixtures/london/library.json');
  for (const g of library.games) {
    const e = library.exercises.find((e) => e.gameId === g.id);
    assert.equal(e.side, g.result === '1-0' ? 'white' : 'black');
    assert.equal(e.lines[0][0], g.moves[e.ply]);
    assert.ok(
      g.fens.slice(1, 11).some((fen) => {
        const b = new Chess(fen);
        return (
          b.get('d4')?.type === 'p' &&
          b.get('d4')?.color === 'w' &&
          b.get('f4')?.type === 'b' &&
          b.get('f4')?.color === 'w' &&
          b.get('f3')?.type === 'n' &&
          b.get('f3')?.color === 'w'
        );
      }),
      g.id
    );
    const b = new Chess();
    for (const san of g.moves.slice(0, 14)) {
      const m = b.move(san);
      assert.ok(
        !(
          m.color === 'w' &&
          ((m.from === 'c2' && m.to === 'c4') ||
            (m.from === 'b1' && m.to === 'c3'))
        ),
        g.id
      );
    }
  }
});

test('London adapter uses the shared trainer for every line and the original game dialog', () => {
  const resolve = (name) => (name === 'chess.js' ? { Chess } : require(name));
  const adapter = load('src/lib/chess/london-practice.ts', resolve);
  const trainer = load('src/lib/chess/draw-trainer.ts', resolve);
  const viewer = load('src/lib/chess/draw-game-viewer.ts', (name) =>
    name === '../practice-access' ? {} : resolve(name)
  );
  for (const e of course.lessons.flatMap((l) => l.exercises)) {
    const game = course.games.find((g) => g.id === e.gameId);
    const practice = adapter.londonPracticeExercise(e, game);
    assert.equal(practice.outcome, 'opening');
    assert.doesNotThrow(() => trainer.previousDrawPosition(practice), e.id);
    for (const line of e.lines) {
      let played = [];
      for (let i = 0; i < line.length; i += 2) {
        const result = trainer.tryDrawMove(practice, played, line[i]);
        assert.equal(result.status, 'accepted', e.id);
        played = result.played;
        assert.deepEqual(
          played,
          line.slice(0, Math.min(i + 2, line.length)),
          e.id
        );
        assert.equal(result.complete, played.length === line.length, e.id);
      }
    }
    const outside = new Chess(practice.fen)
      .moves()
      .find((m) => !e.lines.some((l) => l[0] === m));
    if (outside)
      assert.equal(
        trainer.tryDrawMove(practice, [], outside).status,
        'unrecorded'
      );
    const source = adapter.londonGameSource(game);
    assert.deepEqual(source.lines, [game.moves]);
    const frames = viewer.gameFrames(source, 0);
    assert.equal(frames.length, game.moves.length + 1);
    assert.equal(frames[e.ply].fen, practice.fen);
  }
});

test('reference game navigation deduplicates games and preserves the current exercise marker', () => {
  const viewer = load('src/lib/chess/draw-game-viewer.ts', (name) =>
    name === '../practice-access'
      ? {}
      : name === 'chess.js'
        ? { Chess }
        : require(name)
  );
  const entry = (id, ply, collection) => ({
    reference: { id, ply, branch: 0, kind: 'game', collection },
  });
  const active = entry('a', 12);
  const list = viewer.referenceGameList(
    [entry('a', 2), entry('b', 4), entry('a', 8), entry('a', 6, 'skewer')],
    active
  );
  assert.equal(list.length, 3);
  assert.equal(list[0], active);
  assert.equal(list[1].reference.id, 'b');
  assert.equal(list[2].reference.collection, 'skewer');
  assert.deepEqual(viewer.referenceGameList([], active), [active]);
  assert.equal(viewer.referenceGameList([entry('b', 4)], active)[1], active);
});

test('expanded topics cover both colors and use authenticated played positions in the correct track', () => {
  const expansion = require('./fixtures/london/expansion.json');
  const crypto = require('node:crypto');
  assert.equal(expansion.lessons.length, 16);
  for (const l of expansion.lessons) {
    for (const side of ['white', 'black'])
      assert.ok(
        l.exercises.some((e) => e.side === side),
        l.id
      );
    for (const e of l.exercises) {
      const g = course.games.find((g) => g.id === e.gameId);
      assert.equal(e.lines[0][0], g.moves[e.ply]);
      assert.equal(g.track, l.track);
      if (g.result !== '1/2-1/2')
        assert.equal(e.side, g.result === '1-0' ? 'white' : 'black');
      const evidence = audit.exercises.find((a) => a.id === e.id);
      assert.equal(
        evidence.pgnSha256,
        crypto.createHash('sha256').update(g.pgn).digest('hex')
      );
      if (g.result === '1/2-1/2')
        assert.ok(Math.abs(evidence.checks[0].rootScoreLearner) <= 80);
      if (g.track === 'jobava')
        assert.ok(
          g.fens.slice(1, 11).some((fen) => {
            const b = new Chess(fen);
            return [
              ['d4', 'p'],
              ['f4', 'b'],
              ['c3', 'n'],
              ['c2', 'p'],
            ].every(
              ([sq, type]) =>
                b.get(sq)?.type === type && b.get(sq)?.color === 'w'
            );
          }),
          g.id
        );
    }
  }
});
