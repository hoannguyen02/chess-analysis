import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  gameExerciseContext,
  type GameReference,
  type GameSource,
} from '@/lib/chess/draw-game-viewer';
import {
  splitTags,
  type SavedGame,
  type SavedGamesData,
} from '@/lib/chess/saved-games';
import { practiceAccessHeaders } from '@/lib/practice-access';
import styles from '@/styles/SavedGames.module.css';
import PracticePositionEditor from './PracticePositionEditor';

type SaveProps = { source: GameSource; reference: GameReference };
export default function SaveGameControl({
  source,
  reference,
  onOpen,
}: SaveProps & { onOpen?: () => void }) {
  const [mode, setMode] = useState<'game' | 'position'>();
  function edit(next: 'game' | 'position') {
    if (mode === next) setMode(undefined);
    else {
      onOpen?.();
      setMode(next);
    }
  }
  return (
    <div className={styles.saveControl}>
      <div className={styles.actions}>
        <button
          type="button"
          onClick={() => edit('position')}
          aria-expanded={mode === 'position'}
        >
          ＋ Thêm thế cờ
        </button>
        <button
          type="button"
          onClick={() => edit('game')}
          aria-expanded={mode === 'game'}
        >
          ☆ Lưu ván
        </button>
        <Link href="/saved-games">Ván đã lưu →</Link>
      </div>
      {mode === 'position' && (
        <PositionEditor source={source} reference={reference} />
      )}
      {mode === 'game' && (
        <SaveGameEditor source={source} reference={reference} />
      )}
    </div>
  );
}
function PositionEditor({ source, reference }: SaveProps) {
  const { branch, ply } = reference;
  const context = useMemo(
    () => gameExerciseContext(source, { branch, ply }),
    [source, branch, ply]
  );
  return (
    <PracticePositionEditor
      fen={context.fen}
      source={source}
      reference={reference}
      previousMove={context.previousMove}
    />
  );
}
function SaveGameEditor({ source, reference }: SaveProps) {
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(true);
  const [existing, setExisting] = useState<SavedGame>();
  const [squares, setSquares] = useState('');
  const [tags, setTags] = useState('');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => {
    let live = true;
    const controller = new AbortController();
    async function load() {
      try {
        const res = await fetch('/api/saved-games', {
          headers: practiceAccessHeaders(),
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!res.ok)
          throw new Error(
            'Không tải được bộ sưu tập. Hãy đóng rồi mở lại để thử lại.'
          );
        const data: SavedGamesData = await res.json();
        if (!live) return;
        const key = (s: GameSource) =>
          JSON.stringify([
            s.fen,
            s.lines[0],
            s.headers.White,
            s.headers.Black,
            s.headers.Date,
          ]);
        const old = data.games.find((g) => key(g.source) === key(source));
        setExisting(old);
        setSquares(old?.squares.join(', ') ?? '');
        setTags(old?.tags.join(', ') ?? '');
        setNote(old?.note ?? '');
        setReady(data.writable);
        if (!data.writable)
          setMessage('Mở dự án trên máy để thêm hoặc sửa ván đã lưu.');
      } catch (e) {
        if (live) setMessage((e as Error).message);
      } finally {
        if (live) setBusy(false);
      }
    }
    load();
    return () => {
      live = false;
      controller.abort();
    };
  }, [source]);
  async function save() {
    setBusy(true);
    setMessage('');
    try {
      const res = await fetch('/api/saved-games', {
        method: 'POST',
        headers: {
          ...practiceAccessHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source,
          reference,
          squares: splitTags(squares.toLowerCase()),
          tags: splitTags(tags),
          note,
          expectedUpdatedAt: existing?.updatedAt ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setExisting(data.games[0]);
      setMessage('Đã lưu ván và mốc nước đi hiện tại.');
      window.dispatchEvent(new Event('saved-games-changed'));
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      className={styles.editor}
      aria-label="Lưu ván đấu"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <p>
        Lưu ván và đánh dấu nước đang xem. Ngăn cách các ô hoặc nhãn bằng dấu
        phẩy.
      </p>
      <label>
        Ô quan trọng
        <input
          value={squares}
          onChange={(e) => setSquares(e.target.value)}
          placeholder="f2, f7"
          disabled={!ready || busy}
        />
      </label>
      <label>
        Nhãn
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Tấn công Vua, thí quân"
          disabled={!ready || busy}
        />
      </label>
      <label>
        Ghi chú cho ván
        <textarea
          value={note}
          maxLength={4000}
          onChange={(e) => setNote(e.target.value)}
          disabled={!ready || busy}
        />
      </label>
      <button type="submit" disabled={!ready || busy}>
        {busy ? 'Đang tải…' : existing ? 'Cập nhật' : 'Lưu vào bộ sưu tập'}
      </button>
      <p role="status">{message}</p>
    </form>
  );
}
