# Content agents: coverage checker and fact checker

Agreed with Sofia on 11 Nov 2026. The claims writer's job is job 4 in the project brief. These two agents check its work.

## The three rules
- **A revision checklist decides what we cover.** Every topic heading in the revision notes Sofia supplies for the condition must have a claim in Mess.
- **The guideline decides what we say.** Zero to Finals, Passmed, Geeky Medics, Wikipedia and Patient.info catch errors and gaps; they never settle a fact.
- **Where the revision notes and the guideline differ, the story says so.** Those are the traps.

## The order, per condition
1. Claims writer extracts claims from the opened guideline: Mess's own words plus the recommendation number. `source_quote` is left empty.
2. `node tools/fill-quotes.mjs <claims.csv>` copies each recommendation's text into `source_quote` from the guideline page. A model never types a quote. `--verify` checks every quote is word for word in the page.
   - PDFs work (BTS, GOLD): the script reads them with `pdftotext`.
   - For a source without NICE-style numbers, or to keep only the relevant line of a table: `--row N --from "first words" --to "last words"` copies what lies between. Add `--add` to join a second passage on.
   - Quote the line that carries the fact, not the whole table: the checker passes any number found anywhere in the quote.
   - Where it runs: NICE, BTS and GOLD download without help from a Claude cloud session (12 Nov 2026). Where a site refuses, save the page from a browser as the script says.
3. `node tools/check-claims.mjs <claims.csv>` must pass.
4. Coverage checker lists what is missing.
5. Claims writer fills the gaps.
6. Fact checker (a different model from the writer) tries to break every claim.
7. Sofia sees only disputed rows, plus every dose, threshold, first-line choice and emergency row.
8. The story is written from confirmed claims only.

## Rules both checkers share
- **Record agreement, never wording.** For each outside source write only: agrees, disagrees, not covered. No sentences, structure or examples from them go in the repo.
- **Paid revision resources:** Sofia supplies any notes pages herself. Supplied text stays out of the repo. No questions or question explanations are copied.
- **Neither checker writes or edits claims.** They report; the writer fixes.
- **Nothing from memory.** If a source could not be opened, say so in a "couldn't open" list.
- PRs touch `content/` only. Sofia merges.

## Brief 1: coverage checker

You are the coverage checker for Mess. Your only job is to find what is missing. Do not judge whether claims are right, and do not write claims.

Input: `content/<area>/<condition>/claims.csv`, the primary guideline(s) it cites, and the revision notes for the condition (supplied by Sofia).

1. **Revision notes first.** List every heading and every distinct fact in the supplied notes. Mark each: has a claim, no claim. For each "no claim", name the primary guideline that would confirm it. Do not copy the notes' wording; describe the fact in your own few words.
2. Open the guideline. Say first whether you could open it. List every numbered recommendation.
3. Mark each recommendation: has a claim, no claim, or not needed (service organisation, cross-references, audit). Give a reason for every "not needed".
4. For each "no claim", rate how likely it is to be examined in UK finals: high, medium or low, with one line why.
5. Check the eight steps (risk factors, pathophysiology, clinical features, investigations, differential, management, complications, consequences). List any step with fewer than two claims.
6. Count rows with empty `misconception`, `mechanism_why` and `why_it_matters`.
7. Compare topic headings (not content) in Zero to Finals, Geeky Medics and Wikipedia. List anything at least two of them teach that we have no claim for.
8. Output `content/<area>/<condition>/coverage.csv` with columns: `item, where_from (revision notes, guideline rec, other), has_claim, needed, exam_likelihood, why, confirm_in`. Add one row per gap to `content/queue.csv` for the claims writer.

Record how many minutes it took.

## Brief 2: fact checker

You are the fact checker for Mess. Your only job is to try to break claims. You did not write them. Do not write or edit claims.

Input: `content/<area>/<condition>/claims.csv`.

