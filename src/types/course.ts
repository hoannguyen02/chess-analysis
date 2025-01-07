import { Lesson } from './lesson';
import { DifficultyType, StatusType } from './status';

export type Course = {
  title: string;
  description?: string;
  objectives?: string[];
  lessons: { lessonId: string }[];
  tags?: string[];
  difficulty?: DifficultyType;
  status: StatusType;
  _id?: string;
  isPublic?: boolean;
};

export type CourseExpanded = {
  title: string;
  description?: string;
  objectives?: string[];
  tags?: string[];
  difficulty?: DifficultyType;
  status: StatusType;
  _id?: string;
  isPublic?: boolean;
  lessons: { lessonId: Lesson }[];
};
