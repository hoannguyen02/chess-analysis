import React, { useMemo, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { Piece, Square } from 'react-chessboard/dist/chessboard/types';
import { PromotionType } from '@/types/promotion';
import {
  JUST_MOVED_FAILED_BG_COLOR,
  JUST_MOVED_SUCCESS_BG_COLOR,
} from '@/constants/colors';
import { DEFAULT_ENGINE_MOVE_DELAY_TIME } from '@/constants/time-out';

type PuzzleProps = {
  puzzle: {
    fen: string;
    solutions: { move: string; player: 'engine' | 'user' }[];
    feedback: { correct: string; retry: string };
  };
};

const SolvePuzzle: React.FC<PuzzleProps> = ({ puzzle }) => {
  const game = useMemo(() => new Chess(puzzle.fen), [puzzle.fen]);
  const [currentTimeout, setCurrentTimeout] = useState<NodeJS.Timeout>();

  const [currentFen, setCurrentFen] = useState<string>(puzzle.fen);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');
  const [attempts, setAttempts] = useState<number>(0);
  const [moveFrom, setMoveFrom] = useState<Square | null>(null);
  const [moveTo, setMoveTo] = useState<Square | null>(null);
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);
  const [rightClickedSquares, setRightClickedSquares] = useState<
    Record<string, any>
  >({});
  const [optionSquares, setOptionSquares] = useState<Record<string, any>>({});
  const [moveSquareStyle, setMoveSquareStyle] = useState<Record<string, any>>(
    {}
  );

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
      setFeedback('Invalid move. Try again.');
      return false;
    }

    setAttempts((prev) => prev + 1);
    const expectedMove = puzzle.solutions[currentStep];

    if (userMove.san === expectedMove.move) {
      setFeedback(puzzle.feedback.correct);

      const nextStep = currentStep + 1;
      if (
        nextStep < puzzle.solutions.length &&
        puzzle.solutions[nextStep].player === 'engine'
      ) {
        const engineMove = puzzle.solutions[nextStep].move;

        // Clear any previous timeout
        if (currentTimeout) {
          clearTimeout(currentTimeout);
        }

        const timeout = setTimeout(() => {
          game.move(engineMove);
          setCurrentStep((prev) => prev + 2);
          setCurrentFen(game.fen()); // Update the FEN after the engine move
          setMoveSquareStyle({
            [targetSquare]: {
              background: JUST_MOVED_SUCCESS_BG_COLOR,
            },
          });
        }, DEFAULT_ENGINE_MOVE_DELAY_TIME);

        setCurrentTimeout(timeout); // Save the timeout to state
      } else {
        setCurrentStep((prev) => prev + 1);
      }

      setCurrentFen(game.fen());
      setMoveSquareStyle({
        [targetSquare]: {
          background: JUST_MOVED_SUCCESS_BG_COLOR,
        },
      });
    } else {
      if (attempts + 1 >= puzzle.solutions.length) {
        setFeedback('Puzzle failed. Try again!');
        resetPuzzle();
      } else {
        setMoveSquareStyle({
          [targetSquare]: {
            background: JUST_MOVED_FAILED_BG_COLOR,
          },
        });
        setFeedback(puzzle.feedback.retry);
        // Make random moves
        // game.undo();
        setCurrentFen(game.fen());
      }
    }

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
    setCurrentStep(0);
    setFeedback('Puzzle restarted. Try again!');
    setAttempts(0);
  };

  return (
    <div>
      <h2>Chess Puzzle</h2>
      <p>Feedback: {feedback}</p>
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
      <button onClick={resetPuzzle}>Restart Puzzle</button>
    </div>
  );
};

export default SolvePuzzle;
