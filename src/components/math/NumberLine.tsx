import { MathBlock } from '@/lib/math/lessons';
import { Fraction } from './MathText';
import s from './MathLesson.module.css';

export default function NumberLine({ values }: { values: MathBlock['values'] }) {
  const [min, max, divisions, point] = values;
  const x = (n: number) => 40 + (n - min) * 560 / (max - min);
  const ticks = Array.from({length: (max - min) * divisions + 1}, (_, i) => min + i / divisions);
  const numerator = Math.round(point * divisions);
  return <figure className={s.visual}>
    <svg viewBox="0 0 640 155" role="img" aria-label={`Trục số từ ${min} đến ${max}, mỗi đơn vị chia ${divisions} phần bằng nhau. Điểm A biểu diễn ${numerator}/${divisions}.`}>
      <line x1="20" y1="75" x2="620" y2="75" stroke="#17243e" strokeWidth="2" />
      <path d="M 611 69 L 621 75 L 611 81" fill="none" stroke="#17243e" strokeWidth="2" />
      {ticks.map((n,i) => <g key={i}>
        <line x1={x(n)} x2={x(n)} y1={Number.isInteger(n) ? 65 : 70} y2={Number.isInteger(n) ? 85 : 80} stroke="#17243e" strokeWidth={Number.isInteger(n) ? 2 : 1} />
        {Number.isInteger(n) && <text x={x(n)} y="108" textAnchor="middle" fontSize="18" fill="#17243e">{n}</text>}
      </g>)}
      <circle cx={x(point)} cy="75" r="6" fill="#164bdb" />
      <text x={x(point)} y="48" textAnchor="middle" fontSize="20" fill="#164bdb">A</text>
      <text x="620" y="105" fontSize="16" fill="#17243e">x</text>
    </svg>
    <figcaption>Điểm A biểu diễn <Fraction n={numerator} d={divisions} />. Mỗi đơn vị chia thành {divisions} phần bằng nhau.</figcaption>
  </figure>;
}
