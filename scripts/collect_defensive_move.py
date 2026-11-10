"""Find playable defences to an immediate mating threat in indexed games."""
from collections import Counter
from concurrent.futures import ProcessPoolExecutor
import time

import chess

from beginner_one_move import BEGINNER_MAX_PIECES
from defensive_move_research import (
    active_pressure, advanced_trace, depth_witness, immediate_refutations, offers, pressure, score,
    threat_moves, mate_replies, sole_mate_prevention, unequal,
)
from hanging_piece_research import material, probe
from tactic_research import ResearchCache, CachedEngine, atomic_json, code_version, digest

_engine = None


def initialize(cache):
    global _engine
    _engine = CachedEngine(cache=cache)


def geometry(game, cache, version, advanced=False):
    key = digest([version, game['gameKey'], 'forcing']) if advanced else digest([version, game['gameKey']])
    found = cache.get('defensive-move-geometry', key)
    if found is not None:
        return found, True
    board = chess.Board(game['gameFen'])
    found = []
    for ply, san in enumerate(game['gameMoves'], 1):
        before = board.fen(en_passant='fen')
        board.push_san(san)
        side = board.turn
        # Skip openings, lopsided material and positions without a heavy
        # attacker near the king. These are search preferences, not proof gates.
        heavy = board.queens | board.rooks if advanced else board.queens
        if (ply < 20 or not (heavy & board.occupied_co[not side])
                or abs(material(board, side)) > 500):
            continue
        king = board.king(side)
        ring = chess.BB_KING_ATTACKS[king]
        if sum(bool(board.attackers_mask(not side, square))
               for square in chess.scan_forward(ring)) < 2:
            continue
        threats = threat_moves(board)
        allowed = None
        if advanced and (threats or board.is_check()):
            legal = [board.san(move) for move in board.legal_moves]
            bad = immediate_refutations(board)
            allowed = [san for san in legal if san not in bad]
            if not bad or not 1 <= len(allowed) <= 4:
                continue
            if board.is_check():
                threats = sorted({mate for mates in bad.values() for mate in mates})
        if threats:
            found.append({'ply': ply, 'fen': board.fen(en_passant='fen'),
                          'previousMove': {'fen': before, 'move': san},
                          'threats': threats, **({'allowed': allowed} if allowed is not None else {})})
    cache.put('defensive-move-geometry', key, found)
    return found, False


def beginner_geometry(game, cache, version):
    key = digest([version, game['gameKey']])
    found = cache.get('defensive-move-beginner-geometry', key)
    if found is not None:
        return found, True
    board = chess.Board(game['gameFen'])
    found = []
    for ply, san in enumerate(game['gameMoves'], 1):
        last = board.push_san(san)
        if (board.occupied.bit_count() > BEGINNER_MAX_PIECES or board.is_check()
                or abs(material(board, board.turn)) > 500):
            continue
        threats = threat_moves(board)
        if not threats or board.legal_moves.count() < 2:
            continue
        answer = sole_mate_prevention(board)
        if answer is None:
            continue
        after = pushed(board, answer)
        if after.is_game_over():
            continue
        fen, move = board.fen(en_passant='fen'), board.san(answer)
        board.pop()
        before = board.fen(en_passant='fen')
        board.push(last)
        found.append({'ply': ply, 'fen': fen, 'previousMove': {'fen': before, 'move': san},
                      'threats': threats, 'move': move})
    cache.put('defensive-move-beginner-geometry', key, found)
    return found, False


def screen_beginner(game, hints):
    board = chess.Board(game['gameFen'])
    for hint in hints:
        ply = hint['ply']
        for san in game['gameMoves'][len(board.move_stack):ply]:
            board.push_san(san)
        move = board.parse_san(hint['move'])
        ranked = probe(board, _engine, 22000, board.turn, 1, [move])
        if score(ranked[0]) < -155:
            continue
        yield {**game, **{k: v for k, v in hint.items() if k != 'move'},
               'level': 'Beginner', 'goal': 'defend', 'tacticPly': 0, 'solverMoves': 1,
               'moves': [hint['move']],
               'screen': {'played': game['gameMoves'][ply:ply+1] == [hint['move']],
                          'score': score(ranked[0])}}


def advanced_candidates(game, hint, board):
    ply, side = hint['ply'], board.turn
    allowed = [board.parse_san(san) for san in hint['allowed']]
    ranked = probe(board, _engine, 50000, side, len(allowed), allowed)
    if not ranked or score(ranked[0]) < -155:
        return
    played = game['gameMoves'][ply:ply + 9]
    for row in ranked:
        if score(row) < max(-155, score(ranked[0]) - 115):
            continue
        root = row['move']
        after = pushed(board, board.parse_san(root))
        if after.is_game_over() or mate_replies(after):
            continue
        lines = [row['line']]
        if len(row['line']) < 10 or len(allowed) > 1:
            lines += [deep['line'] for deep in probe(board, _engine, 100000, side, 1,
                                                     [board.parse_san(root)])]
        if played[:1] == [root]:
            lines.insert(0, played)
        found = set()
        for length in (7, 9):
            for pv in lines:
                line = pv[:length]
                if len(line) != length or tuple(line) in found:
                    continue
                found.add(tuple(line))
                trace = advanced_trace(board, line)
                if not depth_witness(trace) or any(step['opponentMates'] for step in trace['steps']):
                    continue
                if len(pv) > length:
                    end = board.copy()
                    for san in pv[:length + 1]:
                        end.push_san(san)
                    if active_pressure(pressure(end)):
                        continue
                yield {**game, **{key: value for key, value in hint.items() if key != 'allowed'},
                       'level': 'D', 'goal': 'defend', 'tacticPly': 0,
                       'solverMoves': (length + 1) // 2, 'moves': line,
                       'sacrifices': trace['sacrifices'],
                       'screen': {'played': played[:length] == line, 'score': score(row)}}