For every row:
1. Open the cited source. Say first whether you could open it. Confirm the cited recommendation says what the claim says, in the current version. If not: verdict `can't verify`.
2. Confirm the claim says no more than the recommendation: same population, same strength ("offer" is not "consider"), same numbers and units.
3. Look the same fact up in Zero to Finals, Geeky Medics, Passmed notes if pasted, Wikipedia, the BNF for any drug or dose, and Patient.info. For each write: agrees, disagrees, not covered.
4. If any source disagrees, work out why: older guideline, different country, simplification, or our error. Write that in `disagreement_reason`.
5. **No less, as well as no more.** For every row, fill these eight columns with `yes`, `no` or `n.a.`: `population`, `trigger`, `action`, `strength`, `numbers`, `alternatives` (every branch in the quote is kept), `exceptions`, `safety` (warning or follow-up steps kept). Judge the claim **sentence alone**, as a student would read it. If the scope is only in `condition_or_population`, that's `no`.
6. Write a row-specific `notes` saying what you checked. Never paste the same reasoning across rows.
7. Verdict per row: `confirmed` only if all eight are `yes` or `n.a.`; otherwise `disputed`, with what's missing. `can't verify` if the source didn't open.
8. `node tools/check-factcheck.mjs <factcheck.csv>` must pass.

Output `content/<area>/<condition>/factcheck.csv` with columns: `row, verdict, rec_supports_claim, population, trigger, action, strength, numbers, alternatives, exceptions, safety, notes, ztf, geeky, passmed, wikipedia, bnf, patient_info, disagreement_reason`. Then a short list of disputed rows for Sofia, worst first.

**The fact check by hand, with planted faults (a model with no key here, such as ChatGPT or Codex).** Use this in place of a free-form check wherever the folder has enough rows.
1. `node tools/ai-factcheck.mjs <folder> --packet /tmp/packet.json --name gpt [--rows 2-60]` writes each claim with its quote. Some are planted faults and are not marked. It refuses if the reader wrote the claims (Codex and ChatGPT count as one writer), and leaves out rows the reader rewrote.
2. The reader opens only that packet. It does not open `claims.csv`, any `factcheck.*.csv` or `consensus.csv`. It follows the packet's `instructions` and writes its answers to `/tmp/answers.json` in the packet's `answer_format`, with a note specific to each row.
3. `node tools/ai-factcheck.mjs <folder> --packet /tmp/packet.json --answers /tmp/answers.json --name gpt` marks it. A check that confirmed any planted fault is refused and nothing is saved; start again from a new packet in a new session. A good check is saved into `factcheck.gpt.csv` under the real row numbers.
4. Then `node tools/check-factcheck.mjs <folder>/factcheck.gpt.csv` and `node tools/consensus.mjs <folder>`. The reader commits only `factcheck.gpt.csv` and `consensus.csv`. It never edits claims.

Three revision sites agreeing with each other proves little, because they share sources. Only the guideline settles it. Record how many minutes it took.

## Three gates nothing skips (agreed 15 Nov 2026, changed the same day)
Sofia is a student, so her tick is not the safety net. Agreement between independent checkers is.
1. **Consensus before anything is published.** Every claim is fact-checked by at least two different models, each working alone (Brief 2), on top of the script that verifies the quote word for word. `node tools/consensus.mjs content/<area>/<condition>` marks a claim `agreed` only if every checker confirms all eight points. A story may use only `agreed` claims.
2. **Anything unsure stays out.** One checker disputing, a failed point, a source that wouldn't open, or only one checker: the claim is `unresolved`. The writer fixes it against the guideline and it goes round again. A third model can be added, but it is never a majority vote: one unanswered objection keeps the claim out.
3. **Say what the check was, and no more.** The app and website say "checked against the guideline by independent AI models". They never say or imply that a doctor checked a topic unless a named doctor has.
4. **The teaching method is tested before anyone calls it proven** (the classmate test, once per story shape).
5. **Sofia merges.** She doesn't have to review clinical rows herself.

Checkers save their work as `factcheck.<model>.csv` (e.g. `factcheck.gpt.csv`, `factcheck.claude.csv`, `factcheck.gemini.csv`). No checker reads another's file. The model that wrote the claims never counts as one of the two.

## Brief 0: claims writer (the COPD standard, for every condition)

You are the claims writer for Mess. Work **per guideline**: open it once and extract every claim a UK final-year student needs from it, for every Mess condition it covers.

1. Open the guideline itself (the live NICE page, or the BTS/SIGN/GOLD PDF). Say first whether you could open it. Nothing from memory: a fact you can't find in an opened source is left out and listed under "Couldn't open" in `story-gaps.md`.
2. **Every claim sentence must stand alone.** A student may meet it without its other columns, so write who it applies to, the trigger and any alternative branch, exception or safety step from the same recommendation into the sentence itself (e.g. "In adults with low-severity CAP, offer amoxicillin…"). `condition_or_population` repeats that scope for filtering; it never carries scope the sentence leaves out. If a recommendation has two alternatives, the claim has both, or there are two claims. Quote the whole recommendation, never part of a sentence.
**How NICE's wording maps to a claim** (so checkers judge the same way):
   - NICE's commands ("Offer", "Measure", "Refer", "Treat") become "should" or "should be offered".
   - "Do not…" becomes "should not…". Write "must" only where the guideline's own sentence says "must"; otherwise it is stronger than the guideline.
   - "Consider" stays "can be considered".
   - Every action keeps "should". Never use a bare description like "an alternative is found".
   - Everything else keeps NICE's own words.
**The three patterns behind all 62 round-1 disputes** (respiratory, 16 Nov 2026). Check every claim against them before any checker runs:
   - **Scope the quote doesn't carry (36 of 62).** The checker sees only the claim and its quote. If the claim says who it applies to (an age band, a setting, a diagnosis) and those words are only in a section heading or an earlier paragraph, it is disputed. Fix it at the source: for NICE, end `source` with `+heading` so the script adds the heading to the quote; for a PDF, join on the passage that names the group with `fill-quotes --add`. If nothing in the guideline says it, take it out of the claim.
   - **Strength changed (11 of 62).** A guideline's own "should be considered" (BTS and SIGN use it) stays "should be considered"; only NICE's "Consider" becomes "can be considered". "Consider A or seek B" is "can be considered" for both branches. "Be aware of" is not "should be considered". `check-claims` prints a `strength:` line for the first of these.
   - **A piece dropped, added or renamed (15 of 62).** "Signs or symptoms" is not "symptoms". A general phrase that comes before its examples stays, and so does the last "or" in a list. Add no word the quote lacks ("alone", "falling", "rising"). Call things what the quote calls them.
3. Write `content/<area>/<condition>/claims.csv` with the columns in `tools/check-claims.mjs` (`COLS`). One fact per row, in Mess's own words, no more and no less than the recommendation: same population, same strength ("offer" is not "consider"), same numbers and units. `source` is the body, the guideline and the recommendation number (e.g. `NICE NG196 1.6.3`). `jurisdiction` is `UK` for management and `all` for mechanisms. `status` is `draft`.
3. Cover the eight steps (risk factors, pathophysiology, clinical features, investigations, differential, management, complications, consequences) where the opened sources support them. Fill `misconception`, `mechanism_why` and `why_it_matters` only where an opened source supports it; otherwise leave them blank and say so in `story-gaps.md`.
4. Leave `source_quote` empty. Run `node tools/fill-quotes.mjs <claims.csv>` to copy the guideline's own words in, then `node tools/fill-quotes.mjs <claims.csv> --verify`. A model never types a quote.
5. `node tools/check-claims.mjs <claims.csv>` must pass with 0 to fix, and with no `strength:` or "who it applies to" lines.
6. Add `extraction-record.md` (start and end time, claims, empty fields, the command output) and `story-gaps.md` (what the sources don't cover, qualifiers, couldn't open), like `content/respiratory/asthma/`.
7. Set this condition's `claims` row in `content/queue.csv` to `done`, with owner and output.
8. One PR per guideline, touching `content/` only. Sofia merges.

## Brief 3: the story (plan first, then build)

A story never holds a fact of its own. Every point names the claim row it comes from, and `tools/build-story.mjs` refuses a row that two checkers have not agreed. Two files sit in the condition's folder.

**1. `story-plan.md`, written by the claims writer while the guideline is open.** Eight numbered answers, each starting `N. **Question.**`:
1. What kind of thing is this? (long-term condition, emergency, a presentation with many causes, a drug, a test, a look-alike pair)
2. The one idea everything hangs off.
3. Which shape, and why not the others.
4. What it is mixed up with, and what tells them apart.
5. What is often got wrong. Sources only: fill the claim's `misconception` column from a "do not" recommendation or a place the guideline differs from the revision sites. If there is none, say none.
6. Any list with no logic to it (the only place a memory aid is allowed).
7. What needs a table or a diagram: a threshold ladder, a fork, a sequence, a side-by-side.
8. What the claims don't cover.

**2. `story.json`**, in the format at the top of `tools/build-story.mjs`. Rules the tool enforces:
- A point is `{ "row": N }`. Its full wording is the claim itself, never retyped.
- A claim over 190 characters needs a `"short"` version. The whole claim stays one tap away. A short version may drop a branch but may not change the strength word or bring in a number, and should say when it leaves something out ("with five exceptions").
- At most 6 points showing in a step; the rest go under `"more"`.
- Every step after the first has a `"bridge"`: how it follows from the one before.
- `{ "row": N, "kind": "wrong" }` builds "Often thought ... In fact ..." from the claim's `misconception` column. No column, no line.
- `{ "row": N, "kind": "aid", "text": "Memory aid ..." }` under `"more"` only, at most 2 a story, Mess's own wording.
- A step can carry one `"table"` and one `"flow"` (a top-to-bottom diagram of boxes and questions). Each lists the `"claims"` its cells come from.
- `"covers"` and `"not_covered"` are both required, so the status line is honest.

**Use a table or diagram wherever it replaces a paragraph.** A reader should be able to get the decision from the picture alone. If a point is a list of thresholds or an if-this-then-that, it is a table or a diagram, and the point keeps only the short version.

Run `node tools/build-story.mjs content/<area>/<condition>`. Fix every `fix:` line; read every `look:` line. It writes the topic's entry in `app/assets/stories.js` between `// built:` markers: never edit between them by hand. `node tools/build-story.mjs content --check` runs in the tests and fails if a story is out of date.

