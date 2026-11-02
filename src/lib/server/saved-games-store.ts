import { createHash, randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Chess } from 'chess.js';
import seed from './saved-games.json';
import type { SavedGame } from '../chess/saved-games';

const file = path.join(process.cwd(), 'src/lib/server/saved-games.json');
export const writable = () =>
  process.env.NODE_ENV === 'development' && !process.env.VERCEL;
export async function readSavedGames(): Promise<SavedGame[]> {
  return writable()
    ? JSON.parse(await fs.readFile(file, 'utf8'))
    : (seed as SavedGame[]);
}
export function validateSavedGame(
  value: unknown
): Omit<SavedGame, 'id' | 'createdAt' | 'updatedAt' | 'moments'> {
  const v = value as SavedGame;
  if (
    !v ||
    !v.source ||
    v.source.kind !== 'game' ||
    !v.reference ||
    typeof v.reference.id !== 'string' ||
    v.reference.kind !== 'game'
  )
    throw new Error('Ván đấu không hợp lệ.');
  const s = v.source;
  if (
    !s.headers ||
    Object.keys(s.headers).length > 100 ||
    Object.values(s.headers).some(
      (x) => typeof x !== 'string' || x.length > 2000
    ) ||
    typeof s.fen !== 'string' ||
    !Array.isArray(s.lines) ||
    !s.lines.length ||
    s.lines.length > 30 ||
    (s.gameOpening !== undefined &&
      (typeof s.gameOpening !== 'string' || s.gameOpening.length > 1000))
  )
    throw new Error('Dữ liệu ván đấu không hợp lệ.');
  for (const line of s.lines) {
    if (!Array.isArray(line) || line.length > 1500)
      throw new Error('Biến quá dài.');
    const game = new Chess();
    if (!game.load(s.fen)) throw new Error('Vị trí không hợp lệ.');
    for (const move of line)
      if (typeof move !== 'string' || !game.move(move))
        throw new Error('Nước đi không hợp lệ.');
  }
  const { branch, ply } = v.reference;
  if (
    !Number.isInteger(branch) ||
    !s.lines[branch] ||
    !Number.isInteger(ply) ||
    ply < 0 ||
    ply > s.lines[branch].length
  )
    throw new Error('Mốc nước đi không hợp lệ.');
  if (
    !Array.isArray(v.squares) ||
    v.squares.length > 64 ||
    v.squares.some((x) => typeof x !== 'string' || !/^[a-h][1-8]$/.test(x)) ||
    !Array.isArray(v.tags) ||
    v.tags.length > 30 ||
    v.tags.some((x) => typeof x !== 'string' || !x.trim() || x.length > 80) ||
    typeof v.note !== 'string' ||
    v.note.length > 4000
  )
    throw new Error('Kiểm tra ô cờ, nhãn và ghi chú (tối đa 4000 ký tự).');
  return {
    reference: v.reference,
    source: s,
    squares: [...new Set(v.squares)],
    tags: [...new Set(v.tags.map((x) => x.trim()))],
    note: v.note.trim(),
  };
}
export function gameId(source: SavedGame['source']) {
  return createHash('sha256')
    .update(
      JSON.stringify([
        source.fen,
        source.lines[0],
        source.headers.White,
        source.headers.Black,
        source.headers.Date,
      ])
    )
    .digest('hex')
    .slice(0, 24);
}
export async function mutateSavedGames(
  change: (games: SavedGame[]) => SavedGame[]
) {
  const lock = await fs.open(`${file}.lock`, 'wx').catch(() => {
    throw new Error('Bộ sưu tập đang được cập nhật. Vui lòng thử lại.');
  });
  const temp = `${file}.${randomUUID()}.tmp`;
  try {
    const games = change(await readSavedGames());
    await fs.writeFile(temp, JSON.stringify(games, null, 2) + '\n', {
      flag: 'wx',
    });
    await fs.rename(temp, file);
    return games;
  } finally {
    await fs.unlink(temp).catch(() => {});
    await lock.close();
    await fs.unlink(`${file}.lock`);
  }
}
