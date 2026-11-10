"""Exact short two-rook mates, sacrifice accounting and defensive comparisons."""
import time

import chess
import chess.engine

from discovery_research import provenance
from tactic_research import digest, module

legacy = module('collect-two-rook-games')
LEVEL_MOVES = {'A': (1, 2), 'B': (3,), 'C': (2, 3), 'C*': (2, 3)}
# A bishop exchanged for a knight is still an equal exchange.
EQUAL_MINOR_DELTA = 10


def record_hash(record):
    return digest(record)


def start_board(record):
    board = chess.Board(record['gameFen'])
    for san in record['gameMoves'][:record['ply']]:
        board.push_san(san)
    return board


def rook_roles(board, side):
    if not board.is_checkmate() or board.turn == side:
        return None
    rooks = list(board.pieces(chess.ROOK, side))
    checkers = board.checkers()
    if len(rooks) != 2 or not any(square in checkers for square in rooks):
        return None
    roles = []
    for square in rooks:
        counterfactual = board.copy(stack=False)
        counterfactual.remove_piece_at(square)
        if counterfactual.is_checkmate():
            return None
        roles.append({'square': chess.square_name(square), 'checking': square in checkers,
                      'escapesWithoutRook': [counterfactual.san(move)
                                             for move in counterfactual.legal_moves]})
    return roles


def shape(board, moves):
    side = board.turn
    if len(board.pieces(chess.ROOK, side)) != 2 or len(moves) not in (1, 3, 5):
        return None
    walk = board.copy()
    initial = legacy.material(board, side)
    timeline = []
    sacrifices = []
    for ply, san in enumerate(moves):
        move = walk.parse_san(san)
        if ply % 2:
            walk.push(move)
            continue
        before = walk.copy(stack=False)
        balance = legacy.material(walk, side)
        offer = timeline[-1]['captures'].get(moves[ply - 1]) if timeline else None
        if offer:
            balance = timeline[-1]['materialBefore']
        walk.push(move)
        material_after = legacy.material(walk, side)
        if material_after + EQUAL_MINOR_DELTA < balance:
            if not offer or not offer['movingPiece'] or offer['rook'] or sacrifices:
                return None
            sacrifices.append({'ply': ply - 2, 'piece': offer['piece'],
                               'capturedOn': offer['square'],
                               'materialConcession': balance - material_after})
        captures = {}
        replies = []
        for reply in walk.legal_moves:
            reply_san = walk.san(reply)
            replies.append({'move': reply_san})
            if walk.is_capture(reply):
                square = reply.to_square - (8 if walk.turn else -8) if walk.is_en_passant(reply) else reply.to_square
                victim = walk.piece_at(square)
                captures[reply_san] = {'piece': victim.symbol().upper(),
                                       'square': chess.square_name(square),
                                       'movingPiece': square == move.to_square,
                                       'rook': victim.piece_type == chess.ROOK}
        timeline.append({'ply': ply, 'move': san, 'fenAfter': walk.fen(en_passant='fen'),
                         'materialBefore': legacy.material(before, side),
                         'materialGain': material_after - initial,
                         'captures': captures, 'replies': replies})
    roles = rook_roles(walk, side)
    if not roles:
        return None
    return {'rookRoles': roles, 'endFen': walk.fen(), 'timeline': timeline,
            'sacrifices': sacrifices}


def sacrifice_allowance(record):
    if record['level'] != 'C' or not record.get('sacrifices'):
        return None
    offer = record['sacrifices'][0]
    return (record['solverMoves'] - offer['ply'] // 2 - 1,
            chess.parse_square(offer['capturedOn']), offer['piece'])


