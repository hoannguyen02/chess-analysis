import { usePracticeBoardTools } from '@/hooks/usePracticeBoardTools';
import type { GameSource, ReferenceGame } from '@/lib/chess/draw-game-viewer';
import type { DrawExercise } from '@/lib/chess/draw-practice';
import {
  drawPositionOutcome,
  evaluateDrawDecision,
  MoveInput,
  previousDrawPosition,
  PromotionPiece,
  replayDrawExercise,
  tryDrawMove,
} from '@/lib/chess/draw-trainer';
import { explorationStartPly } from '@/lib/chess/practice-exploration';
import styles from '@/styles/ChessPractice.module.css';
import type { Square } from 'chess.js';
import { Tooltip } from 'flowbite-react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import {
  FiBookOpen,
  FiChevronLeft,
  FiChevronRight,
  FiExternalLink,
  FiGitBranch,
  FiRefreshCw,
  FiRotateCcw,
  FiSkipBack,
  FiSkipForward,
} from 'react-icons/fi';
import GamePlayerNames from './GamePlayerNames';
import PracticeBoard from './PracticeBoard';
import PracticeExploration from './PracticeExploration';

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
  onPreviousExercise,
  onNextExercise,
  gameSource,
  referenceGames,
  onComplete,
}: {
  exercise: DrawExercise;
  gameSource?: GameSource;
  referenceGames?: ReferenceGame[];
  onComplete?: (assisted: boolean) => void;
  onTimerPause?: (paused: boolean) => void;
  onRestart?: () => void;
  onPreviousExercise?: () => void;
  onNextExercise?: () => void;
}) {
  const [assisted, setAssisted] = useState(false);
  const opening = exercise.outcome === 'opening';
  const [exploring, setExploring] = useState(false);
  const [hasExplored, setHasExplored] = useState(false);
  const exploreButtonRef = useRef<HTMLButtonElement>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const reference = exercise.gameReference;
  const viewerLabel =
    reference?.kind === 'game' ? 'Xem ván gốc' : 'Xem bài nghiên cứu';
  const lesson = exercise.outcome === 'fortress';
  const decision = exercise.decision;
  const recognition = !decision && exercise.moves.length === 0;
  const [played, setPlayed] = useState<string[]>([]);
  const [review, setReview] = useState(lesson);
  const [reviewPly, setReviewPly] = useState(0);
  const [historyPly, setHistoryPly] = useState<number | null>(null);
  const [complete, setComplete] = useState(false);
  const [message, setMessage] = useState('');
  const [feedbackKind, setFeedbackKind] = useState<
    'info' | 'error' | 'retry' | 'success'
  >('info');

  const [moveFeedback, setMoveFeedback] = useState<{ square: Square } | null>(
    null
  );
  const [hintCount, setHintCount] = useState(0);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{
    from: Square;
    to: Square;
  } | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [showPrevious, setShowPrevious] = useState(false);
  const previous = useMemo(() => previousDrawPosition(exercise), [exercise]);
  const availableMoves = review ? exercise.moves : played;
  const currentPly = review ? reviewPly : (historyPly ?? played.length);
  const browsingHistory = !review && currentPly < played.length;
  const line = availableMoves.slice(0, currentPly);
  const game = useMemo(
    () => replayDrawExercise(exercise, line),
    [exercise, line]
  );
  const boardRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(360);
  const canMove =
    !decision &&
    !review &&
    !recognition &&
    !complete &&
    !showPrevious &&
    !browsingHistory;

  useEffect(() => {
    if (!message || feedbackKind === 'info') return;
    const timeout = window.setTimeout(() => setMessage(''), 4000);
    return () => window.clearTimeout(timeout);
  }, [message, feedbackKind, played, moveFeedback]);

  useEffect(() => {
    onTimerPause?.(
      exploring ||
        review ||
        complete ||
        showPrevious ||
        viewerOpen ||
        browsingHistory
    );
  }, [
    exploring,
    review,
    complete,
    showPrevious,
    viewerOpen,
    browsingHistory,
    onTimerPause,
  ]);

  useEffect(() => {
    const element = boardRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.floor(entry.contentRect.width))
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [exploring]);

  function play(move: MoveInput) {
    if (!canMove) return false;
    const destination =
      typeof move === 'string'
        ? replayDrawExercise(exercise, played).move(move)?.to
        : move.to;
    setMoveFeedback(destination ? { square: destination } : null);
    const result = tryDrawMove(exercise, played, move);
    setSelectedSquare(null);
    if (result.status === 'illegal') {
      setFeedbackKind('error');
      setMessage('Nước đi không hợp lệ.');
      return false;
    }
    if (result.status === 'unrecorded') {
      setFeedbackKind(opening ? 'info' : 'retry');
      setMessage(
        opening
          ? 'Nước hợp lệ này chưa có trong bộ biến đã kiểm tra. Bạn có thể dùng “Thử nước khác” để khám phá.'
          : 'Nước này chưa có trong lời giải. Thử nước khác.'
      );
      return false;
    }
    setFeedbackKind('success');
    setHintCount(0);
    setPlayed(result.played);
    setHistoryPly(null);
    setComplete(result.complete);
    if (result.complete) onComplete?.(assisted);
    setPendingPromotion(null);
    setMessage(result.complete ? 'Hoàn thành' : 'Đúng, tiếp tục.');
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
    if (!canMove || pendingPromotion) return;
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
    tools.clearHighlights();
    onRestart?.();
    setHasExplored(false);
    setAssisted(false);
    setMoveFeedback(null);
    setHintCount(0);
    setPlayed([]);
    setHistoryPly(null);
    setReviewPly(0);
    setComplete(false);
    setMessage('');
    setFeedbackKind('info');
    setSelectedSquare(null);
    setPendingPromotion(null);
    setShowPrevious(false);
    setReview(lesson);
  }

  function navigateMove(offset: -1 | 1) {
    const nextPly = (showPrevious ? -1 : currentPly) + offset;
    if (nextPly < (previous ? -1 : 0) || nextPly > availableMoves.length)
      return;
    setShowPrevious(nextPly === -1);
    if (review) setReviewPly(Math.max(0, nextPly));
    else setHistoryPly(nextPly === played.length ? null : Math.max(0, nextPly));
    setSelectedSquare(null);
    setPendingPromotion(null);
    setMoveFeedback(null);
    setMessage('');
  }

  const displayedFen = showPrevious && previous ? previous.fen : game.fen();
  const tools = usePracticeBoardTools(
    displayedFen,
    {
      f: () => setFlipped((value) => !value),
      r: restart,
      ArrowLeft: onPreviousExercise,
      ArrowRight: onNextExercise,
      b: previous ? () => setShowPrevious(true) : undefined,
      n: previous ? () => setShowPrevious(false) : undefined,
    },
    !exploring && !viewerOpen && !pendingPromotion
  );

  const history = game.history({ verbose: true });
  const last =
    history[history.length - 1] ?? (!showPrevious ? previous?.move : undefined);
  const squareStyles: Record<string, CSSProperties> = {};
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

  if (exploring)
    return (
      <PracticeExploration
        fen={exercise.fen}
        moves={browsingHistory ? played : line}
        initialPly={
          browsingHistory ? currentPly : explorationStartPly(line, review)
        }
        orientation={orientation}
        onClose={() => {
          setExploring(false);
          requestAnimationFrame(() =>
            exploreButtonRef.current?.focus({ preventScroll: true })
          );
        }}
      />
    );

  return (
    <section
      className={styles.trainer}
      aria-label={`Luyện tập: ${exercise.playerTitle || exercise.title}`}
    >
      <div>
        <div
          ref={boardRef}
          className={styles.board}
          {...tools.boardInteractionProps}
          aria-label="Bàn cờ và công cụ đánh dấu"
        >
          <PracticeBoard
            id="draw-practice-board"
            fen={displayedFen}
            width={width}
            orientation={orientation}
            tools={tools}
            squareStyles={squareStyles}
            canMove={canMove}
            pendingPromotion={pendingPromotion}
            onSquareClick={squareClick}
            onPieceDrop={moveOnBoard}
            onPromotionPieceSelect={(piece) => {
              if (piece && pendingPromotion) {
                play({
                  ...pendingPromotion,
                  promotion: piece[1].toLowerCase() as PromotionPiece,
                });
              }
              setPendingPromotion(null);
              // The practice state applies the complete resulting position.
              return false;
            }}
          />
          <div role="status" aria-live="polite" aria-atomic="true">
            {message &&
              feedbackKind !== 'info' &&
              !pendingPromotion &&
              !showPrevious && (
                <>
                  <span className={styles.feedbackAnnouncement}>{message}</span>
                  {moveFeedback && (
                    <span
                      aria-hidden="true"
                      className={styles.moveFeedback}
                      data-kind={feedbackKind}
                      style={{
                        left: `${(orientation === 'white' ? moveFeedback.square.charCodeAt(0) - 97 : 104 - moveFeedback.square.charCodeAt(0)) * 12.5}%`,
                        top: `${(orientation === 'white' ? 8 - Number(moveFeedback.square[1]) : Number(moveFeedback.square[1]) - 1) * 12.5}%`,
                      }}
                    >
                      <span>
                        {feedbackKind === 'success'
                          ? '✓'
                          : feedbackKind === 'error'
                            ? '✕'
                            : '↻'}
                      </span>
                    </span>
                  )}
                </>
              )}
          </div>
        </div>
        {(availableMoves.length > 0 || previous) && (
          <div
            className={styles.moveNavigation}
            role="group"
            aria-label="Xem từng nước"
          >
            <Tooltip content="Nước trước" placement="top">
              <button
                type="button"
                aria-label="Nước trước"
                disabled={
                  showPrevious ||
                  (currentPly === 0 && !previous) ||
                  Boolean(pendingPromotion)
                }
                onClick={() => navigateMove(-1)}
              >
                <FiChevronLeft size={20} aria-hidden="true" />
              </button>
            </Tooltip>
            <span aria-live="polite">
              {showPrevious
                ? 'Trước thế bắt đầu'
                : `${currentPly}/${availableMoves.length}`}
            </span>
            <Tooltip content="Nước tiếp" placement="top">
              <button
                type="button"
                aria-label="Nước tiếp"
                disabled={
                  (!showPrevious && currentPly === availableMoves.length) ||
                  Boolean(pendingPromotion)
                }
                onClick={() => navigateMove(1)}
              >
                <FiChevronRight size={20} aria-hidden="true" />
              </button>
            </Tooltip>
          </div>
        )}
        {browsingHistory && (
          <p className={styles.historyNote}>
            Đang xem lại. Về nước cuối để tiếp tục giải.
          </p>
        )}
        <div
          className={`${styles.controls} ${styles.boardActions} ${styles.iconActions}`}
        >
          <Tooltip content="Lật bàn (F)" placement="top">
            <button
              type="button"
              onClick={() => setFlipped(!flipped)}
              aria-keyshortcuts="f"
              aria-label="Lật bàn"
            >
              <FiRefreshCw size={20} aria-hidden="true" />
            </button>
          </Tooltip>
          <Tooltip content="Làm lại (R)" placement="top">
            <button
              type="button"
              onClick={restart}
              aria-keyshortcuts="r"
              aria-label="Làm lại"
            >
              <FiRotateCcw size={20} aria-hidden="true" />
            </button>
          </Tooltip>
          <Tooltip content="Thử nước khác" placement="top">
            <button
              ref={exploreButtonRef}
              aria-label="Thử nước khác"
              type="button"
              disabled={showPrevious || Boolean(pendingPromotion)}
              onClick={() => {
                setAssisted(true);
                setHasExplored(true);
                setExploring(true);
              }}
            >
              <FiGitBranch size={20} aria-hidden="true" />
            </button>
          </Tooltip>
          {exercise.outcome === 'skewer' && (
            <Tooltip
              content="Phân tích thế hiện tại trong tab mới"
              placement="top"
            >
              <Link
                href={{
                  pathname: '/analysis',
                  query: {
                    fen: showPrevious && previous ? previous.fen : game.fen(),
                  },
                }}
                prefetch={false}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Phân tích thế hiện tại trong tab mới"
              >
                <FiExternalLink size={20} aria-hidden="true" />
              </Link>
            </Tooltip>
          )}
          {previous && (
            <Tooltip
              content={
                showPrevious
                  ? 'Về thế bắt đầu (N)'
                  : `Xem nước trước: ${previous.move.san} (B)`
              }
              placement="top"
            >
              <button
                type="button"
                aria-pressed={showPrevious}
                aria-keyshortcuts="b n"
                aria-label={
                  showPrevious
                    ? 'Về thế bắt đầu'
                    : `Xem nước trước: ${previous.move.san}`
                }
                onClick={() => setShowPrevious(!showPrevious)}
              >
                {showPrevious ? (
                  <FiSkipForward size={20} aria-hidden="true" />
                ) : (
                  <FiSkipBack size={20} aria-hidden="true" />
                )}
              </button>
            </Tooltip>
          )}
        </div>
      </div>
      <div className={`${styles.trainerInfo} ${styles.brandedTrainerInfo}`}>
        <div>
          <div className={styles.titleRow}>
            <h4>
              <GamePlayerNames
                players={exercise.players}
                fallback={exercise.playerTitle || exercise.title}
              />
            </h4>
            {exercise.difficulty && (
              <span className={styles.levelBadge} title="Mức gợi ý">
                {exercise.difficulty.level}
              </span>
            )}

            {reference && (
              <button
                type="button"
                title={viewerLabel}
                aria-label={viewerLabel}
                onClick={() => {
                  setAssisted(true);
                  setViewerOpen(true);
                }}
              >
                <FiBookOpen size={20} aria-hidden="true" />
              </button>
            )}
          </div>
          {exercise.gameCaption && (
            <p
              className={`${styles.gameCaption} ${styles.trainerCaption}`}
              title={exercise.gameCaption}
            >
              {exercise.gameCaption}
            </p>
          )}
          {viewerOpen && reference && (
            <DrawGameViewer
              reference={reference}
              source={gameSource}
              referenceGames={referenceGames}
              orientation={orientation}
              onClose={() => setViewerOpen(false)}
            />
          )}
          {(exercise.outcome !== 'skewer' || decision) && (
            <p>{exercise.prompt}</p>
          )}
          <p className={styles.note}>
            {lesson
              ? 'Bài học hai phía: dùng nút từng nước để xem cách giữ pháo đài. Hết biến minh họa không đồng nghĩa ván cờ tự động hòa.'
              : recognition || decision
                ? 'Quan sát bàn cờ và chọn kết luận.'
                : 'Bạn cầm ' +
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
                  setHistoryPly(null);
                  setSelectedSquare(null);
                  setShowPrevious(false);
                  setMessage('');
                  setFeedbackKind('info');
                }}
              >
                Tự giải
              </button>
              <button
                type="button"
                aria-pressed={review}
                onClick={() => {
                  setPendingPromotion(null);
                  setAssisted(true);
                  setReview(true);
                  setReviewPly(0);
                  setShowPrevious(false);
                  setMessage('');
                  setFeedbackKind('info');
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
              {reviewPly === exercise.moves.length && (
                <p>Đã xem hết biến minh họa.</p>
              )}
            </>
          )}
          {canMove && (
            <>
              <button
                type="button"
                onClick={() => {
                  setAssisted(true);
                  setFeedbackKind('info');
                  const branch =
                    [exercise.moves, ...(exercise.alternativeLines ?? [])].find(
                      (candidate) =>
                        played.every((move, i) => candidate[i] === move)
                    ) ?? exercise.moves;
                  const hint = replayDrawExercise(exercise, played).move(
                    branch[played.length]
                  );
                  if (hint) {
                    if (opening) {
                      const stage = Math.min(hintCount, 2);
                      setMessage(
                        stage === 0
                          ? played.length
                            ? 'Kiểm tra nước chiếu, bắt quân và đe dọa sau đáp trả của đối thủ.'
                            : (exercise.hints?.[0] ?? exercise.prompt)
                          : stage === 1
                            ? `Gợi ý: xét quân ở ô ${hint.from}.`
                            : `Gợi ý: ${hint.san}.`
                      );
                      if (stage > 0) setSelectedSquare(hint.from);
                      setHintCount(stage + 1);
                    } else if (exercise.outcome === 'skewer') {
                      const stage = Math.min(hintCount, 3);
                      const first =
                        played.length === 0
                          ? exercise.hints?.[0]
                          : 'Tìm nước buộc đối thủ phải đáp lại để tiếp tục ý tưởng đòn xiên.';
                      setMessage(
                        stage === 0
                          ? exercise.prompt
                          : stage === 1
                            ? (first ??
                              'Tìm hai quân đối phương trên cùng một đường.')
                            : stage === 2
                              ? `Gợi ý: xét quân ở ô ${hint.from}.`
                              : `Gợi ý: ${hint.san}.`
                      );
                      if (stage > 1) setSelectedSquare(hint.from);
                      setHintCount(stage + 1);
                    } else {
                      setSelectedSquare(hint.from);
                      setMessage(`Gợi ý: thử đi quân ở ô ${hint.from}.`);
                    }
                  }
                }}
              >
                Gợi ý
              </button>
            </>
          )}
          {decision && !review && (
            <div
              className={`${styles.controls} ${styles.decisionControls}`}
              aria-label="Đánh giá đòn xiên"
            >
              {decision.options.map((option) => (
                <button
                  type="button"
                  key={option.id}
                  disabled={complete}
                  onClick={() => {
                    const correct = evaluateDrawDecision(exercise, option.id);
                    if (correct === null || complete) return;
                    setComplete(correct);
                    setFeedbackKind(correct ? 'success' : 'retry');
                    setMessage(
                      correct
                        ? 'Đúng. Xem mẫu để kiểm tra nước đáp.'
                        : decision.retryMessage
                    );
                    if (correct) onComplete?.(assisted);
                    else setAssisted(true);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
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
                    setFeedbackKind(correct ? 'success' : 'error');
                    setMessage(
                      correct
                        ? 'Đúng.'
                        : 'Chưa đúng. Kiểm tra các nước hợp lệ của Vua.'
                    );
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className={styles.hintFeedback}
          >
            {feedbackKind === 'info' || recognition || decision ? message : ''}
          </div>
          {hasExplored && (
            <p className={styles.note}>Đã sử dụng chế độ thử biến.</p>
          )}
          {line.length > 0 && (
            <p className={styles.moves}>
              <strong>Các nước đã đi:</strong> {line.join(' · ')}
            </p>
          )}
          {(review || complete) && (
            <div>
              <p className={styles.explanation}>{exercise.solution}</p>
              {exercise.difficulty && exercise.outcome !== 'skewer' && (
                <details className={styles.solution}>
                  <summary>Vì sao ở mức {exercise.difficulty.level}?</summary>
                  <p>{exercise.difficulty.reason}</p>
                  <p>
                    Mức gợi ý; giáo viên nên xem lại các nhánh trước khi dạy.
                  </p>
                </details>
              )}
            </div>
          )}
        </div>
        <div className={styles.practiceBrand}>
          <Image src="/brand/lima-symbol.svg" width={60} height={50} alt="" />
          <span>LIMA Chess</span>
        </div>
      </div>
    </section>
  );
}
