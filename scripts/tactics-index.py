#!/usr/bin/env python3
"""Index possible tactics from complete games; all automatic tags are leads.

The SQLite index is a local, rebuildable research artifact. Full games from the
candidate scans and source references are retained to support later verification.
No detected pattern is automatically accepted as an exercise.
"""
import argparse
import csv
import hashlib
import io
import importlib.util
import json
from pathlib import Path
import re
import sqlite3
import subprocess
import zipfile
import chess
import chess.pgn
from tactics_catalog import load_catalog, resolve_theme_id

ROOT=Path(__file__).resolve().parents[1]
MAP=ROOT/'scripts/fixtures/tactics-index/tactics-map.json'
DEFAULT_DB=ROOT/'research/tactics-index.sqlite'
TITLES={'FM','IM','GM'}
VALUES={chess.PAWN:1,chess.KNIGHT:3,chess.BISHOP:3,chess.ROOK:5,chess.QUEEN:9,chess.KING:100}

def initialize(conn):
    conn.executescript('''
    PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS games (game_key TEXT PRIMARY KEY, fen TEXT NOT NULL,
      moves TEXT NOT NULL, headers TEXT NOT NULL, initial_seconds INTEGER,
      increment_seconds INTEGER, time_control_raw TEXT, title_evidence TEXT NOT NULL,
      preferred INTEGER NOT NULL, priority_reason TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sources (game_key TEXT NOT NULL REFERENCES games(game_key),
      url TEXT NOT NULL, sha256 TEXT NOT NULL, retrieved TEXT NOT NULL,
      PRIMARY KEY(game_key,url,sha256));
    CREATE TABLE IF NOT EXISTS game_legacy_ids (game_key TEXT PRIMARY KEY,game_id TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS positions (position_key TEXT PRIMARY KEY, normalized_fen TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS occurrences (id INTEGER PRIMARY KEY, game_key TEXT NOT NULL REFERENCES games(game_key),
      position_key TEXT NOT NULL REFERENCES positions(position_key), ply INTEGER NOT NULL,
      fen TEXT NOT NULL, previous_fen TEXT, previous_move TEXT, played_move TEXT NOT NULL,
      played_uci TEXT NOT NULL, UNIQUE(game_key,ply));
    CREATE TABLE IF NOT EXISTS matches (occurrence_id INTEGER NOT NULL REFERENCES occurrences(id),
      theme TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'lead', origin TEXT NOT NULL,
      reason TEXT, PRIMARY KEY(occurrence_id,theme));
    CREATE TABLE IF NOT EXISTS lichess_games (lichess_id TEXT PRIMARY KEY, game_key TEXT NOT NULL REFERENCES games(game_key));
    CREATE TABLE IF NOT EXISTS puzzle_imports (dataset_sha256 TEXT NOT NULL,policy TEXT NOT NULL,scanned INTEGER NOT NULL, complete INTEGER NOT NULL, PRIMARY KEY(dataset_sha256,policy));
    CREATE TABLE IF NOT EXISTS puzzle_leads (puzzle_id TEXT PRIMARY KEY, game_id TEXT NOT NULL, game_url TEXT NOT NULL,
      pre_fen TEXT NOT NULL, moves TEXT NOT NULL, themes TEXT NOT NULL, dataset_sha256 TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'unresolved', reason TEXT);
    CREATE INDEX IF NOT EXISTS puzzle_game_id ON puzzle_leads(game_id,status);
    CREATE TABLE IF NOT EXISTS analysis_leads (occurrence_id INTEGER NOT NULL REFERENCES occurrences(id),
      theme TEXT NOT NULL, variation_hash TEXT NOT NULL, moves TEXT NOT NULL, settings TEXT NOT NULL,
      PRIMARY KEY(occurrence_id,theme,variation_hash));
    CREATE TABLE IF NOT EXISTS import_progress (url TEXT NOT NULL,sha256 TEXT NOT NULL,policy TEXT NOT NULL,
      scanned INTEGER NOT NULL, imported INTEGER NOT NULL, skipped INTEGER NOT NULL, complete INTEGER NOT NULL,
      PRIMARY KEY(url,sha256,policy));
    CREATE INDEX IF NOT EXISTS matches_theme ON matches(theme,status);
    CREATE INDEX IF NOT EXISTS occurrence_position ON occurrences(position_key);
    CREATE INDEX IF NOT EXISTS games_priority ON games(preferred);
    ''')

