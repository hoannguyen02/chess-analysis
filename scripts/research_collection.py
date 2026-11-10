"""Persistent geometry and bounded parallel screening of unpublished Discovery leads."""
from concurrent.futures import ProcessPoolExecutor
import hashlib
import inspect
import json
from pathlib import Path
import time

import chess
import chess.engine

from tactic_research import CachedEngine, ResearchCache, DEFAULT_CACHE, atomic_json, digest, module
from research_candidates import initialize, _insert, import_candidates, query_candidates, enrich, SOURCE_FIELDS

miner = module('collect-discovery')
builder = module('build-discovery')
LEVELS = ('A', 'B', 'C', 'C*', 'D')
SCREEN_SETTINGS = {'quickNodes': 12000, 'nodes': 300000, 'defenceNodes': 100000}
_engine = _store = None


def line_options(start, pv):
    """The existing collector's lead filters, yielding all motifs in one replay.

    These inferred levels and finite material windows are leads only. Stationary
    offers, declined sacrifices and objective proofs remain later review gates.
    """
    board = start.copy(stack=False)
    color = board.turn
    boards, sans, moves = [board.copy(stack=False)], [], []
    for move in pv[:18]:
        if move not in board.legal_moves:
            break
        sans.append(board.san(move)); moves.append(move); board.push(move)
        boards.append(board.copy(stack=False))
    for index in range(0, len(moves), 2):
        move, before, after = moves[index], boards[index], boards[index + 1]
        for slider, target, kind in miner.discoveries(before, move, after):
            for end in (index, index + 2):
                if end >= len(moves):
                    continue
                mate = boards[end + 1].is_checkmate()
                if mate and (end != index or kind != 'check'):
                    continue
                if not mate:
                    if end + 3 >= len(boards) or not boards[end].is_capture(moves[end]):
                        continue
                    if end == index and kind != 'check':
                        continue
                    if end != index:
                        if moves[end].from_square not in (slider, move.to_square):
                            continue
                        if kind == 'attack' and moves[end].from_square == slider and moves[end].to_square != target:
                            continue
                        if kind == 'attack' and moves[end].from_square == move.to_square and moves[index + 1].from_square != target:
                            continue
                gain = min(miner.material(frame, color) for frame in boards[end + 1:end + 4]) - miner.material(start, color)
                local = min(miner.material(frame, color) for frame in boards[end + 1:end + 4]) - miner.material(before, color)
                if not mate and (gain < 100 or local < 100):
                    continue
                sacrifices = []
                for reply in range(1, end, 2):
                    victim = boards[reply].piece_at(moves[reply].to_square)
                    if not victim or victim.color != color or victim.piece_type not in (2, 3, 4, 5):
                        continue
                    offered = next((ply for ply in range(reply - 1, -1, -2)
                                    if moves[ply].to_square == moves[reply].to_square), None)
                    capturer = boards[reply].piece_at(moves[reply].from_square)
                    equal = (capturer.piece_type == victim.piece_type and offered is not None
                             and miner.material(boards[reply + 2], color) >= miner.material(boards[offered], color) - 75)
                    if offered is not None and not equal and miner.material(boards[reply + 1], color) < miner.material(boards[offered], color) - 75:
                        sacrifices.append({'ply': offered, 'piece': victim.symbol().upper()})
                own = (end + 2) // 2
                level = ('A' if own <= 2 else 'B' if own == 3 else 'C*') if not sacrifices else (
                    'E' if own >= 6 else 'D' if own >= 4 else 'C' if len(sacrifices) == 1 else None)
                if not level or (not sacrifices and own > 5):
                    continue
                yield {'moves': sans[:end + 1], 'level': level, 'solverMoves': own,
                       'sacrifices': sacrifices, 'discoveryPly': index, 'payoffPly': end,
                       'sliderSquare': chess.square_name(slider), 'targetSquare': chess.square_name(target),
                       'moverSquare': chess.square_name(move.to_square), 'kind': kind,
                       'goal': 'mate' if mate else 'material', 'gain': gain, 'localGain': local,
                       'settlement': sans[end + 1:end + 3]}


