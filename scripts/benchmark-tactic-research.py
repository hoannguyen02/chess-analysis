#!/usr/bin/env python3
"""Measure the legacy three-pass review and the same staged checks on one batch."""
import argparse
import json
from pathlib import Path
import platform
import subprocess
import sys
import tempfile
import time

from tactic_research import ROOT, atomic_json, digest, CachedEngine
from research_workflow import run_review, SETTINGS, verification_code


def quality_passed(report):
    if not report['quality']['baselineRootCoverageExact']:
        return False
    checks = [run['quality'] for run in report['runs'] if run['mode'] == 'optimized-cold']
    return bool(checks) and all(
        row['allHistoricalApprovalsReachEditorialReview']
        and row['declinedOffersCaughtEarly']
        and row['everySurvivingCandidateCoversAllLegalRoots']
        and row['everySurvivingMateHasAllReplyProof']
        and row['decisionsMatchSerial']
        and row['warmDecisionsIdentical'] and row['warmEngineCalls'] == 0
        for row in checks)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', type=Path, default=ROOT / 'scripts/fixtures/research-benchmark/discovery-b.json')
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--workers', nargs='+', type=int, default=[1, 2, 4])
    args = parser.parse_args()
    fixture = json.loads(args.input.read_text())
    report = {'scope': fixture['scope'], 'inputSha256': digest(fixture['records']),
              'cases': len(fixture['records']), 'settings': SETTINGS, 'platform': platform.platform(),
              'python': sys.version.split()[0], 'runs': [], 'quality': {}}
    report['verificationCodeSha256'] = verification_code()
    engine = CachedEngine(cache=None)
    report['engine'] = {**engine.id, **engine.identity}
    engine.quit()
    with tempfile.TemporaryDirectory(prefix='tactic-benchmark-') as directory:
        work = Path(directory)
        batch = work / 'batch.json'
        atomic_json(batch, {'records': fixture['records']})
        commands = [
            ['review-discovery-upper.py', '--input', str(batch), '--output', str(work / 'roots.json'), '--nodes', '1000000', '--no-cache'],
            ['check-discovery-shortcuts.py', '--input', str(batch), '--analysis', str(work / 'roots.json'), '--output', str(work / 'shortcuts.json')],
            ['review-discovery-second-pass.py', '--input', str(batch), '--output', str(work / 'timeline.json'), '--no-cache'],
        ]
        started, stages = time.perf_counter(), {}
        for command in commands:
            then = time.perf_counter()
            result = subprocess.run([sys.executable, str(ROOT / 'scripts' / command[0]), *command[1:]],
                                    capture_output=True, text=True)
            if result.returncode:
                raise RuntimeError(result.stderr)
            stages[command[0]] = time.perf_counter() - then
            print(command[0], f'{stages[command[0]]:.2f}s', flush=True)
        report['runs'].append({'mode': 'legacy-three-pass', 'workers': 1,
                               'wallSeconds': time.perf_counter() - started, 'stages': stages})
        baseline = json.loads((work / 'roots.json').read_text())['reviews']
        report['quality']['baselineLegalRoots'] = sum(len(row['roots']) for row in baseline)
        report['quality']['baselineRootCoverageExact'] = all(
            len(row['roots']) == __import__('chess').Board(row['fen']).legal_moves.count() for row in baseline)
        atomic_json(args.output, report)
        historical = set(fixture['historicallyApprovedIds'])
        serial_decisions = None
        for workers in args.workers:
            cache = work / f'cold-{workers}.sqlite'
            cold = run_review(fixture['records'], workers=workers, cache=cache, require_provenance=False,
                              output=work / f'cold-{workers}.json')
            warm = run_review(fixture['records'], workers=workers, cache=cache, require_provenance=False,
                              output=work / f'warm-{workers}.json')
            cold_by_id = {row['gameId']: row for row in cold['results']}
            cold_ready = {row['gameId'] for row in cold['results'] if row['status'] == 'needs-editorial-review'}
            decisions = lambda report: {row['gameId']: [row['status'], row['flags'], row['recordHash']]
                                        for row in report['results']}
            cold_decisions = decisions(cold)
            if serial_decisions is None:
                serial_decisions = cold_decisions
            check = {
                'allHistoricalApprovalsReachEditorialReview': historical <= cold_ready,
                'historicalApprovalsNeedingFollowup': sorted(historical - cold_ready),
                'declinedOffersCaughtEarly': all('offered-material-needs-level-review' in cold_by_id[key]['flags'] for key in fixture['mustFlagOffers']),
                'everySurvivingCandidateCoversAllLegalRoots': all(
                    len(row['analysis']['roots']) == __import__('chess').Board(row['fen']).legal_moves.count()
                    for row in cold['results'] if row['status'] == 'needs-editorial-review'),
                'everySurvivingMateHasAllReplyProof': all(row.get('mateProof', {}).get('status') == 'proved'
                    for row in cold['results'] if row['status'] == 'needs-editorial-review'
                    and next(r for r in fixture['records'] if r['gameId'] == row['gameId'])['goal'] == 'mate'),
                'decisionsMatchSerial': cold_decisions == serial_decisions,
                'warmDecisionsIdentical': cold_decisions == decisions(warm),
                'warmEngineCalls': warm['metrics']['engineCalls'],
            }
            report['runs'] += [{'mode': 'optimized-cold', 'workers': workers, **cold['metrics'], 'quality': check},
                               {'mode': 'optimized-warm', 'workers': workers, **warm['metrics']}]
            atomic_json(args.output, report)
            print(json.dumps({'workers': workers, 'cold': cold['metrics']['wallSeconds'],
                              'warm': warm['metrics']['wallSeconds'], 'quality': check}), flush=True)
        report['quality']['note'] = ('Historical approvals are regression leads, not permission to override newer owner decisions. '
                                   'Faster rejection is valid only for withheld candidates; every survivor keeps all checks. '
                                   'No result of this benchmark is publication approval.')
    report['quality']['passed'] = quality_passed(report)
    atomic_json(args.output, report)
    if not report['quality']['passed']:
        raise SystemExit('Benchmark quality regression: inspect the saved report before accepting speed claims')


if __name__ == '__main__':
    main()
