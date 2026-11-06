#!/usr/bin/env python3
"""One entry point for cached source import, triage, review and approved bundles."""
import argparse
from contextlib import nullcontext
import json
from pathlib import Path
import subprocess
import sys

from tactic_research import DEFAULT_CACHE, ROOT, atomic_json, default_workers
from research_workflow import run_review, prepare_publication, ADAPTERS
from research_run import RunLedger


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest='command', required=True)
    compositions = commands.add_parser('review-compositions')
    compositions.add_argument('--topic', choices=['fork'], required=True)
    compositions.add_argument('--input', type=Path, required=True)
    compositions.add_argument('--output', type=Path, required=True)
    compositions.add_argument('--workers', type=int, default=default_workers())
    compositions.add_argument('--cache', type=Path, default=DEFAULT_CACHE)
    review = commands.add_parser('review')
    review.add_argument('--topic', choices=ADAPTERS, required=True)
    review.add_argument('--level', choices=['Beginner', 'A', 'B', 'C', 'C*', 'D'], required=True)
    review.add_argument('--input', type=Path, required=True)
    review.add_argument('--output', type=Path, required=True)
    review.add_argument('--cache', type=Path, default=DEFAULT_CACHE)
    review.add_argument('--workers', type=int, default=default_workers())
    review.add_argument('--batch-size', type=int, default=12)
    review.add_argument('--need', type=int, default=0, help='Stop after this many candidates await editorial review; never auto-approve')
    review.add_argument('--recheck', action='store_true', help='Explicitly re-review prior editorial decisions, still respecting owner removals/transfers')
    review.add_argument('--index', type=Path)
    collect = commands.add_parser('collect')
    collect.add_argument('--topic', choices=ADAPTERS, required=True)
    selection = collect.add_mutually_exclusive_group(required=True)
    selection.add_argument('--level', choices=['A', 'B', 'C', 'C*', 'D'])
    selection.add_argument('--levels', nargs='+', choices=['A', 'B', 'C', 'C*', 'D'])
    collect.add_argument('--phase', choices=['tactics', 'tails'], default='tactics')
    collect.add_argument('--target', type=int, default=6,
                         help='Candidate leads per level, not approved exercises')
    collect.add_argument('--output', type=Path, required=True)
    collect.add_argument('--review-output', type=Path)
    collect.add_argument('--cache', type=Path, default=DEFAULT_CACHE)
    collect.add_argument('--workers', type=int, default=default_workers())
    collect.add_argument('--index', type=Path)
    collect.add_argument('--input', type=Path, help='Optional complete-game corpus; otherwise reuse the source index')
    collect.add_argument('--max-games', type=int, default=0)
    collect.add_argument('--no-bank', action='store_true', help='Skip candidate lookup for a controlled cold collection run')
    for name in ('candidates-import', 'candidates', 'index-positions'):
        command = commands.add_parser(name)
        command.add_argument('--topic', choices=ADAPTERS, default='discovery')
        command.add_argument('--index', type=Path)
        if name == 'candidates-import':
            command.add_argument('--input', nargs='+', type=Path, required=True)
        elif name == 'candidates':
            command.add_argument('--levels', nargs='+', choices=['A', 'B', 'C', 'C*', 'D'], required=True)
            command.add_argument('--limit', type=int, default=12)
            command.add_argument('--recheck', action='store_true')
            command.add_argument('--output', type=Path, required=True)
        else:
            command.add_argument('--input', type=Path)
            command.add_argument('--workers', type=int, default=default_workers())
            command.add_argument('--max-games', type=int, default=0)
            command.add_argument('--output', type=Path, required=True)
    source = commands.add_parser('import-corpus')
    source.add_argument('--input', type=Path, required=True)
    source.add_argument('--manifest', type=Path, required=True)
    source.add_argument('--index', type=Path)
    source.add_argument('--index-motifs', action='store_true')
    sync = commands.add_parser('sync-decisions')
    sync.add_argument('--index', type=Path)
    export = commands.add_parser('export-games')
    export.add_argument('--index', type=Path)
    export.add_argument('--output', type=Path, required=True)
    package = commands.add_parser('prepare-publication')
    package.add_argument('--review', type=Path, required=True)
    package.add_argument('--decisions', type=Path, required=True)
    package.add_argument('--output', type=Path, required=True)
    package.add_argument('--format', choices=['bundle', 'discovery-expansion'], default='bundle')
    packets = commands.add_parser('editorial-packets')
    packets.add_argument('--review', type=Path, required=True)
    packets.add_argument('--output-dir', type=Path, required=True)
    packets.add_argument('--reviewers', type=int, default=default_workers())
    merge = commands.add_parser('editorial-merge')
    merge.add_argument('--review', type=Path, required=True)
    merge.add_argument('--decisions', nargs='+', type=Path, required=True)
    merge.add_argument('--packets', type=Path, required=True)
    merge.add_argument('--output', type=Path, required=True)
    finish = commands.add_parser('finish-batch')
    finish.add_argument('--review', type=Path, required=True)
    finish.add_argument('--decisions', type=Path, required=True)
    finish.add_argument('--manifest', type=Path, required=True)
    finish.add_argument('--output-dir', type=Path, required=True)
    finish.add_argument('--apply', action='store_true', help='Commit a successfully rehearsed approved batch; default rehearses in isolation')
    inspect = commands.add_parser('inspect-batch')
    inspect.add_argument('--manifests', nargs='+', type=Path, required=True)
    inspect.add_argument('--output-dir', type=Path, required=True)
    visual = commands.add_parser('approve-visual')
    visual.add_argument('--report', type=Path, required=True)
    visual.add_argument('--note', required=True)
    visual.add_argument('--reviewer', default='agent')
    for name in ('start-run', 'run-status', 'finish-run', 'stage-start', 'stage-finish', 'resolve-stage'):
        command = commands.add_parser(name)
        if name == 'start-run':
            command.add_argument('--task', required=True)
        if name == 'stage-start':
            command.add_argument('--name', required=True)
        if name == 'stage-finish':
            command.add_argument('--stage-id', required=True)
            command.add_argument('--status', choices=['complete', 'failed', 'interrupted'], default='complete')
            command.add_argument('--note', default='')
        if name == 'resolve-stage':
            command.add_argument('--failed-id', required=True)
            command.add_argument('--replacement-id', required=True)
    timing_commands = {'start-run', 'run-status', 'finish-run', 'stage-start', 'stage-finish', 'resolve-stage'}
    for name, command in commands.choices.items():
        command.add_argument('--run-file', type=Path, required=name in timing_commands,
                             help='Whole-workflow ledger; includes elapsed time between commands')
    args = parser.parse_args()
    if args.command in timing_commands:
        ledger = RunLedger(args.run_file)
        if args.command == 'start-run':
            result = ledger.create(args.task)
        elif args.command == 'finish-run':
            result = ledger.finish()
        elif args.command == 'stage-start':
            result = {'stageId': ledger.begin(args.name)}
        elif args.command == 'stage-finish':
            result = ledger.end(args.stage_id, args.status, {'note': args.note})
        elif args.command == 'resolve-stage':
            ledger.resolve(args.failed_id, args.replacement_id)
            result = ledger.summary()
        else:
            result = ledger.summary()
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return
    ledger = RunLedger(args.run_file) if args.run_file else None
    with ledger.stage(args.command) if ledger else nullcontext({}) as metadata:
        dispatch(args, ledger, metadata)


