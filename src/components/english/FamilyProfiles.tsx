import { useLearnerText } from './LearnerLanguage';
import { VscAdd, VscEdit } from 'react-icons/vsc';
import { VoicePicker } from './VoiceSettings';
import { useState } from 'react';
import { FamilyNotebook } from '@/lib/english/family';
import { uid } from '@/lib/english/lessons';
import s from './EnglishStudio.module.css';

export default function FamilyProfiles({
  family,
  onChange,
}: {
  family: FamilyNotebook;
  onChange: (next: FamilyNotebook) => boolean;
}) {
  const t = useLearnerText();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [rename, setRename] = useState(false);
  const [error, setError] = useState('');
  const active = family.profiles.find((p) => p.id === family.activeProfileId)!;
  return (
    <section className={s.profilePanel} aria-label="Family profiles">
      <div className={s.preferencesRow}>
        <div className={s.learnerControls}>
          <label className={s.field}>
            <span>{t('Learner')}</span>
            <select
              aria-label={t('Practicing as')}
              value={active.id}
              onChange={(e) => {
                onChange({ ...family, activeProfileId: e.target.value });
                setOpen(false);
              }}
            >
              {family.profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className={s.preferenceIcon}
            aria-label={t('Add learner')}
            title={t('Add learner')}
            disabled={family.profiles.length >= 20}
            onClick={() => {
              setRename(false);
              setName('');
              setError('');
              setOpen(true);
            }}
          >
            <VscAdd size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={s.preferenceIcon}
            aria-label={t('Rename learner')}
            title={t('Rename learner')}
            onClick={() => {
              setRename(true);
              setName(active.name);
              setError('');
              setOpen(true);
            }}
          >
            <VscEdit size={17} aria-hidden="true" />
          </button>
        </div>
        <VoicePicker />
      </div>
      {open && (
        <form
          className={s.profileForm}
          onSubmit={(e) => {
            e.preventDefault();
            const clean = name.trim();
            if (!clean || clean.length > 40) {
              setError('Enter a name with 1–40 characters.');
              return;
            }
            if (
              family.profiles.some(
                (p) =>
                  p.id !== (rename ? active.id : '') &&
                  p.name.toLowerCase() === clean.toLowerCase()
              )
            ) {
              setError(
                'That name is already in your family. Choose a different name.'
              );
              return;
            }
            const id = rename ? active.id : uid();
            const profiles = rename
              ? family.profiles.map((p) =>
                  p.id === id ? { ...p, name: clean } : p
                )
              : [...family.profiles, { id, name: clean, attempts: [] }];
            if (onChange({ version: 1, profiles, activeProfileId: id }))
              setOpen(false);
          }}
        >
          <label className={s.field}>
            {rename ? t('Learner name') : t('New learner name')}
            <input
              autoFocus
              value={name}
              maxLength={40}
              required
              onChange={(e) => setName(e.target.value)}
              placeholder={t('First name or nickname')}
            />
          </label>
          <button type="submit" className={s.primary}>
            {rename ? t('Save name') : t('Add & switch')}
          </button>
          <button
            type="button"
            className={s.quiet}
            onClick={() => setOpen(false)}
          >
            {t('Cancel')}{' '}
          </button>
          {error && (
            <p role="alert" className={s.muted}>
              {t(error)}
            </p>
          )}
        </form>
      )}
    </section>
  );
}
