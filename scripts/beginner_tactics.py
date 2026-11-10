"""Reusable composition review; topic geometry never substitutes for approval.

The first profile is Fork. All-root local material/mate checks are distinct from
bounded engine evidence and independent editorial selection. No game provenance
is invented for original compositions. Scratch candidates remain outside Git.
"""
from concurrent.futures import ProcessPoolExecutor
import hashlib
import json
from pathlib import Path
import time

import chess
import chess.engine

from beginner_one_move import check_legacy_compositions, review_composed_beginner
from tactic_research import CachedEngine, DEFAULT_CACHE, ROOT, atomic_json, digest, module

# Conventional material units, distinct from Stockfish's position evaluation.
# In particular Rook-for-Knight minus a pawn is still a one-pawn net gain.
VALUES = {chess.PAWN: 100, chess.KNIGHT: 300, chess.BISHOP: 300,
          chess.ROOK: 500, chess.QUEEN: 900, chess.KING: 0}
NAMES = {1: 'Tốt', 2: 'Mã', 3: 'Tượng', 4: 'Xe', 5: 'Hậu', 6: 'Vua'}
PROFILES = {'fork'}
LEGACY_VERSION = '42438004b5d0397ca6bbf1905d52da892d8908797a65ccb1808816087a334cfa'
LEGACY_ENTRIES = 'dbd4b6b08fb7ffec38f3531ff6c6be50830ad1130a1ce6c12fa1e44091174e30'


def version():
    return digest([hashlib.sha256((ROOT / 'scripts' / name).read_bytes()).hexdigest()
                   for name in ('beginner_tactics.py', 'beginner_one_move.py',
                                'validate-removing-defender-batch.py')])


def balance(board, side):
    return sum(VALUES[p.piece_type] * (1 if p.color == side else -1)
               for p in board.piece_map().values())


def safe_gain(board, side, baseline):
    """A local gain surviving every immediate legal response, not a game-win proof."""
    if board.is_game_over() or balance(board, side) - baseline < 100:
        return False
    for reply in list(board.legal_moves):
        board.push(reply)
        bad = board.is_game_over() or balance(board, side) - baseline < 100
        board.pop()
        if bad:
            return False
    return True


def fork_targets(board, move):
    after = board.copy(); after.push(move)
    targets = [sq for sq in after.attacks(move.to_square)
               if after.piece_at(sq) and after.piece_at(sq).color != board.turn]
    # Create a new threat, rather than merely move an already harmless attacker.
    before = board.attacks(move.from_square)
    return targets if len(targets) >= 2 and any(sq not in before for sq in targets) else []


def fork_lines(board, move):
    targets = fork_targets(board, move)
    if not targets:
        return []
    side, baseline = board.turn, balance(board, board.turn)
    after = board.copy(); first = board.san(move); after.push(move)
    if after.is_game_over():
        return []
    lines = []
    for reply in list(after.legal_moves):
        # A responding target can move to another attacked square. Track it.
        live_targets = {reply.to_square if sq == reply.from_square else sq for sq in targets}
        second = after.san(reply); after.push(reply)
        wins = []
        forker_survives = after.piece_at(move.to_square) == board.piece_at(move.from_square)
        for capture in list(after.generate_legal_captures()):
            if forker_survives:
                eligible = capture.from_square == move.to_square and capture.to_square in live_targets
            else:
                # Accept an immediate profitable recapture of the piece that
                # took the forker. This is a favourable exchange, not a sacrifice.
                eligible = reply.to_square == move.to_square and capture.to_square == move.to_square
            if not eligible:
                continue
            third = after.san(capture); after.push(capture)
            if safe_gain(after, side, baseline):
                wins.append([first, second, third])
            after.pop()
        after.pop()
        if not wins:
            return []
        lines.extend(wins)
    return lines


def short_gain(board, move):
    """All defensive replies, a solver continuation and immediate material recovery."""
    side, baseline = board.turn, balance(board, board.turn)
    after = board.copy(); after.push(move)
    if safe_gain(after, side, baseline):
        return True
    if after.is_game_over():
        return False
    for reply in list(after.legal_moves):
        after.push(reply); found = False
        # Captures/promotions can create the gain; quiet replies can preserve a
        # gain from the root capture, so include them in that case too.
        choices = list(after.legal_moves) if balance(after, side) > baseline else [
            m for m in after.legal_moves if after.is_capture(m) or m.promotion]
        for followup in choices:
            after.push(followup)
            found = safe_gain(after, side, baseline)
            after.pop()
            if found:
                break
        after.pop()
        if not found:
            return False
    return True


