"""Regression checks for exact threat detection and approved rebuilds."""
import json
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

import chess

import defensive_move_research
from beginner_one_move import beginner_answer, require_unique_answer, source_beginner_proof
from defensive_move_research import mate_replies, start_board, threat_moves
from research_workflow import prepare_publication, verification_code
from tactic_research import ROOT, module


def exhaustive_mates(board):
    found = []
    for move in list(board.legal_moves):
        name = board.san(move)
        board.push(move)
        if board.is_checkmate():
            found.append(name)
        board.pop()
    return sorted(found)


class DefensiveMoveTest(unittest.TestCase):
    def test_mate_detection_matches_exhaustive_search_in_approved_positions(self):
        bundle = json.loads((ROOT / 'scripts/fixtures/defensive-move/published.json').read_text())
        for record in bundle['records']:
            with self.subTest(game=record['gameId']):
                board = start_board(record)
                if board.is_check():
                    self.assertEqual(record['level'], 'D')
                    self.assertTrue(defensive_move_research.immediate_refutations(board))
                else:
                    null = board.copy()
                    null.push(chess.Move.null())
                    self.assertEqual(sorted(threat_moves(board)), exhaustive_mates(null))
                safe = []
                for move in list(board.legal_moves):
                    san = board.san(move)
                    board.push(move)
                    mates = exhaustive_mates(board)
                    self.assertEqual(sorted(mate_replies(board)), mates)
                    if not mates or board.outcome() is not None:
                        safe.append(san)
                    board.pop()
                if record['level'] == 'Beginner':
                    self.assertLessEqual(board.occupied.bit_count(), 10)
                    self.assertGreater(board.legal_moves.count(), 1)
                    self.assertEqual(safe, record['moves'])

    def test_approved_data_rebuilds_exactly(self):
        builder = module('build-defensive-move')
        for name, rows in builder.build().items():
            self.assertEqual(json.loads((ROOT / name).read_text()), rows)

    def test_new_beginner_publication_requires_exact_objective_proof(self):
        bundle = json.loads((ROOT / 'scripts/fixtures/defensive-move/published.json').read_text())
        record = next(row for row in bundle['records'] if row['level'] == 'Beginner')
        ident = record['gameId']
        reviewed = next(row for row in bundle['reviewResults'] if row['gameId'] == ident)
        decision = next(row for row in bundle['reviews'] if row['gameId'] == ident)
        proof = source_beginner_proof(defensive_move_research, record)
        self.assertEqual(proof['answer'], record['moves'][0])
        report = {'topic': 'defensive-move', 'settings': bundle['settings'],
                  'quality': {'requiresProvenance': True}, 'inputSha256': 'test',
                  'verificationCodeSha256': verification_code(), 'candidates': [record],
                  'results': [reviewed]}
        with TemporaryDirectory() as directory:
            output = Path(directory) / 'approved.json'
            with self.assertRaisesRegex(ValueError, 'Current one-move Beginner proof'):
                prepare_publication(report, {'reviews': [decision]}, output)
            self.assertFalse(output.exists())
            report['results'] = [{**reviewed, 'beginnerProof': proof}]
            self.assertEqual(prepare_publication(report, {'reviews': [decision]}, output)['records'],
                             [record])

    def test_common_beginner_gate_fails_closed(self):
        board = chess.Board('7k/8/5KQ1/8/8/8/8/8 w - - 0 1')
        with self.assertRaisesRegex(ValueError, 'too-many-beginner-pieces'):
            beginner_answer(chess.Board(), ['e4'])
        for moves in ([], ['Qg7#', 'Kh7']):
            with self.assertRaisesRegex(ValueError, 'one-learner-move'):
                beginner_answer(board, moves)
        with self.assertRaisesRegex(ValueError, 'illegal-beginner-answer'):
            beginner_answer(board, ['--'])
        with self.assertRaisesRegex(ValueError, 'unresolved-beginner-topic-proof'):
            source_beginner_proof(object(), {})
        answer = beginner_answer(board, ['Qg7#'])
        moves = {board.san(move): board.gives_check(move) for move in board.legal_moves}
        with self.assertRaisesRegex(ValueError, 'exactly-one-sound-move'):
            require_unique_answer(board, answer, moves)
        for san in list(moves):
            after = board.copy()
            after.push_san(san)
            moves[san] = after.is_checkmate()
        self.assertEqual(require_unique_answer(board, answer, moves)['answer'], answer)
        with self.assertRaisesRegex(ValueError, 'unresolved-beginner-objective'):
            require_unique_answer(board, answer, {**moves, 'Qg7#': None})


if __name__ == '__main__':
    unittest.main()
