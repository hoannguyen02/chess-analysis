import {
  worksheetLevels,
  worksheetSolutionText,
  worksheetSourceLines,
  type WorksheetBookOptions,
  type WorksheetFooter,
  type WorksheetLevel,
  type WorksheetPage,
} from './worksheet';
import type { ReviewBlockDraft, ReviewSettings } from './worksheet-review';
import type { WorksheetTopicDraft } from './worksheet-selection';

export type WorksheetDraftChoices = {
  bookMode: boolean;
  title: string;
  watermark: string;
  footer: WorksheetFooter;
  book: WorksheetBookOptions;
  levels: WorksheetLevel[];
  sections: WorksheetTopicDraft[];
  hasCustomOrder: boolean;
  initialTopicChosen: boolean;
  nextId: number;
  reviewSettings: ReviewSettings;
  reviewOverrides: ReviewBlockDraft[];
  reuseReview: boolean;
  shuffleReview: boolean;
};

export type WorksheetExportPosition = {
  number: number;
  exercisePage: number;
  section: string;
  topic: string;
  level: WorksheetLevel;
  fen: string;
  exerciseId?: string;
  fingerprint: string;
};

export type WorksheetExportRecord = {
  id: string;
  at: string;
  positions: WorksheetExportPosition[];
};

export type WorksheetDraft = {
  at: string;
  choices: WorksheetDraftChoices;
  referenceId?: string;
};

export type WorksheetVersion = {
  id: string;
  name: string;
  at: string;
  choices: WorksheetDraftChoices;
  exports: WorksheetExportRecord[];
};

export type WorksheetDraftBackup = {
  format: 'lima-worksheet-drafts';
  schemaVersion: 1;
  working: WorksheetDraft | null;
  versions: WorksheetVersion[];
};

export const worksheetDraftKey = 'lima-worksheets:working';
export const worksheetVersionsKey = 'lima-worksheets:versions';

const record = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
const onlyKeys = (value: Record<string, unknown>, fields: string) => {
  const allowed = fields.split(' ');
  return Object.keys(value).every((key) => allowed.includes(key));
};
const text = (value: unknown, max = 1000): value is string =>
  typeof value === 'string' && value.length <= max;
const boolean = (value: unknown): value is boolean =>
  typeof value === 'boolean';
const integer = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value);
const positive = (value: unknown): value is number =>
  integer(value) && value > 0;
const identifier = (value: unknown): value is string =>
  text(value, 160) && value.length > 0;
const timestamp = (value: unknown): value is string =>
  text(value, 30) &&
  /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value) &&
  Number.isFinite(Date.parse(value));
const level = (value: unknown): value is WorksheetLevel =>
  worksheetLevels.some((entry) => entry === value);
const array = <T>(
  value: unknown,
  check: (item: unknown) => item is T
): value is T[] => Array.isArray(value) && value.every(check);
const unique = (items: readonly unknown[]) =>
  new Set(items).size === items.length;
const optionalText = (value: unknown) => value === undefined || text(value);
const optionalBoolean = (value: unknown) =>
  value === undefined || boolean(value);
const row = (value: unknown): value is WorksheetTopicDraft =>
  record(value) &&
  positive(value.id) &&
  text(value.topic, 100) &&
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.topic) &&
  !Object.hasOwn(Object.prototype, value.topic) &&
  text(value.count, 128);

function reviewBlock(value: unknown): value is ReviewBlockDraft {
  return (
    record(value) &&
    onlyKeys(value, 'id afterSectionId kind pageCount rows') &&
    integer(value.id) &&
    value.id !== 0 &&
    positive(value.afterSectionId) &&
    (value.kind === undefined ||
      value.kind === 'group' ||
      value.kind === 'final') &&
    optionalText(value.pageCount) &&
    Array.isArray(value.rows) &&
    value.rows.every(
      (item) =>
        record(item) &&
        onlyKeys(item, 'id topic count level topicGroupId') &&
        level(item.level) &&
        (item.topicGroupId === undefined || positive(item.topicGroupId)) &&
        row(item)
    )
  );
}

function bookOptions(value: unknown): value is WorksheetBookOptions {
  const section = (item: unknown) =>
    record(item) &&
    onlyKeys(item, 'title body') &&
    text(item.title, 1000) &&
    text(item.body, 20000);
  return (
    record(value) &&
    onlyKeys(
      value,
      'showContents showAddressOnEveryPage showLevelGuide showNotationGuide introduction closing compilation'
    ) &&
    section(value.introduction) &&
    section(value.closing) &&
    [
      'showContents',
      'showAddressOnEveryPage',
      'showLevelGuide',
      'showNotationGuide',
    ].every((key) => optionalBoolean(value[key])) &&
    (value.compilation === undefined ||
      (record(value.compilation) &&
        onlyKeys(value.compilation, 'date version internalOnly') &&
        optionalText(value.compilation.version) &&
        (value.compilation.date === undefined ||
          (text(value.compilation.date, 13) &&
            /^(?:\d{4,6}-\d\d-\d\d)?$/.test(value.compilation.date))) &&
        optionalBoolean(value.compilation.internalOnly)))
  );
}

