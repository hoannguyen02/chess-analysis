"""Verify the passer matters: removing all solver passed pawns must remove the win.

This proves the endpoint comparison, not a forced exchange against every defence.
"""
import json,subprocess,time,urllib.parse
from pathlib import Path
import chess
ROOT=Path(__file__).resolve().parents[1];D=ROOT/'scripts/fixtures/promotion-split';path=D/'passed-pawn-tablebase.json';cache=json.loads(path.read_text()) if path.exists() else {};reviews=json.loads((D/'passed-pawn-review.json').read_text());out=[]
for r in reviews:
 b=chess.Board(r['endFen']);color=chess.Board(r['fen']).turn;reduced=b.copy()
 for s in r['passedPawns']:reduced.remove_piece_at(chess.parse_square(s))
 fen=reduced.fen()
 if fen not in cache:
  url='https://tablebase.lichess.ovh/standard?fen='+urllib.parse.quote(fen)
  result=subprocess.run(['curl','-fsS','--max-time','20',url],capture_output=True,text=True)
  if result.returncode:print('unverified',r['fen'],flush=True);continue
  cache[fen]=json.loads(result.stdout);path.write_text(json.dumps(cache,indent=2)+'\n');time.sleep(.4)
 category=cache[fen]['category'];won=category==('win' if reduced.turn==color else 'loss')
 out.append(dict(**r,withoutPassers=fen,withoutPassersCategory=category,accepted=not won,reason='The solver no longer wins when these passed pawns are removed.' if not won else 'Endpoint still wins without the passed pawns; reject incidental passers.'))
 print('accepted' if not won else 'rejected',len(out),flush=True)
(D/'passed-pawn-importance.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
