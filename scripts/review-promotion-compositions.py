from mate_proof_store import MateProofStore
"""Independent root review and decision deduplication of composed exercises."""
import collections,importlib.util,json
from pathlib import Path
import chess,chess.engine
from two_rook_mate_proof import verify_certificate
ROOT=Path(__file__).resolve().parents[1];D=ROOT/'scripts/fixtures/promotion'
proof_store=MateProofStore(D)
spec=importlib.util.spec_from_file_location('m',ROOT/'scripts/collect-promotion-games.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
out=D/'composed-reviewed.json';audits=json.load(open(out)) if out.exists() else [];known={r['gameId'] for r in audits};fps=set();counts=collections.Counter()
for r in audits:
 if r['decision']=='accepted':fps.add(r['fingerprint']);counts[r['level']]+=1
engine=chess.engine.SimpleEngine.popen_uci('/opt/homebrew/bin/stockfish');engine.configure({'Threads':2,'Hash':128})
try:
 for r in sorted(json.load(open(D/'composed-candidates.json')),key=lambda r:['D','C','C*','B','A'].index(r['level'])):
  if r['gameId'] in known:continue
  proofPath=r['gameId']
  if not proofPath in proof_store:continue
  b=chess.Board(r['fen']);walk=b.copy();fp=[]
  for san in r['moves']:
   move=walk.parse_san(san);p=walk.piece_at(move.from_square);victim=walk.piece_at(move.to_square)
   fp.append([p.symbol().upper(),victim.symbol().upper() if victim else '-',walk.gives_check(move),move.promotion])
   walk.push(move)
  fingerprint=json.dumps([r['level'],fp]);reason=None
  if fingerprint in fps:reason='Same complete sequence of moving pieces, captures and checks as a retained teaching mechanism.'
  # Every legal root move is checked for immediate mate, including quiet moves.
  immediate=[]
  for move in b.legal_moves:
   child=b.copy();child.push(move)
   if child.is_checkmate():immediate.append(move)
  if any(not m.inspect(b,[move]) for move in immediate):reason='Immediate mate bypasses the Promotion motif.'
  info=engine.analyse(b,chess.engine.Limit(nodes=1200000)) if not reason else {}
  if not reason:
   shape=m.inspect(b,info.get('pv',[]));mate=info['score'].pov(b.turn).mate()
   if mate!=r['solverMoves']:reason='Deeper review changes the shortest mating distance.'
   elif not shape or shape['level']!=r['level']:reason='Deeper principal line changes the motif or sacrifice grade.'
   else:verify_certificate(proof_store[proofPath])
  entry=dict(gameId=r['gameId'],level=r['level'],fingerprint=fingerprint,decision='rejected' if reason else 'accepted',reason=reason or 'Deeper root review, essential rook/knight motif, immediate alternatives and all-defence certificate checked.',rootNodes=1200000,rootMate=info['score'].pov(b.turn).mate() if info else None)
  audits.append(entry);known.add(r['gameId'])
  if not reason:fps.add(fingerprint);counts[r['level']]+=1
  m.save(out,audits);print(entry['decision'],r['level'],dict(counts),r['gameId'],reason or '',flush=True)
finally:engine.quit();m.save(out,audits)
