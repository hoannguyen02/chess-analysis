const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const modules = new Map();
let chess;
test.before(async () => {
  chess = await import('chess.js');
});

function load(file) {
  file = path.resolve(file);
  if (!path.extname(file)) file += '.ts';
  if (file.endsWith('.json')) return JSON.parse(fs.readFileSync(file, 'utf8'));
  if (modules.has(file)) return modules.get(file).exports;
  const mod = { exports: {} };
  modules.set(file, mod);
  const local = (name) =>
    name === 'chess.js'
      ? chess
      : name.startsWith('@/')
        ? load('src/' + name.slice(2))
        : name.startsWith('.')
          ? load(path.join(path.dirname(file), name))
          : require(name);
  const { outputText } = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
      target: ts.ScriptTarget.ES2020,
    },
  });
  new Function('module', 'exports', 'require', outputText)(
    mod,
    mod.exports,
    local
  );
  return mod.exports;
}

test('unsaved safe captures of a loose piece are accepted for both colors', () => {
  const { tryDrawMove } = load('src/lib/chess/draw-trainer');
  for (const [fen, target, saved, capture] of [
    ['7k/8/8/8/Q3r3/8/3N4/K7 w - - 0 1', 'e4', 'Qxe4', 'Nxe4'],
    ['k7/3n4/8/q3R3/8/8/8/7K b - - 0 1', 'e5', 'Qxe5', 'Nxe5'],
  ]) {
    const exercise = {
      fen,
      goal: 'material',
      outcome: 'hanging-piece',
      hangingPiece: { target, minimumGain: 500 },
      moves: [saved],
    };
    const result = tryDrawMove(exercise, [], capture);
    assert.equal(result.status, 'accepted');
    assert.equal(result.complete, true);
    assert.deepEqual(result.played, result.continuation);
    assert.equal(result.played.length, 2);
    assert.equal(result.played[0], capture);
  }
});

test('hanging-piece checks defer a recapture and require a real payoff at the end of a line', () => {
  const { tryDrawMove } = load('src/lib/chess/draw-trainer');
  const exercise = {
    fen: '7k/8/8/5b2/Q3r3/8/3N4/K7 w - - 0 1',
    goal: 'material',
    outcome: 'hanging-piece',
    hangingPiece: { target: 'e4', minimumGain: 500 },
    moves: ['Nb3'],
  };
  for (const move of ['Nxe4', 'Nb3']) {
    const result = tryDrawMove(exercise, [], move);
    assert.equal(result.status, 'unrecorded');
    assert.equal(result.complete, false);
    assert.deepEqual(result.played, []);
  }
  const stalemate = {
    ...exercise,
    fen: '7k/5K2/6Q1/5r2/8/8/8/8 w - - 0 1',
    hangingPiece: { target: 'f5', minimumGain: 500 },
    moves: ['Qxf5'],
  };
  assert.equal(tryDrawMove(stalemate, [], 'Qxf5').complete, false);
});

test('counterchecks and verification limits leave unsaved captures open for analysis', () => {
  const { tryDrawMove } = load('src/lib/chess/draw-trainer');
  const exercise = {
    fen: '7k/8/8/8/Q3r3/8/3N4/K7 w - - 0 1',
    goal: 'material',
    outcome: 'hanging-piece',
    hangingPiece: { target: 'e4', minimumGain: 500 },
    moves: ['Qxe4'],
  };
  const countercheck = {
    ...exercise,
    fen: '7k/8/8/8/Q3r3/8/3N1r2/K7 w - - 0 1',
  };
  const board = new chess.Chess(countercheck.fen);
  assert.ok(board.move('Nxe4'));
  assert.ok(board.moves().includes('Rf1+'));
  assert.equal(tryDrawMove(countercheck, [], 'Nxe4').status, 'unrecorded');
  const now = Date.now;
  let ticks = 0;
  try {
    Date.now = () => (ticks += 101);
    const result = tryDrawMove(exercise, [], 'Nxe4');
    assert.equal(result.status, 'unrecorded');
    assert.deepEqual(result.played, []);
  } finally {
    Date.now = now;
  }
});

function fenKey(fen) {
  const board = new chess.Chess(fen);
  const fields = board.fen().split(' ');
  if (!board.moves({ verbose: true }).some((move) => move.flags.includes('e')))
    fields[3] = '-';
  return fields.join(' ');
}