def defensive_debt(board, move, left, balance, allowance, incidental_pawns=False):
    if not board.is_capture(move):
        return None
    square = move.to_square - (8 if board.turn else -8) if board.is_en_passant(move) else move.to_square
    victim = board.piece_at(square)
    if (allowance == (left, square, victim.symbol().upper())
            and board.peek().to_square == square):
        return None
    if incidental_pawns and victim.piece_type == chess.PAWN and board.peek().to_square != square:
        # A remote pawn capture that was already available before the solver's
        # move is different from offering that pawn or exposing a new capture.
        before = board.copy(stack=1)
        before.pop()
        before.push(chess.Move.null())
        if before.is_valid() and before.piece_at(square) == victim and before.is_legal(move):
            return None
    return balance


class SearchLimit(Exception):
    pass


class ShortMate:
    """AND/OR search. A failed root means no forced mate within the bound."""
    def __init__(self, side, budget, *, advanced=False):
        self.side = side
        self.budget = budget
        self.nodes = 0
        self.advanced = advanced

    def search(self, board, left, goal='any', sample=(), debt=None, allowance=None):
        self.nodes += 1
        if self.nodes > self.budget:
            raise SearchLimit
        if board.is_checkmate():
            if board.turn == self.side or sample:
                return None
            if goal in ('any', 'safe') or bool(rook_roles(board, self.side)) == (goal == 'two'):
                return {}
            return None
        if left <= 0:
            return None
        moves = list(board.legal_moves)
        if not moves or board.is_insufficient_material():
            return None
        solving = board.turn == self.side
        if goal == 'two' and len(board.pieces(chess.ROOK, self.side)) != 2:
            return self.other_finish(board, left, sample, debt, allowance) if solving else None
        forced = board.parse_san(sample[0]) if sample else None
        if solving and forced:
            moves = [forced]
        else:
            moves.sort(key=lambda move: (move == forced, board.gives_check(move), board.is_capture(move)),
                       reverse=True)
        children = {}
        track_material = goal in ('two', 'safe')
        balance = legacy.material(board, self.side) if track_material else None
        for move in moves:
            if solving and left == 1 and not board.gives_check(move):
                continue
            next_debt = None
            if track_material:
                next_debt = balance if solving else defensive_debt(
                    board, move, left, debt, allowance, self.advanced)
            board.push(move)
            try:
                if (track_material and solving and debt is not None
                        and legacy.material(board, self.side) + EQUAL_MINOR_DELTA < debt):
                    child = None
                else:
                    child = self.search(board, left - solving, goal,
                                        sample[1:] if move == forced else (),
                                        next_debt, allowance)
            finally:
                board.pop()
            if solving and child is not None:
                return {move.uci(): child} if not automatic_draw(board) else None
            if not solving and child is None:
                return None
            if child is not None:
                children[move.uci()] = child
        if solving:
            return self.other_finish(board, left, sample, debt, allowance) if goal == 'two' else None
        if board.halfmove_clock >= 7 and board.can_claim_draw():
            return None
        return children

    def other_finish(self, board, left, sample, debt, allowance):
        if self.advanced and not sample:
            if allowance:
                # A different answer to a single sacrifice can lead to a
                # different finish. The published accepting line still needs
                # both rooks, and root checks rule out either global bypass.
                return self.search(board, left, 'safe', debt=debt, allowance=allowance)
            if left > 1:
                # A weaker reply may allow an immediate mate in another pattern.
                return self.search(board, 1, 'safe', debt=debt)
        return None


def automatic_draw(board):
    return board.is_seventyfive_moves() or (
        board.halfmove_clock >= 8 and board.is_fivefold_repetition())


def proof_line(board, tree):
    if not tree:
        return []
    lines = []
    for uci, child in tree.items():
        move = chess.Move.from_uci(uci)
        san = board.san(move)
        board.push(move)
        lines.append([san, *proof_line(board, child)])
        board.pop()
    return max(lines, key=len)


