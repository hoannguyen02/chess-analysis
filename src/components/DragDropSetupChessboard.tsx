import { useCustomBoard } from '@/hooks/useCustomBoard';
import { Chess } from 'chess.js';
import { Button, Clipboard, TextInput } from 'flowbite-react';
import { useMemo, useState } from 'react';
import {
  ChessboardDnDProvider,
  SparePiece,
  Chessboard,
} from 'react-chessboard';
import { Piece, Square } from 'react-chessboard/dist/chessboard/types';

type Props = {
  fen?: string;
};
const DragDropSetupChessboard = ({
  fen = '8/8/8/8/8/8/8/8 w - - 0 1',
}: Props) => {
  const { customPieces, bgDark, bgLight } = useCustomBoard();
  const game = useMemo(() => new Chess(fen), [fen]); // empty board
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>(
    'white'
  );
  const [boardWidth, setBoardWidth] = useState(360);
  const [fenPosition, setFenPosition] = useState(game.fen());

  const handleSparePieceDrop = (piece, targetSquare) => {
    const color = piece[0];
    const type = piece[1].toLowerCase();

    const success = game.put({ type, color }, targetSquare);

    if (success) {
      setFenPosition(game.fen());
    } else {
      alert(
        `The board already contains ${color === 'w' ? 'WHITE' : 'BLACK'} KING`
      );
    }

    return success;
  };

  const handlePieceDrop = (sourceSquare, targetSquare, piece) => {
    const color = piece[0];
    const type = piece[1].toLowerCase();

    // this is hack to avoid chess.js bug, which I've fixed in the latest version https://github.com/jhlywa/chess.js/pull/426
    game.remove(sourceSquare);
    game.remove(targetSquare);
    const success = game.put({ type, color }, targetSquare);

    if (success) setFenPosition(game.fen());

    return success;
  };

  const handlePieceDropOffBoard = (sourceSquare: Square) => {
    game.remove(sourceSquare);
    setFenPosition(game.fen());
  };

  const handleFenInputChange = (e) => {
    const fen = e.target.value;
    const { valid } = game.validate_fen(fen);

    setFenPosition(fen);
    if (valid) {
      game.load(fen);
      setFenPosition(game.fen());
    }
  };
  const pieces = [
    'wP',
    'wN',
    'wB',
    'wR',
    'wQ',
    'wK',
    'bP',
    'bN',
    'bB',
    'bR',
    'bQ',
    'bK',
  ];
  const setTurn = (turn: 'w' | 'b') => {
    let fen = game.fen();
    fen = fen.replace(/ [wb] /, ` ${turn} `);

    const isValid = game.load(fen);
    if (isValid) {
      setFenPosition(game.fen());
    } else {
      throw new Error('Failed to set turn. The resulting FEN is invalid.');
    }
  };

  return (
    <ChessboardDnDProvider>
      <div className="grid grid-cols-2 w-full gap-4">
        <div className="w-[500px]">
          <div
            style={{
              display: 'flex',
              margin: `${boardWidth / 32}px ${boardWidth / 8}px`,
            }}
          >
            {pieces.slice(6, 12).map((piece) => (
              <SparePiece
                key={piece}
                piece={piece as Piece}
                width={boardWidth / 8}
                dndId="ManualBoardEditor"
              />
            ))}
          </div>
          <Chessboard
            onBoardWidthChange={setBoardWidth}
            id="ManualBoardEditor"
            boardOrientation={boardOrientation}
            position={game.fen()}
            onSparePieceDrop={handleSparePieceDrop}
            onPieceDrop={handlePieceDrop}
            onPieceDropOffBoard={handlePieceDropOffBoard}
            dropOffBoardAction="trash"
            customBoardStyle={{
              borderRadius: '4px',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
            }}
            customPieces={customPieces}
            customDarkSquareStyle={{
              backgroundColor: bgDark,
            }}
            customLightSquareStyle={{
              backgroundColor: bgLight,
            }}
          />
          <div
            style={{
              display: 'flex',
              margin: `${boardWidth / 32}px ${boardWidth / 8}px`,
            }}
          >
            {pieces.slice(0, 6).map((piece) => (
              <SparePiece
                key={piece}
                piece={piece as Piece}
                width={boardWidth / 8}
                dndId="ManualBoardEditor"
              />
            ))}
          </div>
        </div>
        <div className="grid place-items-top">
          <div className="flex flex-col mt-24 w-[50%] mx-auto">
            <Button
              onClick={() => {
                game.reset();
                setFenPosition(game.fen());
              }}
              className="mb-4"
            >
              Start position
            </Button>
            <Button
              onClick={() => {
                game.clear();
                setFenPosition(game.fen());
              }}
              className="mb-4"
            >
              Clear board
            </Button>
            <Button
              onClick={() => {
                setBoardOrientation(
                  boardOrientation === 'white' ? 'black' : 'white'
                );
              }}
            >
              Flip board
            </Button>
          </div>
          <div className="flex flex-col items-start mt-4">
            <label className="mb-2 font-semibold text-gray-700">
              Select the next player to move:
            </label>
            <div className="flex items-center">
              <Button
                className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
                  game.turn() === 'w'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                onClick={() => {
                  setTurn('w');
                }}
              >
                White
              </Button>
              <Button
                className={`flex items-center px-4 py-2 ml-2 rounded-lg transition-all duration-200 ${
                  game.turn() === 'b'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                onClick={() => {
                  setTurn('b');
                }}
              >
                Black
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Tip: Click on "White" or "Black" to set the next player to move.
            </p>
          </div>

          <div className="flex items-center mt-4">
            <TextInput
              className="w-[400px] rounded"
              value={fenPosition}
              onChange={handleFenInputChange}
              placeholder="Paste FEN position to start editing"
            />
            <Clipboard className="ml-4" valueToCopy={game.fen()} label="Copy" />
          </div>
        </div>
      </div>
    </ChessboardDnDProvider>
  );
};

export default DragDropSetupChessboard;
