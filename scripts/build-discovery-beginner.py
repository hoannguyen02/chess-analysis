"""Compose five-piece discoveries; enumerate local gains and screen every root with Stockfish."""
import importlib.util, json, random, sys
from pathlib import Path
import chess, chess.engine
sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('miner', ROOT/'scripts/collect-discovery.py')
miner = importlib.util.module_from_spec(spec); spec.loader.exec_module(miner)
NAMES = {2:'Mã',3:'Tượng',4:'Xe',5:'Hậu',6:'Vua'}

def safe_gain(b, side, baseline):
    if b.is_game_over() or miner.material(b, side) <= baseline: return False
    for m in list(b.legal_moves):
        b.push(m)
        bad = b.is_checkmate() or miner.material(b, side) <= baseline
        b.pop()
        if bad: return False
    return True

def branches(b, move):
    side=b.turn; baseline=miner.material(b,side); a=b.copy(); first=a.san(move); a.push(move)
    if a.is_game_over(): return []
    lines=[]
    for reply in list(a.legal_moves):
        second=a.san(reply); a.push(reply); wins=[]
        for capture in list(a.generate_legal_captures()):
            third=a.san(capture); a.push(capture)
            if safe_gain(a,side,baseline): wins.append([first,second,third])
            a.pop()
        a.pop()
        if not wins: return []
        lines.extend(wins)
    return lines

