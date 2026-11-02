import { useEffect, useState } from 'react';
import Head from 'next/head';
import type { GetStaticProps } from 'next';
import PrivateContent from '@/components/PrivateContent';
import DrawGameViewer from '@/components/DrawGameViewer';
import {
  type SavedGame,
  type SavedGamesData,
  splitTags,
  winningPlayer,
} from '@/lib/chess/saved-games';
import { gameOpeningCaption } from '@/lib/chess/game-opening';
import { practiceAccessHeaders } from '@/lib/practice-access';
import styles from '@/styles/SavedGames.module.css';

const opening = (g: SavedGame) =>
  g.source.gameOpening ||
  gameOpeningCaption(g.source.headers) ||
  'Chưa rõ khai cuộc';
function Library({ initial }: { initial: SavedGamesData }) {
  const [games, setGames] = useState(initial.games);
  const [active, setActive] = useState<SavedGame>();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({
    opening: '',
    winner: '',
    result: '',
    tag: '',
    squares: '',
    match: 'any',
    sort: 'saved',
  });
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState<string>();
  const set = (key: keyof typeof filters, value: string) =>
    setFilters((f) => ({ ...f, [key]: value }));
  useEffect(() => {
    let live = true;
    async function refresh() {
      try {
        const res = await fetch('/api/saved-games', {
          headers: practiceAccessHeaders(),
          cache: 'no-store',
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (live) setGames(data.games);
      } catch {
        if (live) setMessage('Không tải được bản mới. Hãy tải lại trang.');
      }
    }
    window.addEventListener('saved-games-changed', refresh);
    return () => {
      live = false;
      window.removeEventListener('saved-games-changed', refresh);
    };
  }, []);
  async function remove(game: SavedGame) {
    setBusy(true);
    setMessage('');
    try {
      const res = await fetch('/api/saved-games', {
        method: 'DELETE',
        headers: {
          ...practiceAccessHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: game.id,
          expectedUpdatedAt: game.updatedAt,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setGames(data.games);
      setRemoving(undefined);
      setMessage('Đã bỏ ván khỏi bộ sưu tập.');
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const squares = splitTags(filters.squares.toLowerCase());
  const visible = games
    .filter((g) => {
      const h = g.source.headers;
      const text = [
        h.White,
        h.Black,
        h.Event,
        h.Date,
        opening(g),
        g.note,
        ...g.tags,
        ...g.squares,
      ]
        .join(' ')
        .toLocaleLowerCase();
      return (
        text.includes(query.trim().toLocaleLowerCase()) &&
        (!filters.opening || opening(g) === filters.opening) &&
        (!filters.winner || winningPlayer(g.source) === filters.winner) &&
        (!filters.result || h.Result === filters.result) &&
        (!filters.tag || g.tags.includes(filters.tag)) &&
        (!squares.length ||
          (filters.match === 'all'
            ? squares.every((s) => g.squares.includes(s))
            : squares.some((s) => g.squares.includes(s))))
      );
    })
    .sort((a, b) =>
      filters.sort === 'player'
        ? (a.source.headers.White || '').localeCompare(
            b.source.headers.White || ''
          )
        : filters.sort === 'date'
          ? (b.source.headers.Date || '').localeCompare(
              a.source.headers.Date || ''
            )
          : b.createdAt.localeCompare(a.createdAt)
    );
  const options = (items: string[]) =>
    [...new Set(items.filter(Boolean))].sort().map((x) => (
      <option key={x} value={x}>
        {x}
      </option>
    ));
  return (
    <>
      <h1>Ván đã lưu</h1>
      <p>Giữ lại những ván đáng nhớ và tìm lại ý tưởng bạn muốn xem.</p>
      {!initial.writable && <p>Để thêm hoặc sửa ván, hãy mở dự án trên máy.</p>}
      <div className={styles.filters}>
        <label>
          Tìm kiếm
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Kỳ thủ, ghi chú, từ khóa…"
          />
        </label>
        <label>
          Khai cuộc
          <select
            value={filters.opening}
            onChange={(e) => set('opening', e.target.value)}
          >
            <option value="">Tất cả khai cuộc</option>
            {options(games.map(opening))}
          </select>
        </label>
        <label>
          Kỳ thủ thắng
          <select
            value={filters.winner}
            onChange={(e) => set('winner', e.target.value)}
          >
            <option value="">Tất cả kỳ thủ</option>
            {options(games.map((g) => winningPlayer(g.source)))}
          </select>
        </label>
        <label>
          Kết quả
          <select
            value={filters.result}
            onChange={(e) => set('result', e.target.value)}
          >
            <option value="">Tất cả kết quả</option>
            <option value="1-0">Trắng thắng</option>
            <option value="0-1">Đen thắng</option>
            <option value="1/2-1/2">Hòa</option>
            <option value="*">Chưa có kết quả</option>
          </select>
        </label>
        <label>
          Nhãn
          <select
            value={filters.tag}
            onChange={(e) => set('tag', e.target.value)}
          >
            <option value="">Tất cả nhãn</option>
            {options(games.flatMap((g) => g.tags))}
          </select>
        </label>
        <label>
          Ô quan trọng
          <input
            value={filters.squares}
            onChange={(e) => set('squares', e.target.value)}
            placeholder="f2, f7"
          />
        </label>
        <label>
          Khớp ô
          <select
            value={filters.match}
            onChange={(e) => set('match', e.target.value)}
          >
            <option value="any">Ít nhất một ô</option>
            <option value="all">Tất cả các ô</option>
          </select>
        </label>
        <label>
          Sắp xếp
          <select
            value={filters.sort}
            onChange={(e) => set('sort', e.target.value)}
          >
            <option value="saved">Mới lưu nhất</option>
            <option value="date">Ngày thi đấu</option>
            <option value="player">Tên kỳ thủ Trắng</option>
          </select>
        </label>
      </div>
      <div className={styles.actions}>
        <p>
          {visible.length} / {games.length} ván
        </p>
        <button
          onClick={() => {
            setQuery('');
            setFilters({
              opening: '',
              winner: '',
              result: '',
              tag: '',
              squares: '',
              match: 'any',
              sort: 'saved',
            });
          }}
        >
          Xóa bộ lọc
        </button>
      </div>
      <p role="status">{message}</p>
      {!games.length ? (
        <p>Chưa có ván nào. Khi xem ván gốc, chọn “☆ Lưu ván” để bắt đầu.</p>
      ) : !visible.length ? (
        <p>Không có ván phù hợp. Thử đổi hoặc xóa bộ lọc.</p>
      ) : null}
      <div className={styles.grid}>
        {visible.map((g) => (
          <article className={styles.card} key={g.id}>
            <h2>
              {g.source.headers.White || 'Trắng'} —{' '}
              {g.source.headers.Black || 'Đen'}
            </h2>
            <p>
              {[
                g.source.headers.Date,
                g.source.headers.Event,
                g.source.headers.Result,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
            <p>{opening(g)}</p>
            {winningPlayer(g.source) && <p>Thắng: {winningPlayer(g.source)}</p>}
            <div className={styles.chips}>
              {[...g.squares, ...g.tags].map((t, i) => (
                <span key={`${t}:${i}`}>{t}</span>
              ))}
            </div>
            {g.note && <p className={styles.note}>{g.note}</p>}
            <div className={styles.actions}>
              <button onClick={() => setActive(g)}>Xem ván / sửa</button>
              {initial.writable && (
                <button onClick={() => setRemoving(g.id)}>Bỏ lưu</button>
              )}
            </div>
            {g.moments.length > 1 && (
              <label>
                Mốc đã lưu
                <select
                  aria-label="Mở mốc đã lưu"
                  value=""
                  onChange={(e) => {
                    const m = g.moments[Number(e.target.value)];
                    setActive({ ...g, reference: { ...g.reference, ...m } });
                  }}
                >
                  <option value="" disabled>
                    Chọn mốc nước đi
                  </option>
                  {g.moments.map((m, i) => (
                    <option key={i} value={i}>
                      Biến {m.branch + 1} · lượt {m.ply}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {removing === g.id && (
              <div className={styles.actions}>
                <span>Bỏ ván này khỏi bộ sưu tập?</span>
                <button disabled={busy} onClick={() => remove(g)}>
                  Bỏ lưu ván
                </button>
                <button disabled={busy} onClick={() => setRemoving(undefined)}>
                  Giữ lại
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
      {active && (
        <DrawGameViewer
          reference={active.reference}
          source={active.source}
          referenceGames={visible.map((g) => ({
            reference: g.reference,
            source: g.source,
          }))}
          onClose={() => setActive(undefined)}
        />
      )}
    </>
  );
}
export default function SavedGamesPage() {
  return (
    <>
      <Head>
        <title>Ván đã lưu | LIMA Chess</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <main lang="vi" className={styles.page}>
        <PrivateContent<SavedGamesData> endpoint="/api/saved-games">
          {(data) => <Library initial={data} />}
        </PrivateContent>
      </main>
    </>
  );
}
export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    messages: {
      common: (await import(`@/locales/${locale || 'vi'}/common.json`)).default,
    },
  },
});