**What the tool cannot check**, so a second model reads it: the big idea, the bridges, the `remember` lines, and whether each short version, table and diagram is a fair summary. The tool only checks their numbers and strength words.

**The story check.** `node tools/ai-factcheck.mjs content/<area>/<condition> --story --provider gemini` (or `groq`), or the "Gemini fact check" Action with `what` set to `story`. It sends every summary with the claims it rests on, asks four things (same strength, same numbers, nothing added, not misleading), and writes `storycheck.<model>.csv`. Rules:
- The story's `"writer"` never checks it. Claude-written stories are read by Gemini and Qwen.
- Every batch carries one real summary with its strength turned round or a number changed. A model that confirms it is thrown out. `openai/gpt-oss-120b` failed this on 17 Nov 2026 and is not to be used for it.
- The builder reports each dispute, and reports a summary as unread once its wording changes.
- **A story ships only when at least one model that isn't its writer has confirmed every summary as it stands.** The tests enforce this (`build-story.mjs --check --ship`). Fix a disputed summary, or reply in `disputes-replies.md` if the objection is wrong, then rerun.

**The story check by hand (a model with no key here, such as ChatGPT or Codex).** The reader must not be the story's writer.
1. `node tools/ai-factcheck.mjs <folder> --story --packet /tmp/packet.json` writes the items to read. Some are planted faults and are not marked.
2. The reader opens only that packet. It does not open `story.json`, `claims.csv`, `app/assets/stories.js` or any `storycheck.*.csv`, and does not run the builder. It follows the packet's `instructions` and writes its answers to `/tmp/answers.json` in the packet's `answer_format`.
3. `node tools/ai-factcheck.mjs <folder> --story --packet /tmp/packet.json --answers /tmp/answers.json --name gpt` marks it. A read that confirmed any planted fault is refused and nothing is saved; start again from a new packet in a new session. A good read is saved as `storycheck.gpt.csv`.
4. The reader commits only `storycheck.<name>.csv`. It never edits the story; the writer fixes fair disputes and the reader reads again.

