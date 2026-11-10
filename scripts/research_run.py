"""Whole-workflow timing, including time spent outside automated commands."""
from contextlib import contextmanager
from datetime import datetime, timezone
import fcntl
import hashlib
import json
from pathlib import Path
import time
from uuid import uuid4

from tactic_research import atomic_json, digest, ROOT


# Source-derived research only. Owner-authored Beginner positions keep their
# separate position-first path. Unsupported adapters/levels fail before engines.
# E and E* require explicit adapter support and depth verification before registration.
SOURCE_LEVELS = {'fork': {'A', 'B', 'D'},
                 # Discovery's earlier C* approvals use the previous depth rule.
                 'discovery': {'A', 'B', 'C', 'D'},
                 'defensive-move': {'Beginner', 'A', 'B', 'C', 'D'},
                 'hanging-piece': {'A', 'B', 'C*', 'D*'},
                 'mate-in-one': {'Beginner', 'A', 'B'},
                 'two-rook-mate': {'A', 'B', 'C', 'C*'},
                 'pin': {'Beginner', 'A'}, 'skewer': {'Beginner'}}


def file_binding(path):
    path = Path(path).resolve()
    return {'path': str(path), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}


def current_context(root=ROOT):
    names = ('AGENTS.md', 'docs/tactic-research-workflow.md',
             'scripts/research_run.py', 'scripts/research-tactics.py',
             'scripts/research_memory.py', 'scripts/research_candidates.py',
             'scripts/fixtures/tactics-index/research-rules.json',
             'scripts/research_editorial.py', 'scripts/research_finish.py',
             'scripts/research_positions.py', 'scripts/practice-position-index.cjs',
             'src/lib/chess/practice-position-key.ts',
             'src/lib/server/practice-adjustments.json',
             'src/lib/server/manual-tactics.json')
    from research_workflow import verification_code
    return {'files': [file_binding(Path(root) / name) for name in names],
            'verificationCodeSha256': verification_code()}


