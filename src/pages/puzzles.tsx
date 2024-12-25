import React from 'react';
import { Chessboard } from 'react-chessboard';

const Puzzle = ({ puzzle }: any) => {
  const { fen, move, evaluationBefore, evaluationAfter, evalChange, difficulty, theme, phase, impact } = puzzle;

  return (
    <div style={{ border: '1px solid #ccc', padding: '16px', marginBottom: '16px', borderRadius: '8px' }}>
      <Chessboard position={fen} arePiecesDraggable={false} boardWidth={400} />
      <div style={{ marginTop: '16px' }}>
        <p><strong>Move:</strong> {move}</p>
        <p><strong>Evaluation Before:</strong> {evaluationBefore}</p>
        <p><strong>Evaluation After:</strong> {evaluationAfter}</p>
        <p><strong>Evaluation Change:</strong> {evalChange}</p>
        <p><strong>Difficulty:</strong> {difficulty}</p>
        <p><strong>Theme:</strong> {theme}</p>
        <p><strong>Phase:</strong> {phase}</p>
        <p><strong>Impact:</strong> {impact}</p>
      </div>
    </div>
  );
};

const PuzzlesPage = () => {
  const puzzles = [
    {
      fen: "r1bqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      move: "e4",
      evaluationBefore: 0,
      evaluationAfter: 50,
      evalChange: 50,
      difficulty: "easy",
      theme: "general",
      phase: "opening",
      impact: "neutral"
    },
    {
      fen: "4r1k1/ppp2ppp/8/8/4Q3/8/PPP2PPP/4R1K1 w - - 0 1",
      move: "Re8#",
      evaluationBefore: 200,
      evaluationAfter: 1000,
      evalChange: 800,
      difficulty: "hard",
      theme: "checkmate pattern",
      phase: "endgame",
      impact: "brilliant move"
    }
  ];

  return (
    <div style={{ padding: '16px' }}>
      <h1>Chess Puzzles</h1>
      {puzzles.map((puzzle, index) => (
        <Puzzle key={index} puzzle={puzzle} />
      ))}
    </div>
  );
};

export default PuzzlesPage;
