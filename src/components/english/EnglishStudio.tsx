import QuickLessonEdit from './QuickLessonEdit';
import {
  enrichPronunciations,
  PronunciationReport,
  PronunciationProgress,
} from '@/lib/english/enrich-pronunciations';
import WordPronunciation from './WordPronunciation';
import {
  FAMILY_KEY,
  FamilyNotebook,
  initialFamily,
  parseFamily,
  recordForLearner,
} from '@/lib/english/family';
import {
  applyLessonImport,
  reviseLesson,
  suggestedTarget,
} from '@/lib/english/import-plan';
import {
  Activity,
  Attempt,
  fingerprint,
  KIND_SKILL,
  Lesson,
  parseLessonPack,
  SKILLS,
  starterLessons,
  uid,
} from '@/lib/english/lessons';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  VscAdd,
  VscBook,
  VscCloudDownload,
  VscCloudUpload,
} from 'react-icons/vsc';
import s from './EnglishStudio.module.css';
import FamilyProfiles from './FamilyProfiles';
import {
  LearnerLanguagePicker,
  LearnerLanguageProvider,
  useLearnerText,
} from './LearnerLanguage';
import LessonActions from './LessonActions';
import LessonEditor from './LessonEditor';
import LessonNotes from './LessonNotes';
import PracticeSession, { useReadText } from './PracticeSession';
import ShareLesson from './ShareLesson';
import TeachSession from './TeachSession';
import { VoiceContext } from './VoiceSettings';

const LESSON_KEY = 'lima-english-lessons-v1';
const PROGRESS_KEY = 'lima-english-progress-v1';
const download = (value: unknown, name: string) => {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' })
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
};

export default function EnglishStudio() {
  return (
    <LearnerLanguageProvider>
      <EnglishStudioContent />
    </LearnerLanguageProvider>
  );
}

