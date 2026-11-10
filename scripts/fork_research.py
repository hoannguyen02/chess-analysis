"""Real-game Fork A/B/D review. Evidence still requires editorial approval."""
import time

import chess
import chess.engine

from tactic_research import digest, module
from discovery_research import provenance, pv_san

build = module('build-forks')
miner = build.miner
shortcuts = module('check-discovery-shortcuts')


def record_hash(record):
    # Bind every supplied field, including provenance, objective and old screen.
    return digest(record)


def start_board(record):
    """Retain source move history for draw/repetition-sensitive engine requests."""
    if all(key in record for key in ('gameFen', 'gameMoves', 'ply')):
        board = chess.Board(record['gameFen'])
        for san in record['gameMoves'][:record['ply']]:
            board.push_san(san)
        if board.fen(en_passant='fen') != record['fen']:
            raise ValueError('Source position mismatch')
        return board
    return chess.Board(record['fen'])


def safe_material(board, side, baseline):
    """A local gain surviving every immediate reply, not an eventual win proof."""
    if board.is_game_over() or miner.material(board, side) <= baseline:
        return False
    for reply in list(board.legal_moves):
        after = board.copy()
        after.push(reply)
        if after.is_checkmate() or miner.material(after, side) <= baseline:
            return False
    return True


def mate_in_two(after_root):
    if after_root.is_checkmate():
        return True
    replies = list(after_root.legal_moves)
    if not replies:
        return False
    for reply in replies:
        board = after_root.copy()
        board.push(reply)
        if not any(board.gives_check(move) and _mates(board, move)
                   for move in list(board.legal_moves)):
            return False
    return True


def _mates(board, move):
    after = board.copy()
    after.push(move)
    return after.is_checkmate()


def _captured_square(board, move):
    return (move.to_square + (-8 if board.turn else 8)
            if board.is_en_passant(move) else move.to_square)


