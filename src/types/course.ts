import { DifficultyType, ObjectiveType } from '.';
import { Lesson } from './lesson';
import { StatusType } from './status';

export type Course = {
  title: {
    en: string;
    vi: string;
  };
  description?: {
    en: string;
    vi: string;
  };
  objectives?: ObjectiveType;
  lessons: { lessonId: string }[];
  tags?: string[];
  difficulty?: DifficultyType;
  status: StatusType;
  _id?: string;
  isPublic?: boolean;
  slug: string;
  priority?: number;
  totalLessons: number; // Precomputed
  version: number; // Track version changes
  // Only available for logged in users
  progress?: {
    completedLessonsCount: number;
    completionPercentage: number;
  };
};

export type CourseExpanded = {
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
  slug: string;
  priority?: number;
  totalLessons: number; // Precomputed
  version: number; // Track version changes
  // Only available for logged in users
  progress?: {
    completedLessonsCount: number;
    completionPercentage: number;
  };
};
