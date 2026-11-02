"""Apply the recorded B–D editorial selection; research never publishes itself."""
import json
from pathlib import Path
import chess
ROOT=Path(__file__).resolve().parents[1];F=ROOT/'scripts/fixtures/discovery'
# Within-level numbers refer ONLY to upper-candidates.json, before this review.
KEEP={'B':[4,7,8,13,18,21,23,26,27,28,29,30,31,32,33,36,37,38,41],
'C':[1,4,6,9,10,13,14,15,17,18,20,21,23,28,31,32,37,38,39,40,41],
'C*':[5,6,7,8,9,10,11,13,14,15],
'D':[1,2,3,5,6,7,8,9,11,12,15,17,19]}
REGRADE={
 '05b127856d986ac1':('C',1,'Bxg6+ gives a Bishop for a pawn to expose the Rook target; the later Rxf8 is not a recapture of that Bishop.'),
 'c0209e56ab19cf19':('C',1,'e3+ deliberately offers a pawn to the King before Bxb1; the preceding Bishop exchange is equal.'),
 'd45cd7a63d7f0cae':('C',1,'Nxe4 allows Bxd8, sacrificing the stationary Queen before Nxc3+ and recovery of the opposing Queen.'),
 '036003deb06597b9':('D',1,'Bxf5+ leaves the stationary Rook on d1 to Bxd1; two further Rook checks are needed before recovery. Four solver moves with a Rook sacrifice.'),
 '034aa99ac986e10b':('D',1,'Qc3 allows Rxe1, sacrificing the stationary Rook before Nd5+ and Nxb6 win the Queen. Four solver moves.'),
 '2ea0eab3210a6c1b':('D',1,'f6 offers a pawn to Rxf6; the subsequent Knight discovery and Queen capture require five solver moves.'),
 '42e09b38e85184ca':('D',1,'d4 offers a pawn, later taken by Rxd4, before Ng1+ and Bxe4; five solver moves with coordinated preparation.')}
NEW=['66e89386a921a0f6','4c42ad8f14a0d069','59d867196a5f620d','2c941c0fca87f625','605db1bbb1fa9cc2','a1ad9410f81616a3','22a9700eeb011cca',
'f79142da93c0a6b5','9df15f0f818e3bae','b084b8044363463b','4b9dea8ebedc2f28','9a6890d28d1fda55','e2f3d9ba540b9b31','67984d20afcafdb2','ba05878e721a6390','9454bbb50e959995','2deac98cb1be31b3','ce7ae73972f4d57c','7411f04447e3aaec','4a44ccadcb4b7d83','800852c19e2bd894','40138fe04b0de9dc',
'fd4d98272e4bb135','3cddc8c370f51027','23332751c87ee49b','7b685ad76ae3f6b7','3aa080c8abc1afe1','6c8bc0aafbdeb42e','202e45c6e308912b','ec35c8b6a2c0000d','034aa99ac986e10b','2ea0eab3210a6c1b']

SPECIAL={
 ('B',1):'Single-move capture is too direct for B; competing wins also bypass the selected discovery.',
 ('B',2):'Both Bf5# and Bb5# mate immediately. This is a direct A-level recognition task, not B preparation; supersedes the previous user grading under this full suitability review.',
 ('B',20):'User exclusion, 2026-10-29: Muradli–Aronian (former Discovery B #2) is not an accepted level-B teaching example. The saved Rad8 Rc2 Nf2+ Kc1 Bxc2 line uncovers a Bishop attack; a pin benefit has not been established and must not be used to justify inclusion. Remove from publication and preserve the exact source position for review; do not restore to meet the quota.',
 ('B',19):'Repeated Knight-check sequence ending in a pawn capture. Retain B23 and replace this pattern with a Bishop windmill to broaden the moving-piece coverage.',
 ('B',34):'The line has already gained material after fxe5 before the final exf4+ discovery. Its published goal does not require that discovery.',
 ('B',40):'Another Rook windmill after a checking capture; omit in favor of B8 and B27, which retain this mechanism without another near-identical sequence.',
 ('C',19):'Bf8+ offers a shorter non-sacrificial route to material; Bd4+ Rxd4 is unnecessary for the stated payoff and C grading.',
 ('C',24):'Bxc3 and bxc3 already win material without the selected Knight discovery.',
 ('C',36):'Nxb3 wins material directly; the selected Bishop discovery is not essential.',
 ('C*',1):'Two solver moves with no sacrifice; a direct discovery belongs in A, not a deeper C* calculation.',
 ('C*',2):'Two solver moves with no sacrifice, and Rxb7+ is a simpler material win. Unsuitable for C*.',
 ('C*',3):'Two solver moves with no sacrifice; no deeper preparation justifies C*.',
 ('C*',4):'Bxh4+ and other captures already achieve a short material gain; the extra Bishop checks pad the line.',
 ('D',14):'Omit this extended Knight sequence in favor of the retained Knight sacrifice examples and new pawn-promotion, Rook and Bishop discoveries; it adds less variety to the 24-position set.',
 ('D',16):'The Rook-for-two-minor-pieces exchange already creates a safe material gain before the last Knight discovery. The stated goal is reached too early.',
 ('D',18):'After Qxa2 the combination has already produced a safe material gain. The final pawn discovery adds moves without being essential to the stated goal.'}
