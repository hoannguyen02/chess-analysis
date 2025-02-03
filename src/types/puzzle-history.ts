import { SolveStatusType } from '.';

export type PuzzleHistory = {
  user: string; // Reference to User
  puzzle: string; // Reference to Puzzle
  status: SolveStatusType;
  userRatingBefore: number;
  userRatingAfter: number;
  timeTaken: number; // in seconds
  usedHint: boolean;
  themes: string[];
  attemptedAt: string;
};
