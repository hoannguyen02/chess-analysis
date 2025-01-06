import { Puzzle } from './puzzle';
import { DifficultyType, StatusType } from './status';

export type ContentType = 'text' | 'video' | 'image';

export type Lesson = {
  title: string;
  description?: string;
  objectives?: string[];
  puzzles: { id: string; order: number }[];
  contents?: { type: ContentType; value: string; order: number }[];
  tags?: string[];
  difficulty?: DifficultyType;
  status: StatusType;
  _id?: string;
};

export type LessonExpanded = {
  title: string;
  description?: string;
  objectives?: string[];
  puzzles: { id: Puzzle; order: number }[];
  contents?: { type: ContentType; value: string; order: number }[];
  tags?: string[];
  difficulty?: DifficultyType;
  status: StatusType;
  _id?: string;
};
