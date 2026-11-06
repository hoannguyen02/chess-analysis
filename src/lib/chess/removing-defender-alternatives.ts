import { Chess, Square } from 'chess.js';
import type { DrawExercise } from './draw-practice';

// Conservative proof for short endgames: capture the defender, then the
// specified target, leaving the defender with only a king. Unknown is not wrong.
export function proveRemovingDefenderAlternative(
  exercise: DrawExercise,
  firstMove: string
): string[] | null {
  const spec = exercise.removingDefender;
  if (
    !spec ||
    exercise.goal !== 'material' ||
    !/^[a-h][1-8]$/.test(spec.target) ||
    !Number.isFinite(spec.minimumGain) ||
    spec.minimumGain <= 0
  )
    return null;
  const game = new Chess(exercise.fen);
  const solver = game.turn();
  const target = spec.target as Square;
  const targetPiece = game.get(target);
  if (!targetPiece || targetPiece.color === solver || targetPiece.type === 'k')
    return null;
  const values: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  const balance = () =>
    game
      .board()
      .flat()
      .reduce(
        (sum, piece) =>
          sum +
          (piece ? (piece.color === solver ? 1 : -1) * values[piece.type] : 0),
        0
      );
  const baseline = balance();
  const move = game.move(firstMove);
  if (!move?.captured || move.flags.includes('e') || move.to === target)
    return null;

  // Test whether the captured piece actually protected the target, using its
  // movement geometry on the original board. Pins are checked conservatively:
  // they make an alternative unverified rather than inventing an effect.
  const original = new Chess(exercise.fen);
  const defender = original.get(move.to as Square);
  const file = (s: string) => s.charCodeAt(0) - 97;
  const rank = (s: string) => Number(s[1]) - 1;
  const dx = file(target) - file(move.to);
  const dy = rank(target) - rank(move.to);
  const absX = Math.abs(dx),
    absY = Math.abs(dy);
  const slider =
    defender?.type === 'q' || defender?.type === 'r' || defender?.type === 'b';
  let attacks =
    defender?.type === 'n'
      ? absX * absY === 2
      : defender?.type === 'k'
        ? Math.max(absX, absY) === 1
        : defender?.type === 'p'
          ? absX === 1 && dy === (defender.color === 'w' ? 1 : -1)
          : defender?.type === 'b'
            ? absX === absY && absX > 0
            : defender?.type === 'r'
              ? (dx === 0) !== (dy === 0)
              : defender?.type === 'q'
                ? (absX === absY && absX > 0) || (dx === 0) !== (dy === 0)
                : false;
  if (attacks && slider) {
    let x = file(move.to) + Math.sign(dx),
      y = rank(move.to) + Math.sign(dy);
    while (x !== file(target) || y !== rank(target)) {
      if (original.get(`${String.fromCharCode(97 + x)}${y + 1}` as Square)) {
        attacks = false;
        break;
      }
      x += Math.sign(dx);
      y += Math.sign(dy);
    }
  }
  if (!attacks || game.game_over()) return null;
  // The defender must have had a legal recapture on the target before the
  // proposed move. Reconstruct the turn without changing castling rights.
  const fields = exercise.fen.split(' ');
  fields[1] = solver === 'w' ? 'b' : 'w';
  fields[3] = '-';
  const defenderTurn = new Chess(fields.join(' '));
  // A same-color target cannot normally be captured; replace it temporarily
  // with an opposing piece to test the defender's legal protection.
  defenderTurn.remove(target);
  defenderTurn.put({ type: targetPiece.type, color: solver }, target);
  const legalDefence = defenderTurn
    .moves({ verbose: true })
    .some((candidate) => candidate.from === move.to && candidate.to === target);
  if (!legalDefence) return null;

  const deadline = Date.now() + 150;
  let nodes = 0;
  let sample: string[] | null = null;
  for (const defence of game.moves()) {
    if (++nodes > 6000 || Date.now() > deadline) return null;
    game.move(defence);
    let success: string[] | null = null;
    if (!game.game_over() && game.get(target)?.color !== solver) {
      for (const capture of game.moves({ verbose: true })) {
        if (capture.to !== target || !capture.captured) continue;
        game.move(capture);
        // This narrow verifier accepts only the clearly durable bare-king
        // payoff, not a temporary material count or a drawn position.
        const bareKing = game
          .board()
          .flat()
          .every(
            (piece) => !piece || piece.color === solver || piece.type === 'k'
          );
        let safe = bareKing && !game.game_over();
        const replies = safe ? game.moves() : [];
        for (const reply of replies) {
          if (++nodes > 6000 || Date.now() > deadline) {
            safe = false;
            break;
          }
          game.move(reply);
          if (
            game.in_draw() ||
            game.in_check() ||
            balance() - baseline < spec.minimumGain
          )
            safe = false;
          game.undo();
          if (!safe) break;
        }
        if (safe && replies.length)
          success = [defence, capture.san, replies[0]];
        game.undo();
        if (success) break;
      }
    }
    game.undo();
    if (!success) return null;
    if (!sample) sample = success;
  }
  return sample;
}
