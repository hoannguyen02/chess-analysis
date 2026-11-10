"""Exact short material-payoff checks for source-game Pin Beginner and A."""
import hashlib
from collections import Counter
from concurrent.futures import ProcessPoolExecutor
from functools import partial
from itertools import islice

import chess

from discovery_research import provenance as source_provenance
from hanging_piece_research import VALUES, material, probe, record_hash, start_board as game_start_board
from tactic_research import ResearchCache, atomic_json, code_version, digest

TOPIC = 'pin'
LEVELS = ('Beginner', 'A')
GAIN = 100
SLIDERS = {chess.BISHOP, chess.ROOK, chess.QUEEN}
COMPOSITION = 'original-composition'


def composition_id(board):
    return 'pin-composed-' + hashlib.sha256(board.epd().encode()).hexdigest()[:16]


def start_board(record):
    if record['source'] == COMPOSITION:
        return chess.Board(record['fen'])
    return game_start_board(record)


def provenance(record):
    if record['source'] == COMPOSITION:
        board = start_board(record)
        game_fields = {'headers', 'gameFen', 'gameMoves', 'ply', 'previousMove',
                       'masterCredential', 'sourceReferences'}
        if (record['level'] != 'Beginner' or record['gameId'] != composition_id(board)
                or game_fields.intersection(record) or board.castling_rights
                or board.ep_square is not None or board.halfmove_clock or board.fullmove_number != 1):
            return ['invalid-pin-composition-provenance']
        return []
    flags = source_provenance(record)
    if record['source'] not in {ref['url'] for ref in record.get('sourceReferences', [])}:
        flags.append('source-archive-mismatch')
    if not 0 < record['ply'] <= len(record['gameMoves']):
        flags.append('missing-preceding-game-frame')
    return flags


def pinner(board, side, front):
    king = board.king(not side)
    return next((square for square in chess.SquareSet(board.occupied_co[side])
                 if board.piece_type_at(square) in SLIDERS and front in board.attacks(square)
                 and chess.between(square, king) & chess.BB_SQUARES[front]), None)


def pin_shape(board, move, level):
    side, capture = board.turn, board.is_capture(move)
    if move.promotion or (level == 'Beginner' and (capture or board.is_check()
                           or board.piece_type_at(move.from_square) not in SLIDERS)):
        return None
    if level == 'A' and not capture:
        return None
    board.push(move)
    try:
        if board.is_check():
            return None
        for front in chess.SquareSet(board.occupied_co[not side] & ~board.kings):
            if not board.is_pinned(not side, front):
                continue
            slider = pinner(board, side, front)
            if slider is None:
                continue
            if level == 'A':
                recapture = chess.Move(front, move.to_square)
                if not board.is_pseudo_legal(recapture) or board.is_legal(recapture):
                    continue
                blocked = [board.san(recapture)]
            else:
                if slider != move.to_square:
                    continue
                # A pinned piece must have a real escape off the line, outside
                # the pinner's attack after the hypothetical escape.
                blocked = []
                for escape in board.generate_pseudo_legal_moves(from_mask=chess.BB_SQUARES[front]):
                    if escape.to_square in board.pin(not side, front):
                        continue
                    board.push(escape)
                    avoids_slider = not board.is_attacked_by(side, escape.to_square)
                    board.pop()
                    if avoids_slider:
                        blocked.append(escape.uci())
                if not blocked:
                    continue
            return {'pinner': chess.square_name(slider), 'front': chess.square_name(front),
                    'king': chess.square_name(board.king(not side)), 'blocked': sorted(blocked),
                    'sliderPiece': board.piece_at(slider).symbol().upper(),
                    'frontPiece': board.piece_at(front).symbol().upper()}
    finally:
        board.pop()
    return None


def terminal(board):
    return (board.is_checkmate() or board.is_stalemate() or board.is_insufficient_material()
            or board.is_seventyfive_moves()
            or (board.halfmove_clock >= 16 and board.is_fivefold_repetition()))


