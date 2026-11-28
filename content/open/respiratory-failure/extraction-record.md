# Respiratory failure from open sources only: record (28 Nov 2026)

Writer: Claude (the BUILD chat, 28 Nov 2026). Claude therefore cannot be a checker here. Checkers: Gemini and Qwen, through the "Gemini fact check" Action with `condition: content/open/respiratory-failure`.

Level reached: **mapped, first statements written. Nothing is agreed and nothing is in the app.**

## Sources (saved copies in `content/open-sources/`)
| Short name | Source | Licence | Updated |
|---|---|---|---|
| OX | Oxygen therapy and noninvasive respiratory supports in acute hypoxemic respiratory failure: a narrative review (pmc11486880) | CC BY 4.0 | 18 Oct 2024 |
| HC | The role of hypercapnia in acute respiratory failure (pmc6658637) | CC BY 4.0 | 25 Jul 2019 |

No NHS or GOV.UK page on respiratory failure exists (both 404 on 27 Nov), so there is no UK source.

## Management stays uncovered (Sofia, 27 Nov)
No waiver. These statements cover understanding only: definitions, types, signs, how severity is graded, what pulse oximetry can miss, and the physiology of hypercapnia. **Management (items 14 to 18: oxygen and its targets, lower targets for people who retain carbon dioxide, high-flow oxygen and CPAP, non-invasive ventilation, intubation) has no statement and stays uncovered until a UK source turns up.** The OX review was written by a French expert panel for its own oxygen guidelines; its targets and recommendations were not used. Two statements report harms seen in studies (hyperoxia, strong breathing effort on support), not what to do.

## How it was written
- The checklist (`coverage.csv`, 31 items) was written from general knowledge of what a finals-level topic covers, after the old story's headings had been re-traced (`retrace.csv`) but before the statements. It is one model's list, not a curriculum document.
- 22 statements are in `statements.src.txt`, quotes copied by `node tools/check-open.mjs content/open/respiratory-failure --fill`. Nothing clinical was written from memory.
- The OX source gives gas values in mm Hg; statements keep its units. UK practice uses kPa: that conversion is not in a source, so it is not stated.

## Not covered by anything found
Type 2 causes (COPD, neuromuscular disease, opioids, obesity), signs of hypercapnia, the arterial blood gas itself, finding the cause, carbon dioxide rising with too much oxygen, and respiratory failure where oxygen and ventilators are scarce (no saved source covers it). See `coverage.md`.

Next source to find: a CC BY review of hypercapnic (type 2) respiratory failure, one on oxygen in low-resource settings, and a UK source for management.
