import { useEffect, useRef, useState } from 'react';
import type { Square } from 'chess.js';
import { ChessboardDnDProvider, SparePiece } from 'react-chessboard';
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
    setHistory((items) => [...items.slice(-49), draft]);
    setDraft(next);
    setInput(setupToFen(next));
    setError('');
  }
  function place(square: Square, piece?: SetupPiece, from?: Square) {
    change(changeSetupPiece(draft, square, piece, from));
  }
  return (
    <dialog
      ref={dialog}
      className={styles.variationDialog}
      aria-labelledby="position-setup-title"
      onKeyDown={(e) => e.stopPropagation()}
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
      {/* Share the same window manager as the practice and preview boards. */}
      <ChessboardDnDProvider context={window}>
        <div className={styles.setupGrid}>
          <div ref={boardBox} className={styles.setupBoard}>
            <PracticeBoard
              id="beginner-position-setup"
              fen={setupToFen(draft)}
              position={draft.pieces}
              width={width}
              orientation={flipped ? 'black' : 'white'}
              tools={tools}
              canMove={tool === null}
              pendingPromotion={null}
              onSquareClick={(square) => {
                if (tool) place(square, tool === 'remove' ? undefined : tool);
              }}
              onPieceDrop={(from, to, piece) => {
                place(to, piece, from);
                return true;
              }}
              onPieceDropOffBoard={(square) => place(square)}
              onSparePieceDrop={(piece, square) => {
                place(square, piece);
                return true;
              }}
              onPromotionPieceSelect={() => false}
            />
            <div className={styles.setupActions}>
              <button
                type="button"
                disabled={!history.length}
                onClick={() => {
                  const previous = history[history.length - 1];
                  setHistory(history.slice(0, -1));
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
              Chọn quân rồi chạm ô để đặt, hoặc kéo quân vào bàn. Kéo quân ra
              ngoài để xóa.
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
            <div className={styles.setupActions}>
              <button
                type="button"
                onClick={() => {
                  try {
                    change(setupFromFen(input));
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                Đặt theo FEN
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(setupToFen(draft));
                    setError('Đã sao chép FEN.');
                  } catch {
                    setError('Chọn và sao chép FEN trong ô phía trên.');
                  }
                }}
              >
                Sao chép FEN
              </button>
            </div>
            {hasLines && setupToFen(draft) !== fen && (
              <p>
                Áp dụng thế cờ mới sẽ xóa các phương án và giải thích đã ghi. Dữ
                liệu chỉ được lưu khi bạn chọn Lưu thay đổi.
              </p>
            )}
            <p role="status">{error}</p>
            <div className={styles.setupActions}>
              <button
                type="button"
                onClick={() => {
                  try {
                    onConfirm(validateSetupFen(setupToFen(draft)));
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                Áp dụng thế cờ
              </button>
              <button type="button" onClick={onClose}>
                Hủy
              </button>
            </div>
          </div>
        </div>
      </ChessboardDnDProvider>
    </dialog>
  );
}
