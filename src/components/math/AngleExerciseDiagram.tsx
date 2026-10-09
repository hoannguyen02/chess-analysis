import ParallelDiagram from './ParallelDiagram';
import AngleConstructionDiagram from './AngleConstructionDiagram';
import CrossingAngleDiagram from './CrossingAngleDiagram';
import type { MathExercise } from '@/lib/math/lessons';
import { exerciseAngleDiagram } from '@/lib/math/angle-diagram';
import AngleDiagram from './AngleDiagram';

export default function AngleExerciseDiagram({
  exercise,
  reveal,
}: {
  exercise: MathExercise;
  reveal: boolean;
}) {
  const diagram = exerciseAngleDiagram(exercise);
  if (!diagram) return null;
  if (diagram.kind === 'parallel') return <ParallelDiagram config={diagram.config} reveal={reveal} />;
  if (diagram.kind === 'construction')
    return <AngleConstructionDiagram id={diagram.id} reveal={reveal} />;
  if (diagram.kind === 'crossing')
    return (
      <CrossingAngleDiagram
        angle={diagram.angle}
        target={diagram.target}
        reveal={reveal}
      />
    );
  const { total, split, given, bisector, names = ['x', 'z', 'y'] } = diagram;
  const label = (value: number, known: boolean) =>
    known || reveal ? `${String(value).replace('.', ',')}°` : '?';
  const labels: [string, string] = [
    label(split, given[1]),
    label(total - split, given[2]),
  ];
  const findWhole = diagram.findWhole;
  const captionLabels = [...labels];
  if (findWhole && !reveal) {
    if (!given[1]) labels[0] = '';
    if (!given[2]) labels[1] = '';
  }
  const caption = `Góc ${names[0]}O${names[2]} = ${label(total, given[0])}; góc ${names[0]}O${names[1]} = ${captionLabels[0]}; góc ${names[1]}O${names[2]} = ${captionLabels[1]}.`;
  return (
    <AngleDiagram
      total={total}
      split={split}
      names={names}
      labels={labels}
      equal={bisector || (reveal && split === total - split)}
      caption={
        findWhole
          ? `Cung nét đứt chỉ cả góc ${names[0]}O${names[2]} cần tìm. ${caption}`
          : caption
      }
      totalLabel={
        findWhole
          ? `Cả góc ${names[0]}O${names[2]} = ${label(total, given[0])}`
          : undefined
      }
    />
  );
}
