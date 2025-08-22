/* eslint-disable @typescript-eslint/ban-ts-comment */
'use client';

import { useAppContext } from '@/contexts/AppContext';
import { useCustomBoard } from '@/hooks/useCustomBoard';
import { LowercasePlayerName } from '@/types/player-name';
import { getActivePlayerFromFEN } from '@/utils/get-player-name-from-fen';
import { Chess, Move } from 'chess.js';
import { Button, Textarea, ToggleSwitch, Tooltip } from 'flowbite-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import {
  VscArrowCircleLeft,
  VscArrowCircleRight,
  VscChevronLeft,
  VscChevronRight,
  VscCopy,
  VscLayoutPanel,
  VscSearchFuzzy,
} from 'react-icons/vsc';

const DEFAULT_PGN = `1.Nf3 Nf6 2.c4 g6 3.Nc3 Bg7 4.d4 O-O 5.Bf4 d5 6.Qb3 dxc4 7.Qxc4 c6 8.e4 Nbd7
9.Rd1 Nb6 10.Qc5 Bg4 11.Bg5 Na4 12.Qa3 Nxc3 13.bxc3 Nxe4 14.Bxe7 Qb6 15.Bc4 Nxc3
16.Bc5 Rfe8+ 17.Kf1 Be6 18.Bxb6 Bxc4+ 19.Kg1 Ne2+ 20.Kf1 Nxd4+ 21.Kg1 Ne2+
22.Kf1 Nc3+ 23.Kg1 axb6 24.Qb4 Ra4 25.Qxb6 Nxd1 26.h3 Rxa2 27.Kh2 Nxf2 28.Re1 Rxe1
29.Qd8+ Bf8 30.Nxe1 Bd5 31.Nf3 Ne4 32.Qb8 b5 33.h4 h5 34.Ne5 Kg7 35.Kg1 Bc5+
36.Kf1 Ng3+ 37.Ke1 Bb4+ 38.Kd1 Bb3+ 39.Kc1 Ne2+ 40.Kb1 Nc3+ 41.Kc1 Rc2+  0-1`;

export const EvaluateMoves = () => {
  const { customPieces, bgDark, bgLight } = useCustomBoard();
  const { isMobile } = useAppContext();
  const boardRef = useRef<HTMLDivElement>(null);
  const [currentFen, setCurrentFen] = useState('');
  const [startFen, setStartFen] = useState('');
  const [pgnMoves, setPgnMoves] = useState<Move[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState<number>(0);
  const [pgnText, setPgnText] = useState<string>(DEFAULT_PGN);
  const [showPGNBox, setShowPGNBox] = useState<boolean>(true);
  const t = useTranslations();

  const gameRef = useRef(new Chess());

  const playerName: LowercasePlayerName = useMemo(() => {
    return getActivePlayerFromFEN(
      startFen
    )?.toLowerCase() as LowercasePlayerName;
  }, [startFen]);

  const [boardOrientation, setBoardOrientation] =
    useState<LowercasePlayerName>('white');

  useEffect(() => {
    setBoardOrientation(playerName);
  }, [playerName]);

  useEffect(() => {
    const game = gameRef.current;
    game.reset();

    if (game.load_pgn(pgnText)) {
      const headers = game.header();

      // Determine start position (custom or standard)
      const initialFen =
        headers.SetUp === '1' && headers.FEN
          ? headers.FEN
          : (() => {
              game.reset();
              return game.fen();
            })();

      setStartFen(initialFen);

      game.load_pgn(pgnText);
      const allMoves = game.history({ verbose: true });
      for (const move of allMoves) game.move(move); // ⚠️ applies all moves
      setCurrentFen(game.fen()); // final state, not initial

      setPgnMoves(allMoves);
      setCurrentMoveIndex(0);
    }
  }, [pgnText]);

  const onNext = () => {
    if (currentMoveIndex < pgnMoves.length) {
      gameRef.current.move(pgnMoves[currentMoveIndex]);
      setCurrentMoveIndex((prev) => prev + 1);
      setCurrentFen(gameRef.current.fen());
    }
  };

  const onPrev = () => {
    if (currentMoveIndex > 0) {
      gameRef.current.undo();
      setCurrentMoveIndex((prev) => prev - 1);
      setCurrentFen(gameRef.current.fen());
    }
  };

  const onFirst = () => {
    console.log('startFen', startFen);
    if (startFen) {
      gameRef.current.load(startFen);
      setCurrentMoveIndex(0);
      setCurrentFen(startFen); // ✅ this triggers the Chessboard to update
    }
  };

  const onLast = () => {
    gameRef.current.reset();
    if (startFen) gameRef.current.load(startFen);
    for (let i = 0; i < pgnMoves.length; i++) {
      gameRef.current.move(pgnMoves[i]);
    }
    setCurrentMoveIndex(pgnMoves.length);
    setCurrentFen(gameRef.current.fen());
  };

  const analysis = useCallback(() => {
    window.open(`/analysis?fen=${gameRef.current.fen()}`, '_blank');
  }, [gameRef]);

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        console.log('Copied to clipboard:', text);
        // Optionally, you can show a toast or some visual feedback here
      })
      .catch((err) => console.error('Failed to copy:', err));
  }, []);

  return (
    <div className="max-w-[900px] mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-[500px_auto] gap-4">
        <div ref={boardRef}>
          <Chessboard
            boardOrientation={boardOrientation}
            boardWidth={isMobile ? boardRef.current?.clientWidth || 320 : 500}
            position={currentFen}
            customPieces={customPieces}
            customDarkSquareStyle={{ backgroundColor: bgDark }}
            customLightSquareStyle={{ backgroundColor: bgLight }}
            customBoardStyle={{
              borderRadius: '4px',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
            }}
          />
          <div className="flex justify-center space-x-2 mt-4">
            <Button color="gray" onClick={onFirst}>
              <VscArrowCircleLeft size={20} />
            </Button>
            <Button color="gray" onClick={onPrev}>
              <VscChevronLeft size={20} />
            </Button>
            <Button color="gray" onClick={onNext}>
              <VscChevronRight size={20} />
            </Button>
            <Button color="gray" onClick={onLast}>
              <VscArrowCircleRight size={20} />
            </Button>
          </div>
        </div>
        <div className="p-4 border rounded relative">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">PGN Viewer</h2>
            <ToggleSwitch
              checked={showPGNBox}
              onChange={setShowPGNBox}
              label="Show PGN Box"
            />
          </div>
          {showPGNBox && (
            <Textarea
              className="w-full text-sm"
              rows={15}
              value={pgnText}
              onChange={(e) => setPgnText(e.target.value)}
              placeholder="Paste your PGN here"
            />
          )}
          <div className="mt-4 lg:mt-0 lg:absolute bottom-4 left-0 w-full flex justify-center">
            <Tooltip content={t('common.button.copy-fen')} placement="top">
              <Button
                color="gray"
                onClick={() => handleCopy(gameRef.current.fen())}
              >
                <VscCopy size={20} />
              </Button>
            </Tooltip>
            <Tooltip content={t('common.button.flip-board')} placement="top">
              <Button
                className="ml-4"
                color="gray"
                onClick={() => {
                  setBoardOrientation(
                    boardOrientation === 'white' ? 'black' : 'white'
                  );
                }}
              >
                <VscLayoutPanel size={20} />
              </Button>
            </Tooltip>
            <Button color="primary" onClick={analysis} className="ml-4">
              <VscSearchFuzzy size={20} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