def parse_time_control(raw):
    """Return the initial base seconds and increment, or None when unknown."""
    if not raw or raw in ('-','?'):return None
    value=raw.strip()
    # Lichess PGN standard form: 600+5, 600 or stages 40/5400:1800+30.
    match=re.fullmatch(r'(?:\d+/)?(\d+)(?::(?:\d+/)?\d+)*(?:\+(\d+))?',value)
    if match:return int(match.group(1)),int(match.group(2) or 0)
    match=re.search(r'(\d+)\s+minutes?\b',value,re.I)
    if match:
        increment=re.search(r'(\d+)\s+second\s+increment',value,re.I)
        return int(match.group(1))*60,int(increment.group(1)) if increment else None
    return None

def priority(headers):
    titles={side:headers.get(side+'Title','').upper() for side in ('White','Black')
            if headers.get(side+'Title','').upper() in TITLES}
    clock=parse_time_control(headers.get('TimeControl',''))
    preferred=bool(titles and clock and clock[0]>=600)
    if preferred:reason='source-reported FM/IM/GM and initial clock at least 600 seconds'
    elif not titles:reason='no FM/IM/GM title reported in source headers'
    elif clock is None:reason='time control unavailable or unsupported'
    else:reason='initial clock below 600 seconds'
    return titles,clock,preferred,reason

def pkey(fen):
    normalized=' '.join(fen.split()[:4])
    return hashlib.sha256(normalized.encode()).hexdigest(),normalized

def detectors(before,move,after):
    """Fast, intentionally permissive geometric detectors for lead indexing."""
    side=before.turn;enemy=not side;tags=set();to=move.to_square
    if before.is_capture(move) and not before.is_en_passant(move):
        captured=before.piece_at(to)
        if captured:
            for square,piece in before.piece_map().items():
                if (piece.color==enemy and piece.piece_type!=chess.KING and square!=to
                    and to in before.attackers(enemy,square) and before.attackers(side,square)):
                    tags.add('capturingDefender');break
    attacked=[square for square in after.attacks(to)
              if after.piece_at(square) and after.color_at(square)==enemy]
    if len(attacked)>=2:tags.add('fork')
    for square,piece in after.piece_map().items():
        if (piece.color==enemy and piece.piece_type!=chess.KING and
            after.is_pinned(enemy,square) and not before.is_pinned(enemy,square)):
            tags.add('pin');break
    moved=after.piece_at(to)
    if moved and moved.piece_type in (chess.BISHOP,chess.ROOK,chess.QUEEN):
        for dx,dy in [(1,0),(-1,0),(0,1),(0,-1),(1,1),(1,-1),(-1,1),(-1,-1)]:
            if moved.piece_type==chess.BISHOP and not(dx and dy):continue
            if moved.piece_type==chess.ROOK and dx and dy:continue
            x=chess.square_file(to)+dx;y=chess.square_rank(to)+dy;targets=[]
            while 0<=x<8 and 0<=y<8:
                piece=after.piece_at(chess.square(x,y))
                if piece:
                    if piece.color!=enemy:break
                    targets.append(piece)
                    if len(targets)==2:
                        if targets[0].piece_type in (chess.ROOK,chess.QUEEN,chess.KING) and targets[1].piece_type in (chess.KNIGHT,chess.BISHOP,chess.ROOK,chess.QUEEN) and VALUES[targets[0].piece_type]>VALUES[targets[1].piece_type]:tags.add('skewer')
                        break
                x+=dx;y+=dy
    for square,piece in after.piece_map().items():
        if piece.color!=enemy:continue
        for attacker in after.attackers(side,square):
            if attacker==to:continue
            slider=after.piece_at(attacker)
            if (slider and slider.piece_type in (chess.BISHOP,chess.ROOK,chess.QUEEN)
                and before.piece_at(attacker)==slider and attacker not in before.attackers(side,square)
                and chess.between(attacker,square) & chess.BB_SQUARES[move.from_square]):
                tags.add('discoveredCheck' if piece.piece_type==chess.KING else 'discoveredAttack')
    if after.is_check() and len(after.checkers())>=2:tags.add('doubleCheck')
    if move.promotion:
        tags.add('promotion')
        if move.promotion!=chess.QUEEN:tags.add('underPromotion')
    if before.is_en_passant(move):tags.add('enPassant')
    if before.is_castling(move):tags.add('castling')
    if after.is_checkmate():
        tags.add('mate');king=after.king(enemy)
        if king is not None and chess.square_rank(king)==(7 if enemy==chess.BLACK else 0):tags.add('backRankMate')
    if after.is_stalemate():tags.add('stalemate')
    return tags

