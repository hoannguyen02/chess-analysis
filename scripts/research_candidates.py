"""Searchable, unpublished tactic leads; cached candidates are never approval."""
import json
from pathlib import Path
import time

import chess

from tactic_research import ROOT, digest
from research_index import disposition, master_credential
from tactics_catalog import PRACTICE_LEVELS, matches_current_level

SOURCE_FIELDS = ('gameFen', 'gameMoves', 'headers', 'source', 'sourceReferences', 'masterCredential')
STAGES = {'incomplete': 0, 'geometry': 1, 'tail': 1, 'withheld': 2, 'saved': 3, 'screened': 4}


def initialize(db):
    db.executescript('''
      CREATE TABLE IF NOT EXISTS research_candidate_sources (
        source_key TEXT PRIMARY KEY, payload TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS research_candidate_positions (
        candidate_id TEXT PRIMARY KEY, topic TEXT NOT NULL, level TEXT NOT NULL,
        game_id TEXT NOT NULL, position_key TEXT NOT NULL, source_key TEXT NOT NULL,
        record TEXT NOT NULL, stage TEXT NOT NULL, phase TEXT NOT NULL,
        origin TEXT NOT NULL, flags TEXT NOT NULL, aspects TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS research_candidate_lookup
        ON research_candidate_positions(topic,level,stage,phase);
      CREATE INDEX IF NOT EXISTS research_candidate_ordered_lookup
        ON research_candidate_positions(topic,level,stage,phase,game_id,candidate_id);
      CREATE INDEX IF NOT EXISTS research_candidate_game_sources
        ON research_candidate_positions(game_id,source_key);
      CREATE TABLE IF NOT EXISTS research_candidate_imports (
        path TEXT PRIMARY KEY, sha256 TEXT NOT NULL, imported INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS research_candidate_detectors (
        candidate_id TEXT PRIMARY KEY, detector TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS research_candidate_restore_stages (
        candidate_id TEXT PRIMARY KEY, stage TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS research_geometry_games (
        input_hash TEXT NOT NULL, detector TEXT NOT NULL, game_key TEXT NOT NULL,
        source_key TEXT NOT NULL, status TEXT NOT NULL, detail TEXT NOT NULL,
        PRIMARY KEY(input_hash,detector));
    ''')
    # Migrate the first index generation without replaying valid source games.
    # If a legacy bank mixes detector generations, leave ambiguous rows inert;
    # they must be explicitly refreshed rather than attributed to newer code.
    if not db.execute('SELECT 1 FROM research_candidate_detectors LIMIT 1').fetchone():
        versions = db.execute('SELECT DISTINCT detector FROM research_geometry_games').fetchall()
        if len(versions) == 1:
            db.execute("INSERT OR IGNORE INTO research_candidate_detectors SELECT candidate_id,? FROM research_candidate_positions WHERE stage IN ('geometry','tail')", (versions[0][0],))
    db.commit()


def candidate_id(topic, record):
    return digest({'topic': topic, 'gameId': record['gameId'],
                   'fen': ' '.join(record['fen'].split()[:4]),
                   'moves': record.get('moves', []), 'level': record['level']})


def aspects(record):
    if not record.get('moves') or not any(key in record for key in ('discoveryPly','forkPly')):
        return []
    fork = 'forkPly' in record
    ply = record['forkPly'] if fork else record['discoveryPly']
    board = chess.Board(record['fen'])
    for san in record['moves'][:ply]:
        board.push_san(san)
    move = board.parse_san(record['moves'][ply])
    piece = board.piece_at(move.from_square)
    found = [f'mover-{piece.symbol().upper()}', 'capture' if board.is_capture(move) else 'quiet',
             'white' if board.turn else 'black']
    if fork:
        found.append('fork')
        for square in record.get('targets', []):
            target = board.piece_at(chess.parse_square(square))
            if target:
                found.append(f'target-{target.symbol().upper()}')
        if record.get('sacrifices'):
            found.append('recorded-sacrifice')
    else:
        slider = board.piece_at(chess.parse_square(record['sliderSquare']))
        found.extend((f'slider-{slider.symbol().upper()}', record['kind']))
    if piece.piece_type == chess.PAWN:
        found.append('pawn-capture' if board.is_capture(move) else
                     'pawn-two-square' if abs(move.to_square - move.from_square) == 16 else 'pawn-one-square')
    if board.is_en_passant(move):
        found.append('en-passant')
    if board.is_castling(move):
        found.append('castling')
    if move.promotion:
        found.append('promotion')
    board.push(move)
    if fork:
        found.append('check' if board.is_check() else 'non-check')
    if len(board.checkers()) > 1:
        found.append('double-check')
    return sorted(set(found))


