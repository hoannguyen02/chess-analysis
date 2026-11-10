"""Verify a one-move checking skewer from an unchanged master-game position."""
from collections import Counter
from concurrent.futures import ProcessPoolExecutor
from functools import partial
import hashlib
from itertools import islice
import sys

import chess

from beginner_one_move import BEGINNER_MAX_PIECES, source_beginner_proof
from discovery_research import provenance as source_provenance
from hanging_piece_research import material, probe, record_hash, start_board
from pin_research import GAIN, SLIDERS, terminal
from tactic_research import ResearchCache, atomic_json, code_version, digest

TOPIC = 'skewer'
LEVEL = 'Beginner'
MAX_MATERIAL_GAP = 330


def provenance(record):
    if not 0 < record['ply'] <= len(record['gameMoves']):
        return ['missing-preceding-game-frame']
    flags = source_provenance(record)
    if record['source'] not in {ref['url'] for ref in record['sourceReferences']}:
        flags.append('source-archive-mismatch')
    if record['moves'] != record['gameMoves'][record['ply']:record['ply'] + 1]:
        flags.append('beginner-skewer-requires-played-move')
    return flags


def target_behind_king(board, move):
    king = board.king(board.turn)
    if set(board.checkers()) != {move.to_square}:
        return None
    targets = board.occupied_co[board.turn] & ~(board.kings | board.pawns)
    for square in chess.scan_forward(targets):
        if chess.between(move.to_square, square) & board.occupied == chess.BB_SQUARES[king]:
            return square
    return None


def checking_skewer(board, move):
    """Certify a quiet check, every legal reply, and every reply to the capture."""
    piece = board.piece_type_at(move.from_square)
    if (piece not in SLIDERS or board.is_check() or board.is_capture(move)
            or not board.gives_check(move)):
        return None
    side, baseline = board.turn, material(board, board.turn)
    after = board.copy()
    after.push(move)
    king = after.king(after.turn)
    rear = target_behind_king(after, move)
    if rear is None or terminal(after) or after.can_claim_draw():
        return None
    capture = chess.Move(move.to_square, rear)
    witnesses = {}
    for reply in list(after.legal_moves):
        if reply.from_square != king or reply.to_square == move.to_square:
            return None
        san = after.san(reply)
        after.push(reply)
        try:
            if (capture not in after.legal_moves or not after.is_capture(capture)
                    or terminal(after) or after.can_claim_draw()):
                return None
            capture_san = after.san(capture)
            after.push(capture)
            try:
                gain = material(after, side) - baseline
                if gain < GAIN or terminal(after) or after.can_claim_draw():
                    return None
                responses = {}
                for defence in list(after.legal_moves):
                    response = after.san(defence)
                    after.push(defence)
                    try:
                        remaining = material(after, side) - baseline
                        if remaining < GAIN or terminal(after) or after.can_claim_draw():
                            return None
                        responses[response] = remaining
                    finally:
                        after.pop()
                witnesses[san] = {'capture': capture_san, 'gain': min([gain, *responses.values()]),
                                  'recovery': responses}
            finally:
                after.pop()
        finally:
            after.pop()
    return {'attacker': chess.square_name(move.to_square), 'front': chess.square_name(king),
            'rear': chess.square_name(rear), 'attackerPiece': chess.piece_symbol(piece).upper(),
            'rearPiece': after.piece_at(rear).symbol().upper(), 'witnesses': witnesses}


def settles_gain(board, move, side, threshold):
    board.push(move)
    try:
        if board.is_checkmate():
            return True
        if material(board, side) < threshold or terminal(board) or board.can_claim_draw():
            return False
        for defence in list(board.legal_moves):
            board.push(defence)
            try:
                if material(board, side) < threshold or terminal(board):
                    return False
            finally:
                board.pop()
        return True
    finally:
        board.pop()


