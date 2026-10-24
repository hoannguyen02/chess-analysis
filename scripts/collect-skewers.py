"""Mine reproducible, engine-checked skewer candidates from master-game PGNs.
Requires python-chess and Stockfish. Keeps actual games separate from engine lines.
"""
import argparse, hashlib, json, math, re
from pathlib import Path
import chess, chess.pgn, chess.engine

VALUES = {1: 100, 2: 320, 3: 330, 4: 500, 5: 900, 6: 20000}
MASTER_SINCE = dict(Spassky=1955, Bronstein=1950, Keres=1935, Alekhine=1914, Anand=1988, Capablanca=1911, Carlsen=2004,
                    Fischer=1958, Karpov=1970, Kasparov=1980, Tal=1957)
DIRECTIONS = [(1,0),(-1,0),(0,1),(0,-1),(1,1),(1,-1),(-1,1),(-1,-1)]

MASTER_NAMES = {'Spassky': ('b', 'boris'), 'Bronstein': ('d', 'david'), 'Keres': ('p', 'paul'), 'Alekhine': ('a', 'alexander'), 'Anand': ('v', 'vis'), 'Capablanca': ('j', 'jose'),
                'Carlsen': ('m', 'magnus'), 'Fischer': ('r', 'robert'), 'Karpov': ('a', 'ana'),
                'Kasparov': ('g', 'garry'), 'Tal': ('m', 'mi')}
# Conservative post-title cutoffs for the expanded modern-master corpus.
MASTER_NAMES.update({
 'Ivanchuk': ('v','vas'), 'Topalov': ('v','ves'), 'Kramnik': ('v','vlad'),
 'Shirov': ('a','alex'), 'Morozevich': ('a','alex'), 'Nakamura': ('h','hik'),
 'Mamedyarov': ('s','shak'), 'Aronian': ('l','lev'), 'Grischuk': ('a','alex'),
 'Svidler': ('p','pet'), 'Caruana': ('f','fab'), 'So': ('w','wes'),
 'Giri': ('a','anish'), 'VachierLagrave': ('m','max'), 'Adams': ('m','mich'),
 'Short': ('n','nig'), 'Leko': ('p','pet'), 'Gelfand': ('b','bor'),
 'Nepomniachtchi': ('i','ian'), 'Kamsky': ('g','gata'),
})
MASTER_SINCE.update({name: 2000 for name in ['Ivanchuk','Topalov','Kramnik','Shirov','Morozevich','Svidler','Adams','Short','Leko','Gelfand','Kamsky']})
MASTER_SINCE.update({name: 2010 for name in ['Nakamura','Mamedyarov','Aronian','Grischuk','Caruana','So','VachierLagrave','Nepomniachtchi']})
MASTER_SINCE['Giri'] = 2015
MASTER_NAMES.update({'Spielmann': ('r','rud'), 'Marshall': ('f','frank'), 'Chigorin': ('m','mikh'),
 'Nunn': ('j','john'), 'Polugaevsky': ('l','lev'), 'Korchnoi': ('v','vik'),
 'PolgarJ': ('j','jud'), 'Geller': ('e','efim'), 'Stein': ('l','leo'),
 'Smyslov': ('v','vas'), 'Taimanov': ('m','mark'), 'Timman': ('j','jan'),
 'Portisch': ('l','lajos'), 'Gligoric': ('s','svet'), 'Petrosian': ('t','tigran v'),
 'Botvinnik': ('m','mikh'), 'Reshevsky': ('s','sam'), 'Rubinstein': ('a','akiba'),
 'Tartakower': ('s','sav'), 'Euwe': ('m','max')})
MASTER_SINCE.update(dict(Spielmann=1910,Marshall=1905,Chigorin=1880,Nunn=1980,Polugaevsky=1965,
 Korchnoi=1965,PolgarJ=1995,Geller=1960,Stein=1965,Smyslov=1955,Taimanov=1960,Timman=1980,
 Portisch=1970,Gligoric=1960,Petrosian=1960,Botvinnik=1950,Reshevsky=1935,Rubinstein=1910,Tartakower=1920,Euwe=1930))
