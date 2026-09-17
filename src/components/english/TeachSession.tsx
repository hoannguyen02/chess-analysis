import LessonNotes from './LessonNotes';
import { useLearnerText } from './LearnerLanguage';
import { LearnerProfile } from '@/lib/english/family';
import { Activity, Lesson } from '@/lib/english/lessons';
import { useEffect, useRef, useState } from 'react';
import s from './EnglishStudio.module.css';
import { kindLabels } from './LessonEditor';
import SentenceBuilder from './SentenceBuilder';
import { useReadText, VoicePicker } from './VoiceSettings';

type Slide =
  | { type: 'intro'; title: string }
  | { type: 'word'; title: string; word: Lesson['vocabulary'][number] }
  | { type: 'activity'; title: string; activity: Activity };

function TeachingSlide({
  slide,
  learner = false,
}: {
  slide: Slide;
  learner?: boolean;
}) {
  const t = useLearnerText();
  const [revealed, setRevealed] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [answer, setAnswer] = useState('');
  const [picked, setPicked] = useState<number[]>([]);
  const { read, stop, playing, error } = useReadText();
  if (slide.type === 'intro') return null;
  const activity = slide.type === 'activity' ? slide.activity : null;
  const word = slide.type === 'word' ? slide.word : null;
  const audioText = word?.word || activity?.text || '';
  const words = (activity?.answers[0] || '')
    .split(/\s+/)
    .map((value, key) => ({ word: value, key }))
    .reverse();
  return (
    <>
      <span className={s.badge}>
        {word ? t('Discover a word') : t(kindLabels[activity!.kind])}
      </span>
      <h2 className={s.teachPrompt}>{word ? word.word : activity!.prompt}</h2>
      {word?.example && <p className={s.teachPassage}>{word.example}</p>}
      {activity &&
        ['repeat', 'read-aloud', 'comprehension'].includes(activity.kind) && (
          <p className={s.teachPassage}>{activity.text}</p>
        )}
      {(word ||
        (activity &&
          ['dictation', 'repeat', 'read-aloud'].includes(activity.kind))) && (
        <div className={s.actions}>
          <VoicePicker />
          <button
            className={s.primary}
            onClick={() => (playing ? stop() : read(audioText))}
          >
            {playing ? t('■ Stop audio') : t('▶ Play model')}
          </button>
          <button className={s.secondary} onClick={() => read(audioText, 0.75)}>
            {t('Play slowly')}
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className={`${s.notice} ${s.error}`}>
          {t(error)}
        </p>
      )}
      {activity?.kind === 'word-order' ? (
        <div style={{ marginTop: 25 }}>
          <SentenceBuilder
            words={words}
            picked={picked}
            disabled={false}
            onChange={(next) => {
              setPicked(next);
              setAnswer(next.map((id) => words[id].word).join(' '));
              setAccepted(false);
            }}
          />
        </div>
      ) : (
        activity && (
          <label className={s.field} style={{ marginTop: 25 }}>
            {['repeat', 'read-aloud'].includes(activity.kind)
              ? t('Optional notes about the spoken answer')
              : t('Learner response (optional)')}
            <textarea
              className={s.answer}
              maxLength={2000}
              value={answer}
              placeholder={t('Discuss aloud, or write an answer together…')}
              onChange={(e) => {
                setAnswer(e.target.value);
                setAccepted(false);
              }}
            />
          </label>
        )
      )}
      <div className={s.actions} style={{ marginTop: 24 }}>
        <button
          className={s.secondary}
          aria-expanded={revealed}
          onClick={() => setRevealed(!revealed)}
        >
          {revealed
            ? t('Hide answer')
            : word
              ? t('Reveal meaning')
              : t('Reveal model answer')}
        </button>
        {activity && !learner && (
          <button
            className={accepted ? s.secondary : s.primary}
            aria-pressed={accepted}
            onClick={() => setAccepted(!accepted)}
          >
            {accepted ? '✓ Accepted by teacher' : 'Accept this response'}
          </button>
        )}
      </div>
      {revealed && (
        <div className={s.teachReveal}>
          <p className={s.eyebrow}>
            {word ? t('Meaning') : t('Model answers')}
          </p>
          {word ? (
            <p>{word.meaning}</p>
          ) : (
            <>
              <p>{activity!.answers.join(' / ')}</p>
              {activity!.explanation && (
                <p className={s.muted}>{activity!.explanation}</p>
              )}
            </>
          )}
        </div>
      )}
      {accepted && (
        <p className={s.muted} role="status">
          Accepted for this discussion. Individual practice scores are
          unchanged.
        </p>
      )}
    </>
  );
}

