import { Attempt, validAttempts } from './lessons';

export type LearnerProfile = {
  id: string;
  name: string;
  attempts: Attempt[];
  voice?: string;
};
export type FamilyNotebook = {
  version: 1;
  activeProfileId: string;
  profiles: LearnerProfile[];
};
export const FAMILY_KEY = 'lima-english-family-v1';

export function initialFamily(legacyAttempts: unknown): FamilyNotebook {
  return {
    version: 1,
    activeProfileId: 'me',
    profiles: [
      { id: 'me', name: 'Me', attempts: validAttempts(legacyAttempts) },
    ],
  };
}

export function parseFamily(value: unknown): FamilyNotebook {
  if (!value || typeof value !== 'object')
    throw new Error('Invalid family notebook.');
  const raw = value as Partial<FamilyNotebook>;
  if (
    raw.version !== 1 ||
    !Array.isArray(raw.profiles) ||
    !raw.profiles.length ||
    raw.profiles.length > 20
  )
    throw new Error('Invalid family profiles.');
  const ids = new Set<string>();
  const profiles = raw.profiles.map((profile) => {
    if (
      !profile ||
      typeof profile.id !== 'string' ||
      !profile.id.trim() ||
      profile.id.length > 100 ||
      ids.has(profile.id) ||
      typeof profile.name !== 'string' ||
      !profile.name.trim() ||
      profile.name.length > 40 ||
      !Array.isArray(profile.attempts)
    )
      throw new Error('Invalid learner profile.');
    ids.add(profile.id);
    return {
      id: profile.id,
      name: profile.name.trim(),
      attempts: validAttempts(profile.attempts),
      ...(typeof profile.voice === 'string' && profile.voice.length <= 2000
        ? { voice: profile.voice }
        : {}),
    };
  });
  return {
    version: 1,
    activeProfileId: profiles.some((p) => p.id === raw.activeProfileId)
      ? raw.activeProfileId!
      : profiles[0].id,
    profiles,
  };
}

export function recordForLearner(
  family: FamilyNotebook,
  profileId: string,
  attempt: Attempt
): FamilyNotebook {
  if (!family.profiles.some((p) => p.id === profileId))
    throw new Error('Learner profile no longer exists.');
  return {
    ...family,
    profiles: family.profiles.map((p) =>
      p.id === profileId
        ? { ...p, attempts: [...p.attempts, attempt].slice(-2000) }
        : p
    ),
  };
}
