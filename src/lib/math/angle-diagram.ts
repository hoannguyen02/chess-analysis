import type { ConstructionId } from './angle-construction';
import type { MathExercise } from './lessons';
import { angleLesson } from './angle-lesson';
type Diagram = {
  total: number;
  split: number;
  names?: [string, string, string];
  given: [boolean, boolean, boolean]; // Total, first angle, second angle.
  bisector: boolean;
  findWhole?: boolean;
};
const diagrams: Record<string, Diagram> = {
  'angle-more-m1': {
    total: 74,
    split: 28,
    given: [false, true, true],
    bisector: false,
    findWhole: true,
  },
  'angle-more-m2': {
    total: 137,
    split: 59,
    given: [true, true, false],
    bisector: false,
  },
  'angle-more-m3': {
    total: 92,
    split: 46,
    given: [true, true, false],
    bisector: false,
  },
  'angle-g1': {
    total: 84,
    split: 42,
    given: [true, false, false],
    bisector: true,
  },
  'angle-g2': {
    total: 64,
    split: 32,
    names: ['a', 't', 'b'],
    given: [false, true, false],
    bisector: true,
  },
  'angle-p2': {
    total: 146,
    split: 73,
    given: [true, false, false],
    bisector: true,
  },
  'angle-p3': {
    total: 96,
    split: 43,
    given: [true, true, false],
    bisector: false,
  },
  'angle-e1': {
    total: 160,
    split: 80,
    given: [true, false, false],
    bisector: true,
  },
  'angle-e2': {
    total: 94,
    split: 47,
    names: ['a', 't', 'b'],
    given: [false, false, true],
    bisector: true,
  },
  'angle-e3': {
    total: 125,
    split: 55,
    given: [true, true, false],
    bisector: false,
  },
  'angle-e4': {
    total: 76,
    split: 38,
    given: [false, true, true],
    bisector: false,
  },
  'angle-e5': {
    total: 180,
    split: 90,
    names: ['a', 't', 'b'],
    given: [true, false, false],
    bisector: true,
  },
  'angle-e6': {
    total: 75,
    split: 37.5,
    given: [true, false, false],
    bisector: true,
  },
};

export function exerciseAngleDiagram(exercise: MathExercise) {
  if (
    !angleLesson.exercises.some(
      (original) =>
        original.id === exercise.id &&
        original.prompt === exercise.prompt &&
        original.answer === exercise.answer
    )
  )
    return null;
  const construction =
    exercise.id === 'angle-cross-e2'
      ? 'equal-angles'
      : exercise.id.replace('angle-more-', '');
  if (
    ['b4', 'm4', 'equal-angles', 'h1', 'h2', 'h3', 'h4', 'h5'].includes(
      construction
    )
  )
    return {
      kind: 'construction' as const,
      id: construction as ConstructionId,
    };
  const crossing: Record<string, [number, 'opposite' | 'adjacent']> = {
    'angle-more-h6': [54, 'adjacent'],
    'angle-cross-g1': [72, 'opposite'],
    'angle-cross-g2': [72, 'adjacent'],
    'angle-cross-p1': [118, 'opposite'],
    'angle-cross-p2': [118, 'adjacent'],
    'angle-cross-e1': [47, 'adjacent'],
  };

  const cross = crossing[exercise.id];
  if (cross)
    return { kind: 'crossing' as const, angle: cross[0], target: cross[1] };
  const diagram = diagrams[exercise.id];
  return diagram
    ? {
        kind: 'split' as const,
        ...diagram,
        findWhole:
          diagram.findWhole ||
          exercise.id === 'angle-g2' ||
          exercise.id === 'angle-e2',
      }
    : null;
}
