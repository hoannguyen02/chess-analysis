"""Preservation checks for generated Hanging Piece practice data."""
from copy import deepcopy
import json
import unittest

import chess

from hanging_piece_beginner import approved_exercises, local_review
from hanging_piece_research import preflight
from tactic_research import ROOT, module


builder = module('build-hanging-piece')


class HangingPiecePublication(unittest.TestCase):
    def test_approved_evidence_rebuilds_every_runtime_file(self):
        for name, expected in builder.build().items():
            with self.subTest(file=name):
                self.assertEqual(json.loads((ROOT / name).read_text()), expected)

    def test_new_starred_grades_separate_short_and_deep_lines(self):
        bundle = json.loads((ROOT / builder.APPEND_MANIFESTS[builder.TOPIC]).read_text())
        short = next(row for row in bundle['records'] if row['level'] == 'B')
        deep = next(row for row in bundle['records'] if row['level'] == 'C*')
        self.assertEqual(preflight({**short, 'level': 'C*'}, True)['flags'], [])
        self.assertEqual(preflight({**deep, 'level': 'D*'}, True)['flags'], [])
        for record in (deep, {**short, 'level': 'D*'}):
            self.assertIn('invalid-level-or-payoff-length', preflight(record, True)['flags'])
        offered = {**deep, 'level': 'D*', 'sacrifices': [{'ply': 0, 'piece': 'B'}]}
        self.assertIn('invalid-or-unsuitable-start', preflight(offered, True)['flags'])

    def test_changed_source_candidate_or_evidence_cannot_rebuild(self):
        path = ROOT / builder.APPEND_MANIFESTS[builder.TOPIC]
        if not path.exists():
            self.skipTest('No source-derived bank has been published yet')
        bundle = json.loads(path.read_text())
        for key in ('records', 'reviewResults'):
            changed = deepcopy(bundle)
            changed[key][0]['moves'] = []
            with self.subTest(changed=key), self.assertRaisesRegex(ValueError, 'stale or incomplete'):
                builder.approved_games(changed)


class HangingPieceBeginnerReview(unittest.TestCase):
    def setUp(self):
        path = ROOT / 'scripts/fixtures/hanging-piece/beginner.json'
        if not path.exists():
            self.skipTest('No original composition bundle yet')
        self.bundle = json.loads(path.read_text())

    def test_reviewed_collection_and_coverage(self):
        exercises = approved_exercises(self.bundle)
        self.assertEqual(len(exercises), 24)
        self.assertEqual(len(self.bundle['coverageByFamily']), 24)
        self.assertEqual(set(self.bundle['coverageByFamily'].values()), {row['id'] for row in exercises})
        boards = [chess.Board(row['fen']) for row in exercises]
        self.assertEqual(sum(board.turn for board in boards), 12)
        self.assertEqual(
            {board.piece_type_at(board.parse_san(row['moves'][0]).from_square)
             for board, row in zip(boards, exercises)},
            set(chess.PIECE_TYPES),
        )
        for row, board, entry in zip(exercises, boards, self.bundle['entries']):
            board.push_san(row['moves'][0])
            replies = entry['review']['capture']['replies']
            with self.subTest(exercise=row['id']):
                self.assertEqual({reply['move'] for reply in replies},
                                 {board.san(move) for move in board.legal_moves})
                self.assertTrue(all(reply['gain'] >= row['hangingPiece']['minimumGain'] for reply in replies))
                self.assertNotIn('previousMove', row)
                self.assertNotIn('gameReference', row)

    def test_protected_capture_and_different_square_recovery_are_rejected(self):
        by_family = {entry['review']['candidate']['family']: entry['review']['candidate']
                     for entry in self.bundle['entries']}
        for family, unsafe_capture in [('pawn-choice', 'gxh6'), ('counter-capture', 'Rxf5')]:
            candidate = {**by_family[family], 'root': unsafe_capture}
            with self.subTest(family=family):
                self.assertIn('primary-does-not-safely-win-undefended-material',
                              local_review(candidate)['flags'])

    def test_changed_solution_copy_or_reply_evidence_fails_closed(self):
        for key, field, value in [('exercise', 'solution', 'Changed copy'),
                                  ('review', 'engineRoots', []),
                                  ('review', 'captureCandidates', [])]:
            changed = deepcopy(self.bundle)
            changed['entries'][0][key][field] = value
            with self.subTest(field=field), self.assertRaisesRegex(ValueError, 'stale'):
                approved_exercises(changed)


if __name__ == '__main__':
    unittest.main()
