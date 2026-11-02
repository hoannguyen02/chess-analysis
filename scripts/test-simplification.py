import collections, hashlib, importlib.util, json, sys, unittest
from pathlib import Path
import chess
sys.dont_write_bytecode=True
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('builder',ROOT/'scripts/build-simplification.py')
builder=importlib.util.module_from_spec(spec);spec.loader.exec_module(builder)

class Simplification(unittest.TestCase):
    def test_each_level_has_twenty_to_thirty_distinct_games(self):
        records=json.loads((builder.DATA/'published.json').read_text())['records']
        counts=collections.Counter(r['level'] for r in records)
        for level in builder.miner.LEVELS:
            self.assertGreaterEqual(counts[level],20,level)
            self.assertLessEqual(counts[level],30,level)

    def test_promotion_then_equal_queen_trade_is_not_a_sacrifice(self):
        start=chess.Board('8/1p6/4P3/p4K1p/P2kN3/8/8/2q5 b - - 1 64')
        board=start.copy();pv=[]
        for san in ['Qf1+', 'Kg6', 'Qd3', 'Kf7', 'Qxe4', 'e7', 'h4', 'e8=Q', 'Qxe8+', 'Kxe8']:
            move=board.parse_san(san);pv.append(move);board.push(move)
        shape=builder.miner.inspect(start,pv)
        self.assertEqual(shape['level'],'C*')
        self.assertEqual(shape['sacrifices'],[])

    def test_real_games_and_payoff(self):
        records=json.loads((builder.DATA/'published.json').read_text())['records']
        cache=json.loads((builder.DATA/'tablebase.json').read_text())
        self.assertTrue(records)
        self.assertEqual(len(records),len({r['gameId'] for r in records}))
        self.assertEqual(len(records),len({r['fen'] for r in records}))
        for r in records:
            with self.subTest(game=r['gameId']):
                game=chess.Board(r['gameFen']);frames=[game.fen(en_passant='fen')]
                for san in r['gameMoves']:
                    game.push_san(san);self.assertTrue(game.is_valid());frames.append(game.fen(en_passant='fen'))
                self.assertEqual(hashlib.sha256(' '.join(m.uci() for m in game.move_stack).encode()).hexdigest()[:16],r['gameId'])
                self.assertEqual(frames[r['ply']],r['fen'])
                self.assertEqual(frames[r['ply']-1],r['previousMove']['fen'])
                self.assertEqual(r['gameMoves'][r['ply']-1],r['previousMove']['move'])
                start=chess.Board(r['fen']);board=start.copy()
                for san in r['moves']:board.push_san(san)
                self.assertEqual(board.fen(en_passant='fen'),r['endFen'])
                self.assertLessEqual(len(board.piece_map()),7)
                self.assertTrue(board.pawns)
                self.assertTrue(all(p.piece_type in [chess.KING,chess.PAWN] for p in board.piece_map().values()))
                expected=('win' if board.turn==start.turn else 'loss') if r['goal']=='win' else 'draw'
                self.assertEqual(cache[r['endFen']]['category'],expected)
                self.assertEqual(r['validation']['tablebaseCategory'],expected)
                shape=builder.miner.inspect(start,[chess.Move.from_uci(u) for u in r['validation']['principalVariation']])
                self.assertIsNotNone(shape)
                for k,v in shape.items():
                    expected=builder.miner.publication_level(dict(r,level=v)) if k=='level' else v
                    self.assertEqual(expected,r[k],k)
                if r['goal']=='draw':self.assertLessEqual(r['beforeMaterial'],-100)
                for defence in r['validation']['defences']:
                    self.assertGreaterEqual(defence['score'],150 if r['goal']=='win' else -40)
    def test_durable_editorial_overrides(self):
        published={r['gameId']:r for r in json.loads((builder.DATA/'published.json').read_text())['records']}
        for r in json.loads((builder.DATA/'reviewed.json').read_text())['records']:
            self.assertEqual(published[r['gameId']]['moves'],r['moves'])
            self.assertEqual(published[r['gameId']]['level'],builder.miner.publication_level(r))
    def test_plain_capture_is_not_simplification(self):
        b=chess.Board('7k/7p/8/8/8/8/q6P/R5K1 w - - 0 1')
        self.assertIsNone(builder.miner.inspect(b,[b.parse_san('Rxa2')]))
    def test_equal_trade_is_not_a_sacrifice(self):
        b=chess.Board('rk6/7p/8/8/8/8/5K1P/R7 w - - 0 1')
        pv=[chess.Move.from_uci(m) for m in ['a1a8','b8a8']]
        result=builder.miner.inspect(b,pv)
        self.assertIsNotNone(result)
        self.assertEqual(result['sacrifices'],[])
        self.assertEqual(result['level'],'A')
    def test_exchange_sacrifice(self):
        b=chess.Board('bk6/7p/8/8/8/8/5KPP/R7 w - - 0 1')
        result=builder.miner.inspect(b,[chess.Move.from_uci(m) for m in ['a1a8','b8a8']])
        self.assertIsNotNone(result)
        self.assertEqual(result['level'],'C')
        self.assertEqual(result['materialChange'],-170)
if __name__=='__main__':unittest.main()