def refresh_aspects(db, topic):
    """Re-tag stored lines, without replaying complete games or changing outcomes."""
    initialize(db)
    rows = db.execute('SELECT candidate_id,record,aspects FROM research_candidate_positions WHERE topic=?',
                      (topic,)).fetchall()
    changed = []
    for ident, raw, old in rows:
        new = json.dumps(aspects(json.loads(raw)))
        if new != old:
            changed.append((new, ident))
    with db:
        db.executemany('UPDATE research_candidate_positions SET aspects=? WHERE candidate_id=?', changed)
    return {'examined': len(rows), 'updated': len(changed), 'sourceGamesReplayed': 0}


def enrich(db, record):
    record = dict(record)
    if 'sourceReferences' not in record:
        refs = db.execute('SELECT s.url,s.sha256,s.retrieved FROM sources s '
                          'JOIN game_legacy_ids l ON l.game_key=s.game_key WHERE l.game_id=? '
                          'ORDER BY s.url,s.sha256', (record['gameId'],)).fetchall()
        if refs:
            record['sourceReferences'] = [{'url': url, 'sha256': sha, 'retrieved': when}
                                          for url, sha, when in refs]
    if 'masterCredential' not in record:
        credential = master_credential(record.get('headers', {}), record.get('sourceReferences', []))
        if credential:
            record['masterCredential'] = credential
    return record


def _insert(db, records, topic, origin, stage, phase, flags=None, detector=None):
    count = 0
    for record in records:
        if not all(key in record for key in ('gameId', 'fen', 'level', 'gameFen', 'gameMoves', 'ply')):
            continue
        record = enrich(db, record)
        board = chess.Board(record['fen'])
        for san in record.get('moves', []):
            board.push_san(san)
        current_stage = stage
        if not record.get('sourceReferences'):
            current_stage = 'incomplete'
        elif stage == 'saved' and (flags or {}).get(record['gameId']):
            current_stage = 'withheld'
        payload = {key: record[key] for key in SOURCE_FIELDS if key in record}
        source_key = digest(payload)
        db.execute('INSERT OR IGNORE INTO research_candidate_sources VALUES (?,?)',
                   (source_key, json.dumps(payload, ensure_ascii=False)))
        row = {key: value for key, value in record.items() if key not in SOURCE_FIELDS}
        ident = candidate_id(topic, record)
        old = db.execute('SELECT stage,record,source_key FROM research_candidate_positions WHERE candidate_id=?', (ident,)).fetchone()
        if old and STAGES[old[0]] > STAGES[current_stage]:
            prior = json.loads(old[1])
            if stage in ('geometry', 'tail'):
                keys = ('gameId','fen','moves','level','goal','discoveryPly','payoffPly',
                        'sliderSquare','targetSquare','moverSquare','sacrifices')
                unchanged = all(prior.get(key) == row.get(key) for key in keys)
            else:
                # A changed authoritative lead invalidates a formerly screened
                # row, including provenance, objective and validation changes.
                unchanged = digest(prior) == digest(row)
            if unchanged and old[2] == source_key:
                continue
        db.execute('INSERT OR REPLACE INTO research_candidate_positions VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
                   (ident, topic, record['level'], record['gameId'], ' '.join(record['fen'].split()[:4]),
                    source_key, json.dumps(row, ensure_ascii=False), current_stage, phase, str(origin),
                    json.dumps((flags or {}).get(record['gameId'], [])), json.dumps(aspects(record))))
        if stage in ('geometry', 'tail'):
            if detector is None:
                from research_collection import detector_version
                detector = detector_version()
            db.execute('INSERT OR REPLACE INTO research_candidate_detectors VALUES (?,?)', (ident, detector))
        if current_stage == 'incomplete' and stage != 'incomplete':
            db.execute('INSERT OR REPLACE INTO research_candidate_restore_stages VALUES (?,?)', (ident, stage))
        count += 1
    return count


