# Hyperlipidaemia from open sources only: record (27 Nov 2026)

Writer: GPT (through Codex, 27 Nov 2026). GPT therefore cannot be a checker here.

## Sources (saved copies in `content/open-sources/`)

| Short name | Source | Licence | Updated |
|---|---|---|---|
| N1 | NHS website, What is high cholesterol? (`nhs-high-cholesterol`) | OGL-UK-3.0 | 13 Mar 2026 |
| A | Su et al., Current Management Guidelines on Hyperlipidemia: The Silent Killer, Journal of Lipids (`pmc8363437`) | CC-BY-4.0 | 31 Jul 2021 |
| R | Merćep et al., New Therapeutic Approaches in Treatment of Dyslipidaemia—A Narrative Review, Pharmaceuticals (`pmc9324773`) | CC-BY-4.0 | 7 Jul 2022 |

## What was kept from a model

- `find-open.mjs show` hid the sentences set aside in the saved copies.

## How it was written

- The 43-item checklist in `coverage.csv` was written before opening the saved sources. All 22 statements name the sentence addresses from which `check-open.mjs --fill` copied their quotes.
- The NHS overview supports general lifestyle measures and says some people also need medicine. The reviews supply mechanisms, clinical features and observations specific to American adults or Central Europe.

## Not covered by anything found

See `coverage.md` and the `p` markers in `statements.src.txt`. The sources left gaps in secondary-cause work-up, fasting repeat testing, cardiovascular risk estimation, assessment in established cardiovascular disease, diabetes or kidney disease, and the clinical clues to severe hypertriglyceridaemia. They did not provide usable coverage of pancreatitis or urgent assessment, cascade testing, specialist referral, familial disease without signs, the key distinctions between causes of lipid elevations, or detection of familial disease where genetic testing is hard to access. The NHS overview did not supply detailed dietary, activity, weight, smoking or alcohol advice, drug selection, monitoring, targets, adverse-effect advice or treatment in pregnancy.