def payoff(board, side, baseline, reply, followup, target=None):
    """Find the immediate or next-turn gain after this legal defensive move."""
    board.push(reply)
    try:
        if terminal(board) or material(board, side) < baseline:
            return None
        delta = material(board, side) - baseline
        if delta >= GAIN:
            return {'capture': None, 'gain': delta}
        if not followup:
            return None
        options = board.generate_legal_captures(
            to_mask=chess.BB_ALL if target is None else chess.BB_SQUARES[target])
        for capture in options:
            if capture.promotion:
                continue
            san = board.san(capture)
            board.push(capture)
            try:
                gain = material(board, side) - baseline
                if gain < GAIN or terminal(board):
                    continue
                # Non-capturing, non-promoting replies leave material intact.
                # Check every reply for terminal draws and mating counterplay.
                for defence in board.legal_moves:
                    board.push(defence)
                    gain = min(gain, material(board, side) - baseline)
                    if terminal(board):
                        gain = 0
                    board.pop()
                    if gain < GAIN:
                        break
                if gain >= GAIN:
                    return {'capture': san, 'gain': gain}
            finally:
                board.pop()
    finally:
        board.pop()
    return None


def short_gain(board, move, followup, target=None):
    side, baseline = board.turn, material(board, board.turn)
    board.push(move)
    try:
        if terminal(board) or material(board, side) < baseline:
            return None
        replies = {}
        for reply in list(board.legal_moves):
            san = board.san(reply)
            witness = payoff(board, side, baseline, reply, followup, target)
            if witness is None:
                return None
            replies[san] = witness
        return replies
    finally:
        board.pop()


def beginner_outcomes(board, record):
    if record['goal'] != 'material':
        raise ValueError('unsupported-pin-objective')
    return {board.san(move): short_gain(board, move, True) is not None
            for move in list(board.legal_moves)}


def local_gate(board, move, level):
    shape = pin_shape(board, move, level)
    if not shape:
        return None
    followup = level == 'Beginner'
    if followup:
        after = board.copy(stack=False)
        after.push(move)
        if board.is_pinned(after.turn, chess.parse_square(shape['front'])):
            return None
    witnesses = short_gain(board, move, followup,
                           chess.parse_square(shape['front']) if followup else None)
    if witnesses is None:
        return None
    return shape, witnesses


def required_defences(board, screening):
    strongest = screening[0]['cp']
    by_move = {row['move']: row for row in screening}
    for reply in board.legal_moves:
        name = board.san(reply)
        row = by_move[name]
        if (board.is_capture(reply) or board.gives_check(reply) or reply.promotion
                or row['mate'] is not None or strongest is None or row['cp'] is None
                or row['cp'] <= strongest + 55):
            yield name, reply