MASTER_NAMES.update({'Lasker': ('e','eman'), 'Anderssen': ('a','adolf'), 'Blackburne': ('j','joseph'),
 'Nimzowitsch': ('a','aron'), 'Tarrasch': ('s','sieg'), 'Teichmann': ('r','rich'),
 'Schlechter': ('c','carl'), 'Janowski': ('d','david'), 'Bogoljubow': ('e','efim'),
 'Steinitz': ('w','wilh'), 'Pillsbury': ('h','harry'), 'Maroczy': ('g','geza'),
 'Larsen': ('b','bent'), 'Ljubojevic': ('l','ljub')})
MASTER_SINCE.update(dict(Lasker=1890,Anderssen=1851,Blackburne=1870,Nimzowitsch=1910,Tarrasch=1890,
 Teichmann=1900,Schlechter=1900,Janowski=1900,Bogoljubow=1920,Steinitz=1870,Pillsbury=1895,
 Maroczy=1900,Larsen=1960,Ljubojevic=1980))
MASTER_NAMES.update({'Jobava': ('b','baad'), 'Rapport': ('r','rich'), 'Shabalov': ('a','alex'),
 'Beliavsky': ('a','alex'), 'Smirin': ('i','ili'), 'Sutovsky': ('e','emil'),
 'Volokitin': ('a','andr'), 'Rublevsky': ('s','serg'), 'VanWely': ('l','loek'),
 'Milov': ('v','vad'), 'Sokolov': ('i','ivan'), 'Gashimov': ('v','vug'),
 'Bologan': ('v','vik'), 'Radjabov': ('t','teim'), 'Ponomariov': ('r','rus'),
 'Navara': ('d','david'), 'Movsesian': ('s','serg'), 'Motylev': ('a','alex')})
MASTER_SINCE.update({name:2005 for name in ['Jobava','Shabalov','Beliavsky','Smirin','Sutovsky',
 'Volokitin','Rublevsky','VanWely','Milov','Sokolov','Gashimov','Bologan','Radjabov','Ponomariov','Navara','Movsesian','Motylev']})
