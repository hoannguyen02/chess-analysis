"""Resumable batch orchestration; adapters must keep topic-specific proof gates."""
import atexit
from collections import Counter
from concurrent.futures import ProcessPoolExecutor
import json
from pathlib import Path
import time

from tactic_research import (CachedEngine, ResearchCache, candidate_key, code_version,
                             atomic_json, digest, ROOT)

SETTINGS = {'rootNodes': 1000000, 'prepNodes': 150000, 'defenceNodes': 500000,
            'shortcutBudget': 18000, 'mateBudget': 1000000}
ADAPTERS = {'discovery': 'discovery_research'}
_engine = _store = _policy = _adapter = None


def verification_code():
    return code_version('tactic_research.py', 'discovery_research.py',
                        'research_workflow.py', 'collect-discovery.py',
                        'build-discovery.py', 'review-discovery-upper.py',
                        'review-discovery-level-a.py',
                        'check-discovery-shortcuts.py', 'prove-discovery-mates.py')


def initialize_worker(topic, executable, cache, settings, complete, provenance):
    global _engine, _store, _policy, _adapter
    import importlib
    _adapter = importlib.import_module(ADAPTERS[topic])
    _engine = CachedEngine(executable, cache)
    _store = ResearchCache(cache) if cache else None
    _policy = {'topic': topic, 'settings': settings, 'complete': complete,
               'provenance': provenance, 'engine': _engine.identity,
               'code': verification_code()}
    atexit.register(_engine.quit)
    if _store:
        atexit.register(_store.close)


def review_one(record):
    key = candidate_key(_policy['topic'], record, _policy)
    cached = _store.get('review', key) if _store else None
    if cached is not None:
        return {**cached, 'reused': True, 'work': {'hits': 0, 'misses': 0, 'engineCalls': 0,
                                                 'engineSeconds': 0.0}}
    before = _engine.stats.copy()
    started = time.perf_counter()
    try:
        result = _adapter.review(record, _engine, _policy['settings'],
                                 _policy['complete'], _policy['provenance'])
    except (ValueError, KeyError, IndexError, AssertionError) as error:
        result = {'gameId': record.get('gameId'), 'status': 'withheld',
                  'recordHash': _adapter.record_hash(record),
                  'flags': ['invalid-or-incomplete-candidate'], 'error': str(error), 'timings': {}}
    finally:
        # python-chess owns a background event-loop thread. Close it before the
        # pool worker can exit; atexit alone runs too late during thread shutdown.
        _engine.stop_process()
    result['elapsedSeconds'] = time.perf_counter() - started
    # An incomplete bounded search is resumable, not an evergreen rejection.
    incomplete = any('unresolved' in flag or 'not-proved' in flag for flag in result['flags'])
    if _store and not incomplete:
        _store.put('review', key, result)
    return {**result, 'reused': False,
            'work': {name: _engine.stats[name] - before[name] for name in before}}


def run_review(records, topic='discovery', executable=None, cache=None, workers=1,
               settings=None, complete=False, require_provenance=True,
               batch_size=12, need=0, output=None, progress=True):
    if topic not in ADAPTERS:
        raise ValueError(f'{topic}: implement a topic adapter before tactical review; no generic approval fallback')
    if workers < 1 or batch_size < 1 or need < 0:
        raise ValueError('workers/batch-size must be positive and need nonnegative')
    settings = {**SETTINGS, **(settings or {})}
    if any(value <= 0 for value in settings.values()):
        raise ValueError('All verification budgets must be positive')
    started = time.perf_counter()
    rows, seen = [], set()
    pending = []
    for record in records:
        key = ' '.join(record['fen'].split()[:4])
        if key not in seen:
            seen.add(key)
            pending.append(record)
    report = {'schema': 1, 'topic': topic, 'settings': settings,
              'verificationCodeSha256': verification_code(),
              'quality': {'everyLegalRoot': True, 'shortcutBudget': settings['shortcutBudget'],
                          'allReplyMateProof': True, 'requiresEditorialApproval': True,
                          'requiresProvenance': require_provenance},
              'inputSha256': digest(records), 'inputCount': len(records),
              'distinctPositions': len(pending), 'workers': workers, 'batchSize': batch_size,
              'results': rows, 'candidates': pending}
    if cache:
        initialized = ResearchCache(cache)
        initialized.close()
    executor = ProcessPoolExecutor(max_workers=workers, initializer=initialize_worker,
                                   initargs=(topic, executable, cache, settings, complete, require_provenance))
    try:
        for start in range(0, len(pending), batch_size):
            batch = pending[start:start + batch_size]
            # Map results in input order, keeping output deterministic across workers.
            rows.extend(executor.map(review_one, batch))
            ready = sum(row['status'] == 'needs-editorial-review' for row in rows)
            report['complete'] = start + len(batch) == len(pending)
            report['metrics'] = metrics(rows, time.perf_counter() - started)
            if output:
                atomic_json(output, report)
                write_cards(Path(output).with_suffix('.md'), report)
            if progress:
                print(f'{len(rows)}/{len(pending)} reviewed; {ready} await editorial review; '
                      f'{report["metrics"]["engineCalls"]} engine calls; '
                      f'{report["metrics"]["wallSeconds"]:.2f}s', flush=True)
            if need and ready >= need:
                break
    finally:
        executor.shutdown(wait=True, cancel_futures=True)
    report['metrics'] = metrics(rows, time.perf_counter() - started)
    if output:
        atomic_json(output, report)
    return report


