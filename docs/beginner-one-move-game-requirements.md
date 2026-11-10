# One-move Beginner tactics

Use this format for every newly verified Beginner tactics exercise. The
learner makes one move that wins material, wins the position, delivers mate,
secures a draw or saves the position, according to the stated objective.
Defensive Move is the reference topic. Existing exercises retain their
approval, and owner-authored practice keeps its separate position-first flow.

## Example topics

| Tactics map ID | Required one-move decision |
| --- | --- |
| `defensiveMove` | Remove a visible mate-in-one threat by capturing an attacker, guarding the mating square, blocking a line, or opening an escape square. |
| `hangingPiece` | Capture a loose piece safely and keep the material gain against relevant replies. |
| `fork` | Create two meaningful threats with a short, visible payoff. |
| `pin` | Create a pin that prevents a real escape or defense and enables a visible material gain. |
| `skewer` | Create a skewer whose material payoff is clear when the front piece moves. |
| `mateIn1` | Deliver checkmate in one move. |
| `backRankMate` | Deliver checkmate using the back-rank pattern. |
| `twoRookMate` | Deliver the final ladder mate with the two rooks already coordinated. |

Define the equivalent decision for each other topic. A direct discovered
attack must show a visible payoff from uncovering the line. For a topic built
around a sequence, use a final decision only when it still teaches the named
idea. Keep the level visible and document the gap when the idea requires
several learner moves.
[Tactics map](../scripts/fixtures/tactics-index/tactics-map.json) ·
[Level suitability](tactics-level-suitability.md)

## Position requirements

1. **Use at most 10 pieces.** Count every piece on the board, including kings
   and pawns. Prefer original positions from complete indexed games,
   including positions never used in Levels A–D*. Use the board exactly as
   it appeared in the game. Where the request allows compositions, apply the
   same piece limit and mark the position as composed.
2. **Give the learner exactly one sound move.** Compare every legal move
   against the same explicit objective. The same piece moving to two
   different squares counts as two answers. If two answers work, set the
   position aside for a different format. If an alternative remains
   unresolved, hold the position for further review.
3. **Make the reason visible.** A Beginner should be able to see why the
   tempting alternative fails. Use a direct decision with no sacrifice or
   hidden preparation. A higher engine score alone does not establish a
   unique answer.
4. **Stop after one learner move.** Store one legal answer and keep any
   follow-up in the proof and explanation. For material tactics, verify the
   payoff through replies and recaptures. For draw or saving objectives,
   verify the stated draw mechanism or that the original threat is stopped.
   Evaluate a genuinely new threat separately from the continuation of the
   original attack.
5. **Keep the source context.** For real games, save the exact FEN,
   preceding position and move, source ply, full game, player and event
   details, and archive reference. Prefer the move actually played and
   label a different verified answer as analysis. Give compositions their
   own identity and source label.

## Defensive Move review

Identify the exact move or moves with which the opponent threatens immediate
checkmate. Confirm the threat against natural legal alternatives. After the
answer, check every legal opponent reply for immediate mate and examine
strong checks and captures. A check that merely delays the original threat
is insufficient. Prefer positions where the defensive mechanism can be
explained in one sentence.

For example, use **Trắng đi. Đen dọa chiếu hết ở g2. Hãy hóa giải đe dọa trong
một nước.** If both a king capture and a queen capture solve the problem,
choose a different game position for this collection.
[Defensive Move practice](defensive-move-practice.md)

## Research and publication

Run this research when the owner requests verified Beginner additions. Reuse
the game index and shared review workflow with the topic's own verification
checks. Record why the answer is unique, which alternatives were reviewed,
and how the source position was verified. The shared gate requires a resolved
objective result for every legal move before accepting a unique answer.
Add a topic-specific verifier before submitting unsupported objectives for
publication.

Search for different decisions and both sides to move. Aim for 24 verified
positions per requested topic, show the actual count, and document any
shortfall. Publish reviewed additions alongside existing curated and
owner-authored exercises. Use the shared trainer, game replay and worksheet
flow. The owner can also add positions through the shared Beginner editor.
[Research workflow](tactic-research-workflow.md) ·
[Beginner authoring](tactic-research-workflow.md#beginner-only-position-authoring)
