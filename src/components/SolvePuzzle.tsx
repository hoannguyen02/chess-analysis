import React, { useEffect, useMemo, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { Piece, Square } from 'react-chessboard/dist/chessboard/types';
import { PromotionType } from '@/types/promotion';
import {
  JUST_MOVED_FAILED_BG_COLOR,
  JUST_MOVED_SUCCESS_BG_COLOR,
} from '@/constants/colors';
import {
  DEFAULT_ENGINE_MOVE_DELAY_TIME,
  DEFAULT_SOLUTION_DELAY_TIME,
} from '@/constants/time-out';

type PuzzleProps = {
  puzzle: {
    fen: string;
    solutions: {
      move: string;
      player: 'engine' | 'user';
      from: Square;
      to: Square;
    }[];
    prevMove: { move: string; player: 'w' | 'b'; from: Square; to: Square };
  };
};

const SolvePuzzle: React.FC<PuzzleProps> = ({ puzzle }) => {
  const game = useMemo(() => new Chess(puzzle.fen), [puzzle.fen]);
  const [currentTimeout, setCurrentTimeout] = useState<NodeJS.Timeout>();

  const [currentFen, setCurrentFen] = useState<string>(puzzle.fen);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');
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

  useEffect(() => {
    const timer = setTimeout(() => {
      const { move, from, to } = puzzle.prevMove;
      if (game && move) {
        game.move(move);
        setCurrentFen(game.fen());
        setMoveSquareStyle({
          [from]: {
            background: JUST_MOVED_SUCCESS_BG_COLOR,
          },
          [to]: {
            background: JUST_MOVED_SUCCESS_BG_COLOR,
          },
        });
      }
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle.prevMove]); // Run once after the component mounts

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
    newSquares[square] = {
      background: JUST_MOVED_SUCCESS_BG_COLOR,
    };
    setOptionSquares(newSquares);
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

    const expectedMove = puzzle.solutions[currentStep];

    if (userMove.san === expectedMove.move) {
      const nextStep = currentStep + 1;
      if (
        nextStep < puzzle.solutions.length &&
        puzzle.solutions[nextStep].player === 'engine'
      ) {
        const engineMove = puzzle.solutions[nextStep].move;

        if (currentTimeout) {
          clearTimeout(currentTimeout);
        }

        const timeout = setTimeout(() => {
          game.move(engineMove);
          setCurrentStep((prev) => prev + 2);
          setCurrentFen(game.fen());
          setMoveSquareStyle({
            [targetSquare]: {
              background: JUST_MOVED_SUCCESS_BG_COLOR,
            },
            [sourceSquare]: {
              background: JUST_MOVED_SUCCESS_BG_COLOR,
            },
          });
        }, DEFAULT_ENGINE_MOVE_DELAY_TIME);

        setCurrentTimeout(timeout);
      } else {
        setCurrentStep((prev) => prev + 1);
      }

      setCurrentFen(game.fen());
      setMoveSquareStyle({
        [targetSquare]: {
          background: JUST_MOVED_SUCCESS_BG_COLOR,
        },
        [sourceSquare]: {
          background: JUST_MOVED_SUCCESS_BG_COLOR,
        },
      });
    } else {
      setMoveSquareStyle({
        [targetSquare]: {
          background: JUST_MOVED_FAILED_BG_COLOR,
        },
        [sourceSquare]: {
          background: JUST_MOVED_FAILED_BG_COLOR,
        },
      });
      setCurrentFen(game.fen());
      setShowRetry(true);
    }

    setOptionSquares({});

    return true;
  };

  const onSquareClick = (square: Square) => {
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
      setFeedback('Invalid promotion piece selected.');
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
    setOptionSquares({});
    setMoveSquareStyle({});
    setCurrentStep(0);
    setFeedback('Puzzle restarted. Try again!');
  };

  const showSolution = () => {
    game.load(puzzle.fen); // Reset the board to the initial puzzle state
    setCurrentFen(puzzle.fen); // Render the initial FEN
    setCurrentStep(0);
    setMoveSquareStyle({});

    if (currentTimeout) {
      clearTimeout(currentTimeout); // Clear any existing timeouts
    }

    const handlePreMove = (callback: () => void) => {
      const { move, from, to } = puzzle.prevMove;

      const timeout = setTimeout(() => {
        if (game && move) {
          game.move(move); // Execute the pre-move on the chess.js instance
          setCurrentFen(game.fen()); // Update the board's FEN string
          setMoveSquareStyle({
            [from]: { background: JUST_MOVED_SUCCESS_BG_COLOR },
            [to]: { background: JUST_MOVED_SUCCESS_BG_COLOR },
          });
        }
        callback(); // Proceed to solution steps
      }, DEFAULT_SOLUTION_DELAY_TIME); // Use a timeout for the pre-move

      setCurrentTimeout(timeout); // Store the timeout reference
    };

    const executeStep = (stepIndex: number) => {
      if (stepIndex >= puzzle.solutions.length) {
        return; // Stop when all steps have been executed
      }

      const { move, from, to } = puzzle.solutions[stepIndex];

      const timeout = setTimeout(() => {
        game.move(move); // Execute the move on the chess.js instance
        setCurrentFen(game.fen()); // Update the board's FEN string
        setMoveSquareStyle({
          [from]: { background: JUST_MOVED_SUCCESS_BG_COLOR },
          [to]: { background: JUST_MOVED_SUCCESS_BG_COLOR },
        });

        setCurrentStep(stepIndex + 1); // Update the current step

        // Proceed to the next step
        executeStep(stepIndex + 1);
      }, DEFAULT_ENGINE_MOVE_DELAY_TIME);

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
    let engineMove;
    let nextStep: number = 0;
    // First attempt failed
    if (currentStep === 0) {
      engineMove = puzzle.prevMove;
    } else {
      nextStep = currentStep - 1;
      engineMove = puzzle.solutions[nextStep];
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
          background: JUST_MOVED_SUCCESS_BG_COLOR,
        },
        [engineMove.to]: {
          background: JUST_MOVED_SUCCESS_BG_COLOR,
        },
      });
    }, 1000);

    setCurrentTimeout(timeout);
  };

  return (
    <div>
      <h2>Chess Puzzle</h2>
      <Chessboard
        position={currentFen}
        onPieceDrop={(sourceSquare, targetSquare) =>
          handleMove(sourceSquare, targetSquare)
        }
        boardWidth={500}
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
      />
      {currentStep === puzzle.solutions.length && (
        <>
          <button onClick={resetPuzzle}>Restart Puzzle</button>
        </>
      )}
      {showRetry && (
        <>
          <button onClick={retry}>Retry Puzzle</button>
          <button onClick={showSolution}>Show Solution</button>
        </>
      )}
    </div>
  );
};

export default SolvePuzzle;
