import { DifficultyType } from '@/types';

export const LEVEL_RATING: Record<DifficultyType, string> = {
  Beginner: 'Beginner (Elo: 800)',
  Easy: 'Easy (Elo: 0–1200)',
  Medium: 'Medium (Elo: 1200-1600)',
  Hard: 'Hard (Elo: 1600-2000)',
  'Very Hard': 'Very hard (Elo: 2000+)',
};

export const RatingOptions = Object.entries(LEVEL_RATING).map(
  ([rating, title]) => ({
    value: rating,
    label: title,
  })
);

export const Statues = ['Draft', 'Active', 'Inactive', 'Deleted'];

export const StatusOptions = Statues.map((status) => ({
  value: status as string,
  label: status as string,
}));

export const SolveStatues = ['solved', 'failed'];

export const Phases = ['Opening', 'Middle', 'Endgame'];

export const PhaseOptions = Phases.map((status) => ({
  value: status as string,
  label: status as string,
}));

export const PreMovePlayerOptions = [
  {
    value: 'w',
    label: 'White',
  },
  {
    value: 'b',
    label: 'Black',
  },
];

export const SolutionMovePlayerOptions = [
  {
    value: 'user',
    label: 'User',
  },
  {
    value: 'engine',
    label: 'Engine',
  },
];

export const ExcludeThemeInFilter: Record<string, string> = {
  OPENING: 'OPENING',
  'BASIC-MOVES': 'BASIC-MOVES',
} as const;