NAMES={1:'Tốt',2:'Mã',3:'Tượng',4:'Xe',5:'Hậu',6:'Vua'}
def load(name):return json.loads((F/name).read_text())
def describe(b,san):
 m=b.parse_san(san);piece=NAMES[b.piece_type_at(m.from_square)];origin=chess.square_name(m.from_square);dest=chess.square_name(m.to_square)
 if b.is_castling(m):return f'{san} — Vua nhập thành.'
 captured=b.piece_at(m.to_square)
 text=f'{san} — {piece} từ {origin} '+(f'bắt {NAMES[captured.piece_type]} ở {dest}' if captured else f'đến {dest}')
 if b.is_en_passant(m):text=f'{san} — Tốt từ {origin} bắt Tốt qua đường ở {chess.square_name(m.to_square+(-8 if b.turn else 8))}, đến {dest}'
 if m.promotion:text+=f', phong cấp thành {NAMES[m.promotion]}'
 return text+'.'
def detail(r):
 b=chess.Board(r['fen']);first=describe(b,r['moves'][0]);before=b.copy()
 for san in r['moves'][:r['discoveryPly']]:before.push_san(san)
 san=r['moves'][r['discoveryPly']];m=before.parse_san(san);slider=before.piece_at(chess.parse_square(r['sliderSquare']));target=before.piece_at(chess.parse_square(r['targetSquare']));piece=before.piece_at(m.from_square)
 action=describe(before,san)
 mechanism=f"Nước này mở đường cho {NAMES[slider.piece_type]} ở {r['sliderSquare']} "+(f"chiếu Vua ở {r['targetSquare']}." if r['kind']=='check' else f"tấn công {NAMES[target.piece_type]} ở {r['targetSquare']}.")
 if r['kind']=='check':mechanism+=' Đối phương phải xử lý nước chiếu trước khi đáp lại các đe dọa khác.'
 else:
  after=before.copy();after.push(m)
  if after.is_check():mechanism+=f' Đồng thời, {NAMES[piece.piece_type]} chiếu Vua, buộc đối phương xử lý nước chiếu trước khi cứu {NAMES[target.piece_type]}.'
 end=b.copy()
 for x in r['moves'][:-1]:end.push_san(x)
 ending=describe(end,r['moves'][-1])
 text=first
 if r['discoveryPly']>0:text+=' Trong phương án đã cho, '+action
 text+=' '+mechanism
 if r['payoffPly']!=r['discoveryPly']:text+=' '+ending
 if r['goal']=='mate':text+=' Phương án kết thúc bằng chiếu hết.'
 else:text+=' Tính cả các nước bắt lại trong phương án, bên đi giành lợi thế vật chất so với thế cờ ban đầu.'
 if r['level']=='C' and r['gameId']==C14:
  text=first+' Tốt rời g6, mở đường chéo cho Hậu ở h5 chiếu Vua e8. Sau Nxh5, Trắng tiếp tục gxh8=Q: bắt Xe h8 và phong Hậu. Việc chấp nhận mất Hậu h5 là một phần của phương án, không phải một nước đổi quân ngang giá.'
 reason=f"{r['level']}: {' '.join(r['moves'])}. {piece.symbol().upper()} {chess.square_name(m.from_square)}–{chess.square_name(m.to_square)} uncovers {slider.symbol().upper()} {r['sliderSquare']} against {target.symbol().upper()} {r['targetSquare']}; "
 reason+=('checking tempo links preparation to the final '+('mate.' if r['goal']=='mate' else 'material capture.') if r['kind']=='check' else 'the revealed attack and the moving piece create competing threats before the payoff capture.')
 return text,[f"Xem quân nào có thể mở đường tấn công cho {NAMES[slider.piece_type]} sau các nước chuẩn bị.",'Kiểm tra nước đáp, nước bắt lại và kết quả của toàn bộ phương án.'],reason

