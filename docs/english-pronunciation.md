# Saved vocabulary pronunciation

Import and Update pronunciations share the same enrichment pipeline. Learning
views render saved values only. Import saves lessons immediately and then prepares
pronunciation in the background, so cold dictionary requests never block access
to the imported content. JSON exports and newly generated share links
preserve UK, US and general IPA with their source URLs.

## Lookup and provenance

The server fetches Wiktionary's public REST HTML endpoint, extracts the English
pronunciation section and retains broad /IPA/. Explicit regional labels identify
UK and US. Up to three documented regional variants can be displayed together;
the app does not silently choose between them. An unqualified transcription is stored as `IPA`, never invented as UK
or US. Narrow phonetic variants in [brackets] are not used. Conflicting headword
pronunciations and known heteronyms remain pending context. A deliberately narrow
rule recognizes classroom imperatives such as "Read the word"; arbitrary English
sentences are not grammatically analyzed. Phrases are not synthesized from words.

Wiktionary data: © Wiktionary contributors, CC BY-SA 4.0
https://creativecommons.org/licenses/by-sa/4.0/.
Every saved transcription retains a link to the source entry and its attribution.
Extraction strips page markup and selects eligible regional/general IPA. A small
previously reviewed set retains its Cambridge source links. No wordlist derived
from automatic pronunciation generation has been bundled.

## Performance and recovery

- One lookup per normalized word, requests of at most 16 words.
- Four concurrent upstream requests per batch; eight process-wide maximum.
- Four-second upstream timeout; twenty-second client batch timeout. No global
  deadline silently truncates a large import.
- Server cache and in-flight deduplication; bounded to 2,000 entries.
- Versioned browser cache: successful results 30 days, not-found/context outcomes
  one day, maximum 2,000 entries. Network failures are never persisted.
- Completed batches are cached immediately. Updates reuse them across imports,
  reloads and retries. A wholly failed batch stops an outage from causing hundreds
  of doomed requests; unfinished entries are reported separately.
- Stop lookup keeps completed results; the next update resumes remaining entries.
- Existing saved pronunciations survive failures. Editing vocabulary text or its
  example clears the old IPA so unrelated pronunciation does not remain attached.

Dictionary HTML can change. Unexpected markup and service failures are reported
as unchecked, not as absent dictionary entries. This is sourced dictionary data,
not a guarantee of pronunciation correctness for every meaning or context.

Validation: `node --test scripts/test-pronunciation.cjs` includes real extracted
pages, negative cases, cache/resume/cancel tests, and a full-template batching
benchmark with mocked network. Fixture attribution is in
`scripts/fixtures/pronunciations/README.md`.