def build():
    rng=random.Random(27102026); exercises=[]; reviews=[]; seen=set()
    with chess.engine.SimpleEngine.popen_uci('/opt/homebrew/bin/stockfish') as engine:
        engine.configure({'Threads':1,'Hash':32})
        for index in range(24):
            kind='check' if index%2==0 else 'attack'
            slider_type=[chess.ROOK,chess.BISHOP][(index//2)%2]
            mover_type=[chess.KNIGHT,chess.BISHOP,chess.ROOK][(index//4)%3]
            if mover_type == slider_type: mover_type = chess.KNIGHT
            side=index%4<2
            for attempt in range(300000):
                b=chess.Board(None); b.turn=side
                slider,target=rng.sample(range(64),2)
                empty=chess.Board(None); empty.set_piece_at(slider,chess.Piece(slider_type,side))
                if target not in empty.attacks(slider): continue
                between=list(chess.SquareSet(chess.between(slider,target)))
                if not between: continue
                blocker=rng.choice(between)
                remaining=[s for s in range(64) if s not in [slider,target,blocker]]
                ownking,other,victim=rng.sample(remaining,3)
                enemyking=target if kind=='check' else other
                victim= victim if kind=='check' else target
                victim_type=[chess.QUEEN,chess.ROOK][(index//8)%2]
                for sq,p,c in [(slider,slider_type,side),(blocker,mover_type,side),(ownking,6,side),(enemyking,6,not side),(victim,victim_type,not side)]:
                    b.set_piece_at(sq,chess.Piece(p,c))
                if not b.is_valid() or b.is_check() or any(b.generate_legal_captures()) or b.fen() in seen: continue
                candidates=[]
                for m in list(b.legal_moves):
                    if m.from_square!=blocker: continue
                    a=b.copy(); a.push(m)
                    motifs=miner.discoveries(b,m,a)
                    if (slider,target,kind) not in motifs or not a.is_check(): continue
                    lines=branches(b,m)
                    if lines: candidates.extend(lines)
                if not candidates: continue
                # Every legal root is examined, including quiet alternatives. Reject any
                # two-move material win which bypasses the discovery.
                root_review=[]; rejected=False
                for m in list(b.legal_moves):
                    a=b.copy(); a.push(m)
                    if a.is_checkmate(): rejected=True; break
                    motifs=miner.discoveries(b,m,a)
                    lines=branches(b,m)
                    root_review.append({'move':b.san(m),'localGain':bool(lines),'discovery':bool(motifs)})
                    if lines and not motifs: rejected=True; break
                    if lines and motifs:
                        candidates.extend(line for line in lines if line not in candidates)
                if rejected: continue
                # MultiPV covers every root, not just the stored move. Finite engine
                # screening is recorded separately from exhaustive local payoff proof.
                engine.configure({'Clear Hash':None})
                infos=engine.analyse(b,chess.engine.Limit(nodes=150000),multipv=b.legal_moves.count())
                scores={b.san(i['pv'][0]):i['score'].pov(side) for i in infos}
                if any(s.mate() is not None for s in scores.values()): continue
                firsts={l[0] for l in candidates}
                best=max(s.score() for s in scores.values())
                if max(scores[s].score() for s in firsts)<best-70: continue
                # A strong non-motif engine line with an early capture is investigated
                # by the exhaustive local test above; reject superior non-motif roots.
                if any(scores[r['move']].score()>max(scores[s].score() for s in firsts)+40 for r in root_review if not r['discovery']): continue
                candidates.sort(key=lambda l:('+' not in l[0],-scores[l[0]].score(),l))
                simple=[]
                for line in candidates:
                    opening=b.copy(); opening.push_san(line[0])
                    if opening.is_check() and not any(opening.generate_legal_captures()): simple.append(line)
                if not simple: continue
                main=simple[0]; candidates=[main]+[line for line in candidates if line!=main]
                move=b.parse_san(main[0]); a=b.copy(); a.push(move)
                motif=miner.discoveries(b,move,a)[0]; slid,targ,actual_kind=motif
                mover_name=NAMES[b.piece_at(move.from_square).piece_type]; slider_name=NAMES[b.piece_at(slid).piece_type]
                reason=(f'{slider_name} ở {chess.square_name(slid)} chiếu Vua khi {mover_name} rời đường chắn. Đối phương phải đỡ chiếu; sau đó bắt quân để thắng vật chất.' if actual_kind=='check' else f'{mover_name} chiếu Vua đồng thời mở đường cho {slider_name} ở {chess.square_name(slid)} tấn công {NAMES[b.piece_at(targ).piece_type]} ở {chess.square_name(targ)}. Sau khi đối phương đỡ chiếu, bắt quân đó.')
                exercises.append(dict(title=f'{"Chiếu mở" if actual_kind=="check" else "Tấn công mở"} · {index+1}',beginner=True,goal='material',discoveryKind=actual_kind,prompt='Mở đường tấn công để thắng vật chất.',mode='interactive',outcome='discovery',fen=b.fen(),moves=main,alternativeLines=candidates[1:],source='original-composition',hints=[f'Tìm quân đang chắn đường của {slider_name} ở {chess.square_name(slid)}. Hãy mở đường bằng một nước chiếu.'],solution=f'{main[0]} — {mover_name} từ {chess.square_name(move.from_square)} đến {chess.square_name(move.to_square)}. '+reason))
                reviews.append(dict(id=f'discovery-beginner-{index+1:02}',fen=b.fen(),moves=main,decision='keep',reason=reason,roots=[dict(r,scoreCp=scores[r['move']].score()) for r in root_review],engineNodes=150000,engine=engine.id,defensiveLines=candidates))
                seen.add(b.fen()); print(index+1,kind,main,flush=True); break
            else: raise RuntimeError(f'No candidate for slot {index}')
    return exercises,reviews

if __name__=='__main__':
    if (ROOT/'scripts/fixtures/discovery/beginner-curation.json').exists():
        from discovery_beginner_curation import publish
        publish()
        sys.exit(0)
    existing_path=ROOT/'src/lib/server/discovery-beginner-exercises.json'
    review_path=ROOT/'scripts/fixtures/discovery/beginner-review.json'
    old_exercises=json.loads(existing_path.read_text()) if existing_path.exists() else []
    old_reviews=json.loads(review_path.read_text())['reviews'] if review_path.exists() else []
    extensions=[(e,r) for e,r in zip(old_exercises,old_reviews) if r.get('coverageTarget')]
    exercises,reviews=build()
    exercises.extend(e for e,r in extensions)
    reviews.extend(r for e,r in extensions)
    (ROOT/'src/lib/server/discovery-beginner-exercises.json').write_text(json.dumps(exercises,ensure_ascii=False,indent=2)+'\n')
    (ROOT/'scripts/fixtures/discovery/beginner-review.json').write_text(json.dumps({'method':'All legal roots: immediate mate and two-solver-move material gain surviving every immediate recapture. Every defence is saved. Stockfish MultiPV all roots: 150000 nodes; no mate score accepted. Finite search does not prove uniqueness or eventual game outcome.','reviews':reviews},ensure_ascii=False,indent=2)+'\n')
