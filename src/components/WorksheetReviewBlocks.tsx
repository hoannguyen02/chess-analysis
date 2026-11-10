import type {
  WorksheetCatalog,
  WorksheetSection,
  WorksheetTopic,
} from '@/lib/chess/worksheet';
import { levelExercises, worksheetLevels } from '@/lib/chess/worksheet';
import styles from '@/styles/WorksheetBuilder.module.css';
import { POSITIONS_PER_PAGE } from '@/lib/chess/worksheet-layout';
import {
  allocateReviewRows,
  reviewBudgetError,
  reviewDistribution,
} from '@/lib/chess/worksheet-review';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import PracticeTopicSelect from './PracticeTopicSelect';
import type {
  ReviewBlockDraft,
  ReviewSettings,
  WorksheetSectionDraft,
} from '@/lib/chess/worksheet-review';

function AllocationFeedback({
  topicCount,
  pages,
  rows,
}: {
  topicCount: number;
  pages: string;
  rows?: WorksheetSectionDraft[];
}) {
  if (!topicCount)
    return (
      <small className={styles.reviewHelp}>Chọn chủ đề để xem phân bổ.</small>
    );
  try {
    const distribution = reviewDistribution(topicCount, pages);
    const { total, uneven, suggestedPages } = distribution;
    const byTopic = new Map<string, number>();
    rows?.forEach((r) =>
      byTopic.set(r.topic, (byTopic.get(r.topic) ?? 0) + (Number(r.count) || 0))
    );
    const counts = rows ? [...byTopic.values()] : distribution.counts;
    return (
      <div className={styles.allocationFeedback} aria-live="polite">
        <small className={styles.reviewHelp}>
          {topicCount} chủ đề · {pages} trang · {total} thế —{' '}
          {counts.some((n) => n !== counts[0])
            ? `phân bổ ${counts.join(' + ')} thế.`
            : `${counts[0]} thế/chủ đề.`}
        </small>
        {uneven && (
          <p role="status" className={styles.allocationWarning}>
            {total} thế không chia đều cho {topicCount} chủ đề. Phân bổ:{' '}
            {counts.join(' + ')} thế. Chọn {suggestedPages} trang để mỗi chủ đề
            có {(suggestedPages * POSITIONS_PER_PAGE) / topicCount} thế, hoặc
            giữ phân bổ hiện tại.
          </p>
        )}
      </div>
    );
  } catch (error) {
    return (
      <small className={styles.allocationWarning} role="status">
        {(error as Error).message}
      </small>
    );
  }
}
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
  const topicEnds = sections.filter((section, index) => {
    const next = sections[index + 1];
    return (
      !next ||
      (section.topicGroupId ?? section.id) !== (next.topicGroupId ?? next.id)
    );
  });
  const topicNumber = (id: number) => {
    const section = sections.find((s) => s.id === id);
    return section
      ? topicEnds.findIndex(
          (s) =>
            (s.topicGroupId ?? s.id) === (section.topicGroupId ?? section.id)
        ) + 1
      : 0;
  };
  const [session, setSession] = useState<{
    blocks: ReviewBlockDraft[];
    overrides: ReviewBlockDraft[];
  } | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editorError, setEditorError] = useState('');
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
  const update = (id: number, patch: Partial<ReviewBlockDraft>) => {
    setEditorError('');
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
  };
  const needsAttention = (block: ReviewBlockDraft) => {
    const anchor = sections.findIndex((s) => s.id === block.afterSectionId);
    return (
      anchor < 0 ||
      !!reviewBudgetError(block) ||
      !automatic.some((b) => b.id === block.id) ||
      block.rows.some(
        (r) => !sections.slice(0, anchor + 1).some((s) => s.topic === r.topic)
      )
    );
  };
  const configure = (patch: Partial<ReviewSettings>) =>
    onSettings({ ...settings, ...patch });
  const unevenCumulative = [
    ...new Map(
      blocks
        .filter((b) => b.kind === 'group' && settings.cumulative)
        .map((b) => [new Set(b.rows.map((r) => r.topic)).size, b] as const)
        .filter(
          ([n, b]) =>
            n !== Number(settings.interval) &&
            n > 0 &&
            (Number(b.pageCount) * POSITIONS_PER_PAGE) % n !== 0
        )
    ).values(),
  ];
  return (
    <>
      <div className={styles.reviewToolbar}>
        <label className={styles.guideToggle}>
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => configure({ enabled: e.target.checked })}
          />
          Thêm phần ôn tập
        </label>
        <button
          aria-haspopup="dialog"
          disabled={!settings.enabled || !blocks.length}
          onClick={() => {
            setEditorError('');
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
      <fieldset disabled={!settings.enabled} className={styles.reviewCommon}>
        <legend>Thiết lập chung</legend>
        <div className={styles.reviewToggleRow}>{sourceOptions}</div>
        <small id="review-source-help" className={styles.reviewHelp}>
          {sourceHelp} Các cấp độ cùng chia tổng số thế của mỗi phần ôn tập.
        </small>
      </fieldset>
      <fieldset disabled={!settings.enabled} className={styles.reviewKinds}>
        <legend className={styles.srOnly}>Các phần ôn tập</legend>
        <section
          className={styles.reviewKind}
          aria-labelledby="group-review-title"
        >
          <h3 id="group-review-title">Ôn tập theo nhóm</h3>
          <small id="review-scope-help" className={styles.reviewHelp}>
            {settings.cumulative
              ? 'Ôn tất cả chủ đề đã học, từ đầu sách đến nhóm hiện tại.'
              : 'Chỉ ôn các chủ đề trong nhóm vừa học.'}
          </small>
          <div className={styles.reviewGroupControls}>
            <label className={styles.reviewInterval}>
              Sau mỗi
              <span className={styles.quantityControl}>
                <input
                  type="number"
                  min={1}
                  aria-label="Số chủ đề giữa các phần ôn tập"
                  value={settings.interval}
                  onChange={(e) => configure({ interval: e.target.value })}
                />
                <span aria-hidden="true">chủ đề</span>
              </span>
            </label>
            <label className={styles.reviewPageQuantity}>
              Số trang mỗi lần ôn
              <input
                type="number"
                min={1}
                value={settings.pages}
                aria-label="Số trang mỗi lần ôn theo nhóm"
                onChange={(e) => configure({ pages: e.target.value })}
              />
            </label>
          </div>
          <AllocationFeedback
            topicCount={Number(settings.interval)}
            pages={settings.pages}
          />
          {unevenCumulative.length > 0 && (
            <details className={styles.allocationWarning}>
              <summary>
                Có {unevenCumulative.length} phần ôn tập tích lũy không chia đều
              </summary>
              {unevenCumulative.map((b) => (
                <AllocationFeedback
                  key={b.id}
                  topicCount={new Set(b.rows.map((r) => r.topic)).size}
                  pages={b.pageCount ?? settings.pages}
                  rows={b.rows}
                />
              ))}
            </details>
          )}
          <div className={styles.reviewGroupControls}>
            <label className={styles.guideToggle}>
              <input
                type="checkbox"
                checked={settings.cumulative}
                aria-describedby="review-scope-help"
                onChange={(e) => configure({ cumulative: e.target.checked })}
              />
              Ôn cả các chủ đề trước
            </label>
          </div>
        </section>
        <section
          className={styles.reviewKind}
          aria-labelledby="final-review-title"
        >
          <h3 id="final-review-title">
            <label className={styles.guideToggle}>
              <input
                type="checkbox"
                checked={settings.final}
                aria-describedby="final-review-help"
                onChange={(e) => configure({ final: e.target.checked })}
              />
              Ôn tập cuối sách
            </label>
          </h3>
          <small id="final-review-help" className={styles.reviewHelp}>
            Mặc định ôn toàn bộ chủ đề, một lần ở cuối sách.
          </small>
          <label className={styles.reviewPageQuantity}>
            Số trang cuối sách
            <input
              type="number"
              min={1}
              value={settings.finalPages}
              disabled={!settings.final}
              aria-label="Số trang ôn tập cuối sách"
              onChange={(e) => configure({ finalPages: e.target.value })}
            />
          </label>
          {settings.final && (
            <AllocationFeedback
              topicCount={
                new Set(
                  (blocks.find((b) => b.id === -1)?.rows ?? sections).map(
                    (s) => s.topic
                  )
                ).size
              }
              pages={settings.finalPages}
              rows={blocks.find((b) => b.id === -1)?.rows}
            />
          )}
          {settings.final &&
            topicEnds.length > 0 &&
            blocks.length === 1 &&
            blocks[0].id === -1 && (
              <small className={styles.reviewEndNote}>
                {topicEnds.length < Number(settings.interval)
                  ? 'Sách hiện tại chưa đủ một nhóm; chỉ thêm ôn tập cuối sách.'
                  : 'Ôn tập cuối sách có số trang riêng, độc lập với ôn tập theo nhóm.'}
              </small>
            )}
        </section>
      </fieldset>
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
                {session.blocks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.id === -1
                      ? 'Ôn tập cuối sách'
                      : `Ôn tập theo nhóm · Sau chủ đề ${topicNumber(b.afterSectionId)}`}{' '}
                    · {b.rows.reduce((n, r) => n + (Number(r.count) || 0), 0)}{' '}
                    thế {b.pageCount ? `· ${b.pageCount} trang` : ''}
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
              const unused = eligible.flatMap((topic) =>
                worksheetLevels
                  .filter(
                    (level) =>
                      levelExercises(catalog[topic.id] ?? [], level).length >=
                        POSITIONS_PER_PAGE &&
                      !block.rows.some(
                        (r) => r.topic === topic.id && r.level === level
                      )
                  )
                  .map((level) => ({ topic: topic.id, level }))
              );
              const setRows = (rows: WorksheetSectionDraft[]) =>
                update(block.id, { rows });
              return (
                <section
                  className={styles.reviewBlock}
                  key={block.id}
                  aria-label={`Khối ôn tập ${blockIndex + 1}`}
                >
                  <div className={styles.reviewBlockBudget}>
                    <strong>
                      {block.pageCount} trang ·{' '}
                      {Number(block.pageCount) * POSITIONS_PER_PAGE} thế cờ
                    </strong>
                    <button
                      onClick={() => {
                        try {
                          setRows(
                            allocateReviewRows(
                              block.rows,
                              block.pageCount ?? '1'
                            )
                          );
                        } catch (error) {
                          setEditorError((error as Error).message);
                        }
                      }}
                    >
                      Chia đều theo số trang
                    </button>
                  </div>
                  <small className={styles.reviewHelp}>
                    Điều chỉnh cách chia bên dưới; tổng số thế phải đủ số trang
                    đã chọn.
                  </small>
                  <AllocationFeedback
                    topicCount={new Set(block.rows.map((r) => r.topic)).size}
                    pages={block.pageCount ?? '1'}
                    rows={block.rows}
                  />
                  {(reviewBudgetError(block) || editorError) && (
                    <p role="alert" className={styles.allocationWarning}>
                      {editorError || reviewBudgetError(block)}
                    </p>
                  )}
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
                      {topicEnds.map((s, i) => (
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
                      const topicOptions = eligible
                        .filter(
                          (t) =>
                            t.id === row.topic ||
                            unused.some((pair) => pair.topic === t.id)
                        )
                        .map(({ id, title }) => ({
                          value: id,
                          label: title,
                          scope: `/${id}`,
                          disabled: false,
                        }));
                      if (!valid)
                        topicOptions.push({
                          value: row.topic,
                          label: `${topicName(row.topic)} — chưa có trước khối này`,
                          scope: `/${row.topic}`,
                          disabled: true,
                        });
                      return (
                        <li key={row.id}>
                          <span className={styles.number}>{i + 1}</span>
                          <PracticeTopicSelect
                            label="Chủ đề ôn tập"
                            ariaLabel={`Chủ đề ôn tập ${blockIndex + 1}.${i + 1}`}
                            value={row.topic}
                            options={topicOptions}
                            onChange={(topic) => {
                              const level = worksheetLevels.find(
                                (l) =>
                                  levelExercises(catalog[topic] ?? [], l)
                                    .length >= POSITIONS_PER_PAGE &&
                                  !block.rows.some(
                                    (r) =>
                                      r.id !== row.id &&
                                      r.topic === topic &&
                                      r.level === l
                                  )
                              );
                              if (level) patch({ topic, level });
                            }}
                          />
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
                                <option
                                  key={l}
                                  value={l}
                                  disabled={
                                    l !== row.level &&
                                    (levelExercises(catalog[row.topic] ?? [], l)
                                      .length < POSITIONS_PER_PAGE ||
                                      block.rows.some(
                                        (r) =>
                                          r.id !== row.id &&
                                          r.topic === row.topic &&
                                          r.level === l
                                      ))
                                  }
                                >
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
                      const pair = unused[0];
                      if (!pair) return;
                      setRows([
                        ...block.rows,
                        {
                          id: nextId(),
                          topic: pair.topic,
                          level: pair.level,
                          count: '0',
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
              disabled={session.blocks.some((b) => !!reviewBudgetError(b))}
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
