import {
  angleConstruction,
  type ConstructionId,
} from '@/lib/math/angle-construction';
import s from './AngleExampleDiagram.module.css';
export default function AngleConstructionDiagram({
  id,
  reveal,
}: {
  id: ConstructionId;
  reveal: boolean;
}) {
  const { items, caption } = angleConstruction(id, reveal);
  return (
    <figure className={s.figure}>
      <svg viewBox="0 0 440 305" role="img" aria-label={caption}>
        {items.map((item, i) =>
          'points' in item ? (
            <polyline
              key={i}
              points={item.points.map((p) => p.join(',')).join(' ')}
              fill="none"
              stroke={item.dashed ? '#194be0' : '#334155'}
              strokeWidth={item.dashed ? 2 : 1.5}
              strokeDasharray={item.dashed ? '5 3' : undefined}
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
