import {
  createHash,
  createHmac,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Chess } from 'chess.js';
import seed from './practice-adjustments.json';
import { tacticsCatalog } from './tactics-catalog';
import { inPracticeTeachingOrder } from '../chess/practice-topic-order';
import {
  manualTopicPath,
  manualPositionKey,
  manualLevelPositionKey,
} from '../chess/manual-tactics';
import { practiceLevels, type PracticeLevel } from '../chess/draw-levels';
import type { DrawCategory, DrawExercise } from '../chess/draw-practice';
import {
  practiceReviewReference,
  practiceCurrentScope,
  type PracticeAdjustment,
  type PracticeReviewReference,
  type PracticeSolution,
} from '../chess/practice-management';
import {
  MAX_RECORDED_VARIATIONS,
  parsePracticeVariation,
  recordedVariationLines,
} from '../chess/practice-exploration';
import { drawThemeRoutePaths } from '../chess/draw-practice-view';

export function practiceManagementTopics() {
  const seen = new Set<string>();
  const topics = tacticsCatalog.themes.flatMap((theme) => {
    const scope = manualTopicPath(theme);
    if (seen.has(scope)) return [];
    seen.add(scope);
    return [
      {
        scope,
        label:
          scope === '/discovered-attack'
            ? 'Chiếu mở và tấn công mở'
            : theme.label,
      },
    ];
  });
  return inPracticeTeachingOrder(topics, (topic) => topic.scope);
}

const file = path.join(
  process.cwd(),
  'src/lib/server/practice-adjustments.json'
);
export const practiceManagementWritable = () =>
  process.env.NODE_ENV === 'development' && !process.env.VERCEL;
export const validPracticeScope = (scope: unknown): scope is string =>
  typeof scope === 'string' &&
  (Object.values(drawThemeRoutePaths).includes(scope) ||
    tacticsCatalog.themes.some((theme) => manualTopicPath(theme) === scope));
export const practiceAdjustmentId = (
  scope: string,
  fen: string,
  beginnerManualId?: string
) =>
  createHash('sha256')
    .update(
      JSON.stringify(
        beginnerManualId
          ? [scope, 'beginner-manual', beginnerManualId]
          : [scope, manualPositionKey(fen)]
      )
    )
    .digest('hex')
    .slice(0, 24);

// The protected exercise API signs its own source snapshot. Writes can only
// reference an exercise actually supplied by that API, without duplicating all
// topic loaders in a second management catalog.
export function practiceReferenceSignature(reference: PracticeReviewReference) {
  return createHmac(
    'sha256',
    `practice-review:${process.env.PRACTICE_PASSWORD}`
  )
    .update(JSON.stringify(reference))
    .digest('hex');
}
export function validPracticeReference(value: unknown, signature: unknown) {
  if (!value || typeof value !== 'object') return false;
  const ref = value as PracticeReviewReference;
  if (
    !validPracticeScope(ref.scope) ||
    typeof ref.fen !== 'string' ||
    !practiceLevels.includes(ref.baseLevel as PracticeLevel) ||
    typeof signature !== 'string' ||
    !/^[a-f0-9]{64}$/.test(signature)
  )
    return false;
  return timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(practiceReferenceSignature(ref), 'hex')
  );
}
export async function readPracticeAdjustments(): Promise<PracticeAdjustment[]> {
  if (!practiceManagementWritable()) return seed as PracticeAdjustment[];
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
}
export async function mutatePracticeAdjustments(
  change: (
    entries: PracticeAdjustment[]
  ) => PracticeAdjustment[] | Promise<PracticeAdjustment[]>
) {
  const lock = await fs.open(`${file}.lock`, 'wx').catch(() => {
    throw new Error('Đang lưu thay đổi khác. Hãy thử lại.');
  });
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    const entries = await change(await readPracticeAdjustments());
    await fs.writeFile(temporary, JSON.stringify(entries, null, 2) + '\n', {
      flag: 'wx',
    });
    await fs.rename(temporary, file);
    return entries;
  } finally {
    await fs.unlink(temporary).catch(() => {});
    await lock.close();
    await fs.unlink(`${file}.lock`);
  }
}

