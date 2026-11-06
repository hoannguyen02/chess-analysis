"""Rehearse approved publication, required checks and affected-page PDF inspection.

All builders/tests run in an isolated copy. Live bank changes are committed only
after a recorded visual review of the exact generated artifacts. Rehearsing an
existing batch never republishes it or claims new tactical/editorial approval.
"""
from datetime import datetime, timezone
from contextlib import contextmanager
import fcntl
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys
import time

from tactic_research import ROOT, atomic_json

SOURCE_FILES = (
    'scripts/fixtures/discovery/published.json',
    'scripts/fixtures/discovery/upper-curation.json',
    'scripts/fixtures/discovery/excluded.json',
    'scripts/fixtures/discovery/second-pass-coverage.json',
    'src/lib/server/discovery-exercises.json',
    'src/lib/server/discovery-game-sources.json',
    'src/lib/server/discovery-beginner-exercises.json',
    'src/lib/server/practice-adjustments.json',
    'src/lib/server/manual-tactics.json',
    'scripts/fixtures/discovery/expansion-evidence.json',
)
GENERATED_FILES = SOURCE_FILES[:6]


def utc():
    return datetime.now(timezone.utc).isoformat()


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def snapshot(root, files=SOURCE_FILES):
    return {str(name): sha(Path(root) / name) for name in files}


@contextmanager
def publication_lock(root):
    """Serialize cooperating publishers and recheck their snapshots while locked."""
    path = Path(root) / 'research/tactic-publication.lock'
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('a') as stream:
        fcntl.flock(stream, fcntl.LOCK_EX)
        try:
            yield
        finally:
            fcntl.flock(stream, fcntl.LOCK_UN)


def _code_snapshot(root):
    names = ('research_finish.py', 'research_workflow.py', 'research_publication.py',
             'review_store.py',
             'render-tactic-batch.cjs', 'curate-discovery-upper.py',
             'build-discovery.py', 'discovery-coverage-report.py',
             'test-discovery.py', 'test-discovery.cjs', 'test-worksheets.cjs',
             'test-practice-access.cjs', 'test-mate-alternatives.cjs',
             'audit-worksheet-copy.cjs')
    root = Path(root)
    dependencies = [f'scripts/{name}' for name in names]
    dependencies += [str(path.relative_to(root)) for pattern in (
        'src/lib/chess/*.ts', 'src/lib/server/*.ts',
        'public/fonts/*.ttf', 'public/chess-print/*',
    ) for path in root.glob(pattern) if path.is_file()]
    dependencies.append('src/pages/api/discovery-exercises.ts')
    return snapshot(root, dependencies)


def _clone(root, stage):
    stage.mkdir(parents=True, exist_ok=False)
    for name in ('scripts', 'src'):
        shutil.copytree(root / name, stage / name,
                        ignore=shutil.ignore_patterns('__pycache__', '*.pyc', '.scratch'))
    # These resources are read-only in the publication and rendering commands.
    for name in ('node_modules', 'public'):
        (stage / name).symlink_to(root / name, target_is_directory=True)


def _preserve(root, stage):
    old = json.loads((root / 'src/lib/server/discovery-exercises.json').read_text())
    new = json.loads((stage / 'src/lib/server/discovery-exercises.json').read_text())
    ids = {row['gameReference']['id'] for row in old}
    if [row for row in new if row['gameReference']['id'] in ids] != old:
        raise ValueError('Publication changed or removed an existing exercise')
    old_sources = json.loads((root / 'src/lib/server/discovery-game-sources.json').read_text())
    new_sources = json.loads((stage / 'src/lib/server/discovery-game-sources.json').read_text())
    if {key: new_sources.get(key) for key in old_sources} != old_sources:
        raise ValueError('Publication changed or removed an existing full game')
    for name in ('src/lib/server/discovery-beginner-exercises.json',
                 'src/lib/server/practice-adjustments.json',
                 'src/lib/server/manual-tactics.json'):
        if sha(root / name) != sha(stage / name):
            raise ValueError(f'Publication changed preserved owner/Beginner data: {name}')
    return {'previousExercises': len(old), 'previousFullGames': len(old_sources),
            'allPreviousExercisesAndGamesUnchanged': True,
            'ownerDecisionsUnchanged': True, 'beginnerUnchanged': True}


