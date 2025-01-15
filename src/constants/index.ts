import { PuzzleDifficulty } from '@/types/puzzle';

/**
 * 0-800: Beginner
 * 800-1200: Easy
 * 1200-1600: Medium
 * 1600-2000: Hard
 * 2000+: Very hard
 */
export const LEVEL_RATING: Record<PuzzleDifficulty, string> = {
  Beginner: 'Beginner (Rating: 800)',
  Easy: 'Easy (Rating: 0–1200)',
  Medium: 'Medium (Rating: 1200-1600)',
  Hard: 'Hard (Rating: 1600-2000)',
  'Very Hard': 'Very hard (Rating: 2000+)',
};

export const Statues = ['Draft', 'Active', 'Inactive', 'Deleted'];

export const Phases = ['Opening', 'Middle', 'Endgame'];
