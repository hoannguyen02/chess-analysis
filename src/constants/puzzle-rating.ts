import { PuzzleDifficulty } from '@/types/puzzle';

/**
 * 800-1200: Easy
 * 1200-1600: Medium
 * 1600-2000: Hard
 * 2000+: Very hard
 */
export const PUZZLE_RATING: Record<PuzzleDifficulty, string> = {
  Easy: '800-1200: Easy',
  Medium: '1200-1600: Medium',
  Hard: '1600-2000: Hard',
  'Very Hard': '2000+: Very hard',
};
