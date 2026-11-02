"""Publish reviewed simplifications with full-game and exact endpoint evidence."""
import collections, importlib.util, json, sys
from pathlib import Path
import chess
sys.dont_write_bytecode = True
ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/'scripts/fixtures/simplification'
spec=importlib.util.spec_from_file_location('simplification',ROOT/'scripts/collect-simplification.py')
miner=importlib.util.module_from_spec(spec);spec.loader.exec_module(miner)

def main():
    excluded={r['gameId'] for r in json.loads((DATA/'excluded.json').read_text())}
    cache=json.loads((DATA/'tablebase.json').read_text())
    selected=[];seen=set();fens=set()
    reviewed=DATA/'reviewed.json'
    overrides={r['gameId']:r for r in json.loads(reviewed.read_text())['records']} if reviewed.exists() else {}
    for candidate in json.loads((DATA/'researched.json').read_text())['records']:
        r=overrides.get(candidate['gameId'],candidate)
        if r['gameId'] in excluded or r['gameId'] in seen or r['fen'] in fens:continue
        shape=miner.inspect(chess.Board(r['fen']),[chess.Move.from_uci(m) for m in r['validation']['principalVariation']])
        if not shape or any(r[k]!=v for k,v in shape.items()):continue
        if r['goal']=='draw' and r['beforeMaterial']>-100:continue
        end=chess.Board(r['endFen']);color=chess.Board(r['fen']).turn
        expected=('win' if end.turn==color else 'loss') if r['goal']=='win' else 'draw'
        assert cache[r['endFen']]['category']==expected
        walk=chess.Board(r['fen']);events=[]
        for ply,san in enumerate(r['moves']):
            move=walk.parse_san(san);victim=walk.piece_at(move.to_square)
            if victim and victim.piece_type not in [chess.PAWN,chess.KING]:
                events.append(dict(ply=ply,san=san,captured=victim.symbol(),square=chess.square_name(move.to_square)))
            walk.push(move)
        r['review'] = dict(nonPawnCaptures=events,endpoint=r['endFen'],outcome=r['goal'],
            reason='Bilateral liquidation removes '+', '.join(e['captured']+' on '+e['square']+' ('+e['san']+')' for e in events)+'. The remaining pawn ending is '+r['goal']+' for the solver; material balance changes from '+str(r['beforeMaterial'])+' to '+str(r['afterMaterial'])+' cp.')
        r = dict(r, level=miner.publication_level(r))
        seen.add(r['gameId']);fens.add(r['fen']);selected.append(r)
    assert selected,'No validated exercises'
    selected.sort(key=lambda r:(miner.LEVELS.index(r['level']),r['solverMoves'],r['gameId']))
    exercises=[];sources={}
    for r in selected:
        b=chess.Board(r['fen']);end=chess.Board(r['endFen']);side='Trắng' if b.turn else 'Đen'
        target='tàn cuộc Tốt thắng' if r['goal']=='win' else 'tàn cuộc Tốt hòa'
        remaining='; '.join(('Trắng' if c else 'Đen')+': Vua '+chess.square_name(end.king(c))+', '+( 'Tốt '+', '.join(chess.square_name(s) for s in end.pieces(chess.PAWN,c)) if end.pieces(chess.PAWN,c) else 'không còn Tốt') for c in [True,False])
        effect=(f'{side} có thể thắng nếu chơi chính xác.' if r['goal']=='win' else f'{side} đang kém vật chất, nhưng chuỗi đổi đưa về thế có thể giữ hòa nếu chơi chính xác.')
        exercises.append(dict(title=r['headers']['White']+' — '+r['headers']['Black'],prompt='Tìm cách đổi quân để chuyển sang '+target+'.',
            mode='interactive',outcome='simplification',goal=r['goal'],fen=r['fen'],moves=r['moves'],previousMove=r['previousMove'],
            source=r['source'],gameReference=dict(id=r['gameId'],kind='game',ply=r['ply'],branch=0,collection='simplification'),
            difficulty=dict(level=r['level'],status='suggested',solverMoves=r['solverMoves'],sacrificeCount=len(r['sacrifices']),reason='Phân mức theo chuỗi đổi quân và vật chất nhường lại trong nhánh đã kiểm tra.'),
            hints=['Xem có thể đổi hết các quân còn lại để về tàn cuộc Vua và Tốt không.','Tính cả nước bắt lại của đối thủ, rồi so sánh vị trí Vua và các Tốt.'],
            solution='Chuỗi đổi loại bỏ các quân còn lại của cả hai bên. '+remaining+'. '+effect+' Nhánh mẫu: '+' · '.join(r['moves'])+'.'))
        sources[r['gameId']]=dict(kind='game',headers=r['headers'],fen=r['gameFen'],lines=[r['gameMoves']])
    for name,data in [('simplification-exercises',exercises),('simplification-game-sources',sources)]:
        (ROOT/f'src/lib/server/{name}.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
    miner.save(DATA/'published.json',dict(records=selected))
    print(len(selected),dict(collections.Counter(r['level'] for r in selected)),dict(collections.Counter(r['goal'] for r in selected)))
if __name__=='__main__':main()