export default function TeachSession({
  lesson,
  profiles,
  onExit,
  learner = false,
}: {
  lesson: Lesson;
  profiles: LearnerProfile[];
  onExit: () => void;
  learner?: boolean;
}) {
  const t = useLearnerText();
  const [index, setIndex] = useState(0);
  const [focus, setFocus] = useState(false);
  const [clean, setClean] = useState(false);
  const [responder, setResponder] = useState('everyone');
  const [finished, setFinished] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const slides: Slide[] = [
    { type: 'intro', title: 'Welcome & learning goal' },
    ...lesson.vocabulary.map((word) => ({
      type: 'word' as const,
      title: word.word,
      word,
    })),
    ...lesson.activities.map((activity) => ({
      type: 'activity' as const,
      title: kindLabels[activity.kind],
      activity,
    })),
  ];
  useEffect(() => {
    if (!focus) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [focus]);
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.repeat ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.shiftKey
      )
        return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.closest('input,textarea,select,button,[role="dialog"]'))
      )
        return;
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        setFinished(false);
        setIndex((i) => Math.min(slides.length - 1, i + 1));
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setFinished(false);
        setIndex((i) => Math.max(0, i - 1));
      }
      if (event.key === 'Escape') {
        setClean(false);
        setFocus(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [slides.length]);
  useEffect(() => {
    root.current?.scrollTo({ top: 0 });
  }, [index, finished]);
  const content = (
    <div
      ref={root}
      className={`${s.studio} ${s.teaching} ${focus ? s.teachingFocus : ''}`}
      aria-label="Teach lesson"
    >
      <div className={s.teachInner}>
        {!clean && (
          <>
            <div className={s.sectionHead}>
              <div>
                <p className={s.eyebrow}>
                  {learner ? t('Follow the teacher') : t('Teach together')} ·{' '}
                  {lesson.level}
                </p>
                <h2>{lesson.title}</h2>
                <p className={s.muted}>
                  {learner
                    ? t(
                        'Choose the step your teacher asks you to open. This view does not save scores or synchronize live.'
                      )
                    : 'You set the pace. Teaching does not change personal practice progress.'}
                </p>
              </div>
              <div className={s.actions}>
                <button
                  className={s.secondary}
                  aria-pressed={focus}
                  onClick={() => setFocus(!focus)}
                >
                  {focus ? t('Exit focus view') : t('Focus view')}
                </button>
                {!learner && (
                  <button
                    className={s.secondary}
                    onClick={() => {
                      setFocus(true);
                      setClean(true);
                    }}
                  >
                    Clean view for video
                  </button>
                )}
                <button className={s.quiet} onClick={onExit}>
                  {learner ? t('Back to lesson') : 'End teaching'}
                </button>
              </div>
            </div>
            <div className={s.teachControls}>
              <label className={s.field}>
                {t('Lesson step')}
                <select
                  value={index}
                  onChange={(e) => {
                    setIndex(Number(e.target.value));
                    setFinished(false);
                  }}
                >
                  {slides.map((slide, i) => (
                    <option key={i} value={i}>
                      {i + 1}.{' '}
                      {slide.type === 'word' ? slide.title : t(slide.title)}
                    </option>
                  ))}
                </select>
              </label>
              {!learner && (
                <label className={s.field}>
                  Invite a response
                  <select
                    value={responder}
                    onChange={(e) => setResponder(e.target.value)}
                  >
                    <option value="everyone">Everyone together</option>
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <span className={s.muted}>
                {t(
                  'Take turns, pause to explain, and accept alternative answers.'
                )}
              </span>
            </div>
          </>
        )}
        {!learner && !clean && lesson.teacherNotes && (
          <details className={s.lessonNotes}>
            <summary>{t('Teacher notes')}</summary>
            <p className={s.lessonNoteText}>{lesson.teacherNotes}</p>
          </details>
        )}
        <div className={s.teachStage}>
          <p className={s.eyebrow}>LIMA English · {lesson.topic}</p>
          {finished ? (
            <>
              <h2 className={s.teachPrompt}>{t('What did we learn today?')}</h2>
              {lesson.challenge && (
                <>
                  <h3>{t('Personal challenge (unscored)')}</h3>
                  <p className={s.lessonNoteText}>{lesson.challenge}</p>
                </>
              )}
              <p className={s.teachPassage}>{lesson.goal}</p>
              <p className={s.muted}>
                {t(
                  'Ask everyone to share one word and use it in a sentence. Individual practice is ready when you return to the library.'
                )}
              </p>
            </>
          ) : slides[index].type === 'intro' ? (
            <>
              <h1 className={s.teachPrompt}>{lesson.title}</h1>
              <LessonNotes lesson={lesson} />
              <p className={s.teachPassage}>{lesson.goal}</p>
              <div className={s.skillDots}>
                <span>{t('Listen')}</span>
                <span>{t('Speak')}</span>
                <span>{t('Write')}</span>
                <span>{t('Read')}</span>
              </div>
              <p className={s.muted}>
                {t(
                  'Start with words, practice together, and finish with a conversation.'
                )}
              </p>
            </>
          ) : (
            <TeachingSlide
              key={index}
              slide={slides[index]}
              learner={learner}
            />
          )}
        </div>
        <div className={s.teachNavigation}>
          <button
            className={s.secondary}
            disabled={index === 0 && !finished}
            onClick={() => {
              if (finished) setFinished(false);
              else setIndex((i) => i - 1);
            }}
          >
            {t('← Previous')}
          </button>
          <span className={s.muted}>
            {finished
              ? t('Lesson complete')
              : `${index + 1} / ${slides.length}`}
          </span>
          {clean && (
            <button className={s.quiet} onClick={() => setClean(false)}>
              {t('Show teaching controls')}
            </button>
          )}
          <button
            className={s.primary}
            onClick={() => {
              if (finished) {
                setIndex(0);
                setFinished(false);
              } else if (index === slides.length - 1) setFinished(true);
              else setIndex((i) => i + 1);
            }}
          >
            {finished
              ? t('Start again')
              : index === slides.length - 1
                ? t('Wrap up →')
                : t('Next →')}
          </button>
        </div>
      </div>
    </div>
  );
  return content;
}
