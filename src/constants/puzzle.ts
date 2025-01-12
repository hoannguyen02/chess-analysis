import { PuzzleDifficulty } from '@/types/puzzle';

/**
 * 800-1200: Easy
 * 1200-1600: Medium
 * 1600-2000: Hard
 * 2000+: Very hard
 */
export const PUZZLE_RATING: Record<PuzzleDifficulty, string> = {
  Easy: 'Easy: 0 - 1200',
  Medium: 'Medium: 1200 - 1600',
  Hard: 'Hard: 1600 - 2000',
  'Very Hard': 'Hard: 2000+',
};

export const PuzzleStatues = ['Draft', 'Active', 'Inactive', 'Deleted'];
export const PuzzlePhases = ['Opening', 'Middle', 'Endgame'];
