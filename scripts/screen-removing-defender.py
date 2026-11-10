#!/usr/bin/env python3
"""Generate non-publishable defender-removal leads from saved complete games.

This narrow screen is not a tactical proof or an editorial decision. The cache
and output belong outside the repository. Its checkpoint includes the engine
identity and exact analysis parameters; interrupted batches can be resumed.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import chess
import chess.engine

SOURCE = Path('scripts/fixtures/pin/researched.json')

def leads():
    records = json.loads(SOURCE.read_text())['records']
    unique = set()
    for record in records:
        board = chess.Board(record['gameFen'])
        for ply, san in enumerate(record['gameMoves']):
            move = board.parse_san(san)
            if board.is_capture(move) and not board.is_en_passant(move):
                side, square = board.turn, move.to_square
                targets = [s for s, piece in board.piece_map().items()
                    if piece.color != side and piece.piece_type != chess.KING
                    and s != square and square in board.attackers(not side, s)
                    and len(board.attackers(not side, s)) == 1
                    and board.attackers(side, s)]
                for target in targets:
                    after = board.copy()
                    after.push(move)
                    recaptures = [m for m in after.legal_moves
                                  if m.to_square == square and after.is_capture(m)]
                    for recapture in recaptures:
                        next_board = after.copy()
                        next_board.push(recapture)
                        captures = [m for m in next_board.legal_moves
                                    if m.to_square == target and next_board.is_capture(m)]
                        key = (board.fen(), move.uci(), chess.square_name(target))
                        if captures and key not in unique:
                            unique.add(key)
                            yield {'gameId':record['gameId'], 'headers':record['headers'],
                                   'source':record['source'], 'ply':ply,
                                   'fen':board.fen(), 'move':san,
                                   'geometricLine':[san, after.san(recapture), next_board.san(captures[0])],
                                   'target':chess.square_name(target)}
                            break
            board.push(move)

def atomic(path, data):
    temporary = path.with_suffix(path.suffix + '.tmp')
    temporary.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n')
    os.replace(temporary, path)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--nodes', type=int, default=30000)
    args = parser.parse_args()
    if str(args.output.resolve()).startswith(str(Path.cwd().resolve()) + '/'):
        parser.error('screen cache must be outside the repository')
    engine = chess.engine.SimpleEngine.popen_uci('/opt/homebrew/bin/stockfish')
    engine.configure({'Threads':1, 'Hash':64})
    settings = {'engine':engine.id, 'nodes':args.nodes, 'threads':1, 'hashMB':64,
                'multipv':'all legal moves', 'sourceSha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest()}
    if args.output.exists():
        data = json.loads(args.output.read_text())
        if data['settings'] != settings: raise SystemExit('cache settings do not match')
    else:
        data = {'settings':settings, 'complete':False, 'records':[]}
    seen = {(item['fen'],item['move'],item['target']) for item in data['records']}
    try:
        for lead in leads():
            if (lead['fen'],lead['move'],lead['target']) in seen: continue
            board = chess.Board(lead['fen'])
            infos = engine.analyse(board, chess.engine.Limit(nodes=args.nodes), multipv=board.legal_moves.count())
            variations = []
            for info in infos:
                probe = board.copy()
                line = []
                for move in info.get('pv',[])[:10]:
                    line.append(probe.san(move)); probe.push(move)
                score = info['score'].pov(board.turn)
                variations.append({'line':line, 'cp':score.score(), 'mate':score.mate()})
            lead['variations'] = variations
            data['records'].append(lead)
            atomic(args.output,data)
        data['complete'] = True
        atomic(args.output,data)
    finally:
        engine.quit()
    print(f"screened {len(data['records'])} leads; complete={data['complete']}; output={args.output}")

if __name__ == '__main__': main()
