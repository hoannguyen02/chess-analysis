/* eslint-disable @typescript-eslint/ban-ts-comment */
'use client';

import DebouncedInput from '@/components/DebounceInput';
import { useAppContext } from '@/contexts/AppContext';
import { useCustomBoard } from '@/hooks/useCustomBoard';
import { LowercasePlayerName } from '@/types/player-name';
import { getActivePlayerFromFEN } from '@/utils/get-player-name-from-fen';
import { Chess, Square } from 'chess.js';
import { Button, Dropdown, Tooltip } from 'flowbite-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import {
  VscChevronLeft,
  VscCloudDownload,
  VscCopy,
  VscLayoutPanel,
  VscScreenFull,
  VscScreenNormal,
  VscSync,
} from 'react-icons/vsc';

const DEFAULT_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'; // Default starting position

export const AnalysisScreen = () => {
  const { customPieces, bgDark, bgLight } = useCustomBoard();
  const router = useRouter();
  const { isMobile } = useAppContext();
  const fullViewRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const t = useTranslations();
  const [engine, setEngine] = useState<Worker | null>(null);
  const queryFen = useMemo(
    () => (router.query.fen as string) || DEFAULT_FEN,
    [router]
  );
  const [currentFen, setCurrentFen] = useState(queryFen);
  const game = useMemo(() => new Chess(queryFen), [queryFen]);

  const playerName: LowercasePlayerName = useMemo(() => {
    return !queryFen
      ? 'white'
      : (getActivePlayerFromFEN(
          queryFen
        )?.toLocaleLowerCase() as LowercasePlayerName);
  }, [queryFen]);

  const [boardOrientation, setBoardOrientation] =
    useState<LowercasePlayerName>('white');
  const [positionEvaluation, setPositionEvaluation] = useState(0);
  const [depth, setDepth] = useState(18);
  const [bestLine, setBestline] = useState('');
  const [possibleMate, setPossibleMate] = useState('');
  const [isFullViewMode, setIsFullViewMode] = useState(false);
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(false);
  const [boardContainerWidth, setBoardContainerWidth] = useState(500);
  const [viewportHeight, setViewportHeight] = useState(900);

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
    try {
      console.log('Initializing Stockfish...');
      // Use absolute URL for the worker
      const workerUrl = new URL(
        '/stockfish/stockfish-17-lite.js',
        window.location.origin
      );
      const stockfish = new Worker(workerUrl, {
        /* type: 'classic' */
      });

      stockfish.onmessage = (event) => {
        console.log('Stockfish message:', event.data);
      };

      stockfish.postMessage('uci'); // Send a test command
      setEngine(stockfish);
      console.log('Stockfish initialized:', stockfish);
    } catch (error) {
      console.error('Failed to initialize Stockfish:', error);
    }

    return () => {
      if (engine) {
        engine.terminate();
        console.log('Stockfish worker terminated.');
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Run findBestMove only when the engine is set and currentFen changes
  useEffect(() => {
    if (engine && currentFen) {
      console.log('Engine is ready. Finding best move...');
      findBestMove();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, currentFen]);

  function findBestMove(depthChange?: number) {
    if (!engine) return;

    engine.postMessage(`position fen ${currentFen}`);
    engine.postMessage(`go depth ${depthChange || depth}`);

    engine.onmessage = (event) => {
      const message = event.data;
      console.log('Stockfish response:', message);

      // Extract depth
      const depthMatch = message.match(/depth (\d+)/);
      if (depthMatch) {
        setDepth(Number(depthMatch[1]));
      }

      // Extract position evaluation (Score)
      const evalMatch = message.match(/score cp (-?\d+)/);
      if (evalMatch) {
        const evaluation = Number(evalMatch[1]) / 100; // Convert centipawns to standard evaluation
        setPositionEvaluation(game.turn() === 'w' ? evaluation : -evaluation); // Flip for black
      }

      // Handle mate in X moves
      const mateMatch = message.match(/score mate (-?\d+)/);
      if (mateMatch) {
        setPossibleMate(mateMatch[1]); // Set mate in X moves
      }

      // Capture best line (PV)
      const pvMatch = message.match(/ pv (.+)/);
      if (pvMatch) {
        setBestline(pvMatch[1]);
      }
    };
  }

  function onDrop(sourceSquare: Square, targetSquare: Square, piece: any) {
    const move = game.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: piece[1].toLowerCase() ?? 'q',
    });
    setPossibleMate('');
    const fen = game.fen();
    setCurrentFen(fen);

    // illegal move
    if (move === null) return false;

    engine?.postMessage('stop');

    setBestline('');

    if (game.game_over() || game.in_draw()) return false;

    return true;
  }

  const bestMove = bestLine?.split(' ')?.[0];

  const handleFenInputChange = (value: string) => {
    const { valid } = game.validate_fen(value);

    if (valid) {
      const fen = value || game.fen();
      setCurrentFen(fen);
      game.load(fen);
    }
  };

  const onResetBoard = () => {
    game.load(queryFen);
    setCurrentFen(queryFen);
  };

  const onDownloadPgn = () => {
    const pgn = game.pgn(); // Get PGN from the game instance

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
  };

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        console.log('Copied to clipboard:', text);
        // Optionally, you can show a toast or some visual feedback here
      })
      .catch((err) => console.error('Failed to copy:', err));
  }, []);

  const onDepthChange = (value: number) => {
    setDepth(value);
    findBestMove(value);
  };

  const handleUndo = () => {
    game.undo();
    setCurrentFen(game.fen());
  };

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

  return (
    <div
      ref={fullViewRef}
      className={
        isFullViewActive
          ? 'fixed inset-0 z-50 overflow-auto bg-slate-900 px-3 py-4 sm:p-6'
          : 'mx-auto max-w-[900px] p-4'
      }
    >
      <div className="mx-auto mb-4 flex w-full max-w-[500px]">
        <DebouncedInput
          onChange={handleFenInputChange}
          initialValue={currentFen}
          placeholder="Paste FEN to start analysing custom position"
        />
      </div>
      <div
        className={
          isFullViewActive
            ? 'mx-auto grid max-w-[1280px] grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start'
            : 'mx-auto grid max-w-[900px] grid-cols-1 gap-2 lg:grid-cols-[500px_auto] lg:gap-4'
        }
      >
        <div ref={boardRef}>
          <Chessboard
            boardOrientation={boardOrientation}
            boardWidth={boardWidth}
            position={currentFen}
            onPieceDrop={onDrop}
            customPieces={customPieces}
            customDarkSquareStyle={{
              backgroundColor: bgDark,
            }}
            customLightSquareStyle={{
              backgroundColor: bgLight,
            }}
            customBoardStyle={{
              borderRadius: '4px',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
            }}
            // @ts-ignore
            customArrows={
              bestMove && [
                [
                  bestMove.substring(0, 2) as Square,
                  bestMove.substring(2, 4) as Square,
                  '#0000FF',
                ],
              ]
            }
          />
          <div className="mt-4 flex justify-center">
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
        <div className="flex flex-col gap-4">
          <div
            className={
              isFullViewActive
                ? 'relative rounded border bg-white p-4'
                : 'relative rounded p-4 lg:border-[1px]'
            }
          >
            <div className="flex items-center space-x-2">
              <Dropdown label={`${t('analysis.depth')} ${depth}`} inline>
                {[12, 14, 16, 18, 20, 25, 30].map((d) => (
                  <Dropdown.Item key={d} onClick={() => onDepthChange(d)}>
                    {d}
                  </Dropdown.Item>
                ))}
              </Dropdown>
            </div>

            <p className="mt-2 text-gray-700 dark:text-gray-300">
              {t('analysis.position-evaluation')}{' '}
              <span
                className={
                  positionEvaluation > 0 ? 'text-green-500' : 'text-red-500'
                }
              >
                {possibleMate ? `#${possibleMate}` : positionEvaluation}
              </span>
            </p>

            <p className="mt-2 text-gray-700 dark:text-gray-300">
              {t('analysis.best-line')}{' '}
              <span className="font-mono text-blue-600 dark:text-blue-400">
                {bestLine.slice(0, 40)}...
              </span>
            </p>

            <div className="mt-6 grid grid-cols-5 gap-4">
              <Tooltip content={t('common.button.copy-fen')} placement="top">
                <Button color="gray" onClick={() => handleCopy(game.fen())}>
                  <VscCopy size={20} />
                </Button>
              </Tooltip>
              <Tooltip content={t('common.button.flip-board')} placement="top">
                <Button
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
              <Tooltip content={t('common.button.restart')} placement="top">
                <Button color="gray" onClick={onResetBoard}>
                  <VscSync size={20} />
                </Button>
              </Tooltip>
              <Tooltip content={t('common.button.pgn-file')} placement="top">
                <Button color="gray" onClick={onDownloadPgn}>
                  <VscCloudDownload size={20} />
                </Button>
              </Tooltip>
              <Tooltip content={t('analysis.undo')} placement="top">
                <Button color="gray" onClick={handleUndo}>
                  <VscChevronLeft size={20} />
                </Button>
              </Tooltip>
            </div>
          </div>

          {isFullViewActive && (
            <div className="flex min-h-[320px] flex-1 items-center justify-center">
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
                  className="h-80 w-auto"
                />
                <span className="text-center text-4xl font-semibold tracking-wide text-[var(--s-bg)]">
                  LIMA Chess
                </span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
