"""Validate the shared theme catalog and resolve names without creating new tags."""
import json
from pathlib import Path
import re

MAP = Path(__file__).resolve().parent / 'fixtures/tactics-index/tactics-map.json'
LICHESS_KEYS = MAP.with_name('lichess-themes.json')
REQUIRED = {'id', 'label', 'kind', 'dedicatedPage', 'lichessTheme', 'detector', 'status'}
OPTIONAL = {'englishLabel', 'description', 'priority', 'levels', 'parentId', 'relatedThemes', 'aliases'}
KINDS = {'tactic', 'checkmate', 'endgame', 'special-move'}
PRACTICE_LEVELS = ('Beginner', 'A', 'B', 'C', 'C*', 'D', 'D*', 'E', 'E*')
STARRED_SOLVER_MOVES = {'C*': (2, 3), 'D*': (4, 5)}
REVIEWED_LEVEL_MOVE_LIMITS = {
    **STARRED_SOLVER_MOVES, 'D': (4, 5), 'E': (6, None), 'E*': (6, None),
}


def matches_current_level(record):
    """Check the structural grade before tactical and editorial review."""
    level = record['level']
    limits = REVIEWED_LEVEL_MOVE_LIMITS.get(level)
    if limits is None:
        return True
    minimum, maximum = limits
    count = (len(record.get('moves', ())) + 1) // 2
    return (count >= minimum and (maximum is None or count <= maximum)
            and record.get('solverMoves', count) == count
            and bool(record.get('sacrifices')) == (not level.endswith('*')))


def validate_catalog(data):
    """Check the version-1 contract, references, aliases and parent graph."""
    if (not isinstance(data, dict) or set(data) != {'version', 'themes'}
            or type(data['version']) is not int or data['version'] != 1
            or not isinstance(data['themes'], list) or not data['themes']):
        raise ValueError('expected a version-1 theme catalog')
    supported = set(json.loads(LICHESS_KEYS.read_text())['keys'])
    by_id, names, labels, mappings = {}, set(), set(), set()
    for theme in data['themes']:
        if (not isinstance(theme, dict) or not REQUIRED <= theme.keys()
                or theme.keys() - REQUIRED - OPTIONAL):
            raise ValueError('invalid theme fields')
        identifier = theme['id']
        if not isinstance(identifier, str) or not re.fullmatch(r'[a-z][A-Za-z0-9]*', identifier):
            raise ValueError('invalid theme ID')
        if identifier in names:
            raise ValueError(f'duplicate ID or alias: {identifier}')
        names.add(identifier)
        by_id[identifier] = theme
        for key in ('label', 'englishLabel', 'description'):
            if key in theme and (not isinstance(theme[key], str) or not theme[key].strip()):
                raise ValueError(f'{identifier}: invalid {key}')
        if theme['label'] in labels:
            raise ValueError(f'duplicate label: {theme["label"]}')
        labels.add(theme['label'])
        if (not isinstance(theme['kind'], str) or theme['kind'] not in KINDS
                or not isinstance(theme['status'], str) or theme['status'] not in {'available', 'not-built'}):
            raise ValueError(f'{identifier}: invalid kind or status')
        page = theme['dedicatedPage']
        if page is not None and (not isinstance(page, str) or not re.fullmatch(r'/[a-z0-9-]+', page)):
            raise ValueError(f'{identifier}: invalid dedicated page')
        if theme['status'] == 'available' and page is None:
            raise ValueError(f'{identifier}: available theme needs a dedicated page')
        for key in ('lichessTheme', 'detector'):
            if theme[key] is not None and (not isinstance(theme[key], str) or not theme[key].strip()):
                raise ValueError(f'{identifier}: invalid {key}')
        mapping = theme['lichessTheme']
        if mapping is not None:
            if mapping not in supported or mapping in mappings:
                raise ValueError(f'{identifier}: unknown or duplicate Lichess mapping')
            mappings.add(mapping)
        if 'priority' in theme and (type(theme['priority']) is not int or theme['priority'] not in (1, 2, 3)):
            raise ValueError(f'{identifier}: invalid priority')
        if 'levels' in theme:
            levels = theme['levels']
            if (not isinstance(levels, list) or not levels
                    or any(not isinstance(level, str) or level not in PRACTICE_LEVELS for level in levels)):
                raise ValueError(f'{identifier}: invalid levels')
            if levels != [level for level in PRACTICE_LEVELS if level in levels]:
                raise ValueError(f'{identifier}: levels must be unique and in practice order')
        if 'parentId' in theme and not isinstance(theme['parentId'], str):
            raise ValueError(f'{identifier}: invalid parent')
        for key in ('relatedThemes', 'aliases'):
            if key not in theme:
                continue
            values = theme[key]
            if (not isinstance(values, list) or not values
                    or any(not isinstance(value, str) or not value for value in values)
                    or len(values) != len(set(values))):
                raise ValueError(f'{identifier}: invalid {key}')
        for alias in theme.get('aliases', []):
            if not re.fullmatch(r'[a-z][A-Za-z0-9]*', alias) or alias in names:
                raise ValueError(f'duplicate or invalid alias: {alias}')
            names.add(alias)
    for identifier, theme in by_id.items():
        references = theme.get('relatedThemes', []) + ([theme['parentId']] if 'parentId' in theme else [])
        if any(ref not in by_id or ref == identifier for ref in references):
            raise ValueError(f'{identifier}: unknown or self reference')
    for identifier in by_id:
        chain, current = set(), identifier
        while current is not None:
            if current in chain:
                raise ValueError(f'{identifier}: parent cycle')
            chain.add(current)
            current = by_id[current].get('parentId')
    return data


def load_catalog(path=MAP):
    return validate_catalog(json.loads(path.read_text()))


def resolve_theme_id(catalog, name):
    """An alias names one canonical theme; it never implies a subtype match."""
    for theme in catalog['themes']:
        if name == theme['id'] or name in theme.get('aliases', []):
            return theme['id']
    raise ValueError(f'unknown theme: {name}')
