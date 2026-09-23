export default function UnitFraction({ values }: { values: number[] }) {
  const [parts, objects] = values;
  const width = 540 / parts;
  return <figure style={{ margin: '20px 0' }}>
    <svg viewBox="0 0 560 112" role="img" aria-label={objects
      ? `${parts * objects} chấm tròn chia thành ${parts} nhóm bằng nhau, mỗi nhóm ${objects} chấm. Một nhóm được tô màu.`
      : `Băng giấy chia thành ${parts} phần bằng nhau; tô màu một phần.`}
      style={{ display: 'block', width: '100%', maxWidth: 640 }}>
      {Array.from({ length: parts }, (_, i) => <g key={i}>
        <rect x={10 + i * width} y={10} width={width} height={90}
          fill={!objects && i === 0 ? '#3157d5' : '#fff'} stroke="#334155" />
        {objects > 0 && Array.from({ length: objects }, (_, j) => <circle key={j}
          cx={10 + i * width + width * ((j % 3) + 1) / 4}
          cy={28 + Math.floor(j / 3) * 25} r={Math.min(6, width / 10)}
          fill={i === 0 ? '#3157d5' : '#fff'} stroke="#334155" />)}
      </g>)}
    </svg>
    <figcaption>{objects ? `Một nhóm có ${objects} chấm tròn.` : `Một trong ${parts} phần bằng nhau được tô màu.`}</figcaption>
  </figure>;
}