class WorkflowRun:
    """Command-produced receipts, separate from freely named timing stages.

    These checks prevent accidental bypass through the supported CLI/publication
    APIs. They are not a security boundary against somebody editing local files.
    """
    def __init__(self, path, root=ROOT):
        if path is None:
            raise ValueError('Source research requires --run-file and a scoped start-run')
        self.ledger, self.root = RunLedger(path), Path(root)

    def configure(self, topic, additions):
        if (topic not in SOURCE_LEVELS or not additions
                or any(level not in SOURCE_LEVELS[topic] or type(count) is not int or count < 1
                       for level, count in additions.items())):
            raise ValueError('Unsupported topic/level or invalid addition count; implement and test the adapter first')
        def change(data):
            if data is None or data['status'] != 'active':
                raise ValueError('Create an active run before declaring its scope')
            if data.get('workflow'):
                raise ValueError('Run scope already declared; preserve it when resuming')
            data['workflow'] = {'topic': topic, 'additions': additions, 'receipts': []}
        self.ledger.edit(change)

    def state(self):
        data = self.ledger.summary()
        if data['status'] != 'active' or not data.get('workflow'):
            raise ValueError('Use an active scoped start-run with --topic and --additions')
        return data['workflow']

    def preflight(self, index=None):
        """Read current instructions/owner data and actually query the saved bank."""
        from research_index import connect, DEFAULT_INDEX, sync_topic_decisions
        from research_candidates import bootstrap_candidates, query_candidates
        scope = self.state()
        with self.ledger.stage('workflow-preflight') as metadata:
            context = current_context(self.root)
            db = connect(index or DEFAULT_INDEX)
            try:
                decisions = sync_topic_decisions(db, scope['topic'])
                bootstrap_candidates(db, topic=scope['topic'])
                bank = query_candidates(db, scope['topic'], list(scope['additions']),
                                        limit=sum(scope['additions'].values()))
            finally:
                db.close()
            # Detect owner/instruction changes during the lookup too.
            if context != current_context(self.root):
                raise ValueError('Instructions or owner decisions changed during preflight; retry it')
            old = [row for row in scope['receipts'] if row['kind'] == 'preflight']
            if old and old[-1]['context'] != context:
                def invalidate(data):
                    for key, requirement in data['requirements'].items():
                        if requirement['status'] != 'pending' or not key.startswith(
                                ('Editorial decisions: ', 'PDF visual review: ')):
                            continue
                        requirement.update(status='superseded', reason='Preflight context changed; fresh receipts required')
                        stage_id = (requirement.get('evidence') or {}).get('stageId') if isinstance(
                            requirement.get('evidence'), dict) else None
                        for row in data['stages']:
                            if row['id'] == stage_id and row['status'] == 'running':
                                row.update(status='complete', finishedUtc=utcnow())
                                row['wallSeconds'] = instant(row['finishedUtc']) - instant(row['startedUtc'])
                                row['metadata']['outcome'] = 'superseded; no visual approval'
                self.ledger.edit(invalidate)
            metadata.update(index=str(index or DEFAULT_INDEX), decisions=decisions,
                            candidates=len(bank['records']), metrics=bank['metrics'])
            self.receipt('preflight', context=context, **metadata)
        return metadata

    def ready(self, topic=None, levels=()):
        scope = self.state()
        if (topic is not None and topic != scope['topic']) or any(
                level not in scope['additions'] for level in levels):
            raise ValueError('Research is outside the declared topic/level scope')
        context = current_context(self.root)
        if not any(row['kind'] == 'preflight' and row['context'] == context
                   for row in scope['receipts']):
            raise ValueError('Current preflight missing or stale; run preflight before research')
        return scope, context

    def receipt(self, kind, **values):
        row = {'kind': kind, 'recordedUtc': utcnow(), **values}
        def change(data):
            if data['status'] != 'active':
                raise ValueError('An active run is required')
            data['workflow']['receipts'].append(row)
        self.ledger.edit(change)

    @staticmethod
    def intact(bindings):
        return all(Path(row['path']).is_file() and file_binding(row['path']) == row
                   for row in bindings)

    def reviewed(self, path):
        report = json.loads(Path(path).read_text())
        _, context = self.ready(report['topic'], [r['level'] for r in report['candidates']])
        self.receipt('review', context=context, artifact=file_binding(path))

    @staticmethod
    def review_keys(report):
        from research_editorial import _evidence
        policy = {key: report[key] for key in ('topic', 'settings', 'quality', 'verificationCodeSha256')}
        records = {row['gameId']: row for row in report['candidates']}
        versions = report.get('researchRuleVersions', {})
        return {digest([policy, versions.get(records[row['gameId']]['level']),
                        records[row['gameId']], _evidence(row)]) for row in report['results']}

    def check_review(self, report):
        scope, context = self.ready(report['topic'], [r['level'] for r in report['candidates']])
        keys = set()
        for receipt in scope['receipts']:
            if (receipt['kind'] == 'review' and receipt['context'] == context
                    and self.intact([receipt['artifact']])):
                keys.update(self.review_keys(json.loads(Path(receipt['artifact']['path']).read_text())))
        wanted = self.review_keys(report)
        if not wanted or not wanted <= keys:
            raise ValueError('Exact tactical evidence was not produced by review in this current run')
        return context

    def packets(self, review, manifest):
        context = self.check_review(json.loads(Path(review).read_text()))
        self.receipt('packets', context=context, artifact=file_binding(manifest))

    def check_packets(self, review, manifest):
        context = self.check_review(json.loads(Path(review).read_text()))
        binding = file_binding(manifest)
        if not any(row['kind'] == 'packets' and row['context'] == context and row['artifact'] == binding
                   for row in self.state()['receipts']):
            raise ValueError('Prepare current editorial packets in this run before merging')
        return context

    def merged(self, review, manifest, inputs, output):
        context = self.check_packets(review, manifest)
        self.receipt('merge', context=context, reportHash=digest(json.loads(Path(review).read_text())),
                     artifact=file_binding(output), inputs=[file_binding(p) for p in [manifest, *inputs]])

    def check_publication(self, review, decisions):
        report = json.loads(Path(review).read_text())
        context = self.check_review(report)
        scope = self.state()
        if not any(row['kind'] == 'merge' and row['context'] == context
                   and row['reportHash'] == digest(report) and row['artifact'] == file_binding(decisions)
                   and self.intact(row['inputs']) for row in scope['receipts']):
            raise ValueError('Exact final decisions/copy must pass editorial-merge in this run')
        records = {r['gameId']: r for r in report['candidates']}
        selected = [records[r['gameId']] for r in json.loads(Path(decisions).read_text())['reviews']
                    if r['decision'] == 'keep']
        if not selected:
            raise ValueError('No selected additions in this batch')
        from collections import Counter
        prior = self.completed_publications()
        if {r['gameId'] for r in selected} & {r['gameId'] for r in prior}:
            raise ValueError('Selected additions were already published in this run')
        counts = Counter(r['level'] for r in [*prior, *selected])
        if any(count > scope['additions'].get(level, 0) for level, count in counts.items()):
            raise ValueError('Publication exceeds the declared additions; stop at the requested scope')
        return selected

    def completed_publications(self):
        records = []
        for key, row in self.ledger.summary()['requirements'].items():
            if not key.startswith('PDF visual review: ') or row['status'] != 'complete':
                continue
            binding = row.get('evidence')
            if not isinstance(binding, dict) or not self.intact([binding]):
                raise ValueError('Completed visual review needs its exact finish-report receipt')
            report = json.loads(Path(binding['path']).read_text())
            if report['mode'] != 'new-approved-publication':
                continue
            if (report['status'] != 'complete' or not report.get('visualReview')
                    or not report.get('runPath')
                    or Path(report['runPath']).resolve() != self.ledger.path.resolve()):
                raise ValueError('Publication has not completed visual review in this run')
            records.extend(report['workflowSelection'])
        return records

    def check_complete(self):
        from collections import Counter
        counts = Counter(row['level'] for row in self.completed_publications())
        if dict(counts) != self.state()['additions']:
            raise ValueError('Requested additions are not all published and visually inspected; report the remaining gap')


