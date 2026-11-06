import type { DrawCategory } from './draw-practice';
import { drawLevels, filterDrawLevel, type DrawLevel } from './draw-levels';

export const drawThemeRoutePaths: Record<string, string> = {
  'perpetual-check': '/perpetual-check',
  stalemate: '/stalemate',
  'insufficient-material': '/insufficient-material',
  repetition: '/repetition-draw',
  fortress: '/fortress-draw',
};

export type DrawThemeLink = {
  id: string;
  label: string;
  count: number;
  href: string;
};

/** Show only available draw themes; source data stays unchanged. */
export function drawPracticeChoices(
  categories: DrawCategory[]
): DrawCategory[] {
  return categories.filter(
    (category) =>
      category.exercises.length > 0 ||
      (category.removedCount ?? 0) > 0 ||
      (category.transferredCount ?? 0) > 0
  );
}

/** The Draw page always exposes Beginner and the five reviewed levels. */
export function drawPracticeLevelChoices(category: DrawCategory) {
  return [
    {
      id: 'beginner' as const,
      label: 'Nhập môn / Beginner',
      count: category.exercises.filter((exercise) => exercise.beginner).length,
    },
    ...drawLevels.map((level) => ({
      id: level,
      label: `Cấp độ ${level}`,
      count: filterDrawLevel(category.exercises, level).length,
    })),
  ];
}

/** Only the skewer page splits Beginner by the piece being skewered. */
export function beginnerPracticeExercises(
  category: DrawCategory,
  skewerKind?: 'king' | 'queen'
) {
  return category.exercises.filter(
    (exercise) =>
      exercise.beginner &&
      (!skewerKind || (exercise.beginnerKind ?? 'king') === skewerKind)
  );
}

/** Start sparse theme routes on their first level that has positions. */
export function initialDrawPracticeLevel(
  categories: DrawCategory[]
): DrawLevel | 'beginner' {
  if (categories.some((category) => category.exercises.some((e) => e.beginner)))
    return 'beginner';
  return (
    drawLevels.find((level) =>
      categories.some(
        (category) => filterDrawLevel(category.exercises, level).length > 0
      )
    ) ?? 'A'
  );
}

/** Route metadata keeps every Draw theme available from every theme page. */
export function drawThemeLinks(categories: DrawCategory[]): DrawThemeLink[] {
  return drawPracticeChoices(categories).flatMap((category) => {
    const href = drawThemeRoutePaths[category.id];
    return href
      ? [
          {
            id: category.id,
            label: category.shortLabel ?? category.title,
            count: category.exercises.length,
            href,
          },
        ]
      : [];
  });
}
