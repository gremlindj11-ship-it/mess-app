// Mess · store.js · Saving and loading: the student’s data, sample data, decks kept on the device.
// Loaded in this order by index.html: store.js, safety.js, intake.js, links.js, ai.js, flow.js, tools.js, intro.js, today.js, practice.js, stats.js, topics.js, story.js, curricula.js, route.js, diagrams.js, placement.js, profile.js, import.js, packs.js, apps.js, boot.js.
// All files share one global scope (plain scripts, no build step).

// ---------- actions
// Every button in Mess runs an action by name (data-a). Each file adds its own with Object.assign(act, {...}).
const act = {};
// Mess: no build step, no server. All data stays in this browser.
const REAL_KEY = 'mso.v1', SAMPLE_KEY = 'mso.sample.v1', SECRET = 'mso.key';
let SAMPLE = false;
 try { SAMPLE = localStorage.getItem('mso.sample') === '1'; } catch (e) {}
let KEY = SAMPLE ? SAMPLE_KEY : REAL_KEY;
const FRESH = () => ({
  setupDone: false, theme: 'clean', profile: { year: '', uni: '', curriculum: '' }, examDate: '',
  tasks: [], day: [], scores: [], other: [], history: [], missed: [],
  folders: [], cases: [], layout: LAYOUTS.clerking.sections, memory: [], reports: [],
  pins: { BNF: true }, opens: {}, cStyle: 'Kind', instructions: '', ai: 'none',
  todayOn: { plan: true, day: true }, sketchOff: false, customColour: '', customHi: '', pages: { Practice: true, Gaps: true, Placement: true, Links: true, Tools: true }, sections: { OSCE: true, Questions: true, Prescribing: true, Consultant: true }
});
let db = FRESH();
try { db = { ...db, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch (e) {}
syncMyTopics(db.myTopics);
const ui = { page: db.setupDone ? 'Today' : 'intro', step: 0, mode: 'OSCE', toolsOpen: false, calc: 'Basic', basic: { disp: '0', acc: null, op: null, fresh: true },
  askOpen: false, askLog: [], report: false, curId: null, open: {}, folderOpen: {}, search: '', filter: 'All',
  o: { stage: 'mode', who: 'solo', st: null, log: [], talk: false }, q: { stage: 'start', topic: 'All', kind: 'All', i: 0, pick: null, score: 0, extra: [] },
  rx: { kind: 'Prescribe', drug: '', dose: '', route: '', freq: '', checked: false, calc: '', calcMsg: '', pick: null }, chat: [], tchat: [], tchatBusy: false, note: '', teach: {} };
const save = () => { const t = JSON.stringify(db); try { localStorage.setItem(KEY, t); } catch (e) { try { localStorage.removeItem(KEY + '.before'); localStorage.setItem(KEY, t); } catch (e2) { toast("Couldn't save. Your browser storage may be full."); } } };
const getKey = () => { try { return localStorage.getItem(SECRET + '.' + db.ai) || (db.ai === 'groq' || db.ai === 'claude' ? localStorage.getItem(SECRET) : '') || ''; } catch (e) { return ''; } };
function exportMine() { const cards = (db.cards || []).filter(c => c.topic && TOPICS.has(c.topic) && (c.src === c.topic || c.src === 'AI')).map(c => ({ f: c.f, b: c.b, topic: c.topic })), qs = (db.myQs || []).map(({ kind, topic, stem, opts, a, why, tp }) => ({ kind, topic, stem, opts, a, why, tp })); return { app: 'mess-additions', version: 1, myTopics: db.myTopics || [], myNotes: db.myNotes || {}, myQs: qs, cards, myDiagrams: db.myDiagrams || {} }; }
function importMine(o) { if (!o || o.app !== 'mess-additions') throw new Error('bad'); const S = (x) => typeof x === 'string', L = (x) => Array.isArray(x) ? x.filter(S) : []; let nt = 0, nn = 0, nq = 0, nc = 0; db.myTopics = db.myTopics || []; db.myNotes = db.myNotes || {}; db.myQs = db.myQs || []; L0(o.myTopics).forEach(t => { if (t && S(t.name) && t.name.trim() && !TOPICS.has(t.name)) { db.myTopics.push({ name: t.name.trim(), kind: t.kind === 'd' ? 'd' : 'c', area: S(t.area) ? t.area : '', al: L(t.al), rel: L(t.rel), drugs: L(t.drugs) }); syncMyTopics(db.myTopics); nt++; } }); Object.entries(o.myNotes && typeof o.myNotes === 'object' ? o.myNotes : {}).forEach(([n, m]) => { if (!TOPICS.has(n) || !m || typeof m !== 'object') return; Object.entries(m).forEach(([i, pts]) => { const l = L(pts); if (l.length && /^\d+$/.test(i) && !(db.myNotes[n] || {})[i]) { (db.myNotes[n] = db.myNotes[n] || {})[i] = l; nn++; } }); }); L0(o.myQs).forEach(q => { const opts = q ? L(q.opts).slice(0, 5) : []; if (q && S(q.stem) && opts.length >= 2 && Number.isInteger(q.a) && q.a >= 0 && q.a < opts.length && !allQs().some(x => x.stem === q.stem)) { db.myQs.push({ id: 'q' + Date.now() + db.myQs.length, kind: 'SBA', topic: S(q.topic) ? q.topic : '', stem: q.stem, opts, a: q.a, why: S(q.why) ? q.why : '', tp: S(q.tp) ? q.tp : '' }); nq++; } }); if (o.myDiagrams && typeof o.myDiagrams === 'object') { db.myDiagrams = db.myDiagrams || {}; Object.entries(o.myDiagrams).forEach(([n, m]) => { if (TOPICS.has(n) && m && typeof m === 'object' && !db.myDiagrams[n]) db.myDiagrams[n] = m; }); } L0(o.cards).forEach(c => { if (c && S(c.f) && S(c.b) && addCard(c.f, c.b, S(c.topic) ? c.topic : '', S(c.topic) ? c.topic : '')) nc++; }); save(); const pl = (k, w) => k + ' ' + w + (k === 1 ? '' : 's'); return `Added ${pl(nt, 'topic')}, ${pl(nn, 'note section')}, ${pl(nq, 'question')}, ${pl(nc, 'card')}.`; }
const L0 = (x) => Array.isArray(x) ? x : [];
const LIB = { cards: [] };
// Delete everything Mess keeps in this browser: the main save and the sample one, the copies kept for Undo, AI keys,
// the library and links, and what's in IndexedDB (imported decks, the Anki match). The website's "stop counting my
// visits" choice is kept. The store is emptied first (that works even while other connections are open), then the
// database is deleted, then the page reloads so nothing old stays in memory (the ? panel's Undo, chats, the Anki match).
async function wipeAll() {
  try { for (const k of Object.keys(localStorage)) if (/^(mso|medos)\./.test(k)) localStorage.removeItem(k); } catch (e) {}
  try { sessionStorage.clear(); } catch (e) {}
  db = FRESH(); LIB.cards = []; SAMPLE = false; KEY = REAL_KEY; ui.undo = null; // nothing old can be saved back while it finishes
  // Other open Mess tabs reload too (boot.js listens), so none of them writes its old copy back.
  try { localStorage.setItem('mess-wipe', String(Date.now())); localStorage.removeItem('mess-wipe'); } catch (e) {}
  let cleared = false, deleted = false;
  try { const d = await idb(); cleared = await new Promise(ok => { const t = d.transaction('kv', 'readwrite'); t.objectStore('kv').clear(); t.oncomplete = () => ok(true); t.onerror = t.onabort = () => ok(false); }); d.close(); } catch (e) {}
  await new Promise(ok => { try { const r = indexedDB.deleteDatabase('mess'); r.onsuccess = () => { deleted = true; ok(); }; r.onerror = ok; r.onblocked = () => setTimeout(ok, 1500); } catch (e) { ok(); } setTimeout(ok, 3000); });
  return cleared || deleted; // false: the decks and Anki match saved in this browser may still be there
}
const idb = () => new Promise((ok, no) => { const r = indexedDB.open('mess', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => { r.result.onversionchange = () => r.result.close(); ok(r.result); }; r.onerror = () => no(r.error); });
async function libSave() { try { const d = await idb(); d.transaction('kv', 'readwrite').objectStore('kv').put(LIB.cards, 'lib'); } catch (e) {} }
async function libLoad() { try { const d = await idb(), q = d.transaction('kv').objectStore('kv').get('lib'); q.onsuccess = () => { if (Array.isArray(q.result)) { LIB.cards = q.result; render(); } }; } catch (e) {} }
function sampleDB() {
  const d = Object.assign(FRESH(), { startDone: true, openedTopic: true }), now = new Date(), day = (n) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10), k = todayKey(), has = (n) => TOPICS.has(n);
  let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const plan = [['Cardiovascular', ['Atrial fibrillation', 'Heart failure', 'Acute coronary syndrome', 'Hypertension'], .74], ['Respiratory', ['Asthma', 'COPD', 'Pneumonia', 'Pulmonary embolism'], .63], ['Neurosciences', ['Stroke', 'Epilepsy', 'Migraine'], .52], ['Renal and urology', ['Acute kidney injury', 'Hyperkalaemia'], .81], ['Gastrointestinal (GI)', ['Upper GI bleed', 'Inflammatory bowel disease', 'Appendicitis'], .68], ['Endocrine, diabetes and metabolic', ['Diabetic ketoacidosis', 'Hyperthyroidism'], .77], ['Mental health', ['Depression'], .85], ['Acute and emergency', ['Sepsis'], .7]];
  const hist = []; for (let i = 0; i < 210; i++) { const [area, ts, acc] = plan[Math.floor(rnd() * plan.length)], t = ts.filter(has)[Math.floor(rnd() * ts.filter(has).length)]; if (!t) continue; hist.push({ d: day(Math.floor(rnd() * 45)), ok: rnd() < acc, topic: area, ts: [t] }); }
  hist.sort((a, b) => a.d < b.d ? -1 : 1);
  const exam = new Date(Date.now() + 70 * 864e5).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const cards = [['AF: CHA₂DS₂-VASc score to offer anticoagulation?', '2 or more', 'Atrial fibrillation'], ['First-line rate control in AF?', 'Beta-blocker or rate-limiting calcium-channel blocker', 'Atrial fibrillation'], ['Life-threatening asthma: SpO₂ cut-off?', 'Below 92%', 'Asthma'], ['Acute severe asthma: PEF range?', '33 to 50% of best or predicted', 'Asthma'], ['First thing to give in hyperkalaemia with ECG changes?', 'IV calcium gluconate', 'Hyperkalaemia'], ['ROSIER is used for?', 'Recognising stroke in A&E', 'Stroke'], ['Thrombolysis window for ischaemic stroke?', 'Within 4.5 hours of onset', 'Stroke'], ['Status epilepticus: first-line in hospital?', 'IV lorazepam', 'Epilepsy'], ['Glasgow-Blatchford score is for?', 'Upper GI bleed risk', 'Upper GI bleed'], ['DKA diagnosis: ketones?', 'Above 3 mmol/L, or 2+ on urine dipstick', 'Diabetic ketoacidosis'], ['CURB-65: what does U stand for?', 'Urea above 7 mmol/L', 'Pneumonia'], ['Wells score is used for?', 'Probability of PE or DVT', 'Pulmonary embolism']].filter(c => has(c[2]));
  Object.assign(d, {
    setupDone: true, profile: { name: 'Alex', year: 'Final year', uni: 'University of Manchester', curriculum: 'UKMLA (UK)' }, examDate: exam,
    history: hist, scores: [['Cardiovascular', 72], ['Respiratory', 61], ['Neurosciences', 54], ['Renal and urology', 80], ['Gastrointestinal (GI)', 67], ['Endocrine, diabetes and metabolic', 76], ['Mental health', 84], ['Acute and emergency', 69]],
    missed: ['A 72-year-old with sudden right arm weakness and slurred speech, onset 2 hours ago. CT shows no bleed. What next?...', 'A 24-year-old with asthma: PEF 45% of best, can complete sentences, SpO₂ 95%. How severe is this?...', 'A 58-year-old on ramipril and spironolactone has K⁺ 6.8 with peaked T waves. What first?...'],
    tasks: [{ t: 'Practise Neurosciences', sub: 'Your lowest score: 54%', go: 'Practice/Questions', done: false }, { t: 'Write up the AF case from Tuesday', done: false }, { t: '20 respiratory questions', go: 'Practice/Questions', done: false }, { t: 'Book GP sign-off', done: true }],
    day: [{ start: 540, end: 720, label: 'Ward round', date: k, fromCal: true }, { start: 780, end: 810, label: 'Asthma questions', date: k }, { start: 900, end: 1020, label: 'Teaching: chest X-rays', date: k, fromCal: true }, { start: 1050, end: 1080, label: 'Flashcards', date: k }, { start: 1110, end: 1170, label: 'OSCE practice with Sam', date: k, fromCal: true }],
    cards: [...cards.map((c, i) => ({ id: 'ks' + i, f: c[0], b: c[1], src: c[2], topic: c[2], due: i < 7 ? 0 : Date.now() + (i - 6) * 864e5 })),
      { id: 'ka1', f: 'COPD: why can too much oxygen raise CO₂?', b: 'It worsens V/Q mismatch (and the Haldane effect), so CO₂ rises.', src: 'AI', topic: 'COPD', due: 0, ai: true },
      { id: 'ka2', f: 'Asthma: when do you give IV magnesium?', b: 'Acute severe or life-threatening asthma not responding to initial treatment.', src: 'AI', topic: 'Asthma', due: Date.now() + 2 * 864e5, ai: true, checked: day(1) },
      { id: 'ke1', f: 'Explain why someone with COPD gets breathless on exertion.', b: '• Small airways narrow and alveoli lose recoil\n• Air is trapped on breathing out\n• The lungs over-inflate, leaving no room for a bigger breath', src: 'Explain', topic: 'COPD', due: Date.now() + 5 * 864e5, kind: 'explain', check: ['Small airways narrow and alveoli lose recoil', 'Air is trapped on breathing out', 'The lungs over-inflate, leaving no room for a bigger breath'] }],
    folders: ['Cardiology', 'Respiratory', 'GP'],
    cases: [{ id: 'cs1', folder: 'Cardiology', title: '78M, palpitations', hx: 'Two days of palpitations and breathlessness on exertion. Background of hypertension. On ramipril.', ex: 'Irregularly irregular pulse, rate 130. ECG shows atrial fibrillation. Bloods normal, TSH normal.', concerns: 'Worried about having a stroke like his brother.', qs: 'Why apixaban over warfarin for him?' }, { id: 'cs2', folder: 'Respiratory', title: '24F, acute asthma', hx: 'Worsening wheeze over 2 days after a cold. Uses salbutamol 6 times a day.', ex: 'PEF 45% of best, speaking in sentences, SpO₂ 95%. Wheeze throughout.', concerns: 'Missing exams.', qs: 'When would you give magnesium?' }, { id: 'cs3', folder: 'GP', title: '55M, new type 2 diabetes', hx: 'HbA1c 58 on routine bloods. Tired, thirsty.', ex: 'BMI 31. BP 148/92.', concerns: 'Does he need insulin?', qs: 'Metformin first, then what?' }],
    memory: [{ text: 'CURB-65: Confusion, Urea over 7, Resp rate 30 or more, BP under 90 systolic or 60 diastolic, age 65 or over', name: '', folder: 'Mnemonics and teaching points' }, { text: 'Hyperkalaemia: protect the heart, shift it, get it out', name: '', folder: 'Mnemonics and teaching points' }],
    lectures: [{ id: 'ls1', title: 'Cardiology lecture 3: arrhythmias', name: 'cardiology-lecture-3.pdf', date: new Date(Date.now() - 6 * 864e5).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }), summary: ['How to spot AF, flutter and heart block on an ECG', 'Rate control versus rhythm control', 'Who needs anticoagulation'], topics: ['Atrial fibrillation', 'Atrial flutter', 'Heart failure'].filter(has) }],
    todayOn: { fix: true, plan: true, day: true, calendar: true, email: true, exam: true, lowest: true, cards: true, station: true, missed: true, lastcase: true, reminders: true }, dayUsed: true,
    // A few of everything, so every part of Mess shows something: mistakes logged from elsewhere (with causes),
    // a guess made before reading, AI-made cards (one checked), the student's own note and topic, prescribing scores.
    missLog: [['Gave high-flow oxygen in a COPD exacerbation', 'Controlled oxygen, target 88–92%', 'COPD', 'familiar', 1], ['Picked salbutamol nebs alone for life-threatening asthma', 'Add IV magnesium and get senior help', 'Asthma', 'two', 3], ['Misread: the question asked for the next investigation, not treatment', 'CT head first', 'Stroke', 'misread', 6]].filter(m => has(m[2])).map(([text, right, n, reason, ago], i) => ({ id: 'ms' + i, d: new Date(Date.now() - ago * 864e5).toISOString(), text, right, from: 'q', n, k: -1, alts: [], pts: [], reason, card: '' })),
    predict: { COPD: { pick: 1, d: day(2) } },
    // The sample note starts with Mess's own first two lines for the topic where it has them, then the student's line.
    myNotes: { 'Atrial fibrillation': { 0: [...(((typeof NOTES === 'object' && NOTES['Atrial fibrillation']) || { s: [[]] }).s[0] || []).slice(0, 2), 'My note: consultant said always check thyroid and alcohol history first.'] } },
    myTopics: [{ name: 'Long COVID', kind: 'c', area: 'Respiratory', al: ['post-COVID syndrome'], rel: ['Pulmonary embolism'], drugs: [] }],
    rxLog: [{ d: day(5), kind: 'Prescribe', got: 3, of: 4 }, { d: day(3), kind: 'Review', got: 4, of: 4 }, { d: day(1), kind: 'Calculate', got: 2, of: 3 }],
    ankiStats: Object.fromEntries([['Stroke', 48, 31], ['Epilepsy', 36, 22], ['Pulmonary embolism', 40, 19], ['Atrial fibrillation', 62, 17], ['Diabetic ketoacidosis', 30, 14], ['Asthma', 55, 9], ['Heart failure', 44, 8]].filter(([n]) => has(n)).map(([n, c, l]) => [n, { cards: c, lapses: l }]))
  });
  return d;
}
function sampleOn() { try { localStorage.setItem('mso.sample', '1'); } catch (e) {} SAMPLE = true; KEY = SAMPLE_KEY; db = sampleDB(); syncMyTopics(db.myTopics); save(); theme(); ui.page = 'Today'; window.scrollTo(0, 0); render(); }
function sampleOff() { try { localStorage.removeItem('mso.sample'); localStorage.removeItem(SAMPLE_KEY); } catch (e) {} SAMPLE = false; KEY = REAL_KEY; db = FRESH(); try { db = { ...db, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch (e) {} syncMyTopics(db.myTopics); theme(); ui.page = db.setupDone ? 'Today' : 'intro'; window.scrollTo(0, 0); render(); }
