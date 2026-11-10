"""Immutable evidence packets for parallel editorial review; never auto-approve."""
import importlib
import json
from pathlib import Path
import tempfile

import chess

from tactic_research import atomic_json, code_version, digest
from research_workflow import ADAPTERS, prepare_publication, verification_code

NOTES = ('motifNecessity', 'simplerAlternatives', 'defencesAndRecovery', 'level', 'provenance')
VALUES = {chess.PAWN: 100, chess.KNIGHT: 320, chess.BISHOP: 330,
          chess.ROOK: 500, chess.QUEEN: 900, chess.KING: 0}


def _read(value):
    return json.loads(Path(value).read_text()) if isinstance(value, (str, Path)) else value


def _material(board, side):
    return sum(VALUES[p.piece_type] * (1 if p.color == side else -1)
               for p in board.piece_map().values())


def _captured_square(board, move):
    return move.to_square + (-8 if board.turn else 8) if board.is_en_passant(move) else move.to_square


def _ready(report):
    topic = report.get('topic')
    if topic not in ADAPTERS:
        raise ValueError(f'{topic}: no registered topic adapter')
    if report.get('verificationCodeSha256') != verification_code():
        raise ValueError('Verification code is stale or missing; rerun tactical review')
    adapter = importlib.import_module(ADAPTERS[topic])
    candidates = {}
    for record in report['candidates']:
        if record['gameId'] in candidates:
            raise ValueError('Editorial packets require one candidate per stable game ID')
        candidates[record['gameId']] = record
    ready = []
    seen = set()
    for result in report['results']:
        ident = result['gameId']
        if ident in seen:
            raise ValueError(f'{ident}: duplicate tactical result')
        seen.add(ident)
        if result['status'] != 'needs-editorial-review' or result.get('flags'):
            continue
        record = candidates[ident]
        if result.get('recordHash') != adapter.record_hash(record):
            raise ValueError(f'{ident}: stale candidate hash')
        ready.append((record, result))
    return ready


def _binding(report, ready):
    return digest({'reportMetadata': {key: value for key, value in report.items()
                                     if key not in ('candidates', 'results', 'metrics')},
                   'recordsAndEvidence': [[record, _evidence(result)] for record, result in ready]})


def _evidence(result):
    # Cache-hit counters and wall times do not change a tactical finding. Keep
    # every legal root, defence, proof, source/preflight flag and review status.
    return {key: value for key, value in result.items()
            if key not in ('timings', 'elapsedSeconds', 'work', 'reused')}


