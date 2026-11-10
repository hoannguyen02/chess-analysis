"""Rehearse approved publication, required checks and affected-page PDF inspection.

All builders/tests run in an isolated copy. Live bank changes are committed only
after a recorded visual review of the exact generated artifacts. Rehearsing an
existing batch never republishes it or claims new tactical/editorial approval.
"""
from datetime import datetime, timezone
from contextlib import contextmanager
from copy import deepcopy
import fcntl
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys
import time

from tactic_research import ROOT, atomic_json, digest
from research_run import check_workflow
from research_positions import check_publication_positions

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
FORK_SOURCE_FILES = (
    'scripts/fixtures/fork/published.json',
    'src/lib/server/fork-exercises.json',
    'src/lib/server/fork-game-sources.json',
    'src/lib/server/fork-beginner-exercises.json',
    'src/lib/server/practice-adjustments.json',
    'src/lib/server/manual-tactics.json',
)
APPEND_MANIFESTS = {
    'fork': 'scripts/fixtures/fork/expansion-evidence.json',
    'defensive-move': 'scripts/fixtures/defensive-move/published.json',
    'hanging-piece': 'scripts/fixtures/hanging-piece/published.json',
    'mate-in-one': 'scripts/fixtures/mate-in-one/published.json',
    'two-rook-mate': 'scripts/fixtures/two-rook-mate/expansion-evidence.json',
    'pin': 'scripts/fixtures/pin/expansion-evidence.json',
    'skewer': 'scripts/fixtures/skewer/published.json',
}
TOPIC_CHECKS = {
    'discovery': ('test-discovery.py', 'test-discovery.cjs'),
    'fork': ('test-forks.py', 'test-forks.cjs'),
    'defensive-move': ('test-defensive-move.py', 'test-defensive-move.cjs'),
    'hanging-piece': ('test-hanging-piece.py', 'test-hanging-piece.cjs'),
    'mate-in-one': ('test-mate-in-one.py', 'test-mate-in-one.cjs'),
    'two-rook-mate': ('test-two-rook-master-games.py', 'test-two-rook-mate.cjs'),
    'pin': ('test-pin-pipeline.py', 'test-pins.cjs'),
    'skewer': ('test-skewer-research.py', 'test-beginner-tactic-candidates.cjs'),
}


def _runtime_files(topic):
    files = [f'src/lib/server/{topic}-{suffix}.json' for suffix in
             ('exercises', 'game-sources', 'beginner-exercises')]
    if topic == 'skewer':
        files[0] = 'src/lib/chess/skewer-exercises.json'
    return files


def _source_files(root, topic):
    if topic == 'discovery':
        return list(SOURCE_FILES)
    if topic == 'fork':
        files = list(FORK_SOURCE_FILES)
    else:
        # A new collection can have no live runtime files yet. The inventory is
        # checked again inside the publication lock before creating any files.
        files = [name for name in _runtime_files(topic) if (root / name).is_file()]
        files += list(FORK_SOURCE_FILES[-2:])
    files += [str(path.relative_to(root))
              for path in sorted((root / 'scripts/fixtures' / topic).glob('*.json'))
              if str(path.relative_to(root)) not in files]
    if topic == 'two-rook-mate':
        files.extend(str(path.relative_to(root)) for path in sorted(
            (root / 'scripts/fixtures/two-rook-mate/mate-proofs').glob('*.json')))
    if topic == 'pin':
        files.append('src/lib/server/pin-audit.json')
    return files


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


