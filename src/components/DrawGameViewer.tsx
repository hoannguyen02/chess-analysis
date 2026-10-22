import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Chessboard } from 'react-chessboard';
import { FiStar } from 'react-icons/fi';
import { useCustomBoard } from '@/hooks/useCustomBoard';
import {
  GameReference,
  GameSource,
  gameFrames,
  loadGameSource,
} from '@/lib/chess/draw-game-viewer';
import styles from '@/styles/DrawGameViewer.module.css';

export default function DrawGameViewer({
  reference,
  onClose,
}: {
  reference: GameReference;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const board = useRef<HTMLDivElement>(null);
  const activeMove = useRef<HTMLButtonElement>(null);
  const [source, setSource] = useState<GameSource>();
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [branch, setBranch] = useState(reference.branch);
  const [ply, setPly] = useState(reference.ply);
  const [playing, setPlaying] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [width, setWidth] = useState(360);
  const theme = useCustomBoard();
  const frames = useMemo(
    () => (source ? gameFrames(source, branch) : []),
    [source, branch]
  );
  const frame = frames[ply];
  const title = reference.kind === 'game' ? 'Ván gốc' : 'Bài nghiên cứu';

  useEffect(() => {
    const element = dialog.current!;
    const trigger = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element.showModal();
    return () => {
      element.close();
      document.body.style.overflow = overflow;
      trigger?.focus();
    };
  }, []);
  useEffect(() => {
    let cancelled = false;
    setError(false);
    loadGameSource(reference.id)
      .then((data) => {
        if (!cancelled) setSource(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [reference.id, attempt]);
  useEffect(() => {
    if (!board.current) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.floor(entry.contentRect.width))
    );
    observer.observe(board.current);
    return () => observer.disconnect();
  }, [source]);
  useEffect(() => {
    const active = activeMove.current;
    const list = active?.parentElement;
    if (!active || !list) return;
    const item = active.getBoundingClientRect();
    const bounds = list.getBoundingClientRect();
    if (item.top < bounds.top) list.scrollTop += item.top - bounds.top;
    else if (item.bottom > bounds.bottom)
      list.scrollTop += item.bottom - bounds.bottom;
  }, [ply, branch, source]);
  useEffect(() => {
    if (!playing) return;
    if (ply >= frames.length - 1) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => setPly((value) => value + 1), 1000);
    return () => window.clearTimeout(timer);
  }, [playing, ply, frames.length]);
  useEffect(() => {
    const pause = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener('visibilitychange', pause);
    return () => document.removeEventListener('visibilitychange', pause);
  }, []);
  function jump(next: number) {
    setPlaying(false);
    setPly(Math.max(0, Math.min(frames.length - 1, next)));
  }
  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby="draw-game-title"
      data-draw-game-viewer
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onKeyDown={(event) => {
        if (event.target instanceof HTMLSelectElement || !frames.length) return;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault();
          event.stopPropagation();
          jump(ply + (event.key === 'ArrowRight' ? 1 : -1));
        }
      }}
    >
      <header className={styles.header}>
        <div>
          <h2 id="draw-game-title">{title}</h2>
          <p>{title} có chứa lời giải.</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng ván gốc"
          autoFocus
        >
          ✕
        </button>
      </header>
      {!source && (
        <div className={styles.loading} role="status">
          {error ? (
            <>
              Không tải được ván gốc.{' '}
              <button type="button" onClick={() => setAttempt(attempt + 1)}>
                Thử lại
              </button>
            </>
          ) : (
            'Đang mở ván gốc…'
          )}
        </div>
      )}
      {source && frame && (
        <div className={styles.layout}>
          <div>
            <div ref={board} className={styles.board}>
              <Chessboard
                id="draw-source-board"
                // Keep the board mounted while stepping or jumping through moves.
                // A FEN key remounts it and briefly resets the custom piece images.
                position={frame.fen}
                boardWidth={width}
                boardOrientation={flipped ? 'black' : 'white'}
                arePiecesDraggable={false}
                animationDuration={0}
                customPieces={theme.customPieces}
                customDarkSquareStyle={{ backgroundColor: theme.bgDark }}
                customLightSquareStyle={{ backgroundColor: theme.bgLight }}
                customSquareStyles={
                  frame.from
                    ? {
                        [frame.from]: { backgroundColor: '#e5cf65' },
                        [frame.to]: { backgroundColor: '#e5cf65' },
                      }
                    : {}
                }
              />
            </div>
            <div
              className={styles.playback}
              role="group"
              aria-label="Điều khiển ván cờ"
            >
              <button
                type="button"
                title="Đầu ván"
                aria-label="Đầu ván"
                disabled={ply === 0}
                onClick={() => jump(0)}
              >
                ⏮
              </button>
              <button
                type="button"
                title="Nước trước"
                aria-label="Nước trước"
                disabled={ply === 0}
                onClick={() => jump(ply - 1)}
              >
                ←
              </button>
              <button
                type="button"
                disabled={ply === frames.length - 1}
                aria-label={playing ? 'Tạm dừng' : 'Tự phát'}
                aria-pressed={playing}
                onClick={() => setPlaying(!playing)}
              >
                {playing ? 'Ⅱ' : '▶'}
              </button>
              <button
                type="button"
                title="Nước tiếp"
                aria-label="Nước tiếp"
                disabled={ply === frames.length - 1}
                onClick={() => jump(ply + 1)}
              >
                →
              </button>
              <button
                type="button"
                title="Cuối ván"
                aria-label="Cuối ván"
                disabled={ply === frames.length - 1}
                onClick={() => jump(frames.length - 1)}
              >
                ⏭
              </button>
            </div>
            <div className={styles.actions}>
              <button
                type="button"
                onClick={() => {
                  setPlaying(false);
                  setBranch(reference.branch);
                  setPly(reference.ply);
                }}
              >
                Về vị trí bài tập
              </button>
              <button type="button" onClick={() => setFlipped(!flipped)}>
                Lật bàn
              </button>
              <Link
                href={{ pathname: '/analysis', query: { fen: frame.fen } }}
                prefetch={false}
                target="_blank"
                rel="noopener noreferrer"
                title="Phân tích thế hiện tại trong tab mới"
                onClick={() => setPlaying(false)}
              >
                Phân tích ↗
              </Link>
            </div>
          </div>
          <div className={styles.info}>
            <h3>
              {source.kind === 'game'
                ? `${source.headers.White} — ${source.headers.Black}`
                : source.headers.ChapterName || source.headers.Event}
            </h3>
            <p>
              {[
                source.headers.Event,
                source.headers.Date?.includes('?')
                  ? source.headers.UTCDate
                  : source.headers.Date || source.headers.UTCDate,
                source.kind === 'game' ? source.headers.Result : null,
              ]
                .filter((v) => v && v !== '?')
                .join(' · ')}
            </p>
            {source.kind === 'study' && source.lines.length > 1 && (
              <label className={styles.variation}>
                Biến nghiên cứu{' '}
                <select
                  value={branch}
                  onChange={(event) => {
                    setPlaying(false);
                    setBranch(Number(event.target.value));
                    setPly(0);
                  }}
                >
                  {source.lines.map((_, i) => (
                    <option key={i} value={i}>
                      {i === 0 ? 'Nhánh chính' : `Biến ${i}`}
                      {i === reference.branch ? ' · Bài tập' : ''}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <div className={styles.moveList} aria-label="Các nước trong ván">
              {frames.map((item, i) => (
                <button
                  type="button"
                  key={i}
                  ref={i === ply ? activeMove : undefined}
                  style={{
                    gridColumn:
                      i === 0
                        ? '1 / -1'
                        : frames[i - 1].fen.split(' ')[1] === 'w'
                          ? '1'
                          : '2',
                  }}
                  aria-current={i === ply ? 'step' : undefined}
                  title={
                    i === reference.ply && branch === reference.branch
                      ? 'Vị trí bài tập'
                      : undefined
                  }
                  aria-label={
                    i === reference.ply && branch === reference.branch
                      ? `${item.label} — Vị trí bài tập`
                      : undefined
                  }
                  onClick={() => jump(i)}
                >
                  <span>{item.label}</span>
                  {i === reference.ply && branch === reference.branch && (
                    <FiStar
                      className={styles.exerciseMarker}
                      aria-hidden="true"
                    />
                  )}
                </button>
              ))}
            </div>
            <p
              className={styles.position}
              aria-live={playing ? 'off' : 'polite'}
            >
              {ply === 0 ? 'Vị trí bắt đầu' : frame.label}
            </p>
          </div>
        </div>
      )}
    </dialog>
  );
}