/** Owner-recorded lines: legal replay, not an automatic tactical approval. */
export function validatePracticeSolution(
  reference: PracticeReviewReference,
  value: unknown
): PracticeSolution {
  const input = value as Partial<PracticeSolution> | null;
  if (
    !input ||
    !Array.isArray(input.alternativeLines) ||
    input.alternativeLines.length >= MAX_RECORDED_VARIATIONS ||
    typeof input.solution !== 'string' ||
    input.solution.length > 4000
  )
    throw new Error('Phương án hoặc giải thích không hợp lệ.');
  const lines = recordedVariationLines(
    [input.moves, ...input.alternativeLines].map((line, index) => {
      try {
        return parsePracticeVariation(reference.fen, line);
      } catch (error) {
        throw new Error(`Phương án ${index + 1}: ${(error as Error).message}`);
      }
    })
  );
  if (
    reference.goal === 'checkmate' ||
    reference.exercise?.outcome === 'checkmate'
  ) {
    for (const line of lines) {
      const board = new Chess(reference.fen);
      const solver = board.turn();
      for (const move of line) board.move(move);
      if (!board.in_checkmate() || board.turn() === solver)
        throw new Error(
          'Mỗi phương án chiếu hết phải kết thúc bằng nước chiếu hết của bên giải.'
        );
    }
  }
  return {
    moves: lines[0],
    alternativeLines: lines.slice(1),
    solution: input.solution.trim(),
  };
}

