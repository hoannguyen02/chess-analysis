import json
import multiprocessing
from pathlib import Path
import tempfile
import unittest
from unittest import mock

from tactic_research import ROOT, atomic_json
from research_finish import (SOURCE_FILES, FinishRun, _code_snapshot, _preserve,
                             approve_visual_review, finish_batch, sha, snapshot)


def concurrent_approval(report_path, queue, entered=None, release=None):
    replace = Path.replace
    def controlled_replace(path, target):
        if entered is not None and Path(target).name == 'published.json':
            entered.set()
            if not release.wait(8):
                raise RuntimeError('Concurrent test release timed out')
        return replace(path, target)
    try:
        with mock.patch.object(Path, 'replace', controlled_replace):
            approve_visual_review(report_path, 'Inspected the exact final pages')
        queue.put(('complete', ''))
    except Exception as error:
        queue.put(('rejected', str(error)))


class FinishSafety(unittest.TestCase):
    def setUp(self):
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


if __name__ == '__main__':
    unittest.main()
