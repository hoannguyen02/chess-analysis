/* eslint-disable @typescript-eslint/ban-ts-comment */
import { LEVEL_RATING } from '@/constants';
import {
  DEFAULT_ENGINE_MOVE_DELAY_TIME,
  DEFAULT_SOLUTION_DELAY_TIME,
} from '@/constants/time-out';
import { useAppContext } from '@/contexts/AppContext';
import { useCustomBoard } from '@/hooks/useCustomBoard';
import { PromotionType } from '@/types/promotion';
import { Puzzle, PuzzlePreMove, SolvedData } from '@/types/puzzle';
import { getActivePlayerFromFEN } from '@/utils/get-player-name-from-fen';
import { Chess } from 'chess.js';
import { Button, Tooltip } from 'flowbite-react';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Chessboard } from 'react-chessboard';
import { Square } from 'react-chessboard/dist/chessboard/types';
import {
  VscCheckAll,
  VscChevronLeft,
  VscChevronRight,
  VscError,
  VscLightbulbSparkle,
  VscPass,
  VscSearchFuzzy,
  VscSync,
} from 'react-icons/vsc';
import ConfettiEffect from './ConfettiEffect';
import ElapsedTimer from './ElapsedTimer';

const BookmarkButton = dynamic(() =>
  import('./BookmarkButton').then((components) => components.BookmarkButton)
);

type PuzzleProps = {
  puzzle: Puzzle;
  highlightPossibleMoves?: boolean;
  showNextButton?: boolean;
  onNextClick?(): void;
  showCloseButton?: boolean;
  onCloseClick?(): void;
  onSolved?(data?: SolvedData): void;
  showTimer?: boolean;
  isPreview?: boolean;
  actionClass?: string;
  showCustomArrows?: boolean;
  showBookmark?: boolean;
};

export type HistoryMove = {
  move: string;
  player: 'user' | 'engine';
  from: string;
  to: string;
};

type AttemptHistory = {
  correct: boolean;
  usedHint: boolean;
  timeTaken: number;
  move: string;
};

