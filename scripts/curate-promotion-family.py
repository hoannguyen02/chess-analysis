from review_store import ReviewStore
"""Apply durable editorial decisions after the objective split; never pad counts."""
import json,collections
from pathlib import Path
import chess
ROOT=Path(__file__).resolve().parents[1];D=ROOT/'scripts/fixtures/promotion-family-review';OUT=ROOT/'src/lib/server';LEVELS=['Beginner','A','B','C','C*','D']
def read(p):return json.loads(p.read_text())
def save(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
# Each group shares a learner decision; keep its first representative.
groups={
 'underpromotion': [[2,1]],
 'promotion-mate': [[2,3,4,5,6,7,9,12,16,17,18,19,23],[8,10,11,20,21,22],[13,14,15],[0,1],[39,43,53],[41,45],[46,56],[55,59],[61,69,81],[67,68],[82,84,95,100,103],[86,88,104],[83,105],[106,114,116,118],[27,111,117],[123,125,129]],
 'passed-pawn-simplification': [[19,29],[18,26],[15,17]],
}
reasons={
 'underpromotion':['Same Knight mating cage; the extra captured piece does not change the choice of Knight or defensive mechanism.'],
 'promotion-mate':['Immediate rank mate with escape squares already covered.','Immediate file mate with escape squares already covered.','Immediate diagonal mate; Queen is also valid.','Same Knight mating cage.','Quiet promotion followed by a rank mate.','Checking promotion followed by mate in the same king cage.','Checking promotion, interposition, Queen finishes mate.','Rook promotion and capture of the interposing piece.','Rook containment followed by quiet promotion and rank mate.','Quiet promotion and confinement with King/Rook support.','Knight deflection followed by quiet Bishop control and promotion mate.','Checking promotion then Rook deflection clears the Queen mating route.','Checking promotion then Knight deflection and Queen mate.','Passed pawn promotes, King opens the line, Rook removes the blocker.','Same passed-pawn/Rook cage with altered move order.','Checking promotion and successive Rook/Knight deflections.'],
 'passed-pawn-simplification':['Rook for last minor piece leaves a distant passer outside the opposing King’s reach.','Rook sacrifice removes the minor-piece blockade and diverts the King into a pawn race.','Rook checks gain tempi before exchanging into a passed-pawn ending.'],
}
report={}
for slug in groups:
 reviews_store=ReviewStore(D/(slug+'-reviews.json'))
 originals=read(D/(slug+'-original.json'))[0]['exercises'];excluded={}
 for family,reason in zip(groups[slug],reasons[slug]):
  for index in family[1:]:excluded[index]=dict(status='duplicate',representative=family[0],reason=reason)
 if slug=='promotion-mate':
  for i in [28,130]:excluded[i]=dict(status='pending',reason='Root screen found a mating line without promotion within the advertised bound; motif essentiality unresolved. Quarantined, not claimed disproved.')
  for i in [70,72]:excluded[i]=dict(status='rejected',reason='The first move simply captures an undefended rook; promotion is not needed for the immediate material payoff.')
 accepted=[];reviews=[]
 for i,e in enumerate(originals):
  r=reviews_store[i];decision=excluded.get(i,dict(status='retained',reason='Distinct decision retained with legal continuation and existing objective evidence; finite root screen is not exhaustive.'))
  # A failed defensive screen is unresolved, not a reason to assert a forced win.
  if slug=='passed-pawn-simplification' and any(x['score']<150 for x in r.get('defenceScreen',[])):
   decision=dict(status='pending',reason='Deeper defensive search does not confirm a clear win along the published exchange. Endpoint tablebase alone does not settle these earlier replies.')
  if decision['status']=='retained' and r.get('editorialReason'):decision['reason']=r['editorialReason']
  e=dict(e,id=r['id'])
  if slug=='promotion-mate' and i==40:
   e['beginner']=True;e.pop('difficulty',None)
   e['title']='Bắt quân phòng thủ để phong cấp chiếu hết'
   e['prompt']='Bắt quân và phong cấp để chiếu hết trong một nước.'
   e['hints']=['Xe đen trên c8 có thể bắt quân mới nếu Tốt đi thẳng đến b8.','Tốt có thể vừa bắt Xe vừa phong cấp.']
   e['solution']='bxc8=Q# — Tốt từ b7 bắt Xe ở c8, phong cấp thành Hậu và chiếu hết. Xe trắng trên e7 khống chế các ô thoát trên hàng 7.'
   decision['reason']='Regraded from A: five pieces, immediate capture removes the defender and promotes with mate.'
  if e['fen'] in {'8/1P6/k7/8/1K6/8/8/8 w - - 0 1','8/k1P5/2K5/8/1N6/8/8/8 w - - 0 1'}:
   e.pop('beginner',None)
   e['difficulty']=dict(level='A',status='suggested',solverMoves=1,sacrificeCount=0,reason='Chọn quân phong cấp để tránh pat; nội dung từ cấp A.')
   decision['reason']='User grading policy: avoiding pat through promotion begins at A. Position and solution unchanged.'
  level='Beginner' if e.get('beginner') else e['difficulty']['level']
  aspects=[]
  b=chess.Board(e['fen']);aspects.append('white' if b.turn else 'black')
  for f in r['features']:
   if f['side']!='solver':continue
   aspects+=['move-'+f['piece'], 'capture' if f['capture'] else 'noncapture', 'check' if f['check'] else 'quiet']
   if f['promotion']:aspects += ['promote-'+f['promotion'],'capture-promotion' if f['capture'] else 'straight-promotion']
   if f['enPassant']:aspects.append('en-passant')
   if f['castling']:aspects.append('castling')
  reviews.append(dict(id=e['id'],index=i,fen=e['fen'],moves=e['moves'],level=level,aspects=sorted(set(aspects)),**decision))
  if decision['status']=='retained':accepted.append(e)
 current=read(OUT/(slug+'-exercises.json'));current[0]['exercises']=accepted;save(OUT/(slug+'-exercises.json'),current)
 counts=collections.Counter('Beginner' if e.get('beginner') else e['difficulty']['level'] for e in accepted)
 coverage={}
 for level in LEVELS:
  selected=[r for r in reviews if r['status']=='retained' and r['level']==level];mapping=collections.defaultdict(list)
  for r in selected:
   for a in r['aspects']:mapping[a].append(r['id'])
  coverage[level]=dict(count=counts[level],gap=max(0,24-counts[level]),aspects=dict(mapping),unresolved=['en-passant preparation','castling preparation','Additional distinct decisions require review; attribute coverage alone is not completeness.'])
 report[slug]=dict(reviews=reviews,coverage=coverage)
 print(slug,dict(counts))
save(D/'selection.json',report)
