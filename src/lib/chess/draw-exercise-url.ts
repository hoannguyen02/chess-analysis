import type { DrawExercise } from './draw-practice';

export function drawExerciseUrl(exercise: DrawExercise): string {
  return (
    exercise.url ??
    `https://lichess.org/analysis/standard/${exercise.fen.replace(/ /g, '_')}`
  );
}
