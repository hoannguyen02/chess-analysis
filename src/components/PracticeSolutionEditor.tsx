import { useEffect, useRef, useState } from 'react';
import type { DrawExercise } from '@/lib/chess/draw-practice';
import type { PracticeSolution } from '@/lib/chess/practice-management';
import { formatPracticeVariation } from '@/lib/chess/practice-exploration';
import PracticeVariationRecorder from './PracticeVariationRecorder';
import styles from '@/styles/SavedGames.module.css';

/** A draft until Save; the nested recorder's OK only updates this draft. */
export default function PracticeSolutionEditor({
  exercise,
  onSave,
  onCancel,
}: {
  exercise: DrawExercise;
  onSave: (solution: PracticeSolution | null) => Promise<void>;
  onCancel: () => void;
}) {
  const [lines, setLines] = useState(
    [exercise.moves, ...(exercise.alternativeLines ?? [])]
      .filter((line) => line.length > 0)
      .map((line) => [...line])
  );
  const [solution, setSolution] = useState(exercise.solution);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const recordButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    recordButton.current?.focus({ preventScroll: true });
  }, []);
  async function save(reset = false) {
    if (busy || recording) return;
    if (
      reset &&
      !window.confirm(
        'Khôi phục lời giải và các phương án ban đầu của bài tập?'
      )
    )
      return;
    setBusy(true);
    setError('');
    try {
      await onSave(
        reset
          ? null
          : {
              moves: lines[0],
              alternativeLines: lines.slice(1),
              solution,
            }
      );
    } catch (error) {
      setError((error as Error).message);
      setBusy(false);
    }
  }
  return (
    <form
      className={styles.editor}
      aria-label="Chỉnh sửa lời giải"
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <p>
        Đi cho cả hai bên trên bàn cờ. Quay lại một nước rồi đi khác để thêm
        phương án; phương án cũ vẫn được giữ.
      </p>
      <button
        ref={recordButton}
        type="button"
        disabled={busy}
        onClick={() => setRecording(true)}
      >
        Mở bàn cờ để sửa phương án
      </button>
      <ol className={styles.variationPreview} aria-label="Phương án lời giải">
        {lines.map((line, index) => (
          <li key={index}>
            <strong>
              {index === 0 ? 'Phương án chính' : `Phương án ${index + 1}`}
            </strong>
            <p>{formatPracticeVariation(exercise.fen, line)}</p>
          </li>
        ))}
      </ol>
      <label>
        Giải thích phương án (tùy chọn)
        <textarea
          value={solution}
          maxLength={4000}
          disabled={busy}
          onChange={(event) => setSolution(event.target.value)}
        />
      </label>
      <div className={styles.actions}>
        <button type="submit" disabled={busy || !lines.length}>
          {busy ? 'Đang lưu…' : 'Lưu lời giải'}
        </button>
        <button type="button" disabled={busy} onClick={onCancel}>
          Hủy
        </button>
        {exercise.management?.solutionEdited && (
          <button type="button" disabled={busy} onClick={() => void save(true)}>
            Khôi phục lời giải ban đầu
          </button>
        )}
      </div>
      {error && <p role="alert">{error}</p>}
      {recording && (
        <PracticeVariationRecorder
          fen={exercise.fen}
          lines={lines}
          onClose={() => setRecording(false)}
          onConfirm={(recorded) => {
            setLines(recorded);
            setRecording(false);
            setError('');
          }}
        />
      )}
    </form>
  );
}
