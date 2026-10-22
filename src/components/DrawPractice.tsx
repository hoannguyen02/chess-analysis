import {
  DrawLevel,
  drawLevelDescriptions,
  drawLevels,
  filterDrawLevel,
} from '@/lib/chess/draw-levels';
import type { DrawCategory } from '@/lib/chess/draw-practice';
import { drawExerciseUrl } from '@/lib/chess/draw-exercise-url';
import styles from '@/styles/DrawPractice.module.css';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { TeachingTimer } from './TeachingTimer';

const DrawTrainer = dynamic(() => import('./DrawTrainer'), {
  ssr: false,
  loading: () => <p>Đang mở bàn cờ…</p>,
});

const PAGE_SIZE = 6;

function CategoryPractice({ category }: { category: DrawCategory }) {
  const [page, setPage] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const trainerRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [timerVisible, setTimerVisible] = useState(false);
  const [timerPaused, setTimerPaused] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const expandButtonRef = useRef<HTMLButtonElement>(null);

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
      expandButton?.focus();
    };
  }, [expanded]);

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

  const pages = Math.ceil(category.exercises.length / PAGE_SIZE);
  const start = page * PAGE_SIZE;
  return (
    <section
      className={styles.category}
      aria-labelledby={`draw-heading-${category.id}`}
    >
      <h3 id={`draw-heading-${category.id}`}>{category.title}</h3>
      <p>{category.description}</p>
      <div
        ref={trainerRef}
        className={`${styles.trainerAnchor} ${expanded ? styles.expanded : ''}`}
        role={expanded ? 'dialog' : undefined}
        aria-modal={expanded ? true : undefined}
        aria-label={expanded ? `Luyện tập: ${category.title}` : undefined}
      >
        <div className={styles.toolbar}>
          <div className={styles.controls}>
            <button
              type="button"
              disabled={activeIndex === 0}
              onClick={() => {
                setActiveIndex(activeIndex - 1);
                setPage(Math.floor((activeIndex - 1) / PAGE_SIZE));
              }}
            >
              ← Bài trước
            </button>
            <span>
              Bài {activeIndex + 1}/{category.exercises.length}
            </span>
            <button
              type="button"
              disabled={activeIndex === category.exercises.length - 1}
              onClick={() => {
                setActiveIndex(activeIndex + 1);
                setPage(Math.floor((activeIndex + 1) / PAGE_SIZE));
              }}
            >
              Bài tiếp →
            </button>
          </div>
          <div className={styles.sessionActions}>
            <button
              type="button"
              aria-pressed={timerVisible}
              onClick={() => setTimerVisible(!timerVisible)}
            >
              Đồng hồ
            </button>
            <div hidden={!timerVisible}>
              <TeachingTimer
                minimal
                paused={timerPaused || !timerVisible}
                resetKey={`${activeIndex}-${attempt}`}
              />
            </div>
            <button
              type="button"
              ref={expandButtonRef}
              aria-pressed={expanded}
              onClick={() => void toggleExpanded()}
            >
              {expanded ? 'Thu nhỏ' : 'Toàn màn hình'}
            </button>
          </div>
        </div>
        <DrawTrainer
          key={drawExerciseUrl(category.exercises[activeIndex])}
          exercise={category.exercises[activeIndex]}
          onTimerPause={setTimerPaused}
          onRestart={() => setAttempt((value) => value + 1)}
        />
      </div>
      <h4 className={styles.libraryTitle}>Chọn bài khác</h4>
      <div className={styles.pagination}>
        <p aria-live="polite">
          Bài {start + 1}–
          {Math.min(start + PAGE_SIZE, category.exercises.length)} /{' '}
          {category.exercises.length}
          {' · '}Trang {page + 1}/{pages}
        </p>
        {pages > 1 && (
          <div>
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              ← Trang trước
            </button>
            <button
              type="button"
              disabled={page === pages - 1}
              onClick={() => setPage(page + 1)}
            >
              Trang sau →
            </button>
          </div>
        )}
      </div>
      <div className={styles.exercises}>
        {category.exercises
          .slice(start, start + PAGE_SIZE)
          .map((exercise, index) => {
            const mode =
              exercise.mode ??
              (exercise.url
                ? exercise.outcome === 'fortress'
                  ? 'study'
                  : 'interactive'
                : 'analysis');
            const label = {
              interactive: 'Tự giải theo nhánh mẫu',
              study: 'Có nhánh mẫu để luyện',
              analysis: 'Bài mẫu LIMA',
              recognition: 'Bài nhận biết thế cờ',
            }[mode];
            return (
              <article
                className={styles.exercise}
                key={drawExerciseUrl(exercise)}
              >
                <p className={styles.kind}>
                  {String(start + index + 1).padStart(2, '0')} · {label}
                  {exercise.difficulty && (
                    <span className={styles.levelBadge} title="Mức gợi ý">
                      {exercise.difficulty.level}
                    </span>
                  )}
                </p>
                <h4>{exercise.title}</h4>
                <p>{exercise.prompt}</p>
                <button
                  type="button"
                  className={styles.open}
                  aria-pressed={activeIndex === start + index}
                  onClick={() => {
                    setActiveIndex(start + index);
                    trainerRef.current?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'start',
                    });
                  }}
                >
                  {activeIndex === start + index
                    ? 'Đang luyện bài này'
                    : 'Luyện trên bàn cờ LIMA'}
                </button>
                <details className={styles.solution}>
                  <summary>Xem lời giải</summary>
                  <p>{exercise.solution}</p>
                </details>
              </article>
            );
          })}
      </div>
    </section>
  );
}

