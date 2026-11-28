# Hyperlipidaemia from open sources only: record (26 Nov 2026)

Writer: Claude (the unattended content line, 26 Nov 2026). Claude therefore cannot be a checker here. Checkers still to run: two models that are not Claude, through the "Gemini fact check" Action with `condition: content/open/hyperlipidaemia`, or by hand with `--packet` (planted faults are mixed in by the tool).

Level reached: **mapped, first statements written and quote-checked. Nothing is agreed and nothing is in the app.**

This folder is new work from open sources. It does not use, reword or build on the frozen pre-stop file `content/cardiovascular/hyperlipidaemia/claims.csv` (NICE), which was not opened.

## Why this topic
`content/coverage.md` does not exist, so `content/open/queue.md` is the ordered list. Its first five rows are on `codex/open-atrial-fibrillation` (PR #150) and pulmonary embolism was done by this line on 25 Nov; hyperlipidaemia is the top row with no folder on any branch.

## Sources (saved copies in `content/open-sources/`)
| Short name | Source | Licence |
|---|---|---|
| N | NHS website: High cholesterol (updated 13 Mar 2026) | OGL v3 |
| NL | NHS website: High cholesterol, Cholesterol levels (updated 13 Mar 2026), saved this shift | OGL v3 |
| NT | NHS website: High cholesterol, Getting tested (updated 13 Mar 2026), saved this shift | OGL v3 |
| NM | NHS website: High cholesterol, Medicines for high cholesterol (updated 13 Mar 2026), saved this shift | OGL v3 |
| NW | NHS website: High cholesterol, How to lower your cholesterol (updated 13 Mar 2026), saved this shift | OGL v3 |
| NS | NHS website: Statins (updated 5 May 2026), saved this shift | OGL v3 |
| SK | Current Management Guidelines on Hyperlipidemia: The Silent Killer (2021), pmc8363437 | CC BY 4.0 |
| ND | New Therapeutic Approaches in Treatment of Dyslipidaemia: A Narrative Review (2022), pmc9324773 | CC BY 4.0 |

The five new NHS pages were saved with `tools/fetch-open.mjs`. The NHS "causes" address returned the same text as the main page and was not kept. NHS pages for familial hypercholesterolaemia and statin side effects returned 404. Europe PMC search returned 503, so no new review was searched for. Sources were read only with `node tools/find-open.mjs show`.

## How it was written
- The checklist (`coverage.csv`, 35 items, including the Confused with, Often missed, Why and Elsewhere in the world groups) was written first, before any source was read. It is one model's list, not a curriculum document.
- 88 statements in `statements.src.txt`; `check-open.mjs --fill` copied every quote, and the check without `--fill` confirms each is word for word and from an allowed source.
- SK is a US review built round the 2018 ACC/AHA guideline. Its US targets, thresholds and guideline steps were **not** used; only its biology, presentation and drug mechanism sentences were. ND's sentences on new drugs were used only for mechanism and well-established drugs; its pipeline drug results were not used, and two sentences that looked doubtful (inclisiran's approved uses; lerodalcibep "by gene editing") were deliberately left out.
- Nothing clinical was written from memory.

## Not covered by anything saved
Nothing found: LDL targets and follow-up blood tests after starting treatment (UK), very high triglycerides causing pancreatitis, children with familial hypercholesterolaemia, and that familial hypercholesterolaemia is underdiagnosed.
Thin: when to suspect familial hypercholesterolaemia and cascade testing (only "family history is of great importance"), secondary causes such as hypothyroidism and drugs, why statins lower LDL through more liver LDL receptors, treating high triglycerides, and a muscle-pain workup. UK management steps beyond what the NHS pages say should link to the guideline.
Next sources to find: a CC BY review of familial hypercholesterolaemia (diagnosis, children, cascade testing) and one on hypertriglyceridaemia, once Europe PMC answers.

## Reworded on 28 Nov 2026 (writer: Claude, BUILD chat)
Rows 3-11,15,16,20,22,33,34,36,37,45,46,49-52,54,56,57,59,64-66,72,73,87-89 were disputed by Gemini and/or Qwen and are reworded from their own quotes: a dropped condition, number or exception put back, an added cause or population taken out, or the quote widened (same source) to the heading or sentence that names the condition. Claude did not check them; Gemini and Qwen reread them.
