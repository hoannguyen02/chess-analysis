"""Prove saved discovery mates against every legal defence within their move limit."""
import json,sys
from pathlib import Path
from functools import lru_cache
import chess
ROOT=Path(__file__).resolve().parents[1];F=ROOT/'scripts/fixtures/discovery'

def prove(record,budget=250000):
 start=chess.Board(record['fen']);side=start.turn;preferences={};b=start.copy();left=(len(record['moves'])+1)//2
 for san in record['moves']:
  m=b.parse_san(san)
  if b.turn==side:preferences[(b.fen(),left)]=m.uci();left-=1
  b.push(m)
 visits=0;proof={}
 @lru_cache(None)
 def solve(fen,left):
  nonlocal visits
  visits+=1
  if visits>budget:raise TimeoutError('mate budget')
  b=chess.Board(fen);key=fen+'|'+str(left)
  if b.is_checkmate():
   if b.turn!=side:proof[key]={'mate':True};return True
   return False
  if b.is_stalemate() or b.is_insufficient_material():return False
  if b.turn==side:
   if left<=0:return False
   moves=list(b.legal_moves);preferred=preferences.get((fen,left));moves.sort(key=lambda m:(m.uci()!=preferred,not b.gives_check(m),not b.is_capture(m)))
   for m in moves:
    a=b.copy();a.push(m)
    if solve(a.fen(),left-1):proof[key]={'move':m.uci()};return True
   return False
  for m in list(b.legal_moves):
   a=b.copy();a.push(m)
   if not solve(a.fen(),left):return False
  proof[key]={'replies':[m.uci() for m in b.legal_moves]};return True
 limit=(len(record['moves'])+1)//2
 try:verified=solve(start.fen(),limit)
 except TimeoutError:return {'status':'unverified','nodes':visits,'budget':budget}
 return {'status':'proved' if verified else 'refuted-within-limit','nodes':visits,'solverMoves':limit,'fen':record['fen'],'moves':record['moves'],'tree':proof if verified else {}}

def main():
 rows=json.loads((F/'upper-candidates.json').read_text())['candidates']
 extra=F/'upper-research.json'
 if extra.exists():rows+=json.loads(extra.read_text())['records']
 result=[]
 for r in rows:
  if r['goal']!='mate':continue
  p=prove(r);p['gameId']=r['gameId'];result.append(p);print(r['gameId'],p['status'],p['nodes'],flush=True)
 (F/'upper-mate-proofs.json').write_text(json.dumps({'proofs':result},ensure_ascii=False,indent=2)+'\n')
if __name__=='__main__':main()
