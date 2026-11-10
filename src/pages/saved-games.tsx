import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import type { GetStaticProps } from 'next';
import PrivateContent from '@/components/PrivateContent';
import DrawGameViewer from '@/components/DrawGameViewer';
import PracticePositionEditor from '@/components/PracticePositionEditor';
import PracticeSaveFeedback, {
  type PracticeSaveNotice,
} from '@/components/PracticeSaveFeedback';
import {
  type SavedGame,
  type SavedGamesData,
  matchingSavedPositions,
  savedMoveLabel,
  savedPositionFilters,
  splitTags,
  winningPlayer,
} from '@/lib/chess/saved-games';
import { practiceLevels } from '@/lib/chess/draw-levels';
import { gameOpeningCaption } from '@/lib/chess/game-opening';
import { practiceAccessHeaders } from '@/lib/practice-access';
import styles from '@/styles/SavedGames.module.css';

const opening = (g: SavedGame) =>
  g.source.gameOpening ||
  gameOpeningCaption(g.source.headers) ||
  'Chưa rõ khai cuộc';
function Library({
  initial,
  initialFilters,
}: {
  initial: SavedGamesData;
  initialFilters: ReturnType<typeof savedPositionFilters>;
}) {
  const [games, setGames] = useState(initial.games);
  const [active, setActive] = useState<SavedGame>();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({
    opening: '',
    winner: '',
    result: '',
    tag: '',
    ...initialFilters,
    squares: '',
    match: 'any',
    sort: 'saved',
  });
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState<string>();
  const [removingPosition, setRemovingPosition] = useState<string>();
  const [addingPosition, setAddingPosition] = useState<string>();
  const [positionSave, setPositionSave] = useState<{
    id: string;
    notice: PracticeSaveNotice;
  }>();
  const themeLabel = (id: string) =>
    initial.themes.find((theme) => theme.id === id)?.label ?? id;
  const positionsFor = (game: SavedGame) =>
    matchingSavedPositions(game, filters);
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
  async function remove(game: SavedGame, positionId?: string) {
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
          ...(positionId ? { positionId } : {}),
          expectedUpdatedAt: game.updatedAt,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setGames(data.games);
      setRemoving(undefined);
      setRemovingPosition(undefined);
      setMessage(
        positionId
          ? 'Đã bỏ mốc thế cờ đã lưu. Ván gốc vẫn được giữ lại.'
          : 'Đã bỏ ván khỏi bộ sưu tập.'
      );
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
      const positions = positionsFor(g);
      const tags = [...g.tags, ...positions.flatMap((p) => p.tags)];
      const markedSquares = [
        ...g.squares,
        ...positions.flatMap((p) => p.squares),
      ];
      const text = [
        h.White,
        h.Black,
        h.Event,
        h.Date,
        opening(g),
        g.note,
        ...g.tags,
        ...g.squares,
        ...positions.flatMap((p) => [
          themeLabel(p.themeId),
          p.level,
          p.note,
          ...p.tags,
          ...p.squares,
        ]),
      ]
        .join(' ')
        .toLocaleLowerCase();
      return (
        text.includes(query.trim().toLocaleLowerCase()) &&
        (!filters.opening || opening(g) === filters.opening) &&
        (!filters.winner || winningPlayer(g.source) === filters.winner) &&
        (!filters.result || h.Result === filters.result) &&
        (!(filters.themeId || filters.level) || positions.length > 0) &&
        (!filters.tag || tags.includes(filters.tag)) &&
        (!squares.length ||
          (filters.match === 'all'
            ? squares.every((s) => markedSquares.includes(s))
            : squares.some((s) => markedSquares.includes(s))))
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
      <p>Giữ lại ván gốc và các mốc thế cờ theo chủ đề, cấp độ đã ghi.</p>
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
          Chủ đề thế cờ
          <select
            value={filters.themeId}
            onChange={(e) => set('themeId', e.target.value)}
          >
            <option value="">Tất cả chủ đề</option>
            {initial.themes.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Cấp độ đã ghi
          <select
            value={filters.level}
            onChange={(e) => set('level', e.target.value)}
          >
            <option value="">Tất cả mức</option>
            {practiceLevels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
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
            {options(
              games.flatMap((g) => [
                ...g.tags,
                ...(g.positions ?? []).flatMap((p) => p.tags),
              ])
            )}
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
          {' · '}
          {visible.reduce((count, g) => count + positionsFor(g).length, 0)} thế
          cờ đã lưu
        </p>
        <button
          onClick={() => {
            setQuery('');
            setFilters({
              opening: '',
              winner: '',
              result: '',
              tag: '',
              themeId: '',
              level: '',
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
        <p>
          Chưa có ván nào. Khi xem ván gốc, chọn “☆ Lưu ván” hoặc “☆ Lưu thế cờ”
          để bắt đầu.
        </p>
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
            {positionsFor(g).length > 0 && (
              <section
                className={styles.positions}
                aria-label="Mốc thế cờ đã lưu"
              >
                <h3>Mốc thế cờ đã lưu</h3>
                {positionsFor(g).map((p) => (
                  <div key={p.id} className={styles.position}>
                    <p className={styles.positionHeading}>
                      {themeLabel(p.themeId)} · Cấp độ đã ghi {p.level}
                    </p>
                    <p>
                      {savedMoveLabel(g.source, p.reference)} ·{' '}
                      {p.fen.split(' ')[1] === 'w' ? 'Trắng đi' : 'Đen đi'}
                      {p.reference.branch > 0 &&
                        ` · Biến ${p.reference.branch + 1}`}
                    </p>
                    <div className={styles.chips}>
                      {[...p.squares, ...p.tags].map((tag, i) => (
                        <span key={`${tag}:${i}`}>{tag}</span>
                      ))}
                    </div>
                    {p.note && <p className={styles.note}>{p.note}</p>}
                    <div className={styles.actions}>
                      {initial.writable && (
                        <button
                          onClick={() => {
                            setPositionSave(undefined);
                            setAddingPosition(
                              addingPosition === p.id ? undefined : p.id
                            );
                          }}
                        >
                          Thêm vào bài tập
                        </button>
                      )}
                      <button
                        onClick={() =>
                          setActive({ ...g, reference: p.reference })
                        }
                      >
                        Xem thế cờ / sửa
                      </button>
                      {initial.writable && (
                        <button onClick={() => setRemovingPosition(p.id)}>
                          Bỏ thế cờ
                        </button>
                      )}
                    </div>
                    {positionSave?.id === p.id && (
                      <PracticeSaveFeedback notice={positionSave.notice} />
                    )}
                    {addingPosition === p.id && (
                      <PracticePositionEditor
                        fen={p.fen}
                        source={g.source}
                        reference={p.reference}
                        onSaved={(notice) => {
                          setPositionSave({ id: p.id, notice });
                          setAddingPosition(undefined);
                        }}
                        defaults={{
                          themeId: p.themeId,
                          level: p.level,
                          solution: p.note,
                        }}
                      />
                    )}
                    {removingPosition === p.id && (
                      <div className={styles.actions}>
                        <span>Bỏ mốc thế cờ này khỏi bộ sưu tập?</span>
                        <button disabled={busy} onClick={() => remove(g, p.id)}>
                          Bỏ thế cờ đã lưu
                        </button>
                        <button
                          disabled={busy}
                          onClick={() => setRemovingPosition(undefined)}
                        >
                          Giữ lại
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </section>
            )}
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
          bookmark
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
  const router = useRouter();
  return (
    <>
      <Head>
        <title>Ván đã lưu | LIMA Chess</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <main lang="vi" className={styles.page}>
        <PrivateContent<SavedGamesData> endpoint="/api/saved-games">
          {(data) => {
            const filters = savedPositionFilters(router.query, data.themes);
            return (
              <Library
                key={`${filters.themeId}:${filters.level}`}
                initial={data}
                initialFilters={filters}
              />
            );
          }}
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
