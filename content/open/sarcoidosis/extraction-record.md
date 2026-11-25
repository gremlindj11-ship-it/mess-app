# Sarcoidosis from open sources only: record (25 Nov 2026)

Writer: Claude (a revision chat with Sofia, 25 Nov 2026). Claude therefore cannot be a checker here. Checkers still to run: two models that are not Claude, through the "Gemini fact check" Action with `condition: content/open/sarcoidosis`.

Level reached: **mapped, first statements written. Nothing is agreed and nothing is in the app.**

## Sources (saved copies in `content/open-sources/`)
| Short name | Source | Licence | Updated |
|---|---|---|---|
| SA | NHS website: Sarcoidosis | OGL v3 | 6 Oct 2022 |

No sentence was set aside when the page was saved (0 named restricted guidance).

## How it was written
- The checklist (`coverage.csv`, 34 items) was written first, from general knowledge of what a finals-level topic covers, before the source was read. It is one model's list, not a curriculum document. Nine more items (the `Confused with`, `Often missed` and `Why` groups the README has asked for since 25 Nov) were added the same day, after the NHS page had been read but from general knowledge of the topic, not from the page; most have no statement.
- 31 statements are in `statements.src.txt`. Each names where its quote sits in the saved source; `node tools/check-open.mjs content/open/sarcoidosis --fill` copied the quotes, so no quote was typed.
- Nothing clinical was written from memory. The revision answer Claude gave Sofia in chat the same day was from memory and was not used.

## Not covered by anything found
The NHS page is written for patients, so the finals detail has no statement yet: non-caseating granulomas, bilateral hilar lymphadenopathy by name, erythema nodosum and lupus pernio by name, uveitis by name, Lofgren syndrome, raised calcium, serum ACE, lung function, excluding tuberculosis, and how it differs from tuberculosis, lymphoma and lupus. See `coverage.md`.

Next source to find: a CC BY review of sarcoidosis on Europe PMC. `node tools/find-open.mjs search "sarcoidosis"` got "503 Service Unavailable" from Europe PMC three times on 25 Nov from the cloud chat, so no article was searched for or saved.

## Also needed before a page exists
- There is no "Sarcoidosis" row in `app/assets/topics.js`. That is an app change and is not part of this content-only pull request.
