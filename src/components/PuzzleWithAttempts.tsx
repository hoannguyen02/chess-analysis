import React, { useMemo, useState } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { Square } from "react-chessboard/dist/chessboard/types";

type PuzzleProps = {
  puzzle: any;
};

const PuzzleWithAttempts: React.FC<PuzzleProps> = ({ puzzle }) => {
  const game = useMemo(() => new Chess(puzzle.fen), [puzzle.fen]);
  const [currentFen, setCurrentFen] = useState<string>(puzzle.fen);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>("");
  const [attempts, setAttempts] = useState<number>(0);

  const handleMove = (sourceSquare: Square, targetSquare: Square): boolean => {
    // debugger
    const userMove = game.move({ from: sourceSquare, to: targetSquare });

    if (!userMove) {
      setFeedback("Invalid move. Try again.");
      return false;
    }
    setAttempts((prev) => prev + 1);
    const expectedMove = puzzle.solutions[currentStep];
    if (userMove.san === expectedMove.move) {
      setFeedback(puzzle.feedback.correct);
      
      const nextStep = currentStep + 1;
      if (
        nextStep < puzzle.solutions.length &&
        puzzle.solutions[nextStep].player === "engine"
      ) {
        const engineMove = puzzle.solutions[nextStep].move;
        game.move(engineMove);
        setCurrentStep((prev) => prev + 2);
      } else {
        setCurrentStep((prev) => prev + 1);
      }

      setCurrentFen(game.fen());
    } else {
      

      if (attempts + 1 >= puzzle.solutions.length) {
        setFeedback("Puzzle failed. Try again!");
        resetPuzzle();
      } else {
        setFeedback(puzzle.feedback.retry);
        game.undo();
        setCurrentFen(game.fen());
      }
    }

    return true;
  };

  const resetPuzzle = (): void => {
    game.load(puzzle.fen);
    setCurrentFen(puzzle.fen);
    setCurrentStep(0);
    setFeedback("Puzzle restarted. Try again!");
    setAttempts(0);
  };

  return (
    <div>
      <h2>Chess Puzzle</h2>
      <p>Feedback: {feedback}</p>
      <p>Attempts: {attempts}/{puzzle.solutions.length}</p>
      <Chessboard
        position={currentFen}
        onPieceDrop={(sourceSquare, targetSquare) =>
          handleMove(sourceSquare, targetSquare)
        }
        boardWidth={500}
      />
      <button onClick={resetPuzzle}>Restart Puzzle</button>
    </div>
  );
};

export default PuzzleWithAttempts;
