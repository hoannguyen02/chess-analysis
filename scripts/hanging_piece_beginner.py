"""Verify direct captures in original Beginner hanging-piece compositions."""

from collections import Counter
from concurrent.futures import ProcessPoolExecutor
from multiprocessing.util import Finalize
import time

import chess
import chess.engine

from beginner_one_move import check_legacy_compositions, review_composed_beginner
from beginner_tactics import engine_row
from tactic_research import (
    CachedEngine, DEFAULT_CACHE, ResearchCache, atomic_json, code_version, digest, module,
)


TOPIC = 'hanging-piece'
LEGACY_VERSION = '73e63f1f4eef62dc4a5a86cd52e7dbe8652ebc3be7380a13c28e8dd222537c43'
LEGACY_ENTRIES = '9f67f7e9bc08440ee4327f34f2ab5fd7879a939398c5f7770717b373a304fbd8'
VALUES = (0, 100, 320, 330, 500, 900, 0)
ROOT_NODES = 200_000
RECOVERY_NODES = 50_000
RECOVERY_PLY = 8
SETTINGS = {'rootNodes': ROOT_NODES, 'rootMultiPV': 'every legal move',
            'recoveryNodes': RECOVERY_NODES, 'recoveryMultiPV': 3,
            'recoveryPly': RECOVERY_PLY}
short_mates = module('validate-removing-defender-batch').short_mates


def version():
    return code_version('hanging_piece_beginner.py', 'beginner_tactics.py',
                        'beginner_one_move.py', 'tactic_research.py',
                        'validate-removing-defender-batch.py')


def balance(board, side):
    return sum(VALUES[p.piece_type] * (1 if p.color == side else -1)
               for p in board.piece_map().values())


def reply_certificate(board, side, baseline):
    replies = []
    for move in board.legal_moves:
        san = board.san(move)
        capture, check = board.is_capture(move), board.gives_check(move)
        board.push(move)
        replies.append({'move': san, 'capture': capture, 'check': check,
                        'gain': balance(board, side) - baseline,
                        'terminal': board.is_game_over()})
        board.pop()
    return replies


def retains_gain(board, side, baseline, threshold):
    if board.is_game_over() or balance(board, side) - baseline < threshold:
        return False
    for reply in list(board.legal_moves):
        board.push(reply)
        unsafe = board.is_game_over() or balance(board, side) - baseline < threshold
        board.pop()
        if unsafe:
            return False
    return True


def short_gain(board, side, baseline, threshold):
    """The board is after the root. Check equal payoffs one solver move later."""
    if board.is_game_over():
        return False
    for reply in list(board.legal_moves):
        board.push(reply)
        moves = (board.generate_legal_moves() if balance(board, side) - baseline >= threshold
                 else (m for m in board.generate_legal_moves() if board.is_capture(m) or m.promotion))
        viable = False
        for move in list(moves):
            board.push(move)
            viable = retains_gain(board, side, baseline, threshold)
            board.pop()
            if viable:
                break
        board.pop()
        if not viable:
            return False
    return True


def capture_record(board, move, side, baseline):
    victim = board.piece_at(move.to_square)
    if not victim or victim.color == side or move.promotion:
        return None
    defenders = sorted(chess.square_name(square)
                       for square in board.attackers(not side, move.to_square))
    san = board.san(move)
    board.push(move)
    recaptures = [board.san(reply) for reply in board.generate_legal_captures()
                  if reply.to_square == move.to_square]
    replies = reply_certificate(board, side, baseline)
    full_gain = (not board.is_game_over() and not recaptures
                 and all(not reply['terminal'] and reply['gain'] >= VALUES[victim.piece_type]
                         for reply in replies))
    board.pop()
    return {'move': san, 'target': chess.square_name(move.to_square),
            'value': VALUES[victim.piece_type], 'apparentDefenders': defenders,
            'recaptures': recaptures, 'fullGain': full_gain, 'replies': replies}


