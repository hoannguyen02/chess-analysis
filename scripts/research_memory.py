"""Versioned research outcomes in the shared index; none confer publication approval."""
from collections import Counter
import importlib
import json
from pathlib import Path
import sqlite3
import time

from tactic_research import ROOT, CachedEngine, ResearchCache, atomic_json, code_version, digest
from tactics_catalog import PRACTICE_LEVELS as LEVELS

SHARED_PROOF = ('tactic_research.py', 'research_workflow.py', 'beginner_one_move.py',
                'tactics_catalog.py', 'collect-discovery.py',
                'build-discovery.py', 'review-discovery-upper.py', 'review-discovery-level-a.py',
                'check-discovery-shortcuts.py', 'prove-discovery-mates.py')
PROOF_FILES = {'discovery': (*SHARED_PROOF, 'discovery_research.py'),
               'fork': (*SHARED_PROOF, 'discovery_research.py', 'fork_research.py',
                        'collect-forks.py', 'build-forks.py'),
               'defensive-move': (*SHARED_PROOF, 'discovery_research.py', 'hanging_piece_research.py',
                                  'defensive_move_research.py', 'collect_defensive_move.py'),
               'mate-in-one': (*SHARED_PROOF, 'discovery_research.py', 'mate_in_one_research.py',
                               'two_rook_mate_research.py', 'collect_two_rook_mate.py'),
               'hanging-piece': (*SHARED_PROOF, 'discovery_research.py',
                                 'hanging_piece_research.py'),
               'pin': (*SHARED_PROOF, 'discovery_research.py', 'hanging_piece_research.py',
                       'pin_research.py', 'build-pins.py'),
               'skewer': (*SHARED_PROOF, 'discovery_research.py', 'hanging_piece_research.py',
                          'pin_research.py', 'skewer_research.py', 'build-skewer.py'),
               'two-rook-mate': (*SHARED_PROOF, 'discovery_research.py', 'two_rook_mate_research.py',
                                 'two_rook_mate_proof.py', 'collect-two-rook-games.py',
                                 'collect_two_rook_mate.py')}
HOLD = {'withheld', 'unresolved', 'editorial-rejected', 'editorial-deferred'}
READY = {'tactical-ready', 'editorial-ready', 'unselected'}
RULES_FILE = ROOT / 'scripts/fixtures/tactics-index/research-rules.json'


def initialize(db):
    db.executescript('''
      CREATE TABLE IF NOT EXISTS research_assessments (
        id INTEGER PRIMARY KEY, event_key TEXT NOT NULL UNIQUE,
        position_line_key TEXT NOT NULL, revision TEXT NOT NULL,
        topic TEXT NOT NULL, level TEXT NOT NULL, objective TEXT NOT NULL,
        game_id TEXT NOT NULL, kind TEXT NOT NULL, outcome TEXT NOT NULL,
        policy_key TEXT NOT NULL, policy TEXT NOT NULL, payload TEXT NOT NULL,
        origin TEXT NOT NULL, observed_at TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS research_assessment_selection
        ON research_assessments(topic,level,revision,policy_key,kind,observed_at,id);
      CREATE INDEX IF NOT EXISTS research_assessment_game
        ON research_assessments(game_id,topic,level,observed_at,id);
      CREATE TABLE IF NOT EXISTS research_verifier_versions (
        report_code TEXT NOT NULL, topic TEXT NOT NULL, proof_code TEXT NOT NULL,
        PRIMARY KEY(report_code,topic));
    ''')


def position_line_key(record):
    # Grade and motif are assessments, not identities. Do not deduplicate proof
    # by four-field FEN: full game history/revision remains binding below.
    return digest({key: record.get(key) for key in
                   ('gameId', 'gameFen', 'gameMoves', 'ply', 'fen', 'moves')})


def proof_code(topic):
    return code_version(*PROOF_FILES[topic])


def register_verifier(db, topic):
    from research_workflow import verification_code
    initialize(db)
    report_code, proof = verification_code(), proof_code(topic)
    with db:
        db.execute('INSERT OR IGNORE INTO research_verifier_versions VALUES (?,?,?)',
                   (report_code, topic, proof))
        if db.execute('SELECT proof_code FROM research_verifier_versions WHERE report_code=? AND topic=?',
                      (report_code, topic)).fetchone()[0] != proof:
            raise ValueError('Conflicting dependency fingerprint for this verifier version')
    return report_code, proof


