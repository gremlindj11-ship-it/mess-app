// Saves the text of an open source so statements can be written from it and their quotes checked word for word.
// Run: node tools/fetch-open.mjs <address or PMCID> [--id name] [--from saved-file]
//   https://www.nhs.uk/conditions/...          an NHS website page (Open Government Licence)
//   https://www.gov.uk/guidance/...            a GOV.UK page, read through https://www.gov.uk/api/content/<path>
//   PMC12353784                                an open-access article, full text from Europe PMC
// Writes content/open-sources/<id>.json: address, title, date fetched, date the source was last updated, licence,
// the words that prove the licence, the credit line, and the text as numbered sentences (b3.s2 = block 3, sentence 2).
//
// Rules it enforces:
// - It asks the rights register first (tools/rights.mjs). NICE, BTS, SIGN, GOLD and anything not entered are refused.
// - An article is saved only if its own licence statement is an open one (CC BY or CC0). CC BY-NC and the rest are refused.
// - A site that sends a text-and-data-mining reservation (the TDMRep "tdm-reservation: 1" header) is refused.
// - A sentence that names a body whose guidance a model may not read (NICE, SIGN, BTS, GOLD, the BNF, CKS) is set
//   aside: it is replaced by a marker, so neither the writer nor a checker ever sees another site's summary of it.
// - A table or figure credited to someone else is set aside whole: an article's licence does not cover it.
// legislation.gov.uk is not handled yet.
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { allowFetch, OPEN, ROOT } from './rights.mjs';

