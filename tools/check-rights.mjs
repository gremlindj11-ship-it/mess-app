// The licence gate. Fails (exit 1) if any statement cites a source the rights register does not allow.
// Run: node tools/check-rights.mjs [folder that holds content/ and app/, default: the repo]
//   --freeze   write content/rights-frozen.json from the claims as they stand. Only for a deliberate change after
//              an owner's answer (for example, their statements have been taken down). Never to let new ones in.
// What it checks:
//  1. The register itself is complete: every entry has a licence, a use, an answer on AI, a date and its proof.
//  2. Old-process claims (content/**/claims.csv) and the app's statements (app/assets/evidence.js): every one maps
//     to a register entry. From a frozen source, it must be one that existed at the freeze, word for word.
//     Taking frozen statements down is allowed; adding or rewording is not.
//  3. New-process statements (content/open/**/statements.csv): every one cites a saved source
//     (content/open-sources/*.json) that belongs to an entry a model may read, under an open licence.
//  4. Every In practice source link in the app goes to a site in the register.
import { readFileSync, readdirSync, statSync, existsSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import vm from 'node:vm';
import { REGISTER, OPEN, sourceFor, byId, mayWrite, claimId, objs } from './rights.mjs';

const args = process.argv.slice(2), root = resolve(args.find(a => !a.startsWith('--')) || new URL('../', import.meta.url).pathname), FREEZE = args.includes('--freeze');
const errs = [], warns = [], rel = (p) => relative(root, p);
const walk = (dir, test, out = []) => { if (!existsSync(dir)) return out; for (const n of readdirSync(dir)) { const p = join(dir, n); if (statSync(p).isDirectory()) { if (n !== 'sources') walk(p, test, out); } else if (test(n)) out.push(p); } return out; };

// 1. The register.
const ids = new Set();
for (const s of REGISTER.sources) {
  if (!s.id || ids.has(s.id)) errs.push(`register: id "${s.id}" is missing or used twice`); ids.add(s.id);
  for (const k of ['name', 'licence', 'licence_url', 'ai_input', 'use', 'checked', 'checked_how']) if (!s[k]) errs.push(`register: ${s.id} has no ${k}`);
  if (!['write', 'link', 'frozen'].includes(s.use)) errs.push(`register: ${s.id} has use "${s.use}" (write, link or frozen)`);
  if (!['yes', 'no', 'ask', 'per-item'].includes(s.ai_input)) errs.push(`register: ${s.id} has ai_input "${s.ai_input}"`);
  if (s.use === 'write') {
    if (!mayWrite(s)) errs.push(`register: ${s.id} is marked write but a model may not read it (${s.ai_input})`);
    if (s.licence !== 'per-item' && !OPEN.has(s.licence)) errs.push(`register: ${s.id} is marked write under "${s.licence}", which is not an open licence`);
    if (!s.credit) errs.push(`register: ${s.id} is marked write but has no credit line`);
    if (!/^https:\/\//.test(s.licence_url)) errs.push(`register: ${s.id} needs the page that proves its licence`);
  }
  const age = (Date.now() - Date.parse(s.checked)) / 864e5;
  if (!(age >= 0)) errs.push(`register: ${s.id} has a checked date that is not a date, or is in the future`);
  else if (age > 92 && s.use === 'write') warns.push(`${s.id}: terms last read ${s.checked}. Read them again.`);
}

// 2. Old-process claims and the app's statements.
const frozenFile = join(root, 'content', 'rights-frozen.json');
const claimFiles = walk(join(root, 'content'), n => /^claims\.csv$/i.test(n)).sort(), found = {};
const claims = [];
for (const f of claimFiles) objs(readFileSync(f, 'utf8')).forEach((c, i) => { if (c.topic) claims.push({ ...c, at: `${rel(f)} row ${i + 2}` }); });
for (const c of claims) { const s = sourceFor({ label: c.source, url: c.source_url }); c.reg = s; if (s) (found[s.id] ||= []).push(claimId(c)); }
if (FREEZE) {
  const out = { frozen_on: '2026-11-20', about: 'Every statement made from a frozen source before the stop. tools/check-rights.mjs lets these stay or be taken down, and fails on any that is added or reworded.', ids: {} };
  for (const s of REGISTER.sources.filter(s => s.use === 'frozen')) out.ids[s.id] = [...new Set(found[s.id] || [])].sort();
  writeFileSync(frozenFile, JSON.stringify(out) + '\n');
  console.log(`Wrote ${rel(frozenFile)}: ` + Object.entries(out.ids).map(([k, v]) => `${k} ${v.length}`).join(', ')); process.exit(0);
}
const frozen = existsSync(frozenFile) ? JSON.parse(readFileSync(frozenFile, 'utf8')).ids : {}, isFrozen = (s, id) => (frozen[s.id] || []).includes(id);
const judge = (c, id, at) => {
  const s = c.reg;
  if (!s) return errs.push(`${at}: source "${c.source || c.source_url}" is not in the rights register`);
  if (s.use === 'frozen') { if (!isFrozen(s, id)) errs.push(`${at}: a new or reworded statement from ${s.name}, which is frozen. Nothing is added or reworded until its owner says yes in writing.`); return; }
  if (s.use === 'link') return errs.push(`${at}: cites ${s.name}, which is link only`);
  errs.push(`${at}: cites ${s.name} through the old process. Statements from open sources go in content/open/<topic>/statements.csv, with a saved source.`);
};
for (const c of claims) judge(c, claimId(c), c.at);
const evFile = join(root, 'app', 'assets', 'evidence.js');
if (existsSync(evFile)) { const ctx = {}; vm.runInNewContext(readFileSync(evFile, 'utf8') + '\nthis.out = EVIDENCE;', ctx);
  for (const c of Object.values(ctx.out).flat()) { c.reg = sourceFor({ label: c.source, url: c.source_url }); judge(c, c.id, `app/assets/evidence.js ${c.id} (${c.topic})`); } }

// 3. New-process statements.
const srcDir = join(root, 'content', 'open-sources'), saved = new Map();
for (const f of walk(srcDir, n => n.endsWith('.json'))) { let j; try { j = JSON.parse(readFileSync(f, 'utf8')); } catch (e) { errs.push(`${rel(f)}: not readable`); continue; }
  const s = byId(j.register), at = rel(f);
  if (!s) errs.push(`${at}: register entry "${j.register}" does not exist`);
  else { if (!mayWrite(s)) errs.push(`${at}: saved from ${s.name}, which a model may not read`);
    if (sourceFor({ url: j.url }) !== s) errs.push(`${at}: its address ${j.url} does not belong to ${s.name}`); }
  if (!OPEN.has(j.licence)) errs.push(`${at}: licence "${j.licence}" is not an open licence`);
  for (const k of ['id', 'url', 'title', 'fetched', 'licence_evidence', 'credit', 'sha256']) if (!j[k]) errs.push(`${at}: no ${k}`);
  saved.set(j.id, j); }
let open = 0;
for (const f of walk(join(root, 'content', 'open'), n => /^statements\.csv$/i.test(n)).sort()) objs(readFileSync(f, 'utf8')).forEach((c, i) => { open++; const at = `${rel(f)} row ${i + 2}`, j = saved.get(c.source_id);
  if (!c.source_id) return errs.push(`${at}: no source_id`);
  if (!j) return errs.push(`${at}: source_id "${c.source_id}" has no saved copy in content/open-sources/`);
  const s = byId(j.register); if (!mayWrite(s)) errs.push(`${at}: cites ${s ? s.name : j.register}, which the register does not allow`); });

// 4. In practice source links.
const tp = join(root, 'app', 'assets', 'topics.js'); let links = 0;
if (existsSync(tp)) { const P = new Function(readFileSync(tp, 'utf8') + '; return typeof PRACTICE === "undefined" ? new Map() : PRACTICE;')();
  for (const p of P.values()) if (p.url) { links++; if (!sourceFor({ url: p.url })) errs.push(`app/assets/topics.js: In practice item "${p.name}" links to a site that is not in the rights register: ${p.url}`); } }

const n = (u) => REGISTER.sources.filter(s => s.use === u).length;
console.log(`Rights register: ${REGISTER.sources.length} sources (${n('write')} a model may read, ${n('link')} link only, ${n('frozen')} frozen). ${claims.length} old-process claims in ${claimFiles.length} files, ${open} open-source statements, ${saved.size} saved sources, ${links} In practice links.`);
warns.forEach(w => console.log('  to look at: ' + w));
if (errs.length) { console.log(`✗ ${errs.length} problem${errs.length === 1 ? '' : 's'}:`); errs.slice(0, 40).forEach(e => console.log('  ' + e)); if (errs.length > 40) console.log(`  … and ${errs.length - 40} more`); process.exit(1); }
console.log('✓ Every statement cites a source the register allows.');
