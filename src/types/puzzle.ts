import { DifficultyType } from '.';
import { StatusType } from './status';

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
  difficulty: DifficultyType;
  isPublic: boolean;
  themes: string[];
  solutions: PuzzleSolutionMove[];
  preMove?: PuzzlePreMove;
  title?: {
    en: string;
    vi: string;
  };
  hint?: {
    en: string;
    vi: string;
  };
  phase?: PuzzlePhase;
  _id?: string;
  puzzleId?: any;
  created_at?: string;
  updated_at?: string;
  customArrows?: [string, string, string?][];
};

export type SolvedData = {
  usedHint: boolean;
  timeTaken: number;
  failedAttempts: number;
};
