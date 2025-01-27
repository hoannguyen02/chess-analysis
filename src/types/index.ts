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
  completedPuzzlesCount: number;
  completedAtVersion: number;
  lessonId?: string;
};
