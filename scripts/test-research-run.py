import json
from pathlib import Path
import tempfile
from concurrent.futures import ThreadPoolExecutor
import unittest
from unittest.mock import patch

from research_run import RunLedger, WorkflowRun, file_binding
from research_finish import finish_batch, FinishRun, approve_visual_review, sha, SOURCE_FILES, _code_snapshot
from tactic_research import atomic_json, ROOT


class RunTimingTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.ledger = RunLedger(Path(self.directory.name) / 'run.json')
        self.ledger.create('Four-position full workflow')

    def tearDown(self):
        self.directory.cleanup()

    def test_whole_time_includes_editorial_gaps_and_overlaps_are_not_double_counted(self):
        data = json.loads(self.ledger.path.read_text())
        data.update(startedUtc='2026-11-05T10:00:00+00:00',
                    completedUtc='2026-11-05T10:01:00+00:00')
        data['stages'] = [
            {'startedUtc': '2026-11-05T10:00:10+00:00', 'finishedUtc': '2026-11-05T10:00:30+00:00'},
            {'startedUtc': '2026-11-05T10:00:20+00:00', 'finishedUtc': '2026-11-05T10:00:40+00:00'}]
        self.ledger.path.write_text(json.dumps(data))
        result = self.ledger.summary()
        self.assertEqual(result['fullWallSeconds'], 60)
        self.assertEqual(result['coveredStageWallSeconds'], 30)
        self.assertEqual(result['unattributedWallSeconds'], 30)

    def test_failures_and_pending_visual_inspection_cannot_be_completed(self):
        with self.assertRaisesRegex(RuntimeError, 'failed'):
            with self.ledger.stage('Build'):
                raise RuntimeError('failed build')
        with self.assertRaisesRegex(ValueError, 'failed'):
            self.ledger.finish()
        self.ledger.edit(lambda data: data['stages'].clear())
        self.ledger.require('PDF visual review', evidence='preview.json')
        with self.assertRaisesRegex(ValueError, 'pending'):
            self.ledger.finish()
        self.ledger.require('PDF visual review', True, 'Inspected exact artifact hashes')
        self.assertEqual(self.ledger.finish()['status'], 'complete')

    def test_concurrent_reviewers_do_not_lose_stage_records(self):
        def record(number):
            with self.ledger.stage(f'Editorial reviewer {number}') as metadata:
                metadata['candidate'] = number
        with ThreadPoolExecutor(max_workers=4) as pool:
            list(pool.map(record, range(12)))
        data = self.ledger.summary()
        self.assertEqual(len(data['stages']), 12)
        self.assertTrue(all(row['status'] == 'complete' for row in data['stages']))

    def test_context_records_monotonic_duration_and_metadata(self):
        with patch('research_run.time.perf_counter', side_effect=[100, 102.5]):
            with self.ledger.stage('Engine review') as metadata:
                metadata['allRootsCompared'] = 35
        row = self.ledger.summary()['stages'][0]
        self.assertEqual(row['wallSeconds'], 2.5)
        self.assertEqual(row['metadata']['allRootsCompared'], 35)

    def test_retry_keeps_failure_history_without_blocking_successful_completion(self):
        failed = self.ledger.begin('Verification')
        self.ledger.end(failed, 'failed')
        replacement = self.ledger.begin('Verification')
        self.ledger.end(replacement)
        self.ledger.resolve(failed, replacement)
        data = self.ledger.finish()
        self.assertEqual(data['stages'][0]['status'], 'failed')
        self.assertEqual(data['stages'][0]['resolvedBy'], replacement)