## The conveyor (how every condition goes the COPD way)

Each job is a GitHub issue with a label. Agents take issues; the twice-daily Claude review checks every PR and keeps the line moving. Sofia merges.

| Stage | Label | Who | Gives |
|---|---|---|---|
| 1. Claims | `job:claims` | Copilot (Brief 0) | claims.csv, extraction-record.md, story-gaps.md |
| 2. Coverage | `job:coverage` | Codex (Brief 1) | coverage.csv, gaps in queue.csv |
| 3. Gaps | `job:claims` | the writer of stage 1 | new rows |
| 4. Fact check | `job:factcheck` | a different model from the writer (Brief 2) | factcheck.csv |
| 5. Consensus | – | `node tools/consensus.mjs` on each condition; unresolved rows go back to the writer | disputed, doses, thresholds, first-line, emergency rows |
| 6. Story | `job:story` | Claude, `mess-note-writer` skill, confirmed claims only | the entry in `app/assets/stories.js` |

`content/guideline-queue.csv` is the order: one row per guideline, with the Mess conditions it covers and its status. Highest exam weight first. At most 8 `job:claims` issues are open at once.

## What the 15 Nov respiratory audit taught us
An outside audit of the 135-row check list found 64 rows to edit and 1 to hold. Most of them were the same few problems.
- **Scope hidden in another column.** Many claims are true only for a group (adults, low severity, at risk of hypercapnia), but that group was written in `condition_or_population`, not in the sentence. The hand-made check list then dropped that column. Fixes: Brief 0 rule 2, a `check-claims` warning, and the list is now made by `tools/sofia-check.mjs` with a *Who* line.
- **The checker only asked "no more than the quote", never "no less".** Missing alternatives, exceptions and safety steps passed. Fix: Brief 2 steps 5–8, and `tools/check-factcheck.mjs`.
- **Rubber-stamp verdicts.** The same sentence was pasted on every row. Fix: `check-factcheck` fails that.
- **Cut-off quotes.** Fix: a `check-claims` warning when a quote ends mid-sentence.
- **Ambiguous mechanism wording** (respiratory failure row 18). Fix: the eight-point check, and HOLD stays out of stories.
- **What still needs people:** the audit itself said it can't prove nothing was missed. A second, different model challenges the KEEP rows, and Sofia ticks the red flags.

