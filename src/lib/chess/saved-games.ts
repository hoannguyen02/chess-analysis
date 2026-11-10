import type { GameReference, GameSource } from './draw-game-viewer';
import { practiceLevels, type PracticeLevel } from './draw-levels';
import type { TacticsTheme } from '@/types/tactics-catalog';

export type SavedAnnotations = {
  squares: string[];
  tags: string[];
  note: string;
};
export type PositionDraft = SavedAnnotations & {
  themeId: string;
  level: PracticeLevel;
};
export type SavedPosition = PositionDraft & {
  id: string;
  reference: GameReference;
  fen: string;
  status: 'pending-review';
  createdAt: string;
  updatedAt: string;
};
export type SavedPositionTheme = Pick<TacticsTheme, 'id' | 'label' | 'kind'>;

export type SavedGame = {
  id: string;
  reference: GameReference;
  source: GameSource;
  squares: string[];
  tags: string[];
  note: string;
  moments: { branch: number; ply: number }[];
  /** Personal review candidates, independent of published exercise grades. */
  positions?: SavedPosition[];
  createdAt: string;
  updatedAt: string;
};
export type SavedGamesData = {
  hubPath: string;
  writable: boolean;
  games: SavedGame[];
  themes: SavedPositionTheme[];
};

/** Deep links select personal review candidates, including unbuilt topics. */
export function savedPositionFilters(
  query: { theme?: string | string[]; level?: string | string[] },
  themes: SavedPositionTheme[]
) {
  const { theme, level } = query;
  return {
    themeId:
      typeof theme === 'string' && themes.some((t) => t.id === theme)
        ? theme
        : '',
    level:
      typeof level === 'string' && practiceLevels.some((l) => l === level)
        ? level
        : '',
  };
}

export function matchingSavedPositions(
  game: SavedGame,
  filters: { themeId: string; level: string }
) {
  return (game.positions ?? []).filter(
    (p) =>
      (!filters.themeId || p.themeId === filters.themeId) &&
      (!filters.level || p.level === filters.level)
  );
}

/** Label the last played move from the saved line, including nonstandard starts. */
export function savedMoveLabel(source: GameSource, reference: GameReference) {
  if (!reference.ply) return 'Vị trí bắt đầu';
  const parts = source.fen.split(' ');
  const halfMove =
    (Number(parts[5]) - 1) * 2 + (parts[1] === 'b' ? 1 : 0) + reference.ply - 1;
  return `Sau ${Math.floor(halfMove / 2) + 1}${halfMove % 2 ? '…' : '.'} ${source.lines[reference.branch][reference.ply - 1]}`;
}
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
