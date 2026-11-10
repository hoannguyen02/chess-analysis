"""Build the two-rook practice bank from approved master-game evidence."""
import collections,importlib.util,json,sys
from pathlib import Path
import chess
from two_rook_mate_proof import verify_certificate
from two_rook_mate_research import preflight, record_hash, verify_proof
sys.dont_write_bytecode=True
ROOT=Path(__file__).resolve().parents[1];DATA=ROOT/'scripts/fixtures/two-rook-mate'
spec=importlib.util.spec_from_file_location('miner',ROOT/'scripts/collect-two-rook-games.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)


def append_reviewed(bundle, selected, exercises, sources):
    if bundle['topic'] != 'two-rook-mate' or bundle['status'] != 'editorially-approved-bundle':
        raise ValueError('Two-rook additions need an approved evidence bundle')
    decisions = {row['gameId']: row for row in bundle['reviews']}
    evidence = {row['gameId']: row for row in bundle['reviewResults']}
    occupied = {tuple(row['fen'].split()[:4]) for row in exercises}
    for record in bundle['records']:
        ident = record['gameId']
        decision, result = decisions[ident], evidence[ident]
        position = tuple(record['fen'].split()[:4])
        if (ident in sources or position in occupied or decision['decision'] != 'keep'
                or result['flags'] or result['status'] != 'needs-editorial-review'
                or not decision['recordHash'] == result['recordHash'] == record_hash(record)
                or preflight(record, True)['flags']):
            raise ValueError(f'Unapproved or duplicate two-rook exercise {ident}')
        verify_proof(record, result['mateProof'])
        occupied.add(position)
        selected.append(record)
        exercises.append(dict(
            title=record['headers']['White'] + ' — ' + record['headers']['Black'],
            prompt='Phối hợp hai Xe để chiếu hết Vua đối phương.', mode='interactive',
            outcome='checkmate', goal='checkmate', fen=record['fen'], moves=record['moves'],
            tacticPly=record['tacticPly'], previousMove=record['previousMove'], source=record['source'],
            gameReference=dict(collection='two-rook-mate', kind='game', id=ident,
                               ply=record['ply'], branch=0),
            difficulty=dict(level=record['level'], status='suggested', solverMoves=record['solverMoves'],
                            sacrificeCount=len(record['sacrifices']),
                            reason={
                                'C': 'Thí một quân để tạo thế chiếu hết bằng hai Xe.',
                                'C*': 'Tính nước phòng thủ mạnh trước khi chiếu hết bằng hai Xe.',
                            }.get(record['level'], 'Phối hợp hai Xe không thí quân.')),
            hints=decision['hintsVi'], solution=decision['solutionVi']))
        sources[ident] = dict(kind='game', headers=record['headers'], fen=record['gameFen'],
                              lines=[record['gameMoves']])


def main():
 categories=json.loads((DATA/'composed.json').read_text());exercises=categories[0]['exercises']
 expansion=DATA/'expansion-evidence.json'
 if expansion.exists():
  # The historical compositions stay available for reproducibility only.
  exercises[:]=[row for row in exercises if row.get('difficulty',{}).get('level') not in ('A','B')]
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
  seen.add(r['gameId']);selected.append(r)
 for r in sorted(selected,key=lambda r:(['B','C','C*','D'].index(r['level']),r['solverMoves'],r['gameId'])):
  roles=r['rookRoles'];checker=next(x for x in roles if x['checking']);support=next(x for x in roles if not x['checking']) if any(not x['checking'] for x in roles) else roles[1]
  explanation='Xe ở '+checker['square']+' chiếu Vua; Xe ở '+support['square']+' khống chế đường thoát hoặc bảo vệ Xe chiếu. Cả hai Xe đều cần thiết để hoàn thành thế chiếu hết.'
  if r['sacrifices']:
   names={'Q':'Hậu','R':'Xe','B':'Tượng','N':'Mã'}
   explanation='Hy sinh '+', '.join(names[x['piece']]+' trên '+x['capturedOn'] for x in r['sacrifices'])+' để mở đường cho đòn phối hợp. '+explanation
  exercises.append(dict(title=r['headers']['White']+' — '+r['headers']['Black'],prompt='Tìm cách phối hợp hai Xe để chiếu hết Vua đối phương.',mode='interactive',outcome='checkmate',goal='checkmate',fen=r['fen'],moves=r['moves'],previousMove=r['previousMove'],source=r['source'],gameReference=dict(collection='two-rook-mate',kind='game',id=r['gameId'],ply=r['ply'],branch=0),difficulty=dict(level=r['level'],status='suggested',solverMoves=r['solverMoves'],sacrificeCount=len(r['sacrifices']),reason='Phân mức theo hy sinh và độ sâu phối hợp trong toàn bộ chuỗi chiếu hết.'),hints=['Xem hai Xe có thể phối hợp trên hàng, cột nào để khóa đường thoát của Vua.','Tìm nước chiếu hoặc nước mở đường cho hai Xe; tính cả các cách phòng thủ.'],solution=explanation+' Nhánh mẫu: '+' · '.join(r['moves'])+'.'))
  sources[r['gameId']]=dict(kind='game',headers=r['headers'],fen=r['gameFen'],lines=[r['gameMoves']])
 if expansion.exists():
  append_reviewed(json.loads(expansion.read_text()),selected,exercises,sources)
 categories[0]['description']='Phối hợp hai Xe để hạn chế đường thoát và chiếu hết Vua đối phương. Ở các mức nâng cao, tìm cách mở đường và loại bỏ quân phòng thủ.'
 m.save(ROOT/'src/lib/server/two-rook-mate-exercises.json',categories);m.save(ROOT/'src/lib/server/two-rook-mate-game-sources.json',sources);m.save(DATA/'master-published.json',dict(records=selected))
 print(collections.Counter('Beginner' if e.get('beginner') else e['difficulty']['level'] for e in exercises))
if __name__=='__main__':main()
