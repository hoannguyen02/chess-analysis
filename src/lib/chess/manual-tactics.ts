import type { DrawExercise } from './draw-practice';
import type { PracticeLevel } from './draw-levels';
import type { GameReference } from './draw-game-viewer';

export type ManualTactic = {
  id: string;
  themeId: string;
  level: PracticeLevel;
  fen: string;
  goal: NonNullable<DrawExercise['goal']>;
  moves: string[];
  alternativeLines?: string[][];
  solution: string;
  title: string;
  reference?: GameReference;
  previousMove?: DrawExercise['previousMove'];
  headers?: Record<string, string>;
  gameOpening?: string;
  // Original imported position is retained when a Beginner board is edited.
  beginnerOriginalFen?: string;
  // A manual overlay may replace only a curated Beginner position.
  beginnerBaseFen?: string;
  beginnerSourceLevel?: PracticeLevel;
  createdAt: string;
  updatedAt: string;
};

export const manualPositionKey = (fen: string) =>
  fen.split(' ').slice(0, 4).join(' ');
export const manualLevelPositionKey = (fen: string, beginner: boolean) =>
  `${beginner ? 'Beginner' : 'standard'}|${manualPositionKey(fen)}`;
export const manualTopicPath = (theme: {
  id: string;
  dedicatedPage: string | null;
}) =>
  theme.dedicatedPage ||
  `/tactic-positions?theme=${encodeURIComponent(theme.id)}`;
