import json
from pathlib import Path
import sqlite3
import tempfile
import unittest
from unittest.mock import patch

from tactic_research import ROOT, digest, code_version
from discovery_research import record_hash
from research_index import connect, sync_topic_decisions, index
from research_candidates import import_candidates, query_candidates, aspects
from research_memory import (assessment, backup, coverage, current_policy, explain,
                             position_line_key, remember_report, review_with_memory)
from research_workflow import SETTINGS, verification_code

B = json.loads((ROOT/'scripts/fixtures/discovery/level-b-expansion-20261105b.json').read_text())['records'][0]
C = json.loads((ROOT/'scripts/fixtures/discovery/level-c-expansion-20261105.json').read_text())['records'][0]


class ResearchMemoryTests(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.root = Path(directory.name)
        self.db = connect(self.root/'index.sqlite')
        self.addCleanup(self.db.close)
        self.context = current_policy('discovery')

    def report(self, record=B, flags=('material-before-discovery',), code=None):
        result = {'gameId': record['gameId'], 'status': 'withheld' if flags else 'needs-editorial-review',
                  'recordHash': record_hash(record), 'flags': list(flags), 'engineIdentity': self.context['engine'],
                  'preflight': {'initialMaterialCp': 0, 'cluster': 'test'}, 'timeline': {'timeline': []},
                  'work': {'engineCalls': 0, 'engineSeconds': 0, 'hits': 0, 'misses': 0}}
        return {'topic':'discovery', 'verificationCodeSha256': code or verification_code(),
                'quality': {'requiresProvenance':True}, 'settings': SETTINGS,
                'candidates':[record], 'results':[result]}

    def query(self, levels=('B',), **kwargs):
        return query_candidates(self.db, 'discovery', levels, **kwargs)

    def test_withholding_skips_only_the_exact_topic_level_record(self):
        other_level = {**B,'level':'C*'}
        import_candidates(self.db, [B, other_level])
        import_candidates(self.db, [B], topic='fork')
        remember_report(self.db,self.report(),'test')
        self.assertEqual(position_line_key(B),position_line_key(other_level))
        held = self.query()
        self.assertEqual(held['records'],[])
        self.assertEqual(held['metrics']['memorySkipped'],1)
        self.assertEqual(self.query(('C*',))['records'],[other_level])
        self.assertEqual(query_candidates(self.db,'fork',['B'])['records'],[B])
        changed = {**B,'headers':{**B['headers'],'Event':'Corrected provenance'}}
        import_candidates(self.db,[changed])
        self.assertEqual(self.query()['records'],[changed])

    def test_same_budget_unresolved_is_held_but_new_budget_or_rules_reopen_it(self):
        import_candidates(self.db,[B])
        remember_report(self.db,self.report(flags=['unresolved-defence']),'test')
        self.assertEqual(self.query()['records'],[])
        self.assertEqual(self.query(memory_mode='stale')['records'],[])
        for changed in ({**self.context,'proofCode':'changed verifier'},
                        {**self.context,'settings':{**SETTINGS,'defenceNodes':SETTINGS['defenceNodes']*2}}):
            self.assertEqual(self.query(memory_mode='stale',memory_policy=changed)['records'],[B])
        self.assertEqual(explain(self.db,B['gameId'])['history'][0]['status'],'unresolved')

    def test_changing_one_level_rule_keeps_other_assessments_current(self):
        import_candidates(self.db,[B,C])
        remember_report(self.db,self.report(B),'old-B')
        remember_report(self.db,self.report(C),'old-C')
        with patch('research_memory.rule_versions',return_value={'B':'revised-B'}):
            self.assertEqual(self.query(('B','C'),memory_mode='stale')['records'],[B])
            self.assertEqual(self.query(('B','C'))['records'],[B])
            new = {**self.report(B), 'researchRuleVersions': {'B':'revised-B'}}
            remember_report(self.db,new,'reassessed-B')
            self.assertEqual(self.query(('B','C'))['records'],[])
            history=explain(self.db,B['gameId'])['history']
            self.assertEqual([row['matchesCurrentPolicy'] for row in history],[True,False])

    def test_force_cannot_bypass_owner_removal_and_sync_keeps_history(self):
        import_candidates(self.db,[B])
        remember_report(self.db,self.report(),'test')
        self.assertEqual(self.query(memory_mode='force')['records'],[B])
        with self.db:
            self.db.execute('INSERT INTO research_decisions VALUES (?,?,?,?,?,?,?)',
                ('discovery',index.pkey(B['fen'])[0],'B',B['gameId'],'removed','owner removal','exact'))
        self.assertEqual(self.query(memory_mode='force',recheck=True)['records'],[])
        sync_topic_decisions(self.db,'discovery')
        self.assertEqual(len(explain(self.db,B['gameId'])['history']),1)

    def test_older_unknown_verifier_is_history_not_an_active_block(self):
        import_candidates(self.db,[B])
        result=remember_report(self.db,self.report(code='unrecognized'),'older-run')
        self.assertTrue(result['historicalVerifier'])
        self.assertEqual(self.query()['records'],[B])
        self.assertEqual(self.query(memory_mode='stale')['records'],[B])
        self.assertFalse(explain(self.db,B['gameId'])['history'][0]['matchesCurrentPolicy'])

    def test_unselected_ready_leads_rank_first_and_newer_tactical_failure_wins(self):
        candidate={**C,'level':'B'}
        import_candidates(self.db,[B,candidate])
        report=self.report(candidate,flags=[])
        exact={k:v for k,v in report['results'][0].items() if k!='work'}
        decision={'gameId':candidate['gameId'],'decision':'defer','reason':'Batch already full',
                  'retryWhen':'next-selection','recordHash':record_hash(candidate),
                  'fullRecordSha256':digest(candidate),'evidenceSha256':digest(exact)}
        remember_report(self.db,report,'test',decisions=[decision],editorial_code=code_version('research_editorial.py'))
        ready=self.query(limit=1)
        self.assertEqual(ready['records'],[candidate])
        self.assertEqual(ready['assessments'][0]['status'],'unselected')
        remember_report(self.db,self.report(candidate),'later-check')
        self.assertEqual(self.query()['records'],[B])

    def test_completed_evidence_reuses_without_calling_review_or_engine(self):
        report=self.report(flags=[])
        remember_report(self.db,report,'previous-command')
        with patch('research_workflow.run_review') as engine_review:
            actual=review_with_memory(self.db,[B],'discovery',output=self.root/'warm.json',cache=None)
            engine_review.assert_not_called()
        self.assertEqual(actual['metrics']['memoryReused'],1)
        self.assertEqual(actual['metrics']['engineCalls'],0)
        self.assertEqual(actual['results'][0]['recordHash'],report['results'][0]['recordHash'])

    def test_completed_batch_survives_interruption_and_reimport_is_idempotent(self):
        first=self.report()
        with patch('research_workflow.run_review',side_effect=[first,RuntimeError('interrupted')]):
            with self.assertRaisesRegex(RuntimeError,'interrupted'):
                review_with_memory(self.db,[B,C],'discovery',output=self.root/'partial.json',cache=None,batch_size=1)
        self.assertEqual(assessment(self.db,'discovery',B,self.context)['status'],'withheld')
        self.assertIsNone(assessment(self.db,'discovery',C,self.context))
        self.assertFalse(json.loads((self.root/'partial.json').read_text())['complete'])
        self.assertEqual(remember_report(self.db,first,'repeat-import')['stored'],0)

    def test_backup_restores_exact_history_and_refuses_overwrite(self):
        remember_report(self.db,self.report(),'test')
        path=self.root/'backup.sqlite'
        self.assertEqual(backup(self.db,path)['integrity'],'ok')
        with self.assertRaises(FileExistsError):
            backup(self.db,path)
        copy=connect(path)
        try:
            self.assertEqual(explain(copy,B['gameId']),explain(self.db,B['gameId']))
        finally:
            copy.close()

    def test_fork_tags_and_taxonomy_do_not_imply_source_review_support(self):
        record=json.loads((ROOT/'scripts/fixtures/fork/expansion-evidence.json').read_text())['records'][0]
        self.assertIn('fork',aspects(record))
        self.assertIn('mover-'+record['forkPiece'],aspects(record))
        import_candidates(self.db,[B])
        catalog=coverage(self.db)['topics']
        fork=next(t for t in catalog if t['id']=='fork')
        self.assertEqual([row['level'] for row in fork['levels']],['Beginner','A','B','C','C*','D','D*','E','E*'])
        supported = {row['level'] for row in fork['levels'] if row['sourceReviewSupported']}
        self.assertEqual(supported, {'A', 'B', 'D'})
        hanging = next(t for t in catalog if t['id'] == 'hangingPiece')
        self.assertEqual({row['level'] for row in hanging['levels'] if row['sourceReviewSupported']},
                         {'A', 'B', 'C*', 'D*'})


if __name__=='__main__':
    unittest.main()
