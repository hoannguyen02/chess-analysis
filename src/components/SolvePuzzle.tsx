import { LEVEL_RATING } from '@/constants';
import {
  DEFAULT_ENGINE_MOVE_DELAY_TIME,
  DEFAULT_SOLUTION_DELAY_TIME,
} from '@/constants/time-out';
import { useAppContext } from '@/contexts/AppContext';
import { useCustomBoard } from '@/hooks/useCustomBoard';
import { PromotionType } from '@/types/promotion';
import { Puzzle, PuzzlePreMove } from '@/types/puzzle';
import { getActivePlayerFromFEN } from '@/utils/get-player-name-from-fen';
import { Chess } from 'chess.js';
import { Button } from 'flowbite-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/router';
import React, { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { Piece, Square } from 'react-chessboard/dist/chessboard/types';
import {
  VscArrowLeft,
  VscCheckAll,
  VscChevronLeft,
  VscChevronRight,
  VscError,
  VscLightbulbSparkle,
  VscPass,
  VscSync,
} from 'react-icons/vsc';
import ConfettiEffect from './ConfettiEffect';

type PuzzleProps = {
  puzzle: Puzzle;
  showBackButton?: boolean;
  highlightPossibleMoves?: boolean;
  showNextButton?: boolean;
  onNextClick?(): void;
};

export type HistoryMove = {
  move: string;
  player: 'user' | 'engine';
  from: string;
  to: string;
};

const SolvePuzzle: React.FC<PuzzleProps> = ({
  puzzle,
  showBackButton = true,
  highlightPossibleMoves = false,
  showNextButton = false,
  onNextClick,
}) => {
  const t = useTranslations();
  const { themeMap, isMobile, locale } = useAppContext();
  const router = useRouter();
  const { customPieces, bgDark, bgLight } = useCustomBoard();
  const game = useMemo(() => new Chess(puzzle.fen), [puzzle.fen]);
  const [currentTimeout, setCurrentTimeout] = useState<NodeJS.Timeout>();

  const [currentFen, setCurrentFen] = useState<string>(puzzle.fen);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [moveFrom, setMoveFrom] = useState<Square | null>(null);
  const [moveTo, setMoveTo] = useState<Square | null>(null);
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

  useEffect(() => {
    if (currentStep === puzzle.solutions.length) {
      setIsBoardClickAble(false);
      setHistoryMoveCurrentIdx(puzzle.solutions.length);
    }
  }, [currentStep, puzzle.solutions.length]);

  const handlePreMove = (callback?: () => void) => {
    const { move, from, to } = (puzzle.preMove as PuzzlePreMove) || {};

    const timeout = setTimeout(() => {
      if (game && move) {
        game.move(move); // Execute the pre-move on the chess.js instance
        setCurrentFen(game.fen()); // Update the board's FEN string
        setMoveSquareStyle({
          [from]: { background: 'var(--p-highlight)' },
          [to]: { background: 'var(--p-highlight)' },
        });
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

    setHistoryMoves((prev) => {
      return [
        ...prev,
        {
          player: 'user',
          move: userMove.san,
          from: sourceSquare,
          to: targetSquare,
        },
      ];
    });

    if (validMove) {
      const nextStep = currentStep + 1;
      if (
        nextStep < puzzle.solutions.length &&
        puzzle.solutions[nextStep].player === 'engine'
      ) {
        const solution = puzzle.solutions[nextStep];
        const { move: engineMove, from, to } = solution.moves[0]; // Engine by 1 move by default

        if (currentTimeout) {
          clearTimeout(currentTimeout);
        }

        const timeout = setTimeout(() => {
          game.move(engineMove);
          setCurrentStep((prev) => prev + 2);
          setCurrentFen(game.fen());
          setMoveSquareStyle({
            [from]: {
              background: 'var(--p-highlight)',
            },
            [to]: {
              background: 'var(--p-highlight)',
            },
          });
          setHistoryMoves((prev) => {
            return [
              ...prev,
              {
                player: 'engine',
                move: engineMove,
                from,
                to,
              },
            ];
          });
        }, DEFAULT_ENGINE_MOVE_DELAY_TIME);

        setCurrentTimeout(timeout);
      } else {
        setCurrentStep((prev) => prev + 1);
      }

      setCurrentFen(game.fen());
      setMoveSquareStyle({
        [targetSquare]: {
          background: 'var(--p-highlight)',
        },
        [sourceSquare]: {
          background: 'var(--p-highlight)',
        },
      });
    } else {
      setMoveSquareStyle({
        [targetSquare]: {
          background: 'var(--p-warning)',
        },
        [sourceSquare]: {
          background: 'var(--p-warning)',
        },
      });
      setCurrentFen(game.fen());
      setShowRetry(true);
    }

    setOptionSquares({});

    return true;
  };

  const onSquareClick = (square: Square) => {
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

    if (
      (foundMove.color === 'w' &&
        foundMove.piece === 'p' &&
        square[1] === '8') ||
      (foundMove.color === 'b' && foundMove.piece === 'p' && square[1] === '1')
    ) {
      setShowPromotionDialog(true);
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
    piece?: Piece,
    promoteFromSquare?: Square,
    promoteToSquare?: Square
  ): boolean {
    // If no piece or required squares are provided, reset and return false
    if (!piece || !promoteFromSquare || !promoteToSquare) {
      setMoveFrom(null);
      setMoveTo(null);
      setShowPromotionDialog(false);
      setOptionSquares({});
      return false;
    }

    // Map the piece to valid promotion types
    const promotionType: 'q' | 'r' | 'b' | 'n' | undefined =
      piece[1]?.toLowerCase() as 'q' | 'r' | 'b' | 'n';

    if (!promotionType) {
      return false;
    }
    const move = handleMove(promoteFromSquare, promoteToSquare, promotionType);
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
  };

  const showSolution = () => {
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
    setShowRetry(false);
    game.undo();
    game.undo();
    setCurrentFen(game.fen());
    let engineMove: PuzzlePreMove | HistoryMove;
    let nextStep: number = 0;
    // First attempt failed
    if (currentStep === 0) {
      engineMove = puzzle.preMove as PuzzlePreMove;
    } else {
      nextStep = currentStep - 1;
      engineMove = historyMoves[nextStep];
    }

    // Remake last move
    if (currentTimeout) {
      clearTimeout(currentTimeout);
    }

    const timeout = setTimeout(() => {
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
    }, DEFAULT_ENGINE_MOVE_DELAY_TIME);

    setCurrentTimeout(timeout);
  };

  const showHint = () => {
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

    if (currentStep === puzzle.solutions.length) {
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
      message: `${t(`common.title.${playerName}`)} ${t('common.title.move')}`,
      bgHeader: 'bg-[var(--p-bg)]',
    };
  }, [currentStep, playerName, puzzle.solutions.length, showRetry, t]);

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

  return (
    <div>
      {showBackButton && (
        <button
          className="mb-4 flex items-center"
          onClick={() => {
            router.back();
          }}
        >
          <VscArrowLeft /> {t('common.button.back')}
        </button>
      )}

      {/* Mobile message */}
      <div
        className={`${bgHeader} flex justify-center py-4 text-white font-bold lg:hidden mb-4 rounded-lg`}
      >
        {message}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[500px_auto] gap-2 lg:gap-16 mx-auto max-w-[900px]">
        <div ref={boardRef}>
          <Chessboard
            boardOrientation={playerName?.toLowerCase() as 'black' | 'white'}
            position={currentFen}
            onPieceDrop={(sourceSquare, targetSquare) => {
              if (hintMessage) {
                setHintMessage('');
              }
              if (!isBoardClickAble) {
                return false;
              }
              return handleMove(sourceSquare, targetSquare);
            }}
            boardWidth={isMobile ? boardRef.current?.clientWidth || 320 : 500}
            onSquareClick={onSquareClick}
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
          <div
            className={`hidden lg:flex ${bgHeader} justify-center py-4 text-white font-bold`}
          >
            {message}
          </div>
          {currentStep === puzzle.solutions.length && (
            <div className="hidden lg:flex flex-col p-4">
              {t('common.title.theme')}:
              {puzzle.themes.map((id) => {
                return (
                  <p className="mb-2 text-[14px]" key={id}>
                    {themeMap[id]?.title?.[locale]}
                  </p>
                );
              })}
              {t('common.title.rating')}:
              <p className="mb-2 text-[14px]">
                {LEVEL_RATING[puzzle.difficulty]}
              </p>
              {t('solve-puzzle.title.moves')}: <hr />
              <div className="mb-2 mt-4 grid grid-cols-2 gap-4">
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
          )}
          <div className="fixed lg:absolute bottom-4 left-0 w-full px-4">
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
            {currentStep === puzzle.solutions.length && (
              <div className="flex flex-col">
                <div className="flex justify-between">
                  <div className="flex">
                    <Button
                      color="primary"
                      onClick={resetPuzzle}
                      className="mr-2"
                    >
                      {t('solve-puzzle.button.restart')}{' '}
                      <VscSync size={20} className="ml-1" />
                    </Button>
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
                {showNextButton && (
                  <Button
                    color="primary"
                    onClick={onNextClick}
                    className="mt-2"
                  >
                    Next
                  </Button>
                )}
              </div>
            )}
            {showRetry && (
              <div className="flex justify-around">
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
