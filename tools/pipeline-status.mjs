// One screen of where every condition is in the content line, and what to do next. Reads files only; changes nothing.
// Run: node tools/pipeline-status.mjs            (all conditions)
//      node tools/pipeline-status.mjs --todo     (also lists guidelines in content/sources with no claims yet)
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
const csv = (t) => { const rows = []; let row = [], f = '', q = false; t = t.replace(/^﻿/, ''); for (let i = 0; i < t.length; i++) { const c = t[i]; if (q) { if (c === '"' && t[i + 1] === '"') { f += '"'; i++; } else if (c === '"') q = false; else f += c; } else if (c === '"') q = true; else if (c === ',') { row.push(f); f = ''; } else if (c === '\n' || c === '\r') { if (c === '\r' && t[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; } else f += c; } if (f || row.length) { row.push(f); rows.push(row); } return rows.filter(r => r.some(x => x.trim())); };
const objs = (p) => { const [h, ...rs] = csv(readFileSync(p, 'utf8')); return rs.map(r => Object.fromEntries(h.map((k, i) => [k.trim().toLowerCase(), (r[i] || '').trim()]))); };
const CHECKS = ['population', 'trigger', 'action', 'strength', 'numbers', 'alternatives', 'exceptions', 'safety'];
const ranges = (ns) => { const out = []; let a = null, b = null; for (const n of ns) { if (b !== null && n === b + 1) b = n; else { if (a !== null) out.push(a === b ? `${a}` : `${a}-${b}`); a = b = n; } } if (a !== null) out.push(a === b ? `${a}` : `${a}-${b}`); return out.join(','); };
const done = new Set(), lines = [];
for (const area of readdirSync('content')) { const ap = join('content', area); if (!statSync(ap).isDirectory() || area === 'sources') continue;
  for (const cond of readdirSync(ap)) { const d = join(ap, cond), cf = join(d, 'claims.csv'); if (!existsSync(cf)) continue;
    const claims = objs(cf), n = claims.length; claims.forEach(c => (c.source.match(/\b(NG|CG)\s?\d+/gi) || []).forEach(g => done.add(g.replace(/\s/g, '').toUpperCase())));
    const writer = existsSync(join(d, 'extraction-record.md')) ? ((readFileSync(join(d, 'extraction-record.md'), 'utf8').match(/writer[^\n]{0,20}?(claude|codex|gpt|gemini|copilot)/i) || [])[1] || '?').toLowerCase() : '?';
    const files = readdirSync(d).filter(f => /^factcheck\.[a-z0-9-]+\.csv$/i.test(f)), per = {}, verdicts = new Map();
    for (const f of files) { const m = f.split('.')[1], rows = objs(join(d, f)); per[m] = rows.length; for (const r of rows) { const ok = r.verdict === 'confirmed' && CHECKS.every(x => /^(yes|n\.a\.)/i.test(r[x] || '')); const v = verdicts.get(+r.row) || []; v.push([m, ok]); verdicts.set(+r.row, v); } }
    const agreed = [], disputed = [], need = {};
    for (let r = 2; r <= n + 1; r++) { const v = verdicts.get(r) || []; if (v.some(x => !x[1])) disputed.push(r); else if (v.length >= 2) agreed.push(r); for (const m of Object.keys(per)) if (!v.some(x => x[0] === m)) (need[m] = need[m] || []).push(r); }
    const missing = Object.entries(need).map(([m, rs]) => `${m} still to check rows ${ranges(rs)}`);
    const next = disputed.length ? `writer fixes rows ${ranges(disputed)}, then both checkers recheck them` : agreed.length === n ? 'done: ready for a story' : files.length < 2 ? `needs ${2 - files.length} more checker(s) that are not the writer (${writer})` : missing.length ? missing.join('; ') : 'done: ready for a story';
    lines.push(`${d}: ${n} claims | writer ${writer} | checks ${Object.entries(per).map(([m, k]) => `${m} ${k}`).join(', ') || 'none'} | agreed ${agreed.length} | disputed ${disputed.length}\n   next: ${next}`); } }
console.log(lines.join('\n'));
if (process.argv.includes('--todo') && existsSync('content/sources/index.csv')) { const idx = objs('content/sources/index.csv').filter(g => !done.has(g.id.toUpperCase())); console.log(`\nGuidelines saved but with no claims yet (${idx.length}):\n` + idx.map(g => `  ${g.id} (${g.recommendations} recs) ${g.title}`).join('\n')); }
