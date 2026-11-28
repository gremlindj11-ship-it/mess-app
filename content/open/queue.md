# Open-source writing queue

One topic a row, in order. The writer takes the next rows whose folder does not exist yet (`content/open/<folder>/`).
Sources are saved copies in `content/open-sources/<id>.json`. Read them only with `node tools/find-open.mjs show <id>`.
A topic may also use any other saved source that covers it. `hypertension` is done and is the worked example.

## Cardiovascular
| Folder | Topic name in Mess | Saved sources |
|---|---|---|
| atrial-fibrillation | Atrial fibrillation | nhs-atrial-fibrillation, pmc11666470, pmc8744894 |
| atrial-flutter | Atrial flutter | pmc11262378, nhs-supraventricular-tachycardia-svt, nhs-atrial-fibrillation |
| acute-coronary-syndrome | Acute coronary syndrome | nhs-heart-attack, pmc6855329, pmc7408729, nhs-coronary-heart-disease |
| angina | Angina | nhs-angina, pmc7035719, pmc9409871, nhs-coronary-heart-disease |
| heart-failure | Heart failure | nhs-heart-failure, pmc7021648, pmc8898236, pmc6818035 |
| hyperlipidaemia | Hyperlipidaemia | nhs-high-cholesterol, pmc8363437, pmc9324773 |
| aortic-stenosis | Aortic stenosis | pmc8486019, pmc10417789, nhs-heart-valve-disease, nhs-aortic-valve-replacement |
| mitral-regurgitation | Mitral regurgitation | nhs-mitral-valve-problems, pmc11396481, pmc10036770, nhs-heart-valve-disease |
| infective-endocarditis | Infective endocarditis | nhs-endocarditis, pmc7937698, pmc9329978 |
| pericarditis | Pericarditis | nhs-pericarditis, pmc12263481, pmc9683083 |
| aortic-dissection | Aortic dissection | pmc9605578, pmc9602170, pmc8627055 |
| abdominal-aortic-aneurysm | Abdominal aortic aneurysm | nhs-abdominal-aortic-aneurysm, pmc10749949, pmc9506302 |
| peripheral-arterial-disease | Peripheral arterial disease | nhs-peripheral-arterial-disease-pad, pmc9320565, pmc8645843, pmc10284269 |
| deep-vein-thrombosis | Deep vein thrombosis | nhs-deep-vein-thrombosis-dvt, pmc10601227, pmc7286578, pmc9964264 |
| pulmonary-embolism | Pulmonary embolism | nhs-pulmonary-embolism, pmc9504600, pmc9104204, pmc6375098, pmc9964264 |

### Elsewhere in the world: cardiovascular
Saved sources for the fourth required group. Use them for any topic they bear on.
| Saved source | What it covers | Topics it serves |
|---|---|---|
| pmc8878614, pmc7757241 | Rheumatic fever and rheumatic heart disease | mitral-regurgitation, aortic-stenosis, infective-endocarditis, heart-failure, atrial-fibrillation |
| pmc6614205, pmc7218776 | Chagas disease and its heart disease | heart-failure, atrial-fibrillation |
| pmc8510921 | Peripartum cardiomyopathy | heart-failure |

## Respiratory (re-traced from the old stories: NICE's reply, 26 Nov)
| Folder | Topic name in Mess | Saved sources |
|---|---|---|
| copd | COPD | nhs-copd, pmc8539950 |
| asthma | Asthma | nhs-asthma, pmc6591438, pmc7253669 |
| pleural-effusion | Pleural effusion | pmc9601808, pmc7695997 |
| respiratory-failure | Respiratory failure | pmc6658637, pmc11486880 |

No NHS or GOV.UK page exists for pleural effusion or respiratory failure (27 Nov: both 404), so those two can't pass stage 1 until one is found.
Sofia, 27 Nov: no waiver. Both now have understanding statements from the CC BY reviews (28 Nov); management stays uncovered until a UK source turns up (each extraction-record.md says so).

### Elsewhere in the world: respiratory
Saved sources for the fourth required group. Use them for any topic they bear on.
| Saved source | What it covers | Topics it serves |
|---|---|---|
| pmc13000056 | Tuberculous pleural effusion | pleural-effusion |
| pmc6591438 | Asthma around the world (epidemiology) | asthma |