def _summary(record, result):
    board = chess.Board(record['fen'])
    side, baseline = board.turn, _material(board, board.turn)
    steps, motif = [], None
    last_move = None
    for ply, san in enumerate(record['moves']):
        move = board.parse_san(san)
        piece = board.piece_at(move.from_square)
        capture_square = _captured_square(board, move)
        captured = board.piece_at(capture_square) if board.is_capture(move) else None
        step = {'ply': ply, 'move': san, 'piece': piece.symbol().upper(),
                'from': chess.square_name(move.from_square), 'to': chess.square_name(move.to_square),
                'capturedPiece': captured.symbol().upper() if captured else None,
                'capturedSquare': chess.square_name(capture_square) if captured else None}
        board.push(move)
        step['materialChangeCp'] = _material(board, side) - baseline
        steps.append(step)
        if ply == record.get('discoveryPly'):
            slider_square = chess.parse_square(record['sliderSquare'])
            slider = board.piece_at(slider_square)
            counter = board.copy(stack=False)
            counter.remove_piece_at(slider_square)
            original = set(board.legal_moves)
            newly_possible = [counter.san(reply) for reply in counter.legal_moves
                              if reply not in original and counter.is_capture(reply)
                              and _captured_square(counter, reply) == move.to_square]
            motif = {'kind': record.get('kind'), 'move': san,
                     'movingPiece': piece.symbol().upper(),
                     'stationaryPiece': slider.symbol().upper() if slider else None,
                     'stationarySquare': record['sliderSquare'],
                     'targetSquare': record['targetSquare'],
                     'checkers': len(board.checkers()),
                     'recapturesLegalOnlyWithoutSlider': newly_possible,
                     'counterfactualNote': 'Geometric review lead only; removing the slider is not a tactical proof.'}
        if ply == record.get('forkPly'):
            motif = {'kind': 'fork', 'move': san, 'movingPiece': piece.symbol().upper(),
                     'forkSquare': record['forkSquare'], 'targets': record['targets'],
                     'checkers': len(board.checkers()),
                     'localReplyCount': len(result.get('preflight', {}).get('coverage') or {})}
        last_move = move
    recaptures = []
    if last_move:
        for reply in board.legal_moves:
            if not board.is_capture(reply) or _captured_square(board, reply) != last_move.to_square:
                continue
            after = board.copy(stack=False)
            san = after.san(reply)
            after.push(reply)
            recaptures.append({'reply': san, 'materialChangeCp': _material(after, side) - baseline})
    roots = result.get('analysis', {}).get('roots', [])
    flags = [row for row in roots if row.get('immediateMate') or row.get('forcedMateInTwo')
             or row.get('safeImmediateGain') or (row.get('mateScore') or 0) > 0]
    def rank(row):
        mate = row.get('mateScore')
        return (100000 - mate if mate and mate > 0 else
                -100000 - mate if mate else row.get('scoreCp', -100000) or 0)
    top = sorted(roots, key=rank, reverse=True)[:5]
    highlights = {row['move']: row for row in [*flags, *top]}
    diagram = str(chess.Board(record['fen'])).splitlines()
    diagram = '\n'.join(f'{8 - index} {line}' for index, line in enumerate(diagram)) + '\n  a b c d e f g h'
    return {'board': diagram,
            'sideToMove': 'White' if side else 'Black', 'goal': record['goal'],
            'level': record['level'], 'solverMoves': (len(record['moves']) + 1) // 2,
            'initialMaterialCp': baseline, 'afterSampleCp': _material(board, side),
            'sampleMaterialChangeCp': _material(board, side) - baseline,
            'materialTimeline': steps, 'finalImmediateRecaptures': recaptures,
            'materialLimit': 'Nominal material and immediate recaptures; review the strong defensive lines for later recovery.',
            'motif': motif, 'recordedSacrifices': record.get('sacrifices', []),
            'stationarySacrificeReview': record.get('sacrificeReview'),
            'offers': result.get('preflight', {}).get('offers', []),
            'allLegalRootCount': len(roots), 'rootHighlights': list(highlights.values()),
            'shortcuts': result.get('shortcuts'),
            'defensiveLines': [{'move': step['move'], 'ply': step['ply'],
                               'lines': step.get('engineDefences', [])}
                              for step in result.get('timeline', {}).get('timeline', [])],
            'localReplyCoverage': result.get('preflight', {}).get('coverage'),
            'mateProof': {key: result.get('mateProof', {}).get(key)
                          for key in ('status', 'solverMoves', 'nodes', 'budget')},
            'source': {'headers': record.get('headers'), 'references': record.get('sourceReferences'),
                       'masterCredential': record.get('masterCredential'), 'sourcePly': record.get('ply'),
                       'previousMove': record.get('previousMove')},
            'similarityCluster': result.get('preflight', {}).get('cluster'),
            'distinctnessLimit': 'Compare the learner decision and defence with the current level; geometry alone does not establish variety.'}


def _packet(report, report_hash, packet_id, assigned):
    return {'schema': 1, 'packetId': packet_id, 'topic': report['topic'],
            'reportHash': report_hash, 'verificationCodeSha256': report['verificationCodeSha256'],
            'editorialCodeSha256': code_version('research_editorial.py'),
            'publicationEligible': report['quality'].get('requiresProvenance') is True,
            'instructions': ('Review each assigned position independently. The summary contains leads, not approval. '
                             'Use the complete candidate and tactical evidence below, including every legal root, '
                             'strong defences, recaptures and source game. Record keep, reject or defer explicitly.'),
            'candidates': [{'gameId': record['gameId'], 'recordHash': result['recordHash'],
                            'fullRecordSha256': digest(record), 'evidenceSha256': digest(_evidence(result)),
                            'summary': _summary(record, result),
                            'candidate': record, 'tacticalReview': _evidence(result)} for record, result in assigned]}