def preflight(record, require_provenance):
    flags = provenance(record) if require_provenance else []
    board = start_board(record)
    side = board.turn
    count = record['solverMoves']
    allowed = LEVEL_MOVES.get(record['level'], ())
    sample = shape(board, record['moves']) if count in allowed else None
    if (count not in allowed or record['goal'] != 'mate' or not board.is_valid() or board.is_game_over()
            or not 0 < record['ply'] <= len(record['gameMoves'])
            or len(record['moves']) != 2 * count - 1
            or not sample):
        flags.append('unsuitable-two-rook-line-or-level')
    if sample and (sample['sacrifices'] != record.get('sacrifices', [])
                   or len(sample['sacrifices']) != int(record['level'] == 'C')
                   or any(offer['materialConcession'] < 100 for offer in sample['sacrifices'])):
        flags.append('incorrect-sacrifice-grade')
    if sample and (sample['rookRoles'] != record['rookRoles'] or sample['endFen'] != record['endFen']):
        flags.append('rook-role-or-terminal-mismatch')
    return {'flags': flags, 'initialMaterialCp': legacy.material(board, side),
            'offers': [offer for step in (sample or {}).get('timeline', [])
                       for offer in step['captures'].values()],
            'cluster': record.get('family')}


def exact_review(board, count, moves, budget, allowance=None, *, advanced=False):
    search = ShortMate(board.turn, budget, advanced=advanced)
    roots = []
    sample_tree = None
    for move in list(board.legal_moves):
        san = board.san(move)
        # Search with a fixed root. The saved sample is checked separately at
        # all of its solver turns so the proved line matches the UI line.
        depth = next((n for n in range(1, count + 1) if search.search(board, n, sample=(san,)) is not None), None)
        root = {'move': san, 'mateScore': depth, 'immediateMate': depth == 1,
                'forcedMateInTwo': depth == 2}
        if depth == count:
            root['bypassesRooks'] = search.search(board, count, 'other', (san,)) is not None
            if allowance:
                root['matesWithoutSacrifice'] = search.search(board, count, 'safe', (san,)) is not None
        roots.append(root)
    if (not any(row['mateScore'] and row['mateScore'] < count for row in roots)
            and not any(row.get('bypassesRooks') or row.get('matesWithoutSacrifice') for row in roots)):
        sample_tree = search.search(board, count, 'two', tuple(moves), allowance=allowance)
    return roots, sample_tree, search.nodes


def compare_defences(board, count, moves, budget):
    """Grade a C* defence by exact depth and the solver choices it changes."""
    side = board.turn
    balance = legacy.material(board, side)
    board = board.copy()
    board.push_san(moves[0])
    search = ShortMate(side, budget, advanced=True)
    replies = []
    for reply in list(board.legal_moves):
        san = board.san(reply)
        debt = defensive_debt(board, reply, count - 1, balance, None, True)
        board.push(reply)
        depth = next((limit for limit in range(1, count)
                      if search.search(board, limit) is not None), None)
        if depth is None:
            raise ValueError('Certified defence exceeds the mate limit')
        choices = []
        for move in list(board.legal_moves):
            answer = board.san(move)
            if search.search(board, depth, 'two', (answer,), debt) is not None:
                choices.append(answer)
        replies.append({'move': san, 'mateAfter': depth, 'solverChoices': choices,
                        'countercheck': board.is_check()})
        board.pop()
    strong = next(row for row in replies if row['move'] == moves[1])
    contrasting = [row['move'] for row in replies if row is not strong and (
        row['mateAfter'] < strong['mateAfter'] or (row['solverChoices'] and
        set(row['solverChoices']).isdisjoint(strong['solverChoices'])))]
    return {'strongReply': strong, 'contrastingReplies': contrasting, 'allReplies': replies,
            'sampleRequiresDepth': strong['mateAfter'] == count - 1 and moves[2] in strong['solverChoices'],
            'nodes': search.nodes}


