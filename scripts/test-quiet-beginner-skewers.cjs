const test = require('node:test');
const assert = require('node:assert/strict');
const exercises = require('../src/lib/chess/skewer-quiet-beginner-exercises.json');
const values = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const xy = (s) => [s.charCodeAt(0) - 97, +s[1] - 1];

test('30 non-checking queen skewers cover every legal defence with material gain', async () => {
  const { Chess } = await import('chess.js');
  assert.equal(exercises.length, 30);
  assert.equal(new Set(exercises.map((e) => e.fen)).size, 30);
  for (const e of exercises) {
    const start = new Chess(e.fen);
    assert.equal(e.beginnerKind, 'queen');
    assert.equal(e.gameReference, undefined);
    const attacker = start.move(e.moves[0]);
    start.undo();
    assert.equal(
      start.board().flat().filter(Boolean).length,
      attacker.piece === 'b' ? 7 : 8
    );
    assert.equal(start.in_check(), false);
    assert.equal(
      start
        .moves({ verbose: true })
        .some(
          (m) =>
            m.captured && (attacker.piece === 'b' || m.from === attacker.from)
        ),
      false
    );
    const pieces = start.board().flat().filter(Boolean);
    const queen = pieces.find((p) => p.type === 'q').square;
    const rook = pieces.find(
      (p) => p.type === 'r' && p.color !== start.turn()
    ).square;
    const all = [e.moves, ...e.alternativeLines];
    for (const first of new Set(all.map((l) => l[0]))) {
      const board = new Chess(e.fen);
      const move = board.move(first);
      assert.ok(['b', 'r'].includes(move.piece));
      assert.equal(board.in_check(), false);
      const [a, q, r] = [move.to, queen, rook].map(xy);
      assert.equal(
        (q[0] - a[0]) * (r[1] - a[1]),
        (q[1] - a[1]) * (r[0] - a[0])
      );
      const dot = (q[0] - a[0]) * (r[0] - a[0]) + (q[1] - a[1]) * (r[1] - a[1]);
      assert.ok(dot > 0 && dot < (r[0] - a[0]) ** 2 + (r[1] - a[1]) ** 2);
      assert.deepEqual(
        [...new Set(all.filter((l) => l[0] === first).map((l) => l[1]))].sort(),
        board.moves().sort()
      );
    }
    for (const line of all) {
      const board = new Chess(e.fen);
      const side = board.turn();
      assert.ok([3, 4, 5].includes(line.length));
      let gain = 0;
      for (const san of line) {
        const move = board.move(san);
        assert.ok(move, `legal move ${san}`);
        gain += (move.color === side ? 1 : -1) * (values[move.captured] || 0);
      }
      const maxLoss =
        board.turn() === side
          ? 0
          : Math.max(
              0,
              ...board
                .moves({ verbose: true })
                .map((m) => values[m.captured] || 0)
            );
      assert.ok(gain - maxLoss >= 2, `material gain: ${line.join(' ')}`);
      assert.equal(board.in_stalemate(), false);
      if (board.turn() === side) assert.equal(board.in_check(), false);
      else
        for (const m of board.moves()) {
          board.move(m);
          assert.equal(
            board.in_checkmate(),
            false,
            'no immediate mating counterattack'
          );
          board.undo();
        }
      if (line.length > 3) {
        const prefix = line.slice(0, 3);
        const position = new Chess(e.fen);
        prefix.forEach((move) => position.move(move));
        const matches = all.filter((l) =>
          prefix.every((move, i) => l[i] === move)
        );
        assert.ok(
          matches.every((l) => l.length > 3),
          'no terminal prefix hides recapture practice'
        );
        assert.deepEqual(
          [...new Set(matches.map((l) => l[3]))].sort(),
          position.moves().sort(),
          'every reply after the first capture is covered'
        );
      }
    }
  }
});

