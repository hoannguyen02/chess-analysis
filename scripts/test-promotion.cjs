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
      else assert.ok(trainer.promotionGainReached(e, board), e.id);
      assert.ok(!board.game_over());
    }
  }
  assert.equal(counts.Beginner, 14);
  assert.equal(counts.A, require('./fixtures/promotion-split/material-a-editorial-review.json').actualCount);
  assert.equal(counts.B, 10);
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

test('Beginner chooses safe routes, resolves check and retains the promoted piece', () => {
  const cases = [
    ['away-from-king', 'bxa1=Q', 'b1=Q'],
    ['capture-rook-checker', 'axb1=Q', 'a1=Q'],
    ['king-support', 'd8=Q+', null],
    ['open-support', 'cxd8=Q+', 'c8=Q'],
    ['two-captures', 'dxc1=Q', 'dxe1=Q'],
    ['advance-not-capture', 'd8=Q', 'dxe8=Q'],
    ['blocked-forward', 'bxc1=Q', 'b1=Q'],
    ['capture-pinner', 'fxg8=Q+', 'f8=Q'],
    ['two-pawns', 'b8=Q', 'g8=Q+'],
    ['stop-promotion', 'f1=Q+', 'fxg1=Q'],
  ];
  for (const [id, good, bad] of cases) {
    const e = categories[0].exercises.find(e => e.id === `promotion-beginner-${id}`);
    assert.ok(e?.beginner, id);
    const result = trainer.tryDrawMove({ ...e, alternativeLines: [] }, [], good);
    assert.equal(result.status, 'accepted', id);
    assert.ok(result.complete, id);
    if (bad) assert.notEqual(trainer.tryDrawMove(e, [], bad).status, 'accepted', id);
  }
});

test('counter-promotion is included in the material review, not just captures of the new piece', () => {
  const e = categories[0].exercises.find(e => e.id === 'promotion-beginner-stop-promotion');
  for (const move of ['f1=R', 'fxg1=Q']) {
    assert.equal(trainer.verifyDirectPromotionMaterial(e, move), null);
    assert.equal(trainer.tryDrawMove(e, [], move).status, 'unrecorded');
  }
});

test('double check and a pinned defender prevent otherwise legal recaptures', () => {
  for (const [id, square] of [['double-check-recapture', 'e1'], ['pinned-recapturer', 'b6']]) {
    const e = categories[0].exercises.find(e => e.id === `promotion-beginner-${id}`);
    assert.ok(e?.beginner);
    for (const promotion of ['q', 'r']) {
      const root = new chess.Chess(e.fen);
      const saved = root.move(e.moves[0]);
      const result = trainer.tryDrawMove({ ...e, alternativeLines: [] }, [], {
        from: saved.from, to: saved.to, promotion,
      });
      assert.equal(result.status, 'accepted', id);
      assert.ok(result.complete, id);
    }
    const withoutSupport = new chess.Chess(e.fen);
    withoutSupport.remove(square);
    assert.equal(trainer.verifyDirectPromotionMaterial({ ...e, fen: withoutSupport.fen() }, e.moves[0]), null, id);
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

test('promotion decisions that avoid pat start at A in every published category', () => {
  const targets = new Set(['8/1P6/k7/8/1K6/8/8/8 w - - 0 1', '8/k1P5/2K5/8/1N6/8/8/8 w - - 0 1']);
  let checked = 0;
  for (const topic of ['promotion', 'underpromotion']) {
    for (const e of require(`../src/lib/server/${topic}-exercises.json`)[0].exercises) {
      if (!targets.has(e.fen)) continue;
      assert.ok(!e.beginner);
      assert.equal(e.difficulty.level, 'A');
      checked++;
    }
  }
  assert.equal(checked, 3);
});

test('A promotion interposition continues through recapture and accepts a shorter successful defence', () => {
  const e = categories[0].exercises.find(e => e.id === 'promotion-a-promotion-interposition');
  const start = trainer.tryDrawMove(e, [], 'b8=Q');
  assert.equal(start.status, 'accepted');
  assert.equal(start.complete, false);
  assert.deepEqual(start.played, ['b8=Q', 'Rxb8+']);
  const finish = trainer.tryDrawMove(e, start.played, 'Kxb8');
  assert.equal(finish.status, 'accepted');
  assert.ok(finish.complete);
  assert.ok(trainer.promotionGainReached(e, trainer.replayDrawExercise(e, ['b8=Q', 'Kh7'])));
});


test('reviewed promotion threats handle declined exchanges without premature completion', () => {
  const e = categories[0].exercises.find(e => e.id === 'promotion-a-rook-exchange-promotion');
  assert.equal(trainer.promotionGainReached(e, trainer.replayDrawExercise(e, ['Rb8+', 'Kg7'])), false);
  assert.ok(trainer.promotionGainReached(e, trainer.replayDrawExercise(e, ['Rb8+', 'Kg7', 'Rxa8', 'Kf6'])));
  assert.equal(trainer.promotionGainReached(e, trainer.replayDrawExercise(e, ['Rb8+', 'Rxb8'])), false);
  assert.ok(trainer.promotionGainReached(e, trainer.replayDrawExercise(e, e.moves)));
});

test('checking replies cannot certify a promoted queen that a skewer recovers', () => {
  const e = {fen:'6R1/8/r7/8/8/2K5/1p6/2k5 b - - 31 109', promotionGain:{minimumGain:400,solverMoves:2,verifyCheckingReplies:true}};
  const b = trainer.replayDrawExercise(e, ['Rc6+', 'Kd4', 'b1=Q', 'Rg1+']);
  const before = b.fen(), history = b.history();
  assert.equal(trainer.promotionGainReached(e, b), false);
  assert.equal(b.fen(), before);assert.deepEqual(b.history(), history);
  const safe = categories[0].exercises.find(e => e.id === 'promotion-a-balanced-rook-clearance');
  const checked = trainer.replayDrawExercise(safe, ['Rh8+', 'Kg6', 'c8=Q', 'Ra1+']);
  assert.ok(trainer.promotionGainReached(safe, checked));
});

test('balanced blocker exchange accepts the alternative pawn-first capture order', () => {
  const e = categories[0].exercises.find(e => e.id === 'promotion-a-capture-blocker-exchange');
  const alternative = trainer.tryDrawMove(e, [], 'cxd8=Q+');
  assert.equal(alternative.status, 'accepted');
  assert.equal(alternative.complete, false);
  const finish = trainer.tryDrawMove(e, alternative.played, 'Rxd8+');
  assert.equal(finish.status, 'accepted');
  assert.ok(finish.complete);
});

test('protected knight interference accepts rook exchange and capture-promotion', () => {
  const e = categories[0].exercises.find(e => e.id === 'promotion-a-master-b26391c1f9174baa');
  const reply = trainer.tryDrawMove(e, ['Nb1', 'Rxb1'], 'axb1=Q+');
  assert.equal(reply.status, 'accepted');
  assert.ok(reply.complete);
});

test('reviewed defensive preparation permits a winning capture when the rook intervenes', () => {
  for (const [id, played, capture] of [
    ['bd38e1825a7c2cf0', ['Rf4', 'Rf3'], 'Rxf3'],
  ]) {
    const e = categories[0].exercises.find(e => e.id === `promotion-a-master-${id}`);
    const reply = trainer.tryDrawMove(e, played, capture);
    assert.equal(reply.status, 'accepted');
    assert.ok(reply.complete);
  }
});
