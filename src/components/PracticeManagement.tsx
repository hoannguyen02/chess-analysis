import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import type { DrawExercise } from '@/lib/chess/draw-practice';
import { practiceLevels, type PracticeLevel } from '@/lib/chess/draw-levels';
import { practiceReviewReference } from '@/lib/chess/practice-management';
import { practiceAccessHeaders } from '@/lib/practice-access';
import styles from '@/styles/SavedGames.module.css';
import { FiMoreHorizontal, FiX } from 'react-icons/fi';

async function changePractice(body: object) {
  const response = await fetch('/api/practice-management', {
    method: 'POST',
    headers: { ...practiceAccessHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Không lưu được thay đổi.');
  return result.href as string;
}

export function ExerciseManagementControl({
  exercise,
}: {
  exercise: DrawExercise;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState<PracticeLevel>(
    exercise.beginner ? 'Beginner' : (exercise.difficulty?.level ?? 'A')
  );
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const management = exercise.management;
  const currentScope = management?.currentScope ?? management?.scope ?? '';
  const [destinationScope, setDestinationScope] = useState(currentScope);
  const [topics, setTopics] = useState<{ scope: string; label: string }[]>([]);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogId = useId();
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    const trigger = triggerRef.current;
    dialog.showModal();
    return () => {
      dialog.close();
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, [open]);
  useEffect(() => {
    if (!open || !management) return;
    const controller = new AbortController();
    fetch(
      `/api/practice-management?scope=${encodeURIComponent(management.scope)}`,
      {
        headers: practiceAccessHeaders(),
        signal: controller.signal,
        cache: 'no-store',
      }
    )
      .then(async (response) => {
        if (!response.ok) throw new Error('Không tải được danh sách chủ đề.');
        const result = await response.json();
        if (!controller.signal.aborted) setTopics(result.topics);
      })
      .catch((e: Error) => {
        if (!controller.signal.aborted) setError(e.message);
      });
    return () => controller.abort();
  }, [open, management]);
  if (!management?.writable) return null;
  const currentLevel = exercise.beginner
    ? 'Beginner'
    : exercise.difficulty?.level;
  async function change(action: 'move' | 'remove' | 'reset') {
    if (!management || busy) return;
    const title = exercise.playerTitle || exercise.title;
    const destination = topics.find(
      (topic) => topic.scope === destinationScope
    );
    const confirmation =
      action === 'remove'
        ? `Bỏ bài tập “${title}” khỏi chủ đề hiện tại?`
        : action === 'reset'
          ? management.scope === currentScope
            ? `Trả bài tập “${title}” về cấp độ ${management.baseLevel}?`
            : `Trả bài tập “${title}” về chủ đề ban đầu, cấp độ ${management.baseLevel}?`
          : destinationScope === currentScope
            ? `Chuyển bài tập “${title}” từ cấp độ ${currentLevel} sang cấp độ ${level}?`
            : `Chuyển bài tập “${title}” sang chủ đề “${destination?.label ?? 'đã chọn'}”, cấp độ ${level}?`;
    if (!window.confirm(confirmation)) return;
    setBusy(true);
    setError('');
    try {
      const href = await changePractice({
        id: management.id,
        scope: management.scope,
        expectedUpdatedAt: management.updatedAt,
        reference: practiceReviewReference(management.scope, exercise),
        signature: management.signature,
        action,
        level,
        destinationScope,
        note,
      });
      if (router.asPath.replace(/^\/(?:vi|en)(?=\/)/, '') === href)
        router.reload();
      else await router.replace(href);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  return (
    <div className={`${styles.saveControl} ${styles.managementControl}`}>
      <button
        ref={triggerRef}
        className={styles.managementTrigger}
        type="button"
        title="Quản lý bài tập"
        aria-label="Quản lý bài tập"
        aria-haspopup="dialog"
        aria-controls={open ? dialogId : undefined}
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <FiMoreHorizontal size={22} aria-hidden="true" />
      </button>
      {open && (
        <dialog
          ref={dialogRef}
          id={dialogId}
          className={styles.managementDialog}
          aria-labelledby={`${dialogId}-title`}
          onCancel={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setOpen(false);
          }}
          onKeyDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            if (event.target !== event.currentTarget) return;
            const bounds = event.currentTarget.getBoundingClientRect();
            if (
              event.clientX < bounds.left ||
              event.clientX > bounds.right ||
              event.clientY < bounds.top ||
              event.clientY > bounds.bottom
            )
              setOpen(false);
          }}
        >
          <header className={styles.managementHeader}>
            <h3 id={`${dialogId}-title`}>Quản lý bài tập</h3>
            <button
              type="button"
              title="Đóng"
              aria-label="Đóng quản lý bài tập"
              onClick={() => setOpen(false)}
            >
              <FiX size={20} aria-hidden="true" />
            </button>
          </header>
          <form
            className={styles.editor}
            aria-label="Quản lý bài tập"
            onSubmit={(event) => {
              event.preventDefault();
              void change('move');
            }}
          >
            <div className={`${styles.actions} ${styles.managementLevelRow}`}>
              <label className={styles.managementTopic}>
                Chủ đề đích
                <select
                  value={destinationScope}
                  disabled={busy || !topics.length}
                  onChange={(event) => setDestinationScope(event.target.value)}
                >
                  {!topics.length && (
                    <option value={currentScope}>Đang tải chủ đề…</option>
                  )}
                  {topics.map((topic) => (
                    <option key={topic.scope} value={topic.scope}>
                      {topic.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Cấp độ của bài
                <select
                  value={level}
                  disabled={busy}
                  onChange={(event) =>
                    setLevel(event.target.value as PracticeLevel)
                  }
                >
                  {practiceLevels.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                disabled={
                  busy ||
                  !topics.length ||
                  (level === currentLevel && destinationScope === currentScope)
                }
              >
                {destinationScope === currentScope
                  ? 'Chuyển cấp độ'
                  : 'Chuyển bài tập'}
              </button>
            </div>
            <label>
              Lý do điều chỉnh (tùy chọn)
              <input
                value={note}
                onChange={(event) => setNote(event.target.value)}
                maxLength={1000}
                disabled={busy}
              />
            </label>
            <div className={styles.actions}>
              <button
                type="button"
                disabled={busy}
                onClick={() => void change('remove')}
              >
                Bỏ khỏi bài tập
              </button>
              {(management.baseLevel !== currentLevel ||
                management.scope !== currentScope) && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void change('reset')}
                >
                  {management.scope !== currentScope
                    ? 'Trả về chủ đề và cấp độ ban đầu'
                    : `Trả về cấp độ ${management.baseLevel}`}
                </button>
              )}
            </div>
            {error && (
              <p role="alert">
                {error}{' '}
                <button type="button" onClick={() => router.reload()}>
                  Tải lại trang
                </button>
              </p>
            )}
            {busy && <p role="status">Đang lưu thay đổi…</p>}
          </form>
        </dialog>
      )}
    </div>
  );
}
