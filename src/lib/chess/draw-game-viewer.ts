import { Chess } from 'chess.js';

export type GameReference = {
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
let sources: Promise<Record<string, GameSource>> | undefined;
export async function loadGameSource(id: string): Promise<GameSource> {
  sources ??= fetch('/api/draw-game-sources', { cache: 'no-store' })
    .then((response) => {
      if (!response.ok) throw new Error('Source unavailable');
      return response.json();
    })
    .catch((error) => {
      sources = undefined;
      throw error;
    });
  const source = (await sources)[id];
  if (!source) throw new Error('Missing source');
  return source;
}
