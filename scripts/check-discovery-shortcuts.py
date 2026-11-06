"""Bounded two-solver-move material shortcuts; preserve concrete defensive coverage."""
import argparse,json,importlib.util,sys
from pathlib import Path
import chess
from tactic_research import code_version, digest, resume_reviews, atomic_json
sys.dont_write_bytecode=True
ROOT=Path(__file__).resolve().parents[1];F=ROOT/'scripts/fixtures/discovery'
spec=importlib.util.spec_from_file_location('audit',ROOT/'scripts/review-discovery-upper.py');audit=importlib.util.module_from_spec(spec);spec.loader.exec_module(audit)
V=audit.build.miner.V
class Limit(Exception):pass

def search(b,move,budget=18000):
 side=b.turn;baseline=audit.build.miner.material(b,side);a=b.copy();first=a.san(move);a.push(move);branches={};nodes=0
 if a.is_game_over():return None
 for reply in list(a.legal_moves):
  second=a.san(reply);a.push(reply);wins=[]
  moves=list(a.legal_moves)
  moves.sort(key=lambda m:(not a.is_capture(m),not a.gives_check(m)))
  for m in moves:
   nodes+=1
   if nodes>budget:raise Limit()
   third=a.san(m);a.push(m)
   if audit.build.miner.material(a,side)>baseline and not a.is_game_over():
    valid=True
    for response in list(a.legal_moves):
     nodes+=1
     if nodes>budget:raise Limit()
     a.push(response);bad=a.is_checkmate() or audit.build.miner.material(a,side)<=baseline;a.pop()
     if bad:valid=False;break
    if valid:wins=[third]
   a.pop()
   if wins:break
  a.pop()
  if not wins:return None
  branches[second]=wins[0]
 return {'first':first,'replies':branches,'nodes':nodes}

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--new',action='store_true');parser.add_argument('--input',type=Path);parser.add_argument('--analysis',type=Path);parser.add_argument('--output',type=Path);args=parser.parse_args()
 records=json.loads((args.input or F/('upper-research.json' if args.new else 'upper-candidates.json')).read_text())['records' if args.new or args.input else 'candidates']
 analyses={r['gameId']:r for r in json.loads((args.analysis or F/('upper-research-review.json' if args.new else 'upper-curation-analysis.json')).read_text())['reviews']}
 out=args.output or F/('upper-research-shortcuts.json' if args.new else 'upper-shortcut-review.json');d=json.loads(out.read_text()) if out.exists() else {'method':'Bounded local material gain in at most two solver moves, with every immediate defensive reply and recapture. Finite horizon is not a long-term engine proof. Search-limit results are unresolved.','reviews':[]};done={r['gameId'] for r in d['reviews']}
 done=resume_reviews(d,records,{'budget':18000,'code':code_version('tactic_research.py','check-discovery-shortcuts.py','review-discovery-level-a.py','collect-discovery.py')})
 d['reviews']=[row for row in d['reviews'] if row.get('analysisHash')==digest(analyses.get(row['gameId']))]
 done={row['gameId'] for row in d['reviews']}
 for index,r in enumerate(records,1):
  if r['gameId'] in done or r['gameId'] not in analyses:continue
  b=chess.Board(r['fen']);found=[];unknown=[];analysis=analyses[r['gameId']];scores={x['move']:x for x in analysis['roots']}
  if r['goal']=='mate':continue
  for move in list(b.legal_moves):
   san=b.san(move);score=scores[san];a=b.copy();a.push(move);motifs=audit.build.miner.discoveries(b,move,a)
   # C's published two-move sacrifice is already verified; inspect competing
   # roots, and all roots for levels whose sample takes longer.
   if r['level']=='C' and san==r['moves'][0]:continue
   if score['scoreCp'] is not None and score['scoreCp']<0:continue
   try:proof=search(b,move)
   except Limit:unknown.append(san);continue
   if proof:
    proof['discovery']=bool(motifs);proof['scoreCp']=score['scoreCp'];found.append(proof)
  row={'gameId':r['gameId'],'candidateHash':digest(r),'analysisHash':digest(analysis),'level':r['level'],'fen':r['fen'],'shortcuts':found,'unverified':unknown};d['reviews'].append(row);atomic_json(out,d)
  print(index,r['level'],[(x['first'],x['discovery']) for x in found],flush=True)
if __name__=='__main__':main()
