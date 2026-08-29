'use client';

import { MoveTagsDialog } from '@/components/MoveTagsDialog';
import { TeachingTimer } from '@/components/TeachingTimer';
import {
  DEFAULT_MOVE_ANNOTATIONS,
  MOVE_QUALITY_OPTIONS,
  MOVE_QUALITY_STYLES,
  MOVE_QUALITY_SYMBOLS,
} from '@/constants/move-annotations';
import { useAppContext } from '@/contexts/AppContext';
import { useCustomBoard } from '@/hooks/useCustomBoard';
import { useTeachingHighlights } from '@/hooks/useTeachingHighlights';
import { MoveAnnotation, MoveQuality } from '@/types/move-annotation';
import { LowercasePlayerName } from '@/types/player-name';
import { getActivePlayerFromFEN } from '@/utils/get-player-name-from-fen';
import { Chess, Move } from 'chess.js';
import { Button, Textarea, ToggleSwitch, Tooltip } from 'flowbite-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import type {
  CustomSquareProps,
  Square,
} from 'react-chessboard/dist/chessboard/types';
import {
  VscArrowCircleLeft,
  VscArrowCircleRight,
  VscChevronLeft,
  VscChevronRight,
  VscCloudDownload,
  VscCopy,
  VscLayoutPanel,
  VscScreenFull,
  VscScreenNormal,
  VscSearchFuzzy,
  VscTag,
} from 'react-icons/vsc';

const DEFAULT_PGN = `1.Nf3 Nf6 2.c4 g6 3.Nc3 Bg7 4.d4 O-O 5.Bf4 d5 6.Qb3 dxc4 7.Qxc4 c6 8.e4 Nbd7
9.Rd1 Nb6 10.Qc5 Bg4 11.Bg5 Na4 12.Qa3 Nxc3 13.bxc3 Nxe4 14.Bxe7 Qb6 15.Bc4 Nxc3
16.Bc5 Rfe8+ 17.Kf1 Be6 18.Bxb6 Bxc4+ 19.Kg1 Ne2+ 20.Kf1 Nxd4+ 21.Kg1 Ne2+
22.Kf1 Nc3+ 23.Kg1 axb6 24.Qb4 Ra4 25.Qxb6 Nxd1 26.h3 Rxa2 27.Kh2 Nxf2 28.Re1 Rxe1
29.Qd8+ Bf8 30.Nxe1 Bd5 31.Nf3 Ne4 32.Qb8 b5 33.h4 h5 34.Ne5 Kg7 35.Kg1 Bc5+
36.Kf1 Ng3+ 37.Ke1 Bb4+ 38.Kd1 Bb3+ 39.Kc1 Ne2+ 40.Kb1 Nc3+ 41.Kc1 Rc2+  0-1`;

const MOVE_ANIMATION_DELAY_MS = 450;
const MOVE_ANNOTATION_LABEL_DURATION_MS = 2000;
const MOVE_ANNOTATION_ICON_DELAY_MS =
  MOVE_ANIMATION_DELAY_MS + MOVE_ANNOTATION_LABEL_DURATION_MS;

