# Aortic stenosis from open sources only: record (26 Nov 2026)

Writer: Claude (the unattended content line, 26 Nov 2026). Claude therefore cannot be a checker here. Checkers still to run: two models that are not Claude, through the "Gemini fact check" Action with `condition: content/open/aortic-stenosis`, or by hand with `--packet` (planted faults are mixed in by the tool).

Level reached: **mapped, first statements written and quote-checked. Nothing is agreed and nothing is in the app.**

## Why this topic
`content/coverage.md` does not exist; `content/open/queue.md` is the ordered list. Its first five rows are Codex's (`codex/open-atrial-fibrillation`), hyperlipidaemia and pulmonary embolism are done by this line, so aortic stenosis is the top row with no folder on any branch.

## Sources (saved copies in `content/open-sources/`)
| Short name | Source | Licence |
|---|---|---|
| CR | Calcific Aortic Stenosis: A Review on Acquired Mechanisms of the Disease and Treatments (2021), pmc8486019 | CC BY 4.0 |
| EC | Echocardiographic Evaluation of Aortic Stenosis: A Comprehensive Review (2023), pmc10417789 | CC BY 4.0 |
| NV | NHS website: Heart valve disease (updated 22 Jan 2025) | OGL v3 |
| RH | Recent Advances in the Rheumatic Fever and Rheumatic Heart Disease Continuum (2022), pmc8878614 | CC BY 4.0 |

All four were already saved and in the register. Sources were read only with `node tools/find-open.mjs show`. The NHS heart valve replacement page saved as `nhs-aortic-valve-replacement` holds only its contents list, so it gave nothing. Sentences in the reviews that report ACC/AHA or ESC guideline recommendations were not used.

## How it was written
- The checklist (`coverage.csv`, 41 items, including the Confused with, Often missed, Why and Elsewhere in the world groups) was written first, before any source was read. It is one model's list, not a curriculum document.
- 79 statements in `statements.src.txt`; `check-open.mjs --fill` copied every quote, and the check without `--fill` confirms each is word for word.
- The NHS page is about heart valve disease in general; statements from it say "heart valve disease, such as aortic stenosis" rather than claiming the NHS said it of aortic stenosis alone.
- Nothing clinical was written from memory.

## Not covered by anything saved
Nothing found: the murmur and where it radiates; signs of severe disease (slow-rising pulse, narrow pulse pressure, soft second sound); aortic sclerosis; other causes of chest pain and fainting; why exertion causes fainting; why the second sound goes soft.
Thin: ECG and chest X-ray (only the NHS valve disease test list), UK choice between TAVI and surgery, UK follow-up intervals. These should link to the guideline.
Next source to find: a CC BY review of the clinical assessment of aortic stenosis on Europe PMC. `find-open.mjs search` got "503 Service Unavailable" on 26 Nov, so none was searched for or saved.

## Reworded on 28 Nov 2026 (writer: Claude, BUILD chat)
Rows 2,10,12,14,16-21,25,26,29,33,35-37,41,43-45,48-52,54,56-62,64,65,67-70,72,74,75,77,79,80 were disputed by Gemini and/or Qwen and are reworded from their own quotes: a dropped condition, number or exception put back, an added cause or population taken out, or the quote widened (same source) to the heading or sentence that names the condition. Claude did not check them; Gemini and Qwen reread them.
