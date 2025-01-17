import { PuzzleTheme } from './puzzle-theme';
import { StatusType } from './status';

/**
 * 0-800: Beginner
 * 800-1200: Easy
 * 1200-1600: Medium
 * 1600-2000: Hard
 * 2000+: Very hard
 */
export type PuzzleDifficulty =
  | 'Beginner'
  | 'Easy'
  | 'Medium'
  | 'Hard'
  | 'Very Hard';
export type PuzzlePhase = 'Opening' | 'Middle' | 'Endgame';
export type PuzzleSolutionMove = {
  player: 'user' | 'engine';
  moves: {
    move: string;
    from: string;
    to: string;
  }[];
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
  themes: PuzzleTheme[];
  solutions: PuzzleSolutionMove[];
  preMove?: PuzzlePreMove;
  title?: {
    en: string;
    vi: string;
  };
  phase?: PuzzlePhase;
  _id?: string;
  puzzleId?: any;
};
