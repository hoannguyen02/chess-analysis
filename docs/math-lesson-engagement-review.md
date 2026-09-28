# Math lesson engagement review

Reviewed 25 September 2026. Priority: Grade 3 and Grade 7, followed by the remaining built-in math lessons.

This is a research and design proposal, not an applied curriculum rewrite. The inventory uses the final `exampleLessons` export after consolidation and grouping: **22 lessons, 206 teaching blocks, 653 exercises**. I reviewed the lesson structures, teaching content, exercise formats and representative questions, the shared rendering/scoring code, and the Grade 3 fraction lesson in the browser. This is not a mathematical correctness audit of every answer or a formal Vietnamese curriculum alignment review.

The browser also displayed 22 lessons, but its saved library differs from the current source: for example, it contains a separate “Cộng hai phân số khác mẫu số” entry and did not show the new exponent lesson. Do not overwrite saved lessons to roll out these ideas; preview a new revision and preserve teacher edits.

## Recommendation

Make the central experience **predict → manipulate → explain → try independently**. Each action should reveal a mathematical relationship. Keep LIMA's calm blue visual identity and Vietnamese teaching language, while giving students something meaningful to change on almost every teaching screen.

Start with three pilots: Grade 3 **Một phần mấy**, Grade 7 **Biểu diễn số trên trục số**, and Grade 7 **Lũy thừa**. Together they establish reusable interactions for quantities, position and symbolic reasoning. The other lessons can reuse these tools without becoming 22 unrelated mini-games.

## What the current app already does well

- A consistent foundation, exploration, worked-example, guided-practice and independent-check sequence.
- “Giảng bài” already isolates one item and provides keyboard navigation. Build on it rather than introducing a second presentation system.
- Fraction equivalence checking, separate numerator/denominator inputs, editable hints and solutions, and a field for specific wrong-answer feedback.
- Grade-appropriate notation, a useful midpoint diagram, step reveal, extra-practice grouping, written self-assessment and printable practice.
- The exponent content already derives rules using repeated factors. The conceptual explanation is a good starting point for interaction.

## Highest-impact friction

| Observation | Why it matters | Proposed change |
|---|---|---|
| Only 28 of 206 blocks have a diagram. Grade 3 addition/subtraction, multiplication/division and measurement have none; Grade 7 rational numbers and powers have none. | Topics about quantities, position and grouping rely heavily on reading rules. | Prioritise a relevant model for these topics, explicitly connected to the notation. Diagram count alone is not a quality measure. |
| “Một phần mấy” has nine exploration blocks, including eight consecutive denominator examples. | The learner sees many completed examples without deciding how to share or shade. | Teach 1/2, 1/3 and 1/4 through action, then extend to 1/5–1/9 using shorter challenges. Preserve the full reference. |
| Every Grade 3 lesson has one foundation question, one guided question and two independent questions. | Broad objectives receive little diagnostic coverage. Measurement's independent check covers multiplication in ml and a plausible length, but not the whole goal. | Add a small exit task for each intended outcome; split broad lessons into short rounds. |
| All eight Grade 3/7 lessons have empty `mistakes` arrays. Across the pack, only one exercise uses that field. | Most incorrect responses get generic advice even when common misconceptions are predictable. | Author two or three useful diagnostic responses per pilot concept. Do not infer a misconception from an ambiguous answer with certainty. |
| `Exercise.tsx` checks 800 ms after typing pauses, and an incorrect check marks the result as assisted. | A pause partway through a number may become a recorded failure. “Needed a hint” and “tried again independently” are also conflated. | Use an explicit **Kiểm tra** button in the pilot. Track checks, retries, hints and solution reveals separately. Keep the current first-attempt metric honest if it remains. |
| Teaching order is all blocks in a section, then all exercises. The schema cannot put a question inside `explore` or `example`. | Merely rewriting prose cannot create demonstration → prediction → demonstration loops. | Add ordered learning steps or a compatible step-reference sequence. |
| The exponent lesson has 14 independent questions and 72 extra questions; other priority lessons usually have two independent questions. | “One lesson” means very different amounts of work. | Offer short rounds with clear outcomes and a visible stopping point. Keep the question bank available. |
| Progress primarily measures sections read or questions solved. | Reading and copying a revealed solution can look like completion without independent transfer. | Show “Đã khám phá”, “Làm được với gợi ý”, and “Tự làm được” as distinct evidence. Verify independence on a fresh problem. |

## Research translated into product decisions

These sources support teaching principles; they do not establish that a particular LIMA feature will improve results. Durations, round sizes and rewards below are design hypotheses to test.