def screen(task):
    game, cache_path, version, levels = task
    cache = ResearchCache(cache_path)
    before_stats = _engine.stats.copy()
    leads = []
    try:
        hits, positions = 0, 0
        if 'Beginner' in levels:
            hints, hit = beginner_geometry(game, cache, version)
            hits += int(hit)
            positions += len(hints)
            leads.extend(screen_beginner(game, hints))
        hints = []
        if set(levels) - {'Beginner'}:
            hints, hit = geometry(game, cache, version, advanced='D' in levels)
            hits += int(hit)
            positions += len(hints)
        board = chess.Board(game['gameFen'])
        for hint in hints:
            ply = hint['ply']
            for san in game['gameMoves'][len(board.move_stack):ply]:
                board.push_san(san)
            if 'D' in levels:
                leads.extend(advanced_candidates(game, hint, board))
            if not (set(levels) & {'A', 'B', 'C'}):
                continue
            side = board.turn
            best = probe(board, _engine, 22000, side, min(3, board.legal_moves.count()))
            if score(best[0]) < -155 or score(best[0]) > 2500:
                continue
            san = best[0]['move']
            move = board.parse_san(san)
            after = board.copy()
            after.push(move)
            if after.is_game_over() or mate_replies(after):
                continue
            offered = offers(board, move, after)
            costly = {row['move'] for row in offered if unequal(row)}
            played = game['gameMoves'][ply:ply+1] == [san]
            candidates = []
            if not costly:
                candidates.append(('A', [san]))
            replies = probe(after, _engine, 40000, side, min(4, after.legal_moves.count()))
            for row in replies:
                reply = row['move']
                if score(row) > score(replies[0]) + 75 or score(row) < -155:
                    continue
                follow = after.copy()
                follow.push_san(reply)
                if follow.is_game_over() or len(row['line']) < 2:
                    continue
                if reply in costly and any(o['move'] == reply and o['movedPiece'] for o in offered):
                    candidates.append(('C', [san, reply, row['line'][1]]))
                elif not costly and (threat_moves(follow) or follow.is_check()):
                    candidates.append(('B', [san, reply, row['line'][1]]))
            # Prioritize scarce B and C decisions over one-move fallbacks.
            for level in ('C', 'B', 'A'):
                selected = next((line for grade, line in candidates if grade == level), None)
                if selected is None:
                    continue
                if level == 'A' and not any(mate_replies(pushed(board, other))
                                            for other in list(board.legal_moves)[:12]):
                    continue
                leads.append({**game, **hint, 'level': level, 'goal': 'defend',
                              'tacticPly': 0, 'solverMoves': (len(selected) + 1) // 2,
                              'moves': selected,
                              'screen': {'played': played, 'score': score(best[0])}})
        return leads, {**{key: _engine.stats[key] - before_stats[key] for key in before_stats},
                       'geometryCacheHits': hits, 'geometryPositions': positions}
    finally:
        cache.close()
        _engine.stop_process()


def pushed(board, move):
    after = board.copy(stack=False)
    after.push(move)
    return after


def collect(games, *, cache, workers, output, max_games, levels, target, protected_games=()):
    started = time.perf_counter()
    version = code_version('collect_defensive_move.py', 'defensive_move_research.py')
    games = [g for g in games if (g.get('masterCredential') or any(
        g['headers'].get(side + 'Title') in ('FM', 'IM', 'GM') for side in ('White', 'Black')))
        and all(g['headers'].get(field, '?') not in ('?', '') for field in ('White', 'Black', 'Event', 'Date'))]
    if {'Beginner', 'D'} & set(levels):
        games = [game for game in games if game['gameId'] not in protected_games]
    if max_games:
        games = games[:max_games]
    totals, records, ids = Counter(), [], {level: set() for level in levels}
    stats = {'gamesExamined': 0}
    with ProcessPoolExecutor(max_workers=workers, initializer=initialize, initargs=(cache,)) as pool:
        for offset in range(0, len(games), 128):
            batch = games[offset:offset+128]
            for rows, metrics in pool.map(screen, [(game, cache, version, levels) for game in batch], chunksize=4):
                records.extend(rows)
                totals.update(metrics)
                for row in rows:
                    if row['level'] in ids:
                        ids[row['level']].add(row['gameId'])
            totals['gamesExamined'] += len(batch)
            stats = {**totals, 'eligibleGames': len(games),
                     'wallSeconds': time.perf_counter() - started,
                     'yieldByLevel': dict(Counter(row['level'] for row in records))}
            atomic_json(output, {'records': records, 'metrics': stats})
            if offset % 1024 == 0 or offset + len(batch) == len(games):
                print(stats, flush=True)
            if all(len(values) >= target for values in ids.values()):
                break
    return {'records': records, 'metrics': stats}
