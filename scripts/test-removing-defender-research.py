#!/usr/bin/env python3
"""Verify the recorded pilot evidence is replayable, not that it is proof."""
import json
import importlib.util
from pathlib import Path
import unittest
import chess
from review_store import read_review_reference

ROOT = Path(__file__).resolve().parents[1]
class RemovingDefenderResearch(unittest.TestCase):
    def test_beginner_pawn_removes_knight_defender(self):
        evidence = read_review_reference(ROOT / 'scripts/fixtures/removing-defender/reviews.json#beginner-05-review')
        board = chess.Board(evidence['fen'])
        self.assertEqual(set(board.attackers(chess.BLACK, chess.F6)), {chess.D5})
        self.assertEqual({r['move'] for r in evidence['rootProbes']}, {board.san(m) for m in board.legal_moves})
        direct = board.copy(); direct.push_san('Bxf6'); direct.push_san('Nxf6')
        values = {1:1,2:3,3:3,4:5,5:9,6:0}
        balance = lambda b: sum((1 if p.color == chess.WHITE else -1) * values[p.piece_type] for p in b.piece_map().values())
        self.assertEqual(balance(direct), evidence['startingBalance'])
        board.push_san('cxd5+')
        self.assertEqual({board.san(m) for m in board.legal_moves}, {line['moves'][1] for line in evidence['lines']})
        for line in evidence['lines']:
            position = board.copy(); position.push_san(line['moves'][1]); position.push_san('Bxf6')
            self.assertEqual({position.san(m) for m in position.legal_moves}, {r['reply'] for r in line['replies']})
            for reply in line['replies']:
                after = position.copy(); after.push_san(reply['reply'])
                self.assertGreaterEqual(balance(after) - evidence['startingBalance'], 5)

    def test_beginner_king_recapture_and_alternative_deflections(self):
        evidence = read_review_reference(ROOT / 'scripts/fixtures/removing-defender/reviews.json#beginner-04-review')
        exercises = json.loads((ROOT / 'src/lib/server/removing-defender-exercises.json').read_text())
        exercise = next(item for item in exercises if item['id'] == evidence['id'])
        board = chess.Board(exercise['fen'])
        self.assertEqual(set(board.attackers(chess.BLACK, chess.G4)), {chess.H5})
        self.assertEqual({tuple(x['moves']) for x in evidence['alternatives']},
                         {tuple(line) for line in exercise['alternativeLines']})
        self.assertEqual({x['move'] for x in evidence['rootProbes']}, {board.san(m) for m in board.legal_moves})
        main = board.copy(); main.push_san('Rxh6+')
        self.assertEqual({main.san(m) for m in main.legal_moves}, {'Kxh6'})
        main.push_san('Kxh6'); main.push_san('Bxg4')
        responses = evidence['lines'][0]['replies']
        self.assertEqual({main.san(m) for m in main.legal_moves}, {r['reply'] for r in responses})
        values = {1:1,2:3,3:3,4:5,5:9,6:0}
        for record in evidence['alternatives']:
            position = board.copy()
            for san in record['moves']: position.push_san(san)
            gain = sum((1 if p.color else -1) * values[p.piece_type] for p in position.piece_map().values()) - evidence['startingBalance']
            self.assertEqual(gain, record['gain'])
            self.assertGreaterEqual(gain, 3)

    def test_beginner_king_deflection_and_all_replies(self):
        evidence = read_review_reference(ROOT / 'scripts/fixtures/removing-defender/reviews.json#beginner-03-review')
        exercises = json.loads((ROOT / 'src/lib/server/removing-defender-exercises.json').read_text())
        exercise = next(item for item in exercises if item['id'] == evidence['id'])
        board = chess.Board(exercise['fen'])
        self.assertEqual(board.turn, chess.BLACK)
        self.assertEqual(set(board.attackers(chess.WHITE, chess.A4)), {chess.A5})
        self.assertEqual({line['moves'][1] for line in evidence['lines']}, {'Kb4', 'Kb6'})
        self.assertEqual({tuple(line['moves']) for line in evidence['lines']},
                         {tuple(exercise['moves'])} | {tuple(line) for line in exercise['alternativeLines']})
        self.assertEqual({x['move'] for x in evidence['rootProbes']}, {board.san(m) for m in board.legal_moves})
        direct = board.copy(); direct.push_san('Bxa4'); direct.push_san('Kxa4')
        self.assertEqual(sum((1 if p.color == chess.BLACK else -1) * {1:1,2:3,3:3,4:5,5:9,6:0}[p.piece_type]
                             for p in direct.piece_map().values()), evidence['startingBalance'])
        for line in evidence['lines']:
            position = board.copy()
            for san in line['moves']: position.push_san(san)
            self.assertEqual({position.san(m) for m in position.legal_moves}, {r['reply'] for r in line['replies']})
            for reply in line['replies']:
                after = position.copy(); after.push_san(reply['reply'])
                balance = sum((1 if p.color == chess.BLACK else -1) * {1:1,2:3,3:3,4:5,5:9,6:0}[p.piece_type]
                              for p in after.piece_map().values())
                self.assertEqual(balance - evidence['startingBalance'], reply['gain'])
                self.assertGreaterEqual(reply['gain'], 3)

    def test_review_records(self):
        records = read_review_reference(ROOT / 'scripts/fixtures/removing-defender/reviews.json#pilot-engine-review')
        sources = {s['source']:s['sha256'] for s in json.loads((ROOT / 'scripts/fixtures/pin/corpus-sources.json').read_text())}
        spec = importlib.util.spec_from_file_location('pilot', ROOT / 'scripts/validate-removing-defender-batch.py')
        pilot = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(pilot)
        self.assertEqual(len(records), 2)
        for record in records:
            with self.subTest(game=record['gameId']):
                self.assertEqual(record['status'], 'unverified')
                self.assertEqual(sources[record['source']], record['archiveSha256'])
                game = chess.Board(record['gameFen'])
                for san in record['gameMoves'][:record['ply'] - 1]: game.push_san(san)
                self.assertEqual(game.fen(), record['previousMove']['fen'])
                game.push_san(record['previousMove']['move'])
                self.assertEqual(game.fen(), record['fen'])
                self.assertEqual(pilot.short_mates(game), record['shortMates'])
                self.assertEqual(record['gameMoves'][record['ply']], record['playedMove'])
                roots = set()
                for line in record['root']:
                    board = game.copy()
                    for index, san in enumerate(line['pv']):
                        move = board.parse_san(san)
                        if index == 0: roots.add(move.uci())
                        board.push(move)
                self.assertEqual(roots, {move.uci() for move in game.legal_moves})
                game.push_san(record['playedMove'])
                self.assertEqual(game.fen(), record['afterMoveFen'])
                self.assertEqual({game.parse_san(r['reply']).uci() for r in record['replies']},
                                 {move.uci() for move in game.legal_moves})
                for line in record['replies']:
                    board = game.copy(); board.push_san(line['reply'])
                    for san in line['pv']: board.push_san(san)
                while len(game.move_stack) < len(record['gameMoves']):
                    game.push_san(record['gameMoves'][len(game.move_stack)])


    def test_beginner_defences_and_published_lines(self):
        evidence = read_review_reference(ROOT / 'scripts/fixtures/removing-defender/reviews.json#beginner-01-review')
        exercises = json.loads((ROOT / 'src/lib/server/removing-defender-exercises.json').read_text())
        exercise = next(item for item in exercises if item['id'] == evidence['id'])
        self.assertEqual(exercise['fen'], evidence['fen'])
        self.assertEqual({tuple(line['moves']) for line in evidence['lines']},
                         {tuple(exercise['moves'])} | {tuple(line) for line in exercise['alternativeLines']})
        position = chess.Board(exercise['fen'])
        self.assertEqual({chess.D3}, set(position.attackers(chess.BLACK, chess.B1)))
        initial = sum((1 if p.color else -1) * {1:1,2:3,3:3,4:5,5:9,6:0}[p.piece_type] for p in position.piece_map().values())
        self.assertEqual(initial, 0)
        position.push_san('Bxd3+')
        self.assertEqual({position.san(m) for m in position.legal_moves}, {line['moves'][1] for line in evidence['lines']})
        for line in evidence['lines']:
            board = chess.Board(exercise['fen'])
            for san in line['moves']: board.push_san(san)
            self.assertTrue(all(p.color or p.piece_type == chess.KING for p in board.piece_map().values()))
            self.assertEqual({board.san(m) for m in board.legal_moves}, {r['reply'] for r in line['replies']})
            for response in line['replies']:
                after = board.copy(); after.push_san(response['reply'])
                gain = sum((1 if p.color else -1) * {1:1,2:3,3:3,4:5,5:9,6:0}[p.piece_type] for p in after.piece_map().values()) - initial
                self.assertEqual(gain, response['gain'])
                self.assertGreaterEqual(gain, 5)
                self.assertFalse(after.is_game_over() or after.is_check())
        self.assertEqual({p['move'] for p in evidence['rootProbes']}, {chess.Board(exercise['fen']).san(m) for m in chess.Board(exercise['fen']).legal_moves})


    def test_second_beginner_all_defences_and_material_recovery(self):
        evidence = read_review_reference(ROOT / 'scripts/fixtures/removing-defender/reviews.json#beginner-02-review')
        exercises = json.loads((ROOT / 'src/lib/server/removing-defender-exercises.json').read_text())
        exercise = next(item for item in exercises if item['id'] == evidence['id'])
        self.assertEqual(exercise['fen'], evidence['fen'])
        self.assertEqual({tuple(line['moves']) for line in evidence['lines']},
                         {tuple(exercise['moves'])} | {tuple(line) for line in exercise['alternativeLines']})
        board = chess.Board(exercise['fen'])
        self.assertEqual({chess.D5}, set(board.attackers(chess.BLACK, chess.D4)))
        value = lambda b: sum((1 if p.color else -1) * {1:1,2:3,3:3,4:5,5:9,6:0}[p.piece_type] for p in b.piece_map().values())
        baseline = value(board)
        self.assertEqual(baseline, 0)
        board.push_san('Rxd5+')
        self.assertEqual({board.san(m) for m in board.legal_moves}, {line['moves'][1] for line in evidence['lines']})
        for line in evidence['lines']:
            position = chess.Board(exercise['fen'])
            for san in line['moves']: position.push_san(san)
            self.assertEqual({position.san(m) for m in position.legal_moves}, {r['reply'] for r in line['replies']})
            for reply in line['replies']:
                after = position.copy(); after.push_san(reply['reply'])
                self.assertEqual(value(after) - baseline, reply['gain'])
                self.assertGreaterEqual(reply['gain'], 3)
                self.assertFalse(after.is_game_over() or after.is_check())
                after.push_san(reply['safeFollowup']['move'])
                self.assertEqual({after.san(m) for m in after.legal_moves}, {r['reply'] for r in reply['safeFollowup']['replies']})
                for response in reply['safeFollowup']['replies']:
                    end = after.copy(); end.push_san(response['reply'])
                    self.assertEqual(value(end) - baseline, response['gain'])
                    self.assertGreaterEqual(response['gain'], 3)
        self.assertEqual({p['move'] for p in evidence['rootProbes']}, {chess.Board(exercise['fen']).san(m) for m in chess.Board(exercise['fen']).legal_moves})

    def test_twic_research_is_complete_legal_replay_not_tactical_proof(self):
        records = read_review_reference(ROOT / 'scripts/fixtures/removing-defender/reviews.json#twic-pilot-review')
        sources = {s['source']: s['sha256'] for s in json.loads((ROOT / 'scripts/fixtures/removing-defender/corpus-manifest.json').read_text())}
        spec = importlib.util.spec_from_file_location('pilot', ROOT / 'scripts/validate-removing-defender-batch.py')
        pilot = importlib.util.module_from_spec(spec); spec.loader.exec_module(pilot)
        self.assertEqual(len(records), 2)
        for record in records:
            with self.subTest(game=record['gameKey']):
                self.assertEqual(record['status'], 'unverified')
                self.assertEqual(sources[record['source']], record['archiveSha256'])
                game = chess.Board(record['gameFen'])
                for san in record['gameMoves'][:record['ply']-1]: game.push_san(san)
                self.assertEqual(game.fen(), record['previousMove']['fen'])
                game.push_san(record['previousMove']['move'])
                self.assertEqual(game.fen(), record['fen'])
                self.assertEqual(pilot.short_mates(game), record['shortMates'])
                roots = set()
                for line in record['root']:
                    position = game.copy()
                    for index, san in enumerate(line['pv']):
                        move = position.parse_san(san)
                        if index == 0: roots.add(move.uci())
                        position.push(move)
                self.assertEqual(roots, {m.uci() for m in game.legal_moves})
                game.push_san(record['playedMove'])
                self.assertEqual({game.parse_san(r['reply']).uci() for r in record['replies']}, {m.uci() for m in game.legal_moves})
                for line in record['replies']:
                    position = game.copy(); position.push_san(line['reply'])
                    for san in line['pv']: position.push_san(san)
                while len(game.move_stack) < len(record['gameMoves']):
                    game.push_san(record['gameMoves'][len(game.move_stack)])


    def test_master_game_exercise_and_defensive_review(self):
        records = read_review_reference(ROOT / 'scripts/fixtures/removing-defender/reviews.json#twic-batch-review')
        record = next(r for r in records if r['headers']['White'] == 'Vernay,C' and r['ply'] == 62)
        review = read_review_reference(ROOT / 'scripts/fixtures/removing-defender/reviews.json#vernay-mosesov-review')
        exercises = json.loads((ROOT / 'src/lib/server/removing-defender-exercises.json').read_text())
        exercise = next(e for e in exercises if e['id'] == review['id'])
        sources = json.loads((ROOT / 'src/lib/server/removing-defender-game-sources.json').read_text())
        source = sources[exercise['gameReference']['id']]
        self.assertEqual(exercise['fen'], record['fen'])
        self.assertEqual(source['lines'][0], record['gameMoves'])
        board = chess.Board(source['fen'])
        for san in source['lines'][0][:exercise['gameReference']['ply']]: board.push_san(san)
        self.assertEqual(board.fen(), exercise['fen'])
        initial = board.copy()
        self.assertEqual({chess.D7}, set(initial.attackers(chess.BLACK, chess.B7)))
        self.assertIn(chess.F3, initial.attackers(chess.WHITE, chess.B7))
        self.assertEqual({p['move'] for p in review['rootProbes']}, {board.san(m) for m in board.legal_moves})
        for line in [exercise['moves']] + exercise['alternativeLines']:
            p=initial.copy()
            for san in line: p.push_san(san)
        for san in ['Rxd7', 'Nxd7', 'Bxb7']: board.push_san(san)
        self.assertEqual(board.fen(), review['afterCaptureFen'])
        self.assertEqual({board.san(m) for m in board.legal_moves}, {r['reply'] for r in review['afterCaptureReplies']})
        values={1:1,2:3,3:3,4:5,5:9,6:0}
        material=lambda b:sum((1 if p.color else -1)*values[p.piece_type] for p in b.piece_map().values())
        for r in review['afterCaptureReplies']:
            p=board.copy();p.push_san(r['reply'])
            self.assertEqual(material(p)-material(initial),r['materialGain'])
            self.assertGreaterEqual(r['materialGain'],1)
        direct=initial.copy()
        for san in review['directCaptureRefutation']['line']: direct.push_san(san)
        self.assertEqual(material(direct)-material(initial),-2)


    def test_published_master_games_all_lines_and_root_review(self):
        files = ['reviews.json#vernay-mosesov-review', 'reviews.json#klimkowski-vakhidov-review',
                 'reviews.json#cardoso-bilych-review', 'reviews.json#chaudhary-kamble-review',
                 'reviews.json#kvaloy-campos-review', 'reviews.json#gharibyan-deac-review',
                 'reviews.json#firouzja-vachier-review', 'reviews.json#macias-almagro-review',
                 'reviews.json#piorun-niemann-review', 'reviews.json#sharifov-sebenik-review',
                 'reviews.json#petrov-gurel-review', 'reviews.json#martinovic-sipila-review',
                 'reviews.json#petkov-wei-review', 'reviews.json#gukesh-nigmatov-review',
                 'reviews.json#zhigalko-lazavik-review', 'reviews.json#can-miezis-review',
                 'reviews.json#georgiev-hommadov-review', 'reviews.json#abdusattorov-caruana-review',
                 'reviews.json#yip-bulmaga-review', 'reviews.json#lizano-bullen-review',
                 'reviews.json#ogorman-ezra-review', 'reviews.json#amartuvshin-garzon-review',
                 'reviews.json#krasteva-silva-review', 'reviews.json#terao-clarke-review',
                 'reviews.json#barbot-liu-review', 'reviews.json#kourkoulos-chipanga-review',
                 'reviews.json#dahl-berend-review', 'reviews.json#ortega-parsa-review',
                 'reviews.json#amnol-harper-review', 'reviews.json#iclicki-singh-review',
                 'reviews.json#vazquez-kawuma-review', 'reviews.json#boulrens-amdouni-review',
                 'reviews.json#imomkuzieva-contreras-review', 'reviews.json#boulrens-nigmatov-review',
                 'reviews.json#cave-roselli-review', 'reviews.json#ramos-mureya-review',
                 'reviews.json#kandil-waqar-review', 'reviews.json#demchenko-ynojosa-review',
                 'reviews.json#khan-michaelides-review', 'reviews.json#wilson-sivanandan-review',
                 'reviews.json#muthaiah-roudi-review', 'reviews.json#shih-gould-fus-review']
        exercises = {e['id']:e for e in json.loads((ROOT/'src/lib/server/removing-defender-exercises.json').read_text())}
        sources = json.loads((ROOT/'src/lib/server/removing-defender-game-sources.json').read_text())
        manifests = {x['source']:x['sha256'] for x in json.loads((ROOT/'scripts/fixtures/removing-defender/corpus-manifest.json').read_text())}
        spec = importlib.util.spec_from_file_location('pilot', ROOT/'scripts/validate-removing-defender-batch.py')
        pilot = importlib.util.module_from_spec(spec); spec.loader.exec_module(pilot)
        values = {1:1,2:3,3:3,4:5,5:9,6:0}
        for filename in files:
            evidence=read_review_reference(ROOT/'scripts/fixtures/removing-defender'/filename)
            exercise=exercises[evidence['id']]
            with self.subTest(exercise=evidence['id']):
                self.assertEqual(evidence['fen'],exercise['fen'])
                ref=exercise['gameReference'];source=sources[ref['id']]
                self.assertEqual(source['kind'],'game')
                if 'source' in evidence:
                    self.assertEqual(evidence['archiveSha256'],manifests[evidence['source']])
                board=chess.Board(source['fen']); game=source['lines'][ref['branch']]
                for san in game[:ref['ply']]:board.push_san(san)
                self.assertEqual(board.fen(),exercise['fen'])
                while len(board.move_stack)<len(game):board.push_san(game[len(board.move_stack)])
                initial=chess.Board(exercise['fen']);solver=initial.turn
                balance=lambda b:sum((1 if p.color==solver else -1)*values[p.piece_type] for p in b.piece_map().values())
                baseline=balance(initial)
                self.assertEqual({r['move'] for r in evidence['rootProbes']},{initial.san(m) for m in initial.legal_moves})
                self.assertEqual(pilot.short_mates(initial),evidence.get('shortMates',pilot.short_mates(initial)))
                for line in [exercise['moves']]+exercise.get('alternativeLines',[]):
                    board=initial.copy()
                    for san in line:board.push_san(san)
                    self.assertGreaterEqual(balance(board)-baseline,exercise['removingDefender']['minimumGain'])
                    self.assertFalse(board.is_stalemate())
                previous=chess.Board(exercise['previousMove']['fen']);previous.push_san(exercise['previousMove']['move'])
                self.assertEqual(previous.fen(),initial.fen())

if __name__ == '__main__': unittest.main()
