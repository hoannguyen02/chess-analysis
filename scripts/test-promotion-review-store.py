"""Review bundling, incremental updates and source-index coverage."""
import json,tempfile,unittest
from pathlib import Path
from review_store import ReviewStore
ROOT=Path(__file__).resolve().parents[1]
class Reviews(unittest.TestCase):
 def test_updates_preserve_other_records(self):
  with tempfile.TemporaryDirectory() as folder:
   path=Path(folder)/'reviews.json';store=ReviewStore(path)
   store.put(0,{'fen':'first'});store.put(1,{'fen':'second'});store.put(0,{'fen':'updated'})
   self.assertEqual(ReviewStore(path).records,{'0':{'fen':'updated'},'1':{'fen':'second'}})
   self.assertFalse(path.with_suffix('.tmp').exists())
 def test_sources_have_matching_bundled_reviews(self):
  directory=ROOT/'scripts/fixtures/promotion-family-review'
  for slug in ['underpromotion','promotion-mate','passed-pawn-simplification']:
   rows=json.loads((directory/(slug+'-original.json')).read_text())[0]['exercises']
   store=ReviewStore(directory/(slug+'-reviews.json'))
   self.assertEqual(set(store.records),{str(i) for i in range(len(rows))})
   for i,row in enumerate(rows):
    self.assertEqual(store[i]['fen'],row['fen']);self.assertEqual(store[i]['moves'],row['moves'])
   self.assertFalse(list(directory.glob(slug+'-[0-9]*.json')))
  expansion=ROOT/'scripts/fixtures/promotion-expansion'
  store=ReviewStore(expansion/'root-reviews.json')
  for row in json.loads((expansion/'candidates.json').read_text()):self.assertEqual(store[row['id']]['fen'],row['fen'])
  self.assertFalse(list(expansion.glob('*-roots.json')))
if __name__=='__main__':unittest.main()