test('published hanging-piece exercises replay, solve and print from the registered topic', () => {
  const base = 'src/lib/server/hanging-piece';
  const beginners = load(base + '-beginner-exercises.json');
  const exercises = load(base + '-exercises.json');
  const sources = load(base + '-game-sources.json');
  const { gameFrames } = load('src/lib/chess/draw-game-viewer');
  const { previousDrawPosition, tryDrawMove } = load(
    'src/lib/chess/draw-trainer'
  );
  const { practiceLevels } = load('src/lib/chess/draw-levels');
  const { privatePages } = load('src/lib/server/private-hub');
  const worksheet = load('src/lib/chess/worksheet');
  const topics = worksheet.worksheetTopicsFromLibrary(privatePages);
  const id = 'hanging-piece';
  const collection = [...beginners, ...exercises];
  assert.ok(beginners.length, 'curated Beginner exercises are installed');
  assert.equal(
    topics.find((topic) => topic.id === id).endpoint,
    '/api/hanging-piece-exercises'
  );

  for (const exercise of collection) {
    assert.equal(exercise.goal, 'material');
    assert.equal(exercise.outcome, id);
    const ref = exercise.gameReference;
    if (exercise.beginner) {
      assert.equal(exercise.source, 'original-composition');
      assert.equal(ref, undefined);
    } else {
      assert.equal(ref.collection, id);
      assert.equal(ref.kind, 'game');
      const frames = gameFrames(sources[ref.id], ref.branch);
      assert.equal(fenKey(frames[ref.ply].fen), fenKey(exercise.fen));
      assert.equal(
        fenKey(frames[ref.ply - 1].fen),
        fenKey(previousDrawPosition(exercise).fen)
      );
    }
    const board = new chess.Chess(exercise.fen);
    assert.equal(exercise.tacticPly % 2, 0);
    for (const move of exercise.moves.slice(0, exercise.tacticPly))
      assert.ok(board.move(move));
    const tactic = board.move(exercise.moves[exercise.tacticPly]);
    assert.ok(tactic?.captured, 'the reviewed marker precedes the capture');
    assert.equal(tactic.to, exercise.hangingPiece.target);

    for (const line of [exercise.moves, ...(exercise.alternativeLines ?? [])]) {
      assert.equal(
        worksheet.explainLine(exercise.fen, line).length,
        line.length
      );
      const lastSolverPly = Math.floor((line.length - 1) / 2) * 2;
      const result = tryDrawMove(
        { ...exercise, moves: line, alternativeLines: [] },
        line.slice(0, lastSolverPly),
        line[lastSolverPly]
      );
      assert.equal(result.status, 'accepted', exercise.title);
      assert.equal(result.complete, true, exercise.title);
    }
    assert.equal(worksheet.worksheetSolutionText(exercise), exercise.solution);
  }

  for (const level of practiceLevels) {
    const expected = collection.filter((exercise) =>
      level === 'Beginner'
        ? exercise.beginner
        : exercise.difficulty?.level === level
    );
    assert.deepEqual(worksheet.levelExercises(collection, level), expected);
    if (!expected.length) continue;
    const pages = worksheet.planWorksheet(
      [{ id: 1, topic: id, level, count: expected.length }],
      { [id]: collection },
      topics
    );
    assert.equal(
      pages.flatMap((page) => page.exercises).length,
      expected.length
    );
  }
});

test('hanging piece uses the shared Beginner source bank and explicit tactic marker', async () => {
  const { beginnerTacticCandidates } = load(
    'src/lib/server/beginner-tactic-candidates'
  );
  const scope = '/hanging-piece';
  const bank = await beginnerTacticCandidates(scope);
  assert.deepEqual(bank.topic, {
    themeId: 'hangingPiece',
    label: 'Bắt quân không được bảo vệ',
    scope,
  });
  for (const candidate of bank.candidates) {
    assert.ok(
      ['B', 'C', 'C*', 'D', 'D*', 'E', 'E*'].includes(candidate.entry.beginnerSourceLevel)
    );
    assert.equal(candidate.entry.goal, 'material');
    assert.deepEqual(candidate.entry.moves, []);
    if (candidate.entry.reference?.collection === 'hanging-piece') {
      assert.equal(candidate.detection, 'explicit');
      const position = candidate.positions.find(
        (row) => row.ply === candidate.suggestedPly
      );
      assert.ok(position);
      assert.ok(
        new chess.Chess(position.entry.fen).move(position.move)?.captured
      );
      const { previousDrawPosition } = load('src/lib/chess/draw-trainer');
      assert.ok(previousDrawPosition(position.entry));
    }
  }
});
