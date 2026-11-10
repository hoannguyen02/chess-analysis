from functools import partial
import json
import multiprocessing
from pathlib import Path
import tempfile
import unittest
from unittest import mock

from tactic_research import ROOT, atomic_json
from research_finish import (APPEND_MANIFESTS, SOURCE_FILES, FORK_SOURCE_FILES, FinishRun,
                             _code_snapshot, _preserve, _runtime_files,
                             _append_bundle, _preserve_evidence,
                             approve_visual_review, finish_batch, sha, snapshot)


append_fork_bundle = partial(_append_bundle, topic='fork')


def concurrent_approval(report_path, queue, entered=None, release=None):
    replace = Path.replace
    def controlled_replace(path, target):
        if entered is not None and Path(target).name == 'published.json':
            entered.set()
            if not release.wait(8):
                raise RuntimeError('Concurrent test release timed out')
        return replace(path, target)
    try:
        # Publication-contract behavior is covered by test-research-run.py;
        # these fixtures isolate commit safety after a successful contract gate.
        with mock.patch('research_finish.check_workflow'), mock.patch.object(Path, 'replace', controlled_replace):
            approve_visual_review(report_path, 'Inspected the exact final pages')
        queue.put(('complete', ''))
    except Exception as error:
        queue.put(('rejected', str(error)))


