import json
from pathlib import Path
import sqlite3
import tempfile
import unittest

import chess
import chess.engine

from tactic_research import (ROOT, CachedEngine, ResearchCache, candidate_key,
                             atomic_json, digest, resume_reviews)
from discovery_research import early_gate, provenance, record_hash
from research_workflow import run_review, prepare_publication, SETTINGS, verification_code
from research_index import connect, disposition, import_corpus, sync_discovery
from research_publication import discovery_expansion
from review_store import read_review_reference, write_review_reference

FIXTURE = json.loads((ROOT / 'scripts/fixtures/research-benchmark/discovery-b.json').read_text())
APPROVED = json.loads((ROOT / 'scripts/fixtures/discovery/level-b-expansion-20261105.json').read_text())


class CacheTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.path = Path(self.directory.name) / 'research.sqlite'

    def tearDown(self):
        self.directory.cleanup()

    def test_exact_engine_settings_and_history_are_part_of_identity(self):
        with CachedEngine(cache=self.path) as engine:
            board = chess.Board()
            limit = chess.engine.Limit(nodes=1000)
            key = engine.request_key(board, limit, 1)
            self.assertNotEqual(key, engine.request_key(board, chess.engine.Limit(nodes=1001), 1))
            self.assertNotEqual(key, engine.request_key(board, limit, 2))
            self.assertNotEqual(key, engine.request_key(board, limit, 1, [board.parse_san('e4')]))
            engine.configure({'Hash': 128})
            self.assertNotEqual(key, engine.request_key(board, limit, 1))
            engine.configure({'Hash': 64})
            for san in ['Nf3', 'Nf6', 'Ng1', 'Ng8']:
                board.push_san(san)
            same_fen = chess.Board(board.fen())
            self.assertNotEqual(engine.request_key(board, limit, 1), engine.request_key(same_fen, limit, 1))

    def test_completed_engine_results_replay_without_launching_engine(self):
        board = chess.Board()
        with CachedEngine(cache=self.path) as engine:
            first = engine.analyse(board, chess.engine.Limit(nodes=1000), multipv=2)
            self.assertEqual(engine.stats['engineCalls'], 1)
        with CachedEngine(cache=self.path) as engine:
            second = engine.analyse(board, chess.engine.Limit(nodes=1000), multipv=2)
            self.assertEqual(engine.stats['engineCalls'], 0)
            self.assertIsNone(engine.engine)
            self.assertEqual([r['pv'] for r in first], [r['pv'] for r in second])
            self.assertEqual([str(r['score']) for r in first], [str(r['score']) for r in second])

    def test_changed_moves_objective_level_provenance_and_rules_invalidate_review(self):
        record = APPROVED['records'][0]
        key = candidate_key('discovery', record, SETTINGS)
        for change in [{'moves': ['Kh2']}, {'goal': 'mate'}, {'kind': 'check'}, {'level': 'C'},
                       {'sourceReferences': []}, {'fen': chess.Board().fen()}]:
            self.assertNotEqual(key, candidate_key('discovery', {**record, **change}, SETTINGS))
        self.assertNotEqual(key, candidate_key('discovery', record, {**SETTINGS, 'rootNodes': 2000000}))
        self.assertNotEqual(key, candidate_key('pin', record, SETTINGS))
        self.assertNotEqual(record_hash(record), record_hash({**record, 'headers': {**record['headers'], 'White': 'Changed identity'}}))

    def test_legacy_resume_requires_current_record_hash_and_policy(self):
        record = APPROVED['records'][0]
        row = {'gameId': record['gameId'], 'candidateHash': digest(record)}
        data = {'reviewPolicy': {'version': 1}, 'reviews': [row]}
        self.assertEqual(resume_reviews(data, [record], {'version': 1}), {record['gameId']})
        self.assertFalse(resume_reviews(data, [{**record, 'moves': ['Kh2']}], {'version': 1}))
        self.assertFalse(resume_reviews({'reviews': [row]}, [record], {'version': 1}))


