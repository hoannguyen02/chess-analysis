import { Chess, Square } from 'chess.js';
import type { DrawExercise } from './draw-practice';

export type PromotionPiece = 'q' | 'r' | 'b' | 'n';

export type MoveInput =
  | string
  | { from: Square; to: Square; promotion?: PromotionPiece };

export function replayDrawExercise(
  exercise: DrawExercise,
  moves: string[] = []
) {
  const game = new Chess(exercise.fen);
  for (const move of moves) {
    if (!game.move(move)) throw new Error(`Invalid stored move: ${move}`);
  }
  return game;
}

// A preceding move is source context, not the student's first solution move.
export function previousDrawPosition(exercise: DrawExercise) {
  if (!exercise.previousMove) return null;
  const game = new Chess(exercise.previousMove.fen);
  const move = game.move(exercise.previousMove.move);
  if (!move || game.fen() !== exercise.fen) {
    throw new Error('Previous move does not reach the exercise FEN');
  }
  return { fen: exercise.previousMove.fen, move };
}

export function drawPositionOutcome(game: ReturnType<typeof Chess>) {
  if (game.in_checkmate()) return 'checkmate';
  if (game.in_stalemate()) return 'stalemate';
  if (game.insufficient_material()) return 'material';
  if (game.in_threefold_repetition()) return 'repetition';
  return 'ongoing';
}

export function tryDrawMove(
  exercise: DrawExercise,
  played: string[],
  input: MoveInput
) {
  const game = replayDrawExercise(exercise, played);
  if (played.length >= exercise.moves.length || game.game_over()) {
    return { status: 'finished' as const, played, complete: true };
  }
  const expectedGame = new Chess(game.fen());
  const expected = expectedGame.move(exercise.moves[played.length]);
  const normalized =
    typeof input === 'string' && /^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(input)
      ? {
          from: input.slice(0, 2).toLowerCase() as Square,
          to: input.slice(2, 4).toLowerCase() as Square,
          promotion: input[4]?.toLowerCase() as PromotionPiece | undefined,
        }
      : input;
  const move = game.move(normalized);
  if (!move) return { status: 'illegal' as const, played, complete: false };
  const sameMove =
    expected &&
    move.from === expected.from &&
    move.to === expected.to &&
    move.promotion === expected.promotion;
  // Accept alternative moves that demonstrably achieve the requested draw.
  const terminalDraw =
    exercise.outcome !== 'fortress' &&
    drawPositionOutcome(game) === exercise.outcome;
  if (!sameMove && !terminalDraw) {
    return { status: 'unrecorded' as const, played, complete: false };
  }
  const next = [...played, move.san];
  if (!terminalDraw && next.length < exercise.moves.length) {
    const reply = game.move(exercise.moves[next.length]);
    if (!reply) throw new Error('Invalid stored opponent reply');
    next.push(reply.san);
  }
  return {
    status: 'accepted' as const,
    played: next,
    complete:
      next.length >= exercise.moves.length ||
      game.game_over() ||
      drawPositionOutcome(game) === exercise.outcome,
  };
}
