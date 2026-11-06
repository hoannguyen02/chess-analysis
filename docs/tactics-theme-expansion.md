# Tactical theme expansion — priorities 1, 2 and 3

The source is the uploaded `Pasted text.txt` from **Chess Coaching Review**
(`6aeaf59e-4a00-83ec-b195-be6070e583ae`), checked against the detailed priority
tables in that conversation. Its JSON was byte-identical to the existing
`scripts/fixtures/tactics-index/tactics-map.json`, SHA-256
`de198207b759b0859304742d9e7ca054db561c45ef70277fce1a779ec7a9d9ce`.

The updated file retains all 75 original entries and their order, and adds 35
canonical entries: 14 at Priority 1, 11 at Priority 2 and 10 at Priority 3.
There are now 110 entries: 60 tactics, 30 checkmate themes, 18 endgame themes
and two special moves. The existing 24 `available` entries remain available;
86 entries are `not-built`. Every addition has `dedicatedPage`, `detector`
and `lichessTheme` set to `null`. These are configuration and research updates;
they do not claim new lessons, verified exercises or automatic detectors.

All original field values are preserved except `stalemate.lichessTheme`, which
is corrected from `"stalemate"` to `null`. The project topic, ID, label, page,
detector and status are retained. The [official Lichess theme source](https://raw.githubusercontent.com/lichess-org/lila/master/modules/puzzle/src/main/PuzzleTheme.scala)
and [current theme list](https://lichess.org/training/themes), checked on
2026-11-04, include `collinearMove` but have no `stalemate` puzzle-theme key.
`lichess-themes.json` is an offline key snapshot for repeatable validation.
An official parent tag is not an exact mapping for a custom subtype.

## Compatible version-1 metadata

The root remains `{ "version": 1, "themes": [...] }`. Required fields and
their meanings are unchanged. Optional additions are:

| Field | Meaning |
| --- | --- |
| `englishLabel` | English reference name. |
| `description` | Vietnamese definition and classification boundary. |
| `priority` | Development order, integer 1–3; independent of exercise difficulty. |
| `levels` | Optional, ordered teaching-suitability array drawn from `Beginner`, `A`, `B`, `C`, `C*`, `D`; not published availability or position grades. |
| `parentId` | One broader canonical theme; references form an acyclic graph. |
| `relatedThemes` | Related canonical IDs; no implied subtype or synonym. |
| `aliases` | Alternate names resolving to this one canonical entry. |

Absent optional fields on existing entries do not imply a new priority or
changed publication status. Existing consumers can continue reading their
original fields. `src/types/tactics-catalog.ts` describes this project schema;
the separate remote puzzle API `PuzzleTheme` type is unchanged.

All 110 current entries now have an initial curriculum-planning `levels`
assessment. See [the per-theme suitability review](tactics-level-suitability.md)
for the rationale and scope of each assignment. Missing `levels` on a future
entry means unassessed. A supplied array must be nonempty, unique and in the
canonical six-level order. For example, `exchangeSacrifice` has `["C", "D"]`,
while `mateIn1` has `["Beginner", "A"]`. Parent arrays are not inherited.

The shared `PracticeLevel` type and `practiceLevels` order include Beginner.
Existing exercise storage keeps its `beginner: true` flag and A–D
`difficulty.level` values. Counts continue to come from published exercise data;
catalog suitability does not create counts, regrade exercises or hide level tabs.

## Priority 1

| Recommendation | Canonical ID | Parent or overlap decision |
| --- | --- | --- |
| Zwischenzug check | `intermezzoCheck` | Child of `intermezzo`; alias `zwischenzugCheck`. |
| Desperado | `desperado` | Related to sacrifice and trapped pieces; a doomed piece need not be offered as a new sacrifice. |
| Counterattack | `counterattack` | Active tactical defense under `defensiveMove`. |
| Countercheck | `countercheck` | Child of `counterattack`; must legally answer the existing check. |
| Cross-check | `countercheck` | Alias `crossCheck`; no second peer entry for the same training concept. |
| Blocking | `blocking` | Broad line-blocking technique; existing `interference` becomes its specific defensive-link subtype. |
| Unpinning | `unpinning` | Child of `defensiveMove`; related to `pin`, not another pin entry. |
| Tactical breakthrough | `tacticalBreakthrough` | Broad breach of a defensive barrier; not every opened line is a breakthrough. |
| Pawn breakthrough | `pawnBreakthrough` | Child of `tacticalBreakthrough`; related to pawn endgames and promotion threats. |
| Mating net | `matingNet` | Coordinated escape-square restriction and mating threats, not a claim of verified forced mate. |
| King hunt | `kingHunt` | Driving and pursuing an exposed King; related to nets without treating every hunt as a net. |
| Exchange sacrifice | `exchangeSacrifice` | Child of `sacrifice`. |
| Windmill | `windmill` | Repeated discovered checks and captures under `discoveredCheck`. |
| Perpetual attack | `perpetualAttack` | Repeated threats need not be checks; related to `perpetualCheck`, not its synonym. |
| Domination | `domination` | Broad restriction of a piece; existing `trappedPiece` becomes the capture-oriented subtype. |

## Priority 2

| Recommendation | Canonical ID | Parent or overlap decision |
| --- | --- | --- |
| Removing an escape square | `removingEscapeSquare` | Child of `matingNet`. |
| Destruction of pawn shield | `pawnShieldDestruction` | Child of `tacticalBreakthrough`; concerns the King's protective pawns. |
| Opening lines | `openingLines` | Breaching opposing blockers by exchanges or pawn levers; related to `clearance`. Moving one's own blocker is classified as clearance. |
| Closing lines | `blocking` | Alias `closingLines`; already covered by the Priority-1 line-blocking entry. |
| Vacating a square | `vacatingSquare` | Specific child of `clearance`. |
| Tactical retreat | `tacticalRetreat` | Retreat with a concrete tactical purpose; not automatically a quiet or defensive move. |
| Tactical prophylaxis | `tacticalProphylaxis` | Preventive technique under `defensiveMove`. |
| Zwischenzug capture | `intermezzoCapture` | Child of `intermezzo`; alias `zwischenzugCapture`. A checking capture may also carry `intermezzoCheck`. |
| Tactical liquidation | `tacticalLiquidation` | Calculated exchange sequence under existing `simplification`, not a second general simplification topic. |
| Promotion threat | `promotionThreat` | The threat itself earns a concession; related to actual promotion topics. Existing `promotion` is scoped to material gain, so it is not used as a false umbrella for every threat. |
| Stalemate trap | `stalemateTrap` | Child of existing `stalemate`, without a duplicate general draw topic. |
| Perpetual-check trap | `perpetualCheckTrap` | Child of existing `perpetualCheck`. |

## Priority 3

| Recommendation | Canonical ID | Parent or overlap decision |
| --- | --- | --- |
| Greek Gift | `greekGift` | Named sacrifice pattern under `sacrifice`; no automatic soundness claim. |
| Lasker double-bishop sacrifice | `laskerDoubleBishopSacrifice` | Child of `sacrifice`; distinct from the existing two-bishop mate pattern. |
| Rook lift attack | `rookLiftAttack` | Rook transfer technique; may operate on either wing. |
| Exchange sacrifice on c3/c6 | `exchangeSacrificeC3C6` | Specific child of `exchangeSacrifice`. |
| Tactical domination of Queen | `queenDomination` | Child of `domination`. |
| Positional sacrifice | `positionalSacrifice` | Child of `sacrifice`, related to exchange sacrifices; compensation may be long term. |
| Double threat creation | `doubleThreatCreation` | Broader two-threat concept; existing single-piece `fork` becomes its subtype. |
| Defensive resource combination | `defensiveCombination` | Coordinated defense under `defensiveMove`. |
| Fortress breakthrough | `fortressBreakthrough` | Related to `fortress`; tests whether a claimed fortress can actually hold. The existing drawing objective is not made a parent of the opposite task. |
| Long forcing combination | `longForcingCombination` | Calculation tag, paired with concrete motifs; length alone does not determine an exercise level. |

These tables cover all 37 recommendations with 35 canonical additions. The
full earlier tables place exchange sacrifices and windmills in Priority 1 and
defensive combinations in Priority 3; the shorter handoff summary did not
preserve those details. The detailed tables determine this configuration.

Additional legacy relationships are `discoveredCheck → discoveredAttack` and
`doubleCheck → discoveredCheck`. Parent-child links describe conceptual scope;
they do not imply that a parent detector proves the child. Related themes may
co-occur in one combination without becoming synonyms. The checking-capture
intersection is intentional multi-tagging, not two copies of the same entry.

## Code integration and validation

`scripts/tactics_catalog.py` validates the version-1 fields, unique IDs and
labels, supported Lichess mappings, references, alias collisions and parent
cycles, plus level-array values, order and uniqueness. `validate-map` reports
assessed and unassessed theme suitability separately from development priorities.
The research CLI resolves aliases to one canonical ID for `query`,
`export-leads` and `set-status`. A parent query does not silently aggregate
children or change a lead's review status. Puzzle import maps exact official
keys to project IDs and does not infer custom children from broad Lichess tags.
Existing source-game replay and publication checks remain required.

`src/lib/server/tactics-catalog.ts` reads the same JSON. After authentication,
`/api/private-tactics` returns it as the additive `themeCatalog` property.
The existing `hubPath` and `topicGroups` response fields and working public
Lichess links remain unchanged. The new unbuilt entries are not rendered as
invented practice URLs. No new practice page or worksheet source is registered.

The stalemate-trap definition follows [FIDE Laws, Article 5.2.1](https://handbook.fide.com/chapter/e012023):
the side to move has no legal move and its King is not in check. The new
descriptions do not equate repeated attacks or an engine's drawn evaluation
with automatic game termination.

```sh
python3 scripts/tactics-index.py validate-map
python3 scripts/test-tactics-index.py
node --test scripts/test-practice-access.cjs scripts/test-public-pages.cjs
node --test scripts/test-draw-levels.cjs scripts/test-worksheets.cjs
node_modules/.bin/tsc --noEmit --incremental false
```

The six practice levels remain Beginner, A, B, C, C*, D. Priority metadata does
not change their definitions, the 24-verified-position target per level, or
the requirement to report genuine research gaps when a page is implemented.
