import { useState } from 'react';
import Link from 'next/link';
import type { GameReference, GameSource } from '@/lib/chess/draw-game-viewer';
import {
  splitTags,
  type SavedGame,
  type SavedGamesData,
} from '@/lib/chess/saved-games';
import { practiceAccessHeaders } from '@/lib/practice-access';
import styles from '@/styles/SavedGames.module.css';

export default function SaveGameControl({
  source,
  reference,
}: {
  source: GameSource;
  reference: GameReference;
}) {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [existing, setExisting] = useState<SavedGame>();
  const [squares, setSquares] = useState('');
  const [tags, setTags] = useState('');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');
  async function edit() {
    setOpen(!open);
    if (open) return;
    setBusy(true);
    setReady(false);
    setMessage('');
    try {
      const res = await fetch('/api/saved-games', {
        headers: practiceAccessHeaders(),
        cache: 'no-store',
      });
      const data: SavedGamesData = await res.json();
      if (!res.ok)
        throw new Error('Không tải được bộ sưu tập. Vui lòng thử lại.');
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
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
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
    <div className={styles.saveControl}>
      <div className={styles.actions}>
        <button type="button" onClick={edit} aria-expanded={open}>
          ☆ Lưu ván
        </button>
        <Link href="/saved-games">Ván đã lưu →</Link>
      </div>
      {open && (
        <section className={styles.editor} aria-label="Lưu ván đấu">
          <p>
            Lưu ván và đánh dấu nước đang xem. Ngăn cách các ô hoặc nhãn bằng
            dấu phẩy.
          </p>
          <label>
            Ô quan trọng
            <input
              value={squares}
              onChange={(e) => setSquares(e.target.value)}
              placeholder="f2, f7, f3, f6"
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
            Ghi chú
            <textarea
              value={note}
              maxLength={4000}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Điều đáng nhớ trong ván này…"
              disabled={!ready || busy}
            />
          </label>
          <button type="button" disabled={!ready || busy} onClick={save}>
            {busy ? 'Đang tải…' : existing ? 'Cập nhật' : 'Lưu vào bộ sưu tập'}
          </button>
          <p role="status">{message}</p>
        </section>
      )}
    </div>
  );
}
