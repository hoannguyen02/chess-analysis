import { usePracticeFullscreen } from '@/hooks/usePracticeFullscreen';
import type { ReferenceGame } from '@/lib/chess/draw-game-viewer';
import {
  londonLevels,
  parseLondonProgress,
  type LondonCourseData,
  type LondonExercise,
  type LondonGame,
  type LondonLesson,
  type LondonLevel,
  type LondonProgress,
  type LondonSide,
  type LondonTrack,
} from '@/lib/chess/london-course';
import {
  londonGameSource,
  londonPracticeExercise,
} from '@/lib/chess/london-practice';
import practiceStyles from '@/styles/ChessPractice.module.css';
import styles from '@/styles/LondonCourse.module.css';
import { useEffect, useMemo, useState } from 'react';
import { FiChevronDown, FiChevronUp, FiMaximize } from 'react-icons/fi';
import DrawTrainer from './DrawTrainer';
import { TeachingTimer } from './TeachingTimer';

const strengths = [
  [
    'Dễ nhận diện đội hình',
    'Một cấu trúc quen thuộc giúp học phát triển quân.',
    'Không đi theo công thức khi Đen đã tạo đe dọa.',
  ],
  [
    'Tượng ra ngoài chuỗi tốt',
    'Bf4 trước e3 giữ tượng c1 hoạt động.',
    'Tượng có thể bị ...Bd6 hoặc ...Nh5 thách thức; chú ý b2.',
  ],
  [
    'Trung tâm vững',
    'Có nền tảng để cải thiện quân và chuẩn bị phá tốt.',
    'Cần chọn đúng thời điểm e4 hoặc c4; tránh thế bị động.',
  ],
  [
    'Ý tưởng tấn công rõ',
    'Ne5 và phối hợp hậu–tượng–xe có thể tạo sức ép.',
    'Chỉ tấn công khi đủ điều kiện; Đen có thể phản công bằng ...c5.',
  ],
];

