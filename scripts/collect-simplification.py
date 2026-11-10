"""Collect real-game liquidations to tablebase-verified pawn endings.

The main line comes from finite Stockfish analysis, not a forced-line proof.
Tablebase evidence proves the endpoint only. No live service is used by the UI.
"""
import argparse, collections, hashlib, json, subprocess, time
from pathlib import Path
import chess
import chess.engine

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'scripts/fixtures/simplification'
VALUES = {1: 100, 2: 320, 3: 330, 4: 500, 5: 900, 6: 0}
LEVELS = ['A', 'B', 'C', 'C*', 'D']

def publication_level(record):
    """Keep explicit editorial grading separate from mechanical line grading."""
    path = DATA / 'level-overrides.json'
    for override in json.loads(path.read_text()) if path.exists() else []:
        if override['gameId'] == record['gameId']:
            assert override['fen'] == record['fen'] and override['moves'] == record['moves']
            assert override['level'] in LEVELS
            return override['level']
    return record['level']

def material(board, color):
    return sum(VALUES[p.piece_type] * (1 if p.color == color else -1) for p in board.piece_map().values())

def officers(board, color):
    return sum(len(board.pieces(t, color)) for t in [2, 3, 4, 5])

def inspect(start, pv):
    """Require an actual bilateral liquidation, not an incidental capture."""
    color = start.turn
    if not officers(start, color) or not officers(start, not color):
        return None
    board = start.copy(stack=False)
    moves, offers, captures = [], [], []
    captured_officer_balance = 0
    initial = material(start, color)
    for i, move in enumerate(pv[:20]):
        if move not in board.legal_moves:
            return None
        # Preparatory moves must force an answer, offer a trade, or advance a pawn.
        if i % 2 == 0 and not board.is_capture(move) and not board.gives_check(move):
            piece = board.piece_at(move.from_square)
            after = board.copy(stack=False); after.push(move)
            attacks_piece = any(after.piece_at(s) and after.piece_at(s).color != color and after.piece_at(s).piece_type in [2,3,4,5] for s in after.attacks(move.to_square))
            if piece.piece_type != chess.PAWN and not attacks_piece:
                return None
        victim = board.piece_at(move.to_square)
        if victim and victim.piece_type in [2,3,4,5]:
            captured_officer_balance += VALUES[victim.piece_type] * (1 if board.turn == color else -1)
        if board.is_capture(move): captures.append((i, move.to_square))
        moves.append(board.san(move)); board.push(move)
        # A settled deficit, not a temporary equal exchange, is the sacrifice signal.
        if i % 2 == 1 and victim and victim.color == color and victim.piece_type in [2,3,4,5]:
            offers.append({'ply': i, 'piece': victim.symbol().upper()})
        if officers(board, color) + officers(board, not color):
            continue
        if len(board.piece_map()) > 7 or not board.pawns:
            return None
        # Both armies have removed their pieces; merely winning a hanging piece
        # is not the lesson. The remaining material balance must not increase.
        delta = material(board, color) - initial
        if delta > 100 or len(moves) < 2:
            return None
        if not any(j == i + 1 and a == z for (i,a),(j,z) in zip(captures,captures[1:])):
            return None
        sacrifices = offers if delta <= -150 and captured_officer_balance <= -150 else []
        own = (len(moves) + 1) // 2
        level = ('C' if own <= 3 else 'D') if sacrifices else ('A' if own <= 2 else 'B' if own == 3 else 'C*')
        return dict(moves=moves, endFen=board.fen(en_passant='fen'), level=level,
                    solverMoves=own, sacrifices=sacrifices, materialChange=delta,
                    beforeMaterial=initial, afterMaterial=material(board,color))
    return None

def save(path, data):
    tmp = path.with_suffix('.tmp')
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    tmp.replace(path)