class QualityTests(unittest.TestCase):
    def test_declined_rook_and_pawn_offers_are_withheld_before_engine_work(self):
        records = {r['gameId']: r for r in FIXTURE['records']}
        for ident in FIXTURE['mustFlagOffers']:
            gate = early_gate(records[ident], False)
            self.assertIn('offered-material-needs-level-review', gate['flags'])
            self.assertTrue(gate['offers'])

    def test_equal_exchanges_and_material_captures_do_not_become_sacrifices(self):
        for record in APPROVED['records']:
            with self.subTest(game=record['gameId']):
                gate = early_gate(record, True)
                self.assertNotIn('offered-material-needs-level-review', gate['flags'])
                self.assertFalse(provenance(record))

    def test_en_passant_offer_uses_the_captured_pawns_actual_square(self):
        # Synthetic legal line isolates offer detection, not publication eligibility.
        record = {'gameId': 'en-passant-unit-case',
                  'fen': 'r6k/8/8/8/3p4/8/4P3/R6K w - - 0 1',
                  'moves': ['e4', 'Kh7', 'Ra2'], 'level': 'A', 'goal': 'material',
                  'kind': 'attack', 'discoveryPly': 0, 'payoffPly': 2,
                  'sliderSquare': 'a1', 'targetSquare': 'a8', 'moverSquare': 'e4',
                  'sacrifices': [], 'solverMoves': 2}
        offers = early_gate(record, False)['offers']
        offer = next(row for row in offers if row['defence'] == 'dxe3')
        self.assertEqual(offer['piece'], 'P')
        self.assertEqual(offer['square'], 'e4')
        self.assertEqual(offer['captureDestination'], 'e3')

    def test_material_gained_during_a_mating_line_is_not_an_early_goal_violation(self):
        mate = next(r for r in APPROVED['records'] if r['goal'] == 'mate')
        self.assertNotIn('material-before-discovery', early_gate(mate, True)['flags'])

    def test_missing_or_altered_full_game_is_not_publishable_provenance(self):
        record = APPROVED['records'][0]
        self.assertIn('missing-complete-game', provenance({'fen': record['fen']}))
        self.assertIn('source-game-identity-mismatch', provenance({**record, 'gameId': 'not-the-game'}))
        self.assertIn('missing-checksummed-source', provenance({**record, 'sourceReferences': []}))

    def test_benchmark_and_engine_only_results_cannot_be_published(self):
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaisesRegex(ValueError, 'Benchmark-only'):
                prepare_publication({'quality': {'requiresProvenance': False}}, {'reviews': []}, Path(directory) / 'bad.json')
            record = APPROVED['records'][0]
            report = {'topic': 'discovery', 'quality': {'requiresProvenance': True},
                      'candidates': [record], 'results': [{'gameId': record['gameId'],
                       'status': 'needs-editorial-review', 'flags': [], 'recordHash': record_hash(record)}]}
            with self.assertRaisesRegex(ValueError, 'editorial'):
                prepare_publication(report, {'reviews': [{'gameId': record['gameId'], 'decision': 'keep',
                    'recordHash': record_hash(record)}]}, Path(directory) / 'bad.json')

    def test_unsupported_topic_has_no_generic_verification_fallback(self):
        with self.assertRaisesRegex(ValueError, 'adapter'):
            run_review([], topic='unimplemented-pin-adapter')

    def test_publication_checks_all_roots_and_emits_existing_builder_format(self):
        record = APPROVED['records'][0]
        evidence = read_review_reference(ROOT / 'scripts/fixtures/discovery/expansion-evidence.json#level-b-expansion-20261105-review')
        ident = record['gameId']
        result = {'gameId': ident, 'status': 'needs-editorial-review', 'flags': [],
                  'fen': record['fen'], 'moves': record['moves'], 'recordHash': record_hash(record),
                  'analysis': next(r for r in evidence['analyses'] if r['gameId'] == ident),
                  'timeline': next(r for r in evidence['timelines'] if r['gameId'] == ident),
                  'shortcuts': next(r for r in evidence['shortcuts'] if r['gameId'] == ident)}
        review = {'topic': 'discovery', 'quality': {'requiresProvenance': True},
                  'verificationCodeSha256': verification_code(),
                  'settings': SETTINGS, 'inputSha256': digest([record]),
                  'candidates': [record], 'results': [result]}
        decision = {**APPROVED['reviews'][0], 'recordHash': record_hash(record),
                    'distinctness': 'Test-only explicit editorial approval of the ordered double clearance.'}
        decisions = {'reviews': [decision], 'coverageChecklist': APPROVED['coverageChecklist']}
        with tempfile.TemporaryDirectory() as directory:
            directory = Path(directory)
            with self.assertRaisesRegex(ValueError, 'shallow'):
                prepare_publication({**review, 'settings': {**SETTINGS, 'rootNodes': 1}}, decisions, directory / 'bad.json')
            with self.assertRaisesRegex(ValueError, 'Every legal'):
                prepare_publication({**review, 'results': [{**result, 'analysis': {'roots': []}}]}, decisions, directory / 'bad.json')
            with self.assertRaisesRegex(ValueError, 'Verification code'):
                prepare_publication({**review, 'verificationCodeSha256': 'stale'}, decisions, directory / 'bad.json')
            bundle = prepare_publication(review, decisions, directory / 'approved.json')
            fixtures = directory / 'scripts/fixtures/discovery'
            fixtures.mkdir(parents=True)
            atomic_json(fixtures / 'published.json', {'records': []})
            atomic_json(fixtures / 'excluded.json', [])
            atomic_json(directory / 'src/lib/server/practice-adjustments.json', [])
            output = directory / 'level-b-expansion-20261105.json'
            sibling = output.parent / 'expansion-evidence.json#previous-review'
            write_review_reference(sibling, {'approved': 'preserve this evidence'})
            manifest = discovery_expansion(bundle, decisions, output, root=directory)
            self.assertEqual(manifest['order'], [ident])
            self.assertEqual(manifest['sourceCountLimit'], 1)
            self.assertEqual(manifest['reviews'][0]['coverage']['mover'], 'N')
            self.assertEqual(read_review_reference(output.parent / manifest['evidenceFile'])['editorialReviews'], manifest['reviews'])
            self.assertTrue(read_review_reference(output.parent / manifest['sourceEvidenceFile'])['sources'])
            self.assertFalse(list(output.parent.glob('*-review.json')))
            self.assertFalse(list(output.parent.glob('*-sources.json')))
            self.assertEqual(read_review_reference(sibling), {'approved': 'preserve this evidence'})
            with self.assertRaisesRegex(ValueError, 'overwrite'):
                discovery_expansion(bundle, decisions, output, root=directory)

    def test_pool_exits_and_warm_resume_makes_no_engine_requests(self):
        with tempfile.TemporaryDirectory() as directory:
            record = APPROVED['records'][0]
            cache = Path(directory) / 'cache.sqlite'
            settings = {**SETTINGS, 'rootNodes': 10000}
            first = run_review([record], cache=cache, settings=settings, workers=2, progress=False)
            second = run_review([record], cache=cache, settings=settings, workers=2, progress=False)
            self.assertGreater(first['metrics']['engineCalls'], 0)
            self.assertEqual(second['metrics']['engineCalls'], 0)
            self.assertEqual(first['results'][0]['flags'], second['results'][0]['flags'])


