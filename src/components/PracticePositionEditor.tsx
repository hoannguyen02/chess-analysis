import { useEffect, useId, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { practiceAccessHeaders } from '@/lib/practice-access';
import { practiceLevels, type PracticeLevel } from '@/lib/chess/draw-levels';
import {
  manualPositionKey,
  type ManualTactic,
} from '@/lib/chess/manual-tactics';
import {
  gameExerciseContext,
  type GameReference,
  type GameSource,
} from '@/lib/chess/draw-game-viewer';
import type { DrawExercise } from '@/lib/chess/draw-practice';
import { formatPracticeVariation } from '@/lib/chess/practice-exploration';
import { previousDrawPosition } from '@/lib/chess/draw-trainer';
import { previousMoveLabel } from '@/lib/chess/worksheet';
import PracticeVariationRecorder from './PracticeVariationRecorder';
import PracticePositionSetup from './PracticePositionSetup';
import styles from '@/styles/SavedGames.module.css';

type Props = {
  fen: string;
  source?: GameSource;
  reference?: GameReference;
  previousMove?: DrawExercise['previousMove'];
  editId?: string;
  defaults?: Pick<ManualTactic, 'themeId' | 'level' | 'solution'>;
  initialLines?: string[][];
  initialGoal?: ManualTactic['goal'];
  beginnerBaseFen?: string;
  beginnerOriginalFen?: string;
  onSaved?: () => void;
};
type Theme = { id: string; label: string; href: string };
export default function PracticePositionEditor({
  fen,
  source,
  reference,
  previousMove,
  editId,
  defaults,
  initialLines,
  initialGoal,
  beginnerBaseFen,
  beginnerOriginalFen,
  onSaved,
}: Props) {
  const router = useRouter();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [entries, setEntries] = useState<ManualTactic[]>([]);
  const [topicOverrides, setTopicOverrides] = useState<Record<string, string>>(
    {}
  );
  const [levelOverrides, setLevelOverrides] = useState<
    Record<string, PracticeLevel>
  >({});
  const [writable, setWritable] = useState(false);
  const [themeId, setThemeId] = useState('');
  const [level, setLevel] = useState<PracticeLevel | ''>('');
  const [goal, setGoal] = useState<ManualTactic['goal'] | ''>('');
  const [variations, setVariations] = useState<string[][]>([]);
  const [recording, setRecording] = useState(false);
  const [editingPosition, setEditingPosition] = useState(false);
  const [editFen, setEditFen] = useState(fen);
  const [solution, setSolution] = useState('');
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState('');
  const [destination, setDestination] = useState('');
  const defaultTheme = defaults?.themeId;
  const defaultLevel = defaults?.level;
  const defaultSolution = defaults?.solution;
  const initialLinesJson = JSON.stringify(initialLines ?? []);
  const matches = useMemo(
    () =>
      entries.filter(
        (e) =>
          manualPositionKey(e.fen) === manualPositionKey(fen) &&
          (defaultLevel !== 'Beginner' ||
            e.level === 'Beginner' ||
            e.id === editId)
      ),
    [entries, fen, defaultLevel, editId]
  );
  const existing =
    entries.find((e) => e.id === editId && e.themeId === themeId) ??
    matches.find((e) => e.themeId === themeId);
  const origin = existing ?? entries.find((e) => e.id === editId) ?? matches[0];
  const branch = reference?.branch;
  const ply = reference?.ply;
  const sourceContext = useMemo(
    () =>
      source && branch !== undefined && ply !== undefined
        ? gameExerciseContext(source, { branch, ply })
        : undefined,
    [source, branch, ply]
  );
  const sourcePreviousMove =
    manualPositionKey(editFen) !== manualPositionKey(origin?.fen ?? fen)
      ? undefined
      : (previousMove ??
        (sourceContext &&
        manualPositionKey(sourceContext.fen) === manualPositionKey(fen)
          ? sourceContext.previousMove
          : undefined) ??
        origin?.previousMove);
  const precedingMove = useMemo(() => {
    if (!sourcePreviousMove) return undefined;
    try {
      return previousDrawPosition({
        fen: editFen,
        previousMove: sourcePreviousMove,
      })
        ? sourcePreviousMove
        : undefined;
    } catch {
      return undefined;
    }
  }, [editFen, sourcePreviousMove]);
  function fill(entry: ManualTactic, overrides: Record<string, PracticeLevel>) {
    setThemeId(entry.themeId);
    setLevel(overrides[entry.id] ?? entry.level);
    setGoal(entry.goal);
    setEditFen(entry.fen);
    setVariations(
      [
        [...entry.moves],
        ...(entry.alternativeLines ?? []).map((line) => [...line]),
      ].filter((line) => line.length > 0)
    );
    setSolution(entry.solution);
    setTitle(entry.title);
  }
  useEffect(() => {
    let live = true;
    const controller = new AbortController();
    async function load() {
      try {
        const res = await fetch('/api/manual-tactics', {
          headers: practiceAccessHeaders(),
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!res.ok)
          throw new Error(
            'Không tải được danh sách. Hãy đóng rồi mở lại để thử lại.'
          );
        const data = await res.json();
        if (!live) return;
        setThemes(data.themes);
        setEntries(data.positions);
        setTopicOverrides(data.topicOverrides ?? {});
        setLevelOverrides(data.levelOverrides ?? {});
        setWritable(data.writable);
        const old = data.positions.find((e: ManualTactic) =>
          editId
            ? e.id === editId
            : manualPositionKey(e.fen) === manualPositionKey(fen) &&
              (defaultLevel !== 'Beginner' || e.level === 'Beginner') &&
              (!defaultTheme || e.themeId === defaultTheme)
        );
        if (old) fill(old, data.levelOverrides ?? {});
        else if (defaultTheme && defaultLevel) {
          setThemeId(defaultTheme);
          setLevel(defaultLevel);
          setSolution(defaultSolution ?? '');
          setGoal(initialGoal ?? '');
          setVariations(
            (JSON.parse(initialLinesJson) as string[][])
              .filter((line) => line.length > 0)
              .map((line) => [...line])
          );
        }
        if (!data.writable)
          setMessage('Mở dự án trên máy để thêm hoặc sửa thế cờ.');
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
  }, [
    fen,
    editId,
    defaultTheme,
    defaultLevel,
    defaultSolution,
    initialGoal,
    initialLinesJson,
  ]);
  async function save() {
    setBusy(true);
    setMessage('');
    setDestination('');
    try {
      const res = await fetch('/api/manual-tactics', {
        method: 'POST',
        headers: {
          ...practiceAccessHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...origin,
          ...(existing ? { id: existing.id } : { id: undefined }),
          fen: editFen,
          themeId,
          level:
            existing && levelOverrides[existing.id] ? existing.level : level,
          goal,
          moves: variations[0] ?? [],
          alternativeLines: variations.slice(1),
          solution,
          title,
          ...(level === 'Beginner'
            ? {
                beginnerOriginalFen:
                  origin?.beginnerOriginalFen ?? beginnerOriginalFen ?? fen,
                ...(origin?.beginnerBaseFen ||
                (!editId && !existing && beginnerBaseFen)
                  ? {
                      beginnerBaseFen:
                        origin?.beginnerBaseFen ?? beginnerBaseFen,
                    }
                  : {}),
              }
            : {}),
          ...(source
            ? { headers: source.headers, gameOpening: source.gameOpening }
            : {}),
          ...(reference ? { reference } : {}),
          ...(precedingMove
            ? { previousMove: precedingMove }
            : level === 'Beginner'
              ? { previousMove: null }
              : {}),
          expectedUpdatedAt: existing?.updatedAt ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDestination(data.href ?? '');
        throw new Error(data.error);
      }
      setMessage('Đã thêm thế cờ vào bài tập.');
      onSaved?.();
      if (router.asPath.replace(/^\/(?:vi|en)(?=\/)/, '') === data.href)
        router.reload();
      else await router.push(data.href);
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      className={styles.editor}
      aria-label="Thêm thế cờ vào bài tập"
      onSubmit={(e) => {
        e.preventDefault();
        if (!recording && !editingPosition) save();
      }}
    >
      <p>
        {level === 'Beginner'
          ? 'Chỉnh sửa thế cờ hoặc ghi phương án nếu cần. Bạn có thể lưu bài Nhập môn chưa có lời giải.'
          : 'Chọn chủ đề, cấp độ và ghi phương án trên bàn cờ. Lưu để thêm trực tiếp vào bài luyện tập.'}
      </p>
      <p className={styles.positionHeading}>
        {precedingMove &&
          `Sau ${precedingMove.fen.split(' ')[5]}${precedingMove.fen.split(' ')[1] === 'w' ? '.' : '…'} ${precedingMove.move} · `}
        {editFen.split(' ')[1] === 'w' ? 'Trắng đi' : 'Đen đi'}
      </p>
      {precedingMove && (
        <p>
          {previousMoveLabel({ fen: editFen, previousMove: precedingMove })}
        </p>
      )}
      {existing && topicOverrides[existing.id] ? (
        <p>
          Bài tập hiện thuộc{' '}
          {themes.find((theme) => theme.href === topicOverrides[existing.id])
            ?.label ?? 'chủ đề đã chọn'}{' '}
          · {level}. Đổi chủ đề hoặc cấp độ trong “Quản lý bài tập”.
        </p>
      ) : (
        <div className={styles.positionFields}>
          <label>
            Chủ đề
            <select
              required
              value={themeId}
              disabled={!writable || busy}
              onChange={(e) => {
                setThemeId(e.target.value);
                setMessage('');
                setDestination('');
                const old = matches.find((p) => p.themeId === e.target.value);
                if (old) fill(old, levelOverrides);
              }}
            >
              <option value="">Chọn chủ đề</option>
              {themes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Cấp độ
            <select
              required
              value={level}
              disabled={
                !writable ||
                busy ||
                Boolean(existing && levelOverrides[existing.id])
              }
              onChange={(e) => setLevel(e.target.value as PracticeLevel | '')}
            >
              <option value="">Chọn cấp độ</option>
              {practiceLevels.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      {existing &&
        levelOverrides[existing.id] &&
        !topicOverrides[existing.id] && (
          <p>Đổi cấp độ trong “Quản lý bài tập” trên trang luyện tập.</p>
        )}
      <label>
        Mục tiêu
        <select
          required
          value={goal}
          disabled={!writable || busy}
          onChange={(e) => setGoal(e.target.value as ManualTactic['goal'])}
        >
          <option value="">Chọn mục tiêu</option>
          <option value="material">Thắng vật chất</option>
          <option value="checkmate">Chiếu hết</option>
          <option value="win">Giành thế thắng</option>
          <option value="draw">Hòa</option>
        </select>
      </label>
      <section aria-label="Phương án đã ghi">
        {level === 'Beginner' && (
          <div className={styles.setupActions}>
            <button
              type="button"
              disabled={!writable || busy}
              onClick={() => setEditingPosition(true)}
            >
              Chỉnh sửa thế cờ
            </button>
          </div>
        )}
        <p className={styles.positionHeading}>
          Phương án ({level === 'Beginner' ? 'tùy chọn' : 'bắt buộc'})
        </p>
        <button
          type="button"
          disabled={!writable || busy}
          onClick={() => {
            setMessage('');
            setRecording(true);
          }}
        >
          {variations.length
            ? 'Mở bàn cờ để sửa phương án'
            : 'Ghi phương án trên bàn cờ'}
        </button>
        {!variations.length ? (
          <p>
            {level === 'Beginner'
              ? 'Chưa có lời giải. Có thể ghi thêm sau khi lưu thế cờ.'
              : 'Chưa ghi phương án. Đi cho cả hai bên trên bàn cờ rồi chọn OK.'}
          </p>
        ) : (
          <ol className={styles.variationPreview}>
            {variations.map((line, i) => (
              <li key={i}>
                <strong>
                  {i === 0 ? 'Phương án chính' : `Phương án ${i + 1}`}
                </strong>
                <p>{formatPracticeVariation(editFen, line)}</p>
              </li>
            ))}
          </ol>
        )}
      </section>
      {editingPosition && level === 'Beginner' && (
        <PracticePositionSetup
          fen={editFen}
          hasLines={variations.length > 0 || Boolean(solution)}
          onClose={() => setEditingPosition(false)}
          onConfirm={(nextFen) => {
            if (nextFen !== editFen) {
              setEditFen(nextFen);
              setVariations([]);
              setSolution('');
            }
            setEditingPosition(false);
          }}
        />
      )}
      {recording && (
        <PracticeVariationRecorder
          fen={editFen}
          lines={variations}
          onClose={() => setRecording(false)}
          onConfirm={(lines) => {
            setVariations(lines);
            setRecording(false);
            setMessage('');
          }}
        />
      )}
      <label>
        Tên thế cờ (tùy chọn)
        <input
          value={title}
          maxLength={1000}
          onChange={(e) => setTitle(e.target.value)}
          disabled={!writable || busy}
        />
      </label>
      <label>
        Giải thích phương án (tùy chọn)
        <textarea
          value={solution}
          maxLength={4000}
          onChange={(e) => setSolution(e.target.value)}
          disabled={!writable || busy}
        />
      </label>
      <button
        type="submit"
        disabled={
          !writable ||
          busy ||
          !themeId ||
          !level ||
          !goal ||
          (level !== 'Beginner' && !variations.length)
        }
      >
        {busy
          ? 'Đang xử lý…'
          : existing
            ? 'Cập nhật bài tập'
            : 'Thêm vào bài tập'}
      </button>
      <p role="status">{message}</p>
      {destination && <Link href={destination}>Mở chủ đề đã có thế cờ →</Link>}
    </form>
  );
}

export function PracticePositionDialog({
  title,
  onClose,
  ...props
}: Props & { title: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const element = dialog.current!;
    const trigger = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element.showModal();
    return () => {
      element.close();
      document.body.style.overflow = overflow;
      trigger?.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className={styles.managementDialog}
      aria-labelledby={titleId}
      onKeyDown={(event) => event.stopPropagation()}
      onCancel={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }}
    >
      <header className={styles.managementHeader}>
        <h3 id={titleId}>{title}</h3>
        <button type="button" aria-label="Đóng cửa sổ thế cờ" onClick={onClose}>
          ✕
        </button>
      </header>
      <PracticePositionEditor {...props} onSaved={onClose} />
      <button type="button" onClick={onClose}>
        Hủy
      </button>
    </dialog>
  );
}

export function ManualPositionControl(props: Props) {
  const [open, setOpen] = useState(false);
  const beginner = props.defaults?.level === 'Beginner';
  return (
    <div className={styles.saveControl}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup={beginner ? 'dialog' : undefined}
        onClick={() => setOpen(!open)}
      >
        {beginner ? 'Chỉnh sửa thế cờ / lời giải' : 'Sửa thế cờ tự thêm'}
      </button>
      {open &&
        (beginner ? (
          <PracticePositionDialog
            {...props}
            title="Chỉnh sửa thế cờ / lời giải"
            onClose={() => setOpen(false)}
          />
        ) : (
          <PracticePositionEditor {...props} />
        ))}
    </div>
  );
}
