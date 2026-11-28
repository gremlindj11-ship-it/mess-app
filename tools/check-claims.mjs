// Checks content agents' claims files before anything is written from them.
// Guideline-first: every claim carries source_quote, the exact sentence from the opened source, so a reviewer can
// check claim against quote in seconds. Quotes are internal working notes and are never published in Mess.
// Run: node tools/check-claims.mjs content/respiratory/claims.csv   (or a folder: checks every claims.csv in it)
// Add --story to also check every point of the matching Mess stories is backed by a claim.
// Exit code 1 if any row breaks a rule, so agents fix their file before handing it on.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const COLS = ['topic', 'step', 'subject', 'relation', 'object', 'how_often_or_sure', 'condition_or_population', 'numbers', 'level', 'misconception', 'mechanism_why', 'why_it_matters', 'source', 'source_version', 'source_url', 'source_quote', 'checked_on', 'also_in', 'disagreement', 'jurisdiction', 'status'];
const NEED = ['topic', 'step', 'subject', 'relation', 'object', 'how_often_or_sure', 'level', 'source', 'source_url', 'source_quote', 'checked_on', 'jurisdiction', 'status'];
const STEPS = ['risk factors', 'pathophysiology', 'clinical features', 'consequences', 'investigations', 'management', 'complications', 'differential', 'prognosis', 'prevention', 'mechanism', 'indications', 'side effects', 'cautions', 'interactions', 'monitoring'];
const SURE = ['always', 'most', 'usually', 'often', 'some', 'sometimes', 'rarely', 'never', 'must', 'should', 'may', 'consider', 'do not'];
const STATUS = ['draft', 'sources checked', 'checked by a final-year student', 'checked by a doctor'];
// Sources that can confirm a claim on their own. Revision resources can be listed in also_in, never as the source.
const PRIMARY = /\b(NICE|CKS|BNF|BNFC|SIGN|BTS|UKHSA|Green Book|Resus|Resuscitation Council|GMC|RCOG|RCPCH|RCP|MHRA|WHO|ICMR|NMC|NTEP|MoHFW|CDC|USPSTF|AHA|ACC|IDSA|ATS|ACOG|AAP|GOLD|GINA|ESC|ERS|KDIGO|NIH|FDA|EMA|Cochrane|NEJM|Lancet|BMJ)\b/i;
// Revision sites (listed so the message can say so): 
const SECONDARY = /\b(zero to finals|zerotofinals|geeky ?medics|passmed|passmedicine|quesmed|osmosis|amboss|wikipedia|statpearls|teachmemedicine|teachme)\b/i;

