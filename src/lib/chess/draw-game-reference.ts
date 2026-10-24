import sourceIndex from './draw-game-index.json';
import type { GameReference } from './draw-game-viewer';

export function gameReference(fen: string): GameReference | undefined {
  return (sourceIndex as Record<string, GameReference>)[
    fen.split(' ').slice(0, 4).join(' ')
  ];
}