def import_candidates(db, records, topic='discovery', origin='explicit-import', stage='saved',
                      phase='tactics', flags=None):
    initialize(db)
    if stage not in STAGES:
        raise ValueError('Unknown candidate stage')
    with db:
        count = _insert(db, records, topic, origin, stage, phase, flags)
    return {'input': len(records), 'stored': count, 'stage': stage, 'publicationApproved': False}


def bootstrap_candidates(db, paths=None, topic='discovery'):
    """Import known saved leads once; full-game tactical review still follows lookup."""
    import hashlib
    from research_run import SOURCE_LEVELS
    initialize(db)
    if paths is None:
        fixtures = ROOT / f'scripts/fixtures/{topic}'
        # Retired Skewer batches are historical evidence, separate from the
        # new Beginner bank. Fresh source leads are imported after collection.
        paths = sorted(fixtures.glob('published.json' if topic == 'skewer' else '*.json'))
    imported = skipped = files = 0
    for value in paths:
        path = Path(value)
        raw = path.read_bytes()
        sha = hashlib.sha256(raw).hexdigest()
        old = db.execute('SELECT sha256 FROM research_candidate_imports WHERE path=?', (str(path.resolve()),)).fetchone()
        if old and old[0] == sha:
            skipped += 1
            continue
        data = json.loads(raw)
        if not isinstance(data, dict):
            continue
        records = data.get('records', data.get('candidates', []))
        levels = PRACTICE_LEVELS if 'Beginner' in SOURCE_LEVELS.get(topic, ()) else PRACTICE_LEVELS[1:]
        records = [r for r in records if isinstance(r, dict) and r.get('level') in levels]
        if not records:
            continue
        flags = {r['gameId']: r.get('flags', []) for r in data.get('results', [])}
        with db:
            count = _insert(db, records, topic, path, 'saved', 'tactics', flags)
            db.execute('INSERT OR REPLACE INTO research_candidate_imports VALUES (?,?,?)',
                       (str(path.resolve()), sha, count))
        imported += count
        files += 1
    return {'imported': imported, 'filesImported': files, 'unchangedFiles': skipped,
            'publicationApproved': False}


