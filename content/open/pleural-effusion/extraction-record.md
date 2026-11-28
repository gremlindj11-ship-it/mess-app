# Pleural effusion from open sources only: record (28 Nov 2026)

Writer: Claude (the BUILD chat, 28 Nov 2026). Claude therefore cannot be a checker here. Checkers: Gemini and Qwen, through the "Gemini fact check" Action with `condition: content/open/pleural-effusion`.

Level reached: **mapped, first statements written. Nothing is agreed and nothing is in the app.**

## Sources (saved copies in `content/open-sources/`)
| Short name | Source | Licence | Updated |
|---|---|---|---|
| MP | Malignant Pleural Effusion: Diagnosis and Management (pmc7695997) | CC BY 4.0 | 23 Sep 2020 |
| LT | Local Anaesthetic Thoracoscopy for Pleural Effusion: A Narrative Review (pmc9601808) | CC BY 4.0 | 9 Oct 2022 |
| TP | Tuberculous pleural effusion: thoracic ultrasound and medical thoracoscopy, a narrative review (pmc13000056) | CC BY 4.0 | 31 Oct 2025 |

No NHS or GOV.UK page on pleural effusion exists (both 404 on 27 Nov), so there is no UK patient-level source.

## Management stays uncovered (Sofia, 27 Nov)
No waiver. These statements cover understanding only: what causes it, how it presents, what the tests show and why, and prognosis. **Management (items 16 to 21: treating the cause, aspiration, chest drains, pleurodesis, indwelling catheters, treating a tuberculous effusion) has no statement and stays uncovered until a UK source turns up.** The three reviews do describe treatment, but they are not UK guidance and were not used for it. The two statements that touch a procedure say what a test shows or why something fails (ultrasound before thoracentesis lowers pneumothorax risk; a trapped lung is why pleurodesis fails), not what to do.

## How it was written
- The checklist (`coverage.csv`, 36 items) was written from general knowledge of what a finals-level topic covers, after the old story's headings had been re-traced (`retrace.csv`) but before the statements. It is one model's list, not a curriculum document.
- 43 statements are in `statements.src.txt`. Each names where its quote sits; `node tools/check-open.mjs content/open/pleural-effusion --fill` copied the quotes, so no quote was typed. Nothing clinical was written from memory.
- Rows covering "Elsewhere in the world" items take their geography from the line (`@global`, `@LMIC`), not "UK".

## Not covered by anything found
The three sources are specialist reviews (malignant effusion, thoracoscopy, tuberculous effusion), so the basics have no statement: what an effusion is, transudate versus exudate, Light's criteria, the examination signs, and effusion versus collapse or consolidation on an X-ray. Heart failure, pneumonia and pulmonary embolism as causes are not covered either. See `coverage.md`.

Next source to find: a CC BY general review of pleural effusion (definition, Light's criteria, causes), and a UK source for management.