class FinishRun:
    def __init__(self, output_dir, root, mode, run_path=None, stage_callback=None):
        self.output = Path(output_dir).resolve()
        self.output.mkdir(parents=True, exist_ok=True)
        self.root = Path(root).resolve()
        self.path = self.output / 'finish-report.json'
        if self.path.exists():
            raise ValueError('Use a fresh output directory; an inspection report already exists')
        self.started = time.perf_counter()
        self.callback = stage_callback
        self.report = {'schema': 1, 'mode': mode, 'root': str(self.root),
                       'runPath': str(run_path) if run_path else None,
                       'startedUtc': utc(), 'status': 'running', 'stages': [],
                       'sourceSnapshot': snapshot(self.root),
                       'codeSnapshot': _code_snapshot(self.root),
                       'reportPath': str(self.path)}
        self.save()

    def save(self):
        self.report['wallSeconds'] = time.perf_counter() - self.started
        atomic_json(self.path, self.report)

    def stage(self, name, action):
        started = time.perf_counter()
        row = {'name': name, 'startedUtc': utc()}
        try:
            result = action()
            row['status'] = 'passed'
            return result
        except Exception as error:
            row.update(status='failed', error=str(error))
            raise
        finally:
            row.update(finishedUtc=utc(), wallSeconds=time.perf_counter() - started)
            self.report['stages'].append(row)
            self.save()
            if self.callback:
                self.callback(dict(row))

    def command(self, name, command, cwd):
        def run():
            log = self.output / (name + '.log')
            with log.open('w') as stream:
                result = subprocess.run(command, cwd=cwd, stdout=stream,
                                        stderr=subprocess.STDOUT, check=False)
            if result.returncode:
                raise RuntimeError(f'{name} failed ({result.returncode}); inspect {log}')
            return log
        return self.stage(name, run)

    def fail(self, error):
        self.report.update(status='failed', error=str(error), finishedUtc=utc())
        self.save()


def _check_and_render(run, stage, ids, validate=True):
    if validate:
        run.command('validation-python', [sys.executable, 'scripts/test-discovery.py'], stage)
        run.command('validation-node', ['node', '--test', 'scripts/test-discovery.cjs',
                    'scripts/test-worksheets.cjs', 'scripts/test-practice-access.cjs',
                    'scripts/test-mate-alternatives.cjs'], stage)
        run.command('validation-copy', ['node', 'scripts/audit-worksheet-copy.cjs'], stage)
    pdf_dir = run.output / 'pdf'
    run.command('pdf-export', ['node', 'scripts/render-tactic-batch.cjs', '--topic', 'discovery',
                '--ids', ','.join(ids), '--output-dir', str(pdf_dir), '--root', str(stage)], stage)
    render = json.loads((pdf_dir / 'render-report.json').read_text())
    if not shutil.which('pdftoppm'):
        raise RuntimeError('pdftoppm is required to inspect rendered PDF pages')
    previews = run.output / 'previews'
    previews.mkdir(exist_ok=True)
    for key, item in render['outputs'].items():
        run.command(f'pdf-preview-{key}', ['pdftoppm', '-scale-to', '1400', '-png',
                    item['path'], str(previews / key)], stage)
    artifacts = [pdf_dir / 'render-report.json',
                 *(Path(item['path']) for item in render['outputs'].values()),
                 *sorted(previews.glob('*.png'))]
    run.report.update(renderReport=render, artifacts={str(path): sha(path) for path in artifacts},
                      previewPaths=[str(path) for path in sorted(previews.glob('*.png'))],
                      validationComplete=bool(validate),
                      status='awaiting-visual-review' if validate else 'awaiting-validation',
                      automationFinishedUtc=utc())
    run.save()
    return run.report


