from review_store import ReviewStore
from mate_proof_store import read_proof_reference
"""Selection and legal coverage regressions, separate from engine evidence."""
import json,unittest
from pathlib import Path
import chess
ROOT=Path(__file__).resolve().parents[1];D=ROOT/'scripts/fixtures/promotion-family-review'
def read(p):return json.loads(p.read_text())
class Family(unittest.TestCase):
 def test_selection_and_every_root(self):
  for slug,selection in read(D/'selection.json').items():
   published=read(ROOT/'src/lib/server'/f'{slug}-exercises.json')[0]['exercises']
   self.assertEqual({e['id'] for e in published},{r['id'] for r in selection['reviews'] if r['status']=='retained'})
   for r in selection['reviews']:
    audit=ReviewStore(D/(slug+'-reviews.json'))[r['index']];b=chess.Board(r['fen'])
    self.assertEqual({b.san(m) for m in b.legal_moves},{x['move'] for x in audit['roots']})
    self.assertEqual(audit['moves'],r['moves'])
   for level,c in selection['coverage'].items():
    self.assertEqual(c['count'],sum(('Beginner' if e.get('beginner') else e['difficulty']['level'])==level for e in published))
    self.assertEqual(c['gap'],max(0,24-c['count']))
 def test_added_positions_have_full_defensive_certificates(self):
  from two_rook_mate_proof import verify_certificate
  for r in read(D/'additions.json'):
   proof=read_proof_reference(ROOT/r['certificate']);self.assertEqual(proof['fen'],r['fen']);verify_certificate(proof)
 def test_beginner_capture_mate_removes_defender(self):
  rows=read(ROOT/'src/lib/server/promotion-mate-exercises.json')[0]['exercises']
  e=next(e for e in rows if e.get('beginner') and e['moves'][0]=='bxc8=Q#')
  b=chess.Board(e['fen']);b.push_san('b8=Q');b.push_san('Rxb8');self.assertFalse(b.is_checkmate())
  b=chess.Board(e['fen']);b.push_san('bxc8=Q#');self.assertTrue(b.is_checkmate())
if __name__=='__main__':unittest.main()
