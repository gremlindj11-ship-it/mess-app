// Checks a factcheck.csv is a real row-by-row check, not a rubber stamp.
// Run: node tools/check-factcheck.mjs content/<area>/<condition>/factcheck.csv
// Fails if: a row has no verdict; a confirmed row lacks any of the eight checks; or the same reasoning text is pasted on many rows.
import { readFileSync } from 'node:fs';
const CHECKS = ['population', 'trigger', 'action', 'strength', 'numbers', 'alternatives', 'exceptions', 'safety'];
const csv = (t) => { const rows = []; let row = [], f = '', q = false; t = t.replace(/^﻿/, ''); for (let i = 0; i < t.length; i++) { const c = t[i]; if (q) { if (c === '"' && t[i + 1] === '"') { f += '"'; i++; } else if (c === '"') q = false; else f += c; } else if (c === '"') q = true; else if (c === ',') { row.push(f); f = ''; } else if (c === '\n' || c === '\r') { if (c === '\r' && t[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; } else f += c; } if (f || row.length) { row.push(f); rows.push(row); } return rows.filter(r => r.some(x => x.trim())); };
let bad = 0;
for (const file of process.argv.slice(2)) {
  const [head, ...rows] = csv(readFileSync(file, 'utf8')), h = head.map(x => x.trim().toLowerCase()), col = (r, k) => (r[h.indexOf(k)] || '').trim(), errs = [];
  const missing = CHECKS.filter(c => !h.includes(c)); if (missing.length) errs.push(`missing check columns: ${missing.join(', ')}. Each confirmed row needs yes/no/n.a. for: ${CHECKS.join(', ')}, plus a row-specific "notes"`);
  const seen = new Map();
  rows.forEach(r => {
    const at = 'row ' + col(r, 'row'), v = col(r, 'verdict');
    if (!/^(confirmed|disputed|can't verify)$/.test(v)) errs.push(`${at}: verdict must be confirmed, disputed or can't verify`);
    if (v === 'confirmed' && !missing.length) CHECKS.forEach(c => { if (!/^(yes|n\.a\.)/i.test(col(r, c))) errs.push(`${at}: confirmed but "${c}" isn't yes or n.a.`); });
    const why = (col(r, 'notes') || col(r, 'claim_within_rec')).toLowerCase(); if (why) seen.set(why, (seen.get(why) || 0) + 1);
  });
  for (const [w, n] of seen) if (n > 3 && rows.length > 6) errs.push(`the same reasoning is pasted on ${n} rows ("${w.slice(0, 60)}…"). Each row needs its own note on what was checked`);
  console.log(`${errs.length ? '✗' : '✓'} ${file}: ${rows.length} rows, ${errs.length} to fix`); errs.slice(0, 40).forEach(e => console.log('  fix: ' + e)); if (errs.length) bad++;
}
process.exitCode = bad ? 1 : 0;
