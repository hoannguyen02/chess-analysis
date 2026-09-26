import { EQUALITY_ROUND_COUNT } from '@/lib/math/equality-lab';
import ConceptLab from './ConceptLab';
import EqualityLab from './EqualityLab';
import { CONCEPT_PROMPTS, ConceptLabKind } from '@/lib/math/concept-labs';
import { useEffect, useId, useRef, useState } from 'react';
import {
  checkPlacement,
  checkSharing,
  fractionLabel,
  InteractiveLabKind,
  LAB_LABELS,
  LINE_ROUNDS,
  POWER_ROUNDS,
  SHARING_ROUNDS,
} from '@/lib/math/interactive-lab';
import { MathText } from './MathText';
import s from './InteractiveLab.module.css';

type Feedback = { correct: boolean; message: string; title?: string } | null;
function FeedbackMessage({ value }: { value: Feedback }) {
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
          {value.title && (
            <strong className={s.feedbackTitle}>{value.title}</strong>
          )}
          <MathText>{value.message}</MathText>
        </>
      )}
    </div>
  );
}

function Sharing({
  round,
  onComplete,
}: {
  round: number;
  onComplete: () => void;
}) {
  const { total, groups } = SHARING_ROUNDS[round];
  const [counts, setCounts] = useState<number[]>(Array(groups).fill(0));
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [fractionFeedback, setFractionFeedback] = useState<Feedback>(null);
  const remaining = total - counts.reduce((a, b) => a + b, 0);
  function change(index: number, delta: number) {
    setCounts((old) => old.map((n, i) => (i === index ? n + delta : n)));
    setFeedback(null);
    setFractionFeedback(null);
  }
  // Include the objects-per-group misconception without duplicate options.
  const choices = Array.from(new Set([total / groups, groups, total]));
  return (
    <>
      <h3>Chia quà công bằng</h3>
      <p>
        Chia đều {total} chiếc bánh cho {groups} bạn. Nhấn + để thêm bánh vào
        khay; nhấn − để lấy lại.
      </p>
      <div className={s.workspace}>
        <p className={s.remaining} role="status">
          Còn {remaining} chiếc bánh chưa chia
        </p>
        <div className={s.trays}>
          {counts.map((count, i) => (
            <div className={s.tray} key={i}>
              <strong>Bạn {i + 1}</strong>
              <div className={s.objects} aria-hidden="true">
                {Array.from({ length: count }, (_, j) => (
                  <span key={j} />
                ))}
              </div>
              <p>{count} chiếc</p>
              <div className={s.controls}>
                <button
                  type="button"
                  aria-label={`Lấy lại một chiếc bánh từ bạn ${i + 1}`}
                  disabled={!count}
                  onClick={() => change(i, -1)}
                >
                  −
                </button>
                <button
                  type="button"
                  aria-label={`Thêm một chiếc bánh cho bạn ${i + 1}`}
                  disabled={!remaining}
                  onClick={() => change(i, 1)}
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className={s.controls}>
        <button
          className={s.primary}
          type="button"
          onClick={() => setFeedback(checkSharing(counts, total))}
        >
          Kiểm tra cách chia
        </button>
        <button
          type="button"
          onClick={() => {
            setCounts(Array(groups).fill(0));
            setFeedback(null);
            setFractionFeedback(null);
          }}
        >
          Chia lại
        </button>
      </div>
      <FeedbackMessage value={feedback} />
      {feedback?.correct && (
        <div className={s.followup}>
          <h4>Phần của một bạn là một phần mấy của cả {total} chiếc bánh?</h4>
          <div className={s.controls}>
            {choices.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => {
                  const correct = d === groups;
                  setFractionFeedback({
                    correct,
                    message: correct
                      ? `Đúng: một bạn nhận 1 trong ${groups} nhóm bằng nhau, tức 1/${groups} cả bộ. Mỗi nhóm có ${total / groups} chiếc bánh.`
                      : d === total
                        ? `1/${total} là phần của một chiếc bánh. Một bạn nhận cả một nhóm. Em hãy đếm số nhóm bằng nhau.`
                        : `${total / groups} là số bánh trong một nhóm. Để gọi tên phần của một bạn, hãy đếm số nhóm bằng nhau của cả bộ.`,
                  });
                  if (correct) onComplete();
                }}
              >
                <MathText>{`1/${d}`}</MathText>
              </button>
            ))}
          </div>
          <FeedbackMessage value={fractionFeedback} />
        </div>
      )}
    </>
  );
}

