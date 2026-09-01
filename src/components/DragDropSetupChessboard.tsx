import { TeachingToolsDialog } from '@/components/TeachingToolsDialog';
import { BOARD_THEMES, BoardThemeId } from '@/constants/board-themes';
import { useAppContext } from '@/contexts/AppContext';
import { useCustomBoard } from '@/hooks/useCustomBoard';
import { useTeachingHighlights } from '@/hooks/useTeachingHighlights';
import { LowercasePlayerName } from '@/types/player-name';
import { Chess } from 'chess.js';
import {
  Button,
  Checkbox,
  Clipboard,
  Dropdown,
  TextInput,
  Tooltip,
} from 'flowbite-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Chessboard,
  ChessboardDnDProvider,
  SparePiece,
} from 'react-chessboard';
import { Piece, Square } from 'react-chessboard/dist/chessboard/types';
import {
  VscAdd,
  VscArrowLeft,
  VscArrowRight,
  VscArrowSwap,
  VscCheck,
  VscChevronDown,
  VscChevronUp,
  VscChromeRestore,
  VscCopy,
  VscListOrdered,
  VscScreenFull,
  VscScreenNormal,
  VscSearchFuzzy,
  VscSettingsGear,
  VscSymbolColor,
  VscTrash,
} from 'react-icons/vsc';
import { TeachingTimer } from './TeachingTimer';

const pieces = [
  'wP',
  'wN',
  'wB',
  'wR',
  'wQ',
  'wK',
  'bP',
  'bN',
  'bB',
  'bR',
  'bQ',
  'bK',
];

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;

type Props = {
  fen?: string;
  isGuide?: boolean;
};

type LessonPosition = {
  id: string;
  title: string;
  fen: string;
};

const castlingRightsFromFen = (fen: string) => {
  const castlingPart = fen.split(' ')[2] ?? '-';

  return {
    K: castlingPart.includes('K'),
    Q: castlingPart.includes('Q'),
    k: castlingPart.includes('k'),
    q: castlingPart.includes('q'),
  };
};

