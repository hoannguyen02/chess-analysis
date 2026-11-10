import {
  Chess,
  type Move,
  type PieceColor,
  type PieceType,
  type Square,
} from 'chess.js';
import type { DrawExercise } from './draw-practice';

export type BeginnerTacticPosition = {
  /** Zero-based ply in the original stored teaching line, before the move. */
  ply: number;
  fen: string;
  previousMove?: { fen: string; move: string };
  move: string;
  detected: boolean;
};

export type BeginnerTacticExtraction = {
  positions: BeginnerTacticPosition[];
  suggestedPly: number | null;
  detection: 'explicit' | 'geometry' | 'manual';
  reason?: string;
};

export type BeginnerTacticSource = Pick<
  DrawExercise,
  'fen' | 'moves' | 'previousMove' | 'outcome'
> & { tacticPly?: number };

type Board = ReturnType<typeof Chess>;
type Piece = { type: PieceType; color: PieceColor; square: Square };
type Position = Map<Square, Piece>;
const values: Record<PieceType, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 100,
};
const directions = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];
const coordinates = (square: Square) => [
  square.charCodeAt(0) - 97,
  Number(square[1]) - 1,
];
const squareAt = (file: number, rank: number): Square | null =>
  file >= 0 && file < 8 && rank >= 0 && rank < 8
    ? (`${String.fromCharCode(97 + file)}${rank + 1}` as Square)
    : null;
const positionOf = (board: Board): Position =>
  new Map(
    board
      .board()
      .flatMap((rank) => rank.filter((piece): piece is Piece => piece !== null))
      .map((piece) => [piece.square, piece])
  );
function attacks(position: Position, from: Square, to: Square) {
  const piece = position.get(from);
  if (!piece || from === to) return false;
  const [file, rank] = coordinates(from),
    [targetFile, targetRank] = coordinates(to);
  const dx = targetFile - file,
    dy = targetRank - rank;
  if (piece.type === 'p')
    return Math.abs(dx) === 1 && dy === (piece.color === 'w' ? 1 : -1);
  if (piece.type === 'n') return Math.abs(dx) * Math.abs(dy) === 2;
  if (piece.type === 'k') return Math.max(Math.abs(dx), Math.abs(dy)) === 1;
  const diagonal = Math.abs(dx) === Math.abs(dy),
    straight = dx === 0 || dy === 0;
  if (
    !(piece.type === 'q'
      ? diagonal || straight
      : piece.type === 'b'
        ? diagonal
        : straight)
  )
    return false;
  for (
    let x = file + Math.sign(dx), y = rank + Math.sign(dy);
    x !== targetFile || y !== targetRank;
    x += Math.sign(dx), y += Math.sign(dy)
  ) {
    const square = squareAt(x, y);
    if (!square || position.has(square)) return false;
  }
  return true;
}

type Alignment = {
  slider: Square;
  front: Square;
  back: Square;
  absolute: boolean;
};
function alignments(
  position: Position,
  color: PieceColor,
  skewer: boolean
): Alignment[] {
  const result: Alignment[] = [];
  for (const piece of position.values()) {
    if (piece.color !== color || !['b', 'r', 'q'].includes(piece.type))
      continue;
    const [file, rank] = coordinates(piece.square);
    for (const [dx, dy] of directions) {
      if (
        (piece.type === 'b' && (!dx || !dy)) ||
        (piece.type === 'r' && dx && dy)
      )
        continue;
      let front: Piece | undefined;
      for (let step = 1; step < 8; step++) {
        const square = squareAt(file + step * dx, rank + step * dy);
        if (!square) break;
        const target = position.get(square);
        if (!target) continue;
        if (target.color === color) break;
        if (!front) {
          front = target;
          continue;
        }
        const matches = skewer
          ? front.type === 'k' || values[front.type] > values[target.type]
          : target.type === 'k' || values[target.type] > values[front.type];
        if (matches)
          result.push({
            slider: piece.square,
            front: front.square,
            back: target.square,
            absolute: (skewer ? front : target).type === 'k',
          });
        break;
      }
    }
  }
  return result;
}
function createsAlignment(
  before: Position,
  after: Position,
  move: Move,
  skewer: boolean,
  absolute?: boolean
) {
  const old = alignments(before, move.color, skewer);
  return alignments(after, move.color, skewer).some(
    (item) =>
      (absolute === undefined || item.absolute === absolute) &&
      !old.some(
        (previous) =>
          previous.front === item.front &&
          previous.back === item.back &&
          (previous.slider === item.slider ||
            (previous.slider === move.from && item.slider === move.to))
      )
  );
}
function geometricMatch(
  motif: string,
  before: Position,
  after: Position,
  move: Move,
  board: Board
) {
  const name = motif.replace(/[^a-z]/gi, '').toLowerCase();
  switch (name) {
    case 'fork':
    case 'doubleattack': {
      const targets = [...after.values()].filter(
        (piece) =>
          piece.color !== move.color && attacks(after, move.to, piece.square)
      );
      return (
        targets.length >= 2 &&
        targets.some((target) => !attacks(before, move.from, target.square))
      );
    }
    case 'pin':
    case 'absolutepin':
    case 'relativepin': {
      if (
        createsAlignment(
          before,
          after,
          move,
          false,
          name === 'pin' ? undefined : name === 'absolutepin'
        )
      )
        return true;
      if (!move.captured || name === 'relativepin') return false;
      // A captured target was protected geometrically by an absolutely pinned
      // piece, but that recapture is not legal. This identifies a review lead.
      return alignments(before, move.color, false).some(
        (pin) =>
          pin.absolute &&
          alignments(after, move.color, false).some(
            (remaining) =>
              remaining.absolute &&
              remaining.front === pin.front &&
              remaining.back === pin.back
          ) &&
          attacks(before, pin.front, move.to) &&
          !board
            .moves({ verbose: true })
            .some((reply) => reply.from === pin.front && reply.to === move.to)
      );
    }
    case 'skewer':
      return createsAlignment(before, after, move, true);
    case 'discovery':
    case 'discoveredattack':
    case 'discoveredcheck':
    case 'doublecheck': {
      return [...after.values()].some(
        (slider) =>
          slider.color === move.color &&
          ['b', 'r', 'q'].includes(slider.type) &&
          slider.square !== move.to &&
          before.get(slider.square)?.type === slider.type &&
          before.get(slider.square)?.color === move.color &&
          [...after.values()].some(
            (target) =>
              target.color !== move.color &&
              (!['discoveredcheck', 'doublecheck'].includes(name) ||
                target.type === 'k') &&
              (name !== 'doublecheck' ||
                attacks(after, move.to, target.square)) &&
              attacks(after, slider.square, target.square) &&
              !attacks(before, slider.square, target.square)
          )
      );
    }
    case 'promotion':
      return Boolean(move.promotion);
    case 'underpromotion':
      return Boolean(move.promotion && move.promotion !== 'q');
    case 'checkmate':
    case 'mate':
      return board.in_checkmate();
    case 'stalemate':
      return board.in_stalemate();
    default:
      return false;
  }
}

