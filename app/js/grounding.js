// Mess · grounding.js · Source-aware topic answers.
// Loaded after the bundled topics, notes and generated evidence, before the AI and UI modules.

const GROUNDING_LIMIT = 8;
const evidenceSlug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const GROUNDING_ABBR = {
  niv: 'non invasive ventilation', ltot: 'long term oxygen therapy',
  ics: 'inhaled corticosteroid', laba: 'long acting beta agonist',
  lama: 'long acting muscarinic antagonist', fev1: 'fev1 spirometry',
  fvc: 'fvc spirometry', spo2: 'oxygen saturation', sao2: 'oxygen saturation',
  pco2: 'carbon dioxide hypercapnia', co2: 'carbon dioxide hypercapnia',
  abg: 'arterial blood gas', vbg: 'venous blood gas', cxr: 'chest radiograph',
  ecg: 'electrocardiogram', abx: 'antibiotics', mx: 'management',
  ix: 'investigations', tx: 'treatment', sx: 'symptoms', a1at: 'alpha 1 antitrypsin'
};
const GROUNDING_STEPS = new Map([
  ['diagnosis', ['risk factors', 'clinical features', 'investigations', 'differential']],
  ['presentation', ['clinical features']],
  ['symptoms', ['clinical features']],
  ['investigations', ['investigations']],
  ['test', ['investigations']],
  ['treatment', ['management', 'indications', 'monitoring']],
  ['management', ['management', 'indications', 'monitoring']],
  ['complications', ['complications', 'consequences']],
  ['side effects', ['side effects', 'complications']],
  ['cautions', ['cautions', 'interactions']],
  ['interactions', ['interactions', 'cautions']],
  ['risk', ['risk factors']],
  ['pathophysiology', ['pathophysiology', 'mechanism']],
  ['mechanism', ['pathophysiology', 'mechanism']]
]);
const groundingWords = (text) => String(text || '').toLowerCase()
  .replace(/[\u2010-\u2015]/g, '-')
  .split(/[^a-z0-9.%-]+/)
  .filter(x => x.length > 1)
  .flatMap(x => GROUNDING_ABBR[x] ? GROUNDING_ABBR[x].split(' ') : [x])
  .filter(x => x.length > 2);
