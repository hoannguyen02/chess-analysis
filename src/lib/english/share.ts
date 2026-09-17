import { Lesson, parseLessonPack } from './lessons';

const MAX_LINK = 16000;
const MAX_BYTES = 256000;

async function boundedBytes(
  stream: ReadableStream<Uint8Array>
): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > MAX_BYTES)
        throw new Error('This lesson is too large for a share link.');
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
  const result = new Uint8Array(size);
  let offset = 0;
  chunks.forEach((chunk) => {
    result.set(chunk, offset);
    offset += chunk.length;
  });
  return result;
}

/** A portable snapshot contains only the validated lesson, never browser profiles or results. */
export async function encodeSharedLesson(
  lesson: Lesson,
  shareId?: string
): Promise<string> {
  const { teacherNotes, ...learnerLesson } = lesson;
  void teacherNotes;
  const pack = parseLessonPack({ version: 2, lessons: [learnerLesson] });
  const bytes = new TextEncoder().encode(
    JSON.stringify({ ...pack, ...(shareId ? { shareId } : {}) })
  );
  if (bytes.length > MAX_BYTES)
    throw new Error(
      'This lesson is too large for a share link. Split it into smaller lessons.'
    );
  const compressed = await boundedBytes(
    new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'))
  );
  const token =
    'v1.' +
    btoa(Array.from(compressed, (byte) => String.fromCharCode(byte)).join(''))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  if (token.length > MAX_LINK)
    throw new Error(
      'This lesson is too large for a share link. Split it into smaller lessons.'
    );
  return token;
}

export async function decodeSharedSnapshot(
  token: string
): Promise<{ lesson: Lesson; shareId: string }> {
  if (token.length > MAX_LINK || !/^v1\.[A-Za-z0-9_-]+$/.test(token))
    throw new Error(
      'This lesson link is incomplete or unsupported. Ask your teacher for a new link.'
    );
  try {
    const encoded = token.slice(3).replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
    const plain = await boundedBytes(
      new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))
    );
    const raw = JSON.parse(
      new TextDecoder('utf-8', { fatal: true }).decode(plain)
    );
    const pack = parseLessonPack(raw);
    if (
      raw.shareId !== undefined &&
      (typeof raw.shareId !== 'string' ||
        !/^[a-zA-Z0-9_-]{1,100}$/.test(raw.shareId))
    )
      throw new Error('Invalid share ID');
    const digest = raw.shareId
      ? null
      : await crypto.subtle.digest(
          'SHA-256',
          new TextEncoder().encode(
            JSON.stringify(
              raw.version === 1
                ? {
                    version: 1,
                    lessons: pack.lessons.map((lesson, index) => {
                      const original = {
                        ...lesson,
                        goal: raw.lessons[index].goal.trim(),
                      };
                      if (raw.lessons[index].challenge === undefined)
                        delete original.challenge;
                      return original;
                    }),
                  }
                : pack
            )
          )
        );
    const shareId =
      raw.shareId ||
      'legacy-' +
        Array.from(new Uint8Array(digest!), (b) =>
          b.toString(16).padStart(2, '0')
        ).join('');
    if (pack.lessons.length !== 1) throw new Error('Expected one lesson');
    const { teacherNotes, ...learnerLesson } = pack.lessons[0];
    void teacherNotes;
    return { lesson: learnerLesson, shareId };
  } catch {
    throw new Error(
      'This lesson link could not be opened. It may be incomplete; ask your teacher to copy the full link again.'
    );
  }
}

export function sharedLessonUrl(origin: string, token: string): string {
  return new URL('/english-practice/learn', origin).href + '#lesson=' + token;
}

export async function decodeSharedLesson(token: string): Promise<Lesson> {
  return (await decodeSharedSnapshot(token)).lesson;
}

export function publisherShareId(lessonId: string): string {
  const key = 'lima-english-published-id-v1:' + lessonId;
  const saved = localStorage.getItem(key);
  if (saved && /^[a-zA-Z0-9_-]{1,100}$/.test(saved)) return saved;
  const id = crypto.randomUUID();
  localStorage.setItem(key, id);
  return id;
}
