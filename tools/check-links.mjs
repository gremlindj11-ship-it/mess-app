// Checks an area's links.csv: the similar pairs and other links the area map plans, before any story is written from it.
// A row reference such as "copd r12" means record 12 of copd/claims.csv in the same folder, counting the header as 1,
// the same numbering factcheck.csv uses. A pair marked "backed" must have claims on both sides.
// Run: node tools/check-links.mjs content/respiratory/links.csv
// Exit code 1 if anything breaks a rule. It checks structure only; it never judges medical content.
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

const COLS = ['from', 'to', 'type', 'why_it_helps', 'from_rows', 'to_rows', 'status'];
const TYPES = ['mechanism', 'cause', 'complication', 'mimic', 'trap', 'investigation', 'treatment'];
const STATUS = ['backed', 'needs claim'];

function csv(text) { const rows = []; let row = [], f = '', q = false; const t = text.replace(/^﻿/, ''); for (let i = 0; i < t.length; i++) { const c = t[i]; if (q) { if (c === '"' && t[i + 1] === '"') { f += '"'; i++; } else if (c === '"') q = false; else f += c; } else if (c === '"') q = true; else if (c === ',') { row.push(f); f = ''; } else if (c === '\n' || c === '\r') { if (c === '\r' && t[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; } else f += c; } if (f || row.length) { row.push(f); rows.push(row); } return rows.filter(r => r.some(x => x.trim())); }

export function checkLinks(file) {
  const dir = dirname(file), rows = csv(readFileSync(file, 'utf8')), head = (rows.shift() || []).map(h => h.trim().toLowerCase()), errs = [], sizes = {};
  if (head.join(',') !== COLS.join(',')) return { errs: [`columns should be, in this order: ${COLS.join(',')} (found: ${head.join(',') || 'nothing'})`], n: rows.length };
  const records = (folder) => { if (!(folder in sizes)) { const f = join(dir, folder, 'claims.csv'); sizes[folder] = /^[a-z0-9-]+$/.test(folder) && existsSync(f) ? csv(readFileSync(f, 'utf8')).length : 0; } return sizes[folder]; };
  rows.forEach((r, k) => {
    const o = Object.fromEntries(COLS.map((c, i) => [c, (r[i] || '').trim()])), at = `row ${k + 2} (${o.from || '?'} → ${o.to || '?'})`;
    if (!o.from || !o.to) errs.push(`${at}: from and to must both be filled in`);
    if (!TYPES.includes(o.type)) errs.push(`${at}: type "${o.type}" should be one of: ${TYPES.join(', ')}`);
    if (!STATUS.includes(o.status)) errs.push(`${at}: status "${o.status}" should be "backed" or "needs claim"`);
    const refs = (side) => o[side] ? o[side].split(';').map(x => x.trim()).filter(Boolean) : [];
    ['from_rows', 'to_rows'].forEach(side => refs(side).forEach(ref => {
      const m = ref.match(/^([a-z0-9-]+) r(\d+)$/);
      if (!m) { errs.push(`${at}: ${side} "${ref}" should look like "copd r12"`); return; }
      const n = records(m[1]), line = +m[2];
      if (!n) errs.push(`${at}: ${side} "${ref}": there is no ${m[1]}/claims.csv next to this file`);
      else if (line < 2 || line > n) errs.push(`${at}: ${side} "${ref}": ${m[1]}/claims.csv has rows 2 to ${n} (row 1 is the header)`);
    }));
    if (o.status === 'backed' && (!refs('from_rows').length || !refs('to_rows').length)) errs.push(`${at}: marked "backed" but ${!refs('from_rows').length ? 'from_rows' : 'to_rows'} is empty. A pair is backed only when both sides have a claim.`);
  });
  return { errs, n: rows.length };
}

if (process.argv[1] && process.argv[1].endsWith('check-links.mjs')) {
  const file = process.argv[2];
  if (!file || !existsSync(file)) { console.log('Usage: node tools/check-links.mjs <links.csv>'); process.exit(2); }
  const { errs, n } = checkLinks(file);
  console.log(`${errs.length ? '✗' : '✓'} ${file}: ${n} rows checked, ${errs.length} to fix`);
  errs.forEach(e => console.log('  fix: ' + e));
  process.exit(errs.length ? 1 : 0);
}