- **Alternate examples and attempts; revisit learning later.** The IES practice guide recommends worked examples interleaved with problems, graphics connected to explanations, concrete/abstract connections, retrieval and explanatory questions. LIMA application: pause a worked solution at a meaningful decision, then revisit the idea with changed numbers in a later session. [IES, Organizing Instruction and Study](https://ies.ed.gov/ncee/wwc/practiceguide/1).
- **Make manipulation explain the maths.** EEF describes how objects and representations can connect practical experience to mathematical ideas, with explicit teacher support. LIMA application: when students distribute 12 objects into three equal groups, connect a group of four to one-third of the whole; then remove the objects on a fresh task. The early-years guidance informs the interaction principle, not a direct Grade 7 efficacy claim. [EEF, manipulatives and representations](https://educationendowmentfoundation.org.uk/early-years/maths/use-manipulatives-and-representations-to-develop-understanding).
- **Feedback must help the next attempt.** EEF's feedback guidance emphasises addressing learning gaps and warns that feedback is not automatically beneficial. LIMA application: point to the relevant interval, group or factor, ask the learner to change something, then check a new attempt. [EEF, Teacher Feedback to Improve Pupil Learning](https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/feedback).
- **Use a short challenge to structure exploration.** PhET's math activity-design resources focus on learning goals and guided inquiry. LIMA application: “Can you make the groups equal?” followed by a question about what stayed the same. An open sandbox can follow the guided round. [PhET, Math Activity Design](https://phet.colorado.edu/cs/teaching-resources/virtual-workshop/math-activity-design).
- **Make interaction accessible.** Dragging needs a non-drag pointer alternative, and keyboard access is a separate requirement. LIMA application: tap an object then a destination, or use labelled plus/minus controls; offer keyboard controls for number lines. Aim for 44 px touch controls as a product target, not a claim that this is WCAG 2.2's AA minimum. [W3C, Dragging Movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements).

## Grade 3: five lesson redesigns

### 1. Một phần mấy — “Chia quà công bằng”

**Keep:** equal parts, a part of a shape versus a part of a collection, and the unequal-pieces counterexample.

**Opening:** “Có 12 chiếc bánh. Chia đều cho 3 bạn. Em sẽ chia thế nào?” Learners tap a tray to give it one cake, with undo available. Equal-sized objects and labelled group counts make the model readable.

**Sequence:**

1. Distribute the objects. Unequal groups are allowed during exploration; checking asks the student to compare the fullest and emptiest groups.
2. With 4–4–4, highlight one complete tray: “Một bạn nhận mấy chiếc bánh?” Then: “Phần của một bạn là một phần mấy của cả 12 chiếc bánh?”
3. If the learner selects 1/4, say: “4 là số bánh trong một nhóm. Cả 12 chiếc bánh được chia thành mấy nhóm bằng nhau?” Highlight group boundaries, not individual objects.
4. Transfer to a paper strip: choose three equal sections and shade one. Connect the same 1/3 notation to a different representation.
5. Show equal and unequal partitions. Ask which supports the claim that every piece is one-third, and why.
6. Exit with a new collection, such as 15 objects shared among five children: identify 3 objects per group and 1/5 of the whole. Start without the worked model visible.

Introduce 1/2, 1/3 and 1/4 first; use 1/5–1/9 as subsequent rounds. Do not introduce general fraction arithmetic here. Celebrate the mathematical action: “Em đã chia thành 3 nhóm bằng nhau.”

### 2. Tìm thành phần trong phép cộng, phép trừ — “Túi bí mật”

Start with a part–whole strip: a covered quantity plus 15 counters makes 39. Let the student uncover enough information to choose a calculation before entering the answer. Connect **whole = part + part** to all three unknown positions.

Use 39 − □ = 24 and □ − 15 = 24 side by side after the first demonstration. Ask: “Ô trống là số ban đầu hay số đã lấy đi?” Only then choose subtraction or addition. Replacing the blank with the answer should visibly rebuild the original equality.

Move from small quantities to the current three-digit examples after the relationship is understood. Avoid hundreds of tiny counters; switch to labelled bars or place-value blocks. Exit: a new unknown-position problem plus a choice explaining the operation.

### 3. Tìm thành phần trong phép nhân, phép chia — “Xưởng đóng hộp”

Use the same 24 objects with two questions: “Có 4 hộp, mỗi hộp mấy chiếc?” and “Mỗi hộp 6 chiếc, cần mấy hộp?” The first changes group size; the second changes group count.

Connect each arrangement to □ × 4 = 24, □ : 4 = 6 and 24 : □ = 6. Let students choose the unknown's meaning before selecting the inverse operation. Keep the current restrictions on division by zero and exact division.

Feedback for confusing 4 and 6 should identify what the question asks for: number of boxes or items per box. Exit: build or select the model for a new story, then calculate and substitute back.

### 4. Một số đơn vị đo — “Phòng đo lường”

Split into length, mass and capacity rounds before mixing them. Each begins with **estimate → use instrument → explain the unit**.

- Length: move a virtual ruler so its zero aligns with an object's end. Later present a ruler beginning at a nonzero mark and ask for the difference. On-screen cm are diagram units, not the device's physical centimetres.
- Mass: add labelled weights to balance a parcel; connect 1 kg with 1,000 g.
- Capacity: add 100 ml portions to a 1 l jug, then show the equivalent reading. Never imply ml and g can be interchanged generally.

When the unit is already fixed by “6 cm = □ mm”, display **mm** as a suffix rather than requiring it again. When choosing the unit is the learning goal, use plausible unit choices. Exit checks should cover conversion, an operation and a reasonable estimate across the completed rounds.

### 5. Điểm ở giữa, trung điểm — “Đặt trạm ở giữa”

Keep the existing strong counterexamples. Let students move M along AB while AM and MB update. Ask them to make the lengths equal, then identify the two conditions: M lies between A and B; AM = MB.

Next allow M to move off the line while still equidistant from A and B. Equal distance alone must not trigger success. Use a paper-fold demonstration as an optional physical activity. Exit: one unfamiliar midpoint, one unequal interior point and one off-line equidistant point. Feedback names the condition that fails.

## Grade 7: three lesson redesigns

### 6. Biểu diễn số trên trục số — “Định vị chính xác”

This is the strongest reusable pilot for Grade 7. The current renderer shows a fixed point and its value in the caption; independent questions mostly ask students to type numbers rather than place them.

1. Predict the interval containing −3/4: between −1 and 0.
2. Choose four equal intervals per unit, then place A by tapping or using arrow controls. Do not show the target's location in the caption or accessible description before the attempt.
3. On checking +3/4: “Khoảng cách đúng rồi. Số âm nằm ở phía nào của 0?” On −1/2: ask the learner to count intervals from zero, not tick marks.
4. Add 1/2, 2/4 and 0,5 labels to the same point. Ask whether these require three separate locations.
5. Exit with −5/4, then a different denominator such as 2/3. Change the number of divisions so success requires recognising the unit rather than memorising a screen position.

Keep exact rational values internally; use snapping in guided mode and explicit ticks. A selected fraction should have both an accessible name and a visible label. The preview demonstrates only the placement-and-feedback slice.

### 7. Số hữu tỉ — “Cùng một số, nhiều cách viết”

The current lesson covers sets, representations, signs, comparison and four operations. Its exploration puts set-builder notation before the basic definition of a rational number. Split the learning journey while retaining one library entry if desired:

1. **Recognise:** match 0,75, 3/4 and 6/8. Use one location on a number line to explain equality.
2. **Compare:** locate −2/3 and −3/4 on twelfths, then explain why the rightmost is greater.
3. **Operate:** animate −1/2 + 3/4 as signed movement, while synchronising −2/4 + 3/4. Handle multiplication/division in separate worked rounds rather than forcing every operation into the same movement metaphor.
4. **Describe sets:** introduce ∈ and ℚ after the concrete examples. For finite set-builder notation, select the allowed integer k values and show the generated rational values. Preserve the important distinction between a finite generated set and all rationals in an interval.

Use “Which solution is valid?” tasks: one student adds numerators and denominators; another creates equivalent fractions first. Ask learners to identify the first invalid step. Finish with a changed example and a brief explanation, not only a multiple-choice win.

### 8. Lũy thừa — “Thám tử lũy thừa”

Turn the existing repeated-factor explanations into interactive factor groups. Keep the more mature tone of a reasoning challenge.

- For (−2)³, predict the sign, then expand three complete factors (−2). Pair two negatives, then multiply by the remaining negative. Distinguish this from multiplying −2 by 3.
- Contrast (−2)² with −2² by highlighting exactly what the exponent applies to.
- For 2² × 2³, join groups of two and three factors; count five factors before naming the exponent rule.
- For (2³)², reveal two groups of three factors; contrast six factors with the previous five.
- For 2⁵ : 2², cancel matching nonzero factors. Explain a⁰ through aᵐ : aᵐ with a ≠ 0; do not generalise to 0⁰.
- Extend to (−1/2)³ only after the action is clear, showing both sign and denominator.

Organise the 14 independent and 72 extra questions into meaning/sign, same-base rules, power-of-a-power, and mixed reasoning rounds. Add a guided checkpoint for each rule before the mixed check. Exit: repair a rule error and solve a fresh rational-base example. A learner who needs support should return to the relevant rule, not restart all 88 exercises.

## The other 14 lessons

Each row is a lesson-specific extension of the same interaction system.

| Grade / lesson | Teaching activity | What the exit task should establish |
|---|---|---|
| 4 / Chu vi và diện tích hình chữ nhật | Trace the border, then tile the interior. Change dimensions and compare rectangles with equal perimeter but different areas. | Chooses cm versus cm² and explains boundary versus surface. |
| 4 / Làm quen với phân số và rút gọn | Shade a strip, then merge equal adjacent sections while keeping the shaded quantity unchanged. | Explains why 6/8 and 3/4 represent the same amount. |
| 4 / Quy đồng và so sánh phân số | Align equal-length strips, predict which is larger, then split to a common partition. | Creates an equivalent fraction without changing the whole. |
| 4 / Cộng và trừ phân số | Combine or remove same-sized pieces; ask why half-sized and quarter-sized pieces cannot just be counted together. | Solves one new addition and one subtraction. Current independent checks are both addition. |
| 4 / Nhân và chia phân số | Use an area model for multiplication and count how many divisor-sized pieces fit for division. | Explains and calculates division as well as multiplication. Current independent checks are both multiplication. |
| 4 / Tìm phân số của một số | Share 20 objects into four groups, select three, then connect to 20 : 4 × 3. | Distinguishes the selected amount from the remainder. |
| 6 / Cộng trừ phân số | Start with a two-question prerequisite check; direct students to equivalence, common denominators or signed operations as needed. Reuse strips and number lines. | Handles a changed signed example. Split this broad consolidated lesson into rounds; it currently has 98 exercises. |
| 6 / Số nguyên | Move on a number line for signed addition; pair opposite counters for zero. Use a separate explanation for multiplication signs. | Explains a negative comparison and subtracting a negative; does not only recite signs. |
| 6 / Số tự nhiên | Move digits between place-value columns; choose the next legal operation in an expression; select set membership separately. | Transfers order of operations to a new expression. Break the broad scope into rounds. |
| 6 / Tính chia hết, số nguyên tố, ƯCLN và BCNN | Pack identical gift groups for ƯCLN; align two event timelines for BCNN. Let students construct factor trees. | Chooses which relationship a new story needs and explains why. Separate this broad unit into several sessions. |
| 6 / Nhân chia phân số | Highlight cancellable factors, not terms in a sum; use a “spot the illegal cancellation” task. | Applies valid cancellation and explains the nonzero divisor requirement. |
| 6 / Hai bài toán cơ bản về phân số | Use a bar with either the whole or part covered; switch which quantity is known. | Selects multiplication or division based on what is known, including a remaining-part story. |
| 6 / So sánh và sắp xếp các số | Place number cards on a common line; stack equivalent forms at the same position; reorder using tap-and-move controls. | Orders unfamiliar mixed forms, preserving equalities and the requested direction. |
| 8 / Giải phương trình bậc nhất một ẩn | Show a balance and apply the same reversible operation to both sides; let the student diagnose a one-sided operation. | Solves and substitutes into the original equation to verify. |

## Shared lesson UI and teaching flow

Use one focused screen with a short task, a dominant mathematical workspace, and a small feedback area. Keep **Kiểm tra** as the clear primary action before submission; after success, offer **Thử câu mới**. Preserve the option to inspect the whole lesson as a reference.

Suggested learner labels are **Khởi động → Khám phá → Cùng làm → Tự thử → Vận dụng**. Preserve the underlying section IDs and existing teacher vocabulary during a pilot. Show progress through the current short round as well as the overall lesson; optional extra practice should not look like unfinished compulsory work.

For Grade 3, use short Vietnamese instructions, large targets, tangible objects and optional read-aloud of the prompt. For Grade 7, keep the same layout but use prediction, comparison, construction and error analysis with restrained decoration. Read-aloud should not reveal an answer. Support replay and mute; do not autoplay.

The teacher view should reveal the current prompt, likely wrong reasoning, a follow-up question and a “hide/reveal model” control. A projected learner view must not expose teacher answers. “Giảng bài” currently shares the student presentation; a separate presenter display would be a later capability, not something to imply already exists.

For pairs, offer short roles: one learner builds, the other explains; then swap. For a group, ask everyone to predict before one learner changes the model. An optional challenge timer can support a chosen activity, but should not determine conceptual success.

## Feedback and enjoyment

Use a three-level help ladder: **notice a feature → see a partial step → see the model**. After a model reveal, offer a fresh equivalent problem. Avoid awarding independent mastery for reproducing the visible answer.

Examples of authored Vietnamese feedback:

| Situation | Feedback and next action |
|---|---|
| 12 objects in 3 groups; student chooses 1/4 | “4 là số đồ vật trong mỗi nhóm. Em hãy đếm số nhóm bằng nhau của cả bộ.” Highlight the three group boundaries. |
| Student puts −3/4 at +3/4 | “Em đã chọn đúng khoảng cách tới 0. Số âm nằm ở phía nào?” Keep the distance; invite a direction change. |
| Student says an unequal interior point is a midpoint | “Điểm này ở giữa hai đầu. Bây giờ so sánh hai độ dài: chúng đã bằng nhau chưa?” |
| Student adds exponents in (2³)² | “Có 2 nhóm, mỗi nhóm có 3 thừa số 2. Hãy đếm tất cả các thừa số.” |

Fun should come from agency, discovery and a visible effect: repairing an unfair share, constructing a counterexample, making two expressions agree, or solving a new situation. Offer a choice of two equivalent contexts and an optional “create a challenge for your partner” task. Feedback can acknowledge a successful revision without a points penalty. Use a short, optional celebration after a meaningful accomplishment; avoid motion while the learner is reading or reasoning.

## Delivery order and implementation implications

**First: small content and scoring changes.** Add the missing subtraction/division exit checks, fill the pilot misconception messages, shorten long blocks and establish explicit checking. Separate draft input from submitted attempts. Use existing `mistakes` support first; its matching is textual, so equivalent fraction spellings need normalisation or multiple entries if feedback depends on their value.

**Second: three interactive pilots.** Build equal-group manipulation, exact number-line placement and factor grouping inside the existing lesson surface. Keep correctness rules deterministic. Each needs reset/undo, touch and keyboard controls, appropriate accessible descriptions and no hidden answer leakage.

**Third: sequence and practice support.** The current schema separates blocks and exercises and restricts question sections. Introduce a validated, versioned step sequence referencing stable content IDs, with a legacy fallback. Add prerequisites, small rounds and follow-up tasks. Existing `group` and `skill` fields can seed practice routing, but do not assume all lessons already have complete skill tags.

**Fourth: extend the reusable models.** Bars support missing components and fraction applications; number lines support integers and ordering; equal groups support division; factor groups support powers and factorisation. Add measuring instruments and midpoint controls after the pilots establish the interaction pattern.

Relevant implementation locations: `MathLesson.tsx` owns section order and teaching mode; `Exercise.tsx` owns input/check/help state; `UnitFraction.tsx`, `NumberLine.tsx` and `SegmentDiagram.tsx` render the current fixed diagrams; `lessons.ts` validates content and checks answers; `ExtraPractice.tsx` owns extra-practice review. Their editor, import/export, sharing, migration and PDF counterparts must remain compatible when new content types arrive. PDFs should render a static task and response space, with solutions only in the solution export.

Preserve teacher-edited content through revision previews and opt-in updates. Current progress is tied to the lesson's full learner-content serialisation, so even a wording change can invalidate saved progress. A future migration should retain outcomes for unchanged exercise IDs/content while resetting genuinely changed tasks. Do not silently relabel legacy assisted results as hint use because the old field also includes incorrect attempts.

## How to decide whether the pilot is better

Run a small formative test with learners and a teacher before broad implementation; this can identify usability problems, not establish causal learning gains.

- Can the learner start the activity without the teacher translating the interface?
- Can they explain the mathematical relationship after manipulating it?
- Can they solve a fresh example without hints, then a delayed example in a later session?
- Does feedback lead to a useful revision rather than repeated guessing?
- Which screens need teacher rescue, repeated instructions or excessive scrolling?
- Can keyboard and touch users complete the same task?

Use fresh-problem success and explanations as primary evidence. Completion, enjoyment and willingness to try another round are useful secondary observations. More clicks, faster answers and longer time in the app do not by themselves demonstrate learning. Pilot shorter rounds—for example, roughly 5–8 minutes for Grade 3 and 8–12 for Grade 7—and adjust to the actual teaching setting rather than imposing those durations as rules.