def import_game(conn,record,source,detect=True):
    headers=record['headers']
    if headers.get('Variant','Standard').lower() not in ('standard','chess'):
        return 'unsupported-variant'
    board=chess.Board(record['gameFen']);frames=[];uci=[];previous=None
    try:
        for ply,san in enumerate(record['gameMoves']):
            move=board.parse_san(san);uci.append(move.uci());before=board.copy(stack=False) if detect else None;actual=board.san(move);board.push(move)
            tags=detectors(before,move,board) if detect else set()
            if tags:frames.append((ply,before.fen(),previous,actual,move.uci(),tags))
            if detect:previous={'fen':before.fen(),'move':actual}
    except ValueError as error:
        raise ValueError(f'invalid game replay: {error}') from error
    game_key=hashlib.sha256((record['gameFen']+' '+' '.join(uci)).encode()).hexdigest()
    if game_key!=record['gameKey']:raise ValueError('game key does not match complete move sequence')
    conn.execute('INSERT OR REPLACE INTO game_legacy_ids VALUES (?,?)',
                 (game_key,hashlib.sha256(' '.join(uci).encode()).hexdigest()[:16]))
    titles,clock,preferred,reason=priority(headers)
    conn.execute('INSERT OR IGNORE INTO games VALUES (?,?,?,?,?,?,?,?,?,?)',(
        game_key,record['gameFen'],json.dumps(record['gameMoves']),json.dumps(headers,ensure_ascii=False),
        clock[0] if clock else None,clock[1] if clock else None,headers.get('TimeControl',''),
        json.dumps(titles),int(preferred),reason))
    for header in ('Site','Link'):
        raw=headers.get(header,'')
        match=re.match(r'^https?://lichess\.org/([A-Za-z0-9]{8})(?:[/?#]|$)',raw)
        if match:
            existing=conn.execute('SELECT game_key FROM lichess_games WHERE lichess_id=?',(match.group(1),)).fetchone()
            if existing and existing[0]!=game_key:raise ValueError('Lichess game ID maps to different moves')
            conn.execute('INSERT OR IGNORE INTO lichess_games VALUES (?,?)',(match.group(1),game_key))
    conn.execute('INSERT OR IGNORE INTO sources VALUES (?,?,?,?)',
                 (game_key,source['source'],source['sha256'],source['retrieved']))
    # If another source supplies a preferred clock/title, preserve it rather than
    # downgrading; source-reported titles still need independent review.
    if preferred:
        conn.execute('UPDATE games SET preferred=1,initial_seconds=?,increment_seconds=?,time_control_raw=?,title_evidence=?,priority_reason=?,headers=? WHERE game_key=?',
                     (clock[0],clock[1],headers.get('TimeControl',''),json.dumps(titles),reason,json.dumps(headers,ensure_ascii=False),game_key))
    for ply,fen,previous,san,move_uci,tags in frames:
        pos_key,norm=pkey(fen)
        conn.execute('INSERT OR IGNORE INTO positions VALUES (?,?)',(pos_key,norm))
        conn.execute('INSERT OR IGNORE INTO occurrences(game_key,position_key,ply,fen,previous_fen,previous_move,played_move,played_uci) VALUES (?,?,?,?,?,?,?,?)',
                     (game_key,pos_key,ply,fen,previous['fen'] if previous else None,previous['move'] if previous else None,san,move_uci))
        occ=conn.execute('SELECT id FROM occurrences WHERE game_key=? AND ply=?',(game_key,ply)).fetchone()[0]
        for tag in tags:conn.execute('INSERT OR IGNORE INTO matches(occurrence_id,theme,status,origin) VALUES (?,?,?,?)',(occ,tag,'lead','played-move-geometry-v1'))
    return 'imported'

def import_scan(conn,path,limit=0):
    archive=json.loads(path.read_text())
    if not archive.get('complete'):raise ValueError('archive scan incomplete')
    unique={r['gameKey']:r for r in archive['records']};total=0;skipped=0
    for record in unique.values():
        try:
            with conn:
                result=import_game(conn,record,archive)
            if result=='imported':total+=1
            else:skipped+=1
        except ValueError as error:
            skipped+=1;print('skipped',record.get('gameKey','?')[:16],str(error),flush=True)
        if limit and total>=limit:break
    return {'source':archive['source'],'candidateGames':len(unique),'processed':total,'skipped':skipped}