def _code_snapshot(root, topic='discovery'):
    names = ('research_finish.py', 'research_workflow.py', 'beginner_one_move.py', 'research_publication.py',
             'research_run.py', 'research-tactics.py', 'research_editorial.py', 'tactics_catalog.py',
             'test-research-run.py', 'practice-position-index.cjs', 'research_positions.py',
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
    if topic == 'fork':
        dependencies += [f'scripts/{name}' for name in (
            'fork_research.py', 'collect-forks.py', 'build-forks.py',
            'tactic_research.py', 'discovery_research.py',
            'check-discovery-shortcuts.py', 'review-discovery-upper.py',
            'review-discovery-level-a.py', 'prove-discovery-mates.py',
            'research_index.py', 'research_editorial.py',
            'test-fork-research.py', 'test-forks.py', 'test-forks.cjs')]
        dependencies += ['src/pages/api/fork-exercises.ts']
    elif topic == 'defensive-move':
        dependencies += [f'scripts/{name}' for name in (
            'build-defensive-move.py', 'defensive_move_research.py', 'collect_defensive_move.py',
            'research_index.py', 'tactic_research.py', *TOPIC_CHECKS[topic])]
        dependencies += ['scripts/fixtures/tactics-index/tactics-map.json',
                         'src/components/ChessPractice.tsx', 'src/components/DrawTrainer.tsx',
                         'src/pages/tactic-positions.tsx',
                         'src/pages/api/manual-tactic-exercises.ts',
                         'src/pages/api/defensive-move-game-sources.ts']
    elif topic == 'mate-in-one':
        dependencies += [f'scripts/{name}' for name in (
            'build-mate-in-one.py', 'mate_in_one_research.py', 'collect_two_rook_mate.py',
            'research_index.py', 'tactic_research.py', *TOPIC_CHECKS[topic])]
        dependencies += ['scripts/fixtures/tactics-index/tactics-map.json',
                         'src/components/ChessPractice.tsx', 'src/components/BeginnerTacticImport.tsx',
                         'src/pages/tactic-positions.tsx',
                         'src/pages/api/manual-tactic-exercises.ts',
                         'src/pages/api/mate-in-one-game-sources.ts']
    elif topic == 'hanging-piece':
        dependencies += [f'scripts/{name}' for name in (
            'build-hanging-piece.py', 'hanging_piece_research.py',
            'hanging_piece_beginner.py', 'beginner_tactics.py',
            'validate-removing-defender-batch.py', 'tactic_research.py',
            'test-draw-game-viewer.cjs', *TOPIC_CHECKS[topic])]
        dependencies += ['scripts/fixtures/tactics-index/tactics-map.json',
                         'src/components/ChessPractice.tsx',
                         'src/components/DrawTrainer.tsx',
                         'src/components/WorksheetBuilder.tsx',
                         'src/pages/hanging-piece.tsx',
                         'src/pages/api/hanging-piece-exercises.ts',
                         'src/pages/api/hanging-piece-game-sources.ts']
    elif topic == 'two-rook-mate':
        dependencies += [f'scripts/{name}' for name in (
            'two_rook_mate_research.py', 'two_rook_mate_proof.py',
            'collect-two-rook-games.py', 'collect_two_rook_mate.py', 'build-two-rook-master-games.py',
            'tactic_research.py', 'research_index.py', 'research_candidates.py',
            'test-draw-game-viewer.cjs', *TOPIC_CHECKS[topic])]
        dependencies += ['src/pages/two-rook-mate.tsx', 'src/components/ChessPractice.tsx',
                         'src/pages/api/two-rook-mate-exercises.ts',
                         'src/pages/api/two-rook-mate-game-sources.ts']
    elif topic == 'pin':
        dependencies += [f'scripts/{name}' for name in (
            'pin_research.py', 'build-pins.py', 'review-pin-beginners.py', 'review-pin-creation.py',
            'research_index.py', 'collect_two_rook_mate.py', 'tactic_research.py', *TOPIC_CHECKS[topic])]
        dependencies += ['src/pages/pin.tsx', 'src/components/ChessPractice.tsx',
                         'src/pages/api/pin-exercises.ts', 'src/pages/api/pin-game-sources.ts']
    elif topic == 'skewer':
        dependencies += [f'scripts/{name}' for name in (
            'skewer_research.py', 'build-skewer.py', 'pin_research.py', 'hanging_piece_research.py',
            'collect_two_rook_mate.py', 'master_game_identity.py', 'research_index.py',
            'tactic_research.py', *TOPIC_CHECKS[topic])]
        dependencies += ['src/pages/skewer.tsx', 'src/components/ChessPractice.tsx',
                         'src/pages/api/skewer-exercises.ts', 'src/pages/api/skewer-game-sources.ts']
    return snapshot(root, dependencies)


def _clone(root, stage):
    stage.mkdir(parents=True, exist_ok=False)
    for name in ('scripts', 'src'):
        shutil.copytree(root / name, stage / name,
                        ignore=shutil.ignore_patterns('__pycache__', '*.pyc', '.scratch'))
    # These resources are read-only in the publication and rendering commands.
    for name in ('node_modules', 'public'):
        (stage / name).symlink_to(root / name, target_is_directory=True)


def _preserve(root, stage, topic='discovery'):
    exercises, games, beginner = _runtime_files(topic)
    optional = topic in ('hanging-piece', 'defensive-move', 'mate-in-one')
    old = [] if optional and not (root / exercises).exists() else json.loads((root / exercises).read_text())
    new = json.loads((stage / exercises).read_text())
    retired = 0
    if topic == 'two-rook-mate':
        before, after = old[0], new[0]
        if {k: v for k, v in before.items() if k != 'exercises'} != {
                k: v for k, v in after.items() if k != 'exercises'}:
            raise ValueError('Publication changed two-rook category metadata')
        old, new = before['exercises'], after['exercises']
        def retired_composition(row):
            return not row.get('gameReference') and row.get('difficulty', {}).get('level') in ('A', 'B')
        retired = sum(retired_composition(row) for row in old)
        if any(retired_composition(row) for row in new):
            raise ValueError('Publication restored a retired A/B composition')
        old = [row for row in old if not retired_composition(row)]
    def identity(row):
        return (row.get('gameReference') or {}).get('id') or row['fen']
    ids = {identity(row) for row in old}
    if [row for row in new if identity(row) in ids] != old:
        raise ValueError('Publication changed or removed an existing exercise')
    old_sources = {} if optional and not (root / games).exists() else json.loads((root / games).read_text())
    new_sources = json.loads((stage / games).read_text())
    if {key: new_sources.get(key) for key in old_sources} != old_sources:
        raise ValueError('Publication changed or removed an existing full game')
    preserved = list(FORK_SOURCE_FILES[-2:])
    if (not optional and topic not in ('two-rook-mate', 'pin', 'skewer')) or (root / beginner).exists():
        preserved.append(beginner)
    for name in preserved:
        if sha(root / name) != sha(stage / name):
            raise ValueError(f'Publication changed preserved owner/Beginner data: {name}')
    return {'previousExercises': len(old), 'previousFullGames': len(old_sources),
            **({'retiredCompositions': retired} if topic == 'two-rook-mate' else {}),
            'allPreviousExercisesAndGamesUnchanged': True,
            'ownerDecisionsUnchanged': True, 'beginnerUnchanged': True}


class FinishRun:
    def __init__(self, output_dir, root, mode, run_path=None, stage_callback=None, topic='discovery'):
        self.output = Path(output_dir).resolve()
        self.output.mkdir(parents=True, exist_ok=True)
        self.root = Path(root).resolve()
        self.path = self.output / 'finish-report.json'
        if self.path.exists():
            raise ValueError('Use a fresh output directory; an inspection report already exists')
        self.started = time.perf_counter()
        self.callback = stage_callback
        source_files = _source_files(self.root, topic)
        self.report = {'schema': 1, 'mode': mode, 'root': str(self.root),
                       'runPath': str(run_path) if run_path else None,
                       'startedUtc': utc(), 'status': 'running', 'stages': [],
                       'topic': topic,
                       'sourceFiles': source_files,
                       'sourceSnapshot': snapshot(self.root, source_files),
                       'codeSnapshot': _code_snapshot(self.root, topic),
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


def _check_and_render(run, stage, ids, validate=True, topic='discovery'):
    if validate:
        python_test, node_test = TOPIC_CHECKS[topic]
        run.command('validation-python', [sys.executable, f'scripts/{python_test}'], stage)
        run.command('validation-node', ['node', '--test', f'scripts/{node_test}',
                    'scripts/test-worksheets.cjs', 'scripts/test-practice-access.cjs',
                    'scripts/test-mate-alternatives.cjs', 'scripts/test-draw-game-viewer.cjs'], stage)
        run.command('validation-copy', ['node', 'scripts/audit-worksheet-copy.cjs'], stage)
    pdf_dir = run.output / 'pdf'
    run.command('pdf-export', ['node', 'scripts/render-tactic-batch.cjs', '--topic', topic,
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

    ``run_path`` binds the scoped workflow receipts. This function writes
    its own ``output_dir/finish-report.json`` and emits each stage to the callback.
    ``rehearsal=True`` prepares a new batch without committing. Published
    manifests must use ``inspect_batch`` so an old filename cannot silently
    bypass the supplied new review and editorial approval gates.
    """
    manifest_path = Path(manifest_path).resolve()
    append_paths = {Path(root).resolve() / path for path in APPEND_MANIFESTS.values()}
    if manifest_path.exists() and manifest_path not in append_paths:
        raise ValueError('Manifest already exists; use inspect-batch for published batch rehearsal')
    topic = json.loads(Path(review_path).read_text()).get('topic')
    if topic in APPEND_MANIFESTS:
        return _finish_append_batch(topic, review_path, decisions_path, manifest_path, output_dir,
                                    run_path, root=root, rehearsal=rehearsal,
                                    stage_callback=stage_callback)
    if topic != 'discovery' or manifest_path in append_paths:
        raise ValueError('Review topic does not match a supported publication manifest')
    selection = check_workflow(run_path, review_path, decisions_path, root)
    check_publication_positions(root, topic, selection)
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
                          workflowInputs={'review': str(review_path), 'decisions': str(decisions_path)},
                          workflowSelection=[{'gameId': r['gameId'], 'level': r['level']} for r in selection],
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


EVIDENCE_ARRAYS = ('records', 'reviews', 'reviewResults', 'exclusions', 'deferred')


def _bundle_ids(bundle, topic):
    """Require one unambiguous outcome and matching evidence per approved ID."""
    label = topic.replace('-', ' ').title()
    if bundle.get('topic') != topic or bundle.get('status') != 'editorially-approved-bundle':
        raise ValueError(f'Only reviewed {label} evidence bundles may be appended')
    groups = {}
    for name in EVIDENCE_ARRAYS:
        rows = bundle.get(name, [])
        if not isinstance(rows, list):
            raise ValueError(f'{label} {name} must be an ordered list')
        ids = [row.get('gameId') for row in rows]
        if any(not isinstance(ident, str) or not ident for ident in ids):
            raise ValueError(f'{label} {name} has a missing stable game ID')
        if len(ids) != len(set(ids)):
            raise ValueError(f'Duplicate {label} IDs in {name}')
        groups[name] = set(ids)
    if (not groups['records'] or groups['reviews'] != groups['records']
            or groups['reviewResults'] != groups['records']):
        raise ValueError(f'{label} approved records require exactly matching reviews and evidence')
    if (groups['records'] & (groups['exclusions'] | groups['deferred'])
            or groups['exclusions'] & groups['deferred']):
        raise ValueError(f'Conflicting {label} approval, exclusion or deferral IDs')
    return groups


def _batch_metadata(bundle):
    """Retain the exact policy of each batch without upgrading older evidence."""
    metadata = {key: deepcopy(value) for key, value in bundle.items()
                if key not in (*EVIDENCE_ARRAYS, 'publicationBatches')}
    return {**metadata,
            'recordIds': [row['gameId'] for row in bundle['records']],
            'exclusionIds': [row['gameId'] for row in bundle.get('exclusions', [])],
            'deferredIds': [row['gameId'] for row in bundle.get('deferred', [])],
            'evidenceSha256': digest({key: bundle.get(key, []) for key in EVIDENCE_ARRAYS})}


def _validate_batches(bundle, groups):
    batches = bundle.get('publicationBatches')
    if batches is None:
        return
    if not isinstance(batches, list) or not batches:
        raise ValueError('Publication batches must describe the retained evidence')
    covered = set()
    for batch in batches:
        ids = batch.get('recordIds', [])
        if (not ids or len(ids) != len(set(ids)) or covered.intersection(ids)
                or not set(ids).issubset(groups['records']) or not batch.get('settings')):
            raise ValueError('Publication batch IDs/settings conflict with retained evidence')
        covered.update(ids)
    if covered != groups['records']:
        raise ValueError('Publication batches do not cover every approved record')


def _append_bundle(existing, incoming, topic):
    """Append fresh, disjoint approvals while preserving all historical values."""
    new_groups = _bundle_ids(incoming, topic)
    if 'publicationBatches' in incoming:
        raise ValueError('Append one newly reviewed batch, not a repackaged history')
    if existing is None:
        return incoming
    old_groups = _bundle_ids(existing, topic)
    _validate_batches(existing, old_groups)
    # Deferral is not rejection. Freshly reviewed approvals may resolve an old
    # unselected lead; retain its exact prior decision as history, not an active
    # conflicting outcome. Approved/excluded IDs still cannot be republished.
    promoted = old_groups['deferred'] & new_groups['records']
    overlap = set().union(*old_groups.values()) & set().union(*new_groups.values())
    if overlap - promoted:
        raise ValueError('Duplicate or conflicting IDs already exist in the evidence bundle')
    merged = deepcopy(existing)
    for name in EVIDENCE_ARRAYS:
        merged[name] = deepcopy(existing.get(name, [])) + deepcopy(incoming.get(name, []))
    if promoted:
        merged['deferralHistory'] = deepcopy(existing.get('deferralHistory', [])) + [
            deepcopy(row) for row in existing['deferred'] if row['gameId'] in promoted]
        merged['deferred'] = [row for row in merged['deferred'] if row['gameId'] not in promoted]
    merged['publicationBatches'] = deepcopy(existing.get('publicationBatches') or
                                           [_batch_metadata(existing)])
    merged['publicationBatches'].append(_batch_metadata(incoming))
    _preserve_evidence(existing, merged)
    return merged


def _preserve_evidence(existing, merged):
    """Preserve prior evidence, including exact deferred decisions later resolved."""
    label = existing['topic'].replace('-', ' ').title()
    for key, value in existing.items():
        if key == 'deferred':
            historical = merged.get('deferralHistory', [])[len(existing.get('deferralHistory', [])):]
            promoted = {row['gameId'] for row in historical}
            expected = [row for row in value if row['gameId'] not in promoted]
            if (merged.get('deferred', [])[:len(expected)] != expected
                    or historical != [row for row in value if row['gameId'] in promoted]
                    or not promoted.issubset({row['gameId'] for row in merged['records']})):
                raise ValueError(f'Publication changed historical {label} deferred decisions')
        elif key in (*EVIDENCE_ARRAYS, 'publicationBatches', 'deferralHistory'):
            if merged.get(key, [])[:len(value)] != value:
                raise ValueError(f'Publication changed historical {label} {key}')
        elif merged.get(key) != value:
            raise ValueError(f'Publication changed historical {label} {key}')
    return {'previousApprovedRecords': len(existing['records']),
            'allPreviousEvidenceAndMetadataUnchanged': True}


def _finish_append_batch(topic, review_path, decisions_path, manifest_path, output_dir, run_path=None,
                         *, root=ROOT, rehearsal=False, stage_callback=None):
    """Append a fresh batch through isolated checks and exact visual approval."""
    selection = check_workflow(run_path, review_path, decisions_path, root)
    check_publication_positions(root, topic, selection)
    run = FinishRun(output_dir, root, 'new-approved-rehearsal' if rehearsal else
                    'new-approved-publication', run_path, stage_callback, topic=topic)
    try:
        review_path, decisions_path = Path(review_path).resolve(), Path(decisions_path).resolve()
        manifest_path = Path(manifest_path).resolve()
        relative = manifest_path.relative_to(run.root)
        append_path = Path(APPEND_MANIFESTS[topic])
        if relative != append_path:
            # Preserve Fork's existing support for a fresh, explicitly named bundle.
            if topic != 'fork' or relative.parent != append_path.parent or manifest_path.exists():
                raise ValueError(f'Use {append_path} for this publication bundle')
        report, decisions = json.loads(review_path.read_text()), json.loads(decisions_path.read_text())
        from research_workflow import prepare_publication
        bundle = run.stage('approval-gates', lambda: prepare_publication(
            report, decisions, run.output / 'approved-bundle.json'))
        by_id = {row['gameId']: row for row in report['candidates']}
        bundle['exclusions'] = [{**row, 'fen': by_id[row['gameId']]['fen'],
                                 'moves': by_id[row['gameId']]['moves'],
                                 'level': by_id[row['gameId']]['level']}
                                for row in decisions['reviews'] if row['decision'] == 'remove']
        bundle['deferred'] = decisions.get('deferred', [])
        bundle['coverageChecklist'] = decisions.get('coverageChecklist')
        stage = run.output / 'staging'
        run.stage('stage-workspace', lambda: _clone(run.root, stage))
        existing = json.loads((stage / relative).read_text()) if (stage / relative).exists() else None
        cumulative = run.stage('prepare-manifest', lambda: _append_bundle(existing, bundle, topic))
        run.stage('write-manifest', lambda: atomic_json(stage / relative, cumulative))
        ids = [row['gameId'] for row in bundle['records']]
        run.report.update(stagingRoot=str(stage), manifestPath=str(manifest_path),
                          workflowInputs={'review': str(review_path), 'decisions': str(decisions_path)},
                          workflowSelection=[{'gameId': r['gameId'], 'level': r['level']} for r in selection],
                          manifestRelative=str(relative), ids=ids,
                          willCommitAfterVisualReview=not rehearsal,
                          inputSnapshots={str(path): sha(path) for path in (review_path, decisions_path)},
                          scope='New reviewed additions with append-only evidence, isolated build, preservation, protected API, worksheets and visual review.')
        if existing is not None:
            run.report['evidencePreservation'] = run.stage('evidence-preservation', lambda:
                _preserve_evidence(existing, json.loads((stage / relative).read_text())))
        builder = {'fork': 'build-forks', 'pin': 'build-pins', 'two-rook-mate': 'build-two-rook-master-games'}.get(
            topic, f'build-{topic}')
        run.command(builder, [sys.executable, f'scripts/{builder}.py'], stage)
        run.report['preservation'] = run.stage('preservation', lambda: _preserve(run.root, stage, topic))
        runtime = _runtime_files(topic)
        names = [str(relative), *runtime]
        if topic == 'fork':
            names.insert(1, FORK_SOURCE_FILES[0])
        elif topic in ('defensive-move', 'mate-in-one', 'pin', 'skewer'):
            names = [str(relative), *runtime[:2]]
        elif topic == 'two-rook-mate':
            names = [str(relative), *runtime[:2], 'scripts/fixtures/two-rook-mate/master-published.json']
        run.report['stagedChanges'] = {name: sha(stage / name) for name in names}
        preview_ids = ids
        if topic == 'hanging-piece' and runtime[-1] not in run.report['sourceSnapshot']:
            beginner = json.loads((stage / runtime[-1]).read_text())
            preview_ids = [row['id'] for row in beginner] + ids
        _check_and_render(run, stage, preview_ids, topic=topic)
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
    topic = report.get('topic', 'discovery')
    if topic in APPEND_MANIFESTS and _source_files(root, topic) != report.get('sourceFiles'):
        raise ValueError('Source bank file inventory changed; rerun rehearsal')
    if (snapshot(root, report.get('sourceFiles', SOURCE_FILES)) != report['sourceSnapshot']
            or _code_snapshot(root, topic) != report['codeSnapshot']):
        raise ValueError('Source bank or verification code changed; rerun rehearsal')
    if report['mode'] in ('new-approved-publication', 'new-approved-rehearsal'):
        inputs = report.get('workflowInputs', {})
        selection = check_workflow(report.get('runPath'), inputs.get('review'), inputs.get('decisions'), root)
        check_publication_positions(root, topic, selection)


def _commit_staged(report, root):
    stage, changes = Path(report['stagingRoot']), report['stagedChanges']
    if any(sha(stage / name) != expected for name, expected in changes.items()):
        raise ValueError('Staged publication changed; rerun rehearsal')
    old, written = {}, []
    try:
        for name in changes:
            path = root / name
            if name not in report['sourceSnapshot'] and path.exists():
                raise ValueError('A new approval batch appeared while awaiting inspection')
            old[name] = path.read_bytes() if path.exists() else None
            data = (stage / name).read_bytes()
            path.parent.mkdir(parents=True, exist_ok=True)
            temporary = path.with_name(path.name + '.finish.tmp')
            try:
                temporary.write_bytes(data)
                temporary.replace(path)
            finally:
                temporary.unlink(missing_ok=True)
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
