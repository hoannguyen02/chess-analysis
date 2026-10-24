import { Chess } from 'chess.js';
import type { MoveInput } from './draw-trainer';

// Replaying from the exercise root preserves castling, en passant and repetition
// history within the exercise. A terminal FEN by itself would lose that history.
export function explorationPosition(fen: string, moves: string[], ply: number) {
  if (!Number.isInteger(ply) || ply < 0 || ply > moves.length)
    throw new Error('Invalid exploration position');
  const game = new Chess(fen);
  for (const move of moves.slice(0, ply)) {
    if (!game.move(move)) throw new Error(`Invalid exploration move: ${move}`);
  }
  return game;
}

export function exploreMove(
  fen: string,
  moves: string[],
  ply: number,
  input: MoveInput
) {
  const game = explorationPosition(fen, moves, ply);
  if (game.in_checkmate() || game.in_stalemate()) return null;
  const move = game.move(input);
  if (!move) return null;
  // The caller retains the old branch; creating a new one never mutates it.
  return [...moves.slice(0, ply), move.san];
}

export function explorationStartPly(moves: string[], review: boolean) {
  // Solver plays first. An even-length practice line ends with an auto reply.
  return !review && moves.length > 0 && moves.length % 2 === 0
    ? moves.length - 1
    : moves.length;
}
