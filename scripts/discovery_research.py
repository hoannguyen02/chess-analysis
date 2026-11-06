"""Discovery adapter: shared checks, early triage and explicit editorial handoff."""
import hashlib
import time

import chess
import chess.engine

from tactic_research import module, digest

audit = module('review-discovery-upper')
shortcuts = module('check-discovery-shortcuts')
prover = module('prove-discovery-mates')
miner = audit.build.miner


def record_hash(record):
    return digest({k: record.get(k) for k in (
        'gameId', 'fen', 'moves', 'level', 'goal', 'kind', 'headers', 'source', 'sacrifices',
        'solverMoves', 'discoveryPly', 'payoffPly',
        'sliderSquare', 'targetSquare', 'moverSquare', 'gameFen', 'gameMoves',
        'ply', 'previousMove', 'sourceReferences', 'masterCredential')})


def provenance(record):
    if not all(key in record for key in ('gameFen', 'gameMoves', 'ply')):
        return ['missing-complete-game']
    board = chess.Board(record['gameFen'])
    positions = [board.fen(en_passant='fen')]
    uci = []
    for san in record['gameMoves']:
        move = board.parse_san(san)
        uci.append(move.uci())
        board.push(move)
        positions.append(board.fen(en_passant='fen'))
    flags = []
    if positions[record['ply']] != record['fen']:
        flags.append('source-position-mismatch')
    if hashlib.sha256(' '.join(uci).encode()).hexdigest()[:16] != record['gameId']:
        flags.append('source-game-identity-mismatch')
    previous = record.get('previousMove', {})
    if record['ply'] and (previous.get('fen') != positions[record['ply'] - 1]
                           or previous.get('move') != record['gameMoves'][record['ply'] - 1]):
        flags.append('preceding-move-mismatch')
    refs = record.get('sourceReferences', [])
    if not refs or any(len(ref.get('sha256', '')) != 64 or not ref.get('retrieved')
                       or not ref.get('url', '').startswith('https://') for ref in refs):
        flags.append('missing-checksummed-source')
    if not record.get('masterCredential') and not any(
            record.get('headers', {}).get(side + 'Title') in ('FM', 'IM', 'GM')
            for side in ('White', 'Black')):
        flags.append('master-identity-review-needed')
    return flags


