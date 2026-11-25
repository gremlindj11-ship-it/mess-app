# Hypertension from open sources only: record (21 Nov 2026)

Writer: Claude (the code chat, 21 Nov 2026). Claude therefore cannot be a checker here. Checkers: Gemini and one open model on Groq, through the "Gemini fact check" Action.

This is the one-topic test Sofia asked for: write hypertension from sources whose licence allows a model to read them, through the checked process, and measure how much of the topic gets a statement that two checkers agree.

## Sources (saved copies in `content/open-sources/`)
| Short name | Source | Licence | Updated |
|---|---|---|---|
| N1 | NHS website: High blood pressure | OGL v3 | 19 Jul 2024 |
| N2 | NHS website: Blood pressure test (read, no statement needed it) | OGL v3 | 25 Nov 2025 |
| T | BIHS position statement: treatment thresholds and targets, J Hum Hypertens 2025 | CC BY 4.0 | 23 Jul 2025 |
| R | BIHS position statement: adult referral pathway and therapeutic management, 2024 | CC BY 4.0 | 9 Jan 2024 |
| RH | BIHS position statement: resistant hypertension, 2025 | CC BY 4.0 | 9 Dec 2024 |
| Y | BIHS position statement: young-onset hypertension, 2024 | CC BY 4.0 | 28 Jun 2024 |
| C | BIHS position document: hypertensive crisis, 2023 | CC BY 4.0 | 22 Nov 2022 |
| S | Clark and George, Secondary hypertension for the generalist, Clin Med (Lond) 2026 | CC BY 4.0 | 22 May 2026 |

Each article's licence is the one it states in its own full text (Europe PMC), recorded in its saved copy with the words that prove it. T, R, RH and Y are the four in `claude/pull-list.md`. C and S were found on 21 Nov by searching Europe PMC for CC BY reviews on hypertensive crisis and secondary hypertension.

## What was kept from a model
- Sentences naming NICE, SIGN, BTS, GOLD, the BNF or CKS were replaced by a marker when each source was saved, so neither the writer nor a checker saw another body's summary of that guidance. Counts are in each saved copy (`set_aside`): T 4, R 12, RH 5, Y 6, C 18, S 19. This removed most of the routine referral table in R and several sentences on treatment thresholds in Y.
- Tables and figures credited to someone else were set aside whole.
- The 74 statements already in Mess from the NICE hypertension guideline were not opened or used, as a checklist or otherwise.

## How it was written
- The checklist (`coverage.csv`, 49 items) was written first, from general knowledge of what a finals-level topic covers, before the sources were read. It is one model's list, not a curriculum document.
- Statements are in `statements.src.txt`. Each names where its quote sits in the saved source; `node tools/check-open.mjs content/open/hypertension --fill` copies the quotes, so no quote was typed.
- Where a recommendation is the British and Irish Hypertension Society's own position (for example treating whatever the cardiovascular risk, and a target below 130/80 mmHg), the statement says so. These are a specialist society's positions and differ in places from the national guideline.
- Parts of RH, Y, C and S were read; the specialist sections (devices, genetics, each emergency state) were not, and nothing was written from them.

## Not covered by anything found
See `coverage.md`. In short: stages of hypertension, which drug class to start with by age and ethnicity, not combining an ACE inhibitor with an ARB, and the preference in diabetes and kidney disease had no usable sentence in these sources once the set-aside sentences were removed.

## Changes after checking
- Row 46 (urinalysis): Qwen disputed it because the statement opened "In hypertension," and the quote does not say that. Those two words were removed. The row needs both checkers again.
- Rows 3, 5 and 7: Gemini (gemini-3.6-flash) disputed them on wording. Row 3 now says "legs unfolded", the source's own words, not "legs not crossed". Row 5 now opens "In people where", as the source does. Row 7's quote now starts with the sentence where the source spells out "resistant hypertension (RH)", because the sentence it rests on only says "RH". All three need both checkers again.
- Row 42: Gemini disputed "the most common form in young adults"; it now says "the most common form of hypertension in young adults", as the source does. Needs both checkers again.
- Row 55: Gemini disputed "avoiding salty food and adding salt"; the NHS page says "or", and so does the statement now. Needs both checkers again.
- 24 Nov: every verdict now carries a stamp of the wording it judged. Backfilled from git history: Gemini on rows 3, 5, 7, 42 and 55 and Qwen on rows 42 and 55 judged wording that has since changed, so those verdicts are set aside and the rows need reading again.
- 24 Nov, row 7: GPT disputed it because its quote also says people living with resistant hypertension are at high risk of adverse cardiovascular events. The statement now carries that, in the source's words. Needs both checkers again. Rows 42 and 55 still need both checkers on their current wording (GPT read them on 24 Nov; one more needed).
