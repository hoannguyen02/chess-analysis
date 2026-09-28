import LessonNotes from './LessonNotes';
import {
  Attempt,
  fingerprint,
  Lesson,
  validAttempts,
} from '@/lib/english/lessons';
import { decodeSharedSnapshot } from '@/lib/english/share';
import {
  HISTORY_KEY,
  readSharedHistory,
  rememberSharedLesson,
  SharedBookmark,
} from '@/lib/english/shared-history';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import s from './EnglishStudio.module.css';
import {
  LearnerLanguagePicker,
  LearnerLanguageProvider,
  useLearnerText,
} from './LearnerLanguage';
import PracticeSession from './PracticeSession';
import SharedHistory from './SharedHistory';
import TeachSession from './TeachSession';
import { VoiceContext, VoicePicker } from './VoiceSettings';

export default function SharedLesson() {
  return (
    <LearnerLanguageProvider>
      <SharedLessonContent />
    </LearnerLanguageProvider>
  );
}

function SharedLessonContent() {
  const t = useLearnerText();
  const [history, setHistory] = useState<SharedBookmark[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [removed, setRemoved] = useState<SharedBookmark | null>(null);
  const [voice, setVoice] = useState('');
  useEffect(() => {
    try {
      setVoice(localStorage.getItem('lima-english-shared-voice-v1') || '');
    } catch {}
  }, []);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [addedToast, setAddedToast] = useState(false);
  const [toastPaused, setToastPaused] = useState(false);
  useEffect(() => {
    if (!addedToast || toastPaused) return;
    const timer = window.setTimeout(() => setAddedToast(false), 5000);
    return () => window.clearTimeout(timer);
  }, [addedToast, toastPaused]);
  const [mode, setMode] = useState<'home' | 'practice' | 'follow'>('home');
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  useEffect(() => {
    let generation = 0;
    const load = async () => {
      const current = ++generation;
      setLesson(null);
      setError('');
      setNotice('');
      setAddedToast(false);
      setMode('home');
      setShowHistory(!location.hash);
      try {
        setHistory(readSharedHistory());
      } catch {
        setNotice(
          'Shared lesson history could not be loaded. Stored data has not been changed.'
        );
      }
      if (!location.hash) return;
      try {
        const token = location.hash.startsWith('#lesson=')
          ? location.hash.slice(8)
          : '';
        const snapshot = await decodeSharedSnapshot(token);
        const next = snapshot.lesson;
        if (current !== generation) return;
        let saved: Attempt[] = [];
        try {
          saved = validAttempts(
            JSON.parse(
              localStorage.getItem('lima-english-shared-progress-v1') || '[]'
            )
          );
        } catch {
          setNotice(
            'Results will be available during this visit, but browser storage is unavailable.'
          );
        }
        setAttempts(saved);
        setLesson(next);
        try {
          const existing = readSharedHistory();
          const fresh = !existing.some(
            (entry) => entry.shareId === snapshot.shareId
          );
          const updated = rememberSharedLesson(existing, {
            shareId: snapshot.shareId,
            title: next.title,
            link: '/english-practice/learn#lesson=' + token,
            lastOpened: new Date().toISOString(),
          });
          localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
          setHistory(updated);
          if (fresh) setAddedToast(true);
        } catch {
          setNotice((previous) =>
            [
              previous,
              'This lesson is open, but its link could not be saved. Keep the original link to revisit it.',
            ]
              .filter(Boolean)
              .join(' ')
          );
        }
      } catch (e) {
        if (current === generation)
          setError(e instanceof Error ? e.message : 'Could not open lesson.');
      }
    };
    void load();
    window.addEventListener('hashchange', load);
    return () => {
      generation++;
      window.removeEventListener('hashchange', load);
    };
  }, []);
  const record = (attempt: Attempt) => {
    const next = [...attempts, attempt].slice(-2000);
    setAttempts(next);
    try {
      localStorage.setItem(
        'lima-english-shared-progress-v1',
        JSON.stringify(next)
      );
    } catch {
      setNotice(
        'Your result is shown for this visit, but could not be saved in this browser.'
      );
    }
  };
  const completed =
    lesson?.activities.filter((activity) => {
      const latest = attempts
        .filter(
          (a) =>
            a.lessonId === lesson.id &&
            a.activityId === activity.id &&
            a.fingerprint === fingerprint(activity)
        )
        .at(-1);
      return latest && latest.score >= 80;
    }).length || 0;
  return (
    <VoiceContext.Provider
      value={{
        value: voice,
        onChange: (next) => {
          setVoice(next);
          try {
            localStorage.setItem('lima-english-shared-voice-v1', next);
          } catch {
            setNotice(
              'Your voice choice works for this visit, but could not be saved.'
            );
          }
        },
      }}
    >
      <main className={s.learnerPage}>
        <div className={s.studio}>
          <div className={s.topline}>
            <div className={s.brand}>
              <Link
                href="/english-practice"
                className={s.brandHome}
                aria-label={t('Open LIMA home')}
              >
                LIMA
              </Link>
              <p className={s.eyebrow}>Learn a little, every day</p>
            </div>
            <div className={s.actions}>
              <LearnerLanguagePicker />{' '}
              {!showHistory && (
                <a className={s.secondary} href="#">
                  {t('Shared lessons')}
                </a>
              )}
            </div>
          </div>
          {addedToast && (
            <aside
              className={s.historyToast}
              onMouseEnter={() => setToastPaused(true)}
              onMouseLeave={() => setToastPaused(false)}
              onFocus={() => setToastPaused(true)}
              onBlur={() => setToastPaused(false)}
            >
              <div role="status">{t('✓ Added to Shared lessons.')}</div>
              <button
                type="button"
                className={s.preferenceIcon}
                aria-label={t('Dismiss notification')}
                onClick={() => setAddedToast(false)}
              >
                ×
              </button>
            </aside>
          )}
          {notice && (
            <p role="status" className={s.notice}>
              {t(notice)}
            </p>
          )}
          {removed && (
            <p className={s.notice}>
              {t('Bookmark removed.')}{' '}
              <button
                className={s.quiet}
                onClick={() => {
                  try {
                    const next = rememberSharedLesson(
                      readSharedHistory(),
                      removed
                    );
                    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
                    setHistory(next);
                    setRemoved(null);
                  } catch {
                    setNotice(
                      'Could not restore bookmark. Browser storage may be unavailable.'
                    );
                  }
                }}
              >
                {t('Undo')}
              </button>
            </p>
          )}
          {showHistory ? (
            <SharedHistory
              entries={history}
              onRemove={(id) => {
                try {
                  const current = readSharedHistory();
                  const entry = current.find((item) => item.shareId === id);
                  const next = current.filter((item) => item.shareId !== id);
                  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
                  setHistory(next);
                  setRemoved(entry || null);
                } catch {
                  setNotice(
                    'Could not remove bookmark. Stored data is unchanged.'
                  );
                }
              }}
            />
          ) : error ? (
            <section className={s.card}>
              <h1>{t('We couldn’t open this lesson')}</h1>
              <p role="alert">{t(error)}</p>
            </section>
          ) : !lesson ? (
            <p role="status">{t('Opening your lesson…')}</p>
          ) : mode === 'practice' ? (
            <PracticeSession
              lesson={lesson}
              onAttempt={record}
              onExit={() => setMode('home')}
              exitLabel={t('Back to lesson')}
            />
          ) : mode === 'follow' ? (
            <TeachSession
              lesson={lesson}
              profiles={[]}
              learner
              onExit={() => setMode('home')}
            />
          ) : (
            <section className={s.card}>
              <div className={s.sharedLessonMeta}>
                <p className={s.eyebrow}>
                  {lesson.level} · {lesson.topic}
                </p>
                <div className={s.sharedLessonVoice}>
                  <VoicePicker />
                </div>
              </div>
              <h1 className={s.teachPrompt}>{lesson.title}</h1>
              <p className={s.teachPassage}>{lesson.goal}</p>
              <LessonNotes lesson={lesson} />
              {lesson.challenge && (
                <details className={s.lessonNotes}>
                  <summary>{t('Personal challenge (unscored)')}</summary>
                  <p className={s.lessonNoteText}>{lesson.challenge}</p>
                </details>
              )}
              <p className={s.muted}>
                {lesson.vocabulary.length} {t('words ·')}{' '}
                {lesson.activities.length} {t('activities')}
              </p>
              <div className={s.actions}>
                <button
                  className={s.primary}
                  onClick={() => setMode('practice')}
                >
                  {t('Practice on my own →')}
                </button>
                <button
                  className={s.secondary}
                  onClick={() => setMode('follow')}
                >
                  {t('Follow the teacher')}
                </button>
              </div>
              <p className={s.muted}>
                {t(
                  'Following a teacher? Choose the lesson step they ask you to open. Steps are not synchronized live.'
                )}
              </p>
              <div className={s.notice}>
                <strong>
                  {completed} / {lesson.activities.length}{' '}
                  {t('activities practiced at 80%+')}
                </strong>
                <p>
                  {t(
                    'Results stay in this browser and are not sent to your teacher. On a shared device, this page uses one learner history.'
                  )}
                </p>
              </div>
            </section>
          )}
        </div>
      </main>
    </VoiceContext.Provider>
  );
}