def _markdown(packet):
    lines = [f'# Editorial packet {packet["packetId"]}', '', packet['instructions'], '',
             'Generated summaries and counterfactuals are not editorial approval. Full evidence is in the paired JSON.', '']
    for row in packet['candidates']:
        record, s = row['candidate'], row['summary']
        lines += [f'## {row["gameId"]}: {s["level"]} / {s["goal"]}', '',
                  f'FEN: `{record["fen"]}`', '', '```text', s['board'], '```', '',
                  f'{s["sideToMove"]} to move. Sample: {" ".join(record["moves"])}.', '',
                  f'Material: start {s["initialMaterialCp"]} cp; sample change {s["sampleMaterialChangeCp"]} cp.',
                  f'Final immediate recaptures: {json.dumps(s["finalImmediateRecaptures"], ensure_ascii=False)}.',
                  f'Sacrifices: {json.dumps(s["recordedSacrifices"], ensure_ascii=False)}.',
                  f'Motif: {json.dumps(s["motif"], ensure_ascii=False)}.',
                  f'Root comparison: {s["allLegalRootCount"]} roots; highlighted moves below. Scores are bounded evidence.', '']
        if s['level'] in ('C*', 'D*', 'E*'):
            lines += ['For the grade, identify the strong defensive reply, why the simpler '
                      'continuations miss the same payoff, and how the line avoids a sacrifice.', '']
        if s['level'] in ('D', 'E'):
            lines += ['For the grade, identify the necessary complex sacrifice and coordination, '
                      'the strong defence, and why shorter continuations miss the same payoff.', '']
        for root in s['rootHighlights']:
            lines.append(f'- {root["move"]}: cp={root.get("scoreCp")}, mate={root.get("mateScore")}; '
                         f'safe immediate gain={root.get("safeImmediateGain")}; PV={" ".join(root.get("pv", []))}')
        lines += ['', 'Strong defensive lines:']
        for step in s['defensiveLines']:
            for defence in step['lines']:
                lines.append(f'- After {step["move"]}: {" ".join(defence.get("line", []))} '
                             f'(cp={defence.get("cp")}, mate={defence.get("mate")}).')
        source = s['source']
        lines += ['', f'Source ply: {source["sourcePly"]}; headers: {json.dumps(source["headers"], ensure_ascii=False)}.',
                  f'References: {json.dumps(source["references"], ensure_ascii=False)}.',
                  f'Stationary sacrifice evidence: {json.dumps(s["stationarySacrificeReview"], ensure_ascii=False)}.',
                  f'Similarity cluster: `{s["similarityCluster"]}`. {s["distinctnessLimit"]}', '',
                  'Decision notes required: motif necessity; simpler alternatives; defensive replies and recovery; '
                  'level; provenance; concrete distinctness. Kept records also need reviewed Vietnamese solution and hints.', '']
    return '\n'.join(lines)