def sacrifice_review(record):
    """Classify material actually given up in the sample, not geometric offers.

    Settle ordinary capture chains through their countercaptures, including an
    immediate equal capture on another square or on the nominal fork move.
    Promotion compensation stays separate. A declined offer cannot establish D.
    Editorial review still decides whether the accepted sacrifice is essential
    and sufficiently complex, including possible easier recovery alternatives.
    """
    board = chess.Board(record['fen'])
    side = board.turn
    frames, events, captures = [board.copy()], [], []
    identities = {square: square for square, piece in board.piece_map().items()
                  if piece.color == side}
    last_moved = {}
    for ply, san in enumerate(record['moves']):
        move = board.parse_san(san)
        square = _captured_square(board, move)
        captured = board.piece_at(square) if board.is_capture(move) else None
        captures.append(board.is_capture(move) and not move.promotion)
        if board.turn == side:
            identity = identities.pop(move.from_square)
            identities[move.to_square] = identity
            last_moved[identity] = ply
            if board.is_castling(move):
                rank = chess.square_rank(move.from_square)
                kingside = move.to_square > move.from_square
                rook_from = chess.square(7 if kingside else 0, rank)
                rook_to = chess.square(5 if kingside else 3, rank)
                rook_identity = identities.pop(rook_from)
                identities[rook_to] = rook_identity
                last_moved[rook_identity] = ply
        elif captured and captured.color == side:
            identity = identities.pop(square)
            if ply < record['forkPly']:
                events.append({'capturePly': ply,
                               'offeredPly': last_moved.get(identity, ply - 1),
                               'piece': captured.symbol().upper(),
                               'square': chess.square_name(square),
                               'captureDestination': chess.square_name(move.to_square),
                               'capture': san,
                               'stationary': identity not in last_moved})
        board.push(move)
        frames.append(board.copy())
    accepted, recovered, ordinary = [], [], []
    for event in events:
        ply, offered = event['capturePly'], event['offeredPly']
        baseline = miner.material(frames[offered], side)
        after = frames[ply + 1]
        delta = miner.material(after, side) - baseline
        next_delta = (miner.material(frames[ply + 2], side) - baseline
                      if ply + 2 < len(frames) else delta)
        # A queen recapture can look like recovery until the next rook/pawn
        # recaptures it. Settle the whole immediate capture chain, stopping
        # before the named fork or a new quiet/promotion decision. Promotion
        # compensation is not an ordinary equal exchange.
        end = ply + 1
        while end < record['forkPly'] and captures[end]:
            end += 1
        settled = frames[end]
        settled_delta = miner.material(settled, side) - baseline
        worst_delta, countercaptures = settled_delta, []
        if settled.turn != side:
            for move in list(settled.legal_moves):
                if not settled.is_capture(move):
                    continue
                after_reply = settled.copy()
                name = after_reply.san(move)
                after_reply.push(move)
                value = miner.material(after_reply, side) - baseline
                worst_delta = min(worst_delta, value)
                countercaptures.append({'move': name, 'materialDeltaCp': value})
        # The sample may recover an equal piece on a different square on the
        # very next move, including the fork itself. That is still an ordinary
        # recovered exchange when the capturing piece cannot be recaptured to
        # leave a real material cost. Do not confuse it with promotion, or with
        # a temporary queen recapture that the next king/rook can take back.
        if (delta < -75 and worst_delta < -75 and ply + 1 < len(captures)
                and captures[ply + 1] and next_delta >= -75):
            recovery_before = frames[ply + 1]
            recovery_move = recovery_before.parse_san(record['moves'][ply + 1])
            recovered_board = frames[ply + 2]
            recovery_worst, recaptures = next_delta, []
            for reply in list(recovered_board.legal_moves):
                if (not recovered_board.is_capture(reply)
                        or _captured_square(recovered_board, reply) != recovery_move.to_square):
                    continue
                response = recovered_board.copy()
                name = response.san(reply)
                response.push(reply)
                value = miner.material(response, side) - baseline
                recovery_worst = min(recovery_worst, value)
                recaptures.append({'move': name, 'materialDeltaCp': value})
            if recovery_worst >= -75:
                end, settled_delta, worst_delta = ply + 2, next_delta, recovery_worst
                countercaptures = recaptures
                event['immediateExchangeRecovery'] = {
                    'move': record['moves'][ply + 1],
                    'captureDestination': chess.square_name(recovery_move.to_square),
                    'materialDeltaCp': next_delta,
                    'allImmediateRecaptures': recaptures,
                    'onForkPly': ply + 1 == record['forkPly']}
        alternatives = []
        for move in list(after.legal_moves):
            if not after.is_capture(move):
                continue
            settled = after.copy()
            name = settled.san(move)
            settled.push(move)
            if miner.material(settled, side) >= baseline - 75:
                alternatives.append(name)
        event.update(materialAfterCaptureCp=delta,
                     materialAfterNextSolverCp=next_delta,
                     exchangeSettlementPly=end,
                     materialAfterCaptureChainCp=settled_delta,
                     materialAfterImmediateCountercapturesCp=worst_delta,
                     settlementCountercaptures=countercaptures,
                     immediateMaterialRecoveryMoves=alternatives)
        if delta >= -75:
            event['classification'] = 'ordinary-or-favorable-exchange'
            ordinary.append(event)
        elif worst_delta >= -75:
            event['classification'] = 'immediately-recovered-exchange'
            recovered.append(event)
        else:
            event['classification'] = 'accepted-unequal-sacrifice'
            accepted.append(event)
    claimed = {(entry['ply'], entry['piece']) for entry in record.get('sacrifices', [])}
    verified = {(entry['offeredPly'], entry['piece']) for entry in accepted}
    return {'accepted': accepted, 'recoveredExchanges': recovered,
            'ordinaryExchanges': ordinary,
            'unvalidatedClaims': [{'ply': ply, 'piece': piece} for ply, piece in sorted(claimed - verified)],
            'unrecordedSacrifices': [{'ply': ply, 'piece': piece} for ply, piece in sorted(verified - claimed)],
            'scope': 'Actual sample losses and immediate material recovery, not proof of compensation or D complexity.'}


