"""Merge audited supplementary games without duplicating games or positions."""
import argparse
import importlib.util
import json
import sys
from collections import Counter
from pathlib import Path

import chess

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('miner', ROOT / 'scripts/collect-pins.py')
miner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(miner)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('inputs', nargs='+', type=Path)
    args = parser.parse_args()
    target = ROOT / 'scripts/fixtures/pin/researched.json'
    canonical = json.loads(target.read_text())
    records = []
    excluded = {r['gameId'] for r in json.loads((ROOT / 'scripts/fixtures/pin/excluded.json').read_text())}
    games, positions = set(excluded), set()
    for data in [canonical] + [json.loads(path.read_text()) for path in args.inputs]:
        for record in data['records']:
            if record['gameId'] in games or record['fen'] in positions:
                continue
            board = chess.Board(record['fen'])
            pv = [chess.Move.from_uci(move) for move in record['validation']['principalVariation']]
            evidence = miner.inspect(board, pv, [record['level']])
            assert evidence is not None, record['gameId']
            for key in ['moves', 'level', 'solverMoves', 'sacrifices', 'motif', 'pinSquare', 'pinner', 'gain', 'localGain']:
                assert evidence[key] == record[key], (record['gameId'], key)
            record.update(goal=evidence['goal'], backSquare=evidence['backSquare'])
            records.append(record)
            games.add(record['gameId'])
            positions.add(record['fen'])
    counts = Counter(record['level'] for record in records)
    assert all(counts[level] >= 20 for level in miner.LEVELS), dict(counts)
    canonical['records'] = records
    temporary = target.with_suffix('.tmp')
    temporary.write_text(json.dumps(canonical, ensure_ascii=False, indent=2) + '\n')
    temporary.replace(target)
    print(f'{len(records)} distinct games:', dict(counts))


if __name__ == '__main__':
    main()