function draftChoices(value: unknown): value is WorksheetDraftChoices {
  if (
    !record(value) ||
    !onlyKeys(
      value,
      'bookMode title watermark footer book levels sections hasCustomOrder initialTopicChosen nextId reviewSettings reviewOverrides reuseReview shuffleReview'
    ) ||
    !boolean(value.bookMode) ||
    !text(value.title) ||
    !text(value.watermark) ||
    !record(value.footer) ||
    !bookOptions(value.book) ||
    !array(value.levels, level) ||
    !unique(value.levels) ||
    !array(value.sections, row) ||
    !unique(value.sections.map((item) => item.id)) ||
    !boolean(value.hasCustomOrder) ||
    !boolean(value.initialTopicChosen) ||
    !positive(value.nextId) ||
    value.nextId > Math.floor(Number.MAX_SAFE_INTEGER / 10) - 1 ||
    !record(value.reviewSettings) ||
    !array(value.reviewOverrides, reviewBlock) ||
    !unique(value.reviewOverrides.map((item) => item.id)) ||
    !boolean(value.reuseReview) ||
    !boolean(value.shuffleReview)
  )
    return false;
  const nextId = value.nextId;
  const settings = value.reviewSettings;
  const footer = value.footer;
  return (
    onlyKeys(footer, 'name phone address') &&
    onlyKeys(settings, 'interval pages finalPages enabled cumulative final') &&
    ['name', 'phone', 'address'].every((key) => text(footer[key])) &&
    ['interval', 'pages', 'finalPages'].every((key) =>
      text(settings[key], 128)
    ) &&
    ['enabled', 'cumulative', 'final'].every((key) => boolean(settings[key])) &&
    value.sections.every(
      (item) => onlyKeys(item, 'id topic count') && item.id < nextId
    ) &&
    value.reviewOverrides.every(
      (item) => item.id < nextId * 10 && item.afterSectionId < nextId * 10
    )
  );
}

const workingDraft = (value: unknown): value is WorksheetDraft =>
  record(value) &&
  onlyKeys(value, 'at choices referenceId') &&
  timestamp(value.at) &&
  draftChoices(value.choices) &&
  (value.referenceId === undefined || identifier(value.referenceId));

const exportPosition = (value: unknown): value is WorksheetExportPosition =>
  record(value) &&
  onlyKeys(
    value,
    'number exercisePage section topic level fen exerciseId fingerprint'
  ) &&
  positive(value.number) &&
  positive(value.exercisePage) &&
  text(value.section) &&
  text(value.topic) &&
  level(value.level) &&
  text(value.fen, 200) &&
  value.fen.length > 0 &&
  (value.exerciseId === undefined || identifier(value.exerciseId)) &&
  text(value.fingerprint, 64) &&
  /^[a-f0-9]{64}$/.test(value.fingerprint);

const exportRecord = (value: unknown): value is WorksheetExportRecord =>
  record(value) &&
  onlyKeys(value, 'id at positions') &&
  identifier(value.id) &&
  timestamp(value.at) &&
  array(value.positions, exportPosition) &&
  value.positions.length > 0 &&
  value.positions.every(
    (position, i, positions) =>
      position.number === i + 1 &&
      (i === 0
        ? position.exercisePage === 1
        : position.exercisePage >= positions[i - 1].exercisePage &&
          position.exercisePage <= positions[i - 1].exercisePage + 1)
  );

const version = (value: unknown): value is WorksheetVersion =>
  record(value) &&
  onlyKeys(value, 'id name at choices exports') &&
  identifier(value.id) &&
  text(value.name, 160) &&
  value.name.trim().length > 0 &&
  timestamp(value.at) &&
  draftChoices(value.choices) &&
  array(value.exports, exportRecord) &&
  unique(value.exports.map((entry) => entry.id));

export function encodeWorksheetDrafts(
  working: WorksheetDraft | null,
  versions: WorksheetVersion[]
): string {
  const backup: WorksheetDraftBackup = {
    format: 'lima-worksheet-drafts',
    schemaVersion: 1,
    working,
    versions,
  };
  return JSON.stringify(backup);
}

export function parseWorksheetDrafts(raw: string): WorksheetDraftBackup {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error('Không đọc được tệp JSON.');
  }
  if (!record(value) || value.format !== 'lima-worksheet-drafts')
    throw new Error('Tệp này không phải bản sao của trình tạo sách.');
  if (value.schemaVersion !== 1)
    throw new Error('Phiên bản dữ liệu này chưa được hỗ trợ.');
  if (
    (value.working !== null && !workingDraft(value.working)) ||
    !array(value.versions, version) ||
    !unique(value.versions.map((item) => item.id))
  )
    throw new Error('Bản sao có dữ liệu bản nháp hoặc phiên bản không hợp lệ.');
  return {
    format: 'lima-worksheet-drafts',
    schemaVersion: 1,
    working: value.working,
    versions: value.versions,
  };
}

