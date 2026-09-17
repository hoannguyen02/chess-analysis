import PersonalChallenge from './PersonalChallenge';
import LessonNotes from './LessonNotes';
import { useLearnerText } from './LearnerLanguage';
import { useMemo, useState } from 'react';
import {
  Activity,
  Attempt,
  fingerprint,
  KIND_SKILL,
  Lesson,
  normalize,
  scoreAnswer,
  SKILLS,
  Skill,
  uid,
} from '@/lib/english/lessons';
import { useReadText, VoicePicker } from './VoiceSettings';
import SpeechRecorder from './SpeechRecorder';
import SentenceBuilder from './SentenceBuilder';
import { kindLabels } from './LessonEditor';
import s from './EnglishStudio.module.css';

export { useReadText } from './VoiceSettings';

function Exercise({
  activity,
  lessonId,
  onAttempt,
  onNext,
  last,
}: {
  activity: Activity;
  lessonId: string;
  onAttempt: (a: Attempt) => void;
  onNext: () => void;
  last: boolean;
}) {
  const t = useLearnerText();
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<ReturnType<typeof scoreAnswer> | null>(
    null
  );
  const [revealed, setRevealed] = useState(false);
  const [assisted, setAssisted] = useState(false);
  const [picked, setPicked] = useState<number[]>([]);
  const [speechBusy, setSpeechBusy] = useState(false);
  const { read, stop, playing, error } = useReadText();
  const speech = ['repeat', 'read-aloud'].includes(activity.kind);
  const order = activity.kind === 'word-order';
  // A stable, deterministic shuffle avoids SSR differences and preserves duplicate words.
  const words = useMemo(() => {
    const original = activity.answers[0].split(/\s+/);
    const shuffled = original
      .map((word, index) => ({ word, key: index }))
      .sort(
        (a, b) =>
          ((a.key * 17 + 3) % original.length) -
          ((b.key * 17 + 3) % original.length)
      )
      .reverse();
    if (
      shuffled.length > 1 &&
      shuffled.every((entry, i) => entry.word === original[i])
    ) {
      shuffled.push(shuffled.shift()!);
    }
    return shuffled;
  }, [activity.answers]);
  const check = () => {
    if (!normalize(answer).length || result) return;
    const scored = scoreAnswer(answer, activity.answers);
    setResult(scored);
    stop();
    onAttempt({
      id: uid(),
      lessonId,
      activityId: activity.id,
      fingerprint: fingerprint(activity),
      skill: KIND_SKILL[activity.kind],
      score: scored.score,
      at: new Date().toISOString(),
      assisted,
      source: speech ? 'speech' : 'typed',
    });
  };
  return (
    <div className={`${s.card} ${s.exercise}`}>
      <span className={s.badge}>{t(kindLabels[activity.kind])}</span>
      <h2>{activity.prompt}</h2>
      {['comprehension', 'read-aloud', 'repeat'].includes(activity.kind) && (
        <div className={s.passage}>{activity.text}</div>
      )}
      {['dictation', 'repeat', 'read-aloud'].includes(activity.kind) && (
        <div className={s.audioPanel}>
          <VoicePicker disabled={speechBusy} />
          <button
            type="button"
            className={s.primary}
            disabled={speechBusy}
            onClick={() => (playing ? stop() : read(activity.text))}
          >
            {playing ? t('■ Stop audio') : t('▶ Listen to the model')}
          </button>
          <button
            type="button"
            className={s.secondary}
            disabled={speechBusy}
            onClick={() => read(activity.text, 0.75)}
          >
            {t('Listen slowly')}
          </button>
          {activity.kind === 'dictation' && !result && (
            <button
              type="button"
              className={s.quiet}
              onClick={() => {
                setRevealed(!revealed);
                setAssisted(true);
              }}
            >
              {revealed ? t('Hide text') : t('Show text (hint)')}
            </button>
          )}
        </div>
      )}
      {error && (
        <p role="alert" className={`${s.notice} ${s.error}`}>
          {t(error)}
        </p>
      )}
      {revealed && activity.kind === 'dictation' && !result && (
        <p className={s.passage}>{activity.text}</p>
      )}
      {speech ? (
        <SpeechRecorder
          disabled={!!result}
          onTranscript={setAnswer}
          onBusyChange={setSpeechBusy}
        />
      ) : order ? (
        <SentenceBuilder
          words={words}
          picked={picked}
          disabled={!!result}
          onChange={(next) => {
            setPicked(next);
            setAnswer(next.map((id) => words[id].word).join(' '));
          }}
        />
      ) : (
        <label className={s.field}>
          {t('Your answer')}
          <textarea
            className={s.answer}
            maxLength={2000}
            value={answer}
            disabled={!!result}
            autoComplete="off"
            spellCheck={false}
            placeholder={
              activity.kind === 'dictation'
                ? t('Type what you hear…')
                : t('Write your answer…')
            }
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                check();
              }
            }}
          />
        </label>
      )}
      {!result && (
        <div className={s.actions} style={{ marginTop: 22 }}>
          <button
            type="button"
            className={s.primary}
            disabled={!normalize(answer).length || speechBusy}
            onClick={check}
          >
            {speech ? t('Check word match') : t('Check answer')}
          </button>
          <span className={s.muted}>
            {speech
              ? t('Record with transcription enabled to check.')
              : t('Capitalization and punctuation do not affect your score.')}
          </span>
        </div>
      )}
      {result && (
        <div className={s.result} role="status">
          <div className={s.row}>
            <strong className={s.score}>{result.score}%</strong>
            <div>
              <strong>
                {result.score === 100
                  ? t('You got it!')
                  : t('A little practice goes a long way.')}
              </strong>
              <p className={s.muted}>
                {speech ? t('Transcript word match') : t('Answer word match')}
                {assisted ? t(' · with a hint / retry') : t(' · first try')}
              </p>
            </div>
          </div>
          <div className={s.diff}>
            {result.changes.map((change, i) => (
              <span
                key={i}
                className={s[change.kind]}
                title={
                  change.kind === 'changed'
                    ? `You said/wrote: ${change.actual}`
                    : change.kind
                }
              >
                {change.kind === 'extra'
                  ? change.actual
                  : change.kind === 'missing'
                    ? `+ ${change.expected}`
                    : change.kind === 'changed'
                      ? `${change.actual} → ${change.expected}`
                      : change.expected}
              </span>
            ))}
          </div>
          <p className={s.muted}>
            {t(
              'Green: matched · Gold: missing or changed · Crossed out: extra'
            )}
          </p>
          <p style={{ marginTop: 12 }}>
            <strong>{t('Accepted answer:')}</strong> {result.reference}
          </p>
          {activity.explanation && (
            <p className={s.muted} style={{ marginTop: 8 }}>
              {activity.explanation}
            </p>
          )}
          <div className={s.actions} style={{ marginTop: 18 }}>
            <button type="button" className={s.primary} onClick={onNext}>
              {last ? t('See session results') : t('Next activity →')}
            </button>
            <button
              type="button"
              className={s.secondary}
              onClick={() => {
                setResult(null);
                setAssisted(true);
                setAnswer('');
                setPicked([]);
              }}
            >
              {t('Try again')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PracticeSession({
  lesson,
  reviewIds,
  onAttempt,
  onExit,
  exitLabel = 'Back to lessons',
}: {
  lesson: Lesson;
  reviewIds?: string[];
  onAttempt: (a: Attempt) => void;
  onExit: () => void;
  exitLabel?: string;
}) {
  const t = useLearnerText();
  const [skill, setSkill] = useState<Skill | 'all'>('all');
  const [section, setSection] = useState<'core' | 'extra' | 'challenge'>(() =>
    lesson.activities.some((a) => a.tier !== 'extra') ? 'core' : 'extra'
  );
  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [session, setSession] = useState<Attempt[]>([]);
  const activities = lesson.activities.filter(
    (a) =>
      (skill === 'all' || KIND_SKILL[a.kind] === skill) &&
      (reviewIds || (a.tier || 'core') === section) &&
      (!reviewIds || reviewIds.includes(a.id))
  );
  const activity = activities[index];
  const record = (attempt: Attempt) => {
    setSession((current) => [...current, attempt]);
    onAttempt(attempt);
  };
  return (
    <>
      <div className={s.sectionHead}>
        <div>
          <p className={s.eyebrow}>
            {reviewIds ? t('Practice my mistakes') : t('Your daily practice')}
          </p>
          <h2>{lesson.title}</h2>
        </div>
        <button type="button" className={s.secondary} onClick={onExit}>
          ← {t(exitLabel)}
        </button>
      </div>
      <LessonNotes lesson={lesson} />
      {!reviewIds && (
        <div className={s.actions} style={{ marginBottom: 16 }}>
          {(['core', 'extra', 'challenge'] as const)
            .filter((value) => value !== 'challenge' || lesson.challenge)
            .map((value) => (
              <button
                type="button"
                key={value}
                className={section === value ? s.primary : s.secondary}
                aria-pressed={section === value}
                onClick={() => {
                  setSection(value);
                  setIndex(0);
                  setFinished(false);
                  setSession([]);
                  setSkill('all');
                }}
              >
                {t(
                  value === 'core'
                    ? 'Core practice'
                    : value === 'extra'
                      ? 'Extra practice'
                      : 'Personal challenge (unscored)'
                )}
              </button>
            ))}
        </div>
      )}
      {section === 'challenge' && !reviewIds ? (
        <PersonalChallenge key={lesson.id} lesson={lesson} />
      ) : (
        <div className={s.practice}>
          <aside className={s.sidebar}>
            <div>
              <span className={s.badge}>{lesson.level}</span>
              <p className={s.muted} style={{ marginTop: 12 }}>
                {lesson.goal}
              </p>
            </div>
            {(['all', ...SKILLS] as const).map((value) => (
              <button
                type="button"
                key={value}
                aria-pressed={skill === value}
                onClick={() => {
                  setSkill(value);
                  setIndex(0);
                  setFinished(false);
                  setSession([]);
                }}
              >
                {value === 'all' ? t('Guided practice') : t(value)}
                <span>
                  {
                    lesson.activities.filter(
                      (a) =>
                        (value === 'all' || KIND_SKILL[a.kind] === value) &&
                        (reviewIds || (a.tier || 'core') === section) &&
                        (!reviewIds || reviewIds.includes(a.id))
                    ).length
                  }
                </span>
              </button>
            ))}
          </aside>
          <div>
            {!activities.length ? (
              <div className={s.empty}>
                {t(
                  'No activities in this skill yet. Add one in the lesson editor.'
                )}
              </div>
            ) : finished ? (
              <div className={s.card}>
                <span className={s.badge}>{t('Session complete')}</span>
                <h3>{t('Small steps. Real progress.')}</h3>
                <p className={s.muted}>
                  {t('You checked')} {session.length}{' '}
                  {t(
                    'answers in this session. Your results are saved on this device.'
                  )}
                </p>
                <div className={s.passage}>
                  <strong>
                    {session.length
                      ? Math.round(
                          session.reduce((sum, a) => sum + a.score, 0) /
                            session.length
                        )
                      : 0}
                    %
                  </strong>{' '}
                  {t('average word match')}
                </div>
                <p className={s.muted}>
                  {t(
                    'This is practice accuracy, not a proficiency or pronunciation rating.'
                  )}
                </p>
                <div className={s.actions}>
                  <button type="button" className={s.primary} onClick={onExit}>
                    {t(exitLabel)}
                  </button>
                  <button
                    type="button"
                    className={s.secondary}
                    onClick={() => {
                      setFinished(false);
                      setIndex(0);
                      setSession([]);
                    }}
                  >
                    {t('Practice again')}
                  </button>
                  {!reviewIds &&
                    section === 'core' &&
                    lesson.activities.some((a) => a.tier === 'extra') && (
                      <button
                        type="button"
                        className={s.secondary}
                        onClick={() => {
                          setSection('extra');
                          setFinished(false);
                          setIndex(0);
                          setSession([]);
                          setSkill('all');
                        }}
                      >
                        {t('Try extra practice')}
                      </button>
                    )}
                  {!reviewIds && lesson.challenge && (
                    <button
                      type="button"
                      className={s.secondary}
                      onClick={() => {
                        setSection('challenge');
                        setFinished(false);
                      }}
                    >
                      {t('Personal challenge (unscored)')}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className={s.sectionHead} style={{ marginTop: 0 }}>
                  <span className={s.muted}>
                    {t('Activity')} {index + 1} {t('of')} {activities.length}
                  </span>
                  <button
                    type="button"
                    className={s.quiet}
                    onClick={() =>
                      index + 1 < activities.length
                        ? setIndex(index + 1)
                        : setFinished(true)
                    }
                  >
                    {t('Skip →')}
                  </button>
                </div>
                <div className={s.bar}>
                  <span
                    style={{ width: `${(index / activities.length) * 100}%` }}
                  />
                </div>
                <Exercise
                  key={`${activity.id}-${skill}`}
                  activity={activity}
                  lessonId={lesson.id}
                  onAttempt={record}
                  last={index === activities.length - 1}
                  onNext={() =>
                    index + 1 < activities.length
                      ? setIndex(index + 1)
                      : setFinished(true)
                  }
                />
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
