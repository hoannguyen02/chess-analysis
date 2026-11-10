"""Rebuild the one-move mate catalog and full-game replay from approved evidence."""
import json

from mate_in_one_research import record_hash, start_board, verify_review
from research_editorial import _evidence
from research_finish import APPEND_MANIFESTS, _bundle_ids, _runtime_files, _validate_batches
from tactic_research import ROOT, atomic_json, digest

TOPIC = 'mate-in-one'
REASONS = {
    'A': 'Nhận ra nước chiếu hết trực tiếp.',
    'B': 'Phối hợp quân để chiếu hết ngay.',
}


def build(root=ROOT):
    bundle = json.loads((root / APPEND_MANIFESTS[TOPIC]).read_text())
    _validate_batches(bundle, _bundle_ids(bundle, TOPIC))
    decisions = {row['gameId']: row for row in bundle['reviews']}
    results = {row['gameId']: row for row in bundle['reviewResults']}
    exercises, sources, positions = [], {}, set()
    for record in bundle['records']:
        ident, level = record['gameId'], record['level']
        decision, evidence = decisions[ident], results[ident]
        if (decision['decision'] != 'keep' or not decision['reviewer']
                or decision['recordHash'] != record_hash(record)
                or decision['fullRecordSha256'] != digest(record)
                or decision['evidenceSha256'] != digest(_evidence(evidence))):
            raise ValueError(f'{ident}: exact editorial approval required')
        verify_review(record, evidence)
        position = start_board(record).epd()
        if position in positions:
            raise ValueError(f'{ident}: duplicate starting position')
        positions.add(position)
        headers = record['headers']
        grade = {'beginner': True} if level == 'Beginner' else {
            'difficulty': {'level': level, 'status': 'suggested', 'reason': REASONS[level],
                           'solverMoves': 1, 'sacrificeCount': 0},
        }
        exercises.append({
            'title': f"{headers['White']} — {headers['Black']}",
            'prompt': 'Hãy chiếu hết trong một nước.',
            'mode': 'interactive', 'outcome': 'checkmate', 'goal': 'checkmate',
            'fen': record['fen'], 'moves': record['moves'],
            'alternativeLines': [[mate] for mate in evidence['alternativeMates']],
            'tacticPly': 0, 'previousMove': record['previousMove'], 'source': record['source'],
            'gameReference': {'id': ident, 'kind': 'game', 'ply': record['ply'],
                              'branch': 0, 'collection': TOPIC},
            **grade,
            'hints': decision['hintsVi'], 'solution': decision['solutionVi'],
        })
        sources[ident] = {'kind': 'game', 'headers': headers, 'fen': record['gameFen'],
                          'lines': [record['gameMoves']]}
    return dict(zip(_runtime_files(TOPIC), (exercises, sources)))


if __name__ == '__main__':
    for path, rows in build().items():
        atomic_json(ROOT / path, rows)
