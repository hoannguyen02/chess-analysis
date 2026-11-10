from mate_proof_store import MateProofStore
"""Merge preserved introductory lessons with reviewed real-game combinations."""
import collections,importlib.util,json,sys
from pathlib import Path
import chess
from two_rook_mate_proof import verify_certificate
sys.dont_write_bytecode=True
ROOT=Path(__file__).resolve().parents[1];DATA=ROOT/'scripts/fixtures/anastasia-mate'
proof_store=MateProofStore(DATA)
spec=importlib.util.spec_from_file_location('miner',ROOT/'scripts/collect-anastasia-mate-games.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
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
  certificate=r['gameId']
  if certificate in proof_store:
   proof=proof_store[certificate];verify_certificate(proof)
   assert proof['fen']==r['fen'] and proof['moves']==r['moves']
   r['validation']['mateCertificate']=proof_store.reference(certificate)
  if not certificate in proof_store:continue
  if r['gameId'] not in overrides:continue  # Publish only records that passed the deeper review.
  seen.add(r['gameId']);selected.append(r)
 for r in sorted(selected,key=lambda r:(['A','B','C','C*','D'].index(r['level']),r['solverMoves'],r['gameId'])):
  explanation='Xe ở '+', '.join(x['square'] for x in r['rookRoles'])+' và Mã ở '+', '.join(x['square'] for x in r['knightRoles'])+' phối hợp chiếu hết: Mã khóa hai ô thoát và Tốt đối phương chắn ô còn lại.'
  if r['sacrifices']:
   names={'Q':'Hậu','R':'Xe','B':'Tượng','N':'Mã'}
   explanation='Thí '+', '.join(names[x['piece']]+' trên '+x['capturedOn'] for x in r['sacrifices'])+' để mở đường cho đòn phối hợp. '+explanation
  exercises.append(dict(title=r['headers']['White']+' — '+r['headers']['Black'],prompt='Phối hợp Xe và Mã để chiếu hết Vua đối phương.',mode='interactive',outcome='checkmate',goal='checkmate',fen=r['fen'],moves=r['moves'],previousMove=r['previousMove'],source=r['source'],gameReference=dict(collection='anastasia-mate',kind='game',id=r['gameId'],ply=r['ply'],branch=0),difficulty=dict(level=r['level'],status='suggested',solverMoves=r['solverMoves'],sacrificeCount=len(r['sacrifices']),reason='Phân mức theo thí quân và độ sâu phối hợp trong toàn bộ chuỗi chiếu hết.'),hints=['Xe kiểm soát hàng và cột; Mã khống chế hai ô thoát cạnh mép bàn cờ. Tìm cách phối hợp để khóa các ô thoát.','Tìm nước chiếu hoặc nước mở đường cho Xe và Mã; tính cả các cách phòng thủ.'],solution=explanation+' Nhánh mẫu: '+' · '.join(r['moves'])+'.'))
  sources[r['gameId']]=dict(kind='game',headers=r['headers'],fen=r['gameFen'],lines=[r['gameMoves']])
 # Fill only the remaining slots with independently reviewed compositions.
 composed=json.loads((DATA/'composed-candidates.json').read_text()) if (DATA/'composed-candidates.json').exists() else []
 reviews={r['gameId']:r for r in json.loads((DATA/'composed-reviewed.json').read_text())} if (DATA/'composed-reviewed.json').exists() else {}
 counts=collections.Counter(r['level'] for r in selected);chosen=[]
 for level in ['A','B','C','C*','D']:
  pool=[r for r in composed if r['level']==level and reviews.get(r['gameId'],{}).get('decision')=='accepted']
  # Alternate sides where possible and keep different starting-piece decisions apart.
  pool.sort(key=lambda r:(r['solverMoves'],r['gameId']))
  while counts[level]<24 and pool:
   color='w' if counts[level]%2==0 else 'b'
   index=next((i for i,r in enumerate(pool) if r['fen'].split()[1]==color),0)
   r=pool.pop(index);proof=proof_store[r['gameId']];verify_certificate(proof)
   assert proof['fen']==r['fen'] and proof['moves']==r['moves']
   counts[level]+=1;chosen.append(r)
   rook=', '.join(x['square'] for x in r['rookRoles']);knight=', '.join(x['square'] for x in r['knightRoles'])
   exercises.append(dict(title=f"Anastasia Mate · {level} · Thế biên soạn {counts[level]}",prompt='Phối hợp Xe và Mã để chiếu hết Vua đối phương.',mode='interactive',outcome='checkmate',goal='checkmate',fen=r['fen'],moves=r['moves'],source='Thế cờ biên soạn, đã điều chỉnh vị trí quân.' if r.get('modifiedFrom') else 'Thế cờ biên soạn.',difficulty=dict(level=level,status='suggested',solverMoves=r['solverMoves'],sacrificeCount=len(r['sacrifices']),reason='Phân mức theo thí quân và độ sâu phối hợp trong toàn bộ phương án chiếu hết.'),hints=['Xác định hai ô thoát mà Mã cần khống chế.','Tính các nước chiếu, nước đáp và cách mở đường chiếu của Xe.'],solution=f'Xe ở {rook} chiếu hết; Mã ở {knight} khống chế hai ô thoát; Tốt ở {r["blockerSquare"]} chắn ô còn lại. Phương án: '+' · '.join(r['moves'])+'.'))
 m.save(DATA/'composed-published.json',chosen)
 categories[0]['description']='Xe chiếu dọc mép bàn cờ; Mã khóa hai ô thoát và Tốt đối phương chắn ô còn lại.'
 m.save(ROOT/'src/lib/server/anastasia-mate-exercises.json',categories);m.save(ROOT/'src/lib/server/anastasia-mate-game-sources.json',sources);m.save(DATA/'master-published.json',dict(records=selected))
 print(collections.Counter('Beginner' if e.get('beginner') else e['difficulty']['level'] for e in exercises))
if __name__=='__main__':main()
