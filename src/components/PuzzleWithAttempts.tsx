import React, { useState } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";

interface PuzzleProps {
  puzzle: {
    initialFen: string;
    solution: Array<{
      move: string;
      player: "user" | "engine";
      evaluation: number;
      comment: string;
    }>;
    feedback: {
      correct: string;
      incorrect: string;
      retry: string;
    };
  };
}

const PuzzleWithAttempts: React.FC<PuzzleProps> = ({ puzzle }) => {
  const [chess] = useState(new Chess(puzzle.initialFen)); // Chess.js instance
  const [currentFen, setCurrentFen] = useState<string>(puzzle.initialFen); // Current FEN
  const [currentStep, setCurrentStep] = useState<number>(0); // Current solution step
  const [feedback, setFeedback] = useState<string>(""); // Feedback for the user
  const [attempts, setAttempts] = useState<number>(0); // Failed attempts

  const handleMove = (sourceSquare: string, targetSquare: string, piece: string): boolean => {
    const userMove = chess.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q", // Assume promotion to queen by default
    });
  
    if (!userMove) {
      setFeedback("Invalid move. Try again.");
      return false; // Invalid move
    }
  
    const expectedMove = puzzle.solution[currentStep];
  
    if (userMove.san === expectedMove.move) {
      // Correct move
      setFeedback(puzzle.feedback.correct);
      setCurrentStep((prev) => prev + 1);
  
      // Check if it's the engine's turn next
      if (
        currentStep + 1 < puzzle.solution.length &&
        puzzle.solution[currentStep + 1].player === "engine"
      ) {
        const engineMove = puzzle.solution[currentStep + 1].move;
        chess.move(engineMove);
        setCurrentStep((prev) => prev + 2); // Skip to the next user move
      }
  
      setCurrentFen(chess.fen()); // Update the board position
    } else {
      // Incorrect move
      setAttempts((prev) => prev + 1);
  
      if (attempts + 1 >= puzzle.solution.length) {
        setFeedback("Puzzle failed. Try again!");
        resetPuzzle(); // Reset puzzle on max attempts
      } else {
        setFeedback(puzzle.feedback.retry);
        chess.undo(); // Undo the incorrect move
        setCurrentFen(chess.fen());
      }
    }
  
    return true; // Valid move
  };
  

  const resetPuzzle = (): void => {
    chess.load(puzzle.initialFen); // Reset the chessboard
    setCurrentFen(puzzle.initialFen);
    setCurrentStep(0);
    setFeedback("Puzzle restarted. Try again!");
    setAttempts(0);
  };

  return (
    <div>
      <h2>Chess Puzzle</h2>
      <p>Feedback: {feedback}</p>
      <p>Attempts: {attempts}/{puzzle.solution.length}</p>
      <Chessboard
        position={currentFen}
        onPieceDrop={handleMove}
        boardWidth={500}
      />
      <button onClick={resetPuzzle}>Restart Puzzle</button>
    </div>
  );
};

export default PuzzleWithAttempts;
