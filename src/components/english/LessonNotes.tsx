import { PronunciationLabels } from './WordPronunciation';
import { useEffect, useState, type ReactNode } from 'react';
import { conversationLine } from '@/lib/english/voices';
import { Lesson, NOTE_LABELS } from '@/lib/english/lessons';
import { useLearnerText } from './LearnerLanguage';
import { useReadText } from './VoiceSettings';
import s from './EnglishStudio.module.css';

// Match the complete example, never manufacture sentence IPA from its words.
export function examplePronunciations(
  line: string,
  vocabulary: Lesson['vocabulary']
) {
  const key = (value: string) =>
    value
      .trim()
      .replace(/[.!?]+$/, '')
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase();
  const matches = vocabulary.filter(
    (entry) => key(entry.word) === key(line) && entry.pronunciations
  );
  if (!matches.length) return undefined;
  const first = matches[0].pronunciations;
  // Duplicate vocabulary with different readings requires context.
  if (
    matches.some(
      (entry) => JSON.stringify(entry.pronunciations) !== JSON.stringify(first)
    )
  )
    return undefined;
  return first;
}

// Respect explicit line breaks; sentence segmentation preserves abbreviations.
export function splitPronunciationExamples(text: string): string[] {
  if (!text.trim()) return [];
  // Older browsers still offer per-line playback without guessing abbreviations.
  if (typeof Intl.Segmenter !== 'function')
    return text
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);
  const segmenter = new Intl.Segmenter('en', { granularity: 'sentence' });
  return text
    .split(/\n+/)
    .flatMap((line) =>
      Array.from(segmenter.segment(line), (item) => item.segment.trim()).filter(
        Boolean
      )
    );
}

export default function LessonNotes({
  lesson,
  audio = true,
  renderEdit,
  expand = false,
}: {
  lesson: Lesson;
  audio?: boolean;
  renderEdit?: (section: keyof typeof NOTE_LABELS) => ReactNode;
  expand?: boolean;
}) {
  const t = useLearnerText();
  const { readSequence, stop, playing, activeIndex, error } = useReadText();
  const [activeSection, setActiveSection] = useState<
    'dialogue' | 'pronunciation' | null
  >(null);
  const [replayIndex, setReplayIndex] = useState<number | null>(null);
  const [rate, setRate] = useState(1);
  const notes = lesson.notes || {};
  useEffect(
    () => stop,
    [lesson.id, notes.dialogue, notes.pronunciationModel, audio, stop]
  );
  if (
    !renderEdit &&
    !Object.values(notes).some(Boolean) &&
    !lesson.reviewLesson
  )
    return null;
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
    (key) =>
      renderEdit ||
      notes[key] ||
      (key === 'pronunciation' && notes.pronunciationModel)
  );
  return (
    <section
      className={s.lessonNotes}
      aria-label={t('Learn before you practise')}
    >
      <h3>{t('Learn before you practise')}</h3>
      {sections.map((key) => {
        const model =
          key === 'pronunciation' ? notes.pronunciationModel : undefined;
        const playable =
          audio && (key === 'dialogue' || (key === 'pronunciation' && !!model));
        const lines =
          key === 'dialogue'
            ? (notes.dialogue || '')
                .split(/\n+/)
                .map((line) => line.trim())
                .filter(Boolean)
            : splitPronunciationExamples(model || '');
        const spokenLines =
          key === 'dialogue' ? lines.map(conversationLine) : lines;
        const sectionPlaying = activeSection === key && playing;
        const highlighted =
          sectionPlaying && activeIndex !== null
            ? (replayIndex ?? activeIndex)
            : null;
        return (
          <details
            key={key}
            open={expand || undefined}
            onToggle={(event) => {
              if (!event.currentTarget.open && sectionPlaying) stop();
            }}
          >
            <summary>{t(NOTE_LABELS[key])}</summary>
            {renderEdit?.(key)}
            {key === 'pronunciation' && notes.pronunciation && (
              <p className={s.lessonNoteText}>{notes.pronunciation}</p>
            )}
            {playable ? (
              <>
                <div className={s.actions}>
                  <button
                    type="button"
                    className={s.secondary}
                    onClick={() => {
                      if (sectionPlaying) stop();
                      else {
                        setActiveSection(key as 'dialogue' | 'pronunciation');
                        setReplayIndex(null);
                        readSequence(spokenLines, rate);
                      }
                    }}
                  >
                    {sectionPlaying
                      ? `■ ${t('Stop')}`
                      : `▶ ${t(key === 'dialogue' ? 'Play conversation' : 'Play all')}`}
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
                {key === 'dialogue' && (
                  <p className={s.muted}>
                    {t(
                      'A: Google UK Male · B: Google UK Female (when available)'
                    )}
                  </p>
                )}
                <div className={s.conversationLines} lang="en">
                  {lines.map((line, index) => (
                    <div
                      key={index}
                      className={`${s.pronunciationExampleRow} ${highlighted === index ? s.conversationActive : ''}`}
                    >
                      <button
                        type="button"
                        key={index}
                        className={s.conversationLine}
                        aria-label={`${t('Play sentence')}: ${line}`}
                        aria-current={
                          highlighted === index ? 'true' : undefined
                        }
                        onClick={() => {
                          setActiveSection(key as 'dialogue' | 'pronunciation');
                          setReplayIndex(index);
                          readSequence([spokenLines[index]], rate);
                        }}
                      >
                        <span aria-hidden="true" className={s.conversationPlay}>
                          ▶
                        </span>
                        {line}
                      </button>
                      {key === 'pronunciation' && (
                        <PronunciationLabels
                          pronunciations={examplePronunciations(
                            line,
                            lesson.vocabulary
                          )}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              key !== 'pronunciation' && (
                <p className={s.lessonNoteText}>{notes[key]}</p>
              )
            )}
            {key === 'pronunciation' && model && !audio && (
              <p className={s.lessonNoteText} lang="en">
                {model}
              </p>
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
