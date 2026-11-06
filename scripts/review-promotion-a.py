"""Validate the durable editorial selection and rebuild its bundled proofs.

Rejected original positions remain in the review bundle, not in published A.
Run through split-promotion-pages.py to publish the reviewed selection.
"""
import importlib.util,json
from pathlib import Path
import chess
ROOT=Path(__file__).resolve().parents[1]
PATH=ROOT/'scripts/fixtures/promotion-split/material-a-editorial-review.json'
spec=importlib.util.spec_from_file_location('cert',ROOT/'scripts/build-promotion-a-expansion.py');cert=importlib.util.module_from_spec(spec);spec.loader.exec_module(cert)
def rebuild():
 data=json.loads(PATH.read_text());assert len(data['reviews'])==24
 assert all(r['status'] in ['retained','replaced','rejected'] and r['reason'] for r in data['reviews'])
 retained=[r['exercise']['fen'] for r in data['reviews'] if r['status']=='retained'];seen=set(retained)
 for r in data['replacements']:
  e=r['exercise'];b=chess.Board(e['fen']);assert b.is_valid() and e['fen'] not in seen;seen.add(e['fen'])
  assert e['difficulty']['level']=='A' and e['difficulty']['sacrificeCount']==0
  assert abs(cert.balance(b,b.turn))<=330
  assert {x['uci'] for x in r['roots']}=={m.uci() for m in b.legal_moves}
  for m in b.legal_moves:
   c=b.copy();c.push(m);assert not c.is_checkmate(),(e['id'],'immediate mate bypass')
   if b.is_capture(m) and not m.promotion:
    gains=[]
    for reply in c.legal_moves:
     d=c.copy();d.push(reply);gains.append(cert.balance(d,b.turn)-cert.balance(b,b.turn))
    assert gains and min(gains)<=0,(e['id'],'free capture bypass',m)
  for row in r['roots']:
   c=b.copy()
   for u in row['pv']:c.push_uci(u)
   assert not (len(row['uci'])==4 and row['mate'] is not None and 0<row['mate']<=2),(e['id'],'shorter mate needs review')
  r['certificate']=cert.certify(e)
  for line in [e['moves']]+r.get('alternativeLines',[]):
   c=b.copy()
   for san in line:c.push_san(san)
   assert cert.balance(c,b.turn)-cert.balance(b,b.turn)>=e['promotionGain']['minimumGain']
  g=r.get('sourceGame')
  if g:
   c=chess.Board(g['gameFen'])
   for ply,san in enumerate(g['gameMoves']):
    if ply==g['ply']:assert c.fen(en_passant='fen')==e['fen']
    c.push_san(san)
 data['actualCount']=len(seen);data['gap']=24-len(seen)
 PATH.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
 return data
if __name__=='__main__':
 d=rebuild();print('Reviewed A:',d['actualCount'],'gap:',d['gap'])