export function NumberPlacement({
  round,
  onComplete,
  warmup = false,
}: {
  round: number;
  onComplete: () => void;
  warmup?: boolean;
}) {
  const { numerator, denominator } = warmup
    ? { numerator: -2, denominator: 1 }
    : LINE_ROUNDS[round];
  const [position, setPosition] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (checkTimer.current !== null) clearTimeout(checkTimer.current);
    },
    []
  );
  const inputId = useId();
  const min = -2 * denominator,
    max = 2 * denominator;
  const value = fractionLabel(position, denominator);
  const percent = (n: number) => `${10 + ((n - min) / (max - min)) * 80}%`;
  function move(n: number) {
    if (checkTimer.current !== null) clearTimeout(checkTimer.current);
    setPosition(n);
    setFeedback(null);
    checkTimer.current = setTimeout(() => {
      checkTimer.current = null;
      const result = checkPlacement(n, numerator, denominator);
      setFeedback({
        ...result,
        title: result.correct ? 'Đúng rồi!' : 'Chưa đúng — thử lại nhé.',
        message: `Em đặt A tại ${fractionLabel(n, denominator)}. ${result.message}`,
      });
      if (result.correct) onComplete();
    }, 650);
  }
  return (
    <>
      <h3>
        <MathText>{`Đặt A tại ${fractionLabel(numerator, denominator)}`}</MathText>
      </h3>
      <p>
        {warmup
          ? 'Mỗi khoảng giữa hai vạch bằng 1 đơn vị. Hãy di chuyển A đến vị trí của -2.'
          : `Mỗi đơn vị chia thành ${denominator} khoảng bằng nhau. Dự đoán số nằm giữa hai số nguyên nào, rồi di chuyển A.`}
      </p>
      <div className={s.workspace}>
        <div
          className={s.axis}
          role="img"
          aria-label={`Trục số từ -2 đến 2. Mỗi đơn vị chia ${denominator} khoảng. Vị trí em chọn: ${value}.`}
        >
          <div className={s.rail} />
          {Array.from({ length: max - min + 1 }, (_, i) => i + min).map((n) => (
            <span key={n} className={s.tick} style={{ left: percent(n) }}>
              {n % denominator === 0 && <span>{n / denominator}</span>}
            </span>
          ))}
          <span className={s.point} style={{ left: percent(position) }}>
            A
          </span>
        </div>
        <label htmlFor={inputId}>Di chuyển điểm A</label>
        <input
          id={inputId}
          type="range"
          min={min}
          max={max}
          step={1}
          value={position}
          aria-valuetext={value}
          onChange={(e) => move(Number(e.target.value))}
        />
        <div className={s.controls}>
          <button
            type="button"
            disabled={position === min}
            aria-label={`Sang trái một khoảng, bằng ${fractionLabel(1, denominator)} đơn vị`}
            onClick={() => move(position - 1)}
          >
            ← <MathText>{fractionLabel(1, denominator)}</MathText>
          </button>
          <button
            type="button"
            disabled={position === max}
            aria-label={`Sang phải một khoảng, bằng ${fractionLabel(1, denominator)} đơn vị`}
            onClick={() => move(position + 1)}
          >
            <MathText>{fractionLabel(1, denominator)}</MathText> →
          </button>
        </div>
      </div>
      <FeedbackMessage value={feedback} />
    </>
  );
}

