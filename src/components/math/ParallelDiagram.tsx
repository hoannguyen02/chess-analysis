import {
  parallelGeometry,
  type ParallelFigure,
} from '@/lib/math/parallel-geometry';
import s from './AngleExampleDiagram.module.css';
export default function ParallelDiagram({
  config,
  reveal = false,
}: {
  config: ParallelFigure;
  reveal?: boolean;
}) {
  const { items, caption } = parallelGeometry(config, reveal);
  return (
    <figure className={s.figure}>
      <svg viewBox="0 0 440 305" role="img" aria-label={caption}>
        {items.map((item, i) =>
          'points' in item ? (
            <polyline
              key={i}
              points={item.points.map((p) => p.join(',')).join(' ')}
              fill="none"
              stroke="#334155"
              strokeWidth="1.7"
            />
          ) : (
            <text
              key={i}
              x={item.at[0]}
              y={item.at[1]}
              fontSize={item.size}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#17243e"
            >
              {item.text}
            </text>
          )
        )}
      </svg>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}
