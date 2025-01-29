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
 * 0-800: Easy
 * 800-1200: Easy
 * 1200-1600: Medium
 * 1600-2000: Hard
 * 2000+: Very hard
 */
export type DifficultyType =
  | 'Beginner'
  | 'Easy'
  | 'Medium'
  | 'Hard'
  | 'Very Hard';
