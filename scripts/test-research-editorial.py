"""Editorial handoff guards; all approvals/output stay in temporary directories."""
import copy
import json
from review_store import read_review_reference
from pathlib import Path
import tempfile
import unittest

from discovery_research import early_gate, record_hash
from research_editorial import NOTES, prepare_editorial, merge_editorial
from research_workflow import SETTINGS, verification_code
from tactic_research import ROOT, atomic_json, digest


def sample_report():
    records, results, reviews = [], [], {}
    fixtures = ROOT / 'scripts/fixtures/discovery'
    for filename in ('level-b-expansion-20261105b.json', 'level-c-expansion-20261105.json'):
        batch = json.loads((fixtures / filename).read_text())
        evidence = read_review_reference(fixtures / batch['evidenceFile'])
        for record in batch['records']:
            ident = record['gameId']
            records.append(record)
            results.append({'gameId': ident, 'status': 'needs-editorial-review', 'flags': [],
                            'fen': record['fen'], 'moves': record['moves'], 'level': record['level'],
                            'recordHash': record_hash(record), 'preflight': early_gate(record, True),
                            'analysis': next(row for row in evidence['analyses'] if row['gameId'] == ident),
                            'timeline': next(row for row in evidence['timelines'] if row['gameId'] == ident),
                            'shortcuts': next(row for row in evidence['shortcuts'] if row['gameId'] == ident)})
        reviews.update({row['gameId']: row for row in batch['reviews']})
    report = {'topic': 'discovery', 'settings': SETTINGS, 'quality': {'requiresProvenance': True},
              'verificationCodeSha256': verification_code(), 'inputSha256': digest(records),
              'candidates': records, 'results': results}
    return report, reviews


class EditorialTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.directory = Path(self.tmp.name)
        self.report, self.approved = sample_report()
        self.manifest = prepare_editorial(self.report, self.directory / 'packets', reviewers=3)
        self.manifest_path = self.directory / 'packets/manifest.json'

    def tearDown(self):
        self.tmp.cleanup()

    def template_paths(self):
        return [self.manifest_path.parent / packet['decisionFile'] for packet in self.manifest['packets']]

    def fill(self, decision='defer'):
        for path in self.template_paths():
            data = json.loads(path.read_text())
            data['reviewer'] = 'test-' + data['packetId']
            for row in data['reviews']:
                row.update(decision=decision, reason='Test-only explicit decision; no live publication.')
                if decision == 'keep':
                    prior = self.approved[row['gameId']]
                    for key in ('reason', 'distinctness', 'solutionVi', 'hintsVi'):
                        row[key] = prior[key]
                    row['reviewNotes'] = {key: 'Test-only review: ' + key for key in NOTES}
            atomic_json(path, data)

    def merge(self, paths=None, report=None):
        return merge_editorial(report or self.report, paths or self.template_paths(),
                               self.directory / 'merged.json', packet_manifest=self.manifest_path)

    def test_disjoint_deterministic_packets_include_recovery_and_full_evidence(self):
        ids = [ident for packet in self.manifest['packets'] for ident in packet['gameIds']]
        self.assertEqual(len(ids), 4)
        self.assertEqual(len(set(ids)), 4)
        summaries = {}
        for packet in self.manifest['packets']:
            payload = json.loads((self.manifest_path.parent / packet['evidenceFile']).read_text())
            for row in payload['candidates']:
                self.assertEqual(row['fullRecordSha256'], digest(row['candidate']))
                self.assertEqual(row['evidenceSha256'], digest(row['tacticalReview']))
                self.assertTrue(row['candidate']['gameMoves'])
                self.assertTrue(row['tacticalReview']['analysis']['roots'])
                summaries[row['gameId']] = row['summary']
            template = json.loads((self.manifest_path.parent / packet['decisionFile']).read_text())
            self.assertTrue(all(row['decision'] == 'undecided' for row in template['reviews']))
        self.assertIn('Nxg5', summaries['eef5583eeab818c6']['motif']['recapturesLegalOnlyWithoutSlider'])
        self.assertIn('fxe6', summaries['51b6258a7c5e5a7b']['motif']['recapturesLegalOnlyWithoutSlider'])
        self.assertIn({'reply': 'Bxe7', 'materialChangeCp': 180}, summaries['043fa99a6866848c']['finalImmediateRecaptures'])
        self.assertIn({'reply': 'gxf4', 'materialChangeCp': 220}, summaries['765f315a6674451f']['finalImmediateRecaptures'])
        self.assertEqual(summaries['043fa99a6866848c']['motif']['checkers'], 2)
        self.fill()
        contents = [path.read_bytes() for path in self.template_paths()]
        self.assertEqual(prepare_editorial(self.report, self.manifest_path.parent, reviewers=3), self.manifest)
        self.assertEqual([path.read_bytes() for path in self.template_paths()], contents)

    def test_undecided_or_missing_reviews_never_become_approval(self):
        with self.assertRaisesRegex(ValueError, 'Reviewer identity'):
            self.merge()
        self.fill()
        first = self.template_paths()[0]
        data = json.loads(first.read_text())
        data['reviews'][0]['decision'] = 'undecided'
        atomic_json(first, data)
        with self.assertRaisesRegex(ValueError, 'undecided'):
            self.merge()
        self.fill()
        with self.assertRaisesRegex(ValueError, 'Missing reviewer'):
            self.merge(self.template_paths()[:-1])
        data = json.loads(first.read_text()); data['reviews'].pop(); atomic_json(first, data)
        with self.assertRaisesRegex(ValueError, 'Missing reviewer decisions'):
            self.merge()

    def test_defer_stays_separate_and_reject_maps_to_existing_remove_schema(self):
        self.fill()
        first = self.template_paths()[0]
        data = json.loads(first.read_text()); data['reviews'][0]['decision'] = 'reject'; atomic_json(first, data)
        merged = self.merge()
        self.assertEqual(len(merged['reviews']), 1)
        self.assertEqual(merged['reviews'][0]['decision'], 'remove')
        self.assertEqual(len(merged['deferred']), 3)
        self.assertTrue(all(row['decision'] == 'defer' for row in merged['deferred']))

    def test_changed_record_metadata_evidence_or_code_requires_fresh_packets(self):
        self.fill()
        altered = copy.deepcopy(self.report)
        # The legacy partial record hash does not bind this metadata; the packet does.
        altered['candidates'][0]['validation']['newMetadata'] = 'changed'
        with self.assertRaisesRegex(ValueError, 'changed since'):
            self.merge(report=altered)
        altered = copy.deepcopy(self.report); altered['results'][0]['analysis']['roots'][0]['scoreCp'] += 1
        with self.assertRaisesRegex(ValueError, 'changed since'):
            self.merge(report=altered)
        altered = copy.deepcopy(self.report); altered['verificationCodeSha256'] = 'stale'
        with self.assertRaisesRegex(ValueError, 'stale'):
            self.merge(report=altered)
        with self.assertRaisesRegex(ValueError, 'another report'):
            prepare_editorial({**self.report, 'inputSha256': 'different'}, self.manifest_path.parent)

    def test_unchanged_cached_evidence_keeps_editorial_work_when_only_timings_change(self):
        self.fill('keep')
        cached=copy.deepcopy(self.report)
        for row in cached['results']:
            row.update(reused=True,elapsedSeconds=0.001,timings={'roots':0.001},
                       work={'engineCalls':0,'hits':5})
        self.assertEqual(prepare_editorial(cached,self.manifest_path.parent,reviewers=3),self.manifest)
        self.assertEqual(len(self.merge(report=cached)['reviews']),4)

    def test_conflicting_ownership_duplicate_packets_and_edited_evidence_fail(self):
        self.fill()
        with self.assertRaisesRegex(ValueError, 'duplicate reviewer packet'):
            self.merge([*self.template_paths(), self.template_paths()[0]])
        first, second = self.template_paths()[:2]
        a, b = json.loads(first.read_text()), json.loads(second.read_text())
        a['reviews'][0] = b['reviews'][0]
        atomic_json(first, a)
        with self.assertRaisesRegex(ValueError, 'packet ownership'):
            self.merge()
        self.fill()
        path = self.manifest_path.parent / self.manifest['packets'][0]['evidenceFile']
        evidence = json.loads(path.read_text()); evidence['instructions'] = 'Edited'; atomic_json(path, evidence)
        with self.assertRaisesRegex(ValueError, 'Saved evidence packet changed'):
            self.merge()

    def test_keep_requires_explicit_notes_and_current_publication_gates(self):
        self.fill('keep')
        first = self.template_paths()[0]
        data = json.loads(first.read_text()); data['reviews'][0]['reviewNotes']['level'] = ''; atomic_json(first, data)
        with self.assertRaisesRegex(ValueError, 'review notes'):
            self.merge()
        self.fill('keep')
        merged = self.merge()
        self.assertEqual(len(merged['reviews']), 4)
        self.assertFalse(merged['deferred'])
        self.assertTrue(all(row['decision'] == 'keep' and row['reviewer'].startswith('test-') for row in merged['reviews']))
        # A clean label cannot bypass the existing all-legal-root publication gate.
        altered = copy.deepcopy(self.report); altered['results'][0]['analysis']['roots'] = []
        other = self.directory / 'incomplete'
        self.manifest = prepare_editorial(altered, other, reviewers=3)
        self.manifest_path = other / 'manifest.json'; self.fill('keep')
        with self.assertRaisesRegex(ValueError, 'Every legal starting move'):
            self.merge(report=altered)

    def test_benchmark_records_can_be_reviewed_but_never_kept_for_publication(self):
        report = {**self.report, 'quality': {'requiresProvenance': False}}
        other = self.directory / 'benchmark'
        self.manifest = prepare_editorial(report, other, reviewers=2)
        self.manifest_path = other / 'manifest.json'; self.fill('keep')
        with self.assertRaisesRegex(ValueError, 'Benchmark-only'):
            self.merge(report=report)
        self.fill('defer')
        self.assertEqual(len(self.merge(report=report)['deferred']), 4)


if __name__ == '__main__':
    unittest.main()
