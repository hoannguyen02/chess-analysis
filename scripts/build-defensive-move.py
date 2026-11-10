"""Rebuild Defensive Move practice and original games from approved evidence."""
from collections import Counter
import json

from defensive_move_research import mate_replies, preflight, record_hash, start_board, validate_advanced_evidence
from research_editorial import _evidence
from research_finish import APPEND_MANIFESTS, _bundle_ids, _runtime_files, _validate_batches
from research_workflow import SETTINGS
from tactic_research import ROOT, atomic_json, digest

TOPIC = 'defensive-move'
LEVEL_REASON = {
    'A': 'Hóa giải đe dọa chiếu hết bằng một nước phòng thủ trực tiếp.',
    'B': 'Phối hợp hai nước phòng thủ trước đòn tấn công tiếp theo.',
    'C': 'Thí quân có mục đích để hóa giải đe dọa chiếu hết.',
    'D': 'Phối hợp phòng thủ và thí quân trước đòn tấn công kéo dài.',
}


def verify_line(board, line):
    board = board.copy()
    for ply, san in enumerate(line):
        board.push_san(san)
        if ply % 2 == 0 and mate_replies(board):
            raise ValueError('A reviewed defence still allows immediate mate')


def approved_games(bundle):
    _validate_batches(bundle, _bundle_ids(bundle, TOPIC))
    decisions = {row['gameId']: row for row in bundle['reviews']}
    results = {row['gameId']: row for row in bundle['reviewResults']}
    batches = {ident: batch for batch in bundle.get('publicationBatches', [])
               for ident in batch['recordIds']}
    exercises, sources, positions = [], {}, set()
    for record in bundle['records']:
        ident, level = record['gameId'], record['level']
        decision, result = decisions[ident], results[ident]
        budget = batches.get(ident, bundle)['settings']
        gate = preflight(record)
        if (any(budget.get(key, 0) < value for key, value in SETTINGS.items())
                or decision['decision'] != 'keep' or not decision['reviewer']
                or result['status'] != 'needs-editorial-review' or result['flags']
                or gate['flags'] or gate != result['preflight']
                or result['recordHash'] != record_hash(record)
                or decision['recordHash'] != result['recordHash']
                or decision['fullRecordSha256'] != digest(record)
                or decision['evidenceSha256'] != digest(_evidence(result))):
            raise ValueError(f'{ident}: current full-budget defence and editorial approval required')
        board = start_board(record)
        verify_line(board, record['moves'])
        if level == 'D':
            validate_advanced_evidence(record, result)
        position = board.epd()
        if position in positions:
            raise ValueError(f'{ident}: duplicate starting position')
        positions.add(position)
        walk = board.copy()
        alternatives = []
        timeline = result['timeline']['timeline']
        if len(timeline) != record['solverMoves']:
            raise ValueError(f'{ident}: incomplete defence sequence')
        for index, step in enumerate(timeline):
            ply = index * 2
            if (step['ply'] != ply or step['move'] != record['moves'][ply]
                    or {row['move'] for row in step['roots']} != {walk.san(m) for m in walk.legal_moves}):
                raise ValueError(f'{ident}: missing solver comparison')
            for row in step['safeAlternatives']:
                line = record['moves'][:ply] + row['line']
                verify_line(board, line)
                alternatives.append(line)
            walk.push_san(step['move'])
            moves = list(walk.legal_moves)
            required = {walk.san(m) for m in moves if walk.is_capture(m) or walk.gives_check(m)}
            required.update(record['moves'][ply+1:ply+2])
            if ({row['move'] for row in step['allReplyScreen']} != {walk.san(m) for m in moves}
                    or not required <= {row['move'] for row in step['engineDefences']}):
                raise ValueError(f'{ident}: missing tactical reply evidence')
            if ply + 1 < len(record['moves']):
                walk.push_san(record['moves'][ply + 1])
        beginner = level == 'Beginner'
        if beginner:
            refutations = {}
            for move in board.legal_moves:
                san = board.san(move)
                after = board.copy()
                after.push(move)
                mates = mate_replies(after)
                if mates and after.outcome() is None:
                    refutations[san] = mates
            if (alternatives or len(refutations) != board.legal_moves.count() - 1
                    or refutations != {row['move']: row['mates'] for row in timeline[0]['mateRefutations']}):
                raise ValueError(f'{ident}: every other move must allow immediate mate')
        headers = record['headers']
        exercises.append({
            'title': f"{headers['White']} — {headers['Black']}",
            'prompt': ('Đối phương đang dọa chiếu hết. Hãy tìm một nước để hóa giải.' if beginner
                       else 'Vua đang bị chiếu. Hãy tìm phương án hóa giải đòn tấn công.'
                       if gate.get('initialCheck')
                       else 'Xác định nước chiếu hết đối phương đang dọa và tìm cách hóa giải.'),
            'mode': 'interactive', 'outcome': TOPIC, 'goal': 'defend',
            'fen': record['fen'], 'moves': record['moves'], 'alternativeLines': alternatives,
            'tacticPly': 0, 'previousMove': record['previousMove'], 'source': record['source'],
            'gameReference': {'id': ident, 'kind': 'game', 'ply': record['ply'],
                              'branch': 0, 'collection': TOPIC},
            **({'beginner': True} if beginner else {
                'difficulty': {'level': level, 'status': 'suggested', 'reason': LEVEL_REASON[level],
                               'solverMoves': record['solverMoves'],
                               'sacrificeCount': len(record['sacrifices']) if level == 'D' else int(level == 'C')},
            }),
            'hints': decision['hintsVi'], 'solution': decision['solutionVi'],
        })
        sources[ident] = {'kind': 'game', 'headers': headers, 'fen': record['gameFen'],
                          'lines': [record['gameMoves']]}
    return exercises, sources


def build(root=ROOT):
    exercises, sources = approved_games(json.loads((root / APPEND_MANIFESTS[TOPIC]).read_text()))
    return dict(zip(_runtime_files(TOPIC), (exercises, sources)))


if __name__ == '__main__':
    runtime = build()
    for path, rows in runtime.items():
        atomic_json(ROOT / path, rows)
    print(dict(Counter('Beginner' if row.get('beginner') else row['difficulty']['level'] for row in next(iter(runtime.values())))))
