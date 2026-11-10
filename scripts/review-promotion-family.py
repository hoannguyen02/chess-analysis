from review_store import ReviewStore
"""Finite root review and legal feature inventory; engine scores are not proofs."""
import json,hashlib
from pathlib import Path
import chess,chess.engine
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'scripts/fixtures/promotion-family-review'
engine=chess.engine.SimpleEngine.popen_uci('/opt/homebrew/bin/stockfish');engine.configure({'Threads':2,'Hash':128})
try:
 for slug in ['underpromotion','promotion-mate','passed-pawn-simplification']:
  reviews_store=ReviewStore(OUT/(slug+'-reviews.json'))
  source=OUT/(slug+'-original.json')
  if not source.exists():source.write_text((ROOT/'src/lib/server'/(slug+'-exercises.json')).read_text())
  rows=json.loads(source.read_text())[0]['exercises'];audits=[]
  for i,e in enumerate(rows):
   if i in reviews_store:continue
   b=chess.Board(e['fen']);color=b.turn;assert b.is_valid();roots=[];features=[]
   for move in list(b.legal_moves):
    c=b.copy();san=b.san(move);c.push(move)
    info=engine.analyse(c,chess.engine.Limit(nodes=12000)) if not c.is_game_over() else None
    roots.append(dict(move=san,mateNow=c.is_checkmate(),score=info['score'].pov(color).score(mate_score=100000) if info else None,mate=info['score'].pov(color).mate() if info else None,pv=[m.uci() for m in info.get('pv',[])] if info else []))
   c=b.copy()
   for ply,san in enumerate(e['moves']):
    m=c.parse_san(san);features.append(dict(ply=ply,side='solver' if c.turn==color else 'defender',piece=c.piece_at(m.from_square).symbol().upper(),capture=c.is_capture(m),check=c.gives_check(m),promotion=chess.piece_symbol(m.promotion) if m.promotion else None,enPassant=c.is_en_passant(m),castling=c.is_castling(m)));c.push(m)
   info=engine.analyse(b,chess.engine.Limit(nodes=300000))
   record=dict(id=slug+'-'+hashlib.sha256(e['fen'].encode()).hexdigest()[:16],index=i,fen=e['fen'],moves=e['moves'],level='Beginner' if e.get('beginner') else e['difficulty']['level'],features=features,roots=roots,best=dict(score=info['score'].pov(color).score(mate_score=100000),mate=info['score'].pov(color).mate(),pv=[m.uci() for m in info.get('pv',[])]),limits=dict(rootNodes=12000,bestNodes=300000),endFen=c.fen())
   reviews_store.put(i,record);print(slug,i,record['best']['mate'],flush=True)
finally:engine.quit()
