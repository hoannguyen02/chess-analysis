# Theme-level suitability review

This is the initial curriculum-planning assessment of the 110 canonical themes
in `scripts/fixtures/tactics-index/tactics-map.json`, reviewed on 2026-11-04
against the level definitions in `AGENTS.md`. Each theme was assessed for its
own instructional scope, independently of its development priority, parent,
Lichess tags, existing counts or the number of moves in its name.

`levels` lists planned teaching suitability. It is not a set of published
collections, a position grade, proof that 24 suitable positions exist, or a
permission to publish an unverified exercise. An omitted level is outside this
initial teaching plan, not a claim that no suitable chess position could ever
exist. Revisit the assessment with a specific reviewed example when needed.
Existing approved exercises retain their grades and publication status.

All six navigation choices remain Beginner, A, B, C, C*, D, with actual counts;
the target remains 24 verified positions per level where suitable. This metadata
must not hide tabs, create counts or infer an exercise's grade. Missing `levels`
means unassessed, never all levels; a present array must be nonempty, unique and
in that exact order. Parent suitability is not inherited by a child.

For each candidate, assess the full solution, shorter alternatives, relevant
defensive replies, material recovery and sacrifices under the existing research
and publication requirements. Beginner/A/B/C* have no voluntary sacrifice;
C needs a simple sacrifice; D needs complex sacrificial coordination and more
than three solver moves. An unavoidable loss by a doomed piece is not by itself
a new voluntary sacrifice. An equal exchange is not a sacrifice.

Beginner promotion choices that require avoiding stalemate remain excluded from
Beginner, even though the broad underpromotion theme also has direct introductory
cases. Mate-in-N is an objective length, not a difficulty: mate in one has no
preparatory move, and mates within three solver moves cannot meet the D limit.
Named final mating patterns can be taught directly or reached after preparation;
advanced tasks must include that preparation in their published solution.

The table below records the initial scope and reason for each entry. These are
editorial planning decisions, not new tactical-verification certificates.