function EnglishStudioContent() {
  const t = useLearnerText();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [family, setFamily] = useState<FamilyNotebook>(() => initialFamily([]));
  const [familyWritable, setFamilyWritable] = useState(true);
  const activeLearner = family.profiles.find(
    (p) => p.id === family.activeProfileId
  )!;
  const attempts = activeLearner.attempts;
  const [sharing, setSharing] = useState<Lesson | null>(null);
  const [teaching, setTeaching] = useState<Lesson | null>(null);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<'lessons' | 'progress'>('lessons');
  const [editing, setEditing] = useState<Lesson | null>(null);
  const [practice, setPractice] = useState<{
    lesson: Lesson;
    reviewIds?: string[];
  } | null>(null);
  const [preview, setPreview] = useState<Lesson | null>(null);
  const [pronunciationBusy, setPronunciationBusy] = useState(false);
  const [pronunciationProgress, setPronunciationProgress] =
    useState<PronunciationProgress | null>(null);
  const [pronunciationReport, setPronunciationReport] =
    useState<PronunciationReport | null>(null);
  const pronunciationController = useRef<AbortController | null>(null);
  useEffect(() => () => pronunciationController.current?.abort(), []);
  const preparePronunciations = (items: Lesson[]) => {
    pronunciationController.current = new AbortController();
    setPronunciationReport(null);
    return enrichPronunciations(items, {
      signal: pronunciationController.current.signal,
      onProgress: setPronunciationProgress,
    });
  };
  const currentLessons = useRef(lessons);
  currentLessons.current = lessons;
  const [imported, setImported] = useState<Lesson[] | null>(null);
  const [importTargets, setImportTargets] = useState<Record<string, string>>(
    {}
  );
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const {
    read,
    stop,
    error: audioError,
  } = useReadText(activeLearner.voice || '');
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LESSON_KEY);
      const cleanupKey = 'lima-english-starters-removed-v1';
      if (saved) {
        const value = JSON.parse(saved);
        let loaded =
          [1, 2].includes(value?.version) &&
          Array.isArray(value.lessons) &&
          value.lessons.length === 0
            ? []
            : parseLessonPack(value).lessons;
        // Remove only unchanged starter copies, once. Later imports stay intact.
        if (!localStorage.getItem(cleanupKey)) {
          const defaults = parseLessonPack({
            version: 1,
            lessons: starterLessons,
          }).lessons.map((lesson) => JSON.stringify(lesson));
          const retained = loaded.filter(
            (lesson) => !defaults.includes(JSON.stringify(lesson))
          );
          if (retained.length !== loaded.length) {
            localStorage.setItem(
              LESSON_KEY,
              JSON.stringify({ version: 2, lessons: retained })
            );
            loaded = retained;
          }
        }
        setLessons(loaded);
      }
      localStorage.setItem(cleanupKey, '1');
    } catch {
      setError(
        'Saved lessons could not be loaded. Import a valid backup to recover your lessons; saving will replace the unreadable library.'
      );
    }
    try {
      const saved = localStorage.getItem(FAMILY_KEY);
      const legacy = saved ? null : localStorage.getItem(PROGRESS_KEY);
      setFamily(
        saved
          ? parseFamily(JSON.parse(saved))
          : initialFamily(legacy ? JSON.parse(legacy) : [])
      );
    } catch {
      setFamilyWritable(false);
      setError(
        'Saved family progress could not be loaded. Your stored data is unchanged; progress in this session will not be saved.'
      );
    }
    setReady(true);
  }, []);
  const saveLessons = (next: Lesson[]) => {
    try {
      localStorage.setItem(
        LESSON_KEY,
        JSON.stringify({ version: 2, lessons: next })
      );
      currentLessons.current = next;
      setLessons(next);
      setError('');
      return true;
    } catch {
      setError(
        'Could not save lessons. Browser storage may be full or disabled. Export your lessons before leaving.'
      );
      return false;
    }
  };
  const saveDuringSession = (incoming: Lesson) => {
    const current = currentLessons.current.find(
      (item) => item.id === incoming.id
    );
    if (!current) return false;
    const next = { ...incoming, revision: (current.revision || 1) + 1 };
    if (
      !saveLessons(
        currentLessons.current.map((item) =>
          item.id === next.id ? next : item
        )
      )
    )
      return false;
    setPreview((active) => (active?.id === next.id ? next : active));
    setTeaching((active) => (active?.id === next.id ? next : active));
    setPractice((active) =>
      active?.lesson.id === next.id ? { ...active, lesson: next } : active
    );
    return true;
  };
  const saveFamily = (next: FamilyNotebook) => {
    try {
      if (!familyWritable) throw new Error('Unreadable storage');
      localStorage.setItem(FAMILY_KEY, JSON.stringify(next));
      setFamily(next);
      setError('');
      return true;
    } catch {
      setError(
        'Family progress could not be saved. Stored data is unchanged. Export any session results before leaving.'
      );
      return false;
    }
  };
  const addAttempt = (attempt: Attempt) => {
    const next = recordForLearner(family, activeLearner.id, attempt);
    if (!saveFamily(next)) setFamily(next);
  };
  const startTeach = (lesson: Lesson) => {
    stop();
    setPreview(null);
    setTeaching(lesson);
    setMessage('');
  };
  const currentAttempts = useMemo(
    () =>
      attempts.filter((a) =>
        lessons.some(
          (l) =>
            l.id === a.lessonId &&
            l.activities.some(
              (activity) =>
                activity.id === a.activityId &&
                fingerprint(activity) === a.fingerprint
            )
        )
      ),
    [attempts, lessons]
  );
  const latest = (lesson: Lesson, activity: Activity) =>
    currentAttempts
      .filter((a) => a.lessonId === lesson.id && a.activityId === activity.id)
      .at(-1);
  const completed = (lesson: Lesson) =>
    lesson.activities.filter((a) => (latest(lesson, a)?.score ?? 0) >= 80)
      .length;
  const mistakes = (lesson: Lesson) =>
    lesson.activities
      .filter((a) => {
        const attempt = latest(lesson, a);
        return attempt && attempt.score < 80;
      })
      .map((a) => a.id);
  const startPractice = (lesson: Lesson, reviewIds?: string[]) => {
    stop();
    setPreview(null);
    setPractice({ lesson, reviewIds });
    setMessage('');
  };
  const exportLessons = (list: Lesson[]) => {
    download(
      { version: 2, lessons: list },
      list.length === 1
        ? `${list[0].title.replace(/[^a-z0-9]+/gi, '-').slice(0, 60)}.json`
        : 'english-lessons.json'
    );
  };
  const filtered = lessons.filter((l) =>
    `${l.title} ${l.topic} ${l.level}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );
  const totalActivities = lessons.reduce(
    (sum, l) => sum + l.activities.length,
    0
  );
  const totalComplete = lessons.reduce((sum, l) => sum + completed(l), 0);
  const newLesson = () => {
    setEditing({
      id: uid(),
      title: '',
      topic: '',
      level: 'A1',
      goal: '',
      vocabulary: [],
      activities: [
        {
          id: uid(),
          kind: 'dictation',
          prompt: 'Listen, then write what you hear.',
          text: '',
          answers: [''],
          explanation: '',
        },
      ],
    });
    setMessage('');
  };
  const receiveFile = async (file?: File) => {
    if (!file) return;
    setError('');
    setMessage('');
    setImported(null);
    setImportTargets({});
    if (file.size > 2 * 1024 * 1024) {
      setError('Choose an Excel or JSON lesson file smaller than 2 MB.');
      return;
    }
    try {
      let incoming: Lesson[];
      if (/\.xlsx?$/i.test(file.name)) {
        const { importLessonWorkbook } = await import(
          '@/lib/english/excel-import'
        );
        incoming = importLessonWorkbook(await file.arrayBuffer());
      } else {
        incoming = parseLessonPack(JSON.parse(await file.text())).lessons;
      }
      setImportTargets(
        Object.fromEntries(
          incoming.map((l) => [l.id, suggestedTarget(lessons, l)])
        )
      );
      setImported(incoming);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Could not read that lesson file.'
      );
    }
  };
  return (
    <VoiceContext.Provider
      value={{
        value: activeLearner.voice || '',
        onChange: (voice) => {
          saveFamily({
            ...family,
            profiles: family.profiles.map((p) =>
              p.id === activeLearner.id ? { ...p, voice } : p
            ),
          });
        },
      }}
    >
      <div className={s.studio}>
        <div className={s.topline}>
          <div className={s.brand}>
            <span className={s.brandmark}>
              <VscBook size={22} />
            </span>
            <div>
              LIMA English
              <p className={s.eyebrow}>A little better, every day</p>
            </div>
          </div>
          <div className={s.actions}>
            <LearnerLanguagePicker />
            {!editing && !practice && !teaching && (
              <div className={s.tabs} aria-label="LIMA English sections">
                <button
                  type="button"
                  aria-pressed={tab === 'lessons'}
                  onClick={() => {
                    setTab('lessons');
                    setPreview(null);
                    stop();
                  }}
                >
                  {t('Lessons')}{' '}
                </button>
                <button
                  type="button"
                  aria-pressed={tab === 'progress'}
                  onClick={() => {
                    setTab('progress');
                    setPreview(null);
                    stop();
                  }}
                >
                  {t('My progress')}{' '}
                </button>
                <Link className={s.quiet} href="/english-practice/learn">
                  {t('Shared lessons')}{' '}
                </Link>
              </div>
            )}
          </div>
        </div>
        {ready && !editing && !practice && !teaching && (
          <FamilyProfiles family={family} onChange={saveFamily} />
        )}
        {practice && (
          <p className={s.muted}>
            {t('Practicing as')} {activeLearner.name}
          </p>
        )}
        {sharing && !practice && !teaching && !editing && (
          <ShareLesson
            key={JSON.stringify(sharing)}
            lesson={sharing}
            onClose={() => setSharing(null)}
          />
        )}
        {error && (
          <p role="alert" className={`${s.notice} ${s.error}`}>
            {t(error)}
          </p>
        )}
        {message && (
          <p role="status" className={s.notice}>
            {t(message)}
          </p>
        )}
        {!ready ? (
          <p className={s.empty}>{t('Loading your lessons…')}</p>
        ) : editing ? (
          <LessonEditor
            key={editing.id}
            lesson={editing}
            lessons={lessons}
            onCancel={() => setEditing(null)}
            onSave={(lesson) => {
              const next = lessons.some((l) => l.id === lesson.id)
                ? lessons.map((l) =>
                    l.id === lesson.id ? reviseLesson(l, lesson) : l
                  )
                : [...lessons, lesson];
              if (next.length > 100) {
                setError(
                  'The library supports up to 100 lessons. Export and remove some lessons before adding more.'
                );
                return;
              }
              if (saveLessons(next)) {
                setEditing(null);
                setMessage(
                  'Lesson saved. Open it to preview the content or start practicing.'
                );
              }
            }}
          />
        ) : teaching ? (
          <TeachSession
            lesson={teaching}
            profiles={family.profiles}
            onSave={saveDuringSession}
            onExit={() => setTeaching(null)}
          />
        ) : practice ? (
          <PracticeSession
            key={practice.lesson.id + (practice.reviewIds ? '-review' : '')}
            lesson={practice.lesson}
            reviewIds={practice.reviewIds}
            onSave={saveDuringSession}
            onAttempt={addAttempt}
            onExit={() => setPractice(null)}
          />
        ) : preview ? (
          <>
            <div className={s.sectionHead}>
              <div>
                <p className={s.eyebrow}>
                  {preview.topic} · {preview.level}
                </p>
                <h2>{preview.title}</h2>
                <p className={s.muted}>{preview.goal}</p>
              </div>
              <div className={s.actions}>
                <button
                  className={s.secondary}
                  type="button"
                  onClick={() => {
                    setPreview(null);
                    stop();
                  }}
                >
                  {t('← Lessons')}{' '}
                </button>
                <button
                  className={s.primary}
                  type="button"
                  onClick={() => startPractice(preview)}
                >
                  {t('Start practice →')}{' '}
                </button>
                <button
                  className={s.secondary}
                  onClick={() => startTeach(preview)}
                >
                  {t('Teach together')}{' '}
                </button>
                <button
                  className={s.secondary}
                  onClick={() => setSharing(preview)}
                >
                  {t('Share lesson')}{' '}
                </button>
              </div>
            </div>
            <LessonNotes
              lesson={preview}
              renderEdit={(note) => (
                <QuickLessonEdit
                  lesson={preview}
                  target={{ note }}
                  onSave={saveDuringSession}
                />
              )}
            />
            {preview.teacherNotes && (
              <details className={s.lessonNotes}>
                <summary>{t('Teacher notes')}</summary>
                <p className={s.lessonNoteText}>{preview.teacherNotes}</p>
              </details>
            )}
            {preview.challenge && (
              <details className={s.lessonNotes}>
                <summary>{t('Personal challenge (unscored)')}</summary>
                <p className={s.lessonNoteText}>{preview.challenge}</p>
              </details>
            )}
            <div className={s.grid}>
              <section className={s.card}>
                <h3>{t('Your word collection')}</h3>
                <p className={s.muted}>
                  {t(
                    'Listen to each word and try using it in your own sentence.'
                  )}{' '}
                </p>
                {preview.vocabulary.length ? (
                  preview.vocabulary.map((v, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '16px 0',
                        borderBottom: '1px solid #edf0ec',
                      }}
                    >
                      <div className={s.sectionHead} style={{ margin: 0 }}>
                        <strong>
                          <WordPronunciation
                            word={v.word}
                            pronunciations={v.pronunciations}
                          />
                        </strong>
                        <button
                          className={s.quiet}
                          aria-label={`Listen to ${v.word}`}
                          onClick={() => read(v.word)}
                        >
                          {t('▶ Listen')}{' '}
                        </button>
                      </div>
                      <p className={s.muted}>{v.meaning}</p>
                      <p style={{ fontSize: 14, marginTop: 6 }}>{v.example}</p>
                    </div>
                  ))
                ) : (
                  <p className={s.empty}>{t('No vocabulary added yet.')}</p>
                )}
                {audioError && (
                  <p role="alert" className={s.notice}>
                    {t(audioError)}
                  </p>
                )}
              </section>
              <section className={s.card}>
                <h3>{t('Inside this lesson')}</h3>
                {SKILLS.map((skill) => (
                  <div className={s.sectionHead} key={t(skill)}>
                    <span style={{ textTransform: 'capitalize' }}>
                      {t(skill)}
                    </span>
                    <span className={s.badge}>
                      {
                        preview.activities.filter(
                          (a) => KIND_SKILL[a.kind] === skill
                        ).length
                      }{' '}
                      {t('activities')}{' '}
                    </span>
                  </div>
                ))}
                <p className={s.muted}>
                  {t(
                    'Guided practice moves through every activity. You can also choose a single skill. Audio is generated with your device’s English voice.'
                  )}{' '}
                </p>
                <div className={s.actions} style={{ marginTop: 20 }}>
                  <button
                    className={s.secondary}
                    onClick={() => {
                      stop();
                      setEditing(preview);
                      setPreview(null);
                    }}
                  >
                    {t('Edit lesson')}{' '}
                  </button>
                  <button
                    className={s.secondary}
                    onClick={() => exportLessons([preview])}
                  >
                    {t('Export JSON')}{' '}
                  </button>
                </div>
              </section>
            </div>
          </>
        ) : tab === 'lessons' ? (
          <>
            <section className={s.hero}>
              <div>
                <p className={s.eyebrow}>{t('Your space to learn English')}</p>
                <h1>
                  {t('Find your words.')} <br />
                  {t('Build your confidence.')}{' '}
                </h1>
                <p>
                  {t(
                    'Listen closely. Speak a little. Make mistakes, then try again. Turn everyday topics into your own English lessons.'
                  )}{' '}
                </p>
                <div className={s.actions} style={{ marginTop: 23 }}>
                  {lessons[0] && (
                    <button
                      className={s.primary}
                      onClick={() =>
                        startPractice(
                          lessons.find(
                            (l) => completed(l) < l.activities.length
                          ) || lessons[0]
                        )
                      }
                    >
                      {t('Let’s practice →')}{' '}
                    </button>
                  )}
                  <button className={s.secondary} onClick={newLesson}>
                    {t('Create a lesson')}{' '}
                  </button>
                </div>
              </div>
              <div className={s.heroAside}>
                <span className={s.eyebrow}>{t('Your learning notebook')}</span>
                <strong>
                  {totalComplete} / {totalActivities}
                </strong>
                <p>{t('activities at 80% or above')}</p>
                <div className={s.bar}>
                  <span
                    style={{
                      width: `${totalActivities ? (totalComplete / totalActivities) * 100 : 0}%`,
                    }}
                  />
                </div>
                <p>
                  {lessons.length} {t('lessons · 4 skills')}
                </p>
              </div>
            </section>
            <div className={s.sectionHead}>
              <div>
                <h2>{t('Your lesson library')}</h2>
                <p className={s.muted}>
                  {t('Make it personal. Learn it your way.')}
                </p>
              </div>
              <div className={s.actions}>
                <input
                  ref={input}
                  type="file"
                  accept=".xlsx,.xls,.json,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  hidden
                  onChange={(e) => {
                    void receiveFile(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
                <button
                  className={s.secondary}
                  disabled={pronunciationBusy}
                  onClick={() => input.current?.click()}
                >
                  <VscCloudUpload />
                  {t('Import lessons')}{' '}
                </button>
                <button
                  className={s.secondary}
                  disabled={pronunciationBusy || !lessons.length}
                  onClick={async () => {
                    setPronunciationBusy(true);
                    try {
                      const result = await preparePronunciations(lessons);
                      setPronunciationReport(result);
                      // Only merge pronunciation into current entries; preserve edits made while waiting.
                      const next = currentLessons.current.map((l) => ({
                        ...l,
                        vocabulary: l.vocabulary.map((v) => {
                          const match = result.lessons
                            .find((item) => item.id === l.id)
                            ?.vocabulary.find(
                              (item) =>
                                item.word === v.word &&
                                item.example === v.example
                            );
                          return match?.pronunciations
                            ? { ...v, pronunciations: match.pronunciations }
                            : v;
                        }),
                      }));
                      if (saveLessons(next))
                        setMessage(t('Pronunciations updated.'));
                    } finally {
                      setPronunciationBusy(false);
                    }
                  }}
                >
                  {t(
                    pronunciationBusy
                      ? 'Looking up pronunciations…'
                      : 'Update pronunciations'
                  )}
                </button>
                {/* <a
                  className={s.quiet}
                  href="/templates/english-lessons.xlsx"
                  download
                >
                  {t('Excel template')}
                </a> */}
                <button
                  className={s.secondary}
                  disabled={!lessons.length}
                  onClick={() => exportLessons(lessons)}
                >
                  <VscCloudDownload />
                  {t('Export all')}{' '}
                </button>
                <button className={s.primary} onClick={newLesson}>
                  <VscAdd />
                  {t('New lesson')}{' '}
                </button>
              </div>
            </div>
            {pronunciationBusy && (
              <div className={s.notice} role="status">
                {t('Looking up pronunciations…')}{' '}
                {pronunciationProgress?.completed || 0} /{' '}
                {pronunciationProgress?.total || 0}
                <button
                  className={s.quiet}
                  onClick={() => pronunciationController.current?.abort()}
                >
                  {t('Stop lookup and keep results')}
                </button>
              </div>
            )}
            {!pronunciationBusy && pronunciationReport && (
              <div className={s.notice} role="status">
                {t('Saved IPA')}: {pronunciationReport.found} ·{' '}
                {t('Needs context')}: {pronunciationReport.needsContext} ·{' '}
                {t('Not found')}: {pronunciationReport.notFound} ·{' '}
                {t('Not checked yet')}: {pronunciationReport.unchecked} ·{' '}
                {t('Phrases (audio only)')}: {pronunciationReport.unsupported}
                {pronunciationReport.unchecked > 0 && (
                  <p>
                    {t(
                      'Run Update pronunciations to resume unfinished lookups.'
                    )}
                  </p>
                )}
              </div>
            )}
            {imported && (
              <section className={s.notice} aria-label={t('Import preview')}>
                <strong>
                  {t('Ready to import')} {imported.length} {t('lessons')}
                </strong>
                <ul style={{ margin: '12px 0' }}>
                  {imported.map((l) => (
                    <li key={l.id}>
                      {l.title} · {l.activities.length} {t('activities')}{' '}
                      <label className={s.field}>
                        {t('Import action')}
                        <select
                          disabled={pronunciationBusy}
                          value={importTargets[l.id] || ''}
                          onChange={(e) =>
                            setImportTargets((current) => ({
                              ...current,
                              [l.id]: e.target.value,
                            }))
                          }
                        >
                          <option value="">{t('Add as new lesson')}</option>
                          {lessons.map((existing) => (
                            <option key={existing.id} value={existing.id}>
                              {t('Update existing:')} {existing.title} (
                              {t('Revision')} {existing.revision || 1})
                            </option>
                          ))}
                        </select>
                      </label>
                    </li>
                  ))}
                </ul>
                <p className={s.muted}>
                  {t(
                    'Review each import action. Updating preserves the lesson identity and progress for unchanged activities.'
                  )}{' '}
                </p>
                <div className={s.actions} style={{ marginTop: 14 }}>
                  <button
                    className={s.primary}
                    disabled={pronunciationBusy}
                    onClick={async () => {
                      setPronunciationBusy(true);
                      try {
                        const previous = currentLessons.current;
                        const next = applyLessonImport(
                          previous,
                          imported,
                          importTargets
                        );
                        if (!saveLessons(next)) return;
                        setImported(null);
                        setMessage(
                          t(
                            'Lessons imported. Preparing pronunciations in the background.'
                          )
                        );
                        const changed = next.filter(
                          (item) => !previous.includes(item)
                        );
                        const enriched = await preparePronunciations(changed);
                        setPronunciationReport(enriched);
                        const byId = new Map(
                          enriched.lessons.map((item) => [item.id, item])
                        );
                        const updated = currentLessons.current.map((lesson) => {
                          const ready = byId.get(lesson.id);
                          if (!ready) return lesson;
                          return {
                            ...lesson,
                            vocabulary: lesson.vocabulary.map((entry) => {
                              const match = ready.vocabulary.find(
                                (item) =>
                                  item.word === entry.word &&
                                  item.example === entry.example
                              );
                              return match?.pronunciations
                                ? {
                                    ...entry,
                                    pronunciations: match.pronunciations,
                                  }
                                : entry;
                            }),
                          };
                        });
                        if (saveLessons(updated))
                          setMessage(t('Import complete.'));
                      } catch (error) {
                        setError(
                          error instanceof Error
                            ? error.message
                            : 'Import failed.'
                        );
                      } finally {
                        setPronunciationBusy(false);
                      }
                    }}
                  >
                    {t(
                      pronunciationBusy
                        ? 'Looking up pronunciations…'
                        : 'Confirm import'
                    )}{' '}
                  </button>
                  <button
                    className={s.quiet}
                    disabled={pronunciationBusy}
                    onClick={() => setImported(null)}
                  >
                    {t('Cancel')}{' '}
                  </button>
                </div>
              </section>
            )}
            <label
              className={s.field}
              style={{ maxWidth: 360, marginBottom: 20 }}
            >
              {t('Find a lesson')}{' '}
              <input
                type="search"
                placeholder="Search a topic, title, or level…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <div className={s.grid}>
              {filtered.map((lesson, i) => (
                <article className={s.card} key={lesson.id}>
                  <div className={s.sectionHead} style={{ margin: 0 }}>
                    <span className={s.eyebrow}>
                      {t('LESSON')} {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className={s.badge}>
                      {lesson.level} · {lesson.topic}
                    </span>
                  </div>
                  <h3>{lesson.title}</h3>
                  <p className={s.muted}>{lesson.goal}</p>
                  <div className={s.skillDots}>
                    {SKILLS.filter((skill) =>
                      lesson.activities.some(
                        (a) => KIND_SKILL[a.kind] === skill
                      )
                    ).map((skill) => (
                      <span key={t(skill)}>{t(skill)}</span>
                    ))}
                  </div>
                  <div className={s.row}>
                    <span className={s.muted}>
                      {lesson.activities.length} {t('activities ·')}{' '}
                      {lesson.vocabulary.length} {t('words')}{' '}
                    </span>
                    <span className={s.muted}>
                      {completed(lesson)}/{lesson.activities.length}{' '}
                      {t('practiced at 80%+')}{' '}
                    </span>
                  </div>
                  <div className={s.bar}>
                    <span
                      style={{
                        width: `${(completed(lesson) / lesson.activities.length) * 100}%`,
                      }}
                    />
                  </div>
                  <div className={s.cardFooter}>
                    <div className={s.lessonMainActions}>
                      <button
                        className={s.primary}
                        onClick={() => startPractice(lesson)}
                      >
                        {t('Practice →')}{' '}
                      </button>
                      <button
                        className={s.secondary}
                        onClick={() => startTeach(lesson)}
                      >
                        {t('Teach together')}{' '}
                      </button>
                      <button
                        className={s.quiet}
                        onClick={() => {
                          setSharing(lesson);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        {t('Share ↗')}{' '}
                      </button>
                    </div>
                    <LessonActions title={lesson.title}>
                      <button
                        className={s.quiet}
                        onClick={() => setPreview(lesson)}
                      >
                        {t('Preview')}{' '}
                      </button>
                      <button
                        className={s.quiet}
                        onClick={() => setEditing(lesson)}
                      >
                        {t('Edit')}{' '}
                      </button>
                      <button
                        className={s.quiet}
                        onClick={() => {
                          const copy = {
                            ...lesson,
                            id: uid(),
                            title: `${lesson.title.slice(0, 110)} (copy)`,
                          };
                          if (lessons.length >= 100) {
                            setError('The library supports up to 100 lessons.');
                            return;
                          }
                          if (saveLessons([...lessons, copy]))
                            setMessage('Lesson duplicated.');
                        }}
                      >
                        {t('Duplicate')}{' '}
                      </button>
                      <div className={s.actionDivider} />{' '}
                      <button
                        className={s.deleteAction}
                        aria-label={`Delete ${lesson.title}`}
                        onClick={() => {
                          if (
                            window.confirm(
                              `Remove “${lesson.title}” from this browser? Export a copy first if you want to keep it.`
                            )
                          ) {
                            saveLessons(
                              lessons.filter((l) => l.id !== lesson.id)
                            );
                          }
                        }}
                      >
                        {t('Delete')}{' '}
                      </button>
                    </LessonActions>
                  </div>
                  {mistakes(lesson).length > 0 && (
                    <button
                      className={s.quiet}
                      onClick={() => startPractice(lesson, mistakes(lesson))}
                    >
                      {t('Review')} {mistakes(lesson).length} {t('mistakes')}{' '}
                    </button>
                  )}
                </article>
              ))}
            </div>
            {!filtered.length && (
              <div className={s.empty}>
                {lessons.length
                  ? t('No lessons match your search.')
                  : t(
                      'Your notebook is empty. Create a lesson or import an Excel or JSON file to begin.'
                    )}
              </div>
            )}
            <p className={s.muted} style={{ marginTop: 22 }}>
              {t(
                'Lessons and scores stay in this browser. Export JSON to back up or share lessons. Voice recordings are temporary and are not included in exports.'
              )}{' '}
            </p>
          </>
        ) : (
          <>
            <div className={s.sectionHead}>
              <div>
                <p className={s.eyebrow}>{t('Keep showing up')}</p>
                <h2>
                  {t('Progress for {name}, one skill at a time').replace(
                    '{name}',
                    activeLearner.name
                  )}
                </h2>
                <p className={s.muted}>
                  {t(
                    'Average word match from current lesson activities. These scores are not CEFR levels or pronunciation ratings.'
                  )}{' '}
                </p>
              </div>
              <button
                className={s.secondary}
                disabled={!attempts.length}
                onClick={() =>
                  download(
                    {
                      version: 1,
                      learner: {
                        id: activeLearner.id,
                        name: activeLearner.name,
                      },
                      attempts,
                    },
                    'english-progress.json'
                  )
                }
              >
                {t('Export progress')}{' '}
              </button>
            </div>
            <div className={s.stats}>
              {SKILLS.map((skill) => {
                const all = currentAttempts.filter((a) => a.skill === skill);
                const first = all.filter((a) => !a.assisted);
                return (
                  <div className={s.card} key={t(skill)}>
                    <p className={s.eyebrow}>{t(skill)}</p>
                    <p className={s.score} style={{ margin: '18px 0 8px' }}>
                      {all.length
                        ? `${Math.round(all.reduce((sum, a) => sum + a.score, 0) / all.length)}%`
                        : '—'}
                    </p>
                    <p className={s.muted}>
                      {all.length} {t('checked attempts')}
                    </p>
                    <p className={s.muted}>
                      {t('Without hints:')}{' '}
                      {first.length
                        ? `${Math.round(first.reduce((sum, a) => sum + a.score, 0) / first.length)}%`
                        : '—'}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className={s.sectionHead}>
              <h2>{t('Practice my mistakes')}</h2>
            </div>
            {lessons.some((l) => mistakes(l).length) ? (
              <div className={s.grid}>
                {lessons
                  .filter((l) => mistakes(l).length)
                  .map((l) => (
                    <div className={s.card} key={l.id}>
                      <h3>{l.title}</h3>
                      <p className={s.muted}>
                        {mistakes(l).length}{' '}
                        {t('activities below 80% on the most recent attempt.')}{' '}
                      </p>
                      <button
                        className={s.primary}
                        style={{ marginTop: 16 }}
                        onClick={() => startPractice(l, mistakes(l))}
                      >
                        {t('Practice these again →')}{' '}
                      </button>
                    </div>
                  ))}
              </div>
            ) : (
              <div className={s.empty}>
                {t(
                  'No mistakes waiting for review. Results below 80% will appear here.'
                )}{' '}
              </div>
            )}
            <div className={s.sectionHead}>
              <h2>{t('Recent practice')}</h2>
            </div>
            {attempts.length ? (
              <div className={s.card} style={{ overflowX: 'auto' }}>
                <table className={s.table}>
                  <thead>
                    <tr>
                      <th>{t('Lesson')}</th>
                      <th>{t('Skill')}</th>
                      <th>{t('Match')}</th>
                      <th>{t('Attempt')}</th>
                      <th>{t('When')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attempts
                      .slice(-15)
                      .reverse()
                      .map((a) => (
                        <tr key={a.id}>
                          <td>
                            {lessons.find((l) => l.id === a.lessonId)?.title ||
                              t('Removed lesson')}
                          </td>
                          <td style={{ textTransform: 'capitalize' }}>
                            {t(a.skill)}
                          </td>
                          <td>
                            {a.score}%{' '}
                            {!currentAttempts.some(
                              (current) => current.id === a.id
                            ) && (
                              <span className={s.badge}>
                                {t('Earlier version')}
                              </span>
                            )}
                          </td>
                          <td>
                            {a.assisted ? t('Hint / retry') : t('Unassisted')}
                          </td>
                          <td>{new Date(a.at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={s.empty}>
                {t(
                  'Complete your first activity to start your progress notebook.'
                )}{' '}
              </div>
            )}
          </>
        )}
      </div>
    </VoiceContext.Provider>
  );
}