def short_payoff(board, move):
    """Compare roots at the same horizon as the skewer and its recovery."""
    side = board.turn
    threshold = material(board, side) + GAIN
    board.push(move)
    try:
        if board.is_checkmate():
            return True
        if terminal(board) or board.can_claim_draw():
            return False
        for defence in list(board.legal_moves):
            board.push(defence)
            try:
                # A transient lead can disappear to a countercheck. A temporary
                # deficit can also be recovered by an immediate equal exchange.
                if terminal(board) or not any(settles_gain(board, follow, side, threshold)
                                              for follow in list(board.legal_moves)):
                    return False
            finally:
                board.pop()
        return True
    finally:
        board.pop()


def beginner_outcomes(board, record):
    if record['goal'] != 'material':
        raise ValueError('unsupported-skewer-objective')
    return {board.san(move): short_payoff(board, move) for move in list(board.legal_moves)}


def scope(board, record):
    return (record['level'] == LEVEL and record['goal'] == 'material'
            and record['solverMoves'] == 1 and record['tacticPly'] == 0
            and not record.get('sacrifices') and not record.get('alternativeLines')
            and abs(material(board, board.turn)) <= MAX_MATERIAL_GAP)


def preserves_advantage(row):
    return row['mate'] > 0 if row['mate'] is not None else (
        row['cp'] is not None and row['cp'] >= GAIN)


def root_flags(roots, answer):
    sample = next(row for row in roots if row['move'] == answer)
    alternatives = [row for row in roots if row['move'] != answer]
    if (not preserves_advantage(sample)
            or any(row['mate'] is not None and row['mate'] > 0 for row in alternatives)
            or (sample['cp'] is not None and any(row['cp'] is not None and row['cp'] > sample['cp'] + 60
                                                 for row in alternatives))):
        return ['sample-inferior-or-mate-dominates']
    return []


def review(record, engine, settings, complete=False, require_provenance=True):
    board = start_board(record)
    answer, = record['moves']
    local = checking_skewer(board, board.parse_san(answer))
    flags = provenance(record) if require_provenance else []
    if not scope(board, record) or local is None:
        flags.append('essential-checking-skewer-payoff-not-proved')
    result = {'gameId': record['gameId'], 'recordHash': record_hash(record), 'flags': flags}
    if flags:
        return {**result, 'status': 'withheld'}
    coverage = {key: value for key, value in local.items() if key != 'witnesses'}
    side = board.turn
    result['preflight'] = {'initialMaterialCp': material(board, side), 'coverage': coverage,
                           'cluster': [local['attackerPiece'], local['rearPiece']]}
    roots = probe(board, engine, settings['rootNodes'], side, board.legal_moves.count())
    result['analysis'] = {'roots': roots}
    flags.extend(root_flags(roots, answer))
    if flags:
        return {**result, 'status': 'withheld'}
    board.push_san(answer)
    defences = [probe(board, engine, settings['defenceNodes'], side, root_moves=[reply])[0]
                for reply in list(board.legal_moves)]
    if not all(map(preserves_advantage, defences)):
        flags.append('strong-defence-material-advantage-unresolved')
    result['timeline'] = {'timeline': [{'ply': 0, 'move': answer, 'materialGain': 0,
        'replies': [{'move': san, **witness} for san, witness in local['witnesses'].items()],
        'engineDefences': defences}]}
    return {**result, 'status': 'withheld' if flags else 'needs-editorial-review'}


def verify_review(record, result):
    board = start_board(record)
    proof = source_beginner_proof(sys.modules[__name__], record)
    local = checking_skewer(board, board.parse_san(proof['answer']))
    if (not scope(board, record) or provenance(record) or local is None
            or result['recordHash'] != record_hash(record) or result['beginnerProof'] != proof
            or result['status'] != 'needs-editorial-review' or result['flags']):
        raise ValueError('Stale or incomplete Beginner Skewer approval')
    roots = result['analysis']['roots']
    if ({row['move'] for row in roots} != set(proof['outcomes'])
            or root_flags(roots, proof['answer'])):
        raise ValueError('Incomplete Skewer root comparison')
    step, = result['timeline']['timeline']
    defences = step['engineDefences']
    witnesses = {row['move']: {key: value for key, value in row.items() if key != 'move'}
                 for row in step['replies']}
    if (step['ply'] != 0 or step['move'] != proof['answer'] or witnesses != local['witnesses']
            or {row['move'] for row in defences} != set(witnesses)
            or not all(map(preserves_advantage, defences))):
        raise ValueError('Incomplete Skewer defensive proof')