def local_review(candidate, topic='fork'):
    if topic not in PROFILES:
        raise ValueError('Implement a composition profile for ' + topic)
    board = chess.Board(candidate['fen'])
    if not board.is_valid() or board.is_game_over():
        return {'flags': ['invalid-or-terminal-start'], 'roots': [], 'lines': []}
    primary = board.parse_san(candidate.get('root') or candidate['moves'][0])
    roots, lines, flags = [], [], []
    for move in list(board.legal_moves):
        san = board.san(move); after = board.copy(); after.push(move)
        targets = fork_targets(board, move)
        wins = fork_lines(board, move) if targets else []
        immediate = board.is_capture(move) and safe_gain(after, board.turn, balance(board, board.turn))
        shortcut = short_gain(board, move) if not wins else False
        roots.append({'move': san, 'targets': [chess.square_name(sq) for sq in targets],
                      'forkWin': bool(wins), 'immediateCaptureGain': immediate,
                      'nonForkShortGain': shortcut})
        if immediate or shortcut:
            flags.append('simpler-material-gain:' + san)
        lines.extend(wins)
    mates = module('validate-removing-defender-batch').short_mates(board)
    if mates['immediate'] or mates['inTwoSolverMoves']:
        flags.append('shorter-mate-available')
    if not any(line[0] == board.san(primary) for line in lines):
        flags.append('unproved-primary-fork')
    return {'flags': flags, 'roots': roots, 'lines': lines, 'shortMates': mates,
            'initialMaterialCp': balance(board, board.turn)}


def engine_row(board, info, side):
    trial = board.copy(); pv = []
    for move in info.get('pv', [])[:12]:
        pv.append(trial.san(move)); trial.push(move)
    score = info['score'].pov(side)
    return {'move': pv[0] if pv else None, 'cp': score.score(), 'mate': score.mate(),
            'depth': info.get('depth'), 'pv': pv}


def _review_job(args):
    candidate, topic, nodes, endpoint_nodes, cache = args
    started = time.perf_counter()
    record_hash = digest(candidate)
    result = {'candidate': candidate, 'candidateHash': record_hash,
              'verificationVersion': version(), 'topic': topic,
              'settings': {'rootNodes': nodes, 'rootMultiPV': 'every legal move',
                           'endpointNodesEach': endpoint_nodes}}
    with CachedEngine(cache=cache) as engine:
        key = digest({**result, 'engine': engine.identity})
        previous = engine.cache.get('composition-review', key) if engine.cache else None
        if previous:
            return {**previous, 'reused': True, 'wallSeconds': time.perf_counter() - started}
        local = review_composed_beginner(candidate, lambda row: local_review(row, topic), 'forkWin')
        result.update(local)
        if not local['flags']:
            board = chess.Board(candidate['fen']); side = board.turn
            infos = engine.analyse(board, chess.engine.Limit(nodes=nodes),
                                   multipv=board.legal_moves.count())
            result['engineRoots'] = [engine_row(board, info, side) for info in infos]
            primary = local['beginnerProof']['answer']
            primary_score = next(row for row in result['engineRoots'] if row['move'] == primary)
            score_value = lambda row: row['cp'] if row['cp'] is not None else (100000 if row['mate'] > 0 else -100000)
            forks = {line[0] for line in local['lines']}
            if any(score_value(row) > score_value(primary_score) + 70 and row['move'] not in forks
                   for row in result['engineRoots']):
                result['flags'].append('superior-nonfork-engine-alternative')
            if any(row['move'] not in forks and row['mate'] is not None
                   and 0 < row['mate'] <= 3 for row in result['engineRoots']):
                result['flags'].append('short-nonfork-mate-needs-proof')
            # Every defence of the proposed move receives an endpoint recovery
            # probe, separately from the exact immediate-recapture certificate.
            probes = []
            for line in [line for line in local['lines'] if line[0] == primary]:
                endpoint = board.copy()
                for san in line:
                    endpoint.push_san(san)
                info = engine.analyse(endpoint, chess.engine.Limit(nodes=endpoint_nodes))
                recovery = endpoint.copy()
                gains = [balance(recovery, side) - local['initialMaterialCp']]
                for move in info.get('pv', [])[:8]:
                    recovery.push(move)
                    gains.append(balance(recovery, side) - local['initialMaterialCp'])
                probes.append({'moves': line, 'fen': endpoint.fen(),
                               'minimumGainDuringEightPlyPV': min(gains),
                               'gainAfterEightPlyPV': gains[-1],
                               'recoveryFen': recovery.fen(),
                               **engine_row(endpoint, info, side)})
            result['endpointProbes'] = probes
            if any(row['minimumGainDuringEightPlyPV'] < 100 for row in probes):
                result['flags'].append('endpoint-recovery-needs-review')
            result['engine'] = {'identity': engine.identity, 'name': engine.id}
        result.update(status='withheld' if result['flags'] else 'needs-editorial-review',
                      metrics=dict(engine.stats), reused=False,
                      wallSeconds=time.perf_counter() - started)
        if engine.cache:
            engine.cache.put('composition-review', key, result)
    return result


