import {
  drawThemeRoutePaths,
  drawPracticeChoices,
  drawPracticeLevelChoices,
  initialDrawPracticeLevel,
  type DrawThemeLink,
} from '@/lib/chess/draw-practice-view';
import { usePracticeFullscreen } from '@/hooks/usePracticeFullscreen';
import { drawExerciseUrl } from '@/lib/chess/draw-exercise-url';
import {
  DrawLevel,
  drawLevelDescriptions,
  drawLevels,
  filterDrawLevel,
} from '@/lib/chess/draw-levels';
import type { DrawCategory } from '@/lib/chess/draw-practice';
import { simplificationLevelDescriptions } from '@/lib/chess/simplification-levels';
import { discoveryLevelDescriptions } from '@/lib/chess/discovery-levels';
import { forkLevelDescriptions } from '@/lib/chess/fork-levels';
import { pinLevelDescriptions } from '@/lib/chess/pin-levels';
import { skewerLevelDescriptions } from '@/lib/chess/skewer-levels';
import styles from '@/styles/ChessPractice.module.css';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState } from 'react';
import GamePlayerNames from './GamePlayerNames';
import { TeachingTimer } from './TeachingTimer';

const DrawTrainer = dynamic(() => import('./DrawTrainer'), {
  ssr: false,
  loading: () => <p>Đang mở bàn cờ…</p>,
});

const PAGE_SIZE = 6;

function CategoryIntroduction({ category }: { category: DrawCategory }) {
  return (
    <>
      <h3 id={`draw-heading-${category.id}`}>{category.title}</h3>
      <p>{category.description}</p>
    </>
  );
}

