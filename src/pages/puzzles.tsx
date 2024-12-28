import React from 'react';
import { Chessboard } from 'react-chessboard';

const Puzzle = ({ puzzle }: any) => {
  const {
    fen,
    move,
    evaluationBefore,
    evaluationAfter,
    evalChange,
    difficulty,
    theme,
    phase,
    impact,
  } = puzzle;

  return (
    <div
      style={{
        border: '1px solid #ccc',
        padding: '16px',
        marginBottom: '16px',
        borderRadius: '8px',
      }}
    >
      <Chessboard position={fen} arePiecesDraggable={false} boardWidth={400} />
      <div style={{ marginTop: '16px' }}>
        <p>
          <strong>Move:</strong> {move}
        </p>
        <p>
          <strong>Evaluation Before:</strong> {evaluationBefore}
        </p>
        <p>
          <strong>Evaluation After:</strong> {evaluationAfter}
        </p>
        <p>
          <strong>Evaluation Change:</strong> {evalChange}
        </p>
        <p>
          <strong>Difficulty:</strong> {difficulty}
        </p>
        <p>
          <strong>Theme:</strong> {theme}
        </p>
        <p>
          <strong>Phase:</strong> {phase}
        </p>
        <p>
          <strong>Impact:</strong> {impact}
        </p>
      </div>
    </div>
  );
};

const PuzzlesPage = ({ puzzles }: { puzzles: any[] }) => {
  return (
    <div style={{ padding: '16px' }}>
      <h1>Chess Puzzles</h1>
      {puzzles.length > 0 ? (
        puzzles.map((puzzle, index) => <Puzzle key={index} puzzle={puzzle} />)
      ) : (
        <p>No puzzles available</p>
      )}
    </div>
  );
};

export async function getServerSideProps() {
  const apiDomain = process.env.NEXT_PUBLIC_PHONG_CHESS_DOMAIN;

  try {
    const res = await fetch(`${apiDomain}/v1/puzzles`);
    if (!res.ok) {
      throw new Error(`Failed to fetch puzzles: ${res.statusText}`);
    }
    const data = await res.json();
    return { props: { puzzles: data } };
  } catch (error) {
    console.error('Fetch error:', error);
    return { props: { puzzles: [] } }; // Fallback to empty puzzles
  }
}

export default PuzzlesPage;
