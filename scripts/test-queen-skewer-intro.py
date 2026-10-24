"""Independent checks of the composed introductory set and stored engine evidence."""
import json, unittest, importlib.util
from pathlib import Path
from collections import Counter
import chess
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('old',ROOT/'scripts/build-quiet-beginner-skewers.py')
old=importlib.util.module_from_spec(spec);spec.loader.exec_module(old)
class IntroTests(unittest.TestCase):
 def test_sparse_diverse_legal_engine_lines(self):
  rows=json.loads((ROOT/'scripts/fixtures/skewer/queen-intro-audit.json').read_text())
  web=json.loads((ROOT/'src/lib/server/queen-skewer-intro.json').read_text())
  self.assertEqual(len(rows),10)
  self.assertEqual(web,[r['exercise'] for r in rows])
  self.assertEqual(Counter(chess.Board(e['fen']).turn for e in web),{chess.WHITE:5,chess.BLACK:5})
  self.assertEqual(Counter(r['axis'] for r in rows if not r.get('kind')),{'diagonal': 5, 'file': 3, 'rank': 2})
  self.assertEqual(Counter(r['support'] for r in rows),{'pawn': 1, 'king': 2, 'rook': 3, 'queen': 2, 'knight': 2})
  seen=set()
  other=json.loads((ROOT/'src/lib/chess/skewer-exercises.json').read_text())+json.loads((ROOT/'src/lib/server/queen-skewer-pilot.json').read_text())
  existing={' '.join(e['fen'].split()[:4]) for e in other}
  for r in rows:
   with self.subTest(title=r['exercise']['title']):
    e=r['exercise']; b=chess.Board(e['fen']);side=b.turn
    self.assertTrue(b.is_valid());self.assertFalse(b.is_check())
    self.assertLessEqual(len(b.piece_map()),7)
    for color in (chess.WHITE,chess.BLACK):
     bishops=list(b.pieces(chess.BISHOP,color))
     self.assertLessEqual(len(bishops),2)
     if len(bishops)==2:self.assertNotEqual(bool(chess.BB_SQUARES[bishops[0]]&chess.BB_LIGHT_SQUARES),bool(chess.BB_SQUARES[bishops[1]]&chess.BB_LIGHT_SQUARES))
    key=old.canonical(b);self.assertNotIn(key,seen);seen.add(key)
    self.assertNotIn('gameReference',e)
    self.assertNotIn(' '.join(e['fen'].split()[:4]),existing)
    cs=r['rootCandidates']; chosen=next(c for c in cs if c['move']==e['moves'][0])
    if any(c['mate'] is not None for c in cs):
     self.assertIsNotNone(chosen['mate']);self.assertGreater(chosen['mate'],0)
     self.assertEqual(chosen['mate'],min(c['mate'] for c in cs if c['mate'] is not None))
    else:
     self.assertGreaterEqual(chosen['scoreCp'],-80)
     self.assertLessEqual(max(c['scoreCp'] for c in cs)-chosen['scoreCp'],40)
    self.assertGreaterEqual(r['rootSelected'],-80)
    self.assertLessEqual(r['rootBest']-r['rootSelected'],40)
    initial=sum(old.VALUES[p.piece_type]*(1 if p.color==side else -1) for p in b.piece_map().values())
    first=b.parse_san(e['moves'][0]); b.push(first)
    self.assertFalse(b.is_check())
    queens=b.pieces(chess.QUEEN,not side)
    self.assertTrue(any(q in b.attacks(first.to_square) for q in queens))
    rear=[s for s,piece in b.piece_map().items() if piece.color!=side and piece.piece_type not in (chess.QUEEN,chess.KING)]
    self.assertTrue(any(chess.between(first.to_square,t)&chess.BB_SQUARES[q] and b.occupied&chess.between(first.to_square,t)==chess.BB_SQUARES[q] and not b.is_pinned(not side,q) for q in queens for t in rear))
    self.assertTrue(any(chess.piece_name(b.piece_at(s).piece_type)==r['support'] for s in b.attackers(side,first.to_square)))
    for san,check in zip(e['moves'][1:],r['checks']):
     self.assertEqual(b.fen(),check['fen']);self.assertEqual(san,check['move']);self.assertIsNone(b.push_san(san).promotion)
    self.assertEqual(b.fen(),r['finalFen'])
    self.assertFalse(b.is_stalemate())
    self.assertFalse(b.is_checkmate() and b.turn==side)
    gain=sum(old.VALUES[p.piece_type]*(1 if p.color==side else -1) for p in b.piece_map().values())-initial
    self.assertEqual(gain,r['gain']);self.assertGreaterEqual(gain,2)
if __name__=='__main__':unittest.main()
