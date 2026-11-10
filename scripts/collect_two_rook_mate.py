"""Collect short two-rook mating leads from complete indexed master games."""
from collections import Counter
from concurrent.futures import ProcessPoolExecutor
import hashlib
import json
from pathlib import Path
import re
import time

import chess
import chess.engine

from discovery_research import pv_san
from research_index import disposition, master_credential
from tactic_research import CachedEngine, ResearchCache, atomic_json, code_version, digest
from two_rook_mate_research import (LEVEL_MOVES, SearchLimit, ShortMate, compare_defences,
                                   legacy, proof_line, rook_roles, sacrifice_allowance, shape)

TOPIC = 'two-rook-mate'
SCREEN_NODES = 14000
TAIL_TURNS = 4
DESTINATION = re.compile(r'([a-h][1-8])(?:=[QRBN])?[+#]?$')


def played_offers(moves, side):
    """Cheap SAN leads for a non-rook offer followed by active rook play."""
    result = set()
    for ply in range(10 if side else 11, len(moves) - 2, 2):
        first, reply = moves[ply:ply + 2]
        if first.startswith(('R', 'K', 'O')) or 'x' not in reply:
            continue
        dest, taken = DESTINATION.search(first), DESTINATION.search(reply)
        if (dest and taken and dest.group(1) == taken.group(1)
                and any(move.startswith('R') and move.endswith(('+', '#'))
                        for move in moves[ply + 2:ply + 11:2])):
            result.add(ply)
    return result


def source_games(db, extended=False, source_filters=(), *, all_wins=False, draws_only=False):
    rows = db.execute('''SELECT g.game_key, g.fen, g.moves, g.headers, l.game_id,
                                 e.credential, g.title_evidence
                          FROM games g LEFT JOIN game_legacy_ids l USING (game_key)
                          LEFT JOIN research_game_evidence e USING (game_key)
                          WHERE e.credential IS NOT NULL OR g.title_evidence != '[]'
                          ORDER BY g.preferred DESC, g.game_key''')
    offered, played, finished, other = [], [], [], []
    results = ('1/2-1/2',) if draws_only else ('1-0', '0-1')
    for key, fen, raw_moves, raw_headers, ident, raw_credential, _ in rows:
        headers = json.loads(raw_headers)
        if re.search(r'simul|blind|odds|consult|rapid exhibition', headers.get('Event', ''), re.I):
            continue
        moves = json.loads(raw_moves)
        if len(moves) < 15 or headers.get('Result') not in results:
            continue
        tail = moves[-14:] if extended else moves[-6:]
        offers = played_offers(moves, headers['Result'] == '1-0') if extended and fen == chess.STARTING_FEN else set()
        if moves[-1].endswith('#'):
            # A played two-rook mate necessarily ends with a rook check or a
            # discovered rook check. Keep the latter even when SAN starts otherwise.
            group = played
        elif draws_only or all_wins or any(move.startswith('R') and move.endswith('+') for move in tail):
            group = finished
        elif offers:
            group = offered
        elif any(move.startswith('R') for move in tail):
            group = other
        else:
            continue
        refs = [{'url': url, 'sha256': sha, 'retrieved': when} for url, sha, when in
                db.execute('SELECT url,sha256,retrieved FROM sources WHERE game_key=? ORDER BY url,sha256', (key,))
                if len(sha or '') == 64 and when and url.startswith('https://')]
        if not refs:
            continue
        if source_filters and not any(part in ref['url'] for part in source_filters for ref in refs):
            continue
        credential = json.loads(raw_credential) if raw_credential else master_credential(headers, refs)
        if not credential and not any(headers.get(color + 'Title') in ('FM', 'IM', 'GM')
                                      for color in ('White', 'Black')):
            continue
        record = {'gameId': ident, 'gameFen': fen, 'gameMoves': moves, 'headers': headers,
                  'source': next((ref['url'] for ref in refs if credential and
                                  ref['sha256'] == credential.get('sourceSha256')), refs[0]['url']),
                  'sourceReferences': refs}
        if credential:
            record['masterCredential'] = credential
        group.append(record)
    return [*played, *finished, *offered, *other]


