import { useEffect, useRef, useState } from 'react';
import { Lesson, NOTE_LABELS, parseLessonPack } from '@/lib/english/lessons';
import { enrichPronunciations } from '@/lib/english/enrich-pronunciations';
import { useLearnerText } from './LearnerLanguage';
import { useReadText } from './VoiceSettings';
import WordPronunciation from './WordPronunciation';
import LessonEditor from './LessonEditor';
import LessonNotes from './LessonNotes';
import { validPronunciations } from '@/lib/english/pronunciation';
import ShareLesson from './ShareLesson';
import s from './EnglishStudio.module.css';

export type EditTarget =
  | { word: number }
  | { activity: string }
  | { lesson: true }
  | { note: keyof typeof NOTE_LABELS };
export default function QuickLessonEdit({
  lesson,
  target,
  onSave,
  disabled = false,
}: {
  lesson: Lesson;
  target: EditTarget;
  disabled?: boolean;
  onSave: (lesson: Lesson) => boolean;
}) {
  const t = useLearnerText();
  const [draft, setDraft] = useState<Lesson | null>(null);
  const [previous, setPrevious] = useState<Lesson | null>(null);
  const [full, setFull] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const abort = useRef<AbortController | null>(null);
  const { read, stop, playing } = useReadText();
  const open = !!draft || sharing;
  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);
  useEffect(
    () => () => {
      abort.current?.abort();
    },
    []
  );
  const close = () => {
    abort.current?.abort();
    stop();
    setBusy(false);
    setDraft(null);
    setSharing(false);
    setFull(false);
  };
  const save = async (candidate: Lesson) => {
    setError('');
    setBusy(true);
    const controller = new AbortController();
    abort.current = controller;
    try {
      let next = parseLessonPack({ version: 2, lessons: [candidate] })
        .lessons[0];
      for (const word of next.vocabulary) {
        if (
          word.pronunciations &&
          Object.keys(validPronunciations(word.pronunciations)).length !==
            Object.keys(word.pronunciations).length
        )
          throw new Error(
            'Enter IPA between slashes and a valid HTTPS dictionary source.'
          );
      }
      // Only changed text needs a fresh lookup; never overwrite manually edited IPA.
      const changed = next.vocabulary.flatMap((word, index) => {
        const old = lesson.vocabulary[index];
        return (!old ||
          word.word !== old.word ||
          word.example !== old.example) &&
          !word.pronunciations
          ? [index]
          : [];
      });
      let missing = false;
      if (changed.length) {
        const result = await enrichPronunciations(
          [{ ...next, vocabulary: changed.map((i) => next.vocabulary[i]) }],
          { signal: controller.signal }
        );
        if (controller.signal.aborted) return;
        const vocabulary = [...next.vocabulary];
        changed.forEach((index, i) => {
          vocabulary[index] = result.lessons[0].vocabulary[i];
        });
        next = { ...next, vocabulary };
        missing = result.missing > 0;
      }
      if (controller.signal.aborted) return;
      if (!onSave(next)) {
        setError(
          'Could not save lessons. Browser storage may be full or disabled. Export your lessons before leaving.'
        );
        return;
      }
      setPrevious(lesson);
      setNotice(
        missing
          ? 'Saved. Some IPA needs review. Previous scores remain in history.'
          : 'Saved. Previous scores remain in history.'
      );
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Please check your lesson.');
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  };
  const noteKeys: (keyof typeof NOTE_LABELS)[] =
    'note' in target
      ? target.note === 'pronunciation'
        ? ['pronunciation', 'pronunciationModel']
        : [target.note]
      : [];
  const wordIndex = 'word' in target ? target.word : -1;
  const word = draft?.vocabulary[wordIndex];
  const activity =
    draft && 'activity' in target
      ? draft.activities.find((a) => a.id === target.activity)
      : undefined;
  const field = (
    label: string,
    value: string,
    change: (value: string) => void
  ) => (
    <label className={s.field}>
      {t(label)}
      <textarea
        value={value}
        onChange={(e) => change(e.target.value)}
        disabled={busy}
      />
    </label>
  );
  const updateWord = (key: 'word' | 'meaning' | 'example', value: string) => {
    if (!draft || !word) return;
    setDraft({
      ...draft,
      vocabulary: draft.vocabulary.map((entry, i) =>
        i === wordIndex
          ? {
              ...entry,
              [key]: value,
              ...(key !== 'meaning' ? { pronunciations: undefined } : {}),
            }
          : entry
      ),
    });
  };
  return (
    <>
      <div className={s.actions}>
        <button
          type="button"
          className={s.quiet}
          disabled={disabled}
          onClick={() => {
            stop();
            window.speechSynthesis?.cancel();
            setError('');
            setDraft(structuredClone(lesson));
          }}
        >
          ✎ {t('Quick edit')}
        </button>
        {previous && (
          <>
            <span role="status" className={s.muted}>
              {t(notice)}
            </span>
            <button
              type="button"
              className={s.quiet}
              onClick={() => {
                const restored = noteKeys.length
                  ? {
                      ...lesson,
                      notes: {
                        ...lesson.notes,
                        ...Object.fromEntries(
                          noteKeys.map((key) => [
                            key,
                            previous.notes?.[key] || '',
                          ])
                        ),
                      },
                    }
                  : previous;
                if (onSave(restored)) {
                  setPrevious(null);
                  setNotice('');
                }
              }}
            >
              {t('Undo')}
            </button>
            <button
              type="button"
              className={s.quiet}
              onClick={() => setSharing(true)}
            >
              {t('Copy updated share link')}
            </button>
          </>
        )}
      </div>
      <dialog
        ref={dialog}
        role="dialog"
        className={s.quickEditPanel}
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        aria-label={t('Quick edit')}
      >
        <div className={s.sectionHead}>
          <h2>{t(sharing ? 'Share lesson' : 'Quick edit')}</h2>
          <button type="button" className={s.quiet} onClick={close}>
            {t('Cancel')}
          </button>
        </div>
        {sharing ? (
          <ShareLesson lesson={lesson} onClose={close} />
        ) : (
          draft && (
            <>
              {error && (
                <p role="alert" className={s.notice}>
                  {t(error)}
                </p>
              )}
              {busy && <p role="status">{t('Checking pronunciation…')}</p>}
              {full ? (
                <fieldset disabled={busy}>
                  <LessonEditor
                    lesson={draft}
                    onCancel={close}
                    onSave={(value) => void save(value)}
                  />
                </fieldset>
              ) : (
                <>
                  {word ? (
                    <>
                      {field('Word or phrase', word.word, (v) =>
                        updateWord('word', v)
                      )}
                      {field('Meaning', word.meaning, (v) =>
                        updateWord('meaning', v)
                      )}
                      {field('Example', word.example, (v) =>
                        updateWord('example', v)
                      )}
                      <details>
                        <summary>{t('Edit IPA and sources')}</summary>
                        {(['UK', 'US', 'IPA'] as const).map((accent) => {
                          const entry = word.pronunciations?.[accent];
                          const update = (patch: {
                            ipa?: string;
                            source?: string;
                          }) => {
                            const pronunciations = {
                              ...word.pronunciations,
                              [accent]: {
                                ipa: entry?.ipa || '',
                                source: entry?.source || '',
                                ...patch,
                              },
                            };
                            if (
                              !pronunciations[accent]?.ipa &&
                              !pronunciations[accent]?.source
                            )
                              delete pronunciations[accent];
                            setDraft({
                              ...draft,
                              vocabulary: draft.vocabulary.map((w, i) =>
                                i === wordIndex
                                  ? {
                                      ...w,
                                      pronunciations: Object.keys(
                                        pronunciations
                                      ).length
                                        ? pronunciations
                                        : undefined,
                                    }
                                  : w
                              ),
                            });
                          };
                          return (
                            <div key={accent}>
                              {field(`${accent} IPA`, entry?.ipa || '', (ipa) =>
                                update({ ipa })
                              )}
                              {field(
                                `${accent} source URL`,
                                entry?.source || '',
                                (source) => update({ source })
                              )}
                            </div>
                          );
                        })}
                      </details>
                      <p className={s.muted}>
                        {t(
                          'Changing the word or example clears old IPA. Saving checks for a new pronunciation; you can also enter verified IPA and its source.'
                        )}
                      </p>
                    </>
                  ) : activity ? (
                    <>
                      {(['prompt', 'text', 'explanation'] as const).map((key) =>
                        field(
                          key === 'prompt'
                            ? 'Instructions'
                            : key === 'text'
                              ? 'Model text'
                              : 'Explanation',
                          activity[key],
                          (value) =>
                            setDraft({
                              ...draft,
                              activities: draft.activities.map((a) =>
                                a.id === activity.id
                                  ? { ...a, [key]: value }
                                  : a
                              ),
                            })
                        )
                      )}
                      {field(
                        'Accepted answers (one per line)',
                        activity.answers.join('\n'),
                        (value) =>
                          setDraft({
                            ...draft,
                            activities: draft.activities.map((a) =>
                              a.id === activity.id
                                ? { ...a, answers: value.split('\n') }
                                : a
                            ),
                          })
                      )}
                    </>
                  ) : noteKeys.length ? (
                    <>
                      {noteKeys.map((key) => (
                        <div key={key}>
                          {field(
                            NOTE_LABELS[key],
                            draft.notes?.[key] || '',
                            (value) =>
                              setDraft({
                                ...draft,
                                notes: { ...draft.notes, [key]: value },
                              })
                          )}
                        </div>
                      ))}
                    </>
                  ) : (
                    <>
                      {field('Title', draft.title, (title) =>
                        setDraft({ ...draft, title })
                      )}
                      {field('Learning goal', draft.goal, (goal) =>
                        setDraft({ ...draft, goal })
                      )}
                      {Object.entries(NOTE_LABELS).map(([key, label]) =>
                        field(
                          label,
                          draft.notes?.[key as keyof typeof NOTE_LABELS] || '',
                          (value) =>
                            setDraft({
                              ...draft,
                              notes: { ...draft.notes, [key]: value },
                            })
                        )
                      )}
                      {field(
                        'Teacher notes',
                        draft.teacherNotes || '',
                        (teacherNotes) => setDraft({ ...draft, teacherNotes })
                      )}
                    </>
                  )}
                  <section
                    className={s.quickEditPreview}
                    aria-label={t('Preview')}
                  >
                    <h3>{t('Preview')}</h3>
                    {word ? (
                      <>
                        <WordPronunciation
                          word={word.word}
                          pronunciations={word.pronunciations}
                        />
                        <p>{word.example}</p>
                        <p>{word.meaning}</p>
                      </>
                    ) : activity ? (
                      <>
                        <h3>{activity.prompt}</h3>
                        <p>{activity.text}</p>
                        <p>{activity.answers.join(' / ')}</p>
                        <p>{activity.explanation}</p>
                      </>
                    ) : noteKeys.length ? (
                      <LessonNotes
                        expand
                        lesson={{
                          ...draft,
                          reviewLesson: undefined,
                          notes: Object.fromEntries(
                            noteKeys.map((key) => [
                              key,
                              draft.notes?.[key] || '',
                            ])
                          ),
                        }}
                      />
                    ) : (
                      <>
                        <h3>{draft.title}</h3>
                        <p>{draft.goal}</p>
                        <LessonNotes lesson={draft} />
                      </>
                    )}
                    {!noteKeys.length && (
                      <button
                        type="button"
                        className={s.secondary}
                        onClick={() =>
                          playing
                            ? stop()
                            : read(
                                word
                                  ? word.example || word.word
                                  : activity
                                    ? activity.text || activity.answers[0]
                                    : draft.title
                              )
                        }
                      >
                        {t(playing ? 'Stop' : 'Play model')}
                      </button>
                    )}
                  </section>
                  <div className={s.actions}>
                    <button
                      type="button"
                      className={s.primary}
                      disabled={busy}
                      onClick={() => void save(draft)}
                    >
                      {t('Save & continue')}
                    </button>
                    <button
                      type="button"
                      className={s.quiet}
                      disabled={busy}
                      onClick={() => {
                        stop();
                        setFull(true);
                      }}
                    >
                      {t('Open full lesson editor')}
                    </button>
                  </div>
                </>
              )}
            </>
          )
        )}
      </dialog>
    </>
  );
}