def policy(proof, settings, engine, provenance=True):
    return {'proofCode': proof, 'settings': settings, 'engine': engine,
            'requiresProvenance': provenance}


def rule_versions(topic):
    value = json.loads(RULES_FILE.read_text())
    versions = value['topics'].get(topic, {})
    if value['schema'] != 1 or any(level not in LEVELS or not isinstance(version,str) or not version.strip()
                                   for level,version in versions.items()):
        raise ValueError('Invalid scoped research rule versions')
    return versions


def scoped_policy(context, versions, level):
    if context is None or level not in versions:
        return context
    return {**context, 'ruleVersion': versions[level]}


def current_policy(topic, settings=None, executable=None):
    from research_workflow import SETTINGS
    if topic not in PROOF_FILES:
        return None
    try:
        engine = CachedEngine(executable, cache=None).identity
    except FileNotFoundError:
        return None  # Browsing history works even without a local engine.
    return policy(proof_code(topic), {**SETTINGS, **(settings or {})}, engine)


def _exact_result(row):
    return {k: v for k, v in row.items() if k not in ('work', 'timings', 'elapsedSeconds', 'reused')}


def _outcome(result):
    flags = result['flags']
    if result['status'] == 'needs-editorial-review' and not flags:
        return 'tactical-ready'
    if any('unresolved' in flag or 'not-proved' in flag or 'budget' in flag for flag in flags):
        return 'unresolved'
    return 'withheld'


def remember_report(db, report, origin, *, decisions=None, editorial_code=None, observed_at=None):
    """Import only observed results, preserving their original proof/budget identity."""
    from research_workflow import ADAPTERS
    from research_run import utcnow
    topic = report['topic']
    if topic not in ADAPTERS:
        raise ValueError('An implemented topic adapter is required to import its review')
    adapter = importlib.import_module(ADAPTERS[topic])
    register_verifier(db, topic)
    old_code = report['verificationCodeSha256']
    known = db.execute('SELECT proof_code FROM research_verifier_versions WHERE report_code=? AND topic=?',
                       (old_code, topic)).fetchone()
    # Unrecognized old reports remain inspectable, without governing selection.
    proof = known[0] if known else 'historical:' + old_code
    by_id = {record['gameId']: record for record in report['candidates']}
    if len(by_id) != len(report['candidates']):
        raise ValueError('Ambiguous report: more than one candidate for a game')
    chosen = {row['gameId']: row for row in decisions or []}
    rows, seen = [], set()
    for result in report['results']:
        ident = result['gameId']
        if ident in seen or ident not in by_id:
            raise ValueError('Duplicate or missing candidate for review result')
        seen.add(ident)
        record = by_id[ident]
        if adapter.record_hash(record) != result['recordHash']:
            raise ValueError(f'{ident}: result is bound to a different record')
        if result['status'] not in ('withheld', 'needs-editorial-review'):
            continue
        exact = _exact_result(result)
        context = scoped_policy(policy(proof, report['settings'], exact.get('engineIdentity'),
                                       report['quality'].get('requiresProvenance') is True),
                                report.get('researchRuleVersions', {}), record['level'])
        outcome = _outcome(result)
        payload = {'record': record, 'result': exact, 'reportCode': old_code}
        rows.append(('tactical', outcome, context, payload))
        if ident in chosen:
            decision = chosen[ident]
            if (outcome != 'tactical-ready' or decision.get('recordHash') != result['recordHash']
                    or decision.get('fullRecordSha256') != digest(record)
                    or decision.get('evidenceSha256') != digest(exact)):
                raise ValueError(f'{ident}: editorial decision does not match exact tactical evidence')
            status = {'keep': 'editorial-ready', 'remove': 'editorial-rejected',
                      'defer': 'unselected' if decision.get('retryWhen') == 'next-selection'
                      else 'editorial-deferred'}[decision['decision']]
            rows.append(('editorial', status, {**context, 'editorialCode': editorial_code or 'historical:unknown'},
                         {**payload, 'decision': decision}))
    if set(chosen) - seen:
        raise ValueError('Editorial decision without matching reviewed candidate')
    stored = Counter()
    with db:
        for kind, outcome, context, payload in rows:
            record = payload['record']
            key = digest([topic, kind, outcome, context, payload])
            cursor = db.execute('''INSERT OR IGNORE INTO research_assessments
                (event_key,position_line_key,revision,topic,level,objective,game_id,kind,outcome,
                 policy_key,policy,payload,origin,observed_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)''',
                (key, position_line_key(record), digest(record), topic, record['level'], record.get('goal', ''),
                 record['gameId'], kind, outcome, digest(context), json.dumps(context),
                 json.dumps(payload, ensure_ascii=False), str(origin), observed_at or utcnow()))
            stored[outcome] += cursor.rowcount
    return {'examined': len(rows), 'stored': sum(stored.values()), 'outcomes': dict(stored),
            'historicalVerifier': not bool(known), 'publicationApproved': False}


