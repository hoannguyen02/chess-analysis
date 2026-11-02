"""Add reviewed coverage examples without regenerating the approved introductory set."""
import importlib.util,json,random,sys
from pathlib import Path
import chess,chess.engine
sys.dont_write_bytecode=True
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('base',ROOT/'scripts/build-discovery-beginner.py');base=importlib.util.module_from_spec(spec);spec.loader.exec_module(base)
NAMES={1:'Tốt',**base.NAMES}

def features(b,m):
 a=b.copy();a.push(m); motifs=base.miner.discoveries(b,m,a)
 result=[]
 p=b.piece_at(m.from_square).piece_type
 if p==1:result.append('pawn-capture' if b.is_capture(m) else 'pawn-double' if abs(m.to_square-m.from_square)==16 else 'pawn-push')
 if p==6:result.append('king-move')
 if p==5:result.append('queen-move')
 if p!=1 and b.is_capture(m):result.append('piece-capture')
 if len(a.checkers())>1:result.append('double-check')
 if not a.is_check():result.append('quiet-attack')
 if any(b.piece_at(s).piece_type==5 for s,t,k in motifs):result.append('queen-revealed')
 return result

def review(b,engine):
 lines=[];roots=[]
 for m in list(b.legal_moves):
  a=b.copy();a.push(m);motifs=base.miner.discoveries(b,m,a)
  if a.is_checkmate():return None
  wins=base.branches(b,m)
  immediate=b.is_capture(m) and base.safe_gain(a,b.turn,base.miner.material(b,b.turn))
  # A free capture must not bypass the topic, even for a smaller gain.
  if (wins or immediate) and not motifs:return None
  if immediate:
   # Remove the revealed line's attacker: the capture must cease to be safe.
   for s,t,k in motifs:
    counter=b.copy();counter.remove_piece_at(s)
    if m in counter.legal_moves:
     baseline=base.miner.material(counter,b.turn);counter.push(m)
     if base.safe_gain(counter,b.turn,baseline):return None
  roots.append({'move':b.san(m),'localGain':bool(wins),'discovery':bool(motifs),'immediateGain':bool(immediate)})
  if wins:lines.extend(wins)
 if not lines:return None
 engine.configure({'Clear Hash':None})
 infos=engine.analyse(b,chess.engine.Limit(nodes=200000),multipv=b.legal_moves.count())
 scores={b.san(i['pv'][0]):i['score'].pov(b.turn) for i in infos}
 if any(s.mate() is not None for s in scores.values()):return None
 best=max(s.score() for s in scores.values())
 return lines,roots,scores,best

