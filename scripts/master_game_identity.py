"""Conservative identity and title-year checks for PGN Mentor player archives."""

import re

MASTER_SINCE = dict(Spassky=1955, Bronstein=1950, Keres=1935, Alekhine=1914, Anand=1988, Capablanca=1911, Carlsen=2004,
                    Fischer=1958, Karpov=1970, Kasparov=1980, Tal=1957)

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
