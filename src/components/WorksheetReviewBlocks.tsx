import type {
  WorksheetCatalog,
  WorksheetSection,
  WorksheetTopic,
} from '@/lib/chess/worksheet';
import { levelExercises, worksheetLevels } from '@/lib/chess/worksheet';
import styles from '@/styles/WorksheetBuilder.module.css';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import type {
  ReviewBlockDraft,
  ReviewSettings,
  WorksheetSectionDraft,
} from '@/lib/chess/worksheet-review';
export type {
  ReviewBlockDraft,
  WorksheetSectionDraft,
} from '@/lib/chess/worksheet-review';

export default function WorksheetReviewBlocks({
  sourceOptions,
  sourceHelp,
  sections,
  topics,
  catalog,
  blocks,
  automatic,
  overrides,
  settings,
  onSettings,
  onChange,
  nextId,
}: {
  sourceOptions: ReactNode;
  sourceHelp: string;
  sections: WorksheetSectionDraft[];
  topics: WorksheetTopic[];
  catalog: WorksheetCatalog;
  blocks: ReviewBlockDraft[];
  automatic: ReviewBlockDraft[];
  overrides: ReviewBlockDraft[];
  settings: ReviewSettings;
  onSettings: (settings: ReviewSettings) => void;
  onChange: (blocks: ReviewBlockDraft[]) => void;
  nextId: () => number;
}) {
  const topicName = (id: string) =>
    topics.find((t) => t.id === id)?.title ?? id;
  const [session, setSession] = useState<{
    blocks: ReviewBlockDraft[];
    overrides: ReviewBlockDraft[];
  } | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const draft =
    session?.blocks.find((b) => b.id === selectedId) ?? session?.blocks[0];
  const dialog = useRef<HTMLDialogElement>(null);
  const editorOpen = session !== null;
  useEffect(() => {
    if (!editorOpen) return;
    const element = dialog.current!;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element.showModal();
    return () => {
      element.close();
      document.body.style.overflow = overflow;
    };
  }, [editorOpen]);
  const update = (id: number, patch: Partial<ReviewBlockDraft>) =>
    setSession((current) => {
      if (!current) return current;
      const block = current.blocks.find((b) => b.id === id);
      if (!block) return current;
      const changed = { ...block, ...patch };
      return {
        blocks: current.blocks.map((b) => (b.id === id ? changed : b)),
        overrides: [...current.overrides.filter((b) => b.id !== id), changed],
      };
    });
  const needsAttention = (block: ReviewBlockDraft) => {
    const anchor = sections.findIndex((s) => s.id === block.afterSectionId);
    return (
      anchor < 0 ||
      !automatic.some((b) => b.id === block.id) ||
      block.rows.some(
        (r) => !sections.slice(0, anchor + 1).some((s) => s.topic === r.topic)
      )
    );
  };
  const configure = (patch: Partial<ReviewSettings>) =>
    onSettings({ ...settings, ...patch });
  return (
    <>
      <div className={styles.reviewToggleRow}>
        <label className={styles.guideToggle}>
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => configure({ enabled: e.target.checked })}
          />
          Tự động chèn ôn tập
        </label>
        {sourceOptions}
      </div>
      <small id="review-source-help" className={styles.reviewHelp}>
        {sourceHelp}
      </small>
      <fieldset disabled={!settings.enabled} className={styles.reviewSettings}>
        <label>
          Sau mỗi (chủ đề)
          <input
            type="number"
            min={1}
            value={settings.interval}
            onChange={(e) => configure({ interval: e.target.value })}
          />
        </label>
        <label>
          Số thế mỗi chủ đề
          <input
            type="number"
            min={1}
            value={settings.count}
            onChange={(e) => configure({ count: e.target.value })}
          />
        </label>
        <div>
          <label className={styles.guideToggle}>
            <input
              type="checkbox"
              checked={settings.cumulative}
              aria-describedby="review-scope-help"
              onChange={(e) => configure({ cumulative: e.target.checked })}
            />
            Ôn tập tích lũy
          </label>
          <small id="review-scope-help">
            {settings.cumulative
              ? 'Tất cả chủ đề đã học.'
              : 'Chỉ nhóm chủ đề vừa học.'}
          </small>
        </div>
      </fieldset>
      <div className={styles.reviewFinalRow}>
        <label className={styles.guideToggle}>
          <input
            type="checkbox"
            checked={settings.final}
            disabled={!settings.enabled}
            onChange={(e) => configure({ final: e.target.checked })}
          />
          Ôn tập tổng hợp cuối sách
        </label>
        <button
          aria-haspopup="dialog"
          disabled={!settings.enabled || !blocks.length}
          onClick={() => {
            setSelectedId(blocks[0].id);
            setSession({
              blocks: blocks.map((b) => ({
                ...b,
                rows: b.rows.map((r) => ({ ...r })),
              })),
              overrides: overrides.map((b) => ({
                ...b,
                rows: b.rows.map((r) => ({ ...r })),
              })),
            });
          }}
        >
          Tùy chỉnh ôn tập
        </button>
      </div>
      <small className={styles.reviewHelp}>
        Cấp độ theo chương. Ôn tập cuối sách gồm tất cả chủ đề.
      </small>
      {blocks.some(needsAttention) && (
        <p role="status">
          Có phần ôn tập cần kiểm tra chủ đề hoặc vị trí. Mở Tùy chỉnh ôn tập để
          điều chỉnh.
        </p>
      )}
      {session && (
        <dialog
          ref={dialog}
          className={`${styles.bookDialog} ${styles.reviewDialog}`}
          aria-labelledby="review-dialog-title"
          onCancel={() => setSession(null)}
        >
          <div className={styles.dialogHeader}>
            <h2 id="review-dialog-title">Tùy chỉnh ôn tập</h2>
            <button
              aria-label="Đóng tùy chỉnh ôn tập"
              title="Đóng"
              onClick={() => setSession(null)}
            >
              ×
            </button>
          </div>
          <div className={styles.dialogBody}>
            <label className={styles.reviewPicker}>
              Phần ôn tập
              <select
                aria-label="Phần ôn tập"
                value={draft?.id ?? ''}
                onChange={(e) => setSelectedId(Number(e.target.value))}
              >
                {session.blocks.map((b, i) => (
                  <option key={b.id} value={b.id}>
                    Ôn tập {i + 1} · Sau chủ đề{' '}
                    {sections.findIndex((s) => s.id === b.afterSectionId) + 1} ·{' '}
                    {b.rows.reduce((n, r) => n + (Number(r.count) || 0), 0)} thế
                    {needsAttention(b) ? ' · Cần kiểm tra' : ''}
                  </option>
                ))}
              </select>
            </label>
            {draft && session.overrides.some((b) => b.id === draft.id) && (
              <button
                onClick={() => {
                  const original = automatic.find((b) => b.id === draft.id);
                  setSession({
                    blocks: original
                      ? session.blocks.map((b) =>
                          b.id === draft.id ? original : b
                        )
                      : session.blocks.filter((b) => b.id !== draft.id),
                    overrides: session.overrides.filter(
                      (b) => b.id !== draft.id
                    ),
                  });
                }}
              >
                {automatic.some((b) => b.id === draft.id)
                  ? 'Khôi phục theo thiết lập chung'
                  : 'Xóa phần ngoài lịch'}
              </button>
            )}
            {(draft ? [draft] : []).map((block) => {
              const blockIndex = blocks.findIndex((b) => b.id === block.id);
              const anchor = sections.findIndex(
                (s) => s.id === block.afterSectionId
              );
              const preceding = sections.slice(0, anchor + 1);
              const eligible = topics.filter((t) =>
                preceding.some((s) => s.topic === t.id)
              );
              const unused = eligible.filter(
                (t) => !block.rows.some((r) => r.topic === t.id)
              );
              const setRows = (rows: WorksheetSectionDraft[]) =>
                update(block.id, { rows });
              return (
                <section
                  className={styles.reviewBlock}
                  key={block.id}
                  aria-label={`Khối ôn tập ${blockIndex + 1}`}
                >
                  <label>
                    Vị trí trong sách
                    <select
                      aria-label={`Vị trí khối ôn tập ${blockIndex + 1}`}
                      value={block.afterSectionId}
                      disabled={automatic.some((b) => b.id === block.id)}
                      onChange={(e) =>
                        update(block.id, {
                          afterSectionId: Number(e.target.value),
                        })
                      }
                    >
                      {anchor < 0 && (
                        <option
                          value={block.afterSectionId}
                          disabled={automatic.some((b) => b.id === block.id)}
                        >
                          Phần bài tập đã bị xóa — chọn lại vị trí
                        </option>
                      )}
                      {sections.map((s, i) => (
                        <option key={s.id} value={s.id}>
                          Sau phần {i + 1}: {topicName(s.topic)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <ol className={styles.sections}>
                    {block.rows.map((row, i) => {
                      const patch = (value: Partial<WorksheetSectionDraft>) =>
                        setRows(
                          block.rows.map((r) =>
                            r.id === row.id ? { ...r, ...value } : r
                          )
                        );
                      const valid = eligible.some((t) => t.id === row.topic);
                      return (
                        <li key={row.id}>
                          <span className={styles.number}>{i + 1}</span>
                          <label>
                            Chủ đề ôn tập
                            <select
                              aria-label={`Chủ đề ôn tập ${blockIndex + 1}.${i + 1}`}
                              value={row.topic}
                              onChange={(e) => patch({ topic: e.target.value })}
                            >
                              {!valid && (
                                <option value={row.topic}>
                                  {topicName(row.topic)} — chưa có trước khối
                                  này
                                </option>
                              )}
                              {eligible
                                .filter(
                                  (t) =>
                                    t.id === row.topic ||
                                    !block.rows.some((r) => r.topic === t.id)
                                )
                                .map((t) => (
                                  <option key={t.id} value={t.id}>
                                    {t.title}
                                  </option>
                                ))}
                            </select>
                          </label>
                          <label>
                            Cấp độ
                            <select
                              aria-label={`Cấp độ ôn tập ${blockIndex + 1}.${i + 1}`}
                              value={row.level}
                              onChange={(e) =>
                                patch({
                                  level: e.target
                                    .value as WorksheetSection['level'],
                                })
                              }
                            >
                              {worksheetLevels.map((l) => (
                                <option key={l} value={l}>
                                  {l === 'Beginner'
                                    ? 'Nhập môn / Beginner'
                                    : `Cấp độ ${l} / Level ${l}`}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            Số thế
                            <input
                              aria-label={`Số thế ôn tập ${blockIndex + 1}.${i + 1}`}
                              type="number"
                              min={0}
                              value={row.count}
                              onChange={(e) => patch({ count: e.target.value })}
                              onBlur={() => {
                                if (
                                  row.count.trim() &&
                                  Number.isFinite(Number(row.count))
                                )
                                  patch({ count: String(Number(row.count)) });
                              }}
                            />
                          </label>
                          <button
                            title="Xóa chủ đề ôn tập"
                            aria-label={`Xóa chủ đề ôn tập ${blockIndex + 1}.${i + 1}`}
                            onClick={() =>
                              setRows(block.rows.filter((r) => r.id !== row.id))
                            }
                          >
                            ×
                          </button>
                          <small>
                            {catalog[row.topic]
                              ? `${levelExercises(catalog[row.topic]!, row.level).length} thế trong thư viện`
                              : 'Đang tải…'}
                            {!valid
                              ? ' · Chọn chủ đề đã xuất hiện trước khối này.'
                              : ''}
                          </small>
                        </li>
                      );
                    })}
                  </ol>
                  <button
                    disabled={!unused.length}
                    onClick={() => {
                      const topic = unused[0];
                      if (!topic) return;
                      const chapter = preceding.find(
                        (s) => s.topic === topic.id
                      )!;
                      setRows([
                        ...block.rows,
                        {
                          id: nextId(),
                          topic: topic.id,
                          level: chapter.level,
                          count: settings.count,
                        },
                      ]);
                    }}
                  >
                    + Thêm chủ đề ôn tập
                  </button>
                </section>
              );
            })}
          </div>
          <div className={styles.dialogActions}>
            <button onClick={() => setSession(null)}>Hủy</button>
            <button
              className={styles.primary}
              onClick={() => {
                onChange(session.overrides);
                setSession(null);
              }}
            >
              Lưu thay đổi
            </button>
          </div>
        </dialog>
      )}
    </>
  );
}