def backfill_run(db, path):
    """Restore evidence from genuine command receipts; ignore changed artifacts."""
    from research_run import RunLedger, WorkflowRun
    ledger = RunLedger(path).summary()
    receipts = ledger.get('workflow', {}).get('receipts', [])
    reports, outcomes = {}, Counter()
    summary = {'reports': 0, 'editorialMerges': 0, 'unavailableArtifacts': 0}
    for row in receipts:
        if row['kind'] != 'review':
            continue
        if not WorkflowRun.intact([row['artifact']]):
            summary['unavailableArtifacts'] += 1
            continue
        source = row['artifact']['path']
        report = json.loads(Path(source).read_text())
        key = digest(report)
        if key in reports:
            continue
        reports[key] = report
        result = remember_report(db, report, source, observed_at=row['recordedUtc'])
        outcomes.update(result['outcomes'])
        summary['reports'] += 1
    for row in receipts:
        if row['kind'] != 'merge' or row['reportHash'] not in reports:
            continue
        if not WorkflowRun.intact([row['artifact'], *row['inputs']]):
            summary['unavailableArtifacts'] += 1
            continue
        source = row['artifact']['path']
        merged = json.loads(Path(source).read_text())
        manifest = json.loads(Path(row['inputs'][0]['path']).read_text())
        result = remember_report(db, reports[row['reportHash']], source,
                                 decisions=merged['reviews'] + merged.get('deferred', []),
                                 editorial_code=manifest['editorialCodeSha256'], observed_at=row['recordedUtc'])
        outcomes.update(result['outcomes'])
        summary['editorialMerges'] += 1
    return {**summary, 'stored': sum(outcomes.values()), 'outcomes': dict(outcomes), 'publicationApproved': False}


def assessment(db, topic, record, current, *, include_payload=False):
    if current is None:
        return None
    editorial = {**current, 'editorialCode': code_version('research_editorial.py')}
    rows = db.execute('''SELECT event_key,kind,outcome,payload,origin FROM research_assessments
        WHERE topic=? AND level=? AND revision=? AND policy_key IN (?,?)
        ORDER BY observed_at DESC,id DESC''',
        (topic, record['level'], digest(record), digest(current), digest(editorial))).fetchall()
    tactical = next((row for row in rows if row[1] == 'tactical'), None)
    if not tactical:
        return None
    evidence = json.loads(tactical[3])['result']
    row = next((row for row in rows if row[1] == 'editorial'
                and json.loads(row[3])['result'] == evidence), tactical)
    key, kind, outcome, raw, origin = row
    value = json.loads(raw)
    result = {'assessmentId': key, 'kind': kind, 'status': outcome,
              'flags': value['result']['flags'], 'origin': origin,
              'reason': value.get('decision', {}).get('reason')}
    if include_payload:
        result['evidence'] = value
    return result


