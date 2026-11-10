"""Independently replay saved strategy certificates and publication decisions."""
import collections, importlib.util, json, pathlib
import chess
P=pathlib.Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('review',P/'review-draw-collection.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
manifest=json.loads((mod.BASE/'curated-selection.json').read_text())
proofs={r['id']:r for r in json.loads((mod.BASE/'resource-proofs.json').read_text())['records']}
rows={r['id']:r for r in mod.sources()}
evidence={r['id']:r for r in json.loads((mod.BASE/'collection-review.json').read_text())['records']}
assert len(evidence)==len(rows)==len(manifest['decisions'])==706
nodes=0

def verify(b,tree,side,path):
 global nodes
 nodes+=1
 key=' '.join(b.fen().split()[:4])
 assert not b.is_checkmate()
 if 'terminal' in tree:
  assert b.is_stalemate() if tree['terminal']=='stalemate' else b.is_insufficient_material()
 elif 'cycle' in tree:
  assert 0<=tree['cycle']<len(path)
  assert path[tree['cycle']]==key
 elif b.turn==side:
  assert set(tree)=={'move','next'}
  b.push_san(tree['move']);verify(b,tree['next'],side,path+[key]);b.pop()
 else:
  assert set(tree)=={'replies'}
  assert set(tree['replies'])=={b.san(m) for m in b.legal_moves}
  for san,child in tree['replies'].items():
   b.push_san(san);verify(b,child,side,path+[key]);b.pop()

for r in manifest['selected']:
 source=rows[r['id']];a=evidence[r['id']];b=chess.Board(r['fen'])
 assert r['fen']==source['fen']==a['fen']
 assert source['moves']==a['moves']
 assert {v['move'] for v in a['startingMoves']}=={b.san(m) for m in b.legal_moves}
 assert not any(v['immediateMate'] for v in a['startingMoves'])
 if r['category'] in ['stalemate','perpetual-check']:
  p=proofs[r['id']];assert p['status']=='proved'
  assert p['tree']['move']==source['moves'][0]
  verify(b,p['tree'],b.turn,[])
 elif r['category']=='repetition':
  for san in source['moves']:
   move=b.parse_san(san)
   assert not b.gives_check(move)
   b.push(move)
  assert b.is_repetition(3)
 elif r['category']=='fortress':
  for i,san in enumerate(source['moves']):
   assert source['validation']['positions'][i]=={'fen':b.fen(en_passant='fen'),'wdl':0}
   b.push_san(san)
  assert source['validation']['positions'][-1]=={'fen':b.fen(en_passant='fen'),'wdl':0}
 else:
  assert r['category']=='insufficient-material'
  for san in source['moves']:b.push_san(san)
  assert b.is_insufficient_material()
 if r['level']=='Beginner':assert len(chess.Board(r['fen']).piece_map())<=4
assert len({r['aspect'] for r in manifest['selected']})==len(manifest['selected'])
assert len(manifest['selected'])==32
print('706 records reviewed; 32 publication decisions validated;',nodes,'strategy nodes replayed with every legal defensive reply; non-check repetition validated by legal replay.')
