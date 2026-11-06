"""Fast full-game imports and cross-topic review decisions in the existing index."""
import hashlib
import json
from pathlib import Path
import sqlite3
import time

import chess

from tactic_research import ROOT, module, digest
from review_store import ReviewStore

index = module('tactics-index')
masters = module('collect-skewers')
DEFAULT_INDEX = ROOT / 'research/tactics-index.sqlite'


def master_credential(headers, references):
    """Reuse the established archive identity/year filter, not a guessed title."""
    for reference in references:
        url = reference['url']
        if not url.startswith('https://www.pgnmentor.com/players/') or not url.endswith('.zip'):
            continue
        player = url.rsplit('/', 1)[1][:-4]
        year = headers.get('Date', '')[:4]
        since = masters.MASTER_SINCE.get(player)
        if since and year.isdigit() and int(year) >= since and masters.master_identity(headers, player):
            return {'archivePlayer': player, 'conservativeMasterSince': since,
                    'basis': 'Existing collect-skewers.py archive-player identity and conservative post-title date filter; no invented source-header title.',
                    'sourceSha256': reference['sha256']}
    return None


def connect(path=DEFAULT_INDEX):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(path, timeout=60)
    index.initialize(db)
    db.executescript('''
      CREATE TABLE IF NOT EXISTS research_decisions (
        topic TEXT, position_key TEXT, level TEXT, game_id TEXT,
        status TEXT, reason TEXT, evidence_hash TEXT,
        PRIMARY KEY(topic,position_key,level,game_id));
      CREATE TABLE IF NOT EXISTS research_corpora (
        input_sha256 TEXT PRIMARY KEY, input_path TEXT, complete INTEGER,
        next_record INTEGER, records INTEGER, manifest TEXT);
      CREATE TABLE IF NOT EXISTS research_game_evidence (
        game_key TEXT PRIMARY KEY, credential TEXT NOT NULL);
    ''')
    return db


def import_corpus(db, path, manifest, index_motifs=False):
    """Replay each previously unseen corpus once; checkpoint negative outcomes too.

    A metadata-only import saves complete games/provenance without pretending
    geometric tags were scanned. Existing import-archive can add those later.
    """
    path = Path(path)
    raw = path.read_bytes()
    key = digest({'input': hashlib.sha256(raw).hexdigest(), 'manifest': manifest,
                  'indexMotifs': index_motifs, 'importVersion': 2})
    old = db.execute('SELECT complete,next_record,records FROM research_corpora WHERE input_sha256=?', (key,)).fetchone()
    if old and old[0]:
        return {'reused': True, 'records': old[2], 'complete': True, 'seconds': 0.0}
    source_map = {row['url']: row for row in manifest['sources']}
    records = json.loads(raw)['records']
    start = old[1] if old else 0
    imported = old[2] if old else 0
    started = time.perf_counter()
    for offset, record in enumerate(records):
        if offset < start:
            continue
        ref = source_map[record['source']]
        if len(ref['sha256']) != 64 or not ref['retrieved']:
            raise ValueError('A checksummed, dated source manifest is required')
        board = chess.Board(record['gameFen'])
        uci = []
        for san in record['gameMoves']:
            move = board.parse_san(san)
            uci.append(move.uci())
            board.push(move)
        if hashlib.sha256(' '.join(uci).encode()).hexdigest()[:16] != record['gameId']:
            raise ValueError('Prepared corpus game identity mismatch')
        game_key = hashlib.sha256((record['gameFen'] + ' ' + ' '.join(uci)).encode()).hexdigest()
        # import_game validates the full game too. In metadata-only mode insert
        # the already replayed game directly, avoiding a second SAN replay.
        with db:
            if index_motifs:
                index.import_game(db, {**record, 'gameKey': game_key},
                                  {'source': ref['url'], **ref}, detect=True)
            else:
                headers = record['headers']
                if headers.get('Variant', 'Standard').lower() not in ('standard', 'chess'):
                    raise ValueError('Unsupported game variant')
                titles, clock, preferred, reason = index.priority(headers)
                db.execute('INSERT OR IGNORE INTO games VALUES (?,?,?,?,?,?,?,?,?,?)', (
                    game_key, record['gameFen'], json.dumps(record['gameMoves']), json.dumps(headers, ensure_ascii=False),
                    clock[0] if clock else None, clock[1] if clock else None,
                    headers.get('TimeControl', ''), json.dumps(titles), int(preferred), reason))
                db.execute('INSERT OR IGNORE INTO sources VALUES (?,?,?,?)',
                           (game_key, ref['url'], ref['sha256'], ref['retrieved']))
            credential = record.get('masterCredential') or master_credential(record['headers'], [ref])
            if credential:
                db.execute('INSERT OR REPLACE INTO research_game_evidence VALUES (?,?)',
                           (game_key, json.dumps(credential)))
            imported += 1
            db.execute('INSERT OR REPLACE INTO game_legacy_ids VALUES (?,?)', (game_key, record['gameId']))
            db.execute('INSERT OR REPLACE INTO research_corpora VALUES (?,?,?,?,?,?)',
                       (key, str(path), 0, offset + 1, imported, json.dumps(manifest)))
        if (offset + 1) % 1000 == 0:
            print(f'Indexed {offset + 1}/{len(records)} complete games', flush=True)
    with db:
        db.execute('UPDATE research_corpora SET complete=1 WHERE input_sha256=?', (key,))
    return {'reused': False, 'records': imported, 'complete': True,
            'seconds': time.perf_counter() - started, 'motifsIndexed': index_motifs}


