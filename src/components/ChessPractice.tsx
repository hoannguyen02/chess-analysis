import { usePracticeFullscreen } from '@/hooks/usePracticeFullscreen';
import { drawExerciseUrl } from '@/lib/chess/draw-exercise-url';
import {
  DrawLevel,
  drawLevelDescriptions,
  drawLevels,
  filterDrawLevel,
} from '@/lib/chess/draw-levels';
import type { DrawCategory } from '@/lib/chess/draw-practice';
import { skewerLevelDescriptions } from '@/lib/chess/skewer-levels';
import styles from '@/styles/ChessPractice.module.css';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import GamePlayerNames from './GamePlayerNames';
import { TeachingTimer } from './TeachingTimer';

const DrawTrainer = dynamic(() => import('./DrawTrainer'), {
  ssr: false,
  loading: () => <p>Đang mở bàn cờ…</p>,
});

const PAGE_SIZE = 6;

function CategoryPractice({ category }: { category: DrawCategory }) {
  const [page, setPage] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const { trainerRef, expandButtonRef, expanded, toggleExpanded } =
    usePracticeFullscreen();
  const [timerPaused, setTimerPaused] = useState(false);
  const [attempt, setAttempt] = useState(0);

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
              aria-keyshortcuts="ArrowLeft"
              title="Bài trước (←)"
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
              aria-keyshortcuts="ArrowRight"
              title="Bài tiếp (→)"
              onClick={() => {
                setActiveIndex(activeIndex + 1);
                setPage(Math.floor((activeIndex + 1) / PAGE_SIZE));
              }}
            >
              Bài tiếp →
            </button>
          </div>
          <div className={styles.sessionActions}>
            <div>
              <TeachingTimer
                minimal
                paused={timerPaused}
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
          referenceGames={category.exercises.flatMap((e) =>
            e.gameReference ? [{ reference: e.gameReference }] : []
          )}
          onPreviousExercise={
            activeIndex > 0
              ? () => {
                  setActiveIndex(activeIndex - 1);
                  setPage(Math.floor((activeIndex - 1) / PAGE_SIZE));
                }
              : undefined
          }
          onNextExercise={
            activeIndex < category.exercises.length - 1
              ? () => {
                  setActiveIndex(activeIndex + 1);
                  setPage(Math.floor((activeIndex + 1) / PAGE_SIZE));
                }
              : undefined
          }
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
            return (
              <article
                className={styles.exercise}
                key={drawExerciseUrl(exercise)}
              >
                <p className={styles.kind}>
                  {String(start + index + 1).padStart(2, '0')}
                  {exercise.difficulty && (
                    <span className={styles.levelBadge} title="Mức gợi ý">
                      {exercise.difficulty.level}
                    </span>
                  )}
                  {exercise.gameCaption && (
                    <span
                      className={styles.gameCaption}
                      title={exercise.gameCaption}
                    >
                      {exercise.gameCaption}
                    </span>
                  )}
                </p>
                <h4>
                  <GamePlayerNames
                    players={exercise.players}
                    fallback={exercise.playerTitle || exercise.title}
                  />
                </h4>
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
              </article>
            );
          })}
      </div>
    </section>
  );
}

