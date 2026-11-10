import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import chess

from tactic_research import ROOT, digest
from research_index import connect
from research_candidates import import_candidates, query_candidates, bootstrap_candidates
from research_collection import index_positions, collect_parallel, detector_version, line_options, miner

BATCH_B = json.loads((ROOT/'scripts/fixtures/discovery/level-b-expansion-20261105b.json').read_text())
BATCH_C = json.loads((ROOT/'scripts/fixtures/discovery/level-c-expansion-20261105.json').read_text())
B = next(r for r in BATCH_B['records'] if r['gameId'] == '51b6258a7c5e5a7b')
C = next(r for r in BATCH_C['records'] if r['gameId'] == '765f315a6674451f')


class CandidateBank(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.path = Path(self.directory.name)
        self.db = connect(self.path/'index.sqlite')

    def tearDown(self):
        self.db.close()
        self.directory.cleanup()

    def test_full_record_lookup_respects_fresh_decisions_without_game_replay(self):
        import_candidates(self.db, [B, C])
        first = query_candidates(self.db, 'discovery', ['B','C'], limit=2)
        self.assertEqual(first['records'], [B, C])
        self.assertEqual(first['metrics']['sourceGamesReplayed'], 0)
        self.assertFalse(first['publicationApproved'])
        position = ' '.join(B['fen'].split()[:4])
        from research_index import index
        with self.db:
            self.db.execute('INSERT INTO research_decisions VALUES (?,?,?,?,?,?,?)',
                            ('discovery', index.pkey(B['fen'])[0], 'B', B['gameId'], 'removed', 'Owner removed', 'owner-hash'))
        second = query_candidates(self.db, 'discovery', ['B','C'])
        self.assertEqual(second['records'], [C])
        self.assertEqual(query_candidates(self.db, 'discovery', ['B'], recheck=True)['records'], [])

    def test_changed_saved_provenance_or_objective_replaces_higher_screen_stage(self):
        import_candidates(self.db, [B], stage='screened')
        changed = {**B, 'headers': {**B['headers'], 'Event': 'Updated source header'}}
        import_candidates(self.db, [changed], stage='saved')
        result = query_candidates(self.db, 'discovery', ['B'])
        self.assertEqual(result['records'], [changed])
        self.assertEqual(result['candidateStages'], ['saved'])
        changed = {**changed, 'goal': 'mate'}
        import_candidates(self.db, [changed], stage='saved')
        self.assertEqual(query_candidates(self.db, 'discovery', ['B'])['records'], [changed])

    def test_bootstrap_is_file_content_bound_and_keeps_unselected_leads(self):
        path = self.path/'leads.json'
        path.write_text(json.dumps({'records':[B,C]}))
        self.assertEqual(bootstrap_candidates(self.db,[path])['imported'], 2)
        second = bootstrap_candidates(self.db,[path])
        self.assertEqual(second['imported'], 0)
        self.assertEqual(second['unchangedFiles'], 1)
        self.assertEqual(len(query_candidates(self.db,'discovery',['C'])['records']), 1)

    def test_withheld_reason_is_retained_but_not_default_shortlist(self):
        import_candidates(self.db,[B], flags={B['gameId']:['unresolved-defence']})
        self.assertFalse(query_candidates(self.db,'discovery',['B'])['records'])
        result=query_candidates(self.db,'discovery',['B'],include_withheld=True)
        self.assertEqual(result['flags'], [['unresolved-defence']])

    def test_limited_geometry_query_is_lazy_and_still_applies_owner_filters(self):
        batch=json.loads((ROOT/'scripts/fixtures/discovery/level-b-expansion-20261105.json').read_text())['records']
        import_candidates(self.db,batch,stage='geometry')
        first=query_candidates(self.db,'discovery',['B'],limit=1,include_geometry=True)
        self.assertEqual(len(first['records']),1)
        self.assertEqual(first['metrics']['rowsExamined'],1)
        ident=first['records'][0]['gameId']
        second=query_candidates(self.db,'discovery',['B'],limit=1,include_geometry=True,exclude_game_ids=[ident])
        self.assertEqual(len(second['records']),1)
        self.assertNotEqual(second['records'][0]['gameId'],ident)
        self.assertEqual(second['metrics']['rowsExamined'],2)

    def test_no_bank_rescreens_and_excludes_already_selected_games(self):
        import_candidates(self.db,[B,C])
        cache=self.path/'no-bank.sqlite'
        first=collect_parallel(self.db,levels=['B'],target=1,use_bank=False,cache=cache,workers=2)
        self.assertEqual(first['bankHits'],0)
        self.assertGreater(first['engineStats']['engineCalls'],0)
        self.assertTrue(first['requestedLeadTargetMet'])
        warm=collect_parallel(self.db,levels=['B'],target=1,use_bank=False,cache=cache,workers=2)
        self.assertEqual(warm['bankHits'],0)
        self.assertGreater(warm['screenCacheHits'],0)
        excluded=collect_parallel(self.db,levels=['B','C'],target=1,cache=cache,workers=2,
                                  exclude_game_ids=[B['gameId']])
        self.assertEqual([r['gameId'] for r in excluded['records']],[C['gameId']])
        self.assertEqual(excluded['sourceGamesReplayed'],0)
        self.assertFalse(excluded['requestedLeadTargetMet'])
        self.assertFalse(excluded['corpusScreenComplete'])

    def test_geometry_serial_parallel_equivalence_negative_checkpoint_and_resume(self):
        empty = {'gameFen':chess.STARTING_FEN,'gameMoves':[],
                 'gameId': __import__('hashlib').sha256(b'').hexdigest()[:16],
                 'headers':{'Result':'1/2-1/2'},'source':'https://example.test/test-only',
                 'sourceReferences':[{'url':'https://example.test/test-only','sha256':'0'*64,'retrieved':'2026-11-05'}]}
        records = [B,C,empty]
        first = index_positions(self.db,records,workers=1,max_games=1)
        self.assertFalse(first['complete'])
        second = index_positions(self.db,records,workers=2)
        self.assertTrue(second['complete'])
        self.assertEqual(second['sourceGamesReplayed'],2)
        self.assertEqual(second['indexHits'],1)
        warm = index_positions(self.db,records,workers=2)
        self.assertEqual(warm['sourceGamesReplayed'],0)
        self.assertEqual(warm['indexHits'],3)
        self.assertEqual(self.db.execute('SELECT count(*) FROM research_geometry_games').fetchone()[0],3)
        other=connect(self.path/'parallel.sqlite')
        try:
            index_positions(other,records,workers=2)
            query='SELECT candidate_id,level,record FROM research_candidate_positions ORDER BY candidate_id'
            self.assertEqual(self.db.execute(query).fetchall(),other.execute(query).fetchall())
        finally: other.close()
        # Owner and level changes leave the geometry checkpoint valid.
        self.assertEqual(index_positions(self.db,records,workers=1)['sourceGamesReplayed'],0)
        with patch('research_collection.detector_version',return_value='changed-detector'):
            self.assertEqual(index_positions(self.db,[empty],workers=1)['sourceGamesReplayed'],1)

    def test_parallel_screen_matches_serial_and_repeat_uses_bank_without_replay(self):
        outputs=[]
        for workers in (1,2):
            db=connect(self.path/f'screen-{workers}.sqlite')
            try:
                import_candidates(db,[B,C],stage='geometry')
                report=collect_parallel(db,levels=['B','C'],targets={'B':1,'C':1},
                                        cache=self.path/f'engine-{workers}.sqlite',workers=workers)
                self.assertTrue(report['requestedLeadTargetMet'])
                self.assertFalse(report['publicationApproved'])
                self.assertGreater(report['engineStats']['engineCalls'],0)
                outputs.append([(r['gameId'],r['fen'],r['level'],r['moves']) for r in report['records']])
                repeat=collect_parallel(db,levels=['B','C'],targets={'B':1,'C':1},
                                        cache=self.path/f'engine-{workers}.sqlite',workers=workers)
                self.assertEqual(repeat['bankHits'],2)
                self.assertEqual(repeat['engineStats']['engineCalls'],0)
                self.assertEqual(repeat['sourceGamesReplayed'],0)
            finally: db.close()
        self.assertEqual(outputs[0],outputs[1])

    def test_warm_metadata_refresh_invalidates_provenance_without_replaying_game(self):
        index_positions(self.db,[B],workers=1)
        changed={**B,'headers':{**B['headers'],'Event':'Corrected source event'},
                 'sourceReferences':[], 'masterCredential':None}
        with patch('research_collection._geometry_task',side_effect=AssertionError('Unexpected replay')):
            warm=index_positions(self.db,[changed],workers=1)
        self.assertEqual(warm['sourceGamesReplayed'],0)
        self.assertFalse(query_candidates(self.db,'discovery',['A','B','C','C*','D'],include_geometry=True)['records'])
        restored={**changed,'sourceReferences':B['sourceReferences']}
        index_positions(self.db,[restored],workers=1)
        rows=query_candidates(self.db,'discovery',['A','B','C','C*','D'],include_geometry=True)['records']
        self.assertTrue(rows)
        self.assertTrue(all(r['headers']['Event']=='Corrected source event' and r['masterCredential'] is None for r in rows))

    def test_corrected_variant_retries_and_superseded_detector_rows_are_not_served(self):
        invalid={**B,'headers':{**B['headers'],'Variant':'Unsupported-test-variant'}}
        first=index_positions(self.db,[invalid],workers=1)
        self.assertEqual(len(first['invalidSources']),1)
        corrected=index_positions(self.db,[B],workers=1)
        self.assertEqual(corrected['sourceGamesReplayed'],1)
        self.assertTrue(query_candidates(self.db,'discovery',['B'],include_geometry=True)['records'])
        with patch('research_collection.detector_version',return_value='new-detector-generation'):
            self.assertFalse(query_candidates(self.db,'discovery',['B'],include_geometry=True)['records'])
        self.assertEqual(index_positions(self.db,[B],workers=1)['sourceGamesReplayed'],0)

    def test_result_correction_refreshes_tail_side_but_preserves_saved_leads(self):
        index_positions(self.db,[B],workers=1)
        import_candidates(self.db,[B])
        changed={**B,'headers':{**B['headers'],'Result':'1/2-1/2'}}
        report=index_positions(self.db,[changed],workers=1)
        self.assertEqual(report['sourceGamesReplayed'],1)
        self.assertFalse(query_candidates(self.db,'discovery',['B'],phase='tails',include_geometry=True)['records'])
        self.assertTrue(query_candidates(self.db,'discovery',['B'])['records'])

    def test_index_classifier_keeps_legacy_lead_semantics(self):
        records=json.loads((ROOT/'scripts/fixtures/discovery/published.json').read_text())['records']
        for record in records:
            board=chess.Board(record['fen'])
            pv=[chess.Move.from_uci(uci) for uci in record['validation']['principalVariation']]
            with self.subTest(game=record['gameId']):
                self.assertEqual(next(line_options(board,pv),None),miner.inspect(board,pv))


class ForkGeometryCache(unittest.TestCase):
    def test_complete_game_geometry_reuses_positive_and_negative_results(self):
        from tactic_research import module
        collector = module('collect-forks')
        original = json.loads((ROOT/'scripts/fixtures/fork/published.json').read_text())['records'][0]
        record = {key: original[key] for key in ('gameId','gameFen','gameMoves','headers','source')}
        record['forkPlies'] = [original['ply']]
        with tempfile.TemporaryDirectory() as directory:
            task = (record, str(Path(directory)/'cache.sqlite'), 'fixed-geometry-test')
            first, reused = collector.scan_indexed_game(task)
            self.assertFalse(reused)
            self.assertTrue(first)
            # A warm lookup must return the exact leads without replaying a game.
            with patch.object(collector.chess, 'Board', side_effect=AssertionError('unexpected replay')):
                second, reused = collector.scan_indexed_game(task)
            self.assertTrue(reused)
            self.assertEqual(first, second)
            negative = dict(record, forkPlies=[1])
            empty, reused = collector.scan_indexed_game((negative, task[1], task[2]))
            self.assertEqual(empty, [])
            self.assertFalse(reused)
            self.assertEqual(collector.scan_indexed_game((negative, task[1], task[2])), ([], True))

    def test_candidate_frames_can_retry_without_publishing_two_from_one_game(self):
        with tempfile.TemporaryDirectory() as directory:
            db=connect(Path(directory)/'index.sqlite')
            # Only store behavior is under test; the second legal frame uses
            # a shared synthetic game identity, never publication approval.
            another=dict(C, gameId=B['gameId'], level='B')
            import_candidates(db,[B,another])
            self.assertEqual(len(query_candidates(db,'discovery',['B'])['records']),1)
            full=query_candidates(db,'discovery',['B'],distinct_games=False)
            self.assertEqual(len(full['records']),2)
            self.assertEqual(full['metrics']['sourceGamesReplayed'],0)
            with db:
                db.execute('INSERT INTO research_decisions VALUES (?,?,?,?,?,?,?)',
                    ('discovery','', '*', B['gameId'],'removed','owner removal','fixed'))
            self.assertEqual(query_candidates(db,'discovery',['B'],distinct_games=False)['records'],[])
            db.close()


if __name__=='__main__':
    unittest.main()