def early_gate(record, require_provenance=True):
    board = chess.Board(record['fen'])
    flags, offers, exchanges = [], [], []
    if not board.is_valid() or board.is_game_over():
        return {'flags': ['invalid-or-terminal-start'], 'offers': [], 'cluster': None}
    if record.get('goal') != 'material':
        flags.append('unsupported-fork-objective')
    advanced = record.get('level') == 'D'
    if record.get('level') not in ('A', 'B', 'D'):
        flags.append('unsupported-fork-level')
    if require_provenance:
        flags.extend(provenance(record))
    own = (len(record['moves']) + 1) // 2
    if record.get('solverMoves') != own:
        flags.append('solver-move-count-mismatch')
    if record['level'] == 'A' and (own != 2 or record['forkPly'] != 0):
        flags.append('level-A-needs-direct-fork')
    if record['level'] == 'B' and (own != 3 or record['forkPly'] != 2):
        flags.append('level-B-needs-one-preparation')
    if advanced and (own <= 3 or record['forkPly'] < 4):
        flags.append('level-D-needs-more-than-three-solver-moves')
    if record.get('sacrifices') and not advanced:
        flags.append('sacrifice-in-nonsacrificial-level')
    side, baseline = board.turn, miner.material(board, board.turn)
    motif = board.copy()
    for san in record['moves'][:record['forkPly']]:
        motif.push_san(san)
    before_fork = motif.copy()
    fork = motif.parse_san(record['moves'][record['forkPly']])
    attacker_origin = fork.from_square
    motif.push(fork)
    victims = miner.targets(motif, fork.to_square)
    if (len(victims) < 2 or chess.square_name(fork.to_square) != record['forkSquare']
            or sorted(chess.square_name(square) for square in victims) != sorted(record['targets'])
            or motif.piece_at(fork.to_square).symbol().upper() != record['forkPiece']):
        flags.append('fork-geometry-mismatch')
    capture = motif.copy()
    capture.push_san(record['moves'][record['forkPly'] + 1])
    payoff = capture.parse_san(record['moves'][record['forkPly'] + 2])
    if (payoff.from_square != fork.to_square or payoff.to_square not in victims
            or not capture.is_capture(payoff)
            or payoff.to_square in before_fork.attacks(fork.from_square)):
        flags.append('fork-does-not-create-capture')
    for ply, san in enumerate(record['moves']):
        before = board.copy()
        move = board.parse_san(san)
        board.push(move)
        if ply % 2:
            continue
        relevant = {move.to_square}
        if ply < record['forkPly']:
            relevant.add(attacker_origin)
        if advanced:
            # A stationary piece can be deliberately left en prise during the
            # preparation. Include pawn and en-passant captures as well.
            relevant.update(square for square, piece in board.piece_map().items()
                            if piece.color == side)
        for reply in list(board.legal_moves):
            square = _captured_square(board, reply)
            victim = board.piece_at(square)
            if (not board.is_capture(reply) or square not in relevant
                    or not victim or victim.color != side):
                continue
            after = board.copy()
            response = after.san(reply)
            after.push(reply)
            delta = miner.material(after, side) - miner.material(before, side)
            if delta >= -75:
                continue
            recaptures = []
            for recapture in list(after.legal_moves):
                if not after.is_capture(recapture) or recapture.to_square != reply.to_square:
                    continue
                settled = after.copy()
                name = settled.san(recapture)
                settled.push(recapture)
                if miner.material(settled, side) >= miner.material(before, side) - 75:
                    recaptures.append(name)
            detail = {'ply': ply, 'move': san, 'defence': response,
                      'piece': victim.symbol().upper(), 'square': chess.square_name(square),
                      'captureDestination': chess.square_name(reply.to_square),
                      'materialDeltaCp': delta, 'equalRecoveryMoves': recaptures}
            (exchanges if recaptures else offers).append(detail)
        if ply < record['forkPly'] and safe_material(board, side, baseline):
            flags.append('material-before-fork')
    if offers and not advanced:
        flags.append('offered-material-needs-level-review')
    sacrifices = sacrifice_review(record) if advanced else None
    if advanced:
        if not sacrifices['accepted']:
            flags.append('level-D-needs-accepted-unequal-sacrifice')
        if sacrifices['unvalidatedClaims']:
            flags.append('recorded-sacrifice-not-validated')
        if sacrifices['unrecordedSacrifices']:
            flags.append('accepted-sacrifice-missing-record')
    coverage = build.reply_coverage(record)
    if (not coverage or record['moves'][-1] not in coverage.get(record['moves'][-2], [])):
        flags.append('local-payoff-not-verified')
    cluster = [record['level'], record['forkPiece'], motif.is_check(),
               sorted(motif.piece_at(square).symbol().upper() for square in victims),
               chess.Board(record['fen']).is_capture(chess.Board(record['fen']).parse_san(record['moves'][0]))]
    result = {'flags': sorted(set(flags)), 'offers': offers, 'equalExchanges': exchanges,
            'coverage': coverage, 'cluster': digest(cluster), 'recordHash': record_hash(record),
            'initialMaterialCp': baseline}
    if advanced:
        result['sacrificeReview'] = sacrifices
    return result