const groundingStep = (query) => {
  const q = String(query || '').toLowerCase();
  for (const [name, steps] of GROUNDING_STEPS) if (q.includes(name)) return steps;
  return [];
};
function noteEvidence(n) {
  const note = NOTES[n];
  if (!note || !Array.isArray(note.s)) return { topic: n, source: '', claims: [], kind: 'notes' };
  const claims = [];
  note.s.forEach((points, section) => (Array.isArray(points) ? points : []).forEach((text, point) => {
    const value = String(text).trim();
    if (value) claims.push({ id: 'note-' + evidenceSlug(n) + '-' + section + '-' + point, step: '', text: value });
  }));
  return { topic: n, source: String(note.src || 'Mess topic notes'), claims, kind: 'notes' };
}
function claimEvidence(n) {
  const claims = typeof EVIDENCE === 'object' && EVIDENCE ? EVIDENCE[n] : null;
  return Array.isArray(claims) && claims.length
    ? { topic: n, source: '', claims: claims.map(x => ({ ...x })), kind: 'claims' }
    : null;
}
function topicEvidence(n) {
  return claimEvidence(n) || noteEvidence(n);
}
function rankedEvidence(n, query) {
  const e = topicEvidence(n), words = groundingWords(query), counts = {};
  words.forEach(w => { counts[w] = (counts[w] || 0) + 1; });
  const steps = groundingStep(query), docs = e.claims.map((x, i) => ({
    x, i, words: groundingWords([x.text, x.population, x.numbers, x.step].join(' ')), step: String(x.step || '').toLowerCase()
  }));
  const avg = docs.reduce((sum, d) => sum + d.words.length, 0) / (docs.length || 1);
  return docs.map(d => {
    const frequencies = {};
    d.words.forEach(w => { frequencies[w] = (frequencies[w] || 0) + 1; });
    const matched = Object.keys(counts).filter(w => frequencies[w]);
    const score = matched.reduce((sum, w) => {
      const df = docs.filter(other => other.words.includes(w)).length;
      const idf = Math.log(1 + (docs.length - df + 0.5) / (df + 0.5));
      const tf = frequencies[w];
      return sum + counts[w] * idf * ((tf * 2.2) / (tf + 1.2 * (0.25 + 0.75 * d.words.length / avg)));
    }, 0);
    const stepBonus = steps.length ? (steps.includes(d.step) ? 2 : -1.5) : 0;
    return { x: d.x, i: d.i, score: score + stepBonus };
  }).sort((a, b) => b.score - a.score || a.i - b.i).map(x => x.x);
}
function evidenceForPrompt(n, query) {
  return rankedEvidence(n, query).slice(0, GROUNDING_LIMIT).map(x => '[' + x.id + '] ' + x.text).join('\n');
}
function groundedSystem(n) {
  const e = topicEvidence(n);
  return 'You are explaining the topic inside Mess, a UK medical study app. Use only the supplied Mess evidence for clinical facts. Do not add facts from general knowledge, guidelines, memory, or the internet. If the evidence does not answer the question, set notCovered to true. This is education, not advice for a real patient. Return only valid JSON with this shape: {"answer":"short clear explanation","claimIds":["known evidence IDs"],"notCovered":false,"uncertainty":"short note or empty string"}. Every clinical answer must cite one or more supplied claim IDs. Never invent claim IDs.' + (e.kind === 'claims' ? ' The supplied evidence is checked claims.' : ' The supplied evidence is Mess draft notes, not yet checked.');
}
function groundedTurns(n, log) {
  const question = log.filter(x => x.me).map(x => x.text).pop() || '';
  const evidence = evidenceForPrompt(n, question);
  return [{ role: 'user', content: 'Topic: ' + n + '\nMess evidence:\n' + evidence + '\n\nConversation:\n' + log.map(x => (x.me ? 'Student: ' : 'Mess: ') + x.text).join('\n') }];
}
const groundingNumbers = (text) => String(text || '').replace(/(?<![A-Za-z])(?:FEV|PaO|PCO|PO|SaO|SpO|CO|HbA)[- ]?\d/gi, ' ').match(/\d+(?:[.,]\d+)?/g) || [];
function parseGrounded(raw, n) {
  const e = topicEvidence(n), known = new Set(e.claims.map(x => x.id)), text = String(raw || '').trim();
  let o;
  try { o = JSON.parse(text); } catch (err) {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) { try { o = JSON.parse(m[0]); } catch (err2) {} }
  }
  if (!o || typeof o.answer !== 'string' || typeof o.notCovered !== 'boolean' || !Array.isArray(o.claimIds)) return { ok: false, reason: 'The provider did not return a checkable answer.' };
  const claimIds = o.claimIds.filter(x => typeof x === 'string' && known.has(x));
  if (!o.notCovered && !claimIds.length) return { ok: false, reason: 'The provider did not link the answer to Mess evidence.' };
  if (o.notCovered && claimIds.length) return { ok: false, reason: 'The provider mixed covered and uncovered claims.' };
  const evidence = e.claims.filter(x => claimIds.includes(x.id));
  const allowedNumbers = new Set(groundingNumbers(evidence.map(x => [x.text, x.numbers, x.population].join(' ')).join(' ')));
  const unsupported = [...new Set(groundingNumbers(o.answer))].filter(number => !allowedNumbers.has(number));
  if (!o.notCovered && unsupported.length) return { ok: false, reason: 'The provider included a number that is not present in the cited Mess evidence.' };
  return { ok: true, answer: o.answer.trim(), claimIds, notCovered: o.notCovered, uncertainty: typeof o.uncertainty === 'string' ? o.uncertainty.trim() : '', evidence, kind: e.kind };
}
async function groundedTopicReply(n, log) {
  const e = topicEvidence(n);
  if (!e.claims.length) return { ok: true, answer: 'Mess does not have evidence for this topic yet. It cannot provide a grounded answer here.', claimIds: [], notCovered: true, uncertainty: '', evidence: [], kind: e.kind };
  const system = groundedSystem(n), turns = groundedTurns(n, log);
  const raw = aiReady() ? await callAI(system, turns, { max: 1200 }) : await manualAI(system, turns[0].content);
  return parseGrounded(raw, n);
}
