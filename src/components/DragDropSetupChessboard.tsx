import { useAppContext } from '@/contexts/AppContext';
import { useCustomBoard } from '@/hooks/useCustomBoard';
import { LowercasePlayerName } from '@/types/player-name';
import { Chess } from 'chess.js';
import { Button, Clipboard, TextInput, Tooltip } from 'flowbite-react';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Chessboard,
  ChessboardDnDProvider,
  SparePiece,
} from 'react-chessboard';
import { Piece, Square } from 'react-chessboard/dist/chessboard/types';
import { VscSearchFuzzy } from 'react-icons/vsc';

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

type Props = {
  fen?: string;
  isGuide?: boolean;
};
const DragDropSetupChessboard = ({
  fen = '8/8/8/8/8/8/8/8 w - - 0 1',
  isGuide = false,
}: Props) => {
  const { isMobile } = useAppContext();
  const t = useTranslations();
  const { customPieces, bgDark, bgLight } = useCustomBoard();
  const game = useMemo(() => new Chess(fen), [fen]); // empty board
  const [boardOrientation, setBoardOrientation] =
    useState<LowercasePlayerName>('white');
  const [boardWidth, setBoardWidth] = useState(360);
  const [fenPosition, setFenPosition] = useState(game.fen());
  const boardRef = useRef<HTMLDivElement>(null);

  const handleSparePieceDrop = (piece: any, targetSquare: any) => {
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

  const handlePieceDrop = (
    sourceSquare: any,
    targetSquare: any,
    piece: any
  ) => {
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

  const handleFenInputChange = (e: any) => {
    const fen = e.target.value;
    const { valid } = game.validate_fen(fen);

    setFenPosition(fen);
    if (valid) {
      game.load(fen);
      setFenPosition(game.fen());
    }
  };

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

  const analysis = useCallback(() => {
    window.open(`/analysis?fen=${game.fen()}`, '_blank');
  }, [game]);

  const onFlipBoard = useCallback(() => {
    setBoardOrientation(boardOrientation === 'white' ? 'black' : 'white');
  }, [boardOrientation]);

  const whitePieces = useMemo(() => pieces.slice(0, 6), []);
  const blackPieces = useMemo(() => pieces.slice(6, 12), []);
  const topPieces = useMemo(
    () => (boardOrientation === 'white' ? blackPieces : whitePieces),
    [blackPieces, boardOrientation, whitePieces]
  );
  const bottomPieces = useMemo(
    () => (boardOrientation === 'white' ? whitePieces : blackPieces),
    [blackPieces, boardOrientation, whitePieces]
  );

  return (
    <ChessboardDnDProvider>
      <div className="grid grid-cols-1 md:grid-cols-[400px_auto] lg:grid-cols-[500px_auto] gap-2 lg:gap-8 mx-auto max-w-[900px]">
        <div ref={boardRef}>
          <div
            style={{
              display: 'flex',
              margin: `${boardWidth / 32}px ${boardWidth / 8}px`,
            }}
          >
            {topPieces.map((piece) => (
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
            boardWidth={isMobile ? boardRef.current?.clientWidth || 320 : 500}
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
            {bottomPieces.map((piece) => (
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
              outline
              gradientDuoTone="cyanToBlue"
            >
              {t('setup-board.start-position')}
            </Button>
            <Button
              onClick={() => {
                game.clear();
                setFenPosition(game.fen());
              }}
              className="mb-4"
              outline
              gradientDuoTone="pinkToOrange"
            >
              {t('setup-board.clear-board')}
            </Button>
            <Button
              onClick={onFlipBoard}
              outline
              gradientDuoTone="purpleToBlue"
            >
              {t('setup-board.flip-board')}
            </Button>
          </div>
          {!isGuide && (
            <>
              <div className="flex flex-col items-center mt-4">
                <label className="mb-2 font-semibold text-gray-700">
                  {t('setup-board.next-player-to-move')}
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
                    {t('common.title.white')}
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
                    {t('common.title.black')}
                  </Button>
                </div>
              </div>

              <div className="flex flex-col items-center mt-4">
                <TextInput
                  className="w-[400px] rounded"
                  value={fenPosition}
                  onChange={handleFenInputChange}
                  placeholder="Paste FEN position to start editing"
                />
                <div className="flex items-center mt-4">
                  <Clipboard
                    valueToCopy={game.fen()}
                    label={t('common.button.copy-fen')}
                    className="py-[10px] px-2"
                    theme={{
                      button: {
                        base: 'bg-light',
                        label: 'text-black',
                      },
                    }}
                  />
                  <Tooltip
                    content={t('common.navigation.analysis')}
                    placement="top"
                  >
                    <Button color="primary" onClick={analysis} className="ml-4">
                      <VscSearchFuzzy size={20} className="ml-2" />
                    </Button>
                  </Tooltip>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </ChessboardDnDProvider>
  );
};

export default DragDropSetupChessboard;