def local_review(candidate):
    board = chess.Board(candidate['fen'])
    if not board.is_valid() or board.is_game_over():
        return {'flags': ['invalid-or-terminal-start'], 'roots': [], 'lines': []}
    if (candidate.get('goal') != 'material' or candidate.get('level') != 'Beginner'
            or candidate.get('source') != 'original-composition'):
        return {'flags': ['composition-scope-mismatch'], 'roots': [], 'lines': []}
    side, baseline = board.turn, balance(board, board.turn)
    primary = board.parse_san(candidate['root'])
    main_capture = capture_record(board, primary, side, baseline)
    if not main_capture or not main_capture['fullGain']:
        return {'flags': ['primary-does-not-safely-win-undefended-material'],
                'initialMaterialCp': baseline, 'capture': main_capture, 'roots': [], 'lines': []}
    target = main_capture['target']
    threshold = main_capture['value']
    flags, roots, lines, captures = [], [], [], []
    for move in list(board.legal_moves):
        san = board.san(move)
        capture = capture_record(board, move, side, baseline)
        if capture:
            captures.append(capture)
        valid = (capture and capture['fullGain'] and capture['target'] == target)
        board.push(move)
        equal_gain = False
        if not valid:
            equal_gain = (retains_gain(board, side, baseline, threshold)
                          or short_gain(board, side, baseline, threshold))
        board.pop()
        if valid:
            lines.append([san])
        if equal_gain:
            flags.append('competing-short-material-gain:' + san)
        roots.append({'move': san, 'verifiedCapture': bool(valid),
                      'competingMaterialGain': equal_gain})
    mates = short_mates(board)
    if mates['immediate'] or mates['inTwoSolverMoves']:
        flags.append('shorter-mate-available')
    return {'flags': flags, 'initialMaterialCp': baseline, 'capture': main_capture,
            'captureCandidates': captures, 'roots': roots, 'lines': lines, 'shortMates': mates}


def score(row):
    if row['mate'] is not None:
        return 100_000 - row['mate'] if row['mate'] > 0 else -100_000 - row['mate']
    return row['cp']


def recovery_probe(board, info, side, baseline):
    trial = board.copy()
    gains = [balance(trial, side) - baseline]
    for move in info.get('pv', [])[:RECOVERY_PLY]:
        trial.push(move)
        gains.append(balance(trial, side) - baseline)
    return {**engine_row(board, info, side), 'minimumGain': min(gains),
            'endingGain': gains[-1], 'endingFen': trial.fen()}


_worker_engine = None


def _start_worker(cache):
    global _worker_engine
    _worker_engine = CachedEngine(cache=cache)
    Finalize(_worker_engine, _worker_engine.quit, exitpriority=10)


def _review(candidate):
    engine = _worker_engine
    before = engine.stats.copy()
    result = {'candidate': candidate, 'candidateHash': digest(candidate),
              'verificationVersion': version(), 'topic': TOPIC, 'settings': SETTINGS}
    key = digest({**result, 'engine': engine.identity})
    cached = engine.cache.get('composition-review', key) if engine.cache else None
    if cached:
        return {**cached, 'reused': True, 'metrics': {name: 0 for name in before}}
    result.update(review_composed_beginner(candidate, local_review, 'verifiedCapture'))
    if not result['flags']:
        board = chess.Board(candidate['fen'])
        side = board.turn
        baseline = result['initialMaterialCp']
        infos = engine.analyse(board, chess.engine.Limit(nodes=ROOT_NODES),
                               multipv=board.legal_moves.count())
        roots = [engine_row(board, info, side) for info in infos]
        capture_moves = {line[0] for line in result['lines']}
        primary_score = next(score(row) for row in roots
                             if row['move'] == result['beginnerProof']['answer'])
        if any(row['move'] not in capture_moves and score(row) > primary_score + 100 for row in roots):
            result['flags'].append('superior-engine-alternative-needs-review')
        if any(row['move'] not in capture_moves and row['mate'] is not None
               and 0 < row['mate'] <= 3 for row in roots):
            result['flags'].append('shorter-mate-needs-review')
        probes = []
        for line in result['lines']:
            board.push_san(line[0])
            infos = engine.analyse(board, chess.engine.Limit(nodes=RECOVERY_NODES),
                                   multipv=min(3, board.legal_moves.count()))
            probes.append({'capture': line[0], 'fen': board.fen(),
                           'replies': [recovery_probe(board, info, side, baseline) for info in infos]})
            board.pop()
        result.update(engineRoots=roots, recoveryProbes=probes,
                      engine={'identity': engine.identity, 'name': engine.id})
        threshold = result['capture']['value']
        if any(row['minimumGain'] < threshold for probe in probes for row in probe['replies']):
            result['flags'].append('endpoint-recovery-needs-review')
        if any(row['mate'] is not None and row['mate'] < 0
               for probe in probes for row in probe['replies']):
            result['flags'].append('counterplay-mate-needs-review')
    result['status'] = 'withheld' if result['flags'] else 'needs-editorial-review'
    # Preserve exact engine searches separately. Tactical leads with unresolved
    # recovery/alternatives should still receive review on a fresh attempt.
    if engine.cache and not any(flag.endswith('needs-review') for flag in result['flags']):
        engine.cache.put('composition-review', key, result)
    return {**result, 'reused': False,
            'metrics': {name: engine.stats[name] - value for name, value in before.items()}}


