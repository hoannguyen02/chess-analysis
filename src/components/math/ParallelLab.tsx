import { useState } from 'react';
import ParallelDiagram from './ParallelDiagram';
import { parallelAngleValue } from '@/lib/math/parallel-geometry';
import s from './InteractiveLab.module.css';
const proofSteps = [
  {
    statement: 'Vì c ⊥ a nên A1 = 90°.',
    reason: 'Định nghĩa hai đường thẳng vuông góc',
    options: [
      'Định nghĩa hai đường thẳng vuông góc',
      'Tiên đề Euclid',
      'Hai góc kề bù',
    ],
  },
  {
    statement: 'Vì a ∥ b nên B1 = A1.',
    reason: 'Hai góc đồng vị tạo bởi hai đường thẳng song song',
    options: [
      'Hai góc đồng vị tạo bởi hai đường thẳng song song',
      'Hai góc đối đỉnh',
      'Hai góc bất kì bằng nhau',
    ],
  },
  {
    statement: 'Suy ra B1 = 90°, vậy c ⊥ b.',
    reason: 'Định nghĩa hai đường thẳng vuông góc',
    options: [
      'Định nghĩa hai đường thẳng vuông góc',
      'Nhìn hình thấy vuông',
      'Hai góc so le ngoài',
    ],
  },
];
export default function ParallelLab({
  round,
  onComplete,
}: {
  round: number;
  onComplete: () => void;
}) {
  const [angle, setAngle] = useState(65);
  const [tilt, setTilt] = useState(18);
  const [choice, setChoice] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const titles = [
    'Nhận biết cặp góc',
    'Một đường song song qua M',
    'Góc thay đổi, quan hệ giữ nguyên',
    'Từ góc suy ra song song',
    'Tách giả thiết và kết luận',
    'Hoàn thành một chứng minh',
  ];
  const prompts = [
    'A3 và B1 là cặp góc nào?',
    'Xoay b qua M cho đến khi b song song với a. Sau đó chọn số đường song song có thể kẻ qua M.',
    'Thay đổi độ nghiêng của c. Khi a ∥ b, quan hệ nào luôn đúng?',
    'Biết A3 = B1 = 61°. Căn cứ nào chứng minh a ∥ b?',
    'Nếu a ∥ b và c ⊥ a thì c ⊥ b. Đâu là kết luận?',
    'Cho a ∥ b, c ⊥ a. Chứng minh c ⊥ b. Chọn lí do đúng cho từng bước.',
  ];
  const answers = [
    'So le trong',
    'Duy nhất một',
    'A4 + B1 = 180°',
    'Hai góc so le trong bằng nhau',
    'c ⊥ b',
    proofSteps[Math.min(step, 2)].reason,
  ];
  const options = [
    ['So le trong', 'Đồng vị', 'Đối đỉnh'],
    ['Không có', 'Duy nhất một', 'Có hai'],
    ['A4 + B1 = 180°', 'A4 = B1 trong mọi trường hợp', 'A4 + B1 = 90°'],
    [
      'Hai góc so le trong bằng nhau',
      'Hai góc đối đỉnh bằng nhau',
      'Hai đường trông song song',
    ],
    ['a ∥ b và c ⊥ a', 'c ⊥ b', 'A1 = B1'],
    proofSteps[Math.min(step, 2)].options,
  ][round];
  const feedback = [
    'A3 và B1 nằm giữa a, b và khác phía c.',
    'Tiên đề Euclid khẳng định tính duy nhất khi M nằm ngoài a.',
    'A4 và B1 là hai góc trong cùng phía. Thao tác kéo giúp khám phá; tính chất mới là căn cứ áp dụng.',
    'Đây là dấu hiệu nhận biết: từ một cặp góc so le trong bằng nhau suy ra a ∥ b.',
    'Giả thiết: a ∥ b và c ⊥ a. Kết luận: c ⊥ b.',
    'Mỗi bước đều dựa trên giả thiết hoặc một điều đúng đã biết.',
  ];
  const correct = choice === answers[round] && (round !== 1 || tilt === 0);
  function choose(value: string) {
    setChoice(value);
    if (value !== answers[round] || (round === 1 && tilt !== 0)) return;
    if (round === 5 && step < 2) {
      setStep(step + 1);
      setChoice(null);
      return;
    }
    setDone(true);
    onComplete();
  }
  return (
    <>
      <h2>{titles[round]}</h2>
      {round === 0 && (
        <>
          <p>
            Khi đường thẳng c cắt hai đường thẳng a và b, ta gọi tên các cặp góc
            theo vị trí:
          </p>
          <ul>
            <li>
              Hai góc đồng vị ở cùng vị trí tại hai giao điểm, chẳng hạn A1 và
              B1.
            </li>
            <li>Hai góc so le trong nằm giữa a, b và ở hai phía của c.</li>
            <li>
              Hai góc trong cùng phía nằm giữa a, b và ở cùng một phía của c.
            </li>
          </ul>
        </>
      )}
      <p>{prompts[round]}</p>
      {round === 1 ? (
        <>
          <ParallelDiagram config={{ mode: 'euclid', tilt }} />
          <label>
            Độ nghiêng của b: {tilt}°
            <input
              aria-label="Độ nghiêng của b"
              disabled={done}
              type="range"
              min="-25"
              max="25"
              step="1"
              value={tilt}
              onChange={(e) => {
                setTilt(Number(e.target.value));
                setChoice(null);
              }}
            />
          </label>
          <p role="status">
            {tilt === 0
              ? 'b song song với a.'
              : 'b chưa song song với a; hãy tiếp tục xoay.'}
          </p>
        </>
      ) : (
        <ParallelDiagram
          config={
            round === 0
              ? { labels: { A3: 'α', B1: 'β' } }
              : round === 2
                ? {
                    angle,
                    parallel: true,
                    labels: {
                      A4: `${parallelAngleValue(angle, 4)}°`,
                      B1: `${angle}°`,
                    },
                  }
                : round === 3
                  ? { labels: { A3: '61°', B1: '61°' } }
                  : {
                      angle: 90,
                      parallel: true,
                      labels: { A1: '90°', B1: done ? '90°' : '?' },
                    }
          }
        />
      )}
      {round === 2 && (
        <label>
          Góc A1: {angle}°
          <input
            aria-label="Góc của đường cắt"
            type="range"
            min="55"
            max="115"
            value={angle}
            onChange={(e) => setAngle(Number(e.target.value))}
          />
        </label>
      )}
      {round === 5 && (
        <>
          <p>
            <strong>Giả thiết:</strong> a ∥ b, c ⊥ a. <strong>Kết luận:</strong>{' '}
            c ⊥ b.
          </p>
          <ol>
            {proofSteps.slice(0, done ? 3 : step + 1).map((p, i) => (
              <li key={p.statement}>
                {p.statement}
                {(i < step || done) && <p>{p.reason}.</p>}
              </li>
            ))}
          </ol>
        </>
      )}
      {!done && (
        <div className={s.controls}>
          {options.map((option) => (
            <button
              type="button"
              key={option}
              aria-pressed={choice === option}
              onClick={() => choose(option)}
            >
              {option}
            </button>
          ))}
        </div>
      )}
      {(choice !== null || done) && (
        <div
          role="status"
          className={`${s.feedback} ${done || correct ? s.success : ''}`}
        >
          <strong>
            {done || correct ? 'Đúng rồi!' : 'Chưa đúng. Hãy thử lại.'}
          </strong>
          <p>
            {round === 1 && tilt !== 0
              ? 'Đưa b về vị trí song song trước khi kết luận.'
              : feedback[round]}
          </p>
        </div>
      )}
    </>
  );
}
