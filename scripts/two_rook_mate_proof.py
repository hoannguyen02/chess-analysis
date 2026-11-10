"""Independent legal-move verification of a bounded mate certificate."""
import chess

def verify_certificate(proof):
    start=chess.Board(proof['fen']);attacker=start.turn;nodes=proof['nodes'];visited=set()
    def key(board,left):return board.fen(en_passant='fen')+'|'+str(left)
    def verify(board,left):
        ident=key(board,left)
        if ident in visited:return
        node=nodes[ident]
        if board.is_checkmate():
            assert board.turn!=attacker and node=={'mate':True}
            visited.add(ident);return
        assert left>0 and not board.is_game_over(claim_draw=True)
        legal={m.uci() for m in board.legal_moves}
        if board.turn==attacker:
            assert set(node)=={'move'} and node['move'] in legal
            moves=[node['move']]
        else:
            assert set(node)=={'replies'} and set(node['replies'])==legal
            assert len(node['replies'])==len(legal)
            moves=node['replies']
        for uci in moves:
            child=board.copy();child.push_uci(uci)
            verify(child,left-(board.turn==attacker))
        visited.add(ident)
    verify(start,proof['solverMoves'])
    # Ensure the displayed mating branch, not just an unrelated winning plan,
    # is among the branches certified against all replies.
    board=start.copy();left=proof['solverMoves']
    for san in proof['moves']:
        node=nodes[key(board,left)];move=board.parse_san(san)
        if board.turn==attacker:
            assert node['move']==move.uci();left-=1
        else:assert move.uci() in node['replies']
        board.push(move)
    assert board.is_checkmate()
    return len(visited)
