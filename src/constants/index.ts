import { DifficultyType } from '@/types';

export const LEVEL_RATING: Record<DifficultyType, string> = {
  Beginner: 'Beginner (Rating: 800)',
  Easy: 'Easy (Rating: 0–1200)',
  Medium: 'Medium (Rating: 1200-1600)',
  Hard: 'Hard (Rating: 1600-2000)',
  'Very Hard': 'Very hard (Rating: 2000+)',
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
