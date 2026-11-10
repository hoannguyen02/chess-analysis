"""Exact mate-in-one proof and indexed master-game collection."""
from collections import Counter
from concurrent.futures import ProcessPoolExecutor
import hashlib
from itertools import islice

import chess

from discovery_research import provenance
from research_index import disposition
from tactic_research import ResearchCache, atomic_json, code_version, digest

TOPIC = 'mate-in-one'
VALUES = (0, 100, 320, 330, 500, 900, 0)
LEVELS = ('Beginner', 'A', 'B')
WINDOW = 6


def record_hash(record):
    return digest(record)


def start_board(record):
    return chess.Board(record['fen'])


def roots(board):
    result = []
    for move in board.legal_moves:
        san = board.san(move)
        after = board.copy(stack=False)
        after.push(move)
        check = after.is_check()
        result.append({'move': san, 'immediateMate': after.is_checkmate(), 'check': check,
                       'defencesToCheck': [after.san(reply) for reply in after.legal_moves] if check else []})
    return result


def beginner_outcomes(board, record):
    return {row['move']: row['immediateMate'] for row in roots(board)}


def material(board):
    return sum(VALUES[piece.piece_type] * (1 if piece.color == board.turn else -1)
               for piece in board.piece_map().values())


def pattern(board, move):
    capture = board.is_capture(move)
    special = ('promotion' if move.promotion else 'castling' if board.is_castling(move)
               else 'en-passant' if board.is_en_passant(move) else None)
    after = board.copy(stack=False)
    after.push(move)
    checkers = list(after.checkers())
    king = after.king(after.turn)
    support = []
    for square in chess.SquareSet(after.occupied_co[board.turn]):
        piece = after.piece_at(square)
        if square in checkers or piece.piece_type == chess.KING:
            continue
        without = after.copy(stack=False)
        without.remove_piece_at(square)
        replies = sorted(without.san(reply) for reply in without.legal_moves)
        if replies:
            support.append({'square': chess.square_name(square), 'piece': piece.symbol().upper(),
                            'defences': replies})
    return {'mover': board.piece_at(move.from_square).symbol().upper(), 'capture': capture,
            'special': special, 'initialCheck': board.is_check(),
            'discovery': move.to_square not in checkers and special != 'castling',
            'doubleCheck': len(checkers) > 1, 'king': chess.square_name(king),
            'checkers': [chess.square_name(square) for square in checkers],
            'essentialSupport': support}


def coordination(shape):
    return (len(shape['essentialSupport']) >= 2 or shape['initialCheck']
            or shape['discovery'] or shape['doubleCheck']
            or shape['special'] in ('castling', 'en-passant'))


def review(record, _engine, _settings, complete=False, require_provenance=True):
    board = start_board(record)
    level = record['level']
    if (level not in LEVELS or record['goal'] != 'mate' or record['solverMoves'] != 1
            or len(record['moves']) != 1 or not board.is_valid() or board.is_game_over()
            or type(record['ply']) is not int or not 0 < record['ply'] <= len(record['gameMoves'])):
        raise ValueError('Invalid one-move checkmate scope or position')
    flags = provenance(record) if require_provenance else []
    if require_provenance and record['source'] not in {ref['url'] for ref in record['sourceReferences']}:
        flags.append('source-archive-mismatch')
    compared = roots(board)
    mates = [row['move'] for row in compared if row['immediateMate']]
    san = record['moves'][0]
    if san not in mates:
        raise ValueError('The saved move must be a legal immediate checkmate')
    move = board.parse_san(san)
    shape = pattern(board, move)
    if level in ('A', 'B') and (level == 'B') != bool(coordination(shape)):
        flags.append('mate-coordination-does-not-match-level')
    after = board.copy(stack=False)
    after.push(move)
    return {'gameId': record['gameId'], 'recordHash': record_hash(record), 'flags': flags,
            'status': 'withheld' if flags else 'needs-editorial-review',
            'preflight': {'initialMaterialCp': material(board), 'coverage': shape,
                          'cluster': [shape[key] for key in ('mover', 'capture', 'special', 'initialCheck',
                                                            'discovery', 'doubleCheck')]
                          + [sorted(piece['piece'] for piece in shape['essentialSupport'])]},
            'analysis': {'roots': compared},
            'alternativeMates': [mate for mate in mates if mate != san],
            'mateProof': {'status': 'proved', 'solverMoves': 1, 'nodes': len(compared),
                          'mate': san, 'defences': []},
            'timeline': {'timeline': [{'move': san, 'ply': 0, 'replies': [],
                                       'materialGain': -material(after) - material(board)}]}}


