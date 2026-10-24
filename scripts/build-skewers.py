"""Build the skewer practice payload and full-game viewer from audited records."""
import json, math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
LEVELS=['A','B','C','C*','D']
LEVEL_OVERRIDES=json.loads((ROOT/'scripts/fixtures/skewer/level-overrides.json').read_text())
def teaching_level(record):
    return LEVEL_OVERRIDES.get(record['gameId'], {}).get('level', record['level'])

def publication_records(records):
    # The introductory queen lessons own these positions; preserve the audit
    # and full games, but do not repeat them in Level A.
    pilot=json.loads((ROOT/'src/lib/server/queen-skewer-pilot.json').read_text())
    positions={' '.join(e['fen'].split()[:4]) for e in pilot}
    return [r for r in records if not (
        teaching_level(r)=='A' and ' '.join(r['fen'].split()[:4]) in positions)]
DESCRIPTIONS={
'A':'Tạo đòn xiên ngay, rồi bắt quân phía sau; không cần chuẩn bị hay hy sinh.',
'B':'Một nước chuẩn bị để tạo đòn xiên; không hy sinh vật chất.',
'C':'Một hy sinh đơn giản dẫn đến đòn xiên trong chuỗi ngắn.',
'C*':'Cần tính trước 2–3 nước chuẩn bị; không có hy sinh đã xác nhận trong nhánh.',
'D':'Hy sinh phức tạp và hơn 3 nước của bên giải để khai thác đòn xiên.',
}
PIECES={'B':'Tượng','R':'Xe','Q':'Hậu'}
def build(records, minimum_per_level=0):
    all_records=records
    records=publication_records(records)
    counts={level:sum(teaching_level(r)==level for r in records) for level in LEVELS}
    if any(count<minimum_per_level for count in counts.values()):
        raise ValueError(f'Not enough validated records: {counts}; need {minimum_per_level} each')
    if len({r['gameId'] for r in records})!=len(records):
        raise ValueError('Duplicate source game in publication set')
    if len({' '.join(r['fen'].split()[:4]) for r in records})!=len(records):
        raise ValueError('Duplicate position in publication set')
    exercises=[]
    sources={r['gameId']:dict(kind='game',headers=r['headers'],fen=r['gameFen'],lines=[r['gameMoves']]) for r in sorted(all_records,key=lambda r:(LEVELS.index(teaching_level(r)),r['solverMoves'],r['skewerPly'],r['gameId']))}
    for r in sorted(records,key=lambda r:(LEVELS.index(teaching_level(r)),r['solverMoves'],r['skewerPly'],r['gameId'])):
        ident=r['gameId']; headers=r['headers']; motif=r['motif']; level=teaching_level(r)
        exercises.append(dict(
            title=headers['White']+' — '+headers['Black'],
            prompt='Tìm cách thắng vật chất bằng đòn xiên.',
            mode='interactive',outcome='skewer',fen=r['fen'],moves=r['moves'],alternativeLines=r.get('alternatives',[]),
            previousMove=r['previousMove'],source=r['source'],
            gameReference=dict(id=ident,kind='game',ply=r['ply'],branch=0,collection='skewer'),
            difficulty=dict(level=level,status='suggested',reason=LEVEL_OVERRIDES.get(ident, {}).get('reason', DESCRIPTIONS[level]),solverMoves=r['solverMoves'],sacrificeCount=len(r['sacrifices'])),
            hints=['Quan sát các hàng, cột và đường chéo: có thể buộc quân phía trước rời đường để bắt quân phía sau không?' if level=='A' else 'Tìm cách ép hai quân đối phương vào cùng một đường trước khi ra đòn.'],
            solution=f"{PIECES[motif['piece']]} tại {motif['attacker']} tấn công quân ở {motif['front']}, để khai thác quân phía sau ở {motif['back']}. Nhánh mẫu: {' · '.join(r['moves'])}."
        ))
    (ROOT/'src/lib/chess/skewer-exercises.json').write_text(json.dumps(exercises,ensure_ascii=False,indent=2)+'\n')
    (ROOT/'src/lib/server/skewer-game-sources.json').write_text(json.dumps(sources,ensure_ascii=False,separators=(',',':'))+'\n')
    print({level:sum(e['difficulty']['level']==level for e in exercises) for level in LEVELS})
if __name__=='__main__':
    import argparse
    parser=argparse.ArgumentParser();parser.add_argument('audit',nargs='?',default='scripts/fixtures/skewer/audit.json');parser.add_argument('--minimum-per-level',type=int,default=0);args=parser.parse_args()
    build(json.loads((ROOT/args.audit).read_text())['records'], args.minimum_per_level)
