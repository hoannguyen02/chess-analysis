const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const exercises = require('../src/lib/chess/skewer-exercises.json');
const levelOverrides = require('./fixtures/skewer/level-overrides.json');
const sources = require('../src/lib/server/skewer-game-sources.json');

async function runtime() {
  const chess = await import('chess.js');
  const mod = { exports: {} };
  new Function(
    'module',
    'exports',
    'require',
    ts.transpileModule(
      fs.readFileSync('src/lib/chess/draw-trainer.ts', 'utf8'),
      {
        compilerOptions: { module: ts.ModuleKind.CommonJS },
      }
    ).outputText
  )(mod, mod.exports, () => chess);
  return { ...chess, ...mod.exports };
}

test('teaching level counts reflect the A-to-C correction and queen pilot placement', () => {
  for (const level of ['A', 'B', 'C', 'C*', 'D']) {
    assert.ok(
      exercises.filter((e) => e.difficulty.level === level).length >=
        (level === 'A' ? 45 : level === 'C' ? 51 : 50),
      `Reviewed collection count for ${level}`
    );
  }
});

test('queen pilot positions do not repeat in Level A and retain their full games', async () => {
  const pilot = require('../src/lib/server/queen-skewer-pilot.json');
  const { Chess } = await runtime();
  const key = (fen) => fen.split(' ').slice(0, 4).join(' ');
  const levelA = new Set(exercises.filter((e) => e.difficulty.level === 'A').map((e) => key(e.fen)));
  for (const e of pilot) {
    assert.ok(!levelA.has(key(e.fen)));
    if (!e.gameReference) continue;
    const source = sources[e.gameReference.id];
    assert.ok(source, 'pilot original-game viewer source retained');
    const board = new Chess(source.fen);
    for (const san of source.lines[0].slice(0, e.gameReference.ply)) assert.ok(board.move(san));
    assert.equal(board.fen(), e.fen);
  }
});

test('skewers retain complete games, exact starting positions, and legal local solutions', async () => {
  const { Chess, tryDrawMove, previousDrawPosition } = await runtime();
  const seen = new Set();
  const positions = new Set();
  assert.ok(exercises.length > 0);
  for (const exercise of exercises) {
    const position = exercise.fen.split(' ').slice(0, 4).join(' ');
    assert.ok(!positions.has(position), 'unique exercise position');
    positions.add(position);
    const ref = exercise.gameReference;
    assert.equal(ref.collection, 'skewer');
    assert.ok(!seen.has(ref.id), 'one exercise per source game');
    seen.add(ref.id);
    const source = sources[ref.id];
    assert.ok(source);
    assert.ok(['1-0', '0-1', '1/2-1/2'].includes(source.headers.Result));
    assert.ok(
      source.headers.White && source.headers.Black && source.headers.Event
    );
    assert.ok(source.lines[0].length >= 10);
    const game = new Chess(source.fen);
    let actualPosition;
    source.lines[0].forEach((san, index) => {
      assert.ok(game.move(san), 'legal source move');
      if (index + 1 === ref.ply) actualPosition = game.fen();
    });
    assert.equal(actualPosition, exercise.fen);
    assert.ok(previousDrawPosition(exercise));
    const level = exercise.difficulty;
    assert.ok(['A', 'B', 'C', 'C*', 'D'].includes(level.level));
    assert.equal(level.solverMoves, Math.ceil(exercise.moves.length / 2));
    if (['A', 'B', 'C*'].includes(level.level))
      assert.equal(level.sacrificeCount, 0);
    if (levelOverrides[ref.id]) {
      assert.equal(level.level, levelOverrides[ref.id].level);
      assert.equal(level.reason, levelOverrides[ref.id].reason);
    } else if (['C', 'D'].includes(level.level))
      assert.ok(level.sacrificeCount > 0);
    if (level.level === 'D') assert.ok(level.solverMoves > 3);
    if (level.level === 'A') assert.equal(level.solverMoves, 2);
    let played = [];
    while (played.length < exercise.moves.length) {
      const result = tryDrawMove(
        exercise,
        played,
        exercise.moves[played.length]
      );
      assert.equal(result.status, 'accepted');
      assert.ok(result.played.length > played.length);
      played = result.played;
      if (played.length === exercise.moves.length)
        assert.equal(result.complete, true);
    }
    for (const line of exercise.alternativeLines ?? []) {
      const board = new Chess(exercise.fen);
      for (const san of line) assert.ok(board.move(san));
      assert.equal(tryDrawMove(exercise, [], line[0]).status, 'accepted');
    }
  }
});

