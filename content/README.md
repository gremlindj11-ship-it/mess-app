# Content work

**This file is the one place for how content is written, checked and built into stories.** Prompts, briefs and chats point here rather than repeating it; if a rule changes, change it here. Start at "Writing from open sources": the guideline sections further down describe the process paused on 20 Nov 2026 (NICE, BTS, SIGN and GOLD are frozen).

Working files for Mess's notes and stories. Nothing here is shown in the app until it's been checked and moved into `app/assets/`.

- `gmc/`: coverage of the GMC MLA content map (September 2026) against Mess's topics, made by Codex on 10 Nov 2026. GMC labels are from the *MLA content map*, © 2026 General Medical Council, reproduced with acknowledgement as the GMC permits. The emergency column is a provisional teaching priority, not a GMC classification.
- `<area>/claims.csv`, `links.csv`, `stations.json`, `review.md`: one folder per area as the content agents work through it. See the agent plan in the project brief.

## Who Mess may write from: the rights register
- `rights.json` lists every source with its licence, whether a model may read it, the credit line it needs, the page that proves it and the date its terms were last read. Each is marked **write** (a model may read it and statements may cite it), **link** (link only) or **frozen** (statements were made before 20 Nov 2026; nothing is added or reworded until the owner says yes in writing).
- `node tools/check-rights.mjs` is the gate, and it runs with the tests. It fails if any statement cites a source the register does not allow, if anything new or reworded comes from a frozen source (taking statements down is fine), or if an In practice page links to a site nobody has entered.
- `rights-frozen.json` holds the ids of the statements that existed at the stop. Do not regenerate it to let something new in.
- Tools that fetch a page ask the register first (`allowFetch` in `tools/rights.mjs`). `fill-quotes`, `dump-recs` and `quotes-from-recs` now refuse NICE, BTS, SIGN and GOLD.
- Tools that send rows to a model, or fill a packet for one to read, ask it too (`allowSend`). `ai-factcheck` (claims, the story check, by-hand packets) and `check-questions --packet` stop before anything is sent if a row's source isn't one a model may read. So the "Gemini fact check" Action can't be run on frozen guideline rows.
- **Adding a source:** read its terms at the source, add an entry with the page and the date, and only then fetch it. If the terms do not clearly allow a model to read it, it is link only. Re-read terms every 3 months; the gate lists the ones that are due.
- Statements from open sources live in `open/<topic>/statements.csv`, each tied to a saved copy in `open-sources/`. The old `claims.csv` files are for the frozen guideline work only.

## Writing from open sources

This is the only way new statements are made while NICE, BTS, SIGN and GOLD are frozen. Nothing from those four reaches a model at any step.

1. **Save the source.** `node tools/fetch-open.mjs <NHS or GOV.UK address, or PMCID> [--id name] [--from saved-file]`. It asks the rights register first and refuses anything not marked "write". It saves `open-sources/<id>.json`: the address, the date, the licence (for an article, read from the article itself), the credit line, and the text as numbered sentences (`b3.s2` is block 3, sentence 2). **Sentences that report NICE, SIGN, BTS, GOLD, BNF or CKS guidance are set aside when the source is saved**, so no later step can pass them on. Europe PMC sometimes refuses a script: download the XML and pass it with `--from`.
2. **Write the checklist first.** `open/<topic>/coverage.csv`: what a student needs on the topic, written before reading the sources. It is what "how much of the topic is covered" is measured against.
   Find sources with `node tools/find-open.mjs search "<topic>"` and read a saved one with `node tools/find-open.mjs show <id>`: it prints each sentence with its address and hides the set-aside ones. Do not read the downloaded article or the saved JSON directly.
   **The checklist always has four extra groups. Three for the interesting bits** (Sofia, 25 Nov): `Confused with` (what it is mistaken for and what tells them apart), `Often missed` (the finding, group of patients or step that gets overlooked) and `Why` (the mechanism behind a sign, a test result or a treatment). Two to four items in each. **A fourth group, `Elsewhere in the world`** (Sofia, 25 Nov): what the condition looks like where it is common or where resources are short (for the heart: rheumatic heart disease, Chagas disease). One to three items. `open/queue.md` lists the saved sources for it. All four groups are filled like everything else: a statement with a quote from an allowed source, or nothing. If no saved source says it, the item stays uncovered and shows in `coverage.md`. Never from memory, never from a revision site.
