#!/usr/bin/env python3
"""Mine defender-removal leads using a skewer-style staged game/PV search.

Candidate output is an external disposable checkpoint, not publication data.
The geometric/PV screen is deliberately permissive and does not establish the
payoff against defences or whether a simpler bypass exists.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import chess
import chess.engine

VALUES={chess.PAWN:1,chess.KNIGHT:3,chess.BISHOP:3,chess.ROOK:5,chess.QUEEN:9,chess.KING:0}

def material(board, color):
    return sum((1 if p.color == color else -1) * VALUES[p.piece_type] for p in board.piece_map().values())

def inspect_line(start, moves):
    """Find captured defenders and target captures in one legal sample line."""
    board=start.copy(); solver=board.turn; baseline=material(board,solver)
    guards=[]; sans=[]
    for index,move in enumerate(moves[:14]):
        if move not in board.legal_moves: break
        if board.turn==solver and board.is_capture(move) and not board.is_en_passant(move):
            captured=board.piece_at(move.to_square)
            if captured:
                for square,piece in board.piece_map().items():
                    if (piece.color != solver and piece.piece_type != chess.KING
                        and square != move.to_square and move.to_square in board.attackers(not solver,square)
                        and board.attackers(solver,square)):
                        guards.append({'defender':chess.square_name(move.to_square),
                                       'target':chess.square_name(square), 'removalPly':index})
        target_capture=[g for g in guards if board.turn==solver and board.is_capture(move)
                        and chess.square_name(move.to_square)==g['target'] and g['removalPly']<index]
        sans.append(board.san(move));board.push(move)
        if target_capture:
            # Include the next played reply when available, to expose immediate recovery.
            if index+1<len(moves) and moves[index+1] in board.legal_moves:
                sans.append(board.san(moves[index+1]));board.push(moves[index+1])
            gain=material(board,solver)-baseline
            if gain>=1:
                event=target_capture[0]
                return {'moves':sans,'motif':event,'sampleGain':gain,
                        'solverMoves':(len(sans)+1)//2}
    return None

def atomic(path,data):
    tmp=path.with_suffix(path.suffix+'.tmp');tmp.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')));os.replace(tmp,path)

def worklist(archives,lookback):
    unique={}; game_positions={}
    for archive in archives:
        for lead in archive['records']:
            if lead['headers'].get('Variant', 'Standard').lower() not in ('standard', 'chess'):
                continue
            game_key=lead['gameKey']
            if game_key not in game_positions:
                start=chess.Board(lead['gameFen']); positions=[start.fen()]
                try:
                    for san in lead['gameMoves']:
                        start.push_san(san);positions.append(start.fen())
                except ValueError:
                    game_positions[game_key]=None
                    continue
                game_positions[game_key]=positions
            positions=game_positions[game_key]
            if positions is None: continue
            for offset in range(0,lookback+1,2):
                ply=lead['ply']-offset
                if ply<1:continue
                fen=positions[ply]; key=' '.join(fen.split()[:4])
                if key in unique:continue
                unique[key]={'fen':fen,'ply':ply,'gameKey':lead['gameKey'],
                             'headers':lead['headers'],'gameFen':lead['gameFen'],
                             'gameMoves':lead['gameMoves'],
                             'previousMove':{'fen':positions[ply-1],'move':lead['gameMoves'][ply-1]},
                             'source':lead.get('source',archive['source']),
                             'archiveSha256':lead.get('archiveSha256',archive['sha256']),
                             'retrieved':lead.get('retrieved',archive['retrieved'])}
    return list(unique.values())

def main():
    p=argparse.ArgumentParser();p.add_argument('inputs',nargs='+',type=Path)
    p.add_argument('--output',required=True,type=Path);p.add_argument('--lookback',type=int,default=6)
    p.add_argument('--quick-nodes',type=int,default=12000);p.add_argument('--deep-nodes',type=int,default=150000)
    p.add_argument('--limit',type=int,default=0,help='maximum new positions this run; 0 means all')
    args=p.parse_args()
    if str(args.output.resolve()).startswith(str(Path.cwd().resolve())+'/'):p.error('output must stay outside repository')
    archives=[json.loads(path.read_text()) for path in args.inputs]
    if not all(a['complete'] for a in archives):raise SystemExit('archive scan incomplete')
    engine=chess.engine.SimpleEngine.popen_uci('/opt/homebrew/bin/stockfish');engine.configure({'Threads':1,'Hash':64})
    settings={'engine':engine.id,'quickNodes':args.quick_nodes,'deepNodes':args.deep_nodes,
              'multiPV':3,'threads':1,'hashMB':64,'lookbackPlies':args.lookback,
              'archives':[a['sha256'] for a in archives]}
    data=json.loads(args.output.read_text()) if args.output.exists() else {'settings':settings,'complete':False,'nextIndex':0,'records':[]}
    if data['settings']!=settings:raise SystemExit('checkpoint settings differ')
    tasks=worklist(archives,args.lookback);started=data['nextIndex'];data['complete']=False
    try:
        for index in range(started,len(tasks)):
            item=tasks[index]; board=chess.Board(item['fen']);side=board.turn
            quick=engine.analyse(board,chess.engine.Limit(nodes=args.quick_nodes))
            lead=inspect_line(board,quick.get('pv',[]))
            if lead:
                infos=engine.analyse(board,chess.engine.Limit(nodes=args.deep_nodes),multipv=min(3,board.legal_moves.count()))
                best=infos[0]['score'].pov(side).score(mate_score=10000)
                for info in infos:
                    score=info['score'].pov(side).score(mate_score=10000)
                    found=inspect_line(board,info.get('pv',[]))
                    if found and score>=150 and score>=best-40:
                        key=hashlib.sha256((item['gameKey']+':'+str(item['ply'])+':'+found['motif']['target']).encode()).hexdigest()[:16]
                        data['records'].append({**item,'candidateId':key,**found,'screenScore':score,'screenDepth':info.get('depth')})
                        break
            data['nextIndex']=index+1
            if data['nextIndex']%25==0:atomic(args.output,data)
            if args.limit and data['nextIndex']-started>=args.limit:break
        data['complete']=data['nextIndex']==len(tasks);data['totalPositions']=len(tasks);atomic(args.output,data)
    finally:engine.quit()
    print('screened',data['nextIndex'],'of',len(tasks),'candidates',len(data['records']),'complete',data['complete'],flush=True)

if __name__=='__main__':main()