// Topic names come from the app. The public copy has no app, so it carries the names alone in content/topic-names.txt
// (written by tools/export-public.mjs). --names prints that list.
const NAMES = new Set(), appTopics = new URL('../app/assets/topics.js', import.meta.url);
if (existsSync(appTopics)) {
  const topicsSrc = readFileSync(appTopics, 'utf8').split('`');
  for (const l of [...topicsSrc[1].trim().split('\n'), ...topicsSrc[3].trim().split('\n')]) NAMES.add(l.split('|')[0].trim().toLowerCase());
  const curSrc = readFileSync(new URL('../app/assets/curricula.js', import.meta.url), 'utf8');
  for (const m of curSrc.matchAll(/\["([^"]+)",\s*\[/g)) NAMES.add(m[1].toLowerCase());
} else for (const l of readFileSync(new URL('../content/topic-names.txt', import.meta.url), 'utf8').split('\n')) if (l.trim()) NAMES.add(l.trim());
if (process.argv[2] === '--names') { console.log([...NAMES].sort().join('\n')); process.exit(0); }

function csv(text) { const rows = []; let row = [], f = '', q = false; const t = text.replace(/^﻿/, ''); for (let i = 0; i < t.length; i++) { const c = t[i]; if (q) { if (c === '"' && t[i + 1] === '"') { f += '"'; i++; } else if (c === '"') q = false; else f += c; } else if (c === '"') q = true; else if (c === ',') { row.push(f); f = ''; } else if (c === '\n' || c === '\r') { if (c === '\r' && t[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; } else f += c; } if (f || row.length) { row.push(f); rows.push(row); } return rows.filter(r => r.some(x => x.trim())); }

function check(file) {
  const rows = csv(readFileSync(file, 'utf8')), head = (rows.shift() || []).map(h => h.trim().toLowerCase()), errs = [], warns = [];
  const missing = NEED.filter(c => !head.includes(c)); if (missing.length) return { errs: [`missing columns: ${missing.join(', ')} (expected: ${COLS.join(', ')})`], warns, n: rows.length };
  const seen = new Map(), claims = [];
  rows.forEach((r, k) => {
    const o = Object.fromEntries(head.map((h, i) => [h, (r[i] || '').trim()])), at = `row ${k + 2} (${o.topic || '?'})`;
    NEED.forEach(c => { if (!o[c]) errs.push(`${at}: ${c} is empty`); });
    if (o.topic && !NAMES.has(o.topic.toLowerCase())) warns.push(`${at}: "${o.topic}" isn't a Mess topic or curriculum item name. Use the exact name, or say it's a new topic.`);
    if (o.step && !STEPS.includes(o.step.toLowerCase())) errs.push(`${at}: step "${o.step}" should be one of: ${STEPS.join(', ')}`);
    if (o.how_often_or_sure && !SURE.includes(o.how_often_or_sure.toLowerCase())) errs.push(`${at}: how_often_or_sure "${o.how_often_or_sure}" should be one of: ${SURE.join(', ')}`);
    if (o.level && !['core', 'extension'].includes(o.level.toLowerCase())) errs.push(`${at}: level should be core or extension`);
    if (o.status && !STATUS.includes(o.status.toLowerCase())) errs.push(`${at}: status "${o.status}" should be one of: ${STATUS.join(', ')}`);
    if (o.status && /doctor/i.test(o.status)) warns.push(`${at}: marked "checked by a doctor". Only keep that if a doctor really has.`);
    if (o.source && !PRIMARY.test(o.source)) errs.push(`${at}: source "${o.source}" isn't a primary source${SECONDARY.test(o.source) ? ' (it\'s a revision site: put it in also_in)' : ''}. The source must be guidance or research.`);
    if (o.source_url && !/^https:\/\//.test(o.source_url)) errs.push(`${at}: source_url must be an https link`);
    if (o.source_quote && o.source_quote.split(/\s+/).length < 4) errs.push(`${at}: source_quote must be the exact sentence from the opened source that supports this claim`);
    if (o.source_quote && o.source_quote.split(/\s+/).length > 260) warns.push(`${at}: source_quote is over 260 words; quote the recommendation that carries the fact, not the whole section`);
    if (o.source_quote && !/[.:;)\]]\s*$/.test(o.source_quote.trim())) warns.push(`${at}: source_quote seems cut off mid-sentence; quote the whole recommendation so no branch or exception is lost`);
    if (o.condition_or_population && o.condition_or_population.trim().length > 3) { const cl = [o.subject, o.relation, o.object].join(' ').toLowerCase(), first = o.condition_or_population.split(/[;,]/)[0].toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length > 3 && !/^(with|without|people|patients|those|that|when|where|from|have|been)$/.test(w)); if (first.length && !first.some(w => cl.includes(w))) warns.push(`${at}: who it applies to ("${o.condition_or_population.split(/[;,]/)[0].trim().slice(0, 60)}") isn't in the claim sentence. Claims must stand alone: put the population in the sentence`); }
    // Strength: a guideline's own "should be considered" (BTS, SIGN) is stronger than "can be considered" (NICE's "Consider"). Both checkers disputed this in round 1, and missed it on three rows.
    if (o.source_quote && /should be considered/i.test(o.source_quote)) { const cl = [o.subject, o.relation, o.object].join(' '); if (/can be considered/i.test(cl) && !/should be considered/i.test(cl)) warns.push(`${at}: strength: the quote says "should be considered" but the claim says "can be considered". Keep the guideline's own words`); }
    if (o.also_in && /passmed|zero ?to ?finals|geeky ?medics/i.test(o.also_in)) warns.push(`${at}: a revision site is listed: make sure the claim and its wording stand on the guideline quote alone`);
    if (o.checked_on && !/^\d{4}-\d{2}-\d{2}$/.test(o.checked_on)) errs.push(`${at}: checked_on should be YYYY-MM-DD`);
    if (o.jurisdiction && !/^(all|global|LMIC|high-income|Europe|North America|Latin America|sub-Saharan Africa|South Asia|[A-Z]{2})(\s*[,;]\s*([A-Z]{2}|global|LMIC|high-income|Europe|North America|Latin America|sub-Saharan Africa|South Asia))*$/.test(o.jurisdiction)) errs.push(`${at}: jurisdiction should be "all", "global", a region (LMIC, high-income, Europe, North America, Latin America, sub-Saharan Africa, South Asia) or country codes like UK, IN, US`);
    if (/\b(patient|mr|mrs|ms)\s+[A-Z][a-z]+/.test([o.subject, o.object].join(' '))) warns.push(`${at}: looks like it names a person. No patient details.`);
    const words = [o.subject, o.relation, o.object].join(' ').split(/\s+/).length; if (words > 110) warns.push(`${at}: very long for one claim (${words} words). One recommendation per row.`);
    // Every number in the claim must appear in its quote (Fable: extraction errors are mostly numbers and thresholds).
    // Digits that are part of a name (alpha-1, beta-2, FEV1, PaO2, CO2) aren't quantities, so they're left out on both sides.
    const nums = (t) => (String(t).replace(/(?<![A-Za-z])(?:alpha|beta|[αβ]|FEV|PaO|PaCO|PCO|PO|SaO|SpO|CO|HbA)[- ]?\d(?!\d)/gi, ' ').replace(/(\d),(\d{3})/g, '$1$2').match(/\d+(?:[.·]\d+)?/g) || []).map(x => x.replace('·', '.'));
    if (o.source_quote) { const inQ = new Set(nums(o.source_quote)), miss = [...new Set(nums([o.subject, o.relation, o.object, o.numbers, o.condition_or_population].join(' ')))].filter(x => !inQ.has(x)); if (miss.length) errs.push(`${at}: ${miss.join(', ')} ${miss.length === 1 ? 'is' : 'are'} in the claim but not in source_quote. Numbers must come from the quote.`); }
    claims.push(o);
    const key = [o.topic, o.subject, o.relation, o.object, o.jurisdiction].join('|').toLowerCase(); if (seen.has(key)) warns.push(`${at}: same claim as row ${seen.get(key)}`); else seen.set(key, k + 2);
  });
  // Coverage: with --story, every point of that topic's Mess story should be backed by a claim.
  if (STORY_FLAG) { const words = (t) => new Set(String(t).toLowerCase().replace(/\[[^\]]*\]/g, ' ').match(/[a-z0-9]{4,}/g) || []);
    const byTopic = {}; claims.forEach(c => { (byTopic[c.topic.toLowerCase()] = byTopic[c.topic.toLowerCase()] || []).push(words([c.subject, c.relation, c.object, c.condition_or_population, c.numbers].join(' '))); });
    Object.entries(STORIES).forEach(([n, st]) => { const cs = byTopic[n.toLowerCase()]; if (!cs) return; (st.steps || []).forEach(step => [...(step.pts || []), ...(step.more || [])].forEach(p => { const t = typeof p === 'string' ? p : p && p.t; if (!t) return; const w = words(t); if (!w.size) return; const best = Math.max(...cs.map(c => [...w].filter(x => c.has(x)).length / w.size)); if (best < .4) warns.push(`story ${n}, ${step.h}: no claim clearly backs "${t.replace(/\s*\[[^\]]+\]\s*$/, '').slice(0, 90)}"`); })); }); }
  return { errs, warns, n: rows.length };
}

