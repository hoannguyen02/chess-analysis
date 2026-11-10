"""Independent legal/provenance/coverage checks for the 112 curated additions."""
import json,pathlib,collections,io,chess,chess.pgn
P=pathlib.Path(__file__).resolve().parent/'fixtures/draw-practice'
load=lambda f:json.loads((P/f).read_text())
masters=load('selected-additions.json')['records'];intro=load('intro-additions.json')['records'];published=load('published-additions.json');original=load('curated-selection.json')['selected']
final={r['id']:r for r in load('addition-final-review.json')['records']}
screens={r['id']:r for f in ['master-review.json','study-review.json','deep-review.json','lower-review.json'] for r in load(f)['records']}
excluded={r['id'] for r in load('editorial-exclusions.json')['records']}
assert len(masters)==109 and len(intro)==16
assert not excluded & {r['id'] for r in masters}
assert len({r['gameId'] for r in masters})==109
assert collections.Counter(r['level'] for r in original+masters+intro)=={'Beginner':24,'A':24,'B':28,'C':29,'C*':25,'D':27}
assert {r['id'] for r in published['records']}=={r['id'] for r in masters+intro}
assert len({r['aspect'] for r in original+masters+intro})==157
positions=set()
for r in original+masters+intro:
 k=' '.join(r['fen'].split()[:4]);assert k not in positions;positions.add(k)
for r in masters+intro:
 b=chess.Board(r['fen']);assert b.is_valid() and not b.is_game_over()
 if 'previousMove' in r:
  prev=chess.Board(r['previousMove']['fen']);prev.push_san(r['previousMove']['move']);assert prev.fen(en_passant='fen')==r['fen']
 roots=r['roots'] if r in intro else screens[r['id']]['roots']
 assert {v['move'] for v in roots}=={b.san(m) for m in b.legal_moves}
 for m in list(b.legal_moves):b.push(m);assert not b.is_checkmate();b.pop()
 if r in intro:
  assert len(b.piece_map())<=5
  assert all(v['wdl']<=0 and not v['immediateMate'] for v in roots)
  assert next(v for v in roots if v['move']==r['moves'][0])['wdl']==0
  assert all(x['wdl']==0 for x in r['positions'])
 else:
  a=final[r['id']];assert a['status']=='reviewed'
  assert screens[r['id']]['fen']==r['fen']
  assert not any(v['immediateMate'] or v['mate'] is not None and v['mate']>0 or v['cp'] is not None and v['cp']>110 for v in roots)
  for row in a['positions']:
   t=chess.Board(row['fen']);t.push_san(row['move']);assert row['mate'] is None and abs(row['cp'])<=100
   for move in row['reply']:t.push_san(move)
  if r.get('sourceKind')!='study':
   game=chess.pgn.read_game(io.StringIO(r['pgn']));assert not game.errors and game.headers['Result']=='1/2-1/2'
   t=game.board();line=[];all_moves=list(game.mainline_moves())
   for move in all_moves[:r['startPly']]:t.push(move)
   assert t.fen(en_passant='fen')==r['fen']
   for move in all_moves[r['startPly']:]:line.append(t.san(move));t.push(move)
   assert r['moves'][:r['actualGamePlies']]==line[:r['actualGamePlies']]
   assert len(r['archiveSha256'])==64 and r['sourceUrl'].startswith('https://www.pgnmentor.com/players/')
 if r['level']=='D':assert r['solverDecisions']>3 and r['sacrifices']
 if r['level']=='C*':assert not r['sacrifices'] and r['solverDecisions']==6
 for i,s in enumerate(r['moves']):
  if r in intro:assert r['positions'][i]['fen']==b.fen(en_passant='fen')
  b.push_san(s)
 if r['category']=='stalemate':assert b.is_stalemate()
 elif r['category']=='insufficient-material':assert b.is_insufficient_material()
 elif r['category']=='perpetual-check':assert b.is_repetition(3)
# Coverage assertions protect distinctive decisions when regenerating.
assert any('En passant' in r['aspect'] and chess.Board(r['fen']).has_legal_en_passant() for r in intro)
assert any('=N' in r['moves'][0] for r in intro)
assert any('en-passant' in r['aspect'] and r['level']=='C*' for r in masters)
assert any('a8=Q'==r['moves'][0] and r['level']=='D' for r in masters)
assert collections.Counter(r['level'] for r in masters if r.get('sourceKind')=='study')=={'C':5,'D':3}
print('157 unique positions; draw-level counts: Beginner 24, A 24, B 28, C 29, C* 25, D 27; 125 additions validated for legal roots, complete lines, provenance, defensive evidence and coverage.')
