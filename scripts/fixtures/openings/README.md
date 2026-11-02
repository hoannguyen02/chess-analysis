# Opening names

Public-domain (CC0) tables from https://github.com/lichess-org/chess-openings
Pinned revision: a6189a30dc273ccb21fc2536a9a2fefd5592a67a
Downloaded 2026-10-26 from the raw GitHub URLs at that revision.

Run `node scripts/build-practice-openings.mjs` after changing game sources.
The generated server-only `practice-openings.json` matches the deepest named
position in the actual saved main line, including transpositions. Custom starting
positions and studies are skipped. Recorded Opening/Variation headers take
precedence; unknown names fall back to a valid recorded ECO code only.
The displayed ECO belongs to the matched opening when using the lookup, which
may differ from a source's broader ECO classification. The display label is always “Khai cuộc”; the game result does not determine
the opening name, classification, or exercise objective.
No opening lookup requires network access at runtime.