const createLessonPositionId = () =>
  `lesson-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const DragDropSetupChessboard = ({
  fen = '8/8/8/8/8/8/8/8 w - - 0 1',
  isGuide = false,
}: Props) => {
  const [castlingRights, setCastlingRights] = useState(() =>
    castlingRightsFromFen(fen)
  );

  const { boardTheme, isMobile, setBoardTheme } = useAppContext();
  const t = useTranslations();
  const { customPieces, bgDark, bgLight, notationColor, notationShadow } =
    useCustomBoard();
  const game = useMemo(() => new Chess(fen), [fen]); // empty board
  const getOrientationFromTurn = useCallback(
    () => (game.turn() === 'w' ? 'white' : 'black'),
    [game]
  );
  const [boardOrientation, setBoardOrientation] = useState<LowercasePlayerName>(
    getOrientationFromTurn
  );
  const [fenPosition, setFenPosition] = useState(fen);
  const [isFullViewMode, setIsFullViewMode] = useState(false);
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(false);
  const [boardContainerWidth, setBoardContainerWidth] = useState(500);
  const [viewportHeight, setViewportHeight] = useState(900);
  const [showSparePieces, setShowSparePieces] = useState(false);
  const [lessonPositions, setLessonPositions] = useState<LessonPosition[]>([]);
  const [lessonPositionFenDrafts, setLessonPositionFenDrafts] = useState<
    Record<string, string>
  >({});
  const [activeLessonPositionId, setActiveLessonPositionId] = useState<
    string | null
  >(null);
  const [isTeachingToolsDialogOpen, setIsTeachingToolsDialogOpen] =
    useState(false);
  const fullViewRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const getPieceAtSquare = useCallback(
    (square: Square) => {
      const piece = game.get(square);

      if (!piece) {
        return null;
      }

      return `${piece.color}${piece.type.toUpperCase()}` as const;
    },
    [game]
  );
  const getAllPieces = useCallback(
    () =>
      game.board().flatMap((rank, rankIndex) =>
        rank.flatMap((piece, fileIndex) => {
          if (!piece) {
            return [];
          }

          return [
            {
              square: `${FILES[fileIndex]}${8 - rankIndex}` as Square,
              pieceCode: `${piece.color}${piece.type.toUpperCase()}` as const,
            },
          ];
        })
      ),
    [game]
  );
  const getActiveTurn = useCallback(() => game.turn(), [game]);
  const getLegalSquaresForPiece = useCallback(
    (square: Square) => {
      const piece = game.get(square);
      if (!piece || piece.color !== game.turn()) {
        return [];
      }

      return game
        .moves({ square, verbose: true })
        .map((move: any) => move.to as Square);
    },
    [game]
  );
  const getCheckSquaresForPiece = useCallback(
    (square: Square) => {
      const piece = game.get(square);
      if (!piece || piece.color !== game.turn()) {
        return [];
      }

      return game
        .moves({ square, verbose: true })
        .filter((move: any) => {
          const nextGame = new Chess(game.fen());
          nextGame.move(move);
          return nextGame.in_check();
        })
        .map((move: any) => move.to as Square);
    },
    [game]
  );
  const {
    boardRenderKey,
    selectedColor,
    customSquareStyles,
    clearHighlights,
    handleSquareClick,
    handleSquareRightClick,
    handleArrowsChange,
    boardInteractionProps,
  } = useTeachingHighlights({
    getPieceAtSquare,
    getAllPieces,
    getActiveTurn,
    getLegalSquaresForPiece,
    getCheckSquaresForPiece,
  });

  const applyFenPosition = useCallback(
    (nextFen: string) => {
      const isValid = game.load(nextFen);
      if (!isValid) {
        return null;
      }

      const normalizedFen = game.fen();
      setFenPosition(normalizedFen);
      setBoardOrientation(game.turn() === 'w' ? 'white' : 'black');
      setCastlingRights(castlingRightsFromFen(normalizedFen));
      clearHighlights();

      return normalizedFen;
    },
    [clearHighlights, game]
  );

  useEffect(() => {
    setBoardOrientation(getOrientationFromTurn());
  }, [getOrientationFromTurn]);

  useEffect(() => {
    if (!activeLessonPositionId) {
      return;
    }

    setLessonPositions((current) =>
      current.map((position) =>
        position.id === activeLessonPositionId && position.fen !== fenPosition
          ? { ...position, fen: fenPosition }
          : position
      )
    );
  }, [activeLessonPositionId, fenPosition]);

  useEffect(() => {
    setLessonPositionFenDrafts((current) => {
      const next: Record<string, string> = {};

      lessonPositions.forEach((position) => {
        next[position.id] = current[position.id] ?? position.fen;
      });

      return next;
    });
  }, [lessonPositions]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncFullscreenState = () => {
      const inFullscreen = Boolean(document.fullscreenElement);
      setIsBrowserFullscreen(inFullscreen);
      if (!inFullscreen) {
        setIsFullViewMode(false);
      }
    };

    const updateViewportHeight = () => {
      setViewportHeight(window.innerHeight);
    };

    syncFullscreenState();
    updateViewportHeight();

    document.addEventListener('fullscreenchange', syncFullscreenState);
    window.addEventListener('resize', updateViewportHeight);

    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreenState);
      window.removeEventListener('resize', updateViewportHeight);
    };
  }, []);

  useEffect(() => {
    if (!boardRef.current || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setBoardContainerWidth(
        Math.max(280, Math.floor(entry.contentRect.width))
      );
    });

    observer.observe(boardRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isFullViewMode || isBrowserFullscreen) return;

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFullViewMode(false);
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isBrowserFullscreen, isFullViewMode]);

  const handleSparePieceDrop = (piece: any, targetSquare: any) => {
    const color = piece[0];
    const type = piece[1].toLowerCase();

    const success = game.put({ type, color }, targetSquare);

    if (success) {
      setFenPosition(game.fen());
    } else {
      alert(
        `The board already contains ${color === 'w' ? 'WHITE' : 'BLACK'} KING`
      );
    }

    return success;
  };

  const handlePieceDrop = (
    sourceSquare: any,
    targetSquare: any,
    piece: any
  ) => {
    const color = piece[0];
    const type = piece[1].toLowerCase();

    // this is hack to avoid chess.js bug, which I've fixed in the latest version https://github.com/jhlywa/chess.js/pull/426
    game.remove(sourceSquare);
    game.remove(targetSquare);
    const success = game.put({ type, color }, targetSquare);

    if (success) setFenPosition(game.fen());

    return success;
  };

  const handlePieceDropOffBoard = (sourceSquare: Square) => {
    game.remove(sourceSquare);
    setFenPosition(game.fen());
  };

  const handleFenInputChange = (e: any) => {
    const nextFen = e.target.value;
    const { valid } = game.validate_fen(nextFen);

    setFenPosition(nextFen);
    if (valid) {
      applyFenPosition(nextFen);
    }
  };

  const setTurn = (turn: 'w' | 'b') => {
    let fen = game.fen();
    fen = fen.replace(/ [wb] /, ` ${turn} `);

    const isValid = game.load(fen);
    if (isValid) {
      const normalizedFen = game.fen();
      setFenPosition(normalizedFen);
      setBoardOrientation(getOrientationFromTurn());
      setCastlingRights(castlingRightsFromFen(normalizedFen));
    } else {
      throw new Error('Failed to set turn. The resulting FEN is invalid.');
    }
  };

  const analysis = useCallback(() => {
    window.open(`/analysis?fen=${game.fen()}`, '_blank');
  }, [game]);

  const onFlipBoard = useCallback(() => {
    setBoardOrientation(boardOrientation === 'white' ? 'black' : 'white');
  }, [boardOrientation]);

  const handleCastlingChange = (side: 'K' | 'Q' | 'k' | 'q') => {
    setCastlingRights((prev) => {
      const updatedRights = { ...prev, [side]: !prev[side] };

      // Construct new castling rights string dynamically
      const newCastlingRights =
        (updatedRights.K ? 'K' : '') +
        (updatedRights.Q ? 'Q' : '') +
        (updatedRights.k ? 'k' : '') +
        (updatedRights.q ? 'q' : '');

      // Modify the FEN
      const fenParts = fenPosition.split(' ');
      fenParts[2] = newCastlingRights || '-'; // If no castling rights, use '-'
      const newFen = fenParts.join(' ');

      // Load into chess.js and update FEN
      if (game.load(newFen)) {
        const normalizedFen = game.fen();
        setFenPosition(normalizedFen);
        setCastlingRights(updatedRights);
      }

      return updatedRights;
    });
  };

  const addLessonPosition = useCallback(() => {
    const currentFen = game.fen();
    const nextPosition: LessonPosition = {
      id: createLessonPositionId(),
      title: t('setup-board.position-title', {
        number: lessonPositions.length + 1,
      }),
      fen: currentFen,
    };

    setLessonPositions((current) => [...current, nextPosition]);
    setLessonPositionFenDrafts((current) => ({
      ...current,
      [nextPosition.id]: currentFen,
    }));
    setActiveLessonPositionId(nextPosition.id);
  }, [game, lessonPositions.length, t]);

  const loadLessonPosition = useCallback(
    (position: LessonPosition) => {
      const loadedFen = applyFenPosition(position.fen);
      if (!loadedFen) {
        return;
      }

      setActiveLessonPositionId(position.id);
    },
    [applyFenPosition]
  );

  const duplicateLessonPosition = useCallback(
    (id: string) => {
      let cloneToLoad: LessonPosition | null = null;

      setLessonPositions((current) => {
        const index = current.findIndex((position) => position.id === id);
        if (index === -1) {
          return current;
        }

        const source = current[index];
        const clone: LessonPosition = {
          ...source,
          id: createLessonPositionId(),
          title: `${source.title} Copy`,
        };
        cloneToLoad = clone;

        const next = [...current];
        next.splice(index + 1, 0, clone);
        return next;
      });

      if (cloneToLoad) {
        setLessonPositionFenDrafts((current) => ({
          ...current,
          [cloneToLoad.id]: cloneToLoad.fen,
        }));
        loadLessonPosition(cloneToLoad);
      }
    },
    [loadLessonPosition]
  );

  const moveLessonPosition = useCallback((id: string, direction: -1 | 1) => {
    setLessonPositions((current) => {
      const index = current.findIndex((position) => position.id === id);
      const targetIndex = index + direction;

      if (index === -1 || targetIndex < 0 || targetIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const [position] = next.splice(index, 1);
      next.splice(targetIndex, 0, position);
      return next;
    });
  }, []);

  const removeLessonPosition = useCallback(
    (id: string) => {
      let fallback: LessonPosition | null = null;

      setLessonPositions((current) => {
        const index = current.findIndex((position) => position.id === id);
        if (index === -1) {
          return current;
        }

        const next = current.filter((position) => position.id !== id);
        fallback = next[Math.min(index, next.length - 1)] ?? null;
        return next;
      });

      if (activeLessonPositionId === id) {
        setActiveLessonPositionId(fallback?.id ?? null);
        if (fallback) {
          loadLessonPosition(fallback);
        }
      }
    },
    [activeLessonPositionId, loadLessonPosition]
  );

  const updateLessonPositionTitle = useCallback((id: string, title: string) => {
    setLessonPositions((current) =>
      current.map((position) =>
        position.id === id ? { ...position, title } : position
      )
    );
  }, []);

  const updateLessonPositionFenDraft = useCallback(
    (id: string, fen: string) => {
      setLessonPositionFenDrafts((current) => ({
        ...current,
        [id]: fen,
      }));
    },
    []
  );

  const saveLessonPositionFen = useCallback(
    (id: string) => {
      const draftFen = lessonPositionFenDrafts[id]?.trim();
      if (!draftFen) {
        return;
      }

      const previewGame = new Chess();
      const isValid = previewGame.load(draftFen);
      if (!isValid) {
        return;
      }

      const normalizedFen = previewGame.fen();

      setLessonPositions((current) =>
        current.map((position) =>
          position.id === id ? { ...position, fen: normalizedFen } : position
        )
      );
      setLessonPositionFenDrafts((current) => ({
        ...current,
        [id]: normalizedFen,
      }));

      if (activeLessonPositionId === id) {
        applyFenPosition(normalizedFen);
      }
    },
    [activeLessonPositionId, applyFenPosition, lessonPositionFenDrafts]
  );

  const whitePieces = useMemo(() => pieces.slice(0, 6), []);
  const blackPieces = useMemo(() => pieces.slice(6, 12), []);
  const topPieces = useMemo(
    () => (boardOrientation === 'white' ? blackPieces : whitePieces),
    [blackPieces, boardOrientation, whitePieces]
  );
  const bottomPieces = useMemo(
    () => (boardOrientation === 'white' ? whitePieces : blackPieces),
    [blackPieces, boardOrientation, whitePieces]
  );

  const toggleFullView = useCallback(async () => {
    if (typeof window === 'undefined') return;

    const currentlyFullscreen = Boolean(document.fullscreenElement);

    if (currentlyFullscreen) {
      try {
        await document.exitFullscreen();
      } catch {
        // Ignore and fallback to local mode state below.
      }
      setIsFullViewMode(false);
      return;
    }

    setIsFullViewMode((current) => !current);

    const target = fullViewRef.current;
    if (!target?.requestFullscreen) return;

    try {
      await target.requestFullscreen();
    } catch {
      // If browser denies fullscreen, fallback still uses local expanded mode.
    }
  }, []);

  const isFullViewActive = isFullViewMode || isBrowserFullscreen;
  const chessboardWidth = useMemo(() => {
    if (isFullViewActive) {
      const maxSquareByHeight = Math.max(320, viewportHeight - 260);
      return Math.max(280, Math.min(boardContainerWidth, maxSquareByHeight));
    }

    if (isMobile) {
      return boardContainerWidth || 320;
    }

    return Math.min(boardContainerWidth || 500, 500);
  }, [boardContainerWidth, isFullViewActive, isMobile, viewportHeight]);

  const spaceBetweenBoardAndPieces = useMemo(
    () => chessboardWidth / 48,
    [chessboardWidth]
  );

  const notationStyle = useMemo(
    () => ({
      fontSize: isFullViewActive ? chessboardWidth / 30 : chessboardWidth / 42,
      fontWeight: 700,
      color: notationColor,
      textShadow: notationShadow,
    }),
    [chessboardWidth, isFullViewActive, notationColor, notationShadow]
  );
  const activeBoardTheme = useMemo(
    () => BOARD_THEMES.find((theme) => theme.id === boardTheme),
    [boardTheme]
  );
  const activeLessonIndex = useMemo(
    () =>
      lessonPositions.findIndex(
        (position) => position.id === activeLessonPositionId
      ),
    [activeLessonPositionId, lessonPositions]
  );
  const canGoToPreviousLesson = activeLessonIndex > 0;
  const canGoToNextLesson =
    activeLessonIndex !== -1 && activeLessonIndex < lessonPositions.length - 1;
  const castlingSummary = useMemo(
    () =>
      t('setup-board.castling-summary', {
        white:
          [castlingRights.K ? 'O-O' : null, castlingRights.Q ? 'O-O-O' : null]
            .filter(Boolean)
            .join(' ')
            .trim() || '-',
        black:
          [castlingRights.k ? 'O-O' : null, castlingRights.q ? 'O-O-O' : null]
            .filter(Boolean)
            .join(' ')
            .trim() || '-',
      }),
    [castlingRights.K, castlingRights.Q, castlingRights.k, castlingRights.q, t]
  );

  return (
    <ChessboardDnDProvider>
      <div
        ref={fullViewRef}
        className={
          isFullViewActive
            ? 'fixed inset-0 z-50 overflow-auto bg-slate-900 px-3 py-4 sm:p-6'
            : 'mx-auto max-w-[1100px] p-4'
        }
      >
        <div
          className={
            isFullViewActive
              ? 'mx-auto grid max-w-[1280px] grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start'
              : 'grid grid-cols-1 gap-2 md:grid-cols-[400px_auto] lg:grid-cols-[500px_auto] lg:gap-8 mx-auto max-w-[1100px]'
          }
        >
          <div ref={boardRef}>
            <div
              {...boardInteractionProps}
              className="mx-auto flex w-fit flex-col items-center outline-none"
            >
              <div
                className="rounded-2xl border border-slate-300 bg-slate-50 shadow-lg"
                style={{
                  display: showSparePieces ? 'flex' : 'none',
                  justifyContent: 'center',
                  marginBottom: `${spaceBetweenBoardAndPieces}px`,
                  width: `${chessboardWidth}px`,
                }}
              >
                {topPieces.map((piece) => (
                  <SparePiece
                    key={piece}
                    piece={piece as Piece}
                    width={chessboardWidth / 8}
                    dndId="ManualBoardEditor"
                  />
                ))}
              </div>
              <Chessboard
                key={boardRenderKey}
                boardWidth={chessboardWidth}
                id="ManualBoardEditor"
                boardOrientation={boardOrientation}
                position={fenPosition}
                customSquareStyles={customSquareStyles}
                customArrowColor={selectedColor.arrow}
                customNotationStyle={notationStyle}
                onSparePieceDrop={handleSparePieceDrop}
                onPieceDrop={handlePieceDrop}
                onPieceDropOffBoard={handlePieceDropOffBoard}
                onSquareClick={handleSquareClick}
                onSquareRightClick={handleSquareRightClick}
                onArrowsChange={handleArrowsChange}
                dropOffBoardAction="trash"
                customBoardStyle={{
                  borderRadius: '4px',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
                }}
                customPieces={customPieces}
                customDarkSquareStyle={{
                  backgroundColor: bgDark,
                }}
                customLightSquareStyle={{
                  backgroundColor: bgLight,
                }}
              />
              <div
                className="rounded-2xl border border-slate-300 bg-slate-50 shadow-lg"
                style={{
                  display: showSparePieces ? 'flex' : 'none',
                  justifyContent: 'center',
                  marginTop: `${spaceBetweenBoardAndPieces}px`,
                  width: `${chessboardWidth}px`,
                }}
              >
                {bottomPieces.map((piece) => (
                  <SparePiece
                    key={piece}
                    piece={piece as Piece}
                    width={chessboardWidth / 8}
                    dndId="ManualBoardEditor"
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div
              className={
                isFullViewActive
                  ? 'rounded border bg-white p-4'
                  : 'rounded p-4 lg:border'
              }
            >
              <div className="mx-auto flex w-full items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Tooltip
                    content={t('setup-board.start-position')}
                    placement="top"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        game.reset();
                        applyFenPosition(game.fen());
                      }}
                      className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-300 bg-white text-cyan-600 transition hover:bg-cyan-50"
                      aria-label={t('setup-board.start-position')}
                    >
                      <VscChromeRestore size={22} />
                    </button>
                  </Tooltip>
                  <Tooltip
                    content={t('setup-board.clear-board')}
                    placement="top"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        game.clear();
                        applyFenPosition(game.fen());
                      }}
                      className="flex h-12 w-12 items-center justify-center rounded-xl border border-rose-300 bg-white text-rose-500 transition hover:bg-rose-50"
                      aria-label={t('setup-board.clear-board')}
                    >
                      <VscTrash size={22} />
                    </button>
                  </Tooltip>
                  <Tooltip
                    content={t('setup-board.flip-board')}
                    placement="top"
                  >
                    <button
                      type="button"
                      onClick={onFlipBoard}
                      className="flex h-12 w-12 items-center justify-center rounded-xl border border-indigo-300 bg-white text-indigo-500 transition hover:bg-indigo-50"
                      aria-label={t('setup-board.flip-board')}
                    >
                      <VscArrowSwap size={22} />
                    </button>
                  </Tooltip>
                </div>
                <label
                  htmlFor="show-spare-pieces"
                  className="flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-500 transition hover:border-slate-300 hover:bg-white"
                >
                  <Checkbox
                    id="show-spare-pieces"
                    checked={showSparePieces}
                    onChange={(event) =>
                      setShowSparePieces(event.target.checked)
                    }
                  />
                  <span>{t('setup-board.show-pieces')}</span>
                </label>
              </div>

              {!isGuide && (
                <div className="mt-8 flex flex-col gap-6">
                  <div className="rounded-xl border flex justify-between border-slate-200 bg-slate-50 px-4 py-2.5">
                    <Dropdown
                      label={
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex w-10 shrink-0 overflow-hidden rounded-lg border border-slate-200">
                            <span
                              className="h-7 flex-1"
                              style={{
                                backgroundColor:
                                  activeBoardTheme?.light ?? '#ffffff',
                              }}
                            />
                            <span
                              className="h-7 flex-1"
                              style={{
                                backgroundColor:
                                  activeBoardTheme?.dark ?? '#cbd5e1',
                              }}
                            />
                          </div>
                          <span className="truncate text-sm text-slate-500">
                            {activeBoardTheme?.labelKey
                              ? t(activeBoardTheme.labelKey)
                              : ''}
                          </span>
                        </div>
                      }
                      inline
                    >
                      {BOARD_THEMES.map((theme) => {
                        const isActive = boardTheme === theme.id;

                        return (
                          <Dropdown.Item
                            key={theme.id}
                            onClick={() =>
                              setBoardTheme(theme.id as BoardThemeId)
                            }
                          >
                            <div className="flex min-w-[180px] items-center gap-3">
                              <div className="flex w-16 overflow-hidden rounded border border-slate-200">
                                <span
                                  className="h-6 flex-1"
                                  style={{ backgroundColor: theme.light }}
                                />
                                <span
                                  className="h-6 flex-1"
                                  style={{ backgroundColor: theme.dark }}
                                />
                              </div>
                              <span className="text-sm text-slate-700">
                                {t(theme.labelKey)}
                              </span>
                              {isActive && (
                                <span className="ml-auto text-xs font-semibold text-slate-500">
                                  {t('setup-board.active-theme')}
                                </span>
                              )}
                            </div>
                          </Dropdown.Item>
                        );
                      })}
                    </Dropdown>
                    <Dropdown
                      label={
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500">
                            <VscSettingsGear size={15} />
                          </div>
                          <span className="truncate text-sm text-slate-500">
                            {castlingSummary}
                          </span>
                        </div>
                      }
                      inline
                    >
                      <div className="space-y-4 px-2 py-1">
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            {t('common.title.white')}
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleCastlingChange('K')}
                              className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${
                                castlingRights.K
                                  ? 'border-amber-400 bg-amber-50 text-amber-700'
                                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                              }`}
                              aria-pressed={castlingRights.K}
                              aria-label={`${t('common.title.white')} ${t('setup-board.king-side')} castling`}
                            >
                              O-O
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCastlingChange('Q')}
                              className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${
                                castlingRights.Q
                                  ? 'border-amber-400 bg-amber-50 text-amber-700'
                                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                              }`}
                              aria-pressed={castlingRights.Q}
                              aria-label={`${t('common.title.white')} ${t('setup-board.queen-side')} castling`}
                            >
                              O-O-O
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            {t('common.title.black')}
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleCastlingChange('k')}
                              className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${
                                castlingRights.k
                                  ? 'border-amber-400 bg-amber-50 text-amber-700'
                                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                              }`}
                              aria-pressed={castlingRights.k}
                              aria-label={`${t('common.title.black')} ${t('setup-board.king-side')} castling`}
                            >
                              O-O
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCastlingChange('q')}
                              className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${
                                castlingRights.q
                                  ? 'border-amber-400 bg-amber-50 text-amber-700'
                                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                              }`}
                              aria-pressed={castlingRights.q}
                              aria-label={`${t('common.title.black')} ${t('setup-board.queen-side')} castling`}
                            >
                              O-O-O
                            </button>
                          </div>
                        </div>
                      </div>
                    </Dropdown>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex shrink-0 items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
                        <Tooltip
                          content={t('common.title.white')}
                          placement="top"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setTurn('w');
                            }}
                            className={`flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200 ${
                              game.turn() === 'w'
                                ? 'bg-blue-500 text-white shadow-lg'
                                : 'bg-white text-slate-500 hover:bg-slate-100'
                            }`}
                            aria-label={t('common.title.white')}
                            aria-pressed={game.turn() === 'w'}
                          >
                            <span className="h-4 w-4 rounded-full border border-slate-300 bg-white" />
                          </button>
                        </Tooltip>
                        <Tooltip
                          content={t('common.title.black')}
                          placement="top"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setTurn('b');
                            }}
                            className={`flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200 ${
                              game.turn() === 'b'
                                ? 'bg-blue-500 text-white shadow-lg'
                                : 'bg-white text-slate-500 hover:bg-slate-100'
                            }`}
                            aria-label={t('common.title.black')}
                            aria-pressed={game.turn() === 'b'}
                          >
                            <span className="h-4 w-4 rounded-full border border-slate-500 bg-slate-900" />
                          </button>
                        </Tooltip>
                        <Tooltip
                          content={t('setup-board.to-move')}
                          placement="top"
                        >
                          <span className="ml-1 flex h-10 w-10 items-center justify-center rounded-lg text-slate-400">
                            <VscSymbolColor size={18} />
                          </span>
                        </Tooltip>
                      </div>

                      <TextInput
                        className="w-full rounded"
                        value={fenPosition}
                        onChange={handleFenInputChange}
                        placeholder="Paste FEN position to start editing"
                      />
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500">
                            <VscListOrdered size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {t('setup-board.lesson-positions')}
                            </p>
                            <p className="text-xs text-slate-400">
                              {lessonPositions.length}{' '}
                              {t('setup-board.positions-count')}
                            </p>
                          </div>
                        </div>
                        <Tooltip
                          content={t('setup-board.add-current-position')}
                          placement="top"
                        >
                          <button
                            type="button"
                            onClick={addLessonPosition}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-100"
                            aria-label={t('setup-board.add-current-position')}
                          >
                            <VscAdd size={18} />
                          </button>
                        </Tooltip>
                      </div>

                      {lessonPositions.length === 0 ? (
                        '' // Display nothing
                      ) : (
                        <div className="mt-3 max-h-36 space-y-2 overflow-auto pr-1">
                          {lessonPositions.map((position, index) => {
                            const isActive =
                              position.id === activeLessonPositionId;
                            const draftFen =
                              lessonPositionFenDrafts[position.id] ??
                              position.fen;
                            const isFenValid =
                              game.validate_fen(draftFen).valid;
                            const hasFenChanges = draftFen !== position.fen;
                            const turn =
                              position.fen.split(' ')[1] === 'b'
                                ? 'black'
                                : 'white';

                            return (
                              <div
                                key={position.id}
                                className={`group flex items-center gap-2 rounded-xl border px-2 py-2 text-left transition ${
                                  isActive
                                    ? 'border-blue-300 bg-blue-50 shadow-sm'
                                    : 'border-slate-200 bg-white hover:border-slate-300'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => loadLessonPosition(position)}
                                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                                  aria-label={t('setup-board.load-position', {
                                    number: index + 1,
                                  })}
                                >
                                  <span
                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${
                                      isActive
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-slate-100 text-slate-500'
                                    }`}
                                  >
                                    {index + 1}
                                  </span>
                                  <span
                                    className={`h-3 w-3 shrink-0 rounded-full border ${
                                      turn === 'white'
                                        ? 'border-slate-300 bg-white'
                                        : 'border-slate-600 bg-slate-900'
                                    }`}
                                  />
                                  <div className="min-w-0 flex-1">
                                    <input
                                      value={position.title}
                                      onChange={(event) =>
                                        updateLessonPositionTitle(
                                          position.id,
                                          event.target.value
                                        )
                                      }
                                      onClick={(event) =>
                                        event.stopPropagation()
                                      }
                                      onKeyDown={(event) =>
                                        event.stopPropagation()
                                      }
                                      placeholder={t(
                                        'setup-board.position-title',
                                        {
                                          number: index + 1,
                                        }
                                      )}
                                      className="w-full border-0 bg-transparent p-0 text-sm font-semibold text-slate-800 outline-none"
                                      aria-label={t(
                                        'setup-board.position-title',
                                        {
                                          number: index + 1,
                                        }
                                      )}
                                    />
                                    <div className="mt-1 flex items-center gap-2">
                                      <input
                                        value={draftFen}
                                        onChange={(event) => {
                                          event.stopPropagation();
                                          updateLessonPositionFenDraft(
                                            position.id,
                                            event.target.value
                                          );
                                        }}
                                        onClick={(event) =>
                                          event.stopPropagation()
                                        }
                                        onKeyDown={(event) => {
                                          event.stopPropagation();
                                          if (event.key === 'Enter') {
                                            saveLessonPositionFen(position.id);
                                          }
                                        }}
                                        className={`w-full border-0 bg-transparent p-0 text-xs outline-none ${
                                          isFenValid
                                            ? 'text-slate-400'
                                            : 'text-rose-500'
                                        }`}
                                        aria-label={t(
                                          'setup-board.edit-position-fen',
                                          {
                                            number: index + 1,
                                          }
                                        )}
                                      />
                                      <Tooltip
                                        content={t('setup-board.save-position')}
                                        placement="top"
                                      >
                                        <button
                                          type="button"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            saveLessonPositionFen(position.id);
                                          }}
                                          disabled={
                                            !isFenValid || !hasFenChanges
                                          }
                                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-emerald-600 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:text-slate-300"
                                          aria-label={t(
                                            'setup-board.save-position'
                                          )}
                                        >
                                          <VscCheck size={16} />
                                        </button>
                                      </Tooltip>
                                    </div>
                                  </div>
                                </button>
                                {isActive && (
                                  <span className="hidden rounded-full bg-blue-100 px-2 py-1 text-[11px] font-semibold text-blue-700 sm:inline-flex">
                                    {t('setup-board.current-position')}
                                  </span>
                                )}
                                <div className="flex shrink-0 items-center gap-1">
                                  <Tooltip
                                    content={t('setup-board.move-up')}
                                    placement="top"
                                  >
                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        moveLessonPosition(position.id, -1);
                                      }}
                                      disabled={index === 0}
                                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                                      aria-label={t('setup-board.move-up')}
                                    >
                                      <VscChevronUp size={16} />
                                    </button>
                                  </Tooltip>
                                  <Tooltip
                                    content={t('setup-board.move-down')}
                                    placement="top"
                                  >
                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        moveLessonPosition(position.id, 1);
                                      }}
                                      disabled={
                                        index === lessonPositions.length - 1
                                      }
                                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                                      aria-label={t('setup-board.move-down')}
                                    >
                                      <VscChevronDown size={16} />
                                    </button>
                                  </Tooltip>
                                  <Tooltip
                                    content={t(
                                      'setup-board.duplicate-position'
                                    )}
                                    placement="top"
                                  >
                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        duplicateLessonPosition(position.id);
                                      }}
                                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                                      aria-label={t(
                                        'setup-board.duplicate-position'
                                      )}
                                    >
                                      <VscCopy size={15} />
                                    </button>
                                  </Tooltip>
                                  <Tooltip
                                    content={t('setup-board.remove-position')}
                                    placement="top"
                                  >
                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        removeLessonPosition(position.id);
                                      }}
                                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-500"
                                      aria-label={t(
                                        'setup-board.remove-position'
                                      )}
                                    >
                                      <VscTrash size={15} />
                                    </button>
                                  </Tooltip>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3">
                      <Tooltip
                        content={t('setup-board.previous-position')}
                        placement="top"
                      >
                        <Button
                          color="gray"
                          onClick={() => {
                            if (!canGoToPreviousLesson) return;
                            loadLessonPosition(
                              lessonPositions[activeLessonIndex - 1]
                            );
                          }}
                          disabled={!canGoToPreviousLesson}
                        >
                          <VscArrowLeft size={18} />
                        </Button>
                      </Tooltip>
                      <Tooltip
                        content={t('setup-board.next-position')}
                        placement="top"
                      >
                        <Button
                          color="gray"
                          onClick={() => {
                            if (!canGoToNextLesson) return;
                            loadLessonPosition(
                              lessonPositions[activeLessonIndex + 1]
                            );
                          }}
                          disabled={!canGoToNextLesson}
                        >
                          <VscArrowRight size={18} />
                        </Button>
                      </Tooltip>
                      <Clipboard
                        valueToCopy={game.fen()}
                        label={t('common.button.copy-fen')}
                        className="px-2 py-[10px]"
                        theme={{
                          button: {
                            base: 'bg-light',
                            label: 'text-black',
                          },
                        }}
                      />
                      <Tooltip
                        content={t('common.navigation.analysis')}
                        placement="top"
                      >
                        <Button color="primary" onClick={analysis}>
                          <VscSearchFuzzy size={20} />
                        </Button>
                      </Tooltip>
                      <Tooltip
                        content={
                          isFullViewActive
                            ? t('common.button.exit-full-view')
                            : t('common.button.full-view')
                        }
                        placement="top"
                      >
                        <Button color="gray" onClick={toggleFullView}>
                          {isFullViewActive ? (
                            <VscScreenNormal size={20} />
                          ) : (
                            <VscScreenFull size={20} />
                          )}
                        </Button>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {isFullViewActive && (
              <div className="flex flex-col">
                <TeachingTimer compact />
                <div className="flex min-h-[200px] flex-1 items-center justify-center">
                  <Link
                    href="/"
                    aria-label="LIMA Chess home"
                    className="flex w-full max-w-[320px] flex-col items-center"
                  >
                    <Image
                      src="/images/Logo_LIMA.svg"
                      alt="LIMA Chess"
                      width={520}
                      height={156}
                      priority
                      className="h-20 w-auto"
                    />
                    <span className="text-center text-2xl font-semibold tracking-wide text-[var(--s-bg)]">
                      LIMA Chess
                    </span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
        <TeachingToolsDialog
          open={isTeachingToolsDialogOpen}
          onClose={() => setIsTeachingToolsDialogOpen(false)}
        />
      </div>
    </ChessboardDnDProvider>
  );
};

export default DragDropSetupChessboard;
