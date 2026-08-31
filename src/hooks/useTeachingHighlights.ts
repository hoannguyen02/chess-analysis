'use client';

import { BOARD_THEME_MAP } from '@/constants/board-themes';
import { useAppContext } from '@/contexts/AppContext';
import { useCallback, useMemo, useRef, useState } from 'react';
import type {
  Arrow,
  CustomSquareStyles,
  Square,
} from 'react-chessboard/dist/chessboard/types';

type BoardPieceCode =
  | 'wP'
  | 'wN'
  | 'wB'
  | 'wR'
  | 'wQ'
  | 'wK'
  | 'bP'
  | 'bN'
  | 'bB'
  | 'bR'
  | 'bQ'
  | 'bK';

type HighlightVariant =
  | 'default'
  | 'pattern-origin'
  | 'pattern-target'
  | 'pattern-capture'
  | 'pattern-check';

type HighlightEntry = {
  colorIndex: number;
  variant: HighlightVariant;
};

type PatternHighlightEntry = {
  square: Square;
  variant: HighlightVariant;
};

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

const getSquareAt = (fileIndex: number, rankIndex: number) => {
  if (
    fileIndex < 0 ||
    fileIndex >= FILES.length ||
    rankIndex < 0 ||
    rankIndex >= RANKS.length
  ) {
    return null;
  }

  return `${FILES[fileIndex]}${RANKS[rankIndex]}` as Square;
};

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

const getRaySquares = (
  start: Square,
  fileStep: number,
  rankStep: number,
  pieceCode: BoardPieceCode,
  getPieceAtSquare?: (square: Square) => BoardPieceCode | null | undefined
) => {
  const startFileIndex = getFileIndex(start);
  const startRankIndex = getRankIndex(start);
  const highlights: PatternHighlightEntry[] = [];
  const pieceColor = pieceCode[0];

  let currentFileIndex = startFileIndex + fileStep;
  let currentRankIndex = startRankIndex + rankStep;

  while (true) {
    const square = getSquareAt(currentFileIndex, currentRankIndex);
    if (!square) {
      break;
    }

    const occupyingPiece = getPieceAtSquare?.(square) ?? null;
    const isFriendlyOccupied = occupyingPiece?.[0] === pieceColor;

    if (!isFriendlyOccupied) {
      highlights.push({
        square,
        variant: occupyingPiece ? 'pattern-capture' : 'pattern-target',
      });
    }

    if (occupyingPiece) {
      break;
    }

    currentFileIndex += fileStep;
    currentRankIndex += rankStep;
  }

  return highlights;
};

const getPiecePatternHighlights = (
  square: Square,
  pieceCode: BoardPieceCode,
  getPieceAtSquare?: (square: Square) => BoardPieceCode | null | undefined
) => {
  const fileIndex = getFileIndex(square);
  const rankIndex = getRankIndex(square);

  if (fileIndex < 0 || rankIndex < 0) {
    return [];
  }

  const type = pieceCode[1];
  const color = pieceCode[0];
  const highlights: PatternHighlightEntry[] = [
    {
      square,
      variant: 'pattern-origin',
    },
  ];
  const getAttackHighlight = (targetSquare: Square | null) => {
    if (!targetSquare) {
      return null;
    }

    const occupyingPiece = getPieceAtSquare?.(targetSquare) ?? null;
    if (occupyingPiece && occupyingPiece[0] === color) {
      return null;
    }

    return {
      square: targetSquare,
      variant: occupyingPiece ? 'pattern-capture' : 'pattern-target',
    } satisfies PatternHighlightEntry;
  };

  if (type === 'P') {
    const direction = color === 'w' ? 1 : -1;
    return [
      ...highlights,
      ...[
        getAttackHighlight(getSquareAt(fileIndex - 1, rankIndex + direction)),
        getAttackHighlight(getSquareAt(fileIndex + 1, rankIndex + direction)),
      ].filter(Boolean),
    ] as PatternHighlightEntry[];
  }

  if (type === 'N') {
    const offsets = [
      [-2, -1],
      [-2, 1],
      [-1, -2],
      [-1, 2],
      [1, -2],
      [1, 2],
      [2, -1],
      [2, 1],
    ];

    return [
      ...highlights,
      ...offsets
        .map(([fileOffset, rankOffset]) =>
          getAttackHighlight(
            getSquareAt(fileIndex + fileOffset, rankIndex + rankOffset)
          )
        )
        .filter(Boolean),
    ] as PatternHighlightEntry[];
  }

  if (type === 'K') {
    const offsets = [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1],
    ];

    return [
      ...highlights,
      ...offsets
        .map(([fileOffset, rankOffset]) =>
          getAttackHighlight(
            getSquareAt(fileIndex + fileOffset, rankIndex + rankOffset)
          )
        )
        .filter(Boolean),
    ] as PatternHighlightEntry[];
  }

  if (type === 'B' || type === 'Q') {
    highlights.push(
      getRaySquares(square, -1, -1, pieceCode, getPieceAtSquare),
      getRaySquares(square, -1, 1, pieceCode, getPieceAtSquare),
      getRaySquares(square, 1, -1, pieceCode, getPieceAtSquare),
      getRaySquares(square, 1, 1, pieceCode, getPieceAtSquare)
    );
  }

  if (type === 'R' || type === 'Q') {
    highlights.push(
      getRaySquares(square, -1, 0, pieceCode, getPieceAtSquare),
      getRaySquares(square, 1, 0, pieceCode, getPieceAtSquare),
      getRaySquares(square, 0, -1, pieceCode, getPieceAtSquare),
      getRaySquares(square, 0, 1, pieceCode, getPieceAtSquare)
    );
  }

  return highlights.flat();
};

