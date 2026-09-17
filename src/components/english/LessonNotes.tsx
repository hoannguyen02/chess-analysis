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
  const { read, stop, playing, error } = useReadText();
  const notes = lesson.notes || {};
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
            <p className={s.lessonNoteText}>{notes[key]}</p>
            {key === 'pronunciation' && model && (
              <p className={s.lessonNoteText} lang="en">
                {model}
              </p>
            )}
            {audio && model && (
              <div className={s.actions}>
                <button
                  type="button"
                  className={s.secondary}
                  onClick={() => read(model)}
                >
                  {t('Play model')}
                </button>
                <button
                  type="button"
                  className={s.quiet}
                  onClick={() => read(model, 0.7)}
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
