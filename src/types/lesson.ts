import { ObjectiveType } from '.';
import { Puzzle } from './puzzle';
import { DifficultyType, StatusType } from './status';

export type ContentType = 'text' | 'video' | 'image';

export type Lesson = {
  theme?: string;
  title: {
    en: string;
    vi: string;
  };
  description?: {
    en: string;
    vi: string;
  };
  objectives?: ObjectiveType;
  puzzles: { puzzleId: string }[];
  contents?: {
    type: ContentType;
    value: {
      en: string;
      vi: string;
    };
    contentPuzzles: { puzzleId: string }[];
  }[];
  difficulty?: DifficultyType;
  status: StatusType;
  _id?: string;
  id?: string;
  isPublic?: boolean;
};

export type LessonExpanded = {
  theme?: string;
  title: {
    en: string;
    vi: string;
  };
  description?: {
    en: string;
    vi: string;
  };
  objectives?: ObjectiveType;
  puzzles: { puzzleId: Puzzle }[];
  contents?: {
    type: ContentType;
    value: {
      en: string;
      vi: string;
    };
    contentPuzzles: { puzzleId: Puzzle }[];
  }[];
  difficulty?: DifficultyType;
  status: StatusType;
  _id?: string;
  isPublic?: boolean;
};
