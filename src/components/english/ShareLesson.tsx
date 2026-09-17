import { useLearnerText } from './LearnerLanguage';
import { useEffect, useState } from 'react';
import { Lesson } from '@/lib/english/lessons';
import {
  encodeSharedLesson,
  sharedLessonUrl,
  publisherShareId,
} from '@/lib/english/share';
import s from './EnglishStudio.module.css';

export default function ShareLesson({
  lesson,
  onClose,
}: {
  lesson: Lesson;
  onClose: () => void;
}) {
  const t = useLearnerText();
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [local, setLocal] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setLocal(
      ['localhost', '127.0.0.1', '::1', '[::1]'].includes(location.hostname)
    );
    Promise.resolve()
      .then(() => encodeSharedLesson(lesson, publisherShareId(lesson.id)))
      .then((token) => {
        if (!cancelled) setUrl(sharedLessonUrl(location.origin, token));
      })
      .catch((e) => {
        if (!cancelled)
          setError(
            e instanceof Error ? e.message : 'Could not create this link.'
          );
      });
    return () => {
      cancelled = true;
    };
  }, [lesson]);
  return (
    <section className={s.sharePanel} aria-label={t('Share lesson')}>
      <div className={s.sectionHead}>
        <div>
          <p className={s.eyebrow}>{t('Share a lesson copy')}</p>
          <h2>{lesson.title}</h2>
        </div>
        <button className={s.quiet} onClick={onClose}>
          {t('Close sharing')}{' '}
        </button>
      </div>
      <p>
        {t(
          'Anyone with this link can open and practice this lesson. Your family profiles, scores and recordings are excluded.'
        )}{' '}
      </p>
      <p className={s.muted}>
        {t(
          'This is a frozen copy. After editing, create a new link to share the updated lesson. Existing links remain available.'
        )}{' '}
      </p>
      {local && (
        <p className={s.notice}>
          {t(
            'You are on localhost. To share with another device, open this app using its deployed address or a network address reachable by that device, then create the link there.'
          )}{' '}
        </p>
      )}
      {error ? (
        <p role="alert" className={s.notice}>
          {t(error)}
        </p>
      ) : !url ? (
        <p role="status">{t('Preparing lesson link…')}</p>
      ) : (
        <>
          <label className={s.field}>
            {t('Lesson link')}{' '}
            <textarea
              className={s.shareLink}
              readOnly
              value={url}
              onFocus={(e) => e.currentTarget.select()}
            />
          </label>
          <div className={s.actions}>
            <button
              className={s.primary}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(url);
                  setCopied(true);
                  setError('');
                } catch {
                  setCopied(false);
                }
              }}
            >
              {copied ? t('✓ Copied') : t('Copy link')}
            </button>
            <a
              className={s.secondary}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('Preview learner page ↗')}{' '}
            </a>
          </div>
          <p className={s.muted} role="status">
            {copied
              ? t('Ready to paste into your family or class chat.')
              : t('You can also select and copy the full link above.')}
          </p>
        </>
      )}
    </section>
  );
}