def sync_discovery(db):
    """Do not make B-specific rejections into exclusions for every other level."""
    fixtures = ROOT / 'scripts/fixtures/discovery'
    decisions = []
    review_sources = [(path, json.loads(path.read_text())) for path in (
        fixtures / 'level-a-curation.json', fixtures / 'upper-curation.json')]
    review_sources += [(fixtures / ('expansion-evidence.json#' + key), data)
                       for key, data in ReviewStore(fixtures / 'expansion-evidence.json').records.items()
                       if key.endswith('-review')]
    for path, data in review_sources:
        for row in data.get('editorialReviews', data.get('reviews', [])):
            if not row.get('fen'):
                continue
            decisions.append((row, path))
    with db:
        db.execute("DELETE FROM research_decisions WHERE topic='discovery'")
        for row, path in decisions:
            key = index.pkey(row['fen'])[0]
            level = row.get('level') or row.get('originalLevel') or ('A' if path.name.startswith('level-a') else 'B')
            db.execute('INSERT OR REPLACE INTO research_decisions VALUES (?,?,?,?,?,?,?)', (
                'discovery', key, level, row.get('gameId', ''),
                'approved' if row['decision'] == 'keep' else 'rejected', row['reason'],
                digest({'file': str(path.relative_to(ROOT)), 'record': row})))
        # The collection's durable exclusions are game-wide, unlike a rejected
        # B candidate that may still fit C. Preserve that distinction.
        for row in json.loads((fixtures / 'excluded.json').read_text()):
            key = index.pkey(row['fen'])[0] if row.get('fen') else ''
            db.execute('INSERT OR REPLACE INTO research_decisions VALUES (?,?,?,?,?,?,?)', (
                'discovery', key, '*', row['gameId'], 'rejected', row['reason'], digest(row)))
        # Owner decisions override editorial classifications and survive rebuilds.
        adjustments = json.loads((ROOT / 'src/lib/server/practice-adjustments.json').read_text())
        for entry in adjustments:
            ref = entry['reference']
            if ref['scope'] != '/discovered-attack':
                continue
            key = index.pkey(ref['fen'])[0]
            status = 'removed' if entry['removed'] else 'transferred' if entry.get('destinationScope', ref['scope']) != ref['scope'] else 'manual'
            existing = db.execute("SELECT game_id FROM research_decisions WHERE topic='discovery' AND position_key=? LIMIT 1", (key,)).fetchone()
            ident = existing[0] if existing else (ref.get('gameReference') or {}).get('id', '')
            db.execute("DELETE FROM research_decisions WHERE topic='discovery' AND position_key=?", (key,))
            db.execute('INSERT INTO research_decisions VALUES (?,?,?,?,?,?,?)', (
                'discovery', key, entry.get('level') or ref['baseLevel'], ident,
                status, entry.get('note') or 'Saved owner review decision', digest(entry)))
    return dict(db.execute("SELECT status,count(*) FROM research_decisions WHERE topic='discovery' GROUP BY status"))