function CategoryPractice({
  category,
  showIntroduction = true,
}: {
  category: DrawCategory;
  showIntroduction?: boolean;
}) {
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
      {showIntroduction && <CategoryIntroduction category={category} />}
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
            <select
              className={styles.exercisePicker}
              aria-label="Chọn bài tập"
              title="Chuyển nhanh đến bài bất kỳ"
              value={activeIndex}
              onChange={(event) => {
                const index = Number(event.target.value);
                setActiveIndex(index);
                setPage(Math.floor(index / PAGE_SIZE));
              }}
            >
              {category.exercises.map((exercise, index) => (
                <option key={drawExerciseUrl(exercise)} value={index}>
                  Bài {index + 1}/{category.exercises.length}
                </option>
              ))}
            </select>
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
                    <span className={styles.levelBadge} title="Cấp độ bài tập">
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
                    : 'Luyện bài này'}
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
  showLevelFilter = true,
  showCategoryNavigation = true,
  categoryLinks,
}: {
  categories: DrawCategory[];
  variant?:
    | 'draw'
    | 'skewer'
    | 'pin'
    | 'fork'
    | 'discovery'
    | 'simplification'
    | 'checkmate'
    | 'promotion';
  showLevelFilter?: boolean;
  showCategoryNavigation?: boolean;
  categoryLinks?: DrawThemeLink[];
}) {
  const choices =
    variant === 'draw' ? drawPracticeChoices(categories) : categories;
  const [selectedId, setSelectedId] = useState(
    () =>
      (
        choices.find((item) =>
          choices.some((c) => c.exercises.some((e) => e.beginner))
            ? item.exercises.some((e) => e.beginner)
            : filterDrawLevel(item.exercises, 'A').length > 0
        ) ?? choices[0]
      ).id
  );
  const [selectedLevel, setSelectedLevel] = useState<
    DrawLevel | 'all' | 'beginner'
  >(
    !showLevelFilter
      ? 'all'
      : variant === 'draw'
        ? initialDrawPracticeLevel(categories)
        : categories.some((item) =>
              item.exercises.some((exercise) => exercise.beginner)
            )
          ? 'beginner'
          : 'A'
  );
  const [beginnerKind, setBeginnerKind] = useState<'king' | 'queen'>('king');
  const category = choices.find((item) => item.id === selectedId) ?? choices[0];
  const filtered = {
    ...category,
    ...(selectedLevel === 'beginner' &&
    (variant === 'pin' || variant === 'skewer')
      ? {
          title:
            variant === 'pin'
              ? 'Nhập môn · Đòn ghim'
              : beginnerKind === 'king'
                ? 'Xiên Vua'
                : 'Xiên Hậu',
          description:
            variant === 'pin'
              ? 'Khai thác quân bị ghim để giành lợi thế vật chất. Ghim vào Vua hạn chế các nước đi làm lộ chiếu; ghim vào Hậu hoặc Xe cần tính cả nước bắt lại và phản công.'
              : beginnerKind === 'king'
                ? 'Dùng Xe, Tượng hoặc Hậu chiếu Vua theo cột, hàng, đường chéo, rồi bắt quân phía sau.'
                : 'Tìm đòn xiên trên đường chéo, hàng hoặc cột. Kiểm tra quân bảo vệ và tính đủ các nước bắt lại. Ở bài cuối, hãy quyết định đòn xiên có thực sự hiệu quả không.',
        }
      : {}),
    exercises:
      selectedLevel === 'beginner'
        ? category.exercises.filter(
            (exercise) =>
              exercise.beginner &&
              (variant === 'draw' ||
                variant === 'checkmate' ||
                variant === 'promotion' ||
                variant === 'pin' ||
                (exercise.beginnerKind ?? 'king') === beginnerKind)
          )
        : filterDrawLevel(category.exercises, selectedLevel),
  };
  return (
    <div className={styles.practice}>
      {(variant === 'draw' ||
        variant === 'discovery' ||
        (variant === 'checkmate' && categories.length > 1)) &&
        showCategoryNavigation && (
          <nav
            className={styles.categories}
            aria-label={
              variant === 'discovery'
                ? 'Chọn chủ đề đòn mở'
                : variant === 'checkmate'
                  ? 'Chọn bài học chiếu hết'
                  : 'Chọn kỹ năng cứu hòa'
            }
          >
            {categoryLinks
              ? categoryLinks.map((link) => (
                  <Link
                    key={link.id}
                    href={link.href}
                    aria-current={link.id === category.id ? 'page' : undefined}
                  >
                    {link.label} <span>· {link.count} bài</span>
                  </Link>
                ))
              : choices.map((item) => {
                  const href =
                    variant === 'draw'
                      ? drawThemeRoutePaths[item.id]
                      : undefined;
                  const label = item.shortLabel ?? item.title;
                  return href ? (
                    <Link key={item.id} href={href}>
                      {label} <span>· {item.exercises.length} bài</span>
                    </Link>
                  ) : (
                    <button
                      type="button"
                      key={item.id}
                      aria-pressed={selectedId === item.id}
                      onClick={() => setSelectedId(item.id)}
                    >
                      {label} <span>· {item.exercises.length} bài</span>
                    </button>
                  );
                })}
          </nav>
        )}
      {variant !== 'draw' && (
        <div className={styles.categoryIntroduction}>
          <CategoryIntroduction category={filtered} />
        </div>
      )}
      {showLevelFilter && (
        <div className={styles.filterPanel}>
          <div className={styles.filterGroup}>
            <p className={styles.filterLabel}>Cấp độ</p>
            <nav className={styles.levels} aria-label="Chọn cấp độ">
              {variant === 'draw' &&
                drawPracticeLevelChoices(category).map((choice) => (
                  <button
                    type="button"
                    key={choice.id}
                    aria-pressed={selectedLevel === choice.id}
                    title={
                      choice.id === 'beginner'
                        ? 'Nhập môn: dành cho người mới biết cách đi và bắt quân'
                        : drawLevelDescriptions[choice.id]
                    }
                    onClick={() => setSelectedLevel(choice.id)}
                  >
                    {choice.label}{' '}
                    <span aria-label={`${choice.count} bài`}>
                      {choice.count}
                    </span>
                  </button>
                ))}
              {(variant === 'checkmate' ||
                variant === 'promotion' ||
                variant === 'pin' ||
                variant === 'discovery') && (
                <button
                  type="button"
                  aria-pressed={selectedLevel === 'beginner'}
                  title="Nhập môn: dành cho người mới biết cách đi và bắt quân"
                  onClick={() => setSelectedLevel('beginner')}
                >
                  Nhập môn / Beginner{' '}
                  <span
                    aria-label={`${category.exercises.filter((e) => e.beginner).length} bài`}
                  >
                    {category.exercises.filter((e) => e.beginner).length}
                  </span>
                </button>
              )}
              {variant !== 'draw' &&
                variant !== 'checkmate' &&
                variant !== 'promotion' &&
                variant !== 'pin' &&
                variant !== 'discovery' &&
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
                        variant !== 'skewer'
                          ? 'Nhập môn / Beginner'
                          : kind === 'king'
                            ? 'Nhập môn: xiên Vua'
                            : 'Nhập môn: xiên Hậu'
                      }
                      onClick={() => {
                        setSelectedLevel('beginner');
                        setBeginnerKind(kind);
                      }}
                    >
                      {variant !== 'skewer'
                        ? 'Nhập môn / Beginner'
                        : kind === 'king'
                          ? 'Nhập môn · Xiên Vua'
                          : 'Nhập môn · Xiên Hậu'}
                      <span aria-label={`${count} bài`}>{count}</span>
                    </button>
                  );
                })}
              {variant !== 'draw' &&
                drawLevels.map((level) => {
                  const count = filterDrawLevel(
                    category.exercises,
                    level
                  ).length;
                  return (
                    <button
                      type="button"
                      key={level}
                      aria-pressed={selectedLevel === level}
                      title={
                        (variant === 'simplification'
                          ? simplificationLevelDescriptions
                          : variant === 'discovery'
                            ? discoveryLevelDescriptions
                            : variant === 'fork'
                              ? forkLevelDescriptions
                              : variant === 'pin'
                                ? pinLevelDescriptions
                                : variant === 'skewer'
                                  ? skewerLevelDescriptions
                                  : drawLevelDescriptions)[level]
                      }
                      onClick={() => setSelectedLevel(level)}
                    >
                      Cấp độ {level}{' '}
                      <span aria-label={`${count} bài`}>{count}</span>
                    </button>
                  );
                })}
            </nav>
          </div>
        </div>
      )}
      {filtered.exercises.length ? (
        <CategoryPractice
          key={`${category.id}-${selectedLevel}-${beginnerKind}`}
          category={filtered}
          showIntroduction={variant === 'draw'}
        />
      ) : (
        <div className={styles.emptyLevel} role="status">
          <p>
            Chưa có bài ở cấp độ{' '}
            {selectedLevel === 'beginner'
              ? 'Nhập môn / Beginner'
              : selectedLevel}{' '}
            trong chủ đề này.
          </p>
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
