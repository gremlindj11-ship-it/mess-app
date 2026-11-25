// Build a topic's story from its agreed claims. A story never holds a fact of its own: every point names
// the claim row it comes from, and this tool refuses a row that two checkers have not agreed.
//
// Source: content/<area>/<condition>/story.json  (written with story-plan.md beside it)
// Output: that topic's entry in app/assets/stories.js, between "// built:<topic>" markers.
//
// Run:  node tools/build-story.mjs content/<area>/<condition>          build one and write it
//       node tools/build-story.mjs content                             build every story.json found
//       add --check to change nothing: exit 1 if anything is wrong or app/assets/stories.js is out of date
//
// story.json:
// { "topic": "Exact Mess topic name", "shape": "mechanism|presentation|comparison|emergency|drug",
//   "from": "NICE NG196", "covers": "It covers ...", "not_covered": "It does not cover ...",
//   "idea": "One or two sentences everything hangs off", "idea_rows": [2, 3],
//   "steps": [ { "h": "Heading", "bridge": "How this follows from the last step",
//       "pts":  [ { "row": 16, "short": "Shorter wording", "why": "Why it matters" },   full wording = the claim itself
//                 { "row": 21, "kind": "wrong" } ],                                    "Often thought ... In fact ..."
//       "more": [ { "row": 7, "kind": "aid", "text": "Memory aid ..." }, { "row": 9 } ],
//       "table": { "cap": "", "head": ["", ""], "rows": [["", ""]], "claims": [16, 17] },
//       "flow":  { "cap": "", "claims": [55, 56], "steps": [ { "t": "A box" }, { "ask": "A question?", "paths": [ { "if": "Yes", "then": "What happens" }, { "if": "No" } ] } ] } } ],
//   "remember": ["", "", ""], "writer": "claude", "tag": "BTS pleural 2023", "tags": { "20": "C2" },
//   "gaps": [ { "t": "What no open source covers yet", "url": "https://... where to read it (link only)" } ] }
//
// Open sources: a folder with statements.csv (content/open/<topic>/) builds the same way. Each point is tagged with its
// source's short name, the story lists every source it used with the credit line its licence asks for, and "gaps"
// names what no open source covered. The status line says the points were checked against their sources, not a guideline.
//
// A story goes into the app only once a model that is not its writer has confirmed every summary. Until then
// "node tools/build-story.mjs <dir>" builds and checks it but leaves the app alone (--draft writes it anyway, for a
// local look only; the tests refuse a story in the app that nobody has read).
//
// "writer" is the model that wrote story.json. It never checks its own story (tools/ai-factcheck.mjs --story).
//
// "tag" and "tags" are only for sources without NICE-style numbers: the source tag shown is "<tag> <tags[row]>".
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { rowsFile, sourceFor } from './rights.mjs';