3. **Write statements.** One line each in `open/<topic>/statements.src.txt`: `covers | step | how sure | level | source | where | subject | relation | object`. "where" is the sentence address in the saved source (`b3.s2`, `b3.s2-s4`, `b3.h` for a heading; join with `+`). No quote is typed by hand.
4. **Fill and verify.** `node tools/check-open.mjs content/open/<topic> --fill` builds `statements.csv` (the same columns as a claims file, plus `source_id`, `source_at`, `covers`), copying each quote from the saved source by script. Without `--fill` it checks every quote word for word against the saved copy and writes `coverage.md`.
5. **Two checkers that are not the writer.** The "Gemini fact check" Action with `condition: content/open/<topic>`. The checker and `consensus.mjs` read `statements.csv` when a folder has one. `extraction-record.md` names the writer, which then can't check. A statement is agreed only when two checkers both confirm it.
6. **`coverage.md`** says how much of the checklist has an agreed statement. Run `check-open.mjs` again after the checkers.

7. **The story.** `story-plan.md` (the eight answers), then `story.json`, then `node tools/build-story.mjs content/open/<topic>`. It works as for a guideline's claims, with three differences: each point is tagged with its source's short name; the story lists every source it used with the credit line its licence asks for; and `story.json` must have `gaps`, the things no open source covered, with where to read them. The status line says the points were checked against their sources, not against a guideline.
   **Write every summary so it would survive a strict reader first time** (learned on high blood pressure, 24 Nov: GPT disputed 21 of 56). A short version, table cell, big idea, closing line or question must keep, from its statement:
   - **who it applies to** ("adults", "young-onset hypertension", "resistant hypertension", "people with symptoms");
   - **every exception and safety limit** ("except in a hypertensive crisis", "keeping diastolic above 100 mmHg", "except in acute aortic syndromes", "in most cases");
   - **every condition** ("sustained", "despite diet and lifestyle advice", "depending on clinical response", "if necessary");
   - **the strength**: "should be considered" never becomes "do", "may" never becomes "is";
   - **the source's own words for frequency**: "the most common form" is not "most cases"; "commonly results from" is not "is common".
   If it will not fit in about 190 characters, keep the exception and go over, or say "(listed in the full wording)" for a list. Never drop it silently. Never frame the whole topic with something no statement says (the first draft said everyone is assessed for organ damage; no source said so).
   A statement, likewise, carries **everything its quote says**: if the quote has two sentences, the statement covers both, or the address is narrowed to the one it needs.
8. **The story check**, by a model that did not write it (Brief 3). Until one has confirmed every summary, the builder keeps the story out of the app. After fixing disputed summaries, a by-hand reader re-reads only what changed: add `--changed` to the `--story --packet` and `--answers` commands (fresh planted faults are made from the changed items).

**When the writer has no internet (Codex).** The sources are saved first, here, and committed. `open/queue.md` lists the topics in order with the saved sources for each. The writer takes the next topics without a folder, reads sources only through `find-open.mjs show`, and writes steps 2 to 4. It never fetches, and never writes from memory.

**Reworded statements.** Every verdict saved since 24 Nov carries a `stamp` of the wording it judged (`tools/rights.mjs`). `consensus.mjs` sets aside a verdict whose stamp no longer matches, so a reworded statement needs both checkers again. Verdicts from before stamps were backfilled from git history for `open/hypertension`.

`build-evidence.mjs` still reads only `claims.csv`, so open-source statements reach Mess through their story, not the topic chat.

## The assembly line
- `queue.csv`: one row per curriculum item per job (claims, story, links, review). Agents take rows, set `status` (todo, doing, done, needs fixing), `owner` and `output`, and keep it up to date.
- Before handing on a claims file: `node tools/check-claims.mjs content/<area>/claims.csv`. It must pass: every column filled in, a primary source on every row (revision sites go in `also_in`), `how_often_or_sure` never blank, an honest status, and dates and links in the right form.
- Before any rewrite goes in: `node tools/meaning.mjs pairs.json`.
- Pull requests touch `content/` only. Sofia merges.
