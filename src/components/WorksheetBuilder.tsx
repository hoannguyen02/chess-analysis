import type { DrawCategory } from '@/lib/chess/draw-practice';
import {
  defaultWorksheetFooter,
  defaultBookOptions,
  planWorksheetBookBlocks,
  levelExercises,
  planWorksheet,
  worksheetLevels,
  type WorksheetTopic,
  type WorksheetCatalog,
  type WorksheetSection,
} from '@/lib/chess/worksheet';
import { practiceAccessHeaders } from '@/lib/practice-access';
import styles from '@/styles/WorksheetBuilder.module.css';
import { useEffect, useRef, useState } from 'react';

import {
  automaticReviewBlocks,
  resolveReviewBlocks,
  defaultReviewSettings,
} from '@/lib/chess/worksheet-review';
import WorksheetReviewBlocks, {
  type ReviewBlockDraft,
  type WorksheetSectionDraft,
} from './WorksheetReviewBlocks';

export default function WorksheetBuilder({
  topics: worksheetTopics,
}: {
  topics: WorksheetTopic[];
}) {
  const [catalog, setCatalog] = useState<WorksheetCatalog>({});
  const [sections, setSections] = useState<WorksheetSectionDraft[]>(() =>
    worksheetTopics.length
      ? [{ id: 1, topic: worksheetTopics[0].id, level: 'Beginner', count: '6' }]
      : []
  );
  const nextId = useRef(2);
  const unusedTopics = worksheetTopics.filter(
    (topic) => !sections.some((section) => section.topic === topic.id)
  );
  const [bookMode, setBookMode] = useState(true);
  const [book, setBook] = useState(defaultBookOptions);
  const [bookDraft, setBookDraft] = useState(defaultBookOptions);
  const [bookEditorOpen, setBookEditorOpen] = useState(false);
  const bookDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!bookEditorOpen) return;
    const dialog = bookDialog.current;
    if (!dialog) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [bookEditorOpen]);
  const [reviewOverrides, setReviewOverrides] = useState<ReviewBlockDraft[]>(
    []
  );
  const [reviewSettings, setReviewSettings] = useState(defaultReviewSettings);
  let scheduleError = '';
  let automaticBlocks: ReviewBlockDraft[] = [];
  try {
    automaticBlocks = automaticReviewBlocks(sections, reviewSettings);
  } catch (e) {
    scheduleError = (e as Error).message;
  }
  const reviewBlocks = resolveReviewBlocks(
    automaticBlocks,
    reviewOverrides,
    reviewSettings.enabled
  );
  const [reuseReview, setReuseReview] = useState(false);
  const [shuffleReview, setShuffleReview] = useState(true);
  const [title, setTitle] = useState('BÀI TẬP CHIẾN THUẬT CỜ VUA');
  const [watermark, setWatermark] = useState('LIMA Chess');
  const [footer, setFooter] = useState({ ...defaultWorksheetFooter });
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{
    worksheet: string;
    answers: string;
  } | null>(null);
  const [preview, setPreview] = useState<'worksheet' | 'answers'>('worksheet');
  const [retry, setRetry] = useState(0);
  useEffect(
    () => () => {
      if (result) {
        URL.revokeObjectURL(result.worksheet);
        URL.revokeObjectURL(result.answers);
      }
    },
    [result]
  );
  const pending = worksheetTopics.filter(
    (t) =>
      [
        ...sections,
        ...(bookMode ? reviewBlocks.flatMap((b) => b.rows) : []),
      ].some((s) => s.topic === t.id) && !catalog[t.id]
  );
  const pendingKey = pending.map((t) => t.id).join(',');
  useEffect(() => {
    if (!pendingKey) {
      setLoading('');
      return;
    }
    const controller = new AbortController();
    setLoading('Đang tải thế cờ…');
    setError('');
    Promise.all(
      pendingKey.split(',').map(async (id) => {
        const topic = worksheetTopics.find((t) => t.id === id)!;
        const res = await fetch(topic.endpoint, {
          headers: practiceAccessHeaders(),
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!res.ok)
          throw new Error(
            res.status === 401
              ? 'Phiên truy cập đã hết hạn. Mở lại thư viện để đăng nhập.'
              : 'Không tải được chủ đề. Hãy thử lại.'
          );
        const data: { categories: DrawCategory[] } = await res.json();
        return [topic.id, data.categories.flatMap((c) => c.exercises)] as const;
      })
    )
      .then((entries) => {
        if (!controller.signal.aborted)
          setCatalog((c) => ({ ...c, ...Object.fromEntries(entries) }));
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading('');
      });
    return () => controller.abort();
  }, [pendingKey, retry, worksheetTopics]);
  const change = (id: number, patch: Partial<WorksheetSectionDraft>) => {
    setResult(null);
    setSections((s) =>
      s.map((row) => (row.id === id ? { ...row, ...patch } : row))
    );
  };
  const move = (index: number, direction: number) => {
    setResult(null);
    setSections((s) => {
      const rows = [...s];
      [rows[index], rows[index + direction]] = [
        rows[index + direction],
        rows[index],
      ];
      return rows;
    });
  };
  let validation = '';
  let pages: ReturnType<typeof planWorksheet> = [];
  try {
    if (bookMode && scheduleError) throw new Error(scheduleError);
    const chapterRows = sections.map((section) => ({
      ...section,
      count: section.count.trim() === '' ? NaN : Number(section.count),
    }));
    pages = bookMode
      ? planWorksheetBookBlocks(
          chapterRows,
          reviewBlocks.map((block) => ({
            ...block,
            rows: block.rows.map((row) => ({
              ...row,
              count: row.count.trim() === '' ? NaN : Number(row.count),
            })),
          })),
          catalog,
          worksheetTopics,
          reuseReview,
          1,
          shuffleReview
        )
      : planWorksheet(chapterRows, catalog, worksheetTopics);
  } catch (e) {
    validation = (e as Error).message;
  }
  const exerciseCount = pages.reduce(
    (total, page) => total + page.exercises.length,
    0
  );
  async function generate() {
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const { createWorksheetPdfs } = await import('@/lib/chess/worksheet-pdf');
      const files = await createWorksheetPdfs(
        pages,
        title,
        footer,
        watermark,
        bookMode ? book : undefined
      );
      setResult({
        worksheet: URL.createObjectURL(
          new Blob([files.worksheet as BlobPart], { type: 'application/pdf' })
        ),
        answers: URL.createObjectURL(
          new Blob([files.answers as BlobPart], { type: 'application/pdf' })
        ),
      });
    } catch (e) {
      setError((e as Error).message || 'Không tạo được PDF. Vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={styles.builder}>
      <div className={styles.header}>
        <div>
          <h1>Tạo phiếu bài tập</h1>
          <p>
            Chọn chủ đề và mức độ, sắp xếp thứ tự, rồi tải bài tập và lời giải
            riêng.
          </p>
        </div>
        <fieldset className={styles.mode} disabled={busy}>
          <legend>Định dạng</legend>
          <div className={styles.modeOptions}>
            {[
              { value: true, label: 'Sách bài tập A4' },
              { value: false, label: 'Phiếu bài tập A4' },
            ].map((option) => (
              <label
                key={option.label}
                className={
                  bookMode === option.value ? styles.selectedMode : undefined
                }
              >
                <input
                  type="radio"
                  name="worksheet-format"
                  value={option.value ? 'book' : 'worksheet'}
                  checked={bookMode === option.value}
                  onChange={() => {
                    setBookMode(option.value);
                    setResult(null);
                  }}
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>
      </div>
      <fieldset disabled={busy}>
        <div className={styles.headingSettings}>
          <label className={styles.title}>
            {bookMode ? 'Tên sách' : 'Tên phiếu'}
            <input
              maxLength={80}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setResult(null);
              }}
            />
          </label>
          <label>
            Chữ chìm (watermark)
            <input
              maxLength={60}
              value={watermark}
              placeholder="Để trống để tắt"
              aria-describedby="watermark-help"
              onChange={(e) => {
                setWatermark(e.target.value);
                setResult(null);
              }}
            />
            <small id="watermark-help">
              In mờ ở lề phải, không che bàn cờ. Để trống để tắt.
            </small>
          </label>
        </div>
        <div className={styles.footerSettings}>
          <label>
            Tên ở chân trang
            <input
              maxLength={30}
              value={footer.name}
              onChange={(e) => {
                setFooter((f) => ({ ...f, name: e.target.value }));
                setResult(null);
              }}
            />
          </label>
          <label>
            Số điện thoại
            <input
              type="tel"
              maxLength={25}
              value={footer.phone}
              onChange={(e) => {
                setFooter((f) => ({ ...f, phone: e.target.value }));
                setResult(null);
              }}
            />
          </label>
          <label>
            Địa chỉ
            <input
              maxLength={100}
              value={footer.address}
              onChange={(e) => {
                setFooter((f) => ({ ...f, address: e.target.value }));
                setResult(null);
              }}
            />
          </label>
        </div>
        {bookMode && (
          <section className={styles.bookSettings}>
            <button
              type="button"
              aria-haspopup="dialog"
              onClick={() => {
                setBookDraft(book);
                setBookEditorOpen(true);
              }}
            >
              Chỉnh sửa trang mở đầu và kết thúc
            </button>
            <dialog
              ref={bookDialog}
              className={styles.bookDialog}
              aria-labelledby="book-pages-dialog-title"
              aria-describedby="book-pages-dialog-help"
              onCancel={() => setBookEditorOpen(false)}
              onClose={() => setBookEditorOpen(false)}
            >
              <div className={styles.dialogHeader}>
                <h2 id="book-pages-dialog-title">Trang mở đầu và kết thúc</h2>
                <button
                  type="button"
                  aria-label="Đóng chỉnh sửa trang"
                  title="Đóng"
                  onClick={() => setBookEditorOpen(false)}
                >
                  ×
                </button>
              </div>
              <div className={styles.dialogBody}>
                <p id="book-pages-dialog-help">
                  Sách có trang bìa riêng. Để trống nội dung nếu không cần phần
                  mở đầu hoặc kết thúc.
                </p>
                <label className={styles.guideToggle}>
                  <input
                    type="checkbox"
                    checked={bookDraft.showLevelGuide ?? false}
                    onChange={(e) =>
                      setBookDraft((b) => ({
                        ...b,
                        showLevelGuide: e.target.checked,
                      }))
                    }
                  />
                  Hiện lộ trình cấp độ và gợi ý luyện tiếp
                </label>
                <p>
                  Lộ trình xuất hiện ở trang mở đầu và lời kết, kèm các cấp độ
                  có trong sách này.
                </p>
                {(['introduction', 'closing'] as const).map((key) => (
                  <section key={key} className={styles.pageEditor}>
                    <h3>{key === 'introduction' ? 'Lời mở đầu' : 'Lời kết'}</h3>
                    <label>
                      Tiêu đề
                      <input
                        maxLength={80}
                        value={bookDraft[key].title}
                        aria-label={
                          key === 'introduction'
                            ? 'Tiêu đề mở đầu'
                            : 'Tiêu đề lời kết'
                        }
                        onChange={(e) =>
                          setBookDraft((b) => ({
                            ...b,
                            [key]: { ...b[key], title: e.target.value },
                          }))
                        }
                      />
                    </label>
                    <label>
                      Nội dung
                      <textarea
                        rows={6}
                        maxLength={20000}
                        value={bookDraft[key].body}
                        aria-label={
                          key === 'introduction'
                            ? 'Nội dung mở đầu'
                            : 'Nội dung lời kết'
                        }
                        onChange={(e) =>
                          setBookDraft((b) => ({
                            ...b,
                            [key]: { ...b[key], body: e.target.value },
                          }))
                        }
                      />
                    </label>
                  </section>
                ))}
              </div>
              <div className={styles.dialogActions}>
                <button type="button" onClick={() => setBookEditorOpen(false)}>
                  Hủy
                </button>
                <button
                  type="button"
                  className={styles.primary}
                  onClick={() => {
                    setBook(bookDraft);
                    setResult(null);
                    setBookEditorOpen(false);
                  }}
                >
                  Lưu thay đổi
                </button>
              </div>
            </dialog>
            <h2>Các phần bài tập</h2>
          </section>
        )}
        <ol className={styles.sections}>
          {sections.map((row, index) => {
            const available = catalog[row.topic]
              ? levelExercises(catalog[row.topic]!, row.level).length
              : null;
            return (
              <li key={row.id}>
                <span className={styles.number}>{index + 1}</span>
                <label>
                  Chủ đề
                  <select
                    aria-label={`Chủ đề phần ${index + 1}`}
                    value={row.topic}
                    onChange={(e) =>
                      change(row.id, {
                        topic: e.target.value as WorksheetSection['topic'],
                      })
                    }
                  >
                    {worksheetTopics
                      .filter(
                        (topic) =>
                          topic.id === row.topic ||
                          !sections.some(
                            (section) => section.topic === topic.id
                          )
                      )
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title}
                        </option>
                      ))}
                  </select>
                </label>
                <label>
                  Mức độ
                  <select
                    aria-label={`Mức độ phần ${index + 1}`}
                    value={row.level}
                    onChange={(e) =>
                      change(row.id, {
                        level: e.target.value as WorksheetSection['level'],
                      })
                    }
                  >
                    {worksheetLevels.map((l) => (
                      <option key={l} value={l}>
                        {l}
                        {l === 'Beginner' ? ' (Nhập môn)' : ''}
                        {catalog[row.topic]
                          ? ` · ${levelExercises(catalog[row.topic]!, l).length} thế`
                          : ''}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Số thế
                  <input
                    type="number"
                    min={1}
                    value={row.count}
                    onBlur={() => {
                      if (
                        row.count.trim() &&
                        Number.isFinite(Number(row.count)) &&
                        row.count !== String(Number(row.count))
                      ) {
                        change(row.id, { count: String(Number(row.count)) });
                      }
                    }}
                    onChange={(e) => change(row.id, { count: e.target.value })}
                  />
                </label>
                <div className={styles.actions}>
                  <button
                    title="Đưa lên"
                    aria-label={`Đưa phần ${index + 1} lên`}
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    ↑
                  </button>
                  <button
                    title="Đưa xuống"
                    aria-label={`Đưa phần ${index + 1} xuống`}
                    disabled={index === sections.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    ↓
                  </button>
                  <button
                    title="Xóa phần"
                    aria-label={`Xóa phần ${index + 1}`}
                    onClick={() => {
                      setResult(null);
                      setSections((s) => s.filter((r) => r.id !== row.id));
                    }}
                  >
                    ×
                  </button>
                </div>
                <small>
                  {available === null ? 'Đang tải…' : `${available} thế có sẵn`}
                  {available === 0 ? ' · Mức này chưa có bài phù hợp.' : ''}
                </small>
              </li>
            );
          })}
        </ol>
        <button
          disabled={!unusedTopics.length}
          title={!unusedTopics.length ? 'Đã thêm tất cả chủ đề.' : undefined}
          onClick={() => {
            const topic = unusedTopics[0];
            if (!topic) return;
            setResult(null);
            setSections((s) => [
              ...s,
              {
                id: nextId.current++,
                topic: topic.id,
                level: 'A',
                count: '6',
              },
            ]);
          }}
        >
          + Thêm phần
        </button>
        {worksheetTopics.length > 0 && !unusedTopics.length && (
          <p role="status">Đã thêm tất cả chủ đề.</p>
        )}
        {bookMode && (
          <section className={styles.bookSettings}>
            <h2>Ôn tập tổng hợp</h2>
            <p>Chọn Tùy chỉnh ôn tập để đổi chủ đề, cấp độ và số thế.</p>
            <WorksheetReviewBlocks
              sourceOptions={
                <>
                  <label className={styles.guideToggle}>
                    <input
                      type="checkbox"
                      checked={!reuseReview}
                      aria-describedby="review-source-help"
                      onChange={(e) => {
                        setReuseReview(!e.target.checked);
                        setResult(null);
                      }}
                    />
                    Dùng thế cờ mới
                  </label>
                  <label className={styles.guideToggle}>
                    <input
                      type="checkbox"
                      checked={shuffleReview}
                      onChange={(e) => {
                        setShuffleReview(e.target.checked);
                        setResult(null);
                      }}
                    />
                    Trộn thứ tự bài
                  </label>
                </>
              }
              sourceHelp={
                reuseReview
                  ? 'Ôn lại thế cờ từ các chương trước.'
                  : 'Dùng thế cờ chưa xuất hiện trong sách.'
              }
              sections={sections}
              topics={worksheetTopics}
              catalog={catalog}
              blocks={reviewBlocks}
              automatic={automaticBlocks}
              overrides={reviewOverrides}
              settings={reviewSettings}
              onSettings={(settings) => {
                setReviewSettings(settings);
                setResult(null);
              }}
              nextId={() => nextId.current++}
              onChange={(blocks) => {
                setReviewOverrides(blocks);
                setResult(null);
              }}
            />
            {validation && !loading && <p role="status">{validation}</p>}
          </section>
        )}
      </fieldset>
      <div aria-live="polite">
        {loading ||
          (!validation &&
            `${pages.length} trang bài tập · ${pages.reduce((n, p) => n + p.exercises.length, 0)} thế cờ`)}
      </div>
      {error && (
        <p role="alert">
          {error}{' '}
          <button onClick={() => setRetry((r) => r + 1)}>Thử tải lại</button>
        </p>
      )}
      <button
        className={styles.primary}
        disabled={busy || !!loading || !!validation}
        onClick={generate}
      >
        {busy ? 'Đang tạo PDF…' : 'Tạo PDF'}
      </button>
      {!validation && exerciseCount > 120 && (
        <p role="status">
          Tài liệu có {exerciseCount} thế cờ. Việc tạo PDF bài tập và lời giải
          có thể mất nhiều thời gian hơn, nhất là trên điện thoại. Bạn vẫn có
          thể tạo đầy đủ tài liệu.
        </p>
      )}
      {result && (
        <section className={styles.result}>
          <div className={styles.downloads}>
            <a href={result.worksheet} download="LIMA-Chess-Bai-tap.pdf">
              {bookMode ? 'Tải sách bài tập PDF' : 'Tải bài tập PDF'}
            </a>
            <a href={result.answers} download="LIMA-Chess-Loi-giai.pdf">
              {bookMode ? 'Tải sách lời giải PDF' : 'Tải lời giải PDF'}
            </a>
            <label>
              Xem trước
              <select
                value={preview}
                onChange={(e) => setPreview(e.target.value as typeof preview)}
              >
                <option value="worksheet">Bài tập</option>
                <option value="answers">Lời giải</option>
              </select>
            </label>
          </div>
          <iframe
            title={
              preview === 'worksheet'
                ? 'Xem trước bài tập PDF'
                : 'Xem trước lời giải PDF'
            }
            src={result[preview]}
          />
          <p>
            Nếu thiết bị không hiện bản xem trước, hãy tải PDF để mở. Khi in,
            chọn A4 và kích thước thực (100%).{' '}
            {bookMode && 'In hai mặt, lật cạnh dài để đóng sách bên trái.'}
          </p>
        </section>
      )}
    </div>
  );
}