def detector_version():
    return digest({'schema': 1, 'chess': chess.__version__, 'values': miner.V,
                   'lines': inspect.getsource(line_options), 'extract': inspect.getsource(_extract_geometry),
                   'discoveries': inspect.getsource(miner.discoveries), 'material': inspect.getsource(miner.material)})


def input_hash(record):
    # A known normalized game key avoids another legal replay. A changed supplied
    # move sequence is still a different input, even if its claimed key is stale.
    value = {'fen': record['gameFen'], 'moves': record['gameMoves']}
    variant = record.get('headers', {}).get('Variant', 'Standard').lower()
    if variant not in ('standard', 'chess'):
        value['unsupportedVariant'] = variant
    return digest(value)


def _extract_geometry(record):
    board = chess.Board(record['gameFen'])
    if not board.is_valid() or record.get('headers', {}).get('Variant', 'Standard').lower() not in ('standard', 'chess'):
        raise ValueError('Invalid or unsupported source game')
    positions, actual, discoveries = [board.fen(en_passant='fen')], [], []
    for ply, san in enumerate(record['gameMoves']):
        before = board.copy(stack=False)
        move = board.parse_san(san); actual.append(move); board.push(move)
        positions.append(board.fen(en_passant='fen'))
        if ply >= 10 and miner.discoveries(before, move, board):
            discoveries.append(ply)
    uci = [move.uci() for move in actual]
    game_id = hashlib.sha256(' '.join(uci).encode()).hexdigest()[:16]
    game_key = hashlib.sha256((record['gameFen'] + ' ' + ' '.join(uci)).encode()).hexdigest()
    if record.get('gameId') and record['gameId'] != game_id:
        raise ValueError('Source identity does not match the complete legal game')
    if record.get('gameKey') and record['gameKey'] != game_key:
        raise ValueError('Normalized complete-game key mismatch')
    source = {key: record[key] for key in SOURCE_FIELDS if key in record}
    source.update(gameId=game_id, gameKey=game_key)
    def base(ply):
        return {**source, 'fen': positions[ply], 'ply': ply,
                'previousMove': {'fen': positions[ply - 1], 'move': record['gameMoves'][ply - 1]},
                'validation': {'principalVariation': uci[ply:ply + 18], 'stage': 'played-geometry-only'}}
    seeds = sorted({ply - back for ply in discoveries for back in (0, 2, 4, 6, 8, 10, 12) if ply - back >= 10})
    leads = []
    for ply in seeds:
        for line in line_options(chess.Board(positions[ply]), actual[ply:ply + 18]):
            leads.append({**base(ply), **line})
    winner = chess.WHITE if record.get('headers', {}).get('Result') == '1-0' else chess.BLACK if record.get('headers', {}).get('Result') == '0-1' else None
    tails = [base(ply) for ply in range(len(positions) - 1, max(9, len(positions) - 12), -1)
             if winner is not None and chess.Board(positions[ply]).turn == winner]
    for row in tails:
        row.update(level='*', moves=[])
    return {'gameKey': game_key, 'gameId': game_id, 'records': leads, 'tails': tails,
            'source': source, 'sourcePlies': len(actual), 'complete': True}


def _geometry_task(record):
    try:
        return {'inputHash': input_hash(record), 'status': 'indexed', 'variantBound': True, **_extract_geometry(record)}
    except (ValueError, KeyError, IndexError) as error:
        return {'inputHash': input_hash(record), 'status': 'invalid-source', 'error': str(error),
                'gameKey': record.get('gameKey', ''), 'source': {}, 'records': [], 'tails': [], 'complete': True, 'variantBound': True}



