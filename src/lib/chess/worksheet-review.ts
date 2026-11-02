import type { WorksheetSection } from './worksheet';
export type WorksheetSectionDraft = Omit<WorksheetSection, 'count'> & {
  count: string;
};
export type ReviewBlockDraft = {
  id: number;
  afterSectionId: number;
  rows: WorksheetSectionDraft[];
};
export type ReviewSettings = {
  enabled: boolean;
  interval: string;
  count: string;
  cumulative: boolean;
  final: boolean;
};
export const defaultReviewSettings: ReviewSettings = {
  enabled: true,
  interval: '3',
  count: '6',
  cumulative: false,
  final: true,
};

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
  const count = Number(settings.count);
  if (!settings.count.trim() || !Number.isSafeInteger(count) || count < 1)
    throw new Error('Số thế mỗi chủ đề ôn tập phải là số nguyên lớn hơn 0.');
  const ends: number[] = [];
  for (let end = interval; end <= sections.length; end += interval)
    ends.push(end);
  if (settings.final && ends.at(-1) !== sections.length)
    ends.push(sections.length);
  return ends.map((end) => {
    const final = settings.final && end === sections.length;
    const start =
      final || settings.cumulative ? 0 : Math.max(0, end - interval);
    return {
      id: final ? -1 : -end - 1,
      afterSectionId: sections[end - 1].id,
      rows: sections
        .slice(start, end)
        .map((s) => ({ ...s, count: settings.count })),
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
      return custom ? { ...custom, afterSectionId: b.afterSectionId } : b;
    }),
    // Keep custom blocks that no longer have a schedule slot visible for review.
    ...overrides.filter((o) => !automatic.some((b) => b.id === o.id)),
  ];
}
