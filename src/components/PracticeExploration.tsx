import { useCustomBoard } from '@/hooks/useCustomBoard';
import { usePracticeBoardTools } from '@/hooks/usePracticeBoardTools';
import type { PromotionPiece } from '@/lib/chess/draw-trainer';
import {
  explorationPosition,
  exploreMove,
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
} from 'react';
import { Chessboard } from 'react-chessboard';

type Branch = { label: string; moves: string[] };

export default function PracticeExploration({
  fen,
  moves,
  initialPly,
  orientation,
  onClose,
}: {
  fen: string;
  moves: string[];
  initialPly: number;
  orientation: 'white' | 'black';
  onClose: () => void;
}) {
  const [branches, setBranches] = useState<Branch[]>([
    { label: 'Nhánh bài tập', moves: [...moves] },
  ]);
  const [branchIndex, setBranchIndex] = useState(0);
  const [ply, setPly] = useState(initialPly);
  const [flipped, setFlipped] = useState(false);
  const [selected, setSelected] = useState<Square | null>(null);
  const [promotion, setPromotion] = useState<{
    from: Square;
    to: Square;
  } | null>(null);
  const [error, setError] = useState('');
  const boardRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [width, setWidth] = useState(360);
  const theme = useCustomBoard();
  const branch = branches[branchIndex];
  const game = useMemo(
    () => explorationPosition(fen, branch.moves, ply),
    [fen, branch.moves, ply]
  );
  const terminal = game.in_checkmate() || game.in_stalemate();
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
  }
  function play(from: Square, to: Square, piece?: PromotionPiece) {
    if (terminal) return false;
    const next = exploreMove(fen, branch.moves, ply, {
      from,
      to,
      promotion: piece,
    });
    setSelected(null);
    setPromotion(null);
    if (!next) {
      setError('Nước đi không hợp lệ. Hãy chọn quân để xem các ô có thể đi.');
      return false;
    }
    setError('');
    if (branch.moves[ply] === next[ply]) {
      setPly(ply + 1);
    } else if (branchIndex !== 0 && ply === branch.moves.length) {
      setBranches(
        branches.map((item, i) =>
          i === branchIndex ? { ...item, moves: next } : item
        )
      );
      setPly(next.length);
    } else {
      setBranches([
        ...branches,
        { label: `Biến ${branches.length}`, moves: next },
      ]);
      setBranchIndex(branches.length);
      setPly(next.length);
    }
    return true;
  }
  function drop(from: Square, to: Square) {
    if (terminal || promotion) return false;
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
    game.fen(),
    {
      f: () => setFlipped((value) => !value),
      r: () => navigate(0),
      ArrowLeft: ply > 0 ? () => navigate(ply - 1) : undefined,
      ArrowRight:
        ply < branch.moves.length ? () => navigate(ply + 1) : undefined,
    },
    !promotion
  );
  const squareStyles: Record<string, CSSProperties> = {};
  const last = game.history({ verbose: true }).at(-1);
  if (last)
    for (const square of [last.from, last.to])
      squareStyles[square] = { backgroundColor: '#e5cf65' };
  if (selected) {
    squareStyles[selected] = { backgroundColor: '#91b96b' };
    for (const move of game.moves({ square: selected, verbose: true }))
      squareStyles[move.to] = { boxShadow: 'inset 0 0 0 4px #355b29' };
  }
  const fullMoves = explorationPosition(
    fen,
    branch.moves,
    branch.moves.length
  ).history({ verbose: true });
  const startNumber = Number(fen.split(' ')[5]);
  const startsBlack = fen.split(' ')[1] === 'b';
  const label = (index: number) =>
    `${startNumber + Math.floor((index + (startsBlack ? 1 : 0)) / 2)}${fullMoves[index].color === 'w' ? '.' : '…'} ${fullMoves[index].san}`;
  const status = game.in_checkmate()
    ? 'Chiếu hết.'
    : game.in_stalemate()
      ? 'Hòa do hết nước đi.'
      : `${game.turn() === 'w' ? 'Trắng' : 'Đen'} đi${game.in_check() ? ' — đang bị chiếu' : ''}.`;

  return (
    <section className={styles.trainer} aria-label="Thử nước khác">
      <div>
        <div
          ref={boardRef}
          className={styles.board}
          {...tools.boardInteractionProps}
          aria-label="Bàn cờ và công cụ đánh dấu"
        >
          <Chessboard
            key={tools.boardRenderKey}
            id="practice-exploration-board"
            boardWidth={width}
            position={game.fen()}
            boardOrientation={
              flipped
                ? orientation === 'white'
                  ? 'black'
                  : 'white'
                : orientation
            }
            customPieces={theme.customPieces}
            customDarkSquareStyle={{ backgroundColor: theme.bgDark }}
            customLightSquareStyle={{ backgroundColor: theme.bgLight }}
            customSquareStyles={{
              ...squareStyles,
              ...tools.customSquareStyles,
            }}
            customArrowColor={tools.selectedColor.arrow}
            onSquareRightClick={tools.handleSquareRightClick}
            onArrowsChange={tools.handleArrowsChange}
            animationDuration={0}
            arePiecesDraggable={!terminal && !promotion}
            onPieceDrop={drop}
            // Both clicks and drops open the same on-board piece picker.
            onPromotionCheck={() => false}
            showPromotionDialog={Boolean(promotion)}
            promotionToSquare={promotion?.to ?? null}
            onPromotionPieceSelect={(piece) => {
              if (piece && promotion) {
                play(
                  promotion.from,
                  promotion.to,
                  piece[1].toLowerCase() as PromotionPiece
                );
              }
              setPromotion(null);
              // The practice state applies the complete resulting position.
              return false;
            }}
            onSquareClick={(square) => {
              tools.handleSquareClick();
              if (terminal || promotion) return;
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
            disabled={ply === 0}
            aria-keyshortcuts="ArrowLeft"
            onClick={() => navigate(ply - 1)}
          >
            ← Nước trước
          </button>
          <button
            type="button"
            disabled={ply === branch.moves.length}
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
            href={{ pathname: '/analysis', query: { fen: game.fen() } }}
            target="_blank"
            rel="noopener noreferrer"
            prefetch={false}
          >
            Phân tích ↗
          </Link>
        </div>
      </div>
      <div className={styles.trainerInfo}>
        <h4>Đang thử biến</h4>
        <p className={styles.note}>
          Đi thử cho cả hai bên. Tiến độ bài tập được giữ nguyên. Bạn có thể bật
          lại đồng hồ bất cứ lúc nào.
        </p>
        <div className={styles.controls}>
          <button ref={closeRef} type="button" onClick={onClose}>
            Quay lại bài tập
          </button>
        </div>
        <p role="status" aria-live="polite">
          {error || status}
        </p>
        {game.in_threefold_repetition() && (
          <p className={styles.note}>
            Thế cờ đã xuất hiện ít nhất 3 lần trong nhánh đang thử.
          </p>
        )}
        {game.insufficient_material() && (
          <p className={styles.note}>Không đủ lực chiếu hết.</p>
        )}
        <label className={styles.explorationSelect}>
          Nhánh đang xem
          <select
            value={branchIndex}
            onChange={(event) => {
              const index = Number(event.target.value);
              navigate(branches[index].moves.length, index);
            }}
          >
            {branches.map((item, i) => (
              <option value={i} key={i}>
                {item.label}
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
            onClick={() => navigate(0)}
          >
            Thế bắt đầu
          </button>
          {branch.moves.map((move, i) => (
            <button
              type="button"
              key={`${i}-${move}`}
              aria-pressed={ply === i + 1}
              onClick={() => navigate(i + 1)}
            >
              {label(i)}
            </button>
          ))}
        </div>
        <p className={styles.note}>
          Chọn vị trí rồi đi nước khác để tạo biến mới. Các biến được giữ trong
          phiên thử này.
        </p>
      </div>
    </section>
  );
}