def inspect_batch(manifest_paths, output_dir, *, root=ROOT, run_path=None,
                  stage_callback=None, validate=True):
    """Rehearse already-published batches without adding records or touching the bank."""
    run = FinishRun(output_dir, root, 'published-batch-rehearsal', run_path, stage_callback)
    try:
        manifests = [Path(path).resolve() for path in manifest_paths]
        ids = []
        published = {row['gameId']: row for row in json.loads(
            (run.root / SOURCE_FILES[0]).read_text())['records']}
        from discovery_research import record_hash, provenance
        for path in manifests:
            data = json.loads(path.read_text())
            approvals = {row['gameId'] for row in data['reviews'] if row['decision'] == 'keep'}
            if set(data['order']) != approvals:
                raise ValueError('Existing batch has missing explicit approvals')
            for record in data['records']:
                ident = record['gameId']
                if ident not in published or record_hash(record) != record_hash(published[ident]):
                    raise ValueError('Rehearsal record differs from the approved published record')
                if provenance(record):
                    raise ValueError('Rehearsal record has incomplete provenance')
                ids.append(ident)
        if len(ids) != len(set(ids)) or not ids:
            raise ValueError('Rehearsal requires distinct published IDs')
        run.report.update(inputSnapshots={str(path): sha(path) for path in manifests}, ids=ids,
                          willCommitAfterVisualReview=False,
                          scope='Existing publication/build/API/worksheet/PDF regression rehearsal; no new source search, tactical review, editorial approval or publication is claimed.')
        stage = run.output / 'staging'
        run.stage('stage-workspace', lambda: _clone(run.root, stage))
        run.report['stagingRoot'] = str(stage)
        for name in ('curate-discovery-upper', 'build-discovery', 'discovery-coverage-report'):
            run.command(name, [sys.executable, f'scripts/{name}.py'], stage)
        run.report['preservation'] = run.stage('preservation', lambda: _preserve(run.root, stage))
        _check_and_render(run, stage, ids, validate)
        if snapshot(run.root) != run.report['sourceSnapshot']:
            raise ValueError('Live source bank changed during rehearsal')
        return run.report
    except Exception as error:
        run.fail(error)
        raise


def finish_batch(review_path, decisions_path, manifest_path, output_dir, run_path=None,
                 *, root=ROOT, rehearsal=False, stage_callback=None):
    """Prepare a new approved batch in staging, then await exact-artifact visual review.

    ``run_path`` is only an external timing-ledger reference. This function writes
    its own ``output_dir/finish-report.json`` and emits each stage to the callback.
    ``rehearsal=True`` prepares a new batch without committing. Published
    manifests must use ``inspect_batch`` so an old filename cannot silently
    bypass the supplied new review and editorial approval gates.
    """
    if Path(manifest_path).exists():
        raise ValueError('Manifest already exists; use inspect-batch for published batch rehearsal')
    run = FinishRun(output_dir, root, 'new-approved-rehearsal' if rehearsal else
                    'new-approved-publication', run_path, stage_callback)
    try:
        review_path, decisions_path = Path(review_path).resolve(), Path(decisions_path).resolve()
        manifest_path = Path(manifest_path).resolve()
        relative = manifest_path.relative_to(run.root)
        if relative.parent != Path('scripts/fixtures/discovery'):
            raise ValueError('Publication manifest must be in scripts/fixtures/discovery')
        report, decisions = json.loads(review_path.read_text()), json.loads(decisions_path.read_text())
        from research_workflow import prepare_publication
        bundle = run.stage('approval-gates', lambda: prepare_publication(
            report, decisions, run.output / 'approved-bundle.json'))
        stage = run.output / 'staging'
        run.stage('stage-workspace', lambda: _clone(run.root, stage))
        from research_publication import discovery_expansion
        manifest = run.stage('prepare-manifest', lambda: discovery_expansion(
            bundle, decisions, stage / relative, root=stage))
        run.report.update(stagingRoot=str(stage), manifestPath=str(manifest_path),
                          manifestRelative=str(relative), ids=manifest['order'],
                          willCommitAfterVisualReview=not rehearsal,
                          inputSnapshots={str(path): sha(path) for path in (review_path, decisions_path)},
                          scope='Approved new batch, complete publication/check/PDF preparation. Exact-artifact visual review remains required before commit.')
        for name in ('curate-discovery-upper', 'build-discovery', 'discovery-coverage-report'):
            run.command(name, [sys.executable, f'scripts/{name}.py'], stage)
        run.report['preservation'] = run.stage('preservation', lambda: _preserve(run.root, stage))
        names = [str(relative), 'scripts/fixtures/discovery/expansion-evidence.json',
                 *GENERATED_FILES]
        run.report['stagedChanges'] = {name: sha(stage / name) for name in names}
        _check_and_render(run, stage, manifest['order'])
        return run.report
    except Exception as error:
        run.fail(error)
        raise