const csv = (t) => { const rows = []; let row = [], f = '', q = false; t = t.replace(/^﻿/, ''); for (let i = 0; i < t.length; i++) { const c = t[i]; if (q) { if (c === '"' && t[i + 1] === '"') { f += '"'; i++; } else if (c === '"') q = false; else f += c; } else if (c === '"') q = true; else if (c === ',') { row.push(f); f = ''; } else if (c === '\n' || c === '\r') { if (c === '\r' && t[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; } else f += c; } if (f || row.length) { row.push(f); rows.push(row); } return rows.filter(r => r.some(x => x.trim())); };
const objs = (p) => { const [h, ...rs] = csv(readFileSync(p, 'utf8')); return rs.map(r => Object.fromEntries(h.map((k, i) => [k.trim().toLowerCase(), (r[i] || '').trim()]))); };
const SHAPES = ['mechanism', 'presentation', 'comparison', 'emergency', 'drug'];
const LONG = 190;        // a point longer than this needs a short version (Sofia, 17 Nov 2026: short points, detail one tap away)
const MAX_PTS = 6;       // points showing in a step before "Go deeper" (short steps: Mayer's segmenting)
const MAX_AIDS = 2;      // memory aids in a story
const sentence = (o) => [o.subject, o.relation, o.object].join(' ').replace(/\s+;/g, ';').replace(/\s+/g, ' ').trim().replace(/[.;]\s*$/, '');
const lcfirst = (s) => /^[A-Z][a-z]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s;
const words = (s) => String(s).split(/\s+/).filter(Boolean).length;
// Numbers carry meaning. A summary may leave one out, but it may not bring one in.
const nums = (s) => new Set((String(s).replace(/CHA2DS2-VASc/gi, '').match(/\d+(?:[.,/]\d+)*/g) || []).map(x => x.replace(/,/g, '')));
// Strength words, strongest reading first. A summary may not use one its claim does not.
const STRENGTH = [['should not', /\b(should|must) not\b|\bdo not\b/i], ['can be considered', /\b(can|may) be considered\b/i], ['should be considered', /\bshould be considered\b/i], ['may', /\bmay\b(?! be considered)/i], ['should', /\b(should|must)\b(?! not)(?! be considered)/i]];
const strengths = (s) => new Set(STRENGTH.filter(([, re]) => re.test(s)).map(([k]) => k));

function build(dir) {
  const errs = [], looks = [], E = (m) => errs.push(m), L = (m) => looks.push(m);
  const sp = join(dir, 'story.json');
  let st; try { st = JSON.parse(readFileSync(sp, 'utf8')); } catch (e) { return { dir, errs: [`story.json won't parse: ${e.message}`], looks }; }
  const rf = rowsFile(dir), open = rf === 'statements.csv';
  for (const f of [rf, 'consensus.csv']) if (!existsSync(join(dir, f))) return { dir, errs: [`${f} is missing, so no row can be shown to be agreed`], looks };
  const claims = objs(join(dir, rf)), cons = new Map(objs(join(dir, 'consensus.csv')).map(c => [Number(c.row), c.status]));
  const claim = (row, where) => { const c = claims[row - 2]; if (!Number.isInteger(row) || !c) { E(`${where}: there is no claim row ${row}`); return null; } if (!c.source_quote) { E(`${where}: row ${row} has no quote`); return null; } if (cons.get(row) !== 'agreed') E(`${where}: row ${row} is not agreed by two checkers (${cons.get(row) || 'not checked'}), so it can't be in a story`); return c; };
  // Open sources: each statement names its saved source (content/open-sources/<id>.json), which carries the credit line.
  const srcs = new Map(), srcFile = (id) => { if (!srcs.has(id)) { const f = new URL(`../content/open-sources/${id}.json`, import.meta.url); srcs.set(id, existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null); } return srcs.get(id); };
  const shortOf = (c) => { const j = srcFile(c.source_id); if (!j) { E(`row ${claims.indexOf(c) + 2}: its source ${c.source_id || '(none)'} is not saved in content/open-sources`); return c.source_id || '?'; } return j.kind === 'article' ? `${(j.authors || '').split(/\s+/)[0]} ${j.year}` : j.kind === 'nhs' ? 'NHS' : 'GOV.UK'; };

  // Stories written from a frozen source (NICE, BTS, SIGN, GOLD) live in app/assets/frozen.js as they stood at the stop. They are never rebuilt.
  if (claims.some(c => (sourceFor({ label: c.source, url: c.source_url }) || {}).use === 'frozen')) return { dir, frozen: true, errs, looks };
  // The thinking comes first: a story plan that answers all eight questions.
  const plan = existsSync(join(dir, 'story-plan.md')) ? readFileSync(join(dir, 'story-plan.md'), 'utf8') : '';
  if (!plan) E('story-plan.md is missing: write the plan before the story'); else for (let i = 1; i <= 8; i++) if (!new RegExp(`^${i}\\.\\s+\\*\\*[^*]+\\*\\*\\s*\\S`, 'm').test(plan)) E(`story-plan.md has no answer to question ${i}`);

  if (!/^[a-z0-9-]+$/.test(st.writer || '')) E('no "writer" (the model that wrote this story, for example "claude"), so nobody can tell which model must not check it');
  if (!st.topic) E('no "topic"'); if (!SHAPES.includes(st.shape)) E(`"shape" must be one of ${SHAPES.join(', ')}`);
  if (!st.from) E(`no "from" (${open ? 'the open sources' : 'the guideline'} the story is written from)`); if (!st.covers || !st.not_covered) E('"covers" and "not_covered" are both needed, so the status line is honest about gaps');
  if (!st.idea) E('no "idea"'); else if (words(st.idea) > 75) L(`the big idea is ${words(st.idea)} words; aim for under 75`);
  if (!Array.isArray(st.idea_rows) || !st.idea_rows.length) E('"idea_rows" must list the claim rows the big idea rests on');
  if (!Array.isArray(st.remember) || st.remember.length < 2 || st.remember.length > 3) E('"remember" needs 2 or 3 lines');
  if (!Array.isArray(st.steps) || st.steps.length < 3) { E('a story needs at least 3 steps'); return { dir, errs, looks }; }

  const used = new Set(), tagOf = (row, c) => open ? shortOf(c) : st.tag ? `${st.tag}${(st.tags || {})[row] ? ' ' + st.tags[row] : ''}` : c.source.replace(/\s*\+heading\s*$/i, '');
  let aids = 0, visuals = 0, wrongs = 0; const story_extra = {};
  // Everything in the story that is Mess's own wording and not a claim word for word. A second model reads these against their claims.
  const items = [], item = (kind, text, rows) => items.push({ kind, summary: text, claims: [...new Set(rows)].map(r => claims[r - 2]).filter(Boolean).map(c => ({ claim: sentence(c), guideline_quote: c.source_quote })) });
  const point = (p, where, main) => {
    const c = claim(p.row, where); if (!c) return null; used.add(p.row);
    const full = sentence(c), tag = ` [${tagOf(p.row, c)}]`, n = nums(full + ' ' + c.source_quote), s = strengths(full);
    const summary = (text, what) => { for (const x of nums(text)) if (!n.has(x)) E(`${where}, row ${p.row}: the ${what} has the number ${x}, which is not in the claim`); for (const x of strengths(text)) if (!s.has(x)) E(`${where}, row ${p.row}: the ${what} says "${x}" but the claim does not. Keep the claim's strength`); if (s.has('should not') && s.size === 1 && !/\bnot\b/i.test(text)) E(`${where}, row ${p.row}: the claim says "should not" and the ${what} has lost the "not"`); };
    if (p.kind === 'wrong') { wrongs++;
      if (!c.misconception) { E(`${where}, row ${p.row}: "often got wrong" needs the claim's misconception column filled from a source. The story never invents a wrong idea`); return null; }
      return `Often thought: ${lcfirst(c.misconception.replace(/\.\s*$/, ''))}. In fact, ${lcfirst(full)}${tag}`; }
    if (p.kind === 'aid') { aids++; if (main) E(`${where}, row ${p.row}: a memory aid goes under "more" (Go deeper), after the explanation`); if (!p.text || !/^Memory aid/.test(p.text)) { E(`${where}, row ${p.row}: a memory aid needs "text" starting "Memory aid"`); return null; } summary(p.text, 'memory aid'); item('memory aid', p.text, [p.row]); return p.text + tag; }
    if (p.why && p.why !== c.why_it_matters && p.why !== c.mechanism_why) L(`${where}, row ${p.row}: the "why" line is not the claim's own why_it_matters or mechanism_why text, so read it against the quote`);
    if (p.short) { summary(p.short, 'short version'); item('short version of one claim', p.short, [p.row]); if (p.short.length >= full.length) L(`${where}, row ${p.row}: the short version is no shorter than the claim`); if (p.short.length > LONG) L(`${where}, row ${p.row}: the short version is ${p.short.length} characters; aim for under ${LONG}`);
      return { t: p.short + tag, full, ...(p.why ? { why: p.why } : {}) }; }
    if (main && full.length > LONG) E(`${where}, row ${p.row}: the claim is ${full.length} characters, so it needs a "short" version (the whole claim stays one tap away)`);
    return p.why ? { t: full + tag, why: p.why } : full + tag;
  };
  const cellCheck = (cells, rows, where) => { const pool = rows.map(r => claim(r, where)).filter(Boolean); if (!pool.length) return; rows.forEach(r => used.add(r)); const n = nums(pool.map(c => sentence(c) + ' ' + c.source_quote).join(' ')), s = new Set(pool.flatMap(c => [...strengths(sentence(c))]));
    for (const t of cells) { for (const x of nums(t)) if (!n.has(x)) E(`${where}: "${t.slice(0, 50)}" has the number ${x}, which is in none of its claims`); for (const x of strengths(t)) if (!s.has(x)) E(`${where}: "${t.slice(0, 50)}" says "${x}" but none of its claims does`); } };
  const srcOf = (rows) => { const cs = rows.map(r => claims[r - 2]).filter(Boolean); if (open) return [...new Set(cs.map(shortOf))].join('; '); if (st.tag) { const refs = [...new Set(rows.map(r => (st.tags || {})[r]).filter(Boolean))]; return st.tag + (refs.length ? ' ' + refs.join(', ') : ''); } const parts = cs.map(c => c.source.replace(/\s*\+heading\s*$/i, '')), pre = (parts[0] || '').replace(/\s+\S+$/, ''); return parts.every(x => x.startsWith(pre + ' ')) ? pre + ' ' + parts.map(x => x.slice(pre.length + 1)).join(', ') : parts.join('; '); };

  const steps = st.steps.map((s, k) => { const where = `step ${k + 1} "${s.h || '?'}"`, o = {};
    if (!s.h) E(`${where}: no heading`); o.h = s.h; if (k && !s.bridge) E(`${where}: no "bridge" saying how it follows from the step before`); if (s.bridge) o.bridge = s.bridge;
    if (!Array.isArray(s.pts) || !s.pts.length) { E(`${where}: no points`); return o; }
    if (s.pts.length > MAX_PTS) E(`${where}: ${s.pts.length} points showing. At most ${MAX_PTS}: move the rest under "more" or split the step`);
    o.pts = s.pts.map(p => point(p, where, true)).filter(Boolean); if (Array.isArray(s.more) && s.more.length) o.more = s.more.map(p => point(p, where + ' (more)', false)).filter(Boolean);
    if (s.table) { visuals++; const t = s.table; if (!t.cap || !Array.isArray(t.head) || t.head.length < 2 || t.head.length > 4 || !Array.isArray(t.rows) || !t.rows.length || t.rows.some(r => !Array.isArray(r) || r.length !== t.head.length) || !Array.isArray(t.claims) || !t.claims.length) E(`${where}: the table needs "cap", 2 to 4 "head" columns, "rows" of the same width, and "claims"`); else { cellCheck(t.rows.flat(), t.claims, where + ' table'); o.table = { cap: t.cap, head: t.head, rows: t.rows, src: srcOf(t.claims) }; item('table', `${t.cap}. Columns: ${t.head.join(' | ')}. ` + t.rows.map(r => r.join(' | ')).join('. '), t.claims); } }
    if (s.flow) { visuals++; const f = s.flow; if (!f.cap || !Array.isArray(f.steps) || f.steps.length < 2 || f.steps.length > 8 || !Array.isArray(f.claims) || !f.claims.length || f.steps.some(x => !(x.t || (x.ask && Array.isArray(x.paths) && x.paths.length >= 1 && x.paths.length <= 4 && x.paths.every(p => p.if))))) E(`${where}: the diagram needs "cap", "claims", and 2 to 8 "steps", each a box { "t" } or a question { "ask", "paths": [{ "if", "then" }] }`); else { cellCheck(f.steps.flatMap(x => x.t ? [x.t] : [x.ask, ...x.paths.flatMap(p => [p.if, p.then || ''])]), f.claims, where + ' diagram'); o.flow = { cap: f.cap, steps: f.steps.map(x => x.t ? { t: x.t } : { ask: x.ask, paths: x.paths.map(p => ({ if: p.if, ...(p.then ? { then: p.then } : {}) })) }), src: srcOf(f.claims) }; item('diagram, read top to bottom', `${f.cap}. ` + f.steps.map(x => x.t ? `Box: ${x.t}` : `Question: ${x.ask} ` + x.paths.map(p => `If ${p.if}: ${p.then || 'carry on to the next step'}`).join('; ')).join('. '), f.claims); } }
    if (s.bridge) item('linking line between two steps', s.bridge, s.pts.map(p => p.row).filter(r => claims[r - 2]));
    return o; });
  if (aids > MAX_AIDS) E(`${aids} memory aids. At most ${MAX_AIDS} a story: keep them for lists with no logic to them`);
  if (!visuals) L('no table or diagram. If the plan (question 7) names one, build it');
  const ideaPool = (st.idea_rows || []).map(r => claim(r, 'the big idea')).filter(Boolean), allN = nums([...used].map(r => sentence(claims[r - 2]) + ' ' + claims[r - 2].source_quote).join(' '));
  if (ideaPool.length) { const n = nums(ideaPool.map(c => sentence(c) + ' ' + c.source_quote).join(' ')); for (const x of nums(st.idea || '')) if (!n.has(x)) E(`the big idea has the number ${x}, which is in none of its idea_rows`); }
  for (const [i, r] of (st.remember || []).entries()) for (const x of nums(r)) if (!allN.has(x)) E(`"remember" line ${i + 1} has the number ${x}, which is in no claim the story uses`);
  // Guess first, explain later (story.js): one question before reading and one to explain a week later. Their
  // answer, why line and checklist are Mess's own wording, so they are read like any other summary.
  if (st.predict) { const p = st.predict, ok = p.q && Array.isArray(p.opts) && p.opts.length >= 2 && p.opts.length <= 4 && Number.isInteger(p.a) && p.opts[p.a] && Number.isInteger(p.step) && steps[p.step] && Array.isArray(p.rows) && p.rows.length;
    if (!ok) E('"predict" needs "q", 2 to 4 "opts", "a" (the right option\'s index), "step" (where the story answers it) and "rows"');
    else { cellCheck([p.opts[p.a], p.why || ''], p.rows, 'the guess-first answer'); item('the guess-first question and its right answer', `${p.q} Answer: ${p.opts[p.a]}. ${p.why || ''}`.trim(), p.rows); story_extra.predict = { q: p.q, opts: p.opts, a: p.a, step: p.step, ...(p.why ? { why: p.why } : {}) }; } }
  if (st.explain) { const e = st.explain; if (!e.q || !Array.isArray(e.check) || e.check.length < 2 || e.check.length > 4 || !Array.isArray(e.rows) || !e.rows.length) E('"explain" needs "q", 2 to 4 "check" lines and "rows"');
    else { cellCheck(e.check, e.rows, 'the explain checklist'); item('the explain-later question and the points a good answer covers', `${e.q} A good answer covers: ${e.check.join('; ')}.`, e.rows); story_extra.explain = { q: e.q, check: e.check }; } }
  const mainRows = st.steps.flatMap(s => (s.pts || []).map(p => p.row)).filter(r => claims[r - 2]);
  if (st.idea) item('the big idea of the whole story', st.idea, st.idea_rows || []);
  (st.remember || []).forEach((r, i) => item('one of the closing lines to remember', r, (st.remember_rows || [])[i] || mainRows));
  // Who has read the summaries. A line counts only if it is about the wording as it stands now.
  const readers = existsSync(dir) ? readdirSync(dir).filter(f => /^storycheck\.[a-z0-9-]+\.csv$/.test(f)) : [], verdicts = [];
  for (const f of readers) { const name = f.split('.')[1], rs = objs(join(dir, f)), by = new Map(rs.map(r => [r.text, r.verdict])); if (name === st.writer) { E(`${f}: the writer of a story can't be its checker`); continue; }
    const dis = items.filter(x => by.get(x.summary) && by.get(x.summary) !== 'confirmed'), unread = items.filter(x => !by.has(x.summary)); verdicts.push({ name, dis: dis.length, unread: unread.length });
    for (const x of dis) L(`${name} disputes this ${x.kind}: "${x.summary.slice(0, 90)}" (${(rs.find(r => r.text === x.summary) || {}).notes || ''})`); if (unread.length) L(`${name} has not read ${unread.length} of the ${items.length} summaries as they stand now`); }
  const clean = verdicts.filter(v => !v.dis && !v.unread).map(v => v.name);
  if (!readers.length) L(`no second model has read the ${items.length} summaries (short versions, tables, diagrams, linking lines). Run: node tools/ai-factcheck.mjs ${dir} --story --provider gemini`);
  const status = (open
    ? `Written by AI from ${st.from}. Every point comes from a statement that at least two independent AI models checked against its source's own words; short versions, tables and diagrams are Mess's own summaries of those statements. It has not been checked against a clinical guideline. ${st.covers} ${st.not_covered}`
    : `Written by AI from ${st.from}. Every point comes from a claim that at least two independent AI models checked against the guideline text; short versions, tables and diagrams are Mess's own summaries of those claims. ${st.covers} ${st.not_covered}`).replace(/\s+/g, ' ').trim();
  const story = { shape: st.shape, status, idea: st.idea, steps, remember: st.remember, ...story_extra };
  if (open) {
    // Every source a point rests on, with the credit its licence asks for (CC BY and the Open Government Licence both do).
    const ids = [...new Set([...used, ...(st.idea_rows || [])].map(r => (claims[r - 2] || {}).source_id).filter(Boolean))];
    story.sources = ids.map(id => srcFile(id)).filter(Boolean).map(j => ({ t: j.kind === 'article' ? j.credit : `${j.title}, ${new URL(j.url).hostname} (updated ${j.updated}). ${j.credit}`, url: j.doi ? `https://doi.org/${j.doi}` : j.url }));
    if (!Array.isArray(st.gaps)) E('"gaps" must list what no open source covered (an empty list if nothing is missing), so the page is honest about it');
    else { story.gaps = st.gaps.map((g, i) => { if (!g || !g.t) { E(`gap ${i + 1} has no "t"`); return null; } if (g.url && !/^https:\/\//.test(g.url)) E(`gap ${i + 1}: the link must start https://`); return g.url ? { t: g.t, url: g.url } : { t: g.t }; }).filter(Boolean); }
  }
  const left = claims.map((_, i) => i + 2).filter(r => cons.get(r) === 'agreed' && !used.has(r));
  return { dir, topic: st.topic, story, errs, looks, items, writer: st.writer, clean, stats: `${used.size} of ${claims.length} claims used, ${steps.length} steps, ${visuals} table(s) or diagram(s), ${wrongs} often got wrong, ${aids} memory aid(s), ${items.length} summaries${clean.length ? ` all confirmed by ${clean.join(' and ')}` : ''}${left.length ? `; agreed but not used: rows ${left.join(', ')}` : ''}` };
}

// One entry in stories.js, in the house style: a point a line, single quotes.
const q = (s) => "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
const pt = (p) => typeof p === 'string' ? q(p) : `{ t: ${q(p.t)}${p.full ? `, full: ${q(p.full)}` : ''}${p.why ? `, why: ${q(p.why)}` : ''} }`;
const tb = (t) => `{ cap: ${q(t.cap)}, head: [${t.head.map(q).join(', ')}], rows: [\n          ${t.rows.map(r => '[' + r.map(q).join(', ') + ']').join(',\n          ')}], src: ${q(t.src)} }`;
const fl = (f) => `{ cap: ${q(f.cap)}, steps: [\n          ${f.steps.map(x => x.t ? `{ t: ${q(x.t)} }` : `{ ask: ${q(x.ask)}, paths: [${x.paths.map(p => `{ if: ${q(p.if)}${p.then ? `, then: ${q(p.then)}` : ''} }`).join(', ')}] }`).join(',\n          ')}], src: ${q(f.src)} }`;
export const entry = (topic, s) => `  // built:${topic}:start (by tools/build-story.mjs from the topic's story.json; edit that, not this)\n  ${q(topic)}: {\n    shape: ${q(s.shape)},\n    status: ${q(s.status)},\n    idea: ${q(s.idea)},\n    steps: [\n` +
  s.steps.map(st => `      { h: ${q(st.h)},${st.bridge ? ` bridge: ${q(st.bridge)},` : ''} pts: [\n        ${st.pts.map(pt).join(',\n        ')}]${st.more ? `,\n        more: [\n        ${st.more.map(pt).join(',\n        ')}]` : ''}${st.table ? `,\n        table: ${tb(st.table)}` : ''}${st.flow ? `,\n        flow: ${fl(st.flow)}` : ''} }`).join(',\n') +
  `\n    ],\n    remember: [\n      ${s.remember.map(q).join(',\n      ')}\n    ]` +
  (s.predict ? `,\n    predict: { q: ${q(s.predict.q)}, opts: [${s.predict.opts.map(q).join(', ')}], a: ${s.predict.a}, step: ${s.predict.step}${s.predict.why ? `, why: ${q(s.predict.why)}` : ''} }` : '') +
  (s.explain ? `,\n    explain: { q: ${q(s.explain.q)}, check: [${s.explain.check.map(q).join(', ')}] }` : '') +
  (s.sources ? `,\n    sources: [\n      ${s.sources.map(x => `{ t: ${q(x.t)}, url: ${q(x.url)} }`).join(',\n      ')}\n    ]` : '') +
  (s.gaps ? `,\n    gaps: [\n      ${s.gaps.map(x => `{ t: ${q(x.t)}${x.url ? `, url: ${q(x.url)}` : ''} }`).join(',\n      ')}\n    ]` : '') +
  `\n  },\n  // built:${topic}:end\n`;

const args = process.argv.slice(2), check = args.includes('--check'), root = args.find(a => !a.startsWith('--'));
if (!root) { console.log('Usage: node tools/build-story.mjs content/<area>/<condition> [--check]'); process.exit(2); }
const out = (args.includes('--out') ? args[args.indexOf('--out') + 1] : '') || 'app/assets/stories.js';
const find = (d) => existsSync(join(d, 'story.json')) ? [d] : readdirSync(d).filter(x => statSync(join(d, x)).isDirectory() && x !== 'sources').flatMap(x => find(join(d, x)));
let js = existsSync(out) ? readFileSync(out, 'utf8') : 'const STORIES = {\n};\n', bad = 0, stale = 0;
const itemsOut = args.includes('--items') ? args[args.indexOf('--items') + 1] : '';
for (const dir of find(root)) { const r = build(dir);
  if (r.frozen) { console.log(`– ${dir}: frozen source, kept as it stood in app/assets/frozen.js; not rebuilt`); continue; }
  if (itemsOut && r.items) writeFileSync(itemsOut, JSON.stringify({ writer: r.writer, items: r.items }));
  for (const m of r.looks) console.log(`  look: ${m}`);
  const inApp = r.topic ? js.includes(`  // built:${r.topic}:start`) : false;
  // A story not in the app yet is work in progress: --check reports what it still needs (often rows waiting for their
  // second checker) without failing. It can only reach the app by building cleanly.
  if (r.errs.length && check && !inApp) { console.log(`… ${dir}: not in the app yet, ${r.errs.length} to fix before it can be`); for (const m of r.errs.slice(0, 8)) console.log(`  fix: ${m}`); continue; }
  if (r.errs.length) { bad++; console.log(`✗ ${dir}: ${r.errs.length} to fix`); for (const m of r.errs) console.log(`  fix: ${m}`); continue; }
  // --ship (used by the tests): a story may only be in the app once a model that isn't its writer has confirmed every summary as it stands.
  if (!r.clean.length && !inApp && !args.includes('--draft')) { console.log(`… ${dir}: builds, but no model other than its writer has read every summary yet, so it stays out of the app (${r.stats}). Run the story check (Brief 3)`); continue; }
  if (args.includes('--ship') && !r.clean.length) { bad++; console.log(`✗ ${dir}: no model other than its writer has confirmed every summary as it stands, so it can't ship. Run the story check (Brief 3)`); continue; }
  const e = entry(r.topic, r.story), a = js.indexOf(`  // built:${r.topic}:start`), endMark = `  // built:${r.topic}:end\n`, b = js.indexOf(endMark);
  const next = a >= 0 && b > a ? js.slice(0, a) + e + js.slice(b + endMark.length) : js.replace('const STORIES = {\n', 'const STORIES = {\n' + e);
  if (a < 0 && new RegExp(`^  ${q(r.topic).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}: \\{`, 'm').test(js)) { bad++; console.log(`✗ ${dir}: ${out} already has a hand-written ${r.topic} story. Remove it first, so there is one source`); continue; }
  if (next !== js) { stale++; js = next; }
  console.log(`✓ ${dir}: ${r.stats}${next === js && !check ? '' : ''}`); }
if (check) { if (stale) console.log(`✗ ${out} is out of date for ${stale} stor${stale === 1 ? 'y' : 'ies'}; run node tools/build-story.mjs content`); process.exit(bad || stale ? 1 : 0); }
if (!bad && stale) { writeFileSync(out, js); console.log(`Wrote ${out}`); }
process.exit(bad ? 1 : 0);
