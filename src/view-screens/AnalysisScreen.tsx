/* eslint-disable @typescript-eslint/ban-ts-comment */
'use client';

import DebouncedInput from '@/components/DebounceInput';
import { useAppContext } from '@/contexts/AppContext';
import { useCustomBoard } from '@/hooks/useCustomBoard';
import { Chess, Square } from 'chess.js';
import { Button, Dropdown, Tooltip } from 'flowbite-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { VscChevronLeft, VscSync } from 'react-icons/vsc';

const DEFAULT_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'; // Default starting position

export const AnalysisScreen = () => {
  const { customPieces, bgDark, bgLight } = useCustomBoard();
  const router = useRouter();
  const { isMobile, isManageRole } = useAppContext();
  const boardRef = useRef<HTMLDivElement>(null);
  const t = useTranslations();
  const [engine, setEngine] = useState<Worker | null>(null);
  const [inputFen, setInputFen] = useState('');
  const game = useMemo(() => new Chess(inputFen), [inputFen]);
  const [chessBoardPosition, setChessBoardPosition] = useState('');

  const [positionEvaluation, setPositionEvaluation] = useState(0);
  const [depth, setDepth] = useState(18);
  const [bestLine, setBestline] = useState('');
  const [possibleMate, setPossibleMate] = useState('');

  useEffect(() => {
    const fen = (router.query.fen as string) || DEFAULT_FEN;
    setChessBoardPosition(fen);
    setInputFen(fen);
  }, [router]);

  useEffect(() => {
    try {
      console.log('Initializing Stockfish...');
      const stockfish = new Worker('/stockfish/stockfish-17-lite.js');

      stockfish.onmessage = (event) => {
        console.log('Stockfish message:', event.data);
      };

      stockfish.postMessage('uci'); // Send a test command
      setEngine(stockfish);
      console.log('Stockfish initialized:', stockfish);
    } catch (error) {
      console.error('Failed to initialize Stockfish:', error);
    }

    return () => {
      if (engine) {
        engine.terminate();
        console.log('Stockfish worker terminated.');
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function findBestMove() {
    if (!engine) return;

    engine.postMessage(`position fen ${chessBoardPosition}`);
    engine.postMessage(`go depth ${depth}`);

    engine.onmessage = (event) => {
      const message = event.data;
      console.log('Stockfish response:', message);

      // Extract depth
      const depthMatch = message.match(/depth (\d+)/);
      if (depthMatch) {
        setDepth(Number(depthMatch[1]));
      }

      // Extract position evaluation (Score)
      const evalMatch = message.match(/score cp (-?\d+)/);
      if (evalMatch) {
        const evaluation = Number(evalMatch[1]) / 100; // Convert centipawns to standard evaluation
        setPositionEvaluation(game.turn() === 'w' ? evaluation : -evaluation); // Flip for black
      }

      // Handle mate in X moves
      const mateMatch = message.match(/score mate (-?\d+)/);
      if (mateMatch) {
        setPossibleMate(mateMatch[1]); // Set mate in X moves
      }

      // Capture best line (PV)
      const pvMatch = message.match(/ pv (.+)/);
      if (pvMatch) {
        setBestline(pvMatch[1]);
      }
    };
  }

  function onDrop(sourceSquare: Square, targetSquare: Square, piece: any) {
    const move = game.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: piece[1].toLowerCase() ?? 'q',
    });
    setPossibleMate('');
    setChessBoardPosition(game.fen());

    // illegal move
    if (move === null) return false;

    engine?.postMessage('stop');

    setBestline('');

    if (game.game_over() || game.in_draw()) return false;

    return true;
  }

  useEffect(() => {
    if (!game.game_over() && !game.in_draw()) {
      console.log('Calling findBestMove()...');
      findBestMove();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chessBoardPosition]);

  const bestMove = bestLine?.split(' ')?.[0];

  const handleFenInputChange = (value: string) => {
    const { valid } = game.validate_fen(value);

    if (valid) {
      setInputFen(value);
      game.load(value);
      setChessBoardPosition(value || game.fen());
    }
  };

  const onResetBoard = () => {
    const fen = inputFen || DEFAULT_FEN;
    game.load(fen);
    setChessBoardPosition(fen);
  };

  return (
    <>
      <div className="flex max-w-[500px] w-full mx-auto mb-4">
        <DebouncedInput
          onChange={handleFenInputChange}
          initialValue={inputFen}
          placeholder="Paste FEN to start analysing custom position"
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[500px_auto] gap-2 lg:gap-4 mx-auto max-w-[900px]">
        <div ref={boardRef}>
          <Chessboard
            boardWidth={isMobile ? boardRef.current?.clientWidth || 320 : 500}
            position={chessBoardPosition}
            onPieceDrop={onDrop}
            customPieces={customPieces}
            customDarkSquareStyle={{
              backgroundColor: bgDark,
            }}
            customLightSquareStyle={{
              backgroundColor: bgLight,
            }}
            customBoardStyle={{
              borderRadius: '4px',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
            }}
            // @ts-ignore
            customArrows={
              bestMove && [
                [
                  bestMove.substring(0, 2) as Square,
                  bestMove.substring(2, 4) as Square,
                  '#0000FF',
                ],
              ]
            }
          />
        </div>
        <div className="relative rounded lg:border-[1px] p-4">
          <div className="flex items-center space-x-2">
            <Dropdown label={`${t('analysis.depth')} ${depth}`} inline>
              {[12, 14, 16, 18, 20, 25, 30].map((d) => (
                <Dropdown.Item key={d} onClick={() => setDepth(d)}>
                  {d}
                </Dropdown.Item>
              ))}
            </Dropdown>
          </div>

          <p className="text-gray-700 dark:text-gray-300 mt-2">
            {t('analysis.position-evaluation')}{' '}
            <span
              className={
                positionEvaluation > 0 ? 'text-green-500' : 'text-red-500'
              }
            >
              {possibleMate ? `#${possibleMate}` : positionEvaluation}
            </span>
          </p>

          <p className="mt-2 text-gray-700 dark:text-gray-300">
            {t('analysis.best-line')}{' '}
            <span className="font-mono text-blue-600 dark:text-blue-400">
              {bestLine.slice(0, 40)}...
            </span>
          </p>

          <div className="flex space-x-4 mt-6">
            <Tooltip content={t('common.button.restart')} placement="top">
              <Button color="gray" onClick={onResetBoard}>
                <VscSync size={20} />
              </Button>
            </Tooltip>

            <Tooltip content={t('analysis.undo')} placement="top">
              <Button
                color="gray"
                onClick={() => {
                  game.undo();
                  setChessBoardPosition(game.fen());
                }}
              >
                <VscChevronLeft size={20} />
              </Button>
            </Tooltip>
          </div>
        </div>
      </div>
    </>
  );
};
