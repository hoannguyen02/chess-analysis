import type { MathBlock } from '@/lib/math/lessons';
import { parallelFigureFor } from '@/lib/math/parallel-lesson';
import ParallelDiagram from './ParallelDiagram';
export default function ParallelBlockDiagram({ block }: { block: MathBlock }) {
  const config = parallelFigureFor(block);
  return config ? <ParallelDiagram config={config} /> : null;
}
