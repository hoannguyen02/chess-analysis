import { usePracticeBoardTools } from '@/hooks/usePracticeBoardTools';
import {
  previousDrawPosition,
  type PromotionPiece,
} from '@/lib/chess/draw-trainer';
import type { DrawExercise } from '@/lib/chess/draw-practice';
import {
  explorationPosition,
  exploreMove,
  parsePracticeVariation,
  recordingPosition,
  recordVariationMove,
  recordedVariationLines,
  MAX_RECORDED_VARIATIONS,
  MAX_VARIATION_PLIES,
  variationEndLabels,
} from '@/lib/chess/practice-exploration';
import styles from '@/styles/ChessPractice.module.css';
import type { Square } from 'chess.js';
import Link from 'next/link';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import PracticeBoard, { PreviousMoveControl } from './PracticeBoard';

export default function PracticeExploration({
  fen,
  moves,
  initialPly,
  orientation,
  onClose,
  initialLines,
  onConfirm,
  header,
  freePlay = false,
  previousMove,
}: {
  fen: string;
  moves: string[];
  initialPly: number;
  orientation: 'white' | 'black';
  onClose: () => void;
  initialLines?: string[][];
  onConfirm?: (lines: string[][]) => void;
  header?: ReactNode;
  freePlay?: boolean;
  previousMove?: DrawExercise['previousMove'];
}) {
  const recording = Boolean(onConfirm);
  const [branches, setBranches] = useState<string[][]>(() =>
    recording
      ? initialLines?.length
        ? initialLines.map((line) => [...line])
        : [[]]
      : [[...moves]]
  );
  const [branchIndex, setBranchIndex] = useState(0);
  const [ply, setPly] = useState(initialPly);
  const [flipped, setFlipped] = useState(false);
  const [selected, setSelected] = useState<Square | null>(null);
  const [promotion, setPromotion] = useState<{
    from: Square;
    to: Square;
  } | null>(null);
  const [error, setError] = useState('');
  const [showPrevious, setShowPrevious] = useState(false);
  const previous = useMemo(
    () => previousDrawPosition({ fen, previousMove }),
    [fen, previousMove]
  );
  const boardRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [width, setWidth] = useState(360);
  const branch = branches[branchIndex];
  const { game, ended } = useMemo(
    () =>
      recording
        ? recordingPosition(fen, branch, ply)
        : {
            game: explorationPosition(fen, branch, ply),
            ended: null,
          },
    [fen, branch, ply, recording]
  );
  const endReason = recording
    ? ended?.reason
    : game.in_checkmate()
      ? 'checkmate'
      : game.in_stalemate()
        ? 'stalemate'
        : undefined;
  const terminal = endReason !== undefined;
  const displayedFen = showPrevious && previous ? previous.fen : game.fen();
  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
    const element = boardRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.floor(entry.contentRect.width))
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  function navigate(nextPly: number, nextBranch = branchIndex) {
    setBranchIndex(nextBranch);
    setPly(nextPly);
    setSelected(null);
    setPromotion(null);
    setError('');
    setShowPrevious(false);
  }
  function play(from: Square, to: Square, piece?: PromotionPiece) {
    if (showPrevious || terminal) return false;
    const input = { from, to, promotion: piece };
    setSelected(null);
    setPromotion(null);
    if (recording) {
      const result = recordVariationMove(
        fen,
        { lines: branches, branchIndex, ply },
        input
      );
      if (result.status !== 'recorded') {
        setError(
          result.status === 'line-limit'
            ? `Đã có ${MAX_RECORDED_VARIATIONS} phương án. Xóa một phương án trước khi ghi thêm.`
            : result.status === 'move-limit'
              ? `Mỗi phương án có tối đa ${MAX_VARIATION_PLIES} nửa nước.`
              : result.status === 'ended'
                ? `${variationEndLabels[result.reason]}.`
                : 'Nước đi không hợp lệ. Hãy chọn quân để xem các ô có thể đi.'
        );
        return false;
      }
      setBranches(result.state.lines);
      setBranchIndex(result.state.branchIndex);
      setPly(result.state.ply);
      setError('');
      return true;
    }
    const next = exploreMove(fen, branch, ply, input);
    if (!next) {
      setError('Nước đi không hợp lệ. Hãy chọn quân để xem các ô có thể đi.');
      return false;
    }
    setError('');
    if (branch[ply] === next[ply]) setPly(ply + 1);
    else if (branchIndex !== 0 && ply === branch.length) {
      setBranches(branches.map((item, i) => (i === branchIndex ? next : item)));
      setPly(next.length);
    } else {
      setBranches([...branches, next]);
      setBranchIndex(branches.length);
      setPly(next.length);
    }
    return true;
  }
  function drop(from: Square, to: Square) {
    if (showPrevious || terminal || promotion) return false;
    if (
      game
        .moves({ square: from, verbose: true })
        .some((move) => move.to === to && move.promotion)
    ) {
      setPromotion({ from, to });
      setSelected(null);
      return false;
    }
    return play(from, to);
  }
  const tools = usePracticeBoardTools(
    displayedFen,
    {
      f: () => setFlipped((value) => !value),
      r: () => navigate(0),
      ArrowLeft: ply > 0 ? () => navigate(ply - 1) : undefined,
      ArrowRight: showPrevious
        ? () => setShowPrevious(false)
        : ply < branch.length
          ? () => navigate(ply + 1)
          : undefined,
    },
    !promotion
  );
  const squareStyles: Record<string, CSSProperties> = {};
  const last = showPrevious
    ? undefined
    : (game.history({ verbose: true }).at(-1) ?? previous?.move);
  if (last)
    for (const square of [last.from, last.to])
      squareStyles[square] = { backgroundColor: '#e5cf65' };
  if (selected) {
    squareStyles[selected] = { backgroundColor: '#91b96b' };
    for (const move of game.moves({ square: selected, verbose: true }))
      squareStyles[move.to] = { boxShadow: 'inset 0 0 0 4px #355b29' };
  }
  const fullMoves = useMemo(
    () =>
      explorationPosition(fen, branch, branch.length).history({
        verbose: true,
      }),
    [fen, branch]
  );
  const startNumber = Number(fen.split(' ')[5]);
  const startsBlack = fen.split(' ')[1] === 'b';
  const label = (index: number) =>
    `${startNumber + Math.floor((index + (startsBlack ? 1 : 0)) / 2)}${fullMoves[index].color === 'w' ? '.' : '…'} ${fullMoves[index].san}`;
  const status = endReason
    ? `${variationEndLabels[endReason]}.`
    : `${game.turn() === 'w' ? 'Trắng' : 'Đen'} đi${game.in_check() ? ' — đang bị chiếu' : ''}.`;
  const recorded = recordedVariationLines(branches);
  function confirmRecording() {
    // An older saved line may contain moves played after an automatic draw.
    for (const [i, line] of recorded.entries()) {
      try {
        parsePracticeVariation(fen, line);
      } catch (error) {
        setError(`Phương án ${i + 1}. ${(error as Error).message}`);
        return;
      }
    }
    onConfirm?.(recorded);
  }
  const branchName = (i: number) =>
    recording
      ? i === 0
        ? 'Phương án chính'
        : `Phương án ${i + 1}`
      : i === 0
        ? freePlay
          ? 'Phương án 1'
          : 'Phương án bài tập'
        : `Biến ${i}`;
  function removeBranch() {
    const next = branches.filter((_, i) => i !== branchIndex);
    if (!next.length) {
      setBranches([[]]);
      navigate(0, 0);
    } else {
      const index = Math.min(branchIndex, next.length - 1);
      setBranches(next);
      navigate(next[index].length, index);
    }
  }
  return (
    <section
      className={styles.trainer}
      aria-label={
        recording
          ? 'Ghi phương án'
          : freePlay
            ? 'Đi thử trên bàn cờ'
            : 'Thử nước khác'
      }
      onKeyDown={(event) => {
        if (
          !recording ||
          promotion ||
          event.ctrlKey ||
          event.metaKey ||
          event.altKey ||
          event.shiftKey ||
          (event.target instanceof HTMLElement &&
            event.target.closest('input, textarea, select, [contenteditable]'))
        )
          return;
        if (event.key === 'ArrowLeft' && ply > 0) {
          event.preventDefault();
          event.stopPropagation();
          navigate(ply - 1);
        } else if (event.key === 'ArrowRight' && ply < branch.length) {
          event.preventDefault();
          event.stopPropagation();
          navigate(ply + 1);
        }
      }}
    >
      <div>
        <div
          ref={boardRef}
          className={styles.board}
          {...tools.boardInteractionProps}
          aria-label="Bàn cờ và công cụ đánh dấu"
        >
          <PracticeBoard
            id={
              recording
                ? 'practice-variation-editor-board'
                : 'practice-exploration-board'
            }
            fen={displayedFen}
            width={width}
            orientation={
              flipped
                ? orientation === 'white'
                  ? 'black'
                  : 'white'
                : orientation
            }
            tools={tools}
            squareStyles={squareStyles}
            canMove={!showPrevious && !terminal}
            pendingPromotion={promotion}
            onPieceDrop={drop}
            onPromotionPieceSelect={(piece) => {
              if (piece && promotion)
                play(
                  promotion.from,
                  promotion.to,
                  piece[1].toLowerCase() as PromotionPiece
                );
              setPromotion(null);
              return false;
            }}
            onSquareClick={(square) => {
              if (showPrevious || terminal || promotion) return;
              if (selected === square) setSelected(null);
              else if (selected && game.get(square)?.color !== game.turn())
                drop(selected, square);
              else if (game.get(square)?.color === game.turn())
                setSelected(square);
            }}
          />
        </div>
        <div className={`${styles.controls} ${styles.boardActions}`}>
          <button
            type="button"
            disabled={ply === 0 || Boolean(promotion)}
            aria-keyshortcuts="ArrowLeft"
            onClick={() => navigate(ply - 1)}
          >
            ← Nước trước
          </button>
          <button
            type="button"
            disabled={ply === branch.length || Boolean(promotion)}
            aria-keyshortcuts="ArrowRight"
            onClick={() => navigate(ply + 1)}
          >
            Nước tiếp →
          </button>
          <button
            type="button"
            onClick={() => setFlipped(!flipped)}
            aria-keyshortcuts="f"
            title="Lật bàn (F)"
          >
            Lật bàn
          </button>
          <Link
            href={{ pathname: '/analysis', query: { fen: displayedFen } }}
            target="_blank"
            rel="noopener noreferrer"
            prefetch={false}
            title="Phân tích thế hiện tại trong tab mới"
          >
            Phân tích ↗
          </Link>
        </div>
      </div>
      <div className={styles.trainerInfo}>
        {header}
        {previous && (
          <PreviousMoveControl
            fen={fen}
            previousMove={previousMove}
            showingPrevious={showPrevious}
            disabled={Boolean(promotion)}
            onToggle={() => {
              setShowPrevious(!showPrevious);
              setSelected(null);
              setError('');
            }}
          />
        )}
        <h4>
          {recording
            ? 'Ghi cho cả hai bên'
            : freePlay
              ? 'Đi thử trên bàn cờ'
              : 'Thử phương án'}
        </h4>
        <p className={styles.note}>
          {recording
            ? 'Đi liên tiếp cho cả hai bên. Chọn một nước đã ghi rồi đi nước khác để tạo phương án mới. Phương án cũ vẫn được giữ. Hộp ghi xử lý hòa tự động theo cách Chess.com Live.'
            : freePlay
              ? 'Đi thử cho cả hai bên để phân tích thế cờ.'
              : 'Đi thử cho cả hai bên. Tiến độ bài tập được giữ nguyên. Bạn có thể bật lại đồng hồ bất cứ lúc nào.'}
        </p>
        <div className={styles.controls}>
          {recording && (
            <button
              type="button"
              disabled={!recorded.length || Boolean(promotion)}
              onClick={confirmRecording}
            >
              OK · Giữ {recorded.length} phương án
            </button>
          )}
          <button ref={closeRef} type="button" onClick={onClose}>
            {recording
              ? 'Hủy'
              : freePlay
                ? 'Về thế bắt đầu'
                : 'Quay lại bài tập'}
          </button>
        </div>
        <p role="status" aria-live="polite">
          {showPrevious
            ? 'Đang xem thế trước nước đi đã ghi. Trở lại bàn cờ để đi tiếp.'
            : error ||
              (promotion ? 'Chọn quân phong cấp để tiếp tục.' : status)}
        </p>
        {recording && ended && ply > 0 && (
          <p className={styles.note}>
            {ended.ply === 0
              ? 'Ván đã kết thúc ngay ở thế bắt đầu.'
              : ended.ply < ply
                ? `Ván đã kết thúc ở nước ${label(ended.ply - 1)}. Quay lại nước đó rồi chọn “Kết thúc phương án tại đây”.`
                : 'Quay lại một thế trước đó để ghi phương án khác.'}
          </p>
        )}
        {!recording && game.in_threefold_repetition() && (
          <p className={styles.note}>
            Thế cờ đã xuất hiện ít nhất 3 lần trong nhánh đang thử.
          </p>
        )}
        {!recording && game.insufficient_material() && (
          <p className={styles.note}>Không đủ lực chiếu hết.</p>
        )}
        <label className={styles.explorationSelect}>
          Phương án đang xem
          <select
            value={branchIndex}
            disabled={Boolean(promotion)}
            onChange={(event) => {
              const index = Number(event.target.value);
              navigate(branches[index].length, index);
            }}
          >
            {branches.map((_, i) => (
              <option value={i} key={i}>
                {branchName(i)}
              </option>
            ))}
          </select>
        </label>
        <div
          className={`${styles.controls} ${styles.explorationMoves}`}
          role="group"
          aria-label="Chọn vị trí"
        >
          <button
            type="button"
            aria-pressed={ply === 0}
            disabled={Boolean(promotion)}
            onClick={() => navigate(0)}
          >
            Thế bắt đầu
          </button>
          {branch.map((move, i) => (
            <button
              type="button"
              key={`${i}-${move}`}
              aria-pressed={ply === i + 1}
              disabled={Boolean(promotion)}
              onClick={() => navigate(i + 1)}
            >
              {label(i)}
            </button>
          ))}
        </div>
        {recording ? (
          <div className={styles.controls}>
            <button
              type="button"
              disabled={branchIndex === 0 || Boolean(promotion)}
              onClick={() => {
                setBranches([
                  branch,
                  ...branches.filter((_, i) => i !== branchIndex),
                ]);
                navigate(ply, 0);
              }}
            >
              Đặt làm phương án chính
            </button>
            <button
              type="button"
              disabled={
                ply === 0 || ply === branch.length || Boolean(promotion)
              }
              onClick={() => {
                setBranches(
                  branches.map((line, i) =>
                    i === branchIndex ? line.slice(0, ply) : line
                  )
                );
                navigate(ply);
              }}
            >
              Kết thúc phương án tại đây
            </button>
            <button
              type="button"
              disabled={
                (!branch.length && branches.length === 1) || Boolean(promotion)
              }
              onClick={removeBranch}
            >
              Xóa phương án này
            </button>
          </div>
        ) : (
          <p className={styles.note}>
            Chọn vị trí rồi đi nước khác để tạo biến mới. Các biến được giữ
            trong phiên thử này.
          </p>
        )}
      </div>
    </section>
  );
}
