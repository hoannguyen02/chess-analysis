"""Scan legal master-game archives; preserve complete provenance for each lead."""
import chess,chess.pgn,json,hashlib,io,zipfile,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];D=ROOT/'scripts/fixtures/promotion-expansion';leads=[];sources=[]
for path in sys.argv[1:]:
 raw=Path(path).read_bytes();archive=zipfile.ZipFile(io.BytesIO(raw));count=0
 for name in archive.namelist():
  if not name.lower().endswith('.pgn'):continue
  stream=io.StringIO(archive.read(name).decode('utf-8-sig',errors='replace'))
  while (game:=chess.pgn.read_game(stream)) is not None:
   if game.errors:continue
   count+=1;b=game.board();moves=[];positions=[]
   for move in game.mainline_moves():
    if move.promotion and move.promotion!=chess.QUEEN:positions.append((len(moves),b.fen(en_passant='fen'),b.san(move)))
    moves.append(b.san(move));b.push(move)
   for ply,fen,san in positions:
    ident=hashlib.sha256((str(dict(game.headers))+' '.join(moves)).encode()).hexdigest()[:16]
    leads.append(dict(gameId=ident,headers=dict(game.headers),gameFen=game.board().fen(),gameMoves=moves,ply=ply,fen=fen,move=san,source='https://www.pgnmentor.com/players/'+Path(path).name.replace('promotion-',''),sha256=hashlib.sha256(raw).hexdigest()))
 sources.append(dict(archive=Path(path).name,sha256=hashlib.sha256(raw).hexdigest(),games=count))
(D/'archive-leads.json').write_text(json.dumps(leads,ensure_ascii=False,indent=2)+'\n');(D/'archive-sources.json').write_text(json.dumps(sources,indent=2)+'\n');print('sources',sources,'leads',len(leads))
