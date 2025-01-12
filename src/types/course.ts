import { ObjectiveType } from '.';
import { Lesson } from './lesson';
import { DifficultyType, StatusType } from './status';

export type Course = {
  title: {
    en: string;
    vi: string;
  };
  description?: {
    en: string;
    vi: string;
  };
  theme?: string;
  objectives?: ObjectiveType;
  lessons: { lessonId: string }[];
  tags?: string[];
  difficulty?: DifficultyType;
  status: StatusType;
  _id?: string;
  isPublic?: boolean;
};

export type CourseExpanded = {
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
  tags?: string[];
  difficulty?: DifficultyType;
  status: StatusType;
  _id?: string;
  isPublic?: boolean;
  lessons: { lessonId: Lesson }[];
};
