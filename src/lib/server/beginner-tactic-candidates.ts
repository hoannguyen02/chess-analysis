import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Chess } from 'chess.js';
import { tacticsCatalog } from './tactics-catalog';
import {
  readManualTactics,
  manualTacticsWritable,
  mergeManualCategories,
  manualExercise,
} from './manual-tactics';
import {
  readPracticeAdjustments,
  applyPracticeAdjustments,
} from './practice-management';
import {
  manualPositionKey,
  manualTopicPath,
  type ManualTactic,
} from '../chess/manual-tactics';
import { practiceCurrentScope } from '../chess/practice-management';
import { beginnerTacticFrames } from '../chess/beginner-tactic-extraction';
import type { DrawExercise, DrawCategory } from '../chess/draw-practice';
import type { GameSource, GameReference } from '../chess/draw-game-viewer';
import type { PracticeLevel } from '../chess/draw-levels';
import { drawThemeRoutePaths } from '../chess/draw-practice-view';

type Entry = Omit<ManualTactic, 'id' | 'createdAt' | 'updatedAt'>;
export type BeginnerCandidatePosition = {
  ply: number;
  entry: Entry;
  move: string;
  sourceKind: 'game' | 'analysis' | 'composed';
};
export type BeginnerTacticCandidate = {
  id: string;
  entry: Entry;
  sourceTitle: string;
  sourceKind: BeginnerCandidatePosition['sourceKind'];
  pieceCount: number;
  positions: BeginnerCandidatePosition[];
  suggestedPly: number | null;
  detection: 'explicit' | 'geometry' | 'manual';
};
type SourceExercise = DrawExercise & { tacticPly?: number };
type ReviewedRecord = {
  fen?: string;
  moves?: string[];
  gameId?: string;
  tacticPly?: number;
  motifPly?: number;
  forkPly?: number;
  pinPly?: number;
  skewerPly?: number;
  discoveryPly?: number;
};

const maximumFileBytes = 16 * 1024 * 1024;
const digest = (value: unknown) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');
const sourceLevels = new Set(['B', 'C', 'C*', 'D']);
// These older collections already use material gain as their published task.
// New collections must store exercise.goal explicitly; this is not motif grading.
const legacyGoals: Record<string, Entry['goal']> = {
  fork: 'material',
  pin: 'material',
  skewer: 'material',
};
const topicName = (scope: string) =>
  scope === '/discovered-attack' ? 'discovery' : scope.slice(1);
const safeName = (value: string) => /^[a-z][a-z0-9-]{0,79}$/.test(value);

function exerciseRows(value: unknown): SourceExercise[] {
  if (Array.isArray(value)) return value.flatMap(exerciseRows);
  if (!value || typeof value !== 'object') return [];
  const row = value as Record<string, unknown>;
  if (
    typeof row.fen === 'string' &&
    Array.isArray(row.moves) &&
    typeof row.title === 'string'
  )
    return [row as SourceExercise];
  return ['categories', 'exercises'].flatMap((key) => exerciseRows(row[key]));
}

function reviewedRows(value: unknown): ReviewedRecord[] {
  if (Array.isArray(value)) return value.flatMap(reviewedRows);
  if (!value || typeof value !== 'object') return [];
  const row = value as Record<string, unknown>;
  if (typeof row.fen === 'string' && Array.isArray(row.moves))
    return [row as ReviewedRecord];
  return ['records', 'exercises', 'exercise'].flatMap((key) =>
    reviewedRows(row[key])
  );
}

/** Normalize only an uncapturable en-passant marker, as the practice replay does. */
function positionKey(board: ReturnType<typeof Chess>) {
  const fields = board.fen().split(' ');
  if (
    fields[3] !== '-' &&
    !board.moves({ verbose: true }).some((move) => move.flags.includes('e'))
  )
    fields[3] = '-';
  return fields.join(' ');
}

