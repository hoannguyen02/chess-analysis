from review_store import ReviewStore
from mate_proof_store import MateProofStore
"""Publish only proof-backed additions, preserving snapshots, game replay and audits."""
import json,chess,hashlib
from pathlib import Path
from two_rook_mate_proof import verify_certificate
ROOT=Path(__file__).resolve().parents[1];D=ROOT/'scripts/fixtures/promotion-expansion';F=ROOT/'scripts/fixtures/promotion-family-review';OUT=ROOT/'src/lib/server'
proof_store=MateProofStore(D.parent/'promotion')
def read(p):return json.loads(p.read_text())
def save(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
copy={
 'minor-promotion-avoids-pat':dict(title='Phong Tượng hoặc Mã để tránh pat',prompt='Phong cấp để tăng lực lượng mà không gây pat.',hints=['Sau phong Hậu hoặc Xe, Vua đen còn ô nào hợp lệ?','Phong Tượng hoặc Mã để giữ cho Vua đen còn nước đi.'],solution='c8=B — Tốt từ c7 đến c8, phong cấp thành Tượng. Đen còn Ka8 hoặc Kb8. c8=N+ cũng đạt mục tiêu. Phong Hậu hoặc Xe gây hòa do hết nước đi (pat): Vua đen không bị chiếu nhưng không còn nước hợp lệ.'),
 'krobshofer-bishop-selfblock':dict(title='Phong Tượng, chặn rồi mở đường Xe',prompt='Phong cấp và thí Xe để chiếu hết trong bốn nước.',hints=['Cần đưa quân mới đến d1 để chặn đường bảo vệ của Xe f1.','Sau khi Vua đen bắt Xe b1, mở lại đường chiếu của Xe f1.'],solution='Phương án: c8=B b3 Bg4 b2 Bd1 Kxb1 Bb3#. Tượng trên d1 chặn đường bảo vệ của Xe f1, cho phép Kxb1. Bb3 mở đường chiếu của Xe f1 và khống chế a2, c2. Nếu dùng Hậu trên d1, Hậu vẫn bảo vệ b1 nên cách thí Xe này không thực hiện được.'),
 'alapin-rubinstein-rook-mate':dict(title='Alapin — Rubinstein: đổi quân và phong Xe',prompt='Phối hợp đổi quân và phong cấp để chiếu hết trong năm nước.',hints=['Đẩy Tốt h để buộc Vua trắng lùi về h1.','Sau khi đổi Mã lấy Tượng, so sánh phong Hậu và phong Xe.'],solution='Phương án: h2+ Kh1 Nf2+ Bxf2 gxf2 Kxh2 f1=R Kh3 Rh1#. Mã và Tượng được đổi với nhau; Tốt f2 phong Xe để tránh pat. Phong Hậu trên f1 khiến Vua trắng ở h2 hết nước hợp lệ mà không bị chiếu.'),
 'goetz-queen-knight-mate':dict(title='Goetz: Hậu dẫn đường cho Mã mới',prompt='Phối hợp Hậu và phong Mã để chiếu hết trong hai nước.',hints=['Dùng nước chiếu của Hậu để đưa Vua trắng đến f2.','Quân nào sau khi phong cấp trên h1 sẽ chiếu Vua f2?'],solution='Qxe4+ Kf2 gxh1=N#. Hậu chiếu buộc Vua đến f2; Tốt g2 bắt Xe h1 và phong Mã, tạo nước chiếu hết. Phong Hậu, Xe hoặc Tượng trên h1 không tạo nước chiếu vào f2.')}
for r in read(D/'candidates.json'):
 proof=proof_store[r['id']];assert proof['fen']==r['fen'] and proof['moves']==r['moves']
 if r['goal']=='checkmate':verify_certificate(proof)
 for slug in ['underpromotion']+(['promotion-mate'] if r['goal']=='checkmate' else []):
  p=F/(slug+'-original.json');data=read(p);e=dict(copy[r['id']],fen=r['fen'],moves=r['moves'],source=r['source'],mode='interactive',goal=r['goal'],outcome='checkmate' if r['goal']=='checkmate' else 'promotion')
  if r['level']=='Beginner':e['beginner']=True;e['promotionGain']=dict(minimumGain=r['minimumGain'],solverMoves=1);e['alternativeLines']=r['alternatives']
  else:e['difficulty']=dict(level=r['level'],status='suggested',solverMoves=r['solverMoves'],sacrificeCount=1 if r['id']=='krobshofer-bishop-selfblock' else 0,reason='Thí Xe, điều Tượng và chiếu mở trong bốn nước.' if r['id']=='krobshofer-bishop-selfblock' else 'Phân mức theo toàn bộ phương án và các nước đáp.')
  if r['goal']=='material':
   e['promotionGain']=dict(minimumGain=r['minimumGain'],solverMoves=r['solverMoves']);e['alternativeLines']=r.get('alternatives',[])
  if r.get('sourceGame'):
   game=r['sourceGame'];ident=game['gameId'];e['gameReference']=dict(collection=slug,kind='game',id=ident,ply=r['ply'],branch=0);e['previousMove']=r['previousMove']
   srcpath=OUT/(slug+'-game-sources.json');sources=read(srcpath);sources[ident]=dict(kind='game',headers=game['headers'],fen=game['gameFen'],lines=[game['gameMoves']]);save(srcpath,sources)
  rows=data[0]['exercises'];index=next((i for i,x in enumerate(rows) if x['fen']==e['fen']),len(rows))
  if index==len(rows):rows.append(e)
  else:rows[index]=e
  save(p,data)
  b=chess.Board(e['fen']);color=b.turn;features=[]
  for ply,san in enumerate(e['moves']):
   m=b.parse_san(san);features.append(dict(ply=ply,side='solver' if b.turn==color else 'defender',piece=b.piece_at(m.from_square).symbol().upper(),capture=b.is_capture(m),check=b.gives_check(m),promotion=chess.piece_symbol(m.promotion) if m.promotion else None,enPassant=b.is_en_passant(m),castling=b.is_castling(m)));b.push(m)
  audit=ReviewStore(D/'root-reviews.json')[r['id']];ReviewStore(F/(slug+'-reviews.json')).put(index,dict(id=slug+'-'+hashlib.sha256(e['fen'].encode()).hexdigest()[:16],index=index,fen=e['fen'],moves=e['moves'],level=r['level'],features=features,roots=[dict(x,mateNow=x['immediateMate']) for x in audit['roots']],endFen=b.fen(),proof='scripts/fixtures/promotion/mate-proofs.json#'+r['id'],editorialReason=r['mechanism'],limits=dict(rootNodes=600000)))
print('Published four distinct underpromotion decisions and three matching mate exercises.')
