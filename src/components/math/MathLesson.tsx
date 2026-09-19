import QuickLessonEdit from './QuickLessonEdit';
import { MathEditTarget } from './LessonEditor';
import Exercise, { Result } from './Exercise';
import ExtraPractice from './ExtraPractice';
import { useEffect, useState } from 'react';
import {
  checkAnswer,
  learnerCopy,
  MathBlock,
  MathLessonData,
  MathSection,
  SECTION_LABELS,
} from '@/lib/math/lessons';
import { Fraction, MathText } from './MathText';
import s from './MathLesson.module.css';

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
  onBack,
  onSave,
}: {
  lesson: MathLessonData;
  practiceOnly?: boolean;
  preview?: boolean;
  onBack: () => void;
  onSave?: (lesson: MathLessonData) => boolean;
}) {
  const sections = lesson.exercises.some((e) => e.section === 'extra')
    ? [...coreSections, 'extra' as const]
    : coreSections;
  const [section, setSection] = useState<MathSection>(
    practiceOnly ? 'practice' : 'foundation'
  );
  const [revealed, setRevealed] = useState(1);
  const [editing, setEditing] = useState<{ target?: MathEditTarget } | null>(
    null
  );
  const [previous, setPrevious] = useState<MathLessonData | null>(null);
  const [editNotice, setEditNotice] = useState('');
  const editButton = (target: MathEditTarget, label: string) =>
    onSave && !preview ? (
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
  function save(next: Progress) {
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
  }
  const blocks = lesson.blocks.filter((b) => b.section === section),
    exercises = lesson.exercises.filter((e) => e.section === section);
  const complete = (value: MathSection) => {
    const tasks = lesson.exercises.filter((e) => e.section === value);
    return tasks.length
      ? tasks.every((e) => progress.results[e.id]?.solved)
      : progress.read.includes(value);
  };
  const count = coreSections.filter(complete).length;
  const practice = lesson.exercises.filter((e) => e.section === 'practice');
  if (!ready) return <p role="status">Đang mở bài học…</p>;
  return (
    <div className={s.lesson} lang="vi">
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
        <span>LIMA Math</span>
        {onSave && !preview && (
          <button type="button" onClick={() => setEditing({})}>
            ✎ Sửa nhanh bài học
          </button>
        )}
        {preview && <small>XEM TRƯỚC</small>}
        <button onClick={onBack}>
          {preview ? '← Quay lại soạn bài' : '← Thư viện'}
        </button>
      </div>
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
                onClick={() => {
                  setSection(value);
                  setRevealed(1);
                }}
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
          <p className={s.breadcrumb}>
            Lớp {lesson.grade} / {lesson.topic}
          </p>
          {editButton({ metadata: true }, 'Thông tin bài học')}
          <h1>
            <MathText>{lesson.title}</MathText>
          </h1>
          <p className={s.intro}>
            <MathText>{lesson.goal}</MathText>
          </p>
          {section === 'extra' ? (
            <ExtraPractice
              lesson={lesson}
              preview={preview}
              onEdit={
                onSave && !preview
                  ? (id) => setEditing({ target: { exercise: id } })
                  : undefined
              }
            />
          ) : (
            <section className={s.card} aria-label={SECTION_LABELS[section]}>
              <p className={s.eyebrow}>{SECTION_LABELS[section]}</p>
              {(section === 'example' ? blocks.slice(0, revealed) : blocks).map(
                (block) => (
                  <div key={block.id}>
                    {editButton({ block: block.id }, block.title)}
                    <h2>
                      <MathText>{block.title}</MathText>
                    </h2>
                    <p className={s.prose}>
                      <MathText>{block.text}</MathText>
                    </p>
                    <Diagram block={block} />
                  </div>
                )
              )}
              {section === 'example' && revealed < blocks.length && (
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
                <div key={exercise.id}>
                  {editButton({ exercise: exercise.id }, exercise.prompt)}
                  <Exercise
                    key={JSON.stringify(exercise)}
                    exercise={exercise}
                    result={progress.results[exercise.id]}
                    onChange={(result) =>
                      save({
                        ...progress,
                        results: { ...progress.results, [exercise.id]: result },
                      })
                    }
                  />
                </div>
              ))}
              {section === 'practice' &&
                practice.length > 0 &&
                practice.every((e) => progress.results[e.id]?.solved) && (
                  <div className={s.success}>
                    <h2>Em đã hoàn thành!</h2>
                    <p>
                      {
                        practice.filter(
                          (e) => !progress.results[e.id]?.assisted
                        ).length
                      }{' '}
                      trong {practice.length} câu đúng ngay lần đầu, không dùng
                      gợi ý.
                    </p>
                    <button
                      onClick={() => {
                        const results = { ...progress.results };
                        practice.forEach((e) => delete results[e.id]);
                        save({ ...progress, results });
                        setSection('example');
                      }}
                    >
                      Ôn lại rồi thử tiếp
                    </button>
                  </div>
                )}
            </section>
          )}
          <div className={s.bottom}>
            <button
              disabled={section === 'foundation'}
              onClick={() => {
                setSection(sections[sections.indexOf(section) - 1]);
                setRevealed(1);
              }}
            >
              ← Quay lại
            </button>
            <span>
              Phần {sections.indexOf(section) + 1}/{sections.length}
            </span>
            <button
              className={s.primary}
              onClick={() => {
                if (
                  section !== 'extra' &&
                  !exercises.length &&
                  (section !== 'example' || revealed >= blocks.length)
                )
                  save({
                    ...progress,
                    read: Array.from(new Set([...progress.read, section])),
                  });
                setSection(
                  sections[(sections.indexOf(section) + 1) % sections.length]
                );
                setRevealed(1);
              }}
            >
              {section === sections.at(-1) ? 'Về đầu bài' : 'Tiếp tục →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
