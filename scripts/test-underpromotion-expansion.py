from promotion_review_store import ReviewStore
from mate_proof_store import MateProofStore
"""Independent legal proofs, alternative choices, provenance and coverage checks."""
import json,chess,unittest
from pathlib import Path
from two_rook_mate_proof import verify_certificate
ROOT=Path(__file__).resolve().parents[1];D=ROOT/'scripts/fixtures/promotion-expansion'
proof_store=MateProofStore(D.parent/'promotion')
def read(p):return json.loads(p.read_text())
class Expansion(unittest.TestCase):
 def test_all_certificates_and_roots(self):
  for r in read(D/'candidates.json'):
   b=chess.Board(r['fen']);proof=proof_store[r['id']];self.assertEqual(proof['fen'],r['fen']);self.assertEqual(proof['moves'],r['moves'])
   roots=ReviewStore(D/'root-reviews.json')[r['id']]['roots'];self.assertEqual({x['move'] for x in roots},{b.san(m) for m in b.legal_moves})
   if r['goal']=='checkmate':verify_certificate(proof)
   else:
    self.assertEqual(len(b.piece_map()),4)
    values={1:100,2:320,3:330,4:500,5:900,6:0}
    def mat(x):return sum(values[p.piece_type]*(1 if p.color==b.turn else -1) for p in x.piece_map().values())
    for piece in ['b','n']:
     c=b.copy();c.push_uci('c7c8'+piece);self.assertFalse(c.is_game_over())
     for move in c.legal_moves:
      end=c.copy();end.push(move);self.assertFalse(end.is_game_over());self.assertGreaterEqual(mat(end)-mat(b),220)
    for piece in ['q','r']:
     c=b.copy();c.push_uci('c7c8'+piece);self.assertTrue(c.is_stalemate());self.assertFalse(c.is_check())
 def test_local_game_provenance(self):
  for r in read(D/'candidates.json'):
   if not r.get('sourceGame'):continue
   g=r['sourceGame'];b=chess.Board(g['gameFen'])
   for san in g['gameMoves'][:r['ply']]:b.push_san(san)
   self.assertEqual(b.fen(en_passant='fen'),r['fen'])
   for san in g['gameMoves'][r['ply']:]:b.push_san(san)
   if r['id']=='alapin-rubinstein-rook-mate':self.assertEqual(len(g['sha256']),64)
 def test_no_duplicate_additions(self):
  rows=read(D/'candidates.json');self.assertEqual(len({r['fen'] for r in rows}),4)
  for slug in ['underpromotion','promotion-mate']:
   published=read(ROOT/'src/lib/server'/f'{slug}-exercises.json')[0]['exercises']
   for r in rows:
    self.assertEqual(sum(e['fen']==r['fen'] for e in published),int(slug=='underpromotion' or r['goal']=='checkmate'))
if __name__=='__main__':unittest.main()
