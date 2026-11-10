import { Chess } from 'chess.js';

/** Keep the legal move rights, while ignoring the FEN clocks. */
export function practicePositionKey(fen: string) {
  const board = new Chess(fen);
  const fields = board.fen().split(' ').slice(0, 4);
  if (
    fields[3] !== '-' &&
    !board.moves({ verbose: true }).some((move) => move.flags.includes('e'))
  )
    fields[3] = '-';
  return fields.join(' ');
}