function comparableFen(board: Board) {
  const fields = board.fen().split(' ');
  if (!board.moves({ verbose: true }).some((move) => move.flags.includes('e')))
    fields[3] = '-';
  return fields.join(' ');
}

/**
 * Replays stored teaching moves without engine work or publication approval.
 * A geometric match is a review lead; unknown motifs require a chosen frame.
 */
export function beginnerTacticFrames(
  exercise: BeginnerTacticSource,
  motif: string
): BeginnerTacticExtraction {
  const invalid = (reason: string): BeginnerTacticExtraction => ({
    positions: [],
    suggestedPly: null,
    detection: 'manual',
    reason,
  });
  try {
    if (
      !Array.isArray(exercise.moves) ||
      !exercise.moves.length ||
      exercise.moves.length > 120 ||
      exercise.moves.some((move) => typeof move !== 'string' || !move.trim())
    )
      return invalid('invalid-line');
    const board = new Chess();
    if (!board.validate_fen(exercise.fen).valid || !board.load(exercise.fen))
      return invalid('invalid-fen');
    const solver = board.turn();
    if (
      exercise.tacticPly !== undefined &&
      (!Number.isInteger(exercise.tacticPly) ||
        exercise.tacticPly < 0 ||
        exercise.tacticPly >= exercise.moves.length ||
        exercise.tacticPly % 2 !== 0)
    )
      return invalid('invalid-tactic-ply');
    let previousMove: BeginnerTacticPosition['previousMove'];
    if (exercise.previousMove) {
      const previous = new Chess();
      if (
        !previous.validate_fen(exercise.previousMove.fen).valid ||
        !previous.load(exercise.previousMove.fen)
      )
        return invalid('invalid-previous-move');
      const move = previous.move(exercise.previousMove.move, { sloppy: true });
      if (!move || comparableFen(previous) !== comparableFen(board))
        return invalid('invalid-previous-move');
      previousMove = { fen: exercise.previousMove.fen, move: move.san };
    }
    const positions: BeginnerTacticPosition[] = [];
    for (let ply = 0; ply < exercise.moves.length; ply++) {
      if (board.in_checkmate() || board.in_stalemate())
        return invalid('move-after-terminal-position');
      const fen = board.fen(),
        before = positionOf(board),
        turn = board.turn();
      const move = board.move(exercise.moves[ply], { sloppy: true });
      if (!move) return invalid('illegal-source-move');
      if (turn === solver)
        positions.push({
          ply,
          fen,
          ...(previousMove ? { previousMove: { ...previousMove } } : {}),
          move: move.san,
          detected: geometricMatch(
            motif,
            before,
            positionOf(board),
            move,
            board
          ),
        });
      previousMove = { fen, move: move.san };
    }
    if (exercise.tacticPly !== undefined) {
      const selected = positions.find(
        (position) => position.ply === exercise.tacticPly
      );
      if (!selected) return invalid('invalid-tactic-ply');
      selected.detected = true;
      return { positions, suggestedPly: selected.ply, detection: 'explicit' };
    }
    const suggested = positions.find((position) => position.detected);
    return {
      positions,
      suggestedPly: suggested?.ply ?? null,
      detection: suggested ? 'geometry' : 'manual',
    };
  } catch {
    return invalid('invalid-source');
  }
}
