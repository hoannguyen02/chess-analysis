"""Publish only explicit editorial decisions; source regeneration cannot restore exclusions."""
import collections, importlib.util, json, pathlib
P=pathlib.Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('review',P/'review-draw-collection.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
# suffix, level, distinct learning decision, learner-facing explanation
CHOICES=[
 ('82cb45','Beginner','Remove the only pawn before it can promote','Bắt Tốt h4 để chỉ còn hai Vua. Không bên nào còn quân có thể chiếu hết.'),
 ('58e42e','Beginner','Escape a rook check by capturing the unprotected checking piece','Vua bắt Xe f4 để hết bị chiếu. Hai Vua còn lại không thể tạo thế chiếu hết.'),
 ('55a085','Beginner','Remove the pawn although the opponent retains a bishop','Bắt Tốt f5. Trắng còn Tượng nhưng Vua và một Tượng không thể chiếu hết Vua đối phương.'),
 ('240112','Beginner','Remove the pawn even though the enemy king could otherwise recapture the knight','Mã bắt Tốt h5. Thế cờ chỉ còn Vua và Mã chống Vua nên hòa ngay; không cần chờ Vua Đen bắt lại Mã.'),
 ('f7eec2','Beginner','Remove the opponent’s rook, leaving only the capturing bishop','Tượng bắt Xe d3. Đen chỉ còn Vua và Tượng, Trắng chỉ còn Vua: không thể có chiếu hết.'),
 ('82627e','Beginner','Answer check by removing the bishop, leaving a single knight','Mã bắt Tượng e4, giải chiếu và đưa thế cờ về Vua và Mã chống Vua. Ván cờ hòa vì không thể có chiếu hết.'),
 ('2f71d18786148b31','Beginner','Answer a pawn check by blocking promotion rather than stepping aside','Vua đến f8 để giải chiếu và chặn ô phong cấp của Tốt f7. Nếu Trắng đưa Vua đến f6 như trong ván gốc, Đen không bị chiếu và không còn nước hợp lệ: hòa do hết nước đi (pat).'),
 ('21246e01','Beginner','Occupy the rook-pawn promotion corner','Vua đến a8, chặn ô phong cấp của Tốt a7. Sau Ka6 trong ván gốc, Đen không bị chiếu và không còn nước hợp lệ: hòa do hết nước đi (pat).'),
 ('dfd268','A','Capture the last pawn with check evasion while same-coloured bishops remain','Vua bắt Tốt f3 để giải chiếu. Hai Tượng còn lại đều đi trên ô cùng màu; không còn Tốt hay quân khác ngoài hai Vua, nên không thể tạo thế chiếu hết.'),
 ('57c79a','A','Remove the pawn despite an apparent king recapture; both resulting endings are dead','Tượng bắt Tốt b5. Hai Tượng còn lại đi trên ô cùng màu, nên thế cờ đã hòa; không cần chờ Vua bắt lại Tượng.'),
 ('a85a6435fcda88c1','A','Bishop alternates diagonals around a king constrained by pawns','Tượng chuyển giữa f1 và e2 để tiếp tục chiếu. Các Tốt quanh Vua Trắng hạn chế đường thoát, giúp Đen duy trì chu kỳ chiếu.'),
 ('e474e7ba7599b345','A','Rook checks on adjacent ranks against a king on the edge','Xe chuyển giữa d1 và d2, chiếu Vua ở a1 hoặc a2. Xe b5 cùng các Tốt Đen hạn chế đường thoát của Vua Trắng.'),
 ('6d66a5c8ecdb6b2b','A','Queen stays on a file while checking two king squares','Hậu chuyển giữa g3 và h3 để chiếu. Vua Trắng không thể tiến lên vì Hậu kiểm soát các ô thoát ở hàng 2; Vua chỉ luân phiên giữa g1 và h1.'),
 ('6760ace97d0b4a1d','A','Queen switches between a diagonal check and a rank check','Hậu chiếu từ e1 rồi về h4. Xe g2 chiếm một ô thoát của Vua Trắng; tiếp tục chiếu khi Vua đổi ô.'),
 ('89760c40c22a2d3b','A','Repeated checks force queen interpositions rather than king moves','Hậu Đen chuyển giữa a2 và c4. Trắng phải dùng Hậu che đường chiếu ở a3 hoặc b4; Vua không có ô thoát.'),
 ('b41bbbb65c03bde4','A','Advance the last mobile pawn with check to lock it','Đẩy h5+ khiến Tốt h5 bị Tốt h6 chặn. Khi Vua Đen rời g6 để giải chiếu, Vua Trắng vẫn bị Hậu khống chế mọi ô đi và không còn nước hợp lệ.'),
 ('07d6d35be0bd4012','A','Check with a pawn closes the last pawn move; the other pawn is already blocked','Đẩy h4+ để khóa Tốt h4 trước Tốt h3. Các Tốt còn lại của Đen cũng bị chặn; sau nước đáp của Vua Trắng, Đen không bị chiếu và không còn nước hợp lệ.'),
 ('db3544dfcf8d4051','A','Block promotion when an extra knight restricts the defender’s escape squares','Vua đến f8 để chặn Tốt f7. Đoạn ván gốc kết thúc bằng Nf5, tạo hòa do hết nước đi (pat); các cách tiếp tục khác cần giữ Vua gần ô phong cấp.'),
 ('608a448343817011','A','Reach the rook-pawn corner before the pawn advances','Vua đến h7 rồi giữ đường về h8 khi Tốt tiến lên. Chỉ cần giữ được góc phong cấp, Trắng không thể dùng Vua và Tốt biên để buộc thắng.'),
 ('1ac02aac334d4f70','A','Use the promotion corner that the bishop cannot control','Vua giữ vùng h1. Tượng Đen đi trên ô đen, không kiểm soát được ô h1; Đen không thể đuổi Vua khỏi góc để phong cấp nếu Trắng phòng thủ đúng.'),
 ('c164943280a26770','A','Leave the corner while avoiding the pawn’s attacked square, then return','Vua tạm rời h1 đến g2 rồi trở lại h1 khi cần; tránh ô g1 đang bị Tốt h2 khống chế. Tốt h2 chưa thể phong cấp vì Vua có thể bắt quân vừa xuất hiện ở h1; Tượng Đen không kiểm soát ô h1.'),
 ('0a667ba11a2179a9','B','Bishop checks exploit the opponent’s own pieces blocking the king','Tượng chiếu luân phiên từ e3 và f2. Các quân Trắng quanh Vua cản đường thoát; cần kiểm tra cả khả năng bắt Tượng và che đường chiếu.'),
 ('7e254e8dda5db566','B','Knight checking cycle depends on coordinated heavy-piece control','Mã chuyển giữa f1 và g3 để chiếu. Hậu và Xe Đen kiểm soát các ô thoát và bảo vệ thế chiếu; không được ngừng chiếu để Trắng phản công.'),
 ('9563d3bd352c8d03','B','Two rooks coordinate a checking net with alternative king escapes','Xe c6 chiếu từ c7 rồi trở lại c6 trong đoạn ván gốc. Xe f4 và các Tốt hỗ trợ hạn chế đường đi của Vua; nếu Vua đổi đường, cần đổi ô chiếu phù hợp.'),
 ('aa0c5b5f54904ae0','B','Queen switches long diagonals while a friendly pawn seals the king’s escape','Hậu chuyển giữa e8 và g6. Tốt h5 bảo vệ Hậu khi đến g6; cần kiểm tra các nước tiến Vua và cách tiếp tục chiếu trước khi lặp lại.'),
 ('5bcc33f22d52a133','B','Queen checking route must account for a central king escape','Hậu chuyển giữa h8 và f6 trong ván gốc. Nếu Vua Đen chọn ô khác, phải tiếp tục chiếu theo đường mới; không chỉ ghi nhớ hai ô của đoạn đã chơi.'),
 ('40b17caabfa22aaf','B','Coordinate a bishop retreat with a safe corner against a rook','Tượng rút về c4 rồi phối hợp với Vua để giữ vùng h8. Góc h8 khác màu ô của Tượng, giúp tránh thế bị dồn ép; luôn kiểm tra đường chiếu của Xe và an toàn của Tượng.'),
 ('f5c082a80dfd541e','B','Preserve the bishop’s retreat diagonal while moving into the safe corner','Tượng đến a2, chuẩn bị đường lùi về b1 khi Vua đến a1. Giữ Tượng an toàn và tránh để Xe tách Vua khỏi vùng phòng thủ.'),
 ('10198df754295478','B','Rook pawn on the seventh rank uses corner stalemate against a queen','Giữ Vua gần Tốt a2 và trở về a1 khi Hậu ép sát. Nếu Vua Trắng tiến lại quá sớm, nguy cơ hết nước đi (pat) ngăn Trắng tận dụng ưu thế Hậu.'),
 ('c005771ee641bcdf','B','Bishop pawn on the seventh rank uses the adjacent corner to resist a queen','Vua đến a8 để tránh chiếu rồi trở lại b8, luôn ở gần Tốt c7. Tốt Tượng ở hàng 7 tạo khả năng hòa do hết nước đi (pat); phải kiểm tra khoảng cách của Vua Đen trước mỗi lần rời Tốt.'),
 ('da2a3c85f8522a8e','C','Sacrifice the last rook; declining capture allows further checking offers','Thí Xe bằng Rxg7+. Nếu Kxg7 như trong ván gốc, Trắng hết nước đi và hòa. Nếu Vua tránh bắt, Trắng tiếp tục chiếu và đưa Xe vào ô Vua có thể bắt; cần duy trì cơ chế hết nước đi khi Xe bị lấy.'),
 ('draw-9f2f87aadb799242','C*','King and bishop manoeuvres preserve the blockade before a non-check repetition','Đi Kd6 — Vua từ c5 đến d6. Vua tiếp tục qua e5 rồi trở lại d6; sau ...Bd5, đưa Vua về c5 rồi qua b4. Đoạn ván đã chơi lặp lại thế cờ ban đầu lần thứ ba sau ...Kg6, với cùng bên đến lượt và cùng quyền nhập thành. Trắng có thể yêu cầu hòa theo luật ba lần lặp lại thế cờ. Đây là diễn biến thực tế; không khẳng định mọi nước đáp đều bị bắt buộc.'),
]

def main():
 rows=mod.sources();evidence=json.loads((mod.BASE/'collection-review.json').read_text());ev={r['id']:r for r in evidence['records']}
 proofs={r['id']:r for r in json.loads((mod.BASE/'resource-proofs.json').read_text())['records']}
 selected=[]
 for suffix,level,aspect,solution in CHOICES:
  matches=[r for r in rows if r['id'].endswith(suffix)];assert len(matches)==1,suffix
  r=matches[0]; b=mod.chess.Board(r['fen'])
  if r['category'] in ['perpetual-check','stalemate']:assert proofs[r['id']]['status']=='proved',r['id']
  elif r['category']=='fortress':assert all(x['wdl']==0 for x in r['validation']['positions'])
  elif r['category']=='repetition':
   for s in r['moves']:
    m=b.parse_san(s);assert not b.gives_check(m),r['id'];b.push(m)
   assert b.is_repetition(3),r['id']
  else:
   for s in r['moves']:b.push_san(s)
   assert b.is_insufficient_material()
  selected.append(dict(id=r['id'],fen=r['fen'],category=r['category'],level=level,aspect=aspect,solution=solution))
 assert len({r['fen'] for r in selected})==len(selected)
 counts=collections.Counter(r['level'] for r in selected);assert all(n<=24 for n in counts.values())
 decisions=[];chosen={r['id']:r for r in selected}
 for r in rows:
  a=ev[r['id']]
  if r['id'] in chosen:status='selected';reason=chosen[r['id']]['aspect']
  else:
   bad=[s for s in a['solverSteps'] if s.get('bestDefence',{}).get('mate',0) is not None and s.get('bestDefence',{}).get('mate',0)<0 or s.get('bestDefence',{}).get('cp',0) is not None and s.get('bestDefence',{}).get('cp',0)<-100]
   if r['id']=='draw-cc7b46bde772376d':status='excluded';reason='h3+ is the only legal starting move; the recorded sacrifice adds no tactical choice for level C.'
   elif bad:status='excluded';reason='Recorded solver move permits stronger defence; see solverSteps in collection-review.json.'
   elif a['bestStart']['mate'] is not None and a['bestStart']['mate']>0 or a['bestStart']['cp'] is not None and a['bestStart']['cp']>100:status='withheld';reason='Competing winning continuation flagged by engine; a drawn game result is insufficient.'
   elif r['category']=='repetition':status='withheld';reason='Recorded non-check shuffle has no verified obligation to repeat or reviewed defensive mechanism; no published forcing-draw claim.'
   elif r['category']=='insufficient-material':status='excluded';reason='Repeated one-move elimination of the last mating material; selected examples cover the distinct remaining-material decisions.'
   elif r['category']=='fortress':status='excluded';reason='Repeated defensive geometry; retain representative decisions, not shifted boards or extra waiting moves.'
   elif proofs[r['id']]['status']=='proved':status='excluded';reason='Repeated king/pawn blockade or checking mechanism; exact drawing proof alone does not add instructional variety.'
   else:status='withheld';reason='Recorded drawing continuation passes some screens but universal resource verification is unresolved within the bounded search; do not call it disproved.'
  decisions.append(dict(id=r['id'],fen=r['fen'],moves=r['moves'],category=r['category'],status=status,reason=reason))
 result=dict(targetPerLevel=24,counts={l:counts[l] for l in ['Beginner','A','B','C','C*','D']},selected=selected,decisions=decisions)
 (mod.BASE/'curated-selection.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
 data={r['fen']:{k:r[k] for k in ['id','level','aspect','solution']} for r in selected}
 (mod.ROOT/'src/lib/chess/draw-selection.ts').write_text('// Generated by scripts/curate-draw-collection.py. Only explicitly reviewed positions are published.\nexport const drawSelection: Record<string, { id: string; level: "Beginner" | "A" | "B" | "C" | "C*" | "D"; aspect: string; solution: string }> = '+json.dumps(data,ensure_ascii=False,indent=2)+';\n')
 print(result['counts'])
if __name__=='__main__':main()
