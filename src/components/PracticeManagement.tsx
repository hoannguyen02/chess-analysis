import { useContext, useEffect, useId, useRef, useState } from 'react';
import type { DrawExercise } from '@/lib/chess/draw-practice';
import { practiceLevels, type PracticeLevel } from '@/lib/chess/draw-levels';
import {
  practiceReviewReference,
  type PracticeSolution,
} from '@/lib/chess/practice-management';
import { practiceAccessHeaders } from '@/lib/practice-access';
import styles from '@/styles/SavedGames.module.css';
import { FiMoreHorizontal, FiX } from 'react-icons/fi';
import PracticeSolutionEditor from './PracticeSolutionEditor';
import PracticeTopicSelect from './PracticeTopicSelect';
import {
  PracticeCatalogRefresh,
  type PracticeSaveNotice,
} from './PracticeSaveFeedback';

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
  onEditPosition,
  onSaved,
}: {
  exercise: DrawExercise;
  onEditPosition?: () => void;
  onSaved: (notice: PracticeSaveNotice) => void;
}) {
  const refreshCatalog = useContext(PracticeCatalogRefresh);
  const [open, setOpen] = useState(false);
  const [editingSolution, setEditingSolution] = useState(false);
  const [level, setLevel] = useState<PracticeLevel>(
    exercise.beginner ? 'Beginner' : (exercise.difficulty?.level ?? 'A')
  );
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const management = exercise.management;
  const currentScope = management?.currentScope ?? management?.scope ?? '';
  const currentLevel = exercise.beginner
    ? 'Beginner'
    : exercise.difficulty?.level;
  const [destinationScope, setDestinationScope] = useState(currentScope);
  const [topics, setTopics] = useState<{ scope: string; label: string }[]>([]);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const editSolutionRef = useRef<HTMLButtonElement>(null);
  const dialogId = useId();
  useEffect(() => {
    setLevel(currentLevel ?? 'A');
    setDestinationScope(currentScope);
  }, [currentLevel, currentScope]);
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
    if (open && !editingSolution)
      editSolutionRef.current?.focus({ preventScroll: true });
  }, [open, editingSolution]);
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
  function finish(notice: PracticeSaveNotice) {
    setOpen(false);
    onSaved(notice);
    refreshCatalog();
  }
  async function saveSolution(solution: PracticeSolution | null) {
    if (!management) return;
    const href = await changePractice({
      id: management.id,
      scope: management.scope,
      expectedUpdatedAt: management.updatedAt,
      reference: practiceReviewReference(management.scope, exercise),
      signature: management.signature,
      action: solution ? 'solution' : 'reset-solution',
      solution,
      note: '',
    });
    finish({
      message: solution ? 'Đã lưu lời giải.' : 'Đã khôi phục lời giải ban đầu.',
      href,
    });
  }
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
      finish(
        action === 'remove'
          ? { message: 'Đã bỏ bài khỏi danh sách luyện tập.' }
          : {
              message:
                action === 'reset'
                  ? 'Đã trả bài về chủ đề và cấp độ ban đầu.'
                  : destinationScope === currentScope
                    ? `Đã chuyển bài sang cấp độ ${level}.`
                    : `Đã chuyển bài sang “${destination?.label ?? 'Chủ đề đích'}”, cấp độ ${level}.`,
              href,
            }
      );
      setNote('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
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
        onClick={() => {
          setEditingSolution(false);
          setOpen(true);
        }}
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
            <h3 id={`${dialogId}-title`}>
              {editingSolution ? 'Chỉnh sửa lời giải' : 'Quản lý bài tập'}
            </h3>
            <button
              type="button"
              title="Đóng"
              aria-label="Đóng quản lý bài tập"
              onClick={() => setOpen(false)}
            >
              <FiX size={20} aria-hidden="true" />
            </button>
          </header>
          {editingSolution ? (
            <PracticeSolutionEditor
              exercise={exercise}
              onSave={saveSolution}
              onCancel={() => setEditingSolution(false)}
            />
          ) : (
            <>
              {!exercise.decision &&
                (exercise.moves.length > 0 || onEditPosition) && (
                  <div className={styles.actions}>
                    <button
                      ref={editSolutionRef}
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        if (onEditPosition) {
                          setOpen(false);
                          onEditPosition();
                        } else setEditingSolution(true);
                      }}
                    >
                      Chỉnh sửa lời giải / phương án
                    </button>
                  </div>
                )}
              <form
                className={styles.editor}
                aria-label="Quản lý bài tập"
                onSubmit={(event) => {
                  event.preventDefault();
                  void change('move');
                }}
              >
                <div
                  className={`${styles.actions} ${styles.managementLevelRow}`}
                >
                  <PracticeTopicSelect
                    label="Chủ đề đích"
                    className={styles.managementTopic}
                    value={destinationScope}
                    options={topics.map(({ scope, label }) => ({
                      value: scope,
                      label,
                      scope,
                    }))}
                    disabled={busy || !topics.length}
                    placeholder={topics.length ? undefined : 'Đang tải chủ đề…'}
                    onChange={setDestinationScope}
                  />
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
                      (level === currentLevel &&
                        destinationScope === currentScope)
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
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        refreshCatalog();
                      }}
                    >
                      Tải lại danh sách
                    </button>
                  </p>
                )}
                {busy && <p role="status">Đang lưu thay đổi…</p>}
              </form>
            </>
          )}
        </dialog>
      )}
    </div>
  );
}
