const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const categories = require('../src/lib/server/promotion-exercises.json');
let chess, trainer;
test.before(async () => {
  chess = await import('chess.js');
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
  trainer = mod.exports;
});
test('material promotion exercises reach their explicit goal through shared practice', () => {
  const counts = {};
  for (const e of categories[0].exercises) {
    const level = e.beginner ? 'Beginner' : e.difficulty.level;
    counts[level] = (counts[level] || 0) + 1;
    let played = [];
    while (played.length < e.moves.length) {
      const result = trainer.tryDrawMove(e, played, e.moves[played.length]);
      assert.equal(result.status, 'accepted', e.title);
      assert.ok(result.played.length > played.length);
      played = result.played;
      if (result.complete) break;
    }
    const board = trainer.replayDrawExercise(e, played);
    if (e.goal === 'checkmate') assert.ok(board.in_checkmate(), e.title);
    else {
      assert.equal(e.goal, 'material');
      assert.ok(e.promotionMaterial || e.promotionGain);
      if (e.promotionMaterial)
        assert.ok(trainer.verifyDirectPromotionMaterial(e, played[0]));
      else assert.ok(trainer.promotionGainReached(e, board));
      assert.ok(!board.game_over());
    }
  }
  assert.equal(counts.Beginner, 3);
  assert.ok(categories[0].exercises.every((e) => e.goal === 'material'));
});
test('rook underpromotion avoids stalemate; queen and dead-position choices do not complete material tasks', () => {
  const e = categories[0].exercises[0];
  const rook = trainer.tryDrawMove({ ...e, alternativeLines: [] }, [], 'b8=R');
  assert.equal(rook.status, 'accepted');
  assert.ok(rook.complete);
  const queen = trainer.tryDrawMove(e, [], 'b8=Q');
  assert.equal(queen.status, 'unrecorded');
  assert.equal(queen.promotionFailure, 'stalemate');
  assert.ok(!queen.complete);
  for (const piece of ['B', 'N']) {
    const move = trainer.tryDrawMove(e, [], `b8=${piece}`);
    assert.equal(move.status, 'unrecorded');
    assert.equal(move.promotionFailure, 'dead');
  }
});
test('safe unsaved rook promotions are verified for both colors; capturable promotions fail', () => {
  for (const e of categories[0].exercises.filter((e) => e.promotionMaterial)) {
    const root = new chess.Chess(e.fen);
    for (const move of root
      .moves({ verbose: true })
      .filter((m) => ['q', 'r'].includes(m.promotion))) {
      const proved = trainer.verifyDirectPromotionMaterial(e, {
        from: move.from,
        to: move.to,
        promotion: move.promotion,
      });
      const result = trainer.tryDrawMove(
        { ...e, alternativeLines: [] },
        [],
        move.from + move.to + move.promotion
      );
      assert.equal(result.status, proved ? 'accepted' : 'unrecorded');
    }
  }
  const unsafe = {
    ...categories[0].exercises[0],
    fen: '1k6/P7/8/8/8/8/8/K7 w - - 0 1',
  };
  assert.equal(trainer.verifyDirectPromotionMaterial(unsafe, 'a8=Q+'), null);
  assert.equal(trainer.tryDrawMove(unsafe, [], 'a8=Q+').status, 'unrecorded');
  assert.equal(trainer.tryDrawMove(unsafe, [], 'a6').status, 'illegal');
});

test('knight underpromotion material payoff includes every recapture and accepts an unsaved defence', () => {
  const e =
    require('./fixtures/promotion-split/underpromotion-fork.json').exercise;
  const start = trainer.tryDrawMove(e, [], 'c8=N+');
  assert.equal(start.status, 'accepted');
  assert.equal(start.complete, false);
  const finish = trainer.tryDrawMove(e, start.played, 'Nxb6');
  assert.equal(finish.status, 'accepted');
  assert.equal(finish.complete, true);
  const unsaved = trainer.tryDrawMove(e, ['c8=N+', 'Kd7'], 'Nxb6');
  assert.equal(unsaved.status, 'accepted');
  assert.equal(unsaved.complete, true);
  const truncated = { ...e, moves: ['c8=N+', 'Kc6'] };
  assert.equal(
    trainer.tryDrawMove(truncated, truncated.moves, 'Nxb6').complete,
    false
  );
});

test('capture promotion removes the defender; straight promotion fails', () => {
  const e = categories[0].exercises.find(e => e.id === 'promotion-beginner-capture-defender');
  assert.ok(e);
  assert.equal(trainer.verifyDirectPromotionMaterial(e, 'a8=Q'), null);
  for (const move of ['axb8=Q', 'axb8=R']) {
    const result = trainer.tryDrawMove({ ...e, alternativeLines: [] }, [], move);
    assert.equal(result.status, 'accepted');
    assert.ok(result.complete);
  }
});

test('minor underpromotions avoid pat and accept unsaved Knight alternative', () => {
  const e = require('../src/lib/server/underpromotion-exercises.json')[0].exercises.find(e => e.fen === '8/k1P5/2K5/8/1N6/8/8/8 w - - 0 1');
  assert.ok(e);
  for (const move of ['c8=B', 'c8=N+']) {
    const result = trainer.tryDrawMove({ ...e, alternativeLines: [] }, [], move);
    assert.equal(result.status, 'accepted');
    assert.ok(result.complete);
  }
  for (const move of ['c8=Q', 'c8=R']) {
    const result = trainer.tryDrawMove(e, [], move);
    assert.notEqual(result.status, 'accepted');
    assert.ok(!result.complete);
  }
});

test('new historical underpromotion mates continue through actual mate', () => {
  const fens = new Set(require('./fixtures/promotion-expansion/candidates.json').filter(r => r.goal === 'checkmate').map(r => r.fen));
  const rows = require('../src/lib/server/underpromotion-exercises.json')[0].exercises.filter(e => fens.has(e.fen));
  assert.equal(rows.length, 3);
  for (const e of rows) {
    let played = [];
    while (played.length < e.moves.length) {
      const result = trainer.tryDrawMove(e, played, e.moves[played.length]);
      assert.equal(result.status, 'accepted', e.title);
      assert.ok(result.played.length > played.length);
      played = result.played;
      if (result.complete) break;
    }
    assert.ok(trainer.replayDrawExercise(e, played).in_checkmate(), e.title);
  }
});
