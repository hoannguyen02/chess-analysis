"""Generate 10 sparse, diverse queen-skewer compositions with engine-checked replies."""
import json, random, importlib.util
from pathlib import Path
import chess, chess.engine
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('old',ROOT/'scripts/build-quiet-beginner-skewers.py')
old=importlib.util.module_from_spec(spec); spec.loader.exec_module(old)
rng=random.Random(20261028)
NAMES={1:'Tốt',2:'Mã',3:'Tượng',4:'Xe',5:'Hậu',6:'Vua'}
def balance(b,side):
 return sum(old.VALUES[p.piece_type]*(1 if p.color==side else -1) for p in b.piece_map().values())
def score(info,side): return info['score'].pov(side).score(mate_score=100000)
def analyse(e,b,n=180000,root=None):
 return e.analyse(b,chess.engine.Limit(nodes=n),**({'root_moves':[root]} if root else {}))
def build(target=None, start_attempt=0):
 previous=json.loads((ROOT/'scripts/fixtures/skewer/queen-intro-audit.json').read_text()) if (ROOT/'scripts/fixtures/skewer/queen-intro-audit.json').exists() else []
 overrides=json.loads((ROOT/'scripts/fixtures/skewer/queen-intro-overrides.json').read_text())
 records=[]; seen=set()
 reserved={old.canonical(chess.Board(r['exercise']['fen'])) for r in previous}
 with chess.engine.SimpleEngine.popen_uci('/opt/homebrew/bin/stockfish') as eng:
  eng.configure({'Threads':1,'Hash':64})
  engine_identity=dict(eng.id)
  # Retain original slots 1–4, 6–8, 10–11 and 13; removed lessons must not regenerate.
  for index in ([target] if target is not None else range(10)):
   if str(index) in overrides:
    record=overrides[str(index)];records.append(record);seen.add(old.canonical(chess.Board(record['exercise']['fen'])));continue
   design_index=[0,1,2,3,5,6,7,9,10,12][index]
   if target is not None:rng.seed(20261028+design_index*1009)
   axis=['diagonal','file','rank'][design_index%3]; attacker=3 if axis=='diagonal' else 4
   support={3:5,4:3,18:5,19:3}.get(design_index,[1,6,4,3,5,2][(design_index//6+design_index)%6])
   if index<len(previous) and previous[index].get('rootCandidates') and previous[index]['support']==chess.piece_name(support) and old.canonical(chess.Board(previous[index]['exercise']['fen'])) not in seen:
    records.append(previous[index]);seen.add(old.canonical(chess.Board(previous[index]['exercise']['fen'])));continue
   for attempt in range(3000000):
    dest=rng.randrange(64); dx,dy=rng.choice([(1,1),(1,-1),(-1,1),(-1,-1)] if attacker==3 else ([(0,1),(0,-1)] if axis=='file' else [(1,0),(-1,0)]))
    x,y=chess.square_file(dest)+dx,chess.square_rank(dest)+dy; ray=[]
    while 0<=x<8 and 0<=y<8:
     ray.append(chess.square(x,y)); x+=dx;y+=dy
    if len(ray)<2: continue
    qi,ti=sorted(rng.sample(range(len(ray)),2)); q,t=ray[qi],ray[ti]
    origin,wk,bk,ss=rng.sample(range(64),4)
    geometry=chess.Board(None);geometry.set_piece_at(dest,chess.Piece(attacker,True))
    origin=rng.choice(list(geometry.attacks(dest)))
    if support not in (1,6):
     geometry.set_piece_at(dest,chess.Piece(support,True));ss=rng.choice(list(geometry.attacks(dest)))
    if support==1:
     pawn_squares=[dest-7,dest-9]
     pawn_squares=[s for s in pawn_squares if 8<=s<48 and abs(chess.square_file(s)-chess.square_file(dest))==1]
     if not pawn_squares:continue
     ss=rng.choice(pawn_squares)
    if support==6:
     adjacent=list(chess.SquareSet(chess.BB_KING_ATTACKS[dest]))
     wk=rng.choice(adjacent)
    if support==6: ss=wk
    if len({dest,q,t,origin,wk,bk,ss}) != (6 if support==6 else 7): continue
    b=chess.Board(None)
    rear=4 if attacker==3 else rng.choice([2,3,4])
    for sq,pc,col in [(origin,attacker,True),(wk,6,True),(bk,6,False),(q,5,False),(t,rear,False)]: b.set_piece_at(sq,chess.Piece(pc,col))
    if support!=6: b.set_piece_at(ss,chess.Piece(support,True))
    if support!=5:
     empty=[s for s in range(64) if s not in {dest,q,t,origin,wk,bk,ss}]
     b.set_piece_at(rng.choice(empty),chess.Piece(5,True))
    if support==6:
     shelter=[s for s in (wk+8,wk-8) if 8<=s<48 and s!=dest and not b.piece_at(s)]
     if shelter:b.set_piece_at(rng.choice(shelter),chess.Piece(1,True))
    if attempt<start_attempt:continue
    if not b.is_valid() or b.is_check():continue
    move=chess.Move(origin,dest)
    if move not in b.legal_moves:continue
    free_capture=False
    for cap in list(b.legal_moves):
     if b.is_capture(cap):
      value=old.VALUES[b.piece_at(cap.to_square).piece_type]
      probe=b.copy();probe.push(cap)
      if probe.is_checkmate() or value-old.loss(probe)>2:
       free_capture=True;break
    if free_capture:continue
    a=b.copy();a.push(move)
    if a.is_check() or q not in a.attacks(dest) or ss not in a.attackers(True,dest):continue
    if a.occupied & chess.between(dest,t) != chess.BB_SQUARES[q] or a.is_pinned(chess.BLACK,q):continue
    key=old.canonical(b)
    if key in seen or key in reserved:continue
    # Keep the introductory first move quiet.
    if b.is_capture(move):continue
    if design_index%2:
     b=b.mirror();move=chess.Move(chess.square_mirror(origin),chess.square_mirror(dest)); ss=chess.square_mirror(ss)
    side=b.turn; start=balance(b,side)
    best=analyse(eng,b,5000); chosen=analyse(eng,b,5000,move)
    if score(best,side)-score(chosen,side)>300 or score(chosen,side)<-200:continue
    eng.configure({'Clear Hash':None})
    infos=eng.analyse(b,chess.engine.Limit(nodes=600000),multipv=3)
    candidates=[dict(move=b.san(x['pv'][0]),scoreCp=x['score'].pov(side).score(),mate=x['score'].pov(side).mate()) for x in infos]
    selected=next((c for c in candidates if c['move']==b.san(move)),None)
    if not selected:continue
    if any(c['mate'] is not None for c in candidates):
     if selected['mate'] is None or selected['mate']<=0 or selected['mate']!=min(c['mate'] for c in candidates if c['mate'] is not None):continue
    elif max(c['scoreCp'] for c in candidates)-selected['scoreCp']>40 or selected['scoreCp']<-80:continue
    p=b.copy();line=[p.san(move)];p.push(move); checks=[]
    for ply in range(1,7):
     if p.is_game_over(): break
     info=analyse(eng,p,400000); m=info['pv'][0]
     # Stop only after the defender has had a chance to recapture.
     if ply>=3 and not p.is_capture(m) and not p.is_check() and balance(p,side)-start>=2:break
     checks.append(dict(fen=p.fen(),move=p.san(m),scoreCp=score(info,p.turn),depth=info.get('depth'),nodes=info.get('nodes')))
     line.append(p.san(m));p.push(m)
    if balance(p,side)-start<2 or p.is_stalemate() or (p.is_checkmate() and p.turn==side) or len(line)>5:continue
    final=analyse(eng,p,400000) if not p.is_game_over() else None
    if final and score(final,side)<-80:continue
    # Main line must demonstrate the skewer, not wander into a different tactic.
    if len(line)<3 or 'x' not in line[2]:continue
    probe=b.copy();probe.push_san(line[0]);probe.push_san(line[1]); capture=probe.parse_san(line[2])
    targets={chess.square_mirror(q),chess.square_mirror(t),move.to_square} if design_index%2 else {q,t,move.to_square}
    if capture.to_square not in targets or (capture.from_square!=move.to_square and capture.to_square!=move.to_square):continue
    seen.add(key)
    axisvi={'diagonal':'đường chéo','file':'cột','rank':'hàng'}[axis]
    sq=chess.square_name(move.to_square)
    ex=dict(title=f'Xiên Hậu · {index+1}',beginner=True,beginnerKind='queen',mode='interactive',outcome='skewer',fen=b.fen(),moves=line,alternativeLines=[],prompt='Tìm đòn xiên Hậu và tính nước bắt tiếp theo.',hints=[f'Quan sát Hậu và quân phía sau trên cùng {axisvi}.',f'{NAMES[support]} ở {chess.square_name(ss)} bảo vệ ô {sq}.'],solution=f'{NAMES[attacker]} đến {sq}, tấn công Hậu trên cùng {axisvi} với quân phía sau. {NAMES[support]} bảo vệ quân tấn công. Theo cách Hậu đáp lại, hãy bắt quân phía sau hoặc bắt lại Hậu. Trong biến mẫu, bạn lời {balance(p,side)-start} điểm quân.',source='original-composition')
    records.append(dict(exercise=ex,axis=axis,support=chess.piece_name(support),attacker=chess.piece_name(attacker),pieceCount=len(b.piece_map()),rootBest=max((100000-c['mate'] if c['mate'] is not None else c['scoreCp']) for c in candidates),rootSelected=(100000-selected['mate'] if selected['mate'] is not None else selected['scoreCp']),nodeBudget=400000,rootCandidates=candidates,rootNodeBudget=600000,checks=checks,finalFen=p.fen(),gain=balance(p,side)-start))
    print(index+1,axis,chess.piece_name(support),attempt,line,flush=True)
    if target is None:(ROOT/'scripts/fixtures/skewer/queen-intro-audit.json').write_text(json.dumps(records+previous[len(records):],ensure_ascii=False,indent=2)+'\n')
    break
   else: raise RuntimeError(f'No candidate {index+1} {axis} {support}')
 for r in records:
  r.setdefault('engine',engine_identity)
  if r.get('kind')=='exchange-recognition':continue
  ex=r['exercise']; b=chess.Board(ex['fen']); first=b.push_san(ex['moves'][0]); reply=b.push_san(ex['moves'][1]); capture=b.parse_san(ex['moves'][2])
  taker=NAMES[b.piece_at(capture.from_square).piece_type]; captured_name=NAMES[b.piece_at(capture.to_square).piece_type]
  if reply.to_square==first.to_square:
   detail=f'Hậu bắt quân tấn công; {taker} bắt lại Hậu.'
  elif captured_name=='Hậu':
   detail=f'Trong biến mẫu, Hậu ở lại và {taker} bắt Hậu.'
  else:
   detail=f'Hậu rời đường xiên; {taker} bắt {captured_name} phía sau.'
  ex['solution']=f"{ex['hints'][1]} {detail} Tính cả các nước bắt lại: biến mẫu lời {r['gain']} điểm quân (Tốt 1, Tượng/Mã 3, Xe 5, Hậu 9)."
 if target is not None:
  Path(f'/private/tmp/queen-intro-slot-{target}.json').write_text(json.dumps(records[0],ensure_ascii=False,indent=2)+'\n');return
 (ROOT/'scripts/fixtures/skewer/queen-intro-audit.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n')
 (ROOT/'src/lib/server/queen-skewer-intro.json').write_text(json.dumps([r['exercise'] for r in records],ensure_ascii=False,indent=2)+'\n')
if __name__=='__main__':
 import argparse
 parser=argparse.ArgumentParser();parser.add_argument('--slot',type=int,choices=range(10));parser.add_argument('--start-attempt',type=int,default=0);args=parser.parse_args();build(args.slot,args.start_attempt)
