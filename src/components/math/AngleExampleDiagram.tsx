import AnglePartsDiagram from './AnglePartsDiagram';
import CrossingAngleDiagram from './CrossingAngleDiagram';
import type { MathBlock } from '@/lib/math/lessons';
import { angleLesson } from '@/lib/math/angle-lesson';
import AngleDiagram from './AngleDiagram';

const examples: Record<
  string,
  { total: number; split: number; names: [string, string, string] }
> = {
  'angle-ex1': { total: 120, split: 60, names: ['x', 'z', 'y'] },
  'angle-ex2': { total: 50, split: 25, names: ['a', 't', 'b'] },
  'angle-ex3': { total: 110, split: 40, names: ['x', 'z', 'y'] },
};
export default function AngleExampleDiagram({ block }: { block: MathBlock }) {
  if (
    block.id === 'angle-pre' &&
    angleLesson.blocks.some(
      (original) => original.id === block.id && original.text === block.text
    )
  )
    return <AnglePartsDiagram />;
  if (
    block.id === 'angle-cross-ex1' &&
    angleLesson.blocks.some(
      (original) => original.id === block.id && original.text === block.text
    )
  )
    return (
      <>
        <CrossingAngleDiagram angle={60} target="opposite" reveal />
        <CrossingAngleDiagram angle={60} target="adjacent" reveal />
      </>
    );
  const example = examples[block.id];
  // Never pair a teacher's changed problem with the original numerical diagram.
  if (
    !example ||
    !angleLesson.blocks.some(
      (original) => original.id === block.id && original.text === block.text
    )
  )
    return null;
  const { total, split, names } = example;
  const equal = split === total - split;
  const caption = `Góc ${names[0]}O${names[2]} = ${total}°. ${split}° + ${total - split}° = ${total}°. Tia O${names[1]} ${equal ? 'là' : 'không phải'} tia phân giác.`;
  return (
    <AngleDiagram
      total={total}
      split={split}
      names={names}
      labels={[`${split}°`, `${total - split}°`]}
      equal={equal}
      caption={caption}
    />
  );
}
