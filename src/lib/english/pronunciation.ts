export type DictionaryPronunciation =
  | { status: 'found'; ipa: string; accent: 'UK' | 'US'; source: string }
  | { status: 'unavailable' | 'ambiguous' | 'error' };

export function dictionaryWord(value: string): string | null {
  const trimmed = value.trim().replace(/’/g, "'");
  // Letter names and proper calendar names are different dictionary entries.
  if (/^[A-Z]$/.test(trimmed)) return trimmed;
  if (
    /^(January|February|March|April|May|June|July|August|September|October|November|December|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/.test(
      trimmed
    )
  )
    return trimmed;
  const word = trimmed.toLowerCase();
  // Never manufacture phrase IPA by joining individual dictionary entries.
  return /^[a-z]+(?:[-'][a-z]+)*$/.test(word) && word.length <= 80
    ? word
    : null;
}

/** Only exact entries with explicitly UK-labelled audio qualify. Unknown accents
 * and conflicting transcriptions are deliberately withheld from learners.
 * Provider documentation: https://dictionaryapi.dev/
 */
export function selectDictionaryPronunciation(
  word: string,
  data: unknown,
  accent: 'UK' | 'US' = 'UK'
): DictionaryPronunciation {
  if (!Array.isArray(data) || !data.length) return { status: 'unavailable' };
  const entries = data.filter(
    (entry) =>
      entry &&
      typeof entry.word === 'string' &&
      dictionaryWord(entry.word) === word
  );
  if (!entries.length) return { status: 'unavailable' };
  const all = new Set<string>();
  for (const entry of entries) {
    const variants = new Set<string>();
    for (const phonetic of Array.isArray(entry.phonetics)
      ? entry.phonetics
      : []) {
      if (
        typeof phonetic?.text !== 'string' ||
        typeof phonetic.audio !== 'string'
      )
        continue;
      let url: URL;
      try {
        url = new URL(phonetic.audio, 'https://api.dictionaryapi.dev');
      } catch {
        continue;
      }
      if (
        url.protocol !== 'https:' ||
        !(
          accent === 'UK' ? /(?:-uk|_gb_\d+)\.mp3$/i : /(?:-us|_us_\d+)\.mp3$/i
        ).test(url.pathname)
      )
        continue;
      const text = phonetic.text.trim().replace(/^\/+|\/+$/g, '');
      if (!text || text.length > 120 || /[<>\r\n]/.test(text)) continue;
      variants.add(text);
      all.add(text);
    }
    // Another homograph entry without an identifiable UK pronunciation means
    // that the single result we found cannot safely represent every meaning.
    if (!variants.size) return { status: 'unavailable' };
  }
  if (all.size !== 1) return { status: 'ambiguous' };
  return {
    status: 'found',
    ipa: `/${[...all][0]}/`,
    accent,
    source: `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
  };
}

// Small reviewed offline set, checked against the linked dictionary entries.
// These are stored transcriptions, not model-generated fallback pronunciations.
const reviewedUK: Record<string, { ipa: string; usIpa?: string; source: string }> = {
  what: {
    ipa: '/wɒt/',
    usIpa: '/wɑːt/',
    source: 'https://dictionary.cambridge.org/pronunciation/english/what',
  },
  where: {
    ipa: '/weəʳ/',
    usIpa: '/wer/',
    source: 'https://dictionary.cambridge.org/us/dictionary/english/where',
  },
  when: {
    ipa: '/wen/',
    source: 'https://dictionary.cambridge.org/pronunciation/english/when',
  },
  why: {
    ipa: '/waɪ/',
    source: 'https://dictionary.cambridge.org/pronunciation/english/why',
  },
  listen: {
    ipa: '/ˈlɪs.ən/',
    source: 'https://dictionary.cambridge.org/pronunciation/english/listen',
  },
  hello: {
    ipa: '/heˈləʊ/',
    usIpa: '/heˈloʊ/',
    source: 'https://dictionary.cambridge.org/pronunciation/english/hello',
  },
  repeat: {
    ipa: '/rɪˈpiːt/',
    source: 'https://dictionary.cambridge.org/dictionary/english/repeat',
  },
};
export function reviewedPronunciation(
  value: string
): DictionaryPronunciation | null {
  const word = dictionaryWord(value);
  const entry =
    word && Object.prototype.hasOwnProperty.call(reviewedUK, word)
      ? reviewedUK[word]
      : null;
  return entry
    ? { status: 'found', accent: 'UK', ipa: entry.ipa, source: entry.source }
    : null;
}

export type PronunciationEntry = { ipa: string; source: string };
export type Pronunciations = Partial<
  Record<'UK' | 'US' | 'IPA', PronunciationEntry>
>;

/** Resolve each accent independently; one missing accent never hides the other. */
export function selectDictionaryPronunciations(
  word: string,
  data: unknown
): Pronunciations {
  const result: Pronunciations = {};
  for (const accent of ['UK', 'US'] as const) {
    const selected = selectDictionaryPronunciation(word, data, accent);
    if (selected.status === 'found')
      result[accent] = { ipa: selected.ipa, source: selected.source };
  }
  return result;
}

export function reviewedPronunciations(word: string): Pronunciations {
  const uk = reviewedPronunciation(word);
  if (uk?.status !== 'found') return {};
  return {
    UK: { ipa: uk.ipa, source: uk.source },
    US: {
      ipa: reviewedUK[dictionaryWord(word)!].usIpa ?? uk.ipa,
      source: uk.source,
    },
  };
}

export type LookupResult = {
  status: 'found' | 'not-found' | 'needs-context' | 'error';
  pronunciations: Pronunciations;
};
export const PRONUNCIATION_CACHE_VERSION = '2026-09-wiktionary-2';
export function validPronunciations(data: unknown): Pronunciations {
  const result: Pronunciations = {};
  if (!data || typeof data !== 'object') return result;
  for (const accent of ['UK', 'US', 'IPA'] as const) {
    const entry = (data as Record<string, PronunciationEntry>)[accent];
    if (
      typeof entry?.ipa !== 'string' ||
      entry.ipa.length > 120 ||
      !/^\/[^/<>\n]{1,116}\/(?: · \/[^/<>\n]{1,116}\/){0,2}$/u.test(
        entry.ipa
      ) ||
      typeof entry.source !== 'string' ||
      entry.source.length > 500
    )
      continue;
    try {
      const url = new URL(entry.source);
      if (url.protocol !== 'https:' || url.username || url.password) continue;
    } catch {
      continue;
    }
    result[accent] = { ipa: entry.ipa, source: entry.source };
  }
  return result;
}

/** Deliberately narrow context rule: an explicit classroom imperative, not a
 * guess from a title or Vietnamese meaning. Past/present narrative stays pending.
 * https://dictionary.cambridge.org/pronunciation/english/read
 */
export function contextPronunciations(
  word: string,
  example: string
): Pronunciations {
  if (
    dictionaryWord(word) === 'name' &&
    /\b(?:my|your|his|her|first|last|full) name\b/i.test(example || '')
  ) {
    const entry = {
      ipa: '/neɪm/',
      source: 'https://en.wiktionary.org/wiki/name#English',
    };
    return { UK: entry, US: entry };
  }
  if (
    dictionaryWord(word) !== 'read' ||
    !/^(?:please,?\s+)?read\s+(?:the|this|these|a|an|each|your)\s+[^.!?]+[.!?]?$/i.test(
      example.trim()
    )
  )
    return {};
  const entry = {
    ipa: '/riːd/',
    source: 'https://dictionary.cambridge.org/pronunciation/english/read',
  };
  return { UK: entry, US: entry };
}
