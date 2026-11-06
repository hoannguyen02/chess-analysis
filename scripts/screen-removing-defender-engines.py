#!/usr/bin/env python3
"""Rank archive leads, caching each distinct FEN under exact engine settings.

Low-node MultiPV is screening only. Output and checkpoint are disposable and
must stay outside the repository; no record is approved by this script.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import chess
import chess.engine


def atomic(path, data):
    tmp = path.with_suffix(path.suffix + '.tmp')
    tmp.write_text(json.dumps(data, separators=(',', ':')))
    os.replace(tmp, path)

def main():
    p = argparse.ArgumentParser()
    p.add_argument('inputs', nargs='+', type=Path)
    p.add_argument('--output', required=True, type=Path)
    p.add_argument('--nodes', type=int, default=50000)
    args = p.parse_args()
    if str(args.output.resolve()).startswith(str(Path.cwd().resolve()) + '/'):
        p.error('screen cache must be outside the repository')
    archives = [json.loads(path.read_text()) for path in args.inputs]
    if not all(archive['complete'] for archive in archives):
        raise SystemExit('input archive scan incomplete')
    engine = chess.engine.SimpleEngine.popen_uci('/opt/homebrew/bin/stockfish')
    engine.configure({'Threads':1, 'Hash':64})
    settings = {'engine':engine.id, 'nodes':args.nodes, 'threads':1, 'hashMB':64,
                'multiPV':'all legal moves',
                'archives':[archive['sha256'] for archive in archives]}
    if args.output.exists():
        data = json.loads(args.output.read_text())
        if data['settings'] != settings: raise SystemExit('checkpoint settings differ')
    else:
        data = {'settings':settings, 'complete':False, 'positions':{}}
    leads = {}
    seen_games = set()
    for archive in archives:
        for record in archive['records']:
            decision = (record['fen'], record['move'], record['target'])
            leads.setdefault(decision, record)
    try:
        for fen in sorted({key[0] for key in leads}):
            if fen in data['positions']: continue
            board = chess.Board(fen)
            infos = engine.analyse(board, chess.engine.Limit(nodes=args.nodes), multipv=board.legal_moves.count())
            variations = []
            for info in infos:
                probe = board.copy(); line = []
                for move in info.get('pv', [])[:8]:
                    line.append(probe.san(move)); probe.push(move)
                score = info['score'].pov(board.turn)
                variations.append({'line':line,'cp':score.score(),'mate':score.mate(), 'depth':info['depth']})
            data['positions'][fen] = variations
            if len(data['positions']) % 25 == 0: atomic(args.output,data)
        data['complete'] = True; atomic(args.output,data)
    finally:
        engine.quit()
    print('screened',len(data['positions']),'unique FENs from',len(leads),'unique leads')

if __name__ == '__main__': main()
