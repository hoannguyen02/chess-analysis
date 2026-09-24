import { segmentGeometry } from '@/lib/math/segment';
type SegmentLabels = [string, string, string];

export default function SegmentDiagram({
  values,
  labels = ['A', 'M', 'B'],
}: {
  values: number[];
  labels?: SegmentLabels;
}) {
  const g = segmentGeometry(values);
  const [start, middle, end] = labels;
  return (
    <svg
      viewBox="0 0 480 110"
      role="img"
      aria-label={
        g.lift
          ? `${start} và ${end} nằm trên đoạn thẳng; ${middle} nằm ngoài đường thẳng ${start}${end}.`
          : `${start}, ${middle}, ${end} thẳng hàng theo thứ tự đó.${g.show ? ` ${start}${middle} = ${g.left} cm; ${middle}${end} = ${g.right} cm.` : ''}`
      }
      style={{
        display: 'block',
        width: '100%',
        maxWidth: 600,
        margin: '16px 0',
      }}
    >
      <line x1="30" y1="70" x2="450" y2="70" stroke="#243655" strokeWidth="2" />
      {g.lift && (
        <path
          d={`M30 70 L${g.middle} ${g.y} L450 70`}
          fill="none"
          stroke="#64748b"
          strokeDasharray="5 5"
        />
      )}
      {[
        [30, 70, start],
        [g.middle, g.y, middle],
        [450, 70, end],
      ].map(([x, y, label]) => (
        <g key={label}>
          <circle cx={x} cy={y} r="4" fill="#243655" />
          <text
            x={x}
            y={Number(y) + 25}
            textAnchor="middle"
            fontSize="16"
            fill="#243655"
          >
            {label}
          </text>
        </g>
      ))}
      {g.show && (
        <g textAnchor="middle" fontSize="15" fill="#243655">
          <text x={(30 + g.middle) / 2} y="55">
            {g.left} cm
          </text>
          <text x={(450 + g.middle) / 2} y="55">
            {g.right} cm
          </text>
        </g>
      )}
    </svg>
  );
}