def verify_proof(record, proof):
    """Replay the published witness and require every defensive branch."""
    board = start_board(record)
    side = board.turn
    count = record['solverMoves']
    allowance = sacrifice_allowance(record)
    advanced = record['level'] in ('C', 'C*')
    if (proof.get('status') != 'proved' or proof.get('fen') != record['fen']
            or proof.get('moves') != record['moves'] or proof.get('solverMoves') != count):
        raise ValueError('Two-rook mate proof is bound to a different exercise')

    def verify(left, tree, sample, debt=None):
        if board.is_checkmate():
            if (board.turn == side or tree or sample
                    or (not rook_roles(board, side) and not (allowance or (advanced and left > 0)))):
                raise ValueError('Every certified line must end in the specified two-rook mate')
            return
        solving = board.turn == side
        if (not left or automatic_draw(board) or board.is_insufficient_material()
                or (not solving and board.halfmove_clock >= 7 and board.can_claim_draw())):
            raise ValueError('Unfinished or drawn two-rook proof branch')
        legal = {move.uci(): move for move in board.legal_moves}
        if ((solving and (len(tree) != 1 or not set(tree) <= set(legal)))
                or (not solving and (not legal or set(tree) != set(legal)))):
            raise ValueError('Two-rook proof omits a defensive reply or supplies an illegal move')
        sample_move = board.parse_san(sample[0]).uci() if sample else None
        if sample_move and sample_move not in tree:
            raise ValueError('Published sample is missing from its proof')
        material = legacy.material(board, side)
        for uci, child in tree.items():
            move = legal[uci]
            next_debt = material if solving else defensive_debt(board, move, left, debt, allowance, advanced)
            board.push(move)
            if (solving and debt is not None
                    and legacy.material(board, side) + EQUAL_MINOR_DELTA < debt):
                raise ValueError('Unexpected material concession in the proof')
            verify(left - solving, child, sample[1:] if uci == sample_move else (),
                   next_debt)
            board.pop()

    verify(count, proof['tree'], tuple(record['moves']))


def review(record, engine, settings, complete=False, require_provenance=True):
    started = time.perf_counter()
    gate = preflight(record, require_provenance)
    flags = gate['flags'].copy()
    result = {'gameId': record['gameId'], 'recordHash': record_hash(record),
              'fen': record['fen'], 'moves': record['moves'], 'level': record['level'],
              'preflight': gate, 'flags': flags, 'timings': {}}
    if flags:
        return {**result, 'status': 'withheld'}
    board = start_board(record)
    count = record['solverMoves']
    try:
        roots, tree, nodes = exact_review(board, count, record['moves'], settings['mateBudget'],
                                         sacrifice_allowance(record), advanced=record['level'] in ('C', 'C*'))
        if tree and record['level'] == 'C*':
            comparison = compare_defences(board, count, record['moves'], settings['mateBudget'] - nodes)
            result['defenceComparison'] = comparison
            nodes += comparison['nodes']
            if not comparison['sampleRequiresDepth'] or not comparison['contrastingReplies']:
                flags.append('no-distinct-strong-defence-for-starred-level')
                tree = None
    except SearchLimit:
        flags.append('mate-search-budget-unresolved')
        return {**result, 'status': 'withheld'}
    if not tree:
        if not flags:
            flags.append('shorter-mate-motif-bypass-or-unproved-sample')
        return {**result, 'analysis': {'roots': roots}, 'status': 'withheld'}
    info = engine.analyse(board, chess.engine.Limit(nodes=settings['rootNodes']), multipv=3)
    result['analysis'] = {'roots': roots, 'engine': [
        {'move': board.san(row['pv'][0]), 'mate': row['score'].pov(board.turn).mate(),
         'nodes': row.get('nodes'), 'depth': row.get('depth')} for row in info if row.get('pv')]}
    result['timeline'] = {'timeline': shape(board, record['moves'])['timeline']}
    result['mateProof'] = {'status': 'proved', 'fen': record['fen'], 'solverMoves': count,
                           'moves': record['moves'], 'nodes': nodes,
                           'budget': settings['mateBudget'], 'tree': tree}
    result['timings']['exactAndEngineReview'] = time.perf_counter() - started
    return {**result, 'status': 'needs-editorial-review'}
