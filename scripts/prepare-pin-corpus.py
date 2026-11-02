"""Prepare a downloaded PGN Mentor ZIP for collect-pins.py --extra-corpus."""
import argparse,hashlib,importlib.util,io,json,re,zipfile
from pathlib import Path
import chess.pgn
import sys
sys.dont_write_bytecode = True
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('skewer_sources',ROOT/'scripts/collect-skewers.py')
source=importlib.util.module_from_spec(spec);spec.loader.exec_module(source)
def main():
 ap=argparse.ArgumentParser();ap.add_argument('archive',type=Path);ap.add_argument('--name',required=True);ap.add_argument('--output',type=Path,required=True);args=ap.parse_args()
 records=[]
 with zipfile.ZipFile(args.archive) as archive:
  for name in archive.namelist():
   if not name.lower().endswith('.pgn'):continue
   stream=io.StringIO(archive.read(name).decode('utf-8-sig',errors='replace'))
   while (game:=chess.pgn.read_game(stream)):
    year=game.headers.get('Date','')[:4]
    if game.errors or not year.isdigit() or int(year)<source.MASTER_SINCE.get(args.name,9999):continue
    if not source.master_identity(game.headers,args.name):continue
    if game.headers.get('Result') not in ['1-0','0-1','1/2-1/2'] or re.search(r'simul|blind|odds|consult',game.headers.get('Event',''),re.I):continue
    board=game.board();sans=[];uci=[];fen=None
    for move in game.mainline_moves():
     sans.append(board.san(move));uci.append(move.uci());board.push(move)
     if len(sans)==1:fen=board.fen(en_passant='fen')
    if len(sans)<10:continue
    records.append(dict(gameId=hashlib.sha256(' '.join(uci).encode()).hexdigest()[:16],headers=dict(game.headers),source=f'https://www.pgnmentor.com/players/{args.name}.zip',gameFen=game.board().fen(),gameMoves=sans,fen=fen,ply=1))
 args.output.write_text(json.dumps(dict(source=f'https://www.pgnmentor.com/players/{args.name}.zip',sha256=hashlib.sha256(args.archive.read_bytes()).hexdigest(),records=records),ensure_ascii=False)+'\n')
 print(len(records),'complete master games')
if __name__=='__main__':main()