const STORY_FLAG = process.argv.includes('--story');
let STORIES = {}; if (STORY_FLAG) { const fz = new URL('../app/assets/frozen.js', import.meta.url), src = readFileSync(new URL('../app/assets/stories.js', import.meta.url), 'utf8') + '\nconst NOTES = {};\n' + (existsSync(fz) ? readFileSync(fz, 'utf8') : ''); STORIES = new Function(src + '\nreturn STORIES;')(); }
const arg = process.argv.slice(2).find(a => !a.startsWith('--')); if (!arg || !existsSync(arg)) { console.log('Usage: node tools/check-claims.mjs <claims.csv or folder>'); process.exit(2); }
const files = statSync(arg).isDirectory() ? readdirSync(arg, { recursive: true }).filter(f => /claims\.csv$/.test(f)).map(f => join(arg, f)) : [arg];
let bad = 0;
for (const f of files) { const r = check(f); console.log(`${r.errs.length ? '✗' : '✓'} ${f}: ${r.n} claims, ${r.errs.length} to fix, ${r.warns.length} to look at`); r.errs.slice(0, 50).forEach(e => console.log('  fix: ' + e)); r.warns.slice(0, 30).forEach(w => console.log('  look: ' + w)); if (r.errs.length) bad++; }
process.exit(bad ? 1 : 0);
