"""Read-only projection of source records through saved Discovery practice decisions.

The exercise API remains authoritative. Tests compare this research/count helper
with that API; user decisions are never rewritten by collection builders.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCOPE = '/discovered-attack'


def position_key(fen):
    return ' '.join(fen.split()[:4])


def load_adjustments():
    return json.loads((ROOT / 'src/lib/server/practice-adjustments.json').read_text())


def projection_snapshot(entries=None):
    entries = load_adjustments() if entries is None else entries
    return [{'id': entry['id'],
             'reference': {key: entry['reference'][key] for key in ('scope', 'fen', 'baseLevel')},
             'level': entry.get('level'), 'removed': entry['removed'],
             **({'destinationScope': entry['destinationScope']} if 'destinationScope' in entry else {})}
            for entry in entries if entry['reference']['scope'] == SCOPE]


def apply(records, entries=None):
    """Project existing researched records; incoming/manual additions use the API."""
    entries = load_adjustments() if entries is None else entries
    choices = {
        position_key(entry['reference']['fen']): entry
        for entry in entries
        if entry['reference']['scope'] == SCOPE
    }
    result = []
    for record in records:
        entry = choices.get(position_key(record['fen']))
        if entry and (
            entry.get('removed') or entry.get('destinationScope', SCOPE) != SCOPE
        ):
            continue
        level = entry.get('level') if entry else None
        result.append({**record, 'level': level or record['level']})
    return result