def query(conn,theme,limit,preferred_only=False):
    rows=conn.execute('''SELECT g.game_key,g.headers,g.initial_seconds,g.increment_seconds,g.preferred,
      g.priority_reason,o.ply,o.fen,o.played_move,m.status,
      (SELECT json_group_array(json_object('url',s.url,'sha256',s.sha256,'retrieved',s.retrieved)) FROM sources s WHERE s.game_key=g.game_key),
      (SELECT json_group_array(json_object('theme',t.theme,'status',t.status,'origin',t.origin)) FROM matches t WHERE t.occurrence_id=o.id),
      (SELECT json_group_array(json_object('theme',a.theme,'moves',json(a.moves),'settings',json(a.settings))) FROM analysis_leads a WHERE a.occurrence_id=o.id)
      FROM matches m JOIN occurrences o ON o.id=m.occurrence_id JOIN games g ON g.game_key=o.game_key
      WHERE m.theme=? AND (?=0 OR g.preferred=1)
      ORDER BY g.preferred DESC,g.game_key,o.ply LIMIT ?''',(theme,int(preferred_only),limit))
    return [{'gameKey':r[0],'headers':json.loads(r[1]),'initialSeconds':r[2],
             'incrementSeconds':r[3],'preferred':bool(r[4]),'priorityReason':r[5],
             'ply':r[6],'fen':r[7],'playedMove':r[8],'status':r[9],
             'sources':json.loads(r[10] or '[]'),'tags':json.loads(r[11] or '[]'),
             'analysisLeads':json.loads(r[12] or '[]')} for r in rows]

def file_hash(path):
    digest=hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda:stream.read(1024*1024),b''):digest.update(block)
    return digest.hexdigest()

def import_lichess_puzzles(conn,path,master_only=False,limit=0):
    """Stream the official CSV with resumable row checkpoints; tags are leads."""
    map_bytes=MAP.read_bytes()
    known={x['lichessTheme']:x['id'] for x in load_catalog(MAP)['themes'] if x.get('lichessTheme')}
    digest=file_hash(path);policy=('master:' if master_only else 'all:')+hashlib.sha256(map_bytes).hexdigest()
    old=conn.execute('SELECT scanned,complete FROM puzzle_imports WHERE dataset_sha256=? AND policy=?',(digest,policy)).fetchone()
    resume=old[0] if old else 0
    if old and old[1]:return {'examined':0,'acceptedRows':0,'datasetSha256':digest,'complete':True}
    imported=0;examined=0;invalid=0;last=resume;limited=False;process=None
    if path.suffix=='.zst':
        process=subprocess.Popen(['zstd','-dc',str(path)],stdout=subprocess.PIPE)
        stream=io.TextIOWrapper(process.stdout,encoding='utf-8',newline='')
    else:stream=path.open(encoding='utf-8-sig',newline='')
    try:
        for number,row in enumerate(csv.DictReader(stream),1):
            if number<=resume:continue
            last=number;examined+=1;themes=set(row.get('Themes','').split())
            if master_only and not themes.intersection({'master','masterVsMaster','superGM'}):continue
            # Official broad tags do not establish a custom child motif.
            relevant=sorted({known[theme] for theme in themes if theme in known})
            if not relevant:continue
            match=re.match(r'^https://lichess\.org/([A-Za-z0-9]{8})(?:/(?:white|black))?(?:#(\d+))?$',row.get('GameUrl',''))
            moves=row.get('Moves','').split()
            if not match or len(moves)<2 or not row.get('PuzzleId'):
                invalid+=1;continue
            try:
                board=chess.Board(row['FEN']);first=chess.Move.from_uci(moves[0])
                if first not in board.legal_moves:raise ValueError('illegal opponent move')
                board.push(first)
                for uci in moves[1:]:
                    move=chess.Move.from_uci(uci)
                    if move not in board.legal_moves:raise ValueError('illegal sample')
                    board.push(move)
            except (ValueError,KeyError):invalid+=1;continue
            with conn:
                cur=conn.execute('INSERT OR IGNORE INTO puzzle_leads(puzzle_id,game_id,game_url,pre_fen,moves,themes,dataset_sha256,status) VALUES (?,?,?,?,?,?,?,?)',
                    (row['PuzzleId'],match.group(1),row['GameUrl'],row['FEN'],json.dumps(moves),json.dumps(relevant),digest,'unresolved'))
                conn.execute('INSERT OR REPLACE INTO puzzle_imports VALUES (?,?,?,0)',(digest,policy,number))
                imported+=cur.rowcount
            if limit and imported>=limit:
                limited=True;break
    finally:
        stream.close()
        if process:
            code=process.wait()
            if code and not limited:raise RuntimeError('zstd decompression failed')
    with conn:conn.execute('INSERT OR REPLACE INTO puzzle_imports VALUES (?,?,?,?)',(digest,policy,last,int(not limited)))
    return {'examined':examined,'acceptedRows':imported,'invalid':invalid,'datasetSha256':digest,
            'scannedRows':last,'complete':not limited,'masterTagIsOnlyALead':True}