export const EvaluateMoves = () => {
  const { customPieces, bgDark, bgLight, notationColor, notationShadow } =
    useCustomBoard();
  const { isMobile } = useAppContext();
  const fullViewRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const [currentFen, setCurrentFen] = useState('');
  const [startFen, setStartFen] = useState('');
  const [pgnMoves, setPgnMoves] = useState<Move[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState<number>(0);
  const [pgnText, setPgnText] = useState<string>(DEFAULT_PGN);
  const [moveAnnotations, setMoveAnnotations] = useState<MoveAnnotation[]>(
    DEFAULT_MOVE_ANNOTATIONS
  );
  const [showPGNBox, setShowPGNBox] = useState<boolean>(true);
  const [isMoveTagsDialogOpen, setIsMoveTagsDialogOpen] = useState(false);
  const [isFullViewMode, setIsFullViewMode] = useState(false);
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(false);
  const [boardContainerWidth, setBoardContainerWidth] = useState(500);
  const [viewportHeight, setViewportHeight] = useState(900);
  const [showSquareAnnotationLabel, setShowSquareAnnotationLabel] =
    useState(false);
  const [showSquareAnnotationIcon, setShowSquareAnnotationIcon] =
    useState(false);
  useState(false);
  const t = useTranslations();
  const getPieceAtSquare = useCallback((square: Square) => {
    const piece = gameRef.current.get(square);

    if (!piece) {
      return null;
    }

    return `${piece.color}${piece.type.toUpperCase()}` as const;
  }, []);
  const {
    boardRenderKey,
    selectedColor,
    customSquareStyles,
    handleSquareClick,
    handleSquareRightClick,
    handleArrowsChange,
    boardInteractionProps,
  } = useTeachingHighlights({ getPieceAtSquare });

  const gameRef = useRef(new Chess());

  const playerName: LowercasePlayerName = useMemo(() => {
    return getActivePlayerFromFEN(
      startFen
    )?.toLowerCase() as LowercasePlayerName;
  }, [startFen]);

  const [boardOrientation, setBoardOrientation] =
    useState<LowercasePlayerName>('white');

  useEffect(() => {
    setBoardOrientation(playerName);
  }, [playerName]);

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

  useEffect(() => {
    const game = gameRef.current;
    game.reset();

    if (game.load_pgn(pgnText)) {
      const headers = game.header();

      // Determine start position (custom or standard)
      const initialFen =
        headers.SetUp === '1' && headers.FEN
          ? headers.FEN
          : (() => {
              game.reset();
              return game.fen();
            })();

      setStartFen(initialFen);

      game.load_pgn(pgnText);
      const allMoves = game.history({ verbose: true });
      for (const move of allMoves) game.move(move); // ⚠️ applies all moves
      setCurrentFen(game.fen()); // final state, not initial

      setPgnMoves(allMoves);
      setCurrentMoveIndex(0);
      setMoveAnnotations((currentAnnotations) =>
        currentAnnotations.filter(
          (annotation) =>
            annotation.ply >= 1 && annotation.ply <= allMoves.length
        )
      );
    }
  }, [pgnText]);

  const onNext = () => {
    if (currentMoveIndex < pgnMoves.length) {
      gameRef.current.move(pgnMoves[currentMoveIndex]);
      setCurrentMoveIndex((prev) => prev + 1);
      setCurrentFen(gameRef.current.fen());
    }
  };

  const onPrev = () => {
    if (currentMoveIndex > 0) {
      gameRef.current.undo();
      setCurrentMoveIndex((prev) => prev - 1);
      setCurrentFen(gameRef.current.fen());
    }
  };

  const onFirst = () => {
    console.log('startFen', startFen);
    if (startFen) {
      gameRef.current.load(startFen);
      setCurrentMoveIndex(0);
      setCurrentFen(startFen); // ✅ this triggers the Chessboard to update
    }
  };

  const onLast = () => {
    gameRef.current.reset();
    if (startFen) gameRef.current.load(startFen);
    for (let i = 0; i < pgnMoves.length; i++) {
      gameRef.current.move(pgnMoves[i]);
    }
    setCurrentMoveIndex(pgnMoves.length);
    setCurrentFen(gameRef.current.fen());
  };

  const analysis = useCallback(() => {
    window.open(`/analysis?fen=${gameRef.current.fen()}`, '_blank');
  }, [gameRef]);

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        console.log('Copied to clipboard:', text);
        // Optionally, you can show a toast or some visual feedback here
      })
      .catch((err) => console.error('Failed to copy:', err));
  }, []);

  const onDownloadPgn = useCallback(() => {
    const pgn = gameRef.current.pgn(); // Get PGN from the game instance

    if (!pgn) {
      console.error('No PGN data available');
      return;
    }

    const blob = new Blob([pgn], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'puzzle.pgn';
    document.body.appendChild(a);
    a.click();

    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [gameRef]);

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
  const boardWidth = useMemo(() => {
    if (isFullViewActive) {
      const maxSquareByHeight = Math.max(320, viewportHeight - 220);
      return Math.max(280, Math.min(boardContainerWidth, maxSquareByHeight));
    }

    if (isMobile) {
      return boardContainerWidth || 320;
    }

    return Math.min(boardContainerWidth || 500, 500);
  }, [boardContainerWidth, isFullViewActive, isMobile, viewportHeight]);

  const notationStyle = useMemo(
    () => ({
      fontSize: isFullViewActive ? boardWidth / 30 : boardWidth / 42,
      fontWeight: 700,
      color: notationColor,
      textShadow: notationShadow,
    }),
    [boardWidth, isFullViewActive, notationColor, notationShadow]
  );

  const currentMoveAnnotation = useMemo(() => {
    if (currentMoveIndex <= 0) return null;
    return (
      moveAnnotations.find(
        (annotation) => annotation.ply === currentMoveIndex
      ) ?? null
    );
  }, [currentMoveIndex, moveAnnotations]);

  const currentMoveLabel = currentMoveAnnotation
    ? t(`common.move-quality.${currentMoveAnnotation.quality}`)
    : null;

  const getMoveQualityLabel = useCallback(
    (quality: MoveQuality) => t(`common.move-quality.${quality}`),
    [t]
  );

  const currentMove = useMemo(() => {
    if (currentMoveIndex <= 0) return null;
    return pgnMoves[currentMoveIndex - 1] ?? null;
  }, [currentMoveIndex, pgnMoves]);

  const currentAnnotationSquare = currentMoveAnnotation
    ? currentMove?.to
    : null;

  useEffect(() => {
    if (!currentMoveAnnotation || !currentAnnotationSquare) {
      setShowSquareAnnotationLabel(false);
      setShowSquareAnnotationIcon(false);
      return;
    }

    setShowSquareAnnotationLabel(false);
    setShowSquareAnnotationIcon(false);

    const labelTimeoutId = window.setTimeout(() => {
      setShowSquareAnnotationLabel(true);
    }, MOVE_ANIMATION_DELAY_MS);

    const iconTimeoutId = window.setTimeout(() => {
      setShowSquareAnnotationIcon(true);
    }, MOVE_ANNOTATION_ICON_DELAY_MS);

    const hideLabelTimeoutId = window.setTimeout(() => {
      setShowSquareAnnotationLabel(false);
    }, MOVE_ANIMATION_DELAY_MS + MOVE_ANNOTATION_LABEL_DURATION_MS);

    return () => {
      window.clearTimeout(labelTimeoutId);
      window.clearTimeout(iconTimeoutId);
      window.clearTimeout(hideLabelTimeoutId);
    };
  }, [currentAnnotationSquare, currentMoveAnnotation, currentMoveIndex]);

  const moveOptions = useMemo(
    () =>
      pgnMoves.map((move, index) => ({
        ply: index + 1,
        label: `${Math.floor(index / 2) + 1}${index % 2 === 0 ? '.' : '...'} ${move.san}`,
      })),
    [pgnMoves]
  );

  const addMoveAnnotation = useCallback(() => {
    setMoveAnnotations((currentAnnotations) => [
      ...currentAnnotations,
      {
        ply: currentAnnotations.at(-1)?.ply ?? 1,
        quality: 'brilliant',
        note: '',
      },
    ]);
  }, []);

  const updateMoveAnnotation = useCallback(
    (index: number, patch: Partial<MoveAnnotation>) => {
      setMoveAnnotations((currentAnnotations) =>
        currentAnnotations.map((annotation, annotationIndex) =>
          annotationIndex === index ? { ...annotation, ...patch } : annotation
        )
      );
    },
    []
  );

  const removeMoveAnnotation = useCallback((index: number) => {
    setMoveAnnotations((currentAnnotations) =>
      currentAnnotations.filter(
        (_annotation, annotationIndex) => annotationIndex !== index
      )
    );
  }, []);

  const CustomAnnotatedSquare = useCallback(
    ({ children, ref, square, squareColor, style }: CustomSquareProps) => {
      const isAnnotatedSquare =
        Boolean(currentAnnotationSquare) && square === currentAnnotationSquare;
      const annotationStyle = currentMoveAnnotation
        ? MOVE_QUALITY_STYLES[currentMoveAnnotation.quality]
        : null;
      const showLabel =
        isAnnotatedSquare &&
        currentMoveAnnotation &&
        currentMoveLabel &&
        showSquareAnnotationLabel;

      return (
        <div
          ref={ref}
          style={style}
          data-square={square}
          data-square-color={squareColor}
          className="relative"
        >
          {children}
          {isAnnotatedSquare && currentMoveAnnotation && annotationStyle && (
            <div
              className={`pointer-events-none absolute -right-[10%] -top-[10%] z-20 transition-all duration-200 ${
                showSquareAnnotationIcon
                  ? 'translate-x-0 translate-y-0 opacity-100'
                  : 'translate-x-1 -translate-y-1 opacity-0'
              }`}
            >
              <div
                className={`flex h-[26%] min-h-7 min-w-7 items-center justify-center rounded-full px-1.5 text-[clamp(0.7rem,1vw,0.9rem)] font-extrabold shadow-lg ring-2 ring-white/80 ${annotationStyle.square}`}
              >
                {MOVE_QUALITY_SYMBOLS[currentMoveAnnotation.quality]}
              </div>
            </div>
          )}
          {showLabel && annotationStyle && (
            <div className="pointer-events-none absolute -top-[18%] left-1/2 z-10 flex -translate-x-1/2 justify-center">
              <div
                className={`whitespace-nowrap rounded-full px-3 py-1 text-[clamp(0.72rem,1vw,0.95rem)] font-extrabold shadow-lg ring-2 ring-white/80 ${annotationStyle.square}`}
              >
                {MOVE_QUALITY_SYMBOLS[currentMoveAnnotation.quality]}{' '}
                {currentMoveLabel}
              </div>
            </div>
          )}
        </div>
      );
    },
    [
      currentAnnotationSquare,
      currentMoveAnnotation,
      currentMoveLabel,
      showSquareAnnotationIcon,
      showSquareAnnotationLabel,
    ]
  );

  return (
    <div
      ref={fullViewRef}
      className={
        isFullViewActive
          ? 'fixed inset-0 z-50 overflow-auto bg-slate-900 px-3 py-4 sm:p-6'
          : 'mx-auto max-w-[900px] p-4'
      }
    >
      <div
        className={
          isFullViewActive
            ? 'mx-auto grid max-w-[1280px] grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start'
            : 'grid grid-cols-1 gap-4 lg:grid-cols-[500px_auto]'
        }
      >
        <div ref={boardRef}>
          <div {...boardInteractionProps} className="outline-none">
            <Chessboard
              key={boardRenderKey}
              boardOrientation={boardOrientation}
              boardWidth={boardWidth}
              position={currentFen}
              customPieces={customPieces}
              customSquare={CustomAnnotatedSquare}
              customSquareStyles={customSquareStyles}
              customArrowColor={selectedColor.arrow}
              customNotationStyle={notationStyle}
              customDarkSquareStyle={{ backgroundColor: bgDark }}
              customLightSquareStyle={{ backgroundColor: bgLight }}
              customBoardStyle={{
                borderRadius: '4px',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
              }}
              onSquareClick={handleSquareClick}
              onSquareRightClick={handleSquareRightClick}
              onArrowsChange={handleArrowsChange}
            />
          </div>
          <div className="flex justify-center space-x-2 mt-4">
            <Button color="gray" onClick={onFirst}>
              <VscArrowCircleLeft size={20} />
            </Button>
            <Button color="gray" onClick={onPrev}>
              <VscChevronLeft size={20} />
            </Button>
            <Button color="gray" onClick={onNext}>
              <VscChevronRight size={20} />
            </Button>
            <Button color="gray" onClick={onLast}>
              <VscArrowCircleRight size={20} />
            </Button>
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
            <Tooltip content="Move Tags" placement="top">
              <Button
                color="gray"
                onClick={() => setIsMoveTagsDialogOpen(true)}
              >
                <VscTag size={20} />
              </Button>
            </Tooltip>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded border bg-white p-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold">PGN Viewer</h2>
              <ToggleSwitch
                checked={showPGNBox}
                onChange={setShowPGNBox}
                label="Show PGN Box"
              />
            </div>
            {showPGNBox && (
              <Textarea
                className="w-full text-sm"
                rows={15}
                value={pgnText}
                onChange={(e) => setPgnText(e.target.value)}
                placeholder="Paste your PGN here"
              />
            )}
            <div className="mt-4 flex w-full justify-center">
              <Tooltip content={t('common.button.copy-fen')} placement="top">
                <Button
                  color="gray"
                  onClick={() => handleCopy(gameRef.current.fen())}
                >
                  <VscCopy size={20} />
                </Button>
              </Tooltip>
              <Tooltip content={t('common.button.flip-board')} placement="top">
                <Button
                  className="ml-4"
                  color="gray"
                  onClick={() => {
                    setBoardOrientation(
                      boardOrientation === 'white' ? 'black' : 'white'
                    );
                  }}
                >
                  <VscLayoutPanel size={20} />
                </Button>
              </Tooltip>
              <Tooltip content={t('common.button.pgn-file')} placement="top">
                <Button className="ml-4" color="gray" onClick={onDownloadPgn}>
                  <VscCloudDownload size={20} />
                </Button>
              </Tooltip>
              <Button color="primary" onClick={analysis} className="ml-4">
                <VscSearchFuzzy size={20} />
              </Button>
            </div>
          </div>

          <TeachingTimer compact />

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
                <span className="text-center text-4xl font-semibold tracking-wide text-[var(--s-bg)]">
                  LIMA Chess
                </span>
              </Link>
            </div>
          )}
        </div>
      </div>
      <MoveTagsDialog
        open={isMoveTagsDialogOpen}
        onClose={() => setIsMoveTagsDialogOpen(false)}
        moveAnnotations={moveAnnotations}
        moveOptions={moveOptions}
        onAddTag={addMoveAnnotation}
        onUpdateAnnotation={updateMoveAnnotation}
        onRemoveAnnotation={removeMoveAnnotation}
        moveQualityOptions={MOVE_QUALITY_OPTIONS}
        getMoveQualityLabel={getMoveQualityLabel}
      />
    </div>
  );
};
