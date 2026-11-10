"""Replay the durable proof and verify deterministic output."""
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from mate_in_one_research import collect
from tactic_research import ROOT, module


class MateInOneTest(unittest.TestCase):
    def test_rebuild_and_level_coverage(self):
        builder = module('build-mate-in-one')
        runtime = builder.build()
        for path, expected in runtime.items():
            self.assertEqual(json.loads((ROOT / path).read_text()), expected)
        exercises = runtime['src/lib/server/mate-in-one-exercises.json']
        for level in ('A', 'B'):
            rows = [row for row in exercises if row.get('difficulty', {}).get('level') == level]
            self.assertGreaterEqual(len(rows), 24)
            self.assertEqual({row['fen'].split()[1] for row in rows}, {'w', 'b'})
            self.assertTrue(all(len(row['moves']) == row['difficulty']['solverMoves'] == 1 for row in rows))
        beginner = [row for row in exercises if row.get('beginner')]
        self.assertGreaterEqual(len(beginner), 24)
        self.assertEqual({row['fen'].split()[1] for row in beginner}, {'w', 'b'})
        self.assertTrue(all(len(row['moves']) == 1 and not row['alternativeLines'] for row in beginner))

    def test_default_collection_limit_can_replay_an_indexed_game(self):
        bundle = json.loads((ROOT / 'scripts/fixtures/mate-in-one/published.json').read_text())
        record = next(row for row in bundle['records'] if row['level'] == 'A')
        source = {key: record[key] for key in (
            'gameId', 'gameFen', 'gameMoves', 'headers', 'source', 'sourceReferences')}
        with (tempfile.TemporaryDirectory() as directory,
              patch('collect_two_rook_mate.source_games', return_value=[source]),
              patch('mate_in_one_research.disposition', return_value=None)):
            path = Path(directory)
            report = collect(None, cache=path / 'cache.sqlite', workers=1,
                             output=path / 'leads.json', max_games=0,
                             levels=['A'], target=1, existing=[])
        self.assertTrue(report['requestedLeadTargetMet'])
        self.assertEqual(report['records'][0]['gameId'], record['gameId'])


if __name__ == '__main__':
    unittest.main()
