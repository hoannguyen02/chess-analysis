#!/usr/bin/env python3
"""Known-position full-workflow rehearsal, with real parallel editorial/visual review.

Preparation stops for actual editorial decisions. Finish generates isolated
builds/checks/PDFs. Record visual inspection separately before the report phase.
This never claims to measure fresh discovery of new chess positions.
"""
import argparse
import json
from pathlib import Path

from tactic_research import ROOT, DEFAULT_CACHE, atomic_json
from research_index import connect, sync_discovery
from research_candidates import import_candidates, query_candidates
from research_workflow import run_review
from research_editorial import prepare_editorial, merge_editorial
from research_finish import inspect_batch, snapshot
from research_run import RunLedger

MANIFESTS = [ROOT / 'scripts/fixtures/discovery' / name for name in
             ('level-b-expansion-20261105b.json', 'level-c-expansion-20261105.json')]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('phase', choices=['prepare', 'finish', 'report'])
    parser.add_argument('--work-dir', type=Path, required=True)
    parser.add_argument('--cache', type=Path, default=DEFAULT_CACHE)
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    work = args.work_dir.resolve()
    work.mkdir(parents=True, exist_ok=True)
    ledger = RunLedger(work / 'run.json')
    if args.phase == 'prepare':
        ledger.create('Known four-position full-workflow rehearsal; includes actual agent and PDF review')
        atomic_json(work / 'source-before.json', snapshot(ROOT))
        db = connect(work / 'candidate-index.sqlite')
        try:
            with ledger.stage('candidate-import') as metrics:
                sync_discovery(db)
                records = [record for path in MANIFESTS
                           for record in json.loads(path.read_text())['records']]
                metrics.update(import_candidates(db, records, origin='known-four-rehearsal'))
            with ledger.stage('candidate-lookup') as metrics:
                bank = query_candidates(db, 'discovery', ['B', 'C'], limit=4, recheck=True)
                metrics.update(bank['metrics'])
                if len(bank['records']) != 4:
                    raise ValueError('Current owner decisions exclude a rehearsal input; do not override them')
        finally:
            db.close()
        with ledger.stage('tactical-review') as metrics:
            report = run_review(bank['records'], cache=args.cache, workers=4, output=work / 'review.json')
            metrics.update(report['metrics'])
        with ledger.stage('editorial-packet-generation') as metrics:
            packets = prepare_editorial(report, work / 'editorial', reviewers=4)
            metrics['packets'] = len(packets['packets'])
        ledger.require('editorial-review', evidence=str(work / 'editorial/manifest.json'))
        print(json.dumps(packets, indent=2))
    elif args.phase == 'finish':
        manifest = json.loads((work / 'editorial/manifest.json').read_text())
        paths = [work / 'editorial' / row['decisionFile'] for row in manifest['packets']]
        with ledger.stage('editorial-merge'):
            merged = merge_editorial(work / 'review.json', paths, work / 'decisions.json',
                                     packet_manifest=work / 'editorial/manifest.json')
            if len([r for r in merged['reviews'] if r['decision'] == 'keep']) != 4:
                raise ValueError('A candidate needs follow-up; do not claim the four-position rehearsal passed')
        ledger.require('editorial-review', True, str(work / 'decisions.json'))
        with ledger.stage('publication-and-PDF-rehearsal'):
            report = inspect_batch(MANIFESTS, work / 'finish', stage_callback=ledger.record)
        stage_id = ledger.begin('visual-review-window', {'report': report['reportPath']})
        ledger.require('PDF visual review: ' + str((work / 'finish/finish-report.json').resolve()),
                       evidence={'reportPath': report['reportPath'], 'stageId': stage_id})
        print(json.dumps({'status': report['status'], 'reportPath': report['reportPath'],
                          'previewPaths': report['previewPaths']}, indent=2))
    else:
        before = json.loads((work / 'source-before.json').read_text())
        if snapshot(ROOT, tuple(before)) != before:
            raise ValueError('Live source bank changed during the read-only rehearsal')
        finish = json.loads((work / 'finish/finish-report.json').read_text())
        if finish['status'] != 'complete' or not finish.get('visualReview'):
            raise ValueError('Actual visual inspection is still pending')
        result = ledger.finish()
        result.update(scope='Retrospective known-position workflow: candidate lookup, tactical review, '
                            'actual parallel editorial review, isolated build/tests/PDFs and actual visual inspection. '
                            'No fresh source research or new exercise publication was needed.',
                      sourceBankUnchanged=True,
                      finishStages=finish['stages'])
        if args.output:
            atomic_json(args.output, result)
        print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
