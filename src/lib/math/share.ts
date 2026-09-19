import {
  learnerCopy,
  MathLessonData,
  packLessons,
  parseMathPack,
} from './lessons';
const MAX_LINK = 16000,
  MAX_BYTES = 256000;
async function boundedBytes(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader(),
    chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > MAX_BYTES)
        throw new Error('Bài quá lớn để chia sẻ bằng liên kết.');
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  chunks.forEach((chunk) => {
    bytes.set(chunk, offset);
    offset += chunk.length;
  });
  return bytes;
}
export async function encodeMathLesson(lesson: MathLessonData) {
  const pack = parseMathPack(packLessons([learnerCopy(lesson)]));
  const bytes = new TextEncoder().encode(JSON.stringify(pack));
  if (bytes.length > MAX_BYTES)
    throw new Error('Bài quá lớn. Hãy tách thành các bài ngắn hơn.');
  const compressed = await boundedBytes(
    new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'))
  );
  const token =
    'm1.' +
    btoa(Array.from(compressed, (byte) => String.fromCharCode(byte)).join(''))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  if (token.length > MAX_LINK)
    throw new Error(
      'Liên kết quá dài. Hãy tách bài học thành các bài ngắn hơn.'
    );
  return token;
}
export async function decodeMathLesson(token: string) {
  if (token.length > MAX_LINK || !/^m1\.[A-Za-z0-9_-]+$/.test(token))
    throw new Error(
      'Liên kết bài học không hợp lệ. Hãy xin lại liên kết đầy đủ.'
    );
  try {
    const bytes = Uint8Array.from(
      atob(token.slice(3).replace(/-/g, '+').replace(/_/g, '/')),
      (c) => c.charCodeAt(0)
    );
    const plain = await boundedBytes(
      new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))
    );
    const pack = parseMathPack(
      JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(plain))
    );
    if (pack.lessons.length !== 1) throw new Error('Expected one lesson');
    return learnerCopy(pack.lessons[0]);
  } catch {
    throw new Error(
      'Không mở được bài học. Liên kết có thể bị thiếu hoặc nội dung không hợp lệ.'
    );
  }
}
export const mathShareUrl = (origin: string, token: string) =>
  new URL('/math-practice/learn', origin).href + '#lesson=' + token;
