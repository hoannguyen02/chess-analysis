import {
  checkAnswer,
  learnerCopy,
  MathBlock,
  MathExercise,
  MathLessonData,
  MathSection,
  SECTION_LABELS,
} from '@/lib/math/lessons';
import { semesterLabel } from '@/lib/math/placement';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Exercise, { Result } from './Exercise';
import ExtraPractice from './ExtraPractice';
import { MathEditTarget } from './LessonEditor';
import s from './MathLesson.module.css';
import { Fraction, MathText, MathNotationGrade } from './MathText';
import NumberLine from './NumberLine';
import QuickLessonEdit from './QuickLessonEdit';
import SegmentDiagram from './SegmentDiagram';
import UnitFraction from './UnitFraction';

const TeachingTimer = dynamic(
  () => import('../TeachingTimer').then((module) => module.TeachingTimer),
  { ssr: false }
);

type Progress = {
  content: string;
  results: Record<string, Result>;
  read: MathSection[];
};
const coreSections = Object.keys(SECTION_LABELS).filter(
  (s) => s !== 'extra'
) as MathSection[];
function gcd(a: number, b: number): number {
  return b ? gcd(b, a % b) : a;
}
function Diagram({ block }: { block: MathBlock }) {
  const [split, setSplit] = useState(false);
  if (block.visual === 'segment')
    return (
      <SegmentDiagram values={block.values} labels={block.segmentLabels} />
    );
  if (block.visual === 'unit-fraction')
    return <UnitFraction values={block.values} />;
  if (block.visual === 'number-line')
    return <NumberLine values={block.values} />;
  if (block.visual === 'rectangle')
    return (
      <figure className={s.visual}>
        <svg
          viewBox="0 0 320 180"
          role="img"
          aria-label={`Hình chữ nhật dài ${block.values[0]} cm, rộng ${block.values[1]} cm. Hình minh họa không theo tỉ lệ.`}
        >
          <rect
            x="45"
            y="35"
            width="230"
            height="110"
            rx="3"
            fill="#edf2ff"
            stroke="#164bdb"
            strokeWidth="2"
          />
          <text x="160" y="24" textAnchor="middle" fill="#17243e">
            {block.values[0]} cm
          </text>
          <text x="160" y="105" textAnchor="middle" fill="#17243e">
            Rộng {block.values[1]} cm
          </text>
        </svg>
        <figcaption>Hình minh họa không theo tỉ lệ.</figcaption>
      </figure>
    );
  if (block.visual !== 'fractions') return null;
  const [a, b, c, d] = block.values,
    common = (b * d) / gcd(b, d);
  const bars = split
    ? [
        [(a * common) / b, common],
        [(c * common) / d, common],
      ]
    : [
        [a, b],
        [c, d],
      ];
  return (
    <div className={s.visual}>
      {bars.map(([n, denominator], index) => (
        <div className={s.barRow} key={index}>
          <Fraction n={n} d={denominator} />
          <div
            className={s.bar}
            role="img"
            aria-label={`${n} trong ${denominator} phần bằng nhau được tô màu`}
          >
            {Array.from({ length: denominator }, (_, i) => (
              <span
                key={i}
                style={{
                  background: i < n ? (index ? '#ec8b30' : '#164bdb') : 'white',
                }}
              />
            ))}
          </div>
        </div>
      ))}
      {common <= 48 && (
        <button onClick={() => setSplit(!split)} aria-pressed={split}>
          {split
            ? 'Xem phân số ban đầu'
            : `Chia mỗi thanh thành ${common} phần`}
        </button>
      )}
      {split && (
        <p>
          <MathText>{`Mỗi phần nhỏ bằng 1/${common} đơn vị. Độ dài phần tô màu không đổi.`}</MathText>
        </p>
      )}
    </div>
  );
}
export default function MathLesson({
  lesson,
  practiceOnly = false,
  preview = false,
  initialReviewMode = false,
  onBack,
  onSave,
}: {
  lesson: MathLessonData;
  practiceOnly?: boolean;
  preview?: boolean;
  initialReviewMode?: boolean;
  onBack: () => void;
  onSave?: (lesson: MathLessonData) => boolean;
}) {
  const sections = useMemo(
    () =>
      lesson.exercises.some((e) => e.section === 'extra')
        ? [...coreSections, 'extra' as const]
        : coreSections,
    [lesson.exercises]
  );
  const [section, setSection] = useState<MathSection>(
    practiceOnly ? 'practice' : 'foundation'
  );
  const [revealed, setRevealed] = useState(1);
  const [teachingMode, setTeachingMode] = useState(false);
  const [teachingIndex, setTeachingIndex] = useState(0);
  const sectionStart = useRef<HTMLDivElement>(null);
  const mainScroll = useRef<HTMLDivElement>(null);
  const [reviewMode, setReviewMode] = useState(initialReviewMode);
  const canEdit = Boolean(onSave) && !preview && reviewMode;
  const [editing, setEditing] = useState<{ target?: MathEditTarget } | null>(
    null
  );
  const [previous, setPrevious] = useState<MathLessonData | null>(null);
  const [editNotice, setEditNotice] = useState('');
  const editButton = (target: MathEditTarget, label: string) =>
    canEdit ? (
      <button
        type="button"
        onClick={() => setEditing({ target })}
        aria-label={`Sửa nhanh: ${label}`}
      >
        ✎ Sửa nhanh
      </button>
    ) : null;
  const [progress, setProgress] = useState<Progress>({
    content: '',
    results: {},
    read: [],
  });
  const progressRef = useRef(progress);
  progressRef.current = progress;
  const [ready, setReady] = useState(false),
    [notice, setNotice] = useState(''),
    [writable, setWritable] = useState(true);
  const content = JSON.stringify(learnerCopy(lesson)),
    key = `lima-math-progress-v1:${lesson.id}`;
  useEffect(() => {
    const empty: Progress = { content, results: {}, read: [] };
    setReady(false);
    try {
      const raw = preview ? null : localStorage.getItem(key);
      const saved = raw ? JSON.parse(raw) : null;
      if (saved?.content === content) {
        const results: Record<string, Result> = {};
        for (const exercise of lesson.exercises) {
          const r = saved.results?.[exercise.id];
          if (
            r &&
            typeof r.answer === 'string' &&
            typeof r.unit === 'string' &&
            typeof r.assisted === 'boolean' &&
            typeof r.solved === 'boolean' &&
            r.answer.length < 1000 &&
            r.unit.length < 100
          )
            results[exercise.id] = {
              ...r,
              solved:
                r.solved && checkAnswer(exercise, r.answer, r.unit).correct,
            };
        }
        setProgress({
          content,
          results,
          read: Array.isArray(saved.read)
            ? saved.read.filter((v: unknown) =>
                coreSections.includes(v as MathSection)
              )
            : [],
        });
      } else setProgress(empty);
    } catch {
      setProgress(empty);
      setWritable(false);
      setNotice(
        'Không đọc được tiến độ đã lưu. Em vẫn có thể học trong lượt này; dữ liệu cũ không bị ghi đè.'
      );
    }
    setReady(true);
  }, [content, key, lesson.exercises, preview]);
  const save = useCallback(
    (next: Progress) => {
      progressRef.current = next;
      setProgress(next);
      if (!preview && writable)
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          setWritable(false);
          setNotice(
            'Tiến độ chỉ được giữ trong lượt này vì trình duyệt không lưu được.'
          );
        }
    },
    [key, preview, writable]
  );
  const saveResult = useCallback(
    (id: string, result: Result) => {
      const current = progressRef.current;
      save({
        ...current,
        results: { ...current.results, [id]: result },
      });
    },
    [save]
  );
  const revealSectionStart = useCallback(() => {
    requestAnimationFrame(() => {
      if (teachingMode) {
        mainScroll.current?.scrollTo({ top: 0, behavior: 'auto' });
        return;
      }
      const target = sectionStart.current;
      if (!target) return;
      const header = document.querySelector<HTMLElement>('[data-site-header]');
      target.style.scrollMarginTop = `${Math.ceil(header?.getBoundingClientRect().height || 0) + 8}px`;
      target.scrollIntoView({
        behavior: 'auto',
        block: 'start',
        inline: 'nearest',
      });
    });
  }, [teachingMode]);
  const openSection = useCallback(
    (next: MathSection, item = 0) => {
      setSection(next);
      setRevealed(1);
      setTeachingIndex(item);
      revealSectionStart();
    },
    [revealSectionStart]
  );
  const blocks = lesson.blocks.filter((b) => b.section === section),
    exercises = lesson.exercises.filter((e) => e.section === section);
  const teachingItems: Array<
    | { type: 'block'; block: MathBlock }
    | { type: 'exercise'; exercise: MathExercise }
  > =
    section === 'extra'
      ? []
      : [
          ...blocks.map((block) => ({ type: 'block' as const, block })),
          ...exercises.map((exercise) => ({
            type: 'exercise' as const,
            exercise,
          })),
        ];
  const teachingItemCount = Math.max(1, teachingItems.length);
  const teachingItem = teachingItems[teachingIndex];
  const renderedBlocks = teachingMode
    ? blocks
    : section === 'example'
      ? blocks.slice(0, revealed)
      : blocks;
  const teachingItemCountFor = useCallback(
    (value: MathSection) =>
      value === 'extra'
        ? 1
        : Math.max(
            1,
            lesson.blocks.filter((block) => block.section === value).length +
              lesson.exercises.filter((exercise) => exercise.section === value)
                .length
          ),
    [lesson.blocks, lesson.exercises]
  );
  const complete = (value: MathSection) => {
    const tasks = lesson.exercises.filter((e) => e.section === value);
    return tasks.length
      ? tasks.every((e) => progress.results[e.id]?.solved)
      : progress.read.includes(value);
  };
  const count = coreSections.filter(complete).length;
  const practice = lesson.exercises.filter((e) => e.section === 'practice');
  const sectionIndex = sections.indexOf(section);
  const firstTeachingStep = sectionIndex === 0 && teachingIndex === 0;
  const lastTeachingStep =
    sectionIndex === sections.length - 1 &&
    teachingIndex >= teachingItemCount - 1;
  const teachingStepLabel =
    section === 'extra'
      ? 'Luyện từng câu'
      : teachingItem?.type === 'exercise'
        ? `Câu ${teachingIndex - blocks.length + 1}/${exercises.length}`
        : teachingItem?.type === 'block'
          ? `Nội dung ${teachingIndex + 1}/${blocks.length}`
          : 'Nội dung';
  const moveTeaching = useCallback(
    (direction: -1 | 1) => {
      if (direction < 0) {
        if (teachingIndex > 0) {
          setTeachingIndex((index) => index - 1);
          revealSectionStart();
          return;
        }
        const previousSection = sections[sectionIndex - 1];
        if (previousSection)
          openSection(
            previousSection,
            teachingItemCountFor(previousSection) - 1
          );
        return;
      }
      if (teachingIndex < teachingItemCount - 1) {
        setTeachingIndex((index) => index + 1);
        revealSectionStart();
        return;
      }
      const nextSection = sections[sectionIndex + 1];
      if (nextSection) openSection(nextSection);
    },
    [
      openSection,
      revealSectionStart,
      sectionIndex,
      sections,
      teachingIndex,
      teachingItemCount,
      teachingItemCountFor,
    ]
  );
  useEffect(() => {
    setTeachingIndex((index) => Math.min(index, teachingItemCount - 1));
  }, [teachingItemCount]);
  useEffect(() => {
    if (!teachingMode) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    mainScroll.current?.scrollTo({ top: 0, behavior: 'auto' });
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [teachingMode]);
  useEffect(() => {
    if (!teachingMode) return;
    const handleKey = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.repeat ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.shiftKey
      )
        return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          (target.closest(
            'input,textarea,select,button,dialog,[role="dialog"]'
          ) &&
            !target.closest('[data-teaching-navigation]')))
      )
        return;
      if (event.key === 'ArrowRight' && !lastTeachingStep) {
        event.preventDefault();
        moveTeaching(1);
      }
      if (event.key === 'ArrowLeft' && !firstTeachingStep) {
        event.preventDefault();
        moveTeaching(-1);
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        setTeachingMode(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [firstTeachingStep, lastTeachingStep, moveTeaching, teachingMode]);
  if (!ready) return <p role="status">Đang mở bài học…</p>;
  return (
    <div
      className={`${s.lesson} ${teachingMode ? s.teachingMode : ''}`}
      lang="vi"
    >
      <MathNotationGrade.Provider value={lesson.grade}>
      {editing && onSave && (
        <QuickLessonEdit
          lesson={lesson}
          target={editing.target}
          onClose={() => setEditing(null)}
          onSave={(next) => {
            if (!onSave(next)) return false;
            setPrevious(structuredClone(lesson));
            setEditNotice(
              'Đã lưu thay đổi. Hãy tạo liên kết mới để chia sẻ nội dung đã sửa.'
            );
            return true;
          }}
        />
      )}
      <div className={s.brand}>
        <span className={s.brandName}>LIMA</span>
        {teachingMode && (
          <span className={s.teachingTitle}>
            <strong>
              <MathText>{lesson.title}</MathText>
            </strong>
            <small>
              {SECTION_LABELS[section]} · {teachingStepLabel}
            </small>
          </span>
        )}
        {preview && !teachingMode && <small>XEM TRƯỚC</small>}
        <div className={s.brandActions}>
          <button
            type="button"
            className={teachingMode ? s.primary : s.teachingToggle}
            aria-pressed={teachingMode}
            onClick={() => {
              if (!teachingMode) {
                setReviewMode(false);
                setEditing(null);
                setTeachingIndex(0);
                requestAnimationFrame(() => {
                  if (document.activeElement instanceof HTMLElement)
                    document.activeElement.blur();
                });
              }
              setTeachingMode((active) => !active);
            }}
          >
            {teachingMode ? 'Thoát giảng bài' : 'Giảng bài'}
          </button>
          {!teachingMode && onSave && !preview && (
            <button
              type="button"
              aria-pressed={reviewMode}
              onClick={() => setReviewMode((active) => !active)}
            >
              {reviewMode ? 'Kết thúc rà soát' : 'Rà soát bài học'}
            </button>
          )}
          <button onClick={onBack}>
            {preview ? '← Quay lại soạn bài' : '← Thư viện'}
          </button>
        </div>
      </div>
      {canEdit && (
        <div className={s.reviewBar}>
          <p>Chế độ rà soát · Chọn “Sửa nhanh” tại phần muốn chỉnh sửa.</p>
          <button type="button" onClick={() => setEditing({})}>
            ✎ Sửa toàn bộ bài học
          </button>
        </div>
      )}
      {editNotice && (
        <p role="status" className={s.feedback}>
          {editNotice}{' '}
          {previous && (
            <button
              type="button"
              onClick={() => {
                if (onSave?.(previous)) {
                  setPrevious(null);
                  setEditNotice('Đã hoàn tác thay đổi.');
                } else setEditNotice('Không thể hoàn tác. Hãy thử lại.');
              }}
            >
              Hoàn tác
            </button>
          )}
        </p>
      )}
      {notice && (
        <p role="status" className={s.feedback}>
          {notice}
        </p>
      )}
      <div className={s.shell}>
        <aside className={s.sidebar}>
          <p>TOÁN LỚP {lesson.grade}</p>
          <h2>{lesson.topic}</h2>
          <nav aria-label="Các phần trong bài">
            {sections.map((value, i) => (
              <button
                key={value}
                className={section === value ? s.active : ''}
                aria-current={section === value ? 'step' : undefined}
                onClick={() => openSection(value)}
              >
                <span>{complete(value) ? '✓' : `0${i + 1}`}</span>
                {SECTION_LABELS[value]}
              </button>
            ))}
          </nav>
          <label className={s.progress}>
            Đã hoàn thành {count}/5 phần
            <progress value={count} max={5} />
          </label>
          <p className={s.footer}>
            {preview
              ? 'Chế độ xem trước không lưu tiến độ.'
              : 'Tiến độ được lưu trong trình duyệt này. Giáo viên không tự động nhận kết quả.'}
          </p>
        </aside>
        <div className={s.content}>
          <div ref={mainScroll} className={s.mainScroll}>
            <p className={s.breadcrumb}>
              Lớp {lesson.grade} / {semesterLabel(lesson.semester)} /{' '}
              {lesson.topic}
            </p>
            {editButton({ metadata: true }, 'Thông tin bài học')}
            <h1>
              <MathText>{lesson.title}</MathText>
            </h1>
            <p className={s.intro}>
              <MathText>{lesson.goal}</MathText>
            </p>
            <div ref={sectionStart} data-lesson-section-start>
              {section === 'extra' ? (
                <ExtraPractice
                  lesson={lesson}
                  preview={preview}
                  teachingMode={teachingMode}
                  timer={<TeachingTimer minimal />}
                  onEdit={
                    canEdit
                      ? (id) => setEditing({ target: { exercise: id } })
                      : undefined
                  }
                />
              ) : (
                <section
                  className={s.card}
                  aria-label={SECTION_LABELS[section]}
                >
                  <div className={s.sectionHeader}>
                    <p className={s.eyebrow}>{SECTION_LABELS[section]}</p>
                    {['guided', 'practice'].includes(section) && (
                      <TeachingTimer minimal />
                    )}
                  </div>
                  {renderedBlocks.map((block) => (
                    <div
                      className={s.teachingItem}
                      key={block.id}
                      hidden={
                        teachingMode &&
                        (teachingItem?.type !== 'block' ||
                          teachingItem.block.id !== block.id)
                      }
                    >
                      {editButton({ block: block.id }, block.title)}
                      <h2>
                        <MathText>{block.title}</MathText>
                      </h2>
                      <p className={s.prose}>
                        <MathText>{block.text}</MathText>
                      </p>
                      <Diagram block={block} />
                    </div>
                  ))}
                  {!teachingMode &&
                    section === 'example' &&
                    revealed < blocks.length && (
                      <button
                        className={s.primary}
                        onClick={() => setRevealed(revealed + 1)}
                      >
                        Xem bước tiếp theo →
                      </button>
                    )}
                  {!blocks.length && !exercises.length && (
                    <p>
                      Phần này chưa có nội dung. Em có thể chuyển sang phần tiếp
                      theo.
                    </p>
                  )}
                  {exercises.map((exercise) => (
                    <div
                      className={s.teachingItem}
                      key={exercise.id}
                      hidden={
                        teachingMode &&
                        (teachingItem?.type !== 'exercise' ||
                          teachingItem.exercise.id !== exercise.id)
                      }
                    >
                      {editButton({ exercise: exercise.id }, exercise.prompt)}
                      <Exercise
                        key={JSON.stringify(exercise)}
                        exercise={exercise}
                        result={progress.results[exercise.id]}
                        onChange={(result) => saveResult(exercise.id, result)}
                      />
                    </div>
                  ))}
                  {section === 'practice' &&
                    practice.length > 0 &&
                    (!teachingMode ||
                      teachingIndex === teachingItemCount - 1) &&
                    practice.every((e) => progress.results[e.id]?.solved) && (
                      <div className={s.success}>
                        <h2>Em đã hoàn thành!</h2>
                        <p>
                          {
                            practice.filter(
                              (e) => !progress.results[e.id]?.assisted
                            ).length
                          }{' '}
                          trong {practice.length} câu đúng ngay lần đầu, không
                          dùng gợi ý.
                        </p>
                        <button
                          onClick={() => {
                            const results = { ...progress.results };
                            practice.forEach((e) => delete results[e.id]);
                            save({ ...progress, results });
                            openSection('example');
                          }}
                        >
                          Ôn lại rồi thử tiếp
                        </button>
                      </div>
                    )}
                </section>
              )}
            </div>
          </div>
          <div
            className={s.bottom}
            data-teaching-navigation={teachingMode || undefined}
          >
            <button
              disabled={
                teachingMode ? firstTeachingStep : section === 'foundation'
              }
              onClick={() => {
                if (teachingMode) moveTeaching(-1);
                else openSection(sections[sections.indexOf(section) - 1]);
              }}
            >
              {teachingMode ? '← Trước' : '← Quay lại'}
            </button>
            {teachingMode ? (
              <span className={s.teachingStatus} aria-live="polite">
                <strong>{SECTION_LABELS[section]}</strong> · {teachingStepLabel}
                <small>← → để chuyển · Esc để thoát</small>
              </span>
            ) : (
              <span>
                Phần {sections.indexOf(section) + 1}/{sections.length}
              </span>
            )}
            <button
              className={s.primary}
              disabled={teachingMode && lastTeachingStep}
              onClick={() => {
                if (teachingMode) {
                  moveTeaching(1);
                  return;
                }
                if (
                  section !== 'extra' &&
                  !exercises.length &&
                  (section !== 'example' || revealed >= blocks.length)
                )
                  save({
                    ...progress,
                    read: Array.from(new Set([...progress.read, section])),
                  });
                openSection(
                  sections[(sections.indexOf(section) + 1) % sections.length]
                );
              }}
            >
              {teachingMode
                ? 'Tiếp →'
                : section === sections.at(-1)
                  ? 'Về đầu bài'
                  : 'Tiếp tục →'}
            </button>
          </div>
        </div>
      </div>
      </MathNotationGrade.Provider>
    </div>
  );
}
