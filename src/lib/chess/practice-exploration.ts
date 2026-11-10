import { Chess, type ChessInstance, type Square } from 'chess.js';
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

export const variationEndLabels = {
  checkmate: 'Chiếu hết',
  stalemate: 'Hòa do hết nước đi (pat)',
  material: 'Hòa vì không đủ lực chiếu hết',
  threefold: 'Hòa do cùng một thế cờ xuất hiện 3 lần',
  fiftyMoves: 'Hòa theo luật 50 nước',
};

type VariationEnd = keyof typeof variationEndLabels;

function chessComMaterialDraw(game: ChessInstance) {
  if (game.insufficient_material()) return true;
  const pieces = game
    .board()
    .flat()
    .flatMap((piece) => (piece && piece.type !== 'k' ? [piece] : []));
  if (pieces.length !== 2) return false;
  const [first, second] = pieces;
  if (first.type !== 'b' && first.type !== 'n') return false;
  if (second.type !== 'b' && second.type !== 'n') return false;

  // Chess.com Live draws with one minor per side or two knights versus a
  // bare king, unless the side to move can deliver mate immediately.
  return (
    (first.color !== second.color ||
      (first.type === 'n' && second.type === 'n')) &&
    !game.moves().some((move) => move.endsWith('#'))
  );
}

function variationReplay(fen: string) {
  const game = new Chess();
  if (!game.load(fen)) throw new Error('Thế cờ không hợp lệ.');
  const occurrences = new Map<string, number>();
  let repetitions = 0;
  let halfmoves = 0;

  function rememberPosition() {
    const fields = game.fen().split(' ');
    // Repetition counts a right to capture en passant only if the capture is legal.
    if (
      fields[3] !== '-' &&
      !game.moves({ verbose: true }).some((move) => move.flags.includes('e'))
    )
      fields[3] = '-';
    const key = fields.slice(0, 4).join(' ');
    repetitions = (occurrences.get(key) ?? 0) + 1;
    occurrences.set(key, repetitions);
    halfmoves = Number(fields[4]);
  }

  function end(): VariationEnd | null {
    if (game.in_checkmate()) return 'checkmate';
    if (game.in_stalemate()) return 'stalemate';
    if (chessComMaterialDraw(game)) return 'material';
    if (repetitions >= 3) return 'threefold';
    if (halfmoves >= 100) return 'fiftyMoves';
    return null;
  }

  rememberPosition();
  return {
    game,
    end,
    play(input: MoveInput, sloppy = false) {
      const move = game.move(input, { sloppy });
      if (move) rememberPosition();
      return move;
    },
  };
}

/** Keep older lines navigable, while remembering the first position that ended play. */
export function recordingPosition(fen: string, moves: string[], ply: number) {
  if (!Number.isInteger(ply) || ply < 0 || ply > moves.length)
    throw new Error('Invalid recording position');
  const replay = variationReplay(fen);
  let ended: { ply: number; reason: VariationEnd } | null = null;
  for (let i = 0; i <= ply; i++) {
    if (!ended) {
      const reason = replay.end();
      if (reason) ended = { ply: i, reason };
    }
    if (i < ply && !replay.play(moves[i]))
      throw new Error(`Invalid exploration move: ${moves[i]}`);
  }
  return { game: replay.game, ended };
}

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
  const replay = variationReplay(fen);
  return tokens.map((token, i) => {
    if (typeof token !== 'string') throw new Error('Phương án không hợp lệ.');
    const end = replay.end();
    if (end)
      throw new Error(
        `${variationEndLabels[end]}. Không thể ghi nước thứ ${i + 1} trong phương án.`
      );
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
    const move = replay.play(input, true);
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
  | { status: 'illegal' | 'line-limit' | 'move-limit' }
  | { status: 'ended'; reason: VariationEnd } {
  const line = state.lines[state.branchIndex];
  const { game, ended } = recordingPosition(fen, line, state.ply);
  if (ended) return { status: 'ended', reason: ended.reason };
  const move = game.move(input);
  if (!move) return { status: 'illegal' };
  const next = [...line.slice(0, state.ply), move.san];
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
