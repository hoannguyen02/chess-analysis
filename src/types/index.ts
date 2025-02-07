export type ObjectiveType = {
  en?: string[];
  vi?: string[];
};

export type ExplanationType = {
  en?: string[];
  vi?: string[];
};

export type PhaseType = 'Opening' | 'Middle' | 'Endgame';

export type LessonProgress = {
  completedPuzzles: string[];
  completedAtVersion: number;
  lessonId?: string;
};

/**
 * 0-800: Beginner
 * 800-1200: Easy
 * 1200-1600: Medium
 * 1600-2000: Hard
 * 2000+: Very Hard
 */
export type DifficultyType =
  | 'Beginner'
  | 'Easy'
  | 'Medium'
  | 'Hard'
  | 'Very Hard';

export type SolveStatusType = 'solved' | 'failed';

export type PaginatedList<T> = {
  items: T[];
  total?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
  currentPage?: number;
  nextPage?: number;
  prevPage?: number;
  lastPage: number;
};
