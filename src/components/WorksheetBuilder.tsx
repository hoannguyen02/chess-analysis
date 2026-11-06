import { POSITIONS_PER_PAGE } from '@/lib/chess/worksheet-layout';
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
  type WorksheetLevel,
} from '@/lib/chess/worksheet';
import {
  availableWorksheetLevels,
  eligibleWorksheetTopics,
  expandWorksheetTopics,
  defaultWorksheetCount,
  type WorksheetTopicDraft,
} from '@/lib/chess/worksheet-selection';
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
} from './WorksheetReviewBlocks';

export default function WorksheetBuilder({
  topics: worksheetTopics,
}: {
  topics: WorksheetTopic[];
}) {
  const [catalog, setCatalog] = useState<WorksheetCatalog>({});
  const [sections, setSections] = useState<WorksheetTopicDraft[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<WorksheetLevel[]>([]);
  const initialTopicChosen = useRef(false);
  const nextId = useRef(1);
  const eligibleTopics = eligibleWorksheetTopics(
    worksheetTopics,
    selectedLevels,
    catalog
  );
  const unusedTopics = eligibleTopics.filter(
    (topic) => !sections.some((section) => section.topic === topic.id)
  );
  const chapterSections = expandWorksheetTopics(
    sections,
    selectedLevels,
    catalog
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
  let reviewBlocks: ReviewBlockDraft[] = [];
  try {
    automaticBlocks = automaticReviewBlocks(chapterSections, reviewSettings);
    reviewBlocks = resolveReviewBlocks(
      automaticBlocks,
      reviewOverrides,
      reviewSettings.enabled
    );
  } catch (e) {
    scheduleError = (e as Error).message;
  }
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
  const sourcesKey = worksheetTopics
    .map((t) => `${t.id}:${t.endpoint}`)
    .join(',');
  useEffect(() => {
    if (!sourcesKey) return;
    const controller = new AbortController();
    setLoading('Đang tải chủ đề và cấp độ…');
    setResult(null);
    setError('');
    const entries: [string, DrawCategory['exercises']][] = [];
    const failed: string[] = [];
    const queue = [...worksheetTopics];
    const worker = async () => {
      while (queue.length && !controller.signal.aborted) {
        const topic = queue.shift()!;
        try {
          const res = await fetch(topic.endpoint, {
            headers: practiceAccessHeaders(),
            cache: 'no-store',
            signal: controller.signal,
          });
          if (!res.ok)
            throw new Error(
              res.status === 401
                ? 'Phiên truy cập đã hết hạn. Mở lại thư viện để đăng nhập.'
                : `Không tải được chủ đề: ${topic.title}.`
            );
          const data: { categories: DrawCategory[] } = await res.json();
          entries.push([topic.id, data.categories.flatMap((c) => c.exercises)]);
        } catch (e) {
          if (!controller.signal.aborted) failed.push((e as Error).message);
        }
      }
    };
    Promise.all(Array.from({ length: Math.min(4, queue.length) }, worker)).then(
      () => {
        if (controller.signal.aborted) return;
        setCatalog(Object.fromEntries(entries));
        setError(
          failed.length
            ? `${failed[0]}${failed.length > 1 ? ` (${failed.length} chủ đề chưa tải được.)` : ''}`
            : ''
        );
        setLoading('');
      }
    );
    return () => controller.abort();
  }, [sourcesKey, retry, worksheetTopics]);
  useEffect(() => {
    if (initialTopicChosen.current || !eligibleTopics.length) return;
    initialTopicChosen.current = true;
    const topic = eligibleTopics[0];
    setSections([
      {
        id: nextId.current++,
        topic: topic.id,
        count: defaultWorksheetCount,
      },
    ]);
  }, [eligibleTopics, selectedLevels, catalog]);
  const change = (id: number, patch: Partial<WorksheetTopicDraft>) => {
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
    if (sections.some((s) => !catalog[s.topic]))
      throw new Error('Chờ tải xong chủ đề trước khi tạo PDF.');
    if (!selectedLevels.length) throw new Error('Chọn ít nhất một cấp độ.');
    const unavailable = sections.find(
      (s) =>
        catalog[s.topic] &&
        !availableWorksheetLevels(s.topic, selectedLevels, catalog).length
    );
    if (unavailable)
      throw new Error(
        `${worksheetTopics.find((t) => t.id === unavailable.topic)?.title ?? unavailable.topic}: chưa đủ thế cờ cho một trang A4 ở cấp độ đã chọn. Chọn chủ đề khác hoặc xóa phần này.`
      );
    if (bookMode && scheduleError) throw new Error(scheduleError);
    const chapterRows = chapterSections.map((section) => ({
      ...section,
      count: section.count.trim() === '' ? NaN : Number(section.count),
    }));
    pages = bookMode
      ? planWorksheetBookBlocks(
          chapterRows,
          reviewBlocks.map((block) => ({
            ...block,
            pageCount:
              block.pageCount === undefined
                ? undefined
                : Number(block.pageCount),
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
            <div className={styles.bookOptions}>
              <label className={styles.guideToggle}>
                <input
                  type="checkbox"
                  checked={book.showContents ?? true}
                  onChange={(e) => {
                    setBook((b) => ({ ...b, showContents: e.target.checked }));
                    setResult(null);
                  }}
                />
                Thêm mục lục
              </label>
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
            </div>
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
                  Hiện hệ thống cấp độ và phần tự đánh giá
                </label>
                <p>
                  Bảng cấp độ ở phần mở đầu; phần tự đánh giá và nội dung luyện
                  tiếp ở trang kết thúc.
                </p>
                <label className={styles.guideToggle}>
                  <input
                    type="checkbox"
                    checked={bookDraft.showNotationGuide ?? true}
                    onChange={(e) =>
                      setBookDraft((b) => ({
                        ...b,
                        showNotationGuide: e.target.checked,
                      }))
                    }
                  />
                  Thêm hướng dẫn ký hiệu cờ vua
                </label>
                <p>
                  Trang tra cứu cột, hàng, quân cờ và cách ghi nước đi, đặt sau
                  phần mở đầu.
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
        <fieldset
          className={styles.levelFilter}
          aria-describedby="worksheet-level-help"
        >
          <legend>Cấp độ</legend>
          <div className={styles.levelChoices}>
            {worksheetLevels.map((level) => (
              <label key={level}>
                <input
                  type="checkbox"
                  checked={selectedLevels.includes(level)}
                  onChange={(e) => {
                    setSelectedLevels((current) =>
                      worksheetLevels.filter((l) =>
                        l === level ? e.target.checked : current.includes(l)
                      )
                    );
                    setResult(null);
                  }}
                />
                {level === 'Beginner' ? 'Nhập môn / Beginner' : level}
              </label>
            ))}
          </div>
          <small id="worksheet-level-help">
            Chọn một hoặc nhiều cấp độ. Chỉ hiển thị chủ đề có ít nhất{' '}
            {POSITIONS_PER_PAGE} thế cờ ở cấp độ đã chọn, đủ một trang A4. Số
            thế áp dụng cho mỗi cấp độ đủ bài.
          </small>
        </fieldset>
        {!loading && selectedLevels.length > 0 && !eligibleTopics.length && (
          <p role="status">
            Chưa có chủ đề đủ bài cho một trang A4 ở cấp độ đã chọn. Chọn cấp độ
            khác.
          </p>
        )}
        <ol className={`${styles.sections} ${styles.topicSections}`}>
          {sections.map((row, index) => {
            const availableLevels = availableWorksheetLevels(
              row.topic,
              selectedLevels,
              catalog
            );
            const unavailable = !availableLevels.length;
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
                        topic: e.target.value,
                      })
                    }
                  >
                    {unavailable && (
                      <option value={row.topic} disabled>
                        {worksheetTopics.find((t) => t.id === row.topic)
                          ?.title ?? row.topic}{' '}
                        — chưa đủ bài ở cấp độ đã chọn
                      </option>
                    )}
                    {eligibleTopics
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
                  Số thế / cấp độ
                  <input
                    aria-label={`Số thế mỗi cấp độ phần ${index + 1}`}
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
                  {availableLevels.length
                    ? availableLevels
                        .map(
                          (level) =>
                            `${level === 'Beginner' ? 'Nhập môn' : level}: ${levelExercises(catalog[row.topic]!, level).length} thế`
                        )
                        .join(' · ')
                    : 'Chưa đủ thế cờ cho một trang A4 ở cấp độ đã chọn.'}
                </small>
              </li>
            );
          })}
        </ol>
        <button
          disabled={!!loading || !unusedTopics.length}
          title={
            !unusedTopics.length
              ? 'Không còn chủ đề phù hợp để thêm.'
              : undefined
          }
          onClick={() => {
            const topic = unusedTopics[0];
            if (!topic) return;
            setResult(null);
            setSections((s) => [
              ...s,
              {
                id: nextId.current++,
                topic: topic.id,
                count: defaultWorksheetCount,
              },
            ]);
          }}
        >
          + Thêm phần
        </button>
        {!loading &&
          selectedLevels.length > 0 &&
          worksheetTopics.length > 0 &&
          !unusedTopics.length && (
            <p role="status">Không còn chủ đề phù hợp để thêm.</p>
          )}
        {bookMode && (
          <section className={styles.bookSettings}>
            <h2>Ôn tập</h2>
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
              sections={chapterSections}
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
              nextId={() => nextId.current++ * 10 + 9}
              onChange={(blocks) => {
                setReviewOverrides(blocks);
                setResult(null);
              }}
            />
            {validation && !loading && selectedLevels.length > 0 && (
              <p role="status">{validation}</p>
            )}
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
