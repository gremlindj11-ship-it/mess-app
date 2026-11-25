# Systemic lupus erythematosus from open sources only: record (25 Nov 2026)

Writer: Claude (a revision chat with Sofia, 25 Nov 2026). Claude therefore cannot be a checker here. Checkers still to run: two models that are not Claude, through the "Gemini fact check" Action with `condition: content/open/systemic-lupus-erythematosus`.

Level reached: **mapped, first statements written. Nothing is agreed and nothing is in the app.**

## Sources (saved copies in `content/open-sources/`)
| Short name | Source | Licence | Updated |
|---|---|---|---|
| LU | NHS website: Lupus | OGL v3 | 19 Jul 2023 |

No sentence was set aside when the page was saved (0 named restricted guidance).

## How it was written
- The checklist (`coverage.csv`, 38 items) was written first, from general knowledge of what a finals-level topic covers, before the source was read. It is one model's list, not a curriculum document. Nine more items (the `Confused with`, `Often missed` and `Why` groups the README has asked for since 25 Nov) were added the same day, after the NHS page had been read but from general knowledge of the topic, not from the page; most have no statement.
- 20 statements are in `statements.src.txt`. Each names where its quote sits in the saved source; `node tools/check-open.mjs content/open/systemic-lupus-erythematosus --fill` copied the quotes, so no quote was typed.
- Nothing clinical was written from memory. The revision answer Claude gave Sofia in chat the same day was from memory and was not used.
- The page's "Do" list (high-factor sunscreen, pacing, staying active) was saved inside a heading, not as addressable sentences, so no statement was written from it. The two "Don't" items were.

## Not covered by anything found
The NHS page is written for patients, so the finals detail has no statement yet: discoid and drug-induced lupus, blood count changes, antiphospholipid syndrome, antinuclear antibody by name, anti-dsDNA and anti-Sm, complement, ESR and CRP, kidney biopsy, classification criteria, anti-Ro and neonatal lupus, cardiovascular and infection risk, kidney failure. See `coverage.md`.

Next source to find: a CC BY review of systemic lupus erythematosus on Europe PMC. `node tools/find-open.mjs search` got "503 Service Unavailable" from Europe PMC on 25 Nov from the cloud chat, so no article was searched for or saved.
