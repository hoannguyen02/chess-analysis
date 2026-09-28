import { MathText } from './MathText';
import s from './AngleExampleDiagram.module.css';

export default function CrossingAngleDiagram({
  angle,
  target,
  reveal = false,
}: {
  angle: number;
  target: 'opposite' | 'adjacent';
  reveal?: boolean;
}) {
  const point = (degrees: number, radius: number) => ({
    x: 220 + radius * Math.cos((degrees * Math.PI) / 180),
    y: 180 - radius * Math.sin((degrees * Math.PI) / 180),
  });
  const targetName = target === 'opposite' ? "x'Oy'" : "x'Oy";
  const value = target === 'opposite' ? angle : 180 - angle;
  const sectors = [
    { from: 0, to: angle, text: `${angle}°`, color: '#334155' },
    {
      from: target === 'opposite' ? 180 : angle,
      to: target === 'opposite' ? 180 + angle : 180,
      text: reveal ? `${value}°` : '?',
      color: '#194be0',
    },
  ];
  const caption = `Hai đường thẳng xx′ và yy′ cắt nhau tại O. Góc xOy = ${angle}°. Góc ${targetName} ${reveal ? `= ${value}°` : 'cần tìm được tô xanh'}.`;
  return (
    <figure className={s.figure}>
      <svg viewBox="0 0 440 360" role="img" aria-label={caption}>
        {sectors.map((sector, index) => {
          const start = point(sector.from, 45),
            end = point(sector.to, 45),
            label = point((sector.from + sector.to) / 2, 76);
          return (
            <g key={index}>
              <path
                d={`M220 180 L${start.x} ${start.y} A45 45 0 0 0 ${end.x} ${end.y} Z`}
                fill={index ? '#e9efff' : '#f1f5f9'}
              />
              <path
                d={`M${start.x} ${start.y} A45 45 0 0 0 ${end.x} ${end.y}`}
                fill="none"
                stroke={sector.color}
                strokeWidth="2"
              />
              <text
                x={label.x}
                y={label.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={sector.color}
                fontSize="18"
              >
                {sector.text}
              </text>
            </g>
          );
        })}
        {[0, angle, 180, 180 + angle].map((degrees, i) => {
          const end = point(degrees, 145),
            label = point(degrees, 165);
          return (
            <g key={i}>
              <line
                x1="220"
                y1="180"
                x2={end.x}
                y2={end.y}
                stroke="#334155"
                strokeWidth="2"
              />
              <text
                x={label.x}
                y={label.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="19"
                fill="#334155"
              >
                {['x', 'y', 'x′', 'y′'][i]}
              </text>
            </g>
          );
        })}
        <circle cx="220" cy="180" r="3" fill="#334155" />
        <text x="225" y="200" fontSize="17">
          O
        </text>
      </svg>
      <figcaption>
        <MathText>{caption}</MathText>
      </figcaption>
    </figure>
  );
}
