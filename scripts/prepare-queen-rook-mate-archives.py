"""Normalize downloaded PGN Mentor archives for additional mate research."""
import argparse,hashlib,io,json,re,zipfile
from pathlib import Path
import chess.pgn
ap=argparse.ArgumentParser();ap.add_argument('directory',type=Path);args=ap.parse_args();records={};sources=[]
for path in sorted(args.directory.glob('*.zip')):
 source='https://www.pgnmentor.com/players/'+path.name
 sources.append(dict(source=source,archive=path.name,sha256=hashlib.sha256(path.read_bytes()).hexdigest()))
 with zipfile.ZipFile(path) as archive:
  for name in archive.namelist():
   if not name.lower().endswith('.pgn'):continue
   stream=io.StringIO(archive.read(name).decode('utf-8-sig',errors='replace'))
   while (game:=chess.pgn.read_game(stream)):
    if game.errors or re.search('simul|blind|odds|consult',game.headers.get('Event',''),re.I):continue
    b=game.board();sans=[];uci=[]
    for move in game.mainline_moves():sans.append(b.san(move));uci.append(move.uci());b.push(move)
    if len(sans)<10:continue
    gameid=hashlib.sha256(' '.join(uci).encode()).hexdigest()[:16]
    records.setdefault(gameid,dict(gameId=gameid,headers=dict(game.headers),source=source,gameFen=game.board().fen(),gameMoves=sans))
 print(path.name,len(records),flush=True)
(args.directory/'corpus.json').write_text(json.dumps(dict(records=list(records.values())),ensure_ascii=False)+'\n')
(args.directory/'sources.json').write_text(json.dumps(sources,indent=2)+'\n')
