import json,chess,collections,argparse
p=argparse.ArgumentParser();p.add_argument('corpus');p.add_argument('output');args=p.parse_args()
src=json.load(open(args.corpus))['records'];out=[]
def officers(b,c):return sum(len(b.pieces(t,c)) for t in [2,3,4,5])
for r in src:
 b=chess.Board(r['gameFen']);boards=[b.copy(stack=False)];moves=[]
 for san in r['gameMoves']:
  moves.append(b.parse_san(san));b.push(moves[-1]);boards.append(b.copy(stack=False))
 for end in range(2,len(boards)):
  z=boards[end]
  if len(z.piece_map())>7 or officers(z,True)+officers(z,False)!=0 or officers(boards[end-1],True)+officers(boards[end-1],False)==0:continue
  for length in range(2,21):
   ply=end-length
   if ply<10:continue
   a=boards[ply]
   if not officers(a,True) or not officers(a,False):continue
   if officers(a,True)>3 or officers(a,False)>3:continue
   out.append(dict(gameId=r['gameId'],ply=ply,end=end,fen=a.fen(en_passant='fen'),endFen=z.fen(en_passant='fen'),line=r['gameMoves'][ply:end],source=r))
print('candidates',len(out),'games',len(set(r['gameId'] for r in out)))
json.dump(out,open(args.output,'w'))