def root_review(record, engine, nodes):
    board = start_board(record)
    side, baseline = board.turn, miner.material(board, board.turn)
    roots = []
    for move in list(board.legal_moves):
        after = board.copy()
        after.push(move)
        roots.append({'move': board.san(move), 'fork': len(miner.targets(after, move.to_square)) >= 2,
                      'immediateMate': after.is_checkmate(), 'forcedMateInTwo': mate_in_two(after),
                      'safeImmediateGain': board.is_capture(move) and safe_material(after, side, baseline)})
    infos = engine.analyse(board, chess.engine.Limit(nodes=nodes), multipv=board.legal_moves.count())
    scores = {board.san(info['pv'][0]): info for info in infos}
    if set(scores) != {row['move'] for row in roots}:
        raise ValueError('Every legal root must be covered')
    for row in roots:
        info = scores[row['move']]
        score = info['score'].pov(side)
        row.update(scoreCp=score.score(), mateScore=score.mate(), pv=[move.uci() for move in info['pv']])
    flags = []
    if any(row['safeImmediateGain'] and (row['scoreCp'] is None or row['scoreCp'] >= 0)
           for row in roots):
        flags.append('immediate-material')
    if any(row['forcedMateInTwo'] for row in roots):
        flags.append('short-mate')
    mating_leads = [row for row in roots if (row['mateScore'] or 0) > 0]
    if record['level'] == 'D':
        # A distant engine mate reached through the intended combination is
        # different from a simpler available mating solution. Scores alone do
        # not establish either claim; near alternatives remain unresolved.
        if any(row['mateScore'] <= record['solverMoves'] for row in mating_leads):
            flags.append('unresolved-root-mating-lead')
    elif mating_leads:
        flags.append('root-mating-lead')
    selected = next(row for row in roots if row['move'] == record['moves'][0])
    best = max((row['scoreCp'] for row in roots if row['scoreCp'] is not None), default=100000)
    selected_value = (100000 - selected['mateScore']
                      if record['level'] == 'D' and (selected['mateScore'] or 0) > 0
                      else selected['scoreCp'])
    if selected_value is None or selected_value < max(100, best - 60):
        flags.append('selected-root-needs-review')
    result = {'roots': roots, 'flags': flags}
    if record['level'] == 'D':
        result['matingLeads'] = [{'move': row['move'], 'engineMateScore': row['mateScore'],
                                  'withinSampleSolverMoves': row['mateScore'] <= record['solverMoves'],
                                  'status': 'engine-lead-not-all-reply-proof'} for row in mating_leads]
    return result