def early_gate(record, require_provenance=True):
    """Flags withhold candidates; an offer alone is not a sacrifice verdict."""
    flags, offers = [], []
    board = chess.Board(record['fen'])
    if not board.is_valid() or board.is_game_over():
        return {'flags': ['invalid-or-terminal-start'], 'offers': [], 'cluster': None}
    if require_provenance:
        flags.extend(provenance(record))
    side = board.turn
    start = board.copy()
    if record['level'] in ('Beginner', 'A', 'B', 'C*') and record.get('sacrifices'):
        flags.append('sacrifice-in-nonsacrificial-level')
    own = (len(record['moves']) + 1) // 2
    if record.get('solverMoves', own) != own:
        flags.append('solver-move-count-mismatch')
    if record['level'] == 'A' and own > 2:
        flags.append('level-A-preparation-too-long')
    if record['level'] == 'B' and own != 3:
        flags.append('level-B-coordination-needs-review')
    if record['level'] == 'C' and (len(record.get('sacrifices', [])) != 1 or own > 3):
        flags.append('simple-sacrifice-evidence-needed')
    if record['level'] == 'C*' and own < 5:
        flags.append('level-C-star-depth-needs-review')
    if record['level'] == 'D' and (not record.get('sacrifices') or own <= 3):
        flags.append('advanced-sacrifice-evidence-needed')
    for ply, san in enumerate(record['moves']):
        before = board.copy()
        move = board.parse_san(san)
        captured = board.piece_at(move.to_square)
        piece = board.piece_at(move.from_square)
        board.push(move)
        if ply % 2:
            continue
        # Include the stationary slider; its offer can be missed by main-line grading.
        relevant = {move.to_square, chess.parse_square(record['sliderSquare'])}
        for reply in list(board.legal_moves):
            victim_square = reply.to_square
            if board.is_en_passant(reply):
                victim_square += -8 if board.turn == chess.WHITE else 8
            victim = board.piece_at(victim_square)
            if (not victim or victim.color != side or victim_square not in relevant
                    or not board.is_capture(reply)):
                continue
            after = board.copy()
            response = board.san(reply)
            after.push(reply)
            delta = miner.material(after, side) - miner.material(before, side)
            if delta >= -75:
                continue
            equal_recapture = False
            if ply + 2 < len(record['moves']):
                # Only call it an equal exchange when the *teaching continuation*
                # immediately recaptures that capturer and restores material.
                try:
                    recapture = after.parse_san(record['moves'][ply + 2])
                    if after.is_capture(recapture) and recapture.to_square == reply.to_square:
                        after.push(recapture)
                        equal_recapture = miner.material(after, side) >= miner.material(before, side) - 75
                except ValueError:
                    pass
            if not equal_recapture:
                offers.append({'ply': ply, 'move': san, 'defence': response,
                               'piece': victim.symbol().upper(), 'square': chess.square_name(victim_square),
                               'captureDestination': chess.square_name(reply.to_square),
                               'materialDeltaCp': delta})
        if record['goal'] == 'material' and ply < record['discoveryPly'] and audit.a.safe(board, side, miner.material(start, side)):
            flags.append('material-before-discovery')
    if offers and record['level'] in ('Beginner', 'A', 'B', 'C*'):
        flags.append('offered-material-needs-level-review')
    if record['goal'] == 'mate' and not board.is_checkmate():
        flags.append('sample-does-not-end-in-mate')
    coverage = audit.build.reply_coverage(record)
    if coverage is None:
        flags.append('local-payoff-not-verified')
    # Cluster suggestions are not duplication verdicts or editorial approvals.
    b = chess.Board(record['fen'])
    preparation = []
    for ply, san in enumerate(record['moves']):
        m = b.parse_san(san)
        if ply % 2 == 0:
            preparation.append((b.piece_at(m.from_square).symbol().upper(), b.is_capture(m), b.gives_check(m)))
        b.push(m)
    motif_board = chess.Board(record['fen'])
    for san in record['moves'][:record['discoveryPly']]:
        motif_board.push_san(san)
    target = motif_board.piece_at(chess.parse_square(record['targetSquare']))
    if target is None:
        flags.append('missing-discovery-target')
    cluster = [record['kind'], record['goal'], len(preparation), preparation,
               record['sliderSquare'][0] == record['targetSquare'][0],
               target.symbol().upper() if target else None]
    return {'flags': sorted(set(flags)), 'offers': offers, 'coverage': coverage,
            'cluster': digest(cluster), 'recordHash': record_hash(record),
            'initialMaterialCp': miner.material(start, side)}


def root_review(record, engine, nodes):
    board = chess.Board(record['fen'])
    side = board.turn
    baseline = miner.material(board, side)
    roots = []
    for move in list(board.legal_moves):
        after = board.copy()
        after.push(move)
        roots.append({'move': board.san(move), 'discovery': bool(miner.discoveries(board, move, after)),
                      'immediateMate': after.is_checkmate(), 'forcedMateInTwo': audit.a.mate2(after),
                      'safeImmediateGain': board.is_capture(move) and audit.a.safe(after, side, baseline)})
    infos = engine.analyse(board, chess.engine.Limit(nodes=nodes), multipv=board.legal_moves.count())
    scores = {board.san(info['pv'][0]): info for info in infos}
    assert set(scores) == {row['move'] for row in roots}, 'Every legal root must be covered'
    for row in roots:
        info = scores[row['move']]
        score = info['score'].pov(side)
        row.update(scoreCp=score.score(), mateScore=score.mate(), pv=[m.uci() for m in info['pv']])
    flags = []
    if any(r['safeImmediateGain'] and r['scoreCp'] is not None and r['scoreCp'] >= 0 for r in roots):
        flags.append('immediate-material')
    if any(r['forcedMateInTwo'] for r in roots):
        flags.append('short-mate')
    if record['goal'] == 'material' and any(r['mateScore'] is not None and r['mateScore'] > 0 for r in roots):
        flags.append('root-mating-lead')
    return {'roots': roots, 'flags': flags}


def shortcut_review(record, roots, budget=18000):
    found, unknown = [], []
    if record['goal'] == 'mate':
        return {'shortcuts': found, 'unverified': unknown}
    board = chess.Board(record['fen'])
    scores = {r['move']: r for r in roots}
    for move in list(board.legal_moves):
        san = board.san(move)
        if record['level'] == 'C' and san == record['moves'][0]:
            continue
        score = scores[san]['scoreCp']
        if score is not None and score < 0:
            continue
        try:
            proof = shortcuts.search(board, move, budget)
        except shortcuts.Limit:
            unknown.append(san)
            continue
        if proof:
            found.append(proof)
    return {'shortcuts': found, 'unverified': unknown}


