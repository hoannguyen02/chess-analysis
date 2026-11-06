import json
from pathlib import Path
import tempfile
from concurrent.futures import ThreadPoolExecutor
import unittest
from unittest.mock import patch

from research_run import RunLedger


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


if __name__ == '__main__':
    unittest.main()
