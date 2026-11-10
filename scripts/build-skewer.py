"""Build Skewer practice and game replay from exact approved evidence."""
import json

import chess

from research_editorial import _evidence
from research_finish import APPEND_MANIFESTS, _bundle_ids, _runtime_files, _validate_batches
from research_workflow import SETTINGS
from skewer_research import TOPIC, verify_review
from tactic_research import ROOT, atomic_json, digest


def build(root=ROOT):
    bundle = json.loads((root / APPEND_MANIFESTS[TOPIC]).read_text())
    _validate_batches(bundle, _bundle_ids(bundle, TOPIC))
    reviews = {row['gameId']: row for row in bundle['reviews']}
    evidence = {row['gameId']: row for row in bundle['reviewResults']}
    batches = {ident: batch for batch in bundle.get('publicationBatches', [])
               for ident in batch['recordIds']}
    exercises, sources, positions = [], {}, set()
    for record in bundle['records']:
        ident = record['gameId']
        result, decision = evidence[ident], reviews[ident]
        settings = batches.get(ident, bundle)['settings']
        if (any(settings.get(key, 0) < value for key, value in SETTINGS.items())
                or decision['decision'] != 'keep' or not decision.get('reviewer')
                or not decision.get('solutionVi') or not decision.get('hintsVi')
                or decision['recordHash'] != result['recordHash']
                or decision['fullRecordSha256'] != digest(record)
                or decision['evidenceSha256'] != digest(_evidence(result))):
            raise ValueError(f'{ident}: incomplete or stale Skewer approval')
        verify_review(record, result)
        position = chess.Board(record['fen']).epd()
        if position in positions:
            raise ValueError(f'{ident}: duplicate Skewer position')
        positions.add(position)
        headers = record['headers']
        exercises.append({
            'id': ident, 'title': f"{headers['White']} — {headers['Black']}",
            'prompt': 'Chọn một nước tạo đòn xiên để giành lợi thế vật chất.',
            'mode': 'interactive', 'outcome': TOPIC, 'goal': 'material',
            'beginner': True, 'fen': record['fen'], 'moves': record['moves'], 'tacticPly': 0,
            'previousMove': record['previousMove'], 'source': record['source'],
            'gameReference': {'id': ident, 'kind': 'game', 'ply': record['ply'],
                              'branch': 0, 'collection': TOPIC},
            'hints': decision['hintsVi'], 'solution': decision['solutionVi'],
        })
        sources[ident] = {'kind': 'game', 'headers': headers, 'fen': record['gameFen'],
                          'lines': [record['gameMoves']]}
    return dict(zip(_runtime_files(TOPIC), (exercises, sources)))


if __name__ == '__main__':
    for path, value in build().items():
        atomic_json(ROOT / path, value)
