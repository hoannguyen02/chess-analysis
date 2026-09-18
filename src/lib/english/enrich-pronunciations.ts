import type { Lesson } from './lessons';
import {
  dictionaryWord,
  contextPronunciations,
  reviewedPronunciations,
  validPronunciations,
  Pronunciations,
  LookupResult,
  PRONUNCIATION_CACHE_VERSION,
} from './pronunciation';

const KEY = `lima-pronunciations-${PRONUNCIATION_CACHE_VERSION}`;
type Cached = { expires: number; result: LookupResult };
export type PronunciationProgress = { completed: number; total: number };
export type PronunciationReport = {
  found: number;
  missing: number;
  needsContext: number;
  notFound: number;
  unchecked: number;
  unsupported: number;
};
export async function enrichPronunciations(
  lessons: Lesson[],
  options: {
    signal?: AbortSignal;
    onProgress?: (progress: PronunciationProgress) => void;
  } = {}
) {
  const words = [
    ...new Set(
      lessons
        .flatMap((l) => l.vocabulary.map((v) => dictionaryWord(v.word)))
        .filter((v): v is string => !!v)
    ),
  ];
  const results = new Map<string, LookupResult>();
  const cache: Record<string, Cached> = Object.create(null);
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    for (const [word, item] of Object.entries(raw).slice(-2000)) {
      const saved = item as Cached;
      if (
        dictionaryWord(word) === word &&
        saved?.expires > Date.now() &&
        ['found', 'not-found', 'needs-context'].includes(saved.result?.status)
      )
        cache[word] = {
          expires: saved.expires,
          result: {
            status: saved.result.status,
            pronunciations: validPronunciations(saved.result.pronunciations),
          },
        };
    }
  } catch {
    /* Private mode or full storage does not prevent import. */
  }
  function persist() {
    const entries = Object.entries(cache).slice(-2000);
    try {
      localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(entries)));
    } catch {}
  }
  for (const [word, item] of Object.entries(cache)) {
    if (
      item.result.status === 'found' &&
      !Object.keys(item.result.pronunciations).length
    )
      delete cache[word];
  }
  const savedWords = new Map<string, Pronunciations>();
  for (const lesson of lessons)
    for (const entry of lesson.vocabulary) {
      const key = dictionaryWord(entry.word);
      if (key)
        savedWords.set(key, {
          ...savedWords.get(key),
          ...validPronunciations(entry.pronunciations),
        });
    }
  const queue: string[] = [];
  for (const word of words) {
    const local = reviewedPronunciations(word);
    const saved = savedWords.get(word);
    if (Object.keys(local).length)
      results.set(word, { status: 'found', pronunciations: local });
    else if (
      saved?.UK &&
      saved?.US &&
      ![saved.UK.source, saved.US.source].some((source) =>
        source.includes('en.wiktionary.org')
      ) &&
      ![
        'read',
        'name',
        'lead',
        'wind',
        'bow',
        'tear',
        'live',
        'close',
        'record',
        'present',
        'object',
      ].includes(word)
    )
      results.set(word, { status: 'found', pronunciations: saved });
    else if (cache[word]) results.set(word, cache[word].result);
    else queue.push(word);
  }
  const progress = () =>
    options.onProgress?.({ completed: results.size, total: words.length });
  progress();
  for (
    let offset = 0;
    offset < queue.length && !options.signal?.aborted;
    offset += 16
  ) {
    const batch = queue.slice(offset, offset + 16);
    const controller = new AbortController();
    const cancel = () => controller.abort();
    options.signal?.addEventListener('abort', cancel, { once: true });
    const timer = setTimeout(cancel, 20000);
    let failures = 0;
    try {
      const response = await fetch('/api/english/pronunciation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words: batch }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error('Lookup failed');
      const data = await response.json();
      for (const word of batch) {
        const raw = data.results?.[word];
        if (
          !raw ||
          !['found', 'not-found', 'needs-context'].includes(raw.status)
        ) {
          failures++;
          continue;
        }
        const result: LookupResult = {
          status: raw.status,
          pronunciations: validPronunciations(raw.pronunciations),
        };
        if (
          result.status === 'found' &&
          !Object.keys(result.pronunciations).length
        ) {
          failures++;
          continue;
        }
        results.set(word, result);
        cache[word] = {
          expires: Date.now() + (result.status === 'found' ? 30 : 1) * 86400000,
          result,
        };
      }
      persist();
      progress();
    } catch {
      failures = batch.length;
    } finally {
      clearTimeout(timer);
      options.signal?.removeEventListener('abort', cancel);
    }
    // Stop quickly on a service outage; successes have already been cached.
    // The next update retries only unfinished entries, never caches failures.
    if (failures === batch.length) break;
  }
  const report: PronunciationReport = {
    found: 0,
    missing: 0,
    needsContext: 0,
    notFound: 0,
    unchecked: 0,
    unsupported: 0,
  };
  const enriched = lessons.map((l) => ({
    ...l,
    vocabulary: l.vocabulary.map((v) => {
      const word = dictionaryWord(v.word);
      const lookup = word ? results.get(word) : undefined;
      const pronunciations = {
        ...validPronunciations(v.pronunciations),
        ...lookup?.pronunciations,
        ...contextPronunciations(v.word, v.example),
      };
      if (Object.keys(pronunciations).length) {
        report.found++;
        return { ...v, pronunciations };
      }
      report.missing++;
      if (!word) report.unsupported++;
      else if (!lookup) report.unchecked++;
      else if (lookup.status === 'needs-context') report.needsContext++;
      else report.notFound++;
      return v;
    }),
  }));
  return { lessons: enriched, ...report };
}