def _refresh_metadata(db, record, checkpoint):
    """Refresh authoritative source metadata without replaying immutable moves."""
    old_key, detail = checkpoint['source_key'], checkpoint['detail']
    source_record = enrich(db, record)
    payload = {key: source_record[key] for key in SOURCE_FIELDS if key in source_record}
    new_key = digest(payload)
    if old_key == new_key:
        return 0
    game_id = detail.get('gameId') or record.get('gameId')
    if record.get('gameId') and detail.get('gameId') and record['gameId'] != detail['gameId']:
        raise ValueError('Cached source identity differs from the supplied game ID')
    if record.get('gameKey') and detail.get('gameKey') and record['gameKey'] != detail['gameKey']:
        raise ValueError('Cached normalized game key differs from the supplied key')
    db.execute('INSERT OR IGNORE INTO research_candidate_sources VALUES (?,?)',
               (new_key, json.dumps(payload, ensure_ascii=False)))
    changed = 0
    refs_valid = bool(payload.get('sourceReferences'))
    # A game ID alone is insufficient: source payloads must also share the exact
    # already-validated starting FEN and complete supplied move sequence.
    sources = db.execute('SELECT DISTINCT p.source_key,s.payload FROM research_candidate_positions p '
                         'JOIN research_candidate_sources s USING(source_key) WHERE p.game_id=?', (game_id,)).fetchall()
    for prior_key, raw in sources:
        previous = json.loads(raw)
        if previous.get('gameFen') != payload.get('gameFen') or previous.get('gameMoves') != payload.get('gameMoves'):
            continue
        if prior_key == new_key:
            continue
        rows = db.execute('SELECT candidate_id,stage FROM research_candidate_positions WHERE game_id=? AND source_key=?',
                          (game_id, prior_key)).fetchall()
        for ident, stage in rows:
            if not refs_valid and stage != 'incomplete':
                db.execute('INSERT OR REPLACE INTO research_candidate_restore_stages VALUES (?,?)', (ident, stage))
                stage = 'incomplete'
            elif refs_valid and stage == 'incomplete':
                saved = db.execute('SELECT stage FROM research_candidate_restore_stages WHERE candidate_id=?', (ident,)).fetchone()
                stage = saved[0] if saved else 'saved'
                db.execute('DELETE FROM research_candidate_restore_stages WHERE candidate_id=?', (ident,))
            db.execute('UPDATE research_candidate_positions SET source_key=?,stage=? WHERE candidate_id=?',
                       (new_key, stage, ident))
            changed += 1
    db.execute('UPDATE research_geometry_games SET source_key=? WHERE input_hash=? AND detector=?',
               (new_key, checkpoint['input_hash'], checkpoint['detector']))
    return changed


def _result_changed(db, record, checkpoint):
    previous = db.execute('SELECT payload FROM research_candidate_sources WHERE source_key=?',
                          (checkpoint['source_key'],)).fetchone()
    return bool(previous and json.loads(previous[0]).get('headers', {}).get('Result')
                != record.get('headers', {}).get('Result'))


