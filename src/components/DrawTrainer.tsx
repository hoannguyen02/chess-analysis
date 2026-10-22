import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { FiBookOpen } from 'react-icons/fi';
import { Chessboard } from 'react-chessboard';
import type { Square } from 'chess.js';
import type { DrawExercise } from '@/lib/chess/draw-practice';
import {
  drawPositionOutcome,
  previousDrawPosition,
  replayDrawExercise,
  tryDrawMove,
  MoveInput,
  PromotionPiece,
} from '@/lib/chess/draw-trainer';
import { useCustomBoard } from '@/hooks/useCustomBoard';
import styles from '@/styles/DrawPractice.module.css';

const DrawGameViewer = dynamic(() => import('./DrawGameViewer'), {
  ssr: false,
});

const outcomes = {
  stalemate: 'Hết nước đi',
  checkmate: 'Chiếu hết',
  material: 'Không đủ lực chiếu hết',
  ongoing: 'Ván cờ còn tiếp tục',
};

export default function DrawTrainer({
  exercise,
  onTimerPause,
  onRestart,
}: {
  exercise: DrawExercise;
  onTimerPause?: (paused: boolean) => void;
  onRestart?: () => void;
}) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const reference = exercise.gameReference;
  const viewerLabel =
    reference?.kind === 'game' ? 'Xem ván gốc' : 'Xem bài nghiên cứu';
  const lesson = exercise.outcome === 'fortress';
  const recognition = exercise.moves.length === 0;
  const [played, setPlayed] = useState<string[]>([]);
  const [review, setReview] = useState(lesson);
  const [reviewPly, setReviewPly] = useState(0);
  const [complete, setComplete] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{
    from: Square;
    to: Square;
  } | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [showPrevious, setShowPrevious] = useState(false);
  const previous = useMemo(() => previousDrawPosition(exercise), [exercise]);
  const line = review ? exercise.moves.slice(0, reviewPly) : played;
  const game = useMemo(
    () => replayDrawExercise(exercise, line),
    [exercise, line]
  );
  const boardRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(360);
  const theme = useCustomBoard();
  const canMove = !review && !recognition && !complete && !showPrevious;

  useEffect(() => {
    onTimerPause?.(review || complete || showPrevious || viewerOpen);
  }, [review, complete, showPrevious, viewerOpen, onTimerPause]);

  useEffect(() => {
    const element = boardRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.floor(entry.contentRect.width))
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  function play(move: MoveInput) {
    if (!canMove) return false;
    const result = tryDrawMove(exercise, played, move);
    setSelectedSquare(null);
    if (result.status === 'illegal') {
      setMessage(
        'Nước đi không hợp lệ. Hãy kiểm tra đường đi và an toàn của Vua.'
      );
      return false;
    }
    if (result.status === 'unrecorded') {
      setMessage(
        'Nước hợp lệ nhưng chưa có trong lời giải đã lưu; chưa thể kết luận đúng hay sai. Hãy thử nhánh mẫu hoặc dùng gợi ý.'
      );
      return false;
    }
    setPlayed(result.played);
    setComplete(result.complete);
    setPendingPromotion(null);
    setMessage(
      result.complete
        ? 'Hoàn thành! Con đã đạt mục tiêu của bài.'
        : 'Đúng nhánh mẫu! Đối thủ đã đáp lại; đến lượt con.'
    );
    return true;
  }

  function moveOnBoard(from: Square, to: Square) {
    if (!canMove || pendingPromotion) return false;
    const promotes = game
      .moves({ square: from, verbose: true })
      .some((move) => move.to === to && move.promotion);
    if (promotes) {
      setPendingPromotion({ from, to });
      setSelectedSquare(null);
      return false;
    }
    return play({ from, to });
  }

  function squareClick(square: Square) {
    if (!canMove) return;
    if (selectedSquare === square) {
      setSelectedSquare(null);
      return;
    }
    if (selectedSquare && game.get(square)?.color !== game.turn()) {
      moveOnBoard(selectedSquare, square);
    } else if (game.get(square)?.color === game.turn()) {
      setSelectedSquare(square);
    }
  }

  function restart() {
    onRestart?.();
    setPlayed([]);
    setReviewPly(0);
    setComplete(false);
    setMessage('');
    setSelectedSquare(null);
    setPendingPromotion(null);
    setShowPrevious(false);
    setReview(lesson);
  }

  const history = game.history({ verbose: true });
  const last =
    history[history.length - 1] ?? (!showPrevious ? previous?.move : undefined);
  const squareStyles: Record<string, { backgroundColor: string }> = {};
  if (last) {
    squareStyles[last.from] = { backgroundColor: '#e5cf65' };
    squareStyles[last.to] = { backgroundColor: '#e5cf65' };
  }
  if (selectedSquare)
    squareStyles[selectedSquare] = { backgroundColor: '#91b96b' };
  const initialWhite = exercise.fen.split(' ')[1] === 'w';
  const orientation = (flipped ? !initialWhite : initialWhite)
    ? 'white'
    : 'black';

  return (
    <section
      className={styles.trainer}
      aria-label={`Luyện tập: ${exercise.title}`}
    >
      <div>
        <div ref={boardRef} className={styles.board}>
          <Chessboard
            // Apply each position directly: a move plus reply may change several
            // pieces, and the board library's animation queue can retain stale squares.
            key={showPrevious && previous ? previous.fen : game.fen()}
            id="draw-practice-board"
            boardWidth={width}
            position={showPrevious && previous ? previous.fen : game.fen()}
            boardOrientation={orientation}
            customPieces={theme.customPieces}
            customDarkSquareStyle={{ backgroundColor: theme.bgDark }}
            customLightSquareStyle={{ backgroundColor: theme.bgLight }}
            customSquareStyles={squareStyles}
            arePiecesDraggable={canMove}
            onSquareClick={squareClick}
            onPieceDrop={moveOnBoard}
            onPromotionCheck={() => false}
            animationDuration={0}
          />
        </div>
        <div className={styles.controls}>
          <button type="button" onClick={() => setFlipped(!flipped)}>
            Lật bàn
          </button>
          <button type="button" onClick={restart}>
            Làm lại
          </button>
          {previous && (
            <button
              type="button"
              aria-pressed={showPrevious}
              onClick={() => setShowPrevious(!showPrevious)}
            >
              {showPrevious
                ? 'Về thế bắt đầu'
                : `Xem nước trước: ${previous.move.san}`}
            </button>
          )}
        </div>
      </div>
      <div className={styles.trainerInfo}>
        <div className={styles.titleRow}>
          <h4>
            {exercise.title}
            {exercise.difficulty && (
              <span className={styles.levelBadge} title="Mức gợi ý">
                {exercise.difficulty.level}
              </span>
            )}
          </h4>
          {reference && (
            <button
              type="button"
              title={viewerLabel}
              aria-label={viewerLabel}
              onClick={() => setViewerOpen(true)}
            >
              <FiBookOpen size={20} aria-hidden="true" />
            </button>
          )}
        </div>
        {viewerOpen && reference && (
          <DrawGameViewer
            reference={reference}
            onClose={() => setViewerOpen(false)}
          />
        )}
        <p>{exercise.prompt}</p>
        <p className={styles.note}>
          {lesson
            ? 'Bài học hai phía: dùng nút từng nước để xem cách giữ pháo đài. Hết biến minh họa không đồng nghĩa ván cờ tự động hòa.'
            : recognition
              ? 'Quan sát bàn cờ và chọn kết luận.'
              : 'Con cầm ' +
                (initialWhite ? 'Trắng' : 'Đen') +
                '. Kéo quân hoặc chạm ô đi rồi ô đến.'}
        </p>
        {!recognition && !lesson && (
          <div className={styles.controls}>
            <button
              type="button"
              aria-pressed={!review}
              onClick={() => {
                setPendingPromotion(null);
                setReview(false);
                setShowPrevious(false);
                setMessage('');
              }}
            >
              Tự giải
            </button>
            <button
              type="button"
              aria-pressed={review}
              onClick={() => {
                setPendingPromotion(null);
                setReview(true);
                setReviewPly(0);
                setShowPrevious(false);
                setMessage('');
                setSelectedSquare(null);
              }}
            >
              Xem mẫu
            </button>
          </div>
        )}
        {review && !recognition && (
          <>
            <p>
              Nước {reviewPly}/{exercise.moves.length} ·{' '}
              {game.turn() === 'w' ? 'Trắng' : 'Đen'} đi
            </p>
            <div className={styles.controls}>
              <button
                type="button"
                disabled={reviewPly === 0}
                onClick={() => {
                  setShowPrevious(false);
                  setReviewPly(reviewPly - 1);
                }}
              >
                ← Nước trước
              </button>
              <button
                type="button"
                disabled={reviewPly === exercise.moves.length}
                onClick={() => {
                  setShowPrevious(false);
                  setReviewPly(reviewPly + 1);
                }}
              >
                Nước tiếp →
              </button>
            </div>
            {reviewPly === exercise.moves.length && (
              <p>Đã xem hết biến minh họa.</p>
            )}
          </>
        )}
        {canMove && (
          <>
            {pendingPromotion && (
              <div
                className={styles.controls}
                role="group"
                aria-label="Chọn quân phong cấp"
              >
                <span>Phong cấp thành:</span>
                {(
                  [
                    ['q', 'Hậu'],
                    ['r', 'Xe'],
                    ['b', 'Tượng'],
                    ['n', 'Mã'],
                  ] as [PromotionPiece, string][]
                ).map(([piece, label]) => (
                  <button
                    key={piece}
                    type="button"
                    onClick={() => {
                      play({ ...pendingPromotion, promotion: piece });
                      setPendingPromotion(null);
                    }}
                  >
                    {label}
                  </button>
                ))}
                <button type="button" onClick={() => setPendingPromotion(null)}>
                  Hủy
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                const hint = replayDrawExercise(exercise, played).move(
                  exercise.moves[played.length]
                );
                if (hint) {
                  setSelectedSquare(hint.from);
                  setMessage(`Gợi ý: thử đi quân ở ô ${hint.from}.`);
                }
              }}
            >
              Gợi ý
            </button>
          </>
        )}
        {recognition && (
          <div className={styles.controls}>
            {Object.entries(outcomes).map(([key, label]) => (
              <button
                type="button"
                key={key}
                onClick={() => {
                  const correct = drawPositionOutcome(game) === key;
                  setComplete(correct);
                  setMessage(
                    correct
                      ? 'Đúng! Xem lời giải để đối chiếu các ô bị khống chế.'
                      : 'Chưa đúng. Kiểm tra Vua có bị chiếu và còn nước hợp lệ không.'
                  );
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        <p role="status" className={styles.feedback}>
          {message}
        </p>
        {line.length > 0 && (
          <p className={styles.moves}>
            <strong>Các nước đã đi:</strong> {line.join(' · ')}
          </p>
        )}
        {(review || complete) && (
          <div>
            <p className={styles.explanation}>{exercise.solution}</p>
            {exercise.difficulty && (
              <details className={styles.solution}>
                <summary>Vì sao ở mức {exercise.difficulty.level}?</summary>
                <p>{exercise.difficulty.reason}</p>
                <p>Mức gợi ý; giáo viên nên xem lại các nhánh trước khi dạy.</p>
              </details>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
