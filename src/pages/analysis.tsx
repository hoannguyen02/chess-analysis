import axios from 'axios';
import { Chess, Square } from 'chess.js';
import React, { useState } from 'react';
import { Chessboard } from 'react-chessboard';

const ChessAnalysis: React.FC = () => {
  const [game] = useState(
    new Chess('rn3rk1/pp3ppp/2p2n2/7q/1b1P4/2N1PNPb/PPQ3BP/R1B2RK1 w - - 5 14')
  ); // Initialize the game
  const [fen, setFen] = useState(game.fen()); // FEN state
  const [moveHistory, setMoveHistory] = useState<string[]>([]); // To display moves
  const [analysis, setAnalysis] = useState<{
    move: string;
    evaluation: string;
  } | null>(null); // Analysis results

  const onDrop = async (
    sourceSquare: Square,
    targetSquare: Square
  ): Promise<boolean> => {
    const move = game.move({
      from: sourceSquare,
      to: targetSquare,
      promotion:
        sourceSquare[1] === '7' && targetSquare[1] === '8' ? 'q' : undefined,
    });

    if (!move) {
      console.error(
        `Invalid move: { from: "${sourceSquare}", to: "${targetSquare}" }`
      );
      return false;
    }

    // Update FEN and move history
    const newFen = game.fen();
    setFen(newFen);
    setMoveHistory((prevHistory) => [...prevHistory, move.san]);

    console.log('Updated FEN:', newFen);

    // Send move for analysis
    await analyzeMove(newFen, `${sourceSquare}${targetSquare}`);
    return true;
  };

  // Send move for analysis
  const analyzeMove = async (fen: string, userMove: string) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_LIMA_BE_DOMAIN}/v1/stockfish/analyze`,
        {
          fen,
          userMove,
          depth: 15,
        }
      );
      setAnalysis({
        move: response.data.bestMove,
        evaluation: response.data.evaluation,
      });
    } catch (error) {
      console.error('Analysis error:', error);
    }
  };

  const getHighlightedSquares = () => {
    if (!analysis || !analysis.move) return {};

    const fromSquare = analysis.move.slice(0, 2);
    const toSquare = analysis.move.slice(2, 4);

    return {
      [fromSquare]: {
        backgroundColor: analysis.evaluation === 'best move' ? 'green' : 'red',
      },
      [toSquare]: {
        backgroundColor: analysis.evaluation === 'best move' ? 'green' : 'red',
      },
    };
  };

  return (
    <div style={{ display: 'flex', gap: '2rem', padding: '1rem' }}>
      {/* Chessboard */}
      <div style={{ width: '400px', height: '400px' }}>
        <Chessboard
          position={fen}
          onPieceDrop={(sourceSquare, targetSquare) => {
            onDrop(sourceSquare, targetSquare);
            return true;
          }}
          customSquareStyles={getHighlightedSquares()}
        />
      </div>

      {/* Analysis Panel */}
      <div style={{ maxWidth: '300px' }}>
        <h3>Move History</h3>
        <ul>
          {moveHistory.map((move, index) => (
            <li key={index}>{`${index + 1}. ${move}`}</li>
          ))}
        </ul>

        {analysis && (
          <div>
            <h3>Analysis</h3>
            <p>
              <strong>Best Move:</strong> {analysis.move}
            </p>
            <p>
              <strong>Evaluation:</strong> {analysis.evaluation}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChessAnalysis;
