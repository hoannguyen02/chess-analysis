import s from './AngleExampleDiagram.module.css';

const point = (angle: number, radius: number) => ({
  x: 220 + radius * Math.cos((angle * Math.PI) / 180),
  y: 230 - radius * Math.sin((angle * Math.PI) / 180),
});

export default function AngleDiagram({
  total,
  split,
  names,
  labels,
  equal,
  caption,
  totalLabel,
}: {
  total: number;
  split: number;
  names: [string, string, string];
  labels: [string, string];
  equal: boolean;
  caption: string;
  totalLabel?: string;
}) {
  return (
    <figure className={s.figure}>
      <svg viewBox="0 0 440 275" role="img" aria-label={caption}>
        {[
          { from: 0, to: split, r: 60, label: 95, color: '#194be0' },
          { from: split, to: total, r: 105, label: 138, color: '#287b62' },
        ].map((part, index) => {
          const a = point(part.from, part.r),
            b = point(part.to, part.r),
            mid = (part.from + part.to) / 2;
          const text = point(mid, part.label),
            tick1 = point(mid, part.r - 5),
            tick2 = point(mid, part.r + 5);
          return (
            <g key={index}>
              <path
                d={`M220 230 L${a.x} ${a.y} A${part.r} ${part.r} 0 0 0 ${b.x} ${b.y} Z`}
                fill={index === 0 ? '#e9efff' : '#e5f4ed'}
              />
              <path
                d={`M${a.x} ${a.y} A${part.r} ${part.r} 0 0 0 ${b.x} ${b.y}`}
                fill="none"
                stroke={part.color}
                strokeWidth="2"
              />
              {equal && (
                <line
                  x1={tick1.x}
                  y1={tick1.y}
                  x2={tick2.x}
                  y2={tick2.y}
                  stroke={part.color}
                  strokeWidth="2"
                />
              )}
              <text
                x={text.x}
                y={text.y}
                fill={part.color}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="18"
              >
                {labels[index]}
              </text>
            </g>
          );
        })}
        {totalLabel && (
          <g fill="#7c3aed">
            <path
              d={`M${point(0, 165).x} ${point(0, 165).y} A165 165 0 0 0 ${point(total, 165).x} ${point(total, 165).y}`}
              fill="none"
              stroke="currentColor"
              style={{ color: '#7c3aed' }}
              strokeWidth="2"
              strokeDasharray="5 3"
            />
            <text x="220" y="20" textAnchor="middle" fontSize="16">
              {totalLabel}
            </text>
          </g>
        )}
        {[0, split, total].map((angle, index) => {
          const end = point(angle, 180),
            base = point(angle, 170),
            label = point(angle, 202);
          const dx = 4 * Math.sin((angle * Math.PI) / 180),
            dy = 4 * Math.cos((angle * Math.PI) / 180);
          const color = index === 1 ? '#194be0' : '#334155';
          return (
            <g key={index}>
              <line
                x1="220"
                y1="230"
                x2={end.x}
                y2={end.y}
                stroke={color}
                strokeWidth="2.5"
              />
              <polygon
                points={`${end.x},${end.y} ${base.x + dx},${base.y + dy} ${base.x - dx},${base.y - dy}`}
                fill={color}
              />
              <text
                x={label.x}
                y={label.y}
                fill={color}
                fontSize="19"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {names[index]}
              </text>
            </g>
          );
        })}
        <circle cx="220" cy="230" r="4" fill="#334155" />
        <text x="205" y="255" fontSize="19" fill="#334155">
          O
        </text>
      </svg>
      <figcaption>
        {caption}
        {equal && <span>Hai dấu gạch trên cung chỉ hai góc bằng nhau.</span>}
      </figcaption>
    </figure>
  );
}
