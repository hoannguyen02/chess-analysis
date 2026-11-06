import { createHash, randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Chess } from 'chess.js';
import seed from './manual-tactics.json';
import { includePracticeManagement } from './practice-management';
import { readPracticeAdjustments } from './practice-management';
import { practiceAdjustmentId } from './practice-management';
import {
  practiceCurrentScope,
  type PracticeAdjustment,
} from '../chess/practice-management';
import { tacticsCatalog } from './tactics-catalog';
import { practiceLevels } from '../chess/draw-levels';
import {
  manualPositionKey,
  manualLevelPositionKey,
  manualTopicPath,
  type ManualTactic,
} from '../chess/manual-tactics';
import type { DrawCategory, DrawExercise } from '../chess/draw-practice';
import { gamePlayers, gamePlayerTitle } from '../chess/game-player-title';
import { previousDrawPosition } from '../chess/draw-trainer';
import {
  parsePracticeVariation,
  MAX_RECORDED_VARIATIONS,
} from '../chess/practice-exploration';
import { validateSetupFen } from '../chess/position-setup';

const file = path.join(process.cwd(), 'src/lib/server/manual-tactics.json');
export const manualTacticsWritable = () =>
  process.env.NODE_ENV === 'development' && !process.env.VERCEL;
export async function readManualTactics(): Promise<ManualTactic[]> {
  return manualTacticsWritable()
    ? JSON.parse(await fs.readFile(file, 'utf8'))
    : (seed as ManualTactic[]);
}
export function manualTacticId(
  themeId: string,
  fen: string,
  level?: ManualTactic['level']
) {
  return createHash('sha256')
    .update(
      JSON.stringify(
        level === 'Beginner'
          ? [themeId, 'Beginner', manualPositionKey(fen)]
          : [themeId, manualPositionKey(fen)]
      )
    )
    .digest('hex')
    .slice(0, 24);
}
export async function manualPracticeAdjustment(
  position: ManualTactic,
  adjustments: PracticeAdjustment[],
  positions: ManualTactic[] = []
) {
  const theme = tacticsCatalog.themes.find(
    (theme) => theme.id === position.themeId
  )!;
  const scope = manualTopicPath(theme);
  const beginner = position.level === 'Beginner';
  const id = practiceAdjustmentId(
    scope,
    position.fen,
    beginner ? position.id : undefined
  );
  const direct = adjustments.find(
    (entry) =>
      entry.id === id &&
      (beginner ||
        !(entry.reference.baseLevel === 'Beginner' && entry.reference.manualId))
  );
  if (direct || !beginner) return direct;
  const legacy = adjustments.find(
    (entry) =>
      entry.reference.scope === scope &&
      entry.id === practiceAdjustmentId(scope, entry.reference.fen) &&
      entry.reference.baseLevel === 'Beginner' &&
      entry.reference.manualId === position.id
  );
  if (
    !legacy ||
    positions.some(
      (entry) =>
        entry.id !== position.id &&
        entry.themeId === position.themeId &&
        entry.level !== 'Beginner' &&
        manualPositionKey(entry.fen) === manualPositionKey(position.fen)
    )
  )
    return undefined;
  const curated = await curatedPositionLevel(
    position.themeId,
    manualPositionKey(position.fen),
    legacy.id
  );
  return curated && curated !== 'Beginner' ? undefined : legacy;
}
export function validateManualTactic(
  value: unknown
): Omit<ManualTactic, 'id' | 'createdAt' | 'updatedAt'> {
  const v = value as Record<string, unknown>;
  if (
    !v ||
    typeof v.fen !== 'string' ||
    !tacticsCatalog.themes.some((t) => t.id === v.themeId) ||
    !practiceLevels.some((level) => level === v.level) ||
    typeof v.goal !== 'string' ||
    !['material', 'win', 'draw', 'checkmate'].includes(v.goal)
  )
    throw new Error('Chọn chủ đề, cấp độ, mục tiêu và thế cờ hợp lệ.');
  const game = new Chess();
  const startingFen = v.level === 'Beginner' ? validateSetupFen(v.fen) : v.fen;
  if (!game.load(startingFen) || game.in_checkmate() || game.in_stalemate())
    throw new Error('Thế cờ bắt đầu phải còn nước đi hợp lệ.');
  const fen = game.fen();
  const emptyBeginner =
    v.level === 'Beginner' &&
    (v.moves === undefined ||
      v.moves === '' ||
      (Array.isArray(v.moves) && v.moves.length === 0));
  const moves = emptyBeginner ? [] : parsePracticeVariation(fen, v.moves);
  let alternativeLines: string[][] | undefined;
  if (v.alternativeLines !== undefined) {
    if (
      !Array.isArray(v.alternativeLines) ||
      v.alternativeLines.length >= MAX_RECORDED_VARIATIONS
    )
      throw new Error(
        `Tối đa ${MAX_RECORDED_VARIATIONS} phương án cho mỗi thế cờ.`
      );
    const seen = new Set([JSON.stringify(moves)]);
    alternativeLines = [];
    for (const [index, value] of v.alternativeLines.entries()) {
      let line;
      try {
        line = parsePracticeVariation(fen, value);
      } catch (e) {
        throw new Error(`Phương án ${index + 2}: ${(e as Error).message}`);
      }
      const key = JSON.stringify(line);
      if (!moves.length)
        throw new Error('Ghi phương án chính trước khi thêm phương án khác.');
      if (!seen.has(key)) {
        seen.add(key);
        alternativeLines.push(line);
      }
    }
  }
  if (v.goal === 'checkmate' && moves.length)
    for (const line of [moves, ...(alternativeLines ?? [])]) {
      const board = new Chess(fen);
      for (const move of line) board.move(move);
      if (!board.in_checkmate())
        throw new Error(
          'Mỗi phương án chiếu hết phải kết thúc ở thế chiếu hết.'
        );
    }
  for (const field of ['solution', 'title', 'gameOpening'])
    if (
      v[field] !== undefined &&
      (typeof v[field] !== 'string' ||
        (v[field] as string).length > (field === 'solution' ? 4000 : 1000))
    )
      throw new Error('Tên hoặc ghi chú quá dài.');
  const theme = tacticsCatalog.themes.find((t) => t.id === v.themeId)!;
  const result: Omit<ManualTactic, 'id' | 'createdAt' | 'updatedAt'> = {
    themeId: theme.id,
    level: v.level as ManualTactic['level'],
    fen,
    goal: v.goal as ManualTactic['goal'],
    moves,
    ...(alternativeLines !== undefined ? { alternativeLines } : {}),
    solution: typeof v.solution === 'string' ? v.solution.trim() : '',
    title:
      typeof v.title === 'string' && v.title.trim()
        ? v.title.trim()
        : `${theme.label} · Thế cờ tự thêm`,
  };
  if (
    v.headers &&
    typeof v.headers === 'object' &&
    !Array.isArray(v.headers) &&
    Object.keys(v.headers).length <= 100 &&
    Object.values(v.headers).every(
      (x) => typeof x === 'string' && x.length <= 2000
    )
  )
    result.headers = v.headers as Record<string, string>;
  if (typeof v.gameOpening === 'string') result.gameOpening = v.gameOpening;
  for (const field of ['beginnerOriginalFen', 'beginnerBaseFen'] as const) {
    if (v[field] === undefined) continue;
    if (typeof v[field] !== 'string')
      throw new Error('Mốc thế cờ gốc không hợp lệ.');
    result[field] = validateSetupFen(v[field]);
  }
  if (v.beginnerSourceLevel !== undefined) {
    if (
      !practiceLevels.includes(v.beginnerSourceLevel as ManualTactic['level'])
    )
      throw new Error('Cấp độ nguồn không hợp lệ.');
    result.beginnerSourceLevel = v.beginnerSourceLevel as ManualTactic['level'];
  }
  if (result.beginnerBaseFen && v.level !== 'Beginner')
    throw new Error('Chỉ sửa bàn cờ của bài tập Nhập môn.');
  if (v.reference && typeof v.reference === 'object') {
    const ref = v.reference as ManualTactic['reference'];
    const collections = tacticsCatalog.themes.flatMap((t) =>
      t.dedicatedPage ? [t.dedicatedPage.slice(1)] : []
    );
    if (
      !ref ||
      typeof ref.id !== 'string' ||
      ref.id.length > 100 ||
      !['game', 'study'].includes(ref.kind) ||
      !Number.isInteger(ref.ply) ||
      ref.ply < 0 ||
      !Number.isInteger(ref.branch) ||
      ref.branch < 0 ||
      (ref.collection &&
        ![...collections, 'discovery'].includes(ref.collection))
    )
      throw new Error('Mốc nguồn không hợp lệ.');
    result.reference = {
      id: ref.id,
      kind: ref.kind,
      branch: ref.branch,
      ply: ref.ply,
      ...(ref.collection ? { collection: ref.collection } : {}),
    };
  }
  const previous = validateManualPreviousMove(
    fen,
    v.level === 'Beginner' && v.previousMove === null
      ? undefined
      : v.previousMove
  );
  if (previous) result.previousMove = previous;
  return result;
}
export function validateManualPreviousMove(
  fen: string,
  value: unknown
): DrawExercise['previousMove'] {
  if (value === undefined) return undefined;
  try {
    if (!value || typeof value !== 'object') throw new Error();
    const previousMove = value as NonNullable<DrawExercise['previousMove']>;
    if (
      typeof previousMove.fen !== 'string' ||
      typeof previousMove.move !== 'string'
    )
      throw new Error();
    const previous = previousDrawPosition({
      fen,
      previousMove,
    } as DrawExercise);
    if (!previous) throw new Error();
    return { fen: previous.fen, move: previous.move.san };
  } catch {
    throw new Error('Nước trước không dẫn đến thế cờ đã chọn.');
  }
}
export async function mutateManualTactics(
  change: (entries: ManualTactic[]) => ManualTactic[]
) {
  const lock = await fs.open(`${file}.lock`, 'wx').catch(() => {
    throw new Error('Đang lưu thế cờ khác. Hãy thử lại.');
  });
  const temp = `${file}.${randomUUID()}.tmp`;
  try {
    const entries = change(await readManualTactics());
    await fs.writeFile(temp, JSON.stringify(entries, null, 2) + '\n', {
      flag: 'wx',
    });
    await fs.rename(temp, file);
    return entries;
  } finally {
    await fs.unlink(temp).catch(() => {});
    await lock.close();
    await fs.unlink(`${file}.lock`);
  }
}
export function manualExercise(entry: ManualTactic): DrawExercise {
  const theme = tacticsCatalog.themes.find((t) => t.id === entry.themeId)!;
  const route = theme.dedicatedPage?.slice(1);
  const tactical: Record<string, DrawExercise['outcome']> = {
    fork: 'fork',
    pin: 'pin',
    skewer: 'skewer',
    'removing-defender': 'removing-defender',
    'discovered-attack': 'discovery',
    simplification: 'simplification',
  };
  const modified =
    entry.beginnerOriginalFen !== undefined &&
    manualPositionKey(entry.fen) !==
      manualPositionKey(entry.beginnerOriginalFen);
  const caption = entry.headers
    ? [entry.headers.Date, entry.headers.Event].filter(Boolean).join(' · ')
    : '';
  return {
    manualId: entry.id,
    title: entry.title,
    fen: entry.fen,
    goal: entry.goal,
    moves: entry.moves,
    alternativeLines: entry.alternativeLines,
    solution:
      entry.solution ||
      (entry.moves.length
        ? 'Tính các nước đáp khác rồi đối chiếu với phương án minh họa.'
        : ''),
    prompt: entry.solution || 'Tính phương án để đạt mục tiêu của thế cờ.',
    outcome:
      entry.goal === 'checkmate'
        ? 'checkmate'
        : (tactical[route ?? ''] ?? 'manual'),
    mode: 'interactive',
    forcedReplies: false,
    source: modified
      ? 'Thế cờ được chỉnh sửa từ vị trí nguồn.'
      : 'Thế cờ được thêm thủ công.',
    beginner: entry.level === 'Beginner',
    ...(entry.beginnerOriginalFen
      ? { beginnerOriginalFen: entry.beginnerOriginalFen }
      : {}),
    ...(entry.beginnerBaseFen
      ? { beginnerBaseFen: entry.beginnerBaseFen }
      : {}),
    ...(entry.level === 'Beginner'
      ? {}
      : {
          difficulty: {
            level: entry.level,
            reason: 'Cấp độ do người thêm lựa chọn.',
            status: 'manual' as const,
            solverMoves: Math.ceil(
              Math.max(
                entry.moves.length,
                ...(entry.alternativeLines ?? []).map((line) => line.length)
              ) / 2
            ),
          },
        }),
    ...(entry.reference ? { gameReference: entry.reference } : {}),
    previousMove: entry.previousMove,
    players: entry.headers ? gamePlayers(entry.headers) : undefined,
    playerTitle: entry.headers ? gamePlayerTitle(entry.headers) : undefined,
    gameCaption:
      [caption, ...(modified ? ['Thế cờ đã chỉnh sửa'] : [])]
        .filter(Boolean)
        .join(' · ') || undefined,
    gameOpening: entry.gameOpening,
    discoveryKind:
      entry.themeId === 'discoveredCheck'
        ? 'check'
        : entry.themeId === 'discoveredAttack'
          ? 'attack'
          : undefined,
  };
}
export function mergeManualCategories(
  pagePath: string,
  categories: DrawCategory[],
  entries: ManualTactic[]
) {
  const themes = tacticsCatalog.themes.filter(
    (t) => t.dedicatedPage === pagePath
  );
  const additions = entries.filter((e) =>
    themes.some((t) => t.id === e.themeId)
  );
  return categories.map((category, index) => {
    const target =
      pagePath === '/discovered-attack'
        ? additions.filter(
            (e) =>
              index === 0 ||
              (category.id === 'discovered-check'
                ? e.themeId === 'discoveredCheck'
                : e.themeId === 'discoveredAttack')
          )
        : index === 0
          ? additions
          : [];
    const bases = new Set(
      target
        .filter((e) => e.level === 'Beginner' && e.beginnerBaseFen)
        .map((e) => manualPositionKey(e.beginnerBaseFen!))
    );
    const original = category.exercises.filter(
      (exercise) =>
        !(exercise.beginner && bases.has(manualPositionKey(exercise.fen)))
    );
    const seen = new Set(
      original.map((e) => manualLevelPositionKey(e.fen, !!e.beginner))
    );
    return {
      ...category,
      exercises: [
        ...original,
        ...target
          .filter((e) => {
            const key = manualLevelPositionKey(e.fen, e.level === 'Beginner');
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          })
          .map(manualExercise),
      ],
    };
  });
}
export async function includeManualExercises<
  T extends { categories: DrawCategory[] },