def resolve_lichess_puzzles(conn,limit=0):
    """Match puzzles only to complete original games already in the index."""
    rows=conn.execute("SELECT p.puzzle_id,p.game_url,p.pre_fen,p.moves,p.themes,g.game_key,g.fen,g.moves FROM puzzle_leads p JOIN lichess_games l ON l.lichess_id=p.game_id JOIN games g ON g.game_key=l.game_key WHERE p.status='unresolved' ORDER BY g.preferred DESC,p.puzzle_id").fetchall()
    resolved=0;unmatched=0
    for puzzle_id,url,pre_fen,moves_json,themes_json,key,start,game_moves_json in rows:
        puzzle_moves=json.loads(moves_json);game_moves=json.loads(game_moves_json);before_key=pkey(pre_fen)[0]
        anchor=re.search(r'#(\d+)$',url);expected=int(anchor.group(1)) if anchor else None
        board=chess.Board(start);hits=[];previous=None
        for ply,san in enumerate(game_moves):
            move=board.parse_san(san)
            if pkey(board.fen())[0]==before_key and move.uci()==puzzle_moves[0] and (expected is None or expected==ply+1):
                before=board.fen();board.push(move);hits.append((ply+1,board.fen(),before,san))
            else:board.push(move)
        if len(hits)!=1:
            # Keep unresolved; another original game or ambiguous repeated FEN needs review.
            unmatched+=1;continue
        ply,fen,previous_fen,previous_move=hits[0]
        if ply>=len(game_moves):unmatched+=1;continue
        game=chess.Board(start)
        for san in game_moves[:ply]:game.push_san(san)
        played=game.parse_san(game_moves[ply]);played_san=game.san(played);line=[]
        try:
            for uci in puzzle_moves[1:]:
                move=chess.Move.from_uci(uci)
                if move not in game.legal_moves:raise ValueError('puzzle line differs')
                line.append(game.san(move));game.push(move)
        except ValueError:unmatched+=1;continue
        position_key,normalized=pkey(fen);line_hash=hashlib.sha256(' '.join(line).encode()).hexdigest()
        with conn:
            conn.execute('INSERT OR IGNORE INTO positions VALUES (?,?)',(position_key,normalized))
            conn.execute('INSERT OR IGNORE INTO occurrences(game_key,position_key,ply,fen,previous_fen,previous_move,played_move,played_uci) VALUES (?,?,?,?,?,?,?,?)',
                         (key,position_key,ply,fen,previous_fen,previous_move,played_san,played.uci()))
            occ=conn.execute('SELECT id FROM occurrences WHERE game_key=? AND ply=?',(key,ply)).fetchone()[0]
            for theme in json.loads(themes_json):
                conn.execute("INSERT OR IGNORE INTO matches(occurrence_id,theme,status,origin) VALUES (?,?,'lead','lichess-puzzle-v1')",(occ,theme))
                conn.execute('INSERT OR IGNORE INTO analysis_leads VALUES (?,?,?,?,?)',(occ,theme,line_hash,json.dumps(line),json.dumps({'puzzleId':puzzle_id,'gameUrl':url})))
            conn.execute("UPDATE puzzle_leads SET status='resolved',reason=NULL WHERE puzzle_id=?",(puzzle_id,))
        resolved+=1
        if limit and resolved>=limit:break
    return {'resolved':resolved,'unmatched':unmatched}

