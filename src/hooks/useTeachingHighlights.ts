'use client';

import { BOARD_THEME_MAP } from '@/constants/board-themes';
import { useAppContext } from '@/contexts/AppContext';
import { useCallback, useMemo, useRef, useState } from 'react';
import type {
  Arrow,
  CustomSquareStyles,
  Square,
} from 'react-chessboard/dist/chessboard/types';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'] as const;

const getFileIndex = (square: Square) =>
  FILES.indexOf(square[0] as (typeof FILES)[number]);
const getRankIndex = (square: Square) =>
  RANKS.indexOf(square[1] as (typeof RANKS)[number]);

const getRankSquares = (rank: string) =>
  FILES.map((file) => `${file}${rank}` as Square);

const getFileSquares = (file: string) =>
  RANKS.map((rank) => `${file}${rank}` as Square);

const getSegmentSquares = (start: Square, end: Square) => {
  const startFileIndex = getFileIndex(start);
  const startRankIndex = getRankIndex(start);
  const endFileIndex = getFileIndex(end);
  const endRankIndex = getRankIndex(end);

  if (
    startFileIndex < 0 ||
    startRankIndex < 0 ||
    endFileIndex < 0 ||
    endRankIndex < 0
  ) {
    return [];
  }

  if (startRankIndex === endRankIndex) {
    const minFileIndex = Math.min(startFileIndex, endFileIndex);
    const maxFileIndex = Math.max(startFileIndex, endFileIndex);

    return FILES.slice(minFileIndex, maxFileIndex + 1).map(
      (file) => `${file}${RANKS[startRankIndex]}` as Square
    );
  }

  if (startFileIndex === endFileIndex) {
    const minRankIndex = Math.min(startRankIndex, endRankIndex);
    const maxRankIndex = Math.max(startRankIndex, endRankIndex);

    return RANKS.slice(minRankIndex, maxRankIndex + 1).map(
      (rank) => `${FILES[startFileIndex]}${rank}` as Square
    );
  }

  return getDiagonalSquares(start, end);
};

const getRectangleSquares = (start: Square, end: Square) => {
  const startFileIndex = getFileIndex(start);
  const startRankIndex = getRankIndex(start);
  const endFileIndex = getFileIndex(end);
  const endRankIndex = getRankIndex(end);

  if (
    startFileIndex < 0 ||
    startRankIndex < 0 ||
    endFileIndex < 0 ||
    endRankIndex < 0
  ) {
    return [];
  }

  const minFileIndex = Math.min(startFileIndex, endFileIndex);
  const maxFileIndex = Math.max(startFileIndex, endFileIndex);
  const minRankIndex = Math.min(startRankIndex, endRankIndex);
  const maxRankIndex = Math.max(startRankIndex, endRankIndex);

  const squares: Square[] = [];

  for (let fileIndex = minFileIndex; fileIndex <= maxFileIndex; fileIndex += 1) {
    for (let rankIndex = minRankIndex; rankIndex <= maxRankIndex; rankIndex += 1) {
      squares.push(`${FILES[fileIndex]}${RANKS[rankIndex]}` as Square);
    }
  }

  return squares;
};

const getDiagonalSquares = (start: Square, end: Square) => {
  const startFileIndex = getFileIndex(start);
  const startRankIndex = getRankIndex(start);
  const endFileIndex = getFileIndex(end);
  const endRankIndex = getRankIndex(end);

  if (
    startFileIndex < 0 ||
    startRankIndex < 0 ||
    endFileIndex < 0 ||
    endRankIndex < 0
  ) {
    return [];
  }

  const fileDiff = endFileIndex - startFileIndex;
  const rankDiff = endRankIndex - startRankIndex;

  if (Math.abs(fileDiff) !== Math.abs(rankDiff)) {
    return [];
  }

  const fileStep = fileDiff > 0 ? 1 : -1;
  const rankStep = rankDiff > 0 ? 1 : -1;
  const length = Math.abs(fileDiff);

  return Array.from({ length: length + 1 }, (_, index) => {
    const file = FILES[startFileIndex + fileStep * index];
    const rank = RANKS[startRankIndex + rankStep * index];

    return `${file}${rank}` as Square;
  });
};

const areSameArrow = (first: Arrow, second: Arrow) =>
  first[0] === second[0] && first[1] === second[1] && first[2] === second[2];

type UseTeachingHighlightsArgs = {
  enabled?: boolean;
};