| Theme ID | Suitable levels | Planning rationale |
| --- | --- | --- |
| `fork` | Beginner, A, B, C, C*, D | A direct fork supports first recognition; preparations and sacrificial coordination support later levels. |
| `pin` | Beginner, A, B, C, C*, D | Create a simple effective pin first; add defender restrictions, exchanges and sacrificial preparations later. |
| `skewer` | Beginner, A, B, C, C*, D | Direct King/Queen skewers can be isolated; later cases prepare the line and account for material recovery. |
| `discoveredAttack` | Beginner, A, B, C, C*, D | A simple uncovering move can show the gain directly; later positions add timing, replies and sacrifices. |
| `discoveredCheck` | Beginner, A, B, C, C*, D | An elementary discovered check can gain material visibly; longer preparations and sacrifices add difficulty. |
| `capturingDefender` | Beginner, A, B, C, C*, D | A safe direct capture can remove a real defender; later positions require exchanges, calculation or sacrifices. |
| `doubleCheck` | Beginner, A, B, C, C*, D | A sparse direct double-check position can show the payoff; preparations and mating combinations extend the motif. |
| `hangingPiece` | Beginner, A, B, C* | Plan direct safe captures, short safety checks and deeper non-sacrificial exploitation; do not add sacrificial cases without a specific motif review. |
| `trappedPiece` | Beginner, A, B, C, C*, D | A single simple escape restriction can trap a piece; deeper escape analysis and sacrifices extend the task. |
| `attraction` | A, B, C, C*, D | Introduce a short non-sacrificial lure or equal exchange before sacrificial and longer versions; reply comparison exceeds the initial Beginner scope. |
| `deflection` | Beginner, A, B, C, C*, D | A safe direct threat can drive a defender from its duty; exchanges and sacrifices extend the mechanism. |
| `clearance` | Beginner, A, B, C, C*, D | A safe move can clear a needed square or line with a visible payoff; longer and sacrificial preparations also fit. |
| `interference` | Beginner, A, B, C, C*, D | A simple protected interposition can sever a real defensive link; later cases add recaptures, coordination and sacrifices. |
| `intermezzo` | A, B, C, C*, D | The learner must compare an expected move with an intervening threat; introduce this choice after direct Beginner motifs. |
| `xRayAttack` | A, B, C, C*, D | Seeing through a blocker and checking exchanges needs more than initial board vision; preparation and sacrifice can vary the difficulty. |
| `overloading` | Beginner, A, B, C, C*, D | A sparse position can show one defender unable to meet two duties; advanced cases add timing and sacrifices. |
| `defensiveMove` | Beginner, A, B, C, C*, D | A direct protective or active defensive move can be elementary; full defensive combinations can include sacrifice and deeper calculation. |
| `zugzwang` | A, B, C, C*, D | Compare the opponent's legal moves and the effect of losing a tempo; use short examples before deeper or sacrificial preparations. |
| `quietMove` | A, B, C, C*, D | The hidden follow-up needs anticipation beyond a direct Beginner payoff; quiet moves can prepare both non-sacrificial and sacrificial combinations. |
| `sacrifice` | C, D | Giving up material is the defining lesson; use simple purposeful sacrifices at C and complex coordination beyond three solver moves at D. |
| `attackingF2F7` | Beginner, A, B, C, C*, D | A direct vulnerable-square attack can be simple; combinations around the same target can require preparation or sacrifice. |
| `exposedKing` | Beginner, A, B, C, C*, D | A direct mating or material threat against an exposed King can be isolated; longer attacks and sacrifices remain possible. |
| `collinearMove` | A, B, C, C*, D | Sliding along an opposing line requires checking captures and tactics; introduce directly at A, then add coordination or sacrifices. |
| `kingsideAttack` | Beginner, A, B, C, C*, D | A simple direct threat on the kingside can introduce the idea; the broad attacking context also permits deeper and sacrificial tasks. |
| `queensideAttack` | Beginner, A, B, C, C*, D | A simple direct threat on the queenside can introduce the idea; the broad attacking context also permits deeper and sacrificial tasks. |
| `mate` | Beginner, A, B, C, C*, D | The objective includes immediate elementary mates and prepared combinations; grade the complete position and proof, not the objective tag. |
| `backRankMate` | Beginner, A, B, C, C*, D | The direct blocked-back-rank pattern is elementary; defender removal, preparation and sacrifice create advanced versions. |
| `arabianMate` | Beginner, A, B, C, C*, D | A sparse Rook-and-Knight mating pattern can be direct; earlier coordination and sacrificial preparation support later levels. |
| `anastasiaMate` | Beginner, A, B, C, C*, D | Direct Rook/Knight confinement is accessible in a sparse position; opening the required lines can involve deeper or sacrificial play. |
| `oneRookMate` | Beginner, A, B, C, C*, D | Direct Rook mating positions can be simple; the full task may include substantial preparation or sacrificial transitions. |
| `twoRookMate` | Beginner, A, B, C, C*, D | Direct two-Rook coordination is elementary; preparation and sacrifices can precede the final pattern. |
| `queenMate` | Beginner, A, B, C, C*, D | Direct Queen mating positions can be elementary; the route to the mating position can include preparation and sacrifices. |
| `queenRookMate` | Beginner, A, B, C, C*, D | An elementary Queen/Rook mate can be isolated; later cases require coordination, line opening or sacrifice. |
| `rookBishopMate` | Beginner, A, B, C, C*, D | A direct Rook/Bishop pattern can be sparse and visible; more complex preparation and sacrifices can create it. |
| `mateIn1` | Beginner, A | One solver move can be elementary or require wider board vision; it has no preparation or material sacrifice within the solution. |
| `mateIn2` | Beginner, A, B, C | Sparse two-move mates can be introductory; a short preparation or simple first-move sacrifice fits B/C. Two solver moves cannot meet D. |
| `mateIn3` | A, B, C | Plan direct familiar patterns, short coordination or a simple sacrifice; do not infer advanced difficulty solely from three solver moves. |
| `mateIn4` | B, C, C*, D | Plan coordinated examples and deeper non-sacrificial or sacrificial tasks; D additionally needs complex sacrifice and more than three solver moves. |
| `mateIn5` | B, C, C*, D | A long forcing line can still involve simple coordination; C*, C and D require their own calculation and sacrifice criteria. |
| `blindSwineMate` | Beginner, A, B, C, C*, D | Direct two-Rook confinement can be isolated; preparation and sacrifices can establish the pattern in advanced tasks. |
| `operaMate` | Beginner, A, B, C, C*, D | A direct supported Rook mate is visible with few pieces; line opening and sacrifices can precede it. |
| `pillsburysMate` | Beginner, A, B, C, C*, D | The Bishop's confinement and Rook's final check can be direct; advanced tasks may require preparation and sacrifices. |
| `smotheredMate` | Beginner, A, B, C, C*, D | A direct Knight mate against a confined King is elementary; longer clearance and sacrifice combinations add difficulty. |
| `morphysMate` | Beginner, A, B, C, C*, D | A direct Bishop mate supported by Rook confinement can be isolated; earlier combinations can prepare it. |
| `doubleBishopMate` | Beginner, A, B, C, C*, D | Two adjacent attacking diagonals can make a direct pattern; preparation and sacrifices can build the required position. |
| `bodenMate` | Beginner, A, B, C, C*, D | The direct crossed-diagonal mate can be shown sparsely; advanced versions create the diagonals through combinations. |
| `dovetailMate` | Beginner, A, B, C, C*, D | The final Queen mate and blocked escapes are easy to recognize; creating that confinement can require complex preparation. |
| `epauletteMate` | Beginner, A, B, C, C*, D | Blocked neighboring escape squares make a direct pattern; inducing those blockers can involve preparation or sacrifices. |
| `cornerMate` | Beginner, A, B, C, C*, D | A sparse direct corner confinement and Knight mate can be introductory; preparation can add later-level demands. |
| `hookMate` | Beginner, A, B, C, C*, D | The direct Rook/Knight/pawn pattern can be shown clearly; coordinating those roles can require later-level calculation. |
| `triangleMate` | Beginner, A, B, C, C*, D | Direct Queen/Rook geometry can be isolated; line opening, preparation and sacrifices can establish it. |
| `killBoxMate` | Beginner, A, B, C, C*, D | The final Queen-supported Rook mate can be elementary; preparing the confinement can be substantially harder. |
| `balestraMate` | Beginner, A, B, C, C*, D | The Queen's escape control and Bishop's mating move can be direct; advanced tasks create those roles first. |
| `swallowstailMate` | Beginner, A, B, C, C*, D | The final confinement can be recognized directly; earlier coordination and sacrifices can create the pattern. |
| `vukovicMate` | Beginner, A, B, C, C*, D | A direct supported Rook mate with Knight confinement can be sparse; complex preparations can precede the final pattern. |
| `promotion` | Beginner, A, B, C, C*, D | Direct safe promotions and capture-promotions introduce the idea; preparation, pawn races and sacrifices extend the material objective. |
| `underPromotion` | Beginner, A, B, C, C*, D | A short visible non-Queen promotion payoff can be introductory; choices requiring avoidance of stalemate start at A, with deeper combinations later. |
| `promotionMate` | Beginner, A, B, C, C*, D | Direct promotion delivering mate can be elementary; earlier preparation and sacrificial combinations extend the task. |
| `passedPawnSimplification` | Beginner, A, B, C, C*, D | Plan a simple safe exchange enabling a passer before coordinated exchanges, deeper calculations and sacrificial transitions. |
| `simplification` | Beginner, A, B, C, C*, D | A direct meaningful exchange can introduce simplification; calculated sequences and sacrificial transitions support later levels. |
| `perpetualCheck` | Beginner, A, B, C, C*, D | A short visible checking cycle can be isolated; preparation, defensive choices and sacrifices extend the task without changing the draw objective. |
| `stalemate` | Beginner, A, B, C, C*, D | Simple non-sacrificial final decisions can introduce the draw objective; forcing or trap-based preparations can require more calculation and sacrifices. |
| `repetition` | Beginner, A, B, C, C*, D | A short visible repetition can introduce the idea; longer non-checking maneuvers and sacrificial preparations add difficulty. |
| `fortress` | Beginner, A, B, C, C*, D | A sparse visible defensive zone can be introductory; constructing or preserving a fortress can require deep calculation or sacrifices. |
| `insufficientMaterial` | Beginner, A, B, C, C*, D | A direct exchange into an established dead position can be elementary; preparatory combinations and sacrifices can reach the same objective. |
| `pawnRace` | A, B, C, C*, D | Timing competing passers needs comparison beyond a routine Beginner promotion; races can include preparation, sacrifices and counterpromotion calculation. |
| `opposition` | A, B, C, C*, D | Compare King replies and move order after basic King movement; deeper maneuvers or sacrificial transitions may establish the opposition. |
| `pawnEndgame` | Beginner, A, B, C, C*, D | A broad phase container can include direct elementary pawn decisions, longer maneuvers and breakthrough sacrifices. |
| `rookEndgame` | Beginner, A, B, C, C*, D | A broad phase container can include direct Rook decisions, short coordination, deep non-sacrificial play and sacrifices. |
| `bishopEndgame` | Beginner, A, B, C, C*, D | A broad phase container can include simple Bishop decisions, maneuvering and sacrificial transitions. |
| `knightEndgame` | Beginner, A, B, C, C*, D | A broad phase container can include simple Knight decisions, deeper coordination and sacrifice-based tactics. |
| `queenEndgame` | Beginner, A, B, C, C*, D | A broad phase container can include a direct elementary decision or deeper checking, defensive and sacrificial combinations. |
| `queenRookEndgame` | Beginner, A, B, C, C*, D | A sparse direct decision can introduce this broad phase container; coordination and sacrifices can make later tasks harder. |
| `enPassant` | Beginner, A, B, C, C*, D | A direct legal special-move decision can be isolated; preparation and combinations can make the move essential in advanced tasks. |
| `castling` | Beginner, A, B, C, C*, D | The direct special move can be introduced simply; timing and tactical combinations around it can require later-level work. |
| `intermezzoCheck` | A, B, C, C*, D | Compare the expected move with an intervening check; preparation, sacrifice and deeper continuations vary the task. |
| `desperado` | A, B, C, C*, D | Accounting for a doomed piece requires comparing losses and useful threats; additional voluntary sacrifices must be assessed separately. |
| `counterattack` | Beginner, A, B, C, C*, D | A simple active reply to a visible threat can be isolated; later tasks add calculation and sacrifices. |
| `countercheck` | A, B, C, C*, D | Answering one check while checking the other King requires careful legal-move comparison; preparations and sacrifices can add difficulty. |
| `blocking` | Beginner, A, B, C, C*, D | A simple safe line block can have a visible purpose; advanced tasks add timing, exchanges and sacrifices. |
| `unpinning` | A, B, C, C*, D | Build on pin recognition by comparing ways to release a restricted piece; later cases can use sacrifice or deeper coordination. |
| `tacticalBreakthrough` | A, B, C, C*, D | Start with a short breach of a defensive point after direct motif recognition; deeper and sacrificial breakthroughs remain eligible. |
| `pawnBreakthrough` | A, B, C, C*, D | Compare pawn advances, captures and the resulting passer; simple and complex pawn sacrifices must use C/D rather than non-sacrificial levels. |
| `matingNet` | Beginner, A, B, C, C*, D | A sparse direct escape-square restriction can be elementary; creating a net can also require preparation and sacrifices. |
| `kingHunt` | B, C, C*, D | An extended pursuit requires coordination and reply comparison; separate deeper non-sacrificial hunts from sacrificial combinations. |
| `exchangeSacrifice` | C, D | A voluntary Rook-for-minor-piece material concession defines the theme; simple clear cases fit C, advanced coordination beyond three solver moves fits D. |
| `windmill` | A, B, C, C*, D | An established short checking-and-capture cycle may be direct; preparation and sacrifice can create longer or more complex cycles. |
| `perpetualAttack` | B, C, C*, D | Maintaining non-checking threats needs coordination and escape analysis; include deeper and sacrificial preparations only when the objective is clear. |
| `domination` | A, B, C, C*, D | Plan general activity restriction after basic trapping recognition; direct, coordinated, deep and sacrificial versions remain distinct. |
| `removingEscapeSquare` | Beginner, A, B, C, C*, D | A direct final escape-square restriction can be simple; inducing or sacrificing to remove an escape square supports later levels. |
| `pawnShieldDestruction` | A, B, C, C*, D | A short purposeful exchange can open access to the King; deeper pawn-lever and sacrifice combinations increase difficulty. |
| `openingLines` | A, B, C, C*, D | A purposeful pawn lever or exchange needs comparison of replies; later examples may combine deeper calculation and sacrifices. |
| `vacatingSquare` | Beginner, A, B, C, C*, D | A safe square-clearing move can have a direct visible payoff; preparations and sacrifices can establish the same mechanism later. |
| `tacticalRetreat` | A, B, C, C*, D | Introduce the purpose of a backward move after direct tactical recognition; retreat can support both sacrificial and non-sacrificial combinations. |
| `tacticalProphylaxis` | A, B, C, C*, D | Compare the opponent's concrete resource before preventing it; the required prevention can be direct, coordinated, deeper or sacrificial. |
| `intermezzoCapture` | A, B, C, C*, D | Compare the expected continuation with an intervening capture and recovery; do not infer a sacrifice merely because the move captures. |
| `tacticalLiquidation` | A, B, C, C*, D | Evaluate a calculated exchange sequence, beyond the initial simple-exchange introduction; deeper or sacrificial transitions remain possible. |
| `promotionThreat` | A, B, C, C*, D | The threat must earn a concession rather than merely allow routine promotion; this comparison adds preparation beyond the initial promotion lesson. |
| `stalemateTrap` | A, B, C, C*, D | Evaluate whether the opponent can avoid the trap; a sacrifice changes the level and cannot be hidden inside a Beginner label. |
| `perpetualCheckTrap` | A, B, C, C*, D | Compare acceptance and avoidance of the trap; preparation can be non-sacrificial or involve a simple or complex sacrifice. |
| `greekGift` | C, D | The Bishop sacrifice defines the pattern; judge simple clear compensation versus complex coordination and defensive alternatives. |
| `laskerDoubleBishopSacrifice` | D | Plan the full two-sacrifice attack and coordination of the remaining pieces beyond three solver moves; do not shorten it artificially to manufacture an easier level. |
| `rookLiftAttack` | A, B, C, C*, D | A direct Rook transfer can be short and clear; preparation, deep coordination and sacrifices can extend it. |
| `exchangeSacrificeC3C6` | C, D | The Rook-for-minor-piece concession defines the subtype; the square alone does not determine whether the complete task is C or D. |
| `queenDomination` | A, B, C, C*, D | Start with a clear Queen-restriction decision; broader coordination, deeper non-sacrificial restrictions and sacrifices can extend the lesson. |
| `positionalSacrifice` | C, D | Giving up material for clear compensation excludes non-sacrificial levels; the complete compensation and coordination need separate position review. |
| `doubleThreatCreation` | Beginner, A, B, C, C*, D | A direct pair of visible threats can be elementary; multi-piece coordination and sacrifices can create harder cases independently of fork. |
| `defensiveCombination` | B, C, C*, D | The complete lesson requires coordinated defensive resources; deeper non-sacrificial play and sacrificial defenses occupy different levels. |
| `fortressBreakthrough` | B, C, C*, D | Testing a defensive structure requires coordination and reply comparison; distinguish a deeper non-sacrificial breach from sacrifice-based play. |
| `longForcingCombination` | C, C*, D | Plan genuinely deeper calculation: a clear simple sacrifice at C, deeper non-sacrificial play at C*, or complex sacrificial coordination beyond three solver moves at D. Do not grade by length alone. |