export default function ChessPractice({
  categories,
  variant = 'draw',
}: {
  categories: DrawCategory[];
  variant?: 'draw' | 'skewer';
}) {
  const [selectedId, setSelectedId] = useState(
    () =>
      (
        categories.find(
          (item) => filterDrawLevel(item.exercises, 'A').length > 0
        ) ?? categories[0]
      ).id
  );
  const [selectedLevel, setSelectedLevel] = useState<
    DrawLevel | 'all' | 'beginner'
  >(
    variant === 'skewer' &&
      categories.some((item) =>
        item.exercises.some((exercise) => exercise.beginner)
      )
      ? 'beginner'
      : 'A'
  );
  const [beginnerKind, setBeginnerKind] = useState<'king' | 'queen'>('king');
  const category = categories.find((item) => item.id === selectedId)!;
  const filtered = {
    ...category,
    ...(selectedLevel === 'beginner'
      ? {
          title: beginnerKind === 'king' ? 'Xiên Vua' : 'Xiên Hậu',
          description:
            beginnerKind === 'king'
              ? 'Dùng Xe, Tượng hoặc Hậu chiếu Vua theo cột, hàng, đường chéo, rồi bắt quân phía sau.'
              : 'Tìm đòn xiên trên đường chéo, hàng hoặc cột. Kiểm tra quân bảo vệ và tính đủ các nước bắt lại. Ở bài cuối, hãy quyết định đòn xiên có thực sự hiệu quả không.',
        }
      : {}),
    exercises:
      selectedLevel === 'beginner'
        ? category.exercises.filter(
            (exercise) =>
              exercise.beginner &&
              (exercise.beginnerKind ?? 'king') === beginnerKind
          )
        : filterDrawLevel(category.exercises, selectedLevel),
  };
  return (
    <div className={styles.practice}>
      {variant === 'draw' && (
        <nav className={styles.categories} aria-label="Chọn kỹ năng cứu hòa">
          {categories.map((item) => (
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
      )}
      <div className={styles.filterPanel}>
        <div className={styles.filterGroup}>
          <p className={styles.filterLabel}>Mức độ</p>
          <nav className={styles.levels} aria-label="Chọn mức độ">
            {variant === 'skewer' &&
              (['king', 'queen'] as const).map((kind) => {
                const count = category.exercises.filter(
                  (exercise) =>
                    exercise.beginner &&
                    (exercise.beginnerKind ?? 'king') === kind
                ).length;
                if (!count) return null;
                return (
                  <button
                    type="button"
                    key={kind}
                    aria-pressed={
                      selectedLevel === 'beginner' && beginnerKind === kind
                    }
                    title={
                      kind === 'king'
                        ? 'Nhập môn: xiên Vua'
                        : 'Nhập môn: xiên Hậu'
                    }
                    onClick={() => {
                      setSelectedLevel('beginner');
                      setBeginnerKind(kind);
                    }}
                  >
                    {kind === 'king' ? 'Xiên Vua' : 'Xiên Hậu'}
                    <span aria-label={`${count} bài`}>{count}</span>
                  </button>
                );
              })}
            {drawLevels.map((level) => {
              const count = filterDrawLevel(category.exercises, level).length;
              return (
                <button
                  type="button"
                  key={level}
                  aria-pressed={selectedLevel === level}
                  title={
                    (variant === 'skewer'
                      ? skewerLevelDescriptions
                      : drawLevelDescriptions)[level]
                  }
                  onClick={() => setSelectedLevel(level)}
                >
                  {level} <span aria-label={`${count} bài`}>{count}</span>
                </button>
              );
            })}
            {variant === 'draw' && (
              <button
                type="button"
                aria-pressed={selectedLevel === 'all'}
                onClick={() => setSelectedLevel('all')}
              >
                Tất cả{' '}
                <span aria-label={`${category.exercises.length} bài`}>
                  {category.exercises.length}
                </span>
              </button>
            )}
          </nav>
        </div>
      </div>
      {filtered.exercises.length ? (
        <CategoryPractice
          key={`${category.id}-${selectedLevel}-${beginnerKind}`}
          category={filtered}
        />
      ) : (
        <div className={styles.emptyLevel} role="status">
          <p>Chưa có bài được xếp mức {selectedLevel} trong chủ đề này.</p>
          {variant === 'draw' && (
            <button type="button" onClick={() => setSelectedLevel('all')}>
              Xem tất cả bài của chủ đề
            </button>
          )}
        </div>
      )}
      <details className={`${styles.note} ${styles.notationLegend}`}>
        <summary>Ký hiệu lời giải</summary>
        <p>
          K = Vua, Q = Hậu, R = Xe, B = Tượng, N = Mã. Tốt không có chữ cái đứng
          đầu: e4 = Tốt đi đến e4.
        </p>
        <p>
          x = bắt quân; + = chiếu; # = chiếu hết; O-O = nhập thành cánh Vua;
          O-O-O = nhập thành cánh Hậu; =Q, =R, =B, =N = phong cấp (ví dụ: e8=Q).
          exd5 = Tốt cột e bắt quân ở d5; e.p. = bắt Tốt qua đường.
        </p>
        <p>
          Nbd2 = Mã từ cột b đến d2; R1e2 = Xe từ hàng 1 đến e2. 12. = nước thứ
          12 của Trắng; 12… = nước thứ 12 của Đen.
        </p>
        <p>
          Chú thích: ! = nước hay; !! = nước rất hay; ? = sai lầm; ?? = sai lầm
          nghiêm trọng; !? = nước đáng chú ý; ?! = nước đáng ngờ. Kết quả: 1-0 =
          Trắng thắng; 0-1 = Đen thắng; ½-½ = hòa.
        </p>
        {variant === 'draw' && (
          <a
            href="https://handbook.fide.com/chapter/E012023"
            target="_blank"
            rel="noopener noreferrer"
          >
            Luật hòa FIDE (5.2.1, 5.2.2 và 9.2) ↗
          </a>
        )}
      </details>
      {variant === 'draw' && (
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
      )}
    </div>
  );
}