class IndexTests(unittest.TestCase):
    def test_owner_decisions_and_level_specific_rejections_are_separate(self):
        with tempfile.TemporaryDirectory() as directory:
            db = connect(Path(directory) / 'index.sqlite')
            sync_discovery(db)
            adjustments = json.loads((ROOT / 'src/lib/server/practice-adjustments.json').read_text())
            for entry in adjustments:
                if entry['reference']['scope'] == '/discovered-attack':
                    record = {'fen': entry['reference']['fen'], 'level': 'B'}
                    actual = disposition(db, 'discovery', record)
                    self.assertIn(actual['status'], ('removed', 'transferred', 'manual'))
            pawn = next(r for r in FIXTURE['records'] if r['gameId'] == 'bb8a2206e82c4bf6')
            self.assertEqual(disposition(db, 'discovery', pawn)['status'], 'rejected')
            self.assertIsNone(disposition(db, 'discovery', {**pawn, 'level': 'C'}))
            db.close()

    def test_corpus_import_is_replayed_once_and_deduplicated(self):
        with tempfile.TemporaryDirectory() as directory:
            directory = Path(directory)
            db = connect(directory / 'index.sqlite')
            record = APPROVED['records'][0]
            source = record['sourceReferences'][0]
            record = {**record, 'source': source['url']}
            path = directory / 'corpus.json'
            atomic_json(path, {'records': [record]})
            manifest = {'sources': [source]}
            first = import_corpus(db, path, manifest)
            self.assertTrue(first['complete'])
            self.assertFalse(first['reused'])
            self.assertTrue(import_corpus(db, path, manifest)['reused'])
            self.assertEqual(db.execute('SELECT count(*) FROM games').fetchone()[0], 1)
            self.assertEqual(db.execute('SELECT count(*) FROM sources').fetchone()[0], 1)
            self.assertEqual(db.execute('SELECT count(*) FROM matches').fetchone()[0], 0)
            db.close()


if __name__ == '__main__':
    unittest.main()
