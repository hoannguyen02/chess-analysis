import { DifficultyType, ExplanationType } from '.';
import { Puzzle } from './puzzle';
import { StatusType } from './status';

export type ContentType = 'text' | 'video' | 'image';

export type ContentLesson = {
  type: ContentType;
  title: {
    en: string;
    vi: string;
  };
  explanations?: ExplanationType;
  contentPuzzles: { puzzleId: Puzzle }[];
  tags?: string[];
  _id?: string;
};

export type Lesson = {
  title: {
    en: string;
    vi: string;
  };
  description?: {
    en: string;
    vi: string;
  };
  tags?: string[];
  themes?: string[];
  // objectives?: ObjectiveType;
  contents?: ContentLesson[];
  difficulty?: DifficultyType;
  status: StatusType;
  _id?: string;
  id?: string;
  isPublic?: boolean;
  slug: string;
  priority?: number;
  totalPuzzles: number; // Precomputed
  version: number; // Track version changes
  progress?: {
    completedPuzzlesCount: 2;
    completionPercentage: 8;
  };
};

export type LessonExpanded = {
  title: {
    en: string;
    vi: string;
  };
  description?: {
    en: string;
    vi: string;
  };
  tags?: string[];
  themes?: string[];
  // objectives?: ObjectiveType;
  contents?: ContentLesson[];
  difficulty?: DifficultyType;
  status: StatusType;
  _id?: string;
  isPublic?: boolean;
  slug: string;
  priority?: number;
  totalPuzzles: number; // Precomputed
  version: number; // Track version changes
  progress?: {
    completedPuzzlesCount: 2;
    completionPercentage: 8;
  };
};
