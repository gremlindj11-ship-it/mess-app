// Consensus: merges independent fact checks of the same claims by different models.
// Each checker writes content/<area>/<condition>/factcheck.<model>.csv (Brief 2 columns), without seeing the others.
// A row is "agreed" only if at least MIN different models checked it and every one says confirmed. Anything else is "unresolved" and stays out of stories.
// Run: node tools/consensus.mjs content/<area>/<condition> [--min 2]   → writes consensus.csv, prints what's unresolved.
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { stamp, rowsFile } from './rights.mjs';
const dir = process.argv[2], mi = process.argv.indexOf('--min'), MIN = mi > 0 ? +process.argv[mi + 1] : 2;
const CHECKS = ['population', 'trigger', 'action', 'strength', 'numbers', 'alternatives', 'exceptions', 'safety'];
const csv = (t) => { const rows = []; let row = [], f = '', q = false; t = t.replace(/^﻿/, ''); for (let i = 0; i < t.length; i++) { const c = t[i]; if (q) { if (c === '"' && t[i + 1] === '"') { f += '"'; i++; } else if (c === '"') q = false; else f += c; } else if (c === '"') q = true; else if (c === ',') { row.push(f); f = ''; } else if (c === '\n' || c === '\r') { if (c === '\r' && t[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; } else f += c; } if (f || row.length) { row.push(f); rows.push(row); } return rows.filter(r => r.some(x => x.trim())); };
const objs = (p) => { const [h, ...rs] = csv(readFileSync(p, 'utf8')); return rs.map(r => Object.fromEntries(h.map((k, i) => [k.trim().toLowerCase(), (r[i] || '').trim()]))); };
const q = (s) => '"' + String(s).replace(/"/g, '""') + '"';
const files = readdirSync(dir).filter(f => /^factcheck\.[a-z0-9-]+\.csv$/i.test(f)).sort(), models = files.map(f => f.split('.')[1]);
// Statements written from open sources live in statements.csv (same columns); the old guideline work is in claims.csv.
const claims = objs(join(dir, rowsFile(dir))), by = files.map(f => Object.fromEntries(objs(join(dir, f)).map(r => [r.row, r])));
const out = [['row', 'status', 'checked_by', 'confirmed_by', 'disagreement'].join(',')], unresolved = [];
const stale = [];
claims.forEach((c, i) => {
  const n = String(i + 2), seen = [], yes = [], why = [];
  by.forEach((m, k) => { const r = m[n]; if (!r || !r.verdict) return;
    // A verdict with a stamp counts only for the wording it judged. One without (written before stamps) counts as before.
    if (r.stamp && r.stamp !== stamp(c)) { stale.push(`row ${n}: ${models[k]} read an earlier wording`); return; } seen.push(models[k]);
    const ok = r.verdict === 'confirmed' && CHECKS.every(x => /^(yes|n\.a\.)/i.test(r[x] || ''));
    if (ok) yes.push(models[k]); else why.push(`${models[k]}: ${r.verdict}${r.verdict === 'confirmed' ? ' but ' + CHECKS.filter(x => !/^(yes|n\.a\.)/i.test(r[x] || '')).join('/') + ' not yes' : ''}${r.notes ? ' — ' + r.notes : r.disagreement_reason ? ' — ' + r.disagreement_reason : ''}`); });
  const status = seen.length >= MIN && yes.length === seen.length ? 'agreed' : 'unresolved';
  if (status === 'unresolved') unresolved.push(`row ${n}: ${seen.length < MIN ? `only ${seen.length} of ${MIN} checkers` : why.join(' | ')}`);
  out.push([n, status, q(seen.join(' ')), q(yes.join(' ')), q(why.join(' | '))].join(','));
});
writeFileSync(join(dir, 'consensus.csv'), out.join('\n') + '\n');
console.log(`${dir}: ${claims.length} claims, ${claims.length - unresolved.length} agreed by ${MIN}+ models (${models.join(', ') || 'no checks found'}), ${unresolved.length} unresolved`);
unresolved.slice(0, 60).forEach(u => console.log('  unresolved: ' + u));
stale.forEach(u => console.log('  set aside: ' + u));
