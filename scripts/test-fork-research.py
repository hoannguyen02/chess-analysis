"""Focused safeguards for the shared real-game Fork review adapter."""
import json
from pathlib import Path
import tempfile
import unittest

import chess
import chess.engine

from tactic_research import ROOT
from fork_research import (early_gate, record_hash, root_review, start_board, review,
                           sacrifice_review, timeline_review_d, _mate_response_within_two,
                           _targeted_continuation)
from research_index import connect, disposition, sync_topic_decisions
from research_workflow import ADAPTERS


class ForkResearchTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        records = json.loads((ROOT / 'scripts/fixtures/fork/published.json').read_text())['records']
        cls.record = dict(next(row for row in records if row['gameId'] == '134afe6e4bec377f'), goal='material')
        cls.by_id = {row['gameId']: dict(row, goal='material') for row in records}

    def test_real_direct_fork_and_every_local_defence_survive_preflight(self):
        gate = early_gate(self.record, False)
        self.assertFalse(gate['flags'])
        board = chess.Board(self.record['fen'])
        board.push_san(self.record['moves'][0])
        self.assertEqual(set(gate['coverage']), {board.san(move) for move in board.legal_moves})
        self.assertIn(self.record['moves'][-1], gate['coverage'][self.record['moves'][1]])

    def test_position_history_is_preserved_for_cached_engine_requests(self):
        board = start_board(self.record)
        self.assertEqual(board.fen(en_passant='fen'), self.record['fen'])
        self.assertEqual(len(board.move_stack), self.record['ply'])
        with self.assertRaisesRegex(ValueError, 'Source position'):
            start_board(dict(self.record, fen=chess.Board().fen()))

    def test_changed_record_provenance_goal_and_level_invalidate_hash(self):
        for change in ({'goal': 'mate'}, {'level': 'B'}, {'moves': ['Kh1']},
                       {'sourceReferences': []}, {'headers': {}}):
            self.assertNotEqual(record_hash(self.record), record_hash(dict(self.record, **change)))

    def test_later_levels_and_solutionless_or_mate_objectives_are_not_approved(self):
        gate = early_gate(dict(self.record, goal='mate', level='C'), False)
        self.assertIn('unsupported-fork-objective', gate['flags'])
        self.assertIn('unsupported-fork-level', gate['flags'])
        gate = early_gate(dict(self.record, level='B'), False)
        self.assertIn('level-B-needs-one-preparation', gate['flags'])

    def test_declined_en_passant_offer_uses_actual_captured_pawn_square(self):
        record = {'gameId': 'ep-test', 'fen': '7k/8/8/3n1r2/3p4/8/4P3/6K1 w - - 0 1',
                  'moves': ['e4', 'Kh7', 'exd5'], 'forkPly': 0, 'forkSquare': 'e4',
                  'forkPiece': 'P', 'targets': ['d5', 'f5'], 'level': 'A', 'goal': 'material',
                  'solverMoves': 2, 'sacrifices': []}
        gate = early_gate(record, False)
        self.assertIn('offered-material-needs-level-review', gate['flags'])
        offer = next(row for row in gate['offers'] if row['defence'] == 'dxe3')
        self.assertEqual(offer['square'], 'e4')
        self.assertEqual(offer['captureDestination'], 'e3')
        self.assertEqual(offer['piece'], 'P')

    def test_all_legal_roots_are_compared_and_partial_multipv_fails_closed(self):
        record = self.record
        class Engine:
            def __init__(self, partial=False):
                self.partial = partial
            def analyse(self, board, limit, multipv=None):
                self.history = len(board.move_stack)
                self.count = multipv
                moves = list(board.legal_moves)
                if self.partial:
                    moves = moves[:-1]
                return [{'pv': [move], 'score': chess.engine.PovScore(chess.engine.Cp(200), board.turn)}
                        for move in moves]
        engine = Engine()
        roots = root_review(record, engine, 1000000)['roots']
        board = chess.Board(record['fen'])
        self.assertEqual({row['move'] for row in roots}, {board.san(move) for move in board.legal_moves})
        self.assertEqual(engine.count, board.legal_moves.count())
        self.assertEqual(engine.history, record['ply'])
        with self.assertRaisesRegex(ValueError, 'Every legal root'):
            root_review(record, Engine(True), 1000000)

    def test_invalid_provenance_stops_before_engine_work(self):
        class Engine:
            def analyse(self, *args, **kwargs):
                raise AssertionError('Preflight should stop before engine work')
        result = review(self.record, Engine(), {}, require_provenance=True)
        self.assertEqual(result['status'], 'withheld')
        self.assertIn('missing-checksummed-source', result['flags'])

    def test_registered_topic_sync_preserves_owner_decisions_and_publications(self):
        self.assertEqual(ADAPTERS['fork'], 'fork_research')
        with tempfile.TemporaryDirectory() as directory:
            db = connect(Path(directory) / 'index.sqlite')
            sync_topic_decisions(db, 'fork')
            decision = disposition(db, 'fork', self.record)
            self.assertIsNotNone(decision)
            adjustments = json.loads((ROOT / 'src/lib/server/practice-adjustments.json').read_text())
            for entry in adjustments:
                if (entry['reference']['scope'] == '/fork'
                        and entry['reference']['baseLevel'] != 'Beginner'):
                    actual = disposition(db, 'fork', {'fen': entry['reference']['fen'], 'level': 'A'})
                    self.assertIn(actual['status'], ('manual', 'removed', 'transferred'))
            # A removed Beginner copy of this real-game A position must leave
            # its source-game publication approved.
            source = next(row for row in json.loads((ROOT / 'scripts/fixtures/fork/published.json').read_text())['records']
                          if row['gameId'] == '276ff4248ed22e13')
            self.assertEqual(disposition(db, 'fork', source)['status'], 'approved')
            db.close()

    def test_D_requires_actual_unequal_sacrifice_and_more_than_three_solver_moves(self):
        short = early_gate(dict(self.record, level='D', sacrifices=[{'ply': 0, 'piece': 'N'}]), False)
        self.assertIn('level-D-needs-more-than-three-solver-moves', short['flags'])
        self.assertIn('level-D-needs-accepted-unequal-sacrifice', short['flags'])
        self.assertIn('recorded-sacrifice-not-validated', short['flags'])
        # A played queen offer really loses material until the later fork.
        accepted = early_gate(self.by_id['494d7b9a1adbc963'], False)
        self.assertFalse(accepted['flags'])
        sacrifice = accepted['sacrificeReview']['accepted'][0]
        self.assertEqual((sacrifice['offeredPly'], sacrifice['piece']), (2, 'Q'))
        self.assertEqual(sacrifice['materialAfterCaptureCp'], -400)
        self.assertEqual(sacrifice['materialAfterNextSolverCp'], -400)

    def test_D_minor_sacrifices_are_eligible_but_immediately_recovered_rook_is_not(self):
        minor = early_gate(self.by_id['a47d25d30e9bd45c'], False)
        self.assertFalse(minor['flags'])
        self.assertEqual([row['piece'] for row in minor['sacrificeReview']['accepted']], ['B', 'B'])
        recovered = early_gate(self.by_id['e9d6150b67b1a32b'], False)
        self.assertIn('level-D-needs-accepted-unequal-sacrifice', recovered['flags'])
        self.assertFalse(recovered['sacrificeReview']['accepted'])
        self.assertTrue(recovered['sacrificeReview']['recoveredExchanges'])

    def test_D_temporary_queen_recapture_is_settled_through_following_rook_recapture(self):
        # Minimal legal capture chain isolates the cost accounting; this is
        # not a publication candidate or a claim of a genuine fork exercise.
        record = {'fen': '1qr4k/2b5/8/8/8/6Q1/8/2R4K w - - 0 1',
                  'moves': ['Rxc7', 'Qxc7', 'Qxc7', 'Rxc7'],
                  'forkPly': 4, 'sacrifices': [{'ply': 0, 'piece': 'R'}]}
        classified = sacrifice_review(record)
        rook = classified['accepted'][0]
        self.assertEqual(rook['piece'], 'R')
        self.assertEqual(rook['materialAfterNextSolverCp'], 730)
        self.assertEqual(rook['materialAfterCaptureChainCp'], -170)

    def test_D_promotion_compensation_does_not_turn_queen_sacrifice_into_equal_exchange(self):
        record = {'fen': '7k/3P2p1/5b2/8/5Q2/8/8/7K w - - 0 1',
                  'moves': ['Qxf6', 'gxf6', 'd8=Q+', 'Kh7', 'Qd3'],
                  'forkPly': 4, 'sacrifices': [{'ply': 0, 'piece': 'Q'}]}
        classified = sacrifice_review(record)
        queen = classified['accepted'][0]
        self.assertEqual(queen['piece'], 'Q')
        self.assertEqual(queen['materialAfterCaptureCp'], -570)
        self.assertEqual(queen['materialAfterNextSolverCp'], 230)
        self.assertEqual(queen['materialAfterCaptureChainCp'], -570)

    def test_D_different_square_immediate_equal_recovery_on_fork_ply_is_not_sacrifice(self):
        # Kxd4 takes one knight; Rdxd6+ takes the other knight immediately.
        # The later pawn fork does not make that equal trade a sacrifice.
        record = {'fen': '4r3/7R/1R1nk1p1/r4p2/8/7P/2N2PP1/6K1 w - - 0 42',
                  'moves': ['Nd4+', 'Kd5', 'Rd7', 'Kxd4', 'Rdxd6+', 'Kc4', 'Rxg6'],
                  'forkPly': 4, 'sacrifices': [{'ply': 0, 'piece': 'N'}]}
        classified = sacrifice_review(record)
        self.assertFalse(classified['accepted'])
        knight = classified['recoveredExchanges'][0]
        self.assertEqual(knight['materialAfterCaptureCp'], -320)
        self.assertEqual(knight['materialAfterNextSolverCp'], 0)
        self.assertEqual(knight['materialAfterCaptureChainCp'], 0)
        self.assertEqual(knight['immediateExchangeRecovery']['move'], 'Rdxd6+')
        self.assertTrue(knight['immediateExchangeRecovery']['onForkPly'])
        self.assertEqual(knight['immediateExchangeRecovery']['allImmediateRecaptures'], [])
        self.assertEqual(classified['unvalidatedClaims'], [{'ply': 0, 'piece': 'N'}])

    def test_D_actual_en_passant_sacrifice_retains_pawn_square_and_material_cost(self):
        record = {'fen': 'r6k/8/8/8/3p4/8/4P3/R6K w - - 0 1',
                  'moves': ['e4', 'dxe3', 'Ra2', 'Kh7', 'Rh2+'], 'forkPly': 4,
                  'sacrifices': [{'ply': 0, 'piece': 'P'}]}
        result = sacrifice_review(record)
        self.assertFalse(result['unvalidatedClaims'])
        pawn = result['accepted'][0]
        self.assertEqual((pawn['square'], pawn['captureDestination']), ('e4', 'e3'))
        self.assertEqual(pawn['materialAfterCaptureCp'], -100)

    def test_D_defence_scores_without_material_or_mate_evidence_remain_unresolved(self):
        class Engine:
            def __init__(self):
                self.calls = []
            def analyse(self, board, limit, multipv=None, root_moves=None):
                self.calls.append((limit.nodes, multipv, tuple(root_moves or [])))
                moves = list(root_moves) if root_moves else list(board.legal_moves)
                infos = [{'pv': [move], 'score': chess.engine.PovScore(chess.engine.Cp(200), board.turn)}
                         for move in moves]
                return infos[:multipv] if multipv is not None else infos[0]
        engine = Engine()
        result = timeline_review_d(self.by_id['90644a1dda653786'], engine, 150000, 500000)
        self.assertTrue(any('unresolved' in flag for flag in result['flags']))
        for stage in result['sacrificeDefences']:
            self.assertEqual(stage['allLegalReplyCount'], len(stage['allReplyComparison']))
            self.assertEqual(len({row['move'] for row in stage['allReplyComparison']}), stage['allLegalReplyCount'])
            captures = {row['move'] for row in stage['allReplyComparison'] if 'capture' in row['selectedReasons']}
            self.assertTrue(captures <= {row['move'] for row in stage['probedReplies']})
        accepted = next(row for row in result['sacrificeDefences'][0]['probedReplies'] if row['move'] == 'Kxh3')
        self.assertEqual(accepted['capturedPiece'], 'R')
        self.assertGreaterEqual(accepted['nodesBudget'], 500000)
        self.assertTrue(any(allowed for _nodes, _multipv, allowed in engine.calls))

    def test_D_distinguishes_distant_engine_mate_from_unresolved_simpler_mate(self):
        record = self.by_id['90644a1dda653786']
        class Engine:
            def __init__(self, mate):
                self.mate = mate
            def analyse(self, board, limit, multipv=None):
                first = board.parse_san(record['moves'][0])
                return [{'pv': [move], 'score': chess.engine.PovScore(
                    chess.engine.Mate(self.mate) if move == first else chess.engine.Cp(0), board.turn)}
                        for move in board.legal_moves]
        distant = root_review(record, Engine(8), 1000000)
        self.assertNotIn('unresolved-root-mating-lead', distant['flags'])
        self.assertFalse(distant['matingLeads'][0]['withinSampleSolverMoves'])
        near = root_review(record, Engine(4), 1000000)
        self.assertIn('unresolved-root-mating-lead', near['flags'])
        self.assertEqual(near['matingLeads'][0]['status'], 'engine-lead-not-all-reply-proof')

    def test_short_mate_response_is_a_legal_certificate_not_an_engine_score(self):
        board = chess.Board('7k/5Q2/6K1/8/8/8/8/8 w - - 0 1')
        proof = _mate_response_within_two(board)
        self.assertIsNotNone(proof)
        board.push_san(proof['first'])
        if proof['solverMoves'] == 1:
            self.assertTrue(board.is_checkmate())
        else:
            self.assertEqual(set(proof['replies']), {board.san(move) for move in board.legal_moves})
            for reply, mate in proof['replies'].items():
                after = board.copy()
                after.push_san(reply)
                after.push_san(mate)
                self.assertTrue(after.is_checkmate())

    def test_D_targeted_continuation_resolves_truncated_defence_with_history_and_actual_payoff(self):
        record = self.by_id['90644a1dda653786']
        board = start_board(record)
        side = board.turn
        from fork_research import miner
        baseline = miner.material(board, side)
        board.push_san('Rh3+')
        board.push_san('Kxh3')
        class Engine:
            def analyse(self, position, limit, multipv=None):
                self.history = len(position.move_stack)
                self.budget = limit.nodes
                self.multi = multipv
                walked = position.copy()
                pv = []
                for san in ['Rg3+', 'Kh4', 'Nf3+', 'Kh5', 'Nxd4']:
                    move = walked.parse_san(san)
                    pv.append(move)
                    walked.push(move)
                others = [move for move in position.legal_moves if move != pv[0]][:multipv - 1]
                return [{'pv': pv, 'score': chess.engine.PovScore(chess.engine.Cp(500), side),
                         'nodes': 1000000, 'depth': 22}] + [
                    {'pv': [move], 'score': chess.engine.PovScore(chess.engine.Cp(0), side)} for move in others]
        engine = Engine()
        result = _targeted_continuation(record, ['Rh3+'], 'Kxh3', board, engine, side, baseline, 1000)
        self.assertTrue(result['resolved'])
        self.assertEqual(engine.history, record['ply'] + 2)
        self.assertGreaterEqual(engine.budget, 1000000)
        self.assertEqual(engine.multi, 3)
        best = result['continuations'][0]
        self.assertEqual(best['line'], ['Rg3+', 'Kh4', 'Nf3+', 'Kh5', 'Nxd4'])
        self.assertEqual(best['pv'][0], 'g5g3')
        self.assertGreaterEqual(best['boundedMaterialWitness']['gainCp'], 100)
        self.assertEqual(best['nodes'], 1000000)

    def test_D_targeted_continuation_positive_scores_without_payoff_stay_unresolved(self):
        record = self.by_id['90644a1dda653786']
        board = start_board(record)
        side = board.turn
        from fork_research import miner
        baseline = miner.material(board, side)
        board.push_san('Rh3+')
        board.push_san('Kxh3')
        class Engine:
            def __init__(self, partial=False):
                self.partial = partial
            def analyse(self, position, limit, multipv=None):
                count = multipv - 1 if self.partial else multipv
                return [{'pv': [move], 'score': chess.engine.PovScore(chess.engine.Cp(900), side)}
                        for move in list(position.legal_moves)[:count]]
        result = _targeted_continuation(record, ['Rh3+'], 'Kxh3', board, Engine(), side, baseline, 1000000)
        self.assertFalse(result['resolved'])
        self.assertEqual(result['status'], 'unresolved-continuation')
        self.assertTrue(all(row['scoreCp'] == 900 for row in result['continuations']))
        self.assertTrue(all(row['exactShortMateResponse'] is None for row in result['continuations']))
        with self.assertRaisesRegex(ValueError, 'Incomplete targeted continuation'):
            _targeted_continuation(record, ['Rh3+'], 'Kxh3', board, Engine(True), side, baseline, 1000000)


if __name__ == '__main__':
    unittest.main()
