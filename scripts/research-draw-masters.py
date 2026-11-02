"""Mine new drawing-resource candidates from cached, checksummed master archives.
Never publishes automatically. Saved full games are separate from teaching extensions.
"""
import chess,chess.pgn,collections,hashlib,io,json,pathlib,zipfile
ROOT=pathlib.Path(__file__).resolve().parents[1];BASE=ROOT/'scripts/fixtures/draw-practice'
V={1:1,2:3,3:3,4:5,5:9,6:0}
def material(b,c):return sum(V[p.piece_type]*(1 if p.color==c else -1) for p in b.piece_map().values())
def key(b):return ' '.join(b.fen().split()[:4])
prior=json.loads((BASE/'master-candidates.json').read_text()) if (BASE/'master-candidates.json').exists() else {'records':[],'archives':[]}
rows=prior['records'];seen={r['gameId'] for r in rows};archives=prior['archives']
for path in sorted(list(pathlib.Path('/private/tmp/rook-bishop-pgn').glob('*.zip'))+list(pathlib.Path('/tmp/draw-master-archives').glob('*.zip'))):
 raw=path.read_bytes();checksum=hashlib.sha256(raw).hexdigest();url='https://www.pgnmentor.com/players/'+path.name
 if any(a['url']==url and a['sha256']==checksum for a in archives):continue
 archives.append(dict(url=url,sha256=checksum))
 with zipfile.ZipFile(path) as z:
  text=z.read(next(n for n in z.namelist() if n.lower().endswith('.pgn'))).decode('utf-8-sig',errors='replace')
 stream=io.StringIO(text);count=0
 while True:
  offset=stream.tell();h=chess.pgn.read_headers(stream)
  if h is None:break
  if h.get('Result')!='1/2-1/2':continue
  stream.seek(offset);g=chess.pgn.read_game(stream)
  if g.errors or g.headers.get('FEN'):continue
  ms=list(g.mainline_moves());gid=hashlib.sha256((' '.join(m.uci() for m in ms)+g.headers.get('White','')+g.headers.get('Black','')).encode()).hexdigest()[:16]
  if gid in seen:continue
  seen.add(gid);b=g.board();bs=[b.copy(stack=False)];ks=[key(b)];sans=[]
  for m in ms:sans.append(b.san(m));b.push(m);bs.append(b.copy(stack=False));ks.append(key(b))
  if len(ms)<20:continue
  hits=[i for i,k in enumerate(ks[:-1]) if k==ks[-1] and 2<=len(ms)-i<=8]
  if not hits:continue
  period=len(ms)-max(hits);cycle=min(hits);end=len(ms);cy=ms[-period:]
  for side in [True,False]:
   checking=all(bs[i+1].is_check() for i in range(cycle,end) if bs[i].turn==side)
   if not checking:continue
   # Prefer a meaningful preparatory segment; shortest repeats alone are not advanced.
   candidates=[]
   for start in range(max(10,cycle-14),cycle+1):
    if bs[start].turn!=side:continue
    base=material(bs[start],side);sacs=[]
    for p in range(start,min(end-1,cycle+2),2):
     m,n=ms[p],ms[p+1]
     if bs[p+1].is_capture(n) and n.to_square==m.to_square and material(bs[p+2],side)<material(bs[p],side):
      loss=material(bs[p],side)-material(bs[p+2],side)
      # No immediate material recovery after the next solver move.
      if p+3<len(bs) and material(bs[p+3],side)>=material(bs[p],side):continue
      sacs.append(dict(ply=p-start,move=sans[p],loss=loss))
    decisions=(cycle-start)//2+period//2
    if sacs:
     if sacs[0]['ply']>2:continue
     level='D' if decisions>3 and (len(sacs)>1 or max(s['loss'] for s in sacs)>=5) else 'C'
     if level=='C' and decisions>3:continue
    else:
     if decisions<4 or decisions>6 or bs[start].gives_check(ms[start]):continue
     level='C*'
    candidates.append((start,level,sacs,decisions))
   # Keep alternatives for independent grading, but publish at most one per game.
   for start,level,sacs,decisions in candidates:
    local=chess.Board(bs[start].fen(en_passant='fen'));line=[]
    for m in ms[start:]:line.append(local.san(m));local.push(m)
    extensions=0
    while not local.is_repetition(3) and extensions<3:
     for m in cy:
      if local.is_game_over(claim_draw=True):break
      if not local.is_legal(m):break
      line.append(local.san(m));local.push(m)
     extensions+=1
    if not local.is_repetition(3):continue
    rows.append(dict(id='draw-master-'+gid+'-'+str(start),gameId=gid,headers=dict(g.headers),sourceUrl=url,archiveSha256=checksum,pgn=g.accept(chess.pgn.StringExporter(headers=True,variations=False,comments=False)),fen=bs[start].fen(en_passant='fen'),startPly=start,previousMove=dict(fen=bs[start-1].fen(en_passant='fen'),move=sans[start-1]),moves=line,actualGamePlies=end-start,cyclePlies=len(cy),solverDecisions=decisions,sacrifices=sacs,proposedLevel=level))
    count+=1
 print(path.name,'candidates',count,'total',len(rows),flush=True)
 (BASE/'master-candidates.json').write_text(json.dumps(dict(archives=archives,records=rows),ensure_ascii=False,indent=2)+'\n')
print(collections.Counter(r['proposedLevel'] for r in rows),flush=True)