def review_compositions(candidates, topic, output, workers=4, cache=DEFAULT_CACHE):
    if topic != TOPIC or workers < 1:
        raise ValueError('Unsupported profile or worker count')
    started = time.perf_counter()
    unique = {}
    for candidate in candidates:
        unique.setdefault(' '.join(chess.Board(candidate['fen']).fen().split()[:4]), candidate)
    if not unique:
        raise ValueError('Supply at least one composition')
    if cache:
        ResearchCache(cache).close()
    report = {'topic': TOPIC, 'level': 'Beginner', 'candidates': list(unique.values()),
              'results': [], 'verificationVersion': version(),
              'scope': 'Direct material gain through every immediate reply, with bounded recovery probes.'}
    with ProcessPoolExecutor(max_workers=workers, initializer=_start_worker, initargs=(cache,)) as pool:
        for result in pool.map(_review, unique.values()):
            report['results'].append(result)
            results = report['results']
            report['wallSeconds'] = time.perf_counter() - started
            report['metrics'] = {'statusCounts': dict(Counter(row['status'] for row in results)),
                                 'reviewCacheHits': sum(row['reused'] for row in results),
                                 **{key: sum(row['metrics'][key] for row in results)
                                    for key in result['metrics']}}
            atomic_json(output, report)
            print(len(results), '/', len(unique), result['candidate']['id'],
                  result['status'], result['flags'], flush=True)
    return report


def approved_exercises(bundle):
    if bundle.get('topic') != TOPIC:
        raise ValueError('Unsupported composition bundle')
    check_legacy_compositions(bundle['entries'], LEGACY_VERSION, LEGACY_ENTRIES)
    exercises, seen, identifiers = [], set(), set()
    for entry in bundle['entries']:
        review, decision, exercise = entry['review'], entry['decision'], entry['exercise']
        candidate = review['candidate']
        legacy = review.get('verificationVersion') == LEGACY_VERSION
        if (review['status'] != 'needs-editorial-review' or review['flags']
                or not (legacy or review.get('verificationVersion') == version())
                or review.get('settings') != SETTINGS
                or decision.get('decision') != 'keep'
                or not all(decision.get(key) for key in ('reason', 'distinctness', 'reviewer'))
                or decision.get('candidateHash') != review['candidateHash']
                or digest(candidate) != review['candidateHash']
                or decision.get('evidenceSha256') != digest(review)
                or decision.get('exerciseSha256') != digest(exercise)):
            raise ValueError('Missing or stale exact-record editorial approval')
        local = (local_review(candidate) if legacy
                 else review_composed_beginner(candidate, local_review, 'verifiedCapture'))
        board = chess.Board(candidate['fen'])
        position = ' '.join(board.fen().split()[:4])
        if (local['flags'] or any(local[key] != review.get(key) for key in local)
                or {row['move'] for row in review['engineRoots']} != {board.san(move) for move in board.legal_moves}
                or {row['capture'] for row in review['recoveryProbes']} != {line[0] for line in local['lines']}):
            raise ValueError('Missing legal-root comparison or recovery evidence')
        if (position in seen or exercise['id'] in identifiers
                or exercise['id'] != candidate['id'] or exercise['fen'] != candidate['fen']
                or exercise['goal'] != 'material' or not exercise.get('beginner')
                or exercise.get('outcome') != TOPIC or exercise.get('tacticPly') != 0
                or exercise.get('gameReference') or exercise.get('previousMove')
                or exercise.get('source') != 'original-composition'
                or exercise['hangingPiece'] != {'minimumGain': local['capture']['value'],
                                                'target': local['capture']['target']}):
            raise ValueError('Composition identity, objective or provenance mismatch')
        saved = {tuple(line) for line in [exercise['moves'], *exercise.get('alternativeLines', [])]}
        answer = candidate['root'] if legacy else local['beginnerProof']['answer']
        if exercise['moves'] != [answer] or saved != {tuple(line) for line in local['lines']}:
            raise ValueError('Composition solution changed after verification')
        seen.add(position)
        identifiers.add(exercise['id'])
        exercises.append(exercise)
    return exercises
