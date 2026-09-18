import type { NextApiRequest, NextApiResponse } from 'next';
import {
  dictionaryWord,
  reviewedPronunciations,
  LookupResult,
} from '@/lib/english/pronunciation';
import { parseWiktionary } from '@/lib/english/wiktionary-pronunciation';

const cache = new Map<string, { expires: number; result: LookupResult }>();
const pending = new Map<string, Promise<LookupResult>>();
let active = 0;
async function dictionaryHtml(response: Response) {
  // Bound memory before building a DOM for a multilingual dictionary page.
  if (!response.body) throw new Error('Empty dictionary response');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let html = '';
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 2_000_000) {
        await reader.cancel();
        throw new Error('Dictionary page too large');
      }
      html += decoder.decode(value, { stream: true });
    }
    return html + decoder.decode();
  } finally {
    reader.releaseLock();
  }
}

async function lookup(word: string): Promise<LookupResult> {
  const reviewed = reviewedPronunciations(word);
  if (Object.keys(reviewed).length)
    return { status: 'found', pronunciations: reviewed };
  const saved = cache.get(word);
  if (saved && saved.expires > Date.now()) return saved.result;
  const running = pending.get(word);
  if (running) return running;
  if (active >= 8) return { status: 'error', pronunciations: {} };
  const request = (async (): Promise<LookupResult> => {
    active++;
    try {
      const response = await fetch(
        `https://en.wiktionary.org/w/rest.php/v1/page/${encodeURIComponent(word)}/html`,
        {
          signal: AbortSignal.timeout(4000),
          headers: { 'User-Agent': 'LIMA-English/1.0 (https://limachess.com)' },
        }
      );
      if (response.status !== 404 && !response.ok)
        throw new Error('Dictionary unavailable');
      const result: LookupResult =
        response.status === 404
          ? { status: 'not-found', pronunciations: {} }
          : parseWiktionary(word, await dictionaryHtml(response));
      if (cache.size >= 2000) cache.delete(cache.keys().next().value!);
      cache.set(word, { expires: Date.now() + 86400000, result });
      return result;
    } catch {
      return { status: 'error', pronunciations: {} };
    } finally {
      active--;
      pending.delete(word);
    }
  })();
  pending.set(word, request);
  return request;
}
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', 'POST, GET');
    return res.status(405).end();
  }
  const raw = req.method === 'GET' ? [req.query.word] : req.body?.words;
  if (
    !Array.isArray(raw) ||
    !raw.length ||
    raw.length > 16 ||
    raw.some((w) => typeof w !== 'string' || !dictionaryWord(w))
  )
    return res.status(400).json({ error: 'Provide 1–16 vocabulary words.' });
  const words = [...new Set(raw.map((w) => dictionaryWord(w)!))];
  const results: Record<string, LookupResult> = Object.create(null);
  let index = 0;
  await Promise.all(
    Array.from({ length: Math.min(4, words.length) }, async () => {
      while (index < words.length) {
        const word = words[index++];
        results[word] = await lookup(word);
      }
    })
  );
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ results });
}
export const config = { api: { bodyParser: { sizeLimit: '8kb' } } };
