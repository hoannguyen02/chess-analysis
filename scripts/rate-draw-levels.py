"""Reproducible teaching suggestions, not certified human difficulty ratings.
Replay local game segments; inspect sacrifices and first defensive alternatives.
"""
import chess, chess.pgn, chess.engine
import io, json, pathlib, shutil, math, collections
root=pathlib.Path(__file__).resolve().parent.parent
fixtures=root/'scripts/fixtures/draw-practice'
source=json.loads((fixtures/'expanded-draw-sources.json').read_text())
rows=[(cat,row) for cat,records in source['games'].items() for row in records]
for r in json.loads((fixtures/'real-repetition-games.json').read_text()):
 g=chess.pgn.read_game(io.StringIO(r['pgn'])); b=g.board(); all_moves=list(g.mainline_moves())
 for m in all_moves[:r['startPly']]:b.push(m)
 fen=b.fen(en_passant='fen'); moves=[]
 for m in all_moves[r['startPly']:]:moves.append(b.san(m));b.push(m)
 rows.append(('repetition',dict(r,fen=fen,moves=moves)))
engine=chess.engine.SimpleEngine.popen_uci(shutil.which('stockfish'))
engine.configure({'Threads':2,'Hash':128})
values={chess.PAWN:1,chess.KNIGHT:3,chess.BISHOP:3,chess.ROOK:5,chess.QUEEN:9,chess.KING:0}
def material(b,side):return sum(values[p.piece_type]*(1 if p.color==side else -1) for p in b.piece_map().values())
def key(b):return ' '.join(b.fen().split()[:4])
ratings={};audit=[];counts=collections.Counter()
for cat,r in rows:
 b=chess.Board(r['fen']);solver=b.turn;initial=material(b,solver); seen={key(b)};horizon=len(r['moves']);sacrifices=[];offered=[];promotion=False;reply_counts=[]
 for i,san in enumerate(r['moves']):
  move=b.parse_san(san);piece=b.piece_type_at(move.from_square);before=material(b,solver)
  promotion=promotion or bool(move.promotion)
  b.push(move)
  if i%2==0:
   reply_counts.append(b.legal_moves.count())
   # An offer is a flag for review; it is not automatically a sound sacrifice.
   captures=[] if b.is_game_over() else [reply for reply in b.legal_moves if reply.to_square==move.to_square and b.is_capture(reply)]
   if piece!=chess.KING and captures:
    c=b.copy();c.push(captures[0])
    if material(c,solver)<before:offered.append(i)
  if i%2==1:
   prior=chess.Board(r['fen'])
   for s in r['moves'][:i]:prior.push_san(s)
   if prior.is_capture(move) and move.to_square==last_to and last_piece!=chess.KING and material(b,solver)<pair_before:
    sacrifices.append({'ply':i-1,'loss':pair_before-material(b,solver),'move':r['moves'][i-1]})
  else:
   last_to=move.to_square;last_piece=piece;pair_before=before
  if key(b) in seen:
   horizon=i+1;break
  seen.add(key(b))
 decisions=math.ceil(horizon/2)
 after=chess.Board(r['fen']);after.push_san(r['moves'][0]);alternatives=[]
 if not after.is_game_over():
  infos=engine.analyse(after,chess.engine.Limit(nodes=60000),multipv=min(3,after.legal_moves.count()))
  for info in infos:
   variation=after.copy();line=[]
   for m in info.get('pv',[])[:6]:line.append(variation.san(m));variation.push(m)
   alternatives.append({'moves':line,'cpForSolver':info['score'].pov(solver).score(),'mateForSolver':info['score'].pov(solver).mate(),'depth':info.get('depth')})
 # A low-budget screen is a caution flag, never a proof of forced play.
 vulnerable=bool(alternatives and (alternatives[0]['mateForSolver'] is not None and alternatives[0]['mateForSolver']<0 or alternatives[0]['cpForSolver'] is not None and alternatives[0]['cpForSolver'] < -100))
 if sacrifices:
  complex_sac=len(sacrifices)>=2 or any(s['loss']>=5 for s in sacrifices) and max(reply_counts or [0])>=3
  level='D' if complex_sac and decisions>3 else 'C'
  reason=f"Trong đoạn đã chơi có {len(sacrifices)} lần nhường vật chất ({', '.join(s['move'] for s in sacrifices)}). "
  reason+=f'Cần theo dõi khoảng {decisions} nước của bên giải trước khi đạt ý tưởng hoặc lặp chu kỳ.'
 elif offered:
  level='C*'
  reason='Cần tính các khả năng bắt quân đang được đặt vào vùng bị tấn công. Ván gốc chưa thể hiện một hy sinh được nhận; nên xem lại các nhánh trước khi dùng làm bài hy sinh.'
 elif cat=='insufficient-material':
  level='B' if promotion else 'A'
  reason='Một nước đưa ngay về thế không đủ lực chiếu hết; trọng tâm là nhận biết quân còn lại.' if not promotion else 'Cần chọn đúng quân phong cấp để đạt thế hòa, không chỉ thực hiện một nước bắt quân.'
 elif cat=='stalemate':
  level='B'
  reason='Tính một nước của bên giải và nước đáp để nhận ra hết nước đi. Đây là bẫy theo diễn biến thực tế, không phải chuỗi ép hòa đã được chứng minh.'
 elif cat=='fortress':
  motif=r['motif']
  level='B' if motif in ['rook-pawn-corner','wrong-bishop-rook-pawn'] else 'C*'
  reason='Nhận ra góc an toàn rồi giữ đúng vùng phòng thủ; số nước chờ trong đoạn không làm tăng mức độ.' if level=='B' else 'Cần phối hợp Vua với quân phòng thủ và dự tính các nước chiếu hoặc nguy cơ hết nước đi; đây là bài hiểu thế, không phải bài hy sinh.'
 elif cat=='repetition':
  level='B' if decisions<=2 else 'C*'
  reason=f'Nhận ra chu kỳ gồm {decisions} nước của bên giải, không tính các vòng lặp thêm. Các nước đáp là nước đã chơi và không nhất thiết bị bắt buộc.'
 else:
  level='B' if decisions<=2 and max(reply_counts or [0])<=2 else 'C*'
  reason=f'Tìm chuỗi chiếu gồm khoảng {decisions} nước của bên giải trước khi chu kỳ lặp lại; cần kiểm tra đường thoát của Vua.'
 if vulnerable:
  if level=='A':level='B'
  reason+=' Cần giáo viên xem lại: phân tích ngắn tìm thấy khả năng phòng thủ mạnh hơn nước đáp trong ván.'
 rating={'level':level,'reason':reason,'status':'suggested','solverMoves':decisions,'sacrificeCount':len(sacrifices)}
 ratings[r['fen']]=rating;counts[level]+=1
 audit.append({'category':cat,'fen':r['fen'],'headers':r['headers'],'sourceUrl':r['sourceUrl'],'rating':rating,'horizonPlies':horizon,'sacrifices':sacrifices,'unacceptedOffers':offered,'defensiveAlternatives':alternatives,'needsTeacherReview':vulnerable or bool(offered and not sacrifices)})
 if len(audit)%100==0:print(len(audit),dict(counts),flush=True)
engine_id=engine.id;engine.quit()
(fixtures/'draw-level-audit.json').write_text(json.dumps({'method':'Suggested teaching levels v1; recorded-line features plus a 60000-node MultiPV screen, not human-calibrated difficulty or proof of forced replies.','engine':engine_id,'records':audit},ensure_ascii=False,indent=2)+'\n')
(root/'src/lib/chess/draw-level-ratings.ts').write_text("// Generated by scripts/rate-draw-levels.py. Suggestions require teacher calibration.\nimport type { DrawDifficulty } from './draw-levels';\nexport const drawLevelRatings: Record<string, DrawDifficulty> = "+json.dumps(ratings,ensure_ascii=False,indent=2)+';\n')
print(dict(counts),flush=True)
