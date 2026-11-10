"""Check proposed exercises against effective published practice catalogs."""
import json
import subprocess

import chess

from tactic_research import ROOT

SCOPES = {'discovery': '/discovered-attack',
          'defensive-move': '/tactic-positions?theme=defensiveMove',
          'mate-in-one': '/tactic-positions?theme=mateIn1'}


def active_positions(root=ROOT):
    return json.loads(subprocess.check_output(
        ['node', 'scripts/practice-position-index.cjs'], cwd=root, text=True))


def overlaps(positions, topic, fen):
    scope = SCOPES.get(topic, f'/{topic}')
    return [row for row in positions.get(chess.Board(fen).epd(), [])
            if row['scope'] != scope]


def assert_no_overlaps(positions, topic, records):
    for record in records:
        matches = overlaps(positions, topic, record['fen'])
        if matches:
            names = ', '.join(f"{row['topic']} / {row.get('level', '?')} / {row['exercise']}"
                              for row in matches)
            raise ValueError(f"{record['gameId']}: starting position already published in {names}")


def check_publication_positions(root, topic, records):
    records = list(records)
    if records:
        assert_no_overlaps(active_positions(root), topic, records)