export default function LondonCourse({ data }: { data: LondonCourseData }) {
  const [track, setTrack] = useState<LondonTrack>('classical');
  const [teachingLesson, setTeachingLesson] = useState<string | null>(null);
  const [level, setLevel] = useState<LondonLevel>('A');
  const [side, setSide] = useState<LondonSide>('white');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [progress, setProgress] = useState<LondonProgress>({});
  const [storageReady, setStorageReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const ids = useMemo(
    () => data.lessons.flatMap((l) => l.exercises.map((e) => e.id)),
    [data.lessons]
  );
  const key = `lima-london-progress-v${data.version}`;
  useEffect(() => {
    try {
      setProgress(parseLondonProgress(localStorage.getItem(key), ids));
    } catch {
      setStorageError(true);
    }
    setStorageReady(true);
  }, [key, ids]);
  useEffect(() => {
    if (!storageReady) return;
    try {
      localStorage.setItem(key, JSON.stringify(progress));
    } catch {
      setStorageError(true);
    }
  }, [progress, storageReady, key]);
  const levelLessons = data.lessons.filter(
    (l) => l.level === level && (l.track ?? 'classical') === track
  );
  const levelIds = levelLessons.flatMap((l) =>
    l.exercises.filter((e) => e.side === side).map((e) => e.id)
  );
  const levelMastered = levelIds.filter(
    (id) => progress[id] === 'independent'
  ).length;
  function complete(id: string, assisted: boolean) {
    setProgress((old) => ({
      ...old,
      [id]: old[id] === 'independent' || !assisted ? 'independent' : 'assisted',
    }));
  }
  return (
    <>
      {teachingLesson && (
        <LondonTeaching
          data={data}
          initialLessonId={teachingLesson}
          initialSide={side}
          onClose={() => setTeachingLesson(null)}
          onComplete={complete}
        />
      )}
      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>LIMA Chess · KHAI CUỘC TỪ HAI PHÍA</p>
          <h1>
            Hiểu London.
            <br />
            <span>Chơi tốt cả hai màu.</span>
          </h1>
          <p>
            Học cách xây dựng thế cờ với Trắng, phản công với Đen và rút kinh
            nghiệm từ những ván đấu thật.
          </p>
          <div className={styles.stats}>
            <span>5 cấp độ</span>
            <span>{data.lessons.length} bài học</span>
            <span>{ids.length} bài thực hành</span>
            <span>
              {data.games.filter((g) => g.result === '1/2-1/2').length} ván hòa
            </span>
            <span>
              {data.games.filter((g) => g.result === '1-0').length} ván Trắng
              thắng
            </span>
            <span>
              {data.games.filter((g) => g.result === '0-1').length} ván Đen
              thắng
            </span>
          </div>
        </div>
        <aside className={styles.heroNote}>
          <span>THÓI QUEN CỐT LÕI</span>
          <p>
            Đối thủ đang dọa gì?
            <br />
            Thế cờ cần gì?
          </p>
          <small>
            London cổ điển & Jobava · Học từ cả ván thắng và ván hòa.
          </small>
        </aside>
      </header>
      <section
        className={styles.overview}
        aria-label="Chọn nhánh và tìm hiểu London"
      >
        <nav className={styles.trackSwitch} aria-label="Nhánh London">
          {(['classical', 'jobava'] as const).map((t) => (
            <button
              key={t}
              aria-pressed={track === t}
              onClick={() => {
                setTrack(t);
                setExpandedId(null);
              }}
            >
              {t === 'classical' ? 'London cổ điển' : 'Jobava London'}
            </button>
          ))}
        </nav>
        <details>
          <summary>Ưu điểm & lưu ý</summary>
          <p className={styles.overviewHint}>
            Đội hình là điểm xuất phát. Kế hoạch thay đổi theo cách đối thủ
            chơi.
          </p>
          <div className={styles.strengthGrid}>
            {(track === 'classical'
              ? strengths
              : [
                  [
                    'Mã c3 chủ động',
                    'Nc3 hỗ trợ e4 và hướng tới b5.',
                    'Mã chặn tốt c2; không dùng nguyên kế hoạch c3–Nbd2.',
                  ],
                  [
                    'Tượng f4 cùng tham gia',
                    'Tượng và mã có thể gây sức ép lên c7.',
                    'Nb5 cần tính cụ thể; ...a6 hoặc ...c6 có thể hạn chế ý tưởng này.',
                  ],
                  [
                    'Nhiều lựa chọn tấn công',
                    'Có thể chọn mở trung tâm hoặc nhập thành dài khi phù hợp.',
                    'Đen phản công bằng ...c5; kiểm tra an toàn vua trước khi đẩy tốt.',
                  ],
                ]
            ).map(([title, pro, con]) => (
              <article key={title}>
                <h3>{title}</h3>
                <p>
                  <b>Điểm mạnh:</b> {pro}
                </p>
                <p>
                  <b>Cần lưu ý:</b> {con}
                </p>
              </article>
            ))}
          </div>
          <p className={styles.note}>
            <b>Gặp ...Qb6:</b> kiểm tra cả b2 và d4 trước khi phát triển tiếp.{' '}
            <b>Gặp ...Bd6 / ...Nh5:</b> cân nhắc đổi hay giữ tượng.{' '}
            <b>Gặp ...g6:</b> chú ý đường chéo tượng g7 và các đòn phá trung
            tâm. Không có một câu trả lời đúng cho mọi vị trí.
          </p>
        </details>
      </section>
      <nav className={styles.levels} aria-label="Cấp độ London">
        {londonLevels.map((item) => (
          <button
            key={item.id}
            aria-pressed={level === item.id}
            onClick={() => {
              setLevel(item.id);
              setExpandedId(null);
            }}
          >
            <strong>{item.id}</strong>
            <span>{item.title}</span>
          </button>
        ))}
      </nav>
      <div className={styles.levelSummary}>
        <p>{londonLevels.find((l) => l.id === level)!.description}</p>
        <span>
          {levelMastered}/{levelIds.length} bài tự giải ở cấp {level}
        </span>
      </div>
      <div className={styles.lessonHeading}>
        <div>
          <h2>
            {side === 'white'
              ? 'Nước đi và kế hoạch của Trắng'
              : 'Phòng thủ và phản công với Đen'}
          </h2>
          <p>Chọn một ý tưởng để xem các ván đấu và thử trên bàn cờ.</p>
        </div>
        <div className={styles.sideSwitch} aria-label="Chọn bên luyện tập">
          {(['white', 'black'] as const).map((s) => (
            <button
              key={s}
              aria-pressed={side === s}
              onClick={() => setSide(s)}
            >
              {s === 'white' ? '♙ Chơi Trắng' : '♟ Chơi Đen'}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.ideaList}>
        {levelLessons.map((l) => {
          const examples = l.exercises.filter((e) => e.side === side);
          const count = new Set(examples.map((e) => e.gameId)).size;
          const opened = expandedId === l.id;
          const moves = [...new Set(examples.map((e) => e.lines[0][0]))].slice(
            0,
            5
          );
          return (
            <section key={l.id} className={styles.ideaCard} data-open={opened}>
              <div className={styles.ideaIntro}>
                <div>
                  <p className={styles.eyebrow}>
                    {moves
                      .map((m) => (side === 'black' ? `…${m}` : m))
                      .join(' · ')}
                  </p>
                  <h3>{l.title}</h3>
                  <p>{l[side]}</p>
                </div>
                <div className={styles.ideaActions}>
                  <button
                    className={styles.primary}
                    aria-label={
                      opened
                        ? `Thu gọn: ${l.title}`
                        : `Xem ${count} ván & thực hành: ${l.title}`
                    }
                    title={opened ? 'Thu gọn' : `Xem ${count} ván & thực hành`}
                    aria-expanded={opened}
                    aria-controls={`examples-${l.id}`}
                    onClick={(event) => {
                      const card = event.currentTarget.closest('section');
                      setExpandedId(opened ? null : l.id);
                      if (!opened)
                        requestAnimationFrame(() =>
                          card?.scrollIntoView({
                            block: 'start',
                            behavior: 'smooth',
                          })
                        );
                    }}
                  >
                    {opened ? 'Thu gọn' : `${count} ván`}
                    {opened ? (
                      <FiChevronUp size={18} aria-hidden="true" />
                    ) : (
                      <FiChevronDown size={18} aria-hidden="true" />
                    )}
                  </button>
                  <button
                    className={styles.fullModeButton}
                    onClick={() => setTeachingLesson(l.id)}
                    aria-label={`Toàn màn hình: ${l.title}`}
                    title="Toàn màn hình"
                  >
                    <FiMaximize size={20} aria-hidden="true" />
                  </button>
                </div>
              </div>
              <details className={styles.ideaNotes}>
                <summary>Phía đối thủ & lỗi cần tránh</summary>
                <p>
                  <b>Phía đối thủ:</b> {l[side === 'white' ? 'black' : 'white']}
                </p>
                <p>
                  <b>Lỗi cần tránh:</b> {l.error}
                </p>
              </details>
              {opened && !teachingLesson && (
                <div id={`examples-${l.id}`}>
                  <LessonExamples
                    key={`${l.id}-${side}`}
                    lesson={l}
                    side={side}
                    games={data.games}
                    progress={progress}
                    onComplete={complete}
                    onTeach={() => setTeachingLesson(l.id)}
                  />
                </div>
              )}
            </section>
          );
        })}
      </div>
      {storageError && (
        <p role="status">
          Trình duyệt không cho lưu tiến độ. Bạn vẫn có thể học và luyện trong
          phiên này.
        </p>
      )}
    </>
  );
}

function LessonExamples({
  lesson,
  side,
  games,
  progress,
  onComplete,
  onTeach,
}: {
  onTeach: () => void;
  lesson: LondonLesson;
  side: LondonSide;
  games: LondonGame[];
  progress: LondonProgress;
  onComplete: (id: string, assisted: boolean) => void;
}) {
  const examples = lesson.exercises.filter((e) => e.side === side);
  const [index, setIndex] = useState(0);
  const [listOpen, setListOpen] = useState(false);
  const [page, setPage] = useState(0);
  const exercise = examples[index];
  const game = games.find((g) => g.id === exercise.gameId)!;
  const pages = Math.ceil(examples.length / 6);
  function select(next: number) {
    setIndex(next);
    setPage(Math.floor(next / 6));
  }
  return (
    <div className={styles.examples}>
      <div className={styles.exampleToolbar}>
        <button onClick={onTeach}>Chế độ giảng dạy ⛶</button>
        <button
          disabled={index === 0}
          onClick={() => select(index - 1)}
          aria-label="Ván trước"
        >
          ←
        </button>
        <span>
          Ván {index + 1} / {examples.length}
        </span>
        <button
          disabled={index === examples.length - 1}
          onClick={() => select(index + 1)}
          aria-label="Ván tiếp"
        >
          →
        </button>
        <span className={styles.progressBadge}>
          {progress[exercise.id] === 'independent'
            ? 'Đã tự giải'
            : progress[exercise.id] === 'assisted'
              ? 'Đã luyện'
              : ''}
        </span>
        {examples.length > 1 && (
          <button
            aria-expanded={listOpen}
            onClick={() => setListOpen(!listOpen)}
          >
            {listOpen ? 'Ẩn danh sách' : 'Chọn ván khác'}
          </button>
        )}
      </div>
      {listOpen && (
        <div className={styles.exampleList}>
          <div className={styles.gameCards}>
            {examples.slice(page * 6, page * 6 + 6).map((e, i) => {
              const g = games.find((g) => g.id === e.gameId)!;
              return (
                <button
                  key={e.id}
                  aria-pressed={index === page * 6 + i}
                  onClick={() => select(page * 6 + i)}
                >
                  <span className={styles.eyebrow}>
                    {g.result === '1-0'
                      ? 'TRẮNG THẮNG'
                      : g.result === '0-1'
                        ? 'ĐEN THẮNG'
                        : 'HÒA'}{' '}
                    · {g.date.slice(0, 4)}
                  </span>
                  <strong>
                    {g.white.split(',')[0]} — {g.black.split(',')[0]}
                  </strong>
                  <small>
                    {g.event} · {Math.floor(e.ply / 2) + 1}
                    {e.side === 'black' ? '…' : '.'}
                    {e.lines[0][0]}
                  </small>
                  {progress[e.id] && (
                    <small>
                      {progress[e.id] === 'independent'
                        ? '✓ Đã tự giải'
                        : '✓ Đã luyện'}
                    </small>
                  )}
                </button>
              );
            })}
          </div>
          {pages > 1 && (
            <div className={styles.exampleToolbar}>
              <button disabled={page === 0} onClick={() => setPage(page - 1)}>
                Trang trước
              </button>
              <span>
                {page + 1} / {pages}
              </span>
              <button
                disabled={page + 1 === pages}
                onClick={() => setPage(page + 1)}
              >
                Trang sau
              </button>
            </div>
          )}
        </div>
      )}
      <LondonTrainer
        key={exercise.id}
        exercise={exercise}
        game={game}
        referenceGames={examples.map((e) => ({
          reference: { id: e.gameId, kind: 'game', ply: e.ply, branch: 0 },
          source: londonGameSource(games.find((g) => g.id === e.gameId)!),
        }))}
        onComplete={(assisted) => onComplete(exercise.id, assisted)}
      />
    </div>
  );
}

function LondonTrainer({
  exercise,
  game,
  onComplete,
  onPreviousExercise,
  onNextExercise,
  onTimerPause,
  onRestart,
  referenceGames,
}: {
  referenceGames?: ReferenceGame[];
  onPreviousExercise?: () => void;
  onNextExercise?: () => void;
  onTimerPause?: (paused: boolean) => void;
  onRestart?: () => void;
  exercise: LondonExercise;
  game: LondonGame;
  onComplete: (assisted: boolean) => void;
}) {
  const practice = useMemo(
    () => londonPracticeExercise(exercise, game),
    [exercise, game]
  );
  const source = useMemo(() => londonGameSource(game), [game]);
  return (
    <DrawTrainer
      exercise={practice}
      gameSource={source}
      referenceGames={referenceGames}
      onComplete={onComplete}
      onPreviousExercise={onPreviousExercise}
      onNextExercise={onNextExercise}
      onTimerPause={onTimerPause}
      onRestart={onRestart}
    />
  );
}

function LondonTeaching({
  data,
  initialLessonId,
  initialSide,
  onClose,
  onComplete,
}: {
  data: LondonCourseData;
  initialLessonId: string;
  initialSide: LondonSide;
  onClose: () => void;
  onComplete: (id: string, assisted: boolean) => void;
}) {
  const { trainerRef, expandButtonRef, expanded, toggleExpanded } =
    usePracticeFullscreen(true);
  const [lessonId, setLessonId] = useState(initialLessonId);
  const [side, setSide] = useState(initialSide);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const lesson = data.lessons.find((l) => l.id === lessonId)!;
  const examples = lesson.exercises.filter((e) => e.side === side);
  const exercise = examples[index];
  const game = data.games.find((g) => g.id === exercise.gameId)!;
  useEffect(() => {
    if (!expanded) onClose();
  }, [expanded, onClose]);
  function chooseLesson(id: string) {
    setLessonId(id);
    setIndex(0);
  }
  return (
    <div
      ref={trainerRef}
      className={`${practiceStyles.expanded} ${styles.teaching}`}
      role="dialog"
      aria-modal="true"
      aria-label="Chế độ giảng dạy London"
    >
      <div className={styles.teachingToolbar}>
        <label>
          Ý tưởng
          <select
            aria-label="Chọn ý tưởng giảng dạy"
            value={lessonId}
            onChange={(e) => chooseLesson(e.target.value)}
          >
            {data.lessons.map((l) => (
              <option key={l.id} value={l.id}>
                {l.track === 'jobava' ? 'Jobava' : 'Cổ điển'} · {l.level} ·{' '}
                {l.title}
              </option>
            ))}
          </select>
        </label>
        <select
          aria-label="Bên luyện tập"
          value={side}
          onChange={(e) => {
            setSide(e.target.value as LondonSide);
            setIndex(0);
          }}
        >
          <option value="white">Chơi Trắng</option>
          <option value="black">Chơi Đen</option>
        </select>
        <button
          disabled={index === 0}
          onClick={() => setIndex(index - 1)}
          aria-label="Ván trước"
          title="Ván trước (←)"
        >
          ←
        </button>
        <label>
          Ván
          <select
            aria-label="Chọn ván giảng dạy"
            value={index}
            onChange={(e) => setIndex(Number(e.target.value))}
          >
            {examples.map((e, i) => {
              const g = data.games.find((g) => g.id === e.gameId)!;
              return (
                <option key={e.id} value={i}>
                  {i + 1}/{examples.length} · {g.white.split(',')[0]} —{' '}
                  {g.black.split(',')[0]}
                </option>
              );
            })}
          </select>
        </label>
        <button
          disabled={index === examples.length - 1}
          onClick={() => setIndex(index + 1)}
          aria-label="Ván tiếp"
          title="Ván tiếp (→)"
        >
          →
        </button>
        <TeachingTimer
          minimal
          paused={paused}
          resetKey={`${exercise.id}-${attempt}`}
        />
        <button
          ref={expandButtonRef}
          onClick={() => void toggleExpanded()}
          aria-label="Thoát chế độ giảng dạy"
        >
          Thoát · Esc
        </button>
      </div>
      <LondonTrainer
        key={exercise.id}
        exercise={exercise}
        game={game}
        referenceGames={examples.map((e) => ({
          reference: { id: e.gameId, kind: 'game', ply: e.ply, branch: 0 },
          source: londonGameSource(data.games.find((g) => g.id === e.gameId)!),
        }))}
        onComplete={(assisted) => onComplete(exercise.id, assisted)}
        onPreviousExercise={index > 0 ? () => setIndex(index - 1) : undefined}
        onNextExercise={
          index < examples.length - 1 ? () => setIndex(index + 1) : undefined
        }
        onTimerPause={setPaused}
        onRestart={() => setAttempt((a) => a + 1)}
      />
    </div>
  );
}
