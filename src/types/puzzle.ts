import { StatusType } from './status';

/**
 * 800-1200: Easy
 * 1200-1600: Medium
 * 1600-2000: Hard
 * 2000+: Very hard
 */
export type PuzzleDifficulty = 'Easy' | 'Medium' | 'Hard' | 'Very Hard';
export type PuzzlePhase = 'Opening' | 'Middle' | 'Endgame';
export type PuzzleSolutionMove = {
  move: string;
  player: 'user' | 'engine';
  from: string;
  to: string;
};
export type PuzzlePreMove = {
  move: string;
  player: 'b' | 'w';
  from: string;
  to: string;
};

export type Puzzle = {
  fen: string;
  status: StatusType;
  difficulty: PuzzleDifficulty;
  isPublic: boolean;
  theme: string;
  solutions: PuzzleSolutionMove[];
  preMove?: PuzzlePreMove;
  title?: string;
  phase?: PuzzlePhase;
  _id?: string;
  puzzleId?: string;
  lessons?: string[];
};
