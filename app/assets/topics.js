// The topic web behind Mess. Written for Mess, not the official GMC list. Name|also called|area|linked topics|drugs
const TOPIC_RAW = `Atrial fibrillation|AF,a fib,afib,a-fib|Cardiovascular|Stroke,Heart failure,Hyperthyroidism,Atrial flutter|Apixaban,Bisoprolol,Digoxin,Warfarin
Atrial flutter||Cardiovascular|Atrial fibrillation|Bisoprolol
Acute coronary syndrome|ACS,STEMI,NSTEMI,heart attack,myocardial infarction,MI|Cardiovascular|Angina,Heart failure,Hyperlipidaemia,Pericarditis|Aspirin,Ticagrelor,Atorvastatin,Ramipril,Bisoprolol
Angina|stable angina|Cardiovascular|Acute coronary syndrome,Hyperlipidaemia|Aspirin,GTN,Bisoprolol
Heart failure|CCF,LVF,HFrEF,HFpEF|Cardiovascular|Atrial fibrillation,Acute coronary syndrome,Hypertension,Aortic stenosis|Ramipril,Bisoprolol,Furosemide,Spironolactone
Hypertension|high blood pressure,HTN|Cardiovascular|Stroke,Chronic kidney disease,Heart failure,Pre-eclampsia|Amlodipine,Ramipril,Indapamide
Hyperlipidaemia|high cholesterol,dyslipidaemia|Cardiovascular|Acute coronary syndrome,Stroke|Atorvastatin
Aortic stenosis|AS|Cardiovascular|Heart failure|
Mitral regurgitation|MR|Cardiovascular|Heart failure,Infective endocarditis|
Infective endocarditis|endocarditis|Cardiovascular|Sepsis,Stroke|Amoxicillin,Gentamicin
Pericarditis||Cardiovascular|Acute coronary syndrome,Pulmonary embolism|Colchicine,Ibuprofen
Aortic dissection||Cardiovascular|Hypertension,Acute coronary syndrome|
Abdominal aortic aneurysm|AAA|Cardiovascular|Hypertension|
Peripheral arterial disease|PAD,claudication,limb ischaemia|Cardiovascular|Hyperlipidaemia,Diabetes type 2|Aspirin,Atorvastatin
Deep vein thrombosis|DVT|Cardiovascular|Pulmonary embolism|Apixaban,Enoxaparin
Pulmonary embolism|PE|Respiratory|Deep vein thrombosis,Pneumothorax|Apixaban,Enoxaparin
Asthma||Respiratory|COPD,Anaphylaxis|Salbutamol,Prednisolone
COPD|chronic obstructive pulmonary disease,emphysema|Respiratory|Pneumonia,Lung cancer,Asthma|Salbutamol,Tiotropium,Prednisolone,Amoxicillin
Pneumonia|CAP,HAP,chest infection,LRTI|Respiratory|Sepsis,COPD,Pulmonary embolism|Amoxicillin,Clarithromycin,Co-amoxiclav
Pneumothorax||Respiratory|Pulmonary embolism,COPD|
Lung cancer||Cancer|COPD,SIADH|
Tuberculosis|TB|Infection|Pneumonia,HIV|
Pulmonary fibrosis|IPF,interstitial lung disease,ILD|Respiratory|Rheumatoid arthritis|
Pleural effusion||Respiratory|Heart failure,Pneumonia,Lung cancer|Furosemide
Sleep apnoea|OSA|Respiratory|Hypertension|
Respiratory failure|type 1 respiratory failure,type 2 respiratory failure,hypoxaemic respiratory failure,hypercapnic respiratory failure|Respiratory|COPD,Pneumonia,Asthma,Pulmonary embolism,Sleep apnoea|
Gastroenteritis||Gastrointestinal (GI)|Coeliac disease|
GORD|reflux,gastro-oesophageal reflux|Gastrointestinal (GI)|Peptic ulcer,Oesophageal cancer|Omeprazole
Peptic ulcer|gastric ulcer,duodenal ulcer,PUD|Gastrointestinal (GI)|Upper GI bleed,GORD|Omeprazole,Amoxicillin,Clarithromycin
Upper GI bleed|haematemesis,melaena,UGIB|Gastrointestinal (GI)|Peptic ulcer,Varices,Cirrhosis|Omeprazole
Varices|variceal bleed|Gastrointestinal (GI)|Cirrhosis,Upper GI bleed|Terlipressin
Cirrhosis|chronic liver disease,ascites|Gastrointestinal (GI)|Varices,Alcohol misuse,Hepatitis|Spironolactone
Hepatitis|hep B,hep C,viral hepatitis|Infection|Cirrhosis|
Acute pancreatitis|pancreatitis|Gastrointestinal (GI)|Gallstones,Alcohol misuse|
Gallstones|biliary colic,cholelithiasis|Surgery|Cholecystitis,Acute pancreatitis|
Cholecystitis||Surgery|Gallstones,Cholangitis|Co-amoxiclav
Cholangitis|ascending cholangitis|Surgery|Gallstones,Sepsis|
Appendicitis||Surgery|Ectopic pregnancy,Gastroenteritis|
Bowel obstruction|SBO,LBO|Surgery|Hernia,Colorectal cancer|
Hernia|inguinal hernia,femoral hernia|Surgery|Bowel obstruction|
Diverticulitis|diverticular disease|Surgery|Colorectal cancer|Co-amoxiclav
Colorectal cancer|bowel cancer,colon cancer|Cancer|Iron deficiency anaemia,Bowel obstruction,Inflammatory bowel disease|
Inflammatory bowel disease|IBD,Crohn's,Crohn,ulcerative colitis,UC|Gastrointestinal (GI)|Colorectal cancer,Coeliac disease|Prednisolone,Mesalazine
Irritable bowel syndrome|IBS|Gastrointestinal (GI)|Coeliac disease,Inflammatory bowel disease|
Coeliac disease|coeliac|Gastrointestinal (GI)|Iron deficiency anaemia,Irritable bowel syndrome|
Oesophageal cancer||Cancer|GORD|
Pancreatic cancer||Cancer|Diabetes type 2|
Haemorrhoids|piles|Surgery|Colorectal cancer|
Acute kidney injury|AKI|Renal and urology|Chronic kidney disease,Hyperkalaemia,Sepsis|
Chronic kidney disease|CKD|Renal and urology|Hypertension,Diabetes type 2,Anaemia|Ramipril
Hyperkalaemia|high potassium|Renal and urology|Acute kidney injury,Chronic kidney disease|Calcium gluconate,Insulin,Salbutamol
Hyponatraemia|low sodium|Renal and urology|SIADH,Heart failure|
Urinary tract infection|UTI,pyelonephritis,cystitis|Renal and urology|Sepsis,Kidney stones|Nitrofurantoin,Trimethoprim
Kidney stones|renal colic,ureteric stone|Renal and urology|Urinary tract infection|Diclofenac
Benign prostatic hyperplasia|BPH,LUTS|Renal and urology|Prostate cancer,Urinary retention|Tamsulosin
Urinary retention||Renal and urology|Benign prostatic hyperplasia,Acute kidney injury|
Prostate cancer||Cancer|Benign prostatic hyperplasia|
Bladder cancer||Cancer|Urinary tract infection|
Testicular torsion||Surgery|Testicular cancer|
Testicular cancer||Cancer|Testicular torsion|
Nephrotic syndrome||Renal and urology|Chronic kidney disease|Furosemide
Diabetes type 1|T1DM,type 1 diabetes,T1D|Endocrine, diabetes and metabolic|Diabetic ketoacidosis,Hypoglycaemia,Coeliac disease|Insulin
Diabetes type 2|T2DM,type 2 diabetes,T2D|Endocrine, diabetes and metabolic|Hyperosmolar state,Chronic kidney disease,Hypoglycaemia|Metformin,Insulin,Gliclazide
Diabetic ketoacidosis|DKA|Endocrine, diabetes and metabolic|Diabetes type 1,Hyperkalaemia|Insulin
Hyperosmolar state|HHS|Endocrine, diabetes and metabolic|Diabetes type 2|Insulin
Hypoglycaemia|hypo|Endocrine, diabetes and metabolic|Diabetes type 1|Insulin
Hypothyroidism|underactive thyroid,Hashimoto's|Endocrine, diabetes and metabolic|Hyperthyroidism|Levothyroxine
Hyperthyroidism|overactive thyroid,thyrotoxicosis,Graves|Endocrine, diabetes and metabolic|Atrial fibrillation,Hypothyroidism|Carbimazole,Propranolol
Addison's disease|adrenal insufficiency,Addison|Endocrine, diabetes and metabolic|Hyponatraemia,Hyperkalaemia|Hydrocortisone
Cushing's syndrome|Cushing|Endocrine, diabetes and metabolic|Hypertension,Diabetes type 2|
Hypercalcaemia|high calcium|Endocrine, diabetes and metabolic|Multiple myeloma,Hyperparathyroidism|Zoledronic acid
Hyperparathyroidism||Endocrine, diabetes and metabolic|Hypercalcaemia,Kidney stones|
SIADH||Endocrine, diabetes and metabolic|Hyponatraemia,Lung cancer|
Stroke|CVA,ischaemic stroke,haemorrhagic stroke|Neurosciences|Atrial fibrillation,Transient ischaemic attack,Hypertension|Aspirin,Clopidogrel,Alteplase
Transient ischaemic attack|TIA|Neurosciences|Stroke,Atrial fibrillation|Aspirin,Clopidogrel
Subarachnoid haemorrhage|SAH,thunderclap|Neurosciences|Hypertension|Nimodipine
Subdural haematoma|subdural,extradural|Neurosciences|Stroke,Dementia|
Meningitis|meningococcal,encephalitis|Infection|Sepsis,Subarachnoid haemorrhage|Ceftriaxone,Aciclovir
Migraine||Neurosciences|Subarachnoid haemorrhage|Sumatriptan,Propranolol
Epilepsy|seizure,status epilepticus|Neurosciences|Febrile seizure|Levetiracetam,Lamotrigine,Sodium valproate,Lorazepam
Parkinson's disease|Parkinson|Neurosciences|Dementia|Levodopa
Multiple sclerosis|MS|Neurosciences|Optic neuritis|
Motor neurone disease|MND|Neurosciences||
Myasthenia gravis||Neurosciences||
Guillain-Barre syndrome|GBS,Guillain Barre|Neurosciences||
Spinal cord compression|cauda equina|Neurosciences|Prostate cancer,Back pain|Dexamethasone
Dementia|Alzheimer's,vascular dementia,Lewy body|Medicine of the older adult|Delirium,Parkinson's disease|Donepezil
Delirium|acute confusion|Medicine of the older adult|Dementia,Urinary tract infection,Pneumonia|
Falls|frailty|Medicine of the older adult|Osteoporosis,Hip fracture|
Osteoporosis||Musculoskeletal|Hip fracture,Falls|Alendronic acid
Hip fracture|neck of femur,NOF|Musculoskeletal|Falls,Osteoporosis|
Back pain|sciatica|Musculoskeletal|Spinal cord compression|
Rheumatoid arthritis|RA|Musculoskeletal|Osteoarthritis,Pulmonary fibrosis|Methotrexate,Prednisolone
Osteoarthritis|OA|Musculoskeletal|Rheumatoid arthritis|Paracetamol,Ibuprofen
Gout|pseudogout|Musculoskeletal|Septic arthritis,Chronic kidney disease|Colchicine,Allopurinol
Septic arthritis||Musculoskeletal|Gout,Sepsis|Flucloxacillin
Ankylosing spondylitis|axial spondyloarthritis|Musculoskeletal|Inflammatory bowel disease|
Systemic lupus erythematosus|SLE,lupus|Musculoskeletal|Nephrotic syndrome|Hydroxychloroquine
Polymyalgia rheumatica|PMR|Musculoskeletal|Giant cell arteritis|Prednisolone
Giant cell arteritis|GCA,temporal arteritis|Musculoskeletal|Polymyalgia rheumatica|Prednisolone
Compartment syndrome||Musculoskeletal||
Anaemia||Clinical haematology|Iron deficiency anaemia,Chronic kidney disease,B12 deficiency|
Iron deficiency anaemia|IDA|Clinical haematology|Colorectal cancer,Coeliac disease|Ferrous sulfate
B12 deficiency|pernicious anaemia|Clinical haematology|Anaemia|Hydroxocobalamin
Sickle cell disease|sickle cell|Clinical haematology||
Lymphoma|Hodgkin|Cancer||
Leukaemia|AML,CLL,ALL,CML|Cancer|Neutropenic sepsis|
Multiple myeloma|myeloma|Cancer|Hypercalcaemia,Chronic kidney disease|
Neutropenic sepsis||Cancer|Sepsis,Leukaemia|Piperacillin-tazobactam
Breast cancer||Cancer||
Sepsis|septic,septic shock|Acute and emergency|Pneumonia,Urinary tract infection,Meningitis,Acute kidney injury|Co-amoxiclav,Piperacillin-tazobactam
Anaphylaxis||Acute and emergency|Asthma|Adrenaline
Shock|hypovolaemia,hypovolaemic|Acute and emergency|Sepsis,Upper GI bleed|
Overdose|paracetamol overdose,poisoning|Acute and emergency|Depression|Acetylcysteine
Cardiac arrest|ALS,resus|Acute and emergency|Hyperkalaemia,Acute coronary syndrome|Adrenaline,Amiodarone
Alcohol misuse|alcohol withdrawal,alcohol dependence,Wernicke|Mental health|Cirrhosis,Acute pancreatitis,Delirium|Chlordiazepoxide,Thiamine
Depression|low mood,depressive|Mental health|Self-harm,Bipolar disorder,Anxiety|Sertraline,Mirtazapine
Anxiety|GAD,panic disorder|Mental health|Depression|Sertraline
Bipolar disorder|bipolar,mania|Mental health|Depression,Schizophrenia|Lithium,Olanzapine
Schizophrenia|psychosis|Mental health|Bipolar disorder|Olanzapine,Clozapine
Self-harm|suicide risk,suicidal|Mental health|Depression,Overdose|
Eating disorders|anorexia,bulimia|Mental health|Depression|
Pre-eclampsia|preeclampsia,eclampsia|Obstetrics and gynaecology|Hypertension|Labetalol,Magnesium sulfate,Aspirin
Ectopic pregnancy|ectopic|Obstetrics and gynaecology|Miscarriage,Appendicitis|Methotrexate
Miscarriage||Obstetrics and gynaecology|Ectopic pregnancy|
Gestational diabetes||Obstetrics and gynaecology|Diabetes type 2|Metformin,Insulin
Postpartum haemorrhage|PPH|Obstetrics and gynaecology|Shock|Oxytocin
Postnatal care|postnatal check,postpartum care,puerperium,6 to 8 week check|Obstetrics and gynaecology|Postpartum haemorrhage,Sepsis,Pre-eclampsia,Newborn baby check|
Endometriosis||Obstetrics and gynaecology|Pelvic inflammatory disease|
Pelvic inflammatory disease|PID|Sexual health|Ectopic pregnancy,Chlamydia|Doxycycline,Ceftriaxone
Polycystic ovary syndrome|PCOS,PMOS|Obstetrics and gynaecology|Diabetes type 2|Metformin
Ovarian cancer||Cancer||
Cervical cancer||Cancer||
Endometrial cancer||Cancer||
Menopause||Obstetrics and gynaecology|Osteoporosis|
Chlamydia||Sexual health|Pelvic inflammatory disease|Doxycycline
Gonorrhoea||Sexual health|Pelvic inflammatory disease|Ceftriaxone
HIV||Sexual health|Tuberculosis|
Bronchiolitis|RSV|Child health|Asthma|
Croup||Child health|Bronchiolitis|Dexamethasone
Febrile seizure|febrile convulsion|Child health|Epilepsy,Meningitis|Paracetamol
Kawasaki disease|Kawasaki|Child health||Aspirin
Intussusception||Child health|Appendicitis|
Pyloric stenosis||Child health||
Newborn baby check|newborn examination,NIPE,baby check,neonatal check|Child health|Postnatal care,Sepsis|
Otitis media||Ear, nose and throat||Amoxicillin
Tonsillitis|quinsy|Ear, nose and throat||Phenoxymethylpenicillin
Vertigo|BPPV,Meniere's|Ear, nose and throat||
Acute angle-closure glaucoma|glaucoma|Ophthalmology||Acetazolamide
Optic neuritis||Ophthalmology|Multiple sclerosis|
Retinal detachment||Ophthalmology||
Cataracts|cataract|Ophthalmology|Diabetes type 2|
Cellulitis||Dermatology|Sepsis|Flucloxacillin
Eczema|atopic dermatitis|Dermatology|Asthma|Hydrocortisone
Psoriasis||Dermatology||Methotrexate
Melanoma|skin cancer|Cancer||
Stevens-Johnson syndrome|SJS|Dermatology||`;
const DRUG_RAW = `Apixaban|Eliquis|DOAC
Warfarin||Anticoagulant
Enoxaparin|LMWH|Anticoagulant
Aspirin||Antiplatelet
Clopidogrel||Antiplatelet
Ticagrelor||Antiplatelet
Alteplase|thrombolysis|Thrombolytic
Bisoprolol||Beta blocker
Propranolol||Beta blocker
Labetalol||Beta blocker
Digoxin||Cardiac glycoside
Amiodarone||Antiarrhythmic
Ramipril|lisinopril,ACE inhibitor|ACE inhibitor
Amlodipine||Calcium channel blocker
Indapamide||Thiazide-like diuretic
Furosemide||Loop diuretic
Spironolactone||Potassium-sparing diuretic
Atorvastatin|statin,simvastatin|Statin
GTN|nitrate|Nitrate
Salbutamol|Ventolin|Beta-2 agonist
Tiotropium||Antimuscarinic inhaler
Prednisolone||Corticosteroid
Hydrocortisone||Corticosteroid
Dexamethasone||Corticosteroid
Amoxicillin||Penicillin
Co-amoxiclav|Augmentin|Penicillin
Flucloxacillin||Penicillin
Phenoxymethylpenicillin|penicillin V|Penicillin
Piperacillin-tazobactam|Tazocin|Penicillin
Clarithromycin||Macrolide
Doxycycline||Tetracycline
Gentamicin||Aminoglycoside
Ceftriaxone||Cephalosporin
Nitrofurantoin||Antibiotic
Trimethoprim||Antibiotic
Aciclovir||Antiviral
Omeprazole|PPI,lansoprazole|Proton pump inhibitor
Terlipressin||Vasopressin analogue
Mesalazine||Aminosalicylate
Insulin||Insulin
Metformin||Biguanide
Gliclazide||Sulfonylurea
Levothyroxine||Thyroid hormone
Carbimazole||Antithyroid
Calcium gluconate||Cardioprotective in hyperkalaemia
Zoledronic acid||Bisphosphonate
Alendronic acid|alendronate|Bisphosphonate
Nimodipine||Calcium channel blocker
Sumatriptan||Triptan
Levetiracetam||Antiepileptic
Lamotrigine||Antiepileptic
Sodium valproate|valproate|Antiepileptic
Lorazepam||Benzodiazepine
Chlordiazepoxide||Benzodiazepine
Levodopa|co-careldopa|Dopamine precursor
Donepezil||Cholinesterase inhibitor
Methotrexate||DMARD
Hydroxychloroquine||DMARD
Colchicine||Anti-inflammatory
Allopurinol||Xanthine oxidase inhibitor
Ibuprofen|NSAID,naproxen|NSAID
Diclofenac||NSAID
Paracetamol||Analgesic
Tamsulosin||Alpha blocker
Ferrous sulfate||Iron
Hydroxocobalamin||Vitamin B12
Adrenaline|epinephrine|Sympathomimetic
Acetylcysteine||Antidote
Thiamine|Pabrinex|Vitamin
Sertraline|SSRI|SSRI
Mirtazapine||Antidepressant
Lithium||Mood stabiliser
Olanzapine||Antipsychotic
Clozapine||Antipsychotic
Magnesium sulfate||Anticonvulsant in eclampsia
Oxytocin||Uterotonic
Acetazolamide||Carbonic anhydrase inhibitor
Morphine|Oramorph|Opioid
Codeine||Opioid
Co-codamol||Opioid with paracetamol
Tramadol||Opioid
Buprenorphine||Opioid
Losartan|ARB|Angiotensin receptor blocker
Candesartan||Angiotensin receptor blocker
Dapagliflozin|Forxiga|SGLT2 inhibitor
Empagliflozin|Jardiance|SGLT2 inhibitor
Pregabalin|Lyrica|Gabapentinoid
Gabapentin|Neurontin|Gabapentinoid
Macrogol|Movicol,Laxido|Osmotic laxative
Senna|Senokot|Stimulant laxative
Beclometasone|Clenil|Inhaled corticosteroid
Budesonide||Inhaled corticosteroid
Cetirizine||Antihistamine
Fexofenadine||Antihistamine`;
const TOPICS = new Map();
TOPIC_RAW.split('\n').forEach(l => { const [name, al, area, rel, drugs] = l.split('|'); TOPICS.set(name, { name, kind: 'c', area, al: al ? al.split(',') : [], rel: rel ? rel.split(',') : [], drugs: drugs ? drugs.split(',') : [] }); });
DRUG_RAW.split('\n').forEach(l => { const [name, al, cls] = l.split('|'); TOPICS.set(name, { name, kind: 'd', area: cls, al: al ? al.split(',') : [], rel: [], drugs: [] }); });
TOPICS.forEach(t => { if (t.kind === 'd') t.rel = [...TOPICS.values()].filter(x => x.drugs.includes(t.name)).map(x => x.name); });
// Short capital abbreviations must match exactly, so "as" or "pad" in normal writing don't tag.
let topicRe; function buildTopicRe() { topicRe = (() => { const pairs = []; TOPICS.forEach(t => [t.name, ...t.al].forEach(a => pairs.push([a, t.name]))); pairs.sort((a, b) => b[0].length - a[0].length); return pairs.map(([a, n]) => { const strict = a.length <= 5 && a === a.toUpperCase() && a.toLowerCase() !== 'af'; return [new RegExp('(^|[^A-Za-z0-9])' + a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![A-Za-z0-9])', strict ? '' : 'i'), n]; }); })(); }
buildTopicRe();
// A student's own topics sit on top of the shared web, and auto tags pick them up.
function syncMyTopics(list) { [...TOPICS.values()].filter(t => t.mine).forEach(t => TOPICS.delete(t.name)); (list || []).forEach(t => { if (t && t.name && !TOPICS.has(t.name)) TOPICS.set(t.name, { name: t.name, kind: t.kind === 'd' ? 'd' : 'c', area: t.area || '', al: t.al || [], rel: t.rel || [], drugs: t.drugs || [], own: t.rel || [], mine: true }); }); TOPICS.forEach(t => { if (t.kind === 'd') t.rel = [...new Set([...(t.own || []), ...[...TOPICS.values()].filter(x => x.drugs.includes(t.name)).map(x => x.name)])]; }); buildTopicRe(); }
function topicsIn(text) { if (!text) return []; const out = []; topicRe.forEach(([re, n]) => { if (!out.includes(n) && re.test(text)) out.push(n); }); return out; }

// "In practice": what the exam tests that is not a diagnosis or a drug. Law and ethics, certificates and duties,
// prevention, safe practice, consultation skills, evidence and projects. These link to conditions by situation,
// not physiology, so they live in their own map and are never tagged, counted or taught like a condition.
// The name is not settled: change PRACTICE_NAME and nothing else. Addresses use "inpractice-" whatever it is called.
// Name|also called|group|conditions|drugs|source|link|where|search words
// - "also called" are names that mean only this item. "search words" are everyday words (capacity, units, driving)
//   or school words shared by several items (QEPEP): search finds them, but they are never treated as its name.
// - where: blank, "UK" (a UK source that does not narrow it down), or the nations the source itself says it covers.
//   Read at each source on 21 Nov 2026: GOV.UK's own "applies to" field, the extent section of each Act, or the page text.
// - Every link was opened on 21 Nov 2026. A blank source means none is pinned yet. GMC pages are link only.
const PRACTICE_NAME = 'In practice';
const PRACTICE_GROUPS = ['Law and ethics', 'Certificates and duties', 'Prevention', 'Safe practice', 'Consultation skills', 'Evidence and projects'];
const PRACTICE_RAW = `Mental capacity|MCA,best interests,capacity assessment|Law and ethics|Dementia,Delirium,Stroke,Self-harm,Eating disorders,Alcohol misuse||Mental Capacity Act Code of Practice|https://www.gov.uk/government/publications/mental-capacity-act-code-of-practice|England and Wales|capacity
Consent|informed consent,Montgomery,material risk|Law and ethics|Appendicitis,Hip fracture,Cataracts||Reference guide to consent for examination or treatment|https://www.gov.uk/government/publications/reference-guide-to-consent-for-examination-or-treatment-second-edition|England|
Children and consent|Gillick,Fraser,parental responsibility|Law and ethics|Chlamydia,Self-harm,Eating disorders||Children Act 1989|https://www.legislation.gov.uk/ukpga/1989/41/contents|England and Wales|
Confidentiality|breaking confidentiality,Caldicott|Law and ethics|HIV,Chlamydia,Gonorrhoea,Epilepsy,Tuberculosis||Confidentiality: good practice in handling patient information (GMC)|https://www.gmc-uk.org/professional-standards/the-professional-standards/confidentiality|UK|disclosure
Mental Health Act|sectioning,section 2,section 3,section 5(2),MHA|Law and ethics|Schizophrenia,Bipolar disorder,Depression,Eating disorders,Self-harm,Delirium||Code of practice: Mental Health Act 1983|https://www.gov.uk/government/publications/code-of-practice-mental-health-act-1983|UK|
Safeguarding children|child protection,non-accidental injury,NAI,child abuse|Law and ethics|Newborn baby check,Self-harm,Eating disorders||Working together to safeguard children|https://www.gov.uk/government/publications/working-together-to-safeguard-children--2|England|
Safeguarding adults|elder abuse,self-neglect,domestic abuse|Law and ethics|Dementia,Falls,Hip fracture,Alcohol misuse|||||
FGM|female genital mutilation|Law and ethics|||Mandatory reporting of female genital mutilation|https://www.gov.uk/government/publications/mandatory-reporting-of-female-genital-mutilation-procedural-information|England and Wales|mandatory reporting
Duty of candour|raising concerns,whistleblowing,incident reporting,Datix|Law and ethics|Anaphylaxis||Openness and honesty when things go wrong: the professional duty of candour (GMC and NMC)|https://www.gmc-uk.org/professional-standards/the-professional-standards/candour---openness-and-honesty-when-things-go-wrong|UK|
End of life decisions|DNACPR,advance decision,ReSPECT,lasting power of attorney,LPA|Law and ethics|Dementia,Heart failure,COPD,Motor neurone disease,Lung cancer,Cardiac arrest||Mental Capacity Act 2005|https://www.legislation.gov.uk/ukpga/2005/9/contents|England and Wales|
Abortion law|termination of pregnancy,Abortion Act|Law and ethics|||Abortion Act 1967|https://www.legislation.gov.uk/ukpga/1967/87/contents|England, Wales and Scotland|
Organ donation|Human Tissue Act,deemed consent,brain stem death|Law and ethics|Subarachnoid haemorrhage,Cardiac arrest||Human Tissue Act 2004|https://www.legislation.gov.uk/ukpga/2004/30/contents|England, Wales and Northern Ireland|
Equality and adjustments|Equality Act,protected characteristics,reasonable adjustments|Law and ethics|||Equality Act 2010|https://www.legislation.gov.uk/ukpga/2010/15/contents|England, Wales and Scotland|
Fitness to drive|DVLA|Certificates and duties|Epilepsy,Stroke,Transient ischaemic attack,Acute coronary syndrome,Diabetes type 1,Diabetes type 2,Hypoglycaemia,Dementia,Sleep apnoea,Alcohol misuse,Cataracts,Parkinson's disease|Insulin|Assessing fitness to drive|https://www.gov.uk/guidance/assessing-fitness-to-drive-a-guide-for-medical-professionals|England, Wales and Scotland|driving
Fit notes|sick note,Med3,statement of fitness for work|Certificates and duties|Back pain,Depression,Anxiety||Fit note: guidance for healthcare professionals|https://www.gov.uk/government/publications/fit-note-guidance-for-healthcare-professionals|UK|
Certifying a death|death certificate,MCCD,medical examiner,verifying death|Certificates and duties|Cardiac arrest,Sepsis,Pneumonia,Dementia||MCCD guidance for medical practitioners|https://www.gov.uk/government/publications/medical-certificate-of-cause-of-death-mccd-guidance-for-medical-practitioners|England and Wales|cause of death
Referring to the coroner|coroner,notification of deaths,inquest|Certificates and duties|Overdose,Hip fracture,Self-harm,Subdural haematoma||Notification of Deaths Regulations 2019 guidance|https://www.gov.uk/government/publications/notification-of-deaths-regulations-2019-guidance|England and Wales|
Notifiable diseases|UKHSA,health protection team|Certificates and duties|Meningitis,Tuberculosis,Hepatitis,Gastroenteritis||Notifiable diseases and how to report them|https://www.gov.uk/guidance/notifiable-diseases-and-how-to-report-them|England|notification
Controlled drugs|CD prescription,schedule 2|Certificates and duties||||||
Vaccination|immunisation,Green Book,vaccine schedule|Prevention|Pneumonia,COPD,Meningitis,Hepatitis,Sickle cell disease,Cervical cancer,Bronchiolitis||The Green Book|https://www.gov.uk/government/collections/immunisation-against-infectious-disease-the-green-book|UK|
Screening programmes|cervical screening,bowel screening,breast screening,AAA screening,diabetic eye screening|Prevention|Cervical cancer,Colorectal cancer,Breast cancer,Abdominal aortic aneurysm,Diabetes type 1,Diabetes type 2,Chlamydia||Cervical screening: programme overview|https://www.gov.uk/guidance/cervical-screening-programme-overview|England|
Antenatal and newborn screening|heel prick,blood spot,anomaly scan|Prevention|Newborn baby check,Sickle cell disease,Hepatitis,HIV||Newborn blood spot screening: programme handbook|https://www.gov.uk/government/publications/health-professional-handbook-newborn-blood-spot-screening|UK|
Alcohol, activity and diet advice|low risk drinking,Eatwell,brief intervention|Prevention|Alcohol misuse,Hypertension,Diabetes type 2,Cirrhosis,Hyperlipidaemia||Alcohol consumption: advice on low risk drinking|https://www.gov.uk/government/publications/alcohol-consumption-advice-on-low-risk-drinking|UK|units
Stopping smoking|smoking cessation,very brief advice|Prevention|COPD,Lung cancer,Peripheral arterial disease,Acute coronary syndrome||Health matters: stopping smoking|https://www.gov.uk/government/publications/health-matters-stopping-smoking-what-works|UK|
Health inequalities|social determinants|Prevention|||Health disparities and health inequalities|https://www.gov.uk/government/publications/health-disparities-and-health-inequalities-applying-all-our-health|England|deprivation
Travel health|malaria prophylaxis,travel vaccines|Prevention|Gastroenteritis,Hepatitis||Malaria prevention guidelines for travellers from the UK|https://www.gov.uk/government/publications/malaria-prevention-guidelines-for-travellers-from-the-uk-2026|UK|
The deteriorating patient|NEWS2,early warning score,SBAR|Safe practice|Sepsis,Pneumonia,Shock,Respiratory failure,Acute kidney injury||National Early Warning Score (NEWS) 2 (Royal College of Physicians)|https://www.rcp.ac.uk/resources/national-early-warning-score-news-2/|UK|escalation
Blood transfusion|transfusion reaction,group and save,crossmatch|Safe practice|Upper GI bleed,Postpartum haemorrhage,Anaemia,Sickle cell disease,Varices|||||
Prescribing safely|high-risk drugs,polypharmacy,deprescribing,drug chart|Safe practice|Falls,Chronic kidney disease,Acute kidney injury|Warfarin,Insulin,Gentamicin,Lithium,Methotrexate,Digoxin|Drug Safety Update|https://www.gov.uk/drug-safety-update|UK|
Antibiotic stewardship|start smart then focus,antimicrobial resistance|Safe practice|Pneumonia,Urinary tract infection,Cellulitis,Sepsis|Amoxicillin,Co-amoxiclav,Gentamicin|Antimicrobial stewardship: start smart then focus|https://www.gov.uk/government/publications/antimicrobial-stewardship-start-smart-then-focus|England|
Infection control and sharps injuries|needlestick,hand hygiene,PPE|Safe practice|HIV,Hepatitis,Tuberculosis,Gastroenteritis|||||isolation
Human factors and patient safety|never events,situational awareness|Safe practice||||||checklists
Bedside scores|4AT,PHQ-9,GAD-7|Safe practice|Delirium,Depression,Anxiety||4AT rapid clinical test for delirium|https://www.the4at.com/||
Structuring a consultation|ICE,ideas concerns expectations|Consultation skills||||||history taking
Shared decisions||Consultation skills||||||options,risks and benefits,doing nothing
Breaking bad news|SPIKES|Consultation skills|Lung cancer,Motor neurone disease,Dementia,Miscarriage|||||
Explaining a diagnosis|chunk and check|Consultation skills|Diabetes type 2,Epilepsy,Asthma|||||information giving
Communication needs|interpreter|Consultation skills||||||hearing loss,learning disability
Difficult conversations|angry patient,collusion|Consultation skills||||||complaint
Behaviour change|motivational interviewing|Consultation skills|Alcohol misuse,Diabetes type 2|||||
Clinical audit|audit cycle,re-audit|Evidence and projects||||||standards,QEPEP
Quality improvement|QI,QIP,PDSA,plan do study act,model for improvement,driver diagram,run chart|Evidence and projects||||||QEPEP
Study designs|RCT,case-control,cross-sectional,systematic review|Evidence and projects||||||cohort
Critical appraisal|CASP|Evidence and projects||||||bias,confounding,APEP
Statistics for medics|NNT,p value,confidence interval,odds ratio,relative risk|Evidence and projects||||||sensitivity,specificity
Searching the literature|PICO,literature review,PubMed|Evidence and projects||||||APEP,dissertation
Research, audit or service evaluation|ethics approval,HRA|Evidence and projects||||||
Writing for patients|lay summary,patient information leaflet|Evidence and projects||||||QEPEP
Your project|APEP,QEPEP,PEP,SSC,SSM,student selected component|Evidence and projects||||||`;
const PRACTICE = new Map();
PRACTICE_RAW.split('\n').forEach(l => { const [name, al, area, rel, drugs, src, url, where, find] = l.split('|'), list = (x) => x ? x.split(',') : []; PRACTICE.set(name, { name, kind: 'p', area, al: list(al), rel: list(rel), drugs: list(drugs), src: src || '', url: url || '', where: where || '', find: list(find) }); });
// Links run both ways: the items that name a condition or drug.
const practiceFor = (n) => [...PRACTICE.values()].filter(p => p.rel.includes(n) || p.drugs.includes(n));
// Search by the start of any word in the name, its other names or its search words, so "DVLA", "section" and "QEPEP"
// land, and "af" does not bring up Safeguarding.
function practiceFind(q) { q = String(q || '').trim().toLowerCase(); if (q.length < 2) return []; const starts = (s) => { s = s.toLowerCase(); return s.startsWith(q) || s.split(/[^a-z0-9]+/).some(w => w.startsWith(q)); }; return [...PRACTICE.values()].filter(p => [p.name, ...p.al, ...p.find].some(starts)); }
