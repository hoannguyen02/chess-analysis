import { Chess } from 'chess.js';
import type { DrawExercise } from './draw-practice';
import type { GameSource } from './draw-game-viewer';
import type { LondonExercise, LondonGame } from './london-course';

/** Adapt opening content to the shared draw/skewer practice interface. */
export function londonPracticeExercise(
  exercise: LondonExercise,
  game: LondonGame
): DrawExercise {
  const position = new Chess(
    exercise.ply > 0 ? game.fens[exercise.ply - 1] : exercise.fen
  );
  if (exercise.ply > 0) position.move(game.moves[exercise.ply - 1]);
  return {
    title: `${game.white} — ${game.black}`,
    gameCaption: `${game.event} · ${game.date} · ${game.result}`,
    gameReference: { id: game.id, kind: 'game', branch: 0, ply: exercise.ply },
    fen: position.fen(),
    previousMove:
      exercise.ply > 0
        ? {
            fen: new Chess(game.fens[exercise.ply - 1]).fen(),
            move: game.moves[exercise.ply - 1],
          }
        : undefined,
    moves: exercise.lines[0],
    alternativeLines: exercise.lines.slice(1),
    hints: exercise.hints,
    prompt: exercise.prompt,
    solution: exercise.explanation,
    outcome: 'opening',
  };
}

export function londonGameSource(game: LondonGame): GameSource {
  return {
    kind: 'game',
    headers: {
      White: game.white,
      Black: game.black,
      Event: game.event,
      Date: game.date,
      Round: game.round,
      Result: game.result,
    },
    fen: game.fens[0],
    lines: [game.moves],
  };
}