def review(record, engine, settings, complete=False, require_provenance=True):
    board = start_board(record)
    level, side = record['level'], board.turn
    baseline = material(board, side)
    if (level not in LEVELS or record['goal'] != 'material'
            or record['solverMoves'] != 1 or len(record['moves']) != 1
            or record.get('sacrifices') or abs(baseline) > 330 or board.is_game_over()
            or not board.is_valid() or board.fen(en_passant='fen') != record['fen']):
        raise ValueError('invalid-direct-pin-position')
    flags = provenance(record) if require_provenance else []
    san, = record['moves']
    root = board.parse_san(san)
    local = local_gate(board, root, level)
    if not local:
        flags.append('essential-pin-payoff-not-proved')
    result = {'gameId': record['gameId'], 'recordHash': record_hash(record),
              'level': level, 'fen': record['fen'], 'moves': record['moves'],
              'flags': flags, 'timings': {}}
    if flags:
        return {**result, 'status': 'withheld'}

    shape, witnesses = local
    result['preflight'] = {'initialMaterialCp': baseline, 'coverage': shape,
                           'cluster': [level, shape['sliderPiece'], shape['frontPiece'],
                                       board.piece_at(root.from_square).symbol().upper()]}
    alternatives = []
    for move in list(board.legal_moves):
        if move == root or short_gain(board, move, True) is None:
            continue
        if level == 'Beginner' or local_gate(board, move, level) is None:
            alternatives.append(board.san(move))
    if alternatives:
        flags.append('direct-material-bypass')
        return {**result, 'status': 'withheld', 'bypassMoves': alternatives}

    roots = probe(board, engine, settings['rootNodes'], side, board.legal_moves.count())
    sample = next(row for row in roots if row['move'] == san)
    result['analysis'] = {'roots': roots}
    if (sample['mate'] is not None or roots[0]['mate'] is not None
            or sample['cp'] is None or sample['cp'] < 100
            or roots[0]['cp'] - sample['cp'] > 60):
        flags.append('sample-inferior-or-mate-dominates')
        return {**result, 'status': 'withheld'}

    board.push(root)
    defences = []
    legal = list(board.legal_moves)
    # Screen every reply. Deepen the strongest and all checks, captures,
    # promotions and direct attacks on the pinner (including declined offers).
    screening = probe(board, engine, settings['prepNodes'], side, len(legal))
    for _, reply in required_defences(board, screening):
        defences.append(probe(board, engine, settings['defenceNodes'], side, root_moves=[reply])[0])
    if any(row['mate'] is not None or row['cp'] is None or row['cp'] < 100 for row in defences):
        flags.append('strong-defence-material-advantage-unresolved')
    result['timeline'] = {'timeline': [{
        'move': san, 'ply': 0, 'materialGain': material(board, side) - baseline,
        'replies': [{'move': board.san(reply), **witnesses[board.san(reply)]} for reply in legal],
        'defenceScreen': screening, 'engineDefences': defences,
    }]}
    return {**result, 'status': 'withheld' if flags else 'needs-editorial-review'}


def verify_review(record, result):
    """Check the exact reviewed source, legal roots and required replies on rebuild."""
    from beginner_one_move import source_beginner_proof
    import sys

    board = start_board(record)
    level = record['level']
    if (level not in LEVELS or record['goal'] != 'material'
            or record['solverMoves'] != 1 or len(record['moves']) != 1
            or record.get('sacrifices') or provenance(record)
            or abs(material(board, board.turn)) > 330
            or result['recordHash'] != record_hash(record)
            or result['status'] != 'needs-editorial-review' or result['flags']):
        raise ValueError('Pin approval must bind a verified one-move source candidate')
    if level == 'Beginner' and source_beginner_proof(sys.modules[__name__], record) != result['beginnerProof']:
        raise ValueError('Pin Beginner proof changed')
    san, = record['moves']
    root = board.parse_san(san)
    local = local_gate(board, root, level)
    if not local or local[0] != result['preflight']['coverage']:
        raise ValueError('Essential pin geometry changed')
    roots = result['analysis']['roots']
    if {row['move'] for row in roots} != {board.san(move) for move in board.legal_moves}:
        raise ValueError('Every legal Pin root must be compared')
    board.push(root)
    step, = result['timeline']['timeline']
    screening = step['defenceScreen']
    if ({row['move'] for row in screening} != set(local[1])
            or {row['move']: {k: v for k, v in row.items() if k != 'move'}
                for row in step['replies']} != local[1]):
        raise ValueError('Every legal Pin reply needs exact local evidence')
    deeper = {row['move']: row for row in step['engineDefences']}
    if any(name not in deeper or deeper[name]['mate'] is not None
           or deeper[name]['cp'] is None or deeper[name]['cp'] < 100
           for name, _ in required_defences(board, screening)):
        raise ValueError('Pin strong-reply evidence is missing or unresolved')


def unplayed_candidates(board, played, levels):
    if 'A' in levels:
        for move in board.generate_legal_captures():
            if move == played:
                continue
            # A cheap prerequisite: the blocked recapture must be capable
            # of erasing the gain. Pinning an extra defender is insufficient
            # when a pawn simply takes a rook and could only lose the pawn.
            captured = chess.PAWN if board.is_en_passant(move) else board.piece_type_at(move.to_square)
            mover = board.piece_type_at(move.from_square)
            if VALUES[captured] - VALUES[mover] < GAIN:
                yield 'A', move
    if 'Beginner' in levels and board.occupied.bit_count() <= 10:
        sliders = board.occupied_co[board.turn] & (board.bishops | board.rooks | board.queens)
        for move in board.generate_legal_moves(from_mask=sliders, to_mask=~board.occupied):
            if move != played:
                yield 'Beginner', move


