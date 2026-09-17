import { useLearnerText } from './LearnerLanguage';
import { PointerEvent, useRef, useState } from 'react';
import s from './EnglishStudio.module.css';

type Word = { word: string; key: number };
type Drag = {
  id: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
  active: boolean;
  slot: number | null;
};

export default function SentenceBuilder({
  words,
  picked,
  disabled,
  onChange,
}: {
  words: Word[];
  picked: number[];
  disabled: boolean;
  onChange: (next: number[]) => void;
}) {
  const t = useLearnerText();
  const sentence = useRef<HTMLDivElement>(null);
  const currentDrag = useRef<Drag | null>(null);
  const ignoreClick = useRef(false);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const commit = (next: number[]) => {
    onChange(next);
    setAnnouncement(
      next.length
        ? `Your sentence: ${next.map((id) => words[id].word).join(' ')}`
        : 'Your sentence is empty.'
    );
  };
  const findSlot = (x: number, y: number, id: number) => {
    const box = sentence.current;
    if (!box) return null;
    const rect = box.getBoundingClientRect();
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom)
      return null;
    const buttons = Array.from(
      box.querySelectorAll<HTMLButtonElement>('[data-word-id]')
    ).filter((button) => Number(button.dataset.wordId) !== id);
    const slot = buttons.findIndex((button) => {
      const bounds = button.getBoundingClientRect();
      return (
        y <= bounds.bottom &&
        (y < bounds.top || x < bounds.left + bounds.width / 2)
      );
    });
    return slot === -1 ? buttons.length : slot;
  };
  const pointerDown = (event: PointerEvent<HTMLButtonElement>, id: number) => {
    if (disabled || event.button !== 0 || currentDrag.current) return;
    ignoreClick.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
    currentDrag.current = {
      id,
      startX: event.clientX,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY,
      active: false,
      slot: null,
    };
  };
  const pointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const current = currentDrag.current;
    if (!current || !event.currentTarget.hasPointerCapture(event.pointerId))
      return;
    if (
      !current.active &&
      Math.hypot(
        event.clientX - current.startX,
        event.clientY - current.startY
      ) < 6
    )
      return;
    event.preventDefault();
    const next = {
      ...current,
      active: true,
      x: event.clientX,
      y: event.clientY,
      slot: findSlot(event.clientX, event.clientY, current.id),
    };
    currentDrag.current = next;
    setDrag(next);
  };
  const pointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    const current = currentDrag.current;
    if (!current || !event.currentTarget.hasPointerCapture(event.pointerId))
      return;
    if (current.active && !disabled) {
      ignoreClick.current = true;
      const slot = findSlot(event.clientX, event.clientY, current.id);
      const next = picked.filter((id) => id !== current.id);
      if (slot !== null) next.splice(slot, 0, current.id);
      // A selected word dropped outside the sentence returns to the bank.
      if (slot !== null || picked.includes(current.id)) commit(next);
    }
    currentDrag.current = null;
    setDrag(null);
    event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const cancel = () => {
    if (currentDrag.current?.active) ignoreClick.current = true;
    currentDrag.current = null;
    setDrag(null);
  };
  const button = (id: number, selected: boolean, marker = false) => (
    <button
      type="button"
      key={id}
      disabled={disabled || (!selected && picked.includes(id))}
      data-word-id={selected ? id : undefined}
      aria-label={selected ? `Remove ${words[id].word}` : undefined}
      title={
        selected
          ? 'Drag to reorder or move out. Alt + Left/Right also reorders.'
          : 'Drag into the sentence or click to add.'
      }
      className={`${s.wordTile} ${drag?.active && drag.id === id ? s.draggedWord : ''} ${marker ? s.insertionBefore : ''}`}
      onPointerDown={(event) => pointerDown(event, id)}
      onPointerMove={pointerMove}
      onPointerUp={pointerUp}
      onPointerCancel={cancel}
      onLostPointerCapture={cancel}
      onDragStart={(event) => event.preventDefault()}
      onClick={() => {
        if (ignoreClick.current) {
          ignoreClick.current = false;
          return;
        }
        commit(
          selected ? picked.filter((value) => value !== id) : [...picked, id]
        );
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          cancel();
          return;
        }
        if (
          !selected ||
          !event.altKey ||
          !['ArrowLeft', 'ArrowRight'].includes(event.key)
        )
          return;
        event.preventDefault();
        const index = picked.indexOf(id);
        const nextIndex = Math.max(
          0,
          Math.min(
            picked.length - 1,
            index + (event.key === 'ArrowLeft' ? -1 : 1)
          )
        );
        const next = picked.filter((value) => value !== id);
        next.splice(nextIndex, 0, id);
        commit(next);
      }}
    >
      {words[id].word}
    </button>
  );
  const remaining = picked.filter((id) => id !== drag?.id);
  const before =
    drag?.slot !== null && drag?.slot !== undefined
      ? remaining[drag.slot]
      : undefined;
  return (
    <>
      <p className={s.muted}>
        {t(
          'Drag or tap words into the sentence. Drag to reorder, or drag out to return a word.'
        )}
      </p>
      <div
        ref={sentence}
        className={`${s.chips} ${s.sentence} ${drag?.active && drag.slot !== null ? s.dropActive : ''}`}
        aria-label={t('Your sentence')}
      >
        {!picked.length && (
          <span className={s.muted}>{t('Drop words here…')}</span>
        )}
        {picked.map((id) => button(id, true, drag?.active && before === id))}
        {drag?.active && drag.slot !== null && before === undefined && (
          <span aria-hidden="true" className={s.insertionEnd} />
        )}
      </div>
      <div
        className={`${s.chips} ${s.wordBank} ${drag?.active && drag.slot === null && picked.includes(drag.id) ? s.dropActive : ''}`}
        aria-label={t('Word bank')}
      >
        {words.map((_, id) => button(id, false))}
      </div>
      <span className="sr-only" role="status">
        {announcement}
      </span>
      {drag?.active && (
        <div
          aria-hidden="true"
          className={s.dragGhost}
          style={{ left: drag.x + 12, top: drag.y + 12 }}
        >
          {words[drag.id].word}
        </div>
      )}
    </>
  );
}
