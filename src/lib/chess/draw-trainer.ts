import { Chess, Square } from 'chess.js';
import type { DrawExercise } from './draw-practice';
import { proveRemovingDefenderAlternative } from './removing-defender-alternatives';

export type PromotionPiece = 'q' | 'r' | 'b' | 'n';

export type MoveInput =
  | string
  | { from: Square; to: Square; promotion?: PromotionPiece };

export function evaluateDrawDecision(exercise: DrawExercise, option: string) {
  if (!exercise.decision?.options.some((choice) => choice.id === option))
    return null;
  return option === exercise.decision.correctOption;
}

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
export function previousDrawPosition(exercise: Pick<DrawExercise, 'fen' | 'previousMove'>) {
  if (!exercise.previousMove) return null;
  const game = new Chess(exercise.previousMove.fen);
  const move = game.move(exercise.previousMove.move);
  const fen = (board: ReturnType<typeof Chess>) => {
    const fields = board.fen().split(' ');
    // An uncapturable en passant square can be omitted by PGN tools.
    if (!board.moves({ verbose: true }).some((candidate) => candidate.flags.includes('e'))) fields[3] = '-';
    return fields.join(' ');
  };
  if (!move || fen(game) !== fen(new Chess(exercise.fen))) {
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

// Prove short alternatives against every legal defence. A budget exhaustion is
// unknown, never evidence that a move wins (or that it is wrong).
function proveMateAlternative(
  game: ReturnType<typeof Chess>,
  solver: 'w' | 'b',
  remaining: number,
  objective?: () => boolean
): string[] | null {
  const deadline = Date.now() + 150;
  const exhausted = Symbol('search budget');
  let nodes = 0;
  function search(movesLeft: number): string[] | null {
    if (++nodes > 6000 || Date.now() > deadline) throw exhausted;
    if (objective?.()) return [];
    if (game.in_checkmate())
      return !objective && game.turn() !== solver ? [] : null;
    if (game.in_draw()) return null;
    const attacking = game.turn() === solver;
    if (attacking && movesLeft <= 0) return null;
    const moves = game
      .moves()
      .sort((a, b) => Number(/[+#]/.test(b)) - Number(/[+#]/.test(a)));
    let defence: string[] = [];
    for (const san of moves) {
      game.move(san);
      let tail: string[] | null;
      try {
        tail = search(movesLeft - (attacking ? 1 : 0));
      } finally {
        game.undo();
      }
      if (attacking && tail !== null) return [san, ...tail];
      if (!attacking) {
        if (tail === null) return null;
        if (tail.length + 1 > defence.length) defence = [san, ...tail];
      }
    }
    return attacking ? null : defence;
  }
  try {
    return search(remaining);
  } catch (error) {
    if (error === exhausted) return null;
    throw error;
  }
}

// The gain is measured in centipawns against the starting material balance.
// Completion waits for a defensive reply. Reviewed promotion threats may win material when an exchange is declined.
export function promotionGainReached(
  exercise: DrawExercise,
  game: ReturnType<typeof Chess>
) {
  if (!exercise.promotionGain) return false;
  const initial = new Chess(exercise.fen);
  const solver = initial.turn();
  const values: Record<string, number> = {
    p: 100,
    n: 320,
    b: 330,
    r: 500,
    q: 900,
    k: 0,
  };
  const balance = (board: ReturnType<typeof Chess>) =>
    board
      .board()
      .flat()
      .reduce(
        (sum, piece) =>
          sum +
          (piece ? values[piece.type] * (piece.color === solver ? 1 : -1) : 0),
        0
      );
  const promoted = game
    .history({ verbose: true })
    .some(
      (move) =>
        typeof move !== 'string' && move.color === solver && move.promotion
    );
  const minimum = exercise.promotionGain.minimumGain;
  const baseline = balance(initial);
  if (!(promoted || exercise.promotionGain.allowUnrealizedThreat) ||
      game.in_draw() || balance(game) - baseline < minimum ||
      !(game.turn() === solver || (game.in_checkmate() && game.turn() !== solver))) return false;
  if (!exercise.promotionGain.verifyCheckingReplies) return true;
  const board = new Chess(game.fen());
  const deadline = Date.now() + 40;
  let nodes = 0;
  function secure(left: number): boolean {
    if (++nodes > 2000 || Date.now() > deadline || balance(board) - baseline < minimum) return false;
    if (board.in_checkmate()) return board.turn() !== solver;
    if (board.in_draw()) return false;
    const own = board.turn() === solver;
    if (own && !board.in_check()) return true;
    if (own && !left) return false;
    const moves = board.moves();
    for (const move of moves) {
      board.move(move);
      const safe = secure(left - Number(own));
      board.undo();
      if (own && safe) return true;
      if (!own && !safe) return false;
    }
    return !own && moves.length > 0;
  }
  return secure(2);
}

// Direct promotion tasks certify the material gain against every legal reply.
// This is deliberately limited to one-move introductory tasks; it is not a
// general engine assessment or a claim that a material edge wins the game.
export function verifyDirectPromotionMaterial(
  exercise: DrawExercise,
  input: MoveInput
) {
  if (!exercise.promotionMaterial) return null;
  const board = new Chess(exercise.fen);
  if (
    ![3, 4, 5, 6].includes(board.board().flat().filter(Boolean).length) ||
    board
      .board()
      .flat()
      .filter((piece) => piece?.type === 'p' && piece.color === board.turn())
      .length < 1
  )
    return null;
  const solver = board.turn();
  const values: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  const material = () =>
    board
      .board()
      .flat()
      .reduce(
        (sum, piece) =>
          sum +
          (piece ? values[piece.type] * (piece.color === solver ? 1 : -1) : 0),
        0
      );
  const before = material();
  const promotion = board.move(input);
  if (!promotion?.promotion || board.in_draw()) return null;
  if (board.in_checkmate()) return { moves: [promotion.san] };
  const replies = board.moves();
  if (replies.length > 100) return null;
  for (const reply of replies) {
    board.move(reply);
    const reached =
      !board.game_over() &&
      (!exercise.promotionMaterial.retainPromotedPiece ||
        (board.get(promotion.to)?.type === promotion.promotion &&
          board.get(promotion.to)?.color === solver)) &&
      material() - before >= exercise.promotionMaterial.minimumGain;
    board.undo();
    if (!reached) return null;
  }
  return replies.length ? { moves: [promotion.san, replies[0]] } : null;
}

export function tryDrawMove(
  exercise: DrawExercise,
  played: string[],
  input: MoveInput
) {
  // Decision examples retain a review line, but it is not a solution to play.
  if (exercise.decision)
    return { status: 'unrecorded' as const, played, complete: false };
  const game = replayDrawExercise(exercise, played);
  const branches = [exercise.moves, ...(exercise.alternativeLines ?? [])];
  const matches = branches.filter((branch) =>
    played.every((move, i) => move === branch[i])
  );
  const active = matches[0] ?? exercise.moves;
  if (played.length >= active.length || game.game_over()) {
    return {
      status: 'finished' as const,
      played,
      complete: exercise.promotionGain
        ? promotionGainReached(exercise, game)
        : true,
    };
  }
  const normalized =
    typeof input === 'string' && /^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(input)
      ? {
          from: input.slice(0, 2).toLowerCase() as Square,
          to: input.slice(2, 4).toLowerCase() as Square,
          promotion: input[4]?.toLowerCase() as PromotionPiece | undefined,
        }
      : input;
  if (exercise.promotionMaterial && played.length === 0) {
    if (!new Chess(exercise.fen).move(normalized))
      return { status: 'illegal' as const, played, complete: false };
    const verified = verifyDirectPromotionMaterial(exercise, normalized);
    if (verified)
      return {
        status: 'accepted' as const,
        played: verified.moves,
        complete: true,
        continuation: verified.moves,
      };
    const probe = new Chess(exercise.fen);
    const attempted = probe.move(normalized);
    const promotionFailure = attempted?.promotion
      ? probe.in_stalemate()
        ? ('stalemate' as const)
        : probe.insufficient_material()
          ? ('dead' as const)
          : ('material' as const)
      : undefined;
    return {
      status: 'unrecorded' as const,
      played,
      complete: false,
      promotionFailure,
    };
  }
  const positionBeforeMove = game.fen();
  const move = game.move(normalized);
  if (!move) return { status: 'illegal' as const, played, complete: false };
  const selected = matches.find((branch) => {
    const expected = new Chess(positionBeforeMove).move(branch[played.length]);
    return (
      expected &&
      move.from === expected.from &&
      move.to === expected.to &&
      move.promotion === expected.promotion
    );
  });
  const sameMove = Boolean(selected);
  const selectedLine = selected ?? active;
  // Accept alternative moves that demonstrably achieve the requested draw.
  const terminalDraw =
    exercise.outcome !== 'fortress' &&
    drawPositionOutcome(game) === exercise.outcome;
  if (!sameMove && played.length === 0 && exercise.outcome === 'removing-defender') {
    const tail = proveRemovingDefenderAlternative(exercise, move.san);
    if (tail) {
      return {
        status: 'accepted' as const,
        played: [move.san, tail[0]],
        complete: false,
        continuation: [move.san, ...tail],
      };
    }
  }
  if (!sameMove && exercise.promotionGain) {
    const solver = new Chess(exercise.fen).turn();
    const remaining =
      exercise.promotionGain.solverMoves - Math.ceil((played.length + 1) / 2);
    const tail = proveMateAlternative(game, solver, remaining, () =>
      promotionGainReached(exercise, game)
    );
    if (tail !== null) {
      const continuation = [...played, move.san, ...tail];
      const next = [...played, move.san];
      if (tail.length) {
        const reply = game.move(tail[0]);
        if (!reply) throw new Error('Invalid verified reply');
        next.push(reply.san);
      }
      return {
        status: 'accepted' as const,
        played: next,
        complete: promotionGainReached(exercise, game),
        continuation,
      };
    }
  }
  if (!sameMove && !terminalDraw && exercise.outcome === 'checkmate') {
    const remaining =
      Math.ceil(exercise.moves.length / 2) - Math.ceil((played.length + 1) / 2);
    const tail = proveMateAlternative(game, move.color, remaining);
    if (tail !== null) {
      const continuation = [...played, move.san, ...tail];
      const next = [...played, move.san];
      if (tail.length) {
        const reply = game.move(tail[0]);
        if (!reply) throw new Error('Invalid verified opponent reply');
        next.push(reply.san);
      }
      return {
        status: 'accepted' as const,
        played: next,
        complete: game.in_checkmate(),
        continuation,
      };
    }
  }
  if (!sameMove && !terminalDraw) {
    return { status: 'unrecorded' as const, played, complete: false };
  }
  const next = [...played, move.san];
  if (!terminalDraw && next.length < selectedLine.length) {
    const reply = game.move(selectedLine[next.length]);
    if (!reply) throw new Error('Invalid stored opponent reply');
    next.push(reply.san);
  }
  return {
    status: 'accepted' as const,
    played: next,
    complete: exercise.promotionGain
      ? promotionGainReached(exercise, game)
      : next.length >= selectedLine.length ||
        game.game_over() ||
        drawPositionOutcome(game) === exercise.outcome,
  };
}