def import_candidates(conn,path,limit=0):
    """Index engine sample variations without confusing them with played moves."""
    data=json.loads(path.read_text());known={x['id'] for x in load_catalog(MAP)['themes']}
    imported=0;skipped=0
    for candidate in data['records']:
        source={'source':candidate['source'],'sha256':candidate['archiveSha256'],'retrieved':candidate['retrieved']}
        try:
            with conn:
                import_game(conn,candidate,source)
                original=chess.Board(candidate['gameFen']);previous=None
                for san in candidate['gameMoves'][:candidate['ply']]:
                    previous={'fen':original.fen(),'move':san};original.push_san(san)
                if original.fen()!=candidate['fen']:raise ValueError('candidate does not match game')
                actual=original.copy();actual_move=actual.parse_san(candidate['gameMoves'][candidate['ply']]);actual_san=actual.san(actual_move)
                position_key,normalized=pkey(candidate['fen'])
                conn.execute('INSERT OR IGNORE INTO positions VALUES (?,?)',(position_key,normalized))
                conn.execute('INSERT OR IGNORE INTO occurrences(game_key,position_key,ply,fen,previous_fen,previous_move,played_move,played_uci) VALUES (?,?,?,?,?,?,?,?)',
                    (candidate['gameKey'],position_key,candidate['ply'],candidate['fen'],previous['fen'] if previous else None,previous['move'] if previous else None,actual_san,actual_move.uci()))
                occurrence=conn.execute('SELECT id FROM occurrences WHERE game_key=? AND ply=?',(candidate['gameKey'],candidate['ply'])).fetchone()[0]
                analysis=chess.Board(candidate['fen']);tags={'capturingDefender'}
                for san in candidate['moves']:
                    move=analysis.parse_san(san);before=analysis.copy();analysis.push(move);tags.update(detectors(before,move,analysis))
                digest=hashlib.sha256(' '.join(candidate['moves']).encode()).hexdigest()
                for tag in tags & known:
                    conn.execute("INSERT OR IGNORE INTO matches(occurrence_id,theme,status,origin) VALUES (?,?,'lead','engine-sample-v1')",(occurrence,tag))
                    conn.execute('INSERT OR IGNORE INTO analysis_leads VALUES (?,?,?,?,?)',
                        (occurrence,tag,digest,json.dumps(candidate['moves']),json.dumps(data['settings'])))
                imported+=1
        except (ValueError,KeyError,IndexError) as error:
            skipped+=1;print('skipped candidate',candidate.get('candidateId','?'),str(error),flush=True)
        if limit and imported>=limit:break
    return {'candidates':len(data['records']),'imported':imported,'skipped':skipped,'collectorComplete':data.get('complete',False)}

def import_archive(conn,path,url,retrieved,preferred_only=False,limit=0):
    """Import complete PGN games, checkpointed and idempotent by game hash."""
    digest=hashlib.sha256(path.read_bytes()).hexdigest();policy='preferred' if preferred_only else 'all'
    row=conn.execute('SELECT scanned,imported,skipped,complete FROM import_progress WHERE url=? AND sha256=? AND policy=?',(url,digest,policy)).fetchone()
    scanned,imported,skipped,complete=row if row else (0,0,0,0)
    if complete:return {'source':url,'scanned':scanned,'imported':imported,'skipped':skipped,'complete':True}
    source={'source':url,'sha256':digest,'retrieved':retrieved};new=0
    with zipfile.ZipFile(path) as archive:
        names=[n for n in archive.namelist() if n.lower().endswith('.pgn')]
        if len(names)!=1:raise ValueError('expected exactly one PGN file')
        with archive.open(names[0]) as raw:
            stream=io.TextIOWrapper(raw,encoding='utf-8-sig',errors='replace');number=0
            while True:
                game=chess.pgn.read_game(stream)
                if game is None:break
                number+=1
                if number<=scanned:continue
                headers=dict(game.headers);eligible=not preferred_only or priority(headers)[2]
                if game.errors or headers.get('Variant','Standard').lower() not in ('standard','chess') or not eligible:
                    skipped+=1
                else:
                    board=game.board();start=board.fen();sans=[];uci=[]
                    try:
                        for move in game.mainline_moves():
                            if move not in board.legal_moves:raise ValueError('illegal game')
                            sans.append(board.san(move));uci.append(move.uci());board.push(move)
                        key=hashlib.sha256((start+' '+' '.join(uci)).encode()).hexdigest()
                        record={'gameKey':key,'gameFen':start,'gameMoves':sans,'headers':headers}
                        with conn:
                            import_game(conn,record,source)
                        imported+=1;new+=1
                    except ValueError:
                        skipped+=1
                scanned=number
                with conn:
                    conn.execute('INSERT OR REPLACE INTO import_progress VALUES (?,?,?,?,?,?,?)',(url,digest,policy,scanned,imported,skipped,0))
                if limit and new>=limit:return {'source':url,'scanned':scanned,'imported':imported,'skipped':skipped,'complete':False}
    with conn:
        conn.execute('INSERT OR REPLACE INTO import_progress VALUES (?,?,?,?,?,?,?)',(url,digest,policy,scanned,imported,skipped,1))
    return {'source':url,'scanned':scanned,'imported':imported,'skipped':skipped,'complete':True}

