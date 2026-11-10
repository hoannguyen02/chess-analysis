import type { DrawExercise } from './draw-practice';
import type { DrawDifficulty, PracticeLevel } from './draw-levels';

export type PracticeExerciseManagement = {
  id: string;
  scope: string;
  baseLevel: PracticeLevel;
  baseDifficulty?: DrawDifficulty;
  currentScope?: string;
  updatedAt: string | null;
  writable: boolean;
  signature?: string;
  /** Signed source stays separate from the owner's editable teaching lines. */
  sourceReference?: PracticeReviewReference;
  solutionEdited?: boolean;
};

export type PracticeSolution = {
  moves: string[];
  alternativeLines: string[][];
  solution: string;
};

export type PracticeReviewReference = {
  scope: string;
  fen: string;
  baseLevel: PracticeLevel | undefined;
  title: string;
  moves: string[];
  alternativeLines: string[][];
  goal: DrawExercise['goal'] | null;
  previousMove: DrawExercise['previousMove'] | null;
  gameReference: DrawExercise['gameReference'] | null;
  manualId: string | null;
  // Older level/removal decisions predate cross-topic transfers.
  exercise?: Omit<DrawExercise, 'management'>;
};

/** A source snapshot for a manual editorial decision, never a replacement game. */
export function practiceReviewReference(
  scope: string,
  exercise: DrawExercise
): PracticeReviewReference {
  if (exercise.management?.sourceReference)
    return exercise.management.sourceReference;
  const { management, difficulty } = exercise;
  const content = { ...exercise };
  delete content.management;
  delete content.difficulty;
  delete content.beginner;
  const baseLevel =
    management?.baseLevel ??
    (exercise.beginner ? 'Beginner' : difficulty?.level);
  const baseDifficulty = management ? management.baseDifficulty : difficulty;
  return {
    scope,
    fen: exercise.fen,
    baseLevel,
    title: exercise.playerTitle || exercise.title,
    moves: exercise.moves,
    alternativeLines: exercise.alternativeLines ?? [],
    goal: exercise.goal ?? null,
    previousMove: exercise.previousMove ?? null,
    gameReference: exercise.gameReference ?? null,
    manualId: exercise.manualId ?? null,
    exercise: {
      ...content,
      beginner: baseLevel === 'Beginner',
      ...(baseDifficulty ? { difficulty: baseDifficulty } : {}),
    },
  };
}
export type PracticeAdjustment = {
  id: string;
  reference: PracticeReviewReference;
  level: PracticeLevel | null;
  destinationScope?: string;
  removed: boolean;
  note: string;
  solutionOverride?: PracticeSolution;
  updatedAt: string;
  history: {
    action:
      | 'move'
      | 'remove'
      | 'restore'
      | 'reset'
      | 'solution'
      | 'reset-solution';
    solution?: PracticeSolution;
    level: PracticeLevel | null;
    scope?: string;
    note: string;
    at: string;
  }[];
};

export const practiceCurrentScope = (entry: PracticeAdjustment) =>
  entry.destinationScope ?? entry.reference.scope;

export function practiceManagementHref(
  scope: string,
  level: PracticeLevel,
  id?: string
) {
  return `${scope}${scope.includes('?') ? '&' : '?'}level=${encodeURIComponent(level)}${id ? `&exercise=${id}` : ''}`;
}

export function practiceReviewKey(exercise: DrawExercise) {
  return (
    exercise.manualId ?? exercise.management?.id ?? exercise.url ?? exercise.fen
  );
}

/** Retain the exercise when possible, otherwise use its slot in the filtered list. */
export function refreshedPracticeReviewIndex(
  exercises: DrawExercise[],
  key: string | undefined,
  index: number
) {
  const match = exercises.findIndex(
    (exercise) => practiceReviewKey(exercise) === key
  );
  return match >= 0
    ? match
    : Math.max(0, Math.min(index, exercises.length - 1));
}

export function practiceReviewIndex(
  exercises: DrawExercise[],
  id: unknown,
  fallback: unknown
) {
  const match =
    typeof id === 'string'
      ? exercises.findIndex(
          (exercise) =>
            exercise.manualId === id || exercise.management?.id === id
        )
      : -1;
  if (match >= 0) return match;
  const index =
    typeof fallback === 'string' && /^\d+$/.test(fallback)
      ? Number(fallback)
      : 0;
  return Math.max(
    0,
    Math.min(Number.isSafeInteger(index) ? index : 0, exercises.length - 1)
  );
}
