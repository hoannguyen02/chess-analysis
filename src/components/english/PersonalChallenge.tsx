import { useState } from 'react';
import { Lesson } from '@/lib/english/lessons';
import { useLearnerText } from './LearnerLanguage';
import SpeechRecorder from './SpeechRecorder';
import s from './EnglishStudio.module.css';

export default function PersonalChallenge({ lesson }: { lesson: Lesson }) {
  const t = useLearnerText();
  const [reflect, setReflect] = useState(false);
  if (!lesson.challenge) return null;
  return (
    <section className={s.card}>
      <span className={s.badge}>{t('Personal challenge (unscored)')}</span>
      <p className={s.lessonNoteText}>{lesson.challenge}</p>
      <p className={s.muted}>
        {t('Use your own words. There is no fixed answer or percentage score.')}
      </p>
      <SpeechRecorder
        disabled={false}
        allowTranscription={false}
        onTranscript={() => {}}
        onBusyChange={() => {}}
      />
      <button
        type="button"
        className={s.secondary}
        onClick={() => setReflect((v) => !v)}
      >
        {t('Reflect on my practice')}
      </button>
      {reflect && (
        <p className={s.lessonNoteText}>
          {t(
            'What could you say clearly? What was difficult? Choose one sentence to try again. Reflection stays in this session.'
          )}
        </p>
      )}
    </section>
  );
}