def _verify_visual_report(report, note, reviewer, root):
    if report.get('status') != 'awaiting-visual-review' or not report.get('validationComplete'):
        raise ValueError('Required validations and PDF previews must finish first')
    if not note.strip() or not reviewer.strip():
        raise ValueError('Record who inspected the pages and what was checked')
    for group in ('artifacts', 'inputSnapshots'):
        if any(not Path(path).exists() or sha(path) != expected for path, expected in report[group].items()):
            raise ValueError('Artifacts or inputs changed; rerun the affected finish stages')
    if snapshot(root) != report['sourceSnapshot'] or _code_snapshot(root) != report['codeSnapshot']:
        raise ValueError('Source bank or verification code changed; rerun rehearsal')


def _commit_staged(report, root):
    stage, changes = Path(report['stagingRoot']), report['stagedChanges']
    if any(sha(stage / name) != expected for name, expected in changes.items()):
        raise ValueError('Staged publication changed; rerun rehearsal')
    old, written = {}, []
    try:
        for name in changes:
            path = root / name
            if name not in SOURCE_FILES and path.exists():
                raise ValueError('A new approval batch appeared while awaiting inspection')
            old[name] = path.read_bytes() if path.exists() else None
            data = (stage / name).read_bytes()
            path.parent.mkdir(parents=True, exist_ok=True)
            temporary = path.with_name(path.name + '.finish.tmp')
            temporary.write_bytes(data)
            temporary.replace(path)
            written.append(name)
    except Exception:
        for name in reversed(written):
            path = root / name
            if old[name] is None:
                path.unlink()
            else:
                path.write_bytes(old[name])
        raise


def approve_visual_review(report_path, note, reviewer='agent'):
    """Record actual visual inspection; reject changed artifacts, inputs or bank.

    For a new batch only, committing the already-rehearsed files is the final
    step. Existing-batch rehearsals remain read-only. Failed commits restore only
    this function's own writes; unrelated files and Git state are never touched.
    """
    report_path = Path(report_path)
    started, when = time.perf_counter(), utc()
    root = Path(json.loads(report_path.read_text())['root'])
    with publication_lock(root):
        # Loading and verifying again under the project lock prevents two
        # approvals from both committing against the same old source snapshot.
        report = json.loads(report_path.read_text())
        try:
            _verify_visual_report(report, note, reviewer, root)
            if report['mode'] == 'new-approved-publication':
                _commit_staged(report, root)
        except Exception as error:
            report.setdefault('visualReviewAttempts', []).append({
                'reviewer': reviewer, 'startedUtc': when, 'finishedUtc': utc(),
                'wallSeconds': time.perf_counter() - started,
                'status': 'failed', 'error': str(error)})
            atomic_json(report_path, report)
            raise
        report['visualReview'] = {'reviewer': reviewer, 'note': note.strip(),
                                  'inspectedArtifacts': dict(report['artifacts']), 'reviewedUtc': utc()}
        report['stages'].append({'name': 'visual-review-and-commit', 'startedUtc': when,
                                 'finishedUtc': utc(), 'wallSeconds': time.perf_counter() - started,
                                 'status': 'passed'})
        report.update(status='complete', finishedUtc=utc())
        report['fullWallSeconds'] = (datetime.fromisoformat(report['finishedUtc']) -
                                      datetime.fromisoformat(report['startedUtc'])).total_seconds()
        atomic_json(report_path, report)
        return report
