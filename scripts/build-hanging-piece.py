"""Rebuild Hanging Piece practice from durable, explicitly reviewed evidence."""
from collections import Counter
import json

from hanging_piece_beginner import approved_exercises
from hanging_piece_research import frames, local_replies, preflight, record_hash, start_board
from research_editorial import _evidence
from research_finish import APPEND_MANIFESTS, _bundle_ids, _runtime_files, _validate_batches
from research_workflow import SETTINGS
from tactic_research import ROOT, atomic_json, digest
from tactics_catalog import PRACTICE_LEVELS


TOPIC = 'hanging-piece'
PROMPT = 'Tìm cách bắt quân và tính nước đáp để giữ lợi thế vật chất.'
# Update published wording without rewriting the checksummed review records.
BEGINNER_PROMPTS = {
    'Tìm nước bắt quân treo để thu lợi vật chất.':
        'Tìm nước bắt quân có lợi. Kiểm tra xem đối phương có thể bắt lại không.',
}
HINT_EDITS = {
    'Tìm quân treo trên e5 và xem cột f thay đổi thế nào sau khi bắt.':
        'Xem cột f thay đổi thế nào sau khi bắt Hậu trên e5.',
    'Tìm quân treo trên e2.': 'Kiểm tra xem Tượng ở e2 có được bảo vệ không.',
}
LEVEL_REASON = {
    'A': 'Bắt quân trực tiếp và kiểm tra khả năng bị bắt lại.',
    'B': 'Tính nước đáp và phối hợp thêm để giữ lợi thế vật chất.',
    'C*': 'Tính chuỗi nước đáp dài hơn để giữ lợi thế vật chất mà không thí quân.',
    'D*': 'Tính 4–5 nước của mình trước nước phòng thủ mạnh để giữ lợi thế vật chất mà không thí quân.',
}
LEGACY_C_STAR_VERIFIER = 'adc6121db17035d4fb754d36f385cdaba72301618a2f83b7c769a1925fe501c1'


def approved_games(bundle):
    _validate_batches(bundle, _bundle_ids(bundle, TOPIC))
    decisions = {row['gameId']: row for row in bundle['reviews']}
    evidence = {row['gameId']: row for row in bundle['reviewResults']}
    batches = {ident: batch for batch in bundle.get('publicationBatches', [])
               for ident in batch['recordIds']}
    exercises, sources, positions = [], {}, set()
    for record in bundle['records']:
        ident = record['gameId']
        decision, result = decisions[ident], evidence[ident]
        batch = batches.get(ident, bundle)
        budget = batch['settings']
        if any(budget.get(key, 0) < value for key, value in SETTINGS.items()):
            raise ValueError(f'{ident}: full-budget source review required')
        if (decision['decision'] != 'keep' or not decision.get('reviewer')
                or result['status'] != 'needs-editorial-review' or result['flags']
                or not decision.get('solutionVi') or not decision.get('hintsVi')
                or result['recordHash'] != record_hash(record)
                or decision['recordHash'] != result['recordHash']
                or decision.get('fullRecordSha256') != digest(record)
                or decision.get('evidenceSha256') != digest(_evidence(result))):
            raise ValueError(f'{ident}: stale or incomplete tactical/editorial approval')
        gate = preflight(record, True, legacy_c_star=(
            batch.get('verificationCodeSha256') == LEGACY_C_STAR_VERIFIER))
        if gate['flags'] or gate != result['preflight']:
            raise ValueError(f'{ident}: changed motif, objective, level or source position')
        board = start_board(record)
        legal_roots = {board.san(move) for move in board.legal_moves}
        roots = result['analysis']['roots']
        if len(roots) != len(legal_roots) or {row['move'] for row in roots} != legal_roots:
            raise ValueError(f'{ident}: every legal starting move must be compared')
        timeline = result['timeline']['timeline']
        if len(timeline) != record['solverMoves']:
            raise ValueError(f'{ident}: incomplete defensive/recovery timeline')
        for row, (ply, before, move, after) in zip(timeline, frames(board, record['moves'])):
            replies = local_replies(after, board.turn, gate['initialMaterialCp'])
            required = {reply['move'] for reply in replies if reply['check'] or reply['capture']}
            if ply + 1 < len(record['moves']):
                required.add(record['moves'][ply + 1])
            checked = {reply['move'] for reply in row['engineDefences']}
            if (row['ply'] != ply or row['move'] != before.san(move)
                    or row['replies'] != replies or not checked or not required <= checked):
                raise ValueError(f'{ident}: incomplete evidence at solver ply {ply}')
        position = ' '.join(board.fen().split()[:4])
        if position in positions:
            raise ValueError(f'{ident}: duplicate practice position')
        positions.add(position)
        if record.get('alternativeLines'):
            raise ValueError(f'{ident}: source alternatives require separate tactical evidence')
        level = record['level']
        headers = record['headers']
        exercise = {
            'title': f"{headers['White']} — {headers['Black']}",
            'prompt': PROMPT,
            'mode': 'interactive',
            'outcome': TOPIC,
            'goal': 'material',
            'fen': record['fen'],
            'moves': record['moves'],
            'tacticPly': record['tacticPly'],
            'hangingPiece': {'target': record['targetSquare'], 'minimumGain': record['minimumGain']},
            'previousMove': record['previousMove'],
            'source': record['source'],
            'gameReference': {'id': ident, 'kind': 'game', 'ply': record['ply'],
                              'branch': 0, 'collection': TOPIC},
            'difficulty': {'level': level, 'status': 'suggested', 'reason': LEVEL_REASON[level],
                           'solverMoves': record['solverMoves'], 'sacrificeCount': 0},
            'hints': [HINT_EDITS.get(hint, hint) for hint in decision['hintsVi']],
            'solution': decision['solutionVi'],
        }
        exercises.append(exercise)
        # The game viewer receives the original game only. The saved teaching
        # line is independently replayed by the shared trainer.
        sources[ident] = {'kind': 'game', 'headers': headers, 'fen': record['gameFen'],
                          'lines': [record['gameMoves']]}
    return exercises, sources


def build(root=ROOT):
    manifest = root / APPEND_MANIFESTS[TOPIC]
    composition = manifest.with_name('beginner.json')
    if not manifest.exists() and not composition.exists():
        raise ValueError('No approved Hanging Piece evidence')
    games = approved_games(json.loads(manifest.read_text())) if manifest.exists() else ([], {})
    reviewed = approved_exercises(json.loads(composition.read_text())) if composition.exists() else []
    beginners = [{**row, 'prompt': BEGINNER_PROMPTS.get(row['prompt'], row['prompt'])}
                 for row in reviewed]
    runtime = dict(zip(_runtime_files(TOPIC), (*games, beginners)))
    for name, rows in runtime.items():
        path = root / name
        if not rows and path.exists() and json.loads(path.read_text()):
            raise ValueError(f'Missing approvals for existing data in {name}')
    return runtime


def main():
    runtime = build()
    for name, rows in runtime.items():
        atomic_json(ROOT / name, rows)
    exercises, _, beginners = runtime.values()
    counts = Counter(row['difficulty']['level'] for row in exercises)
    print({'Beginner': len(beginners), **{level: counts[level] for level in PRACTICE_LEVELS[1:]}})


if __name__ == '__main__':
    main()