def geometry(record, extended=False):
    game = chess.Board(record['gameFen'])
    side = record['headers']['Result'] == '1-0'
    frames, uci = [], []
    sans = record['gameMoves']
    offers = played_offers(sans, side) if extended and game.turn == chess.WHITE else set()
    turns = 8 if extended else TAIL_TURNS
    for index, san in enumerate(sans):
        if index in offers or index >= len(sans) - 2 * turns - 1:
            frames.append((index, game.copy()))
        move = game.parse_san(san)
        uci.append(move.uci())
        game.push(move)
    frames.append((len(sans), game))
    ident = hashlib.sha256(' '.join(uci).encode()).hexdigest()[:16]
    if record.get('gameId') not in (None, ident):
        raise ValueError('Indexed game identity mismatch')
    played_mate = game.is_checkmate()
    played_rooks = rook_roles(game, side) if played_mate else None
    if played_mate and not played_rooks and not extended:
        return ident, []
    seeds = []
    for ply, board in sorted(frames, key=lambda frame: (frame[0] in offers, frame[0]), reverse=True):
        king = board.king(not side)
        if (board.turn != side or len(board.pieces(chess.ROOK, side)) != 2
                or abs(legacy.material(board, side)) > 900 or king is None or board.is_game_over()
                or (not played_mate and chess.square_rank(king) in range(2, 6)
                    and chess.square_file(king) in range(2, 6))):
            continue
        previous = board.copy()
        previous.pop()
        seed = {'ply': ply, 'fen': board.fen(en_passant='fen'), 'uciHistory': uci[:ply],
                'previousMove': {'fen': previous.fen(en_passant='fen'), 'move': sans[ply - 1]},
                'playedOffer': ply in offers}
        if played_mate and len(sans) - ply in (1, 3, 5):
            seed['playedLine'] = sans[ply:]
        seeds.append(seed)
    return ident, seeds


def screen(task):
    record, cache_path, version, extended = task
    cache = ResearchCache(cache_path)
    engine = None
    metrics = Counter(games=1)
    try:
        key = digest({'source': record, 'detector': version, 'extended': extended})
        saved = cache.get('two-rook-game-geometry', key)
        if saved is None:
            ident, seeds = geometry(record, extended)
            cache.put('two-rook-game-geometry', key, [ident, seeds])
            metrics['replayed'] += 1
        else:
            ident, seeds = saved
            metrics['geometryHits'] += 1
        found = {}
        for seed in seeds:
            board = chess.Board(record['gameFen'])
            for move in seed['uciHistory']:
                board.push_uci(move)
            line = seed.get('playedLine')
            if line is None or shape(board, line) is None:
                if engine is None:
                    engine = CachedEngine(cache=cache_path)
                limit = 60000 if seed.get('playedOffer') else SCREEN_NODES
                info = engine.analyse(board, chess.engine.Limit(nodes=limit))
                if info['score'].pov(board.turn).mate() not in (1, 2, 3):
                    continue
                line = pv_san(board, info['pv'])
            count = (len(line) + 1) // 2
            details = shape(board, line)
            if not details:
                continue
            if extended and count in LEVEL_MOVES['C*']:
                sacrificial = bool(details['sacrifices'])
                offer = details['sacrifices'][0] if sacrificial else None
                prefix = line[:offer['ply'] + 2] if offer else line[:1]
                allowance = sacrifice_allowance({'level': 'C', 'solverMoves': count,
                                                 'sacrifices': details['sacrifices']})
                try:
                    tree = ShortMate(board.turn, 42000, advanced=True).search(
                        board, count, 'two', tuple(prefix), allowance=allowance)
                except SearchLimit:
                    tree = None
                if tree:
                    revised = proof_line(board, tree)
                    revised_shape = shape(board, revised)
                    if (revised_shape and len(revised) == len(line)
                            and bool(revised_shape['sacrifices']) == sacrificial):
                        line, details = revised, revised_shape
            if details['sacrifices']:
                levels = ['C']
            else:
                levels = ['A'] if count in LEVEL_MOVES['A'] else ['B']
                replies = details['timeline'][0]['replies']
                if count in LEVEL_MOVES['C*'] and len(replies) > (2 if count == 2 else 1):
                    try:
                        comparison = compare_defences(board, count, line, 24000)
                    except (ValueError, SearchLimit):
                        pass  # Only a screening lead; the final review uses its full budget.
                    else:
                        if comparison['sampleRequiresDepth'] and comparison['contrastingReplies']:
                            levels.append('C*')
            root = board.parse_san(line[0])
            first = board.piece_at(root.from_square)
            family = f'{first.symbol().upper()}:{"check" if board.gives_check(root) else "quiet"}'
            for level in levels:
                found.setdefault((level, count), {
                    **record, **{field: seed[field] for field in ('ply', 'fen', 'previousMove')},
                    'gameId': ident, 'goal': 'mate', 'level': level, 'moves': line,
                    'family': family, 'solverMoves': count, 'sacrifices': details['sacrifices'],
                    'rookRoles': details['rookRoles'], 'endFen': details['endFen'],
                    'tacticPly': len(line) - 1})
        if engine:
            metrics.update(engine.stats)
        return list(found.values()), metrics
    finally:
        if engine:
            engine.quit()
        cache.close()