def polish(exercises,reviews):
 labels={'pawn-push':'Đẩy Tốt mở đường','pawn-double':'Đẩy Tốt hai ô mở đường','pawn-capture':'Tốt bắt quân mở đường','king-move':'Vua mở đường','quiet-attack':'Tấn công mở không chiếu','double-check':'Chiếu đôi','queen-revealed':'Mở đường cho Hậu','piece-capture':'Bắt quân mở đường','queen-move':'Hậu mở đường'}
 for index,(e,r) in enumerate(zip(exercises,reviews),1):
  feature=r.get('coverageTarget')
  if not feature:continue
  b=chess.Board(e['fen']);m=b.parse_san(e['moves'][0]);a=b.copy();a.push(m)
  slider,target,kind=base.miner.discoveries(b,m,a)[0]
  mover=NAMES[b.piece_at(m.from_square).piece_type];stationary=NAMES[b.piece_at(slider).piece_type]
  action=f'{mover} từ {chess.square_name(m.from_square)} '+('bắt '+NAMES[b.piece_at(m.to_square).piece_type]+' ở ' if b.is_capture(m) else 'đến ')+chess.square_name(m.to_square)
  reason=f'{action}, mở đường cho {stationary} ở {chess.square_name(slider)} '+('chiếu Vua.' if kind=='check' else f'tấn công {NAMES[b.piece_at(target).piece_type]} ở {chess.square_name(target)}.')
  if a.is_check():
   if len(a.checkers())>1:reason+=' Quân vừa đi và quân phía sau cùng chiếu Vua: đây là chiếu đôi.'
   reason+=' Tính nước đỡ chiếu rồi bắt quân để thắng vật chất.'
  elif a.is_pinned(a.turn,target):
   reason+=f' {NAMES[b.piece_at(target).piece_type]} bị ghim vào Vua: quân đó không thể rời đường ghim nếu làm lộ chiếu. Nhờ vậy, quân vừa đi không bị bắt lại; sau nước đáp, tiếp tục thu lợi về vật chất.'
  else:
   targets=[sq for sq in a.attacks(m.to_square) if a.piece_at(sq) and a.piece_at(sq).color==a.turn]
   assert targets
   other=targets[0]
   reason+=f' Đồng thời, {mover} tấn công {NAMES[a.piece_at(other).piece_type]} ở {chess.square_name(other)}. Đối phương không thể cứu cả hai mục tiêu.'
  e['title']=f'{labels[feature]} · {index}'
  e['solution']=reason;r['reason']=reason
  if feature=='double-check':e['hints']=['Tìm nước đi để quân vừa di chuyển và quân phía sau cùng chiếu Vua.']
  elif feature=='pawn-double':e['hints']=['Tốt đang ở ô xuất phát. So sánh nước tiến một ô và hai ô: nước nào mở đường tấn công và tránh bị bắt lại?']

