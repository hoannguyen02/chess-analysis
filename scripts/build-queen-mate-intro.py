"""Publish curated Beginner mates; preserve the approved A/B compositions.

Mate-in-one verification enumerates every legal starting move and every reply.
No engine score is needed: the complete legal tree fits in one ply.
"""
import json
from pathlib import Path
import chess

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'scripts/fixtures/queen-mate'
DESCRIPTION = ('Phối hợp Hậu với Vua hoặc quân khác để chiếu hết. '
               'Bắt đầu với chiếu hết trong một nước; các cấp độ sau yêu cầu '
               'chuẩn bị và phối hợp nhiều nước hơn.')


def verify(record):
    e = record['exercise']
    start = chess.Board(e['fen'])
    assert start.is_valid() and not start.is_game_over(), record['id']
    assert e['beginner'] and e['goal'] == e['outcome'] == 'checkmate'
    assert len(e['moves']) == 1 and len(start.piece_map()) in (3, 4)
    support = chess.parse_square(record['support'])
    assert start.piece_at(support) == chess.Piece.from_symbol(
        record['piece'] if start.turn else record['piece'].lower())
    reviewed, mates = [], []
    for move in list(start.legal_moves):
        san = start.san(move)
        end = start.copy()
        end.push(move)
        row = dict(move=san, checkmate=end.is_checkmate(),
                   legalReplies=[end.san(reply) for reply in end.legal_moves])
        if end.is_checkmate():
            assert start.piece_type_at(move.from_square) == chess.QUEEN
            assert not start.is_capture(move)
            mates.append(san)
            without_queen = end.copy()
            without_queen.remove_piece_at(move.to_square)
            assert not without_queen.is_checkmate()
            if record['piece'] != 'K':
                without_support = end.copy()
                without_support.remove_piece_at(support)
                assert not without_support.is_checkmate()
                row['withoutSupportReplies'] = [without_support.san(reply)
                                                for reply in without_support.legal_moves]
                assert row['withoutSupportReplies'], record['id']
        reviewed.append(row)
    assert e['moves'][0] in mates, record['id']
    end = start.copy()
    end.push_san(e['moves'][0])
    if record['role'] == 'queen-protection':
        assert end.peek().to_square in end.attacks(support)
    else:
        assert any(square in end.attacks(support) for square in
                   chess.SquareSet(chess.BB_KING_ATTACKS[end.king(end.turn)]))
    return dict(id=record['id'], fen=e['fen'], mateIn=1, moves=e['moves'],
                method='Exhaustive legal starting moves and replies; essential queen and non-king support checked by removal.',
                support=record['support'], piece=record['piece'], role=record['role'],
                matingMoves=mates, startingMoves=reviewed)


def main():
    categories = json.loads((DATA / 'composed.json').read_text())
    higher = [e for e in categories[0]['exercises'] if not e.get('beginner')]
    old_audits = json.loads((DATA / 'validation.json').read_text())
    review = json.loads((DATA / 'beginner-reviewed.json').read_text())
    records = review['records']
    assert len(records) == 24 and len({r['id'] for r in records}) == 24
    excluded = {r['fen'] for r in review['replaced']}
    assert not excluded.intersection(r['exercise']['fen'] for r in records)
    audits = [verify(r) for r in records]
    categories[0]['description'] = DESCRIPTION
    categories[0]['exercises'] = [r['exercise'] for r in records] + higher
    audits += [r for r in old_audits if r['fen'] in {e['fen'] for e in higher}]
    assert len(audits) == 44
    for name, data in [('composed.json', categories), ('validation.json', audits)]:
        (DATA / name).write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    print('Verified 24 Beginner mates, including all legal starting moves; preserved 20 A/B compositions.')


if __name__ == '__main__':
    main()
