# Mitral regurgitation from open sources only: record (27 Nov 2026)

Writer: GPT (through Codex, 27 Nov 2026). GPT therefore cannot be a checker here.

## Sources (saved copies in `content/open-sources/`)

| Short name | Source | Licence | Updated |
|---|---|---|---|
| N1 | NHS website, Heart valve disease (`nhs-mitral-valve-problems`) | OGL-UK-3.0 | 22 Jan 2025 |
| N2 | NHS website, Heart valve disease (`nhs-heart-valve-disease`, same text as N1) | OGL-UK-3.0 | 22 Jan 2025 |
| A | Iliakis et al., Atrial Functional Mitral Regurgitation: From Diagnosis to Current Interventional Therapies, Journal of Clinical Medicine (`pmc11396481`) | CC-BY-4.0 | 25 Aug 2024 |
| P | Altes et al., Quantification of primary mitral regurgitation by echocardiography: A practical appraisal, Frontiers in Cardiovascular Medicine (`pmc10036770`) | CC-BY-4.0 | 10 Mar 2023 |
| R | Rwebembera et al., Recent Advances in the Rheumatic Fever and Rheumatic Heart Disease Continuum, Pathogens (`pmc8878614`) | CC-BY-4.0 | 28 Jan 2022 |
| R2 | Rheumatic heart disease anno 2020: Impacts of gender and migration on epidemiology and management (`pmc7757241`, read with no statement drawn from it) | CC-BY-4.0 | 29 Aug 2020 |

## What was kept from a model

- `find-open.mjs show` hid the sentences set aside in the saved copies.

## How it was written

- The 43-item checklist in `coverage.csv` was written before opening the saved sources. All 25 statements name the sentence addresses from which `check-open.mjs --fill` copied their quotes.
- The two NHS IDs display the same general valve disease text. The management statements cite N1 and retain that scope. Statements on rheumatic disease retain the settings named by their sources.

## Not covered by anything found

See `coverage.md` and the `p` markers in `statements.src.txt`. There were gaps in murmur characteristics, other examination findings, ECG and chest X-ray findings, exertional worsening and the mechanism of acute pulmonary oedema. The NHS copy did not cover mitral regurgitation-specific drug choices, referral or intervention criteria, edge-to-edge repair or options for people at high surgical risk. The low-resource evidence addresses finding undiagnosed rheumatic disease, with gaps in access to mitral valve care.
