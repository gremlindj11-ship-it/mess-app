// The rights register, for tools. content/rights.json lists every source with its licence and whether a model
// may read it. Anything that fetches a page or saves source text asks here first, so the rule is in the code
// and not only in people's heads.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

export const ROOT = new URL('../', import.meta.url);
export const REGISTER = JSON.parse(readFileSync(new URL('content/rights.json', ROOT), 'utf8'));
export const OPEN = new Set(REGISTER.open_licences);
const host = (url) => { try { return new URL(url).hostname.toLowerCase(); } catch (e) { return ''; } };

// The register entry for a statement's source: by its label first (so "BTS/ICS ..." on a journal's site is BTS), then by its link.
export function sourceFor({ label = '', url = '' } = {}) {
  const l = String(label).trim(), h = host(url);
  return (l && REGISTER.sources.find(s => (s.labels || []).some(p => new RegExp(p, 'i').test(l)))) || (h && REGISTER.sources.find(s => (s.hosts || []).includes(h))) || null;
}
export const byId = (id) => REGISTER.sources.find(s => s.id === id) || null;
export const mayWrite = (s) => !!s && s.use === 'write' && (s.ai_input === 'yes' || s.ai_input === 'per-item');

// Call before any script fetches a page whose text will be saved or shown to a model. Throws with the reason.
export function allowFetch(url) {
  const h = host(url), s = sourceFor({ url });
  if (!h || !/^https:/.test(url)) throw new Error(`not fetched: ${url} is not an https address`);
  if (!s) throw new Error(`not fetched: ${h} is not in the rights register (content/rights.json). Read its terms, add it, then try again.`);
  if (!mayWrite(s)) throw new Error(`not fetched: ${s.name} is marked "${s.use}" in the rights register (a model may read it: ${s.ai_input}). ${s.use === 'frozen' ? 'Nothing more is made from it until its owner says yes in writing.' : 'It is link only.'}`);
  return s;
}
// Saved copies of frozen sources (content/sources/) are not to be read into anything new.
export function refuseFrozenFile(path) {
  if (/(^|[\\/])content[\\/]sources[\\/]/.test(String(path).replace(/^\.\//, ''))) throw new Error(`not used: ${path} holds text from a frozen source. Nothing more is made from it until its owner says yes in writing (content/rights.json).`);
}
// Call before rows are sent to a model, or put in a packet for one to read (a claims check, a story check, a question check).
// Each row has `source` and `source_url`, as in a claims file. Rows that name no source at all are left to the caller.
// Prints the reason and stops the tool: a frozen or link-only source's words go no further, and neither does anything written from them.
export function allowSend(rows, doing) {
  const bad = new Map();
  for (const r of rows) { if (!r.source && !r.source_url) continue; const s = sourceFor({ label: r.source, url: r.source_url }); if (mayWrite(s)) continue;
    const why = s ? `${s.name} is marked "${s.use}" in the rights register` : `"${String(r.source || r.source_url).slice(0, 40)}" is not in the rights register`; bad.set(why, (bad.get(why) || 0) + 1); }
  if (!bad.size) return;
  console.log(`✗ Not sent: the rights register (content/rights.json) does not allow a model to read these, so this will not ${doing}.`);
  for (const [why, n] of bad) console.log(`  ${n} row${n > 1 ? 's' : ''}: ${why}`);
  console.log('  Nothing was sent and no packet was written.'); process.exit(1);
}
// The same id tools/build-evidence.mjs gives a claim, so a frozen statement can be recognised wherever it is.
export const claimId = (c) => 'claim-' + createHash('sha256').update([c.topic, c.step, c.subject, c.relation, c.object, c.jurisdiction].join('\u001f')).digest('hex').slice(0, 16);
export function csv(text) { const rows = []; let row = [], f = '', q = false; const t = text.replace(/^﻿/, ''); for (let i = 0; i < t.length; i++) { const c = t[i]; if (q) { if (c === '"' && t[i + 1] === '"') { f += '"'; i++; } else if (c === '"') q = false; else f += c; } else if (c === '"') q = true; else if (c === ',') { row.push(f); f = ''; } else if (c === '\n' || c === '\r') { if (c === '\r' && t[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; } else f += c; } if (f || row.length) { row.push(f); rows.push(row); } return rows.filter(r => r.some(x => x.trim())); }
export const objs = (text) => { const [h, ...rs] = csv(text); return rs.map(r => Object.fromEntries((h || []).map((k, i) => [k.trim().toLowerCase(), (r[i] || '').trim()]))); };

// What a checker judged: a short fingerprint of a statement's wording and its quote. A verdict carries the stamp of the
// wording it read, so a statement reworded after it was checked counts as unchecked again (tools/consensus.mjs).
export const stamp = (c) => createHash('sha256').update([c.subject, c.relation, c.object, c.source_quote].map(x => String(x || '').replace(/\s+/g, ' ').trim()).join('\u001f')).digest('hex').slice(0, 12);
// A folder's rows: open-source statements (statements.csv) where there are any, otherwise the old claims (claims.csv).
export const rowsFile = (dir) => existsSync(join(dir, 'statements.csv')) ? 'statements.csv' : 'claims.csv';
