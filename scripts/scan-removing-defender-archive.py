#!/usr/bin/env python3
"""Checkpointed geometric lead scan over a complete PGN archive.

Output is disposable and must be outside the repository. Leads are not proved
or approved exercises; title credentials and source data need review.
"""
import argparse
import hashlib
import io
import json
import os
from pathlib import Path
import zipfile
import chess
import chess.pgn

VALUES = {1: 1, 2: 3, 3: 3, 4: 5, 5: 9, 6: 0}

def balance(board):
    return sum((1 if p.color else -1) * VALUES[p.piece_type]
               for p in board.piece_map().values())

def scan_game(game):
    board = game.board()
    all_moves = list(game.mainline_moves())
    sans = []
    leads = []
    for ply, move in enumerate(all_moves):
        san = board.san(move)
        if (board.is_capture(move) and not board.is_en_passant(move)
                and board.is_attacked_by(not board.turn, move.to_square)):
            us, captured = board.turn, move.to_square
            targets = [square for square, piece in board.piece_map().items()
                       if piece.color != us and piece.piece_type != chess.KING
                       and square != captured
                       and captured in board.attackers(not us, square)
                       and len(board.attackers(not us, square)) == 1
                       and board.attackers(us, square)]
            if targets and abs(balance(board)) <= 3:
                next_board = board.copy(); next_board.push(move)
                recaptures = [m for m in next_board.legal_moves if m.to_square == captured
                              and next_board.is_capture(m)]
                for target in targets:
                    for reply in recaptures:
                        p = next_board.copy(); p.push(reply)
                        captures = [m for m in p.legal_moves if m.to_square == target
                                    and p.is_capture(m)]
                        if captures:
                            leads.append({'ply':ply, 'fen':board.fen(), 'move':san,
                                          'target':chess.square_name(target),
                                          'screenLine':[san, next_board.san(reply), p.san(captures[0])]})
                            break
        sans.append(san); board.push(move)
    return sans, leads

def atomic(path, data):
    tmp = path.with_suffix(path.suffix + '.tmp')
    tmp.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')))
    os.replace(tmp, path)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('archive', type=Path); parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--source', required=True); parser.add_argument('--retrieved', required=True)
    args = parser.parse_args()
    if str(args.output.resolve()).startswith(str(Path.cwd().resolve()) + '/'):
        parser.error('output must be outside the repository')
    digest = hashlib.sha256(args.archive.read_bytes()).hexdigest()
    if args.output.exists():
        state = json.loads(args.output.read_text())
        if state['sha256'] != digest or state['source'] != args.source:
            raise SystemExit('checkpoint archive or source mismatch')
    else:
        state = {'archive':args.archive.name, 'source':args.source, 'sha256':digest,
                 'retrieved':args.retrieved, 'scanned':0, 'gamesParsed':0,
                 'parseErrors':0, 'eligibleGames':0, 'complete':False,
                 'gameKeys':[], 'records':[]}
    seen = set(state['gameKeys'])
    with zipfile.ZipFile(args.archive) as z:
        names = [n for n in z.namelist() if n.lower().endswith('.pgn')]
        if len(names) != 1: raise ValueError('expected exactly one PGN file')
        with z.open(names[0]) as raw:
            stream = io.TextIOWrapper(raw, encoding='utf-8-sig', errors='replace')
            index = 0
            while True:
                game = chess.pgn.read_game(stream)
                if game is None: break
                index += 1
                if index <= state['scanned']: continue
                state['gamesParsed'] += 1
                if game.errors:
                    state['parseErrors'] += 1
                else:
                    try:
                        ratings = [int(game.headers.get(key, '0')) for key in ('WhiteElo', 'BlackElo')]
                    except ValueError:
                        ratings = [0,0]
                    if min(ratings) >= 2400:
                        moves = list(game.mainline_moves())
                        game_key = hashlib.sha256((game.board().fen() + ' ' + ' '.join(m.uci() for m in moves)).encode()).hexdigest()
                        if game_key not in seen:
                            seen.add(game_key); state['gameKeys'].append(game_key)
                            state['eligibleGames'] += 1
                            sans, leads = scan_game(game)
                            for lead in leads:
                                lead.update({'gameKey':game_key, 'headers':dict(game.headers),
                                             'gameFen':game.board().fen(), 'gameMoves':sans})
                            state['records'].extend(leads)
                state['scanned'] = index
                if index % 250 == 0: atomic(args.output, state)
    state['complete'] = True; atomic(args.output, state)
    print(args.archive.name, 'games', state['gamesParsed'], 'eligible', state['eligibleGames'],
          'leads', len(state['records']), 'errors', state['parseErrors'], flush=True)

if __name__ == '__main__': main()
