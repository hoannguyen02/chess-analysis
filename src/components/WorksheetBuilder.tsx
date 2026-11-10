import { POSITIONS_PER_PAGE } from '@/lib/chess/worksheet-layout';
import type { DrawCategory } from '@/lib/chess/draw-practice';
import { inPracticeTeachingOrder } from '@/lib/chess/practice-topic-order';
import {
  bookFooterName,
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
import { useWorksheetDrafts } from '@/hooks/useWorksheetDrafts';
import {
  addWorksheetExport,
  captureWorksheetPositions,
  encodeWorksheetDrafts,
  makeWorksheetVersion,
  mergeWorksheetBackup,
  parseWorksheetDrafts,
  sameWorksheetChoices,
  worksheetExportDifference,
  type WorksheetDraftChoices,
  type WorksheetExportPosition,
  type WorksheetExportRecord,
  type WorksheetVersion,
} from '@/lib/chess/worksheet-drafts';
import styles from '@/styles/WorksheetBuilder.module.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import PracticeTopicSelect from './PracticeTopicSelect';

import {
  automaticReviewBlocks,
  resolveReviewBlocks,
  defaultReviewSettings,
} from '@/lib/chess/worksheet-review';
import WorksheetReviewBlocks, {
  type ReviewBlockDraft,
} from './WorksheetReviewBlocks';
import WorksheetDraftHistory from './WorksheetDraftHistory';

function preserveSavedOrder(saved: WorksheetDraftChoices) {
  return (
    saved.hasCustomOrder ||
    inPracticeTeachingOrder(saved.sections, (row) => `/${row.topic}`).some(
      (row, i) => row.id !== saved.sections[i].id
    )
  );
}

export default function WorksheetBuilder({
  topics,
}: {
  topics: WorksheetTopic[];
}) {
  const drafts = useWorksheetDrafts();
  const restored = drafts.initial?.choices;
  const [referenceId, setReferenceId] = useState(drafts.initial?.referenceId);
  const worksheetTopics = useMemo(
    () => inPracticeTeachingOrder(topics, (topic) => `/${topic.id}`),
    [topics]
  );
  const [catalog, setCatalog] = useState<WorksheetCatalog>({});
  const [draftSections, setSections] = useState<WorksheetTopicDraft[]>(
    restored?.sections ?? []
  );
  const [hasCustomOrder, setHasCustomOrder] = useState(() =>
    restored ? preserveSavedOrder(restored) : false
  );
  const sections = useMemo(
    () =>
      hasCustomOrder
        ? draftSections
        : inPracticeTeachingOrder(draftSections, (row) => `/${row.topic}`),
    [draftSections, hasCustomOrder]
  );
  const [selectedLevels, setSelectedLevels] = useState<WorksheetLevel[]>(
    restored?.levels ?? []
  );
  const initialTopicChosen = useRef(restored?.initialTopicChosen ?? false);
  const nextId = useRef(restored?.nextId ?? 1);
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
  const [bookMode, setBookMode] = useState(restored?.bookMode ?? true);
  const [book, setBook] = useState(() => {
    if (restored) return restored.book;
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return {
      ...defaultBookOptions,
      compilation: {
        ...defaultBookOptions.compilation,
        date: `${today.getFullYear()}-${month}-${day}`,
      },
    };
  });
  const [bookDraft, setBookDraft] = useState(book);
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
    restored?.reviewOverrides ?? []
  );
  const [reviewSettings, setReviewSettings] = useState(
    restored?.reviewSettings ?? defaultReviewSettings
  );
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
  const [reuseReview, setReuseReview] = useState(
    restored?.reuseReview ?? false
  );
  const [shuffleReview, setShuffleReview] = useState(
    restored?.shuffleReview ?? true
  );
  const [title, setTitle] = useState(
    restored?.title ?? 'BÀI TẬP CHIẾN THUẬT CỜ VUA'
  );
  const [watermark, setWatermark] = useState(
    restored?.watermark ?? 'LIMA Chess'
  );
  const [footer, setFooter] = useState(
    restored?.footer ?? { ...defaultWorksheetFooter }
  );
  const choices = useMemo<WorksheetDraftChoices>(
    () => ({
      bookMode,
      title,
      watermark,
      footer,
      book,
      levels: selectedLevels,
      sections,
      hasCustomOrder,
      initialTopicChosen: initialTopicChosen.current,
      nextId: nextId.current,
      reviewSettings,
      reviewOverrides,
      reuseReview,
      shuffleReview,
    }),
    [
      bookMode,
      title,
      watermark,
      footer,
      book,
      selectedLevels,
      sections,
      hasCustomOrder,
      reviewSettings,
      reviewOverrides,
      reuseReview,
      shuffleReview,
    ]
  );
  const initialChoices = useRef(choices);
  const { saveWorking } = drafts;
  useEffect(() => {
    if (choices !== initialChoices.current || restored || referenceId)
      saveWorking(choices, referenceId);
  }, [choices, referenceId, restored, saveWorking]);
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [exportHistoryError, setExportHistoryError] = useState('');
  const unsavedExports = useRef<WorksheetVersion[]>([]);
  const [exportWarning, setExportWarning] = useState<{
    choices: WorksheetDraftChoices;
    previous: WorksheetExportRecord;
    positions: WorksheetExportPosition[];
    changed: number;
    firstChanged: number;
  }>();
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
    const rows = [...sections];
    [rows[index], rows[index + direction]] = [
      rows[index + direction],
      rows[index],
    ];
    setHasCustomOrder(true);
    setSections(rows);
  };
  let validation = '';
  let pages: ReturnType<typeof planWorksheet> = [];
  try {
    const missing = sections.find(
      (s) => !worksheetTopics.some((topic) => topic.id === s.topic)
    );
    if (missing)
      throw new Error(
        `Chủ đề ${missing.topic} đã lưu không còn trong thư viện. Hãy chọn chủ đề khác hoặc xóa phần này.`
      );
    const notLoaded = sections.find((s) => !catalog[s.topic]);
    if (notLoaded)
      throw new Error(
        loading
          ? 'Chờ tải xong chủ đề trước khi tạo PDF.'
          : `Chưa tải được chủ đề ${worksheetTopics.find((topic) => topic.id === notLoaded.topic)?.title ?? notLoaded.topic}. Hãy thử tải lại.`
      );
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
  async function openVersion(
    version: WorksheetVersion,
    entry?: WorksheetExportRecord
  ) {
    const hasWork = choices !== initialChoices.current || restored;
    if (hasWork && !sameWorksheetChoices(choices, version.choices)) {
      const saved = await drafts.updateVersions((current) =>
        current.some((item) => sameWorksheetChoices(item.choices, choices))
          ? current
          : [
              makeWorksheetVersion(
                choices,
                `Bản đang làm · ${title.trim().slice(0, 140) || 'Tài liệu cờ vua'}`
              ),
              ...current,
            ]
      );
      if (!saved) return false;
    }
    const saved = version.choices;
    initialTopicChosen.current = saved.initialTopicChosen;
    nextId.current = saved.nextId;
    setSections(saved.sections);
    setHasCustomOrder(preserveSavedOrder(saved));
    setSelectedLevels(saved.levels);
    setBookMode(saved.bookMode);
    setBook(saved.book);
    setTitle(saved.title);
    setWatermark(saved.watermark);
    setFooter(saved.footer);
    setReviewSettings(saved.reviewSettings);
    setReviewOverrides(saved.reviewOverrides);
    setReuseReview(saved.reuseReview);
    setShuffleReview(saved.shuffleReview);
    setReferenceId(entry?.id ?? version.id);
    setResult(null);
    setExportWarning(undefined);
    setExportHistoryError('');
    return true;
  }

  function exportBackup() {
    const working = {
      at:
        drafts.working && sameWorksheetChoices(drafts.working.choices, choices)
          ? drafts.working.at
          : new Date().toISOString(),
      choices,
      referenceId,
    };
    const blob = new Blob(
      [
        encodeWorksheetDrafts(working, [
          ...drafts.versions,
          ...unsavedExports.current,
        ]),
      ],
      {
        type: 'application/json',
      }
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `LIMA-Chess-ban-nhap-${working.at.slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function importBackup(file: File) {
    try {
      if (file.size > 16 * 1024 * 1024)
        throw new Error('Tệp sao lưu quá lớn để nhập.');
      const backup = parseWorksheetDrafts(await file.text());
      const imported = await drafts.updateVersions((current) =>
        mergeWorksheetBackup(current, backup)
      );
      return imported
        ? 'Đã nhập bản sao. Chọn phiên bản trong danh sách để mở.'
        : '';
    } catch (error) {
      return (error as Error).message;
    }
  }

  async function generate(acceptedPositions?: WorksheetExportPosition[]) {
    setBusy(true);
    setError('');
    setResult(null);
    setExportWarning(undefined);
    setExportHistoryError('');
    try {
      const referenceVersion = drafts.versions.find(
        (item) =>
          item.id === referenceId ||
          item.exports.some((entry) => entry.id === referenceId)
      );
      const previous =
        referenceVersion?.exports.find((entry) => entry.id === referenceId) ??
        referenceVersion?.exports.at(-1) ??
        drafts.versions
          .find(
            (item) =>
              item.exports.length && sameWorksheetChoices(item.choices, choices)
          )
          ?.exports.at(-1);
      let positions: WorksheetExportPosition[] | undefined;
      try {
        positions = await captureWorksheetPositions(pages);
      } catch {
        if (previous)
          throw new Error(
            'Chưa đối chiếu được danh sách thế cờ với bản đã xuất. Hãy thử lại.'
          );
        setExportHistoryError(
          'Trình duyệt chưa ghi được danh sách thế cờ cho lần xuất này.'
        );
      }
      if (positions && previous) {
        const difference = worksheetExportDifference(
          previous.positions,
          positions
        );
        if (
          difference.changed &&
          (!acceptedPositions ||
            worksheetExportDifference(acceptedPositions, positions).changed)
        ) {
          setExportWarning({ choices, previous, positions, ...difference });
          return;
        }
      }
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
      if (positions) {
        const entry = {
          id: crypto.randomUUID(),
          at: new Date().toISOString(),
          positions,
        };
        const saved = await drafts.updateVersions((current) =>
          addWorksheetExport(current, choices, entry, referenceVersion?.id)
        );
        if (saved) setReferenceId(entry.id);
        else {
          unsavedExports.current = addWorksheetExport(
            unsavedExports.current,
            choices,
            entry
          );
          setExportHistoryError(
            'Đã tạo PDF. Trình duyệt chưa lưu được danh sách thế cờ. Hãy xuất bản sao JSON để giữ danh sách của lần xuất này.'
          );
        }
      }
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
            Chọn cấp độ và chủ đề. Các phần mặc định xếp theo thứ tự học. Dùng
            nút mũi tên để đổi chỗ.
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
        <WorksheetDraftHistory
          choices={choices}
          versions={drafts.versions}
          savedAt={drafts.working?.at}
          draftError={drafts.draftError}
          historyError={drafts.historyError}
          busy={busy}
          onSave={async (name) =>
            Boolean(
              await drafts.updateVersions((current) => [
                makeWorksheetVersion(choices, name),
                ...current,
              ])
            )
          }
          onOpen={openVersion}
          onExport={exportBackup}
          onImport={importBackup}
        />
        <div className={styles.footerSettings}>
          <label>
            Tên ở chân trang
            <input
              maxLength={30}
              value={bookMode ? bookFooterName(footer.name) : footer.name}
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
              <label className={styles.guideToggle}>
                <input
                  type="checkbox"
                  checked={book.showAddressOnEveryPage ?? false}
                  onChange={(e) => {
                    setBook((b) => ({
                      ...b,
                      showAddressOnEveryPage: e.target.checked,
                    }));
                    setResult(null);
                  }}
                />
                Hiện địa chỉ trên mỗi trang
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
                <section
                  className={styles.pageEditor}
                  aria-labelledby="book-compilation-title"
                >
                  <h3 id="book-compilation-title">Thông tin tài liệu</h3>
                  <div className={styles.compilationFields}>
                    <label>
                      Ngày ghi trên tài liệu
                      <input
                        type="date"
                        value={bookDraft.compilation?.date ?? ''}
                        onChange={(e) =>
                          setBookDraft((b) => ({
                            ...b,
                            compilation: {
                              ...b.compilation,
                              date: e.target.value,
                            },
                          }))
                        }
                      />
                    </label>
                    <label>
                      Phiên bản
                      <input
                        maxLength={30}
                        value={bookDraft.compilation?.version ?? ''}
                        onChange={(e) =>
                          setBookDraft((b) => ({
                            ...b,
                            compilation: {
                              ...b.compilation,
                              version: e.target.value,
                            },
                          }))
                        }
                      />
                    </label>
                  </div>
                  <label className={styles.guideToggle}>
                    <input
                      type="checkbox"
                      checked={bookDraft.compilation?.internalOnly ?? false}
                      onChange={(e) =>
                        setBookDraft((b) => ({
                          ...b,
                          compilation: {
                            ...b.compilation,
                            internalOnly: e.target.checked,
                          },
                        }))
                      }
                    />
                    Lưu hành nội bộ
                  </label>
                  <small>Dùng chung cho sách bài tập và sách lời giải.</small>
                </section>
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
            const topicOptions = eligibleTopics
              .filter(
                (topic) =>
                  topic.id === row.topic ||
                  !sections.some((section) => section.topic === topic.id)
              )
              .map(({ id, title }) => ({
                value: id,
                label: title,
                scope: `/${id}`,
                disabled: false,
              }));
            if (unavailable) {
              const title =
                worksheetTopics.find((t) => t.id === row.topic)?.title ??
                row.topic;
              topicOptions.push({
                value: row.topic,
                label: `${title} — chưa đủ bài ở cấp độ đã chọn`,
                scope: `/${row.topic}`,
                disabled: true,
              });
            }
            return (
              <li key={row.id}>
                <span className={styles.number}>{index + 1}</span>
                <PracticeTopicSelect
                  label="Chủ đề"
                  ariaLabel={`Chủ đề phần ${index + 1}`}
                  value={row.topic}
                  options={topicOptions}
                  onChange={(topic) => change(row.id, { topic })}
                />
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
      {!bookMode && validation && !loading && selectedLevels.length > 0 && (
        <p role="status">{validation}</p>
      )}
      {exportHistoryError && <p role="status">{exportHistoryError}</p>}
      <button
        className={styles.primary}
        disabled={busy || !!loading || !!validation}
        onClick={() => generate()}
      >
        {busy ? 'Đang tạo PDF…' : 'Tạo PDF'}
      </button>
      {exportWarning?.choices === choices && !validation && !loading && (
        <div className={styles.draftWarning} role="status">
          <p>
            Danh sách hiện tại khác bản đã xuất. Bản đã xuất có{' '}
            {exportWarning.previous.positions.length} thế, danh sách hiện tại có{' '}
            {exportWarning.positions.length} thế. Có {exportWarning.changed} mục
            khác, bắt đầu từ bài {exportWarning.firstChanged}. Bạn có thể xem
            lại danh sách cũ trong lịch sử phiên bản.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => generate(exportWarning.positions)}
          >
            Tạo PDF với danh sách hiện tại
          </button>
        </div>
      )}
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