test('queen lessons vary shelters, tactical spacing, landing squares, and side to move', async () => {
  const { Chess } = await import('chess.js');
  let black = 0;
  const axes = { diagonal: 0, file: 0, rank: 0 };
  const shelters = new Set();
  const destinations = new Set();
  const shapes = new Set();
  for (const e of exercises) {
    const board = new Chess(e.fen);
    const side = board.turn();
    if (side === 'b') black++;
    shelters.add(
      board
        .board()
        .flat()
        .find((p) => p?.type === 'k' && p.color === side).square
    );
    const queen = board
      .board()
      .flat()
      .find((p) => p?.type === 'q').square;
    const target = board
      .board()
      .flat()
      .find((p) => p?.type === 'r' && p.color !== side).square;
    const move = board.move(e.moves[0]);
    axes[
      move.piece === 'b'
        ? 'diagonal'
        : move.to[0] === queen[0]
          ? 'file'
          : 'rank'
    ]++;
    destinations.add(move.to);
    const distance = (a, b) =>
      Math.max(...xy(a).map((n, i) => Math.abs(n - xy(b)[i])));
    shapes.add(`${distance(move.to, queen)}:${distance(queen, target)}`);
  }
  assert.equal(black, 10);
  assert.deepEqual(axes, { diagonal: 18, file: 6, rank: 6 });
  assert.ok(shelters.size >= 6, 'varied king shelters');
  assert.ok(destinations.size >= 12, 'varied landing squares');
  assert.ok(
    shapes.size >= 8,
    'varied tactical spacing, not just shifted pieces'
  );
});

test('queen exercises are not rotated, reflected, or color-swapped copies', async () => {
  const { Chess } = await import('chess.js');
  const keys = exercises.map((e) => {
    const pieces = new Chess(e.fen).board().flat().filter(Boolean);
    const variants = [];
    for (const swap of [false, true]) {
      for (const transpose of [false, true]) {
        for (const flipX of [false, true]) {
          for (const flipY of [false, true]) {
            variants.push(
              pieces
                .map((p) => {
                  let [x, y] = xy(p.square);
                  if (transpose) [x, y] = [y, x];
                  if (flipX) x = 7 - x;
                  if (flipY) y = 7 - y;
                  const color = swap ? (p.color === 'w' ? 'b' : 'w') : p.color;
                  return `${color}${p.type}${x}${y}`;
                })
                .sort()
                .join(',')
            );
          }
        }
      }
    }
    return variants.sort()[0];
  });
  assert.equal(new Set(keys).size, exercises.length);
});

test('automatic queen-skewer replies use the strongest unrestricted audited defence', () => {
  const { createHash } = require('node:crypto');
  const audit = require('./fixtures/skewer/queen-reply-audit.json');
  assert.equal(audit.nodesPerPosition, 1000000);
  assert.equal(audit.multiPV, 3);
  assert.equal(audit.positions.length, exercises.length);
  for (const exercise of exercises) {
    const record = audit.positions.find((item) => item.fen === exercise.fen);
    assert.ok(record, 'every exercise has an engine audit');
    const lines = [exercise.moves, ...exercise.alternativeLines];
    const sorted = [...lines].sort((a, b) => {
      for (let i = 0; i < Math.min(a.length, b.length); i++) {
        if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
      }
      return a.length - b.length;
    });
    const digest = createHash('sha256')
      .update(JSON.stringify([exercise.fen, sorted]))
      .digest('hex');
    assert.equal(
      digest,
      record.branchDigest,
      'audit matches the current positions and branches'
    );
    const prefixes = new Set(
      lines.flatMap((line) =>
        line
          .map((_, i) => (i % 2 ? JSON.stringify(line.slice(0, i)) : null))
          .filter(Boolean)
      )
    );
    assert.deepEqual(
      new Set(record.defences.map((d) => JSON.stringify(d.prefix))),
      prefixes
    );
    for (const defence of record.defences) {
      const first = lines.find((line) =>
        defence.prefix.every((move, i) => line[i] === move)
      );
      assert.equal(defence.selected, defence.candidates[0].move);
      assert.equal(
        first[defence.prefix.length],
        defence.selected,
        'first matching line must select the strongest audited reply'
      );
    }
  }
  assert.notEqual(
    exercises[0].moves[1],
    'Qc8',
    'do not restore the illustrative retreat'
  );
});
