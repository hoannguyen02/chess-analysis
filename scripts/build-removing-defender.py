#!/usr/bin/env python3
"""Publish explicitly reviewed defender-removal records and original games."""
import argparse
import json
from pathlib import Path
import chess
from review_store import ReviewStore, review_sha256

ROOT = Path(__file__).resolve().parents[1]
FIXTURES = ROOT / 'scripts/fixtures/removing-defender'
APPROVED = FIXTURES / 'approved.json'
EXCLUDED = FIXTURES / 'excluded.json'
EXERCISES = ROOT / 'src/lib/server/removing-defender-exercises.json'
SOURCES = ROOT / 'src/lib/server/removing-defender-game-sources.json'
LEVELS = ['Beginner', 'A', 'B', 'C', 'C*', 'D']
VALUES = {chess.PAWN:1, chess.KNIGHT:3, chess.BISHOP:3, chess.ROOK:5, chess.QUEEN:9, chess.KING:0}


def position_key(fen):
    return ' '.join(fen.split()[:4])


def balance(board, solver):
    return sum((1 if p.color == solver else -1) * VALUES[p.piece_type]
               for p in board.piece_map().values())


def validate(record, reviews=None):
    exercise = record['exercise']
    if record['status'] != 'approved' or exercise['id'] != record['id']:
        raise ValueError('Only matching approved records can be published')
    bundle, separator, key = record['reviewEvidence'].partition('#')
    if bundle != 'reviews.json' or not separator or not key:
        raise ValueError('Missing local review evidence')
    if reviews is None:
        reviews = ReviewStore(FIXTURES / bundle)
    try:
        evidence = reviews[key]
    except KeyError as error:
        raise ValueError('Missing local review evidence') from error
    if review_sha256(evidence) != record.get('evidenceSha256'):
        raise ValueError('Review evidence changed; record a fresh editorial decision')
    if evidence.get('id') != record['id'] or evidence.get('fen') != exercise['fen']:
        raise ValueError('Evidence ID or FEN differs from exercise')
    if evidence.get('status', evidence.get('decision')) != 'approved':
        raise ValueError('Evidence is not approved')
    if exercise.get('outcome') != 'removing-defender' or exercise.get('goal') != 'material':
        raise ValueError('Exercise must state its verified objective')
    board = chess.Board(exercise['fen'])
    if not board.is_valid() or board.is_game_over(): raise ValueError('Invalid starting position')
    solver = board.turn
    target = exercise.get('removingDefender', {})
    minimum = target.get('minimumGain', 0)
    if minimum <= 0 or not board.piece_at(chess.parse_square(target['target'])):
        raise ValueError('Missing target or verified material threshold')
    lines = [exercise['moves'], *exercise.get('alternativeLines', [])]
    for line in lines:
        if not line: raise ValueError('Empty solution')
        position = board.copy()
        for san in line:
            move = position.parse_san(san)
            if position.san(move) != san:
                raise ValueError(f'Noncanonical move notation: {san}')
            position.push(move)
        if position.is_stalemate() or balance(position, solver) - balance(board, solver) < minimum:
            raise ValueError('Solution does not reach the recorded material objective')
    level = 'Beginner' if exercise.get('beginner') else exercise['difficulty']['level']
    if level not in LEVELS: raise ValueError('Unsupported level')
    if level != 'Beginner':
        grade = exercise['difficulty']; solver_moves = (len(exercise['moves']) + 1) // 2
        if grade['solverMoves'] != solver_moves: raise ValueError('Incorrect solver move count')
        if level in ['A','B','C*'] and grade['sacrificeCount'] != 0: raise ValueError('Unexpected sacrifice')
        if level in ['C','D'] and grade['sacrificeCount'] < 1: raise ValueError('Missing sacrifice')
        if level == 'D' and solver_moves <= 3: raise ValueError('D requires more than three solver moves')
    previous = exercise.get('previousMove')
    if previous:
        prev = chess.Board(previous['fen']); prev.push_san(previous['move'])
        if prev.fen() != board.fen(): raise ValueError('Previous move does not reach the position')
    reference = exercise.get('gameReference')
    if reference:
        source = record['gameSource']; game = chess.Board(source['fen'])
        moves = source['lines'][reference['branch']]
        if source['kind'] != 'game' or reference['collection'] != 'removing-defender':
            raise ValueError('Invalid original-game reference')
        for index, san in enumerate(moves):
            if index == reference['ply'] and game.fen() != board.fen():
                raise ValueError('Original game does not reach exercise')
            game.push_san(san)
        if reference['ply'] == len(moves) and game.fen() != board.fen():
            raise ValueError('Original game does not reach exercise')
        if reference['ply'] > len(moves): raise ValueError('Invalid original-game ply')
    elif level != 'Beginner':
        raise ValueError('Master-game provenance required for non-Beginner records in this collection')
    return level


def build(records, excluded):
    reviews = ReviewStore(FIXTURES / 'reviews.json')
    excluded_ids = {item['id'] for item in excluded if item.get('id')}
    excluded_positions = {position_key(item['fen']) for item in excluded if item.get('fen')}
    excluded_games = {item['gameId'] for item in excluded if item.get('gameId')}
    exercises, sources, seen_ids, seen_positions, seen_games = [], {}, set(), set(), set()
    for record in records:
        exercise = record['exercise']
        ref = exercise.get('gameReference')
        if (record['id'] in excluded_ids or position_key(exercise['fen']) in excluded_positions
                or (ref and ref['id'] in excluded_games)):
            continue
        level = validate(record, reviews)
        key = position_key(exercise['fen'])
        if record['id'] in seen_ids or key in seen_positions:
            raise ValueError('Duplicate ID or starting position')
        seen_ids.add(record['id']); seen_positions.add(key)
        ref = exercise.get('gameReference')
        if ref:
            if ref['id'] in seen_games: raise ValueError('Duplicate source game')
            seen_games.add(ref['id']); sources[ref['id']] = record['gameSource']
        exercises.append((LEVELS.index(level),exercise))
    exercises.sort(key=lambda item:item[0])
    return [item[1] for item in exercises], sources


def main():
    parser = argparse.ArgumentParser(); parser.add_argument('--check',action='store_true')
    args = parser.parse_args()
    records=json.loads(APPROVED.read_text())['records']
    exclusions=json.loads(EXCLUDED.read_text())['records']
    exercises,sources=build(records,exclusions)
    if args.check:
        if json.loads(EXERCISES.read_text()) != exercises or json.loads(SOURCES.read_text()) != sources:
            raise SystemExit('Published output differs from approved records')
    else:
        for path,data in [(EXERCISES,exercises),(SOURCES,sources)]:
            temp=path.with_suffix('.json.tmp');temp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n');temp.replace(path)
    print({level:sum(('Beginner' if e.get('beginner') else e['difficulty']['level'])==level for e in exercises) for level in LEVELS})

if __name__ == '__main__': main()
