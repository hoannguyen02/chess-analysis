import type { ComponentProps, CSSProperties } from 'react';
import { Chessboard } from 'react-chessboard';
import type { Square } from 'chess.js';
import { useCustomBoard } from '@/hooks/useCustomBoard';
import type { DrawExercise } from '@/lib/chess/draw-practice';
import { previousMoveLabel } from '@/lib/chess/worksheet';
import type { usePracticeBoardTools } from '@/hooks/usePracticeBoardTools';

type BoardProps = ComponentProps<typeof Chessboard>;
type Tools = ReturnType<typeof usePracticeBoardTools>;

/** Shared drawing, promotion and position rendering for practice boards.
 * The owner retains move validation, history and exercise progress.
 */
export default function PracticeBoard({
  id,
  fen,
  width,
  orientation,
  tools,
  squareStyles,
  canMove,
  pendingPromotion,
  onSquareClick,
  onPieceDrop,
  onPromotionPieceSelect,
  position,
  onPieceDropOffBoard,
  onSparePieceDrop,
}: {
  id: string;
  fen: string;
  width: number;
  orientation: 'white' | 'black';
  tools: Tools;
  squareStyles?: Record<string, CSSProperties>;
  canMove: boolean;
  pendingPromotion: { from: Square; to: Square } | null;
  onSquareClick: NonNullable<BoardProps['onSquareClick']>;
  onPieceDrop: NonNullable<BoardProps['onPieceDrop']>;
  onPromotionPieceSelect: NonNullable<BoardProps['onPromotionPieceSelect']>;
  position?: BoardProps['position'];
  onPieceDropOffBoard?: BoardProps['onPieceDropOffBoard'];
  onSparePieceDrop?: BoardProps['onSparePieceDrop'];
}) {
  const theme = useCustomBoard();
  return (
    <Chessboard
      // A move and automatic reply may change several squares at once.
      key={`${fen}-${tools.boardRenderKey}`}
      id={id}
      position={position ?? fen}
      boardWidth={width}
      boardOrientation={orientation}
      customPieces={theme.customPieces}
      customNotationStyle={{
        fontSize: `calc(${width / 48}px * var(--practice-coordinate-scale, 1))`,
        fontWeight: 'var(--practice-coordinate-weight, 400)',
        lineHeight: 1.2,
      }}
      customDarkSquareStyle={{ backgroundColor: theme.bgDark }}
      customLightSquareStyle={{ backgroundColor: theme.bgLight }}
      customSquareStyles={{ ...squareStyles, ...tools.customSquareStyles }}
      customArrowColor={tools.selectedColor.arrow}
      onSquareRightClick={tools.handleSquareRightClick}
      onArrowsChange={tools.handleArrowsChange}
      arePiecesDraggable={canMove && !pendingPromotion}
      onSquareClick={(square, piece) => {
        tools.handleSquareClick();
        onSquareClick(square, piece);
      }}
      onPieceDrop={onPieceDrop}
      onPieceDropOffBoard={onPieceDropOffBoard}
      onSparePieceDrop={onSparePieceDrop}
      dropOffBoardAction={onPieceDropOffBoard ? 'trash' : 'snapback'}
      onPromotionCheck={() => false}
      showPromotionDialog={Boolean(pendingPromotion)}
      promotionToSquare={pendingPromotion?.to ?? null}
      onPromotionPieceSelect={onPromotionPieceSelect}
      animationDuration={0}
    />
  );
}

/** Recorded source context stays separate from the learner's moves. */
export function PreviousMoveControl({
  fen,
  previousMove,
  showingPrevious,
  onToggle,
  disabled = false,
}: Pick<DrawExercise, 'fen' | 'previousMove'> & {
  showingPrevious: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  if (!previousMove) return null;
  return (
    <div aria-label="Nước đi trước">
      <p>{previousMoveLabel({ fen, previousMove })}</p>
      {showingPrevious && <p>Đang xem thế trước nước đi đã ghi.</p>}
      <button
        type="button"
        disabled={disabled}
        aria-pressed={showingPrevious}
        onClick={onToggle}
      >
        {showingPrevious
          ? 'Trở lại thế đang xem'
          : `Xem nước trước: ${previousMove.move}`}
      </button>
    </div>
  );
}
