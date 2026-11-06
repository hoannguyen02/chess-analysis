import { POSITIONS_PER_PAGE } from './worksheet-layout';
import type { WorksheetSection } from './worksheet';
export type WorksheetSectionDraft = Omit<WorksheetSection, 'count'> & {
  count: string;
  topicGroupId?: number;
};
export type ReviewBlockDraft = {
  id: number;
  afterSectionId: number;
  kind?: 'group' | 'final';
  pageCount?: string;
  rows: WorksheetSectionDraft[];
};
export type ReviewSettings = {
  enabled: boolean;
  interval: string;
  pages: string;
  finalPages: string;
  cumulative: boolean;
  final: boolean;
};
const DEFAULT_REVIEW_INTERVAL = 2;
export const defaultReviewSettings: ReviewSettings = {
  enabled: true,
  interval: String(DEFAULT_REVIEW_INTERVAL),
  pages: '1',
  finalPages: '1',
  cumulative: false,
  final: true,
};

export function reviewPositionBudget(pageCount: string): number {
  const pages = Number(pageCount);
  const total = pages * POSITIONS_PER_PAGE;
  if (
    !pageCount.trim() ||
    !Number.isSafeInteger(pages) ||
    pages < 1 ||
    !Number.isSafeInteger(total)
  )
    throw new Error('Số trang ôn tập phải là số nguyên lớn hơn 0.');
  return total;
}

function evenCounts(total: number, size: number, rotation: number) {
  if (!Number.isSafeInteger(size) || size < 1)
    throw new Error('Chọn ít nhất một chủ đề ôn tập.');
  if (total < size)
    throw new Error(
      `${total} thế chưa đủ cho ${size} chủ đề/cấp độ. Chọn ít nhất ${Math.ceil(size / POSITIONS_PER_PAGE)} trang ôn tập.`
    );
  const result = Array<number>(size).fill(Math.floor(total / size));
  for (let i = 0; i < total % size; i++) result[(rotation + i) % size]++;
  return result;
}

/** A page budget is shared by topics, then by their selected levels. */
export function allocateReviewRows(
  rows: WorksheetSectionDraft[],
  pageCount: string,
  rotation = 0
): WorksheetSectionDraft[] {
  const total = reviewPositionBudget(pageCount);
  const topics = new Map<string, WorksheetSectionDraft[]>();
  for (const row of rows) {
    const levels = topics.get(row.topic) ?? [];
    if (!levels.some((r) => r.level === row.level)) levels.push(row);
    topics.set(row.topic, levels);
  }
  const groups = [...topics.values()];
  if (!groups.length) throw new Error('Chọn ít nhất một chủ đề ôn tập.');
  const fitsLevels = (slots: number) => {
    const share = Math.floor(slots / groups.length);
    return (
      groups.every((g) => g.length <= share + 1) &&
      groups.filter((g) => g.length > share).length <= slots % groups.length
    );
  };
  if (!fitsLevels(total)) {
    let minimum = Math.ceil(
      groups.reduce((n, g) => n + g.length, 0) / POSITIONS_PER_PAGE
    );
    while (!fitsLevels(minimum * POSITIONS_PER_PAGE)) minimum++;
    throw new Error(
      `Chưa đủ chỗ để chia đều theo chủ đề và có bài ở mỗi cấp độ đã chọn. Chọn ít nhất ${minimum} trang ôn tập.`
    );
  }
  const counts = evenCounts(total, groups.length, rotation);
  const base = Math.floor(total / groups.length);
  // When level coverage needs a remainder slot, assign it before rotating extras.
  const mandatory = groups
    .map((g, i) => (g.length > base ? i : -1))
    .filter((i) => i >= 0);
  counts.fill(base);
  mandatory.forEach((i) => counts[i]++);
  let remaining = (total % groups.length) - mandatory.length;
  for (let i = 0; remaining > 0 && i < groups.length; i++) {
    const index = (rotation + i) % groups.length;
    if (!mandatory.includes(index)) {
      counts[index]++;
      remaining--;
    }
  }
  return groups.flatMap((group, i) => {
    const byLevel = evenCounts(counts[i], group.length, rotation + i);
    return group.map((row, j) => ({ ...row, count: String(byLevel[j]) }));
  });
}

