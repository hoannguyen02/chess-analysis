"""Replay curated beginner pins and verify their concrete defender restriction.
Optional --engine repeats the bounded Stockfish material-recovery probes.
"""
import json,sys
from pathlib import Path
import chess,chess.engine
ROOT=Path(__file__).resolve().parents[1]
VALUES={1:100,2:320,3:330,4:500,5:900,6:0}
def material(board,color):
 return sum(VALUES[p.piece_type]*(1 if p.color==color else -1) for p in board.piece_map().values())
def verify_editorial(record):
 # Beginner defender-pin lessons must not offer a simpler profitable capture
 # of the pinned defender by the pinning piece, even for a smaller gain.
 e=record['exercise'];b=chess.Board(e['fen']);color=b.turn;base=material(b,color)
 p=e['pinSetup'];capture=chess.Move.from_uci(p['pinner']+p['front'])
 if capture not in b.legal_moves:return True
 b.push(capture)
 gains=[material(b,color)-base]
 for reply in list(b.legal_moves):
  b.push(reply)
  gains.append(-100000 if b.is_checkmate() else material(b,color)-base)
  b.pop()
 assert min(gains)<=0,('Simpler direct material gain bypasses the pin lesson',e['fen'])
 return True

def verify(record):
 e=record['exercise'];b=chess.Board(e['fen']);color=b.turn;base=material(b,color)
 assert b.is_valid() and not b.is_check()
 p=e['pinSetup'];front,back,pinner,target=[chess.parse_square(p[k]) for k in ['front','back','pinner','target']]
 assert front in b.attacks(pinner) and chess.BB_SQUARES[front] & chess.between(pinner,back)
 assert set(b.attackers(not color,target))=={front}
 root=b.parse_san(e['moves'][0]);assert root.to_square==target and b.is_capture(root)
 b.push(root);recapture=chess.Move(front,target)
 if e['beginnerKind']=='king':
  assert b.is_pseudo_legal(recapture) and recapture not in b.legal_moves
 else:
  assert recapture in b.legal_moves
  a=b.copy();a.push(recapture)
  assert chess.Move(pinner,back) in a.legal_moves
 lines=[e['moves']]+e['alternativeLines']
 if len(e['moves'])>1:
  assert {line[1] for line in lines}=={b.san(m) for m in b.legal_moves}
 for line in lines:
  a=chess.Board(e['fen'])
  for san in line:a.push_san(san)
  assert a.turn!=color and material(a,color)-base>=100
  assert not a.is_stalemate() and not a.is_insufficient_material()
  for reply in list(a.legal_moves):
   a.push(reply)
   assert material(a,color)-base>=100 and not a.is_checkmate(),(e['title'],line,reply)
   a.pop()
 for probe in record.get('defenceProbes',[]):
  assert probe['materialGainAfterEightPlies']>=100
 return True
if __name__=='__main__':
 path=ROOT/'scripts/fixtures/pin/beginner-reviewed.json';records=json.loads(path.read_text())
 engine=chess.engine.SimpleEngine.popen_uci('/opt/homebrew/bin/stockfish') if '--engine' in sys.argv else None
 if engine:engine.configure({'Threads':1,'Hash':64})
 for r in records:
  verify(r)
  if engine:
   e=r['exercise'];b=chess.Board(e['fen']);color=b.turn;base=material(b,color);probes=[]
   for line in [e['moves']]+e['alternativeLines']:
    a=b.copy()
    for san in line:a.push_san(san)
    info=engine.analyse(a,chess.engine.Limit(nodes=30000));pv=info.get('pv',[])
    for move in pv[:8]:a.push(move)
    probes.append(dict(line=line,score=info['score'].pov(color).score(mate_score=100000),pv=[m.uci() for m in pv],materialGainAfterEightPlies=material(a,color)-base))
   r['defenceProbes']=probes
   print(e['title'],min(p['materialGainAfterEightPlies'] for p in probes),flush=True)
 if engine:
  engine.quit();path.write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n')
 print('Verified',len(records),'curated beginner pin positions.')