def shortcut_review(record, roots, budget):
    board = chess.Board(record['fen'])
    scores = {row['move']: row for row in roots}
    found, unknown = [], []
    for move in list(board.legal_moves):
        san = board.san(move)
        if scores[san]['scoreCp'] is not None and scores[san]['scoreCp'] < 0:
            continue
        if record['level'] == 'A' and san == record['moves'][0]:
            continue
        # Equivalent direct forks are valid A solutions. B must require its prep.
        after = board.copy()
        after.push(move)
        direct_fork = len(miner.targets(after, move.to_square)) >= 2
        try:
            proof = shortcuts.search(board, move, budget)
        except shortcuts.Limit:
            unknown.append(san)
            continue
        if proof:
            coverage = None
            if direct_fork:
                trial = {'fen': record['fen'], 'moves': [san], 'forkPly': 0,
                         'targets': [chess.square_name(square) for square in miner.targets(after, move.to_square)]}
                coverage = build.reply_coverage(trial)
            proof['fork'] = bool(coverage)
            if record['level'] != 'A' or not coverage:
                found.append(proof)
    return {'shortcuts': found, 'unverified': unknown}


def timeline_review(record, engine, prep_nodes, defence_nodes):
    board = start_board(record)
    side, baseline = board.turn, miner.material(board, board.turn)
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
                probes.append({'cp': score.score(), 'mate': score.mate(),
                               'line': pv_san(board, info['pv'])})
        timeline.append({'ply': ply, 'move': san, 'fenAfter': board.fen(),
                         'materialGain': miner.material(board, side) - baseline,
                         'safeImmediateGain': safe_material(board, side, baseline),
                         'replies': replies, 'engineDefences': probes})
        if ply < record['forkPly'] and not board.is_game_over():
            infos = engine.analyse(board, chess.engine.Limit(nodes=prep_nodes),
                                   multipv=min(3, board.legal_moves.count()))
            preparation.append({'ply': ply + 1, 'defences': [
                {'move': board.san(info['pv'][0]), 'scoreCp': info['score'].pov(side).score(),
                 'mateScore': info['score'].pov(side).mate(), 'pv': [move.uci() for move in info['pv']]}
                for info in infos]})
    flags = []
    if any((probe['cp'] is not None and probe['cp'] < 100) or (probe['mate'] or 0) < 0
           for step in timeline for probe in step['engineDefences']):
        flags.append('strong-defence-payoff-needs-review')
    return {'preparation': preparation, 'timeline': timeline, 'flags': flags}


def _immediate_material_response(board, side, baseline):
    """An actual legal move and all immediate opponent replies, not a score."""
    if board.turn != side:
        raise ValueError('Material response must start on the solver turn')
    for move in sorted(board.legal_moves, key=lambda move: not board.is_capture(move)):
        if not board.is_capture(move) and miner.material(board, side) <= baseline:
            continue
        after = board.copy()
        san = after.san(move)
        after.push(move)
        if safe_material(after, side, baseline):
            replies = []
            for reply in list(after.legal_moves):
                settled = after.copy()
                name = settled.san(reply)
                settled.push(reply)
                replies.append({'move': name, 'gainCp': miner.material(settled, side) - baseline})
            return {'move': san, 'gainCp': miner.material(after, side) - baseline,
                    'allImmediateReplies': replies,
                    'scope': 'A legal material response surviving every immediate reply; not indefinite play.'}
    return None


def _local_fork_response(record, prefix, defence, board):
    """Recheck a branch's fork against every local reply and countercapture."""
    for move in list(board.legal_moves):
        after = board.copy()
        san = after.san(move)
        after.push(move)
        victims = miner.targets(after, move.to_square)
        if len(victims) < 2:
            continue
        new_targets = {square for square in victims if square not in board.attacks(move.from_square)}
        if not new_targets:
            continue
        trial = {'fen': record['fen'], 'moves': prefix + [defence, san],
                 'forkPly': len(prefix) + 1,
                 'targets': [chess.square_name(square) for square in victims]}
        coverage = build.reply_coverage(trial)
        if coverage:
            filtered = {}
            for name, captures in coverage.items():
                response = after.copy()
                response.push_san(name)
                filtered[name] = [capture for capture in captures
                                  if response.parse_san(capture).to_square in new_targets]
            if not all(filtered.values()):
                continue
            return {'move': san, 'targets': trial['targets'], 'allForkReplies': filtered,
                    'prefix': prefix + [defence],
                    'scope': 'All immediate fork replies, captures and countercaptures from the original material baseline.'}
    return None


