#!/usr/bin/env python3
"""Pipeline guards; these tests do not replace the editorial review."""
import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import unittest
import chess
from review_store import ReviewStore

ROOT=Path(__file__).resolve().parents[1]
def module(name,path):
    spec=importlib.util.spec_from_file_location(name,ROOT/path)
    loaded=importlib.util.module_from_spec(spec);spec.loader.exec_module(loaded);return loaded
builder=module('builder','scripts/build-removing-defender.py')
collector=module('collector','scripts/collect-removing-defender.py')
validator=module('validator','scripts/validate-removing-defender-batch.py')

class Pipeline(unittest.TestCase):
    def setUp(self):
        self.records=json.loads((ROOT/'scripts/fixtures/removing-defender/approved.json').read_text())['records']
    def test_builder_uses_approved_reviewed_data(self):
        exercises,sources=builder.build(self.records,[])
        self.assertEqual(exercises,json.loads((ROOT/'src/lib/server/removing-defender-exercises.json').read_text()))
        self.assertEqual(sources,json.loads((ROOT/'src/lib/server/removing-defender-game-sources.json').read_text()))
        bad=copy.deepcopy(self.records);bad[0]['status']='needs-editorial-review'
        with self.assertRaises(ValueError):builder.build(bad,[])
        bad=copy.deepcopy(self.records);bad[0]['evidenceSha256']='0'*64
        with self.assertRaises(ValueError):builder.build(bad,[])
        bad=copy.deepcopy(self.records);bad.append(copy.deepcopy(bad[0]))
        with self.assertRaises(ValueError):builder.build(bad,[])
        bad=copy.deepcopy(self.records)
        bad[0]['exercise']['moves'][0]=bad[0]['exercise']['moves'][0].rstrip('+')
        with self.assertRaisesRegex(ValueError, 'Noncanonical move notation'):
            builder.build(bad,[])
    def test_exclusions_are_durable_by_id_fen_and_game(self):
        first=self.records[0];game=next(r for r in self.records if r.get('gameSource'))
        for exclusion,ident in [({'id':first['id']},first['id']),({'fen':first['exercise']['fen']},first['id']),
                                ({'gameId':game['exercise']['gameReference']['id']},game['id'])]:
            exercises,_=builder.build(self.records,[exclusion])
            self.assertNotIn(ident,{e['id'] for e in exercises})
    def test_bundle_changes_require_review_only_for_the_changed_record(self):
        record = self.records[0]
        reviews = ReviewStore(ROOT/'scripts/fixtures/removing-defender/reviews.json')
        key = record['reviewEvidence'].split('#', 1)[1]
        reviews.records['unrelated-review'] = {'status': 'unverified'}
        builder.validate(record, reviews)
        reviews.records[key]['concept'] += ' Altered evidence.'
        with self.assertRaisesRegex(ValueError, 'Review evidence changed'):
            builder.validate(record, reviews)
        del reviews.records[key]
        with self.assertRaisesRegex(ValueError, 'Missing local review evidence'):
            builder.validate(record, reviews)
    def test_builder_requires_an_explicit_local_bundle_reference(self):
        for reference in ['../reviews.json#beginner-01-review',
                          'reviews.json#', 'beginner-01-review.json',
                          '/tmp/reviews.json#beginner-01-review']:
            record = copy.deepcopy(self.records[0]); record['reviewEvidence'] = reference
            with self.subTest(reference=reference), self.assertRaisesRegex(ValueError, 'Missing local review evidence'):
                builder.validate(record)
    def test_sample_line_detector_finds_guard_and_capture(self):
        board=chess.Board('6k1/pp1r3p/5np1/8/P7/1P3B2/6PP/3R2K1 w - - 2 32')
        moves=[];p=board.copy()
        for san in ['Rxd7','Nxd7','Bxb7','Nc5']:
            move=p.parse_san(san);moves.append(move);p.push(move)
        result=collector.inspect_line(board,moves)
        self.assertEqual(result['motif']['defender'],'d7')
        self.assertEqual(result['motif']['target'],'b7')
        self.assertEqual(result['sampleGain'],1)
        self.assertIsNone(collector.inspect_line(board,moves[:2]))
    def test_complete_game_provenance_rejects_changed_ply(self):
        record=next(r for r in self.records if r.get('gameSource'))
        e=record['exercise'];source=record['gameSource'];board=chess.Board(source['fen']);uci=[]
        for san in source['lines'][0]:move=board.parse_san(san);uci.append(move.uci());board.push(move)
        candidate={'gameFen':source['fen'],'gameMoves':source['lines'][0], 'headers':source['headers'],
                   'gameKey':hashlib.sha256((source['fen']+' '+' '.join(uci)).encode()).hexdigest(),
                   'ply':e['gameReference']['ply'],'fen':e['fen'],'previousMove':e['previousMove']}
        validator.provenance(candidate)
        candidate['ply']-=1
        with self.assertRaises(ValueError):validator.provenance(candidate)

if __name__=='__main__':unittest.main()