export default function DrawPractice({
  categories: drawCategories,
}: {
  categories: DrawCategory[];
}) {
  const [selectedId, setSelectedId] = useState(
    () =>
      (
        drawCategories.find(
          (item) => filterDrawLevel(item.exercises, 'A').length > 0
        ) ?? drawCategories[0]
      ).id
  );
  const [selectedLevel, setSelectedLevel] = useState<DrawLevel | 'all'>('A');
  const category = drawCategories.find((item) => item.id === selectedId)!;
  const filtered = {
    ...category,
    exercises: filterDrawLevel(category.exercises, selectedLevel),
  };
  return (
    <div className={styles.practice}>
      <nav className={styles.categories} aria-label="Chọn kỹ năng cứu hòa">
        {drawCategories.map((item) => (
          <button
            type="button"
            key={item.id}
            aria-pressed={selectedId === item.id}
            onClick={() => setSelectedId(item.id)}
          >
            {item.title} <span>· {item.exercises.length} bài</span>
          </button>
        ))}
      </nav>
      <nav className={styles.levels} aria-label="Chọn mức độ">
        {drawLevels.map((level) => {
          const count = filterDrawLevel(category.exercises, level).length;
          return (
            <button
              type="button"
              key={level}
              aria-pressed={selectedLevel === level}
              title={drawLevelDescriptions[level]}
              onClick={() => setSelectedLevel(level)}
            >
              {level} <span>· {count}</span>
            </button>
          );
        })}
        <button
          type="button"
          aria-pressed={selectedLevel === 'all'}
          onClick={() => setSelectedLevel('all')}
        >
          Tất cả <span>· {category.exercises.length}</span>
        </button>
      </nav>
      {filtered.exercises.length ? (
        <CategoryPractice
          key={`${category.id}-${selectedLevel}`}
          category={filtered}
        />
      ) : (
        <div className={styles.emptyLevel} role="status">
          <p>Chưa có bài được xếp mức {selectedLevel} trong chủ đề này.</p>
          <button type="button" onClick={() => setSelectedLevel('all')}>
            Xem tất cả bài của chủ đề
          </button>
        </div>
      )}
      <p className={styles.note}>
        Ký hiệu lời giải: K = Vua, Q = Hậu, R = Xe, B = Tượng, N = Mã; x = bắt
        quân, + = chiếu, # = chiếu hết.{' '}
        <a
          href="https://handbook.fide.com/chapter/E012023"
          target="_blank"
          rel="noopener noreferrer"
        >
          Luật hòa FIDE (5.2.1, 5.2.2 và 9.2) ↗
        </a>
      </p>
      <p className={styles.mixed}>
        Muốn luyện tổng hợp?{' '}
        <a
          href="https://lichess.org/training/equality"
          target="_blank"
          rel="noopener noreferrer"
        >
          Equality trên Lichess ↗
        </a>{' '}
        trộn các cách cứu hòa và tìm lại thế cân bằng, không lọc riêng từng kỹ
        năng.
      </p>
    </div>
  );
}
