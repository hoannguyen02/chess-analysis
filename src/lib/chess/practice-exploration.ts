import { Chess, type Square } from 'chess.js';
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

export const MAX_RECORDED_VARIATIONS = 12;
export const MAX_VARIATION_PLIES = 120;

/** Also accepts the older typed input; board recording supplies canonical SAN. */
export function parsePracticeVariation(fen: string, value: unknown): string[] {
  const tokens =
    typeof value === 'string'
      ? value
          .replace(/…/g, '...')
          .replace(/\d+\s*\.(?:\s*\.)*/g, ' ')
          .trim()
          .split(/[\s,;]+/)
          .filter((token) => token && !/^(?:\.{1,3}|[-–—])$/.test(token))
      : value;
  if (
    !Array.isArray(tokens) ||
    !tokens.length ||
    tokens.length > MAX_VARIATION_PLIES
  )
    throw new Error(
      `Ghi phương án gồm nước đi của cả hai bên (tối đa ${MAX_VARIATION_PLIES} nửa nước).`
    );
  const game = new Chess(fen);
  return tokens.map((token, i) => {
    if (typeof token !== 'string') throw new Error('Phương án không hợp lệ.');
    const input = /^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(token)
      ? {
          from: token.slice(0, 2).toLowerCase() as Square,
          to: token.slice(2, 4).toLowerCase() as Square,
          promotion: token[4]?.toLowerCase() as
            | 'q'
            | 'r'
            | 'b'
            | 'n'
            | undefined,
        }
      : token;
    const move = game.move(input, { sloppy: true });
    if (!move)
      throw new Error(`Nước ${i + 1} trong phương án không hợp lệ: ${token}`);
    return move.san;
  });
}

export function recordedVariationLines(lines: string[][]) {
  const seen = new Set<string>();
  return lines
    .filter((line) => {
      const key = JSON.stringify(line);
      if (!line.length || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((line) => [...line]);
}

export type VariationRecording = {
  lines: string[][];
  branchIndex: number;
  ply: number;
};

/** Rewinding creates a branch; extending a line does not lose earlier branches. */
export function recordVariationMove(
  fen: string,
  state: VariationRecording,
  input: MoveInput
):
  | { status: 'recorded'; state: VariationRecording }
  | { status: 'illegal' | 'line-limit' | 'move-limit' } {
  const line = state.lines[state.branchIndex];
  const next = exploreMove(fen, line, state.ply, input);
  if (!next) return { status: 'illegal' };
  if (next.length > MAX_VARIATION_PLIES) return { status: 'move-limit' };
  if (line[state.ply] === next[state.ply])
    return { status: 'recorded', state: { ...state, ply: state.ply + 1 } };
  const known = state.lines.findIndex((candidate) =>
    next.every((move, i) => candidate[i] === move)
  );
  if (known >= 0)
    return {
      status: 'recorded',
      state: { ...state, branchIndex: known, ply: next.length },
    };
  if (state.ply === line.length)
    return {
      status: 'recorded',
      state: {
        ...state,
        lines: state.lines.map((item, i) =>
          i === state.branchIndex ? next : [...item]
        ),
        ply: next.length,
      },
    };
  if (state.lines.length >= MAX_RECORDED_VARIATIONS)
    return { status: 'line-limit' };
  return {
    status: 'recorded',
    state: {
      lines: [...state.lines.map((item) => [...item]), next],
      branchIndex: state.lines.length,
      ply: next.length,
    },
  };
}

export function formatPracticeVariation(fen: string, moves: string[]) {
  const game = new Chess(fen);
  return moves
    .map((san) => {
      const number = game.fen().split(' ')[5];
      const side = game.turn();
      const move = game.move(san);
      if (!move) throw new Error('Invalid recorded variation');
      return `${number}${side === 'w' ? '.' : '…'} ${move.san}`;
    })
    .join(' ');
}