MASTER_SINCE['Rapport']=2015
MASTER_NAMES.update({'Akopian': ('v', 'vlad'), 'Akobian': ('v', 'var'), 'Almasi': ('z', 'zolt'), 'Bacrot': ('e', 'etien'), 'Bareev': ('e', 'evg'), 'Dreev': ('a', 'alex'), 'Ehlvest': ('j', 'jaan'), 'GurevichM': ('m', 'mikh'), 'GurevichD': ('d', 'dmit'), 'Huebner': ('r', 'rob'), 'Hort': ('v', 'vlast'), 'Ivkov': ('b', 'bor'), 'Jussupow': ('a', 'art'), 'Khalifman': ('a', 'alex'), 'Kholmov': ('r', 'rat'), 'Kotov': ('a', 'alex'), 'Krasenkow': ('m', 'mich'), 'Lautier': ('j', 'joel'), 'Malakhov': ('v', 'vlad'), 'Miles': ('a', 'anth'), 'Najdorf': ('m', 'mig'), 'Nikolic': ('p', 'pred'), 'Nisipeanu': ('l', 'liv'), 'Novikov': ('i', 'igor'), 'Onischuk': ('a', 'alex'), 'Pachman': ('l', 'lud'), 'Psakhis': ('l', 'lev'), 'Sakaev': ('k', 'kon'), 'Salov': ('v', 'val'), 'Sasikiran': ('k', 'krish'), 'Seirawan': ('y', 'yass'), 'Speelman': ('j', 'jon'), 'Stahlberg': ('g', 'gid'), 'Suetin': ('a', 'alex'), 'Szabo': ('l', 'las'), 'Uhlmann': ('w', 'wolf'), 'Unzicker': ('w', 'wolf'), 'Vaganian': ('r', 'raf')})
MASTER_SINCE.update({'Akopian': 2000, 'Akobian': 2005, 'Almasi': 2000, 'Bacrot': 2000, 'Bareev': 2000, 'Dreev': 2000, 'Ehlvest': 2000, 'GurevichM': 2000, 'GurevichD': 2000, 'Huebner': 1980, 'Hort': 1970, 'Ivkov': 1960, 'Jussupow': 2000, 'Khalifman': 2000, 'Kholmov': 1970, 'Kotov': 1950, 'Krasenkow': 2000, 'Lautier': 2000, 'Malakhov': 2000, 'Miles': 1980, 'Najdorf': 1950, 'Nikolic': 2000, 'Nisipeanu': 2000, 'Novikov': 2000, 'Onischuk': 2000, 'Pachman': 1960, 'Psakhis': 2000, 'Sakaev': 2000, 'Salov': 2000, 'Sasikiran': 2005, 'Seirawan': 2000, 'Speelman': 2000, 'Stahlberg': 1950, 'Suetin': 1970, 'Szabo': 1955, 'Uhlmann': 1960, 'Unzicker': 1960, 'Vaganian': 2000})
MASTER_FIRST_ALIASES = {
 'Kasparov': {'gary'}, 'PolgarJ': {'ju'}, 'Nimzowitsch': {'aaron'},
 'Janowski': {'dawid markelowicz'}, 'Steinitz': {'william'}, 'Volokitin': {'and'},
 'Jobava': {'ba'}, 'Nisipeanu': {'ld'}, 'Akopian': {'vl'}, 'Nikolic': {'pr'},
 'Onischuk': {'al'}, 'Jussupow': {'ar'},
}
MASTER_LAST_ALIASES = {'Korchnoi': {'kortschnoj'}, 'Janowski': {'janowsky'}}
def master_identity(headers, archive):
    if archive not in MASTER_NAMES: return False
    initials, full = MASTER_NAMES[archive]
    for side in ['White','Black']:
        parts=headers.get(side,'').lower().replace('.', '').split(',',1)
        surnames={ {'PolgarJ':'polgar','GurevichM':'gurevich','GurevichD':'gurevich'}.get(archive,archive.lower()) } | MASTER_LAST_ALIASES.get(archive,set())
        if len(parts)==2 and re.sub(r'[^a-z]', '', parts[0]) in surnames:
            first=parts[1].strip()
            if first==initials or first.startswith(full) or first in MASTER_FIRST_ALIASES.get(archive,set()): return True
    return False

def skewers(board, square):
    piece = board.piece_at(square)
    if not piece or piece.piece_type not in (3,4,5): return []
    found = []
    for dx,dy in DIRECTIONS:
        if piece.piece_type == 3 and not(dx and dy): continue
        if piece.piece_type == 4 and dx and dy: continue
        x,y = chess.square_file(square)+dx,chess.square_rank(square)+dy
        targets=[]
        while 0<=x<8 and 0<=y<8:
            target=chess.square(x,y); occupant=board.piece_at(target)
            if occupant:
                if occupant.color==piece.color: break
                targets.append(target)
                if len(targets)==2:
                    front,back=map(board.piece_at,targets)
                    if front.piece_type in (4,5,6) and VALUES[front.piece_type]>VALUES[back.piece_type] and back.piece_type in (2,3,4,5):
                        found.append(dict(attacker=chess.square_name(square),front=chess.square_name(targets[0]),back=chess.square_name(targets[1]),piece=piece.symbol().upper()))
                    break
            x+=dx;y+=dy
    return found

def material(board,color):
    return sum(VALUES[p.piece_type]*(1 if p.color==color else -1) for p in board.piece_map().values())