def prepare_editorial(report, output_dir, reviewers=4):
    """Create deterministic disjoint evidence packets and undecided templates.

    Return the manifest dictionary. Use output_dir/manifest.json for merge.
    Existing identical packets are reusable; handwritten templates are preserved.
    A changed report requires a new directory, so work in progress is never lost.
    """
    report = _read(report)
    if reviewers < 1:
        raise ValueError('reviewers must be positive')
    ready = _ready(report)
    report_hash = _binding(report, ready)
    output_dir = Path(output_dir)
    manifest_path = output_dir / 'manifest.json'
    count = min(reviewers, len(ready))
    packets = []
    payloads = []
    for index in range(count):
        packet = _packet(report, report_hash, f'reviewer-{index + 1:02d}', ready[index::count])
        packet_hash = digest(packet)
        stem = f'{packet["packetId"]}-{packet_hash[:12]}'
        packets.append({'packetId': packet['packetId'], 'packetHash': packet_hash,
                        'gameIds': [row['gameId'] for row in packet['candidates']],
                        'evidenceFile': stem + '.json', 'summaryFile': stem + '.md',
                        'decisionFile': stem + '-decisions.json'})
        payloads.append(packet)
    manifest = {'schema': 1, 'topic': report['topic'], 'reportHash': report_hash,
                'verificationCodeSha256': report['verificationCodeSha256'],
                'editorialCodeSha256': code_version('research_editorial.py'),
                'candidateCount': len(ready), 'packets': packets,
                'coverageChecklist': report.get('coverageChecklist')}
    manifest['manifestHash'] = digest(manifest)
    if manifest_path.exists():
        if _read(manifest_path) != manifest:
            raise ValueError('Existing editorial work belongs to another report; use a new output directory')
        return manifest
    for entry, packet in zip(packets, payloads):
        atomic_json(output_dir / entry['evidenceFile'], {**packet, 'packetHash': entry['packetHash']})
        (output_dir / entry['summaryFile']).write_text(_markdown(packet) + '\n')
        template = {key: manifest[key] for key in ('topic', 'reportHash', 'manifestHash',
                                                  'verificationCodeSha256', 'editorialCodeSha256')}
        template.update(packetId=entry['packetId'], packetHash=entry['packetHash'], reviewer='',
                        reviews=[{key: row[key] for key in ('gameId', 'recordHash', 'fullRecordSha256', 'evidenceSha256')}
                                 | {'decision': 'undecided', 'reason': '', 'distinctness': '',
                                    'solutionVi': '', 'hintsVi': [], 'reviewNotes': {key: '' for key in NOTES}}
                                 for row in packet['candidates']])
        atomic_json(output_dir / entry['decisionFile'], template)
    atomic_json(manifest_path, manifest)
    return manifest


