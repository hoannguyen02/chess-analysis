"""Find new composed Promotion combinations; never publish without legal proof.

Candidates use sparse random legal positions and independently altered historical
stems. A decision fingerprint limits repeated mechanisms, rather than counting
color reversals or relocations as new decisions. Full analysis is retained.
"""
import collections,hashlib,importlib.util,json,random,sys
from pathlib import Path
import chess,chess.engine
ROOT=Path(__file__).resolve().parents[1];D=ROOT/'scripts/fixtures/promotion'
spec=importlib.util.spec_from_file_location('m',ROOT/'scripts/collect-promotion-games.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
rng=random.Random(30102642);out=D/'composed-candidates.json';saved=json.load(open(out)) if out.exists() else [];seen={r['fen'] for r in saved}
engine=chess.engine.SimpleEngine.popen_uci('/opt/homebrew/bin/stockfish');engine.configure({'Threads':2,'Hash':128})
stems=json.load(open(D/'master-researched.json'))['records']
for seed in json.load(open(D/'actual-game-candidates.json')):stems.append(dict(gameId=seed['source']['gameId'],fen=seed['fen'],**seed['shape']))
counts=collections.Counter(r['level'] for r in saved);fingerprints=collections.Counter(json.dumps(r['decisionFingerprint']) for r in saved)
try:
 for attempt in range(100000):
  parent=None
  if attempt%3:
   wanted=min(['A','B','C','C*','D'],key=lambda level:counts[level])
   pool=[r for r in stems+saved if r['level']==wanted]
   parent=rng.choice(pool if pool and rng.random()<.85 else stems);b=chess.Board(parent['fen'])
   for _ in range(rng.randint(1,4)):
    pieces=[(sq,p) for sq,p in b.piece_map().items() if p.piece_type!=chess.KING]
    if not pieces:break
    sq,p=rng.choice(pieces);b.remove_piece_at(sq)
    if rng.random()<.8:
     dest=rng.choice([s for s in chess.SQUARES if not b.piece_at(s) and (p.piece_type!=chess.PAWN or chess.square_rank(s) not in [0,7])]);b.set_piece_at(dest,p)
  else:
   b=chess.Board(None)
   for symbol in rng.choice(['KPk','KPPkr','KPRkr','KPQkr','KPNkq','KPBkr','KPBRkq']):
    squares=[s for s in chess.SQUARES if not b.piece_at(s) and (symbol.lower()!='p' or chess.square_rank(s) in [5,6])]
    sq=rng.choice(squares);b.set_piece_at(sq,chess.Piece.from_symbol(symbol))
  b=b.mirror() if attempt%2 else b
  b.clear_stack();b.castling_rights=0;b.ep_square=None;b.halfmove_clock=0;b.fullmove_number=1
  if not b.is_valid() or b.is_game_over() or b.fen() in seen:continue
  if not b.pieces(chess.PAWN,b.turn):continue
  info=engine.analyse(b,chess.engine.Limit(nodes=5000));mate=info['score'].pov(b.turn).mate()
  if mate is None or mate<1 or mate>9:continue
  shape=m.inspect(b,info.get('pv',[]))
  if not shape or counts[shape['level']]>=48:continue
  info=engine.analyse(b,chess.engine.Limit(nodes=220000));shape=m.inspect(b,info.get('pv',[]))
  if not shape or counts[shape['level']]>=48 or info['score'].pov(b.turn).mate()!=shape['solverMoves']:continue
  walk=b.copy();fp=[]
  for i,san in enumerate(shape['moves']):
   move=walk.parse_san(san);p=walk.piece_at(move.from_square);capture=walk.piece_at(move.to_square);flag=(p.symbol().upper(),capture.symbol().upper() if capture else '-',walk.gives_check(move));
   fp.append(flag)
   walk.push(move)
  fingerprint=[shape['level'],fp]
  if fingerprints[json.dumps(fingerprint)]>=1:continue
  ident='composed-'+hashlib.sha256(b.fen().encode()).hexdigest()[:16]
  record=dict(gameId=ident,fen=b.fen(),**shape,decisionFingerprint=fingerprint,modifiedFrom=parent['gameId'] if parent else None,validation=dict(principalVariation=[x.uci() for x in info['pv']],nodes=220000,mate=info['score'].pov(b.turn).mate()))
  saved.append(record);seen.add(b.fen());counts[shape['level']]+=1;fingerprints[json.dumps(fingerprint)]+=1;m.save(out,saved);print(attempt,dict(counts),shape['moves'],flush=True)
  if all(counts[x]>=48 for x in ['A','B','C','C*','D']):break
finally:engine.quit();m.save(out,saved)