function canonical(value: unknown): string {
  return JSON.stringify(value, (_, item: unknown) =>
    record(item)
      ? Object.fromEntries(
          Object.keys(item)
            .sort()
            .map((key) => [key, item[key]])
        )
      : item
  );
}

export function sameWorksheetChoices(
  a: WorksheetDraftChoices,
  b: WorksheetDraftChoices
) {
  // The allocator is saved for safe restores but does not change the output.
  const { nextId: _a, ...left } = a;
  const { nextId: _b, ...right } = b;
  return canonical(left) === canonical(right);
}

export function makeWorksheetVersion(
  choices: WorksheetDraftChoices,
  name: string,
  at = new Date().toISOString()
): WorksheetVersion {
  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    at,
    choices,
    exports: [],
  };
}

export function addWorksheetExport(
  versions: WorksheetVersion[],
  choices: WorksheetDraftChoices,
  entry: WorksheetExportRecord,
  referenceId?: string
): WorksheetVersion[] {
  const matching = versions.filter((item) =>
    sameWorksheetChoices(item.choices, choices)
  );
  const existing =
    matching.find((item) => item.id === referenceId) ?? matching[0];
  if (existing)
    return versions.map((item) =>
      item === existing ? { ...item, exports: [...item.exports, entry] } : item
    );
  const name = `${choices.title.trim().slice(0, 140) || 'Tài liệu cờ vua'} · Bản xuất`;
  return [
    { ...makeWorksheetVersion(choices, name, entry.at), exports: [entry] },
    ...versions,
  ];
}

export function mergeWorksheetBackup(
  current: WorksheetVersion[],
  backup: WorksheetDraftBackup
): WorksheetVersion[] {
  const merged = [...current];
  for (const incoming of backup.versions) {
    const index = merged.findIndex((item) => item.id === incoming.id);
    if (index === -1) {
      merged.push(incoming);
      continue;
    }
    const existing = merged[index];
    if (
      existing.name !== incoming.name ||
      !sameWorksheetChoices(existing.choices, incoming.choices)
    )
      throw new Error(
        'Bản sao có mã phiên bản trùng với nội dung khác. Dữ liệu hiện tại được giữ nguyên.'
      );
    const exports = new Map(existing.exports.map((item) => [item.id, item]));
    for (const entry of incoming.exports) {
      const local = exports.get(entry.id);
      if (local && canonical(local) !== canonical(entry))
        throw new Error(
          'Bản sao có mã lần xuất trùng với nội dung khác. Dữ liệu hiện tại được giữ nguyên.'
        );
      exports.set(entry.id, entry);
    }
    merged[index] = {
      ...existing,
      exports: [...exports.values()].sort((a, b) => a.at.localeCompare(b.at)),
    };
  }
  const draft = backup.working;
  if (
    draft &&
    !merged.some((item) => sameWorksheetChoices(item.choices, draft.choices))
  ) {
    const name = `${draft.choices.title.trim().slice(0, 140) || 'Tài liệu cờ vua'} · Bản nháp nhập`;
    merged.push(makeWorksheetVersion(draft.choices, name, draft.at));
  }
  return merged.sort((a, b) => b.at.localeCompare(a.at));
}

export async function captureWorksheetPositions(
  pages: WorksheetPage[]
): Promise<WorksheetExportPosition[]> {
  const encoder = new TextEncoder();
  return Promise.all(
    pages.flatMap((page, index) =>
      page.exercises.map(
        async ({ number, exercise, topicTitle, level: exerciseLevel }) => {
          // Only reference the published position and hash what the two PDFs print.
          const printed = JSON.stringify([
            exercise.fen,
            exercise.moves,
            exercise.alternativeLines,
            exercise.previousMove?.fen,
            exercise.previousMove?.move,
            exercise.goal,
            worksheetSolutionText(exercise),
            worksheetSourceLines(exercise),
          ]);
          const hash = await crypto.subtle.digest(
            'SHA-256',
            encoder.encode(printed)
          );
          return {
            number,
            exercisePage: index + 1,
            section: page.title,
            topic: topicTitle ?? page.title,
            level: exerciseLevel ?? page.level,
            fen: exercise.fen,
            exerciseId: exercise.management?.id ?? exercise.manualId,
            fingerprint: Array.from(new Uint8Array(hash), (byte) =>
              byte.toString(16).padStart(2, '0')
            ).join(''),
          };
        }
      )
    )
  );
}

export function worksheetExportDifference(
  previous: WorksheetExportPosition[],
  current: WorksheetExportPosition[]
) {
  const length = Math.max(previous.length, current.length);
  let changed = 0;
  let firstChanged = 0;
  for (let i = 0; i < length; i++) {
    if (canonical(previous[i]) !== canonical(current[i])) {
      changed++;
      firstChanged ||= i + 1;
    }
  }
  return { changed, firstChanged };
}
