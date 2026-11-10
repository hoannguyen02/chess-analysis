from mate_proof_store import MateProofStore
"""Publish reviewed promotion positions through shared practice and worksheets."""
import collections,importlib.util,json
from pathlib import Path
import chess
from two_rook_mate_proof import verify_certificate
ROOT=Path(__file__).resolve().parents[1];D=ROOT/'scripts/fixtures/promotion'
proof_store=MateProofStore(D)
spec=importlib.util.spec_from_file_location('m',ROOT/'scripts/collect-promotion-games.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
names={'Q':'Hậu','R':'Xe','B':'Tượng','N':'Mã'}
def exercise(r,composed=False):
 steps=' · '.join(r['moves']);types=', '.join(dict.fromkeys(names[x['piece']] for x in r['promotions']))
 e=dict(title=f"Phong cấp · {r['level']} · Thế biên soạn" if composed else r['headers']['White']+' — '+r['headers']['Black'],prompt='Phong cấp và phối hợp để chiếu hết.',mode='interactive',outcome='checkmate',goal='checkmate',fen=r['fen'],moves=r['moves'],source='Thế cờ biên soạn, đã điều chỉnh vị trí quân.' if composed else r['source'],difficulty=dict(level=r['level'],status='suggested',solverMoves=r['solverMoves'],sacrificeCount=len(r['sacrifices']),reason='Phân mức theo thí quân và độ sâu của toàn bộ phương án.'),hints=['Kiểm tra đường đi của Tốt và quân kiểm soát ô phong cấp.','Xét cả phong cấp thành Hậu, Xe, Tượng hoặc Mã; tính các nước đáp.'],solution=f'Tốt phong cấp thành {types}; quân mới góp phần quyết định vào thế chiếu hết. Phương án: '+steps+'.')
 if not composed:e.update(previousMove=r['previousMove'],gameReference=dict(collection='promotion',kind='game',id=r['gameId'],ply=r['ply'],branch=0))
 return e
categories=json.load(open(D/'composed.json'));items=categories[0]['exercises'];sources={};selected=[]
excluded={r['gameId'] for r in json.load(open(D/'master-excluded.json'))};reviews={r['gameId']:r for r in json.load(open(D/'master-reviewed.json'))['records']}
counts=collections.Counter()
for raw in json.load(open(D/'master-researched.json'))['records']:
 if raw['gameId'] in excluded or raw['gameId'] not in reviews:continue
 r=reviews[raw['gameId']];p=r['gameId']
 if not p in proof_store or counts[r['level']]>=24:continue
 verify_certificate(proof_store[p]);assert m.inspect(chess.Board(r['fen']),[chess.Move.from_uci(u) for u in r['validation']['principalVariation']])
 selected.append(r);items.append(exercise(r));counts[r['level']]+=1;sources[r['gameId']]=dict(kind='game',headers=r['headers'],fen=r['gameFen'],lines=[r['gameMoves']])
candidates=json.load(open(D/'composed-candidates.json'));audits={r['gameId']:r for r in json.load(open(D/'composed-reviewed.json'))};chosen=[]
for level in ['A','B','C','C*','D']:
 pool=sorted([r for r in candidates if r['level']==level and audits.get(r['gameId'],{}).get('decision')=='accepted'],key=lambda r:(0 if any(p['piece']=='N' for p in r['promotions']) else 1,r['solverMoves'],r['gameId']))
 while counts[level]<24 and pool:
  color='w' if counts[level]%2==0 else 'b';index=next((i for i,r in enumerate(pool) if r['fen'].split()[1]==color),0);r=pool.pop(index)
  verify_certificate(proof_store[r['gameId']]);counts[level]+=1;e=exercise(r,True);e['title']+=' '+str(counts[level]);items.append(e);chosen.append(r)
categories[0]['description']='Tốt đến hàng cuối phải đổi thành Hậu, Xe, Tượng hoặc Mã cùng màu. Chọn quân phù hợp với mục tiêu của từng bài.'
assert len(items)==144,counts
m.save(ROOT/'scripts/fixtures/promotion-split/original-mixed.json',categories);m.save(ROOT/'src/lib/server/promotion-game-sources.json',sources);m.save(D/'master-published.json',dict(records=selected));m.save(D/'composed-published.json',chosen)
print('Beginner',24,dict(counts),'real games',len(selected))

# Publish all four objective-specific pages; never restore the mixed route.
import runpy
runpy.run_path(str(ROOT/'scripts/split-promotion-pages.py'),run_name='__main__')
