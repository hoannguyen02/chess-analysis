"""Whole-workflow timing, including time spent outside automated commands."""
from contextlib import contextmanager
from datetime import datetime, timezone
import fcntl
import json
from pathlib import Path
import time
from uuid import uuid4

from tactic_research import atomic_json


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
        def change(data):
            if data is None or data['status'] != 'active':
                raise ValueError('An active run is required')
            successful = {row['id'] for row in data['stages'] if row['status'] == 'complete'}
            if any(row['status'] != 'complete' and row.get('resolvedBy') not in successful
                   for row in data['stages']):
                raise ValueError('Running, interrupted or failed stages must be resolved first')
            if any(row['status'] != 'complete' for row in data['requirements'].values()):
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