def metrics(rows, elapsed):
    stages = Counter()
    for row in rows:
        if not row.get('reused'):
            stages.update(row.get('timings', {}))
    return {'wallSeconds': elapsed, 'statusCounts': dict(Counter(row['status'] for row in rows)),
            'reviewCacheHits': sum(bool(row.get('reused')) for row in rows),
            **{name: sum(row['work'][name] for row in rows) for name in
               ('hits', 'misses', 'engineCalls', 'engineSeconds')},
            'stageWorkerSeconds': dict(stages),
            'fullyComparedLegalRoots': sum(len(row.get('analysis', {}).get('roots', [])) for row in rows)}


def write_cards(path, report):
    lines = ['# Tactical review packet', '',
             'Automatic results are leads. Publication requires a signed-off editorial decision.', '',
             '| Game ID | Level | Status | Line | Flags |', '| --- | --- | --- | --- | --- |']
    by_id = {record['gameId']: record for record in report['candidates']}
    for row in report['results']:
        record = by_id[row['gameId']]
        lines.append(f'| {row["gameId"]} | {record["level"]} | {row["status"]} | '
                     f'{" ".join(record["moves"])} | {", ".join(row["flags"])} |')
    for row in report['results']:
        if row['status'] != 'needs-editorial-review':
            continue
        record = by_id[row['gameId']]
        lines += ['', f'## {row["gameId"]}', '',
                  f'Record hash: `{row["recordHash"]}`', '', f'FEN: `{record["fen"]}`', '',
                  f'Line: {" ".join(record["moves"])}', '',
                  f'Initial material from the solving side: {row["preflight"]["initialMaterialCp"]} cp.', '',
                  f'Similarity cluster (review lead only): `{row["preflight"]["cluster"]}`', '',
                  'Review motif necessity, simpler alternatives, defensive choices, recovery, level and distinctness.', '']
        for step in row.get('timeline', {}).get('timeline', []):
            lines.append(f'- {step["move"]}: legal replies '
                         f'{", ".join(reply["move"] for reply in step["replies"])}; '
                         f'material change {step["materialGain"]} cp.')
    path.write_text('\n'.join(lines) + '\n')


def prepare_publication(report, decisions, output):
    """Build a durable approved bundle; never write directly to the live bank."""
    if not report['quality']['requiresProvenance']:
        raise ValueError('Benchmark-only reports cannot be published')
    from discovery_research import record_hash, provenance
    by_id = {r['gameId']: r for r in report['candidates']}
    results = {r['gameId']: r for r in report['results']}
    approved, reviews = [], []
    for decision in decisions['reviews']:
        if decision['decision'] != 'keep':
            continue
        ident = decision['gameId']
        record, result = by_id[ident], results[ident]
        if (result['status'] != 'needs-editorial-review' or result['flags']
                or result['recordHash'] != record_hash(record)
                or decision.get('recordHash') != result['recordHash']):
            raise ValueError(f'{ident}: missing current, clean tactical review or record-hash approval')
        if provenance(record):
            raise ValueError(f'{ident}: incomplete source provenance')
        for key in ('reason', 'distinctness', 'solutionVi', 'hintsVi'):
            if not decision.get(key):
                raise ValueError(f'{ident}: editorial {key} is required')
        if record['goal'] == 'mate' and result.get('mateProof', {}).get('status') != 'proved':
            raise ValueError(f'{ident}: all-reply mate proof missing')
        approved.append(record)
        reviews.append(decision)
    if not approved:
        raise ValueError('No explicitly approved records')
    if any(report.get('settings', {}).get(key, 0) < minimum for key, minimum in SETTINGS.items()):
        raise ValueError('Debug/shallow settings cannot replace the required verification budgets')
    if report.get('verificationCodeSha256') != verification_code():
        raise ValueError('Verification code changed or is missing; rerun review before publication')
    import chess
    from discovery_research import audit
    for record in approved:
        result = results[record['gameId']]
        board = chess.Board(record['fen'])
        roots = result.get('analysis', {}).get('roots', [])
        if {row['move'] for row in roots} != {board.san(move) for move in board.legal_moves}:
            raise ValueError('Every legal starting move must be compared before publication')
        if len(result.get('timeline', {}).get('timeline', [])) != (len(record['moves']) + 1) // 2:
            raise ValueError('Complete solver timeline missing')
        if record['goal'] == 'mate':
            proof = result['mateProof']
            if proof.get('fen') != record['fen']:
                raise ValueError('Mate proof position mismatch')
            audit.build.mate_lines(proof)
    bundle = {'topic': report['topic'], 'records': approved, 'reviews': reviews,
              'settings': report['settings'], 'reviewResults': [results[r['gameId']] for r in approved],
              'status': 'editorially-approved-bundle', 'reviewInputSha256': report['inputSha256']}
    atomic_json(output, bundle)
    return bundle
