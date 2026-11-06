#!/usr/bin/env python3
import copy,csv,hashlib,importlib.util,json,re,sqlite3,subprocess,sys,unittest,tempfile,zipfile
from pathlib import Path
import chess
from tactics_catalog import PRACTICE_LEVELS, load_catalog, resolve_theme_id, validate_catalog
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('tactics_index',ROOT/'scripts/tactics-index.py')
index=importlib.util.module_from_spec(spec);spec.loader.exec_module(index)

class TacticsIndex(unittest.TestCase):
 def test_level_suitability_is_optional_and_independent_of_parent_and_priority(self):
  catalog=load_catalog();themes={t['id']:t for t in catalog['themes']}
  self.assertEqual(PRACTICE_LEVELS,('Beginner','A','B','C','C*','D'))
  self.assertEqual(themes['exchangeSacrifice']['priority'],1)
  self.assertEqual(themes['exchangeSacrifice']['levels'],['C','D'])
  self.assertEqual(themes['doubleThreatCreation']['priority'],3)
  self.assertIn('Beginner',themes['doubleThreatCreation']['levels'])
  # No implicit inheritance or restriction of a child's own planning assessment.
  themes['doubleThreatCreation']['levels']=['D']
  themes['fork']['levels']=['Beginner','A']
  validate_catalog(catalog)
  for theme in catalog['themes']:theme.pop('levels',None)
  self.assertTrue(all('levels' not in t for t in validate_catalog(catalog)['themes']))

 def test_level_arrays_reject_unknown_values_duplicates_empty_arrays_and_wrong_order(self):
  original=load_catalog()
  for levels in [None,[],{},'A',['beginner'],['B*'],['C**'],['E'],[1],
                 ['A','A'],['B','Beginner'],['D','C*'],['Beginner','A',None]]:
   data=copy.deepcopy(original);data['themes'][0]['levels']=levels
   with self.subTest(levels=levels):
    with self.assertRaisesRegex(ValueError,'levels'):validate_catalog(data)

 def test_every_initial_level_assessment_has_a_matching_durable_rationale(self):
  catalog=load_catalog();rows={}
  for line in (ROOT/'docs/tactics-level-suitability.md').read_text().splitlines():
   match=re.fullmatch(r'\| `([A-Za-z0-9]+)` \| (.+) \| (.+) \|',line)
   if match:
    identifier,levels,reason=match.groups()
    self.assertNotIn(identifier,rows)
    self.assertTrue(reason.strip())
    rows[identifier]=levels.split(', ')
  self.assertEqual(rows,{t['id']:t['levels'] for t in catalog['themes']})

 def test_sacrifice_themes_and_short_mate_objectives_keep_their_level_boundaries(self):
  themes={t['id']:t for t in load_catalog()['themes']}
  for identifier in ['sacrifice','exchangeSacrifice','exchangeSacrificeC3C6','greekGift','positionalSacrifice']:
   self.assertEqual(themes[identifier]['levels'],['C','D'])
  self.assertEqual(themes['laskerDoubleBishopSacrifice']['levels'],['D'])
  self.assertEqual(themes['mateIn1']['levels'],['Beginner','A'])
  for identifier in ['mateIn2','mateIn3']:self.assertNotIn('D',themes[identifier]['levels'])
  self.assertEqual(themes['longForcingCombination']['levels'],['C','C*','D'])

 def test_catalog_covers_all_three_priorities_without_duplicate_alias_entries(self):
  catalog=load_catalog();themes={t['id']:t for t in catalog['themes']}
  expected={
   1:'intermezzoCheck desperado counterattack countercheck blocking unpinning tacticalBreakthrough pawnBreakthrough matingNet kingHunt exchangeSacrifice windmill perpetualAttack domination'.split(),
   2:'removingEscapeSquare pawnShieldDestruction openingLines vacatingSquare tacticalRetreat tacticalProphylaxis intermezzoCapture tacticalLiquidation promotionThreat stalemateTrap perpetualCheckTrap'.split(),
   3:'greekGift laskerDoubleBishopSacrifice rookLiftAttack exchangeSacrificeC3C6 queenDomination positionalSacrifice doubleThreatCreation defensiveCombination fortressBreakthrough longForcingCombination'.split(),
  }
  self.assertEqual(len(themes),110)
  for priority,identifiers in expected.items():
   self.assertEqual({t['id'] for t in themes.values() if t.get('priority')==priority},set(identifiers))
   for identifier in identifiers:
    theme=themes[identifier]
    self.assertEqual(theme['status'],'not-built')
    for key in ('dedicatedPage','detector','lichessTheme'):self.assertIsNone(theme[key])
  for alias,canonical in [('crossCheck','countercheck'),('closingLines','blocking'),('zwischenzugCheck','intermezzoCheck'),('zwischenzugCapture','intermezzoCapture')]:
   self.assertNotIn(alias,themes)
   self.assertEqual(resolve_theme_id(catalog,alias),canonical)
  with self.assertRaises(ValueError):resolve_theme_id(catalog,'missingTheme')
  for child,parent in [('countercheck','counterattack'),('windmill','discoveredCheck'),('intermezzoCheck','intermezzo'),('intermezzoCapture','intermezzo'),('vacatingSquare','clearance'),('fork','doubleThreatCreation'),('trappedPiece','domination'),('queenDomination','domination'),('exchangeSacrificeC3C6','exchangeSacrifice'),('stalemateTrap','stalemate'),('perpetualCheckTrap','perpetualCheck')]:
   self.assertEqual(themes[child]['parentId'],parent)
  self.assertIsNone(themes['stalemate']['lichessTheme'])
  self.assertEqual(themes['collinearMove']['lichessTheme'],'collinearMove')

 def test_catalog_rejects_broken_graph_schema_aliases_and_external_mappings(self):
  original=load_catalog()
  def change(identifier,**fields):
   data=copy.deepcopy(original)
   next(t for t in data['themes'] if t['id']==identifier).update(fields)
   return data
  bad=[change('windmill',parentId='missing'),change('doubleThreatCreation',parentId='missing'),
       change('discoveredAttack',parentId='windmill'),
       change('countercheck',aliases=['fork']),change('countercheck',aliases=['closingLines']),
       change('countercheck',aliases=['crossCheck','crossCheck']),change('countercheck',priority=4),
       change('countercheck',priority=True),change('windmill',relatedThemes=['missing']),
       change('windmill',relatedThemes=['windmill']),change('windmill',lichessTheme='windmill'),
       change('windmill',lichessTheme='discoveredCheck'),change('windmill',status='available'),
       change('windmill',kind='calculation'),change('windmill',unrecognizedField=True)]
  data=copy.deepcopy(original);del data['themes'][0]['label'];bad.append(data)
  data=copy.deepcopy(original);data['themes'].append(copy.deepcopy(data['themes'][0]));bad.append(data)
  for data in bad:
   with self.subTest(theme=data['themes'][-1]['id']):
    with self.assertRaises(ValueError):validate_catalog(data)

 def test_alias_query_uses_only_the_canonical_theme(self):
  with tempfile.TemporaryDirectory() as tmp:
   path=Path(tmp)/'index.sqlite';con=sqlite3.connect(path);index.initialize(con)
   con.execute("INSERT INTO games VALUES ('game','fen','[]','{}',600,0,'600+0','{}',1,'test')")
   con.execute("INSERT INTO positions VALUES ('position','position')")
   con.execute("INSERT INTO occurrences(id,game_key,position_key,ply,fen,played_move,played_uci) VALUES (1,'game','position',1,'fen','e4','e2e4')")
   con.execute("INSERT INTO matches(occurrence_id,theme,status,origin) VALUES (1,'countercheck','lead','test')")
   con.commit();con.close()
   result=subprocess.run([sys.executable,str(ROOT/'scripts/tactics-index.py'),'--db',str(path),'query','--theme','crossCheck'],check=True,capture_output=True,text=True)
   rows=json.loads(result.stdout);self.assertEqual(len(rows),1)
   self.assertEqual([tag['theme'] for tag in rows[0]['tags']],['countercheck'])

 def test_lichess_broad_tags_do_not_manufacture_custom_children(self):
  con=sqlite3.connect(':memory:');index.initialize(con)
  with tempfile.TemporaryDirectory() as tmp:
   path=Path(tmp)/'puzzles.csv'
   with path.open('w',newline='') as stream:
    writer=csv.DictWriter(stream,fieldnames=['PuzzleId','FEN','Moves','Themes','GameUrl']);writer.writeheader()
    writer.writerow({'PuzzleId':'theme-scope','FEN':chess.Board().fen(),'Moves':'e2e4 e7e5',
                     'Themes':'intermezzo intermezzoCheck crossCheck countercheck stalemate master',
                     'GameUrl':'https://lichess.org/ab12CD34#1'})
   result=index.import_lichess_puzzles(con,path,True);self.assertEqual(result['acceptedRows'],1)
   self.assertEqual(json.loads(con.execute('SELECT themes FROM puzzle_leads').fetchone()[0]),['intermezzo'])
  con.close()

 def test_map_has_unique_ids_and_real_pages(self):
  data=json.loads(index.MAP.read_text())['themes'];self.assertEqual(len(data),len({x['id'] for x in data}))
  for theme in data:
   if theme['dedicatedPage']:
    self.assertTrue((ROOT/('src/pages'+theme['dedicatedPage']+'.tsx')).is_file(),theme['id'])
 def test_time_controls_and_priority_are_not_guessed(self):
  for raw,expected in [('600+0',(600,0)),('600+5',(600,5)),('900+10',(900,10)),('40/5400:1800+30',(5400,30)),('Standard: 90 minutes with 30 second increment from move 1',(5400,30)),('Standard: 90 minutes',(5400,None)),('300+5',(300,5)),('',None),('?',None)]:self.assertEqual(index.parse_time_control(raw),expected)
  self.assertTrue(index.priority({'WhiteTitle':'GM','TimeControl':'600+5'})[2])
  self.assertFalse(index.priority({'WhiteTitle':'GM','TimeControl':'300+5'})[2])
  self.assertFalse(index.priority({'WhiteElo':'2700','TimeControl':'600+0'})[2])
  self.assertFalse(index.priority({'WhiteTitle':'GM'})[2])
 def test_geometry_tags_are_leads(self):
  cases=[('8/K7/8/8/4k3/3b4/1R2B3/1r6 w - - 0 1','Bxd3+','capturingDefender'),
         ('8/8/1q3k2/8/8/2N5/8/4K3 w - - 0 1','Nd5+','fork'),
         ('4k3/8/2n5/8/8/8/8/4KB2 w - - 0 1','Bb5','pin'),
         ('4q3/4k3/8/8/8/8/8/R6K w - - 0 1','Re1+','skewer'),
         ('q6k/8/8/8/8/8/N7/R5K1 w - - 0 1','Nb4','discoveredAttack')]
  for fen,san,tag in cases:
   with self.subTest(tag=tag):
    b=chess.Board(fen);m=b.parse_san(san);after=b.copy();after.push(m)
    self.assertIn(tag,index.detectors(b,m,after))
 def test_deduplicates_sources_and_preserves_status(self):
  data=json.loads((ROOT/'scripts/fixtures/removing-defender/approved.json').read_text())
  r=next(r for r in data['records'] if r.get('gameSource'))
  source=r['gameSource'];board=chess.Board(source['fen']);uci=[]
  for san in source['lines'][0]:move=board.parse_san(san);uci.append(move.uci());board.push(move)
  key=hashlib.sha256((source['fen']+' '+' '.join(uci)).encode()).hexdigest()
  record={'headers':{**source['headers'],'WhiteTitle':'GM','TimeControl':'600+5'},
          'gameFen':source['fen'],'gameMoves':source['lines'][0],'gameKey':key}
  con=sqlite3.connect(':memory:');index.initialize(con)
  a={'source':'https://one.example/a.zip','sha256':'a'*64,'retrieved':'2026-11-03'}
  b={'source':'https://two.example/a.zip','sha256':'b'*64,'retrieved':'2026-11-03'}
  index.import_game(con,record,a);index.import_game(con,record,b)
  self.assertEqual(con.execute('SELECT count(*) FROM games').fetchone()[0],1)
  self.assertEqual(con.execute('SELECT count(*) FROM sources').fetchone()[0],2)
  rows=index.query(con,'capturingDefender',500,True);self.assertTrue(rows)
  occ=con.execute("SELECT occurrence_id FROM matches WHERE theme='capturingDefender' LIMIT 1").fetchone()[0]
  con.execute("UPDATE matches SET status='rejected',reason='reviewed' WHERE occurrence_id=? AND theme='capturingDefender'",(occ,))
  index.import_game(con,record,a)
  self.assertEqual(con.execute("SELECT status FROM matches WHERE occurrence_id=? AND theme='capturingDefender'",(occ,)).fetchone()[0],'rejected')
  self.assertTrue(all(r['preferred'] for r in rows))
  con.close()

 def test_durable_exclusion_overrides_stale_approval_for_game(self):
  con=sqlite3.connect(':memory:');index.initialize(con)
  con.execute("INSERT INTO games VALUES ('abc123','fen','[]','{}',600,0,'600+0','{}',1,'test')")
  con.execute("INSERT INTO positions VALUES ('position','position')")
  con.execute("INSERT INTO occurrences(id,game_key,position_key,ply,fen,played_move,played_uci) VALUES (1,'abc123','position',1,'fen','e4','e2e4')")
  con.execute("INSERT INTO matches(occurrence_id,theme,status,origin) VALUES (1,'capturingDefender','approved','test')")
  with tempfile.TemporaryDirectory() as tmp:
   root=Path(tmp);folder=root/'scripts/fixtures/removing-defender';folder.mkdir(parents=True)
   (folder/'excluded.json').write_text(json.dumps({'records':[{'gameId':'abc','reason':'editorial exclusion'}]}))
   previous=index.ROOT;index.ROOT=root
   try:self.assertEqual(index.sync_excluded(con),1)
   finally:index.ROOT=previous
  self.assertEqual(con.execute('SELECT status,reason FROM matches').fetchone(),('rejected','editorial exclusion'))
  con.close()


 def test_archive_import_resumes_and_skips_short_controls(self):
  text='''[Event "slow"]
[Site "lichess.org"]
[Date "2026.01.01"]
[Round "1"]
[White "Master"]
[Black "Opponent"]
[Result "*"]
[WhiteTitle "FM"]
[TimeControl "600+5"]

1. e4 e5 2. Nf3 Nc6 *

[Event "fast"]
[Site "lichess.org"]
[Date "2026.01.01"]
[Round "2"]
[White "Master"]
[Black "Opponent"]
[Result "*"]
[WhiteTitle "FM"]
[TimeControl "300+0"]

1. d4 d5 2. c4 e6 *

[Event "slow-two"]
[Site "lichess.org"]
[Date "2026.01.01"]
[Round "3"]
[White "Master"]
[Black "Opponent"]
[Result "*"]
[WhiteTitle "IM"]
[TimeControl "600+0"]

1. c4 e5 2. Nc3 Nf6 *
'''
  with tempfile.TemporaryDirectory() as tmp:
   path=Path(tmp)/'games.zip'
   with zipfile.ZipFile(path,'w') as z:z.writestr('games.pgn',text)
   con=sqlite3.connect(':memory:');index.initialize(con)
   first=index.import_archive(con,path,'https://example.com/games.zip','2026-11-03',True,1)
   self.assertFalse(first['complete']);self.assertEqual(first['imported'],1)
   second=index.import_archive(con,path,'https://example.com/games.zip','2026-11-03',True)
   self.assertTrue(second['complete']);self.assertEqual(second['scanned'],3);self.assertEqual(second['imported'],2)
   self.assertEqual(con.execute('SELECT count(*) FROM games').fetchone()[0],2)
   index.import_archive(con,path,'https://example.com/games.zip','2026-11-03',True)
   self.assertEqual(con.execute('SELECT count(*) FROM games').fetchone()[0],2)
   con.close()


 def test_sample_variation_keeps_actual_game_separate_and_exports_source(self):
  data=json.loads((ROOT/'scripts/fixtures/removing-defender/approved.json').read_text())
  entry=next(r for r in data['records'] if r.get('gameSource'))
  ex=entry['exercise'];src=entry['gameSource'];board=chess.Board(src['fen']);uci=[]
  for san in src['lines'][0]:
   move=board.parse_san(san);uci.append(move.uci());board.push(move)
  gamekey=hashlib.sha256((src['fen']+' '+' '.join(uci)).encode()).hexdigest()
  candidate={'candidateId':'test-lead','headers':src['headers'],'gameFen':src['fen'],
             'gameMoves':src['lines'][0],'gameKey':gamekey,'fen':ex['fen'],
             'ply':ex['gameReference']['ply'],'moves':ex['moves'],
             'source':'https://example.com/issue.zip','archiveSha256':'c'*64,'retrieved':'2026-11-03'}
  con=sqlite3.connect(':memory:');index.initialize(con)
  with tempfile.TemporaryDirectory() as tmp:
   source=Path(tmp)/'candidates.json';source.write_text(json.dumps({'settings':{'nodes':123},'complete':False,'records':[candidate]}))
   result=index.import_candidates(con,source);self.assertEqual(result['imported'],1)
   row=con.execute("SELECT o.played_move,a.moves FROM analysis_leads a JOIN occurrences o ON o.id=a.occurrence_id WHERE a.theme='capturingDefender'").fetchone()
   self.assertEqual(row[0],src['lines'][0][candidate['ply']]);self.assertEqual(json.loads(row[1]),ex['moves'])
   out=Path(tmp)/'leads.json';self.assertGreater(index.export_leads(con,'capturingDefender',out,500),0)
   exported=json.loads(out.read_text());self.assertTrue(any(r['archiveSha256']=='c'*64 for r in exported['records']))
  con.close()


 def test_lichess_lead_requires_original_game_and_applies_first_move(self):
  game=chess.Board();sans=['e4','e5','Nf3','Nc6'];uci=[];pre=None
  for i,san in enumerate(sans):
   if i==1:pre=game.fen()
   move=game.parse_san(san);uci.append(move.uci());game.push(move)
  start=chess.Board().fen();key=hashlib.sha256((start+' '+' '.join(uci)).encode()).hexdigest()
  record={'gameKey':key,'gameFen':start,'gameMoves':sans,'headers':{'Site':'https://lichess.org/ab12CD34','WhiteTitle':'GM','TimeControl':'600+5'}}
  con=sqlite3.connect(':memory:');index.initialize(con)
  with tempfile.TemporaryDirectory() as tmp:
   path=Path(tmp)/'puzzles.csv'
   with path.open('w',newline='') as stream:
    writer=csv.DictWriter(stream,fieldnames=['PuzzleId','FEN','Moves','Themes','GameUrl']);writer.writeheader()
    writer.writerow({'PuzzleId':'test1','FEN':pre,'Moves':'e7e5 f1c4','Themes':'fork master','GameUrl':'https://lichess.org/ab12CD34#2'})
    writer.writerow({'PuzzleId':'badanchor','FEN':pre,'Moves':'e7e5 f1c4','Themes':'fork master','GameUrl':'https://lichess.org/ab12CD34#3'})
   first=index.import_lichess_puzzles(con,path,True,1)
   self.assertFalse(first['complete']);self.assertEqual(first['acceptedRows'],1)
   second=index.import_lichess_puzzles(con,path,True,1)
   self.assertEqual(second['acceptedRows'],1)
   self.assertTrue(index.import_lichess_puzzles(con,path,True)['complete'])
   self.assertEqual(index.resolve_lichess_puzzles(con)['resolved'],0)
   index.import_game(con,record,{'source':'https://lichess.org/ab12CD34','sha256':'d'*64,'retrieved':'2026-11-03'})
   result=index.resolve_lichess_puzzles(con);self.assertEqual(result['resolved'],1);self.assertEqual(result['unmatched'],1)
   row=con.execute("SELECT o.ply,o.played_move,a.moves FROM analysis_leads a JOIN occurrences o ON o.id=a.occurrence_id WHERE a.theme='fork'").fetchone()
   self.assertEqual(row[0],2);self.assertEqual(row[1],'Nf3');self.assertEqual(json.loads(row[2]),['Bc4'])
   self.assertEqual(con.execute("SELECT status FROM puzzle_leads WHERE puzzle_id='badanchor'").fetchone()[0],'unresolved')
  con.close()

if __name__=='__main__':unittest.main()
