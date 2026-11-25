// Finding and reading open sources, for whoever writes statements (content/README.md, "Writing from open sources").
//   node tools/find-open.mjs search "heart failure" [--n 15]   open-access articles on Europe PMC that say they are CC BY,
//                                                         general reviews first; then save one with tools/fetch-open.mjs <PMCID>
//   node tools/find-open.mjs nhs "heart failure"            the NHS website address to try for a topic
//   node tools/find-open.mjs show <source-id> [from to]     a saved source, one sentence per line with its address (b3.s2),
//                                                         set-aside sentences hidden; from/to are block numbers
// The search's licence column is Europe PMC's metadata. fetch-open.mjs reads the licence from the article itself and
// refuses anything else, so a wrong label here costs a refused fetch, never a wrong source.
import { readFileSync, existsSync } from 'node:fs';
import { SET_ASIDE, SET_ASIDE_ART } from './fetch-open.mjs';
const [what, a1, ...rest] = process.argv.slice(2), opt = (k) => { const i = rest.indexOf(k); return i >= 0 ? rest[i + 1] : null; };
if (what === 'search') {
  const t = String(a1 || '').replace(/"/g, ''), q = `TITLE:"${t}" AND LICENSE:"cc by" AND OPEN_ACCESS:y AND FIRST_PDATE:[2019-01-01 TO 2026-12-31] AND (PUB_TYPE:"review" OR TITLE:"review" OR TITLE:"position statement" OR TITLE:"guideline" OR TITLE:"overview" OR TITLE:"for the generalist" OR TITLE:"update") AND NOT TITLE:"protocol" AND NOT TITLE:"case report" AND NOT TITLE:"meta-analysis"`;
  const u = 'https://www.ebi.ac.uk/europepmc/webservices/rest/search?' + new URLSearchParams({ query: q, format: 'json', pageSize: String(Number(opt('--n')) || 15), sort: 'CITED desc', resultType: 'core' });
  const r = await fetch(u).catch(e => ({ ok: false, statusText: e.message })); if (!r.ok) { console.log(`Europe PMC did not answer (${r.status || ''} ${r.statusText}). From a shell: curl -s "${u}"`); process.exit(1); }
  const d = await r.json(); console.log(`${d.hitCount} found for "${t}". Prefer a UK or European society statement or a general review over a narrow one. Save with: node tools/fetch-open.mjs <PMCID>`);
  for (const x of d.resultList.result) console.log(`${x.pmcid || '-'}  ${x.license || '?'}  ${x.pubYear}  cited ${x.citedByCount}  ${(x.journalInfo?.journal?.title || '').slice(0, 30)}  |  ${x.title}`);
} else if (what === 'nhs') {
  const slug = String(a1 || '').toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  console.log(`https://www.nhs.uk/conditions/${slug}/  (if it 404s, search https://www.nhs.uk/search for the right page; save with node tools/fetch-open.mjs <address>)`);
} else if (what === 'show') {
  const f = new URL(`../content/open-sources/${a1}.json`, import.meta.url); if (!a1 || !existsSync(f)) { console.log(`No saved source "${a1}" in content/open-sources/`); process.exit(1); }
  const d = JSON.parse(readFileSync(f, 'utf8')), [from, to] = [a1 && rest[0], rest[1]].map(Number); let last = null;
  console.log(`${d.title} (${d.licence}, updated ${d.updated}). Address each statement by its sentence: b3.s2, b3.s2-s4, b3 (whole block), b3.h (heading), joined with +.`);
  for (const b of d.blocks) { const n = +b.at.slice(1); if ((from && n < from) || (to && n > to)) continue; if (b.path !== last) { console.log(`## ${b.path}`); last = b.path; }
    b.s.forEach((s, i) => { if (s !== SET_ASIDE && s !== SET_ASIDE_ART) console.log(`${b.at}${b.s.length > 1 ? '.s' + (i + 1) : ''}${b.kind !== 'p' ? ' (' + b.kind + ')' : ''} ${s}`); }); }
} else { console.log(readFileSync(new URL(import.meta.url), 'utf8').split('\n').filter(l => l.startsWith('//')).join('\n')); process.exit(what ? 2 : 0); }