const SolvePuzzle: React.FC<PuzzleProps> = ({
  puzzle,
  highlightPossibleMoves = false,
  showNextButton = false,
  onNextClick,
  onSolved,
  showCloseButton = false,
  onCloseClick,
  showTimer = true,
  isPreview = true,
  actionClass = '',
  showCustomArrows = false,
  showBookmark = false,
}) => {
  const moveSound = useRef<HTMLAudioElement | null>(null);
  const captureSound = useRef<HTMLAudioElement | null>(null);
  const checkSound = useRef<HTMLAudioElement | null>(null);
  const failedSound = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    moveSound.current = new Audio('/sounds/move.mp3');
    captureSound.current = new Audio('/sounds/capture.mp3');
    checkSound.current = new Audio('/sounds/check.mp3');
    failedSound.current = new Audio('/sounds/decline.mp3');
  }, []);

  const [isUserClickedOnAnySquare, setIsUserClickedOnAnySquare] =
    useState(false);

  const [isPreMoveDone, setIsPreMoveDone] = useState(false);

  const t = useTranslations();
  const { themeMap, isMobile, locale, isLoggedIn, isAdminRole } =
    useAppContext();
  const router = useRouter();
  const { customPieces, bgDark, bgLight } = useCustomBoard();
  const game = useMemo(() => new Chess(puzzle.fen), [puzzle.fen]);
  const [currentTimeout, setCurrentTimeout] = useState<NodeJS.Timeout>();

  const [currentFen, setCurrentFen] = useState<string>(puzzle.fen);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [moveFrom, setMoveFrom] = useState<Square | null>(null);
  const [moveTo, setMoveTo] = useState<Square | null>(null);
  // We use moveToRef as a replacement for moveTo above incase setMoveTo not work well when promotion dialog show up
  const moveToRef = useRef<Square | null>(null);
  const [showRetry, setShowRetry] = useState<boolean>(false);
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);
  const [rightClickedSquares, setRightClickedSquares] = useState<
    Record<string, any>
  >({});
  const [optionSquares, setOptionSquares] = useState<Record<string, any>>({});
  const [moveSquareStyle, setMoveSquareStyle] = useState<Record<string, any>>(
    {}
  );

  //  Only show back/forward buttons if puzzle is done, either by normal solved or by solution
  const [historyMoveCurrentIdx, setHistoryMoveCurrentIdx] = useState<number>(0);
  const [historyMoves, setHistoryMoves] = useState<HistoryMove[]>([]);
  const [isBoardClickAble, setIsBoardClickAble] = useState<boolean>(true);
  const [hintMessage, setHintMessage] = useState<ReactNode | ''>('');
  const boardRef = useRef<HTMLDivElement>(null);

  const [isRunning, setIsRunning] = useState(true);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [hintUsed, setHintUsed] = useState(false);
  const hasCalledApi = useRef(false);
  // attemptHistory adjust rating when puzzle is solved/quit
  const [attemptHistory, setAttemptHistory] = useState<AttemptHistory[]>([]);

  const isCurrentStepReachSolutionLength = useMemo(
    () => currentStep === puzzle.solutions.length,
    [currentStep, puzzle.solutions.length]
  );

  const startTimer = () => {
    setStartTime(Date.now());
    setIsRunning(true);
  };

  const handleOnSolved = useCallback(
    (finalAttemptHistory: AttemptHistory[]) => {
      setIsRunning(false);
      if (finalAttemptHistory.length > 0) {
        const usedHint = finalAttemptHistory.some(
          (attempt) => attempt.usedHint
        );
        const totalTimeTaken = finalAttemptHistory.reduce(
          (acc, attempt) => acc + attempt.timeTaken,
          0
        );
        const failedAttempts = finalAttemptHistory.filter(
          (attempt) => !attempt.correct
        ).length;

        if (onSolved) {
          onSolved({
            usedHint,
            timeTaken: totalTimeTaken,
            failedAttempts,
          });
        }
      }
    },
    [onSolved]
  );

  useEffect(() => {
    if (isPreview) return;

    const handleExitEvent = () => {
      if (!hasCalledApi.current && currentStep < puzzle.solutions.length) {
        hasCalledApi.current = true;
        handleOnSolved(attemptHistory);
      }
    };

    const handleRouteChange = (url: string) => {
      if (url !== router.asPath && currentStep < puzzle.solutions.length) {
        handleExitEvent();
      }
    };

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (currentStep < puzzle.solutions.length) {
        handleExitEvent();
        event.preventDefault();
        event.returnValue = ''; // Required for Chrome
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && currentStep < puzzle.solutions.length) {
        handleExitEvent();
      }
    };

    router.events.on('routeChangeStart', handleRouteChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [
    attemptHistory,
    handleOnSolved,
    isPreview,
    router,
    currentStep,
    puzzle.solutions.length,
  ]);

  useEffect(() => {
    if (puzzle) {
      hasCalledApi.current = false;
      game.load(puzzle.fen);
      setCurrentFen(puzzle.fen);
      setCurrentStep(0);
      setMoveSquareStyle({});
      setIsBoardClickAble(true);
      setHintUsed(false);
      setAttemptHistory([]);
      setHistoryMoves([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle]);

  useEffect(() => {
    if (isCurrentStepReachSolutionLength) {
      if (!hasCalledApi.current) {
        hasCalledApi.current = true; // Prevents duplicate API calls
        setIsBoardClickAble(false);
        setHistoryMoveCurrentIdx(puzzle.solutions.length);
        handleOnSolved(attemptHistory);
      } else {
        setIsRunning(false); // Need to stop timer if they reset puzzle & try again
      }
    }
  }, [
    attemptHistory,
    currentStep,
    handleOnSolved,
    isCurrentStepReachSolutionLength,
    puzzle.solutions.length,
  ]);

  const handlePreMove = (callback?: () => void) => {
    const { move, from, to } = (puzzle.preMove as PuzzlePreMove) || {};

    if (!move) {
      setIsPreMoveDone(true); // No pre-move, so we can immediately render arrows
      if (callback) {
        callback(); // Proceed to callback
      }
      return;
    }

    setIsPreMoveDone(false); // Hide arrows while pre-move is executing

    const timeout = setTimeout(() => {
      if (game && move) {
        game.move(move); // Execute the pre-move on the chess.js instance
        setCurrentFen(game.fen()); // Update the board's FEN string
        setMoveSquareStyle({
          [from]: { background: 'var(--p-highlight)' },
          [to]: { background: 'var(--p-highlight)' },
        });
        startTimer();
        setIsPreMoveDone(true); // Pre-move is now finished, allow arrows to show
      }
      if (callback) {
        callback(); // Proceed to callback
      }
    }, DEFAULT_SOLUTION_DELAY_TIME); // Use a timeout for the pre-move

    setCurrentTimeout(timeout); // Store the timeout reference
  };

  useEffect(() => {
    handlePreMove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle.preMove]); // Run once after the component mounts

  const getMoveOptions = (square: Square) => {
    const moves = game.moves({
      square,
      verbose: true,
    });
    if (moves.length === 0) {
      setOptionSquares({});
      return false;
    }

    const newSquares: Record<string, any> = {};
    newSquares[square] = {
      background: 'var(--p-highlight)',
    };
    setOptionSquares(newSquares);

    if (highlightPossibleMoves) {
      moves.forEach((move) => {
        newSquares[move.to] = {
          background:
            game.get(move.to) &&
            game.get(move.to)?.color !== game.get(square)?.color
              ? 'radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)'
              : 'radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)',
          borderRadius: '50%',
        };
      });
    }

    return true;
  };

  const handleMove = (
    sourceSquare: Square,
    targetSquare: Square,
    promotion?: PromotionType
  ): boolean => {
    const pieceOnTarget = game.get(targetSquare); // Check if there's a piece on the target square

    const userMove = game.move({
      from: sourceSquare,
      to: targetSquare,
      promotion,
    });

    if (!userMove) {
      return false;
    }

    const solution = puzzle.solutions[currentStep];

    const validMove =
      solution.moves.findIndex(({ move }) => move === userMove.san) >= 0;

    setHistoryMoves((prev) => [
      ...prev,
      {
        player: 'user',
        move: userMove.san,
        from: sourceSquare,
        to: targetSquare,
      },
    ]);

    if (game.in_check()) {
      if (checkSound.current) {
        checkSound.current.play();
      }
    } else if (pieceOnTarget) {
      if (captureSound.current) {
        captureSound.current.play();
      }
    } else {
      if (validMove) {
        moveSound.current?.play();
      } else {
        failedSound.current?.play();
      }
    }

    setAttemptHistory((prev) => {
      const newHistory = [
        ...prev,
        {
          move: userMove.san,
          correct: validMove,
          usedHint: hintUsed,
          timeTaken: Math.floor((Date.now() - startTime) / 1000),
        },
      ];
      return newHistory;
    });

    if (validMove) {
      const nextStep = currentStep + 1;
      if (
        nextStep < puzzle.solutions.length &&
        puzzle.solutions[nextStep].player === 'engine'
      ) {
        const solution = puzzle.solutions[nextStep];
        const { move: engineMove, from, to } = solution.moves[0];

        if (currentTimeout) {
          clearTimeout(currentTimeout);
        }

        const timeout = setTimeout(() => {
          game.move(engineMove);
          setCurrentStep((prev) => prev + 2);
          setCurrentFen(game.fen());
          setMoveSquareStyle({
            [from]: { background: 'var(--p-highlight)' },
            [to]: { background: 'var(--p-highlight)' },
          });
          setHistoryMoves((prev) => [
            ...prev,
            {
              player: 'engine',
              move: engineMove,
              from,
              to,
            },
          ]);
          startTimer();
        }, DEFAULT_ENGINE_MOVE_DELAY_TIME);

        setCurrentTimeout(timeout);
      } else {
        setCurrentStep((prev) => prev + 1);
      }

      setCurrentFen(game.fen());
      setMoveSquareStyle({
        [targetSquare]: { background: 'var(--p-highlight)' },
        [sourceSquare]: { background: 'var(--p-highlight)' },
      });
    } else {
      setMoveSquareStyle({
        [targetSquare]: { background: 'var(--p-warning)' },
        [sourceSquare]: { background: 'var(--p-warning)' },
      });
      setCurrentFen(game.fen());
      setShowRetry(true);
      setIsRunning(false);
      // Remove failed move out of history
      setHistoryMoves((prevItems) => prevItems.slice(0, -1));
    }

    setOptionSquares({});

    return true;
  };

  const onPieceDrop = (sourceSquare: Square, targetSquare: Square) => {
    setIsUserClickedOnAnySquare(true);
    if (hintMessage) {
      setHintMessage('');
    }
    if (!isBoardClickAble) {
      return false;
    }
    return handleMove(sourceSquare, targetSquare);
  };

  const onSquareClick = (square: Square) => {
    setIsUserClickedOnAnySquare(true);
    if (hintMessage) {
      setHintMessage('');
    }
    if (!isBoardClickAble) {
      return;
    }
    setRightClickedSquares({});

    if (!moveFrom) {
      const hasMoveOptions = getMoveOptions(square);
      if (hasMoveOptions) setMoveFrom(square);
      return;
    }

    const moves = game.moves({
      square: moveFrom,
      verbose: true,
    });
    const foundMove = moves.find((m) => m.from === moveFrom && m.to === square);

    if (!foundMove) {
      const hasMoveOptions = getMoveOptions(square);
      setMoveFrom(hasMoveOptions ? square : null);
      return;
    }

    setMoveTo(square);
    moveToRef.current = square;

    if (
      (foundMove.color === 'w' &&
        foundMove.piece === 'p' &&
        square[1] === '8') ||
      (foundMove.color === 'b' && foundMove.piece === 'p' && square[1] === '1')
    ) {
      setShowPromotionDialog(true);
      // Not sure why after show promotion dialog, moveTo is null
      setMoveTo(square);
      return;
    }
    const move = handleMove(moveFrom, square, 'q');

    if (!move) {
      const hasMoveOptions = getMoveOptions(square);
      if (hasMoveOptions) setMoveFrom(square);
      return;
    }

    setMoveFrom(null);
    setMoveTo(null);
    setOptionSquares({});
    setCurrentFen(game.fen());
  };

  function onPromotionPieceSelect(
    playerPiece: string,
    from?: Square,
    to?: Square
  ): boolean {
    const promotionType = playerPiece?.charAt(1);

    const promoteToSquare = moveToRef.current;

    const fromSquare = moveFrom || from;
    const toSquare = promoteToSquare || to;

    if (!promotionType || !fromSquare || !toSquare) {
      console.log('Missing required parameters for promotion.');
      setMoveFrom(null);
      setMoveTo(null);
      setShowPromotionDialog(false);
      setOptionSquares({});
      return false;
    }

    const move = handleMove(
      fromSquare,
      toSquare,
      promotionType.toLowerCase() as PromotionType
    );

    if (!move) {
      return false;
    }

    setMoveFrom(null);
    setMoveTo(null);
    setShowPromotionDialog(false);
    setOptionSquares({});
    setCurrentFen(game.fen());

    return true;
  }

  const resetPuzzle = () => {
    game.load(puzzle.fen);
    setCurrentFen(puzzle.fen);
    handlePreMove();
    setOptionSquares({});
    setMoveSquareStyle({});
    setCurrentStep(0);
    setIsBoardClickAble(true);
    setHistoryMoves([]);
    setIsUserClickedOnAnySquare(false);
  };

  const analysis = useCallback(() => {
    window.open(`/analysis?fen=${puzzle.fen}`, '_blank');
  }, [puzzle.fen]);

  const showSolution = () => {
    setHintUsed(false);
    setShowRetry(false);
    game.load(puzzle.fen); // Reset the board to the initial puzzle state
    setCurrentFen(puzzle.fen); // Render the initial FEN
    setCurrentStep(0);
    setMoveSquareStyle({});
    setHistoryMoves([]);
    if (currentTimeout) {
      clearTimeout(currentTimeout); // Clear any existing timeouts
    }
    const executeStep = (stepIndex: number) => {
      if (stepIndex >= puzzle.solutions.length) {
        return; // Stop when all steps have been executed
      }
      const moves = puzzle.solutions[stepIndex].moves;
      const { move, from, to } = moves[0]; // Auto run first move by default
      const timeout = setTimeout(() => {
        game.move(move); // Execute the move on the chess.js instance
        setCurrentFen(game.fen()); // Update the board's FEN string
        setMoveSquareStyle({
          [from]: { background: 'var(--p-highlight)' },
          [to]: { background: 'var(--p-highlight)' },
        });
        setCurrentStep(stepIndex + 1); // Update the current step
        // Proceed to the next step
        executeStep(stepIndex + 1);
      }, DEFAULT_SOLUTION_DELAY_TIME);
      setCurrentTimeout(timeout); // Store the timeout reference
    };
    // Perform the pre-move with a timeout before starting the solution playback
    handlePreMove(() => {
      // Start the solution playback from the first step after pre-move
      executeStep(0);
    });
  };

  const retry = () => {
    setHintUsed(false);
    setShowRetry(false);
    game.undo();
    game.undo();
    setCurrentFen(game.fen());
    let engineMove: PuzzlePreMove | HistoryMove;
    // First attempt failed
    if (currentStep === 0) {
      engineMove = puzzle.preMove as PuzzlePreMove;
    } else {
      engineMove = historyMoves[historyMoves.length - 1];
    }

    // Remake last move
    if (currentTimeout) {
      clearTimeout(currentTimeout);
    }

    const timeout = setTimeout(() => {
      if (engineMove) {
        game.move(engineMove.move);
        setCurrentFen(game.fen());
        setMoveSquareStyle({
          [engineMove.from]: {
            background: 'var(--p-highlight)',
          },
          [engineMove.to]: {
            background: 'var(--p-highlight)',
          },
        });
      } else {
        setMoveSquareStyle({});
      }
      startTimer();
    }, DEFAULT_ENGINE_MOVE_DELAY_TIME);

    setCurrentTimeout(timeout);
  };

  const showHint = () => {
    setHintUsed(true);
    const solution = puzzle.solutions[currentStep];
    const moves = solution.moves;
    const fromPositions = new Set(moves.map((move) => move.from));
    const highLightSquares = Array.from(fromPositions).reduce((acc, cur) => {
      return {
        ...acc,
        [cur]: { background: 'var(--p-highlight)' },
      };
    }, {});
    setMoveSquareStyle(highLightSquares);
    const hintMsg = puzzle?.hint?.[locale];
    const defaultHintMsg = t('solve-puzzle.title.best-move');
    setHintMessage(hintMsg || defaultHintMsg);
  };

  const backMove = () => {
    game.undo();
    setCurrentFen(game.fen());
    const idx = historyMoveCurrentIdx - 1;
    const { from, to } = historyMoves[idx];
    setMoveSquareStyle({
      [from]: {
        background: 'var(--p-highlight)',
      },
      [to]: {
        background: 'var(--p-highlight)',
      },
    });
    setHistoryMoveCurrentIdx(idx);
  };

  const forwardMove = () => {
    const { move, from, to } = historyMoves[historyMoveCurrentIdx];
    game.move(move);
    setCurrentFen(game.fen());
    setMoveSquareStyle({
      [from]: {
        background: 'var(--p-highlight)',
      },
      [to]: {
        background: 'var(--p-highlight)',
      },
    });
    setHistoryMoveCurrentIdx(historyMoveCurrentIdx + 1);
  };

  const playerName = useMemo(() => {
    const { preMove, fen } = puzzle;
    if (preMove?.player && preMove?.move) {
      return preMove.player === 'w' ? 'Black' : 'White';
    }

    return getActivePlayerFromFEN(fen);
  }, [puzzle]);

  const { message, bgHeader } = useMemo(() => {
    if (showRetry) {
      return {
        bgHeader: 'bg-[var(--p-warning)]',
        message: (
          <div className="flex items-center">
            <VscError size={20} className="mr-2" />
            {t('solve-puzzle.message.invalid-move')}
          </div>
        ),
      };
    }

    if (isCurrentStepReachSolutionLength) {
      return {
        bgHeader: 'bg-[var(--s-bg)]',
        message: (
          <>
            <ConfettiEffect />
            <div className="flex items-center">
              <VscPass size={20} className="mr-2" />
              {t('solve-puzzle.message.done')}
            </div>
          </>
        ),
      };
    }

    return {
      message: `${t(`common.title.${playerName.toLocaleLowerCase()}`)} ${t('common.title.move')}`,
      bgHeader: 'bg-[var(--p-bg)]',
    };
  }, [isCurrentStepReachSolutionLength, playerName, showRetry, t]);

  const { setupMoves, followUpMoves, splitIndex } = useMemo(() => {
    const moves = historyMoves || [];
    const splitIndex = Math.round(moves.length / 2);
    return {
      setupMoves: moves.slice(0, splitIndex),
      followUpMoves: moves.slice(splitIndex),
      splitIndex,
    };
  }, [historyMoves]);

  const preMove = useMemo(() => puzzle.preMove?.move, [puzzle]);

  const customArrows = useMemo(() => {
    if (showCustomArrows || isAdminRole) {
      // Case 1: If puzzle is solved, use end arrows
      if (isCurrentStepReachSolutionLength) {
        return puzzle.endCustomArrows || undefined;
      }

      // Case 2: If there's no pre-move, show custom arrows immediately
      if (!puzzle.preMove && !isUserClickedOnAnySquare) {
        return puzzle.customArrows || undefined;
      }

      // Case 3: If pre-move exists but isn't finished yet, don't render arrows
      if (!isPreMoveDone) {
        return undefined;
      }

      // Case 4: After pre-move is finished, render custom arrows
      return !isUserClickedOnAnySquare
        ? puzzle.customArrows || undefined
        : undefined;
    }

    return undefined;
  }, [
    showCustomArrows,
    isAdminRole,
    isCurrentStepReachSolutionLength,
    puzzle.preMove,
    puzzle.customArrows,
    puzzle.endCustomArrows,
    isUserClickedOnAnySquare,
    isPreMoveDone,
  ]);

  return (
    <div>
      {/* Mobile message */}
      <div
        className={`${bgHeader} flex justify-between p-4 text-white font-bold lg:hidden mb-4 rounded-lg`}
      >
        {message}
        {showTimer && (
          <ElapsedTimer startTime={startTime} isRunning={isRunning} />
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[500px_auto] gap-2 lg:gap-4 mx-auto max-w-[900px]">
        <div ref={boardRef}>
          <Chessboard
            // @ts-ignore
            customArrows={customArrows || []}
            customArrowColor="#FFA500"
            boardOrientation={playerName?.toLowerCase() as 'black' | 'white'}
            position={currentFen}
            onPieceDrop={onPieceDrop}
            boardWidth={isMobile ? boardRef.current?.clientWidth || 320 : 500}
            onSquareClick={onSquareClick}
            // @ts-ignore
            onPromotionPieceSelect={onPromotionPieceSelect}
            customBoardStyle={{
              borderRadius: '4px',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
            }}
            customSquareStyles={{
              ...optionSquares,
              ...rightClickedSquares,
              ...moveSquareStyle,
            }}
            promotionToSquare={moveTo}
            showPromotionDialog={showPromotionDialog}
            customPieces={customPieces}
            customDarkSquareStyle={{
              backgroundColor: bgDark,
            }}
            customLightSquareStyle={{
              backgroundColor: bgLight,
            }}
          />
        </div>
        <div className="relative rounded lg:border-[1px]">
          {/* Desktop message */}
          <div
            className={`hidden lg:flex items-center ${bgHeader} justify-between p-4 text-white font-bold`}
          >
            {message}
            {showTimer && (
              <ElapsedTimer startTime={startTime} isRunning={isRunning} />
            )}
          </div>
          {isCurrentStepReachSolutionLength && (
            <div className="hidden lg:flex flex-col p-4">
              {t('common.title.theme')}:
              {puzzle.themes.map((theme) => {
                // @ts-ignore
                const puzzleId = typeof theme === 'string' ? theme : theme?._id;
                return (
                  <p className="text-[14px] italic" key={puzzleId}>
                    {themeMap[puzzleId]?.title?.[locale]}
                  </p>
                );
              })}
              <div className="mt-4">
                {t('common.title.rating')}:
                <p className="mb-2 text-[14px]">
                  {LEVEL_RATING[puzzle.difficulty]}
                </p>
              </div>
              <div>
                <Link
                  href="/lessons/chess-notation-learn-to-record-and-read-moves"
                  rel="noopener noreferrer"
                  target="_blank"
                  className="hover:text-[var(--s-bg)] underline"
                >
                  {t('solve-puzzle.title.moves')}:
                </Link>
                <hr />
                <div className="mb-2 mt-4 grid grid-cols-2 gap-4 max-h-[150px] overflow-y-auto">
                  <div>
                    {preMove && (
                      <p
                        key={`prev-${preMove}`}
                        className="mb-1 grid grid-cols-2 gap-2 text-[14px]"
                      >
                        1 <span className="ml-2 ">{preMove}</span>
                      </p>
                    )}
                    {setupMoves.map((s, index) => (
                      <p
                        key={`first-${index}-${s.move}`}
                        className="mb-1 grid grid-cols-2 gap-2 text-[14px]"
                      >
                        {preMove ? index + 2 : index + 1}
                        {s.player === 'user' ? (
                          <strong className="ml-2">{s.move}</strong>
                        ) : (
                          <span className="ml-2">{s.move}</span>
                        )}
                      </p>
                    ))}
                  </div>
                  <div>
                    {followUpMoves.map((s, index) => (
                      <p
                        key={`second-${index}-${s.move}`}
                        className="mb-1 grid grid-cols-2 gap-2 text-[14px]"
                      >
                        {preMove
                          ? splitIndex + index + 2
                          : splitIndex + index + 1}
                        {s.player === 'user' ? (
                          <strong className="ml-2">{s.move}</strong>
                        ) : (
                          <span className="ml-2">{s.move}</span>
                        )}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          <div
            className={`z-10 fixed lg:absolute bottom-0 left-0 w-full px-4 py-4 bg-white shadow-lg border-t border-gray-300 rounded-t-lg flex justify-center items-center space-x-4 ${actionClass}`}
          >
            {!showRetry && currentStep !== puzzle.solutions.length && (
              <>
                {hintMessage ? (
                  <div>
                    <div
                      className="flex justify-center"
                      dangerouslySetInnerHTML={{ __html: hintMessage }}
                    />
                  </div>
                ) : (
                  <Button
                    className="mx-auto"
                    color="primary"
                    onClick={showHint}
                  >
                    {t('solve-puzzle.button.hint')}
                    <VscLightbulbSparkle size={20} className="ml-1" />
                  </Button>
                )}
              </>
            )}
            {isCurrentStepReachSolutionLength && (
              <div className="flex flex-col">
                <div className="flex justify-between">
                  <div className="flex">
                    <Tooltip
                      content={t('common.button.restart')}
                      placement="top"
                    >
                      <Button
                        color="primary"
                        onClick={resetPuzzle}
                        className="mr-2"
                      >
                        <VscSync size={20} className="ml-1" />
                      </Button>
                    </Tooltip>
                    <Tooltip
                      content={t('common.button.analysis')}
                      placement="top"
                    >
                      <Button
                        color="primary"
                        onClick={analysis}
                        className="mr-2"
                      >
                        <VscSearchFuzzy size={20} className="ml-1" />
                      </Button>
                    </Tooltip>
                  </div>
                  <div className="flex">
                    <Button
                      color="primary"
                      onClick={backMove}
                      disabled={historyMoveCurrentIdx === 0}
                      className="mr-4"
                    >
                      <VscChevronLeft size={20} className="ml-1" />
                    </Button>
                    <Button
                      color="primary"
                      onClick={forwardMove}
                      disabled={historyMoveCurrentIdx >= currentStep}
                    >
                      <VscChevronRight size={20} className="ml-1" />
                    </Button>
                  </div>
                </div>
                {(showNextButton || showCloseButton || showBookmark) && (
                  <div
                    className={`flex items-center mt-2 ${showBookmark ? 'justify-between' : 'justify-end'}`}
                  >
                    {showBookmark && isLoggedIn && (
                      <BookmarkButton puzzleId={puzzle._id!} />
                    )}
                    {showNextButton ? (
                      <Button color="primary" onClick={onNextClick}>
                        {t('common.button.next')}
                      </Button>
                    ) : showCloseButton ? (
                      <Button color="primary" onClick={onCloseClick}>
                        {t('common.button.close')}
                      </Button>
                    ) : (
                      <></>
                    )}
                  </div>
                )}
              </div>
            )}
            {showRetry && (
              <div className="flex justify-between w-full">
                <Button color="primary" onClick={retry}>
                  {t('solve-puzzle.button.retry')}
                  <VscSync size={20} className="ml-1" />
                </Button>
                <Button color="primary" onClick={showSolution}>
                  {t('solve-puzzle.button.solution')}
                  <VscCheckAll size={20} className="ml-1" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolvePuzzle;