class WorkflowEnforcementTests(unittest.TestCase):
    """The contract checks command receipts; chess gates have separate tests."""
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        self.ledger = RunLedger(self.root / 'run.json')
        self.ledger.create('One Fork D addition')
        self.workflow = WorkflowRun(self.ledger.path)
        self.workflow.configure('fork', {'D': 1})
        self.context = {'instructions': 'current', 'owner': 'current', 'code': 'current'}
        context = patch('research_run.current_context', side_effect=lambda *a: dict(self.context))
        context.start()
        self.addCleanup(context.stop)
        self.report = {'topic': 'fork', 'settings': {'rootNodes': 1000000},
                       'quality': {'requiresProvenance': True}, 'verificationCodeSha256': 'current',
                       'candidates': [{'gameId': 'one', 'level': 'D', 'moves': ['sample']}],
                       'results': [{'gameId': 'one', 'recordHash': 'exact', 'flags': [],
                                    'status': 'needs-editorial-review', 'work': {'hits': 2}}]}
        self.review = self.root / 'review.json'
        self.decisions = self.root / 'decisions.json'
        self.manifest = self.root / 'packets.json'
        self.input = self.root / 'reviewer.json'
        atomic_json(self.review, self.report)

    def preflight(self):
        with patch('research_index.connect') as connect, \
                patch('research_index.sync_topic_decisions', return_value={'ownerChoices': 1}) as sync, \
                patch('research_candidates.bootstrap_candidates') as bootstrap, \
                patch('research_candidates.query_candidates', return_value={'records': [], 'metrics': {'hits': 0}}) as query:
            self.workflow.preflight(self.root / 'index.sqlite')
            sync.assert_called_once_with(connect.return_value, 'fork')
            bootstrap.assert_called_once_with(connect.return_value, topic='fork')
            query.assert_called_once_with(connect.return_value, 'fork', ['D'], limit=1)
            connect.return_value.close.assert_called_once()

    def approve_inputs(self):
        self.preflight()
        self.workflow.reviewed(self.review)
        atomic_json(self.manifest, {'packet': 'exact'})
        self.workflow.packets(self.review, self.manifest)
        atomic_json(self.input, {'reviewer': 'independent', 'copy': 'final'})
        atomic_json(self.decisions, {'reviews': [{'gameId': 'one', 'decision': 'keep'}]})
        self.workflow.merged(self.review, self.manifest, [self.input], self.decisions)

    def test_named_stages_cannot_substitute_for_actual_preflight(self):
        with self.ledger.stage('workflow-preflight'):
            pass
        with self.assertRaisesRegex(ValueError, 'preflight missing'):
            self.workflow.reviewed(self.review)
        self.preflight()
        self.workflow.reviewed(self.review)
        self.assertTrue(self.workflow.check_review(self.report))

    def test_scope_and_unsupported_levels_fail_before_engine_work(self):
        self.preflight()
        for topic, levels in [('discovery', ['D']), ('fork', ['B'])]:
            with self.assertRaisesRegex(ValueError, 'outside'):
                self.workflow.ready(topic, levels)
        other = RunLedger(self.root / 'other.json')
        other.create('Unsupported')
        with self.assertRaisesRegex(ValueError, 'Unsupported'):
            WorkflowRun(other.path).configure('fork', {'C': 1})

    def test_generic_timing_run_is_not_a_research_contract(self):
        ledger = RunLedger(self.root / 'generic.json')
        ledger.create('Benchmark')
        with self.assertRaisesRegex(ValueError, 'scoped'):
            WorkflowRun(ledger.path).ready()
        with self.assertRaisesRegex(ValueError, 'run-file'):
            WorkflowRun(None)

    def test_current_instructions_owner_and_code_invalidate_old_review(self):
        self.approve_inputs()
        for field in self.context:
            old = self.context[field]
            self.context[field] = 'changed'
            with self.assertRaisesRegex(ValueError, 'stale'):
                self.workflow.check_publication(self.review, self.decisions)
            self.context[field] = old
        started = self.ledger.summary()['startedUtc']
        self.context['code'] = 'new'
        self.preflight()
        with self.assertRaisesRegex(ValueError, 'Exact tactical evidence'):
            self.workflow.check_review(self.report)
        self.assertEqual(self.ledger.summary()['startedUtc'], started)

    def test_refresh_retains_history_without_stranding_obsolete_pending_reviews(self):
        self.preflight()
        self.ledger.require('Editorial decisions: obsolete', evidence='old-packets.json')
        stage = self.ledger.begin('visual-review-window')
        self.ledger.require('PDF visual review: obsolete', evidence={'stageId': stage})
        self.context['code'] = 'updated'
        self.preflight()
        data = self.ledger.summary()
        self.assertTrue(all(row['status'] == 'superseded' for row in data['requirements'].values()))
        self.assertEqual(next(row for row in data['stages'] if row['id'] == stage)['metadata']['outcome'],
                         'superseded; no visual approval')
        with self.assertRaisesRegex(ValueError, 'not all published'):
            self.ledger.finish()

    def test_edited_evidence_or_inflated_budgets_cannot_reuse_a_receipt(self):
        self.preflight()
        self.workflow.reviewed(self.review)
        for changed in ({**self.report, 'settings': {'rootNodes': 2000000}},
                        {**self.report, 'results': [{**self.report['results'][0], 'flags': ['unresolved']}]}):
            with self.assertRaisesRegex(ValueError, 'Exact tactical evidence'):
                self.workflow.check_review(changed)
        # Cache counters/timing do not discard otherwise identical evidence.
        unchanged = {**self.report, 'results': [{**self.report['results'][0], 'work': {'hits': 99}}]}
        self.workflow.check_review(unchanged)
        atomic_json(self.review, unchanged)
        with self.assertRaisesRegex(ValueError, 'Exact tactical evidence'):
            self.workflow.check_review(unchanged)

    def test_free_text_completion_does_not_replace_packet_merge(self):
        self.preflight()
        self.workflow.reviewed(self.review)
        atomic_json(self.decisions, {'reviews': [{'gameId': 'one', 'decision': 'keep'}]})
        with self.ledger.stage('editorial-merge'):
            pass
        with self.assertRaisesRegex(ValueError, 'editorial-merge'):
            self.workflow.check_publication(self.review, self.decisions)

    def test_changed_copy_packet_or_reviewer_input_requires_remerge(self):
        self.approve_inputs()
        self.assertEqual(len(self.workflow.check_publication(self.review, self.decisions)), 1)
        for path in (self.decisions, self.manifest, self.input):
            before = path.read_bytes()
            path.write_text('{}')
            with self.assertRaisesRegex(ValueError, 'editorial-merge'):
                self.workflow.check_publication(self.review, self.decisions)
            path.write_bytes(before)

    def test_batch_cannot_publish_more_than_requested(self):
        self.report['candidates'].append({**self.report['candidates'][0], 'gameId': 'two'})
        self.report['results'].append({**self.report['results'][0], 'gameId': 'two'})
        atomic_json(self.review, self.report)
        self.approve_inputs()
        atomic_json(self.decisions, {'reviews': [{'gameId': ident, 'decision': 'keep'} for ident in ('one', 'two')]})
        self.workflow.merged(self.review, self.manifest, [self.input], self.decisions)
        with self.assertRaisesRegex(ValueError, 'exceeds'):
            self.workflow.check_publication(self.review, self.decisions)

    def test_low_level_publication_cannot_bypass_the_run(self):
        with self.assertRaisesRegex(ValueError, 'run-file'):
            finish_batch(self.review, self.root / 'unreviewed.json',
                         self.root / 'scripts/fixtures/fork/new.json', self.root / 'finish', root=self.root)
        self.assertFalse((self.root / 'finish').exists())

    def test_final_commit_rechecks_contract_before_writing(self):
        for name in SOURCE_FILES:
            atomic_json(self.root / name, {})
        for name in _code_snapshot(ROOT):
            target = self.root / name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes((ROOT / name).read_bytes())
        run = FinishRun(self.root / 'finish', self.root, 'new-approved-publication')
        artifact = run.output / 'preview.png'
        artifact.write_bytes(b'preview')
        run.report.update(status='awaiting-visual-review', validationComplete=True,
                          artifacts={str(artifact): sha(artifact)}, inputSnapshots={})
        run.save()
        with self.assertRaisesRegex(ValueError, 'run-file'):
            approve_visual_review(run.path, 'Actually inspected exact pages')
        self.assertFalse((self.root / 'published.json').exists())

    def test_scoped_run_cannot_finish_without_real_publication_and_visual_receipt(self):
        self.preflight()
        with self.assertRaisesRegex(ValueError, 'not all published'):
            self.ledger.finish()
        report = self.root / 'finish-report.json'
        atomic_json(report, {'mode': 'new-approved-publication', 'status': 'complete',
                             'runPath': str(self.ledger.path), 'visualReview': {'note': 'Inspected'},
                             'workflowSelection': [{'gameId': 'one', 'level': 'D'}], 'ids': ['one']})
        self.ledger.require('PDF visual review: final', True, file_binding(report))
        self.assertEqual(self.ledger.finish()['status'], 'complete')


if __name__ == '__main__':
    unittest.main()
