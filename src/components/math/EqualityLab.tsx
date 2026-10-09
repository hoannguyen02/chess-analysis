import { useState } from 'react';
import {
  balanceState,
  TRANSFER_ROUNDS,
  OPERATION_ROUNDS,
} from '@/lib/math/equality-lab';
import { MathText } from './MathText';
import s from './InteractiveLab.module.css';
import e from './EqualityLab.module.css';

type Feedback = { title: string; text: string; correct: boolean };
function Message({ value }: { value: Feedback | null }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={
        value ? `${s.feedback} ${value.correct ? s.success : ''}` : undefined
      }
    >
      {value && (
        <>
          <strong className={s.feedbackTitle}>{value.title}</strong>
          <MathText>{value.text}</MathText>
        </>
      )}
    </div>
  );
}

export function EqualityWarmup() {
  const [choice, setChoice] = useState<string | null>(null);
  return (
    <div className={s.lab}>
      <h3>Hai vế có bằng nhau không?</h3>
      <div className={s.workspace}>
        <div className={e.equation}>
          <span>5 + 3</span>
          <span>□</span>
          <span>8</span>
        </div>
        <p>Chọn dấu thích hợp vào ô trống.</p>
        <div className={s.controls}>
          {['=', '≠'].map((sign) => (
            <button
              type="button"
              key={sign}
              aria-pressed={choice === sign}
              aria-label={sign === '=' ? 'Bằng nhau' : 'Không bằng nhau'}
              onClick={() => setChoice(sign)}
            >
              {sign}
            </button>
          ))}
        </div>
      </div>
      <Message
        value={
          choice === null
            ? null
            : {
                correct: choice === '=',
                title:
                  choice === '=' ? 'Đúng rồi!' : 'Chưa đúng — thử lại nhé.',
                text: 'Vế trái: 5 + 3 = 8. Vế phải: 8. Hai vế có cùng giá trị nên dùng dấu =. Đây là một đẳng thức đúng.',
              }
        }
      />
    </div>
  );
}