def _pv_material_witness(board, pv, side, baseline, horizon=40):
    """Expose settled material in a bounded defensive PV, never call it proof."""
    frames, sans = [board.copy()], []
    for move in pv[:horizon]:
        if move not in frames[-1].legal_moves:
            raise ValueError('Illegal defensive principal variation')
        after = frames[-1].copy()
        sans.append(after.san(move))
        after.push(move)
        frames.append(after)
    gains = [miner.material(frame, side) - baseline for frame in frames]
    for index, frame in enumerate(frames):
        if frame.turn == side or gains[index] < 100:
            continue
        # Do not stop at a gain that the remainder of this analysed line gives
        # back. Immediate countercaptures are independently enumerated too.
        if min(gains[index:]) >= 100 and safe_material(frame, side, baseline):
            return {'line': sans[:index], 'gainCp': gains[index],
                    'minimumFollowingPvGainCp': min(gains[index:]),
                    'analysedLine': sans, 'horizonPlies': horizon,
                    'scope': 'Bounded best-defence analysis and every immediate reply; not an exhaustive long-term proof.'}
    return None


def _mate_response_within_two(board):
    """Small exact certificate only for inferior defences allowing quick mate."""
    for move in list(board.legal_moves):
        after = board.copy()
        first = after.san(move)
        after.push(move)
        if after.is_checkmate():
            return {'first': first, 'replies': {}, 'solverMoves': 1}
        replies = list(after.legal_moves)
        if not replies:
            continue
        branches = {}
        for reply in replies:
            continuation = after.copy()
            name = continuation.san(reply)
            continuation.push(reply)
            mate = next((continuation.san(candidate) for candidate in continuation.legal_moves
                         if continuation.gives_check(candidate) and _mates(continuation, candidate)), None)
            if mate is None:
                break
            branches[name] = mate
        else:
            return {'first': first, 'replies': branches, 'solverMoves': 2}
    return None