def query_candidates(db, topic, levels, limit=0, recheck=False, include_geometry=False,
                     phase=None, include_withheld=False, aspect_filters=None, exclude_ids=(),
                     exclude_game_ids=(), distinct_games=True, memory_mode='reuse', memory_policy=None,
                     published_positions=None):
    """Lazily interleave per-level shortlists, applying current decisions late.

    A limit bounds decoded records, rather than fetching/parsing the entire
    geometric index. Ineligible rows are still examined until enough eligible
    records are found, so owner/exclusion checks cannot be bypassed for speed.
    """
    initialize(db)
    from research_memory import (initialize as init_memory, current_policy, assessment, ready_candidate_ids,
                                 rule_versions, scoped_policy, HOLD, READY)
    init_memory(db)
    if memory_mode not in ('reuse','stale','force'):
        raise ValueError('Unknown research memory mode')
    current = memory_policy
    has_memory = db.execute('SELECT 1 FROM research_assessments WHERE topic=? LIMIT 1', (topic,)).fetchone()
    if current is None and has_memory:
        current = current_policy(topic)
    versions = rule_versions(topic) if current else {}
    started = time.perf_counter()
    levels = list(dict.fromkeys(levels))
    if not levels or limit < 0:
        raise ValueError('Specify levels and a nonnegative limit')
    stages = ['screened', 'saved']
    if include_geometry:
        stages += ['geometry', 'tail']
    if include_withheld or memory_mode in ('stale','force'):
        stages.append('withheld')
    protected = set() if recheck else {row[0] for row in db.execute(
        "SELECT game_id FROM research_decisions WHERE topic=? AND (status IN ('approved','manual','removed','transferred') OR level='*')",
        (topic,)) if row[0]}
    owner = {row[0] for row in db.execute("SELECT game_id FROM research_decisions WHERE topic=? AND status IN ('manual','removed','transferred')", (topic,)) if row[0]}
    skipped, selected = [], []
    wanted_aspects = set(aspect_filters or [])
    excluded, excluded_games = set(exclude_ids), set(exclude_game_ids)
    examined = 0
    memory_skips = 0
    current_detector = None
    if include_geometry:
        from research_collection import detector_version
        current_detector = detector_version()
    def eligible(level):
        nonlocal examined, memory_skips
        seen_games, seen_positions, seen_ids = set(), set(), set()
        scope = scoped_policy(current, versions, level)
        preferred = ready_candidate_ids(db, topic, level, scope) if memory_mode == 'reuse' else []
        searches = [(stage, ident) for ident in preferred for stage in stages] + [(stage, None) for stage in stages]
        for stage, wanted in searches:
            where, params = 'p.topic=? AND p.level=? AND p.stage=?', [topic, level, stage]
            if stage == 'tail' and phase == 'tails':
                params[1] = '*'
            if stage in ('geometry', 'tail'):
                where += ' AND EXISTS (SELECT 1 FROM research_candidate_detectors d WHERE d.candidate_id=p.candidate_id AND d.detector=?)'
                params.append(current_detector)
            if phase:
                where += ' AND p.phase=?'
                params.append(phase)
            if wanted:
                where += ' AND p.candidate_id=?'
                params.append(wanted)
            cursor = db.execute('SELECT p.candidate_id,p.game_id,p.level,p.record,s.payload,p.stage,p.flags,p.aspects '
                                'FROM research_candidate_positions p JOIN research_candidate_sources s USING(source_key) '
                                f'WHERE {where} ORDER BY p.game_id,p.candidate_id', params)
            try:
                for ident, game_id, actual_level, raw, source, actual_stage, flags, tags in cursor:
                    if ident in seen_ids:
                        continue
                    examined += 1
                    if ident in excluded or game_id in excluded_games or game_id in protected or game_id in owner:
                        skipped.append({'candidateId': ident, 'gameId': game_id, 'reason': 'Saved or current source-game decision'})
                        continue
                    if distinct_games and game_id in seen_games:
                        continue
                    if wanted_aspects and not wanted_aspects.intersection(json.loads(tags)):
                        continue
                    record = {**json.loads(raw), **json.loads(source)}
                    if published_positions is not None:
                        from research_positions import overlaps
                        matches = overlaps(published_positions, topic, record['fen'])
                        if matches:
                            skipped.append({'candidateId': ident, 'gameId': game_id,
                                            'reason': 'Cross-topic published position', 'matches': matches})
                            continue
                    if memory_mode == 'reuse' and not matches_current_level(record):
                        skipped.append({'candidateId': ident, 'gameId': game_id,
                                        'reason': 'Lead does not match the current level rules'})
                        continue
                    old = disposition(db, topic, {**record, 'level': level})
                    if old and (not recheck or old['status'] in ('removed', 'transferred', 'manual')):
                        skipped.append({'candidateId': ident, 'gameId': game_id, 'reason': old})
                        continue
                    prior = assessment(db, topic, record, scope) if scope else None
                    if wanted and (not prior or prior['status'] not in READY):
                        continue  # Same legacy ID may now contain a changed record.
                    if prior and prior['status'] in HOLD and memory_mode != 'force':
                        memory_skips += 1
                        skipped.append({'candidateId': ident, 'gameId': game_id, 'reason': prior})
                        continue
                    if memory_mode == 'stale' and (prior or not db.execute(
                            'SELECT 1 FROM research_assessments WHERE topic=? AND level=? AND revision=? LIMIT 1',
                            (topic, level, digest(record))).fetchone()):
                        continue
                    key = ' '.join(record['fen'].split()[:4])
                    if key in seen_positions:
                        continue
                    seen_games.add(game_id); seen_positions.add(key); seen_ids.add(ident)
                    yield record, actual_stage, ident, json.loads(flags), prior
            finally:
                cursor.close()
    generators = {level: eligible(level) for level in levels}
    active = list(levels)
    try:
        while active and (not limit or len(selected) < limit):
            for level in list(active):
                if limit and len(selected) >= limit:
                    break
                try:
                    selected.append(next(generators[level]))
                except StopIteration:
                    active.remove(level)
    finally:
        for generator in generators.values():
            generator.close()
    return {'records': [row[0] for row in selected], 'candidateStages': [row[1] for row in selected],
            'candidateIds': [row[2] for row in selected], 'flags': [row[3] for row in selected],
            'assessments': [row[4] for row in selected],
            'skipped': skipped, 'metrics': {'lookupSeconds': time.perf_counter() - started,
                'rowsExamined': examined, 'eligiblePositions': len(selected), 'sourceGamesReplayed': 0,
                'memorySkipped': memory_skips, 'memoryReady': sum(bool(row[4]) and row[4]['status'] in READY for row in selected)},
            'publicationApproved': False}
