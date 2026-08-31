import { TeachingTimer } from '@/components/TeachingTimer';
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
  VscScreenFull,
  VscScreenNormal,
  VscSearchFuzzy,
} from 'react-icons/vsc';

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
const DragDropSetupChessboard = ({
  fen = '8/8/8/8/8/8/8/8 w - - 0 1',
  isGuide = false,
}: Props) => {
  const [castlingRights, setCastlingRights] = useState({
    K: false, // White Kingside
    Q: false, // White Queenside
    k: false, // Black Kingside
    q: false, // Black Queenside
  });

  const { boardTheme, isMobile, setBoardTheme } = useAppContext();
  const t = useTranslations();
  const { customPieces, bgDark, bgLight, notationColor, notationShadow } =
    useCustomBoard();
  const game = useMemo(() => new Chess(fen), [fen]); // empty board
  const getOrientationFromTurn = useCallback(
    () => (game.turn() === 'w' ? 'white' : 'black'),
    [game]
  );
  const [boardOrientation, setBoardOrientation] =
    useState<LowercasePlayerName>(getOrientationFromTurn);
  const [fenPosition, setFenPosition] = useState(fen);
  const [isFullViewMode, setIsFullViewMode] = useState(false);
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(false);
  const [boardContainerWidth, setBoardContainerWidth] = useState(500);
  const [viewportHeight, setViewportHeight] = useState(900);
  const [isTeachingToolsDialogOpen, setIsTeachingToolsDialogOpen] =
    useState(false);
  const fullViewRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const getPieceAtSquare = useCallback((square: Square) => {
    const piece = game.get(square);

    if (!piece) {
      return null;
    }

    return `${piece.color}${piece.type.toUpperCase()}` as const;
  }, [game]);
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

  useEffect(() => {
    setBoardOrientation(getOrientationFromTurn());
  }, [getOrientationFromTurn]);

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
    const fen = e.target.value;
    const { valid } = game.validate_fen(fen);

    setFenPosition(fen);
    if (valid) {
      game.load(fen);
      setFenPosition(game.fen());
      setBoardOrientation(getOrientationFromTurn());
      clearHighlights();
    }
  };

  const setTurn = (turn: 'w' | 'b') => {
    let fen = game.fen();
    fen = fen.replace(/ [wb] /, ` ${turn} `);

    const isValid = game.load(fen);
    if (isValid) {
      setFenPosition(game.fen());
      setBoardOrientation(getOrientationFromTurn());
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
        setFenPosition(newFen);
      }

      return updatedRights;
    });
  };

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
                  display: 'flex',
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
                  display: 'flex',
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
              <div className="mx-auto grid w-full grid-cols-3 gap-2">
                <Button
                  onClick={() => {
                    game.reset();
                    setFenPosition(game.fen());
                    setBoardOrientation(getOrientationFromTurn());
                    clearHighlights();
                  }}
                  outline
                  gradientDuoTone="cyanToBlue"
                >
                  {t('setup-board.start-position')}
                </Button>
                <Button
                  onClick={() => {
                    game.clear();
                    setFenPosition(game.fen());
                    setBoardOrientation(getOrientationFromTurn());
                    clearHighlights();
                  }}
                  outline
                  gradientDuoTone="pinkToOrange"
                >
                  {t('setup-board.clear-board')}
                </Button>
                <Button
                  onClick={onFlipBoard}
                  outline
                  gradientDuoTone="purpleToBlue"
                >
                  {t('setup-board.flip-board')}
                </Button>
              </div>

              {!isGuide && (
                <div className="mt-8 flex flex-col gap-6">
                  <TeachingTimer compact />

                  <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">
                        {t('setup-board.board-theme')}
                      </p>
                      <p className="text-sm text-slate-500">
                        {BOARD_THEMES.find((theme) => theme.id === boardTheme)
                          ?.labelKey
                          ? t(
                              BOARD_THEMES.find(
                                (theme) => theme.id === boardTheme
                              )!.labelKey
                            )
                          : ''}
                      </p>
                    </div>
                    <Dropdown
                      label={t('setup-board.board-theme-settings')}
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
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="font-semibold text-gray-700">
                        {t('setup-board.white-castling')}
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        <Checkbox
                          checked={castlingRights.K}
                          onChange={() => handleCastlingChange('K')}
                        />
                        <label className="text-xs">
                          {t('setup-board.king-side')} (O-O)
                        </label>
                        <Checkbox
                          checked={castlingRights.Q}
                          onChange={() => handleCastlingChange('Q')}
                        />
                        <label className="text-xs">
                          {t('setup-board.queen-side')} (O-O-O)
                        </label>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="font-semibold text-gray-700">
                        {t('setup-board.black-castling')}
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        <Checkbox
                          checked={castlingRights.k}
                          onChange={() => handleCastlingChange('k')}
                        />
                        <label className="text-xs">
                          {t('setup-board.king-side')} (O-O)
                        </label>
                        <Checkbox
                          checked={castlingRights.q}
                          onChange={() => handleCastlingChange('q')}
                        />
                        <label className="text-xs">
                          {t('setup-board.queen-side')} (O-O-O)
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <label className="mb-2 font-semibold text-gray-700">
                      {t('setup-board.next-player-to-move')}
                    </label>
                    <div className="flex items-center">
                      <Button
                        className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
                          game.turn() === 'w'
                            ? 'bg-blue-500 text-white shadow-lg'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                        onClick={() => {
                          setTurn('w');
                        }}
                      >
                        {t('common.title.white')}
                      </Button>
                      <Button
                        className={`ml-2 flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
                          game.turn() === 'b'
                            ? 'bg-blue-500 text-white shadow-lg'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                        onClick={() => {
                          setTurn('b');
                        }}
                      >
                        {t('common.title.black')}
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <TextInput
                      className="w-full rounded"
                      value={fenPosition}
                      onChange={handleFenInputChange}
                      placeholder="Paste FEN position to start editing"
                    />
                    <div className="flex items-center justify-center">
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
                        <Button
                          color="primary"
                          onClick={analysis}
                          className="ml-4"
                        >
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
                        <Button
                          color="gray"
                          onClick={toggleFullView}
                          className="ml-4"
                        >
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
