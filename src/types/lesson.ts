import { Puzzle } from './puzzle';
import { DifficultyType, StatusType } from './status';

export type ContentType = 'text' | 'video' | 'image';

export type Lesson = {
  title: string;
  description?: string;
  objectives?: string[];
  puzzles: { puzzleId: string }[];
  contents?: { type: ContentType; value: string }[];
  tags?: string[];
  difficulty?: DifficultyType;
  status: StatusType;
  _id?: string;
  id?: string;
  isPublic?: boolean;
};

export type LessonExpanded = {
  title: string;
  description?: string;
  objectives?: string[];
  puzzles: { puzzleId: Puzzle }[];
  contents?: { type: ContentType; value: string }[];
  tags?: string[];
  difficulty?: DifficultyType;
  status: StatusType;
  _id?: string;
  isPublic?: boolean;
};
