"""Bundle persistence and all retained mate certificates, independent of selection."""
import json,tempfile,unittest
from pathlib import Path
from mate_proof_store import MateProofStore,read_proof_reference
from two_rook_mate_proof import verify_certificate
ROOT=Path(__file__).resolve().parents[1]
class ProofStore(unittest.TestCase):
 def test_atomic_update_preserves_other_entries(self):
  with tempfile.TemporaryDirectory() as directory:
   store=MateProofStore(directory);store.put('first',{'gameId':'first','nodes':{}});store.put('second',{'gameId':'second','nodes':{}})
   loaded=MateProofStore(directory);self.assertEqual(set(loaded.proofs),{'first','second'})
   self.assertEqual(read_proof_reference(Path(directory)/'mate-proofs.json#first'),loaded['first'])
   self.assertEqual(read_proof_reference(Path(directory)/'mate-proofs/first.json'),loaded['first'])
   self.assertFalse((Path(directory)/'mate-proofs.tmp').exists())
 def test_retained_certificates_and_no_individual_files(self):
  for topic in ['anastasia-mate','arabian-mate','promotion']:
   folder=ROOT/'scripts/fixtures'/topic;store=MateProofStore(folder);self.assertTrue(store.proofs)
   self.assertFalse((folder/'mate-proofs').exists())
   for ident,proof in store.proofs.items():
    self.assertEqual(proof.get('gameId',ident),ident)
    if ident!='minor-promotion-avoids-pat':verify_certificate(proof)
  self.assertFalse(list((ROOT/'scripts/fixtures/promotion-expansion').glob('*-proof.json')))
if __name__=='__main__':unittest.main()
