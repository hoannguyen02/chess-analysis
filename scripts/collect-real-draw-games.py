"""Mine complete drawn PGNs. Offline inputs + local Stockfish/Syzygy; no invented lines.
Usage: python3 scripts/collect-real-draw-games.py PGN... --output PATH --tables DIR
Existing real-game fixtures are retained; one source game per category and unique FENs.
"""
import argparse, collections, hashlib, json, pathlib, shutil
import chess, chess.engine, chess.pgn, chess.syzygy

parser = argparse.ArgumentParser()
parser.add_argument('pgns', nargs='+')
parser.add_argument('--output', required=True)
parser.add_argument('--tables', required=True)
parser.add_argument('--engine', default=shutil.which('stockfish'))
args = parser.parse_args()
base = pathlib.Path('scripts/fixtures/draw-practice')
output = pathlib.Path(args.output)
data = json.loads(output.read_text()) if output.exists() else json.loads((base / 'expanded-draw-sources.json').read_text())
data['games'].setdefault('fortress', [])
data['fortresses'] = []  # study-only sources are excluded from the active collection
engine = chess.engine.SimpleEngine.popen_uci(args.engine)
engine.configure({'Threads': 2, 'Hash': 128})
tables = chess.syzygy.open_tablebase(args.tables)
def position_key(fen): return ' '.join(fen.split()[:4])
def game_key(g):
    return hashlib.sha256((' '.join(m.uci() for m in g.mainline_moves()) + g.headers.get('White', '') + g.headers.get('Black', '')).encode()).hexdigest()
used = {cat:set() for cat in data['games']}
seen = set()
for cat, rows in data['games'].items():
    for row in rows:
        import io
        used[cat].add(game_key(chess.pgn.read_game(io.StringIO(row['pgn']))))
        seen.add(position_key(row['fen']))
# Avoid overlaps with the retained no-check repetition collection too.
import io
for row in json.loads((base / 'real-repetition-games.json').read_text()):
    g = chess.pgn.read_game(io.StringIO(row['pgn']))
    b = g.board()
    for move in list(g.mainline_moves())[:row['startPly']]: b.push(move)
    seen.add(position_key(b.fen(en_passant='fen')))
counts = collections.Counter(row['motif'] for row in data['games']['fortress'])
def colour(square): return (chess.square_file(square) + chess.square_rank(square)) % 2

def fortress(board):
    """Recognize named geometric barriers, not merely a 0.00 evaluation."""
    pm = board.piece_map()
    if len(pm) > 5: return None
    for defender in [chess.WHITE, chess.BLACK]:
        strong = not defender
        own = sorted(p.piece_type for p in pm.values() if p.color == defender and p.piece_type != chess.KING)
        opp = sorted(p.piece_type for p in pm.values() if p.color == strong and p.piece_type != chess.KING)
        dk, ak = board.king(defender), board.king(strong)
        if own == [] and opp in ([chess.PAWN], [chess.PAWN, chess.BISHOP]):
            pawn = next(iter(board.pieces(chess.PAWN, strong)))
            file, rank = chess.square_file(pawn), chess.square_rank(pawn)
            corner = chess.square(file, 7 if strong else 0)
            if file not in [0, 7] or (rank if strong else 7-rank) < 3: continue
            if chess.square_distance(dk, corner) > 1 or chess.square_distance(ak, corner) < 2: continue
            if chess.BISHOP in opp:
                bishop = next(iter(board.pieces(chess.BISHOP, strong)))
                if colour(bishop) == colour(corner): continue
                return 'wrong-bishop-rook-pawn', defender
            return 'rook-pawn-corner', defender
        if own == [chess.BISHOP] and opp == [chess.ROOK]:
            bishop = next(iter(board.pieces(chess.BISHOP, defender)))
            corners = [c for c in [chess.A1,chess.A8,chess.H1,chess.H8] if colour(c) != colour(bishop) and chess.square_distance(c,dk) <= 1]
            if corners: return 'bishop-safe-corner', defender
        if own == [chess.PAWN] and opp == [chess.QUEEN]:
            pawn = next(iter(board.pieces(chess.PAWN, defender)))
            file, rank = chess.square_file(pawn), chess.square_rank(pawn)
            corner = chess.square(file, 7 if defender else 0)
            if file in [0,2,5,7] and rank == (6 if defender else 1) and chess.square_distance(dk,pawn)<=1 and chess.square_distance(ak,corner)>=3:
                return 'queen-vs-seventh-rank-pawn', defender
    return None

def score(board, nodes):
    info = engine.analyse(board, chess.engine.Limit(nodes=nodes))
    return {'fen':board.fen(en_passant='fen'), 'cpWhite':info['score'].white().score(), 'depth':info.get('depth'), 'nodes':nodes}

def save():
    for rows in data['games'].values(): rows.sort(key=lambda row: row.get('gamePlyCount', row['startPly']+len(row['moves'])))
    output.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')

