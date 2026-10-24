"""Independently re-analyse mined positions before publishing a teaching set."""
import importlib.util, json, re, argparse, sys, io, hashlib
sys.dont_write_bytecode = True
from pathlib import Path
import chess, chess.engine
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('miner',ROOT/'scripts/collect-skewers.py');miner=importlib.util.module_from_spec(spec);spec.loader.exec_module(miner)

def provenance_error(record):
    try:
        game=chess.pgn.read_game(io.StringIO(record['pgn']))
        if not game or game.errors: return 'Invalid source PGN'
        if dict(game.headers)!=record['headers']: return 'PGN headers differ from source metadata'
        board=game.board(); moves=list(game.mainline_moves()); actual=[]; positions=[board.fen(en_passant='fen')]
        for move in moves:
            if move not in board.legal_moves: return 'Illegal source move'
            actual.append(board.san(move));board.push(move);positions.append(board.fen(en_passant='fen'))
        identity=hashlib.sha256(' '.join(m.uci() for m in moves).encode()).hexdigest()[:16]
        ply=record['ply']
        if identity!=record['gameId'] or actual!=record['gameMoves']: return 'Source game identity mismatch'
        if record['gameFen']!=game.board().fen() or not 0<ply<len(positions): return 'Invalid source start'
        if positions[ply]!=record['fen']: return 'Exercise FEN differs from original game'
        if record['previousMove']!={'fen':positions[ply-1],'move':actual[ply-1]}: return 'Previous move mismatch'
        if not chess.Board(record['fen']).is_valid(): return 'Invalid exercise position'
    except (ValueError, KeyError, IndexError):
        return 'Malformed provenance'
    return None

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--engine',default='/opt/homebrew/bin/stockfish');parser.add_argument('--retry-rejected',action='store_true');parser.add_argument('--target',type=int,default=50);args=parser.parse_args()
    output=ROOT/'scripts/fixtures/skewer/audit.json'
    old=json.loads(output.read_text()) if output.exists() else dict(records=[],rejected=[])
    records=old['records']; rejected=[] if args.retry_rejected else old['rejected']; tested={r['fen'] for r in records+rejected}; games={r['gameId'] for r in records}; positions={' '.join(r['fen'].split()[:4]) for r in records}
    deferred=old.get('deferred',[])
    tested.update(item['fen'] for item in deferred if sum(r['level']==item['level'] for r in records)>=args.target)
    candidates=[]
    for file in sorted((ROOT/'scripts/fixtures/skewer').glob('*candidates.json')):
        try:
            candidates.extend(json.loads(file.read_text())['records'])
        except json.JSONDecodeError:
            # An older collector may still be writing its checkpoint; retry next pass.
            continue
    # Prefer rated tournament opponents and more demanding examples first.
    candidates.sort(key=lambda r:(-int(r['headers'].get('WhiteElo','0') or '0')-int(r['headers'].get('BlackElo','0') or '0'),r['gameId']))
    engine=chess.engine.SimpleEngine.popen_uci(args.engine);engine.configure({'Threads':1,'Hash':128})
    def save():
        temporary=output.with_suffix('.tmp')
        temporary.write_text(json.dumps(dict(engine=engine.id,nodes=1000000,replyCheckNodes=150000,counts={l:sum(r['level']==l for r in records) for l in ['A','B','C','C*','D']},records=records,rejected=rejected,deferred=deferred),ensure_ascii=False,indent=2)+'\n')
        temporary.replace(output)
    try:
        for original in candidates:
            if original['fen'] in tested or original['gameId'] in games or ' '.join(original['fen'].split()[:4]) in positions: continue
            h=original['headers']; reason=provenance_error(original)
            archive=Path(original['source']).stem
            if not miner.master_identity(h, archive): reason='Archive namesake, not the identified master'
            year=h.get('Date','')[:4]
            if not year.isdigit() or not miner.MASTER_SINCE.get(archive,9999)<=int(year)<=2026:
                reason='Outside the verified master-game date range'
            if re.search(r'\bsim|blind|odds|consult',h.get('Event',''),re.I) or '/' in h['White']+h['Black']: reason='Excluded simultaneous, odds or consultation game'
            if reason: rejected.append(dict(fen=original['fen'],reason=reason));tested.add(original['fen']);save();continue
            board=chess.Board(original['fen']);color=board.turn
            info=engine.analyse(board,chess.engine.Limit(nodes=1000000),multipv=3)
            best_score=info[0]['score'].pov(color).score(mate_score=10000)
            selected=None;result=None;score=best_score
            for item in info:
                cp=item['score'].pov(color).score(mate_score=10000)
                found=miner.inspect_line(board,item.get('pv',[]))
                if found and cp>=150 and cp>=best_score-40:
                    selected=item;result=found;score=cp;break
            if not result:
                rejected.append(dict(fen=original['fen'],reason='Skewer or material gain not retained in deeper search'));save();continue
            if sum(r['level']==result['level'] for r in records)>=args.target:
                deferred.append(dict(fen=original['fen'],level=result['level']));tested.add(original['fen']);save();continue
            checks=[];check=board.copy()
            for ply,san in enumerate(result['moves']):
                check.push_san(san)
                # After each learner move, let the engine freely choose the defence.
                if ply%2==0:
                    response=engine.analyse(check,chess.engine.Limit(nodes=150000))
                    cp=response['score'].pov(color).score(mate_score=10000)
                    checks.append(dict(ply=ply+1,score=cp,depth=response.get('depth'),reply=[m.uci() for m in response.get('pv',[])[:8]]))
                    if cp<100: reason='Advantage did not survive a fresh defence search';break
            if reason: rejected.append(dict(fen=original['fen'],reason=reason));tested.add(original['fen']);save();continue
            alternatives=[]
            for item in info:
                if item is selected: continue
                alt=miner.inspect_line(board,item.get('pv',[]));cp=item['score'].pov(color).score(mate_score=10000)
                if alt and cp>=score-40: alternatives.append(alt['moves'])
            record={**original,**result,'score':score,'depth':selected.get('depth'),'alternatives':alternatives,
                    'validation':dict(replyChecks=checks,principalVariation=[m.uci() for m in selected['pv']],score=score)}
            records.append(record);tested.add(record['fen']);games.add(record['gameId']);positions.add(' '.join(record['fen'].split()[:4]));save()
            print('accepted',record['level'],h['White'],h['Black'],record['moves'],flush=True)
    finally: save();engine.quit()
if __name__=='__main__':main()
