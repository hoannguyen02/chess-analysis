"""Independent replay of every defence and every starting move in Beginner discoveries."""
import importlib.util, json, unittest
from pathlib import Path
import chess
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('beginner',ROOT/'scripts/build-discovery-beginner.py')
builder=importlib.util.module_from_spec(spec);spec.loader.exec_module(builder)

def mate_in_two_after_root(board):
    if board.is_checkmate(): return True
    replies=list(board.legal_moves)
    if not replies: return False
    for reply in replies:
        board.push(reply); has_mate=False
        for move in list(board.legal_moves):
            board.push(move); mate=board.is_checkmate(); board.pop()
            if mate: has_mate=True; break
        board.pop()
        if not has_mate: return False
    return True

class BeginnerDiscovery(unittest.TestCase):
    def test_all_positions_and_roots(self):
        source=json.loads((ROOT/'scripts/fixtures/discovery/beginner-candidates.json').read_text())['entries']
        exercises=[entry['exercise'] for entry in source]
        reviews=[entry['review'] for entry in source]
        self.assertEqual(len(exercises),42)
        self.assertEqual(len({e['fen'] for e in exercises}),42)
        for e,r in zip(exercises,reviews):
            with self.subTest(id=r['id']):
                b=chess.Board(e['fen']); self.assertTrue(b.is_valid())
                self.assertLessEqual(len(b.piece_map()),6)
                if not r.get("coverageTarget"):
                    self.assertFalse(any(b.generate_legal_captures()))
                self.assertEqual(e['fen'],r['fen']);self.assertEqual(e['moves'],r['moves'])
                self.assertEqual(e['goal'],'material')
                if r.get('coverageTarget'):
                    import importlib.util
                    spec=importlib.util.spec_from_file_location('extension',ROOT/'scripts/extend-discovery-beginner.py')
                    extension=importlib.util.module_from_spec(spec);spec.loader.exec_module(extension)
                    self.assertIn(r['coverageTarget'],extension.features(b,b.parse_san(e['moves'][0])))
                saved={tuple(line) for line in [e['moves'],*e['alternativeLines']]}
                expected=set()
                for move in list(b.legal_moves):
                    a=b.copy(); a.push(move)
                    self.assertFalse(mate_in_two_after_root(a),b.san(move))
                    lines=builder.branches(b,move)
                    if b.is_capture(move) and builder.safe_gain(a,b.turn,builder.miner.material(b,b.turn)):
                        motifs=builder.miner.discoveries(b,move,a)
                        self.assertTrue(motifs, 'No free capture bypasses discovery')
                        for slider,target,kind in motifs:
                            counter=b.copy();counter.remove_piece_at(slider)
                            if move in counter.legal_moves:
                                baseline=builder.miner.material(counter,b.turn);counter.push(move)
                                self.assertFalse(builder.safe_gain(counter,b.turn,baseline), 'Capture already safe without revealed attacker')
                    if lines:
                        self.assertTrue(builder.miner.discoveries(b,move,a),b.san(move))
                        expected.update(tuple(line) for line in lines)
                self.assertEqual(saved,expected)
                opening=b.copy(); opening.push_san(e['moves'][0])
                self.assertFalse(any(opening.generate_legal_captures()), 'Main lesson has no offered sacrifice')
                for line in saved:
                    a=b.copy(); side=a.turn; base=builder.miner.material(a,side)
                    for san in line:a.push_san(san)
                    self.assertTrue(builder.safe_gain(a,side,base))
                self.assertEqual({r['move'] for r in r['roots']},{b.san(m) for m in b.legal_moves})

    def test_curated_selection_and_rebuilds(self):
        import subprocess,sys
        exercise_path=ROOT/'src/lib/server/discovery-beginner-exercises.json'
        review_path=ROOT/'scripts/fixtures/discovery/beginner-review.json'
        exercises=json.loads(exercise_path.read_text())
        reviews=json.loads(review_path.read_text())['reviews']
        manifest=json.loads((ROOT/'scripts/fixtures/discovery/beginner-curation.json').read_text())
        self.assertEqual(len(exercises),24)
        self.assertEqual(len(reviews),24)
        self.assertEqual(sum(e['fen'].split()[1]=='w' for e in exercises),12)
        self.assertEqual([r['id'] for r in reviews],manifest['order'])
        self.assertEqual(len(manifest['decisions']),42)
        self.assertEqual(sum(r['decision']=='remove' for r in manifest['decisions']),18)
        rejected={r['fen'] for r in manifest['decisions'] if r['decision']=='remove'}
        self.assertFalse(rejected & {e['fen'] for e in exercises})
        required={'pawn-push','pawn-double','pawn-capture','king-move','quiet-attack','double-check','queen-revealed','piece-capture','queen-move'}
        self.assertEqual({r['coverageTarget'] for r in reviews if r.get('coverageTarget')},required)
        for i,(e,r) in enumerate(zip(exercises,reviews),1):
            self.assertEqual(e['fen'],r['fen'])
            self.assertEqual(e['moves'],r['moves'])
            self.assertTrue(e['title'].endswith(f' · {i}'))
            self.assertTrue(r['curationReason'])
        before=[exercise_path.read_bytes(),review_path.read_bytes()]
        for script in ['build-discovery-beginner.py','extend-discovery-beginner.py']:
            subprocess.run([sys.executable,str(ROOT/'scripts'/script)],check=True,capture_output=True)
            self.assertEqual([exercise_path.read_bytes(),review_path.read_bytes()],before)

if __name__=='__main__': unittest.main()
