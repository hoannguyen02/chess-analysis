"""Verification of a loose-piece capture and concrete material recovery."""
import time

import chess
import chess.engine

from discovery_research import provenance, pv_san
from tactic_research import digest
from tactics_catalog import STARRED_SOLVER_MOVES

VALUES = {chess.PAWN: 100, chess.KNIGHT: 320, chess.BISHOP: 330,
          chess.ROOK: 500, chess.QUEEN: 900, chess.KING: 0}
LEVEL_MOVES = {'A': (1,), 'B': (2, 3), **STARRED_SOLVER_MOVES}


def record_hash(record):
    return digest(record)


def material(board, side):
    return sum(value * (len(board.pieces(piece, side)) -
                        len(board.pieces(piece, not side)))
               for piece, value in VALUES.items())


def loose_capture(board, move):
    target = board.piece_at(move.to_square)
    if not target or target.color == board.turn or target.piece_type == chess.PAWN or move.promotion:
        return False
    side = board.turn
    board.push(move)
    loose = not board.is_attacked_by(not side, move.to_square)
    board.pop()
    return loose


def local_replies(board, side, baseline):
    replies = []
    for move in list(board.legal_moves):
        san, capture = board.san(move), board.is_capture(move)
        board.push(move)
        replies.append({'move': san, 'materialGain': material(board, side) - baseline,
                        'check': board.is_check(), 'capture': capture,
                        'terminal': board.outcome() is not None})
        board.pop()
    return replies


def settled(board, side, baseline, gain):
    if (board.is_checkmate() or board.is_stalemate() or board.is_insufficient_material()
            or material(board, side) - baseline < gain):
        return False
    for reply in list(board.legal_moves):
        if not board.is_capture(reply) and not reply.promotion:
            continue
        board.push(reply)
        sufficient = material(board, side) - baseline >= gain
        board.pop()
        if not sufficient:
            return False
    return True


def start_board(record):
    board = chess.Board(record['gameFen'])
    for san in record['gameMoves'][:record['ply']]:
        board.push_san(san)
    return board


def frames(board, moves):
    walk = board.copy()
    for index, san in enumerate(moves):
        move = walk.parse_san(san)
        before = walk.copy()
        walk.push(move)
        if not index % 2:
            yield index, before, move, walk.copy()


def preflight(record, require_provenance, *, legacy_c_star=False):
    flags = provenance(record) if require_provenance else []
    if not 0 < record['ply'] <= len(record['gameMoves']):
        flags.append('missing-preceding-game-frame')
    if record['goal'] != 'material' or record['level'] not in LEVEL_MOVES:
        return {'flags': [*flags, 'unsupported-level-or-goal']}
    board = start_board(record)
    side, baseline = board.turn, material(board, board.turn)
    timeline = list(frames(board, record['moves']))
    gain = record['minimumGain']
    if (not board.is_valid() or board.is_game_over() or not timeline
            or not 100 <= gain <= 900 or abs(baseline) > 330
            or record.get('sacrifices')):
        flags.append('invalid-or-unsuitable-start')
    allowed_moves = (4, 5) if legacy_c_star and record['level'] == 'C*' else LEVEL_MOVES[record['level']]
    if (len(record['moves']) != 2 * len(timeline) - 1
            or len(timeline) != record['solverMoves']
            or len(timeline) not in allowed_moves
            or record['tacticPly'] != 0 or record['payoffPly'] != len(record['moves']) - 1):
        flags.append('invalid-level-or-payoff-length')
    if not timeline:
        return {'flags': flags}
    first = timeline[0][2]
    if not loose_capture(board, first) or chess.square_name(first.to_square) != record['targetSquare']:
        flags.append('target-is-not-a-loose-piece')
    for index, _, _, after in timeline:
        if settled(after, side, baseline, gain) != (index == record['payoffPly']):
            flags.append('material-payoff-unsettled-or-earlier')
            break
        if material(after, side) < baseline:
            flags.append('solver-concedes-material')
    return {'flags': flags, 'initialMaterialCp': baseline,
            'cluster': f"{board.piece_at(first.from_square).symbol().upper()}x"
                       f"{board.piece_at(first.to_square) or '-'}",
            'targetSquare': record['targetSquare']}