def check_workflow(run_path, review_path, decisions_path, root=ROOT):
    return WorkflowRun(run_path, root).check_publication(review_path, decisions_path)


def utcnow():
    return datetime.now(timezone.utc).isoformat(timespec='milliseconds')


def instant(value):
    return datetime.fromisoformat(value).timestamp()


class RunLedger:
    def __init__(self, path):
        self.path = Path(path)

    def edit(self, change):
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self.path.with_suffix(self.path.suffix + '.lock').open('a') as lock:
            fcntl.flock(lock, fcntl.LOCK_EX)
            data = json.loads(self.path.read_text()) if self.path.exists() else None
            result = change(data)
            atomic_json(self.path, data if data is not None else result)
            return result

    def create(self, task):
        def change(data):
            if data is not None:
                raise ValueError('Run ledger already exists; resume it or use another path')
            return {'schema': 1, 'task': task, 'startedUtc': utcnow(), 'status': 'active',
                    'stages': [], 'requirements': {},
                    'scope': 'Full elapsed time includes source search, agent/editorial review, '
                             'copy, publication, tests, PDF generation and visual inspection.'}
        return self.edit(change)

    def begin(self, name, metadata=None):
        row = {'id': str(uuid4()), 'name': name, 'startedUtc': utcnow(),
               'status': 'running', 'metadata': metadata or {}}
        def change(data):
            if data is None or data['status'] != 'active':
                raise ValueError('Start or resume an active run before recording a stage')
            data['stages'].append(row)
            return row['id']
        return self.edit(change)

    def end(self, stage_id, status='complete', metadata=None, elapsed=None):
        if status not in ('complete', 'failed', 'interrupted'):
            raise ValueError('Invalid stage outcome')
        def change(data):
            row = next(item for item in data['stages'] if item['id'] == stage_id)
            if row['status'] != 'running':
                raise ValueError('Stage already finished')
            row.update(finishedUtc=utcnow(), status=status)
            row['wallSeconds'] = elapsed if elapsed is not None else max(
                0, instant(row['finishedUtc']) - instant(row['startedUtc']))
            row['metadata'].update(metadata or {})
            return row
        return self.edit(change)

    @contextmanager
    def stage(self, name, metadata=None):
        ident, started = self.begin(name, metadata), time.perf_counter()
        result = {}
        try:
            yield result
        except BaseException as error:
            self.end(ident, 'interrupted' if isinstance(error, KeyboardInterrupt) else 'failed',
                     {**result, 'error': str(error)}, time.perf_counter() - started)
            raise
        else:
            self.end(ident, metadata=result, elapsed=time.perf_counter() - started)

    def require(self, name, complete=False, evidence=None):
        def change(data):
            if data is None or data['status'] != 'active':
                raise ValueError('An active run is required')
            data['requirements'][name] = {'status': 'complete' if complete else 'pending',
                                          'evidence': evidence}
        self.edit(change)

    def record(self, row):
        """Attach a completed subprocess stage without losing its actual interval."""
        outcome = 'complete' if row.get('status') == 'passed' else row.get('status', 'complete')
        if outcome not in ('complete', 'failed', 'interrupted'):
            raise ValueError('External stage must have a final outcome')
        if instant(row['finishedUtc']) < instant(row['startedUtc']):
            raise ValueError('Stage finish precedes its start')
        value = {**row, 'id': str(uuid4()), 'status': outcome}
        def change(data):
            if data is None or data['status'] != 'active':
                raise ValueError('An active run is required')
            data['stages'].append(value)
        self.edit(change)

    def finish(self):
        if self.summary().get('workflow'):
            WorkflowRun(self.path).check_complete()
        def change(data):
            if data is None or data['status'] != 'active':
                raise ValueError('An active run is required')
            successful = {row['id'] for row in data['stages'] if row['status'] == 'complete'}
            if any(row['status'] != 'complete' and row.get('resolvedBy') not in successful
                   for row in data['stages']):
                raise ValueError('Running, interrupted or failed stages must be resolved first')
            if any(row['status'] not in ('complete', 'superseded') for row in data['requirements'].values()):
                raise ValueError('Required review or verification is still pending')
            data.update(status='complete', completedUtc=utcnow())
        self.edit(change)
        return self.summary()

    def resolve(self, failed_id, replacement_id):
        """Retain failed attempts while identifying the successful retry."""
        def change(data):
            failed = next(row for row in data['stages'] if row['id'] == failed_id)
            replacement = next(row for row in data['stages'] if row['id'] == replacement_id)
            if failed['status'] not in ('failed', 'interrupted') or replacement['status'] != 'complete':
                raise ValueError('Resolve only a failed/interrupted stage with a completed retry')
            if failed['name'] != replacement['name']:
                raise ValueError('The replacement must rerun the same stage')
            failed['resolvedBy'] = replacement_id
        self.edit(change)

    def summary(self):
        data = json.loads(self.path.read_text())
        start = instant(data['startedUtc'])
        end = instant(data.get('completedUtc') or utcnow())
        intervals = sorted((max(start, instant(row['startedUtc'])),
                            min(end, instant(row.get('finishedUtc') or utcnow())))
                           for row in data['stages'])
        covered, previous = 0, start
        for left, right in intervals:
            covered += max(0, right - max(previous, left))
            previous = max(previous, right)
        return {**data, 'fullWallSeconds': max(0, end - start),
                'coveredStageWallSeconds': covered,
                'unattributedWallSeconds': max(0, end - start - covered),
                'timingNote': 'Parallel stage durations overlap and must not be added. '
                              'Unattributed time is included in fullWallSeconds.'}
