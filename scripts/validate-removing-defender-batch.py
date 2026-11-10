#!/usr/bin/env python3
"""Independently review defender-removal leads in checkpointed batches.

All roots and all immediate defences receive bounded searches; legal replay,
short mates, materials and provenance are recorded. A result remains pending
editorial review: engine evaluations are not forced-payoff proofs.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import chess
import chess.engine

VALUES={1:1,2:3,3:3,4:5,5:9,6:0}

def render(board, info, solver):
    position = board.copy()
    line = []
    for move in info.get('pv', [])[:12]:
        line.append(position.san(move))
        position.push(move)
    score = info['score'].pov(solver)
    return {'pv': line, 'cp': score.score(), 'mate': score.mate(),
            'depth': info.get('depth')}


def short_mates(board):
    """All legal roots for immediate mate or mate on solver's second move."""
    immediate, in_two = [], []
    for move in list(board.legal_moves):
        san = board.san(move)
        board.push(move)
        if board.is_checkmate():
            immediate.append(san)
        elif not board.is_game_over():
            forced = True
            for defence in list(board.legal_moves):
                board.push(defence)
                found = False
                for continuation in list(board.legal_moves):
                    board.push(continuation)
                    found = board.is_checkmate()
                    board.pop()
                    if found:
                        break
                board.pop()
                if not found:
                    forced = False
                    break
            if forced:
                in_two.append(san)
        board.pop()
    return {'immediate': immediate, 'inTwoSolverMoves': in_two}


def balance(board,color):
    return sum((1 if p.color==color else -1)*VALUES[p.piece_type] for p in board.piece_map().values())

def atomic(path,data):
    tmp=path.with_suffix(path.suffix+'.tmp');tmp.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')));os.replace(tmp,path)

def provenance(candidate):
    board=chess.Board(candidate['gameFen']); moves=[];positions=[board.fen()]
    if candidate['headers'].get('Variant','Standard').lower() not in ('standard','chess'):
        raise ValueError('Unsupported game variant')
    for san in candidate['gameMoves']:
        move=board.parse_san(san);moves.append(move.uci());board.push(move);positions.append(board.fen())
    game_hash=hashlib.sha256((candidate['gameFen']+' '+' '.join(moves)).encode()).hexdigest()
    if game_hash != candidate['gameKey']:raise ValueError('Game identity mismatch')
    ply=candidate['ply']
    if ply<1 or ply>=len(positions) or positions[ply]!=candidate['fen']:
        raise ValueError('Game does not reach candidate position')
    if candidate['previousMove'] != {'fen':positions[ply-1],'move':candidate['gameMoves'][ply-1]}:
        raise ValueError('Previous move mismatch')

def main():
    p=argparse.ArgumentParser();p.add_argument('input',type=Path);p.add_argument('--output',required=True,type=Path)
    p.add_argument('--root-nodes',type=int,default=100000);p.add_argument('--reply-nodes',type=int,default=80000)
    p.add_argument('--limit',type=int,default=0)
    args=p.parse_args()
    if str(args.output.resolve()).startswith(str(Path.cwd().resolve())+'/'):p.error('cache must stay outside repository')
    payload=args.input.read_bytes();candidates=json.loads(payload)['records']
    engine=chess.engine.SimpleEngine.popen_uci('/opt/homebrew/bin/stockfish');engine.configure({'Threads':1,'Hash':64})
    settings={'engine':engine.id,'rootNodesEach':args.root_nodes,'replyNodesEach':args.reply_nodes,
              'threads':1,'hashMB':64,'inputSha256':hashlib.sha256(payload).hexdigest()}
    data=json.loads(args.output.read_text()) if args.output.exists() else {'settings':settings,'complete':False,'records':[]}
    if data['settings']!=settings:raise SystemExit('checkpoint settings differ')
    done={r['candidateId'] for r in data['records']};new=0;data['complete']=False
    try:
        for candidate in candidates:
            if candidate['candidateId'] in done:continue
            try:
                provenance(candidate)
                initial=chess.Board(candidate['fen']);solver=initial.turn;base=balance(initial,solver)
                if not initial.is_valid():raise ValueError('Invalid chess position')
                roots=[]
                for move in list(initial.legal_moves):
                    b=initial.copy();san=b.san(move);b.push(move)
                    info=engine.analyse(b,chess.engine.Limit(nodes=args.root_nodes))
                    roots.append({'move':san,**render(b,info,solver)})
                board=initial.copy();defences=[]
                for ply,san in enumerate(candidate['moves']):
                    board.push_san(san)
                    if ply%2 or board.is_game_over():continue
                    options=[]
                    for move in list(board.legal_moves):
                        b=board.copy();reply=b.san(move);b.push(move)
                        info=engine.analyse(b,chess.engine.Limit(nodes=args.reply_nodes))
                        options.append({'reply':reply,'materialGain':balance(b,solver)-base,**render(b,info,solver)})
                    defences.append({'ply':ply+1,'fen':board.fen(),'replies':options})
                row={**candidate,'status':'needs-editorial-review','initialMaterialBalance':base,
                     'shortMates':short_mates(initial),'rootProbes':roots,'defences':defences,
                     'sampleEndingFen':board.fen(),'sampleMaterialGain':balance(board,solver)-base}
            except (ValueError,KeyError,IndexError) as error:
                row={'candidateId':candidate['candidateId'],'fen':candidate.get('fen'),
                     'status':'rejected','reason':str(error)}
            data['records'].append(row);done.add(candidate['candidateId']);new+=1;atomic(args.output,data)
            print(row['candidateId'],row['status'],flush=True)
            if args.limit and new>=args.limit:break
        data['complete']=len(done)>=len(candidates);atomic(args.output,data)
    finally:engine.quit()
    print('reviewed',len(done),'of',len(candidates),'complete',data['complete'],flush=True)

if __name__=='__main__':main()
