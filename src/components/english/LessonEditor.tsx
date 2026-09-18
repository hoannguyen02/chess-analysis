import { useLearnerText } from './LearnerLanguage';
import { useEffect, useState } from 'react';
import {
  Activity,
  KINDS,
  KIND_SKILL,
  Lesson,
  NOTE_LABELS,
  parseLessonPack,
  uid,
} from '@/lib/english/lessons';
import { encodeSharedLesson, publisherShareId } from '@/lib/english/share';
import s from './EnglishStudio.module.css';

export const kindLabels: Record<Activity['kind'], string> = {
  dictation: 'Listen & type',
  repeat: 'Listen & repeat',
  'word-order': 'Sentence builder',
  'gap-fill': 'Vocabulary gap',
  correction: 'Grammar repair',
  comprehension: 'Read & understand',
  'read-aloud': 'Read aloud',
};
export default function LessonEditor({
  lesson,
  lessons = [],
  onSave,
  onCancel,
}: {
  lesson: Lesson;
  lessons?: Lesson[];
  onSave: (lesson: Lesson) => void;
  onCancel: () => void;
}) {
  const t = useLearnerText();
  const [draft, setDraft] = useState<Lesson>(() =>
    JSON.parse(JSON.stringify(lesson))
  );
  const [error, setError] = useState('');
  const [preparingReview, setPreparingReview] = useState(false);
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (!dirty) return;
    const preventExit = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', preventExit);
    return () => window.removeEventListener('beforeunload', preventExit);
  }, [dirty]);
  const update = (patch: Partial<Lesson>) => {
    setDirty(true);
    setDraft((current) => ({ ...current, ...patch }));
  };
  const editActivity = (id: string, patch: Partial<Activity>) =>
    update({
      activities: draft.activities.map((a) =>
        a.id === id ? { ...a, ...patch } : a
      ),
    });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (preparingReview) return;
        try {
          onSave(parseLessonPack({ version: 2, lessons: [draft] }).lessons[0]);
        } catch (e) {
          setError(
            e instanceof Error ? e.message : 'Please check your lesson.'
          );
        }
      }}
    >
      <div className={s.sectionHead}>
        <div>
          <p className={s.eyebrow}>{t('Lesson workshop')}</p>
          <h2>{t('Make it your own')}</h2>
          <p className={s.muted}>
            {t(
              'Write prompts, add answers, and build a lesson around your day.'
            )}{' '}
          </p>
        </div>
        <div className={s.actions}>
          <button
            className={s.secondary}
            type="button"
            onClick={() => {
              if (!dirty || window.confirm('Discard unsaved lesson changes?'))
                onCancel();
            }}
          >
            {t('Cancel')}{' '}
          </button>
          <button
            className={s.primary}
            type="submit"
            disabled={preparingReview}
          >
            {t('Save lesson')}{' '}
          </button>
        </div>
      </div>
      {error && (
        <p role="alert" className={`${s.notice} ${s.error}`}>
          {t(error)}
        </p>
      )}
      <section className={s.card} aria-label={t('Lesson details')}>
        <div className={s.formGrid}>
          <label className={s.field}>
            {t('Lesson title')}{' '}
            <input
              required
              maxLength={120}
              value={draft.title}
              onChange={(e) => update({ title: e.target.value })}
            />
          </label>
          <label className={s.field}>
            {t('Topic')}{' '}
            <input
              required
              maxLength={120}
              value={draft.topic}
              onChange={(e) => update({ topic: e.target.value })}
            />
          </label>
          <label className={s.field}>
            {t('Level')}{' '}
            <select
              value={draft.level}
              onChange={(e) => update({ level: e.target.value })}
            >
              {Array.from(
                new Set(['A1', 'A2', 'B1', 'B2', 'C1', 'C2', draft.level])
              ).map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </label>
          <label className={s.field}>
            {t('Learning goal')}{' '}
            <input
              required
              maxLength={500}
              value={draft.goal}
              onChange={(e) => update({ goal: e.target.value })}
            />
          </label>
        </div>
      </section>
      <section className={s.card}>
        <div className={s.formGrid}>
          <label className={s.field}>
            {t('Teacher notes')}
            <textarea
              rows={4}
              maxLength={4000}
              value={draft.teacherNotes || ''}
              onChange={(e) => update({ teacherNotes: e.target.value })}
            />
          </label>
          <label className={s.field}>
            {t('Personal challenge (unscored)')}
            <textarea
              rows={4}
              maxLength={4000}
              value={draft.challenge || ''}
              onChange={(e) => update({ challenge: e.target.value })}
            />
          </label>
        </div>
        <p className={s.muted}>
          {t(
            'Teacher notes are for lesson planning. Shared lessons include the challenge, but omit teacher notes.'
          )}
        </p>
      </section>
      <section className={s.lessonNotes}>
        <h3>{t('Before you start')}</h3>
        <div className={s.formGrid}>
          {(['beforeYouStart', 'quickCheck'] as const).map((key) => (
            <label className={s.field} key={key}>
              {t(NOTE_LABELS[key])}
              <textarea
                rows={3}
                maxLength={4000}
                value={draft.notes?.[key] || ''}
                onChange={(e) =>
                  update({ notes: { ...draft.notes, [key]: e.target.value } })
                }
              />
            </label>
          ))}
          <label className={s.field}>
            {t('Optional review lesson')}
            <select
              value=""
              disabled={preparingReview}
              onChange={async (e) => {
                const selected = lessons.find(
                  (item) => item.id === e.target.value
                );
                if (!selected) return;
                setPreparingReview(true);
                setError('');
                try {
                  const { reviewLesson: omitted, ...snapshot } = selected;
                  void omitted;
                  const token = await encodeSharedLesson(
                    snapshot,
                    publisherShareId(selected.id)
                  );
                  update({ reviewLesson: { title: selected.title, token } });
                } catch (error) {
                  setError(
                    error instanceof Error
                      ? error.message
                      : 'Could not create this link.'
                  );
                } finally {
                  setPreparingReview(false);
                }
              }}
            >
              <option value="">
                {t(
                  preparingReview
                    ? 'Preparing lesson link…'
                    : 'Choose a lesson to review'
                )}
              </option>
              {lessons
                .filter((item) => item.id !== draft.id)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
            </select>
          </label>
        </div>
        {draft.reviewLesson && (
          <p>
            {t('Review lesson')}: {draft.reviewLesson.title}{' '}
            <button
              className={s.quiet}
              type="button"
              disabled={preparingReview}
              onClick={() => update({ reviewLesson: undefined })}
            >
              {t('Remove review link')}
            </button>
          </p>
        )}
        <p className={s.muted}>
          {t(
            'Optional preparation, not a test. Review links save a snapshot; select the lesson again after updating its content.'
          )}
        </p>
      </section>
      <details className={s.lessonNotes}>
        <summary>{t('Lesson notes (optional)')}</summary>
        <p className={s.muted}>
          {t('Add explanations and examples. Leave unused sections empty.')}
        </p>
        <div className={s.formGrid}>
          {(Object.keys(NOTE_LABELS) as (keyof typeof NOTE_LABELS)[])
            .filter((key) => key !== 'beforeYouStart' && key !== 'quickCheck')
            .map((key) => (
              <label className={s.field} key={key}>
                {t(NOTE_LABELS[key])}
                <textarea
                  rows={5}
                  maxLength={4000}
                  value={draft.notes?.[key] || ''}
                  onChange={(e) =>
                    update({ notes: { ...draft.notes, [key]: e.target.value } })
                  }
                />
              </label>
            ))}
        </div>
      </details>
      <div className={s.sectionHead}>
        <h2>{t('Vocabulary')}</h2>
        <button
          type="button"
          disabled={draft.vocabulary.length >= 100}
          className={s.secondary}
          onClick={() =>
            update({
              vocabulary: [
                ...draft.vocabulary,
                { word: '', meaning: '', example: '' },
              ],
            })
          }
        >
          {t('+ Add word')}{' '}
        </button>
      </div>
      <section className={s.card}>
        {!draft.vocabulary.length && (
          <p className={s.muted}>
            {t(
              'Optional: add words and Vietnamese meanings to study before practice.'
            )}{' '}
          </p>
        )}
        {draft.vocabulary.map((v, i) => (
          <div className={s.vocabRow} key={i}>
            {(['word', 'meaning', 'example'] as const).map((key) => (
              <label className={s.field} key={key}>
                {key === 'word'
                  ? t('Word')
                  : key === 'meaning'
                    ? t('Meaning / Vietnamese')
                    : t('Example')}
                <input
                  required={key !== 'example'}
                  maxLength={
                    key === 'word' ? 100 : key === 'meaning' ? 300 : 500
                  }
                  value={v[key]}
                  onChange={(e) =>
                    update({
                      vocabulary: draft.vocabulary.map((entry, index) =>
                        index === i
                          ? {
                              ...entry,
                              [key]: e.target.value,
                              ...(key === 'word' || key === 'example'
                                ? { pronunciations: undefined }
                                : {}),
                            }
                          : entry
                      ),
                    })
                  }
                />
              </label>
            ))}
            <button
              className={s.quiet}
              type="button"
              aria-label={`Remove word ${i + 1}`}
              onClick={() =>
                update({
                  vocabulary: draft.vocabulary.filter(
                    (_, index) => index !== i
                  ),
                })
              }
            >
              {t('Remove')}{' '}
            </button>
          </div>
        ))}
      </section>
      <div className={s.sectionHead}>
        <div>
          <h2>{t('Activities')}</h2>
          <p className={s.muted}>
            {t(
              'Audio uses the source text. Add alternate valid answers on separate lines.'
            )}{' '}
          </p>
        </div>
        <button
          type="button"
          className={s.secondary}
          disabled={draft.activities.length >= 100}
          onClick={() =>
            update({
              activities: [
                ...draft.activities,
                {
                  id: uid(),
                  kind: 'dictation',
                  prompt: 'Listen, then write what you hear.',
                  text: '',
                  answers: [''],
                  explanation: '',
                },
              ],
            })
          }
        >
          {t('+ Add activity')}{' '}
        </button>
      </div>
      {draft.activities.map((a, i) => (
        <details key={a.id} className={s.activityEditor} open>
          <summary>
            {i + 1}. {kindLabels[a.kind]}{' '}
            <span className={s.badge}>{KIND_SKILL[a.kind]}</span>
          </summary>
          <div className={s.formGrid}>
            <label className={s.field}>
              {t('Activity type')}{' '}
              <select
                value={a.kind}
                onChange={(e) =>
                  editActivity(a.id, {
                    kind: e.target.value as Activity['kind'],
                  })
                }
              >
                {KINDS.map((k) => (
                  <option value={k} key={k}>
                    {t(kindLabels[k])}
                  </option>
                ))}
              </select>
            </label>
            <label className={s.field}>
              {t('Practice section')}
              <select
                value={a.tier || 'core'}
                onChange={(e) =>
                  editActivity(a.id, {
                    tier: e.target.value as 'core' | 'extra',
                  })
                }
              >
                <option value="core">{t('Core practice')}</option>
                <option value="extra">{t('Extra practice')}</option>
              </select>
            </label>
            <label className={s.field}>
              {t('Instructions / question')}{' '}
              <input
                required
                maxLength={1000}
                value={a.prompt}
                onChange={(e) => editActivity(a.id, { prompt: e.target.value })}
              />
            </label>
            <label className={s.field}>
              {t('Source text / reading passage')}{' '}
              <textarea
                maxLength={4000}
                value={a.text}
                onChange={(e) => editActivity(a.id, { text: e.target.value })}
              />
              <span className={s.muted}>
                {t('Required for listening, speaking, and reading.')}{' '}
              </span>
            </label>
            <label className={s.field}>
              {t('Accepted answers (one per line)')}{' '}
              <textarea
                required
                maxLength={20000}
                value={a.answers.join('\n')}
                onChange={(e) =>
                  editActivity(a.id, { answers: e.target.value.split('\n') })
                }
              />
              <span className={s.muted}>
                {t(
                  'Use the complete sentence for dictation and read-aloud. A gap needs only the missing word.'
                )}{' '}
              </span>
            </label>
          </div>
          <label className={s.field}>
            {t('Explanation after checking')}{' '}
            <textarea
              maxLength={1000}
              value={a.explanation}
              onChange={(e) =>
                editActivity(a.id, { explanation: e.target.value })
              }
            />
          </label>
          <div className={s.actions} style={{ marginTop: 12 }}>
            <button
              className={s.secondary}
              type="button"
              disabled={i === 0}
              onClick={() => {
                const list = [...draft.activities];
                [list[i - 1], list[i]] = [list[i], list[i - 1]];
                update({ activities: list });
              }}
            >
              {t('Move up')}{' '}
            </button>
            <button
              className={s.quiet}
              type="button"
              onClick={() =>
                update({
                  activities: draft.activities.filter(
                    (entry) => entry.id !== a.id
                  ),
                })
              }
            >
              {t('Remove activity')}{' '}
            </button>
          </div>
        </details>
      ))}
      <div className={s.actions} style={{ marginTop: 20 }}>
        <button className={s.primary} type="submit" disabled={preparingReview}>
          {t('Save lesson')}{' '}
        </button>
        <span className={s.muted}>
          {t(
            'Saved on this device. Export a JSON backup to keep a portable copy.'
          )}{' '}
        </span>
      </div>
    </form>
  );
}