def dispatch(args, ledger=None, metadata=None):
    metadata = metadata if metadata is not None else {}
    if args.command == 'review-compositions':
        from beginner_tactics import review_compositions
        payload = json.loads(args.input.read_text())
        candidates = payload if isinstance(payload, list) else payload['candidates']
        result = review_compositions(candidates, args.topic, args.output,
                                     workers=args.workers, cache=args.cache)
        metadata.update(candidates=len(result['results']), wallSeconds=result['wallSeconds'])
        return
    if args.command in ('editorial-packets', 'editorial-merge'):
        from research_editorial import prepare_editorial, merge_editorial
        report = json.loads(args.review.read_text())
        if args.command == 'editorial-packets':
            result = prepare_editorial(report, args.output_dir, reviewers=args.reviewers)
            if ledger:
                ledger.require('Editorial decisions: ' + result['reportHash'],
                               evidence=str(args.output_dir / 'manifest.json'))
        else:
            result = merge_editorial(report, args.decisions, args.output,
                                     packet_manifest=args.packets)
            if ledger:
                ledger.require('Editorial decisions: ' + result['reportHash'], True, str(args.output))
        metadata['output'] = str(args.output_dir if args.command == 'editorial-packets' else args.output)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return
    if args.command in ('finish-batch', 'inspect-batch', 'approve-visual'):
        from research_finish import finish_batch, inspect_batch, approve_visual_review
        if args.command == 'finish-batch':
            result = finish_batch(args.review, args.decisions, args.manifest, args.output_dir,
                                  rehearsal=not args.apply, stage_callback=ledger.record if ledger else None)
        elif args.command == 'inspect-batch':
            result = inspect_batch(args.manifests, args.output_dir,
                                   stage_callback=ledger.record if ledger else None)
        else:
            result = approve_visual_review(args.report, args.note, reviewer=args.reviewer)
        if ledger:
            report_path = args.report if args.command == 'approve-visual' else args.output_dir / 'finish-report.json'
            key = 'PDF visual review: ' + str(report_path.resolve())
            if args.command == 'approve-visual':
                pending = ledger.summary()['requirements'].get(key, {}).get('evidence')
                if isinstance(pending, dict) and pending.get('stageId'):
                    ledger.end(pending['stageId'], metadata={'report': str(report_path), 'note': args.note})
                ledger.require(key, True, str(report_path))
            else:
                stage_id = ledger.begin('visual-review-window', {'report': str(report_path)})
                ledger.require(key, evidence={'reportPath': str(report_path), 'stageId': stage_id})
        summary = {key: result.get(key) for key in ('status', 'mode', 'reportPath', 'previewPaths', 'wallSeconds')}
        metadata['result'] = summary
        print(json.dumps(summary, ensure_ascii=False, indent=2))
        return
    if args.command == 'prepare-publication':
        report, decisions = json.loads(args.review.read_text()), json.loads(args.decisions.read_text())
        if args.format == 'discovery-expansion':
            import tempfile
            from research_publication import discovery_expansion
            with tempfile.TemporaryDirectory() as directory:
                bundle = prepare_publication(report, decisions, Path(directory) / 'approved.json')
                result = discovery_expansion(bundle, decisions, args.output)
        else:
            result = prepare_publication(report, decisions, args.output)
        print(f'{len(result["records"])} explicit approvals prepared; live exercise bank unchanged')
        return
    from research_index import connect, DEFAULT_INDEX, import_corpus, sync_discovery, disposition, export_games
    db = connect(args.index or DEFAULT_INDEX)
    try:
        if args.command == 'import-corpus':
            print(json.dumps(import_corpus(db, args.input, json.loads(args.manifest.read_text()), args.index_motifs), indent=2))
        elif args.command == 'sync-decisions':
            print(json.dumps(sync_discovery(db), indent=2))
        elif args.command == 'export-games':
            print(export_games(db, args.output), 'complete source games exported')
        elif args.command == 'collect':
            from research_candidates import bootstrap_candidates, query_candidates, import_candidates
            from research_collection import collect_parallel
            sync_discovery(db)
            levels = args.levels or [args.level]
            with ledger.stage('candidate-lookup') if ledger else nullcontext({}) as lookup:
                bootstrap_candidates(db)
                bank = {'records': [], 'metrics': {}} if args.no_bank else query_candidates(
                    db, args.topic, levels, limit=args.target * len(levels))
                lookup.update(bank.get('metrics', {}))
            selected = []
            selected_ids = set()
            for level in levels:
                for record in [r for r in bank['records'] if r['level'] == level]:
                    if record['gameId'] not in selected_ids and sum(r['level'] == level for r in selected) < args.target:
                        selected.append(record)
                        selected_ids.add(record['gameId'])
            missing = [level for level in levels if sum(r['level'] == level for r in selected) < args.target]
            report = {'records': selected, 'candidateLookup': bank.get('metrics', {}), 'sourceScanSkipped': not missing}
            if missing:
                with ledger.stage('source-collection') if ledger else nullcontext({}) as source_metrics:
                    corpus = args.input or args.cache.parent / 'indexed-games.json'
                    if not args.input:
                        export_games(db, corpus)
                    games = json.loads(corpus.read_text())['records']
                    scanned = collect_parallel(db, games, topic=args.topic, levels=missing, phase=args.phase,
                                               target=args.target, cache=args.cache, workers=args.workers,
                                               max_games=args.max_games, output=args.output,
                                               use_bank=not args.no_bank,
                                               exclude_game_ids=[r['gameId'] for r in selected if r['level'] not in missing])
                    source_metrics.update(engineStats=scanned.get('engineStats'),
                                          sourceGamesReplayed=scanned.get('sourceGamesReplayed'),
                                          bankHits=scanned.get('bankHits'),
                                          screenCacheHits=scanned.get('screenCacheHits'),
                                          requestedLeadTargetMet=scanned.get('requestedLeadTargetMet'))
                seen = {r['gameId'] for r in selected}
                for record in scanned['records']:
                    if record['gameId'] not in seen and sum(r['level'] == record['level'] for r in selected) < args.target:
                        selected.append(record)
                        seen.add(record['gameId'])
                report.update(sourceCollection={k: v for k, v in scanned.items() if k != 'records'})
            atomic_json(args.output, report)
            metadata.update(candidateLookup=report['candidateLookup'], candidates=len(selected),
                            sourceScanSkipped=report['sourceScanSkipped'])
            if args.review_output:
                records = [r for r in selected
                           if disposition(db, args.topic, r) is None]
                with ledger.stage('tactical-review') if ledger else nullcontext({}) as review_metrics:
                    reviewed = run_review(records, args.topic, cache=args.cache, workers=args.workers,
                                          output=args.review_output)
                    review_metrics.update(reviewed['metrics'])
            print(json.dumps({'output': str(args.output), 'candidates': len(selected),
                              'sourceScanSkipped': report['sourceScanSkipped'],
                              'candidateLookup': report['candidateLookup']}, indent=2))
        elif args.command in ('candidates-import', 'candidates', 'index-positions'):
            from research_candidates import bootstrap_candidates, query_candidates
            sync_discovery(db)
            if args.command == 'candidates-import':
                result = bootstrap_candidates(db, paths=args.input)
            elif args.command == 'candidates':
                bootstrap_candidates(db)
                result = query_candidates(db, args.topic, args.levels, limit=args.limit, recheck=args.recheck)
                atomic_json(args.output, result)
            else:
                from research_collection import index_positions
                corpus = args.input or args.output.parent / 'indexed-games.json'
                if not args.input:
                    export_games(db, corpus)
                games = json.loads(corpus.read_text())['records']
                result = index_positions(db, games, workers=args.workers, output=args.output,
                                         max_games=args.max_games)
            metadata['result'] = ({'output': str(args.output), 'candidates': len(result['records']),
                                    'skipped': len(result.get('skipped', [])), 'metrics': result['metrics']}
                                  if args.command == 'candidates' else result)
            print(json.dumps(metadata['result'], indent=2))
        elif args.command == 'review':
            sync_discovery(db)
            records = json.loads(args.input.read_text())['records']
            selected, skipped = [], []
            for record in records:
                if record['level'] != args.level:
                    continue
                old = disposition(db, args.topic, record)
                if old and (not args.recheck or old['status'] in ('removed', 'transferred', 'manual')):
                    skipped.append({'gameId': record['gameId'], **old})
                else:
                    selected.append(record)
            result = run_review(selected, args.topic, cache=args.cache, workers=args.workers,
                                batch_size=args.batch_size, need=args.need, output=args.output)
            result['skippedPriorDecisions'] = skipped
            atomic_json(args.output, result)
            print(json.dumps(result['metrics'], indent=2))
    finally:
        db.close()


if __name__ == '__main__':
    main()
