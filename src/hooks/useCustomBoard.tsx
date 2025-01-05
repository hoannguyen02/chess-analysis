import { useMemo } from 'react';

// Define the types for the custom piece components
interface PieceProps {
  squareWidth: number;
}

type PieceComponents = {
  [key: string]: React.FC<PieceProps>;
};

const pieces = [
  'wP', // White Pawn
  'wN', // White Knight
  'wB', // White Bishop
  'wR', // White Rook
  'wQ', // White Queen
  'wK', // White King
  'bP', // Black Pawn
  'bN', // Black Knight
  'bB', // Black Bishop
  'bR', // Black Rook
  'bQ', // Black Queen
  'bK', // Black King
];

export const useCustomBoard = () => {
  const customPieces = useMemo<PieceComponents>(() => {
    const pieceComponents: PieceComponents = {};
    pieces.forEach((piece) => {
      pieceComponents[piece] = ({ squareWidth }) => (
        <div
          style={{
            width: squareWidth,
            height: squareWidth,
            backgroundImage: `url(/images/${piece}.png)`,
            backgroundSize: '100%',
          }}
        />
      );
    });
    return pieceComponents;
  }, []);

  return {
    customPieces,
    bgDark: '#779952',
    bgLight: '#edeed1',
  };
};
