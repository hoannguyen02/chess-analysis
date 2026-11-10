"""Verify defences to concrete mating threats in complete master games."""
import chess

from beginner_one_move import BEGINNER_MAX_PIECES
from discovery_research import provenance
from hanging_piece_research import material, probe, record_hash, start_board
from tactics_catalog import matches_current_level

LEVEL_MOVES = {'Beginner': 1, 'A': 1, 'B': 2, 'C': 2}
MAX_LOSS = -150
COMPARABLE = 45


def immediate_mates(board):
    """Enumerate every legal checking move, including discoveries and special moves."""
    king = board.king(not board.turn)
    knight = chess.BB_KNIGHT_ATTACKS[king]
    diagonal = chess.BB_DIAG_ATTACKS[king][0]
    straight = chess.BB_RANK_ATTACKS[king][0] | chess.BB_FILE_ATTACKS[king][0]
    rays = diagonal | straight
    direct = {
        chess.PAWN: chess.BB_PAWN_ATTACKS[not board.turn][king],
        chess.KNIGHT: knight, chess.BISHOP: diagonal, chess.ROOK: straight,
        chess.QUEEN: rays, chess.KING: chess.BB_KING_ATTACKS[king],
    }
    for move in board.generate_legal_moves():
        origin = chess.BB_SQUARES[move.from_square]
        target = chess.BB_SQUARES[move.to_square]
        if not (target & direct[board.piece_type_at(move.from_square)] or origin & rays
                or move.promotion or board.is_castling(move) or board.is_en_passant(move)):
            continue
        if board.gives_check(move):
            board.push(move)
            mate = board.is_checkmate()
            board.pop()
            if mate:
                yield move


def threat_moves(board):
    if board.is_check() or board.is_game_over():
        return []
    board.push(chess.Move.null())
    try:
        return [board.san(move) for move in immediate_mates(board)]
    finally:
        board.pop()


def mate_replies(board):
    return [board.san(move) for move in immediate_mates(board)]


def prevents_mate(board, move):
    board.push(move)
    try:
        return board.is_game_over() or next(immediate_mates(board), None) is None
    finally:
        board.pop()


def beginner_outcomes(board, record):
    if record['goal'] != 'defend' or not threat_moves(board):
        raise ValueError('missing-concrete-beginner-mate-threat')
    return {board.san(move): prevents_mate(board, move) for move in list(board.legal_moves)}


def sole_mate_prevention(board):
    """Every other legal move must allow immediate mate, even a countercheck."""
    answer = None
    for move in list(board.legal_moves):
        if prevents_mate(board, move):
            if answer is not None:
                return None
            answer = move
    return answer


def offers(before, move, after):
    """Inspect captures of all pieces, with immediate equal recaptures."""
    baseline = material(before, before.turn)
    prior_captures = set()
    if not before.is_check():
        before.push(chess.Move.null())
        prior_captures = set(before.generate_legal_captures())
        before.pop()
    rows = []
    for reply in list(after.generate_legal_captures()):
        victim = reply.to_square
        if after.is_en_passant(reply):
            victim += -8 if after.turn else 8
        if victim != move.to_square and reply in prior_captures:
            continue
        san = after.san(reply)
        after.push(reply)
        delta = material(after, before.turn) - baseline
        if delta <= -100:
            recaptures = []
            for recapture in after.generate_legal_captures(to_mask=chess.BB_SQUARES[reply.to_square]):
                name = after.san(recapture)
                after.push(recapture)
                recovered = material(after, before.turn) - baseline
                after.pop()
                recaptures.append({'move': name, 'delta': recovered})
            rows.append({'move': san, 'delta': delta, 'movedPiece': victim == move.to_square,
                         'recaptures': recaptures, 'square': chess.square_name(victim)})
        after.pop()
    return rows


def unequal(offer):
    return all(row['delta'] <= -100 for row in offer['recaptures'])


def pressure(board):
    if board.is_check():
        return {'check': True, 'mates': []}
    return {'check': False, 'mates': threat_moves(board)}


def active_pressure(row):
    return row['check'] or bool(row['mates'])