def _targeted_continuation(record, prefix, defence, board, engine, side, baseline, nodes):
    """Resolve a truncated allowed-defence PV with a fresh solver-turn search.

    Every completed request still uses CachedEngine's exact history/settings.
    A favourable score selects a sane continuation for review; only separate
    material/fork witnesses or an exact short-mate certificate resolve recovery.
    """
    if board.turn != side:
        raise ValueError('Targeted continuation must start after the defence')
    budget = max(1000000, nodes)
    count = min(3, board.legal_moves.count())
    result = {'fen': board.fen(en_passant='fen'),
              'historyLength': len(board.move_stack),
              'search': {'nodes': budget, 'multiPV': count, 'rootMoves': None},
              'continuations': [], 'resolved': False,
              'scope': 'A bounded solver-turn continuation after a selected defence; scores alone never establish recovery.'}
    if not count or board.is_game_over():
        result['status'] = 'terminal-without-recovery-witness'
        return result
    infos = engine.analyse(board, chess.engine.Limit(nodes=budget), multipv=count)
    if (len(infos) != count or any(not info.get('pv') for info in infos)
            or len({info['pv'][0] for info in infos}) != count):
        raise ValueError('Incomplete targeted continuation MultiPV')
    mate_attempted, mate_proof = False, None
    for info in infos:
        # Legal replay of the complete returned PV also guards against a
        # malformed cache entry, before any objective witness is considered.
        sans = pv_san(board, info['pv'])
        score = info['score'].pov(side)
        sane = score.score(mate_score=100000) >= 100
        witness = (_pv_material_witness(board, info['pv'], side, baseline)
                   if sane else None)
        tail_response = tail_fork = None
        if sane and not witness:
            tail = board.copy()
            for move in info['pv'][:40]:
                tail.push(move)
            if tail.turn == side and not tail.is_game_over():
                tail_response = _immediate_material_response(tail, side, baseline)
                played = prefix + [defence] + sans[:40]
                tail_fork = _local_fork_response(record, played[:-1], played[-1], tail)
        if sane and (score.mate() or 0) > 0 and not (witness or tail_response or tail_fork):
            if not mate_attempted:
                mate_proof = _mate_response_within_two(board)
                mate_attempted = True
        # A mate certificate belongs to this solver-turn position, but is only
        # recorded on a continuation that actually raised that lead.
        current_mate = mate_proof if sane and (score.mate() or 0) > 0 else None
        resolved = bool(sane and (witness or tail_response or tail_fork or current_mate))
        result['continuations'].append({
            'scoreCp': score.score(), 'mateScore': score.mate(),
            'saneSolverContinuation': sane,
            'pv': [move.uci() for move in info['pv']], 'line': sans,
            **{key: info[key] for key in ('depth', 'seldepth', 'nodes') if key in info},
            'boundedMaterialWitness': witness,
            'tailImmediateMaterialResponse': tail_response,
            'tailLocalForkResponse': tail_fork,
            'exactShortMateResponse': current_mate, 'resolved': resolved})
        result['resolved'] |= resolved
    result['status'] = 'recovery-witness-found' if result['resolved'] else 'unresolved-continuation'
    return result