def probe(board, engine, nodes, side, multipv=None, root_moves=None):
    infos = engine.analyse(board, chess.engine.Limit(nodes=nodes),
                           multipv=multipv, root_moves=root_moves)
    rows = []
    for info in infos if multipv is not None else [infos]:
        score = info['score'].pov(side)
        line = pv_san(board, info['pv'])
        if not line:
            raise ValueError('Empty engine variation')
        rows.append({'move': line[0], 'cp': score.score(), 'mate': score.mate(),
                     'line': line, 'depth': info.get('depth'), 'nodes': info.get('nodes')})
    return rows


def material_witness(board, line, side, baseline, gain):
    return next((index for index, _, _, after in frames(board, line)
                 if settled(after, side, baseline, gain)), None)


def review(record, engine, settings, complete=False, require_provenance=True):
    started = time.perf_counter()
    gate = preflight(record, require_provenance)
    result = {'gameId': record['gameId'], 'recordHash': record_hash(record),
              'fen': record['fen'], 'moves': record['moves'], 'level': record['level'],
              'preflight': gate, 'flags': list(gate['flags']), 'timings': {}}
    flags = result['flags']
    if flags:
        return {**result, 'status': 'withheld'}
    board = start_board(record)
    side, baseline = board.turn, gate['initialMaterialCp']
    gain = record['minimumGain']
    sample = record['moves'][0]
    roots = probe(board, engine, settings['rootNodes'], side, board.legal_moves.count())
    result['analysis'] = {'roots': roots}
    result['timings']['preflightAndRoots'] = time.perf_counter() - started
    sample_root = next(row for row in roots if row['move'] == sample)
    if (sample_root['mate'] is not None or roots[0]['mate'] is not None
            or sample_root['cp'] is None or sample_root['cp'] < 130
            or roots[0]['cp'] - sample_root['cp'] > 70):
        flags.append('sample-inferior-or-mate-dominates')
    if flags:
        return {**result, 'status': 'withheld'}
    alternatives = []
    for row in roots:
        if row['move'] == sample:
            continue
        witness = material_witness(board, row['line'][:len(record['moves'])],
                                   side, baseline, gain)
        if witness is not None or (row['cp'] is not None and row['cp'] >= sample_root['cp'] - 90):
            alternatives.append({'move': row['move'], 'materialWitnessPly': witness,
                                 'looseCapture': loose_capture(board, board.parse_san(row['move']))})
    result['shortcuts'] = {'alternatives': alternatives}
    if any(row['materialWitnessPly'] is not None and not row['looseCapture']
           for row in alternatives):
        flags.append('unrelated-material-shortcut')
    if flags:
        return {**result, 'status': 'withheld'}

    timeline = []
    started = time.perf_counter()
    for index, before, move, after in frames(board, record['moves']):
        replies = local_replies(after, side, baseline)
        ranked = probe(after, engine, settings['defenceNodes'], side, min(3, len(replies)))
        relevant = {row['move'] for row in ranked}
        relevant.update(row['move'] for row in replies if row['check'] or row['capture'])
        if index + 1 < len(record['moves']):
            relevant.add(record['moves'][index + 1])
        ranked_moves = {row['move'] for row in ranked}
        for reply in sorted(relevant - ranked_moves):
            ranked += probe(after, engine, settings['prepNodes'], side,
                            root_moves=[after.parse_san(reply)])
        for line in ranked:
            walk = after.copy()
            walk.push_san(line['move'])
            # A previously settled gain may survive a reply without another move.
            kept = material(walk, side) - baseline >= gain and not walk.is_check()
            witness = material_witness(walk, line['line'][1:7], side, baseline, gain)
            line['materialWitnessPly'] = witness
            line['retainsGainAtReply'] = kept
            if (line['mate'] is not None or line['cp'] is None or line['cp'] < 100
                    or not (kept or witness is not None)):
                flags.append('material-recovery-unresolved')
        timeline.append({'ply': index, 'move': before.san(move), 'fenAfter': after.fen(),
                         'materialGain': material(after, side) - baseline,
                         'replies': replies, 'engineDefences': ranked})
    result['timeline'] = {'timeline': timeline}
    result['timings']['defences'] = time.perf_counter() - started
    result['flags'] = list(dict.fromkeys(flags))
    return {**result, 'status': 'withheld' if flags else 'needs-editorial-review'}
