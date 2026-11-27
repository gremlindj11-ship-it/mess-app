# Aortic stenosis from open sources only: record (27 Nov 2026)

Writer: GPT (through Codex, 27 Nov 2026). GPT therefore cannot be a checker here.

## Sources (saved copies in `content/open-sources/`)

| Short name | Source | Licence | Updated |
|---|---|---|---|
| N1 | NHS website, Heart valve disease (`nhs-heart-valve-disease`) | OGL-UK-3.0 | 22 Jan 2025 |
| N2 | NHS website, Heart valve replacement (`nhs-aortic-valve-replacement`, read with no statement drawn from it) | OGL-UK-3.0 | Not stated |
| A | Zebhi et al., Calcific Aortic Stenosis—A Review on Acquired Mechanisms of the Disease and Treatments, Frontiers in Cardiovascular Medicine (`pmc8486019`) | CC-BY-4.0 | 17 Sep 2021 |
| E | Manzo et al., Echocardiographic Evaluation of Aortic Stenosis: A Comprehensive Review, Diagnostics (`pmc10417789`) | CC-BY-4.0 | 29 Jul 2023 |
| R | Rwebembera et al., Recent Advances in the Rheumatic Fever and Rheumatic Heart Disease Continuum, Pathogens (`pmc8878614`) | CC-BY-4.0 | 28 Jan 2022 |
| R2 | Rheumatic heart disease anno 2020: Impacts of gender and migration on epidemiology and management (`pmc7757241`, read with no statement drawn from it) | CC-BY-4.0 | 29 Aug 2020 |

## What was kept from a model

- `find-open.mjs show` hid the sentences set aside in the saved copies.

## How it was written

- The 43-item checklist in `coverage.csv` was written before opening the saved sources. All 24 statements name the sentence addresses from which `check-open.mjs --fill` copied their quotes.
- Management statements use the NHS heart valve disease page and keep its general scope. The rheumatic heart disease statements keep the settings named in that review.

## Not covered by anything found

See `coverage.md` and the `p` markers in `statements.src.txt`. Gaps include the murmur and other examination findings, ECG and chest X-ray findings, the role of CT calcium scoring, aortic disease with a bicuspid valve, prognosis after symptoms develop, and why exertion can cause syncope. The NHS valve replacement copy is an index. It did not supply severity thresholds, aortic stenosis-specific prescribing or replacement criteria, selection for transcatheter intervention, or advice for older people with frailty. The rheumatic review describes late presentation in endemic settings but does not give an aortic stenosis-specific estimate for those settings.
