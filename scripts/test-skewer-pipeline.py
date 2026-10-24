"""Regression checks for source provenance and difficulty classification."""
import copy
import importlib.util
import json
from pathlib import Path
import sys
import unittest
import chess
sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('validator', ROOT/'scripts/validate-skewers.py')
validator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(validator)

class SkewerPipelineTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.records = json.loads((ROOT/'scripts/fixtures/skewer/audit.json').read_text())['records']

    def test_published_provenance_and_level(self):
        for record in self.records:
            with self.subTest(game=record['gameId']):
                self.assertIsNone(validator.provenance_error(record))
                line = validator.miner.inspect_line(chess.Board(record['fen']), [chess.Move.from_uci(m) for m in record['validation']['principalVariation']])
                self.assertIsNotNone(line)
                self.assertEqual(line['level'], record['level'])
                self.assertEqual(line['moves'], record['moves'])
                self.assertEqual(line['sacrifices'], record['sacrifices'])

    def test_publication_refuses_incomplete_quota(self):
        spec=importlib.util.spec_from_file_location('builder', ROOT/'scripts/build-skewers.py')
        builder=importlib.util.module_from_spec(spec)
        spec.loader.exec_module(builder)
        with self.assertRaisesRegex(ValueError, 'Not enough validated records'):
            builder.build([], minimum_per_level=50)

    def test_teaching_override_survives_rebuild(self):
        spec=importlib.util.spec_from_file_location('builder', ROOT/'scripts/build-skewers.py')
        builder=importlib.util.module_from_spec(spec)
        spec.loader.exec_module(builder)
        record=next(r for r in self.records if r['gameId']=='7ffe2bbc362d63a7')
        self.assertEqual(record['level'], 'A')
        self.assertEqual(builder.teaching_level(record), 'C')

    def test_mismatched_source_is_rejected(self):
        original = self.records[0]
        for field, value in [('fen', chess.STARTING_FEN), ('gameId', 'wrong-id'), ('ply', 0), ('previousMove', {'fen': chess.STARTING_FEN, 'move':'e4'})]:
            record = copy.deepcopy(original)
            record[field] = value
            self.assertIsNotNone(validator.provenance_error(record), field)
        self.assertIsNone(validator.provenance_error(original))

    def test_queen_pilot_duplicates_stay_out_of_level_a_on_rebuild(self):
        spec=importlib.util.spec_from_file_location('builder', ROOT/'scripts/build-skewers.py')
        builder=importlib.util.module_from_spec(spec)
        spec.loader.exec_module(builder)
        published=builder.publication_records(self.records)
        removed={r['gameId'] for r in self.records}-{r['gameId'] for r in published}
        self.assertEqual(removed, {'1171d868e56fd2ba', '071295b639b49091', '5e6922faa5542c14', '93dc2177f15c691f'})
        self.assertTrue(all(builder.teaching_level(r)=='A' for r in self.records if r['gameId'] in removed))

    def test_unique_games_and_positions(self):
        self.assertEqual(len({r['gameId'] for r in self.records}), len(self.records))
        self.assertEqual(len({' '.join(r['fen'].split()[:4]) for r in self.records}), len(self.records))

if __name__ == '__main__':
    unittest.main()
