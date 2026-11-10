"""Common gates for new verified Beginner exercises, separate from manual practice."""
import chess

from tactic_research import digest


BEGINNER_MAX_PIECES = 10


def beginner_answer(board, moves):
    if not board.is_valid() or board.is_game_over():
        raise ValueError('invalid-or-terminal-beginner-start')
    if board.occupied.bit_count() > BEGINNER_MAX_PIECES:
        raise ValueError('too-many-beginner-pieces')
    if not isinstance(moves, list) or len(moves) != 1 or not isinstance(moves[0], str):
        raise ValueError('beginner-requires-one-learner-move')
    try:
        move = board.parse_san(moves[0])
    except ValueError:
        raise ValueError('illegal-beginner-answer') from None
    if move not in board.legal_moves or moves[0] != board.san(move):
        raise ValueError('illegal-beginner-answer')
    return moves[0]


def require_unique_answer(board, answer, outcomes):
    """Require an objective result for every root. None means unresolved."""
    legal = {board.san(move) for move in board.legal_moves}
    if (not isinstance(outcomes, dict) or outcomes.keys() != legal
            or any(type(value) is not bool for value in outcomes.values())):
        raise ValueError('unresolved-beginner-objective')
    if {move for move, achieved in outcomes.items() if achieved} != {answer}:
        raise ValueError('beginner-objective-requires-exactly-one-sound-move')
    return {'answer': answer, 'outcomes': outcomes}


def source_beginner_proof(adapter, record):
    """Ask the topic to establish its actual objective, never an engine-score proxy."""
    verify = getattr(adapter, 'beginner_outcomes', None)
    if verify is None:
        raise ValueError('unresolved-beginner-topic-proof')
    board = adapter.start_board(record)
    answer = beginner_answer(board, record['moves'])
    if record.get('solverMoves', 1) != 1 or record.get('alternativeLines'):
        raise ValueError('beginner-requires-one-learner-move')
    return require_unique_answer(board, answer, verify(board, record))


def review_composed_beginner(candidate, review, outcome_key, *, goal='material'):
    """Apply the shared gates around a composition profile's exact local review."""
    try:
        board = chess.Board(candidate['fen'])
        answer = beginner_answer(board, candidate.get('moves', [candidate.get('root')]))
        if candidate.get('root', answer) != answer or candidate.get('alternativeLines'):
            raise ValueError('beginner-requires-one-learner-move')
        if (candidate.get('goal') != goal or candidate.get('level') != 'Beginner'
                or candidate.get('source') != 'original-composition'):
            raise ValueError('composition-scope-mismatch')
    except ValueError as error:
        return {'flags': [str(error)], 'roots': [], 'lines': []}
    local = review({**candidate, 'root': answer})
    if not local['flags']:
        try:
            local['beginnerProof'] = require_unique_answer(
                board, answer, {row['move']: row[outcome_key] for row in local['roots']})
        except ValueError as error:
            local['flags'].append(str(error))
    return local


def check_legacy_compositions(entries, version, entries_hash):
    """Only the exact previously approved collection may use its old rules."""
    legacy = [entry for entry in entries if entry['review'].get('verificationVersion') == version]
    if legacy and digest(legacy) != entries_hash:
        raise ValueError('Missing or stale exact-record editorial approval for historical compositions')
