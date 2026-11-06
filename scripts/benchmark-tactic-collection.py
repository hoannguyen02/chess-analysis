#!/usr/bin/env python3
"""Compare serial/parallel source indexing and exact-budget shortlist screening.

Fresh isolated databases/caches are used for every worker count. This measures
collection stages only, not discovering and editorially approving new exercises.
"""
import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import platform
import sys
import tempfile
import time

from tactic_research import ROOT, CachedEngine, atomic_json, code_version, digest
from research_index import connect
from research_candidates import import_candidates, query_candidates
from research_collection import SCREEN_SETTINGS, collect_parallel, index_positions, input_hash
from research_finish import snapshot


def inputs(path=None, limit=128):
    if path:
        data = json.loads(Path(path).read_text())
        rows = data['records'] if isinstance(data, dict) else data
    else:
        rows = [record for name in ('level-b-expansion-20261105b.json', 'level-c-expansion-20261105.json')
                for record in json.loads((ROOT / 'scripts/fixtures/discovery' / name).read_text())['records']]
    unique = {}
    for row in rows:
        if not all(key in row for key in ('gameFen', 'gameMoves', 'headers', 'source')):
            raise ValueError('Benchmark inputs require complete source games, not FEN/puzzle snippets')
        unique.setdefault(input_hash(row), row)
        if limit and len(unique) >= limit:
            break
    if not unique:
        raise ValueError('No complete input games')
    return list(unique.values())


def geometry_state(db):
    """Normalize every positive/negative game outcome and geometric position."""
    positions = db.execute('SELECT candidate_id,game_id,level,position_key,record,stage,phase,flags,aspects '
                           "FROM research_candidate_positions WHERE stage IN ('geometry','tail') "
                           'ORDER BY candidate_id').fetchall()
    normalized = [{**dict(zip(('candidateId', 'gameId', 'level', 'positionKey', 'record', 'stage',
                              'phase', 'flags', 'aspects'), row)),
                   'record': json.loads(row[4]), 'flags': json.loads(row[7]), 'aspects': json.loads(row[8])}
                  for row in positions]
    counts = {}
    for row in normalized:
        if row['stage'] == 'geometry':
            counts[row['gameId']] = counts.get(row['gameId'], 0) + 1
    decisions = []
    for input_sha, game_key, status, raw in db.execute(
            'SELECT input_hash,game_key,status,detail FROM research_geometry_games ORDER BY input_hash'):
        detail = json.loads(raw)
        total = counts.get(detail.get('gameId'), 0)
        decisions.append({'inputHash': input_sha, 'gameKey': game_key, 'status': status,
                          'geometricPositions': total, 'positive': total > 0,
                          'sourcePlies': detail.get('sourcePlies'), 'error': detail.get('error')})
    return {'gameDecisions': decisions, 'positions': normalized}


