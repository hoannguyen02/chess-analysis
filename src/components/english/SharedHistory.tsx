import { useLearnerText } from './LearnerLanguage';
import { useEffect, useState } from 'react';
import { SharedBookmark } from '@/lib/english/shared-history';
import s from './EnglishStudio.module.css';

const INTRO_SEEN_KEY = 'lima-english-shared-history-intro-seen-v1';
let introSeenThisVisit = false;

export default function SharedHistory({
  entries,
  onRemove,
}: {
  entries: SharedBookmark[];
  onRemove: (id: string) => void;
}) {
  const t = useLearnerText();
  const [search, setSearch] = useState('');
  const [showIntro, setShowIntro] = useState(false);
  const [pauseIntro, setPauseIntro] = useState(false);
  useEffect(() => {
    if (introSeenThisVisit) return;
    try {
      if (localStorage.getItem(INTRO_SEEN_KEY)) return;
      localStorage.setItem(INTRO_SEEN_KEY, '1');
    } catch {
      // Still avoid repeats during this visit when browser storage is disabled.
    }
    introSeenThisVisit = true;
    setShowIntro(true);
  }, []);
  useEffect(() => {
    if (!showIntro || pauseIntro) return;
    const timer = window.setTimeout(() => setShowIntro(false), 10000);
    return () => window.clearTimeout(timer);
  }, [showIntro, pauseIntro]);
  const filtered = entries.filter((entry) =>
    entry.title.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <section>
      <h1 className={s.teachPrompt}>{t('Shared lessons')}</h1>
      {showIntro && (
        <aside
          className={s.historyToast}
          onMouseEnter={() => setPauseIntro(true)}
          onMouseLeave={() => setPauseIntro(false)}
          onFocus={() => setPauseIntro(true)}
          onBlur={() => setPauseIntro(false)}
        >
          <div role="status">
            <strong>{t('Your lesson links, kept here')}</strong>
            <p>
              {t(
                'Opened lessons are added automatically—up to 200, in this browser only. Bookmark this page to return later.'
              )}
            </p>
          </div>
          <button
            type="button"
            className={s.preferenceIcon}
            aria-label={t('Dismiss notification')}
            onClick={() => setShowIntro(false)}
          >
            ×
          </button>
        </aside>
      )}
      <label className={s.field}>
        {t('Search shared lessons')}
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('Lesson title')}
        />
      </label>
      <div className={`${s.grid} ${s.sharedHistoryGrid}`}>
        {filtered.map((entry) => (
          <article className={s.card} key={entry.shareId}>
            <h2>{entry.title}</h2>
            <p className={s.muted}>
              {t('Last opened')}{' '}
              {new Date(entry.lastOpened).toLocaleDateString()}
            </p>
            <div className={s.actions}>
              <a className={s.primary} href={'#' + entry.link.split('#')[1]}>
                {t('Open lesson →')}
              </a>
              <button
                className={s.quiet}
                aria-label={t('Remove bookmark') + ': ' + entry.title}
                onClick={() => {
                  if (
                    window.confirm(
                      t(
                        'Remove “{title}” from Shared lessons? This only removes the saved link; your practice results will stay.'
                      ).replace('{title}', entry.title)
                    )
                  )
                    onRemove(entry.shareId);
                }}
              >
                {t('Remove bookmark')}
              </button>
            </div>
          </article>
        ))}
      </div>
      {!filtered.length && (
        <p className={s.empty}>
          {entries.length
            ? t('No matching lessons.')
            : t(
                'Open a link from your teacher. The lesson will appear here after it loads.'
              )}
        </p>
      )}
    </section>
  );
}