def export_leads(conn, theme, output, limit, preferred_only=False):
    """Export pending leads as a collector-compatible, source-preserving batch."""
    rows=conn.execute("""SELECT g.game_key,g.fen,g.moves,g.headers,o.ply,o.fen,o.played_move,
       s.url,s.sha256,s.retrieved
       FROM matches m JOIN occurrences o ON o.id=m.occurrence_id
       JOIN games g ON g.game_key=o.game_key JOIN sources s ON s.game_key=g.game_key
       WHERE m.theme=? AND m.status='lead' AND (?=0 OR g.preferred=1)
       GROUP BY g.game_key,o.ply ORDER BY g.preferred DESC,g.game_key,o.ply LIMIT ?""",(theme,int(preferred_only),limit))
    records=[]
    for key,start,moves,headers,ply,fen,san,url,sha,retrieved in rows:
        records.append({'gameKey':key,'gameFen':start,'gameMoves':json.loads(moves),
                        'headers':json.loads(headers),'ply':ply,'fen':fen,'move':san,
                        'source':url,'archiveSha256':sha,'retrieved':retrieved})
    payload={'complete':True,'source':'shared-tactics-index',
             'sha256':hashlib.sha256(json.dumps(records,sort_keys=True).encode()).hexdigest(),
             'retrieved':'index-export','records':records}
    temp=output.with_suffix(output.suffix+'.tmp');temp.write_text(json.dumps(payload,ensure_ascii=False));temp.replace(output)
    return len(records)

def sync_excluded(conn):
    """Apply durable position or game exclusions, including stale approvals."""
    path=ROOT/'scripts/fixtures/removing-defender/excluded.json'
    if not path.exists():return 0
    count=0
    for item in json.loads(path.read_text())['records']:
        key=pkey(item['fen'])[0] if item.get('fen') else None
        game=item.get('gameId','')
        if not key and not game:continue
        rows=conn.execute("SELECT o.id FROM occurrences o JOIN matches m ON m.occurrence_id=o.id WHERE m.theme='capturingDefender' AND ((? IS NOT NULL AND o.position_key=?) OR (?<>'' AND o.game_key LIKE ?))",(key,key,game,game+'%')).fetchall()
        for (occurrence,) in rows:
            conn.execute("UPDATE matches SET status='rejected',reason=? WHERE occurrence_id=? AND theme='capturingDefender'",(item.get('reason','Editorial exclusion'),occurrence));count+=1
    conn.commit();return count

def sync_approved(conn):
    """Reflect explicitly approved defender exercises without inferring approval."""
    path=ROOT/'scripts/fixtures/removing-defender/approved.json'
    if not path.exists():return 0
    count=0
    exclusions_path=ROOT/'scripts/fixtures/removing-defender/excluded.json'
    exclusions=json.loads(exclusions_path.read_text())['records'] if exclusions_path.exists() else []
    for record in json.loads(path.read_text())['records']:
        if record.get('status')!='approved' or not record.get('gameSource'):continue
        ex=record['exercise'];ref=ex.get('gameReference',{})
        if any(item.get('id')==record['id'] or (item.get('fen') and pkey(item['fen'])[0]==pkey(ex['fen'])[0]) or (item.get('gameId') and item['gameId']==ref.get('id')) for item in exclusions):continue
        exercise=record['exercise'];source=record['gameSource'];board=chess.Board(source['fen']);uci=[]
        for san in source['lines'][0]:
            move=board.parse_san(san);uci.append(move.uci());board.push(move)
        key=hashlib.sha256((source['fen']+' '+' '.join(uci)).encode()).hexdigest()
        row=conn.execute('SELECT id FROM occurrences WHERE game_key=? AND ply=?',(key,exercise['gameReference']['ply'])).fetchone()
        if row:
            conn.execute("INSERT INTO matches(occurrence_id,theme,status,origin,reason) VALUES (?,?,?,?,?) ON CONFLICT(occurrence_id,theme) DO UPDATE SET status='approved',reason=excluded.reason",(row[0],'capturingDefender','approved','editorial-sync','Approved exercise '+record['id']))
            count+=1
    conn.commit();return count