function Powers({
  round,
  onComplete,
}: {
  round: number;
  onComplete: () => void;
}) {
  const { base, exponent } = POWER_ROUNDS[round];
  const [prediction, setPrediction] = useState<'positive' | 'negative' | null>(
    null
  );
  const [revealed, setRevealed] = useState(false);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<Feedback>(null);
  const baseText = base === -0.5 ? '-1/2' : String(base);
  const expected = base ** exponent;
  const expectedText = base === -0.5 ? '-1/8' : String(expected);
  const options =
    base === -0.5
      ? ['1/8', '-1/8', '-3/2']
      : exponent === 2
        ? ['-4', '4', '0']
        : ['8', '-6', '-8'];
  function chooseAnswer(option: string) {
    setAnswer(option);
    const correct = option === expectedText;
    const predictionCorrect =
      prediction === (expected < 0 ? 'negative' : 'positive');
    setFeedback({
      correct,
      message: correct
        ? `${predictionCorrect ? 'Dự đoán dấu đúng!' : 'Em đã kiểm chứng và sửa được dự đoán.'} (${baseText})^${exponent} = ${expectedText}. ${exponent === 2 ? 'Hai thừa số âm cho tích dương.' : 'Hai thừa số âm đầu cho tích dương; nhân thêm một thừa số âm cho kết quả âm.'}`
        : option === '-6' || option === '-3/2'
          ? `Số mũ ${exponent} đếm số thừa số, không phải nhân cơ số với ${exponent}. Hãy tính tích các thừa số trong hình.`
          : 'Hãy nhân hai số âm đầu tiên. Nếu còn một thừa số âm, dấu của tích thay đổi thế nào?',
    });
    if (correct) onComplete();
  }
  return (
    <>
      <h3>
        <MathText>{`Khám phá (${baseText})^${exponent}`}</MathText>
      </h3>
      <p>Dự đoán dấu của kết quả, rồi mở các thừa số để kiểm chứng.</p>
      <div className={s.controls}>
        {(['positive', 'negative'] as const).map((sign) => (
          <button
            type="button"
            key={sign}
            aria-pressed={prediction === sign}
            onClick={() => {
              setPrediction(sign);
              setAnswer('');
              setFeedback(null);
            }}
          >
            {sign === 'positive' ? 'Số dương' : 'Số âm'}
          </button>
        ))}
      </div>
      <div className={s.workspace}>
        <div className={s.expression}>
          <MathText>{`(${baseText})^${exponent}`}</MathText>
        </div>
        {!revealed ? (
          <button
            type="button"
            disabled={!prediction}
            onClick={() => setRevealed(true)}
          >
            Mở các thừa số
          </button>
        ) : (
          <>
            <div className={s.factors}>
              {Array.from({ length: exponent }, (_, i) => (
                <span key={i} className={s.factorPair}>
                  {i > 0 && <span>×</span>}
                  <span className={s.factor}>
                    <MathText>{`(${baseText})`}</MathText>
                  </span>
                </span>
              ))}
            </div>
            <p>
              Có {exponent} thừa số, mỗi thừa số bằng{' '}
              <MathText>{baseText}</MathText>.
            </p>
            {exponent === 2 ? (
              <p>Nhân hai thừa số với nhau để tìm kết quả.</p>
            ) : (
              <>
                <p>
                  Bước 1: Nhân hai thừa số đầu tiên:{' '}
                  <MathText>{`(${baseText}) × (${baseText})`}</MathText>.
                </p>
                <p>
                  Bước 2: Lấy kết quả ở bước 1 nhân với thừa số thứ ba là{' '}
                  <MathText>{`(${baseText})`}</MathText>.
                </p>
              </>
            )}
            <h4>Kết quả bằng bao nhiêu?</h4>
            <div className={s.controls}>
              {options.map((option) => (
                <button
                  type="button"
                  key={option}
                  aria-pressed={answer === option}
                  onClick={() => chooseAnswer(option)}
                >
                  <MathText>{option}</MathText>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      <FeedbackMessage value={feedback} />
    </>
  );
}

export default function InteractiveLab({
  kind,
}: {
  kind: Exclude<InteractiveLabKind, 'none'>;
}) {
  const roundCount = kind === 'equality' ? EQUALITY_ROUND_COUNT : 3;
  const [round, setRound] = useState(0);
  const [completed, setCompleted] = useState<number[]>([]);
  const [restart, setRestart] = useState(0);
  const [help, setHelp] = useState(false);
  function complete() {
    setCompleted((old) => (old.includes(round) ? old : [...old, round]));
  }
  return (
    <div className={s.lab} aria-label={LAB_LABELS[kind]}>
      <div key={`${kind}-${round}-${restart}`}>
        {kind === 'sharing' ? (
          <Sharing round={round} onComplete={complete} />
        ) : kind === 'number-line' ? (
          <NumberPlacement round={round} onComplete={complete} />
        ) : kind === 'powers' ? (
          <Powers round={round} onComplete={complete} />
        ) : kind === 'equality' ? (
          <EqualityLab round={round} onComplete={complete} />
        ) : (
          <ConceptLab kind={kind} round={round} onComplete={complete} />
        )}
      </div>
      <div className={s.footer}>
        <button
          type="button"
          aria-expanded={help}
          onClick={() => setHelp(!help)}
        >
          Câu hỏi gợi mở
        </button>
        <button
          type="button"
          disabled={round === 0}
          onClick={() => {
            setRound(round - 1);
            setHelp(false);
          }}
        >
          ← Lượt trước
        </button>
        {round < roundCount - 1 ? (
          <button
            type="button"
            onClick={() => {
              setRound(round + 1);
              setHelp(false);
            }}
          >
            Thử tình huống mới →
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setRound(0);
              setCompleted([]);
              setRestart(restart + 1);
              setHelp(false);
            }}
          >
            Khám phá lại
          </button>
        )}
      </div>
      {help && (
        <p className={s.prompt}>
          {kind === 'sharing'
            ? 'Số bánh trong một nhóm và số nhóm của cả bộ có giống nhau không? Hãy giải thích phần của một bạn.'
            : kind === 'number-line'
              ? 'Em chọn chiều nào từ 0? Mỗi khoảng nhỏ có giá trị bao nhiêu? Em đếm khoảng hay đếm vạch?'
              : kind === 'powers'
                ? 'Số mũ đếm điều gì? Nếu thêm một thừa số âm, dấu của tích sẽ thay đổi thế nào?'
                : kind === 'equality'
                  ? 'x là số hạng, thừa số, số chia, cơ số hay số mũ? Phép biến đổi nào phù hợp? Có điều kiện khác 0 hoặc điều kiện x thuộc tập số nào không? Thay kết quả vào đẳng thức ban đầu để kiểm tra.'
                  : CONCEPT_PROMPTS[kind as ConceptLabKind]}
        </p>
      )}
      <p className={s.note} role="status">
        Đã khám phá thành công {completed.length}/{roundCount} tình huống.{' '}
        {completed.length === roundCount &&
          'Hãy đến “Em thử làm” để vận dụng với câu hỏi mới.'}
      </p>
    </div>
  );
}
