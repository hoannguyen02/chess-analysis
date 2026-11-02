"""Regression checks for the five requested beginner additions (11–15)."""
import importlib.util,json,unittest
from pathlib import Path
import chess
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('review',ROOT/'scripts/review-pin-beginners.py')
review=importlib.util.module_from_spec(spec);spec.loader.exec_module(review)
class NewPins(unittest.TestCase):
 def test_pin_benefit_and_defence_evidence(self):
  records=json.loads((ROOT/'scripts/fixtures/pin/beginner-reviewed.json').read_text())
  ids={f'pin-beginner-essential-20261027-{i:02}' for i in range(11,16)}
  selected=[r for r in records if r['id'] in ids]
  self.assertEqual(len(selected),5)
  self.assertEqual({chess.Board(r['exercise']['fen']).turn for r in selected},{True,False})
  for r in selected:
   with self.subTest(id=r['id']):
    review.verify(r);review.verify_editorial(r)
    e=r['exercise'];b=chess.Board(e['fen']);self.assertEqual(len(b.piece_map()),6)
    root=b.parse_san(e['moves'][0]);color=b.turn
    expected={b.san(m) for m in b.legal_moves if b.is_capture(m) or b.gives_check(m)}
    self.assertEqual({p['root'] for p in r['rootProbes']},expected)
    for p in r['rootProbes']:
     if p['root']!=e['moves'][0]:
      self.assertLessEqual(p['worstMaterialAfterImmediateReply'],0)
      self.assertLessEqual(p['materialGainAfterContinuation'],0)
    unpinned=b.copy();unpinned.remove_piece_at(chess.parse_square(e['pinSetup']['pinner']))
    unpinned.push(root);self.assertIn(chess.Move.from_uci(r['counterfactual']['recapture']),unpinned.legal_moves)
    self.assertLess(r['counterfactual']['netCaptureTrade'],0)
    b.push(root)
    self.assertEqual({p['reply'] for p in r['defenceProbes']},{b.san(m) for m in b.legal_moves})
    self.assertTrue(all(p['materialGainAfterEightPlies']>=100 for p in r['defenceProbes']))
if __name__=='__main__':unittest.main()
