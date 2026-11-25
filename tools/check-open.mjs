// Statements written from open sources: builds them, checks every quote word for word, and reports coverage.
// Run: node tools/check-open.mjs content/open/<topic> [--fill]
//   --fill   build statements.csv from statements.src.txt, copying each quote from the saved source by its address.
//            Quotes are copied by script and never typed, so a quote cannot drift from its source.
//   (none)   check statements.csv: every quote is still, word for word, the text at its address in the saved source;
//            no quote holds a set-aside marker or names guidance a model may not read; every source is one the rights
//            register allows; and write coverage.md (how much of coverage.csv has an agreed statement).
// A statement is "agreed" only when consensus.csv says two checkers that are not the writer both confirmed it.
// The columns match the old claims files, so tools/ai-factcheck.mjs and tools/consensus.mjs check these unchanged.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { quoteAt, SET_ASIDE, SET_ASIDE_ART, RESTRICTED } from './fetch-open.mjs';
import { byId, mayWrite, OPEN, objs, ROOT } from './rights.mjs';

const args = process.argv.slice(2), dir = args.find(a => !a.startsWith('--')), FILL = args.includes('--fill');
if (!dir) { console.log('Usage: node tools/check-open.mjs content/open/<topic> [--fill]'); process.exit(2); }
const COLS = ['topic', 'step', 'subject', 'relation', 'object', 'how_often_or_sure', 'condition_or_population', 'numbers', 'level', 'misconception', 'mechanism_why', 'why_it_matters', 'source', 'source_version', 'source_url', 'source_quote', 'checked_on', 'also_in', 'disagreement', 'jurisdiction', 'status', 'source_id', 'source_at', 'covers'];
const STEPS = ['risk factors', 'pathophysiology', 'clinical features', 'consequences', 'investigations', 'management', 'complications', 'differential', 'prognosis', 'prevention', 'mechanism', 'indications', 'side effects', 'cautions', 'interactions', 'monitoring'];
const SURE = ['always', 'most', 'usually', 'often', 'some', 'sometimes', 'rarely', 'never', 'must', 'should', 'may', 'consider', 'do not'];
const q = (s) => '"' + String(s ?? '').replace(/"/g, '""') + '"', errs = [];
const docs = new Map(), doc = (id) => { if (!docs.has(id)) { const p = new URL(`content/open-sources/${id}.json`, ROOT); docs.set(id, existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null); } return docs.get(id); };
const label = (d) => d.kind === 'nhs' ? 'NHS website: ' + d.title : d.kind === 'govuk' ? 'GOV.UK: ' + d.title : `Article: ${d.authors}. ${d.title}. ${d.journal} ${d.year}`;
const srcFile = join(dir, 'statements.src.txt'), csvFile = join(dir, 'statements.csv');

if (FILL) {
  const lines = readFileSync(srcFile, 'utf8').split('\n'), short = {}, rows = [];
  // The header says which short name stands for which saved source: "N1 nhs-high-blood-pressure, T bihs-2025-...".
  for (const l of lines.filter(l => l.startsWith('#'))) for (const m of l.matchAll(/\b([A-Z][A-Z0-9]{0,3}) ([a-z0-9][a-z0-9-]{4,})/g)) short[m[1]] = m[2];
  const topic = (lines.find(l => /^# [A-Z][\w ]*:/.test(l)) || '# Topic:').slice(2).split(':')[0].trim();
  lines.forEach((l, i) => { if (!l.trim() || l.startsWith('#')) return; const p = l.split(' | ').map(x => x.trim()), at = `${srcFile} line ${i + 1}`;
    if (p.length !== 9) return errs.push(`${at}: expected 9 parts separated by " | ", got ${p.length}`);
    const [covers, step, sure, level, s, where, subject, relation, object] = p, id = short[s] || s, d = doc(id);
    if (!d) return errs.push(`${at}: no saved source "${id}"`);
    const quote = quoteAt(d, where); if (!quote) return errs.push(`${at}: nothing at ${where} in ${id}`);
    rows.push({ topic, step, subject, relation, object, how_often_or_sure: sure, numbers: '', level, source: label(d), source_version: d.updated || d.fetched, source_url: d.url, source_quote: quote, checked_on: d.fetched, jurisdiction: 'UK', status: 'draft', source_id: id, source_at: where, covers }); });
  if (errs.length) { errs.forEach(e => console.log('✗ ' + e)); process.exit(1); }
  writeFileSync(csvFile, COLS.map(q).join(',') + '\n' + rows.map(r => COLS.map(c => q(r[c])).join(',')).join('\n') + '\n');
  console.log(`✓ ${csvFile}: ${rows.length} statements, quotes copied from ${new Set(rows.map(r => r.source_id)).size} saved sources`);
}

const rows = objs(readFileSync(csvFile, 'utf8')), norm = (s) => String(s).replace(/\s+/g, ' ').trim(), seen = new Map();
rows.forEach((r, i) => { const at = `${csvFile} row ${i + 2}`, d = doc(r.source_id), claim = norm([r.subject, r.relation, r.object].join(' '));
  for (const c of ['topic', 'step', 'subject', 'relation', 'object', 'how_often_or_sure', 'level', 'source', 'source_url', 'source_quote', 'checked_on', 'jurisdiction', 'status', 'source_id', 'source_at']) if (!r[c]) errs.push(`${at}: ${c} is empty`);
  if (r.step && !STEPS.includes(r.step)) errs.push(`${at}: step "${r.step}" is not one of the steps`);
  if (r.how_often_or_sure && !SURE.includes(r.how_often_or_sure)) errs.push(`${at}: how_often_or_sure "${r.how_often_or_sure}" is not allowed`);
  if (!['core', 'extension'].includes(r.level)) errs.push(`${at}: level should be core or extension`);
  if (r.status !== 'draft') errs.push(`${at}: status must be draft. A statement is only ever "agreed" through consensus.csv`);
  if (!d) return errs.push(`${at}: no saved source "${r.source_id}" in content/open-sources/`);
  const reg = byId(d.register); if (!mayWrite(reg) || !OPEN.has(d.licence)) errs.push(`${at}: ${r.source_id} is not a source a model may write from (${d.register}, ${d.licence})`);
  if (r.source_url !== d.url) errs.push(`${at}: source_url is not the saved source's address`);
  const real = quoteAt(d, r.source_at);
  if (!real) errs.push(`${at}: nothing at ${r.source_at} in ${r.source_id}`);
  else if (norm(real) !== norm(r.source_quote)) errs.push(`${at}: the quote is not, word for word, the text at ${r.source_at} in ${r.source_id}`);
  if (r.source_quote.includes(SET_ASIDE) || r.source_quote.includes(SET_ASIDE_ART)) errs.push(`${at}: the quote includes a sentence that was set aside`);
  if (RESTRICTED.test(r.source_quote) || RESTRICTED.test(claim)) errs.push(`${at}: names guidance a model may not read`);
  if (norm(r.source_quote).toLowerCase() === claim.toLowerCase()) errs.push(`${at}: the statement is a copy of its quote. Write it in Mess's own words.`);
  if (!/[.?]$/.test(claim)) errs.push(`${at}: the statement does not end as a sentence`);
  if (seen.has(claim)) errs.push(`${at}: same statement as row ${seen.get(claim)}`); seen.set(claim, i + 2); });

// Coverage: which checklist items have a statement, and which have one that two checkers agreed.
const covFile = join(dir, 'coverage.csv'), conFile = join(dir, 'consensus.csv');
if (existsSync(covFile)) {
  const items = objs(readFileSync(covFile, 'utf8')), con = existsSync(conFile) ? Object.fromEntries(objs(readFileSync(conFile, 'utf8')).map(r => [r.row, r])) : {};
  const agreed = (i) => (con[String(i + 2)] || {}).status === 'agreed', checked = (i) => !!(con[String(i + 2)] || {}).checked_by;
  const of = (n, full) => rows.map((r, i) => ({ r, i })).filter(({ r }) => r.covers.split(',').map(x => x.trim()).some(x => x === String(n) + (full ? '' : 'p') || (!full && x === String(n))));
  const state = (n) => { const full = of(n, true), any = of(n, false); return full.some(x => agreed(x.i)) ? 'agreed' : any.some(x => agreed(x.i)) ? 'partly' : any.length ? 'written, not agreed' : 'nothing found'; };
  const st = items.map(it => ({ ...it, state: state(it.n), rows: of(it.n, false).map(x => x.i + 2) })), count = (s) => st.filter(x => x.state === s).length;
  const nAgreed = rows.filter((r, i) => agreed(i)).length, nChecked = rows.filter((r, i) => checked(i)).length, by = {};
  rows.forEach((r, i) => { const b = (by[r.source_id] ||= { n: 0, a: 0 }); b.n++; if (agreed(i)) b.a++; });
  const md = [`# ${rows[0] ? rows[0].topic : 'Topic'}: how much of the topic has an agreed statement`, '',
    'Made by `node tools/check-open.mjs`. Do not edit by hand. A statement is agreed only when two checkers that are not the writer both confirmed it against its quote.', '',
    `- Statements written: ${rows.length}. Checked by at least one checker: ${nChecked}. **Agreed by two: ${nAgreed}.**`,
    `- Checklist items: ${items.length}. **With an agreed statement: ${count('agreed')}.** Partly: ${count('partly')}. Written but not agreed: ${count('written, not agreed')}. Nothing found in the sources: ${count('nothing found')}.`, '',
    '| Source | Statements | Agreed |', '|---|---|---|', ...Object.entries(by).map(([k, v]) => `| ${k} | ${v.n} | ${v.a} |`), '',
    '| # | Area | Item | State | Statement rows |', '|---|---|---|---|---|', ...st.map(x => `| ${x.n} | ${x.group} | ${x.item} | ${x.state} | ${x.rows.join(', ')} |`), ''].join('\n');
  writeFileSync(join(dir, 'coverage.md'), md);
  console.log(`${dir}: ${rows.length} statements, ${nAgreed} agreed by two checkers. Checklist: ${count('agreed')} of ${items.length} items agreed, ${count('partly')} partly, ${count('written, not agreed')} written but not agreed, ${count('nothing found')} with nothing found.`);
}
if (errs.length) { console.log(`✗ ${errs.length} problem${errs.length === 1 ? '' : 's'}:`); errs.slice(0, 40).forEach(e => console.log('  ' + e)); process.exit(1); }
console.log(`✓ ${csvFile}: every quote is word for word the text at its address, from a source the register allows.`);
