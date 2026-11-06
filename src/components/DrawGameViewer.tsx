import SaveGameControl from './SaveGameControl';
import { gameOpeningCaption } from '@/lib/chess/game-opening';
import GamePlayerNames from './GamePlayerNames';
import { gamePlayers } from '@/lib/chess/game-player-title';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Chessboard } from 'react-chessboard';
import { FiStar } from 'react-icons/fi';
import { useCustomBoard } from '@/hooks/useCustomBoard';
import {
  GameReference,
  ReferenceGame,
  referenceGameList,
  GameSource,
  gameFrames,
  loadGameSource,
  exerciseGamePreview,
  type GameExercisePosition,
} from '@/lib/chess/draw-game-viewer';
import styles from '@/styles/DrawGameViewer.module.css';

export default function DrawGameViewer({
  reference: initialReference,
  onClose,
  source: initialSource,
  referenceGames,
  orientation = 'white',
  bookmark = false,
  position: initialPosition,
}: {
  reference: GameReference;
  referenceGames?: ReferenceGame[];
  source?: GameSource;
  orientation?: 'white' | 'black';
  bookmark?: boolean;
  position?: GameExercisePosition;
  onClose: () => void;
}) {
  const playlist = useMemo(
    () =>
      referenceGameList(referenceGames ?? [], {
        reference: initialReference,
        source: initialSource,
        position: initialPosition,
      }),
    [referenceGames, initialReference, initialSource, initialPosition]
  );
  const [gameIndex, setGameIndex] = useState(() =>
    playlist.findIndex(
      (item) =>
        item.reference.id === initialReference.id &&
        item.reference.collection === initialReference.collection
    )
  );
  const { reference, source: providedSource, position } = playlist[gameIndex];
  const dialog = useRef<HTMLDialogElement>(null);
  const board = useRef<HTMLDivElement>(null);
  const activeMove = useRef<HTMLButtonElement>(null);
  const [source, setSource] = useState<GameSource | undefined>(providedSource);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [branch, setBranch] = useState(reference.branch);
  const [ply, setPly] = useState(reference.ply);
  const [contextMode, setContextMode] = useState(true);
  const [contextPly, setContextPly] = useState<number | null>(null);
  const [contextBranch, setContextBranch] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [flipped, setFlipped] = useState(orientation === 'black');
  const [width, setWidth] = useState(360);
  const theme = useCustomBoard();
  const preview = useMemo(
    () => (source ? exerciseGamePreview(source, reference, position) : null),
    [source, reference, position]
  );
  const showingContext = !!preview && contextMode;
  const displaySource = showingContext ? preview.source : source;
  const viewBranch = showingContext ? contextBranch : branch;
  const viewPly = showingContext ? (contextPly ?? preview.markerPly) : ply;
  const markerPly = showingContext ? preview.markerPly : reference.ply;
  const markerBranch = showingContext ? 0 : reference.branch;
  const frames = useMemo(
    () => (displaySource ? gameFrames(displaySource, viewBranch) : []),
    [displaySource, viewBranch]
  );
  const frame = frames[viewPly];
  const title = showingContext
    ? 'Thế cờ bài tập'
    : reference.kind === 'game'
      ? 'Ván gốc'
      : 'Bài nghiên cứu';
  const markerLabel = bookmark
    ? 'Thế cờ đã lưu'
    : preview && !showingContext
      ? 'Vị trí nguồn trong ván'
      : 'Vị trí bài tập';
  function setViewPly(next: number | ((value: number) => number)) {
    if (showingContext)
      setContextPly(typeof next === 'function' ? next(viewPly) : next);
    else setPly(next);
  }
  const gameCaption = source
    ? [
        source.headers.Date?.match(/^\d{4}/)?.[0] ??
          source.headers.UTCDate?.match(/^\d{4}/)?.[0],
        source.headers.Event,
        source.kind === 'game' && !showingContext
          ? source.headers.Result
          : null,
      ]
        .filter((value) => value && !/^\?+$/.test(value))
        .join(' · ')
    : '';

  const openingCaption =
    source?.kind === 'game'
      ? source.gameOpening || gameOpeningCaption(source.headers)
      : '';

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
    if (providedSource) {
      setSource(providedSource);
      return;
    }
    let cancelled = false;
    setSource(undefined);
    setError(false);
    loadGameSource(reference.id, reference.collection)
      .then((data) => {
        if (!cancelled) setSource(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [reference.id, reference.collection, attempt, providedSource]);
  useEffect(() => {
    if (!board.current) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.floor(entry.contentRect.width))
    );
    observer.observe(board.current);
    return () => observer.disconnect();
  }, [displaySource]);
  useEffect(() => {
    const active = activeMove.current;
    const list = active?.parentElement;
    if (!active || !list) return;
    const item = active.getBoundingClientRect();
    const bounds = list.getBoundingClientRect();
    if (item.top < bounds.top) list.scrollTop += item.top - bounds.top;
    else if (item.bottom > bounds.bottom)
      list.scrollTop += item.bottom - bounds.bottom;
  }, [viewPly, viewBranch, displaySource]);
  useEffect(() => {
    if (!playing) return;
    if (viewPly >= frames.length - 1) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => {
      if (showingContext) setContextPly(viewPly + 1);
      else setPly(viewPly + 1);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [playing, viewPly, frames.length, showingContext]);
  useEffect(() => {
    const pause = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener('visibilitychange', pause);
    return () => document.removeEventListener('visibilitychange', pause);
  }, []);
  function changeGame(next: number) {
    if (next < 0 || next >= playlist.length) return;
    const item = playlist[next];
    setPlaying(false);
    setError(false);
    setSource(item.source);
    setContextMode(true);
    setContextPly(null);
    setContextBranch(0);
    setBranch(item.reference.branch);
    setPly(item.reference.ply);
    setGameIndex(next);
  }
  function jump(next: number) {
    setPlaying(false);
    setViewPly(Math.max(0, Math.min(frames.length - 1, next)));
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
        if (
          event.target instanceof HTMLElement &&
          event.target.closest('input, textarea, select, [contenteditable]')
        )
          return;
        if (!frames.length) return;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault();
          event.stopPropagation();
          jump(viewPly + (event.key === 'ArrowRight' ? 1 : -1));
        }
      }}
    >
      <header className={styles.header}>
        <div>
          <h2 id="draw-game-title">{title}</h2>
        </div>
        {playlist.length > 1 && (
          <nav
            className={styles.gameNavigation}
            aria-label="Chuyển ván tham khảo"
          >
            <button
              type="button"
              disabled={gameIndex === 0}
              onClick={() => changeGame(gameIndex - 1)}
              aria-label="Ván trước"
            >
              ← Ván trước
            </button>
            <span aria-live="polite">
              Ván {gameIndex + 1}/{playlist.length}
            </span>
            <button
              type="button"
              disabled={gameIndex === playlist.length - 1}
              onClick={() => changeGame(gameIndex + 1)}
              aria-label="Ván tiếp"
            >
              Ván tiếp →
            </button>
          </nav>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng ván gốc"
          autoFocus
        >
          ✕
        </button>
      </header>
      {preview && (
        <section className={styles.contextNotice} aria-label="Nguồn của thế cờ">
          <p>
            Thế cờ bài tập thuộc phương án minh họa hoặc đã được chỉnh sửa, nên
            khác vị trí đánh dấu trong nguồn. Chọn ván gốc để xem diễn biến thực
            tế.
          </p>
          <div
            className={styles.contextActions}
            role="group"
            aria-label="Chọn nội dung xem"
          >
            <button
              type="button"
              aria-pressed={showingContext}
              onClick={() => {
                setPlaying(false);
                setContextMode(true);
              }}
            >
              Thế cờ bài tập
            </button>
            <button
              type="button"
              aria-pressed={!showingContext}
              onClick={() => {
                setPlaying(false);
                setContextMode(false);
              }}
            >
              {reference.kind === 'game' ? 'Ván gốc' : 'Bài nghiên cứu nguồn'}
            </button>
          </div>
        </section>
      )}
      {source?.kind === 'game' && !showingContext && (
        <SaveGameControl
          key={`${reference.collection}:${reference.id}:${branch}:${ply}`}
          source={source}
          reference={{ ...reference, branch, ply }}
          onOpen={() => setPlaying(false)}
        />
      )}
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
                disabled={viewPly === 0}
                onClick={() => jump(0)}
              >
                ⏮
              </button>
              <button
                type="button"
                title="Nước trước"
                aria-label="Nước trước"
                disabled={viewPly === 0}
                onClick={() => jump(viewPly - 1)}
              >
                ←
              </button>
              <button
                type="button"
                disabled={viewPly === frames.length - 1}
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
                disabled={viewPly === frames.length - 1}
                onClick={() => jump(viewPly + 1)}
              >
                →
              </button>
              <button
                type="button"
                title="Cuối ván"
                aria-label="Cuối ván"
                disabled={viewPly === frames.length - 1}
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
                  if (preview) {
                    setContextMode(true);
                    setContextBranch(0);
                    setContextPly(preview.markerPly);
                    return;
                  }
                  setBranch(reference.branch);
                  setPly(reference.ply);
                }}
              >
                {bookmark ? 'Về thế cờ đã lưu' : 'Về vị trí bài tập'}
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
              {source.kind === 'game' ? (
                <GamePlayerNames
                  players={gamePlayers(source.headers)}
                  fallback={`${source.headers.White} — ${source.headers.Black}`}
                />
              ) : (
                source.headers.ChapterName || source.headers.Event
              )}
            </h3>
            <p className={styles.gameCaption} title={gameCaption}>
              {gameCaption}
            </p>
            {openingCaption && (
              <p className={styles.gameCaption} title={openingCaption}>
                {openingCaption}
              </p>
            )}
            {displaySource?.kind === 'study' &&
              displaySource.lines.length > 1 && (
                <label className={styles.variation}>
                  {showingContext ? 'Phương án bài tập' : 'Biến nghiên cứu'}{' '}
                  <select
                    value={viewBranch}
                    onChange={(event) => {
                      setPlaying(false);
                      if (showingContext) {
                        setContextBranch(Number(event.target.value));
                        setContextPly(preview.markerPly);
                        return;
                      }
                      setBranch(Number(event.target.value));
                      setPly(0);
                    }}
                  >
                    {displaySource.lines.map((_, i) => (
                      <option key={i} value={i}>
                        {i === 0 ? 'Nhánh chính' : `Biến ${i}`}
                        {i === markerBranch
                          ? bookmark
                            ? ' · Đã lưu'
                            : ' · Bài tập'
                          : ''}
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
                  ref={i === viewPly ? activeMove : undefined}
                  style={{
                    gridColumn:
                      i === 0
                        ? '1 / -1'
                        : frames[i - 1].fen.split(' ')[1] === 'w'
                          ? '1'
                          : '2',
                  }}
                  aria-current={i === viewPly ? 'step' : undefined}
                  title={
                    i === markerPly &&
                    (showingContext || branch === reference.branch)
                      ? markerLabel
                      : undefined
                  }
                  aria-label={
                    i === markerPly &&
                    (showingContext || branch === reference.branch)
                      ? `${item.label} — ${markerLabel}`
                      : undefined
                  }
                  onClick={() => jump(i)}
                >
                  <span>{item.label}</span>
                  {i === markerPly &&
                    (showingContext || branch === reference.branch) && (
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
              {viewPly === 0 ? 'Vị trí bắt đầu' : frame.label}
            </p>
          </div>
        </div>
      )}
    </dialog>
  );
}