def disposition(db, topic, record):
    key = index.pkey(record['fen'])[0]
    rows = db.execute('SELECT level,status,reason FROM research_decisions WHERE topic=? AND '
                      '(position_key=? OR (level=\'*\' AND game_id=?))',
                      (topic, key, record.get('gameId', ''))).fetchall()
    # A manual classification prevents accidentally adding it again at another level.
    for level, status, reason in rows:
        if status in ('removed', 'transferred', 'manual'):
            return {'status': status, 'reason': reason, 'level': level}
    for level, status, reason in rows:
        if level in (record['level'], '*') or status == 'approved':
            return {'status': status, 'reason': reason, 'level': level}
    return None


def export_games(db, output):
    output = Path(output)
    signature = digest({'games': db.execute('SELECT game_key,headers,preferred FROM games ORDER BY game_key').fetchall(),
                        'sources': db.execute('SELECT game_key,url,sha256,retrieved FROM sources ORDER BY game_key,url,sha256').fetchall(),
                        'credentials': db.execute('SELECT game_key,credential FROM research_game_evidence ORDER BY game_key').fetchall(),
                        'exportVersion': 2})
    marker = output.with_suffix(output.suffix + '.manifest.json')
    if output.exists() and marker.exists() and json.loads(marker.read_text()).get('signature') == signature:
        return json.loads(marker.read_text())['count']
    records = []
    for key, fen, moves, headers in db.execute('SELECT game_key,fen,moves,headers FROM games ORDER BY preferred DESC,game_key'):
        moves = json.loads(moves)
        # Existing collector IDs exclude the initial FEN. Recompute during its
        # legal replay rather than inventing an identity from game_key prefixes.
        record = {'gameKey': key, 'gameFen': fen, 'gameMoves': moves, 'headers': json.loads(headers)}
        refs = [{'url': url, 'sha256': sha, 'retrieved': retrieved} for url, sha, retrieved in
                db.execute('SELECT url,sha256,retrieved FROM sources WHERE game_key=?', (key,))]
        record.update(source=refs[0]['url'], sourceReferences=refs)
        legacy = db.execute('SELECT game_id FROM game_legacy_ids WHERE game_key=?', (key,)).fetchone()
        if legacy is None:
            board = chess.Board(fen)
            uci = []
            for san in moves:
                move = board.parse_san(san); uci.append(move.uci()); board.push(move)
            legacy = (hashlib.sha256(' '.join(uci).encode()).hexdigest()[:16],)
            db.execute('INSERT INTO game_legacy_ids VALUES (?,?)', (key, legacy[0]))
        record['gameId'] = legacy[0]
        credential = db.execute('SELECT credential FROM research_game_evidence WHERE game_key=?', (key,)).fetchone()
        if credential:
            record['masterCredential'] = json.loads(credential[0])
        else:
            verified = master_credential(record['headers'], refs)
            if verified:
                record['masterCredential'] = verified
        records.append(record)
    from tactic_research import atomic_json
    atomic_json(output, {'records': records, 'complete': True, 'identityPolicy': 'recompute-from-complete-legal-game'})
    atomic_json(marker, {'signature': signature, 'count': len(records)})
    db.commit()
    return len(records)