def review_with_memory(db, records, topic, *, output, cache, workers=1, batch_size=12,
                       need=0, force=None, settings=None):
    """Checkpoint each actual review batch and reuse only exactly matching evidence."""
    from research_workflow import run_review, metrics, write_cards, SETTINGS
    if workers < 1 or batch_size < 1 or need < 0:
        raise ValueError('Invalid worker count, batch size or review target')
    if force is not None and not force.strip():
        raise ValueError('A nonempty forced-review reason is required')
    started = time.perf_counter()
    version, _ = register_verifier(db, topic)
    if settings is not None and (not isinstance(settings, dict) or set(settings) - set(SETTINGS)):
        raise ValueError('Unknown verification budget; use the existing review settings')
    settings = {**SETTINGS, **(settings or {})}
    if any(type(v) is not int or v <= 0 for v in settings.values()):
        raise ValueError('Verification budgets must be positive integers')
    current = current_policy(topic, settings)
    versions = rule_versions(topic)
    pending, skipped, cached, seen_positions, seen_games = [], [], {}, set(), set()
    for record in records:
        prior = assessment(db, topic, record, scoped_policy(current, versions, record['level']),
                           include_payload=True) if not force else None
        if prior and prior['status'] in HOLD:
            skipped.append({'gameId': record['gameId'], **{k:v for k,v in prior.items() if k != 'evidence'}})
            continue
        fen = ' '.join(record['fen'].split()[:4])
        if fen in seen_positions or record['gameId'] in seen_games:
            continue
        seen_positions.add(fen); seen_games.add(record['gameId']); pending.append(record)
        if prior and prior['status'] in READY:
            cached[record['gameId']] = prior
    results, reused, saved = [], [], 0
    if cache and any(record['gameId'] not in cached for record in pending):
        store = ResearchCache(cache)
        try:
            store.db.execute('INSERT OR IGNORE INTO results VALUES (?,?,?)', ('preflight', 'writable', '{}'))
        except sqlite3.OperationalError as error:
            raise ValueError(f'Engine cache is not writable: {cache}. Use --cache with a writable path.') from error
        finally:
            store.db.rollback()
            store.close()
    report = {'schema': 1, 'topic': topic, 'settings': settings, 'verificationCodeSha256': version,
              'quality': {'everyLegalRoot': True, 'shortcutBudget': settings['shortcutBudget'],
                          'allReplyMateProof': True, 'requiresEditorialApproval': True, 'requiresProvenance': True},
              'inputSha256': digest(records), 'inputCount': len(records), 'distinctPositions': len(pending),
              'workers': workers, 'batchSize': batch_size, 'candidates': pending, 'results': results,
              'researchRuleVersions': {k:v for k,v in versions.items() if k in {r['level'] for r in pending}},
              'skippedResearchAssessments': skipped}
    def save():
        report['complete'] = len(results) == len(pending)
        report['metrics'] = {**metrics(results, time.perf_counter()-started), 'memorySkipped': len(skipped),
                             'memoryReused': len(reused), 'memoryAssessmentIds': reused,
                             'memoryOutcomesStored': saved, 'forcedReviewReason': force}
        atomic_json(output, report)
        write_cards(Path(output).with_suffix('.md'), report)
    for start in range(0, len(pending), batch_size):
        batch = pending[start:start+batch_size]
        missing = [record for record in batch if record['gameId'] not in cached]
        fresh = {}
        if missing:
            reviewed = run_review(missing, topic, cache=cache, workers=workers,
                                  settings=settings, batch_size=batch_size, progress=False)
            if reviewed['verificationCodeSha256'] != version:
                raise ValueError('Verification code changed during review')
            reviewed['researchRuleVersions'] = report['researchRuleVersions']
            saved += remember_report(db, reviewed, output)['stored']
            fresh = {row['gameId']: row for row in reviewed['results']}
        for record in batch:
            ident = record['gameId']
            if ident in fresh:
                results.append(fresh[ident])
            else:
                prior = cached[ident]
                reused.append(prior['assessmentId'])
                results.append({**prior['evidence']['result'], 'reused': True,
                                'work': {'hits': 0, 'misses': 0, 'engineCalls': 0, 'engineSeconds': 0}})
        save()
        ready = sum(row['status'] == 'needs-editorial-review' for row in results)
        if need and ready >= need:
            break
    if not results:
        save()
    return report


