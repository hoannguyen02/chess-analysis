const test = require('node:test');
const assert = require('node:assert/strict');
const pilot = require('./fixtures/skewer/queen-pilot.json');
const sources = require('./fixtures/skewer/audit.json').records;
const values = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

test('pilot has five supported skewers and one controlled failure', async () => {
  const { Chess } = await import('chess.js');
  assert.equal(pilot.status, 'review-sample-not-live');
  assert.equal(pilot.exercises.length, 6);
  const expected = { pawn: 'p', rook: 'r', queen: 'q', bishop: 'b', king: 'k' };
  for (const e of pilot.exercises) {
    const b = new Chess(e.fen);
    assert.equal(b.in_check(), false);
    const side = b.turn();
    let gain = 0;
    for (const [ply, san] of e.line.entries()) {
      if (ply > 0) {
        const audit = e.continuationChecks[ply - 1];
        assert.equal(b.fen(), audit.fen);
        assert.equal(
          san,
          audit.candidates[0].move,
          'strongest audited continuation'
        );
      }
      const move = b.move(san);
      assert.ok(move, `legal ${e.id}: ${san}`);
      gain += (move.color === side ? 1 : -1) * (values[move.captured] || 0);
    }
    assert.equal(b.fen(), e.finalFen);
    assert.equal(gain, e.materialChange);
    assert.equal(e.finalAssessment.fen, e.finalFen);
    assert.deepEqual(
      e.rootChecks.slice(0, 2).map((a) => a.nodeBudget),
      [1000000, 3000000]
    );
    if (e.rootChecks.length > 2)
      assert.equal(e.rootChecks[2].nodeBudget, 12000000);
    for (const audit of e.rootChecks) assert.equal(audit.fen, e.fen);
    if (e.kind === 'positive') {
      const candidates = e.rootChecks.at(-1).candidates;
      const selected = candidates.find((c) => c.move === e.intendedMove);
      if (selected.mate !== null) {
        assert.ok(selected.mate > 0);
        assert.equal(selected.move, candidates[0].move);
      } else {
        assert.ok(selected.scoreCp >= 100);
        assert.ok(candidates[0].scoreCp - selected.scoreCp <= 40);
      }
      assert.ok(gain >= 2);
      assert.ok(
        e.supporters.some(
          (s) =>
            s.piece[0] === expected[e.id] ||
            (expected[e.id] === 'p' && s.piece === 'pawn')
        )
      );
      // Check the supporting piece can legally recapture, not merely attack the square.
      const p = new Chess(e.fen);
      const move = p.move(e.intendedMove);
      const take = p
        .moves({ verbose: true })
        .find((m) => m.piece === 'q' && m.to === move.to);
      if (take) {
        p.move(take.san);
        assert.ok(
          p
            .moves({ verbose: true })
            .some((m) => m.piece === expected[e.id] && m.to === move.to)
        );
      }
      if (e.origin === 'recorded-game') {
        const source = sources.find(
          (s) => s.gameId === e.gameReference.id
        );
        assert.equal(source.fen, e.fen);
        assert.deepEqual(e.previousMove, source.previousMove);
      }
    } else {
      assert.equal(e.origin, 'modified-comparison');
      assert.equal(e.gameReference, undefined);
      assert.deepEqual(e.line.slice(0, 2), ['Ba3', 'Qxa3']);
      assert.equal(e.supporters.length, 0);
      assert.ok(gain < 0);
    }
  }
});

test('negative comparison changes only the supporting rook location', async () => {
  const { Chess } = await import('chess.js');
  const original = new Chess(pilot.exercises.find((e) => e.id === 'rook').fen);
  const altered = new Chess(
    pilot.exercises.find((e) => e.id === 'contrast').fen
  );
  const rook = original.remove('a1');
  original.put(rook, 'b1');
  assert.equal(original.fen(), altered.fen());
});

test('positive motifs have a clear queen-to-rear-target line, including a rank skewer of a knight', async () => {
  const { Chess } = await import('chess.js');
  const axes = [];
  for (const e of pilot.exercises.filter((e) => e.kind === 'positive')) {
    const b = new Chess(e.fen);
    const move = b.move(e.intendedMove);
    const x = move.to.charCodeAt(0) - 97;
    const y = +move.to[1] - 1;
    const directions =
      move.piece === 'b'
        ? [
            [1, 1],
            [1, -1],
            [-1, 1],
            [-1, -1],
          ]
        : [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ];
    let found;
    for (const [dx, dy] of directions) {
      const seen = [];
      for (
        let a = x + dx, c = y + dy;
        a >= 0 && a < 8 && c >= 0 && c < 8;
        a += dx, c += dy
      ) {
        const square = String.fromCharCode(97 + a) + (c + 1);
        const piece = b.get(square);
        if (piece) seen.push(piece);
        if (seen.length === 2) break;
      }
      if (
        seen.length === 2 &&
        seen[0].type === 'q' &&
        seen.every((p) => p.color !== move.color) &&
        ['r', 'b', 'n'].includes(seen[1].type)
      ) {
        found = {
          axis: dx === 0 ? 'file' : dy === 0 ? 'rank' : 'diagonal',
          rear: seen[1].type,
        };
        break;
      }
    }
    assert.ok(found, `true skewer, not a pin against a king: ${e.id}`);
    axes.push(found.axis);
    if (e.id === 'king') assert.deepEqual(found, { axis: 'rank', rear: 'n' });
  }
  assert.deepEqual(axes, ['diagonal', 'diagonal', 'diagonal', 'file', 'rank']);
});