def record(g, boards, moves, start, end, cat, source, evidence=None, motif=None):
    b = boards[start]
    if position_key(b.fen(en_passant='fen')) in seen: return False
    replay = chess.Board(b.fen(en_passant='fen')); sans=[]
    for i,m in enumerate(moves[start:end]):
        if replay.is_game_over() or replay.is_repetition(3): return False
        sans.append(replay.san(m)); replay.push(m)
    if cat == 'perpetual-check' and not replay.is_repetition(3): return False
    row = dict(headers=dict(g.headers),fen=b.fen(en_passant='fen'),moves=sans,
        previousMove={'fen':boards[start-1].fen(en_passant='fen'),'move':boards[start-1].san(moves[start-1])},
        startPly=start, endPly=end, gamePlyCount=len(moves),
        pgn=g.accept(chess.pgn.StringExporter(headers=True,variations=False,comments=False)),sourceUrl=source,
        validation=evidence)
    if motif: row['motif']=motif
    data['games'][cat].append(row); seen.add(position_key(row['fen'])); used[cat].add(game_key(g))
    if motif: counts[motif]+=1
    save(); print('accepted',cat,len(data['games'][cat]),motif or '',flush=True)
    return True

for filename in args.pgns:
    source = 'https://www.pgnmentor.com/players/Carlsen.zip' if pathlib.Path(filename).name == 'Carlsen.pgn' else 'https://database.lichess.org/standard/lichess_db_standard_rated_'+pathlib.Path(filename).stem.replace('draw-','')+'.pgn.zst'
    stream = open(filename); total=0; drawn=0
    while True:
        offset=stream.tell(); headers=chess.pgn.read_headers(stream)
        if headers is None: break
        total+=1
        if headers.get('Result')!='1/2-1/2':continue
        stream.seek(offset); g=chess.pgn.read_game(stream); drawn+=1
        if g.errors or g.headers.get('FEN'): continue
        moves=list(g.mainline_moves()); b=g.board(); boards=[b.copy(stack=False)]
        for m in moves: b.push(m); boards.append(b.copy(stack=False))
        if len(moves)<12 or not b.is_valid():continue
        gid=game_key(g)
        if len(data['games']['insufficient-material'])<100 and gid not in used['insufficient-material'] and b.is_insufficient_material() and not boards[-2].is_insufficient_material():
            record(g,boards,moves,len(moves)-1,len(moves),'insufficient-material',source,{'terminal':'insufficient-material'})
        if len(data['games']['stalemate'])<100 and gid not in used['stalemate'] and b.is_stalemate():
            start=len(moves)-2
            if not boards[start].is_game_over():
                ev=score(boards[start],150000)
                if ev['cpWhite'] is not None and abs(ev['cpWhite'])<=30:
                    record(g,boards,moves,start,len(moves),'stalemate',source,{'terminal':'stalemate','startScore':ev})
        if len(data['games']['perpetual-check'])<100 and gid not in used['perpetual-check'] and b.is_repetition(3):
            final=position_key(b.fen()); hits=[i for i,bb in enumerate(boards) if position_key(bb.fen())==final]
            if len(hits)>=3:
                for start in [hits[-3],hits[-3]+1]:
                    if start < 10 or not 7<=len(moves)-start<=18 or position_key(boards[start].fen(en_passant='fen')) in seen: continue
                    if not all(boards[i+1].is_check() for i in range(start,len(moves),2)):continue
                    terminal = chess.Board(boards[start].fen(en_passant='fen'))
                    for move in moves[start:]: terminal.push(move)
                    if not terminal.is_repetition(3): continue
                    replay=chess.Board(boards[start].fen(en_passant='fen')); scores=[]; good=True
                    for i in range(start,len(moves)+1):
                        if i>start:replay.push(moves[i-1])
                        if replay.is_game_over() or replay.is_repetition(3):
                            good=i==len(moves) and replay.is_repetition(3);break
                        ev=score(replay,300000);scores.append(ev)
                        if ev['cpWhite'] is None or abs(ev['cpWhite'])>(30 if i==start else 50):good=False;break
                    if good and record(g,boards,moves,start,len(moves),'perpetual-check',source,{'scores':scores,'terminal':'threefold'}):break
        if len(data['games']['fortress'])<100 and gid not in used['fortress']:
            for start in range(10,len(moves)-3):
                info=fortress(boards[start])
                if not info:continue
                motif,defender=info
                if boards[start].turn!=defender or counts[motif]>=40:continue
                if position_key(boards[start].fen(en_passant='fen')) in seen:continue
                end=min(start+8,len(moves)); signature=sorted(p.symbol() for p in boards[start].piece_map().values())
                replay=chess.Board(boards[start].fen(en_passant='fen')); evidence=[];good=True
                for i in range(start,end+1):
                    if i>start:replay.push(moves[i-1])
                    if replay.is_game_over() or replay.is_repetition(3) or replay.halfmove_clock>=90 or sorted(p.symbol() for p in replay.piece_map().values())!=signature:
                        good=False;break
                    try: wdl=tables.probe_wdl(replay)
                    except KeyError:good=False;break
                    evidence.append({'fen':replay.fen(en_passant='fen'),'wdl':wdl})
                    if wdl!=0:good=False;break
                if good and record(g,boards,moves,start,end,'fortress',source,{'method':'Syzygy WDL','positions':evidence},motif):break
        if drawn%500==0:print('scan',filename,total,drawn,{k:len(v) for k,v in data['games'].items()},dict(counts),flush=True)
        if all(len(rows)>=100 for rows in data['games'].values()):break
    print('file done',filename,total,drawn,dict(counts),flush=True)
    if all(len(rows)>=100 for rows in data['games'].values()):break
engine.quit();tables.close();save()