def tablebase(board, cache):
    fen = board.fen(en_passant='fen')
    if fen not in cache:
        from urllib.parse import urlencode
        url = 'https://tablebase.lichess.ovh/standard?' + urlencode({'fen': fen})
        for attempt in range(3):
            response = subprocess.run(['curl', '--fail', '-sS', '--max-time', '25', url], capture_output=True, text=True)
            if response.returncode == 0:
                value = json.loads(response.stdout)
                if value.get('category') in ['win', 'loss', 'draw']:
                    cache[fen] = value
                    save(DATA / 'tablebase.json', cache)
                    return value
                return None
            time.sleep(2 + attempt * 3)
        return None
    return cache[fen]

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--seeds',default='/tmp/simplification-seeds.json')
    parser.add_argument('--target',type=int,default=20)
    parser.add_argument('--actual-lines', action='store_true', help='Validate recorded game continuations as candidates as well as engine PVs')
    args=parser.parse_args()
    DATA.mkdir(exist_ok=True)
    path=DATA/'researched.json'
    records=json.loads(path.read_text())['records'] if path.exists() else []
    cache=json.loads((DATA/'tablebase.json').read_text()) if (DATA/'tablebase.json').exists() else {}
    excluded={r['gameId'] for r in json.loads((DATA/'excluded.json').read_text())}
    records=[r for r in records if (r['goal']!='draw' or r['beforeMaterial']<=-100) and inspect(chess.Board(r['fen']),[chess.Move.from_uci(m) for m in r['validation']['principalVariation']]) == {k:r[k] for k in ['moves','endFen','level','solverMoves','sacrifices','materialChange','beforeMaterial','afterMaterial']}]
    overrides={r['gameId']:r for r in json.loads((DATA/'reviewed.json').read_text())['records']}
    seen={r['gameId'] for r in records}|excluded
    counts=collections.Counter(publication_level(overrides.get(r['gameId'],r)) for r in records if r['gameId'] not in excluded)
    groups=collections.defaultdict(list)
    for seed in json.load(open(args.seeds)):
        groups[seed['gameId']].append(seed)
    engine=chess.engine.SimpleEngine.popen_uci('/opt/homebrew/bin/stockfish')
    engine.configure({'Threads':2,'Hash':128})
    try:
        for index,seeds in enumerate(groups.values()):
            if seeds[0]['gameId'] in seen:continue
            # Explore the actual trade first, then progressively earlier preparation.
            for seed in sorted(seeds,key=lambda s:len(s['line'])):
                b=chess.Board(seed['fen']);color=b.turn
                if b.is_game_over() or b.legal_moves.count()<2:continue
                actual=[]; replay=b.copy()
                for san in seed['line']:
                    actual.append(replay.parse_san(san));replay.push(actual[-1])
                if args.actual_lines:
                    shape=inspect(b,actual)
                else:
                    quick=engine.analyse(b,chess.engine.Limit(nodes=15000))
                    shape=inspect(b,quick.get('pv',[]))
                if not shape or counts[shape['level']]>=args.target:continue
                info=engine.analyse(b,chess.engine.Limit(nodes=300000))
                candidate_pv=actual if args.actual_lines else info.get('pv',[])
                shape=inspect(b,candidate_pv)
                if not shape or counts[shape['level']]>=args.target:continue
                score=info['score'].pov(color).score(mate_score=100000)
                if score< -40 or (40<score<200):continue
                end=chess.Board(shape['endFen'])
                tb=tablebase(end,cache)
                if not tb:continue
                goal='win' if tb['category']==('win' if end.turn==color else 'loss') else 'draw' if tb['category']=='draw' else None
                if not goal or (goal=='win' and score<200) or (goal=='draw' and (abs(score)>40 or material(b,color)>-100)):continue
                # Probe after every solver decision; discard lines losing the goal
                # to a fresh defensive search, including cooperative PV artefacts.
                walk=b.copy();defences=[];valid=True; prior_score=score; positions={walk._transposition_key()}
                for i,san in enumerate(shape['moves']):
                    walk.push_san(san)
                    if walk._transposition_key() in positions:
                        valid=False;break
                    positions.add(walk._transposition_key())
                    if (i%2==0 or args.actual_lines) and not walk.is_game_over():
                        probe=engine.analyse(walk,chess.engine.Limit(nodes=150000))
                        cp=probe['score'].pov(color).score(mate_score=100000)
                        defences.append(dict(ply=i+1,score=cp,pv=[m.uci() for m in probe.get('pv',[])]))
                        if args.actual_lines:
                            clamp=lambda x:max(-1500,min(1500,x))
                            regret=(clamp(prior_score)-clamp(cp)) if i%2==0 else (clamp(cp)-clamp(prior_score))
                            if regret>150:valid=False;break
                        prior_score=cp
                        if cp < (150 if goal=='win' else -40):valid=False;break
                if not valid:continue
                # Store a short, legal continuation as an explanation of the ending.
                explanation=engine.analyse(end,chess.engine.Limit(nodes=300000)) if not end.is_game_over() else None
                continuation=[];walk=end.copy()
                for move in (explanation or {}).get('pv',[])[:10]:
                    continuation.append(walk.san(move));walk.push(move)
                source=seed['source'];game=chess.Board(source['gameFen']);before=None
                for i,san in enumerate(source['gameMoves']):
                    if i==seed['ply']-1:before=dict(fen=game.fen(en_passant='fen'),move=san)
                    if i==seed['ply']:assert game.fen(en_passant='fen')==seed['fen']
                    game.push_san(san)
                assert hashlib.sha256(' '.join(m.uci() for m in game.move_stack).encode()).hexdigest()[:16]==seed['gameId']
                record=dict(gameId=seed['gameId'],fen=seed['fen'],ply=seed['ply'],previousMove=before,
                    headers=source['headers'],source=source['source'],gameFen=source['gameFen'],gameMoves=source['gameMoves'],
                    goal=goal,score=score,**shape,
                    validation=dict(engine=engine.id,depth=info['depth'],nodes=300000,principalVariation=[m.uci() for m in candidate_pv],lineOrigin='recorded-game' if args.actual_lines else 'engine',defences=defences,tablebaseCategory=tb['category']),
                    endingContinuation=continuation,
                    reviewReason='Both sides remove their remaining non-pawn pieces; the published endpoint is a verified '+goal+' pawn ending. Material change: '+str(shape['materialChange'])+' cp.')
                records.append(record);seen.add(seed['gameId']);counts[shape['level']]+=1
                save(path,dict(records=records));print(index,dict(counts),goal,source['headers']['White'],shape['moves'],flush=True)
                break
            if index%25==0:print('progress',index,dict(counts),flush=True)
            if all(counts[l]>=args.target for l in LEVELS):break
    finally:
        save(path,dict(records=records))
        try: engine.quit()
        except chess.engine.EngineTerminatedError: pass
if __name__=='__main__':main()
