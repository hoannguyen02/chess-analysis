"""Collect indexed loose-piece leads without promoting geometry to approval."""
from collections import Counter
from concurrent.futures import ProcessPoolExecutor
import time

import chess

from hanging_piece_research import LEVEL_MOVES, loose_capture, material, settled, probe, frames
from tactic_research import ResearchCache, CachedEngine, atomic_json, code_version, digest

_screen = None


def eligible(game):
    headers = game['headers']
    return (headers.get('Result') in ('1-0', '0-1')
            and all(headers.get(field, '?') not in ('?', '') for field in ('White', 'Black', 'Event', 'Date'))
            and (game.get('masterCredential') or
                 any(headers.get(side + 'Title') in ('FM', 'IM', 'GM') for side in ('White', 'Black'))))


def scan(task):
    game, cache_path, version = task
    cache = ResearchCache(cache_path)
    key = digest([version, game['gameKey'], game['headers']['Result']])
    found = cache.get('hanging-piece-geometry', key)
    if found is not None:
        cache.close()
        return found, True
    board = chess.Board(game['gameFen'])
    winner = game['headers']['Result'] == '1-0'
    found = []
    for ply in range(len(game['gameMoves']) + 1):
        if (ply >= max(12, len(game['gameMoves']) - 28)
                and board.turn == winner and abs(material(board, winner)) <= 330):
            candidates = [move for move in board.generate_legal_captures()
                          if loose_capture(board, move)]
            if candidates:
                found.append({'ply': ply, 'fen': board.fen(en_passant='fen'),
                              'moves': [board.san(move) for move in candidates]})
        if ply < len(game['gameMoves']):
            board.push_san(game['gameMoves'][ply])
    cache.put('hanging-piece-geometry', key, found)
    cache.close()
    return found, False


def initialize_screen(cache):
    global _screen
    _screen = CachedEngine(cache=cache)


def screen(task):
    game, hints = task
    board = chess.Board(game['gameFen'])
    lead = []
    before = _screen.stats.copy()
    try:
        for item in sorted(hints, key=lambda x: x['ply'], reverse=True):
            while len(board.move_stack) > item['ply']:
                board.pop()
            for san in game['gameMoves'][len(board.move_stack):item['ply']]:
                board.push_san(san)
            if board.is_game_over():
                continue
            side, baseline = board.turn, material(board, board.turn)
            for name in item['moves']:
                move = board.parse_san(name)
                played = game['gameMoves'][item['ply']:item['ply'] + 1] == [name]
                piece, target = board.piece_at(move.from_square), board.piece_at(move.to_square)
                threshold = min(200, max(100, 130 - baseline))
                after = board.copy()
                after.push(move)
                simple = settled(after, side, baseline, threshold)
                # A lone capture is worth screening when played or available on
                # the last solver turn. Earlier off-line opportunities often
                # lose a race and remain in the geometry cache as leads.
                if simple and not played and item['ply'] < len(game['gameMoves']) - 2:
                    continue
                ranked = probe(board, _screen, 20000, side, min(3, board.legal_moves.count()))
                best = ranked[0]
                if best['move'] != name or best['mate'] is not None or best['cp'] < 145:
                    continue
                line = []
                for index, _, _, position in frames(board, best['line'][:9]):
                    if not settled(position, side, baseline, threshold):
                        continue
                    line = best['line'][:index + 1]
                    break
                if not line:
                    continue
                solver_moves = (len(line) + 1) // 2
                previous = board.copy()
                previous.pop()
                candidate = {**game, 'fen': item['fen'], 'ply': item['ply'],
                             'moves': line, 'goal': 'material',
                             'solverMoves': solver_moves, 'tacticPly': 0, 'payoffPly': len(line)-1,
                             'targetSquare': chess.square_name(move.to_square),
                             'minimumGain': threshold, 'sacrifices': [],
                             'screen': {'cp': best['cp'], 'gap': best['cp'] - (ranked[1]['cp'] if len(ranked) > 1 and ranked[1]['cp'] is not None else 0),
                                        'mover': piece.symbol().upper(), 'target': target.symbol().upper(),
                                        'check': after.is_check(), 'inCheck': board.is_check(), 'played': played},
                             'previousMove': {'fen': previous.fen(en_passant='fen'),
                                              'move': game['gameMoves'][item['ply'] - 1]}}
                # B and C* can have the same length. Preserve both leads for
                # review of the defence and the difficulty of the decision.
                lead.extend({**candidate, 'level': level} for level, counts in LEVEL_MOVES.items()
                            if solver_moves in counts)
    finally:
        _screen.stop_process()
    return lead, {key: _screen.stats[key] - before[key] for key in before}


def collect(games, *, cache, workers, output, max_games=0):
    """Checkpoint exact completed game batches and retain unused leads."""
    started = time.perf_counter()
    version = code_version('collect_hanging_piece.py', 'hanging_piece_research.py')
    games = [game for game in games if eligible(game)]
    if max_games:
        games = games[:max_games]
    totals, records = Counter(), []
    if not games:
        report = {'records': [], 'metrics': {'gamesExamined': 0, 'eligibleGames': 0,
                  'wallSeconds': time.perf_counter() - started, 'yieldByLevel': {}}}
        atomic_json(output, report)
        return report
    with ProcessPoolExecutor(max_workers=workers) as geometry, ProcessPoolExecutor(
            max_workers=workers, initializer=initialize_screen, initargs=(cache,)) as screens:
        for start in range(0, len(games), 128):
            batch = games[start:start + 128]
            geometry_rows = list(geometry.map(scan, [(game, cache, version) for game in batch], chunksize=4))
            totals['geometryCacheHits'] += sum(hit for _, hit in geometry_rows)
            totals['geometryPositions'] += sum(len(hints) for hints, _ in geometry_rows)
            work = [(game, hints) for game, (hints, _) in zip(batch, geometry_rows) if hints]
            for found, metrics in screens.map(screen, work):
                records.extend(found)
                totals.update(metrics)
            totals['gamesExamined'] += len(batch)
            stats = {**totals, 'wallSeconds': time.perf_counter() - started,
                     'eligibleGames': len(games), 'yieldByLevel': dict(Counter(r['level'] for r in records))}
            atomic_json(output, {'records': records, 'metrics': stats})
            if start % 512 == 0:
                print(stats, flush=True)
    return {'records': records, 'metrics': stats}