def timeline_review_d(record, engine, prep_nodes, defence_nodes):
    """Review long preparation and actual sacrifice accept/decline resources.

    All preparation replies are compared. Captures, counterchecks, the sample
    reply and every near-best decline receive their own full-budget root probe.
    Local material/fork certificates supplement the engine's finite evidence;
    unresolved recovery is withheld for further work rather than approved.
    """
    result = timeline_review(record, engine, prep_nodes, defence_nodes)
    board = start_board(record)
    side, baseline = board.turn, miner.material(board, board.turn)
    stages, flags = [], list(result['flags'])
    comparison_nodes = max(prep_nodes, defence_nodes)
    probe_nodes = max(defence_nodes, 2 * prep_nodes)
    for ply, san in enumerate(record['moves']):
        before = board.copy()
        board.push_san(san)
        if ply % 2 or ply >= record['forkPly']:
            continue
        legal = list(board.legal_moves)
        infos = engine.analyse(board, chess.engine.Limit(nodes=comparison_nodes), multipv=len(legal))
        indexed = {info['pv'][0]: info for info in infos}
        if set(indexed) != set(legal):
            raise ValueError('Every legal preparation defence must be compared')
        ranked = sorted(legal, key=lambda move: indexed[move]['score'].pov(side).score(mate_score=100000))
        strongest = indexed[ranked[0]]['score'].pov(side).score(mate_score=100000)
        sample = board.parse_san(record['moves'][ply + 1])
        comparison, probes = [], []
        for reply in ranked:
            score = indexed[reply]['score'].pov(side)
            value = score.score(mate_score=100000)
            name = board.san(reply)
            after = board.copy()
            captured_square = _captured_square(board, reply)
            victim = board.piece_at(captured_square) if board.is_capture(reply) else None
            after.push(reply)
            delta = miner.material(after, side) - miner.material(before, side)
            reasons = []
            if board.is_capture(reply):
                reasons.append('capture')
            if board.gives_check(reply):
                reasons.append('countercheck')
            if reply == sample:
                reasons.append('sample')
            if reply in ranked[:3] or value <= strongest + 200:
                reasons.append('strong-defence-or-decline')
            comparison.append({'move': name, 'scoreCp': score.score(), 'mateScore': score.mate(),
                               'pv': [move.uci() for move in indexed[reply]['pv']],
                               'materialDeltaCp': delta, 'selectedReasons': reasons})
            if not reasons:
                continue
            info = engine.analyse(board, chess.engine.Limit(nodes=probe_nodes), root_moves=[reply])
            if not info.get('pv') or info['pv'][0] != reply:
                raise ValueError('Defence probe did not retain its allowed root')
            deep_score = info['score'].pov(side)
            response = _immediate_material_response(after, side, baseline)
            fork = _local_fork_response(record, record['moves'][:ply + 1], name, after)
            witness = _pv_material_witness(board, info['pv'], side, baseline)
            mate = (_mate_response_within_two(after)
                    if (deep_score.mate() or 0) > 0 and not (response or fork or witness) else None)
            continuation = None
            if not (response or fork or witness or mate):
                continuation = _targeted_continuation(
                    record, record['moves'][:ply + 1], name, after, engine,
                    side, baseline, max(1000000, 2 * probe_nodes))
            if deep_score.score(mate_score=100000) < 100:
                flags.append(f'strong-defence-payoff-needs-review-ply-{ply}')
            if not (response or fork or witness or mate
                    or (continuation and continuation['resolved'])):
                flags.append(f'unresolved-sacrifice-recovery-ply-{ply}-{reply.uci()}')
            probes.append({'move': name, 'reasons': reasons,
                           'capturedPiece': victim.symbol().upper() if victim else None,
                           'capturedSquare': chess.square_name(captured_square) if victim else None,
                           'materialDeltaCp': delta, 'scoreCp': deep_score.score(),
                           'mateScore': deep_score.mate(), 'nodesBudget': probe_nodes,
                           'line': pv_san(board, info['pv']),
                           'immediateMaterialResponse': response, 'localForkResponse': fork,
                           'boundedMaterialWitness': witness, 'exactShortMateResponse': mate,
                           **({'targetedContinuation': continuation} if continuation is not None else {})})
        stages.append({'ply': ply, 'solverMove': san, 'fenAfter': board.fen(en_passant='fen'),
                       'allLegalReplyCount': len(legal), 'allReplyComparison': comparison,
                       'probedReplies': probes})
    result.update(flags=sorted(set(flags)), sacrificeDefences=stages,
                  advancedSettings={'allReplyComparisonNodes': comparison_nodes,
                                    'perSelectedDefenceNodes': probe_nodes,
                                    'nearBestDefenceWindowCp': 200, 'recoveryPvHorizonPlies': 40,
                                    'selection': 'Every capture/countercheck, sample, top three and all within200cp of the strongest defensive reply.',
                                    'scope': 'Finite tactical evidence plus local legal certificates; independent editorial approval remains required.'})
    return result


def review(record, engine, settings, complete=False, require_provenance=True):
    timings = {}
    def stage(name, call):
        started = time.perf_counter()
        value = call()
        timings[name] = time.perf_counter() - started
        return value
    result = {'gameId': record['gameId'], 'recordHash': record_hash(record), 'flags': [],
              'fen': record['fen'], 'moves': record['moves'], 'level': record['level']}
    stages = [
        ('preflight', lambda: early_gate(record, require_provenance)),
        ('analysis', lambda: root_review(record, engine, settings['rootNodes'])),
        ('shortcuts', lambda: shortcut_review(record, result['analysis']['roots'], settings['shortcutBudget'])),
        ('timeline', lambda: (timeline_review_d if record['level'] == 'D' else timeline_review)(
            record, engine, settings['prepNodes'], settings['defenceNodes'])),
    ]
    for name, call in stages:
        value = result[name] = stage(name, call)
        result['flags'].extend(value.get('flags', []))
        if name == 'shortcuts':
            if value['shortcuts']:
                result['flags'].append('simpler-material-route')
            if value['unverified']:
                result['flags'].append('unresolved-shortcut-budget')
        if result['flags'] and not complete:
            break
    result['flags'] = sorted(set(result['flags']))
    return {**result, 'timings': timings,
            'status': 'withheld' if result['flags'] else 'needs-editorial-review'}
