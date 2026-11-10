import type { PracticeLevel } from '@/lib/chess/draw-levels';

/** Project taxonomy, separate from the remote puzzle API's PuzzleTheme shape. */
export type TacticsTheme = {
  id: string;
  label: string;
  kind: 'tactic' | 'checkmate' | 'endgame' | 'special-move';
  dedicatedPage: string | null;
  lichessTheme: string | null;
  detector: string | null;
  status: 'available' | 'not-built';
  englishLabel?: string;
  description?: string;
  /** Development order; independent of the six exercise levels. */
  priority?: 1 | 2 | 3;
  /** Teaching suitability, in practice order; not published counts or grades.
   * Omit until assessed. Child themes are assessed independently.
   */
  levels?: PracticeLevel[];
  parentId?: string;
  relatedThemes?: string[];
  /** Alternate names of this theme, never additional catalog entries. */
  aliases?: string[];
};

export type TacticsCatalog = {
  version: 1;
  themes: TacticsTheme[];
};