def lead_signature(records):
    return sorted([record['gameId'], record['fen'], record['level'], record.get('moves', [])]
                  for record in records)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', type=Path, help='Prepared complete-game JSON; default is the recent four source games')
    parser.add_argument('--limit', type=int, default=128, help='Distinct full games, in fixed input order; 0 means all')
    parser.add_argument('--shortlist', type=int, default=12, help='Same fixed B/C geometric shortlist for both screen runs')
    parser.add_argument('--workers', nargs='+', type=int, default=[1, 4])
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--cache-dir', type=Path, help='Parent of a fresh temporary work directory; temporary databases are removed')
    args = parser.parse_args()
    if args.limit < 0 or args.shortlist < 1 or not args.workers or any(w < 1 for w in args.workers):
        parser.error('limit must be nonnegative; shortlist/workers must be positive')
    if len(set(args.workers)) != len(args.workers):
        parser.error('Worker counts must be distinct')
    records = inputs(args.input, args.limit)
    before = snapshot(ROOT)
    report = {'schema': 1, 'dateUtc': datetime.now(timezone.utc).isoformat(),
              'scope': 'Collection stages on identical fixed complete games: cold geometry, exact-budget cold '
                       'shortlist screening, warm geometry reuse and saved-candidate lookup. '
                       'No new-position editorial approval, publication or PDF speed is claimed.',
              'inputGames': len(records), 'inputSha256': digest(records),
              'source': str(args.input) if args.input else 'Recent four published B/C source games',
              'platform': platform.platform(), 'python': sys.version.split()[0],
              'verificationCodeSha256': code_version('research_collection.py', 'research_candidates.py',
                                                    'tactic_research.py', 'benchmark-tactic-collection.py'),
              'screenSettings': dict(SCREEN_SETTINGS), 'shortlistLimit': args.shortlist,
              'cachePolicy': 'Fresh isolated geometry DB, screen DB and exact engine cache per worker count.',
              'runs': [], 'quality': {}}
    engine = CachedEngine(cache=None, options={'Threads': 1, 'Hash': 128})
    try:
        report['engine'] = {**engine.id, **engine.identity}
    finally:
        engine.quit()
    if args.cache_dir:
        args.cache_dir.mkdir(parents=True, exist_ok=True)
    baseline_geometry = baseline_shortlist = baseline_leads = None
    with tempfile.TemporaryDirectory(prefix='tactic-collection-benchmark-', dir=args.cache_dir) as directory:
        work = Path(directory)
        for workers in args.workers:
            geometry_db = connect(work / f'geometry-{workers}.sqlite')
            screen_db = connect(work / f'screen-{workers}.sqlite')
            try:
                cold = index_positions(geometry_db, records, workers=workers)
                normalized = geometry_state(geometry_db)
                warm = index_positions(geometry_db, records, workers=workers)
                if warm['sourceGamesReplayed'] != 0 or geometry_state(geometry_db) != normalized:
                    raise AssertionError('Warm geometry changed decisions or replayed complete games')
                shortlist = query_candidates(geometry_db, 'discovery', ['B', 'C'],
                                             limit=args.shortlist, include_geometry=True, phase='tactics')['records']
                import_candidates(screen_db, shortlist, origin='fixed-benchmark-shortlist', stage='geometry')
                # An unreachable target exhausts this fixed shortlist (deduplicated
                # by source game) instead of changing stop decisions across workers.
                screened = collect_parallel(screen_db, levels=['B', 'C'], target=len(shortlist) + 1,
                                              records=(), workers=workers, use_bank=False,
                                              settings=dict(SCREEN_SETTINGS), cache=work / f'engine-{workers}.sqlite')
                leads = lead_signature(screened['records'])
                lookup_started = time.perf_counter()
                lookup = query_candidates(screen_db, 'discovery', ['B', 'C'])
                lookup_wall = time.perf_counter() - lookup_started
                if lookup['metrics']['sourceGamesReplayed'] != 0:
                    raise AssertionError('Saved-candidate lookup replayed source games')
                if not {digest(row) for row in leads} <= {digest(row) for row in lead_signature(lookup['records'])}:
                    raise AssertionError('Saved lookup lost a selected screened lead')
                if baseline_geometry is None:
                    baseline_geometry, baseline_shortlist, baseline_leads = normalized, lead_signature(shortlist), leads
                if normalized != baseline_geometry:
                    raise AssertionError('Serial/parallel positive or negative geometry decisions differ')
                if lead_signature(shortlist) != baseline_shortlist:
                    raise AssertionError('Serial/parallel screens did not receive the same exact shortlist')
                if leads != baseline_leads:
                    raise AssertionError('Serial/parallel selected game IDs, FENs or solution lines differ')
                decisions = normalized['gameDecisions']
                run = {'workers': workers,
                       'coldGeometry': cold, 'warmGeometry': warm,
                       'geometryDecisionsSha256': digest(normalized),
                       'positiveGames': sum(row['positive'] for row in decisions),
                       'negativeGames': sum(not row['positive'] and row['status'] == 'indexed' for row in decisions),
                       'shortlistPositions': len(shortlist), 'shortlistSha256': digest(shortlist),
                       'coldShortlistScreen': {key: screened[key] for key in
                           ('wallSeconds', 'counts', 'bankHits', 'screenCacheHits', 'engineStats', 'sourceGamesReplayed')},
                       'screenedLeads': len(leads), 'screenedLeadsSha256': digest(leads),
                       'warmSavedLookup': {'wallSeconds': lookup_wall, **lookup['metrics']},
                       'quality': {'allPositiveAndNegativeGeometryDecisionsMatch': True,
                                   'sameShortlist': True, 'sameSelectedLeadsAndLines': True,
                                   'warmGeometrySourceReplays': 0, 'warmLookupSourceReplays': 0,
                                   'coldScreenBankHits': screened['bankHits']}}
                if run['quality']['coldScreenBankHits']:
                    raise AssertionError('A cold shortlist screen reused saved candidate approvals')
                report['runs'].append(run)
                atomic_json(args.output, report)
                print(json.dumps({'workers': workers, 'coldGeometrySeconds': cold['wallSeconds'],
                                  'coldShortlistScreenSeconds': screened['wallSeconds'],
                                  'warmLookupSeconds': lookup_wall, 'screenedLeads': len(leads)}), flush=True)
            finally:
                geometry_db.close(); screen_db.close()
    unchanged = snapshot(ROOT) == before
    report['quality'] = {'passed': unchanged and bool(report['runs']), 'sourceBankUnchanged': unchanged,
                         'negativeGameOutcomesExercised': any(run['negativeGames'] for run in report['runs']),
                         'note': 'Negative-outcome coverage is stated separately when the fixed inputs contain none. '
                                 'Parallel speculative work may screen extra leads from a source game; selected results must match.'}
    atomic_json(args.output, report)
    if not report['quality']['passed']:
        raise SystemExit('Collection benchmark failed or the live source bank changed')


if __name__ == '__main__':
    main()