export function reviewDistribution(
  topicCount: number,
  pageCount: string,
  rotation = 0
) {
  const total = reviewPositionBudget(pageCount);
  const counts = evenCounts(total, topicCount, rotation);
  const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
  const period = topicCount / gcd(topicCount, POSITIONS_PER_PAGE);
  return {
    total,
    counts,
    uneven: total % topicCount !== 0,
    suggestedPages: Math.ceil((Number(pageCount) + 1) / period) * period,
  };
}

export function reviewBudgetError(block: ReviewBlockDraft) {
  if (block.pageCount === undefined) return '';
  let total: number;
  try {
    total = reviewPositionBudget(block.pageCount);
  } catch (error) {
    return (error as Error).message;
  }
  if (
    block.rows.some(
      (r) =>
        !r.count.trim() ||
        !Number.isSafeInteger(Number(r.count)) ||
        Number(r.count) < 0
    )
  )
    return 'Số thế phải là số nguyên từ 0 trở lên.';
  const selected = block.rows.reduce((sum, r) => sum + Number(r.count), 0);
  return selected === total
    ? ''
    : `${block.pageCount} trang cần ${total} thế; hiện có ${selected} thế. Điều chỉnh phân bổ để đủ số trang đã chọn.`;
}

// Negative IDs identify automatic schedule slots; chapter and row IDs remain positive.
export function automaticReviewBlocks(
  sections: WorksheetSectionDraft[],
  settings: ReviewSettings
): ReviewBlockDraft[] {
  if (!settings.enabled || !sections.length) return [];
  const interval = Number(settings.interval);
  if (!Number.isSafeInteger(interval) || interval < 1)
    throw new Error(
      'Số chủ đề giữa các phần ôn tập phải là số nguyên lớn hơn 0.'
    );
  reviewPositionBudget(settings.pages);
  if (settings.final) reviewPositionBudget(settings.finalPages);
  // Multiple selected levels belong to one topic for review placement.
  const groups: WorksheetSectionDraft[][] = [];
  for (const section of sections) {
    const last = groups.at(-1);
    const key = section.topicGroupId ?? section.id;
    if (last && (last[0].topicGroupId ?? last[0].id) === key)
      last.push(section);
    else groups.push([section]);
  }
  const ends: number[] = [];
  for (let end = interval; end <= groups.length; end += interval)
    ends.push(end);
  const schedule = ends.map((end) => ({ end, final: false }));
  if (settings.final) schedule.push({ end: groups.length, final: true });
  return schedule.map(({ end, final }, index) => {
    const start =
      final || settings.cumulative ? 0 : Math.max(0, end - interval);
    const pageCount = final ? settings.finalPages : settings.pages;
    return {
      id: final ? -1 : -end - 1,
      afterSectionId: groups[end - 1].at(-1)!.id,
      kind: final ? ('final' as const) : ('group' as const),
      pageCount,
      rows: allocateReviewRows(
        groups.slice(start, end).flat(),
        pageCount,
        index
      ),
    };
  });
}

export function resolveReviewBlocks(
  automatic: ReviewBlockDraft[],
  overrides: ReviewBlockDraft[],
  enabled: boolean
): ReviewBlockDraft[] {
  if (!enabled) return [];
  return [
    ...automatic.map((b) => {
      const custom = overrides.find((o) => o.id === b.id);
      return custom
        ? {
            ...custom,
            afterSectionId: b.afterSectionId,
            kind: b.kind,
            pageCount: b.pageCount,
            rows:
              b.pageCount && custom.pageCount !== b.pageCount
                ? allocateReviewRows(custom.rows, b.pageCount)
                : custom.rows,
          }
        : b;
    }),
    // Keep custom blocks that no longer have a schedule slot visible for review.
    ...overrides.filter((o) => !automatic.some((b) => b.id === o.id)),
  ];
}