>(pagePath: string, data: T): Promise<T> {
  const entries = await readManualTactics();
  const drawRoutes: Record<string, string> = {
    'perpetual-check': '/perpetual-check',
    stalemate: '/stalemate',
    'insufficient-material': '/insufficient-material',
    repetition: '/repetition-draw',
    fortress: '/fortress-draw',
  };
  return {
    ...data,
    categories: await includePracticeManagement(
      pagePath,
      pagePath === '/draw'
        ? data.categories.map(
            (c) => mergeManualCategories(drawRoutes[c.id], [c], entries)[0]
          )
        : mergeManualCategories(pagePath, data.categories, entries)
    ),
  };
}
export function manualTopicPages(
  entries: ManualTactic[],
  adjustments: PracticeAdjustment[] = []
) {
  return tacticsCatalog.themes
    .filter(
      (theme) =>
        !theme.dedicatedPage &&
        (entries.some((e) => e.themeId === theme.id) ||
          adjustments.some(
            (entry) => practiceCurrentScope(entry) === manualTopicPath(theme)
          ))
    )
    .map((theme) => ({
      href: manualTopicPath(theme),
      group: 'Chiến thuật',
      title: theme.label,
      description: 'Luyện các thế cờ và phương án được thêm thủ công.',
      worksheetEndpoint: `/api/manual-tactic-exercises?theme=${theme.id}`,
    }));
}

