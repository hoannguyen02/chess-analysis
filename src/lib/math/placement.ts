import type { MathLessonData } from './lessons';

export const semesterLabel = (semester: MathLessonData['semester']) =>
  semester ? `Học kỳ ${semester}` : 'Chưa phân loại';

export function matchesPlacement(lesson: MathLessonData, grade: string, semester: string) {
  return (!grade || lesson.grade === Number(grade)) &&
    (!semester || (semester === 'unassigned' ? !lesson.semester : lesson.semester === semester));
}
