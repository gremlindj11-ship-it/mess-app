// Makes the list Sofia ticks, from claims.csv and factcheck.csv. Never hand-make this list.
// Shows each risky row the way a student would meet it: the claim, WHO it applies to, the numbers, the verdict and the guideline's own words.
// Run: node tools/sofia-check.mjs content/<area> > content/<area>/CHECK-THESE.md
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const csv = (t) => { const rows = []; let row = [], f = '', q = false; t = t.replace(/^﻿/, ''); for (let i = 0; i < t.length; i++) { const c = t[i]; if (q) { if (c === '"' && t[i + 1] === '"') { f += '"'; i++; } else if (c === '"') q = false; else f += c; } else if (c === '"') q = true; else if (c === ',') { row.push(f); f = ''; } else if (c === '\n' || c === '\r') { if (c === '\r' && t[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; } else f += c; } if (f || row.length) { row.push(f); rows.push(row); } return rows.filter(r => r.some(x => x.trim())); };
const objs = (p) => { const [h, ...rs] = csv(readFileSync(p, 'utf8')); return rs.map(r => Object.fromEntries(h.map((k, i) => [k.trim(), (r[i] || '').trim()]))); };
const RISK = /\b(do not|don't|never|avoid|contraindicat|dose|mg|first[- ]line|offer|emergency|immediate|urgent|admit|refer|stop|thromboly|oxygen|NIV|ventilat|drain|anticoag|antibiotic|steroid|adrenaline|target)\b/i;
const area = process.argv[2], out = [];
let total = 0;
for (const t of readdirSync(area).sort()) {
  const c = join(area, t, 'claims.csv'), f = join(area, t, 'factcheck.csv'); if (!existsSync(c) || !existsSync(f)) continue;
  const cl = objs(c), fc = Object.fromEntries(objs(f).map(r => [r.row, r]));
  const pick = cl.map((r, i) => ({ r, n: i + 2, v: (fc[i + 2] || {}).verdict || 'not checked', why: (fc[i + 2] || {}).disagreement_reason || (fc[i + 2] || {}).notes || '' }))
    .filter(x => x.v !== 'confirmed' || x.r.numbers || RISK.test([x.r.subject, x.r.relation, x.r.object, x.r.condition_or_population].join(' ')))
    .sort((a, b) => (a.v === 'confirmed') - (b.v === 'confirmed') || a.n - b.n);
  if (!pick.length) continue;
  out.push(`## ${t.replace(/-/g, ' ')} (${pick.length} of ${cl.length})`, '');
  for (const { r, n, v, why } of pick) {
    out.push(`- [ ] **Row ${n}**${v === 'confirmed' ? '' : ` **${v.toUpperCase()}**${why ? ': ' + why : ''}`}. ${[r.subject, r.relation, r.object].join(' ').replace(/\s+/g, ' ').trim()}.`);
    if (r.condition_or_population) out.push(`  - *Who:* ${r.condition_or_population}`);
    if (r.numbers) out.push(`  - *Numbers:* ${r.numbers}`);
    out.push(`  - *Source:* ${r.source}`, `  > ${r.source_quote.replace(/\s+/g, ' ').trim()}`);
  }
  out.push(''); total += pick.length;
}
console.log(['# Rows to check', '', `**${total} rows.** Tick a row if the claim **with its Who line** says no more and no less than the guideline's words: the same people, trigger, action, strength, numbers, alternatives, exceptions and safety steps. Disputed rows come first.`, '', ...out].join('\n'));
