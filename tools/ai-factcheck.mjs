// Runs an independent fact check of a claims file with an AI model, and writes factcheck.<model>.csv (Brief 2 columns).
// Providers: gemini (Google, GEMINI_API_KEY), groq (open models such as Qwen, GROQ_API_KEY) and claude (Anthropic, ANTHROPIC_API_KEY). Add --provider groq or --provider claude.
// The model sees only each claim sentence and its script-verified quote. It never sees another checker's file.
// Run: GEMINI_API_KEY=... node tools/ai-factcheck.mjs content/<area>/<condition> [--rows 67-107] [--model name]
// Add --story to check a story's own wording instead (short versions, tables, diagrams, linking lines) against the claims each rests on: writes storycheck.<model>.csv.
// Rows not listed keep their existing lines. The key is read from the environment only; never put it in a file.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { allowSend, stamp, rowsFile } from './rights.mjs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
const args = process.argv.slice(2), opt = (k) => args.includes(k) ? args[args.indexOf(k) + 1] : '', dir = args[0], PROV = opt('--provider') || 'gemini', GROQ = PROV === 'groq', CLAUDE = PROV === 'claude', KEY = GROQ ? process.env.GROQ_API_KEY : CLAUDE ? process.env.ANTHROPIC_API_KEY : process.env.GEMINI_API_KEY;
// Add --changed to a by-hand story read to cover only the summaries that reader has not already confirmed as they stand.
// By-hand story read, for a model with no key here (ChatGPT or Codex on a subscription): --story --packet <file> writes the items to read, with planted faults mixed in; --story --answers <file> --packet <file> --name gpt marks the answers.
const PACKET = opt('--packet'), ANSWERS = opt('--answers'), HAND = !!PACKET;
if (!dir || (!KEY && !HAND)) { console.log('Usage: GEMINI_API_KEY=... node tools/ai-factcheck.mjs content/<area>/<condition> [--rows 2-66] [--provider groq, with GROQ_API_KEY | --provider claude, with ANTHROPIC_API_KEY] [--batch 12]'); process.exit(2); }
const API = GROQ ? 'https://api.groq.com/openai/v1' : CLAUDE ? 'https://api.anthropic.com/v1' : 'https://generativelanguage.googleapis.com/v1beta', H = GROQ ? { authorization: 'Bearer ' + KEY, 'content-type': 'application/json' } : CLAUDE ? { 'x-api-key': KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' } : { 'x-goog-api-key': KEY, 'content-type': 'application/json' };
const STORY = args.includes('--story');
const COLS = STORY ? ['row', 'verdict', 'strength', 'numbers', 'nothing_added', 'not_misleading', 'notes'] : ['row', 'verdict', 'population', 'trigger', 'action', 'strength', 'numbers', 'alternatives', 'exceptions', 'safety', 'notes'], CHECKS = COLS.slice(2, -1);
const csv = (t) => { const rows = []; let row = [], f = '', q = false; t = t.replace(/^﻿/, ''); for (let i = 0; i < t.length; i++) { const c = t[i]; if (q) { if (c === '"' && t[i + 1] === '"') { f += '"'; i++; } else if (c === '"') q = false; else f += c; } else if (c === '"') q = true; else if (c === ',') { row.push(f); f = ''; } else if (c === '\n' || c === '\r') { if (c === '\r' && t[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; } else f += c; } if (f || row.length) { row.push(f); rows.push(row); } return rows.filter(r => r.some(x => x.trim())); };
const objs = (p) => { const [h, ...rs] = csv(readFileSync(p, 'utf8')); return rs.map(r => Object.fromEntries(h.map((k, i) => [k.trim().toLowerCase(), (r[i] || '').trim()]))); };
const q = (s) => '"' + String(s ?? '').replace(/"/g, '""') + '"';
export const PROMPT = `You are an independent fact checker for medical revision notes. Each item has: row, claim, guideline_quote. The guideline_quote is the exact text of the guideline and is correct. Check the CLAIM against its own guideline_quote only. Do not use your own medical knowledge to fill gaps.

Wording convention (equal strength, not a mismatch): guideline commands such as "Offer", "Give", "Measure", "Refer" = "should"; "Do not" = "should not"; "Consider" = "can be considered"; "must" is right only where the quote itself says "must". Table rows are definitions.

For EVERY item, judging the claim sentence alone, answer "yes", "no" or "n.a." for each of: population (same people: age, diagnosis status, setting), trigger (same condition for acting), action (same thing to do), strength, numbers (every number, unit and threshold), alternatives (every "or" branch in the quote is kept), exceptions (every "unless" or "if" is kept), safety (warning, follow-up and escalation steps are kept).
Check both directions: the claim must say NO MORE than the quote and NO LESS.
Stand-alone test: a student reads the claim by itself, with no heading and no other row. The claim must name who or which condition it applies to, and the quote must contain those words too. If the claim leaves that out (for example "people" with no diagnosis, or a prescribing rule with no condition), or names a group the quote does not, population is "no".
Lists: if the quote lists separate items and the claim nests them under one of them, or under an example, alternatives is "no".
verdict: "confirmed" only if all eight are yes or n.a.; otherwise "disputed".
notes: one specific sentence per item saying what you checked or exactly what is wrong. Never reuse a note.
Be strict. Finding problems is the point.

Return only a JSON array, one object per item, with keys: row, verdict, population, trigger, action, strength, numbers, alternatives, exceptions, safety, notes.`;
export const STORY_PROMPT = `You are an independent checker for medical revision notes. Each item has: row, kind, summary, claims. Each claim is a statement already checked against the guideline, with its guideline_quote. Treat the claims as correct. The summary is Mess's own shorter wording, shown to students in place of the claims. Judge the SUMMARY against its own claims only. Do not use your own medical knowledge to fill gaps.

Wording convention: "should", "should be offered" and a plain instruction are the same strength. "Should not" and "do not" are the same. "Can be considered" is weaker than "should". "Should be considered" is stronger than "can be considered".

For EVERY item answer "yes", "no" or "n.a." for each of:
- strength: every recommendation in the summary has the same strength as in its claims. Nothing is made stronger or weaker.
- numbers: every number, threshold and unit in the summary is in its claims and attached to the same thing.
- nothing_added: the summary states no fact, group, cause or instruction that its claims do not state. Linking lines and the big idea may frame and connect, but any fact inside them must be in the claims.
- not_misleading: a summary is allowed to leave detail out. Answer "no" only if what is left out would change what a student does: a missing exception, a missing condition for acting, a missing "do not", or a group wrongly widened. A summary that says there is more ("with exceptions", "unless") is not misleading.
For a table or diagram, check every cell and every path.
verdict: "confirmed" only if all four are yes or n.a.; otherwise "disputed".
notes: one specific sentence per item saying what you checked or exactly what is wrong. Never reuse a note.
Be strict. Finding problems is the point.

Return only a JSON array, one object per item, with keys: row, verdict, strength, numbers, nothing_added, not_misleading, notes.`;
// Candidate models, newest first. Google retires models, so ask() moves on to the next when one is refused.
async function models() {
  if (CLAUDE) return [opt('--model') || process.env.CLAUDE_MODEL || 'claude-sonnet-5-5'];
  if (opt('--model') || (!GROQ && process.env.GEMINI_MODEL)) return [opt('--model') || process.env.GEMINI_MODEL];
  if (GROQ) { const r = await fetch(API + '/models', { headers: H }); if (!r.ok) throw new Error('could not list models: HTTP ' + r.status); const ids = ((await r.json()).data || []).map(m => m.id);
    // Prefer big open models from makers other than OpenAI and Google, so this check is independent of GPT and Gemini.
    const pref = [/llama.*(70b|90b|405b)/i, /qwen/i, /kimi|moonshot/i, /deepseek/i, /llama/i]; const out = []; for (const re of pref) for (const id of ids.filter(i => re.test(i) && !/guard|whisper|tts|vision-preview/i.test(i)).sort().reverse()) if (!out.includes(id)) out.push(id);
    if (!out.length) throw new Error('no suitable Groq model found among: ' + ids.join(', ') + '. Use --model.'); return out; }
  const r = await fetch(API + '/models?pageSize=200', { headers: H }); if (!r.ok) throw new Error('could not list models: HTTP ' + r.status);
  const names = ((await r.json()).models || []).filter(m => (m.supportedGenerationMethods || []).includes('generateContent')).map(m => m.name.replace('models/', '')).filter(n => /^gemini-[\d.]+-(pro|flash)(-preview|-latest)?$/.test(n));
  const ver = n => parseFloat(n.split('-')[1]) || 0, rank = n => ver(n) * 10 + (/-pro/.test(n) ? 1 : 0) - (/preview/.test(n) ? .5 : 0);
  if (!names.length) throw new Error('no Gemini model found. Set the GEMINI_MODEL variable.'); return names.sort((a, b) => rank(b) - rank(a));
}
async function ask(model, items, prompt) {
  const text = (prompt || (STORY ? STORY_PROMPT : PROMPT)) + (GROQ ? '\nWrap the array in an object: {"items": [...]}.' : '') + '\n\nItems:\n' + JSON.stringify(items);
  const url = GROQ ? API + '/chat/completions' : CLAUDE ? API + '/messages' : `${API}/models/${model}:generateContent`;
  const body = GROQ ? { model, temperature: 0, max_tokens: 950, response_format: { type: 'json_object' }, messages: [{ role: 'user', content: text }] } : CLAUDE ? { model, max_tokens: 16000, messages: [{ role: 'user', content: text }] } : { contents: [{ role: 'user', parts: [{ text }] }], generationConfig: { responseMimeType: 'application/json', temperature: 0 } };
  let limited = 0;
  for (let t = 0; t < 3; t++) {
    const r = await fetch(url, { method: 'POST', headers: H, body: JSON.stringify(body) });
    if (r.status === 429 || r.status >= 500) { limited++; const why = (await r.text().catch(() => '')).replace(/\s+/g, ' ').slice(0, 300); if (t === 2 && limited === 3) { const e = new Error(PROV + ' rate limit or quota reached for ' + model + ' (HTTP ' + r.status + '): ' + why); e.nextModel = true; throw e; } await new Promise(s => setTimeout(s, 25000 * (t + 1))); continue; }
    if (r.status === 404 || r.status === 403 || r.status === 400) { const e = new Error(PROV + ' said HTTP ' + r.status + ': ' + (await r.text()).slice(0, 200)); e.nextModel = true; throw e; }
    if (!r.ok) throw new Error(PROV + ' said HTTP ' + r.status + ': ' + (await r.text()).slice(0, 200));
    const j = await r.json(), txt = GROQ ? (j.choices?.[0]?.message?.content || '') : CLAUDE ? (j.content || []).filter(p => p.type === 'text').map(p => p.text || '').join('').trim() : (j.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('');
    try { const a = JSON.parse(txt.replace(/^```json\s*|\s*```$/g, '')); const arr = Array.isArray(a) ? a : a.items; if (Array.isArray(arr)) return arr; } catch (e) { /* try again */ }
  }
  throw new Error('no usable answer after 5 tries');
}
// Question mode: the packet and the marking both come from check-questions.mjs, so the planted wrong questions, the writer refusal and the stamp rules are the same as a by-hand check.
if (args.includes('--questions')) {
  if (STORY) { console.log('✗ --questions cannot be combined with --story'); process.exit(1); }
  const cq = fileURLToPath(new URL('./check-questions.mjs', import.meta.url)), pkF = join(tmpdir(), `mess-q-packet-${process.pid}.json`), anF = join(tmpdir(), `mess-q-answers-${process.pid}.json`);
  try { console.log(execFileSync(process.execPath, [cq, dir, '--packet', pkF], { encoding: 'utf8' }).trim()); }
  catch (e) { console.log((e.stdout || e.message).trim()); process.exit(1); }
  const pk = JSON.parse(readFileSync(pkF, 'utf8')), qPrompt = pk.instructions + '\n\n' + pk.answer_format + '\nAnswer for every item, using its exact "id".';
  const list = await models(); let model = list.shift();
  const all = [], B = GROQ ? 2 : Math.min(8, Math.max(2, Number(opt('--batch')) || 4));
  for (let i = 0; i < pk.items.length; i += B) {
    if (GROQ && i > 0) await new Promise(s => setTimeout(s, 61000));
    const part = pk.items.slice(i, i + B); let ans;
    const askSplit = async (items) => { try { return await ask(model, items, qPrompt); } catch (e) { if (e.nextModel || items.length < 2) throw e; const h = Math.ceil(items.length / 2); console.log(`no usable answer for ${items.length} items, splitting`); return [...await askSplit(items.slice(0, h)), ...await askSplit(items.slice(h))]; } };
    for (;;) { try { ans = await askSplit(part); break; } catch (e) { if (!e.nextModel || !list.length) throw e; console.log(`${model} refused (${e.message.slice(0, 60)}…), trying ${list[0]}`); model = list.shift(); } }
    if (i === 0) console.log(`Checking ${pk.items.length} question items of ${dir} with ${model}`);
    for (const a of ans) if (a && a.id && part.some(x => x.id === a.id) && !all.some(x => x.id === a.id)) all.push(a);
    const miss = part.filter(x => !all.some(a => a.id === x.id)); if (miss.length) throw new Error('no answer for items ' + miss.map(m => m.id).join(', '));
    await new Promise(s => setTimeout(s, 4000));
  }
  const name = CLAUDE ? 'claude' : GROQ ? (/llama/i.test(model) ? 'llama' : /qwen/i.test(model) ? 'qwen' : /kimi|moonshot/i.test(model) ? 'kimi' : /deepseek/i.test(model) ? 'deepseek' : /gpt-oss/i.test(model) ? 'gptoss' : 'groq') : 'gemini';
  writeFileSync(anF, JSON.stringify(all));
  try { console.log(execFileSync(process.execPath, [cq, dir, '--packet', pkF, '--answers', anF, '--name', name], { encoding: 'utf8' }).trim() + ` (model ${model})`); process.exit(0); }
  catch (e) { console.log((e.stdout || e.message).trim()); process.exit(1); }
}
// Statements written from open sources live in statements.csv (same columns); the old guideline work is in claims.csv.
const claims = objs(join(dir, rowsFile(dir)));
// Claim checks record the stamp of the wording they judged (tools/rights.mjs), so a later rewording sets them aside.
const FCOLS = [...COLS, 'stamp'], stampOf = (row) => claims[row - 2] ? stamp(claims[row - 2]) : '';
// The rights register decides what a model may read. This covers claims, the story check (its summaries are written from these rows) and by-hand packets.
allowSend(claims, 'check these rows, or a story written from them, with a model');
// Story mode: the items are the story's own summaries, listed by the story builder with the claims each rests on.
let storyItems = null, storyWriter = '';
if (STORY) { const tmp = join(tmpdir(), `mess-story-items-${process.pid}.json`); try { execFileSync(process.execPath, [fileURLToPath(new URL('./build-story.mjs', import.meta.url)), dir, '--check', '--items', tmp], { stdio: 'ignore' }); } catch (e) { /* --check also fails when the app copy is out of date; the items file is what matters here */ }
  if (!existsSync(tmp)) { console.log(`✗ ${dir}: the story did not build, so there is nothing to check. Run node tools/build-story.mjs ${dir}`); process.exit(1); }
  const j = JSON.parse(readFileSync(tmp, 'utf8')); storyItems = j.items; storyWriter = j.writer || '';
  if (!storyWriter) { console.log(`✗ ${dir}: story.json doesn't say who wrote it`); process.exit(1); }
  if (!HAND && storyWriter === PROV) { console.log(`✗ ${dir}: ${PROV} wrote this story, so it can't check it. Use another provider.`); process.exit(1); } }
// --rows takes a range (67-107), single rows, or a comma list of both (22,23,27,30-35).
const spans = (opt('--rows') || `2-${claims.length + 1}`).split(',').map(p => p.trim()).filter(Boolean).map(p => { const [lo, hi] = p.split('-').map(Number); return [lo, hi || lo]; });
const want = STORY ? storyItems.map((x, i) => ({ row: i + 1, kind: x.kind, summary: x.summary, claims: x.claims })) : claims.map((c, i) => ({ row: i + 2, claim: [c.subject, c.relation, c.object].join(' ').replace(/\s+;/g, ';').replace(/\s+/g, ' '), guideline_quote: c.source_quote })).filter(x => spans.some(([lo, hi]) => x.row >= lo && x.row <= hi));
if (HAND) {
  // K is the text being judged: a story summary, or a claim sentence. A planted fault is a real one with its strength turned round or a number changed.
  const K = STORY ? 'summary' : 'claim', WHAT = STORY ? 'summaries' : 'claims', NAME = (opt('--name') || '').toLowerCase(), flipH = (t) => /should not be/.test(t) ? t.replace('should not be', 'should be') : /should be offered/.test(t) ? t.replace('should be offered', 'should not be offered') : /can be considered/.test(t) ? t.replace('can be considered', 'must be given') : /\d/.test(t) ? t.replace(/\d+(\.\d+)?/, m => String(Math.round(parseFloat(m) * 3 + 7))) : '';
  // A model never checks claims it wrote. Codex and ChatGPT count as the same writer.
  const fam = (n) => /codex|gpt|openai/.test(n) ? 'gpt' : n, rec = !STORY && existsSync(join(dir, 'extraction-record.md')) ? readFileSync(join(dir, 'extraction-record.md'), 'utf8') : '';
  const refuse = () => { if (STORY) { if (NAME === storyWriter) { console.log(`✗ ${dir}: ${NAME} wrote this story, so it can't check it`); process.exit(1); } return; }
    const w = (rec.match(/writer[^\n]{0,20}?(claude|codex|gpt|gemini|copilot)/i) || [])[1]; if (!w) { console.log(`✗ ${dir}: extraction-record.md doesn't say who wrote the claims ("Writer: ..."), so nobody can check them by hand yet`); process.exit(1); }
    if (fam(w.toLowerCase()) === fam(NAME)) { console.log(`✗ ${dir}: ${w} wrote these claims, so ${NAME} can't check them`); process.exit(1); } };
  if ((ANSWERS || !STORY) && !/^[a-z0-9-]+$/.test(NAME)) { console.log('✗ say who is reading: --name gpt'); process.exit(1); }
  refuse();
  // --changed (story): only the summaries this reader has not already confirmed as they stand, so a re-read after
  // fixes covers what changed and nothing else. Its planted faults are made from those items, so they are new too.
  const allWant = want.slice(), CHANGED = STORY && args.includes('--changed'), prevFile = join(dir, `storycheck.${NAME}.csv`), prev = CHANGED && existsSync(prevFile) ? new Map(objs(prevFile).map(r => [r.text, r])) : new Map();
  if (CHANGED) { for (const w of allWant) if ((prev.get(w.summary) || {}).verdict === 'confirmed') want.splice(want.indexOf(w), 1); if (!want.length) { console.log(`✓ ${dir}: ${NAME} has confirmed every summary as it stands`); process.exit(0); }
    // A few short versions it has already confirmed go back in as controls, so there is always something to plant a fault in.
    want.push(...allWant.filter(w => !want.includes(w) && /^short/.test(w.kind) && /\d/.test(w.summary)).slice(0, 8)); }
  if (!STORY) { const own = new Set(); for (const m of rec.matchAll(/rows rewritten by (claude|codex|gpt|gemini)[^\n]*\n?[^\n#]*/gi)) if (fam(m[1].toLowerCase()) === fam(NAME)) for (const r of m[0].replace(/rows rewritten by \w+/i, '').matchAll(/(\d+)(?:\s*(?:-|–|to)\s*(\d+))?/g)) for (let n = +r[1]; n <= +(r[2] || r[1]); n++) own.add(n);
    for (const x of want.filter(x => own.has(x.row))) want.splice(want.indexOf(x), 1); }
  const real = new Map(want.map(w => [w[K], w])), body = (w) => STORY ? { kind: w.kind, summary: w.summary, claims: w.claims } : { claim: w.claim, guideline_quote: w.guideline_quote };
  if (!ANSWERS) {
    // One planted fault for about every 8 items, at least 3, spread through the list in an order fixed by the text.
    const h = (t) => { let x = 2166136261; for (const c of t) x = Math.imul(x ^ c.charCodeAt(0), 16777619) >>> 0; return x; };
    const can = want.filter(w => (!STORY || /^short/.test(w.kind)) && flipH(w[K]) && !real.has(flipH(w[K]))).sort((a, b) => h(a[K]) - h(b[K])), n = Math.min(can.length, Math.max(3, Math.ceil(want.length / 8)));
    if (n < 3) { console.log(`✗ ${dir}: fewer than 3 ${WHAT} can carry a planted fault, so a by-hand read can't be marked. Use a model with a key, or read more rows at once.`); process.exit(1); }
    const items = [...want.map(body), ...can.slice(0, n).map(w => ({ ...body(w), [K]: flipH(w[K]) }))].sort((a, b) => h(a[K] + '|') - h(b[K] + '|')).map((x, i) => ({ row: i + 1, ...x }));
    writeFileSync(PACKET, JSON.stringify({ instructions: STORY ? STORY_PROMPT : PROMPT, answer_format: `A JSON array, one object per row: {"row": 1, "verdict": "confirmed" or "disputed", ${CHECKS.map(c => `"${c}": "yes|no|n.a."`).join(', ')}, "notes": "one sentence, specific to this row, saying why"}`, planted: n, items }, null, 1));
    console.log(`✓ ${PACKET}: ${items.length} items to read (${want.length} ${WHAT} and ${n} planted faults, not marked)`); process.exit(0);
  }
  const pk = JSON.parse(readFileSync(PACKET, 'utf8')), raw = JSON.parse(readFileSync(ANSWERS, 'utf8')), ans = new Map((Array.isArray(raw) ? raw : raw.items || []).map(a => [Number(a.row), a]));
  const plants = pk.items.filter(x => !real.has(x[K])), reals = pk.items.filter(x => real.has(x[K]));
  if (plants.length !== pk.planted || (STORY && reals.length !== want.length)) { console.log(`✗ ${dir}: the ${STORY ? 'story has' : 'claims have'} changed since this packet was made. Make a new packet and read that.`); process.exit(1); }
  const miss = pk.items.filter(x => !ans.has(x.row)); if (miss.length) { console.log(`✗ no answer for rows ${miss.map(m => m.row).join(', ')}`); process.exit(1); }
  const verdict = (a) => CHECKS.every(c => /^(yes|n\.a\.)$/i.test(String(a[c] || '').trim())) && String(a.verdict).toLowerCase().trim() === 'confirmed' ? 'confirmed' : 'disputed';
  const fooled = plants.filter(x => verdict(ans.get(x.row)) === 'confirmed');
  if (fooled.length) { console.log(`✗ ${NAME} confirmed ${fooled.length} of ${plants.length} planted wrong ${WHAT}, so this read can't be trusted. Nothing was saved.`); process.exit(1); }
  const byText = new Map(reals.map(x => [x[K], ans.get(x.row)]));
  if (STORY) { const out = join(dir, `storycheck.${NAME}.csv`), rs = allWant.map(w => { const a = byText.get(w.summary), p = prev.get(w.summary); return a ? { ...a, row: w.row, verdict: verdict(a), text: w.summary } : p && p.verdict === 'confirmed' ? { ...p, row: w.row } : null; }).filter(Boolean);
    writeFileSync(out, [...COLS, 'text'].join(',') + '\n' + rs.map(r => [...COLS, 'text'].map(c => c === 'row' ? r.row : q(r[c])).join(',')).join('\n') + '\n');
    const d = rs.filter(a => a.verdict !== 'confirmed'); console.log(`✓ ${out}: ${rs.length - d.length} confirmed, ${d.length} disputed (read by hand by ${NAME}; caught ${plants.length} of ${plants.length} planted wrong summaries)`); d.forEach(a => console.log(`  disputed: "${a.text.slice(0, 80)}": ${String(a.notes).slice(0, 240)}`)); process.exit(0); }
  // Claims: one line per row read, added to the rows this reader already has on file. A claim reworded since the packet was made is not in `real`, so it is simply not saved.
  const out = join(dir, `factcheck.${NAME}.csv`), keep = new Map((existsSync(out) ? objs(out) : []).map(r => [Number(r.row), r])), rs = want.filter(w => byText.has(w.claim)).map(w => { const a = byText.get(w.claim); return { ...a, row: w.row, verdict: verdict(a), stamp: stampOf(w.row) }; });
  for (const r of rs) keep.set(r.row, r);
  const rows = [...keep.values()].filter(r => Number(r.row) <= claims.length + 1).sort((a, b) => a.row - b.row);
  writeFileSync(out, FCOLS.join(',') + '\n' + rows.map(r => FCOLS.map(c => c === 'row' ? r.row : q(r[c] || '')).join(',')).join('\n') + '\n');
  const d = rs.filter(a => a.verdict !== 'confirmed'); console.log(`✓ ${out}: ${rs.length - d.length} confirmed, ${d.length} disputed (read by hand by ${NAME}; caught ${plants.length} of ${plants.length} planted wrong claims)`); d.forEach(a => console.log(`  disputed row ${a.row}: ${String(a.notes).slice(0, 240)}`)); process.exit(0);
}
// Rows per request. Gemini's free tier counts requests, so a bigger batch checks more rows a day. Default 12, the size the checks so far were run at.
// Groq's free tier allows about 1000 output tokens a minute, so Groq gets small batches, a 950-token answer cap and a pause between batches.
const BATCH = GROQ ? Math.min(3, Math.max(2, Number(opt('--batch')) || 3)) : Math.min(40, Math.max(4, Number(opt('--batch')) || 12));
// A model never checks its own writing. Claude is refused where Claude wrote the claims, and skips rows Claude rewrote (both are recorded in extraction-record.md).
if (CLAUDE && !STORY) { const rec = existsSync(join(dir, 'extraction-record.md')) ? readFileSync(join(dir, 'extraction-record.md'), 'utf8') : '';
  if (!/writer[^\n]{0,20}?(claude|codex|gpt|gemini|copilot)/i.test(rec)) { console.log(`✗ ${dir}: extraction-record.md doesn't say who wrote the claims ("Writer: ..."), so Claude can't be used as a checker here`); process.exit(1); }
  if (/writer[^\n]{0,20}?claude/i.test(rec)) { console.log(`✗ ${dir}: Claude wrote these claims, so Claude can't check them. Use gemini and groq.`); process.exit(1); }
  const own = new Set(); for (const m of rec.matchAll(/rows rewritten by claude[^\n]*\n?[^\n#]*/gi)) for (const r of m[0].replace(/rows rewritten by claude/i, '').matchAll(/(\d+)(?:\s*(?:-|–|to)\s*(\d+))?/g)) for (let n = +r[1]; n <= +(r[2] || r[1]); n++) own.add(n);
  const mine = want.filter(x => own.has(x.row)); if (mine.length) { console.log(`Skipping rows Claude rewrote: ${mine.map(x => x.row).join(', ')}`); for (const x of mine) want.splice(want.indexOf(x), 1); }
  if (!want.length) { console.log(`✓ ${dir}: nothing for Claude to check`); process.exit(0); } }
const list = await models(), got = new Map(); let model = list.shift(); let canaries = 0;
for (let i = 0; i < want.length; i += BATCH) {
  if (GROQ && i > 0) await new Promise(s => setTimeout(s, 61000));
  const part = want.slice(i, i + BATCH); let ans;
  // Canary: one planted wrong claim per batch (a number changed). A checker that confirms it is rubber-stamping, so the run stops.
  // In story mode the planted item is a real summary with its strength turned round, or a number changed.
  const flip = (t) => /should not be/.test(t) ? t.replace('should not be', 'should be') : /should be offered/.test(t) ? t.replace('should be offered', 'should not be offered') : /can be considered/.test(t) ? t.replace('can be considered', 'must be given') : /\d/.test(t) ? t.replace(/\d+(\.\d+)?/, m => String(Math.round(parseFloat(m) * 3 + 7))) : '';
  const ssrc = STORY ? part.find(p => /^short/.test(p.kind) && flip(p.summary)) : null;
  const src = STORY ? null : part.find(p => /\d/.test(p.claim) && /\d/.test(p.guideline_quote)), canary = ssrc ? { ...ssrc, row: -1, summary: flip(ssrc.summary) } : src ? { row: -1, claim: src.claim.replace(/\d+(\.\d+)?/, m => String(Math.round(parseFloat(m) * 3 + 7))), guideline_quote: src.guideline_quote } : null;
  if (canary) part.push(canary);
  const askSplit = async (items) => { try { return await ask(model, items); } catch (e) { if (e.nextModel || items.length < 2) throw e; const h = Math.ceil(items.length / 2); console.log(`no usable answer for ${items.length} items, splitting`); return [...await askSplit(items.slice(0, h)), ...await askSplit(items.slice(h))]; } };
  for (;;) { try { ans = await askSplit(part); break; } catch (e) { if (!e.nextModel || !list.length) throw e; console.log(`${model} refused (${e.message.slice(0, 60)}…), trying ${list[0]}`); model = list.shift(); } }
  if (i === 0) console.log(`Checking ${want.length} rows of ${dir} with ${model}`);
  if (canary) { part.pop(); const c = ans.find(a => Number(a.row) === -1); if (!c || String(c.verdict).toLowerCase().trim() === 'confirmed') throw new Error(`${model} confirmed a planted wrong claim ("${(canary.claim || canary.summary).slice(0, 80)}…"), so its answers can't be trusted`); canaries++; }
  for (const a of ans) { if (a && a.verdict) a.verdict = String(a.verdict).toLowerCase().trim(); const n = Number(a.row); if (!part.some(p => p.row === n)) continue; const ok = CHECKS.every(c => /^(yes|n\.a\.)$/i.test(String(a[c] || '').trim())); got.set(n, { ...a, row: n, verdict: ok && a.verdict === 'confirmed' ? 'confirmed' : 'disputed', stamp: stampOf(n) }); }
  const miss = part.filter(p => !got.has(p.row)); if (miss.length) throw new Error('no answer for rows ' + miss.map(m => m.row).join(', '));
  await new Promise(s => setTimeout(s, 4000));
}
const name = CLAUDE ? 'claude' : GROQ ? (/llama/i.test(model) ? 'llama' : /qwen/i.test(model) ? 'qwen' : /kimi|moonshot/i.test(model) ? 'kimi' : /deepseek/i.test(model) ? 'deepseek' : /gpt-oss/i.test(model) ? 'gptoss' : 'groq') : 'gemini', out = join(dir, `${STORY ? 'storycheck' : 'factcheck'}.${name}.csv`);
if (STORY) { if (name === storyWriter) { console.log(`✗ ${dir}: ${name} wrote this story, so it can't check it`); process.exit(1); }
  // One line per summary, with the wording that was judged, so a later change to the story shows up as unread.
  const rs = want.map(w => ({ ...got.get(w.row), text: w.summary })); writeFileSync(out, [...COLS, 'text'].join(',') + '\n' + rs.map(r => [...COLS, 'text'].map(c => c === 'row' ? r.row : q(r[c])).join(',')).join('\n') + '\n');
  const d = rs.filter(a => a.verdict !== 'confirmed'); console.log(`✓ ${out}: ${rs.length - d.length} confirmed, ${d.length} disputed (model ${model}; caught ${canaries} of ${canaries} planted wrong summaries)`); d.forEach(a => console.log(`  disputed: "${a.text.slice(0, 80)}": ${String(a.notes).slice(0, 240)}`)); process.exit(0); }
const old = existsSync(out) ? objs(out) : [], keep = new Map(old.map(r => [Number(r.row), r])); for (const [n, a] of got) keep.set(n, a);
const rows = [...keep.values()].filter(r => Number(r.row) <= claims.length + 1).sort((a, b) => a.row - b.row);
writeFileSync(out, FCOLS.join(',') + '\n' + rows.map(r => FCOLS.map(c => c === 'row' ? r.row : q(r[c] || '')).join(',')).join('\n') + '\n');
const dis = [...got.values()].filter(a => a.verdict !== 'confirmed');
console.log(`✓ ${out}: ${got.size - dis.length} confirmed, ${dis.length} disputed (model ${model}; caught ${canaries} of ${canaries} planted wrong claims)`); dis.forEach(a => console.log(`  disputed row ${a.row}: ${String(a.notes).slice(0, 240)}`));
