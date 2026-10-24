const test = require('node:test');
const assert = require('node:assert/strict');
const exercises = require('../src/lib/chess/skewer-beginner-exercises.json');

test('57 distinct sparse beginner skewers, without fabricated games', async () => {
  const { Chess } = await import('chess.js');
  assert.equal(exercises.length, 57);
  assert.equal(new Set(exercises.map((e) => e.fen)).size, exercises.length);
  const attackers = {};
  const targets = {};
  const colors = {};
  const axes = {};
  const retainedSlots = Array.from({ length: 60 }, (_, i) => i).filter((i) => ![16, 25, 34].includes(i));
  for (const [index, e] of exercises.entries()) {
    assert.equal(e.beginner, true);
    assert.equal(e.gameReference, undefined);
    assert.equal(e.difficulty, undefined);
    const board = new Chess(e.fen);
    assert.equal(board.board().flat().filter(Boolean).length, retainedSlots[index] % 3 === 1 ? 5 : 4);
    assert.equal(board.in_check(), false);
    assert.equal(board.game_over(), false);
    assert.equal(
      board.moves({ verbose: true }).some((m) => m.captured),
      false
    );
    colors[board.turn()] = (colors[board.turn()] || 0) + 1;
    const lines = [e.moves, ...e.alternativeLines];
    assert.equal(new Set(lines.map((l) => l[0])).size, 1);
    const first = board.move(e.moves[0]);
    assert.ok(first && !first.captured);
    assert.equal(board.in_check(), true);
    assert.equal(
      first.piece,
      ['r', 'b', 'q'][retainedSlots[index] % 3],
      'alternate all three skewer pieces'
    );
    attackers[first.piece] = (attackers[first.piece] || 0) + 1;
    const preview = new Chess(e.fen);
    preview.move(e.moves[0]);
    preview.move(e.moves[1]);
    const rearCapture = preview.move(e.moves[2]);
    targets[first.piece] ??= {};
    targets[first.piece][rearCapture.captured] = (targets[first.piece][rearCapture.captured] || 0) + 1;
    const dx = rearCapture.to.charCodeAt(0) - first.to.charCodeAt(0);
    const dy = Number(rearCapture.to[1]) - Number(first.to[1]);
    const axis = !dx ? 'file' : !dy ? 'rank' : dx * dy > 0 ? 'rising' : 'falling';
    axes[first.piece] ??= new Set();
    axes[first.piece].add(axis);
    // Coverage is compared with an independent chess library's complete legal move list.
    assert.deepEqual(lines.map((l) => l[1]).sort(), board.moves().sort());
    for (const line of lines) {
      assert.equal(line.length, 3);
      const b = new Chess(e.fen);
      b.move(line[0]);
      const reply = b.move(line[1]);
      assert.equal(reply.piece, 'k');
      const capture = b.move(line[2]);
      assert.ok(capture?.captured);
      assert.equal(capture.from, first.to);
      assert.equal(capture.piece, first.piece);
      assert.equal(b.in_stalemate(), false);
      assert.equal(b.insufficient_material(), false);
      assert.equal(
        b.moves({ verbose: true }).some((m) => m.to === capture.to),
        false
      );
      // Checked king lies strictly between attacker and captured rear piece.
      const xy = (s) => [s.charCodeAt(0) - 97, +s[1] - 1];
      const [a, k, t] = [first.to, reply.from, capture.to].map(xy);
      assert.equal(
        (k[0] - a[0]) * (t[1] - a[1]),
        (k[1] - a[1]) * (t[0] - a[0])
      );
      const dot = (k[0] - a[0]) * (t[0] - a[0]) + (k[1] - a[1]) * (t[1] - a[1]);
      assert.ok(dot > 0 && dot < (t[0] - a[0]) ** 2 + (t[1] - a[1]) ** 2);
    }
  }
  assert.deepEqual(attackers, { r: 20, b: 17, q: 20 });
  assert.deepEqual(colors, { w: 29, b: 28 });
  for (const piece of ['r', 'b', 'q']) {
    assert.deepEqual(targets[piece], piece === 'b' ? { q: 6, r: 6, n: 3, p: 2 } : { q: 5, r: 5, b: 4, n: 4, p: 2 });
  }
  assert.deepEqual([...axes.r].sort(), ['file', 'rank']);
  assert.deepEqual([...axes.b].sort(), ['falling', 'rising']);
  assert.deepEqual([...axes.q].sort(), ['falling', 'file', 'rank', 'rising']);
});

test('shared trainer accepts beginner solutions and completes after the capture', async () => {
  const fs = require('node:fs');
  const ts = require('typescript');
  const chess = await import('chess.js');
  const mod = { exports: {} };
  new Function(
    'module',
    'exports',
    'require',
    ts.transpileModule(
      fs.readFileSync('src/lib/chess/draw-trainer.ts', 'utf8'),
      { compilerOptions: { module: ts.ModuleKind.CommonJS } }
    ).outputText
  )(mod, mod.exports, () => chess);
  for (const exercise of [
    ...exercises,
    ...require('../src/lib/chess/skewer-quiet-beginner-exercises.json'),
  ]) {
    const first = mod.exports.tryDrawMove(exercise, [], exercise.moves[0]);
    assert.equal(first.complete, false);
    for (const line of [exercise.moves, ...exercise.alternativeLines]) {
      const lastIndex =
        line.length % 2 === 0 ? line.length - 2 : line.length - 1;
      let last = mod.exports.tryDrawMove(
        exercise,
        line.slice(0, lastIndex),
        line[lastIndex]
      );
      assert.equal(last.status, 'accepted');
      // A four-ply branch shares its last learner move with longer branches.
      // The trainer selects its saved opponent reply, then asks for recapture.
      if (!last.complete) {
        const active = [exercise.moves, ...exercise.alternativeLines].find(
          (branch) => last.played.every((move, i) => branch[i] === move)
        );
        last = mod.exports.tryDrawMove(
          exercise,
          last.played,
          active[last.played.length]
        );
      }
      assert.equal(last.complete, true);
    }
  }
});