def ready_candidate_ids(db, topic, level, current):
    """Prioritize usable prior work; callers still check the current bank revision."""
    from research_candidates import candidate_id
    if current is None:
        return []
    editorial = {**current, 'editorialCode': code_version('research_editorial.py')}
    rows = db.execute('''SELECT json_extract(payload,'$.record') FROM research_assessments
        WHERE topic=? AND level=? AND policy_key IN (?,?)
        AND outcome IN ('editorial-ready','unselected','tactical-ready')
        ORDER BY CASE kind WHEN 'editorial' THEN 0 ELSE 1 END, observed_at DESC,id DESC''',
        (topic, level, digest(current), digest(editorial)))
    return list(dict.fromkeys(candidate_id(topic, json.loads(row[0])) for row in rows))


def explain(db, game_id, topic=None, level=None, include_evidence=False):
    initialize(db)
    filters, values = ['game_id=?'], [game_id]
    for column, value in [('topic', topic), ('level', level)]:
        if value:
            filters.append(f'{column}=?'); values.append(value)
    rows = db.execute('SELECT event_key,topic,level,outcome,policy,payload,origin,observed_at FROM research_assessments '
                      'WHERE ' + ' AND '.join(filters) + ' ORDER BY observed_at DESC,id DESC', values)
    current = {}
    output = []
    for key, topic, level, outcome, context, payload, origin, at in rows:
        if topic not in current:
            current[topic] = current_policy(topic)
        context, payload = json.loads(context), json.loads(payload)
        expected = scoped_policy(current[topic], rule_versions(topic), level)
        if expected and 'editorialCode' in context:
            expected = {**expected, 'editorialCode': code_version('research_editorial.py')}
        record, result = payload['record'], payload['result']
        item = {'assessmentId': key, 'topic': topic, 'level': level, 'status': outcome,
                'objective': record.get('goal'), 'fen': record['fen'], 'moves': record['moves'],
                'recordRevision': digest(record), 'matchesCurrentPolicy': context == expected,
                'flags': result['flags'], 'reason': payload.get('decision', {}).get('reason'),
                'origin': origin, 'observedAt': at}
        if include_evidence:
            item.update(policy=context, evidence=payload)
        output.append(item)
    owner = [{'topic': t, 'level': l, 'status': s, 'reason': reason}
             for t,l,s,reason in db.execute('SELECT topic,level,status,reason FROM research_decisions WHERE game_id=?',
                                            (game_id,))]
    return {'gameId': game_id, 'authoritativeDecisions': owner, 'history': output,
            'publicationApproved': False}


def coverage(db):
    """Expose the whole taxonomy, separating evidence support from target levels."""
    from research_run import SOURCE_LEVELS
    initialize(db)
    rows = Counter({(t, l): n for t, l, n in db.execute(
        'SELECT topic,level,count(*) FROM research_assessments GROUP BY topic,level')})
    bank = Counter({(t,l): n for t,l,n in db.execute(
        'SELECT topic,level,count(*) FROM research_candidate_positions GROUP BY topic,level')})
    catalog = json.loads((ROOT / 'scripts/fixtures/tactics-index/tactics-map.json').read_text())
    topics = []
    for theme in catalog['themes']:
        topic = {'discoveredAttack': 'discovery', 'hangingPiece': 'hanging-piece',
                 'defensiveMove': 'defensive-move', 'mateIn1': 'mate-in-one'}.get(theme['id'], theme['id'])
        topics.append({'id': theme['id'], 'detector': theme.get('detector'), 'levels': [
            {'level': level, 'sourceReviewSupported': level in SOURCE_LEVELS.get(topic, ()),
             'plannedSuitability': (level in theme['levels']) if 'levels' in theme else None,
             'storedLeadRows': bank[(topic, level)],
             'historicalAssessments': rows[(topic, level)]} for level in LEVELS]})
    return {'topics': topics, 'publicationApproved': False}


def backup(db, output):
    output = Path(output)
    output.parent.mkdir(parents=True, exist_ok=True)
    # Exclusive creation prevents clobbering a prior backup or the live index.
    with output.open('xb'):
        pass
    try:
        target = sqlite3.connect(output)
        try:
            db.backup(target)
            if target.execute('PRAGMA quick_check').fetchone()[0] != 'ok':
                raise ValueError('Research backup integrity check failed')
        finally:
            target.close()
    except BaseException:
        output.unlink()
        raise
    return {'backup': str(output.resolve()), 'integrity': 'ok'}