export function applyPracticeAdjustments(
  pagePath: string,
  categories: DrawCategory[],
  entries: PracticeAdjustment[],
  writable = practiceManagementWritable()
): DrawCategory[] {
  return categories.map((category, index) => {
    const scope =
      pagePath === '/draw' ? drawThemeRoutePaths[category.id] : pagePath;
    if (!validPracticeScope(scope)) return category;
    const incoming = entries.filter(
      (entry) =>
        practiceCurrentScope(entry) === scope &&
        entry.reference.scope !== scope &&
        entry.reference.exercise
    );
    const additions = incoming.filter((entry) =>
      scope === '/discovered-attack' && index > 0
        ? entry.reference.exercise?.discoveryKind ===
          (category.id === 'discovered-check' ? 'check' : 'attack')
        : index === 0 || pagePath === '/draw'
    );
    const seen = new Set(
      category.exercises.map((exercise) =>
        manualLevelPositionKey(
          exercise.fen,
          !!exercise.beginner && !!exercise.manualId
        )
      )
    );
    const candidates = [
      ...category.exercises.map((exercise) => ({
        exercise,
        incoming: undefined as PracticeAdjustment | undefined,
      })),
      ...additions
        .filter((entry) => {
          const incomingExercise = entry.reference.exercise!;
          const key = manualLevelPositionKey(
            incomingExercise.fen,
            entry.reference.baseLevel === 'Beginner' &&
              !!entry.reference.manualId
          );
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .map((entry) => ({
          exercise: entry.reference.exercise!,
          incoming: entry,
        })),
    ];
    const exercises = candidates.flatMap(({ exercise, incoming }) => {
      const originScope = incoming?.reference.scope ?? scope;
      const reference = practiceReviewReference(originScope, exercise);
      if (!reference.baseLevel) return [exercise];
      const beginnerManualId =
        reference.baseLevel === 'Beginner' ? exercise.manualId : undefined;
      const id =
        incoming?.id ??
        practiceAdjustmentId(scope, exercise.fen, beginnerManualId);
      const hasStandardCollision = category.exercises.some(
        (other) =>
          other !== exercise &&
          !other.beginner &&
          manualPositionKey(other.fen) === manualPositionKey(exercise.fen)
      );
      const adjustment =
        incoming ??
        entries.find(
          (entry) =>
            entry.id === id &&
            (beginnerManualId ||
              !(
                entry.reference.baseLevel === 'Beginner' &&
                entry.reference.manualId
              ))
        ) ??
        (beginnerManualId && !hasStandardCollision
          ? entries.find(
              (entry) =>
                entry.reference.scope === scope &&
                entry.id === practiceAdjustmentId(scope, entry.reference.fen) &&
                entry.reference.baseLevel === 'Beginner' &&
                entry.reference.manualId === beginnerManualId
            )
          : undefined);
      const managementId = adjustment?.id ?? id;
      if (
        adjustment?.removed ||
        (adjustment && practiceCurrentScope(adjustment) !== scope)
      ) {
        return [];
      }
      const level = adjustment?.level;
      const adjusted: DrawExercise = {
        ...exercise,
        ...(adjustment?.solutionOverride ?? {}),
        management: {
          id: managementId,
          scope: originScope,
          currentScope: scope,
          baseLevel: reference.baseLevel,
          ...(exercise.difficulty
            ? { baseDifficulty: exercise.difficulty }
            : {}),
          updatedAt: adjustment?.updatedAt ?? null,
          writable,
          ...(adjustment?.solutionOverride
            ? { sourceReference: reference, solutionEdited: true }
            : {}),
          ...(writable
            ? { signature: practiceReferenceSignature(reference) }
            : {}),
        },
      };
      if (level) {
        adjusted.beginner = level === 'Beginner';
        adjusted.difficulty =
          level === 'Beginner'
            ? undefined
            : {
                ...exercise.difficulty,
                level,
                status: 'manual',
                reason: adjustment.note || 'Cấp độ được điều chỉnh thủ công.',
                solverMoves:
                  exercise.difficulty?.solverMoves ??
                  Math.ceil(
                    Math.max(
                      exercise.moves.length,
                      ...(exercise.alternativeLines ?? []).map(
                        (line) => line.length
                      )
                    ) / 2
                  ),
              };
      }
      return [adjusted];
    });
    return {
      ...category,
      exercises,
      managementScope: scope,
      managementWritable: writable,
      removedCount: entries.filter(
        (entry) => practiceCurrentScope(entry) === scope && entry.removed
      ).length,
      transferredCount: entries.filter(
        (entry) =>
          entry.reference.scope === scope &&
          practiceCurrentScope(entry) !== scope
      ).length,
    };
  });
}
export async function includePracticeManagement(
  pagePath: string,
  categories: DrawCategory[]
) {
  const entries = (await readPracticeAdjustments()).map((entry) => ({
    ...entry,
    reference: { ...entry.reference },
  }));
  const { readManualTactics, manualExercise, orderManualInsertions } =
    await import('./manual-tactics');
  const manual = await readManualTactics();
  // Authored positions remain editable after a transfer. Their current manual
  // record supplies the moves; the transfer keeps its original review snapshot.
  if (
    entries.some((entry) => entry.destinationScope && entry.reference.manualId)
  ) {
    for (const entry of entries) {
      const source = manual.find(
        (position) => position.id === entry.reference.manualId
      );
      if (entry.destinationScope && source)
        entry.reference = {
          ...entry.reference,
          exercise: manualExercise(source),
        };
    }
  }
  return orderManualInsertions(
    applyPracticeAdjustments(pagePath, categories, entries),
    manual
  );
}

/** Validate before changing either page; the single overlay write is atomic. */
export async function assertPracticeDestinationAvailable(
  entries: PracticeAdjustment[],
  id: string,
  originScope: string,
  destinationScope: string,
  fen: string,
  sourceReference?: PracticeReviewReference
) {
  const key = manualPositionKey(fen);
  const beginnerCopy =
    sourceReference?.baseLevel === 'Beginner' && !!sourceReference.manualId;
  const duplicate = entries.find(
    (entry) =>
      entry.id !== id &&
      practiceCurrentScope(entry) === destinationScope &&
      (!beginnerCopy ||
        (entry.reference.baseLevel === 'Beginner' &&
          !!entry.reference.manualId)) &&
      manualPositionKey(entry.reference.fen) === key
  );
  if (duplicate)
    throw new Error(
      'Thế cờ này đã có ở chủ đề đích. Hãy mở bài đã có để quản lý.'
    );
  if (destinationScope === originScope) return;
  const { readManualTactics, curatedPositionLevel } = await import(
    './manual-tactics'
  );
  const theme = tacticsCatalog.themes.find(
    (theme) => manualTopicPath(theme) === destinationScope
  )!;
  if (
    (await readManualTactics()).some(
      (position) =>
        manualTopicPath(
          tacticsCatalog.themes.find((theme) => theme.id === position.themeId)!
        ) === destinationScope &&
        manualPositionKey(position.fen) === key &&
        (!beginnerCopy || position.level === 'Beginner')
    ) ||
    ((await curatedPositionLevel(theme.id, key, id)) &&
      (!beginnerCopy ||
        (await curatedPositionLevel(theme.id, key, id)) === 'Beginner'))
  )
    throw new Error(
      'Thế cờ này đã có ở chủ đề đích. Hãy mở bài đã có để quản lý.'
    );
  const categoryId = Object.keys(drawThemeRoutePaths).find(
    (id) => drawThemeRoutePaths[id] === destinationScope
  );
  if (categoryId) {
    const { drawCategories } = await import('../chess/draw-practice');
    if (
      drawCategories
        .find((category) => category.id === categoryId)
        ?.exercises.some((exercise) => manualPositionKey(exercise.fen) === key)
    )
      throw new Error(
        'Thế cờ này đã có ở chủ đề đích. Hãy mở bài đã có để quản lý.'
      );
  }
}
