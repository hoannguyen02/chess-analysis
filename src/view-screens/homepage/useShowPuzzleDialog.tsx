import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/contexts/ToastContext';
import useDialog from '@/hooks/useDialog';
import { Puzzle } from '@/types/puzzle';
import axiosInstance from '@/utils/axiosInstance';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

type PuzzleDialogData = {
  puzzle: Puzzle;
  index: number;
};

export const useShowPuzzleDialog = () => {
  const t = useTranslations();
  const { addToast } = useToast();
  const { apiDomain } = useAppContext();
  const [loadingPuzzle, setLoadingPuzzle] = useState<Record<number, boolean>>();
  const {
    open: isOpenSolvePuzzle,
    data: puzzleDialogData,
    onCloseDialog,
    onOpenDialog,
  } = useDialog<PuzzleDialogData>();

  const handleOpenPuzzle = async (puzzleId: string, index: number) => {
    try {
      setLoadingPuzzle({
        [index]: true,
      });
      const puzzleResult = await axiosInstance.get(
        `${apiDomain}/v1/puzzles/public/${puzzleId}`
      );
      const puzzle = puzzleResult.data;
      if (puzzle) {
        onOpenDialog({ puzzle, index });
      } else {
        addToast(t('common.title.no-puzzles'), 'error');
      }
    } catch (error) {
      console.error('Failed to load puzzle', error);
      addToast(t('common.title.no-puzzles'), 'error');
    } finally {
      setLoadingPuzzle({
        [index]: false,
      });
    }
  };

  const handleNextPuzzle = async (items: any[] = [], index: number) => {
    const nextIdx = index + 1;
    if (nextIdx < items.length) {
      const nextPuzzleId = items[nextIdx]?.puzzle;
      if (nextPuzzleId) {
        await handleOpenPuzzle(nextPuzzleId, nextIdx);
      }
    }
  };

  const hasNextPuzzle = (items: any[]) => {
    if (!puzzleDialogData) return false;

    const allPuzzles = items || [];

    const { index } = puzzleDialogData;
    if (index === undefined) return false;

    return index + 1 < allPuzzles.length
      ? allPuzzles[index + 1]?.puzzle
      : undefined;
  };

  return {
    hasNextPuzzle,
    handleNextPuzzle,
    handleOpenPuzzle,
    onCloseDialog,
    onOpenDialog,
    puzzleDialogData,
    loadingPuzzle,
    isOpenSolvePuzzle,
  };
};