def main():
 if (ROOT/'scripts/fixtures/discovery/beginner-curation.json').exists():
  from discovery_beginner_curation import publish
  publish()
  return
 ep=ROOT/'src/lib/server/discovery-beginner-exercises.json';rp=ROOT/'scripts/fixtures/discovery/beginner-review.json'
 exercises=json.loads(ep.read_text());data=json.loads(rp.read_text());reviews=data['reviews']
 rng=random.Random(28102026)
 wanted=['pawn-push','pawn-double','pawn-capture','king-move','quiet-attack','double-check','queen-revealed','piece-capture','queen-move']
 with chess.engine.SimpleEngine.popen_uci('/opt/homebrew/bin/stockfish') as engine:
  engine.configure({'Threads':1,'Hash':32})
  for feature in wanted:
   for side in [True,False]:
    if any(r.get('coverageTarget')==feature and chess.Board(r['fen']).turn==side for r in reviews):continue
    for attempt in range(500000):
     slider_type=5 if feature=='queen-revealed' else rng.choice([3,4])
     mover_type=1 if feature.startswith('pawn') else 6 if feature=='king-move' else 5 if feature=='queen-move' else rng.choice([2,3,4])
     b=chess.Board(None);b.turn=side
     slider,target=rng.sample(range(64),2);b.set_piece_at(slider,chess.Piece(slider_type,side))
     if target not in b.attacks(slider):continue
     between=list(chess.SquareSet(chess.between(slider,target)))
     if not between:continue
     blocker=rng.choice(between)
     if mover_type==1 and chess.square_rank(blocker) in [0,7]:continue
     b.set_piece_at(blocker,chess.Piece(mover_type,side))
     free=[s for s in range(64) if s not in [slider,target,blocker]]
     own,enemy,victim=rng.sample(free,3)
     kind='attack' if feature=='quiet-attack' else rng.choice(['attack','check'])
     if mover_type!=6:b.set_piece_at(own,chess.Piece(6,side))
     b.set_piece_at(target if kind=='check' else enemy,chess.Piece(6,not side))
     b.set_piece_at(victim if kind=='check' else target,chess.Piece(rng.choice([4,5]),not side))
     if feature=='quiet-attack':
      empty=[sq for sq in range(64) if not b.piece_at(sq)]
      b.set_piece_at(rng.choice(empty),chess.Piece(2,not side))
     if feature in ['pawn-capture','piece-capture']:
      options=list(b.attacks(blocker) & ~b.occupied)
      if not options:continue
      b.set_piece_at(rng.choice(options),chess.Piece(1,not side))
     if not b.is_valid() or b.is_check():continue
     mains=[]
     for m in list(b.legal_moves):
      if m.promotion or m.from_square!=blocker or feature not in features(b,m):continue
      if mover_type==1 and (chess.square_rank(m.to_square)>=6 if side else chess.square_rank(m.to_square)<=1):continue
      a=b.copy();a.push(m)
      if feature=='quiet-attack' and not any(reply.from_square==target for reply in a.legal_moves):continue
      if not base.miner.discoveries(b,m,a):continue
      ls=base.branches(b,m)
      if ls:mains.extend(ls)
     if not mains:continue
     result=review(b,engine)
     if not result:continue
     lines,roots,scores,best=result
     simple=[]
     for l in mains:
      opening=b.copy(); opening.push_san(l[0])
      if not any(opening.generate_legal_captures()) and not any('=' in san for san in l):simple.append(l)
     mains=[l for l in simple if scores[l[0]].score()>=best-70]
     if not mains:continue
     mainline=sorted(mains,key=lambda l:(-scores[l[0]].score(),l))[0]
     if any(scores[r['move']].score()>scores[mainline[0]].score()+40 for r in roots if not r['discovery']):continue
     # Primary line must never require giving up a friendly piece.
     a=b.copy();a.push_san(mainline[0]); response=a.parse_san(mainline[1])
     if a.is_capture(response):continue
     m=b.parse_san(mainline[0]);a=b.copy();a.push(m);s,t,k=base.miner.discoveries(b,m,a)[0]
     mover=NAMES[mover_type];stationary=NAMES[b.piece_at(s).piece_type]
     action=f'{mover} từ {chess.square_name(m.from_square)} '+('bắt '+NAMES[b.piece_at(m.to_square).piece_type]+' ở ' if b.is_capture(m) else 'đến ')+chess.square_name(m.to_square)
     reason=f'{action}, mở đường cho {stationary} ở {chess.square_name(s)} '+('chiếu Vua.' if k=='check' else f'tấn công {NAMES[b.piece_at(t).piece_type]} ở {chess.square_name(t)}.')
     if not a.is_check():
      if a.is_pinned(not side,t):
       reason+=' Quân bị tấn công bị ghim vào Vua: quân đó không thể rời đường ghim nếu làm lộ chiếu. Tính nước đáp rồi thu lợi về vật chất.'
      else:reason+=' Hai quân tạo hai mối đe dọa bắt quân; đối phương không thể cứu cả hai mục tiêu.'
     else:
      if len(a.checkers())>1:reason+=' Quân vừa đi và quân phía sau cùng chiếu Vua: đây là chiếu đôi.'
      reason+=' Tính nước đỡ chiếu rồi bắt quân để thắng vật chất.'
     index=len(exercises)+1
     exercises.append(dict(title=f'{"Chiếu mở" if k=="check" else "Tấn công mở"} · {index}',beginner=True,goal='material',discoveryKind=k,prompt='Mở đường tấn công để thắng vật chất.',mode='interactive',outcome='discovery',fen=b.fen(),moves=mainline,alternativeLines=[l for l in lines if l!=mainline],source='original-composition',hints=[f'Quân nào đang chắn đường của {stationary} ở {chess.square_name(s)}? Tính nước đi của quân đó và nước đáp của đối phương.'],solution=reason))
     reviews.append(dict(id=f'discovery-beginner-{index:02}',coverageTarget=feature,features=features(b,m),fen=b.fen(),moves=mainline,decision='keep',reason=reason,roots=[dict(r,scoreCp=scores[r['move']].score()) for r in roots],engineNodes=200000,engine=engine.id,defensiveLines=lines))
     polish(exercises,reviews)
     ep.write_text(json.dumps(exercises,ensure_ascii=False,indent=2)+'\n');rp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
     print(index,feature,side,mainline,flush=True);break
    else: print('GAP',feature,side,flush=True)
if __name__=='__main__':main()