def review_compositions(candidates, topic, output, workers=4, cache=DEFAULT_CACHE,
                        nodes=200000, endpoint_nodes=50000):
    if topic not in PROFILES or workers < 1 or min(nodes, endpoint_nodes) < 1:
        raise ValueError('Unsupported profile or invalid review settings')
    started = time.perf_counter(); unique = {}
    for candidate in candidates:
        unique.setdefault(' '.join(candidate['fen'].split()[:4]), candidate)
    results = []
    report = {'topic': topic, 'level': 'Beginner', 'candidates': list(unique.values()),
              'results': results, 'verificationVersion': version(),
              'scope': 'New compositions; exact local payoff plus bounded engine evidence. Editorial approval required.'}
    jobs = [(candidate, topic, nodes, endpoint_nodes, cache) for candidate in unique.values()]
    with ProcessPoolExecutor(max_workers=workers) as pool:
        for result in pool.map(_review_job, jobs):
            results.append(result)
            report['wallSeconds'] = time.perf_counter() - started
            atomic_json(output, report)
            print(len(results), '/', len(jobs), result['status'], result['candidate'].get('root'),
                  result['flags'], flush=True)
    return report


def approved_exercises(bundle):
    """Rebuild only exact, explicitly approved composition records."""
    if bundle.get('topic') not in PROFILES:
        raise ValueError('Unsupported composition profile')
    check_legacy_compositions(bundle['entries'], LEGACY_VERSION, LEGACY_ENTRIES)
    exercises, seen = [], set()
    for entry in bundle['entries']:
        review, decision, exercise = entry['review'], entry['decision'], entry['exercise']
        legacy = review.get('verificationVersion') == LEGACY_VERSION
        if (review['status'] != 'needs-editorial-review' or review['flags']
                or not (legacy or review.get('verificationVersion') == version())
                or decision.get('decision') != 'keep' or not decision.get('reason')
                or not decision.get('distinctness') or not decision.get('reviewer')
                or decision.get('candidateHash') != review['candidateHash']
                or digest(review['candidate']) != review['candidateHash']
                or decision.get('evidenceSha256') != digest(review)):
            raise ValueError('Missing or stale exact-record editorial approval')
        if exercise['fen'] != review['candidate']['fen'] or exercise['fen'] in seen:
            raise ValueError('Composition changed or duplicated')
        if exercise['goal'] != 'material' or not exercise.get('beginner') or exercise.get('gameReference'):
            raise ValueError('Composition objective/provenance mismatch')
        saved = {tuple(line) for line in [exercise['moves'], *exercise.get('alternativeLines', [])]}
        if legacy:
            expected = {tuple(line) for line in review['lines']}
        else:
            local = review_composed_beginner(review['candidate'], local_review, 'forkWin')
            if local['flags'] or any(local[key] != review.get(key) for key in local):
                raise ValueError('Missing current one-move Beginner proof')
            expected = {(local['beginnerProof']['answer'],)}
        if saved != expected:
            raise ValueError('Composition solution changed after verification')
        if exercise.get('source') != 'original-composition':
            raise ValueError('Composed source must be explicit')
        seen.add(exercise['fen']); exercises.append(exercise)
    return exercises