## Brief 4: question checker (pilot, 18 Nov 2026)

You are checking questions for Mess. You did not write them. Try to break each one. Do not write or edit questions.

Questions live in `content/<area>/<condition>/questions.json`. Every option points to agreed claims; the key is written first and `tools/check-questions.mjs` sets the order students see. A question is **agreed** only when two checkers that aren't its writer pass the wording as it stands.

1. `node tools/check-questions.mjs <folder>` must pass first (the flaw check by script).
2. `node tools/check-questions.mjs <folder> --packet /tmp/q.json` writes the items to check. Some have been made wrong on purpose and are not marked. **Read only the packet.** Do not open `questions.json`, `question-plan.md` or this tool while checking.
3. For each item follow the packet's instructions: answer from the stem before looking at the options, then judge the key and every other option against the quotes given, then look for flaws and the level.
4. Write your answers to a JSON file in the packet's answer format.
5. `node tools/check-questions.mjs <folder> --packet /tmp/q.json --answers <file> --name <you>` marks it. If you agreed a planted wrong question, nothing is saved. Otherwise it writes `qcheck.<you>.csv`.
6. Report the failed questions with your reason. The writer fixes or drops them, and both checkers check again. No fix by majority.

The writer is refused as a checker. A reworded question loses its old verdicts. Calculation questions are worked out again by the script; the checker still does the sum by hand.

**The question check by a free model.** The GitHub Action "Gemini fact check" with `what: questions` (or `node tools/ai-factcheck.mjs <folder> --questions [--provider groq]`) makes the same packet as the by-hand check, has a model that didn't write the questions answer it, and marks it with the same rules: planted wrong questions must all be caught or nothing is saved. It writes `qcheck.<model>.csv`, so a question becomes agreed once two such files pass it.