def verify_review(record, evidence):
    expected = review(record, None, None)
    if record['level'] == 'Beginner':
        from beginner_one_move import beginner_answer, require_unique_answer
        board = start_board(record)
        require_unique_answer(board, beginner_answer(board, record['moves']), beginner_outcomes(board, record))
    if expected['flags'] or any(evidence.get(key) != value for key, value in expected.items()):
        raise ValueError(f'{record["gameId"]}: exact mate proof, grade or source replay mismatch')


def scan_game(record):
    board = chess.Board(record['gameFen'])
    frames, uci = [], []
    sans = record['gameMoves']
    for ply, san in enumerate(sans):
        if ply >= len(sans) - WINDOW:
            frames.append((ply, board.copy()))
        move = board.parse_san(san)
        uci.append(move.uci())
        board.push(move)
    frames.append((len(sans), board))
    ident = hashlib.sha256(' '.join(uci).encode()).hexdigest()[:16]
    if record['gameId'] not in (None, ident):
        raise ValueError('Indexed game identity mismatch')
    winner = record['headers']['Result'] == '1-0'
    candidates = []
    for ply, frame in reversed(frames):
        if frame.turn != winner or frame.is_game_over() or abs(material(frame)) > 900:
            continue
        mates = [row['move'] for row in roots(frame) if row['immediateMate']]
        if not mates:
            continue
        played = ply < len(sans) and sans[ply] in mates
        san = sans[ply] if played else mates[0]
        shape = pattern(frame, frame.parse_san(san))
        previous = frame.copy()
        previous.pop()
        levels = ['B' if coordination(shape) else 'A']
        if len(mates) == 1 and len(frame.piece_map()) <= 10:
            levels.append('Beginner')
        for level in levels:
            candidates.append({**record, 'gameId': ident, 'level': level, 'goal': 'mate',
                               'solverMoves': 1, 'moves': [san], 'ply': ply, 'fen': frame.fen(en_passant='fen'),
                               'previousMove': {'fen': previous.fen(en_passant='fen'), 'move': sans[ply - 1]},
                               'screen': {'played': played, 'pattern': shape, 'material': material(frame),
                                          'side': 'white' if winner else 'black'}})
    return candidates


def collect(db, *, cache, workers, output, levels, target, max_games, existing):
    from collect_two_rook_mate import source_games
    counts = Counter(row['level'] for row in existing)
    seen = {row['gameId'] for row in existing}
    positions = {chess.Board(row['fen']).epd() for row in existing}
    selected, metrics = [], Counter()
    version = code_version('mate_in_one_research.py', 'collect_two_rook_mate.py')
    games = islice(source_games(db, all_wins=True), max_games or None)
    store = ResearchCache(cache)
    try:
        with ProcessPoolExecutor(max_workers=workers) as pool:
            while batch := list(islice(games, workers * 8)):
                entries = [(record, digest([version, chess.__version__, record])) for record in batch]
                cached = {key: store.get('mate-in-one-geometry', key) for _, key in entries}
                missing = [(record, key) for record, key in entries if cached[key] is None]
                for (_, key), rows in zip(missing, pool.map(scan_game, (record for record, _ in missing))):
                    store.put('mate-in-one-geometry', key, rows)
                    cached[key] = rows
                metrics.update(games=len(batch), replays=len(missing), geometryHits=len(batch) - len(missing))
                for _, key in entries:
                    for row in sorted(cached[key], key=lambda row: not row['screen']['played']):
                        level, ident = row['level'], row['gameId']
                        position = chess.Board(row['fen']).epd()
                        if (level not in levels or counts[level] >= target or ident in seen
                                or position in positions or disposition(db, TOPIC, row) is not None):
                            continue
                        selected.append(row)
                        seen.add(ident)
                        positions.add(position)
                        counts[level] += 1
                report = {'records': selected, 'metrics': dict(metrics),
                          'requestedLeadTargetMet': all(counts[level] >= target for level in levels)}
                atomic_json(output, report)
                if report['requestedLeadTargetMet']:
                    return report
    finally:
        store.close()
    return {'records': selected, 'metrics': dict(metrics), 'requestedLeadTargetMet': False}