def index_positions(db, records, workers=4, output=None, max_games=0):
    """Populate exact searchable FENs once, including negative-game checkpoints."""
    if workers < 1 or max_games < 0:
        raise ValueError('workers must be positive and max-games nonnegative')
    initialize(db)
    started, version = time.perf_counter(), detector_version()
    unique = {input_hash(record): record for record in records}
    known = {row[0]: {'input_hash': row[0], 'detector': version, 'source_key': row[1],
                      'status': row[2], 'detail': json.loads(row[3])}
             for row in db.execute('SELECT input_hash,source_key,status,detail FROM research_geometry_games WHERE detector=?', (version,))}
    # An early legacy invalid-Variant checkpoint was not Variant-bound. Retry
    # that one input when it is corrected; valid standard checkpoints keep keys.
    retry = {key for key, record in unique.items() if key in known
             and known[key]['status'] == 'invalid-source'
             and not known[key]['detail'].get('variantBound')
             and record.get('headers', {}).get('Variant', 'Standard').lower() in ('standard', 'chess')}
    # Result selects the near-resignation side. Ordinary metadata needs no replay;
    # a corrected result must regenerate that game's tail inventory.
    retry.update(key for key, record in unique.items() if key in known
                 and _result_changed(db, record, known[key]))
    refreshed = 0
    with db:
        for key, record in unique.items():
            if key in known:
                if known[key]['status'] == 'indexed':
                    refreshed += _refresh_metadata(db, record, known[key])
    pending = [record for key, record in unique.items() if key not in known or key in retry]
    total_pending = len(pending)
    if max_games:
        pending = pending[:max_games]
    report = {'schema': 1, 'detectorVersion': version, 'inputGames': len(unique),
              'indexHits': len(unique) - total_pending, 'sourceGamesReplayed': 0,
              'geometricPositions': 0, 'tailPositions': 0, 'sourceMetadataRefreshed': refreshed, 'invalidSources': [],
              'publicationApproved': False, 'complete': total_pending == 0}
    def save():
        report['wallSeconds'] = time.perf_counter() - started
        if output:
            atomic_json(output, report)
    with ProcessPoolExecutor(max_workers=workers) as pool:
        # Keep the submitted queue bounded, so an interruption waits for at
        # most this small batch rather than finishing an entire corpus.
        for offset in range(0, len(pending), max(1, workers * 4)):
            batch = pending[offset:offset + max(1, workers * 4)]
            for result in pool.map(_geometry_task, batch, chunksize=1):
                with db:
                    if result['inputHash'] in retry:
                        record = unique[result['inputHash']]
                        previous = db.execute("SELECT p.candidate_id,s.payload FROM research_candidate_positions p "
                                              "JOIN research_candidate_sources s USING(source_key) "
                                              "WHERE p.game_id=? AND p.stage IN ('geometry','tail')",
                                              (result.get('gameId', record.get('gameId')),)).fetchall()
                        for ident, payload in previous:
                            source = json.loads(payload)
                            if source.get('gameFen') == record['gameFen'] and source.get('gameMoves') == record['gameMoves']:
                                db.execute('DELETE FROM research_candidate_positions WHERE candidate_id=?', (ident,))
                    count = _insert(db, result['records'], 'discovery', 'complete-game-geometric-index', 'geometry', 'tactics', detector=version)
                    tails = _insert(db, result['tails'], 'discovery', 'complete-game-tail-index', 'tail', 'tails', detector=version)
                    payload = ({key: value for key, value in enrich(db, result['source']).items()
                                if key in SOURCE_FIELDS} if result['source'] else {})
                    source_key = digest(payload)
                    if payload:
                        db.execute('INSERT OR IGNORE INTO research_candidate_sources VALUES (?,?)',
                                   (source_key, json.dumps(payload, ensure_ascii=False)))
                    detail = {key: value for key, value in result.items() if key not in ('records', 'tails', 'source')}
                    db.execute('INSERT OR REPLACE INTO research_geometry_games VALUES (?,?,?,?,?,?)',
                               (result['inputHash'], version, result['gameKey'], source_key,
                                result['status'], json.dumps(detail)))
                report['sourceGamesReplayed'] += 1
                report['geometricPositions'] += count
                report['tailPositions'] += tails
                if result['status'] != 'indexed':
                    report['invalidSources'].append(detail)
                save()
    report['complete'] = len(pending) == total_pending
    save()
    return report


def screen_version():
    from discovery_research import early_gate
    return digest({'schema': 1, 'screen': inspect.getsource(_screen_position),
                   'gate': inspect.getsource(early_gate), 'classifier': inspect.getsource(miner.inspect),
                   'coverage': inspect.getsource(builder.reply_coverage)})


def _initialize_screen(executable, cache, settings):
    global _engine, _store
    _engine = CachedEngine(executable, cache, options={'Threads': 1, 'Hash': 128})
    _store = ResearchCache(cache) if cache else None