test('unrecorded moves are not called wrong and an alternate branch remains playable', async () => {
  const { Chess, tryDrawMove } = await runtime();
  const exercise = {
    fen: new Chess().fen(),
    outcome: 'skewer',
    moves: ['e4', 'e5', 'Nf3'],
    alternativeLines: [['d4', 'd5', 'c4']],
  };
  const other = tryDrawMove(exercise, [], 'a3');
  assert.equal(other.status, 'unrecorded');
  assert.deepEqual(other.played, []);
  const alternative = tryDrawMove(exercise, [], 'd2d4');
  assert.deepEqual(alternative.played, ['d4', 'd5']);
  const finish = tryDrawMove(exercise, alternative.played, 'c4');
  assert.equal(finish.complete, true);
  assert.deepEqual(finish.played, ['d4', 'd5', 'c4']);
});

test('published solutions demonstrate a skewer, not a pin, with an audited advantage', async () => {
  const { Chess } = await runtime();
  const audit = JSON.parse(
    fs.readFileSync('scripts/fixtures/skewer/audit.json', 'utf8')
  );
  const byFen = new Map(audit.records.map((record) => [record.fen, record]));
  const values = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
  const xy = (square) => [square.charCodeAt(0) - 97, Number(square[1]) - 1];
  for (const exercise of exercises) {
    const record = byFen.get(exercise.fen);
    assert.ok(record, 'only independently audited records may be published');
    assert.deepEqual(record.moves, exercise.moves);
    assert.ok(record.gain >= 100);
    assert.ok(
      record.validation.replyChecks.every((check) => check.score >= 100)
    );
    const game = new Chess(exercise.fen);
    for (let i = 0; i <= record.skewerPly; i++)
      assert.ok(game.move(exercise.moves[i]));
    const { attacker, front, back } = record.motif;
    const piece = game.get(attacker);
    const first = game.get(front);
    const second = game.get(back);
    assert.ok(['b', 'r', 'q'].includes(piece.type));
    assert.equal(first.color, second.color);
    assert.notEqual(piece.color, first.color);
    assert.ok(values[first.type] > values[second.type]);
    const [ax, ay] = xy(attacker),
      [fx, fy] = xy(front),
      [bx, by] = xy(back);
    const dx = Math.sign(bx - ax),
      dy = Math.sign(by - ay);
    assert.ok(dx === 0 || dy === 0 || Math.abs(bx - ax) === Math.abs(by - ay));
    assert.equal((fx - ax) * (by - ay), (fy - ay) * (bx - ax));
    assert.ok(
      Math.max(Math.abs(fx - ax), Math.abs(fy - ay)) <
        Math.max(Math.abs(bx - ax), Math.abs(by - ay))
    );
    if (piece.type === 'b') assert.ok(dx !== 0 && dy !== 0);
    if (piece.type === 'r') assert.ok(dx === 0 || dy === 0);
    for (let x = ax + dx, y = ay + dy; x !== bx || y !== by; x += dx, y += dy) {
      const square = String.fromCharCode(97 + x) + (y + 1);
      if (square !== front) assert.equal(game.get(square), null);
    }
    assert.equal(game.move(exercise.moves[record.skewerPly + 1]).from, front);
    const capture = game.move(exercise.moves[record.skewerPly + 2]);
    assert.equal(capture.from, attacker);
    assert.equal(capture.to, back);
    assert.ok(capture.captured);
  }
});
