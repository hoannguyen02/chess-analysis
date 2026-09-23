import { segmentGeometry } from '@/lib/math/segment';
export default function SegmentDiagram({ values }: { values: number[] }) {
  const g = segmentGeometry(values);
  return <svg viewBox="0 0 480 110" role="img"
    aria-label={g.lift ? 'A và B nằm trên đoạn thẳng; M nằm ngoài đường thẳng AB.' : `A, M, B thẳng hàng theo thứ tự đó.${g.show ? ` AM = ${g.left} cm; MB = ${g.right} cm.` : ''}`}
    style={{ display: 'block', width: '100%', maxWidth: 600, margin: '16px 0' }}>
    <line x1="30" y1="70" x2="450" y2="70" stroke="#243655" strokeWidth="2" />
    {g.lift && <path d={`M30 70 L${g.middle} ${g.y} L450 70`} fill="none" stroke="#64748b" strokeDasharray="5 5" />}
    {[[30,70,'A'],[g.middle,g.y,'M'],[450,70,'B']].map(([x,y,label]) => <g key={label}>
      <circle cx={x} cy={y} r="4" fill="#243655" />
      <text x={x} y={Number(y)+25} textAnchor="middle" fontSize="16" fill="#243655">{label}</text>
    </g>)}
    {g.show && <g textAnchor="middle" fontSize="15" fill="#243655">
      <text x={(30+g.middle)/2} y="55">{g.left} cm</text>
      <text x={(450+g.middle)/2} y="55">{g.right} cm</text>
    </g>}
  </svg>;
}