def collect(db, *, cache, workers, output, max_games, levels, target, existing=(),
            phase='tactics', source_filters=()):
    from research_candidates import import_candidates

    started = time.perf_counter()
    version = code_version('collect_two_rook_mate.py', 'two_rook_mate_research.py', 'collect-two-rook-games.py')
    existing = list(existing)
    protected = {row[0] for row in db.execute("SELECT game_id FROM research_decisions WHERE topic=? "
                                              "AND status IN ('approved','removed','transferred','manual','rejected')",
                                              (TOPIC,))}
    extended = phase == 'tails'
    games = [record for record in source_games(db, extended, source_filters)
             if record['gameId'] not in protected]
    if max_games:
        games = games[:max_games]
    found, metrics = [], Counter()
    counts = Counter(row['level'] for row in existing)
    selected_games = {row['gameId'] for row in existing}
    with ProcessPoolExecutor(max_workers=workers) as pool:
        for offset in range(0, len(games), 24):
            batch = games[offset:offset + 24]
            reviewed = list(pool.map(screen, ((record, str(cache), version, extended) for record in batch)))
            available = []
            for records, stats in reviewed:
                metrics.update(stats)
                available.extend(row for row in records if disposition(db, TOPIC, row) is None)
            import_candidates(db, available, topic=TOPIC, origin='indexed-two-rook-tail', stage='screened')
            # Prefer the scarcer B decision when the same game has both frames.
            for row in sorted(available, key=lambda row: row['level'], reverse=True):
                if (row['level'] in levels and counts[row['level']] < target
                        and row['gameId'] not in selected_games):
                    selected_games.add(row['gameId'])
                    counts[row['level']] += 1
                    found.append(row)
            report = {'records': found, 'metrics': {**metrics, 'seconds': time.perf_counter() - started,
                                                    'levels': dict(counts)}}
            atomic_json(Path(output), report)
            if offset % 240 == 0 or all(counts[level] >= target for level in levels):
                print(f'{metrics["games"]} source games screened; {dict(counts)} leads', flush=True)
            if all(counts[level] >= target for level in levels):
                break
    return {'records': found, 'metrics': {**metrics, 'seconds': time.perf_counter() - started,
                                          'levels': dict(counts)}}
