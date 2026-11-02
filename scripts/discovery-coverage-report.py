"""Map current upper-level coverage to stable IDs without treating count as coverage."""
import importlib.util,json,sys
from pathlib import Path
import chess
sys.dont_write_bytecode=True
ROOT=Path(__file__).resolve().parents[1];F=ROOT/'scripts/fixtures/discovery'
s=importlib.util.spec_from_file_location('miner',ROOT/'scripts/collect-discovery.py');miner=importlib.util.module_from_spec(s);s.loader.exec_module(miner)
CHECKLIST=['mover-P','mover-N','mover-B','mover-R','mover-Q','mover-K','slider-B','slider-R','slider-Q','target-P','target-N','target-B','target-R','target-Q','target-K','white','black','quiet-move','capture','pawn-one-step','pawn-two-step','pawn-capture','check','double-check','nonchecking-attack','file','rank','diagonal','recapture-prevented','new-absolute-pin','en-passant','promotion-uncover','promotion-in-line','castling-uncover']
def tags(record):
 b=chess.Board(record['fen']);side=b.turn;found=set()
 for ply,san in enumerate(record['moves']):
  move=b.parse_san(san);after=b.copy();after.push(move)
  if ply%2==0:
   if move.promotion:found.add('promotion-in-line')
   for slider,target,kind in miner.discoveries(b,move,after):
    piece=b.piece_type_at(move.from_square)
    found.update(['mover-'+chess.piece_symbol(piece).upper(),'slider-'+b.piece_at(slider).symbol().upper(),'target-'+b.piece_at(target).symbol().upper(),kind,'white' if side else 'black','capture' if b.is_capture(move) else 'quiet-move'])
    if kind=='attack' and not after.is_check():found.add('nonchecking-attack')
    if len(after.checkers())>1:found.add('double-check')
    found.add('file' if chess.square_file(slider)==chess.square_file(target) else 'rank' if chess.square_rank(slider)==chess.square_rank(target) else 'diagonal')
    if piece==chess.PAWN:found.add('pawn-capture' if b.is_capture(move) else 'pawn-two-step' if abs(move.to_square-move.from_square)==16 else 'pawn-one-step')
    if b.is_en_passant(move):found.add('en-passant')
    if move.promotion:found.add('promotion-uncover')
    if b.is_castling(move):found.add('castling-uncover')
    if after.is_pinned(not side,target) and not b.is_pinned(not side,target):found.add('new-absolute-pin')
    if kind=='check':
     actual={m.uci() for m in after.legal_moves if m.to_square==move.to_square}
     counter=after.copy();counter.remove_piece_at(slider)
     if any(m.to_square==move.to_square and m.uci() not in actual for m in counter.legal_moves):found.add('recapture-prevented')
  b=after
 return sorted(found)
def report(records):
 levels={}
 for level in ['B','C','C*','D']:
  rows=[r for r in records if r['level']==level];by_id={r['gameId']:tags(r) for r in rows};aspects={}
  for key in CHECKLIST:
   ids=[ident for ident,covered in by_id.items() if key in covered]
   note='Verified by legal replay of the saved solution; this tag alone does not establish instructional quality.' if ids else 'No retained example verified at this level. Coverage gap; do not fill with an incidental motif or a position outside the level definition.'
   if key=='new-absolute-pin':note+=' A geometric pin is not proof of a pin-dependent payoff; its teaching benefit requires separate review.'
   if key=='recapture-prevented':note+=' Legal recapture becomes possible when the exposed checking slider is removed; this counterfactual is distinct from exhaustive tactical verification.'
   aspects[key]={'status':'represented' if ids else 'gap','exerciseIds':ids,'assessment':note}
  levels[level]={'count':len(rows),'missingPositions':24-len(rows),'aspects':aspects}
 return {'date':'2026-10-29','scope':'B, C, C*, D individually; these mappings do not infer coverage from another level.','method':'Legal replay of actual discoveries throughout each saved line. Preparatory king moves do not count as King clearance. Promotion in a solution is distinguished from promotion that itself uncovers an attack. Geometric tags do not by themselves justify retaining near-duplicates.','levels':levels}
def main():
 records=json.loads((F/'published.json').read_text())['records']
 (F/'second-pass-coverage.json').write_text(json.dumps(report(records),ensure_ascii=False,indent=2)+'\n')
if __name__=='__main__':main()