const UA = 'mess-fetch-open (https://messmed.co.uk; hello@messmed.co.uk)';
export const SET_ASIDE = '[set aside: names guidance a model may not read]', SET_ASIDE_ART = '[set aside: a table or figure credited to someone else]';
// Bodies marked frozen or link-only in the register whose guidance must not reach a model through someone else's summary.
export const RESTRICTED = /\bNICE\b|National Institute for Health and Care Excellence|\b(?:NG|CG|TA|QS)\s?\d{1,4}\b|\bSIGN\b(?!\s+(?:of|in|for|that|up)\b)|Scottish Intercollegiate|\bBTS\b|British Thoracic Society|\bGOLD\s+(?:20\d\d|report|guideline|strategy|group|stage|criteria)|Global Initiative for Chronic Obstructive|\bBNFC?\b|British National Formulary|\bCKS\b|Clinical Knowledge Summar/;
const CREDITED = /reproduced|reprinted|adapted from|adapted with|with permission|by permission|courtesy of|copyright|©/i;
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ge: '≥', le: '≤', ndash: '–', mdash: '—', times: '×', deg: '°', plusmn: '±', micro: 'µ', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', hellip: '…', pound: '£' };
export const plain = (h) => String(h).replace(/<[^>]+>/g, ' ').replace(/&#x([0-9a-f]+);/gi, (m, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(+n)).replace(/&(\w+);/g, (m, n) => ENT[n] ?? m).replace(/[   ]/g, ' ').replace(/\s+/g, ' ').replace(/\s+([,.;:)\]])/g, '$1').replace(/([(\[])\s+/g, '$1').replace(/\[\s*(?:[,–-]\s*)*\]/g, '').replace(/\s+/g, ' ').trim();
// Sentences: split after . ! ? when a capital, digit or bracket follows, but not after a short form such as "e.g." or "Fig.".
export function sentences(t) {
  const out = []; let cur = '';
  for (const part of t.split(/(?<=[.!?])\s+(?=[A-Z0-9(\[“"‘'])/)) {
    cur = cur ? cur + ' ' + part : part;
    if (/(?:\b(?:e\.g|i\.e|vs|Fig|Figs|et al|cf|approx|Dr|Prof|No|incl|Ref|Refs)\.|\b[A-Z]\.)$/.test(cur)) continue;
    out.push(cur); cur = '';
  }
  if (cur) out.push(cur);
  return out.map(s => s.trim()).filter(Boolean);
}
// Blocks of text become numbered sentences; a sentence naming restricted guidance becomes a marker.
export function number(blocks) {
  let aside = 0, kept = 0;
  const out = blocks.filter(b => b.text).map((b, i) => ({ at: 'b' + (i + 1), path: b.path || '', kind: b.kind || 'p', s: (b.kind === 'aside' ? [SET_ASIDE_ART] : b.kind === 'caption' || b.kind === 'note' ? b.text.replace(/([.!?])\s+[a-z]\s+(?=[A-Z])/g, '$1\n').split('\n').flatMap(sentences) : sentences(b.text)).map(s => { if (s === SET_ASIDE_ART) { aside++; return s; } if (RESTRICTED.test(s)) { aside++; return SET_ASIDE; } kept++; return s; }) }));
  return { blocks: out, set_aside: aside, kept };
}

// HTML (NHS, GOV.UK): headings, paragraphs, list items and table rows, in order.
export function htmlBlocks(html) {
  const blocks = [], path = []; html = html.replace(/<(script|style|nav|svg|form|footer)\b[\s\S]*?<\/\1>/gi, ' ');
  for (const m of html.matchAll(/<(h[1-4]|p|li|tr|summary)\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const tag = m[1].toLowerCase(), text = plain(tag === 'tr' ? m[2].replace(/<\/t[dh]>\s*<t[dh][^>]*>/gi, ' | ') : m[2]); if (!text) continue;
    if (/^h[1-4]$/.test(tag)) { path.length = +tag[1] - 1; path[+tag[1] - 1] = text; continue; }
    blocks.push({ path: path.filter(Boolean).join(' > '), kind: tag, text });
  }
  return blocks;
}
// A journal article in JATS XML (Europe PMC): abstract and body, without references, declarations or citation marks.
const BACK = /^(acknowledge?ments?|author contributions?|funding|data availability( statement)?|ethic(al|s) approval|competing interests?|conflicts? of interest|footnotes?|references|associated data|supplementary (information|material)|publisher.s note|abbreviations|consent.*)$/i;
export function jatsBlocks(xml) {
  const part = (re) => (xml.match(re) || [''])[0];
  let x = part(/<abstract[\s>][\s\S]*?<\/abstract>/) + part(/<body>[\s\S]*<\/body>/);
  x = x.replace(/<xref[^>]*ref-type="bibr"[^>]*>[\s\S]*?<\/xref>/g, '').replace(/<(ref-list|fn-group|inline-formula|disp-formula|graphic|media|object-id)\b[\s\S]*?<\/\1>/g, ' ').replace(/<graphic[^>]*\/>/g, ' ');
  const art = (m, whole) => { const cap = plain((whole.match(/<label>[\s\S]*?<\/label>/) || [''])[0] + ' ' + (whole.match(/<caption>[\s\S]*?<\/caption>/) || [''])[0]), foot = plain((whole.match(/<table-wrap-foot>[\s\S]*?<\/table-wrap-foot>/) || [''])[0]);
    if (CREDITED.test(cap + ' ' + foot)) return `<p data-k="aside">${SET_ASIDE_ART}</p>`;
    const rows = [...whole.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)].map(r => [...r[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/g)].map(c => plain(c[1])).filter(Boolean).join(' | ')).filter(Boolean);
    return (cap ? `<p data-k="caption">${cap}</p>` : '') + rows.map(r => `<p data-k="row">${r.replace(/</g, '&lt;')}</p>`).join('') + (foot ? `<p data-k="note">${foot}</p>` : ''); };
  x = x.replace(/<table-wrap\b[\s\S]*?<\/table-wrap>/g, w => art(null, w)).replace(/<fig\b[\s\S]*?<\/fig>/g, w => art(null, w));
  const blocks = [], path = []; let depth = 0, skip = 0;
  for (const m of x.matchAll(/<(\/?)sec\b[^>]*>|<title>([\s\S]*?)<\/title>|<p\b([^>]*)>([\s\S]*?)<\/p>/g)) {
    if (m[0].startsWith('</sec')) { if (skip === depth) skip = 0; path.length = Math.max(0, --depth); continue; }
    if (m[0].startsWith('<sec')) { depth++; continue; }
    if (m[2] !== undefined) { const t = plain(m[2]); if (depth) { path[depth - 1] = t; path.length = depth; if (!skip && BACK.test(t)) skip = depth; } continue; }
    if (skip) continue;
    const text = plain(m[4]), kind = (m[3].match(/data-k="(\w+)"/) || [])[1] || 'p'; if (text) blocks.push({ path: path.filter(Boolean).join(' > '), kind, text });
  }
  return blocks;
}
// The licence an article states for itself, as an SPDX name, with the words that prove it.
export function jatsLicence(xml) {
  const lic = (xml.match(/<license\b[\s\S]*?<\/license>/) || [''])[0], text = plain(lic), href = (lic.match(/creativecommons\.org\/(licenses|publicdomain)\/([a-z-]+)\/(\d\.\d)/i) || []), words = text.match(/Creative Commons (Attribution[\w\s-]*?)(\d\.\d)? (?:International )?Licen[sc]e/i);
  let id = '';
  if (href[1] === 'publicdomain' || /CC0|public domain dedication/i.test(text)) id = 'CC0-1.0';
  else if (href[2]) id = 'CC-' + href[2].toUpperCase() + '-' + href[3];
  else if (words) { const w = words[1].trim().toLowerCase(); id = /non-?commercial|no ?deriv|share ?alike/.test(w) ? 'CC-BY-' + (/non-?commercial/.test(w) ? 'NC' : '') + (/no ?deriv/.test(w) ? '-ND' : '') + (/share ?alike/.test(w) ? '-SA' : '') : 'CC-BY-' + (words[2] || '4.0'); id = id.replace('--', '-'); }
  if (/non-?commercial/i.test(text) && !/NC/.test(id)) id = 'CC-BY-NC';
  return { id, evidence: text.slice(0, 420) };
}

async function get(url, accept) {
  const s = allowFetch(url), r = await fetch(url, { headers: { 'user-agent': UA, accept } });
  if (!r.ok) throw new Error(`${new URL(url).hostname} said ${r.status} for ${url}`);
  if (/^\s*1\b/.test(r.headers.get('tdm-reservation') || '')) throw new Error(`not saved: ${new URL(url).hostname} reserves text and data mining rights (tdm-reservation: 1). Read its policy and update the rights register.`);
  return { s, text: await r.text() };
}
export async function fetchOpen(target, { id, from } = {}) {
  const today = new Date().toISOString().slice(0, 10); let doc;
  if (/^https?:/.test(target)) allowFetch(target); // the register decides before anything else
  if (/^PMC\d+$/i.test(target)) {
    const pmc = target.toUpperCase(), api = `https://www.ebi.ac.uk/europepmc/webservices/rest/${pmc}/fullTextXML`, { s, text: xml } = from ? { s: allowFetch(api), text: readFileSync(from, 'utf8') } : await get(api, 'application/xml');
    const lic = jatsLicence(xml); if (!OPEN.has(lic.id)) throw new Error(`not saved: ${pmc} states its licence as "${lic.id || 'none found'}", which is not an open licence (${[...OPEN].join(', ')})`);
    const meta = (re) => plain((xml.match(re) || ['', ''])[1]), title = meta(/<article-title[^>]*>([\s\S]*?)<\/article-title>/), journal = meta(/<journal-title[^>]*>([\s\S]*?)<\/journal-title>/), doi = meta(/<article-id pub-id-type="doi">([^<]+)</), pub = xml.match(/<pub-date[^>]*>(?:(?!<\/pub-date>)[\s\S])*?<year>(\d{4})<\/year>/), year = pub ? pub[1] : '';
    const date = (xml.match(/<pub-date[^>]*pub-type="epub"[^>]*>([\s\S]*?)<\/pub-date>/) || xml.match(/<pub-date[^>]*>([\s\S]*?)<\/pub-date>/) || ['', ''])[1], ymd = ['year', 'month', 'day'].map(k => (date.match(new RegExp(`<${k}>(\\d+)</${k}>`)) || [])[1]).filter(Boolean).map((v, i) => i ? v.padStart(2, '0') : v).join('-');
    const authors = [...((xml.match(/<contrib-group\b[\s\S]*?<\/contrib-group>/) || [''])[0]).matchAll(/<surname>([^<]+)<\/surname>(?:\s*<given-names[^>]*>([^<]+)<\/given-names>)?/g)].map(a => a[1] + (a[2] ? ' ' + a[2].split(/\s+/).map(w => w[0]).join('') : '')), who = authors.length > 3 ? authors.slice(0, 3).join(', ') + ' et al' : authors.join(', ');
    doc = { id: id || pmc.toLowerCase(), register: s.id, kind: 'article', url: `https://europepmc.org/article/PMC/${pmc}`, fetched_from: api, doi, title, authors: who, journal, year, updated: ymd, licence: lic.id, licence_evidence: lic.evidence,
      credit: `${who}. ${title}. ${journal}. ${year}. https://doi.org/${doi}. Licensed under ${lic.id.replace(/^CC-BY-/, 'CC BY ').replace('CC0-1.0', 'CC0')}. Reworded by Mess.`, ...number(jatsBlocks(xml)) };
  } else if (/^https:\/\/www\.gov\.uk\//.test(target)) {
    const u = new URL(target), api = 'https://www.gov.uk/api/content' + u.pathname, { s, text } = await get(api, 'application/json'), j = JSON.parse(text), d = j.details || {};
    const html = typeof d.body === 'string' ? d.body : Array.isArray(d.parts) ? d.parts.map(p => `<h2>${p.title}</h2>${p.body}`).join('') : Array.isArray(d.body) ? d.body.map(b => b.content || '').join('') : '';
    if (!html) throw new Error(`not saved: ${target} has no text on the page itself (it may be a list of attached files). Give the address of the HTML document.`);
    doc = { id: id || u.pathname.split('/').filter(Boolean).pop(), register: s.id, kind: 'govuk', url: 'https://www.gov.uk' + (j.base_path || u.pathname), fetched_from: api, title: j.title, updated: (j.public_updated_at || '').slice(0, 10), licence: s.licence, licence_evidence: `${s.licence_url} (${s.checked_how})`, credit: s.credit, applies_to: Object.entries(d.national_applicability || {}).filter(([, v]) => v.applicable).map(([k]) => k), ...number(htmlBlocks(`<h1>${j.title}</h1>` + html)) };
  } else if (/^https:\/\/www\.nhs\.uk\//.test(target)) {
    const { s, text } = await get(target, 'text/html'), main = (text.match(/<main\b[\s\S]*?<\/main>/i) || [text])[0], title = plain((main.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i) || ['', ''])[1]);
    const rev = plain(main).match(/Page last reviewed:\s*(\d{1,2} \w+ \d{4})/), upd = rev ? new Date(rev[1] + ' UTC').toISOString().slice(0, 10) : '';
    const blocks = htmlBlocks(main).filter(b => !/^(Page last reviewed|Next review due|Help us improve|Support links|More in )/i.test(b.text) && !/^(Help us improve|Support links)/i.test(b.path.split(' > ').pop() || ''));
    doc = { id: id || 'nhs-' + new URL(target).pathname.split('/').filter(Boolean).slice(1).join('-'), register: s.id, kind: 'nhs', url: target, fetched_from: target, title, updated: upd, licence: s.licence, licence_evidence: `${s.licence_url} (${s.checked_how})`, credit: s.credit, ...number(blocks) };
  } else throw new Error(`don't know how to save ${target} yet (NHS website pages, GOV.UK pages and PMC articles only)`);
  doc.fetched = today; doc.sha256 = createHash('sha256').update(doc.blocks.map(b => b.s.join('\n')).join('\n\n')).digest('hex');
  const { blocks, set_aside, kept, ...head } = doc;
  return { ...head, sentences: kept, set_aside, blocks };
}
// The text of one or more sentences, by address: "b3.s2", "b3.s2-s4" or "b3" for the whole block. "b3.h" is the heading the
// block sits under (for a list whose meaning is in its heading).
export function quoteAt(doc, at) {
  if (String(at).includes('+')) { const parts = String(at).split('+').map(a => quoteAt(doc, a)); return parts.every(Boolean) ? parts.join(' ') : null; }
  const h = String(at).trim().match(/^(b\d+)\.h$/); if (h) { const b = doc.blocks.find(x => x.at === h[1]), t = b && b.path.split(' > ').pop(); return t && !RESTRICTED.test(t) ? t : null; }
  const m = String(at).trim().match(/^(b\d+)(?:\.s(\d+)(?:-s?(\d+))?)?$/); if (!m) return null;
  const b = doc.blocks.find(x => x.at === m[1]); if (!b) return null;
  const lo = m[2] ? +m[2] : 1, hi = m[3] ? +m[3] : m[2] ? +m[2] : b.s.length; if (lo < 1 || hi > b.s.length || lo > hi) return null;
  return b.s.slice(lo - 1, hi).join(' ');
}

if (process.argv[1] && process.argv[1].endsWith('fetch-open.mjs')) {
  const args = process.argv.slice(2), opt = (k) => args.includes(k) ? args[args.indexOf(k) + 1] : '', target = args.find(a => !a.startsWith('--') && a !== opt('--id') && a !== opt('--from'));
  if (!target) { console.log('Usage: node tools/fetch-open.mjs <NHS or GOV.UK address, or PMCID> [--id name]'); process.exit(2); }
  try { const doc = await fetchOpen(target, { id: opt('--id'), from: opt('--from') }), dir = new URL('content/open-sources/', ROOT); mkdirSync(dir, { recursive: true });
    writeFileSync(new URL(doc.id + '.json', dir), JSON.stringify(doc, null, 1) + '\n');
    console.log(`✓ content/open-sources/${doc.id}.json: "${doc.title.slice(0, 70)}", ${doc.licence}, updated ${doc.updated || 'not stated'}, ${doc.sentences} sentences in ${doc.blocks.length} blocks, ${doc.set_aside} set aside`); }
  catch (e) { console.log('✗ ' + e.message); process.exit(1); }
}
