import BeginnerTacticImport from './BeginnerTacticImport';
import {
  drawThemeRoutePaths,
  beginnerPracticeExercises,
  drawPracticeChoices,
  drawPracticeLevelChoices,
  initialDrawPracticeLevel,
  type DrawThemeLink,
} from '@/lib/chess/draw-practice-view';
import { usePracticeFullscreen } from '@/hooks/usePracticeFullscreen';
import { drawExerciseUrl } from '@/lib/chess/draw-exercise-url';
import {
  practiceReviewIndex,
  practiceReviewKey,
  refreshedPracticeReviewIndex,
} from '@/lib/chess/practice-management';
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
import { removingDefenderLevelDescriptions } from '@/lib/chess/removing-defender-levels';
import { pinLevelDescriptions } from '@/lib/chess/pin-levels';
import { skewerLevelDescriptions } from '@/lib/chess/skewer-levels';
import styles from '@/styles/ChessPractice.module.css';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/router';
import GamePlayerNames from './GamePlayerNames';
import { TeachingTimer } from './TeachingTimer';
import { usePrivateContentRefresh } from './PrivateContent';
import PracticeSaveFeedback, {
  PracticeCatalogRefresh,
  usePracticeSaveNotice,
  type PracticeSaveNotice,
} from './PracticeSaveFeedback';

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
  reviewLevel,
  skewerKind,
  showHangingPieceHint,
  saveFeedback,
  onSaved,
}: {
  category: DrawCategory;
  showIntroduction?: boolean;
  reviewLevel: DrawLevel | 'all' | 'beginner';
  skewerKind?: 'king' | 'queen';
  showHangingPieceHint: boolean;
  saveFeedback: ReactNode;
  onSaved: (notice: PracticeSaveNotice) => void;
}) {
  const router = useRouter();
  const level = reviewLevel === 'beginner' ? 'Beginner' : reviewLevel;
  const sameReviewContext =
    router.query.category === category.id &&
    router.query.level === level &&
    (!skewerKind || router.query.beginnerKind === skewerKind);
  const initialIndex = practiceReviewIndex(
    category.exercises,
    router.query.exercise,
    sameReviewContext ? router.query.reviewIndex : undefined
  );
  const [selectedPage, setPage] = useState(
    Math.floor(initialIndex / PAGE_SIZE)
  );
  const [selection, setSelection] = useState(() => ({
    index: initialIndex,
    key: category.exercises[initialIndex]
      ? practiceReviewKey(category.exercises[initialIndex])
      : undefined,
  }));
  const activeIndex = refreshedPracticeReviewIndex(
    category.exercises,
    selection.key,
    selection.index
  );
  const exercise = category.exercises[activeIndex];
  const activeKey = exercise ? practiceReviewKey(exercise) : undefined;
  const pages = Math.ceil(category.exercises.length / PAGE_SIZE);
  const page = Math.min(selectedPage, Math.max(0, pages - 1));
  if (activeIndex !== selection.index || activeKey !== selection.key)
    setSelection({ index: activeIndex, key: activeKey });
  if (page !== selectedPage) setPage(page);

  function setActiveIndex(index: number) {
    setSelection({ index, key: practiceReviewKey(category.exercises[index]) });
  }
  const { trainerRef, expandButtonRef, expanded, toggleExpanded } =
    usePracticeFullscreen();
  const [timerPaused, setTimerPaused] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!exercise && expanded) void toggleExpanded();
  }, [exercise, expanded, toggleExpanded]);

  if (!exercise)
    return (
      <div className={styles.emptyLevel}>
        {saveFeedback}
        <p role="status">
          Chưa có bài ở cấp độ{' '}
          {reviewLevel === 'beginner' ? 'Nhập môn / Beginner' : reviewLevel}{' '}
          trong chủ đề này.
        </p>
        {showHangingPieceHint && (
          <p>
            Chủ đề này luyện cách bắt quân có lợi và giữ lợi thế vật chất. Các
            bài thí quân phù hợp hơn với những chủ đề phối hợp chiến thuật.
          </p>
        )}
      </div>
    );

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
                resetKey={`${activeKey}-${attempt}`}
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
        {saveFeedback}
        <DrawTrainer
          key={JSON.stringify([
            activeKey,
            exercise.fen,
            exercise.goal,
            exercise.moves,
            exercise.alternativeLines,
          ])}
          exercise={exercise}
          onPracticeSaved={onSaved}
          referenceGames={category.exercises.flatMap((e) =>
            e.gameReference ? [{ reference: e.gameReference, position: e }] : []
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

type ChessPracticeProps = {
  categories: DrawCategory[];
  variant?:
    | 'draw'
    | 'skewer'
    | 'pin'
    | 'removing-defender'
    | 'fork'
    | 'hanging-piece'
    | 'discovery'
    | 'simplification'
    | 'checkmate'
    | 'promotion'
    | 'manual';
  showLevelFilter?: boolean;
  showCategoryNavigation?: boolean;
  categoryLinks?: DrawThemeLink[];
};

export default function ChessPractice(props: ChessPracticeProps) {
  const refreshCatalog = usePrivateContentRefresh();
  return (
    <PracticeCatalogRefresh.Provider value={refreshCatalog}>
      <PracticeContent {...props} />
    </PracticeCatalogRefresh.Provider>
  );
}

function PracticeContent({
  categories,
  variant = 'draw',
  showLevelFilter = true,
  showCategoryNavigation = true,
  categoryLinks,
}: ChessPracticeProps) {
  const router = useRouter();
  const [notice, setNotice] = usePracticeSaveNotice();
  const saveFeedback = (
    <PracticeSaveFeedback
      notice={notice}
      onDismiss={() => setNotice(undefined)}
    />
  );
  const choices =
    variant === 'draw' ? drawPracticeChoices(categories) : categories;
  const [selectedId, setSelectedId] = useState(
    () =>
      (
        choices.find((item) =>
          item.exercises.some(
            (e) =>
              typeof router.query.exercise === 'string' &&
              (e.manualId === router.query.exercise ||
                e.management?.id === router.query.exercise)
          )
        ) ??
        choices.find((item) => item.id === router.query.category) ??
        choices.find((item) =>
          choices.some((c) => c.exercises.some((e) => e.beginner))
            ? item.exercises.some((e) => e.beginner)
            : filterDrawLevel(item.exercises, 'A').length > 0
        ) ??
        choices[0]
      ).id
  );
  const [selectedLevel, setSelectedLevel] = useState<
    DrawLevel | 'all' | 'beginner'
  >(
    router.query.level === 'Beginner'
      ? 'beginner'
      : drawLevels.some((l) => l === router.query.level)
        ? (router.query.level as DrawLevel)
        : !showLevelFilter
          ? 'all'
          : variant === 'draw'
            ? initialDrawPracticeLevel(categories)
            : categories.some((item) =>
                  item.exercises.some((exercise) => exercise.beginner)
                )
              ? 'beginner'
              : variant === 'removing-defender' ||
                  variant === 'manual' ||
                  (variant === 'skewer' &&
                    categories.every((item) => !item.exercises.length))
                ? 'beginner'
                : 'A'
  );
  const [beginnerKind, setBeginnerKind] = useState<'king' | 'queen'>(() => {
    const active = choices
      .flatMap((item) => item.exercises)
      .find(
        (exercise) =>
          typeof router.query.exercise === 'string' &&
          (exercise.manualId === router.query.exercise ||
            exercise.management?.id === router.query.exercise)
      );
    return active?.beginnerKind === 'queen' ||
      (!active?.beginnerKind && router.query.beginnerKind === 'queen')
      ? 'queen'
      : 'king';
  });
  const category = choices.find((item) => item.id === selectedId) ?? choices[0];
  const splitSkewers =
    variant === 'skewer' &&
    selectedLevel === 'beginner' &&
    category.exercises.some(
      (exercise) => exercise.beginner && exercise.beginnerKind
    );
  const filtered = {
    ...category,
    ...(selectedLevel === 'beginner' && (variant === 'pin' || splitSkewers)
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
                : 'Tìm đòn xiên trên đường chéo, hàng hoặc cột. Kiểm tra quân bảo vệ và tính đủ các nước bắt lại.',
        }
      : {}),
    exercises:
      selectedLevel === 'beginner'
        ? beginnerPracticeExercises(
            category,
            splitSkewers ? beginnerKind : undefined
          )
        : filterDrawLevel(category.exercises, selectedLevel),
  };
  return (
    <div className={styles.practice} data-chess-practice>
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
      {selectedLevel === 'beginner' && category.managementScope && (
        <BeginnerTacticImport
          key={category.managementScope}
          scope={category.managementScope}
          writable={Boolean(category.managementWritable)}
          exercises={beginnerPracticeExercises(category)}
          saveFeedback={saveFeedback}
          onSaved={setNotice}
        />
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
              {variant !== 'draw' && (
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
                              : variant === 'removing-defender'
                                ? removingDefenderLevelDescriptions
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
      {splitSkewers && (
        <nav className={styles.controls} aria-label="Chọn kiểu xiên">
          {(['king', 'queen'] as const).map((kind) => (
            <button
              key={kind}
              type="button"
              aria-pressed={beginnerKind === kind}
              onClick={() => setBeginnerKind(kind)}
            >
              {kind === 'king' ? 'Xiên Vua' : 'Xiên Hậu'}
            </button>
          ))}
        </nav>
      )}
      <CategoryPractice
        key={`${category.id}-${selectedLevel}-${beginnerKind}`}
        category={filtered}
        reviewLevel={selectedLevel}
        skewerKind={splitSkewers ? beginnerKind : undefined}
        showIntroduction={variant === 'draw'}
        saveFeedback={saveFeedback}
        onSaved={setNotice}
        showHangingPieceHint={
          variant === 'hanging-piece' &&
          (selectedLevel === 'C' || selectedLevel === 'D')
        }
      />
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
