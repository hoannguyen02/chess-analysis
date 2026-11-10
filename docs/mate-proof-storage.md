# Bundled proof storage

Arabian, Anastasia and promotion research use one certificate bundle per topic:

- `scripts/fixtures/arabian-mate/mate-proofs.json`
- `scripts/fixtures/anastasia-mate/mate-proofs.json`
- `scripts/fixtures/promotion/mate-proofs.json`

Each has a `proofs` object keyed by stable game/candidate ID. Certificate values
retain the original FEN, displayed moves, solver-move limit and complete legal
strategy tree. The promotion bundle also contains the four verified expansion
certificates, including its separately tested material-gain certificate.

Python builders, reviewers, proof generators and tests use `MateProofStore` in
`scripts/mate_proof_store.py`. A successful proof updates its entry and atomically
replaces the topic bundle. Run only one writer per topic at a time. No generator
creates individual proof files. References use `mate-proofs.json#<id>`; historical
individual-file references in preserved research records can be read through
`read_proof_reference` without restoring the old files.

Candidate and rejection records are retained unchanged. Accepted and unreviewed
proofs remain available even when not currently selected for publication.
`prune-unused-mate-proofs.py` defaults to a dependency audit; `--apply` removes
only rejected, unreferenced entries from bundles and records the removal. It
never deletes candidate or rejection records. Proof generators skip already
rejected candidates.

Validation: `python3 scripts/test-mate-proof-store.py` checks bundle persistence,
historical-reference resolution and every retained mating certificate. Run the
existing topic/game, promotion-family and underpromotion-expansion tests too.
The consolidation preserved all 611 retained topic certificates plus four
required expansion certificates. The obsolete earlier Goetz discovery proof
was removed; its exclusion remains in `promotion-expansion/decisions.json`.
