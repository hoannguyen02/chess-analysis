import type { GameReference, GameSource } from './draw-game-viewer';

export type SavedGame = {
  id: string;
  reference: GameReference;
  source: GameSource;
  squares: string[];
  tags: string[];
  note: string;
  moments: { branch: number; ply: number }[];
  createdAt: string;
  updatedAt: string;
};
export type SavedGamesData = {
  hubPath: string;
  writable: boolean;
  games: SavedGame[];
};
export function winningPlayer(source: GameSource) {
  return source.headers.Result === '1-0'
    ? source.headers.White || ''
    : source.headers.Result === '0-1'
      ? source.headers.Black || ''
      : '';
}
export function splitTags(value: string) {
  return [
    ...new Set(
      value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    ),
  ];
}