/** The registered topic and file conventions select data, never arbitrary request paths. */
export async function beginnerTacticCandidates(scope: string) {
  if (typeof scope !== 'string' || scope.length > 240)
    throw new Error('Chủ đề không hợp lệ.');
  const themes = tacticsCatalog.themes.filter(
    (theme) => manualTopicPath(theme) === scope
  );
  const theme = themes[0];
  if (!theme) throw new Error('Không tìm thấy chủ đề.');
  const root = process.cwd();
  const files = new Map<string, Promise<unknown>>();
  const fingerprints = new Map<string, string>();
  async function readJson(name: string): Promise<unknown> {
    if (!files.has(name))
      files.set(
        name,
        (async () => {
          try {
            const full = path.join(root, name);
            if ((await fs.stat(full)).size > maximumFileBytes)
              throw new Error('Nguồn vượt giới hạn đọc.');
            const text = await fs.readFile(full, 'utf8');
            fingerprints.set(
              name,
              createHash('sha256').update(text).digest('hex')
            );
            return JSON.parse(text);
          } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
              fingerprints.set(name, 'missing');
              return undefined;
            }
            throw error;
          }
        })()
      );
    return files.get(name)!;
  }
  const [manual, storedAdjustments] = await Promise.all([
    readManualTactics(),
    readPracticeAdjustments(),
  ]);
  const adjustments = storedAdjustments.map((choice) => {
    const authored =
      choice.destinationScope && choice.reference.manualId
        ? manual.find((entry) => entry.id === choice.reference.manualId)
        : undefined;
    return authored
      ? {
          ...choice,
          reference: {
            ...choice.reference,
            exercise: manualExercise(authored),
          },
        }
      : choice;
  });
  const topic = theme.dedicatedPage ? topicName(theme.dedicatedPage) : '';
  const runtimeFiles =
    topic && safeName(topic)
      ? [
          `src/lib/server/${topic}-exercises.json`,
          `src/lib/chess/${topic}-exercises.json`,
          `src/lib/server/${topic}-beginner-exercises.json`,
          `src/lib/chess/${topic}-beginner-exercises.json`,
          ...(topic === 'skewer'
            ? [
                'src/lib/server/queen-skewer-intro.json',
                'src/lib/server/queen-skewer-pilot.json',
              ]
            : []),
        ]
      : [];
  let raw = (await Promise.all(runtimeFiles.map(readJson))).flatMap(
    exerciseRows
  );
  // Older draw pages share one typed catalog instead of per-topic JSON files.
  const drawCategory = Object.keys(drawThemeRoutePaths).find(
    (id) => drawThemeRoutePaths[id] === scope
  );
  if (!raw.length && drawCategory) {
    const [{ drawCategories }, { gameReference }] = await Promise.all([
      import('../chess/draw-practice'),
      import('../chess/draw-game-reference'),
    ]);
    raw = drawCategories
      .filter((category) => category.id === drawCategory)
      .flatMap((category) =>
        category.exercises.map((exercise) => ({
          ...exercise,
          gameReference: exercise.gameReference ?? gameReference(exercise.fen),
        }))
      );
    fingerprints.set('drawCategories', digest(raw));
  }
  const uniqueRaw = Array.from(
    new Map(
      raw.map((exercise) => [
        `${exercise.beginner ? 'Beginner' : 'standard'}:${manualPositionKey(exercise.fen)}`,
        exercise,
      ])
    ).values()
  );
  const base: DrawCategory[] = [
    { id: theme.id, title: theme.label, description: '', exercises: uniqueRaw },
  ];
  const merged = theme.dedicatedPage
    ? mergeManualCategories(scope, base, manual)
    : [
        {
          ...base[0],
          exercises: manual
            .filter((entry) => entry.themeId === theme.id)
            .map(manualExercise),
        },
      ];
  const current = applyPracticeAdjustments(
    scope,
    merged,
    adjustments,
    manualTacticsWritable()
  )[0].exercises;
  const themeIds = new Set(themes.map((item) => item.id));
  const occupied = new Set([
    ...uniqueRaw
      .filter((entry) => entry.beginner)
      .map((entry) => manualPositionKey(entry.fen)),
    ...current
      .filter((entry) => entry.beginner)
      .map((entry) => manualPositionKey(entry.fen)),
    ...manual
      .filter(
        (entry) => themeIds.has(entry.themeId) && entry.level === 'Beginner'
      )
      .flatMap((entry) => [
        manualPositionKey(entry.fen),
        ...(entry.beginnerOriginalFen
          ? [manualPositionKey(entry.beginnerOriginalFen)]
          : []),
      ]),
  ]);
  const reviewed =
    topic && safeName(topic)
      ? reviewedRows(await readJson(`scripts/fixtures/${topic}/published.json`))
      : [];
  const collections = new Set(
    tacticsCatalog.themes.flatMap((item) =>
      item.dedicatedPage ? [topicName(item.dedicatedPage)] : []
    )
  );
  collections.add('draw');
  const sourceCache = new Map<
    string,
    Promise<Record<string, GameSource> | undefined>
  >();
  async function gameSource(reference?: GameReference) {
    if (!reference) return undefined;
    const collection = reference.collection ?? 'draw';
    if (!safeName(collection) || !collections.has(collection)) return undefined;
    if (!sourceCache.has(collection))
      sourceCache.set(
        collection,
        readJson(`src/lib/server/${collection}-game-sources.json`).then(
          (value) => value as Record<string, GameSource> | undefined
        )
      );
    return (await sourceCache.get(collection))?.[reference.id];
  }
  const diagnostics = {
    considered: 0,
    missingGoal: 0,
    invalid: 0,
    unavailableSource: 0,
    manualSelection: 0,
  };
  const rows: BeginnerTacticCandidate[] = [];
  const replayCache = new Map<
    string,
    {
      line: string[];
      positions: string[];
      previousMoves: ({ fen: string; move: string } | undefined)[];
    }
  >();
  for (const original of current.slice(0, 3000)) {
    if (
      original.beginner ||
      !sourceLevels.has(original.difficulty?.level ?? '')
    )
      continue;
    diagnostics.considered++;
    const exercise = { ...original } as SourceExercise;
    const goal = exercise.goal ?? legacyGoals[topic];
    if (!goal || !['material', 'win', 'draw', 'checkmate'].includes(goal)) {
      diagnostics.missingGoal++;
      continue;
    }
    const reviewedRecord = exercise.manualId
      ? undefined
      : reviewed.find(
          (record) =>
            record.fen &&
            manualPositionKey(record.fen) === manualPositionKey(exercise.fen) &&
            JSON.stringify(record.moves) === JSON.stringify(exercise.moves) &&
            (!record.gameId || record.gameId === exercise.gameReference?.id)
        );
    if (exercise.tacticPly === undefined && reviewedRecord) {
      const marker = [
        'tacticPly',
        'motifPly',
        'forkPly',
        'pinPly',
        'skewerPly',
        'discoveryPly',
      ]
        .map((key) => reviewedRecord[key as keyof ReviewedRecord])
        .find((value) => value !== undefined);
      if (typeof marker === 'number') exercise.tacticPly = marker;
    }
    const actualTheme =
      scope === '/discovered-attack' && exercise.discoveryKind === 'check'
        ? (themes.find((item) => item.id === 'discoveredCheck') ?? theme)
        : theme;
    const extracted = beginnerTacticFrames(
      exercise,
      actualTheme.kind === 'checkmate'
        ? 'checkmate'
        : (actualTheme.detector ?? actualTheme.id)
    );
    if (!extracted.positions.length) {
      diagnostics.invalid++;
      continue;
    }
    const reference = exercise.gameReference;
    const source = await gameSource(reference);
    if (reference && !source) {
      diagnostics.unavailableSource++;
      continue;
    }
    let originalLine: string[] | undefined;
    let sourcePositions: string[] = [];
    let sourcePreviousMoves: ({ fen: string; move: string } | undefined)[] = [];
    if (source && reference) {
      try {
        originalLine = source.lines[reference.branch];
        if (
          !originalLine ||
          originalLine.length > 6000 ||
          !Number.isInteger(reference.ply) ||
          reference.ply < 0 ||
          reference.ply > originalLine.length
        )
          throw new Error();
        const replayKey = JSON.stringify([
          reference.collection,
          reference.id,
          reference.branch,
        ]);
        let replay = replayCache.get(replayKey);
        if (!replay) {
          const game = new Chess(source.fen);
          const positions = [positionKey(game)];
          const previousMoves: ({ fen: string; move: string } | undefined)[] = [
            undefined,
          ];
          for (const san of originalLine) {
            const fen = game.fen();
            const move = game.move(san);
            if (!move) throw new Error();
            positions.push(positionKey(game));
            previousMoves.push({ fen, move: move.san });
          }
          replay = { line: originalLine, positions, previousMoves };
          replayCache.set(replayKey, replay);
        }
        sourcePositions = replay.positions;
        sourcePreviousMoves = replay.previousMoves;
      } catch {
        diagnostics.unavailableSource++;
        continue;
      }
    }
    const sourceTitle =
      source?.headers.White && source.headers.Black
        ? `${source.headers.White} — ${source.headers.Black}`
        : exercise.playerTitle || exercise.title;
    const positions: BeginnerCandidatePosition[] = extracted.positions.flatMap(
      (frame) => {
        if (occupied.has(manualPositionKey(frame.fen))) return [];
        const matchesSource = !!(
          source &&
          reference &&
          sourcePositions[reference.ply] ===
            positionKey(new Chess(exercise.fen)) &&
          sourcePositions[reference.ply + frame.ply] ===
            positionKey(new Chess(frame.fen)) &&
          exercise.moves
            .slice(0, frame.ply)
            .every(
              (san, index) => originalLine?.[reference.ply + index] === san
            )
        );
        const sourceKind =
          source?.kind === 'game'
            ? matchesSource
              ? 'game'
              : 'analysis'
            : 'composed';
        const previousMove =
          frame.previousMove ??
          (matchesSource && reference
            ? sourcePreviousMoves[reference.ply + frame.ply]
            : undefined);
        const entry: Entry = {
          themeId: actualTheme.id,
          level: 'Beginner',
          fen: frame.fen,
          goal,
          moves: [],
          alternativeLines: [],
          solution: '',
          title: `Nhập môn · ${sourceKind === 'analysis' ? 'Phương án minh họa · ' : ''}${sourceTitle}`,
          ...(source
            ? {
                headers: source.headers,
                ...(source.gameOpening
                  ? { gameOpening: source.gameOpening }
                  : {}),
              }
            : {}),
          ...(reference
            ? {
                reference: {
                  ...reference,
                  kind: source?.kind ?? reference.kind,
                  ply: reference.ply + (matchesSource ? frame.ply : 0),
                },
              }
            : {}),
          ...(previousMove ? { previousMove } : {}),
          beginnerOriginalFen: frame.fen,
          beginnerSourceLevel: exercise.difficulty!.level as PracticeLevel,
        };
        return [{ ply: frame.ply, entry, move: frame.move, sourceKind }];
      }
    );
    // An already imported detected anchor must not return as a shifted duplicate.
    const selected =
      extracted.suggestedPly === null
        ? positions[0]
        : positions.find((frame) => frame.ply === extracted.suggestedPly);
    if (!selected) continue;
    if (extracted.suggestedPly === null) diagnostics.manualSelection++;
    rows.push({
      id: digest([
        scope,
        exercise.manualId ?? exercise.gameReference ?? exercise.title,
        exercise.fen,
        exercise.moves,
      ]).slice(0, 24),
      entry: selected.entry,
      sourceTitle,
      sourceKind: selected.sourceKind,
      pieceCount: (selected.entry.fen.split(' ')[0].match(/[a-z]/gi) ?? [])
        .length,
      positions,
      suggestedPly: extracted.suggestedPly,
      detection: extracted.detection,
    });
  }
  rows.sort(
    (a, b) =>
      Number(a.suggestedPly === null) - Number(b.suggestedPly === null) ||
      a.pieceCount - b.pieceCount ||
      a.id.localeCompare(b.id)
  );
  const candidates: BeginnerTacticCandidate[] = [],
    seen = new Set<string>();
  for (const row of rows) {
    const selected =
      row.positions.find((position) => position.ply === row.suggestedPly) ??
      row.positions[0];
    if (seen.has(manualPositionKey(selected.entry.fen))) continue;
    const positions = row.positions.filter(
      (position) => !seen.has(manualPositionKey(position.entry.fen))
    );
    if (!positions.length) continue;
    positions.forEach((position) =>
      seen.add(manualPositionKey(position.entry.fen))
    );
    candidates.push({ ...row, positions });
    if (candidates.length === 24) break;
  }
  const existingCount = current.filter((entry) => entry.beginner).length;
  const relevantChoices = storedAdjustments.filter(
    (choice) =>
      choice.reference.scope === scope || practiceCurrentScope(choice) === scope
  );
  const incomingIds = new Set(
    relevantChoices.map((choice) => choice.reference.manualId)
  );
  return {
    topic: { themeId: theme.id, label: theme.label, scope },
    candidates,
    writable: manualTacticsWritable(),
    existingCount,
    suggestedCount: Math.max(
      0,
      Math.min(
        24 - existingCount,
        candidates.filter((row) => row.suggestedPly !== null).length
      )
    ),
    sourceSnapshot: digest([
      Array.from(fingerprints).sort(([a], [b]) => a.localeCompare(b)),
      manual.filter(
        (entry) => themeIds.has(entry.themeId) || incomingIds.has(entry.id)
      ),
      relevantChoices,
    ]),
    diagnostics,
  };
}
