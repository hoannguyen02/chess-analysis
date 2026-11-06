"""Review-bundle persistence, historical references and retained evidence."""
import copy
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from review_store import (
    ReviewStore, read_review_reference, review_sha256, write_review_reference,
)

ROOT = Path(__file__).resolve().parents[1]


class ReviewBundles(unittest.TestCase):
    def test_updates_preserve_sibling_records_and_checksums(self):
        with tempfile.TemporaryDirectory() as directory:
            bundle = Path(directory) / 'reviews.json'
            first = str(bundle) + '#first-review'
            second = str(bundle) + '#second-review'
            write_review_reference(first, {'id': 'first', 'reason': 'Thí quân'})
            write_review_reference(second, [{'status': 'unverified', 'roots': [1, 2]}])
            retained = copy.deepcopy(read_review_reference(second))
            digest = review_sha256(retained)
            write_review_reference(first, {'id': 'first', 'reason': 'Revised review'})
            self.assertEqual(read_review_reference(second), retained)
            self.assertEqual(review_sha256(read_review_reference(second)), digest)
            self.assertEqual(read_review_reference(Path(directory) / 'first-review.json'),
                             read_review_reference(first))
            legacy = Path(directory) / 'third-review.json'
            write_review_reference(legacy, {'status': 'unverified'})
            self.assertEqual(read_review_reference(legacy), {'status': 'unverified'})
            self.assertFalse(legacy.exists())
            bundle.write_text(json.dumps(json.loads(bundle.read_text()), separators=(',', ':')),
                              encoding='utf-8')
            self.assertEqual(review_sha256(read_review_reference(second)), digest)
            self.assertFalse((Path(directory) / 'first-review.json').exists())
            self.assertFalse(bundle.with_suffix('.tmp').exists())

    def test_interrupted_replace_keeps_previous_bundle(self):
        with tempfile.TemporaryDirectory() as directory:
            bundle = Path(directory) / 'reviews.json'
            store = ReviewStore(bundle)
            store.put('first-review', {'id': 'first'})
            previous = bundle.read_bytes()
            with patch.object(Path, 'replace', side_effect=OSError('interrupted')):
                with self.assertRaises(OSError):
                    store.put('second-review', {'id': 'second'})
            self.assertEqual(bundle.read_bytes(), previous)
            self.assertEqual(set(ReviewStore(bundle).records), {'first-review'})

    def test_missing_and_malformed_references_fail(self):
        with tempfile.TemporaryDirectory() as directory:
            bundle = Path(directory) / 'reviews.json'
            with self.assertRaises(KeyError):
                read_review_reference(str(bundle) + '#missing')
            for reference in [str(bundle), str(bundle) + '#', '#key', str(bundle) + '#a#b']:
                with self.subTest(reference=reference), self.assertRaises(ValueError):
                    read_review_reference(reference)

    def test_all_approved_and_unverified_defender_reviews_are_retained(self):
        directory = ROOT / 'scripts/fixtures/removing-defender'
        store = ReviewStore(directory / 'reviews.json')
        approvals = json.loads((directory / 'approved.json').read_text())['records']
        keys = set()
        for approval in approvals:
            reference = approval['reviewEvidence']
            self.assertTrue(reference.startswith('reviews.json#'))
            key = reference.split('#', 1)[1]
            keys.add(key)
            review = store[key]
            self.assertEqual(review['id'], approval['id'])
            self.assertEqual(review_sha256(review), approval['evidenceSha256'])
            self.assertEqual(read_review_reference(directory / (key + '.json')), review)
            for field in ['sourceReview', 'sourceBatch']:
                if field in review:
                    source = read_review_reference(directory / review[field])
                    self.assertIsInstance(source, list)
                    self.assertTrue(source)
        batches = {'pilot-engine-review': 2, 'twic-pilot-review': 2, 'twic-batch-review': 6}
        for key, count in batches.items():
            self.assertEqual(len(store[key]), count)
            self.assertTrue(all(r['status'] == 'unverified' for r in store[key]))
        self.assertTrue(keys | batches.keys() <= store.records.keys())
        self.assertFalse(list(directory.glob('*-review.json')))

    def test_discovery_batches_resolve_complete_bundled_evidence_and_sources(self):
        directory = ROOT / 'scripts/fixtures/discovery'
        for path in directory.glob('level-*-expansion-*.json'):
            batch = json.loads(path.read_text())
            evidence = read_review_reference(directory / batch['evidenceFile'])
            sources = read_review_reference(directory / batch['sourceEvidenceFile'])
            ids = set(batch['order'])
            # Older batches also retain rejected/pending candidate evidence.
            self.assertTrue(ids <= {r['gameId'] for r in evidence['analyses']})
            self.assertTrue(ids <= {r['gameId'] for r in evidence['editorialReviews']})
            archives = {(r['url'], r['sha256']) for r in sources['sources']}
            for record in batch['records']:
                self.assertTrue(record['sourceReferences'])
                self.assertTrue({(r['url'], r['sha256']) for r in record['sourceReferences']} <= archives)
        self.assertFalse(list(directory.glob('level-*-expansion-*-review.json')))
        self.assertFalse(list(directory.glob('level-*-expansion-*-sources.json')))


if __name__ == '__main__':
    unittest.main()
