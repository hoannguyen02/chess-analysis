from mate_proof_store import MateProofStore
"""Deeper review of mating distance, shorter solutions, and every defence."""
import importlib.util,json,sys
from pathlib import Path
import chess,chess.engine
from two_rook_mate_proof import verify_certificate
sys.dont_write_bytecode=True
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('m',ROOT/'scripts/collect-promotion-games.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
D=m.DATA;records=json.loads((D/'master-researched.json').read_text())['records']
proof_store=MateProofStore(D)
reviewpath=D/'master-reviewed.json';overrides={r['gameId']:r for r in json.loads(reviewpath.read_text())['records']} if reviewpath.exists() else {}
exclude=D/'master-excluded.json';excluded=json.loads(exclude.read_text()) if exclude.exists() else []
auditpath=D/'master-depth-review.json';audits=json.loads(auditpath.read_text()) if auditpath.exists() else [];engine=chess.engine.SimpleEngine.popen_uci('/opt/homebrew/bin/stockfish');engine.configure({'Threads':2,'Hash':128})
try:
 for raw in records:
  if '--d-only' in sys.argv and raw['level']!='D':continue
  r=overrides.get(raw['gameId'],raw)
  certificate=r['gameId']
  if certificate in proof_store:
   proof=proof_store[certificate];verify_certificate(proof)
   assert proof['fen']==r['fen'] and proof['moves']==r['moves']
   r['validation']['mateCertificate']=proof_store.reference(certificate)
   overrides[r['gameId']]=r;m.save(reviewpath,dict(records=list(overrides.values())))
   print('certified',r['level'],r['headers']['White'],flush=True);continue
  if '--new-only' in sys.argv and r['gameId'] in overrides:continue
  if r['gameId'] in {x['gameId'] for x in excluded}:continue
  board=chess.Board(r['fen']);color=board.turn
  rootnodes=3000000 if r['level']=='D' else 1200000
  defencenodes=1500000 if r['level']=='D' else 350000
  info=engine.analyse(board,chess.engine.Limit(nodes=rootnodes));mate=info['score'].pov(color).mate();shape=m.inspect(board,info.get('pv',[]))
  entry=dict(gameId=r['gameId'],fen=r['fen'],moves=r['moves'],nodes=rootnodes,depth=info.get('depth'),mate=mate,principalVariation=[x.uci() for x in info.get('pv',[])])
  failure=None
  if mate is None or mate<=0:failure='Fresh deeper search does not confirm forced mate.'
  elif mate<r['solverMoves']:
   if shape and shape['solverMoves']==mate:
    updated=dict(r,**shape);updated['validation']=dict(r['validation'],nodes=rootnodes,principalVariation=[x.uci() for x in info['pv']],mate=mate)
    updated['editorialReview']=dict(previousMoves=r['moves'],previousLevel=r['level'],reason='Deeper search finds a shorter promotion mate; regrade using the complete shorter line.')
    r=updated
   else:failure='A shorter mate exists, but the shorter line does not fit the promotion level requirements. Exclude rather than inflate the grade.'
  walk=board.copy();defences=[]
  if not failure:
   for i,san in enumerate(r['moves']):
    walk.push_san(san)
    if i%2==0 and not walk.is_checkmate():
     probe=engine.analyse(walk,chess.engine.Limit(nodes=defencenodes));distance=probe['score'].pov(color).mate()
     if distance is None or distance<=0 or distance>r['solverMoves']-(i//2+1):failure='Fresh defensive search does not confirm the advertised mating length.';break
     defences.append(dict(ply=i+1,mate=distance,pv=[x.uci() for x in probe['pv']]))
  if failure:
   excluded.append(dict(gameId=r['gameId'],fen=r['fen'],moves=r['moves'],reason=failure,review=entry));print('excluded',r['headers']['White'],failure,flush=True)
  else:
   r['validation']['defences']=defences;r['validation']['defenceNodes']=defencenodes
   r['validation']['rootReviewNodes']=rootnodes
   overrides[r['gameId']]=r;entry['decision']='verified';entry['finalLevel']=r['level'];print('verified',r['level'],r['headers']['White'],flush=True)
  audits=[a for a in audits if a['gameId']!=entry['gameId']];audits.append(entry)
  m.save(reviewpath,dict(records=list(overrides.values())));m.save(exclude,excluded);m.save(D/'master-depth-review.json',audits)
finally:engine.quit()