def main():
    p=argparse.ArgumentParser();p.add_argument('--db',type=Path,default=DEFAULT_DB)
    sub=p.add_subparsers(dest='command',required=True)
    load=sub.add_parser('import-scans');load.add_argument('inputs',nargs='+',type=Path);load.add_argument('--limit-games',type=int,default=0)
    puzzles=sub.add_parser('import-lichess-puzzles');puzzles.add_argument('input',type=Path);puzzles.add_argument('--master-only',action='store_true');puzzles.add_argument('--limit',type=int,default=0)
    resolve=sub.add_parser('resolve-lichess-puzzles');resolve.add_argument('--limit',type=int,default=0)
    candidate=sub.add_parser('import-candidates');candidate.add_argument('input',type=Path);candidate.add_argument('--limit',type=int,default=0)
    archive=sub.add_parser('import-archive');archive.add_argument('archive',type=Path);archive.add_argument('--source',required=True);archive.add_argument('--retrieved',required=True);archive.add_argument('--preferred-only',action='store_true');archive.add_argument('--limit-games',type=int,default=0)
    show=sub.add_parser('query');show.add_argument('--theme',required=True);show.add_argument('--limit',type=int,default=10);show.add_argument('--preferred-only',action='store_true')
    export=sub.add_parser('export-leads');export.add_argument('--theme',required=True);export.add_argument('--output',type=Path,required=True);export.add_argument('--limit',type=int,default=1000);export.add_argument('--preferred-only',action='store_true')
    status=sub.add_parser('set-status');status.add_argument('--game-key',required=True);status.add_argument('--ply',type=int,required=True);status.add_argument('--theme',required=True);status.add_argument('--status',choices=['lead','reviewed','rejected'],required=True);status.add_argument('--reason',required=True)
    sub.add_parser('sync-approved')
    sub.add_parser('stats')
    sub.add_parser('validate-map')
    args=p.parse_args()
    catalog=load_catalog(MAP)
    if args.command=='validate-map':
        print(json.dumps({'version':catalog['version'],'themes':len(catalog['themes']),
                          'priorities':{str(n):sum(t.get('priority')==n for t in catalog['themes']) for n in (1,2,3)},
                          'levelSuitabilityAssessed':sum('levels' in t for t in catalog['themes']),
                          'levelSuitabilityUnassessed':[t['id'] for t in catalog['themes'] if 'levels' not in t]},indent=2))
        return
    if hasattr(args,'theme'):
        try:args.theme=resolve_theme_id(catalog,args.theme)
        except ValueError as error:p.error(str(error))
    args.db.parent.mkdir(parents=True,exist_ok=True)
    conn=sqlite3.connect(args.db);initialize(conn)
    try:
        if args.command=='import-scans':
            print(json.dumps([import_scan(conn,path,args.limit_games) for path in args.inputs],ensure_ascii=False,indent=2))
        elif args.command=='import-lichess-puzzles':
            print(json.dumps(import_lichess_puzzles(conn,args.input,args.master_only,args.limit),ensure_ascii=False,indent=2))
        elif args.command=='resolve-lichess-puzzles':
            print(json.dumps(resolve_lichess_puzzles(conn,args.limit),ensure_ascii=False,indent=2))
        elif args.command=='import-candidates':
            print(json.dumps(import_candidates(conn,args.input,args.limit),ensure_ascii=False,indent=2))
        elif args.command=='import-archive':
            print(json.dumps(import_archive(conn,args.archive,args.source,args.retrieved,args.preferred_only,args.limit_games),ensure_ascii=False,indent=2))
        elif args.command=='query':
            print(json.dumps(query(conn,args.theme,args.limit,args.preferred_only),ensure_ascii=False,indent=2))
        elif args.command=='export-leads':
            if str(args.output.resolve()).startswith(str(ROOT.resolve())+'/'):raise SystemExit('export must stay outside repository')
            print('exported',export_leads(conn,args.theme,args.output,args.limit,args.preferred_only),'leads')
        elif args.command=='set-status':
            row=conn.execute('SELECT m.status FROM matches m JOIN occurrences o ON o.id=m.occurrence_id WHERE o.game_key=? AND o.ply=? AND m.theme=?',(args.game_key,args.ply,args.theme)).fetchone()
            if not row:raise SystemExit('matching lead not found')
            if row[0]=='approved':raise SystemExit('approved records must be changed through their publication review')
            conn.execute('UPDATE matches SET status=?,reason=? WHERE theme=? AND occurrence_id=(SELECT id FROM occurrences WHERE game_key=? AND ply=?)',(args.status,args.reason,args.theme,args.game_key,args.ply));conn.commit();print('updated')
        elif args.command=='sync-approved':
            print('synced',sync_approved(conn),'approved game positions and',sync_excluded(conn),'excluded leads')
        else:
            output={'games':conn.execute('SELECT count(*) FROM games').fetchone()[0],
                    'positions':conn.execute('SELECT count(*) FROM positions').fetchone()[0],
                    'occurrences':conn.execute('SELECT count(*) FROM occurrences').fetchone()[0],
                    'preferredGames':conn.execute('SELECT count(*) FROM games WHERE preferred=1').fetchone()[0],
                    'analysisLeads':conn.execute('SELECT count(*) FROM analysis_leads').fetchone()[0],
                    'puzzleLeads':dict(conn.execute('SELECT status,count(*) FROM puzzle_leads GROUP BY status')), 
                    'themes':dict(conn.execute('SELECT theme,count(*) FROM matches GROUP BY theme ORDER BY theme'))}
            print(json.dumps(output,ensure_ascii=False,indent=2))
    finally:conn.close()
if __name__=='__main__':main()