def _screen_position(record, levels, phase, settings):
    from discovery_research import early_gate
    board = chess.Board(record['fen'])
    if board.is_game_over():
        return {'status': 'withheld', 'flags': ['terminal-source-position']}
    wanted = [record['level']] if record['level'] != '*' else list(levels)
    quick = _engine.analyse(board, chess.engine.Limit(nodes=settings['quickNodes']))
    line = miner.inspect(board, quick.get('pv', []), wanted)
    if not line and phase == 'tactics':
        line = miner.inspect(board, [chess.Move.from_uci(u) for u in record['validation']['principalVariation']], wanted)
    if not line or quick['score'].pov(board.turn).score(mate_score=100000) < 150:
        return {'status': 'withheld', 'flags': ['shallow-screen-no-suitable-line']}
    gate = early_gate({**record, **line}, False)
    if gate['flags']:
        return {'status': 'withheld', 'flags': gate['flags']}
    infos = _engine.analyse(board, chess.engine.Limit(nodes=settings['nodes']), multipv=3)
    best = infos[0]['score'].pov(board.turn).score(mate_score=100000)
    candidates = []
    for info in infos:
        line = miner.inspect(board, info.get('pv', []), wanted)
        score = info['score'].pov(board.turn).score(mate_score=100000)
        if line and score >= 150 and score >= best - 40 and builder.reply_coverage({**record, **line}):
            gate = early_gate({**record, **line}, False)
            if not gate['flags']:
                candidates.append((line, info, score))
    if not candidates:
        return {'status': 'withheld', 'flags': ['deeper-screen-no-verified-local-payoff']}
    line, info, score = candidates[0]
    walk, checks = board.copy(stack=False), []
    for ply, san in enumerate(line['moves']):
        walk.push_san(san)
        if ply % 2 == 0 and not walk.is_game_over():
            defence = _engine.analyse(walk, chess.engine.Limit(nodes=settings['defenceNodes']))
            cp = defence['score'].pov(board.turn).score(mate_score=100000)
            checks.append({'ply': ply + 1, 'score': cp, 'pv': [m.uci() for m in defence.get('pv', [])]})
            if cp < 100:
                return {'status': 'withheld', 'flags': ['strong-defence-fails-collection-screen']}
    result = {**record, **line, 'score': score, 'alternatives': [row[0]['moves'] for row in candidates[1:]],
              'validation': {'principalVariation': [m.uci() for m in info['pv']], 'depth': info['depth'],
                             'bestScore': best, 'defences': checks}}
    return {'status': 'lead', 'flags': [], 'record': result}


def _screen_task(task):
    record, levels, phase, settings, version = task
    before = _engine.stats.copy()
    key = digest({'record': record, 'levels': levels, 'phase': phase, 'settings': settings,
                  'code': version, 'engine': _engine.identity})
    saved = _store.get('position-screen', key) if _store else None
    try:
        result = saved if saved is not None else _screen_position(record, levels, phase, settings)
        if _store and saved is None:
            _store.put('position-screen', key, result)
    finally:
        # Explicit close is necessary before Python-chess's loop thread can
        # prevent ProcessPoolExecutor shutdown. No atexit-only cleanup.
        _engine.stop_process()
    return {**result, 'screenCacheHit': saved is not None,
            'work': {key: _engine.stats[key] - before[key] for key in before}}


