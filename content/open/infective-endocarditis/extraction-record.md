# Infective endocarditis from open sources only: record (27 Nov 2026)

Writer: GPT (through Codex, 27 Nov 2026). GPT therefore cannot be a checker here.

## Sources (saved copies in `content/open-sources/`)

| Short name | Source | Licence | Updated |
|---|---|---|---|
| N1 | NHS website, Endocarditis (`nhs-endocarditis`) | OGL-UK-3.0 | 16 Feb 2026 |
| A | Cuervo et al., Current Challenges in the Management of Infective Endocarditis, Frontiers in Medicine (`pmc7937698`) | CC-BY-4.0 | 22 Feb 2021 |
| H | Nappi et al., Infective Endocarditis in High-Income Countries, Metabolites (`pmc9329978`) | CC-BY-4.0 | 25 Jul 2022 |
| R | Recent Advances in the Rheumatic Fever and Rheumatic Heart Disease Continuum (`pmc8878614`, read with no statement drawn from it) | CC-BY-4.0 | 28 Jan 2022 |
| R2 | Rheumatic heart disease anno 2020: Impacts of gender and migration on epidemiology and management (`pmc7757241`, read with no statement drawn from it) | CC-BY-4.0 | 29 Aug 2020 |

## What was kept from a model

- `find-open.mjs show` hid the sentences set aside in the saved copies.

## How it was written

- The 43-item checklist in `coverage.csv` was written before opening the saved sources. All 25 statements name the sentence addresses from which `check-open.mjs --fill` copied their quotes.
- The NHS page supplies treatment and prevention advice. The reviews support the clinical and diagnostic statements, including the observations on causes and rheumatic valve disease in low-income countries.

## Not covered by anything found

See `coverage.md` and the `p` markers in `statements.src.txt`. The sources left gaps in blood culture timing, investigation of culture-negative cases, distinguishing endocarditis from other causes of bacteraemia, the mechanism of glomerulonephritis and diagnosis with limited culture or imaging access. The NHS copy did not cover injection-related harm reduction, organism-specific regimens, detailed surgical indications or timing, the multidisciplinary team's remit, antibiotic prophylaxis or the distinction between relapse and reinfection.
