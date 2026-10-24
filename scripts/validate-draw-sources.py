"""Independently validate active full-game sources with python-chess.
Optional --tables DIR repeats exact Syzygy probes rather than only checking saved evidence.
"""
import argparse
import collections
import hashlib
import io
import json
from pathlib import Path
import chess
import chess.pgn
import chess.syzygy

parser = argparse.ArgumentParser()
parser.add_argument('--tables')
args = parser.parse_args()
root = Path(__file__).parent / 'fixtures' / 'draw-practice'
fixture = json.loads((root / 'expanded-draw-sources.json').read_text())
tables = chess.syzygy.open_tablebase(args.tables) if args.tables else None
seen = set()
counts = collections.Counter()
probes = 0

def same_colour(a, b):
    return (chess.square_file(a)+chess.square_rank(a)) % 2 == (chess.square_file(b)+chess.square_rank(b)) % 2

def check_barrier(board, motif):
    defender, attacker = board.turn, not board.turn
    own = sorted(p.piece_type for p in board.piece_map().values() if p.color == defender and p.piece_type != chess.KING)
    opp = sorted(p.piece_type for p in board.piece_map().values() if p.color == attacker and p.piece_type != chess.KING)
    king = board.king(defender)
    if motif in ['rook-pawn-corner', 'wrong-bishop-rook-pawn']:
        assert own == []
        assert opp == ([chess.PAWN] if motif == 'rook-pawn-corner' else [chess.PAWN, chess.BISHOP])
        pawn = next(iter(board.pieces(chess.PAWN, attacker)))
        assert chess.square_file(pawn) in [0,7]
        corner = chess.square(chess.square_file(pawn), 7 if attacker else 0)
        assert chess.square_distance(king, corner) <= 1
        if motif == 'wrong-bishop-rook-pawn':
            bishop = next(iter(board.pieces(chess.BISHOP, attacker)))
            assert not same_colour(bishop, corner)
    elif motif == 'bishop-safe-corner':
        assert own == [chess.BISHOP] and opp == [chess.ROOK]
        bishop = next(iter(board.pieces(chess.BISHOP, defender)))
        assert any(chess.square_distance(king,c)<=1 and not same_colour(bishop,c) for c in [chess.A1,chess.A8,chess.H1,chess.H8])
    elif motif == 'queen-vs-seventh-rank-pawn':
        assert own == [chess.PAWN] and opp == [chess.QUEEN]
        pawn = next(iter(board.pieces(chess.PAWN, defender)))
        assert chess.square_file(pawn) in [0,2,5,7]
        assert chess.square_rank(pawn) == (6 if defender else 1)
        assert chess.square_distance(king,pawn) <= 1
    else:
        raise AssertionError('Unknown fortress mechanism')

collections_to_check = dict(fixture['games'])
collections_to_check['repetition'] = json.loads((root / 'real-repetition-games.json').read_text())
for category, records in collections_to_check.items():
    assert len(records) >= 100
    game_ids = set()
    last_length = 0
    for record in records:
        game = chess.pgn.read_game(io.StringIO(record['pgn']))
        assert game and not game.errors and game.headers['Result'] == '1/2-1/2'
        assert game.board().fen() == chess.STARTING_FEN
        moves = list(game.mainline_moves())
        identity = (game.headers['White'],game.headers['Black'],tuple(m.uci() for m in moves))
        assert identity not in game_ids
        game_ids.add(identity)
        assert len(moves) >= last_length
        last_length = len(moves)
        board = game.board()
        positions = [board.copy(stack=False)]
        for move in moves:
            assert board.is_legal(move)
            board.push(move)
            assert board.is_valid()
            positions.append(board.copy(stack=False))
        start = record['startPly']
        assert start >= 10
        end = record.get('endPly',len(moves))
        fen = positions[start].fen(en_passant='fen')
        key = ' '.join(fen.split()[:4])
        assert key not in seen
        seen.add(key)
        if 'fen' in record:
            assert record['fen'] == fen
            assert record['previousMove'] == {'fen':positions[start-1].fen(en_passant='fen'),'move':positions[start-1].san(moves[start-1])}
        replay = chess.Board(fen)
        if category == 'fortress':
            check_barrier(replay, record['motif'])
            counts[record['motif']] += 1
        for ply in range(start,end+1):
            if ply>start:
                if 'moves' in record: assert replay.san(moves[ply-1]) == record['moves'][ply-start-1]
                replay.push(moves[ply-1])
                if category == 'perpetual-check' and (ply-start)%2==1: assert replay.is_check()
            if ply < end:
                assert not replay.is_game_over() and not replay.is_repetition(3)
            if category == 'fortress':
                evidence = record['validation']['positions'][ply-start]
                assert evidence == {'fen':replay.fen(en_passant='fen'),'wdl':0}
                assert not replay.is_game_over() and not replay.is_repetition(3)
                if tables: assert tables.probe_wdl(replay) == 0
                probes += 1
        if category in ['perpetual-check','repetition']: assert replay.is_repetition(3)
        elif category == 'stalemate': assert replay.is_stalemate()
        elif category == 'insufficient-material': assert replay.is_insufficient_material()
    print(f'{category}: {len(records)} distinct full games, legal source lines, sorted by game length')
if tables: tables.close()
print(f'Fortress mechanisms: {dict(counts)}; {probes} '+('exact Syzygy probes passed' if args.tables else 'saved draw evaluations matched'))
