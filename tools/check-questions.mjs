// Questions: the flaw check by script, the answer order, the by-hand check and the consensus. Method: claude/question-method.md (project doc).
// A folder's questions.json holds its questions. Every option points to agreed claims; the key is written first and the script sets the order students see.
//   node tools/check-questions.mjs <folder>                                   flaw check, then says which questions are agreed
//   node tools/check-questions.mjs <folder> --read                            the questions as a student sees them, with the answers underneath
//   node tools/check-questions.mjs <folder> --packet <file>                   a packet for a checker with no key here (planted wrong questions mixed in, not marked)
//   node tools/check-questions.mjs <folder> --packet <file> --answers <file> --name gpt    marks it and writes qcheck.<name>.csv
// A question is agreed when two checkers that aren't its writer pass the wording as it stands. Calculations: the answer is worked out again by the script.
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { allowSend } from './rights.mjs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const args = process.argv.slice(2), dir = args[0], opt = (k) => { const i = args.indexOf(k); return i > 0 ? args[i + 1] : ''; }, has = (k) => args.includes(k);
if (!dir || !existsSync(join(dir, 'questions.json'))) { console.log('✗ give a folder that has a questions.json'); process.exit(1); }
const csv = (t) => { const rows = []; let row = [], f = '', q = false; t = t.replace(/^﻿/, ''); for (let i = 0; i < t.length; i++) { const c = t[i]; if (q) { if (c === '"' && t[i + 1] === '"') { f += '"'; i++; } else if (c === '"') q = false; else f += c; } else if (c === '"') q = true; else if (c === ',') { row.push(f); f = ''; } else if (c === '\n' || c === '\r') { if (c === '\r' && t[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; } else f += c; } if (f || row.length) { row.push(f); rows.push(row); } return rows.filter(r => r.some(x => x.trim())); };
const objs = (p) => { const [h, ...rs] = csv(readFileSync(p, 'utf8')); return rs.map(r => Object.fromEntries(h.map((k, i) => [k.trim().toLowerCase(), (r[i] || '').trim()]))); };
const sha = (s) => createHash('sha256').update(s).digest('hex'), cq = (s) => '"' + String(s ?? '').replace(/"/g, '""') + '"';

const file = JSON.parse(readFileSync(join(dir, 'questions.json'), 'utf8')), QS = file.questions || [], WRITER = String(file.writer || '').toLowerCase();
// Claims come from this folder, or from the folder named in "claims" (calculations borrow a condition's claims).
const cdir = file.claims || dir, claims = existsSync(join(cdir, 'claims.csv')) ? objs(join(cdir, 'claims.csv')) : [];
const cons = existsSync(join(cdir, 'consensus.csv')) ? Object.fromEntries(objs(join(cdir, 'consensus.csv')).map(r => [r.row, r.status])) : {};
const claim = (n) => claims[n - 2], sentence = (c) => `${c.subject} ${c.relation} ${c.object}`.replace(/\s+/g, ' ').trim();
const nums = (s) => (String(s).replace(/(\d),(\d{3})/g, '$1$2').match(/\d+(\.\d+)?/g) || []);
const isCalc = (q) => q.kind === 'calculation';
// The wording a checker's verdict belongs to. Change any of it and the verdict no longer counts.
const stamp = (q) => sha(JSON.stringify([q.stem, q.task, isCalc(q) ? [q.given, q.expr, q.answer, q.unit] : q.options.map(o => [o.t, o.role, o.rows, o.why || '']), q.idea, q.nugget ? [q.nugget.t, q.nugget.rows] : ''])).slice(0, 12);
// The order students see: fixed by the question's own text, so no model chooses where the right answer sits.
const order = (q) => q.options.map((o, i) => [sha(q.id + '|' + o.t), i]).sort((a, b) => a[0] < b[0] ? -1 : 1).map(x => x[1]);
const calc = (q) => { if (!/^[\w\s+\-*/().]+$/.test(q.expr || '')) return NaN; const k = Object.keys(q.given || {}); try { return Function(...k, `"use strict"; return (${q.expr});`)(...k.map(x => q.given[x])); } catch { return NaN; } };

// ---- The flaw check ----
const ROLES = ['key', 'elsewhere', 'do not', 'misconception'], KINDS = ['next step', 'threshold', 'safety', 'tell apart', 'why', 'calculation'];
const fail = [], warn = [], seen = new Set();
const rowsOk = (q, rows, what) => { const F = (m) => fail.push(`${q.id}: ${m}`);
  if (!Array.isArray(rows) || !rows.length) return F(`${what} points to no claim`);
  for (const n of rows) { if (!claim(n)) F(`${what} points to row ${n}, which isn't in ${cdir}/claims.csv`); else if (cons[n] !== 'agreed') F(`${what} rests on row ${n}, which is not agreed`); } };
for (const q of QS) {
  const F = (m) => fail.push(`${q.id || '(no id)'}: ${m}`), W = (m) => warn.push(`${q.id}: ${m}`);
  if (!/^[a-z0-9-]{3,60}$/.test(q.id || '') || seen.has(q.id)) F('needs its own id (lowercase letters, numbers, dashes)'); seen.add(q.id);
  if (!KINDS.includes(q.kind)) F(`kind must be one of: ${KINDS.join(', ')}`);
  if (!q.stem || !q.task || !q.idea) { F('needs a stem, a task and the idea'); continue; }
  if (!/\?$/.test(q.task.trim())) F('the task must be one question ending in "?"');
  if (/\b(not|except|least|false|incorrect|never)\b/i.test(q.task)) F('negative lead-in ("not", "except", "least"): ask for the best answer');
  if (/\b(an?|the)\s*[:?]?$/i.test(q.task.trim().replace(/\?$/, ''))) F('the task ends in "a", "an" or "the", which gives the grammar of the answer away');
  if (q.stem.split(/\s+/).length > 90) F('the scenario is over 90 words: cut what does not change the answer');
  if (q.idea.length > 420) F('the idea is over 420 characters');
  // A nugget is one extra fact worth knowing, shown after the answer. It must come from agreed claims, like everything else.
  if (q.nugget) { if (!q.nugget.t || q.nugget.t.length > 260) F('the nugget needs text of at most 260 characters'); rowsOk(q, q.nugget.rows, 'the nugget'); const nt = (q.nugget.rows || []).map(claim).filter(Boolean).map(c => sentence(c) + ' ' + c.numbers + ' ' + c.source_quote).join(' '); for (const n of nums(q.nugget.t || '')) if (!nums(nt).includes(n)) F(`the nugget has the number ${n}, which its claims don't`); }
  if (isCalc(q)) {
    const v = calc(q); if (!Number.isFinite(v)) { F('the sum ("expr") could not be worked out from "given"'); continue; }
    if (typeof q.answer !== 'number' || Math.abs(v - q.answer) > 1e-9 * Math.max(1, Math.abs(v))) F(`the answer is ${q.answer} but the sum gives ${+v.toFixed(6)}`);
    if (!q.unit) F('a calculation needs a unit');
    for (const [k, x] of Object.entries(q.given || {})) if (!nums(q.stem + ' ' + q.task).includes(String(x))) F(`"${k}" is ${x}, which the scenario never gives`);
    if (q.rows) rowsOk(q, q.rows, 'the calculation');
    continue;
  }
  const O = q.options || [];
  if (O.length < 3 || O.length > 5) { F('needs 3 to 5 options'); continue; }
  if (O[0].role !== 'key' || O.filter(o => o.role === 'key').length !== 1) F('exactly one key, written first (the script sets the order students see)');
  const len = O.map(o => (o.t || '').length), rest = Math.max(...len.slice(1));
  O.forEach((o, i) => { const what = `option ${i + 1} ("${String(o.t).slice(0, 40)}")`;
    if (!o.t) return F(`option ${i + 1} is empty`);
    if (!ROLES.includes(o.role)) F(`${what}: role must be one of: ${ROLES.join(', ')}`);
    rowsOk(q, o.rows, what);
    const cs = (o.rows || []).map(claim).filter(Boolean), text = cs.map(c => sentence(c) + ' ' + c.numbers + ' ' + c.source_quote + ' ' + c.misconception).join(' ');
    for (const n of nums(o.t)) if (!nums(text).includes(n)) F(`${what} has the number ${n}, which its claims don't`);
    if (o.role === 'misconception' && !cs.some(c => c.misconception)) F(`${what} is called a misconception but none of its claims records one`);
    if (i && !o.why) F(`${what} needs a "why" line: every wrong option says why it is wrong`);
    if (o.why && o.why.length > 320) F(`${what}: the "why" line is over 320 characters`);
    if (/\b(always|never|all of the above|none of the above)\b/i.test(o.t)) F(`${what} uses an absolute ("always", "never") or "all/none of the above"`);
    O.forEach((p, j) => { if (j !== i && p.t && o.t.toLowerCase().trim() === p.t.toLowerCase().trim()) F(`${what} is the same as another option`); else if (j !== i && p.t && p.t.length > 12 && o.t.toLowerCase().includes(p.t.toLowerCase())) F(`${what} contains another option, so they overlap`); }); });
  if (len[0] > rest * 1.25 && len[0] - rest > 12) F('the key is clearly the longest option');
  if (Math.max(...len) > Math.max(Math.min(...len), 12) * 3) F('the options differ too much in length');
  const words = (s) => new Set((s.toLowerCase().match(/[a-z]{6,}/g) || [])), st = words(q.stem + ' ' + q.task), others = O.slice(1).map(o => words(o.t));
  const cue = [...words(O[0].t)].filter(w => st.has(w) && !others.some(s => s.has(w)));
  if (cue.length) W(`only the key repeats "${cue.join('", "')}" from the scenario: check it doesn't give the answer away`);
}
if (!/^[a-z0-9-]+$/.test(WRITER)) fail.push('questions.json must say who wrote it: "writer": "claude"');

// ---- What the checkers have said ----
const reads = readdirSync(dir).filter(f => /^qcheck\.[a-z0-9-]+\.csv$/.test(f)).map(f => ({ who: f.split('.')[1], rows: objs(join(dir, f)) })).filter(r => r.who !== WRITER);
const CHECKS = ['blind_answer', 'key_right', 'wrong_options_wrong', 'one_best_answer', 'no_flaws', 'right_level', 'feedback_right'];
const passed = (q) => reads.filter(r => r.rows.some(x => x.id === q.id && x.stamp === stamp(q) && x.verdict === 'agreed' && CHECKS.every(c => /^(yes|n\.a\.)/.test(x[c] || '')))).map(r => r.who);
const agreed = (q) => passed(q).length >= 2;

// ---- The by-hand check ----
const PACKET = opt('--packet'), ANSWERS = opt('--answers'), NAME = opt('--name').toLowerCase();
const PROMPT = `You are checking exam-style questions for Mess, a free study site for medical students. You did not write them. Try to break each one. Work only from the scenario and the guideline quotes given here, never from memory.
For every item, in this order:
1. blind_answer: read only "stem" and "task". Before looking at "options", write the answer you would give in "your_blind_answer". Then look at the options. "yes" if your own answer matches the option marked as the key and you would still pick it; otherwise "no".
2. key_right: do the key's quotes make it the right answer for this patient? (For a calculation: work the sum out yourself. "yes" only if you get the stated answer and unit.)
3. wrong_options_wrong: for each other option, do its quotes show it is not the best answer for this patient? "no" if any could be defended. (Calculation: "n.a.")
4. one_best_answer: is there exactly one defensible answer?
5. no_flaws: "no" if the wording gives the answer away or misleads: the key is the longest or most detailed, a grammar clue, an absolute, overlapping options, a negative lead-in, new patient facts hidden in the options, or a scenario that doesn't match the quotes' population.
6. right_level: is this a decision a final-year medical student should be able to make, not trivia and not too easy?
7. feedback_right: "feedback" is what the student reads after answering: the idea, a line on each wrong option, and sometimes a nugget. "no" if any of it says more than, less than or something different from the quotes given (a changed strength, number, population or condition), or would mislead a student. (Judge it as written, even on an item whose key you think is wrong.)
Verdict "agreed" only if all seven are "yes" or "n.a."; otherwise "failed". Some items have been made wrong on purpose and are not marked.`;
const item = (q, keyAt = 0) => isCalc(q)
  ? { id: sha(stamp(q) + keyAt).slice(0, 12), kind: q.kind, stem: q.stem, task: q.task, stated_answer: `${keyAt ? Math.round(q.answer * 3 + 7) : q.answer} ${q.unit}`, quotes: (q.rows || []).map(n => claim(n).source_quote), feedback: { idea: q.idea } }
  : { id: sha(stamp(q) + keyAt).slice(0, 12), kind: q.kind, stem: q.stem, task: q.task, options: order(q).map(i => ({ text: q.options[i].t, marked_as_key: i === keyAt, quotes: q.options[i].rows.map(n => `${claim(n).source}: ${claim(n).source_quote}`), ...(q.options[i].why ? { feedback_if_chosen: q.options[i].why } : {}) })), feedback: { idea: q.idea, ...(q.nugget ? { nugget: q.nugget.t, nugget_quotes: q.nugget.rows.map(n => `${claim(n).source}: ${claim(n).source_quote}`) } : {}) } };
// A planted wrong question is a real one with another option marked as the key (or, for a calculation, a changed answer).
const packet = () => { const n = Math.max(2, Math.ceil(QS.length / 4)), pick = [...QS].sort((a, b) => sha('p' + a.id) < sha('p' + b.id) ? -1 : 1).slice(0, n);
  const plants = pick.map(q => item(q, isCalc(q) ? 1 : 1 + parseInt(sha('k' + q.id).slice(0, 6), 16) % (q.options.length - 1)));
  return { reals: QS.map(q => item(q)), plants }; };
if (PACKET) {
  allowSend(claims, 'make or mark a question packet for a model: it carries the quotes these questions rest on');
  if (fail.length) { fail.forEach(f => console.log('✗ ' + f)); console.log('Fix the flaw check first.'); process.exit(1); }
  if (QS.length < 2) { console.log('✗ fewer than 2 questions, so a by-hand check can\'t be marked'); process.exit(1); }
  const { reals, plants } = packet(), items = [...reals, ...plants].sort((a, b) => sha('o' + a.id) < sha('o' + b.id) ? -1 : 1);
  if (!ANSWERS) {
    writeFileSync(PACKET, JSON.stringify({ instructions: PROMPT, answer_format: `A JSON array, one object per item: {"id": "...", "your_blind_answer": "what you answered before seeing the options", ${CHECKS.map(c => `"${c}": "yes|no|n.a."`).join(', ')}, "verdict": "agreed" or "failed", "notes": "one sentence, specific to this item, saying why"}`, items }, null, 1));
    console.log(`✓ ${PACKET}: ${items.length} items to check (${reals.length} questions and ${plants.length} planted wrong ones, not marked)`); process.exit(0);
  }
  if (!/^[a-z0-9-]+$/.test(NAME)) { console.log('✗ say who is checking: --name gpt'); process.exit(1); }
  if (NAME === WRITER) { console.log(`✗ ${NAME} wrote these questions, so it can't check them`); process.exit(1); }
  const was = JSON.parse(readFileSync(PACKET, 'utf8')).items.map(i => i.id).sort().join(), now = items.map(i => i.id).sort().join();
  if (was !== now) { console.log('✗ the questions have changed since this packet was made. Make a new packet and check that.'); process.exit(1); }
  const ans = JSON.parse(readFileSync(ANSWERS, 'utf8')), by = Object.fromEntries(ans.map(a => [a.id, a]));
  const missing = items.filter(i => !by[i.id]); if (missing.length) { console.log(`✗ ${missing.length} items have no answer. Nothing was saved.`); process.exit(1); }
  const fooled = plants.filter(p => String(by[p.id].verdict).toLowerCase().trim() === 'agreed');
  if (fooled.length) { console.log(`✗ ${NAME} agreed ${fooled.length} of ${plants.length} planted wrong questions, so this check can't be trusted. Nothing was saved.`); process.exit(1); }
  const out = join(dir, `qcheck.${NAME}.csv`), lines = [['id', 'stamp', 'verdict', ...CHECKS, 'blind', 'notes'].join(',')];
  QS.forEach(q => { const a = by[item(q).id]; lines.push([q.id, stamp(q), String(a.verdict).toLowerCase().trim(), ...CHECKS.map(c => String(a[c] || '').toLowerCase().trim()), cq(a.your_blind_answer), cq(a.notes)].join(',')); });
  writeFileSync(out, lines.join('\n') + '\n');
  const bad = QS.filter(q => String(by[item(q).id].verdict).toLowerCase().trim() !== 'agreed');
  console.log(`✓ ${out}: ${QS.length - bad.length} agreed, ${bad.length} failed (checked by hand by ${NAME}; caught ${plants.length} of ${plants.length} planted wrong questions)`);
  bad.forEach(q => console.log(`  failed ${q.id}: ${String(by[item(q).id].notes).slice(0, 240)}`)); process.exit(0);
}

if (has('--read')) {
  const L = 'ABCDE', out = [`# ${file.topic}: questions to read`, '', 'Written by an AI model from the agreed claims. ' + (QS.every(agreed) ? 'Checked by two other AI models.' : 'Not yet checked by two other AI models.') + ' Not reviewed by a doctor.', ''];
  QS.forEach((q, n) => { out.push(`## ${n + 1}. ${q.stem} ${q.task}`, '');
    if (isCalc(q)) out.push(`**Answer:** ${q.answer} ${q.unit}`, '', q.idea, '');
    else { const o = order(q); o.forEach((i, k) => out.push(`- ${L[k]}. ${q.options[i].t}`)); out.push('', `**Answer: ${L[o.indexOf(0)]}.** ${q.idea}`, ''); o.forEach((i, k) => { if (i && q.options[i].why) out.push(`- ${L[k]}: ${q.options[i].why}`); }); if (q.nugget) out.push('', `*Worth knowing:* ${q.nugget.t}`); out.push(''); } });
  console.log(out.join('\n')); process.exit(fail.length ? 1 : 0);
}

warn.forEach(w => console.log('Check: ' + w));
if (fail.length) { fail.forEach(f => console.log('✗ ' + f)); console.log(`\n${dir}: ${fail.length} problem(s) in the flaw check.`); process.exit(1); }
// Where the key lands once the script has set the order: it should not sit in one place.
const at = QS.filter(q => !isCalc(q)).map(q => 'ABCDE'[order(q).indexOf(0)]).join(' ');
console.log(`✓ ${dir}: ${QS.length} question(s) pass the flaw check${at ? ` (the right answers sit at: ${at})` : ''}`);
QS.forEach(q => { const p = passed(q); console.log(`  ${agreed(q) ? 'agreed' : 'not yet agreed'}: ${q.id} (${p.length ? 'passed by ' + p.join(', ') : 'no checker has passed this wording'})`); });
if (has('--ship') && !QS.every(agreed)) { console.log('✗ not every question is agreed by two checkers'); process.exit(1); }
