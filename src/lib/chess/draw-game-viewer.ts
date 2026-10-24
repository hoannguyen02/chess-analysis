import { practiceAccessHeaders, readPracticeToken } from '../practice-access';
import { Chess } from 'chess.js';

export type GameReference = {
  collection?: 'skewer';
  id: string;
  kind: string;
  ply: number;
  branch: number;
};
export type GameSource = {
  kind: 'game' | 'study';
  headers: Record<string, string>;
  fen: string;
  lines: string[][];
};
export type ReferenceGame = { reference: GameReference; source?: GameSource };

/** One entry per original game, retaining the active exercise's exact marker. */
export function referenceGameList(
  items: ReferenceGame[],
  active: ReferenceGame
) {
  const key = (item: ReferenceGame) =>
    `${item.reference.collection ?? 'draw'}:${item.reference.id}`;
  const unique = new Map<string, ReferenceGame>();
  for (const item of items)
    if (!unique.has(key(item))) unique.set(key(item), item);
  unique.set(key(active), active);
  return Array.from(unique.values());
}

// Replay once per selected variation, not on every playback tick.
export function gameFrames(source: GameSource, branch: number) {
  const game = new Chess(source.fen);
  const frames = [{ fen: game.fen(), label: 'Bắt đầu', from: '', to: '' }];
  for (const san of source.lines[branch]) {
    const number = game.fen().split(' ')[5];
    const prefix = `${number}${game.turn() === 'w' ? '.' : '…'}`;
    const move = game.move(san);
    if (!move) throw new Error('Invalid saved game move');
    frames.push({
      fen: game.fen(),
      label: `${prefix} ${move.san}`,
      from: move.from,
      to: move.to,
    });
  }
  return frames;
}
const collections = new Map<string, Promise<Record<string, GameSource>>>();
export async function loadGameSource(
  id: string,
  collection?: 'skewer'
): Promise<GameSource> {
  const endpoint =
    collection === 'skewer'
      ? '/api/skewer-game-sources'
      : '/api/draw-game-sources';
  const cacheKey = `${endpoint}:${readPracticeToken()}`;
  let sources = collections.get(cacheKey);
  if (!sources) {
    sources = fetch(endpoint, {
      cache: 'no-store',
      headers: practiceAccessHeaders(),
    })
      .then((response) => {
        if (!response.ok) throw new Error('Source unavailable');
        return response.json();
      })
      .catch((error) => {
        collections.delete(cacheKey);
        throw error;
      });
    collections.set(cacheKey, sources);
  }
  const source = (await sources)[id];
  if (!source) throw new Error('Missing source');
  return source;
}
