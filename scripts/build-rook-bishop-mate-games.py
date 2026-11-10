"""Merge preserved introductory lessons with reviewed real-game combinations."""
import collections,importlib.util,json,sys
from pathlib import Path
import chess
from two_rook_mate_proof import verify_certificate
sys.dont_write_bytecode=True
ROOT=Path(__file__).resolve().parents[1];DATA=ROOT/'scripts/fixtures/rook-bishop-mate'
spec=importlib.util.spec_from_file_location('miner',ROOT/'scripts/collect-rook-bishop-mate-games.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
def main():
 categories=json.loads((DATA/'composed.json').read_text());exercises=categories[0]['exercises']
 researched=DATA/'master-researched.json'
 records=json.loads(researched.read_text())['records'] if researched.exists() else []
 excluded={r['gameId'] for r in json.loads((DATA/'master-excluded.json').read_text())} if (DATA/'master-excluded.json').exists() else set()
 overrides={r['gameId']:r for r in json.loads((DATA/'master-reviewed.json').read_text())['records']} if (DATA/'master-reviewed.json').exists() else {}
 selected=[];seen=set();sources={}
 for raw in records:
  r=overrides.get(raw['gameId'],raw)
  if r['gameId'] in excluded or r['gameId'] in seen:continue
  shape=m.inspect(chess.Board(r['fen']),[chess.Move.from_uci(u) for u in r['validation']['principalVariation']])
  assert shape and all(r[k]==v for k,v in shape.items()),r['gameId']
  certificate=DATA/'mate-proofs'/(r['gameId']+'.json')
  if certificate.exists():
   proof=json.loads(certificate.read_text());verify_certificate(proof)
   assert proof['fen']==r['fen'] and proof['moves']==r['moves']
   r['validation']['mateCertificate']='mate-proofs/'+certificate.name
  if r['gameId'] not in overrides:continue  # Publish only records that passed the deeper review.
  seen.add(r['gameId']);selected.append(r)
 for r in sorted(selected,key=lambda r:(['A','B','C','C*','D'].index(r['level']),r['solverMoves'],r['gameId'])):
  explanation='Xe ở '+', '.join(x['square'] for x in r['rookRoles'])+' và Tượng ở '+', '.join(x['square'] for x in r['bishopRoles'])+' phối hợp chiếu hết: quân chiếu được hỗ trợ, các ô thoát bị khóa.'
  if r['sacrifices']:
   names={'Q':'Hậu','R':'Xe','B':'Tượng','N':'Mã'}
   explanation='Hy sinh '+', '.join(names[x['piece']]+' trên '+x['capturedOn'] for x in r['sacrifices'])+' để mở đường cho đòn phối hợp. '+explanation
  exercises.append(dict(title=r['headers']['White']+' — '+r['headers']['Black'],prompt='Phối hợp Xe và Tượng để chiếu hết Vua đối phương.',mode='interactive',outcome='checkmate',goal='checkmate',fen=r['fen'],moves=r['moves'],previousMove=r['previousMove'],source=r['source'],gameReference=dict(collection='rook-bishop-mate',kind='game',id=r['gameId'],ply=r['ply'],branch=0),difficulty=dict(level=r['level'],status='suggested',solverMoves=r['solverMoves'],sacrificeCount=len(r['sacrifices']),reason='Phân mức theo hy sinh và độ sâu phối hợp trong toàn bộ chuỗi chiếu hết.'),hints=['Xe kiểm soát hàng và cột; Tượng kiểm soát đường chéo. Tìm cách phối hợp để khóa các ô thoát.','Tìm nước chiếu hoặc nước mở đường cho Xe và Tượng; tính cả các cách phòng thủ.'],solution=explanation+' Nhánh mẫu: '+' · '.join(r['moves'])+'.'))
  sources[r['gameId']]=dict(kind='game',headers=r['headers'],fen=r['gameFen'],lines=[r['gameMoves']])
 categories[0]['description']='Phối hợp Xe và Tượng: bảo vệ quân chiếu, cắt đường thoát và tạo thế chiếu hết.'
 m.save(ROOT/'src/lib/server/rook-bishop-mate-exercises.json',categories);m.save(ROOT/'src/lib/server/rook-bishop-mate-game-sources.json',sources);m.save(DATA/'master-published.json',dict(records=selected))
 print(collections.Counter('Beginner' if e.get('beginner') else e['difficulty']['level'] for e in exercises))
if __name__=='__main__':main()
