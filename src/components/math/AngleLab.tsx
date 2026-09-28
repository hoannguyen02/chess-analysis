import { useEffect, useRef, useState } from 'react';
import AngleDiagram from './AngleDiagram';
import s from './InteractiveLab.module.css';

const point = (angle: number, radius: number) => ({
  x: 210 + radius * Math.cos((angle * Math.PI) / 180),
  y: 205 - radius * Math.sin((angle * Math.PI) / 180),
});
export default function AngleLab({
  round,
  onComplete,
}: {
  round: number;
  onComplete: () => void;
}) {
  const total = round === 0 ? 70 : round === 1 ? 80 : round === 2 ? 130 : 70;
  const [position, setPosition] = useState(20);
  const [choice, setChoice] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [touched, setTouched] = useState(false);
  const [dragging, setDragging] = useState(false);
  const complete = useRef(onComplete);
  complete.current = onComplete;
  const moving = round === 1 || round === 2;
  useEffect(() => {
    if (!moving || !touched || dragging) return;
    const timer = setTimeout(() => {
      setChecked(true);
      if (position === total / 2) complete.current();
    }, 650);
    return () => clearTimeout(timer);
  }, [position, total, touched, dragging, moving]);
  const ray = (angle: number, label: string, color: string) => {
    const end = point(angle, 155),
      text = point(angle, 178);
    const base = point(angle, 146);
    const dx = 4 * Math.sin((angle * Math.PI) / 180);
    const dy = 4 * Math.cos((angle * Math.PI) / 180);
    return (
      <g key={label}>
        <line
          x1="210"
          y1="205"
          x2={end.x}
          y2={end.y}
          stroke={color}
          strokeWidth="3"
        />
        <polygon
          points={`${end.x},${end.y} ${base.x + dx},${base.y + dy} ${base.x - dx},${base.y - dy}`}
          fill={color}
        />
        <text
          x={text.x}
          y={text.y}
          fill={color}
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {label}
        </text>
      </g>
    );
  };
  const options =
    round === 0 ? ['Góc nhọn', 'Góc vuông', 'Góc tù'] : ['35°', '70°', '140°'];
  const correct = round === 0 ? choice === 'Góc nhọn' : choice === '70°';
  function move(value: number) {
    setPosition(value);
    setTouched(true);
    setChecked(false);
  }
  return (
    <>
      <h3>
        {round === 0
          ? 'Quan sát và đo góc'
          : moving
            ? 'Đặt tia Oz để chia góc thành hai phần bằng nhau'
            : 'Biết một nửa, tìm cả góc'}
      </h3>
      <p>
        {round === 0
          ? 'Đọc thước từ tia Ox, rồi chọn loại góc xOy.'
          : moving
            ? `Góc xOy bằng ${total}°. Di chuyển tia Oz để Oz là tia phân giác.`
            : 'Oz là tia phân giác của góc xOy. Góc xOz bằng 35°. Góc xOy bằng bao nhiêu?'}
      </p>
      <div className={s.workspace}>
        {round === 3 ? (
          <AngleDiagram
            total={70}
            split={35}
            names={['x', 'z', 'y']}
            labels={['35°', choice && correct ? '35°' : '']}
            equal
            totalLabel={`Cả góc xOy = ${choice && correct ? '70°' : '?'}`}
            caption="Cung nét đứt chỉ cả góc xOy cần tìm. Hai cung nhỏ có dấu gạch giống nhau vì Oz là tia phân giác."
          />
        ) : (
          <svg
            viewBox="0 0 420 250"
            style={{
              width: '100%',
              maxWidth: 600,
              display: 'block',
              margin: 'auto',
            }}
            role="img"
            aria-label={
              moving
                ? `Góc xOy ${total} độ, tia Oz nằm trong góc.`
                : round === 0
                  ? 'Thước đo góc: Ox tại 0 độ, Oy tại 70 độ.'
                  : 'Oz nằm giữa Ox và Oy; góc xOz là 35 độ, hai góc nhỏ bằng nhau.'
            }
          >
            {round === 0 &&
              Array.from({ length: 19 }, (_, i) => {
                const a = point(i * 10, 145),
                  b = point(i * 10, 153),
                  t = point(i * 10, 128);
                return (
                  <g key={i}>
                    <line
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      stroke="#94a3b8"
                    />
                    <text x={t.x} y={t.y} textAnchor="middle" fontSize="10">
                      {i * 10}
                    </text>
                  </g>
                );
              })}
            {[
              {
                from: 0,
                to: moving ? position : round === 3 ? 35 : total,
                r: 45,
                color: '#194be0',
              },
              ...(moving || round === 3
                ? [
                    {
                      from: moving ? position : 35,
                      to: total,
                      r: 60,
                      color: '#398469',
                    },
                  ]
                : []),
            ].map((arc, i) => {
              const a = point(arc.from, arc.r),
                b = point(arc.to, arc.r);
              return (
                <path
                  key={i}
                  d={`M${a.x} ${a.y} A${arc.r} ${arc.r} 0 0 0 ${b.x} ${b.y}`}
                  fill="none"
                  stroke={arc.color}
                  strokeWidth="2"
                />
              );
            })}
            {ray(0, 'x', '#334155')}
            {ray(total, 'y', '#334155')}
            {(moving || round === 3) &&
              ray(moving ? position : 35, 'z', '#194be0')}
            <circle cx="210" cy="205" r="4" fill="#334155" />
            <text x="200" y="229">
              O
            </text>
          </svg>
        )}
        {moving ? (
          <>
            <label>
              Di chuyển tia Oz
              <input
                type="range"
                min="5"
                max={total - 5}
                step="5"
                value={position}
                aria-valuetext="Vị trí tia Oz trong góc"
                onChange={(event) => move(Number(event.target.value))}
                onPointerDown={() => {
                  setDragging(true);
                  setChecked(false);
                }}
                onPointerUp={() => setDragging(false)}
                onPointerCancel={() => setDragging(false)}
                onBlur={() => setDragging(false)}
              />
            </label>
            <div className={s.controls}>
              <button
                type="button"
                disabled={position <= 5}
                onClick={() => move(position - 5)}
              >
                ← 5°
              </button>
              <button
                type="button"
                disabled={position >= total - 5}
                onClick={() => move(position + 5)}
              >
                5° →
              </button>
            </div>
          </>
        ) : (
          <div className={s.controls}>
            {options.map((option) => (
              <button
                type="button"
                key={option}
                aria-pressed={choice === option}
                onClick={() => {
                  setChoice(option);
                  if (option === (round === 0 ? 'Góc nhọn' : '70°'))
                    onComplete();
                }}
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>
      <div role="status" aria-live="polite">
        {moving
          ? checked && (
              <div
                className={`${s.feedback} ${position === total / 2 ? s.success : ''}`}
              >
                <strong>
                  {position === total / 2
                    ? 'Đúng rồi!'
                    : 'Chưa đúng — thử điều chỉnh lại nhé.'}
                </strong>
                <p>
                  Góc xOz = {position}°; góc zOy = {total - position}°.{' '}
                  {position === total / 2
                    ? 'Oz nằm trong góc và hai góc nhỏ bằng nhau nên Oz là tia phân giác.'
                    : 'Hai góc nhỏ chưa bằng nhau.'}
                </p>
              </div>
            )
          : choice && (
              <div className={`${s.feedback} ${correct ? s.success : ''}`}>
                <strong>
                  {correct ? 'Đúng rồi!' : 'Chưa đúng — thử lại nhé.'}
                </strong>
                <p>
                  {round === 0
                    ? 'Góc xOy bằng 70°. Vì 0° < 70° < 90° nên đây là góc nhọn.'
                    : 'Tia phân giác tạo hai góc bằng nhau: góc zOy = 35°. Góc xOy = 35° + 35° = 70°.'}
                </p>
              </div>
            )}
      </div>
    </>
  );
}