def pv_san(board, moves):
    result, walk = [], board.copy()
    for move in moves:
        result.append(walk.san(move))
        walk.push(move)
    return result


def timeline_review(record, engine, prep_nodes, defence_nodes):
    board = chess.Board(record['fen'])
    side = board.turn
    baseline = miner.material(board, side)
    preparation, timeline = [], []
    for ply, san in enumerate(record['moves']):
        board.push_san(san)
        if ply % 2:
            continue
        replies = []
        for move in list(board.legal_moves):
            after = board.copy()
            name = after.san(move)
            after.push(move)
            replies.append({'move': name, 'materialGain': miner.material(after, side) - baseline,
                            'mate': after.is_checkmate()})
        probes = []
        if not board.is_game_over():
            for info in engine.analyse(board, chess.engine.Limit(nodes=defence_nodes),
                                       multipv=min(3, board.legal_moves.count())):
                score = info['score'].pov(side)
                probes.append({'cp': score.score(), 'mate': score.mate(), 'line': pv_san(board, info['pv'])})
        timeline.append({'ply': ply, 'move': san, 'fenAfter': board.fen(),
                         'materialGain': miner.material(board, side) - baseline,
                         'safeImmediateGain': audit.a.safe(board, side, baseline),
                         'replies': replies, 'engineDefences': probes})
        if ply < record['discoveryPly'] and not board.is_game_over():
            infos = engine.analyse(board, chess.engine.Limit(nodes=prep_nodes),
                                   multipv=min(3, board.legal_moves.count()))
            preparation.append({'ply': ply + 1, 'defences': [
                {'move': board.san(info['pv'][0]), 'scoreCp': info['score'].pov(side).score(),
                 'mateScore': info['score'].pov(side).mate(), 'pv': [m.uci() for m in info['pv']]}
                for info in infos]})
    flags = []
    if record['goal'] == 'material':
        if any(x['safeImmediateGain'] for x in timeline if x['ply'] < record['discoveryPly']):
            flags.append('material-before-discovery')
        if record['kind'] == 'attack' and next(x for x in timeline if x['ply'] == record['discoveryPly'])['safeImmediateGain']:
            flags.append('material-on-direct-move-before-discovered-target')
    return {'preparation': preparation, 'timeline': timeline, 'flags': flags}


def review(record, engine, settings, complete=False, require_provenance=True):
    timings = {}
    def stage(name, call):
        started = time.perf_counter()
        value = call()
        timings[name] = time.perf_counter() - started
        return value
    result = {'gameId': record['gameId'], 'recordHash': record_hash(record), 'flags': [],
              'fen': record['fen'], 'moves': record['moves'], 'level': record['level']}
    gate = stage('preflight', lambda: early_gate(record, require_provenance))
    result['preflight'] = gate
    result['flags'].extend(gate['flags'])
    if result['flags'] and not complete:
        return {**result, 'status': 'withheld', 'timings': timings}
    roots = stage('roots', lambda: root_review(record, engine, settings['rootNodes']))
    result['analysis'] = roots
    result['flags'].extend(roots['flags'])
    if result['flags'] and not complete:
        return {**result, 'status': 'withheld', 'timings': timings}
    short = stage('shortcuts', lambda: shortcut_review(record, roots['roots'], settings['shortcutBudget']))
    result['shortcuts'] = short
    if short['shortcuts']:
        result['flags'].append('shorter-material-route')
    if short['unverified']:
        result['flags'].append('unresolved-shortcut-budget')
    if result['flags'] and not complete:
        return {**result, 'status': 'withheld', 'timings': timings}
    timeline = stage('timeline', lambda: timeline_review(record, engine, settings['prepNodes'], settings['defenceNodes']))
    result['timeline'] = timeline
    result['flags'].extend(timeline['flags'])
    if record['goal'] == 'mate':
        proof = stage('mateProof', lambda: prover.prove(record, settings['mateBudget']))
        result['mateProof'] = proof
        if proof['status'] != 'proved':
            result['flags'].append('mate-not-proved')
        if len(record['moves']) >= 3:
            shorter = stage('shorterMateProof', lambda: prover.prove(
                {**record, 'moves': record['moves'][:-2]}, settings['mateBudget']))
            result['shorterMateProof'] = shorter
            if shorter['status'] != 'refuted-within-limit':
                result['flags'].append('shorter-mate-or-unresolved')
    result['flags'] = sorted(set(result['flags']))
    result['timings'] = timings
    result['status'] = 'withheld' if result['flags'] else 'needs-editorial-review'
    return result