def inspect_line(start, pv):
    board=start.copy(stack=False); color=board.turn; base=material(board,color); balances=[base]; boards=[board.copy(stack=False)]
    events=[]; sans=[]; sacrifices=[]
    for i,move in enumerate(pv[:18]):
        if move not in board.legal_moves: break
        sans.append(board.san(move)); board.push(move); boards.append(board.copy(stack=False)); balances.append(material(board,color))
        if i%2==0:
            for motif in skewers(board,move.to_square):
                # The front piece moves away, and the same attacker takes the rear piece.
                if i+2<len(pv) and pv[i+1].from_square==chess.parse_square(motif['front']) and pv[i+2].from_square==move.to_square and pv[i+2].to_square==chess.parse_square(motif['back']):
                    events.append((i,motif))
    for i,motif in events:
        end=i+3
        if end>len(sans): continue
        # Include the opponent's recapture and the solver's reply when measuring the gain.
        settled=min(len(balances)-1,end+2)
        gain=min(balances[end:settled+1])-base
        if gain<100: continue
        sacrifices=[]
        for j in range(1,i+1,2):
            reply=pv[j]; victim=boards[j].piece_at(reply.to_square)
            if not victim or victim.color!=color or victim.piece_type not in (2,3,4,5): continue
            # Trace a previously moved piece even when the opponent delays accepting it.
            offered=next((k for k in range(j-1,-1,-2) if pv[k].to_square==reply.to_square),None)
            if offered is None: continue
            baseline=balances[offered]
            after_reply=balances[j+1]
            after_recapture=balances[min(j+2,len(balances)-1)]
            if after_reply<baseline-75 and after_recapture<baseline-75:
                sacrifices.append(dict(ply=offered,piece=victim.symbol().upper(),value=VALUES[victim.piece_type]))
        prep=i//2; solver=(end+1)//2
        if not sacrifices:
            level='A' if prep==0 else 'B' if prep==1 else 'C*'
        elif len(sacrifices)==1 and solver<=3:
            level='C'
        elif solver>3 and (len(sacrifices)>=2 or any(s['piece'] in ('Q','R') for s in sacrifices)):
            level='D'
        else: continue  # Ambiguous difficulty: leave out of the first teaching set.
        if prep>3 and not sacrifices: continue
        return dict(moves=sans[:end],uci=[m.uci() for m in pv[:end]],motif=motif,skewerPly=i,
                    gain=gain,sacrifices=sacrifices,level=level,solverMoves=solver)
    return None

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--input',default='/tmp/skewer-masters');parser.add_argument('--engine',default='/opt/homebrew/bin/stockfish');parser.add_argument('--target',type=int,default=10);parser.add_argument('--limit',type=int,default=0);parser.add_argument('--output',default='scripts/fixtures/skewer/candidates.json');parser.add_argument('--endings-only',action='store_true');parser.add_argument('--include-endings',action='store_true');parser.add_argument('--levels',nargs='+',default=['A','B','C','C*','D'])
    args=parser.parse_args(); root=Path(__file__).resolve().parents[1]; out=root/args.output
    engine=chess.engine.SimpleEngine.popen_uci(args.engine);engine.configure({'Threads':1,'Hash':128})
    records=[];seen=set();seen_games=set();counts={k:0 for k in ['A','B','C','C*','D']}; scanned=0; candidates=0
    if out.exists():
        records=json.loads(out.read_text())['records']
        seen.update(' '.join(r['fen'].split()[:4]) for r in records)
        seen_games.update(r['gameId'] for r in records)
        counts={k:sum(r['level']==k for r in records) for k in counts}
    audit=root/'scripts/fixtures/skewer/audit.json'
    if audit.exists(): seen_games.update(r['gameId'] for r in json.loads(audit.read_text())['records'])
    def save():
        temporary=out.with_suffix('.tmp')
        temporary.write_text(json.dumps(dict(engine=engine.id,nodes=300000,counts=counts,scannedGames=scanned,checkedCandidates=candidates,records=records),ensure_ascii=False,indent=2)+'\n')
        temporary.replace(out)
    try:
        for file in sorted(Path(args.input).glob('*.pgn')):
            with file.open(encoding='utf-8-sig',errors='replace') as stream:
                while game:=chess.pgn.read_game(stream):
                    scanned+=1
                    if game.errors or game.headers.get('Result') not in ('1-0','0-1','1/2-1/2'): continue
                    year=game.headers.get('Date','')[:4]
                    if not year.isdigit() or int(year)<MASTER_SINCE.get(file.stem,9999): continue
                    if not master_identity(game.headers,file.stem): continue
                    if re.search(r'\bsim|blind|odds|consult',game.headers.get('Event',''),re.I) or '/' in game.headers.get('White','')+game.headers.get('Black',''): continue
                    moves=list(game.mainline_moves()); ident=hashlib.sha256(' '.join(m.uci() for m in moves).encode()).hexdigest()[:16]
                    if ident in seen_games: continue
                    seen_games.add(ident)
                    if len(moves)<10: continue
                    board=game.board(); positions=[board.copy(stack=False)]; seeds=[]; actual=[]
                    for i,m in enumerate(moves):
                        actual.append(board.san(m));board.push(m);positions.append(board.copy(stack=False))
                        if skewers(board,m.to_square):
                            # First investigate preparation/sacrifices, then direct recognition.
                            seeds.extend(max(0,i-back) for back in [12,10,8,6,4,2,0] if i-back>=10)
                    if args.endings_only or args.include_endings:
                        winner = chess.WHITE if game.headers['Result']=='1-0' else chess.BLACK
                        if game.headers['Result']!='1/2-1/2':
                            endings=[i for i in range(max(10,len(moves)-7),len(moves)+1) if positions[i].turn==winner and not positions[i].is_game_over()]
                            seeds=endings if args.endings_only else list(dict.fromkeys(seeds+endings))
                        elif args.endings_only: continue
                    for ply in dict.fromkeys(seeds):
                        b=positions[ply]; fen=b.fen(en_passant='fen'); key=' '.join(fen.split()[:4])
                        if key in seen: continue
                        seen.add(key);candidates+=1
                        quick=engine.analyse(b,chess.engine.Limit(nodes=12000))
                        if quick['score'].pov(b.turn).score(mate_score=10000)<150: continue
                        probe=inspect_line(b,quick.get('pv',[]))
                        actual_probe=inspect_line(b,moves[ply:ply+18]) if not probe or probe['level'] not in args.levels else None
                        useful=next((p for p in [probe,actual_probe] if p and p['level'] in args.levels and counts[p['level']]<args.target),None)
                        if not useful or useful['level'] not in args.levels or counts[useful['level']]>=args.target: continue
                        info=engine.analyse(b,chess.engine.Limit(nodes=300000),multipv=3)
                        best=info[0]['score'].pov(b.turn).score(mate_score=10000)
                        selected=None;line=None;score=best
                        for item in info:
                            candidate=inspect_line(b,item.get('pv',[]));cp=item['score'].pov(b.turn).score(mate_score=10000)
                            if candidate and candidate['level'] in args.levels and counts[candidate['level']]<args.target and cp>=150 and cp>=best-40:
                                selected=item;line=candidate;score=cp;break
                        if not line: continue
                        # One position per original game, across all levels.
                        if any(r['gameId']==ident for r in records): continue
                        alternatives=[]
                        for item in info:
                            if item is selected: continue
                            alt=inspect_line(b,item.get('pv',[])); cp=item['score'].pov(b.turn).score(mate_score=10000)
                            if alt and cp>=score-40: alternatives.append(alt['moves'])
                        record=dict(gameId=ident,fen=fen,ply=ply,headers=dict(game.headers),source='https://www.pgnmentor.com/players/'+file.stem+'.zip',
                            pgn=game.accept(chess.pgn.StringExporter(headers=True,variations=False,comments=False)),
                            gameMoves=actual,gameFen=game.board().fen(),previousMove={'fen':positions[ply-1].fen(en_passant='fen'),'move':actual[ply-1]},
                            score=score,depth=selected.get('depth'),alternatives=alternatives,**line)
                        records.append(record);counts[line['level']]+=1;save()
                        print(scanned,candidates,counts,game.headers.get('White'),game.headers.get('Black'),line['moves'],flush=True)
                        break
                    if args.limit and candidates>=args.limit: save();return
                    if all(counts[level]>=args.target for level in args.levels): save();return
                    if scanned%500==0: save();print('progress',scanned,candidates,counts,flush=True)
            save()
    finally: save();engine.quit()

if __name__=='__main__':main()
