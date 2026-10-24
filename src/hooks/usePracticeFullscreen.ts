import { useEffect, useRef, useState } from 'react';

/** Shared fullscreen, focus containment and Escape behavior for practice sessions. */
export function usePracticeFullscreen(initialExpanded = false) {
  const trainerRef = useRef<HTMLDivElement>(null);
  const expandButtonRef = useRef<HTMLButtonElement>(null);
  const [expanded, setExpanded] = useState(initialExpanded);
  useEffect(() => {
    const sync = () => {
      if (!document.fullscreenElement) setExpanded(false);
    };
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  useEffect(() => {
    if (!expanded) return;
    const expandButton = expandButtonRef.current;
    const trigger = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (trainerRef.current?.querySelector('dialog[open]')) return;
      if (event.key === 'Escape') {
        setExpanded(false);
        if (document.fullscreenElement === trainerRef.current) {
          void document.exitFullscreen().catch(() => {});
        }
      }
      if (event.key === 'Tab') {
        const elements = trainerRef.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input, select, a[href], [tabindex="0"]'
        );
        const focusable = Array.from(elements ?? []).filter(
          (el) => el.getClientRects().length
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    expandButton?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKey);
      (initialExpanded ? trigger : expandButton)?.focus();
    };
  }, [expanded, initialExpanded]);

  async function toggleExpanded() {
    if (expanded) {
      if (document.fullscreenElement === trainerRef.current) {
        await document.exitFullscreen().catch(() => {});
      }
      setExpanded(false);
      return;
    }
    setExpanded(true);
    // Keep the expanded layout when native fullscreen is unavailable.
    await trainerRef.current?.requestFullscreen?.().catch(() => {});
  }

  return { trainerRef, expandButtonRef, expanded, toggleExpanded };
}
