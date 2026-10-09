# Đẳng thức và quy tắc chuyển vế — Grade 7, semester 1

## Research and scope

The [Bà Rịa subject council's Grade 7 teaching plan, hosted by THCS Phước Nguyên](https://storage-edu.vnpt.vn/edu-vtu/sitefolders/thcsphuocnguyen/2022-2023/ppct_toan7_nh2022-2023.pdf) places the bracket and transposition rules in the first-semester rational-number chapter of Chân trời sáng tạo. This is a scope reference, not a claim of matching every textbook's sequence. [Khan Academy's same-operation-on-both-sides lesson](https://www.khanacademy.org/math/7th-engage-ny/engage-7th-module-3/7th-module-3-topic-b/v/why-we-do-the-same-thing-to-both-sides-simple-equations) motivates preserving equality with a balance. Research checked September 26, 2026. All examples and Vietnamese instructional text here are newly authored.

## Teaching design

- Foundation: decide whether 5 + 3 and 8 have equal values; explain only after an attempt. Existing foundation questions assess equality and additive inverses.
- Exploration 1: remove three equal blocks from each side of an 8-to-8 balance. Students can change one side and observe a tilted balance and inequality, then restore equality. Counts are restricted to 0–12. A symbolic balance is used only for nonnegative quantities.
- Exploration 2: choose the changed sign in x + 5 = 12, see subtracting 5 on both sides, choose x, then verify by substitution.
- Exploration 3: x - 2/3 = -1/4. Distinguish the moved term's sign from the unchanged -1/4; show denominator 12 before asking for the result. Verify the original equality afterwards.
- Worked examples cover positive and negative moved terms, common denominators, and why a multiplier cannot simply change sign.
- 55 exercises: 2 foundation, 7 guided, 7 independent checks and 39 extra questions. The 33 power-related “Tìm x” questions live only in this lesson. The temperature and water word problems from “Bài 2. Vận dụng đẳng thức” have been removed.

Choices are neutral until selected and give immediate, explicit correct/incorrect feedback. Wrong choices can be corrected. Exploration completion is temporary and separate from persisted exercise scores. The activity uses buttons (keyboard and touch), live status text, and an accessible description of the balance. No drag-only actions or motion-dependent explanation.

## Integration

Lesson ID: `math-equality-transposition-7`; activity kind: `equality`. Included in fresh libraries and added once to existing libraries without replacing edited lessons. The normal 100-lesson limit still applies. The editor, JSON sharing and duplication use the existing optional activity field. Printed exercises and examples remain usable without the online activity.

During development, the equality and powers lessons read their exercise sets directly from source on load. No new migration is needed for exercise edits; local edits to these two built-in exercise sets are replaced on reload. The old find-x add/move migrations have been removed.

## Worked-example prototype

Step 3 shows one of ten examples at a time. Each click reveals one equation with its explanation; the active moved term is highlighted. Optional details show the equivalent operation on both sides. Once complete, “Xem cách trình bày” hides explanations and substitution checks to leave the same equation-row format as exercise solutions. Mobile explanations stack below their equation. The fifth example calculates a power before transposition. The sixth and seventh examples multiply and divide powers with the same base, compare exponents, and solve for x. Edited example text falls back to the normal authored-block renderer.

The knowledge summary also covers inverse multiplication/division (including an unknown divisor), fraction operations, finding an unknown exponent, and solving two-step linear equations. It states nonzero divisor conditions and natural-exponent restrictions. Saved original summaries receive the expanded text; teacher-edited summaries remain intact.

## Expanded exploration

Khám phá has 16 activities: the balance, two transposition rounds, and thirteen operation rounds covering a missing factor, dividend, divisor, division by a fraction, a known power, an unknown exponent, multiplying and dividing powers with the same base, a two-step linear equation, and a linear equation with parentheses. Each new round asks for the transformation before revealing answer choices; feedback and substitution checks appear immediately after selection. The shared navigation uses the actual activity count. No saved-content migration is needed.

The same-base multiplication round uses `2^x × 2^3 = 2^7`: combine powers, compare exponents, solve `x + 3 = 7`, and check `x = 4`. The knowledge summary includes this example, and unchanged earlier default summaries are upgraded on load.

The division round uses `2^x : 2^3 = 2^4` with natural `x ≥ 3`: subtract exponents, solve `x - 3 = 4`, and check `x = 7`. The summary includes the same example; unchanged multiplication-era summaries are also upgraded.

Two exploration rounds use `2x + 3 = 11` and `3 × (x + 2) = 15` instead of unknown-base squares. They reinforce the order of inverse operations without introducing two possible square roots. The default summary follows the same introductory scope.

## Coverage review

Three additional core skills now span exploration, worked examples, guided transformations, independent checks, and the summary:

- Unknown subtrahend: `5 - x = 8`, retaining the sign of `-x`.
- Negative coefficient: `-2x = 6`, dividing by the signed coefficient.
- Minus before parentheses: `10 - (x + 2) = 3`, changing every sign inside.

Independent checks use different numbers. Saved libraries receive missing examples and coverage questions once; existing edited entries and summaries are preserved. The upgrade respects the 50-block and 100-exercise import limits.

The optional extra exercises still extend beyond this introductory sequence: zero/first exponents, powers of powers, fractional/negative bases, and expressions in the base. These remain extension topics; the core expansion does not reintroduce unknown-base squares. A future powers-focused extension should explicitly scaffold those topics before presenting them as required practice. No new word problems or equations with no/infinitely many solutions are added in this introductory expansion.

## Grade 7 scope correction — 8 October 2026

The both-sides activity, worked example, guided question, independent check, and default summary line were removed at the user's request. Saved copies of these specific built-in entries are removed on reload, while unrelated authored content remains intact.

The [official mathematics curriculum](https://fileth.hcm.shieldix.app/data/hcmedu/thlevanthogv/attachments/2020_5/3cttoan18201918_295202014.pdf) places rational-number operations, bracket rules, and transposition in Grade 7 (printed p. 56), and formal linear equations in one unknown in Grade 8 (printed p. 65). This lesson deliberately keeps x on one side initially. This is an introductory scope choice, not a claim that all both-sides find-x exercises are forbidden throughout Grade 7.

## Fraction notation for isolating x

Division by a numeric coefficient is displayed as a stacked fraction: `x = 8/2`, `x + 2 = 15/3`, and `x = 1/2`. The explanation still says to divide both sides. The same notation applies to worked examples, guided answers, solutions (including exponent exercises), and the summary. Repeated identical lines are omitted when a quotient is already the final fraction. Original division questions and the rule for dividing powers retain division notation. Saved text upgrades only when its converted wording matches the current default, preserving teacher-authored changes. Colon division and equivalent exact decimals remain mathematically valid.