def main():
 original=load('upper-candidates.json')['candidates'];new=load('upper-research.json')['records'];analyses={r['gameId']:r for name in ['upper-curation-analysis.json','upper-research-review.json'] for r in load(name)['reviews']};shortcuts={r['gameId']:r for name in ['upper-shortcut-review.json','upper-research-shortcuts.json'] for r in load(name)['reviews']}
 second_path=F/'second-pass-curation.json'
 latest={row['gameId']:row for row in load('second-pass-curation.json')['reviews']} if second_path.exists() else {}
 global C14
 C14=[r for r in original if r['level']=='C'][13]['gameId']
 orders={l:[] for l in KEEP};reviews=[];numbers={l:0 for l in KEEP}
 for r in original+new:
  old=r in original;l=r['level'];ident=r['gameId'];numbers[l]+=int(old);n=numbers[l] if old else None
  keep=n in KEEP[l] if old else ident in NEW
  if ident in latest:keep=latest[ident]['decision']=='keep'
  a=analyses[ident];s=shortcuts.get(ident,{});assigned,sac,grading=REGRADE.get(ident,(l,len(r['sacrifices']),None));solution,hints,reason=detail({**r,'level':assigned})
  if not keep:
   reason=SPECIAL.get((l,n)) if old else None
   if ident in ['3b8d9e441babdedb','6d2cdf805155fafa','5114a73607214a20']:reason='All-root engine screening found a mating continuation (Kh1: mate in 4, Qg5+: mate in 8, or Qg7+: mate in 6). This is an unresolved stronger-objective lead, not an exhaustive mate proof; withhold the material exercise rather than publish an incomplete payoff.'
   if not reason and s.get('shortcuts'):reason='Shorter material continuation(s): '+', '.join(x['first'] for x in s['shortcuts'])+'. Every immediate reply and recapture was checked to the recorded horizon; the published longer combination is unnecessary for this level/objective.'
   if not reason and a['flags']:reason='Editorial rejection after complete-line review: '+'; '.join(a['flags'])+'. Material is already available before the selected discovery, or the exercise is too direct for its assigned level.'
   if not reason:reason='Omit as a repeated sacrifice/clearance pattern in the 24-position selection; the retained set includes this mechanism with different blockers, targets and preparation. This is an editorial redundancy decision, not a claim of tactical unsoundness.'
  else:
   orders[assigned].append(ident)
   assert not s.get('shortcuts'),(ident,s)
   assert r['goal']=='mate' or not [x for x in a['flags'] if not x.startswith('user-level-override')],(ident,a['flags'])
  if ident in latest:reason=latest[ident]['reason']
  row={'gameId':ident,'originalLevel':l,'originalExerciseNumber':n,'newResearch':not old,'level':assigned,'gradingReason':grading,'title':r['headers']['White']+' — '+r['headers']['Black'],'fen':r['fen'],'moves':r['moves'],'decision':'keep' if keep else 'remove','reason':reason}
  if keep and grading:row['reason']+=' '+grading
  if keep:
   board=chess.Board(r['fen'])
   for san in r['moves'][:r['discoveryPly']]:board.push_san(san)
   move=board.parse_san(r['moves'][r['discoveryPly']])
   row['coverage']={'mover':board.piece_at(move.from_square).symbol().upper(),'slider':board.piece_at(chess.parse_square(r['sliderSquare'])).symbol().upper(),'kind':r['kind'],'capture':board.is_capture(move),'promotion':bool(move.promotion),'sideToMove':r['fen'].split()[1],'solverMoves':r['solverMoves']}
  if keep:row.update(solutionVi=solution,hintsVi=hints,goal='checkmate' if r['goal']=='mate' else 'material',sacrificeCount=1 if ident==C14 else sac)
  reviews.append(row)
 # Interleave mechanisms instead of grouping all Knights or all sacrifices together.
 by_id={r['gameId']:r for r in reviews}
 for level,ids in orders.items():
  pending=list(ids);ordered=[]
  while pending:
   previous=by_id[ordered[-1]]['coverage'] if ordered else None
   minimum=min(by_id[key]['coverage']['solverMoves'] for key in pending)
   def rank(key):
    c=by_id[key]['coverage'];score=(c['solverMoves']-minimum)*0.5
    if previous:
     score+=5*(c['mover']==previous['mover'])+2*(c['slider']==previous['slider'])+(c['kind']==previous['kind'])
    return score,ids.index(key)
   key=min(pending,key=rank);ordered.append(key);pending.remove(key)
  orders[level]=ordered
 assert all(0<len(v)<=24 for v in orders.values())
 manifest={'date':'2026-10-29' if latest else '2026-10-28','targetPerLevel':24,'scope':'All 120 previously published B/C/C*/D positions, plus the recorded replacement candidates. Beginner and A unchanged.','method':'All legal roots screened by finite engine search; immediate mates and mates in two checked against every reply; bounded material shortcuts and all immediate local discovery defences checked. Full preparation probed with best defensive engine replies. Finite material horizons are not exhaustive long-term proofs. Saved mates additionally have all-reply proofs.','order':orders,'counts':{l:len(v) for l,v in orders.items()},'gaps':{l:24-len(v) for l,v in orders.items()},'reviews':reviews}
 (F/'upper-curation.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
 approved={r['gameId'] for r in reviews if r['decision']=='keep'}
 exclusions=[r for r in load('excluded.json') if not (r.get('batch')=='upper-variety-2026-10-28' and r['gameId'] in approved)];byid={r['gameId']:r for r in exclusions}
 for r in reviews:
  if r['decision']=='remove' and r['gameId'] not in byid:
   row={**r,'batch':'second-pass-2026-10-29' if r['gameId'] in latest else 'upper-variety-2026-10-28'};exclusions.append(row);byid[r['gameId']]=row
 (F/'excluded.json').write_text(json.dumps(exclusions,ensure_ascii=False,indent=2)+'\n')
 print(manifest['counts'],manifest['gaps'])
if __name__=='__main__':main()
