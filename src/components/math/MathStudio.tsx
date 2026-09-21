import { updateFractionLevels, updateFractionNames } from '@/lib/math/fraction-level-migration';
import { exampleLessons } from '@/lib/math/examples';
import { withKnowledgeSummary } from '@/lib/math/knowledge-summary';
import {
  applyImport,
  blankLesson,
  duplicateLesson,
  MathLessonData,
  packLessons,
  parseMathPack,
} from '@/lib/math/lessons';
import {
  addBuiltInFractionPractice,
  addFractionLessons,
  addBuiltInRationalLesson,
  addBuiltInIntegerLesson,
  addBuiltInNaturalLesson,
  addNaturalCommonFactors,
  splitNaturalDivisibility,
  updateNaturalTerminology,
  addIntegerBracketRules,
  addSetContent,
  updateIntegerComparisonWording,
  updateRationalFoundationWording,
  updateRationalMultiplication,
} from '@/lib/math/migrations';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import LessonEditor from './LessonEditor';
import MathLesson from './MathLesson';
import s from './MathStudio.module.css';
import ShareLesson from './ShareLesson';
const FRACTION_LEVELS_KEY = 'lima-math-fraction-levels-v1';
const FRACTION_LESSONS_KEY = 'lima-math-fraction-lessons-v1';
const KEY = 'lima-math-lessons-v1';
const INPUT_INSTRUCTION_MIGRATION_KEY = 'lima-math-input-instructions-v1';
const SETS_MIGRATION_KEY = 'lima-math-sets-v1';
const BRACKET_MIGRATION_KEY = 'lima-math-integer-brackets-v1';
const DIVISIBILITY_SPLIT_KEY = 'lima-math-divisibility-split-v1';
const COMMON_FACTORS_MIGRATION_KEY = 'lima-math-common-factors-v1';
const NATURAL_MIGRATION_KEY = 'lima-math-natural-v1';
const INTEGER_MIGRATION_KEY = 'lima-math-integer-migration-v1';
const RATIONAL_MIGRATION_KEY = 'lima-math-rational-migration-v1';
const EXTRA_MIGRATION_KEY = 'lima-math-extra-migration-v1';
function download(lessons: MathLessonData[]) {
  const url = URL.createObjectURL(
    new Blob(
      [JSON.stringify(packLessons(lessons.map(withKnowledgeSummary)), null, 2)],
      {
        type: 'application/json',
      }
    )
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = 'lima-math-lessons.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function MathStudio() {
  const [lessons, setLessons] = useState<MathLessonData[]>([]),
    [ready, setReady] = useState(false),
    [writable, setWritable] = useState(true);
  const [draft, setDraft] = useState<MathLessonData | null>(null),
    [draftOriginal, setDraftOriginal] = useState('');
  const [view, setView] = useState<{
    lesson: MathLessonData;
    preview: boolean;
    practice: boolean;
    review?: boolean;
  } | null>(null);
  const [sharing, setSharing] = useState<MathLessonData | null>(null),
    [removed, setRemoved] = useState<MathLessonData | null>(null);
  const [incoming, setIncoming] = useState<MathLessonData[] | null>(null),
    [targets, setTargets] = useState<Record<string, string>>({});
  const [query, setQuery] = useState(''),
    [grade, setGrade] = useState(''),
    [topic, setTopic] = useState('');
  const [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const openLessonId = view?.lesson.id;
  useEffect(() => {
    if (openLessonId) window.scrollTo({ top: 0, behavior: 'auto' });
  }, [openLessonId]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      let loaded =
        raw === null
          ? parseMathPack(packLessons(exampleLessons)).lessons
          : parseMathPack(JSON.parse(raw)).lessons;
      const needsFractionLessons = localStorage.getItem(FRACTION_LESSONS_KEY) !== 'done';
      if (needsFractionLessons) loaded = addFractionLessons(loaded);
      const needsFractionLevels = localStorage.getItem(FRACTION_LEVELS_KEY) !== 'done';
      if (needsFractionLevels) loaded = updateFractionLevels(loaded);
      const needsUpgrade = localStorage.getItem(EXTRA_MIGRATION_KEY) !== 'done';
      const needsInputInstructions =
        localStorage.getItem(INPUT_INSTRUCTION_MIGRATION_KEY) !== 'done';
      if (needsUpgrade) loaded = addBuiltInFractionPractice(loaded);
      const needsRational =
        localStorage.getItem(RATIONAL_MIGRATION_KEY) !== 'done';
      if (needsRational) loaded = addBuiltInRationalLesson(loaded);
      const needsInteger =
        localStorage.getItem(INTEGER_MIGRATION_KEY) !== 'done';
      if (needsInteger) loaded = addBuiltInIntegerLesson(loaded);
      const needsNatural =
        localStorage.getItem(NATURAL_MIGRATION_KEY) !== 'done';
      if (needsNatural) loaded = addBuiltInNaturalLesson(loaded);
      const needsCommonFactors =
        localStorage.getItem(COMMON_FACTORS_MIGRATION_KEY) !== 'done';
      if (needsCommonFactors && raw !== null)
        loaded = addNaturalCommonFactors(loaded);
      const needsSplit =
        localStorage.getItem(DIVISIBILITY_SPLIT_KEY) !== 'done';
      if (needsSplit) loaded = splitNaturalDivisibility(loaded);
      const needsBrackets =
        localStorage.getItem(BRACKET_MIGRATION_KEY) !== 'done';
      if (needsBrackets) loaded = addIntegerBracketRules(loaded);
      const needsSets = localStorage.getItem(SETS_MIGRATION_KEY) !== 'done';
      if (needsSets) loaded = addSetContent(loaded);
      const updatedWording = updateFractionNames(updateNaturalTerminology(updateIntegerComparisonWording(
        updateRationalMultiplication(updateRationalFoundationWording(loaded))
      )));
      const wordingChanged =
        JSON.stringify(updatedWording) !== JSON.stringify(loaded);
      loaded = updatedWording;
      // Show the upgraded lesson even when storage is unavailable.
      setLessons(loaded);
      if (
        raw === null ||
        needsUpgrade ||
        needsFractionLessons ||
        needsFractionLevels ||
        needsRational ||
        needsInteger ||
        needsNatural ||
        needsCommonFactors ||
        needsSplit ||
        needsBrackets ||
        needsSets ||
        needsInputInstructions ||
        wordingChanged
      )
        localStorage.setItem(KEY, JSON.stringify(packLessons(loaded)));
      if (needsFractionLevels) localStorage.setItem(FRACTION_LEVELS_KEY, 'done');
      if (needsFractionLessons) localStorage.setItem(FRACTION_LESSONS_KEY, 'done');
      if (needsUpgrade) localStorage.setItem(EXTRA_MIGRATION_KEY, 'done');
      if (needsRational) localStorage.setItem(RATIONAL_MIGRATION_KEY, 'done');
      if (needsInteger) localStorage.setItem(INTEGER_MIGRATION_KEY, 'done');
      if (needsSplit) localStorage.setItem(DIVISIBILITY_SPLIT_KEY, 'done');
      if (needsCommonFactors)
        localStorage.setItem(COMMON_FACTORS_MIGRATION_KEY, 'done');
      if (needsNatural) localStorage.setItem(NATURAL_MIGRATION_KEY, 'done');
      if (needsBrackets) localStorage.setItem(BRACKET_MIGRATION_KEY, 'done');
      if (needsSets) localStorage.setItem(SETS_MIGRATION_KEY, 'done');
      if (needsInputInstructions)
        localStorage.setItem(INPUT_INSTRUCTION_MIGRATION_KEY, 'done');
    } catch {
      setWritable(false);
      setError(
        'Không đọc hoặc lưu được thư viện. Dữ liệu cũ được giữ nguyên. Bạn vẫn có thể mở các bài mẫu; dùng xuất JSON để giữ bản sao.'
      );
      setLessons(exampleLessons);
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!draft) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [draft]);
  function persist(next: MathLessonData[]) {
    if (!writable) {
      setError(
        'Thư viện hiện không ghi được. Hãy xuất bản sao hoặc dùng trình duyệt cho phép lưu dữ liệu.'
      );
      return false;
    }
    try {
      const pack = parseMathPack(packLessons(next));
      localStorage.setItem(KEY, JSON.stringify(pack));
      setLessons(pack.lessons);
      setError('');
      return true;
    } catch (error) {
      setError(
        (error as Error).message ||
          'Không lưu được. Dữ liệu hiện tại chưa thay đổi.'
      );
      return false;
    }
  }
  function edit(lesson: MathLessonData) {
    const copy = structuredClone(lesson);
    setDraft(copy);
    setDraftOriginal(JSON.stringify(copy));
    setSharing(null);
    setIncoming(null);
    setError('');
  }
  function checkedDraft() {
    if (!draft) return null;
    try {
      return parseMathPack(packLessons([draft])).lessons[0];
    } catch (error) {
      setError((error as Error).message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return null;
    }
  }
  async function importFile(selected?: File) {
    if (!selected) return;
    setBusy(true);
    setError('');
    setIncoming(null);
    setSharing(null);
    try {
      if (selected.size > 2_000_000) throw new Error('Tệp tối đa 2 MB.');
      const pack = /\.xlsx$/i.test(selected.name)
        ? (await import('@/lib/math/workbook')).importMathWorkbook(
            await selected.arrayBuffer()
          )
        : parseMathPack(JSON.parse(await selected.text()));
      if (!pack.lessons.length)
        throw new Error('Tệp không có bài học để nhập.');
      setIncoming(pack.lessons);
      setTargets(
        Object.fromEntries(
          pack.lessons.map((l) => [
            l.id,
            lessons.some((old) => old.id === l.id) ? l.id : '',
          ])
        )
      );
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
      if (file.current) file.current.value = '';
    }
  }
  if (!ready) return <p role="status">Đang mở thư viện Toán…</p>;
  if (view)
    return (
      <MathLesson
        key={view.lesson.id}
        lesson={view.lesson}
        practiceOnly={view.practice}
        preview={view.preview}
        initialReviewMode={view.review}
        onBack={() => setView(null)}
        onSave={
          !view.preview && writable
            ? (next) => {
                if (
                  !persist(
                    lessons.map((lesson) =>
                      lesson.id === next.id ? next : lesson
                    )
                  )
                )
                  return false;
                setView({ ...view, lesson: next });
                return true;
              }
            : undefined
        }
      />
    );
  const filtered = lessons.filter(
    (l) =>
      (!grade || l.grade === Number(grade)) &&
      (!topic || l.topic === topic) &&
      `${l.title} ${l.topic} ${l.goal}`
        .toLocaleLowerCase('vi')
        .includes(query.toLocaleLowerCase('vi'))
  );
  return (
    <div className={s.studio} lang="vi">
      {error && (
        <p role="alert" className={s.error}>
          {error}
        </p>
      )}
      {message && (
        <p role="status" className={s.notice}>
          {message}
        </p>
      )}
      {draft ? (
        <LessonEditor
          draft={draft}
          onChange={setDraft}
          onCancel={() => {
            if (
              JSON.stringify(draft) === draftOriginal ||
              window.confirm('Bỏ các thay đổi chưa lưu?')
            ) {
              setDraft(null);
              setError('');
            }
          }}
          onPreview={() => {
            const lesson = checkedDraft();
            if (lesson) {
              setError('');
              setView({ lesson, preview: true, practice: false });
            }
          }}
          onSave={() => {
            const lesson = checkedDraft();
            if (
              lesson &&
              persist(
                lessons.some((l) => l.id === lesson.id)
                  ? lessons.map((l) => (l.id === lesson.id ? lesson : l))
                  : [...lessons, lesson]
              )
            ) {
              setDraft(null);
              setMessage('Đã lưu bài học trong trình duyệt này.');
            }
          }}
        />
      ) : (
        <>
          <div className={s.toolbar}>
            <div>
              <p className={s.eyebrow}>LIMA Math</p>
              <h1>Thư viện bài học</h1>
              <p className={s.muted}>
                Soạn bài, hướng dẫn từng bước và chia sẻ cho học sinh.
              </p>
            </div>
            <button
              className={s.primary}
              disabled={!writable}
              onClick={() => edit(blankLesson())}
            >
              + Tạo bài học
            </button>
          </div>
          <div className={s.actions}>
            <button
              disabled={busy || !writable}
              onClick={() => file.current?.click()}
            >
              {busy ? 'Đang đọc tệp…' : 'Nhập JSON / Excel'}
            </button>
            <button onClick={() => download(lessons)}>Xuất JSON</button>
            {/* <button
              disabled={!lessons.length || busy}
              onClick={async () => {
                setBusy(true);
                try {
                  (await import('@/lib/math/workbook')).exportMathWorkbook(
                    lessons
                  );
                } catch {
                  setError('Không xuất được Excel. Hãy thử xuất JSON.');
                } finally {
                  setBusy(false);
                }
              }}
            >
              Xuất Excel / mẫu nhập
            </button> */}
            <Link className={s.link} href="/math-practice/learn">
              Bài học đã nhận ↗
            </Link>
            <input
              ref={file}
              type="file"
              accept=".json,.xlsx"
              hidden
              style={{ display: 'none' }}
              onChange={(event) => void importFile(event.target.files?.[0])}
            />
          </div>
          <p className={s.muted}>
            Bài học và tiến độ lưu trên trình duyệt này. Xuất JSON để sao lưu;
            liên kết chia sẻ chỉ chứa nội dung cho học sinh.
          </p>
          {removed && (
            <div className={s.notice} role="status">
              Đã xóa “{removed.title}”.{' '}
              <button
                onClick={() => {
                  if (persist([...lessons, removed])) setRemoved(null);
                }}
              >
                Hoàn tác
              </button>
            </div>
          )}
          {sharing && (
            <ShareLesson
              key={sharing.id}
              lesson={sharing}
              onClose={() => setSharing(null)}
            />
          )}
          {incoming && (
            <section className={s.panel}>
              <h2>Xem lại trước khi nhập · {incoming.length} bài</h2>
              <p>
                Chọn thêm bản sao hoặc cập nhật bài hiện có. Chưa có dữ liệu nào
                được thay đổi.
              </p>
              {incoming.map((lesson) => (
                <div className={s.panel} key={lesson.id}>
                  <h3>{lesson.title}</h3>
                  <p className={s.muted}>
                    Lớp {lesson.grade} · {lesson.topic} · {lesson.blocks.length}{' '}
                    phần giảng · {lesson.exercises.length} bài tập
                  </p>
                  <label>
                    Thao tác
                    <select
                      value={targets[lesson.id] || ''}
                      onChange={(event) =>
                        setTargets({
                          ...targets,
                          [lesson.id]: event.target.value,
                        })
                      }
                    >
                      <option value="">Thêm bản sao mới</option>
                      {lessons.map((old) => (
                        <option key={old.id} value={old.id}>
                          Cập nhật: {old.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    onClick={() =>
                      setView({ lesson, preview: true, practice: false })
                    }
                  >
                    Xem trước nội dung
                  </button>
                </div>
              ))}
              <div className={s.actions}>
                <button
                  className={s.primary}
                  onClick={() => {
                    try {
                      if (persist(applyImport(lessons, incoming, targets))) {
                        setIncoming(null);
                        setMessage(
                          'Đã nhập bài học. Những liên kết đã chia sẻ trước đó vẫn giữ nội dung cũ.'
                        );
                      }
                    } catch (error) {
                      setError((error as Error).message);
                    }
                  }}
                >
                  Xác nhận nhập
                </button>
                <button onClick={() => setIncoming(null)}>Hủy nhập</button>
              </div>
            </section>
          )}
          <div className={s.filters}>
            <label>
              Tìm bài học
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tên bài, chủ đề hoặc mục tiêu…"
              />
            </label>
            <label>
              Lớp
              <select value={grade} onChange={(e) => setGrade(e.target.value)}>
                <option value="">Tất cả lớp</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i + 1}>
                    Lớp {i + 1}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Chủ đề
              <select value={topic} onChange={(e) => setTopic(e.target.value)}>
                <option value="">Tất cả chủ đề</option>
                {Array.from(new Set(lessons.map((l) => l.topic))).map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
          </div>
          <p className={s.muted}>{filtered.length} bài học</p>
          <div className={s.cards}>
            {filtered.map((lesson) => (
              <article className={s.lessonCard} key={lesson.id}>
                <div>
                  <span className={s.badge}>
                    Lớp {lesson.grade} · {lesson.topic}
                  </span>
                  <h2>{lesson.title}</h2>
                  <p>{lesson.goal}</p>
                  <p className={s.muted}>
                    {lesson.blocks.length} phần giảng ·{' '}
                    {lesson.exercises.length} bài tập
                  </p>
                </div>
                <div className={s.actions}>
                  <button
                    className={s.primary}
                    onClick={() =>
                      setView({ lesson, preview: false, practice: false })
                    }
                  >
                    Học bài
                  </button>
                  <button
                    onClick={() =>
                      setView({ lesson, preview: false, practice: true })
                    }
                  >
                    Luyện tập
                  </button>
                  <button
                    disabled={!writable}
                    onClick={() =>
                      setView({
                        lesson,
                        preview: false,
                        practice: false,
                        review: true,
                      })
                    }
                  >
                    Rà soát bài học
                  </button>
                  <button
                    onClick={() => {
                      setSharing(lesson);
                      setIncoming(null);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    Chia sẻ
                  </button>
                </div>
                <details>
                  <summary>Quản lý bài học</summary>
                  <div className={s.actions}>
                    <button disabled={!writable} onClick={() => edit(lesson)}>
                      Chỉnh sửa
                    </button>
                    <button
                      disabled={!writable}
                      onClick={() => {
                        const copy = duplicateLesson(lesson);
                        copy.title = `${lesson.title.slice(0, 180)} (bản sao)`;
                        edit(copy);
                      }}
                    >
                      Nhân bản
                    </button>
                    <button onClick={() => download([lesson])}>
                      Xuất JSON bài này
                    </button>
                    <button
                      className={s.danger}
                      disabled={!writable}
                      onClick={() => {
                        if (
                          window.confirm(
                            `Xóa bài “${lesson.title}” khỏi thư viện? Liên kết đã chia sẻ vẫn mở được.`
                          ) &&
                          persist(lessons.filter((l) => l.id !== lesson.id))
                        )
                          setRemoved(lesson);
                      }}
                    >
                      Xóa
                    </button>
                  </div>
                </details>
              </article>
            ))}
          </div>
          {!filtered.length && (
            <div className={s.empty}>
              <h2>
                {lessons.length
                  ? 'Không có bài phù hợp'
                  : 'Thư viện đang trống'}
              </h2>
              <p>Thử đổi bộ lọc, tạo bài mới hoặc nhập tệp bài học.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
