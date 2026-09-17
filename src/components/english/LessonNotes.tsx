import { useEffect, useState } from 'react';
import { conversationLine } from '@/lib/english/voices';
import { Lesson, NOTE_LABELS } from '@/lib/english/lessons';
import { useLearnerText } from './LearnerLanguage';
import { useReadText } from './VoiceSettings';
import s from './EnglishStudio.module.css';

export default function LessonNotes({
  lesson,
  audio = true,
}: {
  lesson: Lesson;
  audio?: boolean;
}) {
  const t = useLearnerText();
  const { read, readSequence, stop, playing, activeIndex, error } =
    useReadText();
  const [conversationPlaying, setConversationPlaying] = useState(false);
  const [replayIndex, setReplayIndex] = useState<number | null>(null);
  const [rate, setRate] = useState(1);
  const notes = lesson.notes || {};
  useEffect(() => stop, [lesson.id, notes.dialogue, stop]);
  const lines = (notes.dialogue || '')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const spokenLines = lines.map(conversationLine);
  const highlighted =
    conversationPlaying && playing && activeIndex !== null
      ? (replayIndex ?? activeIndex)
      : null;
  if (!Object.values(notes).some(Boolean) && !lesson.reviewLesson) return null;
  const sections = (
    [
      'beforeYouStart',
      'quickCheck',
      'grammar',
      'phrases',
      'pronunciation',
      'mistakes',
      'dialogue',
    ] as const
  ).filter(
    (key) => notes[key] || (key === 'pronunciation' && notes.pronunciationModel)
  );
  return (
    <section
      className={s.lessonNotes}
      aria-label={t('Learn before you practise')}
    >
      <h3>{t('Learn before you practise')}</h3>
      {sections.map((key) => {
        const model =
          key === 'pronunciation'
            ? notes.pronunciationModel
            : key === 'dialogue'
              ? notes.dialogue?.replace(/^[^:\n]{1,30}:\s*/gm, '')
              : undefined;
        return (
          <details
            key={key}
            onToggle={(event) => {
              if (!event.currentTarget.open && playing) stop();
            }}
          >
            <summary>{t(NOTE_LABELS[key])}</summary>
            {key === 'dialogue' && audio ? (
              <>
                <div className={s.actions}>
                  <button
                    type="button"
                    className={s.secondary}
                    onClick={() => {
                      if (conversationPlaying && playing) stop();
                      else {
                        setConversationPlaying(true);
                        setReplayIndex(null);
                        readSequence(spokenLines, rate);
                      }
                    }}
                  >
                    {conversationPlaying && playing
                      ? `■ ${t('Stop')}`
                      : `▶ ${t('Play conversation')}`}
                  </button>
                  <label className={s.conversationSpeed}>
                    {t('Speed')}
                    <select
                      value={rate}
                      onChange={(event) => {
                        stop();
                        setRate(Number(event.target.value));
                      }}
                    >
                      <option value={1}>{t('Normal')}</option>
                      <option value={0.7}>{t('Slow')}</option>
                    </select>
                  </label>
                </div>
                <p className={s.muted}>
                  {t(
                    'A: Google UK Male · B: Google UK Female (when available)'
                  )}
                </p>
                <div className={s.conversationLines} lang="en">
                  {lines.map((line, index) => (
                    <button
                      type="button"
                      key={index}
                      className={`${s.conversationLine} ${highlighted === index ? s.conversationActive : ''}`}
                      aria-label={`${t('Play sentence')}: ${line}`}
                      aria-current={highlighted === index ? 'true' : undefined}
                      onClick={() => {
                        setConversationPlaying(true);
                        setReplayIndex(index);
                        readSequence([spokenLines[index]], rate);
                      }}
                    >
                      <span aria-hidden="true" className={s.conversationPlay}>
                        ▶
                      </span>
                      {line}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <p className={s.lessonNoteText}>{notes[key]}</p>
            )}
            {key === 'pronunciation' && model && (
              <p className={s.lessonNoteText} lang="en">
                {model}
              </p>
            )}
            {audio && model && key !== 'dialogue' && (
              <div className={s.actions}>
                <button
                  type="button"
                  className={s.secondary}
                  onClick={() => {
                    setConversationPlaying(false);
                    read(model);
                  }}
                >
                  {t('Play model')}
                </button>
                <button
                  type="button"
                  className={s.quiet}
                  onClick={() => {
                    setConversationPlaying(false);
                    read(model, 0.7);
                  }}
                >
                  {t('Play slowly')}
                </button>
                {playing && (
                  <button type="button" className={s.quiet} onClick={stop}>
                    {t('Stop')}
                  </button>
                )}
              </div>
            )}
          </details>
        );
      })}
      {lesson.reviewLesson && (
        <p>
          <a
            className={s.secondary}
            href={`/english-practice/learn#lesson=${lesson.reviewLesson.token}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('Review lesson')} · {lesson.reviewLesson.title} ↗
          </a>
        </p>
      )}
      {(notes.beforeYouStart || notes.quickCheck || lesson.reviewLesson) && (
        <p className={s.muted}>
          {t(
            'Review only what you need. You can continue with this lesson at any time. Review links open in a new tab.'
          )}
        </p>
      )}
      {error && <p role="status">{t(error)}</p>}
    </section>
  );
}