const areSameArrow = (first: Arrow, second: Arrow) =>
  first[0] === second[0] && first[1] === second[1] && first[2] === second[2];

type UseTeachingHighlightsArgs = {
  enabled?: boolean;
  getPieceAtSquare?: (square: Square) => BoardPieceCode | null | undefined;
  getActiveTurn?: () => 'w' | 'b';
  getLegalSquaresForPiece?: (square: Square) => Square[];
  getCheckSquaresForPiece?: (square: Square) => Square[];
};

export const useTeachingHighlights = ({
  enabled = true,
  getPieceAtSquare,
  getActiveTurn,
  getLegalSquaresForPiece,
  getCheckSquaresForPiece,
}: UseTeachingHighlightsArgs = {}) => {
  const { boardTheme } = useAppContext();
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [highlightSquares, setHighlightSquares] = useState<
    Record<Square, HighlightEntry>
  >({} as Record<Square, HighlightEntry>);
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
    return Object.entries(highlightSquares).reduce(
      (styles, [square, entry]) => {
        const color = highlightColors[entry.colorIndex] ?? highlightColors[0];

        if (entry.variant === 'pattern-origin') {
          styles[square as Square] = {
            boxShadow: `inset 0 0 0 5px ${color.border}, inset 0 0 0 10px rgba(255, 255, 255, 0.55)`,
          };
          return styles;
        }

        if (entry.variant === 'pattern-capture') {
          styles[square as Square] = {
            backgroundColor: color.fill.replace(/[\d.]+\)$/, '0.3)'),
            boxShadow: `inset 0 0 0 5px ${color.border}, inset 0 0 0 1px rgba(255, 255, 255, 0.75)`,
          };
          return styles;
        }

        if (entry.variant === 'pattern-check') {
          styles[square as Square] = {
            backgroundColor: color.fill.replace(/[\d.]+\)$/, '0.26)'),
            boxShadow: `inset 0 0 0 5px ${color.border}, inset 0 0 0 10px rgba(255, 255, 255, 0.35)`,
          };
          return styles;
        }

        if (entry.variant === 'pattern-target') {
          styles[square as Square] = {
            backgroundColor: color.fill.replace(/[\d.]+\)$/, '0.12)'),
            boxShadow: `inset 0 0 0 4px ${color.border}`,
          };
          return styles;
        }

        styles[square as Square] = {
          backgroundColor: color.fill,
          boxShadow: `inset 0 0 0 4px ${color.border}`,
        };

        return styles;
      },
      {} as CustomSquareStyles
    );
  }, [highlightColors, highlightSquares]);

  const clearHighlights = useCallback(() => {
    setHighlightSquares({} as Record<Square, HighlightEntry>);
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
      const isPieceCaptureHighlight =
        (rightClickModifiersRef.current.meta ||
          rightClickModifiersRef.current.ctrl) &&
        rightClickModifiersRef.current.shift &&
        rightClickModifiersRef.current.alt;
      const isPieceLegalMoveHighlight =
        (rightClickModifiersRef.current.meta ||
          rightClickModifiersRef.current.ctrl) &&
        !rightClickModifiersRef.current.shift &&
        !rightClickModifiersRef.current.alt;
      const isPieceCheckHighlight =
        (rightClickModifiersRef.current.meta ||
          rightClickModifiersRef.current.ctrl) &&
        rightClickModifiersRef.current.alt &&
        !rightClickModifiersRef.current.shift;
      const isPiecePatternHighlight =
        (rightClickModifiersRef.current.meta ||
          rightClickModifiersRef.current.ctrl) &&
        rightClickModifiersRef.current.shift &&
        !rightClickModifiersRef.current.alt;

      if (isPieceCheckHighlight) {
        const pieceCode = getPieceAtSquare?.(square);
        const activeTurn = getActiveTurn?.();

        if (pieceCode && (!activeTurn || pieceCode[0] === activeTurn)) {
          const checkSquares = getCheckSquaresForPiece?.(square) ?? [];

          if (checkSquares.length > 0) {
            setHighlightSquares((current) => {
              const next = { ...current };
              next[square] = {
                colorIndex: selectedColorIndex,
                variant: 'pattern-origin',
              };
              checkSquares.forEach((checkSquare) => {
                next[checkSquare] = {
                  colorIndex: selectedColorIndex,
                  variant: 'pattern-check',
                };
              });
              return next;
            });
          }
        }

        resetRightClickModifiers();
        return;
      }

      if (isPieceLegalMoveHighlight) {
        const pieceCode = getPieceAtSquare?.(square);
        const activeTurn = getActiveTurn?.();

        if (pieceCode && (!activeTurn || pieceCode[0] === activeTurn)) {
          const legalSquares = getLegalSquaresForPiece?.(square) ?? [];

          if (legalSquares.length > 0) {
            setHighlightSquares((current) => {
              const next = { ...current };
              next[square] = {
                colorIndex: selectedColorIndex,
                variant: 'pattern-origin',
              };
              legalSquares.forEach((legalSquare) => {
                const occupyingPiece = getPieceAtSquare?.(legalSquare) ?? null;

                next[legalSquare] = {
                  colorIndex: selectedColorIndex,
                  variant:
                    occupyingPiece && occupyingPiece[0] !== pieceCode[0]
                      ? 'pattern-capture'
                      : 'pattern-target',
                };
              });
              return next;
            });
          }
        }

        resetRightClickModifiers();
        return;
      }

      if (isPieceCaptureHighlight) {
        const pieceCode = getPieceAtSquare?.(square);
        const activeTurn = getActiveTurn?.();

        if (pieceCode && (!activeTurn || pieceCode[0] === activeTurn)) {
          const captureHighlights = getPiecePatternHighlights(
            square,
            pieceCode,
            getPieceAtSquare
          ).filter(
            (patternHighlight) =>
              patternHighlight.variant === 'pattern-origin' ||
              patternHighlight.variant === 'pattern-capture'
          );

          if (captureHighlights.length > 0) {
            setHighlightSquares((current) => {
              const next = { ...current };
              captureHighlights.forEach((captureHighlight) => {
                next[captureHighlight.square] = {
                  colorIndex: selectedColorIndex,
                  variant: captureHighlight.variant,
                };
              });
              return next;
            });
          }
        }

        resetRightClickModifiers();
        return;
      }

      if (isPiecePatternHighlight) {
        const pieceCode = getPieceAtSquare?.(square);
        if (pieceCode) {
          const patternHighlights = getPiecePatternHighlights(
            square,
            pieceCode,
            getPieceAtSquare
          );
          setHighlightSquares((current) => {
            const next = { ...current };
            patternHighlights.forEach((patternHighlight) => {
              next[patternHighlight.square] = {
                colorIndex: selectedColorIndex,
                variant: patternHighlight.variant,
              };
            });
            return next;
          });
        }
        resetRightClickModifiers();
        return;
      }

      if (isRankHighlight) {
        const rankSquares = getRankSquares(square[1]);
        setHighlightSquares((current) => {
          const next = { ...current };

          rankSquares.forEach((rankSquare) => {
            next[rankSquare] = {
              colorIndex: selectedColorIndex,
              variant: 'default',
            };
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
            next[fileSquare] = {
              colorIndex: selectedColorIndex,
              variant: 'default',
            };
          });

          return next;
        });
        resetRightClickModifiers();
        return;
      }

      setHighlightSquares((current) => {
        const next = { ...current };

        next[square] = {
          colorIndex: selectedColorIndex,
          variant: 'default',
        };
        return next;
      });
      resetRightClickModifiers();
    },
    [
      enabled,
      getActiveTurn,
      getCheckSquaresForPiece,
      getLegalSquaresForPiece,
      getPieceAtSquare,
      resetRightClickModifiers,
      selectedColorIndex,
    ]
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
              next[segmentSquare] = {
                colorIndex: selectedColorIndex,
                variant: 'default',
              };
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
              next[rectangleSquare] = {
                colorIndex: selectedColorIndex,
                variant: 'default',
              };
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
          next[diagonalSquare] = {
            colorIndex: selectedColorIndex,
            variant: 'default',
          };
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