export const useTeachingHighlights = ({
  enabled = true,
}: UseTeachingHighlightsArgs = {}) => {
  const { boardTheme } = useAppContext();
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [highlightSquares, setHighlightSquares] = useState<
    Record<Square, number>
  >({} as Record<Square, number>);
  const [boardRenderKey, setBoardRenderKey] = useState(0);
  const rightClickModifiersRef = useRef({
    shift: false,
    meta: false,
    ctrl: false,
    alt: false,
  });
  const arrowsSnapshotRef = useRef<Arrow[]>([]);
  const highlightColors = BOARD_THEME_MAP[boardTheme].highlightColors;

  const resetRightClickModifiers = useCallback(() => {
    rightClickModifiersRef.current = {
      shift: false,
      meta: false,
      ctrl: false,
      alt: false,
    };
  }, []);

  const selectedColor =
    highlightColors[selectedColorIndex] ?? highlightColors[0];

  const customSquareStyles = useMemo<CustomSquareStyles>(() => {
    return Object.entries(highlightSquares).reduce((styles, [square, colorIndex]) => {
      const color = highlightColors[colorIndex] ?? highlightColors[0];

      styles[square as Square] = {
        backgroundColor: color.fill,
        boxShadow: `inset 0 0 0 4px ${color.border}`,
      };

      return styles;
    }, {} as CustomSquareStyles);
  }, [highlightColors, highlightSquares]);

  const clearHighlights = useCallback(() => {
    setHighlightSquares({} as Record<Square, number>);
    arrowsSnapshotRef.current = [];
    resetRightClickModifiers();
    setBoardRenderKey((current) => current + 1);
  }, [resetRightClickModifiers]);

  const handleSquareRightClick = useCallback(
    (square: Square) => {
      if (!enabled) return;

      const isRankHighlight =
        rightClickModifiersRef.current.alt && !rightClickModifiersRef.current.shift;
      const isFileHighlight =
        rightClickModifiersRef.current.alt && rightClickModifiersRef.current.shift;

      if (isRankHighlight) {
        const rankSquares = getRankSquares(square[1]);
        setHighlightSquares((current) => {
          const next = { ...current };

          rankSquares.forEach((rankSquare) => {
            next[rankSquare] = selectedColorIndex;
          });

          return next;
        });
        resetRightClickModifiers();
        return;
      }

      if (isFileHighlight) {
        const fileSquares = getFileSquares(square[0]);
        setHighlightSquares((current) => {
          const next = { ...current };

          fileSquares.forEach((fileSquare) => {
            next[fileSquare] = selectedColorIndex;
          });

          return next;
        });
        resetRightClickModifiers();
        return;
      }

      setHighlightSquares((current) => {
        const next = { ...current };

        next[square] = selectedColorIndex;
        return next;
      });
      resetRightClickModifiers();
    },
    [enabled, resetRightClickModifiers, selectedColorIndex]
  );

  const handleArrowsChange = useCallback(
    (nextArrows: Arrow[]) => {
      if (!enabled) return;

      const addedArrow = nextArrows.find(
        (candidate) =>
          !arrowsSnapshotRef.current.some((existingArrow) =>
            areSameArrow(existingArrow, candidate)
          )
      );

      const isSegmentHighlight =
        (rightClickModifiersRef.current.meta ||
          rightClickModifiersRef.current.ctrl) &&
        !rightClickModifiersRef.current.alt &&
        !rightClickModifiersRef.current.shift;
      if (isSegmentHighlight && addedArrow) {
        const segmentSquares = getSegmentSquares(addedArrow[0], addedArrow[1]);

        if (segmentSquares.length > 0) {
          setHighlightSquares((current) => {
            const next = { ...current };
            segmentSquares.forEach((segmentSquare) => {
              next[segmentSquare] = selectedColorIndex;
            });
            return next;
          });
          arrowsSnapshotRef.current = [];
          resetRightClickModifiers();
          setBoardRenderKey((current) => current + 1);
          return;
        }
      }

      const isRectangleHighlight = rightClickModifiersRef.current.alt;
      if (isRectangleHighlight && addedArrow) {
        const rectangleSquares = getRectangleSquares(addedArrow[0], addedArrow[1]);

        if (rectangleSquares.length > 0) {
          setHighlightSquares((current) => {
            const next = { ...current };
            rectangleSquares.forEach((rectangleSquare) => {
              next[rectangleSquare] = selectedColorIndex;
            });
            return next;
          });
          arrowsSnapshotRef.current = [];
          resetRightClickModifiers();
          setBoardRenderKey((current) => current + 1);
          return;
        }
      }

      const isShiftDiagonal = rightClickModifiersRef.current.shift;
      if (!isShiftDiagonal) {
        arrowsSnapshotRef.current = nextArrows;
        resetRightClickModifiers();
        return;
      }

      if (!addedArrow) {
        arrowsSnapshotRef.current = nextArrows;
        resetRightClickModifiers();
        return;
      }

      const diagonalSquares = getDiagonalSquares(addedArrow[0], addedArrow[1]);
      if (diagonalSquares.length === 0) {
        arrowsSnapshotRef.current = nextArrows;
        resetRightClickModifiers();
        return;
      }

      setHighlightSquares((current) => {
        const next = { ...current };
        diagonalSquares.forEach((diagonalSquare) => {
          next[diagonalSquare] = selectedColorIndex;
        });
        return next;
      });
      arrowsSnapshotRef.current = [];
      resetRightClickModifiers();
      setBoardRenderKey((current) => current + 1);
    },
    [enabled, resetRightClickModifiers, selectedColorIndex]
  );

  const handleBoardKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!enabled) return;

      const target = event.target as HTMLElement | null;
      if (
        !target ||
        ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(target.tagName) ||
        target.isContentEditable ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey
      ) {
        return;
      }

      const key = event.key.toLowerCase();

      if (key === 'c' || key === 'escape') {
        clearHighlights();
        return;
      }

      const colorIndex = highlightColors.findIndex((item) => item.key === key);
      if (colorIndex >= 0) {
        setSelectedColorIndex(colorIndex);
        event.preventDefault();
      }
    },
    [clearHighlights, enabled, highlightColors]
  );

  const boardInteractionProps = {
    tabIndex: 0,
    onMouseDownCapture: (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.button === 2) {
        rightClickModifiersRef.current = {
          shift: event.shiftKey,
          meta: event.metaKey,
          ctrl: event.ctrlKey,
          alt: event.altKey,
        };
      }
      event.currentTarget.focus();
    },
    onContextMenu: (event: React.MouseEvent<HTMLDivElement>) => {
      event.preventDefault();
    },
    onKeyDown: handleBoardKeyDown,
  };

  return {
    boardRenderKey,
    highlightColors,
    selectedColor,
    customSquareStyles,
    clearHighlights,
    handleSquareClick: clearHighlights,
    handleSquareRightClick,
    handleArrowsChange,
    boardInteractionProps,
  };
};
