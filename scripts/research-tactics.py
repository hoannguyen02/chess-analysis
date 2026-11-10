#!/usr/bin/env python3
"""One entry point for cached source import, triage, review and approved bundles."""
import argparse
from contextlib import nullcontext
import json
import os
from pathlib import Path
import subprocess
import sys

from tactic_research import DEFAULT_CACHE, ROOT, atomic_json, default_workers
from research_workflow import prepare_publication, ADAPTERS
from research_run import RunLedger, SOURCE_LEVELS, WorkflowRun, file_binding
from tactics_catalog import PRACTICE_LEVELS

WORKSPACE_CACHE = Path(os.environ.get('CHESS_RESEARCH_CACHE', ROOT / 'research/scratch/tactics-engine-cache.sqlite'))


def addition_scope(values):
    result = {}
    for value in values:
        level, separator, count = value.partition('=')
        if not separator or not count.isdigit() or int(count) < 1 or level in result:
            raise ValueError('Use unique positive additions such as A=4 B=5')
        result[level] = int(count)
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest='command', required=True)
    compositions = commands.add_parser('review-compositions')
    compositions.add_argument('--topic', choices=['fork', 'hanging-piece'], required=True)
    compositions.add_argument('--input', type=Path, required=True)
    compositions.add_argument('--output', type=Path, required=True)
    compositions.add_argument('--workers', type=int, default=default_workers())
    compositions.add_argument('--cache', type=Path, default=DEFAULT_CACHE)
    review = commands.add_parser('review')
    review.add_argument('--topic', choices=ADAPTERS, required=True)
    selection = review.add_mutually_exclusive_group(required=True)
    selection.add_argument('--level', choices=PRACTICE_LEVELS)
    selection.add_argument('--levels', nargs='+', choices=PRACTICE_LEVELS)
    review.add_argument('--input', type=Path, required=True)
    review.add_argument('--output', type=Path, required=True)
    review.add_argument('--cache', type=Path, default=WORKSPACE_CACHE)
    review.add_argument('--workers', type=int, default=default_workers())
    review.add_argument('--batch-size', type=int, default=12)
    review.add_argument('--need', type=int, default=0, help='Stop after this many candidates await editorial review; never auto-approve')
    review.add_argument('--recheck', action='store_true', help='Explicitly re-review prior editorial decisions, still respecting owner removals/transfers')
    review.add_argument('--force-review', metavar='REASON', help='Reconsider matching withheld/deferred outcomes; owner decisions still apply')
    review.add_argument('--settings', type=Path, help='JSON search budgets; publication minimums still apply')
    review.add_argument('--index', type=Path)
    collect = commands.add_parser('collect')
    collect.add_argument('--topic', choices=ADAPTERS, required=True)
    selection = collect.add_mutually_exclusive_group(required=True)
    selection.add_argument('--level', choices=PRACTICE_LEVELS)
    selection.add_argument('--levels', nargs='+', choices=PRACTICE_LEVELS)
    collect.add_argument('--phase', choices=['tactics', 'tails'], default='tactics')
    collect.add_argument('--target', type=int, default=6,
                         help='Candidate leads per level, not approved exercises')
    collect.add_argument('--output', type=Path, required=True)
    collect.add_argument('--review-output', type=Path)
    collect.add_argument('--cache', type=Path, default=WORKSPACE_CACHE)
    collect.add_argument('--workers', type=int, default=default_workers())
    collect.add_argument('--index', type=Path)
    collect.add_argument('--input', type=Path, help='Optional complete-game corpus; otherwise reuse the source index')
    collect.add_argument('--max-games', type=int, default=0)
    collect.add_argument('--source-contains', action='append', default=[],
                         help='Limit indexed Pin or two-rook collection to matching archive URLs')
    collect.add_argument('--no-bank', action='store_true', help='Skip candidate lookup for a controlled cold collection run')
    collect.add_argument('--unplayed', action='store_true',
                         help='Expand Pin collection to verified-analysis leads from legal unplayed moves')
    collect.add_argument('--drawn-games', action='store_true',
                         help='Search indexed drawn games for Pin leads')
    for name in ('candidates-import', 'candidates', 'index-positions'):
        command = commands.add_parser(name)
        command.add_argument('--topic', choices=ADAPTERS, default='discovery')
        command.add_argument('--index', type=Path)
        if name == 'candidates-import':
            command.add_argument('--input', nargs='+', type=Path, required=True)
        elif name == 'candidates':
            command.add_argument('--levels', nargs='+', choices=PRACTICE_LEVELS, required=True)
            command.add_argument('--limit', type=int, default=12)
            command.add_argument('--recheck', action='store_true')
            command.add_argument('--memory-mode', choices=['reuse','stale','force'], default='reuse')
            command.add_argument('--reason', help='Required for forced lookup')
            command.add_argument('--aspect', action='append', help='Filter by one or more tactical coverage tags')
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
    sync.add_argument('--topic', choices=ADAPTERS, default='discovery')
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
    merge.add_argument('--coverage', type=Path, help='Final coverage checklist JSON; included before merge binding')
    merge.add_argument('--index', type=Path)
    for name in ('memory-backfill','memory-explain','memory-coverage','memory-backup','memory-retag'):
        command = commands.add_parser(name)
        command.add_argument('--index', type=Path)
        if name == 'memory-backfill':
            command.add_argument('--from-run', nargs='+', type=Path, required=True)
        if name == 'memory-explain':
            command.add_argument('--game-id', required=True)
            command.add_argument('--topic', choices=ADAPTERS)
            command.add_argument('--level', choices=PRACTICE_LEVELS)
            command.add_argument('--evidence', action='store_true', help='Include full review records and engine evidence')
        if name in ('memory-explain','memory-coverage','memory-backup'):
            command.add_argument('--output', type=Path, required=name == 'memory-backup')
        if name == 'memory-retag':
            command.add_argument('--topic', choices=ADAPTERS, required=True)
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
    for name in ('start-run', 'preflight', 'run-status', 'finish-run', 'stage-start', 'stage-finish', 'resolve-stage'):
        command = commands.add_parser(name)
        if name == 'start-run':
            command.add_argument('--task', required=True)
            command.add_argument('--topic', choices=ADAPTERS)
            command.add_argument('--additions', nargs='+', help='Requested additions, e.g. A=4 B=5')
        if name in ('start-run', 'preflight'):
            command.add_argument('--index', type=Path)
        if name == 'stage-start':
            command.add_argument('--name', required=True)
        if name == 'stage-finish':
            command.add_argument('--stage-id', required=True)
            command.add_argument('--status', choices=['complete', 'failed', 'interrupted'], default='complete')
            command.add_argument('--note', default='')
        if name == 'resolve-stage':
            command.add_argument('--failed-id', required=True)
            command.add_argument('--replacement-id', required=True)
    timing_commands = {'start-run', 'preflight', 'run-status', 'finish-run', 'stage-start', 'stage-finish', 'resolve-stage'}
    for name, command in commands.choices.items():
        command.add_argument('--run-file', type=Path, required=name in timing_commands,
                             help='Whole-workflow ledger; includes elapsed time between commands')
    args = parser.parse_args()
    if args.command in timing_commands:
        ledger = RunLedger(args.run_file)
        if args.command == 'start-run':
            if bool(args.topic) != bool(args.additions):
                parser.error('--topic and --additions must be supplied together')
            result = ledger.create(args.task)
            if args.topic:
                workflow = WorkflowRun(args.run_file)
                workflow.configure(args.topic, addition_scope(args.additions))
                workflow.preflight(args.index)
                result = ledger.summary()
        elif args.command == 'preflight':
            result = WorkflowRun(args.run_file).preflight(args.index)
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
    if (args.command == 'index-positions' and args.topic != 'discovery') or (
            args.command == 'collect' and args.topic not in ('discovery', 'hanging-piece', 'two-rook-mate', 'defensive-move', 'mate-in-one', 'pin')):
        raise ValueError(f'{args.topic}: implement a topic collection adapter before scanning; no Discovery fallback')
    if (args.command in ('collect', 'candidates') and 'Beginner' not in SOURCE_LEVELS.get(args.topic, ())
            and ('Beginner' in (args.levels or []) or getattr(args, 'level', None) == 'Beginner')):
        raise ValueError('This topic has no Beginner source research adapter')
    if args.command == 'collect' and args.topic in ('hanging-piece', 'defensive-move', 'mate-in-one', 'pin') and args.phase != 'tactics':
        raise ValueError(f'{args.topic} supports the tactics phase')
    if args.command == 'collect' and args.source_contains and args.topic not in ('two-rook-mate', 'pin'):
        raise ValueError('Shared archive filtering is supported by Pin and two-rook collection')
    if args.command == 'collect' and (args.unplayed or args.drawn_games) and args.topic != 'pin':
        raise ValueError('Unplayed-move and drawn-game collection currently support Pin')
    if args.command == 'review-compositions':
        if args.topic == 'hanging-piece':
            from hanging_piece_beginner import review_compositions
        else:
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
        workflow = WorkflowRun(args.run_file)
        workflow.check_review(report)
        if args.command == 'editorial-packets':
            result = prepare_editorial(report, args.output_dir, reviewers=args.reviewers)
            workflow.packets(args.review, args.output_dir / 'manifest.json')
            if ledger:
                ledger.require('Editorial decisions: ' + result['reportHash'],
                               evidence=str(args.output_dir / 'manifest.json'))
        else:
            workflow.check_packets(args.review, args.packets)
            result = merge_editorial(report, args.decisions, args.output,
                                     packet_manifest=args.packets,
                                     coverage_checklist=json.loads(args.coverage.read_text()) if args.coverage else None)
            from research_index import connect, DEFAULT_INDEX
            from research_memory import remember_report
            db = connect(args.index or DEFAULT_INDEX)
            try:
                manifest = json.loads(args.packets.read_text())
                metadata['memory'] = remember_report(db, report, args.output,
                    decisions=result['reviews'] + result.get('deferred', []),
                    editorial_code=manifest['editorialCodeSha256'])
            finally:
                db.close()
            workflow.merged(args.review, args.packets,
                            [*args.decisions, *([args.coverage] if args.coverage else [])], args.output)
            if ledger:
                ledger.require('Editorial decisions: ' + result['reportHash'], True, str(args.output))
        metadata['output'] = str(args.output_dir if args.command == 'editorial-packets' else args.output)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return
    if args.command in ('finish-batch', 'inspect-batch', 'approve-visual'):
        if (args.command == 'finish-batch'
                and json.loads(args.review.read_text()).get('topic') not in ADAPTERS):
            raise ValueError('Implement a topic publication adapter before finish-batch')
        from research_finish import finish_batch, inspect_batch, approve_visual_review
        if args.command == 'finish-batch':
            result = finish_batch(args.review, args.decisions, args.manifest, args.output_dir,
                                  run_path=args.run_file,
                                  rehearsal=not args.apply, stage_callback=ledger.record if ledger else None)
        elif args.command == 'inspect-batch':
            result = inspect_batch(args.manifests, args.output_dir,
                                   stage_callback=ledger.record if ledger else None)
        else:
            prepared = json.loads(args.report.read_text())
            if prepared['mode'] in ('new-approved-publication', 'new-approved-rehearsal') and (
                    args.run_file is None or not prepared.get('runPath')
                    or args.run_file.resolve() != Path(prepared['runPath']).resolve()):
                raise ValueError('approve-visual requires the same --run-file as finish-batch')
            result = approve_visual_review(args.report, args.note, reviewer=args.reviewer)
        if ledger:
            report_path = args.report if args.command == 'approve-visual' else args.output_dir / 'finish-report.json'
            key = 'PDF visual review: ' + str(report_path.resolve())
            if args.command == 'approve-visual':
                pending = ledger.summary()['requirements'].get(key, {}).get('evidence')
                if isinstance(pending, dict) and pending.get('stageId'):
                    ledger.end(pending['stageId'], metadata={'report': str(report_path), 'note': args.note})
                ledger.require(key, True, file_binding(report_path))
            else:
                stage_id = ledger.begin('visual-review-window', {'report': str(report_path)})
                ledger.require(key, evidence={'reportPath': str(report_path), 'stageId': stage_id})
        summary = {key: result.get(key) for key in ('status', 'mode', 'reportPath', 'previewPaths', 'wallSeconds')}
        metadata['result'] = summary
        print(json.dumps(summary, ensure_ascii=False, indent=2))
        return
    if args.command == 'prepare-publication':
        WorkflowRun(args.run_file).check_publication(args.review, args.decisions)
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
    if args.command in ('collect', 'review', 'index-positions', 'export-games', 'import-corpus'):
        workflow = WorkflowRun(args.run_file)
        workflow.ready(getattr(args, 'topic', None),
                       getattr(args, 'levels', None) or ([args.level] if getattr(args, 'level', None) else []))
    from research_index import connect, DEFAULT_INDEX, import_corpus, sync_topic_decisions, disposition, export_games
    from research_positions import active_positions, overlaps
    db = connect(args.index or DEFAULT_INDEX)
    try:
        if args.command.startswith('memory-'):
            from research_memory import backfill_run, explain, coverage, backup
            from research_candidates import refresh_aspects
            if args.command == 'memory-backfill':
                result = {'runs': [backfill_run(db, path) for path in args.from_run]}
            elif args.command == 'memory-explain':
                for topic in [args.topic] if args.topic else ADAPTERS:
                    sync_topic_decisions(db, topic)
                result = explain(db, args.game_id, args.topic, args.level, args.evidence)
            elif args.command == 'memory-coverage':
                from research_candidates import initialize
                initialize(db)
                result = coverage(db)
            elif args.command == 'memory-retag':
                result = refresh_aspects(db, args.topic)
            else:
                result = backup(db, args.output)
            metadata['result'] = {key:value for key,value in result.items() if key not in ('history','topics')}
            if args.command in ('memory-explain','memory-coverage') and args.output:
                atomic_json(args.output, result)
                print(args.output)
            else:
                print(json.dumps(result, ensure_ascii=False, indent=2))
        elif args.command == 'import-corpus':
            print(json.dumps(import_corpus(db, args.input, json.loads(args.manifest.read_text()), args.index_motifs), indent=2))
        elif args.command == 'sync-decisions':
            print(json.dumps(sync_topic_decisions(db, args.topic), indent=2))
        elif args.command == 'export-games':
            print(export_games(db, args.output), 'complete source games exported')
        elif args.command == 'collect':
            from research_candidates import bootstrap_candidates, query_candidates, import_candidates
            from research_collection import collect_parallel
            sync_topic_decisions(db, args.topic)
            levels = args.levels or [args.level]
            published_positions = active_positions()
            with ledger.stage('candidate-lookup') if ledger else nullcontext({}) as lookup:
                bootstrap_candidates(db, topic=args.topic)
                bank = {'records': [], 'metrics': {}} if args.no_bank else query_candidates(
                    db, args.topic, levels, limit=args.target * len(levels),
                    published_positions=published_positions)
                lookup.update(bank.get('metrics', {}))
            if args.topic == 'defensive-move':
                levels = sorted(levels, key=('D', 'C', 'B', 'A', 'Beginner').index)
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
                    if args.topic == 'two-rook-mate':
                        if args.input:
                            raise ValueError('Import the full corpus into the index before two-rook collection')
                        from collect_two_rook_mate import collect
                        scanned = collect(db, cache=args.cache, workers=args.workers,
                                          output=args.output.with_suffix('.collection.json'),
                                          max_games=args.max_games, levels=missing,
                                          target=args.target, existing=selected, phase=args.phase,
                                          source_filters=args.source_contains)
                        source_metrics.update(scanned['metrics'])
                    elif args.topic in ('mate-in-one', 'pin'):
                        if args.input:
                            raise ValueError('Import the full corpus into the index before collection')
                        from importlib import import_module
                        collect = import_module(ADAPTERS[args.topic]).collect
                        collection = args.output.with_suffix('.collection.json')
                        scan_options = {}
                        if args.topic == 'pin':
                            scan_options.update(unplayed=args.unplayed, drawn_games=args.drawn_games,
                                                source_filters=args.source_contains)
                        scanned = collect(db, cache=args.cache, workers=args.workers, output=collection,
                                          levels=missing, target=args.target, max_games=args.max_games,
                                          existing=selected, **scan_options)
                        source_metrics.update(scanned['metrics'])
                        import_candidates(db, scanned['records'], topic=args.topic,
                                          origin=str(collection), stage='screened')
                    else:
                        corpus = args.input or args.cache.parent / 'indexed-games.json'
                        if not args.input:
                            export_games(db, corpus)
                        games = json.loads(corpus.read_text())['records']
                    if args.topic == 'hanging-piece':
                        from collect_hanging_piece import collect
                        geometry_output = args.output.with_suffix('.collection.json')
                        scanned = collect(games, cache=args.cache, workers=args.workers,
                                          output=geometry_output, max_games=args.max_games)
                        source_metrics.update(scanned['metrics'])
                        import_candidates(db, scanned['records'], topic=args.topic,
                                          origin=str(geometry_output), stage='screened')
                    elif args.topic == 'defensive-move':
                        from collect_defensive_move import collect
                        collection = args.output.with_suffix('.collection.json')
                        protected_games = {
                            row[0] for row in db.execute(
                                "SELECT game_id FROM research_decisions WHERE topic=? "
                                "AND status IN ('approved','manual','removed','transferred')", (args.topic,)
                            ) if row[0]
                        } | selected_ids
                        scanned = collect(games, cache=args.cache, workers=args.workers,
                                          output=collection, max_games=args.max_games,
                                          levels=missing, target=args.target,
                                          protected_games=protected_games)
                        source_metrics.update(scanned['metrics'])
                        import_candidates(db, scanned['records'], topic=args.topic,
                                          origin=str(collection), stage='screened')
                        scanned['records'].sort(key=lambda row: (('D', 'C', 'B', 'A', 'Beginner').index(row['level']),
                                                                not row['screen']['played']))
                    elif args.topic == 'discovery':
                        scanned = collect_parallel(
                            db, games, topic=args.topic, levels=missing, phase=args.phase,
                            target=args.target, cache=args.cache, workers=args.workers,
                            max_games=args.max_games, output=args.output, use_bank=not args.no_bank,
                            exclude_game_ids=[r['gameId'] for r in selected if r['level'] not in missing])
                    source_metrics.update(engineStats=scanned.get('engineStats'),
                                          sourceGamesReplayed=scanned.get('sourceGamesReplayed'),
                                          bankHits=scanned.get('bankHits'),
                                          screenCacheHits=scanned.get('screenCacheHits'),
                                          requestedLeadTargetMet=scanned.get('requestedLeadTargetMet'))
                seen = {r['gameId'] for r in selected}
                for record in scanned['records']:
                    if (record['level'] in missing and record['gameId'] not in seen
                            and not overlaps(published_positions, args.topic, record['fen'])
                            and (args.topic != 'defensive-move' or record['level'] not in ('Beginner', 'D')
                                 or disposition(db, args.topic, record) is None)
                            and sum(r['level'] == record['level'] for r in selected) < args.target):
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
                    from research_memory import review_with_memory
                    reviewed = review_with_memory(db, records, args.topic, cache=args.cache, workers=args.workers,
                                                  output=args.review_output)
                    workflow.reviewed(args.review_output)
                    review_metrics.update(reviewed['metrics'])
            print(json.dumps({'output': str(args.output), 'candidates': len(selected),
                              'sourceScanSkipped': report['sourceScanSkipped'],
                              'candidateLookup': report['candidateLookup']}, indent=2))
        elif args.command in ('candidates-import', 'candidates', 'index-positions'):
            from research_candidates import bootstrap_candidates, query_candidates
            sync_topic_decisions(db, args.topic)
            if args.command == 'candidates-import':
                result = bootstrap_candidates(db, paths=args.input, topic=args.topic)
            elif args.command == 'candidates':
                if args.memory_mode == 'force' and not (args.reason or '').strip():
                    raise ValueError('Forced candidate lookup requires --reason')
                bootstrap_candidates(db, topic=args.topic)
                result = query_candidates(db, args.topic, args.levels, limit=args.limit, recheck=args.recheck,
                                          aspect_filters=args.aspect, memory_mode=args.memory_mode,
                                          published_positions=active_positions())
                if args.reason:
                    result['lookupReason'] = args.reason
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
            from research_memory import review_with_memory
            sync_topic_decisions(db, args.topic)
            records = json.loads(args.input.read_text())['records']
            published_positions = active_positions()
            levels = args.levels or [args.level]
            selected, skipped = [], []
            for record in records:
                if record['level'] not in levels:
                    continue
                matches = overlaps(published_positions, args.topic, record['fen'])
                if matches:
                    skipped.append({'gameId': record['gameId'], 'status': 'cross-topic-overlap',
                                    'matches': matches})
                    continue
                old = disposition(db, args.topic, record)
                if old and (not args.recheck or old['status'] in ('removed', 'transferred', 'manual')):
                    skipped.append({'gameId': record['gameId'], **old})
                else:
                    selected.append(record)
            result = review_with_memory(db, selected, args.topic, cache=args.cache, workers=args.workers,
                                        batch_size=args.batch_size, need=args.need, output=args.output,
                                        force=args.force_review,
                                        settings=json.loads(args.settings.read_text()) if args.settings else None)
            result['skippedPriorDecisions'] = skipped
            atomic_json(args.output, result)
            workflow.reviewed(args.output)
            metadata.update(result['metrics'])
            print(json.dumps(result['metrics'], indent=2))
    finally:
        db.close()


if __name__ == '__main__':
    main()