def immediate_refutations(board):
    refutations = {}
    for move in list(board.legal_moves):
        san = board.san(move)
        board.push(move)
        replies = mate_replies(board)
        board.pop()
        if replies:
            refutations[san] = replies
    return refutations


def material_recoveries(board, side, baseline):
    """Find immediate captures that restore the loss even after a recapture."""
    recovered = []
    for move in list(board.generate_legal_captures()):
        san = board.san(move)
        board.push(move)
        stable = material(board, side) >= baseline
        if stable:
            for reply in list(board.generate_legal_captures(to_mask=chess.BB_SQUARES[move.to_square])):
                board.push(reply)
                stable = material(board, side) >= baseline
                board.pop()
                if not stable:
                    break
        if stable:
            recovered.append(san)
        board.pop()
    return recovered


def advanced_trace(board, line):
    """Replay connected pressure and material costs along one concrete line."""
    walk = board.copy()
    side = walk.turn
    steps, sacrifices = [], []
    for ply in range(0, len(line), 2):
        threat = pressure(walk)
        baseline = material(walk, side)
        before = walk.copy(stack=False)
        move = walk.parse_san(line[ply])
        walk.push(move)
        step = {'ply': ply, 'move': line[ply], 'pressure': threat,
                'opponentMates': mate_replies(walk), 'materialAfter': material(walk, side)}
        steps.append(step)
        if ply + 1 == len(line):
            break
        reply_san = line[ply + 1]
        reply = walk.parse_san(reply_san)
        offer = None
        if walk.is_capture(reply):
            offer = next((row for row in offers(before, move, walk)
                          if row['move'] == reply_san and unequal(row)), None)
        victim = None
        if offer:
            square = chess.parse_square(offer['square'])
            victim = walk.piece_at(square)
        walk.push(reply)
        if victim and not material_recoveries(walk, side, baseline):
            sacrifices.append({'ply': ply, 'piece': victim.symbol().upper(),
                               'square': offer['square'], 'acceptedBy': reply_san,
                               'cost': -offer['delta'], 'baseline': baseline})
        step.update(reply=reply_san, materialAfterReply=material(walk, side))
    return {'steps': steps, 'sacrifices': sacrifices}


