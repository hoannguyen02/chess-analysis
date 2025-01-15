import { Puzzle } from '@/types/puzzle';

export const previewPuzzle = (puzzle: Puzzle) => {
  const encodedData = encodeURIComponent(JSON.stringify(puzzle));
  window.open(`/settings/puzzles/preview?data=${encodedData}`, '_blank');
};
