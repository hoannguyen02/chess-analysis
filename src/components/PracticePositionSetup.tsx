import { useEffect, useRef, useState } from 'react';
import type { Square } from 'chess.js';
import { SparePiece } from 'react-chessboard';
import { FiCheck, FiCopy, FiDownload, FiX } from 'react-icons/fi';
import { usePracticeBoardTools } from '@/hooks/usePracticeBoardTools';
import {
  setupFromFen,
  setupToFen,
  changeSetupPiece,
  validateSetupFen,
  type SetupPiece,
  type SetupPosition,
} from '@/lib/chess/position-setup';
import PracticeBoard from './PracticeBoard';
import { SetupBoardDnDProvider } from './SetupBoardDnDProvider';
import { SetupBoardPaintLayer } from './SetupBoardPaintLayer';
import styles from '@/styles/SavedGames.module.css';

const pieces: SetupPiece[] = [
  'wK',
  'wQ',
  'wR',
  'wB',
  'wN',
  'wP',
  'bK',
  'bQ',
  'bR',
  'bB',
  'bN',
  'bP',
];
const names = { K: 'Vua', Q: 'Hậu', R: 'Xe', B: 'Tượng', N: 'Mã', P: 'Tốt' };

export default function PracticePositionSetup({
  fen,
  hasLines,
  onConfirm,
  onClose,
}: {
  fen: string;
  hasLines: boolean;
  onConfirm: (fen: string) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const boardBox = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState(() => setupFromFen(fen));
  const draftRef = useRef(draft);
  const painting = useRef(false);
  const strokeRecorded = useRef(false);
  const [history, setHistory] = useState<SetupPosition[]>([]);
  const [tool, setTool] = useState<SetupPiece | 'remove' | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [width, setWidth] = useState(400);
  const [input, setInput] = useState(fen);
  const [error, setError] = useState('');
  const tools = usePracticeBoardTools(fen, {}, false);
  useEffect(() => {
    const element = dialog.current!;
    const trigger = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element.showModal();
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.floor(entry.contentRect.width))
    );
    if (boardBox.current) observer.observe(boardBox.current);
    return () => {
      observer.disconnect();
      element.close();
      document.body.style.overflow = overflow;
      trigger?.focus({ preventScroll: true });
    };
  }, []);
  function change(next: SetupPosition) {
    const previous = draftRef.current;
    if (setupToFen(next) === setupToFen(previous)) {
      setInput(setupToFen(next));
      setError('');
      return;
    }
    if (!painting.current || !strokeRecorded.current)
      setHistory((items) => [...items.slice(-49), previous]);
    if (painting.current) strokeRecorded.current = true;
    draftRef.current = next;
    setDraft(next);
    setInput(setupToFen(next));
    setError('');
  }
  function place(square: Square, piece?: SetupPiece, from?: Square) {
    change(changeSetupPiece(draftRef.current, square, piece, from));
  }
  return (
    <dialog
      ref={dialog}
      className={styles.variationDialog}
      aria-labelledby="position-setup-title"
      onKeyDown={(e) => {
        e.stopPropagation();
        if (
          !e.ctrlKey &&
          !e.metaKey &&
          !e.altKey &&
          !e.shiftKey &&
          e.key.toLowerCase() === 'd' &&
          !(
            e.target instanceof HTMLElement &&
            e.target.closest('input, textarea, select, [contenteditable]')
          )
        ) {
          e.preventDefault();
          setTool(null);
        }
      }}
      onCancel={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }}
    >
      <header className={styles.variationHeader}>
        <h3 id="position-setup-title">Chỉnh sửa thế cờ · Nhập môn</h3>
        <button
          type="button"
          aria-label="Hủy chỉnh sửa thế cờ"
          onClick={onClose}
        >
          ✕
        </button>
      </header>
      <SetupBoardDnDProvider
        context={typeof window === 'undefined' ? undefined : window}
      >
        <div className={styles.setupGrid}>
          <div ref={boardBox} className={styles.setupBoard}>
            <div className={styles.setupPaintBoard}>
              <PracticeBoard
                id="beginner-position-setup"
                fen={setupToFen(draft)}
                position={draft.pieces}
                width={width}
                orientation={flipped ? 'black' : 'white'}
                tools={tools}
                canMove={tool !== 'remove'}
                pendingPromotion={null}
                onSquareClick={(square) => {
                  if (tool === 'remove') place(square);
                  else if (tool && !draftRef.current.pieces[square])
                    place(square, tool);
                }}
                onPieceDrop={(from, to, piece) => {
                  if (from === to) return false;
                  place(to, piece, from);
                  return true;
                }}
                onPieceDropOffBoard={(square) => place(square)}
                onSparePieceDrop={(piece, square) => {
                  place(square, piece);
                  setTool(piece);
                  return true;
                }}
                onPromotionPieceSelect={() => false}
              />
              <SetupBoardPaintLayer
                orientation={flipped ? 'black' : 'white'}
                occupiedSquares={new Set(Object.keys(draft.pieces) as Square[])}
                enabled={tool !== null && tool !== 'remove'}
                onPaint={(square) => {
                  if (
                    tool &&
                    tool !== 'remove' &&
                    !draftRef.current.pieces[square]
                  )
                    place(square, tool);
                }}
                onStrokeStart={() => {
                  painting.current = true;
                  strokeRecorded.current = false;
                }}
                onStrokeEnd={() => {
                  painting.current = false;
                  strokeRecorded.current = false;
                }}
                label={(square) => `Đặt quân vào ô ${square}`}
              />
            </div>
            <div className={styles.setupActions}>
              <button
                type="button"
                disabled={!history.length}
                onClick={() => {
                  const previous = history[history.length - 1];
                  setHistory(history.slice(0, -1));
                  draftRef.current = previous;
                  setDraft(previous);
                  setInput(setupToFen(previous));
                  setError('');
                }}
              >
                Hoàn tác
              </button>
              <button type="button" onClick={() => setFlipped(!flipped)}>
                Lật bàn
              </button>
            </div>
          </div>
          <div className={styles.setupControls}>
            <p>
              Chọn quân rồi chạm ô để đặt, hoặc giữ chuột và rê qua nhiều ô
              trống để đặt liên tiếp. Kéo quân để di chuyển; kéo ra ngoài bàn để
              xóa.
            </p>
            <div className={styles.piecePalette} aria-label="Chọn quân để đặt">
              {pieces.map((piece) => (
                <button
                  key={piece}
                  type="button"
                  aria-pressed={tool === piece}
                  aria-label={`${names[piece[1] as keyof typeof names]} ${piece[0] === 'w' ? 'Trắng' : 'Đen'}`}
                  onClick={() => setTool(tool === piece ? null : piece)}
                >
                  <SparePiece
                    piece={piece}
                    width={44}
                    dndId="beginner-position-setup"
                  />
                </button>
              ))}
            </div>
            <div className={styles.setupActions}>
              <button
                type="button"
                aria-pressed={tool === null}
                aria-keyshortcuts="d"
                title="Di chuyển quân (D)"
                onClick={() => setTool(null)}
              >
                Di chuyển quân
              </button>
              <button
                type="button"
                aria-pressed={tool === 'remove'}
                onClick={() => setTool('remove')}
              >
                Xóa quân
              </button>
              <button
                type="button"
                onClick={() =>
                  change({
                    ...draft,
                    pieces: {},
                    castling: '-',
                    enPassant: '-',
                  })
                }
              >
                Xóa bàn
              </button>
              <button type="button" onClick={() => change(setupFromFen(fen))}>
                Khôi phục thế khi mở
              </button>
            </div>
            <label>
              Bên đến lượt
              <select
                value={draft.turn}
                onChange={(e) =>
                  change({
                    ...draft,
                    turn: e.target.value as 'w' | 'b',
                    enPassant: '-',
                  })
                }
              >
                <option value="w">Trắng đi</option>
                <option value="b">Đen đi</option>
              </select>
            </label>
            <details>
              <summary>Nhập thành và bắt Tốt qua đường</summary>
              {(['K', 'Q', 'k', 'q'] as const).map((right, index) => (
                <label key={right}>
                  <input
                    type="checkbox"
                    checked={draft.castling.includes(right)}
                    onChange={(e) => {
                      const active = new Set(draft.castling.replace('-', ''));
                      if (e.target.checked) active.add(right);
                      else active.delete(right);
                      change({
                        ...draft,
                        castling:
                          [...'KQkq'].filter((r) => active.has(r)).join('') ||
                          '-',
                      });
                    }}
                  />
                  {['Trắng O-O', 'Trắng O-O-O', 'Đen O-O', 'Đen O-O-O'][index]}
                </label>
              ))}
              <label>
                Ô bắt Tốt qua đường
                <select
                  value={draft.enPassant}
                  onChange={(e) =>
                    change({ ...draft, enPassant: e.target.value })
                  }
                >
                  <option value="-">Không có</option>
                  {[...'abcdefgh'].map((file) => (
                    <option
                      key={file}
                      value={`${file}${draft.turn === 'w' ? '6' : '3'}`}
                    >
                      {file}
                      {draft.turn === 'w' ? '6' : '3'}
                    </option>
                  ))}
                </select>
              </label>
            </details>
            <label>
              FEN
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                spellCheck={false}
              />
            </label>
            <div className={`${styles.setupActions} ${styles.setupFenActions}`}>
              <button
                type="button"
                className={styles.setupFenLoadButton}
                aria-label="Đặt theo FEN"
                title="Đặt theo FEN"
                onClick={() => {
                  try {
                    change(setupFromFen(input));
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                <FiDownload size={20} aria-hidden="true" />
                FEN
              </button>
              <button
                type="button"
                className={styles.setupIconButton}
                aria-label="Sao chép FEN"
                title="Sao chép FEN"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(setupToFen(draft));
                    setError('Đã sao chép FEN.');
                  } catch {
                    setError('Chọn và sao chép FEN trong ô phía trên.');
                  }
                }}
              >
                <FiCopy size={20} aria-hidden="true" />
              </button>
              <div className={styles.setupConfirmActions}>
                <button
                  type="button"
                  className={`${styles.setupIconButton} ${styles.setupConfirmButton}`}
                  aria-label="Áp dụng thế cờ"
                  title="Áp dụng thế cờ"
                  onClick={() => {
                    try {
                      onConfirm(validateSetupFen(setupToFen(draft)));
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                >
                  <FiCheck size={22} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className={styles.setupIconButton}
                  aria-label="Hủy"
                  title="Hủy chỉnh sửa thế cờ"
                  onClick={onClose}
                >
                  <FiX size={22} aria-hidden="true" />
                </button>
              </div>
            </div>
            {hasLines && setupToFen(draft) !== fen && (
              <p>
                Áp dụng thế cờ mới sẽ xóa các phương án và giải thích đã ghi. Dữ
                liệu chỉ được lưu khi bạn chọn Lưu thay đổi.
              </p>
            )}
            <p role="status">{error}</p>
          </div>
        </div>
      </SetupBoardDnDProvider>
    </dialog>
  );
}