class FinishSafety(unittest.TestCase):
    def setUp(self):
        gate = mock.patch('research_finish.check_workflow')
        gate.start()
        self.addCleanup(gate.stop)
        self.directory = tempfile.TemporaryDirectory()
        self.root = Path(self.directory.name) / 'root'
        self.output = Path(self.directory.name) / 'output'
        self.root.mkdir()
        for name in SOURCE_FILES:
            value = [] if name.endswith(('exercises.json', 'adjustments.json')) else {}
            atomic_json(self.root / name, value)
        # Version checks cover the actual publication and validation programs.
        for name in _code_snapshot(ROOT):
            path = self.root / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes((ROOT / name).read_bytes())

    def tearDown(self):
        self.directory.cleanup()

    def report(self, mode='published-batch-rehearsal', output=None):
        output = output or self.output
        run = FinishRun(output, self.root, mode)
        artifact = output / 'preview.png'
        artifact.write_bytes(b'exact-preview')
        original = output / 'input.json'
        original.write_text('{}')
        run.report.update(status='awaiting-visual-review', validationComplete=True,
                          inputSnapshots={str(original): sha(original)},
                          artifacts={str(artifact): sha(artifact)})
        run.save()
        return run

    def test_real_inspection_attestation_cannot_be_automatic(self):
        run = self.report()
        with self.assertRaisesRegex(ValueError, 'who inspected'):
            approve_visual_review(run.path, '')
        run.report['validationComplete'] = False
        run.save()
        with self.assertRaisesRegex(ValueError, 'validations'):
            approve_visual_review(run.path, 'Read every page')

    def test_changed_artifact_requires_new_inspection(self):
        run = self.report()
        (self.output / 'preview.png').write_bytes(b'changed')
        with self.assertRaisesRegex(ValueError, 'Artifacts'):
            approve_visual_review(run.path, 'Read every page')

    def test_owner_change_is_not_overwritten_by_finish(self):
        run = self.report()
        owner = self.root / 'src/lib/server/practice-adjustments.json'
        owner.write_text('[{"owner":"new decision"}]')
        with self.assertRaisesRegex(ValueError, 'Source bank'):
            approve_visual_review(run.path, 'Read every page')
        self.assertIn('new decision', owner.read_text())

    def test_rehearsal_completion_keeps_entire_live_bank_unchanged(self):
        run = self.report()
        before = snapshot(self.root)
        report = approve_visual_review(run.path, 'Checked every diagram and answer page', 'reviewer')
        self.assertEqual(report['status'], 'complete')
        self.assertEqual(snapshot(self.root), before)
        self.assertEqual(report['visualReview']['inspectedArtifacts'], report['artifacts'])

    def test_new_publication_commits_only_its_staged_changes(self):
        run = self.report('new-approved-publication')
        stage = self.output / 'staging'
        name = 'scripts/fixtures/discovery/level-b-expansion-test.json'
        atomic_json(stage / name, {'approved': ['stable-id']})
        run.report.update(stagingRoot=str(stage), stagedChanges={name: sha(stage / name)})
        run.save()
        self.assertFalse((self.root / name).exists())
        before = snapshot(self.root)
        report = approve_visual_review(run.path, 'Checked exact final pages')
        self.assertEqual(report['status'], 'complete')
        self.assertEqual(json.loads((self.root / name).read_text()), {'approved': ['stable-id']})
        self.assertEqual(snapshot(self.root), before)

    def test_visual_approval_rechecks_other_topics_before_writing(self):
        run = self.report('new-approved-publication')
        stage = self.output / 'staging'
        name = 'scripts/fixtures/discovery/level-b-expansion-test.json'
        atomic_json(stage / name, {'approved': ['candidate']})
        run.report.update(stagingRoot=str(stage), stagedChanges={name: sha(stage / name)})
        run.save()
        fen = '7k/8/6K1/8/8/8/8/R7 w - - 17 34'
        other = {'scope': '/one-rook-mate', 'topic': 'Chiếu hết bằng một Xe',
                 'level': 'A', 'exercise': 'existing'}
        with mock.patch('research_finish.check_workflow', return_value=[{'gameId': 'candidate', 'fen': fen}]), \
             mock.patch('research_positions.active_positions',
                        return_value={'7k/8/6K1/8/8/8/8/R7 w - -': [other]}):
            with self.assertRaisesRegex(ValueError, 'already published.*existing'):
                approve_visual_review(run.path, 'Checked exact final pages')
        self.assertFalse((self.root / name).exists())

    def test_failed_commit_restores_only_its_own_writes(self):
        run = self.report('new-approved-publication')
        stage = self.output / 'staging'
        names = ['scripts/fixtures/discovery/level-b-expansion-test.json',
                 'scripts/fixtures/discovery/level-b-expansion-test-review.json']
        for name in names:
            atomic_json(stage / name, {'approved': ['stable-id']})
        run.report.update(stagingRoot=str(stage), stagedChanges={name: sha(stage / name) for name in names})
        run.save()
        replace = Path.replace
        def fail_second(path, target):
            if str(target).endswith('-review.json'):
                raise OSError('simulated write failure')
            return replace(path, target)
        with mock.patch.object(Path, 'replace', fail_second):
            with self.assertRaisesRegex(OSError, 'simulated'):
                approve_visual_review(run.path, 'Checked exact final pages')
        self.assertTrue(all(not (self.root / name).exists() for name in names))
        failed = json.loads(run.path.read_text())['visualReviewAttempts'][-1]
        self.assertEqual(failed['status'], 'failed')
        self.assertIn('simulated', failed['error'])

    def test_existing_manifest_cannot_silently_ignore_new_approval_inputs(self):
        path = self.root / 'scripts/fixtures/discovery/level-b-expansion-existing.json'
        atomic_json(path, {'old': 'batch'})
        with self.assertRaisesRegex(ValueError, 'inspect-batch'):
            finish_batch('invalid-new-review', 'invalid-new-decisions', path,
                         self.output, root=self.root, rehearsal=True)
        self.assertFalse((self.output / 'finish-report.json').exists())

    def test_concurrent_approvals_cannot_both_publish_against_one_old_bank(self):
        first = self.report('new-approved-publication')
        second = self.report('new-approved-publication', Path(self.directory.name) / 'second')
        for label, run in [('first', first), ('second', second)]:
            stage = run.output / 'staging'
            manifest = f'scripts/fixtures/discovery/level-b-expansion-{label}.json'
            generated = 'scripts/fixtures/discovery/published.json'
            atomic_json(stage / manifest, {'approved': label})
            atomic_json(stage / generated, {'winner': label})
            run.report.update(stagingRoot=str(stage), stagedChanges={
                name: sha(stage / name) for name in (manifest, generated)})
            run.save()
        ctx = multiprocessing.get_context('spawn')
        entered, release, queue = ctx.Event(), ctx.Event(), ctx.Queue()
        a = ctx.Process(target=concurrent_approval, args=(first.path, queue, entered, release))
        b = ctx.Process(target=concurrent_approval, args=(second.path, queue))
        a.start()
        try:
            self.assertTrue(entered.wait(8), 'First publisher did not reach its locked commit')
            b.start()
            # The second publisher must wait while the first holds the lock.
            with self.assertRaises(__import__('queue').Empty):
                queue.get(timeout=0.2)
            release.set()
            outcomes = [queue.get(timeout=8), queue.get(timeout=8)]
            self.assertEqual(sorted(row[0] for row in outcomes), ['complete', 'rejected'])
            self.assertIn('Source bank', next(row[1] for row in outcomes if row[0] == 'rejected'))
        finally:
            release.set()
            for process in (a, b):
                if process.pid:
                    process.join(8)
                    if process.is_alive():
                        process.terminate(); process.join()
        self.assertEqual(json.loads((self.root / 'scripts/fixtures/discovery/published.json').read_text()), {'winner': 'first'})
        self.assertFalse((self.root / 'scripts/fixtures/discovery/level-b-expansion-second.json').exists())
        self.assertEqual(json.loads(second.path.read_text())['visualReviewAttempts'][-1]['status'], 'failed')

    def test_preservation_rejects_any_changed_existing_exercise(self):
        stage = Path(self.directory.name) / 'stage'
        for name in SOURCE_FILES:
            atomic_json(stage / name, json.loads((self.root / name).read_text()))
        old = [{'gameReference': {'id': 'one'}, 'fen': 'original'}]
        atomic_json(self.root / 'src/lib/server/discovery-exercises.json', old)
        atomic_json(stage / 'src/lib/server/discovery-exercises.json',
                    [{**old[0], 'fen': 'different'}])
        with self.assertRaisesRegex(ValueError, 'existing exercise'):
            _preserve(self.root, stage)

    def test_every_stage_emits_wall_clock_bounds_even_when_failed(self):
        rows = []
        run = FinishRun(self.output, self.root, 'test', stage_callback=rows.append)
        with self.assertRaisesRegex(ValueError, 'failed check'):
            run.stage('test-stage', lambda: (_ for _ in ()).throw(ValueError('failed check')))
        self.assertEqual(rows[0]['status'], 'failed')
        self.assertIn('startedUtc', rows[0])
        self.assertIn('finishedUtc', rows[0])
        self.assertGreaterEqual(rows[0]['wallSeconds'], 0)

    def test_fork_visual_approval_tracks_its_own_bank_and_owner_snapshot(self):
        for name in FORK_SOURCE_FILES:
            if not (self.root / name).exists():
                atomic_json(self.root / name, {})
        for name in _code_snapshot(ROOT, 'fork'):
            path = self.root / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes((ROOT / name).read_bytes())
        run = FinishRun(self.output, self.root, 'new-approved-publication', topic='fork')
        artifact = self.output / 'preview.png'
        artifact.write_bytes(b'inspected-fork-page')
        source = self.output / 'input.json'
        source.write_text('{}')
        stage = self.output / 'staging'
        name = 'src/lib/server/fork-exercises.json'
        atomic_json(stage / name, [{'id': 'approved-fork'}])
        run.report.update(status='awaiting-visual-review', validationComplete=True,
                          inputSnapshots={str(source): sha(source)}, artifacts={str(artifact): sha(artifact)},
                          stagingRoot=str(stage), stagedChanges={name: sha(stage / name)})
        run.save()
        owner = self.root / 'src/lib/server/practice-adjustments.json'
        owner.write_text('[{"owner":"later choice"}]')
        with self.assertRaisesRegex(ValueError, 'Source bank'):
            approve_visual_review(run.path, 'Inspected Fork diagrams and answers')
        self.assertEqual(json.loads((self.root / name).read_text()), {})
        self.assertIn('later choice', owner.read_text())

    @staticmethod
    def fork_bundle(ids, root_nodes=1000000):
        return {'topic': 'fork', 'status': 'editorially-approved-bundle',
                'records': [{'gameId': ident, 'level': 'A' if ident.startswith('old') else 'D',
                             'fen': 'saved-' + ident, 'moves': ['saved-line']} for ident in ids],
                'reviews': [{'gameId': ident, 'decision': 'keep', 'reviewer': 'saved-editor',
                             'reason': 'Exact reviewed decision for ' + ident} for ident in ids],
                'reviewResults': [{'gameId': ident, 'proof': {'root': ['exact', ident]},
                                   'engineIdentity': {'binarySha256': 'saved-engine'}} for ident in ids],
                'settings': {'rootNodes': root_nodes, 'prepNodes': 150000},
                'verificationCodeSha256': 'code-' + str(root_nodes),
                'engineIdentities': [{'binarySha256': 'engine-' + str(root_nodes)}],
                'reviewInputSha256': 'input-' + str(root_nodes),
                'coverageChecklist': {'scope': list(ids)},
                'history': [{'note': 'Original history must remain unchanged'}],
                'exclusions': [], 'deferred': []}

    def fork_append_report(self, *, rehearsal=False, first=False, output=None):
        output = output or self.output
        for name in FORK_SOURCE_FILES:
            if not (self.root / name).exists():
                atomic_json(self.root / name, [] if name.endswith('exercises.json') else {})
        for name in _code_snapshot(ROOT, 'fork'):
            path = self.root / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes((ROOT / name).read_bytes())
        old = self.fork_bundle([f'old-{i}' for i in range(9)])
        incoming = self.fork_bundle([f'new-{i}' for i in range(6)], 2000000)
        manifest = self.root / 'scripts/fixtures/fork/expansion-evidence.json'
        if not first:
            atomic_json(manifest, old)
        review = self.root / 'new-review.json'
        decisions = self.root / 'new-decisions.json'
        atomic_json(review, {'topic': 'fork', 'candidates': incoming['records']})
        atomic_json(decisions, {'reviews': incoming['reviews']})
        def approve(report, choices, output):
            value = json.loads(json.dumps(incoming))
            atomic_json(output, value)
            return value
        def render(run, stage, ids, validate=True, topic='discovery'):
            self.assertEqual(topic, 'fork')
            self.assertEqual(ids, [f'new-{i}' for i in range(6)])
            artifact = run.output / 'exact-fork-preview.png'
            artifact.write_bytes(b'exact-reviewed-fork-pages')
            run.report.update(status='awaiting-visual-review', validationComplete=True,
                              artifacts={str(artifact): sha(artifact)})
            run.save()
        with mock.patch('research_workflow.prepare_publication', side_effect=approve), \
                mock.patch.object(FinishRun, 'command'), \
                mock.patch('research_finish._check_and_render', side_effect=render):
            report = finish_batch(review, decisions, manifest, output,
                                  root=self.root, rehearsal=rehearsal)
        return report, manifest, old, incoming

    def test_fork_append_preserves_prior_nine_exact_evidence_and_per_batch_budgets(self):
        old = self.fork_bundle([f'old-{i}' for i in range(9)])
        old['deferred'] = [{'gameId': 'old-defer', 'reason': 'Keep this old decision'}]
        incoming = self.fork_bundle([f'new-{i}' for i in range(6)], 2000000)
        before = json.loads(json.dumps(old))
        merged = append_fork_bundle(old, incoming)
        self.assertEqual(old, before, 'Appending must not mutate the source object')
        self.assertEqual(_preserve_evidence(old, merged)['previousApprovedRecords'], 9)
        for key in ('records', 'reviews', 'reviewResults'):
            self.assertEqual(merged[key][:9], old[key])
            self.assertEqual(merged[key][9:], incoming[key])
        for key in ('settings', 'history', 'engineIdentities', 'verificationCodeSha256',
                    'reviewInputSha256', 'coverageChecklist', 'deferred'):
            self.assertEqual(merged[key], old[key])
        batches = merged['publicationBatches']
        self.assertEqual([row['settings']['rootNodes'] for row in batches], [1000000, 2000000])
        self.assertEqual(batches[0]['recordIds'], [f'old-{i}' for i in range(9)])
        self.assertEqual(batches[1]['recordIds'], [f'new-{i}' for i in range(6)])
        third = append_fork_bundle(merged, self.fork_bundle(['later'], 3000000))
        self.assertEqual(third['publicationBatches'][:2], batches)
        self.assertEqual(third['settings'], old['settings'])

    def test_fork_append_rejects_duplicates_conflicting_outcomes_and_corrupt_coverage(self):
        old = self.fork_bundle(['old'])
        with self.assertRaisesRegex(ValueError, 'already exist'):
            append_fork_bundle(old, self.fork_bundle(['old']))
        with self.assertRaisesRegex(ValueError, 'Duplicate Fork IDs'):
            append_fork_bundle(old, self.fork_bundle(['new', 'new']))
        old['exclusions'] = [{'gameId': 'excluded', 'reason': 'Earlier rejected objective'}]
        with self.assertRaisesRegex(ValueError, 'already exist'):
            append_fork_bundle(old, self.fork_bundle(['excluded']))
        new = self.fork_bundle(['new'])
        new['deferred'] = [{'gameId': 'new'}]
        with self.assertRaisesRegex(ValueError, 'Conflicting Fork'):
            append_fork_bundle(old, new)
        new = self.fork_bundle(['new'])
        new['reviewResults'] = []
        with self.assertRaisesRegex(ValueError, 'exactly matching'):
            append_fork_bundle(old, new)
        old['publicationBatches'] = [{'recordIds': ['unrelated'], 'settings': {'rootNodes': 1}}]
        with self.assertRaisesRegex(ValueError, 'batch IDs/settings'):
            append_fork_bundle(old, self.fork_bundle(['new']))

    def test_first_hanging_piece_publication_binds_new_files_and_beginner_previews(self):
        topic = 'hanging-piece'
        for name in _code_snapshot(ROOT, topic):
            path = self.root / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes((ROOT / name).read_bytes())
        manifest = self.root / APPEND_MANIFESTS[topic]
        runtime = _runtime_files(topic)
        incoming = {**self.fork_bundle(['new-A']), 'topic': topic}
        review = self.root / 'new-review.json'
        decisions = self.root / 'new-decisions.json'
        atomic_json(review, {'topic': topic, 'candidates': incoming['records']})
        atomic_json(decisions, {'reviews': incoming['reviews']})

        def build(run, name, command, stage):
            self.assertEqual(name, 'build-hanging-piece')
            for name, value in zip(runtime, ([{'gameReference': {'id': 'new-A'}}],
                                             {'new-A': {}}, [{'id': 'new-intro'}])):
                atomic_json(stage / name, value)

        def render(run, stage, ids, validate=True, topic='discovery'):
            self.assertEqual(topic, 'hanging-piece')
            self.assertEqual(ids, ['new-intro', 'new-A'])
            artifact = run.output / 'exact-preview.png'
            artifact.write_bytes(b'exact-reviewed-pages')
            run.report.update(status='awaiting-visual-review', validationComplete=True,
                              artifacts={str(artifact): sha(artifact)})
            run.save()

        with mock.patch('research_workflow.prepare_publication', return_value=incoming), \
                mock.patch.object(FinishRun, 'command', autospec=True, side_effect=build), \
                mock.patch('research_finish._check_and_render', side_effect=render):
            report = finish_batch(review, decisions, manifest, self.output, root=self.root)
        self.assertFalse(manifest.exists())
        self.assertTrue(all(not (self.root / name).exists() for name in runtime))
        self.assertEqual(report['preservation']['previousExercises'], 0)

        # A file that was absent at rehearsal still belongs to the snapshot.
        appeared = self.root / runtime[0]
        atomic_json(appeared, [{'id': 'separate-publication'}])
        with self.assertRaisesRegex(ValueError, 'file inventory changed'):
            approve_visual_review(report['reportPath'], 'Inspected exact diagrams and answers')
        self.assertEqual(json.loads(appeared.read_text()), [{'id': 'separate-publication'}])
        self.assertFalse(manifest.exists())
        appeared.unlink()
        result = approve_visual_review(report['reportPath'], 'Inspected exact diagrams and answers')
        self.assertEqual(result['status'], 'complete')
        self.assertTrue(all((self.root / name).exists() for name in runtime))
        self.assertEqual(json.loads(manifest.read_text())['records'], incoming['records'])

    def test_fork_evidence_preservation_rejects_record_or_policy_replacement(self):
        old = self.fork_bundle(['old'])
        for key in ('records', 'reviews', 'reviewResults', 'settings', 'history'):
            merged = append_fork_bundle(old, self.fork_bundle(['new'], 2000000))
            if isinstance(merged[key], list):
                merged[key][0] = {'changed': True}
            else:
                merged[key] = {'rootNodes': 9000000}
            with self.subTest(key=key), self.assertRaisesRegex(ValueError, 'historical Fork'):
                _preserve_evidence(old, merged)

    def test_fresh_approval_resolves_deferral_without_rewriting_prior_decision(self):
        old = self.fork_bundle(['old'])
        old['deferred'] = [{'gameId': 'later', 'decision': 'defer', 'reason': 'Earlier batch full'},
                           {'gameId': 'pending', 'decision': 'defer', 'reason': 'Unresolved'}]
        before = json.loads(json.dumps(old))
        merged = append_fork_bundle(old, self.fork_bundle(['later'], 2000000))
        self.assertEqual(old, before)
        self.assertEqual(merged['deferralHistory'], old['deferred'][:1])
        self.assertEqual(merged['deferred'], old['deferred'][1:])
        self.assertEqual(merged['publicationBatches'][0]['deferredIds'], ['later', 'pending'])
        next_batch = append_fork_bundle(merged, self.fork_bundle(['pending'], 2000000))
        self.assertEqual(next_batch['deferralHistory'], old['deferred'])
        self.assertEqual(next_batch['deferred'], [])
        _preserve_evidence(merged, next_batch)
        next_batch['deferralHistory'][-1]['reason'] = 'Changed old reasoning'
        with self.assertRaisesRegex(ValueError, 'historical Fork'):
            _preserve_evidence(merged, next_batch)

    def test_fork_append_rehearses_existing_bundle_then_commits_only_after_visual_review(self):
        report, manifest, old, incoming = self.fork_append_report()
        self.assertEqual(json.loads(manifest.read_text()), old)
        self.assertEqual(report['evidencePreservation']['previousApprovedRecords'], 9)
        self.assertIn(str(manifest.relative_to(self.root)), report['sourceSnapshot'])
        self.assertEqual(report['ids'], [row['gameId'] for row in incoming['records']])
        approved = approve_visual_review(report['reportPath'], 'Inspected exact six D diagrams and answers')
        merged = json.loads(manifest.read_text())
        self.assertEqual(approved['status'], 'complete')
        self.assertEqual(merged['records'][:9], old['records'])
        self.assertEqual(merged['records'][9:], incoming['records'])
        self.assertEqual(merged['settings'], old['settings'])

    def test_fork_append_detects_stale_existing_evidence_without_overwriting_it(self):
        report, manifest, old, incoming = self.fork_append_report()
        changed = {**old, 'history': old['history'] + [{'owner': 'later evidence correction'}]}
        atomic_json(manifest, changed)
        with self.assertRaisesRegex(ValueError, 'Source bank'):
            approve_visual_review(report['reportPath'], 'Inspected exact pages')
        self.assertEqual(json.loads(manifest.read_text()), changed)

    def test_fork_append_detects_new_source_bundle_during_visual_review(self):
        report, manifest, old, incoming = self.fork_append_report()
        atomic_json(self.root / 'scripts/fixtures/fork/later-approved-evidence.json',
                    {'later': 'source addition'})
        with self.assertRaisesRegex(ValueError, 'file inventory changed'):
            approve_visual_review(report['reportPath'], 'Inspected exact pages')
        self.assertEqual(json.loads(manifest.read_text()), old)

    def test_fork_append_failed_commit_restores_existing_bundle_bytes(self):
        report, manifest, old, incoming = self.fork_append_report()
        original = manifest.read_bytes()
        replace = Path.replace
        def fail_generated(path, target):
            if Path(target).name == 'published.json':
                raise OSError('simulated append failure')
            return replace(path, target)
        with mock.patch.object(Path, 'replace', fail_generated):
            with self.assertRaisesRegex(OSError, 'simulated append failure'):
                approve_visual_review(report['reportPath'], 'Inspected exact pages')
        self.assertEqual(manifest.read_bytes(), original)
        self.assertEqual(json.loads(manifest.read_text()), old)

    def test_first_fork_bundle_still_uses_existing_publication_flow(self):
        report, manifest, old, incoming = self.fork_append_report(first=True)
        self.assertFalse(manifest.exists())
        approved = approve_visual_review(report['reportPath'], 'Inspected exact pages')
        self.assertEqual(approved['status'], 'complete')
        self.assertEqual(json.loads(manifest.read_text()), incoming | {
            'exclusions': [], 'deferred': [], 'coverageChecklist': None})

    def test_concurrent_fork_appends_cannot_overwrite_the_first_visual_commit(self):
        first, manifest, old, incoming = self.fork_append_report()
        second, _, _, _ = self.fork_append_report(output=Path(self.directory.name) / 'second')
        ctx = multiprocessing.get_context('spawn')
        entered, release, queue = ctx.Event(), ctx.Event(), ctx.Queue()
        a = ctx.Process(target=concurrent_approval,
                        args=(first['reportPath'], queue, entered, release))
        b = ctx.Process(target=concurrent_approval, args=(second['reportPath'], queue))
        a.start()
        try:
            self.assertTrue(entered.wait(8), 'First Fork append did not reach its locked commit')
            b.start()
            with self.assertRaises(__import__('queue').Empty):
                queue.get(timeout=0.2)
            release.set()
            outcomes = [queue.get(timeout=8), queue.get(timeout=8)]
            self.assertEqual(sorted(row[0] for row in outcomes), ['complete', 'rejected'])
            self.assertIn('Source bank', next(row[1] for row in outcomes if row[0] == 'rejected'))
        finally:
            release.set()
            for process in (a, b):
                if process.pid:
                    process.join(8)
                    if process.is_alive():
                        process.terminate(); process.join()
        merged = json.loads(manifest.read_text())
        self.assertEqual(merged['records'], old['records'] + incoming['records'])
        self.assertEqual(len(merged['publicationBatches']), 2)


if __name__ == '__main__':
    unittest.main()
