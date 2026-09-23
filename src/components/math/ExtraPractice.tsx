import SegmentDiagram from './SegmentDiagram';
import ExerciseTable from './ExerciseTable';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  checkAnswer,
  EXTRA_GROUPS,
  MathExercise,
  MathLessonData,
} from '@/lib/math/lessons';
import Exercise, { Result } from './Exercise';
import { getKnowledgeSummary } from '@/lib/math/knowledge-summary';
import { startPdfTask, waitForPdfTask } from '@/lib/math/pdf-task';
import { MathText } from './MathText';
import s from './MathLesson.module.css';
type ExtraResult = Result & {
  reviewed?: boolean;
  selfRating?: 'understood' | 'review';
};
type Notebook = {
  content: string;
  current: number;
  results: Record<string, ExtraResult>;
};
function WrittenExercise({
  exercise,
  result,
  onChange,
}: {
  exercise: MathExercise;
  result?: ExtraResult;
  onChange: (result: ExtraResult) => void;
}) {
  const [answer, setAnswer] = useState(result?.answer || '');
  const [revealed, setRevealed] = useState(!!result?.reviewed);
  function record(patch: Partial<ExtraResult>) {
    onChange({
      answer,
      unit: '',
      assisted: false,
      solved: false,
      ...result,
      ...patch,
    });
  }
  return (
    <div className={s.question}>
      <h3>
        <MathText>{exercise.prompt}</MathText>
      </h3>
      {exercise.table && <ExerciseTable table={exercise.table} />}
      {exercise.segment && <SegmentDiagram values={exercise.segment} />}
      {exercise.inputInstruction && (
        <p id={`${exercise.id}-instruction`} className={s.footer}>
          <MathText>{exercise.inputInstruction}</MathText>
        </p>
      )}
      <label className={s.writtenLabel}>
        Cách giải của em
        <textarea
          aria-describedby={
            exercise.inputInstruction ? `${exercise.id}-instruction` : undefined
          }
          rows={6}
          maxLength={4000}
          value={answer}
          onChange={(e) => {
            setAnswer(e.target.value);
            setRevealed(false);
            record({
              answer: e.target.value,
              reviewed: false,
              selfRating: undefined,
            });
          }}
        />
      </label>
      <div className={s.actions}>
        <button
          onClick={() => {
            record({ assisted: true });
            setRevealed(false);
          }}
          disabled={revealed}
        >
          Gợi ý
        </button>
        <button
          className={s.primary}
          disabled={!answer.trim()}
          onClick={() => {
            setRevealed(true);
            record({ answer, attempted: true, reviewed: true });
          }}
        >
          Đối chiếu lời giải mẫu
        </button>
      </div>
      {!revealed && result?.assisted && (
        <p className={s.feedback}>
          <MathText>{exercise.hint}</MathText>
        </p>
      )}
      {revealed && (
        <div className={s.callout}>
          <h3>Lời giải mẫu</h3>
          {exercise.table && <ExerciseTable table={exercise.table} solved />}
          <p className={s.prose}>
            <MathText>{exercise.solution}</MathText>
          </p>
          <h3>Tự kiểm tra</h3>
          <ul className={s.criteria}>
            {exercise.criteria?.map((c) => (
              <li key={c}>
                <MathText>{c}</MathText>
              </li>
            ))}
          </ul>
          <p>Bài này do em tự đánh giá, không được chấm đúng/sai tự động.</p>
          <div className={s.actions}>
            <button
              aria-pressed={result?.selfRating === 'understood'}
              onClick={() =>
                record({ reviewed: true, selfRating: 'understood' })
              }
            >
              Em đã hiểu
            </button>
            <button
              aria-pressed={result?.selfRating === 'review'}
              onClick={() => record({ reviewed: true, selfRating: 'review' })}
            >
              Em cần ôn thêm
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export default function ExtraPractice({
  lesson,
  preview,
  onEdit,
  teachingMode = false,
}: {
  lesson: MathLessonData;
  preview: boolean;
  onEdit?: (id: string) => void;
  teachingMode?: boolean;
}) {
  const questions = useMemo(
    () => lesson.exercises.filter((e) => e.section === 'extra'),
    [lesson.exercises]
  );
  const content = JSON.stringify(questions),
    storageKey = `lima-math-extra-v1:${lesson.id}`;
  const [notebook, setNotebook] = useState<Notebook>({
      content,
      current: 0,
      results: {},
    }),
    [ready, setReady] = useState(false),
    [notice, setNotice] = useState(''),
    [writable, setWritable] = useState(true);
  const [summary, setSummary] = useState(false),
    [includeKnowledgeSummary, setIncludeKnowledgeSummary] = useState(true),
    [review, setReview] = useState<string[] | null>(null),
    [busy, setBusy] = useState(false),
    [attempt, setAttempt] = useState(0),
    [stickyTop, setStickyTop] = useState(8);
  const pdfTask = useRef<ReturnType<typeof startPdfTask> | null>(null);
  const questionGrid = useRef<HTMLElement>(null);
  const questionBody = useRef<HTMLDivElement>(null);
  const summaryBody = useRef<HTMLElement>(null);
  const [pdfStage, setPdfStage] = useState('');
  useEffect(() => {
    if (teachingMode) {
      setStickyTop(0);
      return;
    }
    const header = document.querySelector<HTMLElement>('[data-site-header]');
    if (!header) return;
    const updateStickyTop = () =>
      setStickyTop(Math.ceil(header.getBoundingClientRect().height) + 8);
    updateStickyTop();
    const observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(updateStickyTop);
    observer?.observe(header);
    window.addEventListener('resize', updateStickyTop);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', updateStickyTop);
    };
  }, [teachingMode]);
  useEffect(() => {
    setBusy(false);
    return () => {
      pdfTask.current?.cancel();
      pdfTask.current = null;
    };
  }, [lesson.id]);
  useEffect(() => {
    let next: Notebook = { content, current: 0, results: {} };
    try {
      const raw = preview ? null : localStorage.getItem(storageKey);
      const saved = raw ? JSON.parse(raw) : null;
      if (saved?.content === content) {
        const results: Record<string, ExtraResult> = {};
        for (const e of questions) {
          const r = saved.results?.[e.id];
          if (
            r &&
            typeof r.answer === 'string' &&
            r.answer.length <= 4000 &&
            typeof r.unit === 'string' &&
            r.unit.length <= 100 &&
            typeof r.assisted === 'boolean' &&
            typeof r.solved === 'boolean'
          )
            results[e.id] = {
              answer: r.answer,
              unit: r.unit,
              assisted: r.assisted,
              solved:
                e.kind !== 'written' &&
                r.solved &&
                checkAnswer(e, r.answer, r.unit).correct,
              attempted: r.attempted === true,
              reviewed: e.kind === 'written' && r.reviewed === true,
              selfRating:
                e.kind === 'written' &&
                ['understood', 'review'].includes(r.selfRating)
                  ? r.selfRating
                  : undefined,
            };
        }
        next = {
          content,
          results,
          current:
            Number.isInteger(saved.current) &&
            saved.current >= 0 &&
            saved.current < questions.length
              ? saved.current
              : 0,
        };
      }
    } catch {
      setWritable(false);
      setNotice(
        'Không đọc được tiến độ. Em vẫn có thể làm trong lượt này; dữ liệu cũ không bị ghi đè.'
      );
    }
    setNotebook((previous) =>
      previous.content !== content
        ? {
            ...next,
            current: Math.min(
              previous.current,
              Math.max(0, questions.length - 1)
            ),
          }
        : next
    );
    setReview(null);
    setReady(true);
  }, [content, storageKey, preview, questions]); // Content is the complete exercise snapshot.
  function save(next: Notebook) {
    setNotebook(next);
    if (!preview && writable)
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        setWritable(false);
        setNotice(
          'Không lưu được tiến độ trong trình duyệt. Kết quả vẫn hiển thị trong lượt này.'
        );
      }
  }
  const status = (e: MathExercise) => {
    const r = notebook.results[e.id];
    return e.kind === 'written'
      ? r?.selfRating === 'understood'
        ? 'Tự đánh giá: đã hiểu'
        : r?.selfRating === 'review'
          ? 'Cần ôn'
          : r?.reviewed
            ? 'Chờ tự đánh giá'
            : 'Chưa làm'
      : r?.solved
        ? r.assisted
          ? 'Đúng sau hỗ trợ'
          : 'Tự làm đúng'
        : r?.attempted || r?.assisted
          ? 'Cần ôn'
          : 'Chưa làm';
  };
  const completed = questions.filter(
    (e) => notebook.results[e.id]?.solved || notebook.results[e.id]?.selfRating
  ).length;
  const visible = review
    ? questions.filter((e) => review.includes(e.id))
    : questions;
  const currentIndex = notebook.current;
  const current = questions[currentIndex] || questions[0];
  useEffect(() => {
    const navigation = questionGrid.current;
    const active = navigation?.querySelector<HTMLElement>(
      '[aria-current="step"]'
    );
    if (!navigation || !active) return;
    const navigationBounds = navigation.getBoundingClientRect();
    const activeBounds = active.getBoundingClientRect();
    if (activeBounds.left < navigationBounds.left + 8)
      navigation.scrollLeft -= navigationBounds.left + 8 - activeBounds.left;
    else if (activeBounds.right > navigationBounds.right - 8)
      navigation.scrollLeft += activeBounds.right - navigationBounds.right + 8;
  }, [currentIndex, summary]);
  function revealPracticeBody() {
    requestAnimationFrame(() => {
      const body = questionBody.current || summaryBody.current;
      if (!body) return;
      const navigationHeight =
        questionGrid.current?.getBoundingClientRect().height || 52;
      body.style.scrollMarginTop = `${stickyTop + navigationHeight + 8}px`;
      body.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'auto'
          : 'smooth',
        block: 'start',
        inline: 'nearest',
      });
    });
  }
  function selectQuestion(index: number, clearReview = false) {
    setSummary(false);
    if (clearReview) setReview(null);
    save({ ...notebook, current: index });
    revealPracticeBody();
  }
  async function pdf(mode: 'worksheet' | 'solutions') {
    if (pdfTask.current) return;
    setBusy(true);
    setNotice('');
    setPdfStage('Đang tải bộ tạo PDF…');
    const task = startPdfTask(async (signal) => {
      const exporter = await waitForPdfTask(import('@/lib/math/pdf'), signal);
      signal.throwIfAborted();
      setPdfStage('Đang tải phông chữ và tạo PDF…');
      await exporter.downloadPracticePdf(
        lesson,
        mode,
        { includeKnowledgeSummary },
        signal
      );
    });
    pdfTask.current = task;
    try {
      await task.promise;
    } catch (error) {
      if (pdfTask.current === task)
        setNotice(
          (error as Error).message || 'Không tạo được PDF. Hãy thử lại.'
        );
    } finally {
      if (pdfTask.current === task) {
        pdfTask.current = null;
        setBusy(false);
      }
    }
  }
  if (!ready) return <p role="status">Đang mở luyện tập thêm…</p>;
  if (!questions.length)
    return (
      <div className={s.card}>
        <h2>Luyện tập thêm</h2>
        <p>Chưa có bài tập thêm. Thêm câu hỏi ở phần soạn bài để bắt đầu.</p>
      </div>
    );
  return (
    <div className={`${s.card} ${s.extraPractice}`}>
      <header className={s.practiceHeader}>
        <div>
          <p className={s.eyebrow}>LUYỆN TẬP THÊM</p>
          <h2>Luyện từng câu, hiểu từng bước</h2>
          <p className={s.practiceProgress}>
            {questions.length} bài tập · Đã hoàn thành {completed}/
            {questions.length}
          </p>
        </div>
        <button
          onClick={() => {
            setSummary(!summary);
            revealPracticeBody();
          }}
        >
          {summary ? 'Tiếp tục luyện tập' : 'Xem tiến độ'}
        </button>
      </header>
      <details className={s.pdfTools}>
        <summary>Tải PDF và đáp án</summary>
        <div className={s.pdfControls}>
          <div className={s.pdfActions}>
            <button disabled={busy} onClick={() => void pdf('worksheet')}>
              Tải phiếu bài tập
            </button>
            <button disabled={busy} onClick={() => void pdf('solutions')}>
              Tải đáp án
            </button>
          </div>
          <label className={s.pdfOption}>
            <input
              type="checkbox"
              checked={
                includeKnowledgeSummary && !!getKnowledgeSummary(lesson).trim()
              }
              disabled={busy || !getKnowledgeSummary(lesson).trim()}
              onChange={(event) =>
                setIncludeKnowledgeSummary(event.target.checked)
              }
            />
            Kèm kiến thức cần nhớ trong phiếu bài tập
          </label>
        </div>
        <p className={s.pdfHint}>
          {getKnowledgeSummary(lesson).trim()
            ? 'PDF dùng cùng câu hỏi và số thứ tự như trên web. Các bài tự luận được tự đánh giá.'
            : 'Chưa có tóm tắt. Có thể thêm ở phần Thông tin bài học khi soạn bài.'}
        </p>
      </details>
      {busy && (
        <div className={s.pdfStatus}>
          <p role="status">{pdfStage}</p>
          <button onClick={() => pdfTask.current?.cancel()}>Hủy tạo PDF</button>
        </div>
      )}
      {notice && (
        <p role="status" className={s.feedback}>
          {notice}
        </p>
      )}
      <nav
        ref={questionGrid}
        className={s.questionGrid}
        aria-label="Chọn bài tập thêm"
        style={{ top: stickyTop }}
      >
        {questions.map((e, i) => (
          <button
            key={e.id}
            className={
              notebook.current === i && !summary
                ? s.selectedQuestion
                : undefined
            }
            aria-current={
              notebook.current === i && !summary ? 'step' : undefined
            }
            aria-label={`Bài ${i + 1} · ${status(e)}`}
            title={status(e)}
            onClick={() => selectQuestion(i, true)}
          >
            <span>{i + 1}</span>
            <small>
              {notebook.results[e.id]?.solved
                ? '✓'
                : notebook.results[e.id]?.selfRating
                  ? '◉'
                  : notebook.results[e.id]?.attempted ||
                      notebook.results[e.id]?.assisted
                    ? '↻'
                    : '·'}
            </small>
          </button>
        ))}
      </nav>
      {summary ? (
        <section ref={summaryBody} aria-label="Tiến độ luyện tập">
          <h3>Kết quả của em</h3>
          <ul className={s.criteria}>
            <li>
              Tự làm đúng:{' '}
              {
                questions.filter(
                  (e) =>
                    e.kind !== 'written' &&
                    notebook.results[e.id]?.solved &&
                    !notebook.results[e.id]?.assisted
                ).length
              }
            </li>
            <li>
              Đúng sau hỗ trợ hoặc thử lại:{' '}
              {
                questions.filter(
                  (e) =>
                    e.kind !== 'written' &&
                    notebook.results[e.id]?.solved &&
                    notebook.results[e.id]?.assisted
                ).length
              }
            </li>
            <li>
              Tự luận đã tự đánh giá:{' '}
              {
                questions.filter(
                  (e) =>
                    e.kind === 'written' && notebook.results[e.id]?.selfRating
                ).length
              }
            </li>
          </ul>
          {questions.map((e, i) => (
            <p key={e.id}>
              Bài {i + 1}: {status(e)}
            </p>
          ))}
          <button
            className={s.primary}
            onClick={() => {
              const needs = questions.filter((e) =>
                e.kind === 'written'
                  ? notebook.results[e.id]?.selfRating !== 'understood'
                  : !notebook.results[e.id]?.solved ||
                    notebook.results[e.id]?.assisted
              );
              if (!needs.length) {
                setNotice(
                  'Tất cả câu đã được hoàn thành độc lập hoặc tự đánh giá đã hiểu.'
                );
                return;
              }
              const results = { ...notebook.results };
              needs.forEach((e) => delete results[e.id]);
              setReview(needs.map((e) => e.id));
              setAttempt((v) => v + 1);
              save({
                ...notebook,
                results,
                current: questions.findIndex((e) => e.id === needs[0].id),
              });
              setSummary(false);
              revealPracticeBody();
            }}
          >
            Làm lại các câu cần ôn
          </button>
        </section>
      ) : (
        <div ref={questionBody} className={s.questionBody}>
          {review && (
            <p className={s.callout}>
              Đang ôn lại {review.length} câu. Kết quả lượt mới thay thế kết quả
              cũ của các câu này.
            </p>
          )}
          <p className={s.questionMeta}>
            <strong>
              Bài {notebook.current + 1}/{questions.length} ·{' '}
              {EXTRA_GROUPS[current.group || 'skills']}
            </strong>
            {current.skill && <span>Kỹ năng: {current.skill}</span>}
          </p>
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(current.id)}
              aria-label={`Sửa nhanh: Bài ${notebook.current + 1}`}
            >
              ✎ Sửa nhanh bài này
            </button>
          )}
          {current.kind === 'written' ? (
            <WrittenExercise
              key={`${JSON.stringify(current)}-${attempt}`}
              exercise={current}
              result={notebook.results[current.id]}
              onChange={(result) =>
                save({
                  ...notebook,
                  results: { ...notebook.results, [current.id]: result },
                })
              }
            />
          ) : (
            <Exercise
              key={`${JSON.stringify(current)}-${attempt}`}
              exercise={current}
              result={notebook.results[current.id]}
              onChange={(result) =>
                save({
                  ...notebook,
                  results: { ...notebook.results, [current.id]: result },
                })
              }
            />
          )}
          <div className={s.bottom}>
            <button
              disabled={visible.findIndex((e) => e.id === current.id) <= 0}
              onClick={() => {
                const previous =
                  visible[visible.findIndex((q) => q.id === current.id) - 1];
                if (previous)
                  selectQuestion(
                    questions.findIndex((e) => e.id === previous.id)
                  );
              }}
            >
              ← Câu trước
            </button>
            <button
              className={s.primary}
              onClick={() => {
                const next =
                  visible[visible.findIndex((e) => e.id === current.id) + 1];
                if (next)
                  selectQuestion(questions.findIndex((e) => e.id === next.id));
                else {
                  setSummary(true);
                  revealPracticeBody();
                }
              }}
            >
              {visible.at(-1)?.id === current.id
                ? 'Xem kết quả'
                : 'Câu tiếp theo →'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
