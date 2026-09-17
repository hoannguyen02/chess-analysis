import { useLearnerText } from './LearnerLanguage';
import { ReactNode, useEffect, useId, useRef, useState } from 'react';
import s from './EnglishStudio.module.css';

export default function LessonActions({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const t = useLearnerText();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target))
        setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);
  return (
    <div
      className={s.lessonMore}
      ref={root}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        ref={trigger}
        className={s.moreTrigger}
        aria-label={`More actions for ${title}`}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
      >
        <span aria-hidden="true">•••</span>
        <span>{t('More')}</span>
      </button>
      {open && (
        <div
          id={id}
          className={s.lessonActionPanel}
          aria-label={`Actions for ${title}`}
          onClick={(event) => {
            if ((event.target as HTMLElement).closest('button')) {
              setOpen(false);
              trigger.current?.focus();
            }
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
