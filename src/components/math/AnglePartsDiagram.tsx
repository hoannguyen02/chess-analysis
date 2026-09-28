import s from './AngleExampleDiagram.module.css';

/** Label the parts of an angle before introducing measurements or bisectors. */
export default function AnglePartsDiagram() {
  return (
    <figure className={s.figure}>
      <svg
        viewBox="0 0 480 290"
        role="img"
        aria-label="Góc xOy: hai tia Ox và Oy cùng xuất phát từ đỉnh O. Chữ O chỉ đỉnh nằm giữa x và y trong tên góc."
      >
        <path d="M120 210 L178 210 A58 58 0 0 0 149 160 Z" fill="#e9efff" />
        <path
          d="M178 210 A58 58 0 0 0 149 160"
          fill="none"
          stroke="#64748b"
          strokeWidth="2"
        />
        <line
          x1="120"
          y1="210"
          x2="414"
          y2="210"
          stroke="#194be0"
          strokeWidth="3"
        />
        <path d="M414 210 L403 204 L403 216 Z" fill="#194be0" />
        <line
          x1="120"
          y1="210"
          x2="213"
          y2="49"
          stroke="#287b62"
          strokeWidth="3"
        />
        <path d="M213 49 L202 56 L213 62 Z" fill="#287b62" />
        <text x="430" y="216" fontSize="22" fill="#194be0">
          x
        </text>
        <text x="221" y="40" fontSize="22" fill="#287b62">
          y
        </text>
        <text x="273" y="240" textAnchor="middle" fontSize="18" fill="#194be0">
          Cạnh: tia Ox
        </text>
        <text x="239" y="108" fontSize="18" fill="#287b62">
          Cạnh: tia Oy
        </text>
        <circle cx="120" cy="210" r="6" fill="#17243e" />
        <text x="96" y="239" fontSize="22" fontWeight="bold" fill="#17243e">
          O
        </text>
        <text x="39" y="192" fontSize="18" fill="#17243e">
          Đỉnh O
        </text>
      </svg>
      <figcaption>
        <span aria-label="Tên góc xOy, chữ O chỉ đỉnh nằm ở giữa">
          Tên góc:{' '}
          <span
            aria-hidden="true"
            style={{
              display: 'inline-block',
              position: 'relative',
              paddingTop: '0.25em',
              fontSize: '1.25em',
            }}
          >
            <svg
              viewBox="0 0 100 12"
              preserveAspectRatio="none"
              style={{
                position: 'absolute',
                top: 0,
                width: '100%',
                height: '0.2em',
              }}
            >
              <path
                d="M1 11 L50 1 L99 11"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
            x
            <strong
              style={{
                color: '#194be0',
                background: '#e9efff',
                borderRadius: 4,
                padding: '0 3px',
              }}
            >
              O
            </strong>
            y
          </span>
        </span>
        <span>Chữ O chỉ đỉnh, luôn nằm giữa hai chữ còn lại.</span>
      </figcaption>
    </figure>
  );
}