def depth_witness(trace):
    """Keep only checks, renewed mate threats and concrete sacrifice recovery."""
    sacrifices = trace['sacrifices']
    steps = trace['steps']
    if not sacrifices:
        return False
    last = steps[-1]
    for step in steps[1:]:
        if active_pressure(step['pressure']):
            continue
        previous = steps[step['ply'] // 2 - 1]
        if not any(sacrifice['ply'] < step['ply']
                   and previous['materialAfterReply'] < sacrifice['baseline']
                   <= last['materialAfter'] for sacrifice in sacrifices):
            return False
    return True


def preflight(record, require_provenance=True):
    flags = provenance(record) if require_provenance else []
    level = record['level']
    moves = record['moves']
    supported = (len(moves) in (7, 9) and matches_current_level(record) if level == 'D'
                 else level in LEVEL_MOVES and len(moves) == 2 * LEVEL_MOVES[level] - 1)
    if record['goal'] != 'defend' or record['ply'] < 1 or not supported:
        return {'flags': [*flags, 'unsupported-objective-level-or-length']}
    board = start_board(record)
    initial = material(board, board.turn)
    threat = threat_moves(board)
    checked = level == 'D' and board.is_check()
    evasions = immediate_refutations(board) if checked else {}
    if checked:
        threat = sorted({mate for mates in evasions.values() for mate in mates})
    if not threat or abs(initial) > 500:
        flags.append('missing-concrete-threat-or-unsuitable-material')
    first = board.parse_san(record['moves'][0])
    after = board.copy()
    after.push(first)
    if mate_replies(after) or after.is_game_over():
        flags.append('first-move-does-not-lead-to-a-defence-exercise')
    if level == 'Beginner':
        pieces = board.occupied.bit_count()
        if pieces > BEGINNER_MAX_PIECES:
            flags.append('too-many-beginner-pieces')
        if board.legal_moves.count() < 2 or sole_mate_prevention(board) != first:
            flags.append('no-unique-mate-prevention')
    initial_offers = offers(board, first, after)
    if level == 'C' and not any(unequal(row) and row['movedPiece']
                                and row['move'] == record['moves'][1] for row in initial_offers):
        flags.append('no-simple-sacrifice-accepted-in-line')
    if level == 'B':
        after.push_san(record['moves'][1])
        if not after.is_check() and not threat_moves(after):
            flags.append('second-decision-has-no-renewed-mating-threat-or-check')
    gate = {'flags': flags, 'threats': threat, 'initialMaterialCp': initial,
            'firstMoveOffers': initial_offers}
    if level == 'Beginner':
        gate['pieceCount'] = pieces
    if level == 'D':
        trace = advanced_trace(board, moves)
        if trace['sacrifices'] != record['sacrifices'] or not trace['sacrifices']:
            flags.append('D-requires-an-accepted-unequal-sacrifice')
        if not depth_witness(trace) or any(step['opponentMates'] for step in trace['steps']):
            flags.append('D-needs-four-or-five-connected-defensive-decisions')
        gate['advancedTrace'] = trace
        gate['initialCheck'] = checked
        if checked:
            gate['losingEvasions'] = evasions
    return gate


def score(row):
    return (100000 if row['mate'] > 0 else -100000) if row['mate'] is not None else row['cp']


def reply_pressure(after, san):
    follow = after.copy()
    follow.push_san(san)
    threat = pressure(follow)
    if threat['check']:
        threat['mateSafeEvasions'] = [follow.san(move) for move in list(follow.legal_moves)
                                     if prevents_mate(follow, move)]
    return threat


def meaningful_reply(threat):
    return bool(threat['mates']) or (
        threat['check'] and len(threat['mateSafeEvasions']) <= 2)


def shorter_defences(board, roots, chosen, remaining, balance_floor, engine, settings):
    """Look for a sound shortcut among all plausible legal alternative roots."""
    side = board.turn
    comparison = []
    for root in roots:
        san = root['move']
        if san == chosen or score(root) < MAX_LOSS:
            continue
        move = board.parse_san(san)
        walk = board.copy()
        walk.push(move)
        if mate_replies(walk):
            continue
        line = root['line']
        if len(line) < 2 * remaining and not walk.is_game_over():
            targeted = probe(board, engine, settings['defenceNodes'], side, 1, [move])[0]
            if score(targeted) < MAX_LOSS:
                comparison.append({'move': san, 'line': targeted['line'],
                                   'score': score(targeted), 'status': 'inferior'})
                continue
            line = targeted['line']
        walk = board.copy()
        row = {'move': san, 'line': line, 'status': 'no-shorter-witness'}
        for ply, name in enumerate(line[:2 * (remaining - 1)]):
            walk.push_san(name)
            if ply % 2:
                continue
            if walk.is_game_over():
                outcome = walk.outcome()
                if outcome.winner in (None, side):
                    row.update(status='shorter', solverMoves=ply // 2 + 1)
                break
            if mate_replies(walk) or material(walk, side) < balance_floor:
                continue
            if len(line) <= ply + 1:
                row['status'] = 'unresolved'
                break
            if active_pressure(reply_pressure(walk, line[ply + 1])):
                continue
            replies = probe(walk, engine, settings['defenceNodes'], side,
                            min(4, walk.legal_moves.count()))
            if score(replies[0]) >= MAX_LOSS and not any(
                    meaningful_reply(reply_pressure(walk, reply['move']))
                    for reply in replies if score(reply) <= score(replies[0]) + 85):
                row.update(status='shorter', solverMoves=ply // 2 + 1,
                           endpointReplies=replies)
                break
        comparison.append(row)
    return comparison


def validate_advanced_evidence(record, result):
    gate = preflight(record)
    if gate['flags'] or gate != result.get('preflight'):
        raise ValueError('Level D needs current sacrifice and connected defence evidence')
    board = start_board(record)
    timeline = result['timeline']['timeline']
    if len(timeline) != record['solverMoves']:
        raise ValueError('Level D needs every solver step reviewed')
    for index, step in enumerate(timeline):
        ply = index * 2
        name = record['moves'][ply]
        if step['ply'] != ply or step['move'] != name:
            raise ValueError('Level D timeline does not match the approved moves')
        roots = step['roots']
        if {row['move'] for row in roots} != {board.san(m) for m in board.legal_moves}:
            raise ValueError('Level D needs every legal starting move compared')
        remaining = record['solverMoves'] - index
        if remaining > 1:
            required = set()
            for row in roots:
                if row['move'] == name or score(row) < MAX_LOSS:
                    continue
                other = board.copy()
                other.push_san(row['move'])
                if not mate_replies(other):
                    required.add(row['move'])
            checked = step.get('shorterDefences', [])
            if ({row['move'] for row in checked} != required
                    or any(row['status'] not in ('inferior', 'no-shorter-witness') for row in checked)):
                raise ValueError('Level D has a shorter or unresolved alternative')
        board.push_san(name)
        replies = step['engineDefences']
        strongest = min(score(row) for row in replies)
        expected = {row['move']: reply_pressure(board, row['move']) for row in replies
                    if score(row) <= strongest + 85}
        if expected != step.get('strongReplyPressure'):
            raise ValueError('Level D needs current strong-reply pressure evidence')
        if remaining == 1:
            if any(meaningful_reply(threat) for threat in expected.values()):
                raise ValueError('Level D solution ends before the forcing attack is resolved')
        else:
            if record['moves'][ply + 1] not in expected:
                raise ValueError('Level D needs a strong reply in the approved continuation')
            board.push_san(record['moves'][ply + 1])


def review(record, engine, settings, complete=False, require_provenance=True):
    gate = preflight(record, require_provenance)
    flags = list(gate['flags'])
    result = {'gameId': record['gameId'], 'recordHash': record_hash(record),
              'status': 'withheld', 'flags': flags, 'preflight': gate}
    if flags:
        return result
    board = start_board(record)
    side = board.turn
    level = record['level']
    advanced = level == 'D'
    trace = gate.get('advancedTrace')
    timeline = []
    for ply in range(0, len(record['moves']), 2):
        legal = list(board.legal_moves)
        roots = probe(board, engine, settings['rootNodes'], side, len(legal))
        if {r['move'] for r in roots} != {board.san(move) for move in legal}:
            flags.append('unresolved-legal-root-comparison')
            break
        chosen_san = record['moves'][ply]
        chosen = next(row for row in roots if row['move'] == chosen_san)
        root_options, threat_refuted = [], []
        for move in legal:
            san = board.san(move)
            after = board.copy()
            after.push(move)
            replies = mate_replies(after)
            if replies:
                threat_refuted.append({'move': san, 'mates': replies})
            elif after.outcome() is None:
                root_options.append(san)
        if ply == 0 and not threat_refuted:
            flags.append('no-legal-temptation-allows-immediate-mate')
        if (ply and level == 'B' and (len(legal) < 2 or not (
                threat_refuted or any(score(row) < -200 for row in roots)))):
            flags.append('no-meaningful-second-defensive-choice')
        if chosen_san not in root_options or score(chosen) < MAX_LOSS or score(roots[0]) - score(chosen) > COMPARABLE:
            flags.append('sample-defence-inferior-or-mate-remains')
        if flags:
            break
        played = board.parse_san(chosen_san)
        after = board.copy()
        after.push(played)
        offered = offers(board, played, after)
        reply_names = list(dict.fromkeys([r['move'] for r in offered] + record['moves'][ply+1:ply+2]))
        forced = [after.parse_san(name) for name in reply_names]
        replies = probe(after, engine, settings['defenceNodes'], side, min(4, after.legal_moves.count()))
        named = {r['move'] for r in replies}
        # Compare every opponent reply at shallow budget, then the strongest,
        # checking/capturing resources and the sample at the full defence budget.
        all_replies = list(after.legal_moves)
        shallow = probe(after, engine, settings['prepNodes'], side, len(all_replies))
        if {r['move'] for r in shallow} != {after.san(move) for move in all_replies}:
            flags.append('unresolved-opponent-reply-comparison')
        forcing = [m for m in all_replies if (after.is_capture(m) or after.gives_check(m))
                   and after.san(m) not in named]
        close = [after.parse_san(r['move']) for r in shallow
                 if score(r) <= score(shallow[0]) + 35 and r['move'] not in named]
        for reply in dict.fromkeys([*forced, *forcing, *close]):
            if after.san(reply) not in named:
                replies.extend(probe(after, engine, settings['defenceNodes'], side, 1, [reply]))
        strongest = min(score(row) for row in replies)
        if strongest < MAX_LOSS or strongest < score(chosen) - 125:
            flags.append('strong-defence-unresolved-or-refutes-sample')
        for offer in offered:
            reply = next(row for row in replies if row['move'] == offer['move'])
            offer['viable'] = score(reply) <= strongest + 90
            if offer['viable'] and unequal(offer) and not advanced and (level != 'C' or ply):
                flags.append('unequal-offer-in-nonsacrificial-step')
        if ply + 1 < len(record['moves']):
            sample = next(row for row in replies if row['move'] == record['moves'][ply+1])
            if score(sample) > strongest + 85:
                flags.append('sample-opponent-reply-too-cooperative')
        if ply == 0 and level == 'C':
            for root in roots:
                if root['move'] == chosen_san or root['move'] not in root_options or score(root) < MAX_LOSS:
                    continue
                move = board.parse_san(root['move'])
                other = board.copy()
                other.push(move)
                if not any(unequal(row) and row['movedPiece'] for row in offers(board, move, other)):
                    flags.append('simpler-nonsacrificial-defence')
                    break
        alternatives = []
        if not flags and not advanced:
            for row in roots:
                if (row['move'] == chosen_san or row['move'] not in root_options
                        or score(row) < MAX_LOSS or score(row) < score(roots[0]) - COMPARABLE):
                    continue
                trial = board.copy()
                trial.push_san(row['move'])
                responses = probe(trial, engine, settings['defenceNodes'], side,
                                  min(3, trial.legal_moves.count()))
                if any(score(response) < MAX_LOSS for response in responses):
                    continue
                tail = responses[0]['line'][:2]
                trial.push_san(tail[0])
                line = [row['move']]
                if not ply and level != 'A' and (trial.is_check() or threat_moves(trial)):
                    if len(tail) < 2:
                        continue
                    trial.push_san(tail[1])
                    if mate_replies(trial) or trial.is_game_over():
                        continue
                    line.extend(tail)
                alternatives.append({'line': line, 'responses': responses})
        step = {'ply': ply, 'move': chosen_san, 'roots': roots,
                         'mateRefutations': threat_refuted, 'safeAlternatives': alternatives,
                         'offers': offered, 'engineDefences': replies, 'allReplyScreen': shallow,
                         'materialAfter': material(after, side)}
        if advanced:
            relevant = [row for row in replies if score(row) <= strongest + 85]
            step['strongReplyPressure'] = {row['move']: reply_pressure(after, row['move'])
                                           for row in relevant}
            remaining = record['solverMoves'] - ply // 2
            if remaining > 1 and not flags:
                floor = min(gate['initialMaterialCp'], trace['steps'][-1]['materialAfter'])
                step['shorterDefences'] = shorter_defences(
                    board, roots, chosen_san, remaining, floor, engine, settings)
                if any(row['status'] == 'shorter' for row in step['shorterDefences']):
                    flags.append(f'D-shorter-sound-defence-at-ply-{ply}')
                if any(row['status'] == 'unresolved' for row in step['shorterDefences']):
                    flags.append(f'unresolved-D-shorter-defence-at-ply-{ply}')
            if remaining == 1 and any(meaningful_reply(threat)
                                      for threat in step['strongReplyPressure'].values()):
                flags.append('D-endpoint-still-has-forcing-pressure')
        timeline.append(step)
        board = after
        if flags and advanced:
            break
        if ply + 1 < len(record['moves']):
            board.push_san(record['moves'][ply+1])
    result.update(analysis={'roots': timeline[0]['roots']} if timeline else {},
                  timeline={'timeline': timeline})
    if not flags:
        result['status'] = 'needs-editorial-review'
    return result
