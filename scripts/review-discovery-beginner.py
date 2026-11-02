"""Refresh bounded all-root engine evidence for all 42 curation candidates."""
import json
from pathlib import Path
import chess
import chess.engine

ROOT = Path(__file__).resolve().parents[1]
FIXTURES = ROOT / 'scripts/fixtures/discovery'
source = json.loads((FIXTURES / 'beginner-candidates.json').read_text())['entries']
rows = []
with chess.engine.SimpleEngine.popen_uci('/opt/homebrew/bin/stockfish') as engine:
    engine.configure({'Threads': 1, 'Hash': 32})
    engine_id = engine.id
    for entry in source:
        exercise = entry['exercise']
        board = chess.Board(exercise['fen'])
        engine.configure({'Clear Hash': None})
        infos = engine.analyse(board, chess.engine.Limit(nodes=200000),
                               multipv=board.legal_moves.count())
        roots = [{'move': board.san(info['pv'][0]),
                  'scoreCp': info['score'].pov(board.turn).score(),
                  'mate': info['score'].pov(board.turn).mate(),
                  'pv': [move.uci() for move in info['pv']]} for info in infos]
        if any(row['mate'] is not None for row in roots):
            raise RuntimeError('Mate requires review: ' + entry['review']['id'])
        rows.append({'id': entry['review']['id'], 'fen': exercise['fen'],
                     'moves': exercise['moves'], 'roots': roots})
(FIXTURES / 'beginner-curation-engine.json').write_text(json.dumps({
    'method': 'Fresh 200000-node all-legal-root MultiPV screening of all 42 candidates; separate from exhaustive local material and mate-in-two tests. No claim of exhaustive deeper proof.',
    'engine': engine_id, 'reviews': rows,
}, ensure_ascii=False, indent=2) + '\n')
print('Reviewed all', len(rows), 'positions; no engine mate alerts.')