def scan_game(game, white_bishop=False):
    board = chess.Board(game['gameFen'])
    uci, candidates = [], []
    for ply, san in enumerate(game['gameMoves']):
        move = board.parse_san(san)
        uci.append(move.uci())
        if (ply and san.endswith('+') and (not white_bishop or (board.turn and san.startswith('B')))
                and board.occupied.bit_count() <= BEGINNER_MAX_PIECES
                and abs(material(board, board.turn)) <= MAX_MATERIAL_GAP
                and checking_skewer(board, move)):
            previous = board.copy()
            previous.pop()
            record = {**game, 'level': LEVEL, 'goal': 'material', 'moves': [san], 'solverMoves': 1,
                      'sacrifices': [], 'tacticPly': 0, 'ply': ply,
                      'previousMove': {'fen': previous.fen(en_passant='fen'), 'move': game['gameMoves'][ply - 1]},
                      'fen': board.fen(en_passant='fen'), 'screen': {'played': True}}
            if {root for root, success in beginner_outcomes(board, record).items() if success} == {san}:
                candidates.append(record)
        board.push(move)
    ident = hashlib.sha256(' '.join(uci).encode()).hexdigest()[:16]
    if game['gameId'] not in (None, ident):
        raise ValueError('Indexed game identity mismatch')
    return [{**row, 'gameId': ident} for row in candidates]


def collect(db, *, cache, workers, output, levels, target, max_games, existing, white_bishop=False):
    from collect_two_rook_mate import source_games
    from research_index import disposition
    from research_positions import active_positions

    if levels != [LEVEL]:
        raise ValueError('Skewer collection supports Beginner only')
    tagged = {row[0] for row in db.execute(
        "SELECT DISTINCT l.game_id FROM matches m JOIN occurrences o ON o.id=m.occurrence_id "
        "JOIN game_legacy_ids l ON l.game_key=o.game_key WHERE m.theme='skewer'")}
    retired = {row[0] for row in db.execute(
        "SELECT game_id FROM research_decisions WHERE topic=? AND status='removed'", (TOPIC,))}
    seen = retired | {row['gameId'] for row in existing}
    published = active_positions()
    games = sorted(source_games(db, all_wins=True), key=lambda game: game['gameId'] not in tagged)
    games = islice((game for game in games if game['gameId'] not in retired), max_games or None)
    store = ResearchCache(cache)
    version = code_version('skewer_research.py', 'pin_research.py')
    scan = partial(scan_game, white_bishop=white_bishop)
    selected, metrics = [], Counter()
    try:
        with ProcessPoolExecutor(max_workers=workers) as pool:
            while batch := list(islice(games, workers * 8)):
                entries = [(game, digest([version, chess.__version__, white_bishop, game])) for game in batch]
                cached = {key: store.get('skewer-geometry', key) for _, key in entries}
                missing = [(game, key) for game, key in entries if cached[key] is None]
                for (_, key), rows in zip(missing, pool.map(scan, (game for game, _ in missing))):
                    store.put('skewer-geometry', key, rows)
                    cached[key] = rows
                metrics.update(games=len(batch), replays=len(missing), geometryHits=len(batch) - len(missing))
                for _, key in entries:
                    for row in cached[key]:
                        if (row['gameId'] in seen or chess.Board(row['fen']).epd() in published
                                or disposition(db, TOPIC, row) is not None):
                            continue
                        selected.append(row)
                        seen.add(row['gameId'])
                report = {'records': selected, 'metrics': dict(metrics),
                          'requestedLeadTargetMet': len(selected) + len(existing) >= target}
                atomic_json(output, report)
                if report['requestedLeadTargetMet']:
                    return report
    finally:
        store.close()
    return {'records': selected, 'metrics': dict(metrics), 'requestedLeadTargetMet': False}