def collect_parallel(db, records=(), *, topic='discovery', levels=('B',), phase='tactics',
                     target=6, targets=None, cache=DEFAULT_CACHE, workers=4, output=None,
                     max_games=0, executable=None, settings=None, use_bank=True, exclude_game_ids=()):
    """Lookup first, index only on shortage, then screen independent positions.

    Returned records still require the full tactical and editorial workflow.
    No source game is replayed during candidate lookup or warm screening.
    """
    if topic != 'discovery' or phase not in ('tactics', 'tails'):
        raise ValueError('Implement the topic/phase adapter before collection')
    if workers < 1 or target < 0:
        raise ValueError('Positive workers and nonnegative target required')
    levels = tuple(dict.fromkeys(levels))
    if not levels or any(level not in LEVELS for level in levels):
        raise ValueError('Invalid Discovery research levels')
    needed = {level: (targets or {}).get(level, target) for level in levels}
    if any(value < 0 for value in needed.values()):
        raise ValueError('Targets must be nonnegative')
    settings = {**SCREEN_SETTINGS, **(settings or {})}
    if any(value <= 0 for value in settings.values()):
        raise ValueError('Screen budgets must be positive')
    initialize(db)
    if cache:
        store = ResearchCache(cache); store.close()
    started = time.perf_counter()
    counts = {level: 0 for level in levels}
    selected, withheld, seen_games, consumed = [], [], set(exclude_game_ids), set()
    report = {'topic': topic, 'phase': phase, 'requestedTargets': needed, 'records': selected,
              'withheld': withheld, 'settings': settings, 'publicationApproved': False,
              'sourceGamesReplayed': 0, 'bankHits': 0, 'screenCacheHits': 0, 'useBank': use_bank,
              'engineStats': {'hits': 0, 'misses': 0, 'engineCalls': 0, 'engineSeconds': 0.0}}
    def enough():
        return all(counts[level] >= needed[level] for level in levels)
    def save():
        report['counts'] = counts.copy()
        report['wallSeconds'] = time.perf_counter() - started
        report['requestedLeadTargetMet'] = enough()
        if output:
            atomic_json(output, report)
    if use_bank:
        for level in levels:
            if needed[level] <= 0:
                continue
            bank = query_candidates(db, topic, [level], limit=needed[level], phase=None,
                                    exclude_game_ids=seen_games)
            for record, ident in zip(bank['records'], bank['candidateIds']):
                selected.append(record); counts[level] += 1; seen_games.add(record['gameId'])
                consumed.add(ident); report['bankHits'] += 1
    if enough():
        report['complete'] = True
        save(); return report
    geometry = index_positions(db, records, workers=workers, max_games=max_games) if records else None
    report['geometryIndex'] = geometry
    report['sourceGamesReplayed'] = geometry['sourceGamesReplayed'] if geometry else 0
    version = screen_version()
    with ProcessPoolExecutor(max_workers=workers, initializer=_initialize_screen,
                             initargs=(executable, cache, settings)) as pool:
        while not enough():
            outstanding = [level for level in levels if counts[level] < needed[level]]
            packet = query_candidates(db, topic, outstanding, limit=max(1, workers * 2),
                                      include_geometry=True, include_withheld=True, phase=phase,
                                      exclude_ids=consumed, exclude_game_ids=seen_games)
            jobs = [(record, levels, phase, settings, version)
                    for record in packet['records'] if record['gameId'] not in seen_games]
            for record, ident in zip(packet['records'], packet['candidateIds']):
                consumed.add(ident)
            if not jobs:
                if packet['records']:
                    continue
                break
            for task, result in zip(jobs, pool.map(_screen_task, jobs, chunksize=1)):
                source = task[0]
                report['screenCacheHits'] += int(result['screenCacheHit'])
                for name, value in result['work'].items():
                    report['engineStats'][name] += value
                if result['status'] == 'lead':
                    record = result['record']; level = record['level']
                    import_candidates(db, [record], topic, 'parallel-engine-screen', 'screened', phase)
                    if counts[level] < needed[level] and record['gameId'] not in seen_games:
                        selected.append(record); counts[level] += 1; seen_games.add(record['gameId'])
                else:
                    withheld.append({'gameId': source['gameId'], 'fen': source['fen'],
                                     'level': source['level'], 'moves': source.get('moves', []),
                                     'flags': result['flags']})
                save()
    # This distinguishes a fulfilled lead request from completing an entire
    # corpus or proving a research gap. Stopping early leaves positions pending.
    full_screen = bool(records) and geometry is not None and geometry['complete'] and not enough()
    report['complete'] = enough() or full_screen
    report['corpusScreenComplete'] = full_screen
    report['scope'] = 'provided-complete-games' if records else 'existing-candidate-bank-only'
    save()
    return report