export async function curatedPositionLevel(
  themeId: string,
  key: string,
  ignoreAdjustmentId?: string,
  onlyCuratedBeginner = false
) {
  const theme = tacticsCatalog.themes.find((t) => t.id === themeId);
  if (!theme) return undefined;
  const incoming = (await readPracticeAdjustments()).find(
    (entry) =>
      entry.id !== ignoreAdjustmentId &&
      entry.destinationScope &&
      practiceCurrentScope(entry) === manualTopicPath(theme) &&
      manualPositionKey(entry.reference.fen) === key
  );
  if (
    incoming &&
    (!onlyCuratedBeginner ||
      (incoming.reference.baseLevel === 'Beginner' &&
        !incoming.reference.manualId))
  )
    return onlyCuratedBeginner
      ? 'Beginner'
      : (incoming.level ?? incoming.reference.baseLevel);
  const route = theme.dedicatedPage;
  if (!route) return undefined;
  const topic = route === '/discovered-attack' ? 'discovery' : route.slice(1);
  const files =
    topic === 'skewer'
      ? [
          'src/lib/chess/skewer-exercises.json',
          'src/lib/chess/skewer-beginner-exercises.json',
          'src/lib/server/queen-skewer-intro.json',
          'src/lib/server/queen-skewer-pilot.json',
        ]
      : [
          `src/lib/server/${topic}-exercises.json`,
          ...(topic === 'discovery' || topic === 'fork'
            ? [`src/lib/server/${topic}-beginner-exercises.json`]
            : []),
        ];
  for (const name of files) {
    let items;
    try {
      items = JSON.parse(
        await fs.readFile(path.join(process.cwd(), name), 'utf8')
      );
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') continue;
      throw e;
    }
    for (const exercise of items.flatMap((item: DrawCategory | DrawExercise) =>
      'exercises' in item ? item.exercises : [item]
    ) as DrawExercise[])
      if (
        manualPositionKey(exercise.fen) === key &&
        (!onlyCuratedBeginner || exercise.beginner)
      )
        return exercise.beginner
          ? 'Beginner'
          : (exercise.difficulty?.level ?? 'đã lưu');
  }
  return undefined;
}