def merge_editorial(report, decision_paths, output_path, packet_manifest=None, coverage_checklist=None):
    """Merge complete explicit reviewer decisions; defer is never a rejection.

    Keeps are passed through the existing tactical/provenance/publication gate.
    The result uses the existing publisher's reviews schema (reject -> remove),
    with deferrals separate so later research may reconsider them.
    """
    report = _read(report)
    ready = _ready(report)
    by_id = {record['gameId']: (record, result) for record, result in ready}
    if packet_manifest is None:
        raise ValueError('The original packet manifest is required')
    manifest = _read(packet_manifest)
    plain = {key: value for key, value in manifest.items() if key != 'manifestHash'}
    if manifest.get('manifestHash') != digest(plain):
        raise ValueError('Packet manifest hash mismatch')
    if (manifest.get('reportHash') != _binding(report, ready)
            or manifest.get('editorialCodeSha256') != code_version('research_editorial.py')
            or manifest.get('verificationCodeSha256') != report['verificationCodeSha256']):
        raise ValueError('Candidate, evidence or verification code changed since packet preparation')
    ownership, packets = {}, {}
    for entry in manifest['packets']:
        assigned = []
        for ident in entry['gameIds']:
            if ident in ownership or ident not in by_id:
                raise ValueError('Invalid or duplicate packet ownership')
            ownership[ident] = entry['packetId']
            assigned.append(by_id[ident])
        expected = _packet(report, manifest['reportHash'], entry['packetId'], assigned)
        if digest(expected) != entry['packetHash']:
            raise ValueError('Evidence packet hash mismatch')
        if isinstance(packet_manifest, (str, Path)):
            saved = _read(Path(packet_manifest).parent / entry['evidenceFile'])
            if saved != {**expected, 'packetHash': entry['packetHash']}:
                raise ValueError('Saved evidence packet changed')
        packets[entry['packetId']] = entry
    if set(ownership) != set(by_id) or manifest['candidateCount'] != len(ownership):
        raise ValueError('Packet ownership does not cover every assigned candidate')
    decisions, packet_seen = {}, set()
    checklists = [coverage_checklist or manifest.get('coverageChecklist')]
    for path in decision_paths:
        data = _read(path)
        packet_id = data.get('packetId')
        if packet_id not in packets or packet_id in packet_seen:
            raise ValueError('Unknown or duplicate reviewer packet')
        packet_seen.add(packet_id)
        entry = packets[packet_id]
        for key in ('reportHash', 'manifestHash', 'verificationCodeSha256', 'editorialCodeSha256'):
            if data.get(key) != manifest[key]:
                raise ValueError(f'Reviewer {key} does not match the packet manifest')
        if data.get('packetHash') != entry['packetHash'] or not str(data.get('reviewer', '')).strip():
            raise ValueError('Reviewer identity and exact packet hash are required')
        if data.get('coverageChecklist'):
            checklists.append(data['coverageChecklist'])
        assigned = set(entry['gameIds'])
        reviewed = set()
        for row in data['reviews']:
            ident = row['gameId']
            if ident not in assigned or ident in reviewed or ident in decisions:
                raise ValueError('Decision has conflicting or duplicate packet ownership')
            reviewed.add(ident)
            record, evidence = by_id[ident]
            expected = {'recordHash': evidence['recordHash'], 'fullRecordSha256': digest(record),
                        'evidenceSha256': digest(_evidence(evidence))}
            if any(row.get(key) != value for key, value in expected.items()):
                raise ValueError(f'{ident}: changed candidate or tactical evidence')
            decision = row.get('decision')
            if decision not in ('keep', 'reject', 'defer'):
                raise ValueError(f'{ident}: explicit keep, reject or defer required; undecided is not approval')
            if not isinstance(row.get('reason'), str) or not row['reason'].strip():
                raise ValueError(f'{ident}: a specific review reason is required')
            if decision == 'keep':
                for key in ('distinctness', 'solutionVi'):
                    if not isinstance(row.get(key), str) or not row[key].strip():
                        raise ValueError(f'{ident}: editorial {key} is required')
                if not isinstance(row.get('hintsVi'), list) or not row['hintsVi'] or any(
                        not isinstance(hint, str) or not hint.strip() for hint in row['hintsVi']):
                    raise ValueError(f'{ident}: reviewed Vietnamese hints are required')
                if any(not isinstance(row.get('reviewNotes', {}).get(key), str)
                       or not row['reviewNotes'][key].strip() for key in NOTES):
                    raise ValueError(f'{ident}: all tactical/editorial review notes are required')
            decisions[ident] = {**row, 'reviewer': data['reviewer'], 'packetId': packet_id,
                                'packetHash': entry['packetHash']}
        if reviewed != assigned:
            raise ValueError('Missing reviewer decisions; use defer explicitly for unresolved candidates')
    if set(decisions) != set(by_id) or packet_seen != set(packets):
        raise ValueError('Missing reviewer packets or candidate decisions')
    actual_checklists = [value for value in checklists if value]
    if actual_checklists and any(value != actual_checklists[0] for value in actual_checklists):
        raise ValueError('Conflicting coverage checklists')
    merged = {'topic': report['topic'], 'packetManifestHash': manifest['manifestHash'],
              'reportHash': manifest['reportHash'], 'verificationCodeSha256': report['verificationCodeSha256'],
              'reviews': [{**decisions[ident], 'decision': 'keep' if decisions[ident]['decision'] == 'keep' else 'remove'}
                          for ident in by_id if decisions[ident]['decision'] != 'defer'],
              'deferred': [decisions[ident] for ident in by_id if decisions[ident]['decision'] == 'defer']}
    if actual_checklists:
        merged['coverageChecklist'] = actual_checklists[0]
    if any(row['decision'] == 'keep' for row in merged['reviews']):
        if report['quality'].get('requiresProvenance') is not True:
            raise ValueError('Benchmark-only or unverified-provenance reports cannot be kept for publication')
        with tempfile.TemporaryDirectory(prefix='editorial-merge-') as directory:
            prepare_publication(report, merged, Path(directory) / 'validation-only.json')
    atomic_json(output_path, merged)
    return merged