function Balance({ onComplete }: { onComplete: () => void }) {
  const [left, setLeft] = useState(8);
  const [right, setRight] = useState(8);
  const [touched, setTouched] = useState(false);
  const state = balanceState(left, right);
  function change(side: 'left' | 'right' | 'both', delta: number) {
    const l = side === 'right' ? left : left + delta;
    const r = side === 'left' ? right : right + delta;
    if (l < 0 || l > 12 || r < 0 || r > 12) return;
    setLeft(l);
    setRight(r);
    setTouched(true);
    if (balanceState(l, r).complete) onComplete();
  }
  return (
    <>
      <h3>Giữ cân bằng khi bớt đi</h3>
      <p>
        Hai đĩa ban đầu đều có 8 khối, mỗi khối nặng như nhau. Hãy bớt 3 khối ở
        mỗi đĩa để còn 5 khối mỗi bên.
      </p>
      <div className={s.workspace}>
        <svg
          className={e.scale}
          viewBox="0 0 440 180"
          role="img"
          aria-label={`Cân: bên trái ${left} khối, bên phải ${right} khối. ${state.equal ? 'Cân bằng.' : left > right ? 'Bên trái nặng hơn.' : 'Bên phải nặng hơn.'}`}
        >
          <path
            d="M220 65 L185 165 L255 165 Z"
            fill="#dce5fb"
            stroke="#334155"
            strokeWidth="3"
          />
          <g transform={`rotate(${state.tilt} 220 65)`}>
            <path d="M60 65 H380" stroke="#334155" strokeWidth="5" />
            {[100, 340].map((x, index) => (
              <g key={x}>
                <path
                  d={`M${x} 65 L${x - 42} 130 H${x + 42} Z`}
                  fill="#eef3ff"
                  stroke="#334155"
                  strokeWidth="2"
                />
                <text
                  x={x}
                  y="113"
                  textAnchor="middle"
                  fontSize="24"
                  fill="#17243e"
                >
                  {index === 0 ? left : right}
                </text>
              </g>
            ))}
          </g>
          <circle cx="220" cy="65" r="7" fill="#334155" />
        </svg>
        <div
          className={e.equation}
          aria-label={`Vế trái ${left}, ${state.relation}, vế phải ${right}`}
        >
          <span>{left}</span>
          <strong>{state.relation}</strong>
          <span>{right}</span>
        </div>
        <div className={e.balanceControls}>
          {(['left', 'both', 'right'] as const).map((side) => (
            <div key={side}>
              <h4>
                {side === 'left'
                  ? 'Vế trái'
                  : side === 'right'
                    ? 'Vế phải'
                    : 'Cả hai vế'}
              </h4>
              <div className={s.controls}>
                {[-1, 1].map((delta) => (
                  <button
                    type="button"
                    key={delta}
                    disabled={
                      (side !== 'right' &&
                        (left + delta < 0 || left + delta > 12)) ||
                      (side !== 'left' &&
                        (right + delta < 0 || right + delta > 12))
                    }
                    onClick={() => change(side, delta)}
                    aria-label={`${delta < 0 ? 'Bớt' : 'Thêm'} 1 khối ở ${side === 'both' ? 'cả hai vế' : side === 'left' ? 'vế trái' : 'vế phải'}`}
                  >
                    {delta < 0 ? '− 1' : '+ 1'}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            setLeft(8);
            setRight(8);
            setTouched(false);
          }}
        >
          Đặt lại cân
        </button>
      </div>
      <Message
        value={
          !touched
            ? null
            : {
                correct: state.equal,
                title: state.complete
                  ? 'Đúng rồi! Hai vế vẫn bằng nhau.'
                  : state.equal
                    ? 'Cân vẫn thăng bằng.'
                    : 'Hai vế chưa bằng nhau.',
                text: state.complete
                  ? '8 - 3 = 8 - 3, tức 5 = 5. Trừ cùng một số ở cả hai vế giữ được đẳng thức đúng.'
                  : state.equal
                    ? 'Em đã thay đổi hai bên cùng một lượng. Hãy tiếp tục để mỗi bên còn 5 khối.'
                    : `Vế trái là ${left}, vế phải là ${right}. Thay đổi một bên làm mất cân bằng. Hãy điều chỉnh bên còn lại để hai bên cùng bằng 5.`,
              }
        }
      />
    </>
  );
}

function Transfer({
  round,
  onComplete,
}: {
  round: number;
  onComplete: () => void;
}) {
  const r = TRANSFER_ROUNDS[round];
  const [sign, setSign] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const signCorrect = sign === r.sign;
  return (
    <>
      <h3>
        {round === 0
          ? 'Chuyển một số hạng sang vế kia'
          : 'Chuyển vế với phân số'}
      </h3>
      <div className={s.workspace}>
        <div className={e.equation}>
          <span>
            <MathText>{r.equation}</MathText>
          </span>
        </div>
        <p>
          <MathText>{`Muốn x đứng một mình, hãy chuyển số hạng ${r.term} sang vế phải. Chọn dấu của số hạng sau khi chuyển.`}</MathText>
        </p>
        <div className={e.equation}>
          <span>
            <MathText>{`x = ${r.right}`}</MathText>
          </span>
          <span>{sign ?? '□'}</span>
          <span>
            <MathText>{r.magnitude}</MathText>
          </span>
        </div>
        <div className={s.controls}>
          {['+', '−'].map((value) => (
            <button
              type="button"
              key={value}
              aria-label={value === '+' ? 'Dấu cộng' : 'Dấu trừ'}
              aria-pressed={sign === value}
              onClick={() => {
                setSign(value);
                setAnswer(null);
              }}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
      <Message
        value={
          sign === null
            ? null
            : {
                correct: signCorrect,
                title: signCorrect
                  ? 'Đúng dấu rồi!'
                  : 'Chưa đúng — cần đổi dấu số hạng.',
                text: signCorrect
                  ? `${r.operation}: ${r.expanded}. Thu gọn: ${r.simplified}.`
                  : `${r.operation} để bỏ số hạng ${r.term} ở vế trái. Chỉ số hạng được chuyển mới đổi dấu; số ${r.right} vẫn ở vế phải nên giữ nguyên dấu.`,
              }
        }
      />
      {signCorrect && (
        <>
          <h4>Tính giá trị của x</h4>
          {round === 1 && (
            <p>
              <MathText>
                {
                  'Quy đồng mẫu 12: -1/4 = -3/12 và 2/3 = 8/12. Cộng hai tử, giữ nguyên mẫu.'
                }
              </MathText>
            </p>
          )}
          <div className={s.controls}>
            {r.choices.map((value) => (
              <button
                type="button"
                key={value}
                aria-pressed={answer === value}
                onClick={() => {
                  setAnswer(value);
                  if (value === r.answer) onComplete();
                }}
              >
                <MathText>{value}</MathText>
              </button>
            ))}
          </div>
          <Message
            value={
              answer === null
                ? null
                : {
                    correct: answer === r.answer,
                    title:
                      answer === r.answer
                        ? 'Đúng rồi! Thử lại đẳng thức ban đầu.'
                        : 'Chưa đúng — kiểm tra phép tính nhé.',
                    text:
                      answer === r.answer
                        ? `${r.working}. Vậy x = ${r.answer}. Thay vào: ${r.check}. Hai vế bằng nhau.`
                        : r.hint,
                  }
            }
          />
        </>
      )}
    </>
  );
}

function Operation({
  index,
  onComplete,
}: {
  index: number;
  onComplete: () => void;
}) {
  const activity = OPERATION_ROUNDS[index];
  const [operation, setOperation] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const ready = operation === activity.operation;
  return (
    <>
      <h3>{activity.title}</h3>
      <div className={s.workspace}>
        <div className={e.equation}>
          <span>
            <MathText>{activity.equation}</MathText>
          </span>
        </div>
        <p>
          <MathText>{activity.prompt}</MathText>
        </p>
        <div className={s.controls}>
          {activity.options.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={operation === option}
              onClick={() => {
                setOperation(option);
                setAnswer(null);
              }}
            >
              <MathText>{option}</MathText>
            </button>
          ))}
        </div>
      </div>
      <Message
        value={
          operation === null
            ? null
            : {
                correct: ready,
                title: ready
                  ? 'Đúng cách biến đổi rồi!'
                  : 'Chưa đúng — thử lại nhé.',
                text: activity.explanation,
              }
        }
      />
      {ready && (
        <>
          <div className={e.equation}>
            <span>
              <MathText>{activity.working}</MathText>
            </span>
          </div>
          <h4>Chọn đáp án đầy đủ</h4>
          <div className={s.controls}>
            {activity.choices.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={answer === value}
                onClick={() => {
                  setAnswer(value);
                  if (value === activity.answer) onComplete();
                }}
              >
                <MathText>{value}</MathText>
              </button>
            ))}
          </div>
          <Message
            value={
              answer === null
                ? null
                : {
                    correct: answer === activity.answer,
                    title:
                      answer === activity.answer
                        ? 'Đúng rồi! Thử lại nhé.'
                        : 'Chưa đúng — kiểm tra lại nhé.',
                    text:
                      answer === activity.answer
                        ? activity.check
                        : activity.hint,
                  }
            }
          />
        </>
      )}
    </>
  );
}

export default function EqualityLab({
  round,
  onComplete,
}: {
  round: number;
  onComplete: () => void;
}) {
  return round === 0 ? (
    <Balance onComplete={onComplete} />
  ) : round <= TRANSFER_ROUNDS.length ? (
    <Transfer key={round} round={round - 1} onComplete={onComplete} />
  ) : (
    <Operation
      key={round}
      index={round - 1 - TRANSFER_ROUNDS.length}
      onComplete={onComplete}
    />
  );
}
