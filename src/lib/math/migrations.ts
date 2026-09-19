import { fractionExtraExercises } from './extra-examples';
import { MathLessonData } from './lessons';

// Run once for libraries saved before extra practice was built into the lesson.
// Preserve teacher edits and existing practice sets; never recreate deleted lessons.
export function addBuiltInFractionPractice(lessons: MathLessonData[]) {
  return lessons.map((lesson) => {
    if (
      lesson.id !== 'math-fractions-6' ||
      lesson.grade !== 6 ||
      lesson.topic !== 'Phân số' ||
      lesson.exercises.some((exercise) => exercise.section === 'extra') ||
      lesson.exercises.length + fractionExtraExercises.length > 100
    )
      return lesson;
    const ids = new Set(lesson.exercises.map((exercise) => exercise.id));
    const extra = structuredClone(fractionExtraExercises).map((exercise) => {
      let id = exercise.id;
      while (ids.has(id)) id += '-extra';
      ids.add(id);
      return { ...exercise, id };
    });
    return { ...lesson, exercises: [...lesson.exercises, ...extra] };
  });
}
