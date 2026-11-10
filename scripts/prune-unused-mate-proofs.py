"""Remove only rejected composed proofs with no published or explicit dependency.

Default is a dry run. Accepted and unreviewed candidates remain available to
builders/research. Candidate descriptions and rejection records are never edited.
"""
from mate_proof_store import MateProofStore
import argparse,hashlib,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def read(p):return json.loads(p.read_text())
def records(p):
 value=read(p);return value.get('records',[]) if isinstance(value,dict) else value

def plan():
 # Literal filenames cover extra certificates referenced outside the normal pools.
 texts=[]
 for base in ['scripts','src','docs']:
  for p in (ROOT/base).rglob('*'):
   if p.is_file() and p.suffix in {'.json','.py','.cjs','.ts','.tsx','.md'} and 'mate-proofs' not in p.parts and p.name not in {'mate-proof-cleanup.json','mate-proofs.json'}:
    texts.append((str(p.relative_to(ROOT)),p.read_text()))
 runtime_fens=set()
 def collect(value):
  if isinstance(value,dict):
   if isinstance(value.get('fen'),str):runtime_fens.add(value['fen'])
   for v in value.values():collect(v)
  elif isinstance(value,list):
   for v in value:collect(v)
 for p in (ROOT/'src/lib/server').glob('*exercises.json'):collect(read(p))
 removed=[];kept={}
 for topic in ['anastasia-mate','arabian-mate','promotion']:
  folder=ROOT/'scripts/fixtures'/topic;reviews={r['gameId']:r for r in records(folder/'composed-reviewed.json')}
  candidates={r['gameId']:r for r in records(folder/'composed-candidates.json')}
  published=set()
  for p in folder.glob('*published.json'):
   published.update(r['gameId'] for r in records(p) if isinstance(r,dict) and 'gameId' in r)
  store=MateProofStore(folder)
  for ident,proof in store.proofs.items():
   p=folder/'mate-proofs'/(ident+'.json');review=reviews.get(ident,{});candidate=candidates.get(ident)
   reason=None
   if review.get('decision')!='rejected':reason='accepted, unreviewed or master-game proof'
   elif ident in published:reason='published record'
   elif candidate is None:reason='missing candidate record; preserve conservatively'
   elif proof['fen'] in runtime_fens:reason='published exercise position'
   else:
    refs=[name for name,content in texts if p.name in content or ('mate-proofs.json#'+ident) in content]
    if refs:reason='explicit reference: '+', '.join(refs)
   if reason:kept[str(p.relative_to(ROOT))]=reason
   else:removed.append(dict(path=str(p.relative_to(ROOT)),sha256=hashlib.sha256(json.dumps(proof,sort_keys=True).encode()).hexdigest(),bytes=len(json.dumps(proof).encode()),gameId=ident,rejectionRecord=str((folder/'composed-reviewed.json').relative_to(ROOT)),reason=review['reason']))
 return removed,kept
if __name__=='__main__':
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--apply',action='store_true');args=parser.parse_args();removed,kept=plan()
 from collections import Counter
 print('Removable:',dict(Counter(Path(r['path']).parts[2] for r in removed)),'files:',len(removed),'bytes:',sum(r['bytes'] for r in removed),'retained:',len(kept))
 if args.apply:
  manifest=ROOT/'scripts/fixtures/mate-proof-cleanup.json';previous=read(manifest)['removed'] if manifest.exists() else []
  for r in removed:
   p=ROOT/r['path'];store=MateProofStore(p.parent.parent);proof=store[p.stem];assert hashlib.sha256(json.dumps(proof,sort_keys=True).encode()).hexdigest()==r['sha256'];del store.proofs[p.stem];store.save()
  manifest.write_text(json.dumps(dict(policy='Only rejected composed proofs without published, builder-pool or explicit dependencies. Rejection and candidate records retained.',removed=previous+removed),ensure_ascii=False,indent=2)+'\n')
