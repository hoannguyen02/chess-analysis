"""Shared, resumable research infrastructure. Cached analysis is never approval."""
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import shutil
import sqlite3
import time

import chess
import chess.engine

ROOT = Path(__file__).resolve().parents[1]
CACHE_VERSION = 1
DEFAULT_CACHE = Path(os.environ.get(
    'CHESS_RESEARCH_CACHE',
    str(Path.home() / 'Library/Caches/chess-analysis/research-v1.sqlite'),
))


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, ensure_ascii=False,
                                     separators=(',', ':')).encode()).hexdigest()


def atomic_json(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name + f'.{os.getpid()}.tmp')
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
    temporary.replace(path)


def module(name):
    spec = importlib.util.spec_from_file_location(name.replace('-', '_'),
                                                ROOT / 'scripts' / (name + '.py'))
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


def code_version(*names):
    return digest({name: hashlib.sha256((ROOT / 'scripts' / name).read_bytes()).hexdigest()
                   for name in names})


def candidate_key(topic, record, policy):
    """Changed moves, objectives, provenance or review policy invalidate results."""
    return digest({'topic': topic, 'record': record, 'policy': policy})


class ResearchCache:
    def __init__(self, path=DEFAULT_CACHE):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.db = sqlite3.connect(self.path, timeout=60)
        self.db.execute('PRAGMA journal_mode=WAL')
        self.db.execute('PRAGMA busy_timeout=60000')
        self.db.execute('CREATE TABLE IF NOT EXISTS results '
                        '(kind TEXT, key TEXT, value TEXT NOT NULL, '
                        'PRIMARY KEY(kind,key))')
        self.db.commit()

    def get(self, kind, key):
        row = self.db.execute('SELECT value FROM results WHERE kind=? AND key=?',
                              (kind, key)).fetchone()
        return json.loads(row[0]) if row else None

    def put(self, kind, key, value):
        with self.db:
            self.db.execute('INSERT OR REPLACE INTO results VALUES (?,?,?)',
                            (kind, key, json.dumps(value, ensure_ascii=False)))

    def close(self):
        self.db.close()


class CachedEngine:
    """Cold-hash UCI requests cached by exact binary, history and search settings.

    Each worker owns an engine. Incomplete/failed requests are never cached.
    Single-threaded cold searches make fresh and cached evidence comparable.
    """
    def __init__(self, executable=None, cache=DEFAULT_CACHE, options=None):
        executable = executable or shutil.which('stockfish') or '/opt/homebrew/bin/stockfish'
        self.executable = str(Path(executable).resolve())
        self.binary_sha256 = hashlib.sha256(Path(self.executable).read_bytes()).hexdigest()
        self.options = {'Threads': 1, 'Hash': 64, **(options or {})}
        # External NNUE networks must have their contents included in the identity.
        self.networks = {}
        for key in ('EvalFile', 'EvalFileSmall'):
            if self.options.get(key):
                path = Path(self.options[key])
                self.networks[key] = hashlib.sha256(path.read_bytes()).hexdigest()
        self.engine = None
        self.cache = ResearchCache(cache) if cache else None
        self.stats = {'hits': 0, 'misses': 0, 'engineCalls': 0, 'engineSeconds': 0.0}

    def start(self):
        if self.engine is None:
            self.engine = chess.engine.SimpleEngine.popen_uci(self.executable)
            self.engine.configure(self.options)
        return self.engine

    @property
    def id(self):
        return self.start().id

    @property
    def identity(self):
        return {'binarySha256': self.binary_sha256, 'options': self.options,
                'externalNetworks': self.networks, 'chessVersion': chess.__version__,
                'hashPolicy': 'clear-before-every-request-v1', 'cacheVersion': CACHE_VERSION}

    def configure(self, options):
        # Clear Hash is already guaranteed on every uncached request.
        settings = {k: v for k, v in options.items() if k != 'Clear Hash'}
        if any(key.startswith('EvalFile') and value != self.options.get(key)
               for key, value in settings.items()):
            raise ValueError('Configure external networks at engine construction')
        if settings:
            self.options.update(settings)
            if self.engine:
                self.engine.configure(settings)

    def request_key(self, board, limit, multipv=None, root_moves=None):
        if any(key.startswith('EvalFile') for key in self.options) and not self.networks:
            raise ValueError('Configure external networks at engine construction')
        return digest({'engine': self.identity, 'rootFen': board.root().fen(en_passant='fen'),
                       'history': [m.uci() for m in board.move_stack],
                       'fen': board.fen(en_passant='fen'), 'limit': vars(limit),
                       'multipv': multipv,
                       'rootMoves': sorted(m.uci() for m in root_moves) if root_moves is not None else None})

    def analyse(self, board, limit, multipv=None, root_moves=None):
        roots = tuple(root_moves) if root_moves is not None else None
        key = self.request_key(board, limit, multipv, roots)
        saved = self.cache.get('engine', key) if self.cache else None
        if saved is not None:
            self.stats['hits'] += 1
        else:
            self.stats['misses'] += 1
            engine = self.start()
            engine.configure({'Clear Hash': None})
            started = time.perf_counter()
            raw = engine.analyse(board, limit, multipv=multipv, root_moves=roots)
            self.stats['engineSeconds'] += time.perf_counter() - started
            self.stats['engineCalls'] += 1
            saved = []
            for info in raw if isinstance(raw, list) else [raw]:
                score = info['score'].pov(board.turn)
                saved.append({
                    **{k: info[k] for k in ('depth', 'seldepth', 'nodes', 'time',
                                           'tbhits', 'hashfull', 'multipv') if k in info},
                    'cp': score.score(), 'mate': score.mate(),
                    'pv': [move.uci() for move in info.get('pv', [])],
                })
            if len(saved) != (min(multipv, board.legal_moves.count()) if multipv else 1):
                raise ValueError('Incomplete MultiPV result; not cached')
            if self.cache:
                self.cache.put('engine', key, saved)
        result = []
        for item in saved:
            score = chess.engine.Mate(item['mate']) if item['mate'] is not None else chess.engine.Cp(item['cp'])
            result.append({**{k: v for k, v in item.items() if k not in ('cp', 'mate', 'pv')},
                           'score': chess.engine.PovScore(score, board.turn),
                           'pv': [chess.Move.from_uci(move) for move in item['pv']]})
        return result if multipv is not None else result[0]

    def stop_process(self):
        if self.engine:
            engine, self.engine = self.engine, None
            try:
                engine.quit()
            finally:
                engine.close()

    def quit(self):
        self.stop_process()
        if self.cache:
            self.cache.close()
            self.cache = None

    def __enter__(self):
        return self

    def __exit__(self, *_):
        self.quit()


def default_workers():
    return max(1, min(4, (os.cpu_count() or 2) // 2))


def resume_reviews(data, records, policy):
    """Legacy outputs without exact settings/record identity are not cache hits."""
    expected = {r['gameId']: digest(r) for r in records}
    old = data.get('reviews', []) if data.get('reviewPolicy') == policy else []
    data['reviews'] = [row for row in old
                       if row.get('candidateHash') == expected.get(row['gameId'])]
    data['reviewPolicy'] = policy
    return {row['gameId'] for row in data['reviews']}
