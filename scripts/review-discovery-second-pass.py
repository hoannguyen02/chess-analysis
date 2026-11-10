"""Independent second pass: full solver timeline, all-root probes and motif coverage."""
import argparse,importlib.util,json,sys
from pathlib import Path
import chess,chess.engine
from tactic_research import CachedEngine, DEFAULT_CACHE, code_version, digest, resume_reviews, atomic_json
sys.dont_write_bytecode=True
ROOT=Path(__file__).resolve().parents[1];F=ROOT/'scripts/fixtures/discovery'
s=importlib.util.spec_from_file_location('audit',ROOT/'scripts/review-discovery-upper.py');audit=importlib.util.module_from_spec(s);s.loader.exec_module(audit)
miner=audit.build.miner

def line(b,pv):
 a=b.copy();result=[]
 for move in pv:
  result.append(a.san(move));a.push(move)
 return result

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--input',type=Path);parser.add_argument('--output',type=Path);parser.add_argument('--cache',type=Path,default=DEFAULT_CACHE);parser.add_argument('--no-cache',action='store_true');args=parser.parse_args()
 archive=args.input or F/'second-pass-candidates.json'
 if not archive.exists():archive.write_text(json.dumps({'candidates':[r for r in json.loads((F/'published.json').read_text())['records'] if r['level']!='A']},ensure_ascii=False,indent=2)+'\n')
 records=json.loads(archive.read_text())['records' if args.input else 'candidates'];out=args.output or F/'second-pass-analysis.json'
 data=json.loads(out.read_text()) if out.exists() else {'method':'All legal starting moves screened at 1,000,000 total Stockfish MultiPV nodes. Every solver position replayed, including the discovery itself and post-capture settlement. All immediate replies recorded for material balance. Three engine defences per solver move probed at 500,000 nodes; finite search is evidence, not exhaustive tactical proof.','reviews':[]}
 policy={'rootNodes':1000000,'defenceNodes':500000,'engineSha256':__import__('hashlib').sha256(Path('/opt/homebrew/bin/stockfish').read_bytes()).hexdigest(),'code':code_version('tactic_research.py','review-discovery-second-pass.py','review-discovery-level-a.py','build-discovery.py','collect-discovery.py'),'cachedColdHash':not args.no_cache}
 done=resume_reviews(data,records,policy)
 with (chess.engine.SimpleEngine.popen_uci('/opt/homebrew/bin/stockfish') if args.no_cache else CachedEngine(cache=args.cache)) as engine:
  engine.configure({'Threads':1,'Hash':64});data['engine']=engine.id
  for r in records:
   if r['gameId'] in done:continue
   b=chess.Board(r['fen']);side=b.turn;base=miner.material(b,side)
   infos=engine.analyse(b,chess.engine.Limit(nodes=1000000),multipv=b.legal_moves.count())
   roots=[{'move':b.san(x['pv'][0]),'cp':x['score'].pov(side).score(),'mate':x['score'].pov(side).mate(),'line':line(b,x['pv'])} for x in infos]
   walk=b.copy();timeline=[];aspects=set();motifs=[]
   for ply,san in enumerate(r['moves']):
    move=walk.parse_san(san);after=walk.copy();after.push(move)
    if ply%2==0:
     discovered=miner.discoveries(walk,move,after)
     for slider,target,kind in discovered:
      piece=walk.piece_type_at(move.from_square);d={'ply':ply,'move':san,'mover':chess.piece_symbol(piece).upper(),'slider':walk.piece_at(slider).symbol().upper(),'target':walk.piece_at(target).symbol().upper(),'kind':kind,'from':chess.square_name(move.from_square),'to':chess.square_name(move.to_square)};motifs.append(d)
      aspects.update(['mover-'+d['mover'],'slider-'+d['slider'],'target-'+d['target'],kind,'white' if side else 'black'])
      aspects.add('capture' if walk.is_capture(move) else 'quiet-move')
      if kind=='attack' and not after.is_check():aspects.add('nonchecking-attack')
      if len(after.checkers())>1:aspects.add('double-check')
      if chess.square_file(slider)==chess.square_file(target):aspects.add('file')
      elif chess.square_rank(slider)==chess.square_rank(target):aspects.add('rank')
      else:aspects.add('diagonal')
      if piece==chess.PAWN:aspects.add('pawn-capture' if walk.is_capture(move) else 'pawn-two-step' if abs(move.to_square-move.from_square)==16 else 'pawn-one-step')
      if walk.is_en_passant(move):aspects.add('en-passant')
      if walk.is_castling(move):aspects.add('castling')
      if move.promotion:aspects.add('promotion')
     replies=[]
     for reply in list(after.legal_moves):
      z=after.copy();rsan=z.san(reply);z.push(reply);replies.append({'move':rsan,'materialGain':miner.material(z,side)-base,'mate':z.is_checkmate()})
     probe=[]
     if not after.is_game_over():
      for x in engine.analyse(after,chess.engine.Limit(nodes=500000),multipv=min(3,after.legal_moves.count())):probe.append({'cp':x['score'].pov(side).score(),'mate':x['score'].pov(side).mate(),'line':line(after,x['pv'])})
     timeline.append({'ply':ply,'move':san,'fenAfter':after.fen(),'materialGain':miner.material(after,side)-base,'safeImmediateGain':audit.a.safe(after,side,base),'replies':replies,'engineDefences':probe})
    walk=after
   flags=[]
   if r['goal']=='material':
    if any(x['mate'] is not None and x['mate']>0 for x in roots):flags.append('root-mating-lead')
    if any(x['safeImmediateGain'] for x in timeline if x['ply']<r['discoveryPly']):flags.append('material-before-discovery')
    if r['kind']=='attack' and next(x for x in timeline if x['ply']==r['discoveryPly'])['safeImmediateGain']:flags.append('material-on-direct-move-before-discovered-target')
   row={'gameId':r['gameId'],'candidateHash':digest(r),'level':r['level'],'fen':r['fen'],'moves':r['moves'],'aspects':sorted(aspects),'motifs':motifs,'roots':roots,'timeline':timeline,'flags':flags}
   data['reviews'].append(row);atomic_json(out,data);print(r['level'],r['gameId'],flags,flush=True)
if __name__=='__main__':main()
