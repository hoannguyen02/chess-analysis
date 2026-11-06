import { useEffect, useRef } from 'react';
import PracticeExploration from './PracticeExploration';
import styles from '@/styles/SavedGames.module.css';

/** Native nested dialog keeps recording transactional: only OK changes the form. */
export default function PracticeVariationRecorder({
  fen,
  lines,
  onConfirm,
  onClose,
}: {
  fen: string;
  lines: string[][];
  onConfirm: (lines: string[][]) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
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
      className={styles.variationDialog}
      aria-labelledby="variation-recorder-title"
      onCancel={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <header className={styles.variationHeader}>
        <h3 id="variation-recorder-title">Ghi phương án trên bàn cờ</h3>
        <button type="button" aria-label="Hủy ghi phương án" onClick={onClose}>
          ✕
        </button>
      </header>
      <PracticeExploration
        fen={fen}
        moves={lines[0] ?? []}
        initialLines={lines}
        initialPly={0}
        orientation={fen.split(' ')[1] === 'w' ? 'white' : 'black'}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    </dialog>
  );
}
