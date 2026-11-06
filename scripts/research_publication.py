"""Translate explicit approvals into the existing durable Discovery builder format."""
from datetime import date
import hashlib
import json
from pathlib import Path

from tactic_research import ROOT, atomic_json
from discovery_research import miner
from discovery_management import apply as apply_management, projection_snapshot
from review_store import ReviewStore
import chess


def discovery_expansion(bundle, decisions, output, root=ROOT):
    levels = {record['level'] for record in bundle['records']}
    if len(levels) != 1 or not levels <= {'B', 'C', 'C*', 'D'}:
        raise ValueError('Discovery expansion requires one upper level; retain the curated Beginner/A workflows')
    if not decisions.get('coverageChecklist'):
        raise ValueError('Record the level-specific coverage checklist before selection')
    level = next(iter(levels))
    slug = level.lower().replace('*', '-star')
    output = Path(output)
    if not output.name.startswith(f'level-{slug}-expansion-') or output.suffix != '.json':
        raise ValueError(f'Use level-{slug}-expansion-DATE.json for the builder manifest')
    evidence_key = output.stem + '-review'
    sources_key = output.stem + '-sources'
    evidence = ReviewStore(output.parent / 'expansion-evidence.json')
    if (any(path.exists() for path in (output,
            output.with_name(evidence_key + '.json'), output.with_name(sources_key + '.json')))
            or evidence_key in evidence or sources_key in evidence):
        raise ValueError('Refusing to overwrite an existing approval batch')
    fixtures = root / 'scripts/fixtures/discovery'
    published = json.loads((fixtures / 'published.json').read_text())['records']
    owner = json.loads((root / 'src/lib/server/practice-adjustments.json').read_text())
    excluded = json.loads((fixtures / 'excluded.json').read_text())
    prohibited = {record['gameId'] for record in published} | {row['gameId'] for row in excluded}
    new_ids = [record['gameId'] for record in bundle['records']]
    if prohibited & set(new_ids) or len(set(new_ids)) != len(new_ids):
        raise ValueError('A published/excluded/duplicate game cannot be added again')
    for record in bundle['records']:
        if any(' '.join(entry['reference']['fen'].split()[:4]) == ' '.join(record['fen'].split()[:4])
               and entry['reference']['scope'] == '/discovered-attack' for entry in owner):
            raise ValueError('Expansion must not override an owner decision')
    reviews = []
    approved = {row['gameId']: row for row in bundle['reviews']}
    for record in bundle['records']:
        row = approved[record['gameId']]
        board = chess.Board(record['fen'])
        baseline = miner.material(board, board.turn)
        for san in record['moves'][:record['discoveryPly']]:
            board.push_san(san)
        move = board.parse_san(record['moves'][record['discoveryPly']])
        reviews.append({**row, 'originalLevel': level, 'level': level, 'newResearch': True,
                        'originalExerciseNumber': None, 'gradingReason': row.get('gradingReason'),
                        'title': record['headers']['White'] + ' — ' + record['headers']['Black'],
                        'fen': record['fen'], 'moves': record['moves'],
                        'goal': 'checkmate' if record['goal'] == 'mate' else 'material',
                        'sacrificeCount': len(record['sacrifices']), 'initialMaterialCp': baseline,
                        'coverage': {'mover': board.piece_at(move.from_square).symbol().upper(),
                                     'slider': board.piece_at(chess.parse_square(record['sliderSquare'])).symbol().upper(),
                                     'kind': record['kind'], 'capture': board.is_capture(move),
                                     'promotion': bool(move.promotion), 'sideToMove': record['fen'].split()[1],
                                     'solverMoves': record['solverMoves']}})
    active = apply_management(published + bundle['records'], owner)
    results = {row['gameId']: row for row in bundle['reviewResults']}
    proof_rows = lambda key: [{**row[key], 'gameId': row['gameId']} for row in results.values() if key in row]
    manifest = {'date': decisions.get('date', date.today().isoformat()), 'level': level,
                'target': 24, 'baseOrder': [row['gameId'] for row in published if row['level'] == level],
                'baseActiveOrder': [row['gameId'] for row in apply_management(published, owner) if row['level'] == level],
                'order': new_ids, 'sourceCountLimit': sum(row['level'] == level for row in published) + len(new_ids),
                'evidenceFile': evidence.path.name + '#' + evidence_key,
                'sourceEvidenceFile': evidence.path.name + '#' + sources_key,
                'coverageChecklist': decisions['coverageChecklist'],
                'expectedEffectiveCounts': {item: sum(row['level'] == item for row in active) for item in ('A', 'B', 'C', 'C*', 'D')},
                'records': bundle['records'], 'reviews': reviews,
                'mateProofs': proof_rows('mateProof'), 'shorterMateProofs': proof_rows('shorterMateProof'),
                'managementAtPublication': projection_snapshot(owner),
                'preservedPracticeAdjustmentsSha256': hashlib.sha256((root / 'src/lib/server/practice-adjustments.json').read_bytes()).hexdigest(),
                'reviewInputSha256': bundle['reviewInputSha256']}
    # Update both support records atomically; publish the ordered manifest last.
    evidence.records[evidence_key] = {'date': manifest['date'], 'settings': bundle['settings'],
                          'analyses': [{**row['analysis'], 'gameId': ident, 'fen': row['fen'], 'moves': row['moves']} for ident, row in results.items()],
                          'timelines': [{**row['timeline'], 'gameId': ident} for ident, row in results.items()],
                          'shortcuts': [{**row['shortcuts'], 'gameId': ident} for ident, row in results.items()],
                          'editorialReviews': reviews}
    references = {ref['sha256']: ref for record in bundle['records'] for ref in record['sourceReferences']}
    evidence.records[sources_key] = {'date': manifest['date'], 'sources': list(references.values())}
    evidence.save()
    atomic_json(output, manifest)
    return manifest
