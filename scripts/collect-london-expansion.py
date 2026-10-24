import io,json,hashlib,re,collections
from pathlib import Path
import chess,chess.pgn
import argparse
parser=argparse.ArgumentParser()
parser.add_argument('--input', type=Path, required=True)
args=parser.parse_args()
root=args.input
names=['Kamsky','Carlsen','Aronian','Kramnik','Grischuk','Nakamura','So','Rapport','Jobava','Ding','Adams','Short','Gelfand','Ivanchuk','Keres','Fischer','VachierLagrave','Giri','Mamedyarov','Caruana','Radjabov']
records={};archives=[]
for name in names:
 files=list(root.rglob(name+'.pgn'))
 if not files:continue
 p=files[0];archives.append(dict(archive=name+'.pgn',sha256=hashlib.sha256(p.read_bytes()).hexdigest(),catalog='https://www.pgnmentor.com/files.html',reference='https://www.pgnmentor.com/players/'+name+'/'))
 with p.open(encoding='utf-8-sig',errors='replace') as f:
  while True:
   offset=f.tell(); h=chess.pgn.read_headers(f)
   if h is None:break
   end=f.tell()
   if h.get('Result') not in ['1-0','0-1','1/2-1/2'] or h.get('SetUp')=='1':continue
   if not re.match(r'(D0[0-5]|A4[0568])',h.get('ECO','')):continue
   if re.search(r'simul|blind|odds|consult|handicap',h.get('Event',''),re.I):continue
   if int(h.get('Date','0000')[:4].replace('?','0'))<1950:continue
   f.seek(offset);g=chess.pgn.read_game(f);f.seek(end)
   if g.errors:continue
   b=g.board();sans=[];fens=[b.fen()];valid=False;exclude=False;jobava=False
   for i,m in enumerate(g.mainline_moves()):
    if i<14 and b.turn and m.from_square in (chess.C2,chess.B1) and m.to_square in (chess.C4,chess.C3):exclude=True
    sans.append(b.san(m));b.push(m);fens.append(b.fen())
    if i<=9 and b.piece_at(chess.D4)==chess.Piece(chess.PAWN,chess.WHITE) and b.piece_at(chess.F4)==chess.Piece(chess.BISHOP,chess.WHITE) and b.piece_at(chess.F3)==chess.Piece(chess.KNIGHT,chess.WHITE):valid=True
   for fen in fens[1:11]:
    bb=chess.Board(fen)
    if all(bb.piece_at(sq)==chess.Piece(pc,True) for sq,pc in [(chess.D4,chess.PAWN),(chess.F4,chess.BISHOP),(chess.C3,chess.KNIGHT)]) and bb.piece_at(chess.C2)==chess.Piece(chess.PAWN,True):jobava=True
   if not (jobava or (valid and not exclude)) or len(sans)<30:continue
   key=hashlib.sha256(' '.join(sans).encode()).hexdigest()[:16]
   if key in records:continue
   if min(int(h.get('WhiteElo','0') or '0'),int(h.get('BlackElo','0') or '0'))<2200 and name not in ['Fischer','Keres']:continue
   clean=chess.pgn.Game();clean.headers.update(g.headers);node=clean
   for m in g.mainline_moves():node=node.add_variation(m)
   records[key]=dict(id='london-'+key,track='jobava' if jobava else 'classical',white=h['White'],black=h['Black'],event=h['Event'],date=h['Date'],round=h.get('Round','?'),result=h['Result'],timeControl='rapid' if re.search('rapid',h['Event'],re.I) else 'blitz' if re.search('blitz|titled tue|titled-tue',h['Event'],re.I) else 'unspecified',source='https://www.pgnmentor.com/players/'+name+'/',sourceArchive=name+'.pgn',pgn=clean.accept(chess.pgn.StringExporter(headers=True,variations=False,comments=False)),moves=sans,fens=fens,whiteElo=h.get('WhiteElo'),blackElo=h.get('BlackElo'))
 print(name,collections.Counter(r['result'] for r in records.values()),flush=True)
Path('scripts/fixtures/london/expansion-candidates.json').write_text(json.dumps(list(records.values()),ensure_ascii=False))
Path('scripts/fixtures/london/expansion-corpus.json').write_text(json.dumps(archives,ensure_ascii=False,indent=2)+'\n')
