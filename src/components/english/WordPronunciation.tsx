import type { Pronunciations } from '@/lib/english/pronunciation';
import { useLearnerText } from './LearnerLanguage';
import s from './EnglishStudio.module.css';

/** Learning views are deliberately synchronous: no network or status messages. */
export default function WordPronunciation({
  word,
  pronunciations,
}: {
  word: string;
  pronunciations?: Pronunciations;
}) {
  return (
    <span className={s.wordWithPronunciation}>
      <span>{word}</span>
      <PronunciationLabels pronunciations={pronunciations} />
    </span>
  );
}

export function PronunciationLabels({
  pronunciations,
}: {
  pronunciations?: Pronunciations;
}) {
  const t = useLearnerText();
  return (
    <>
      {(['UK', 'US', 'IPA'] as const).map((accent) => {
        if (
          accent === 'IPA' &&
          [pronunciations?.UK?.ipa, pronunciations?.US?.ipa].includes(
            pronunciations?.IPA?.ipa
          )
        )
          return null;
        const entry = pronunciations?.[accent];
        if (!entry) return null;
        return (
          <a
            key={accent}
            className={s.wordPronunciation}
            href={entry.source}
            target="_blank"
            rel="noopener noreferrer"
            title={t('Open dictionary source')}
            aria-label={`${accent} ${entry.ipa}. ${t('Open dictionary source')}`}
          >
            <span className={s.pronunciationAccent}>{accent}</span> {entry.ipa}
          </a>
        );
      })}
    </>
  );
}