def scan_game(record, unplayed_levels=()):
    board = chess.Board(record['gameFen'])
    uci, candidates = [], []
    previous = None
    for ply, san in enumerate(record['gameMoves']):
        move = board.parse_san(san)
        uci.append(move.uci())
        if ply >= 12 and abs(material(board, board.turn)) <= 330:
            if unplayed_levels:
                options = unplayed_candidates(board, move, unplayed_levels)
            elif board.is_capture(move) or board.occupied.bit_count() <= 10:
                options = [('A' if board.is_capture(move) else 'Beginner', move)]
            else:
                options = []
            for level, candidate in options:
                if local_gate(board, candidate, level) is None:
                    continue
                candidates.append({**record, 'level': level, 'goal': 'material',
                                   'moves': [board.san(candidate)], 'solverMoves': 1, 'sacrifices': [],
                                   'fen': board.fen(en_passant='fen'), 'ply': ply,
                                   'previousMove': previous, 'tacticPly': 0})
        previous = {'fen': board.fen(en_passant='fen'), 'move': san}
        board.push(move)
    ident = hashlib.sha256(' '.join(uci).encode()).hexdigest()[:16]
    if record['gameId'] not in (None, ident):
        raise ValueError('Indexed game identity mismatch')
    return [{**row, 'gameId': ident} for row in candidates]


def collect(db, *, cache, workers, output, levels, target, max_games, existing,
            unplayed=False, drawn_games=False, source_filters=()):
    from collect_two_rook_mate import source_games
    from research_index import disposition
    from research_positions import active_positions

    protected = {row[0] for row in db.execute(
        "SELECT game_id FROM research_decisions WHERE topic=? AND "
        "(status IN ('approved','manual','removed','transferred') OR level='*')", (TOPIC,))
        if row[0]}
    seen = protected | {row['gameId'] for row in existing}
    used = {chess.Board(row['fen']).epd() for row in existing}
    published = active_positions()
    counts = Counter(row['level'] for row in existing)
    selected, metrics = [], Counter()
    version = code_version('pin_research.py', 'collect_two_rook_mate.py')
    unplayed_levels = tuple(level for level in LEVELS if unplayed and level in levels)
    scan = partial(scan_game, unplayed_levels=unplayed_levels)
    games = islice((game for game in source_games(db, source_filters=source_filters,
                                                 all_wins=True, draws_only=drawn_games)
                    if game['gameId'] not in protected), max_games or None)
    store = ResearchCache(cache)
    try:
        with ProcessPoolExecutor(max_workers=workers) as pool:
            while batch := list(islice(games, workers * 16)):
                entries = [(game, digest([version, chess.__version__, unplayed_levels, game])) for game in batch]
                cached = {key: store.get('pin-geometry', key) for _, key in entries}
                missing = [(game, key) for game, key in entries if cached[key] is None]
                for (_, key), rows in zip(missing, pool.map(scan, (game for game, _ in missing))):
                    store.put('pin-geometry', key, rows)
                    cached[key] = rows
                metrics.update(games=len(batch), replays=len(missing), geometryHits=len(batch) - len(missing))
                for _, key in entries:
                    for row in cached[key]:
                        level, ident = row['level'], row['gameId']
                        position = chess.Board(row['fen']).epd()
                        if (level not in levels or counts[level] >= target or ident in seen
                                or position in used or position in published
                                or disposition(db, TOPIC, row) is not None):
                            continue
                        selected.append(row)
                        seen.add(ident)
                        used.add(position)
                        counts[level] += 1
                report = {'records': selected, 'metrics': dict(metrics),
                          'requestedLeadTargetMet': all(counts[level] >= target for level in levels)}
                atomic_json(output, report)
                if report['requestedLeadTargetMet']:
                    return report
    finally:
        store.close()
    return {'records': selected, 'metrics': dict(metrics), 'requestedLeadTargetMet': False}
