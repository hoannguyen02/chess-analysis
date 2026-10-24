import { useEffect, useMemo } from 'react';
import { Chess } from 'chess.js';
import { useTeachingHighlights } from './useTeachingHighlights';

type HighlightOptions = NonNullable<
  Parameters<typeof useTeachingHighlights>[0]
>;
type PieceCode = NonNullable<
  ReturnType<NonNullable<HighlightOptions['getPieceAtSquare']>>
>;

/** The same annotation gestures as SetupBoard, using the displayed position. */
export function usePracticeBoardTools(
  fen: string,
  actions: Record<string, (() => void) | undefined>,
  enabled = true
) {
  const game = useMemo(() => new Chess(fen), [fen]);
  const highlights = useTeachingHighlights({
    enabled,
    getPieceAtSquare: (square) => {
      const piece = game.get(square);
      return piece
        ? (`${piece.color}${piece.type.toUpperCase()}` as PieceCode)
        : null;
    },
    getAllPieces: () =>
      game
        .board()
        .flatMap((rank) =>
          rank.flatMap((piece) =>
            piece
              ? [
                  {
                    square: piece.square,
                    pieceCode:
                      `${piece.color}${piece.type.toUpperCase()}` as PieceCode,
                  },
                ]
              : []
          )
        ),
    getActiveTurn: () => game.turn(),
    getLegalSquaresForPiece: (square) =>
      game.moves({ square, verbose: true }).map((move) => move.to),
    getCheckSquaresForPiece: (square) =>
      game
        .moves({ square, verbose: true })
        .filter((move) => {
          const next = new Chess(fen);
          next.move(move);
          return next.in_check();
        })
        .map((move) => move.to),
  });
  const { clearHighlights } = highlights;
  useEffect(() => {
    clearHighlights();
  }, [fen, clearHighlights]);

  // Rebind with the current actions so shortcuts never use stale exercise state.
  useEffect(() => {
    if (!enabled) return;
    const handleKey = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.repeat ||
        event.isComposing ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.shiftKey
      )
        return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.closest(
            'input, textarea, select, [role="textbox"], [role="combobox"], dialog, [role="menu"]'
          ))
      )
        return;
      const action =
        actions[event.key.length === 1 ? event.key.toLowerCase() : event.key];
      if (!action) return;
      event.preventDefault();
      action();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });
  return highlights;
}
