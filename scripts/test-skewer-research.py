"""Regression checks for Beginner Skewer proof and approved replay."""
import json
import unittest

import chess

from beginner_one_move import require_unique_answer
from skewer_research import beginner_outcomes, checking_skewer, provenance, start_board, verify_review
from tactic_research import ROOT, module


class SkewerResearchTest(unittest.TestCase):
    def test_all_replies_and_unique_short_gain(self):
        board = chess.Board('3q4/8/8/3k3K/8/8/8/7R w - - 0 1')
        move = board.parse_san('Rd1+')
        proof = checking_skewer(board, move)
        outcomes = beginner_outcomes(board, {'goal': 'material'})
        self.assertEqual(require_unique_answer(board, 'Rd1+', outcomes)['answer'], 'Rd1+')
        board.push(move)
        self.assertEqual(set(proof['witnesses']), {board.san(reply) for reply in board.legal_moves})
        for san, witness in proof['witnesses'].items():
            board.push_san(san)
            board.push_san(witness['capture'])
            self.assertEqual(set(witness['recovery']), {board.san(reply) for reply in board.legal_moves})
            board.pop()
            board.pop()

    def test_attacker_capture_and_rear_recapture_refute(self):
        for fen in (
                '3q4/8/8/3k3K/8/1b6/8/7R w - - 0 1',
                '3q4/8/8/3k2bK/8/8/8/7R w - - 0 1'):
            with self.subTest(fen=fen):
                board = chess.Board(fen)
                self.assertIsNone(checking_skewer(board, board.parse_san('Rd1+')))

    def test_competing_capture_keeps_a_pawn_after_equal_exchange(self):
        board = chess.Board('8/8/p2R2R1/1p6/8/r3k3/6PK/8 w - - 8 54')
        outcomes = beginner_outcomes(board, {'goal': 'material'})
        self.assertTrue(outcomes['Rg3+'])
        self.assertTrue(outcomes['Rxa6'])
        with self.assertRaisesRegex(ValueError, 'exactly-one-sound-move'):
            require_unique_answer(board, 'Rg3+', outcomes)

    def test_countercheck_prevents_settling_a_temporary_gain(self):
        board = chess.Board('8/8/p2R2R1/1p6/4r3/r3k3/6PK/8 w - - 8 54')
        outcomes = beginner_outcomes(board, {'goal': 'material'})
        self.assertEqual(require_unique_answer(board, 'Rg3+', outcomes)['answer'], 'Rg3+')

    def test_approved_catalog_rebuilds_and_replays_the_original(self):
        path = ROOT / 'scripts/fixtures/skewer/published.json'
        if not path.exists():
            self.skipTest('No Skewer source bundle yet')
        bundle = json.loads(path.read_text())
        rebuilt = module('build-skewer').build()
        for name, data in rebuilt.items():
            self.assertEqual(json.loads((ROOT / name).read_text()), data)
        sources = rebuilt['src/lib/server/skewer-game-sources.json']
        exercises = rebuilt['src/lib/chess/skewer-exercises.json']
        for record, result, exercise in zip(bundle['records'], bundle['reviewResults'], exercises, strict=True):
            self.assertFalse(provenance(record))
            verify_review(record, result)
            board = start_board(record)
            self.assertEqual(board.occupied.bit_count() <= 10, True)
            self.assertEqual(board.fen(en_passant='fen'), exercise['fen'])
            self.assertEqual(len(exercise['moves']), 1)
            self.assertEqual(sources[record['gameId']]['lines'], [record['gameMoves']])
            self.assertEqual(exercise['previousMove'], record['previousMove'])
            self.assertEqual(exercise['goal'], 'material')
            self.assertTrue(exercise['beginner'])


if __name__ == '__main__':
    unittest.main()
