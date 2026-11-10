const test = require('node:test');
const assert = require('node:assert/strict');
const { webcrypto } = require('node:crypto');
const { catalogLoader } = require('./render-tactic-batch.cjs');

let drafts;
let choices;
const at = '2026-11-08T05:00:00.000Z';
const fen = '4k3/8/8/8/8/8/3R4/4K3 w - - 0 1';
const exercise = {
  fen,
  moves: ['Rd8+'],
  solution: 'Xe chiếu.',
  title: 'Bài 1',
  outcome: 'manual',
};
const page = (items, review = false) => ({
  title: review ? 'Ôn tập cuối sách' : 'Quân treo',
  level: 'A',
  review,
  exercises: items,
});

test.before(async () => {
  globalThis.crypto ??= webcrypto;
  const load = catalogLoader(
    require('node:path').resolve(__dirname, '..'),
    await import('chess.js')
  );
  const model = load('src/lib/chess/worksheet.ts');
  drafts = load('src/lib/chess/worksheet-drafts.ts');
  choices = {
    bookMode: true,
    title: 'Bài tập A',
    watermark: '',
    footer: model.defaultWorksheetFooter,
    book: model.defaultBookOptions,
    levels: ['A'],
    hasCustomOrder: true,
    initialTopicChosen: true,
    nextId: 3,
    reuseReview: false,
    shuffleReview: true,
    sections: [
      { id: 2, topic: 'hanging-piece', count: '' },
      { id: 1, topic: 'fork', count: '6' },
    ],
    reviewSettings: {
      ...load('src/lib/chess/worksheet-review.ts').defaultReviewSettings,
      pages: '',
    },
    reviewOverrides: [
      {
        id: -1,
        kind: 'final',
        afterSectionId: 11,
        pageCount: '1',
        rows: [
          { id: 11, topic: 'fork', level: 'A', count: '3', topicGroupId: 1 },
        ],
      },
    ],
  };
});

test('backup preserves incomplete choices, chapter order, review overrides and the export reference', () => {
  const working = { at, choices, referenceId: 'saved-export' };
  const version = drafts.makeWorksheetVersion(choices, 'Mốc đã rà soát', at);
  const parsed = drafts.parseWorksheetDrafts(
    drafts.encodeWorksheetDrafts(working, [version])
  );
  assert.deepEqual(parsed.working, working);
  assert.deepEqual(parsed.versions, [version]);
});

test('backup rejects malformed formats, nested selections and reused row IDs', () => {
  assert.throws(() => drafts.parseWorksheetDrafts('{'), /JSON/);
  assert.throws(
    () =>
      drafts.parseWorksheetDrafts(
        '{"format":"lima-worksheet-drafts","schemaVersion":2}'
      ),
    /chưa được hỗ trợ/
  );
  for (const invalid of [
    { ...choices, levels: ['F'] },
    { ...choices, sections: [choices.sections[0], choices.sections[0]] },
    { ...choices, sections: [{ id: 1, topic: 'constructor', count: '1' }] },
    {
      ...choices,
      book: { ...choices.book, compilation: { internalOnly: 'true' } },
    },
  ]) {
    assert.throws(
      () =>
        drafts.parseWorksheetDrafts(
          drafts.encodeWorksheetDrafts({ at, choices: invalid }, [])
        ),
      /không hợp lệ/
    );
  }
});

test('export references preserve page order and repeated review positions and detect edited content', async () => {
  const positions = await drafts.captureWorksheetPositions([
    page([{ number: 1, exercise }]),
    page([{ number: 2, exercise, topicTitle: 'Quân treo', level: 'A' }], true),
  ]);
  assert.deepEqual(
    positions.map(({ number, exercisePage, topic, fen }) => [
      number,
      exercisePage,
      topic,
      fen,
    ]),
    [
      [1, 1, 'Quân treo', fen],
      [2, 2, 'Quân treo', fen],
    ]
  );
  assert.equal(positions[0].fingerprint, positions[1].fingerprint);
  const edited = await drafts.captureWorksheetPositions([
    page([
      { number: 1, exercise: { ...exercise, solution: 'Ghi chú đã chỉnh.' } },
    ]),
  ]);
  assert.deepEqual(drafts.worksheetExportDifference(positions, edited), {
    changed: 2,
    firstChanged: 1,
  });
  const roundTrip = drafts.parseWorksheetDrafts(
    JSON.stringify({
      format: 'lima-worksheet-drafts',
      schemaVersion: 1,
      working: null,
      versions: [
        {
          id: 'one',
          name: 'Bản xuất',
          at,
          choices,
          exports: [{ id: 'export', at, positions }],
        },
      ],
    })
  );
  assert.deepEqual(
    drafts.worksheetExportDifference(
      positions,
      roundTrip.versions[0].exports[0].positions
    ),
    { changed: 0, firstChanged: 0 }
  );
});

test('each export is recorded while identical configurations reuse their named version', async () => {
  const positions = await drafts.captureWorksheetPositions([
    page([{ number: 1, exercise }]),
  ]);
  const version = drafts.makeWorksheetVersion(choices, 'Mốc A', at);
  const first = { id: 'export-1', at, positions };
  const second = { id: 'export-2', at, positions };
  const withFirst = drafts.addWorksheetExport([version], choices, first);
  const withBoth = drafts.addWorksheetExport(
    withFirst,
    { ...choices, nextId: 10 },
    second
  );
  assert.equal(withBoth.length, 1);
  assert.equal(withBoth[0].name, version.name);
  assert.deepEqual(withBoth[0].exports, [first, second]);
  assert.deepEqual(version.exports, []);
  const changed = drafts.addWorksheetExport(
    withBoth,
    { ...choices, title: 'Bài tập B' },
    second
  );
  assert.equal(changed.length, 2);
});

test('import adds backups without replacing history and rejects conflicting records atomically', () => {
  const original = drafts.makeWorksheetVersion(
    choices,
    'Bản trong trình duyệt',
    at
  );
  const incoming = drafts.makeWorksheetVersion(
    { ...choices, title: 'Bản cũ' },
    'Bản cũ',
    at
  );
  const working = { at, choices: { ...choices, title: 'Bản đang dở' } };
  const backup = drafts.parseWorksheetDrafts(
    drafts.encodeWorksheetDrafts(working, [incoming])
  );
  const merged = drafts.mergeWorksheetBackup([original], backup);
  assert.equal(merged.length, 3);
  assert.ok(merged.some((item) => item.id === original.id));
  assert.ok(merged.some((item) => item.name === 'Bản đang dở · Bản nháp nhập'));
  assert.equal(drafts.mergeWorksheetBackup(merged, backup).length, 3);
  assert.throws(
    () =>
      drafts.mergeWorksheetBackup(merged, {
        ...backup,
        versions: [{ ...original, name: 'Tên bị thay' }],
      }),
    /giữ nguyên/
  );
});
