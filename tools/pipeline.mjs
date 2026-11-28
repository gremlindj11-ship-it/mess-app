// The content pipeline (claude/content-pipeline.md in the project): every open-source topic moves through the same
// stages, and a gate sits between each. A topic's stage is the first gate it fails, worked out from its files every
// time, so an edit that breaks an earlier step shows at once. content/open/<topic>/status.json keeps only what the
// files can't show: the pull request, rounds of rewording, records of planted faults caught, and the history.
//
//   node tools/pipeline.mjs status [topic]   every topic, one line each: its stage, what stops it, who acts next.
//                                            With a topic: every gate for it, not only the first that fails
//   node tools/pipeline.mjs next             the one stage the runner should do now: a started topic that a script
//                                            can move first, then the next queue row with no folder
//   node tools/pipeline.mjs advance <topic> [--pr <number>]
//                                            checks the gate of the stage status.json records and, if it passes,
//                                            records the next stage (one stage a call; nothing skips a gate).
//                                            At stage 0 it makes the folder. --pr records the pull request (stage 9).
//
// status and next change nothing: the tools that write files (check-open.mjs, consensus.mjs) run on a throwaway copy.
// The runner only runs tools and moves stages. Statements, checklists and stories come from the writer, never from here.
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync, mkdtempSync, cpSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const TOOLS = dirname(fileURLToPath(import.meta.url)), ROOT = join(TOOLS, '..'), OPENDIR = join(ROOT, 'content', 'open');
const { byId, mayWrite, OPEN, objs } = await import(pathToFileURL(join(TOOLS, 'rights.mjs')));
const { checklistProblems } = await import(pathToFileURL(join(TOOLS, 'checklist.mjs')));

export const STAGES = ['pick', 'sources', 'checklist', 'statements', 'quote check', 'numbers', 'two checkers', 'coverage', 'story', 'PR'];
const COUNTING = ['gemini', 'qwen']; // the two checkers that count (fixed roles); any other check file is an extra reader
const MAX_ROUNDS = 2;
const read = (p) => existsSync(p) ? readFileSync(p, 'utf8') : null;
const rows = (p) => { const t = read(p); return t === null ? null : objs(t); };
const node = (args, cwd = ROOT) => { const r = spawnSync(process.execPath, args, { cwd, encoding: 'utf8' }); return { code: r.status, out: (r.stdout || '') + (r.stderr || '') }; };
const same = (a, b) => a !== null && b !== null && a.replace(/\r/g, '').trim() === b.replace(/\r/g, '').trim();
const tmp = []; process.on('exit', () => tmp.forEach(d => rmSync(d, { recursive: true, force: true })));
// A throwaway copy of a topic folder, for the tools that write into it.
const scratch = (dir) => { const t = mkdtempSync(join(tmpdir(), 'mess-pipe-')); tmp.push(t); const d = join(t, 'topic'); cpSync(dir, d, { recursive: true }); return d; };

// ---- queue.md: the topics in order, their saved sources, and which "Elsewhere in the world" sources serve them ----
function queue() {
  const t = read(join(OPENDIR, 'queue.md')) || '', topics = [], elsewhere = {};
  let mode = null;
  for (const l of t.split('\n')) {
    if (/^\|\s*Folder\s*\|/i.test(l)) { mode = 'topics'; continue; }
    if (/^\|\s*Saved source\s*\|/i.test(l)) { mode = 'elsewhere'; continue; }
    if (!l.startsWith('|')) { if (l.trim()) mode = l.startsWith('#') || mode === null ? null : mode; continue; }
    if (/^\|\s*-/.test(l)) continue;
    const c = l.split('|').slice(1, -1).map(x => x.trim()), ids = (s) => s.split(',').map(x => x.trim()).filter(Boolean);
    if (mode === 'topics' && c.length >= 3) topics.push({ folder: c[0], name: c[1], sources: ids(c[2]) });
    if (mode === 'elsewhere' && c.length >= 3) for (const f of ids(c[2])) (elsewhere[f] ||= []).push(...ids(c[0]));
  }
  return { topics, elsewhere };
}

// Every "Writer:" line at the start of a line in extraction-record.md counts (Codex is GPT), as build-evidence.mjs reads it.
const model = (m) => { m = String(m || '').toLowerCase().trim(); return m === 'codex' ? 'gpt' : m; };
// Each line is read up to its first bracket or full stop: every model named there counts ("GPT and Gemini" is both), and a line naming none is "unknown",
// which sends the topic to Sofia rather than guess who may check.
const KNOWN = [[/\b(gpt|codex|chatgpt|openai)/i, 'gpt'], [/\bclaude/i, 'claude'], [/\bgemini/i, 'gemini'], [/\bqwen/i, 'qwen']];
function writersOf(dir) {
  const out = new Set();
  for (const m of (read(join(dir, 'extraction-record.md')) || '').matchAll(/^[ \t]*\**writers?\b[ \t]*\**:?\**[ \t]*(.*)$/gim)) {
    const who = m[1].split(/\(|;|\.(?:\s|$)|\s-\s/)[0]; // a full stop ends the names only before a space or the end, so "GPT-4.1" stays whole // the names come first; what follows is explanation ("Claude (...). Checkers: Gemini")
    const named = KNOWN.filter(([re]) => re.test(who)).map(([, k]) => k);
    named.length ? named.forEach(k => out.add(k)) : out.add('unknown');
  }
  return [...out];
}
const statusFile = (dir) => join(dir, 'status.json');
// status.json must be an object; its stage, if there, a whole number from 0 to the end. Anything else is reported, not guessed.
const loadStatus = (dir) => {
  const raw = read(statusFile(dir)); // missing: a new record; present but empty: unusable, reported
  let s; try { s = JSON.parse(raw === null ? '{}' : raw); } catch (e) { return { broken: e.message }; }
  if (s === null || typeof s !== 'object' || Array.isArray(s)) return { broken: 'it is not an object' };
  if (s.stage !== undefined && !(Number.isInteger(s.stage) && s.stage >= 0 && s.stage <= STAGES.length)) return { broken: `its stage is ${JSON.stringify(s.stage)}, not a whole number from 0 to ${STAGES.length}` };
  if (s.pr !== undefined && !(Number.isInteger(s.pr) && s.pr > 0)) return { broken: `its pr is ${JSON.stringify(s.pr)}, not a pull request number` };
  if (s.rounds !== undefined && !(Number.isInteger(s.rounds) && s.rounds >= 0)) return { broken: `its rounds is ${JSON.stringify(s.rounds)}, not a whole number` };
  for (const k of ['history', 'checks']) if (s[k] !== undefined && !(Array.isArray(s[k]) && s[k].every(x => x && typeof x === 'object' && !Array.isArray(x)))) return { broken: `its ${k} is not a list of records` };
  return s;
};

// ---- the gates. Each returns { ok, why, who }: who acts next if it fails (runner, writer, checkers, builder, Sofia). ----
let rightsOk = null;
const rightsGate = () => rightsOk ??= node([join(TOOLS, 'check-rights.mjs')]).code === 0;

function gates(t, Q, stIn) {
  const dir = join(OPENDIR, t.folder), st = stIn || loadStatus(dir), writer = writersOf(dir);
  const g = [];
  // 0 pick
  g.push(() => existsSync(dir) ? { ok: true } : { ok: false, why: 'not started', who: 'runner' });
  // 1 sources: at least one NHS or GOV.UK page, one CC BY article, one "Elsewhere in the world" source; all allowed
  g.push(() => {
    const used = (rows(join(dir, 'statements.csv')) || []).map(r => r.source_id).filter(Boolean);
    const world = Q.elsewhere[t.folder] || [], ids = [...new Set([...(t.sources || []), ...world, ...used])], bad = [], notAllowed = [], docs = [];
    for (const id of ids) {
      let d; try { d = JSON.parse(read(join(ROOT, 'content', 'open-sources', `${id}.json`)) || 'null'); } catch { bad.push(`${id}.json does not parse`); continue; }
      if (!d) { bad.push(`${id} is not saved`); continue; }
      if (!mayWrite(byId(d.register)) || !OPEN.has(d.licence)) { notAllowed.push(`${id} is not one a model may write from (${d.register}, ${d.licence})`); continue; }
      docs.push(d);
    }
    const lack = [];
    if (!docs.some(d => d.kind === 'nhs' || d.kind === 'govuk')) lack.push('an NHS or GOV.UK page');
    if (!docs.some(d => d.kind === 'article' && OPEN.has(d.licence))) lack.push('a CC BY article');
    // Who can fix it: a source that is listed but not saved, the runner (fetch-open.mjs); one the register does not allow,
    // Sofia; one that is not chosen yet (no row in queue.md), the writer, since picking sources is not a script's job.
    if (notAllowed.length) return { ok: false, why: notAllowed.join('; '), who: 'Sofia' };
    if (bad.length) return { ok: false, why: bad.join('; ') + ' (fetch-open.mjs)', who: 'runner' };
    if (!world.some(id => docs.some(d => d.id === id))) lack.push('an "Elsewhere in the world" source in queue.md');
    return lack.length ? { ok: false, why: 'missing ' + lack.join(', '), who: 'writer' } : { ok: true };
  });
  // 2 checklist
  g.push(() => {
    const items = rows(join(dir, 'coverage.csv'));
    if (!items || !items.length) return { ok: false, why: 'no coverage.csv', who: 'writer' };
    const p = checklistProblems(items);
    return p.length ? { ok: false, why: 'checklist: ' + p.join('; '), who: 'writer' } : { ok: true };
  });
  // 3 statements: statements.src.txt fills, and statements.csv is what it fills to
  g.push(() => {
    if (!existsSync(join(dir, 'statements.src.txt'))) return { ok: false, why: 'no statements.src.txt', who: 'writer' };
    const d = scratch(dir), r = node([join(TOOLS, 'check-open.mjs'), d, '--fill']);
    if (!/^✓ .*statements\.csv: \d+ statements/m.test(r.out)) return { ok: false, why: 'fill fails: ' + (r.out.match(/✗ .*/) || ['?'])[0].slice(2, 160), who: 'writer' };
    if (!same(read(join(d, 'statements.csv')), read(join(dir, 'statements.csv')))) return { ok: false, why: 'statements.csv is not what --fill builds from statements.src.txt', who: 'runner' };
    return { ok: true };
  });
  // 4 quote check: every quote word for word, from a source the register allows; the rights gate passes
  g.push(() => {
    const r = node([join(TOOLS, 'check-open.mjs'), scratch(dir)]);
    if (!/every quote is word for word/.test(r.out)) return { ok: false, why: 'quote check: ' + ((r.out.match(/^ {2}\S.*/m) || ['?'])[0].trim().replace(/^.*statements\.csv /, '').slice(0, 160)), who: 'writer' };
    return rightsGate() ? { ok: true } : { ok: false, why: 'the rights gate (check-rights.mjs, over the whole repo, not only this topic) fails', who: 'builder' };
  });
  // 5 numbers: every statement with a figure has it in a second allowed source, or is held
  g.push(() => existsSync(join(TOOLS, 'check-numbers.mjs')) ? numbersGate(dir) : { ok: false, why: 'tools/check-numbers.mjs is not built yet', who: 'builder' });
  // 6 two checkers
  g.push(() => checkersGate(dir, writer, st));
  // 7 coverage: coverage.md is what check-open writes now
  g.push(() => {
    const d = scratch(dir); node([join(TOOLS, 'check-open.mjs'), d]);
    return same(read(join(d, 'coverage.md')), read(join(dir, 'coverage.md'))) ? { ok: true } : { ok: false, why: 'coverage.md is out of date: run check-open.mjs', who: 'runner' };
  });
  // 8 story: built from agreed statements, every summary confirmed by a model that is not its writer
  g.push(() => {
    if (!existsSync(join(dir, 'story.json'))) return { ok: false, why: 'no story.json', who: 'writer' };
    // Checked against a copy of the app's stories file. "out of date" only means the story is not in the app yet, which is
    // what the PR (stage 9) does, so it is not a failure here; any other ✗ is.
    const out = join(scratch(dir), '..', 'stories.js'), live = join(ROOT, 'app', 'assets', 'stories.js');
    if (existsSync(live)) cpSync(live, out);
    const r = node([join(TOOLS, 'build-story.mjs'), join('content', 'open', t.folder), '--check', '--ship', '--out', out]);
    const bad = r.out.split('\n').filter(l => /^✗/.test(l) && !/is out of date for \d+ stor/.test(l));
    if (/stays out of the app|has not read|not in the app yet/.test(r.out)) return { ok: false, why: 'story: not every summary is confirmed by a model that did not write it, or some need fixing', who: /\d+ to fix|disputed/.test(r.out) ? 'writer' : 'checkers' };
    if (bad.length) return { ok: false, why: 'story: ' + bad[0].slice(2, 160), who: 'writer' };
    return r.code === 0 || /is out of date for \d+ stor/.test(r.out) ? { ok: true } : { ok: false, why: 'story: build-story.mjs failed', who: 'writer' };
  });
  // 9 PR
  g.push(() => st.pr ? { ok: true } : { ok: false, why: 'no pull request recorded', who: 'runner' });
  // A queued topic with no folder: every gate after "pick" is blocked until it is picked (never run on a missing folder).
  const gs = g.map((f, i) => i === 0 ? f : () => existsSync(dir) ? f() : { ok: false, why: 'blocked: not started', who: 'runner' });
  return { g: gs, dir, st, writer };
}

function numbersGate(dir) {
  const r = node([join(TOOLS, 'check-numbers.mjs'), dir, '--check']);
  // A figure with no second source is the writer's to find (or to drop): no script can do it.
  return r.code === 0 ? { ok: true } : { ok: false, why: 'numbers: ' + ((r.out.match(/✗ .*/) || [r.out.trim().split('\n').pop() || '?'])[0]).replace(/^✗ /, '').slice(0, 160), who: 'writer' };
}

function checkersGate(dir, writers, st) {
  const files = Object.fromEntries(readdirSync(dir).filter(f => /^factcheck\.[a-z0-9-]+\.csv$/i.test(f)).map(f => [model(f.split('.')[1]), f])), have = Object.keys(files);
  if (!writers.length) return { ok: false, why: 'no "Writer:" line in extraction-record.md, so nobody can tell who may check', who: 'Sofia' };
  if (writers.includes('unknown')) return { ok: false, why: 'a "Writer:" line in extraction-record.md names no model Mess knows (Claude, GPT/Codex, Gemini, Qwen)', who: 'Sofia' };
  const both = writers.filter(w => COUNTING.includes(w));
  if (both.length) return { ok: false, why: `the writer is ${both.join(' and ')}, one of the two checkers that count`, who: 'Sofia' };
  const own = writers.filter(w => have.includes(w));
  if (own.length) return { ok: false, why: `factcheck.${own[0]}.csv: the writer checked its own rows; take it out`, who: 'Sofia' };
  const missing = COUNTING.filter(m => !have.includes(m));
  if (missing.length) return { ok: false, why: `no check by ${missing.join(' or ')}`, who: 'checkers' };
  for (const m of COUNTING) { const r = node([join(TOOLS, 'check-factcheck.mjs'), join(dir, files[m])]); if (r.code !== 0) return { ok: false, why: `${files[m]} is not a real check: ` + ((r.out.match(/✗.*/) || ['?'])[0]).slice(0, 120), who: 'checkers' }; }
  // Rebuilt from the check files on a copy, with the old consensus.csv removed first, so a failed rebuild can't pass off the old one.
  const d = scratch(dir); rmSync(join(d, 'consensus.csv'), { force: true });
  const cr = node([join(TOOLS, 'consensus.mjs'), d]), con = cr.code === 0 ? rows(join(d, 'consensus.csv')) : null;
  if (!con) return { ok: false, why: 'consensus.mjs could not rebuild consensus.csv: ' + (cr.out.trim().split('\n').pop() || '?').slice(0, 120), who: 'builder' };
  const held = new Set((rows(join(dir, 'numbers.csv')) || []).filter(x => x.result === 'held').map(x => String(x.row)));
  const open = con.filter(x => x.status !== 'agreed' && !held.has(String(x.row)));
  const unchecked = open.filter(x => COUNTING.some(m => !String(x.checked_by).split(' ').includes(m))).map(x => x.row);
  const disputed = open.filter(x => !unchecked.includes(x.row)).map(x => x.row);
  if (unchecked.length) return { ok: false, why: `rows ${ranges(unchecked)} not read by both checkers as they stand`, who: 'checkers' };
  // Agreed is not enough: both counting checkers must have confirmed every row (agreed by gpt and qwen alone does not count).
  const short = con.filter(x => !held.has(String(x.row)) && x.status === 'agreed' && COUNTING.some(m => !String(x.confirmed_by).toLowerCase().split(' ').includes(m))).map(x => x.row);
  if (short.length) return { ok: false, why: `rows ${ranges(short)} agreed, but not confirmed by both ${COUNTING.join(' and ')}`, who: 'checkers' };
  if (disputed.length) {
    const n = st.rounds || 0;
    return n >= MAX_ROUNDS ? { ok: false, why: `rows ${ranges(disputed)} still disputed after ${n} rounds: listed for Sofia, not retried`, who: 'Sofia' }
      : { ok: false, why: `rows ${ranges(disputed)} disputed: the writer rewords those rows only (round ${n + 1} of ${MAX_ROUNDS})`, who: 'writer' };
  }
  if (!same(read(join(d, 'consensus.csv')), read(join(dir, 'consensus.csv')))) return { ok: false, why: 'consensus.csv is out of date: run consensus.mjs', who: 'runner' };
  // Every counting checker's latest run must be on record as having caught its planted faults.
  const runs = st.checks || [], lack = COUNTING.filter(m => { const last = runs.filter(c => c.model_role === m).pop(); return !last || !(last.planted_total > 0 && last.planted_caught === last.planted_total); });
  if (lack.length) return { ok: false, why: `${con.filter(x => !held.has(String(x.row))).length} of ${con.length} agreed, but no record that ${lack.join(' and ')} caught a planted fault (runs before the pipeline; run-checkers.mjs records them)`, who: existsSync(join(TOOLS, 'run-checkers.mjs')) ? 'runner' : 'builder' };
  return { ok: true };
}

const ranges = (ns) => { const s = [...new Set(ns.map(Number))].sort((a, b) => a - b), out = []; let a = null, b = null;
  for (const n of s) { if (b !== null && n === b + 1) b = n; else { if (a !== null) out.push(a === b ? `${a}` : `${a}-${b}`); a = b = n; } }
  if (a !== null) out.push(a === b ? `${a}` : `${a}-${b}`); return out.join(', '); };

// Where a topic stands: the first gate it fails.
function where(t, Q) {
  const { g, dir, st, writer } = gates(t, Q);
  for (let i = 0; i < g.length; i++) { const r = g[i](); if (!r.ok) return { topic: t.folder, stage: i, ...r, st, dir, writer }; }
  return { topic: t.folder, stage: STAGES.length, ok: true, why: `done: pull request #${st.pr}`, who: 'Sofia', st, dir, writer };
}

function topicList() {
  const Q = queue(), seen = new Set(Q.topics.map(t => t.folder)), extra = existsSync(OPENDIR) ? readdirSync(OPENDIR, { withFileTypes: true })
    .filter(e => e.isDirectory() && !seen.has(e.name)).map(e => ({ folder: e.name, name: e.name, sources: [], unqueued: true })).sort((a, b) => a.folder.localeCompare(b.folder)) : [];
  return { Q, list: [...Q.topics, ...extra] };
}

const line = (w) => { const s = w.stage < STAGES.length ? `${w.stage} ${STAGES[w.stage]}` : 'done';
  const rec = w.st.stage !== undefined && w.st.stage !== w.stage ? ` (status.json says ${w.st.stage})` : '';
  const broken = w.st.broken ? ` (status.json can't be read: ${w.st.broken})` : '';
  return `${w.topic.padEnd(28)} ${s.padEnd(15)} ${('→ ' + w.who).padEnd(12)} ${w.why}${rec}${broken}`; };

// ---- commands ----
const [cmd, arg, ...rest] = process.argv.slice(2);
if (cmd === 'status') {
  const { Q, list } = topicList(), pick = arg ? list.filter(t => t.folder === arg) : list;
  if (arg && !pick.length) { console.log(`No topic "${arg}" in queue.md or content/open/`); process.exit(1); }
  if (arg) { const { g } = gates(pick[0], Q); g.forEach((f, i) => { const r = f(); console.log(`${String(i).padStart(2)} ${STAGES[i].padEnd(13)} ${r.ok ? '✓' : '✗ ' + r.why + ' → ' + r.who}`); }); console.log(''); }
  const ws = pick.map(t => where(t, Q)), by = {};
  console.log(`${'Topic'.padEnd(28)} ${'Stage'.padEnd(15)} ${'Next'.padEnd(12)} What stops it`);
  ws.forEach(w => { console.log(line(w)); by[w.who] = (by[w.who] || 0) + 1; });
  console.log(`\n${ws.length} topics. Waiting on: ${Object.entries(by).map(([k, v]) => `${k} ${v}`).join(', ')}.`);
} else if (cmd === 'next') {
  const { Q, list } = topicList(), ws = list.map(t => where(t, Q));
  const go = ws.find(w => w.stage > 0 && w.who === 'runner') || ws.find(w => w.stage === 0);
  if (!go) { console.log('Nothing for the runner: every topic waits on the writer, the checkers, the builder or Sofia. See: node tools/pipeline.mjs status'); process.exit(0); }
  console.log(`${go.topic}: stage ${go.stage} (${STAGES[go.stage]}). ${go.why}.`);
} else if (cmd === 'advance') {
  const { Q, list } = topicList(), t = list.find(x => x.folder === arg);
  if (!t) { console.log(`No topic "${arg}" in queue.md or content/open/`); process.exit(1); }
  const dir = join(OPENDIR, t.folder), st = existsSync(dir) ? loadStatus(dir) : {}, from = st.stage || 0;
  if (st.broken) { console.log(`✗ ${statusFile(dir)} can't be read: ${st.broken}`); process.exit(1); }
  const prI = rest.indexOf('--pr'); if (prI >= 0) { const n = Number(rest[prI + 1]); if (!Number.isInteger(n) || n < 1) { console.log('✗ --pr needs a pull request number'); process.exit(1); } st.pr = n; }
  // A gate before the recorded stage that fails again (a reworded row, a changed source) moves the topic back to it,
  // a finished topic included. The gates see --pr at once, so recording the pull request and passing stage 9 is one call.
  const { g } = gates(t, Q, st); let back = null;
  for (let i = 0; i < from; i++) { const r = g[i](); if (!r.ok) { back = { i, ...r }; break; } }
  if (!back && from >= STAGES.length) { if (prI >= 0) writeFileSync(statusFile(dir), JSON.stringify({ ...st, topic: t.folder }, null, 2) + '\n'); console.log(`${t.folder}: done, and every gate still passes (pull request #${st.pr})`); process.exit(0); }
  const now = back ? back.i : from;
  if (now === 0 && !existsSync(dir)) mkdirSync(dir, { recursive: true }); // picking a topic is making its folder
  const r = back || g[now]();
  const rec = { ...st, topic: t.folder, history: [...(st.history || [])] }, at = new Date().toISOString().slice(0, 16) + 'Z';
  if (r.ok) { rec.stage = now + 1; rec.history.push({ at, from: now, to: now + 1 }); }
  else { rec.stage = now; if (now !== from) rec.history.push({ at, from, to: now, why: r.why }); }
  if (r.ok || now !== from || prI >= 0 || !existsSync(statusFile(dir))) writeFileSync(statusFile(dir), JSON.stringify(rec, null, 2) + '\n');
  if (r.ok) console.log(`✓ ${t.folder}: stage ${now} (${STAGES[now]}) passes; now at stage ${now + 1}${now + 1 < STAGES.length ? ` (${STAGES[now + 1]})` : ' (done)'}.`);
  else { console.log(`✗ ${t.folder}: stage ${now} (${STAGES[now]})${back ? `, moved back from ${from},` : ''} does not pass: ${r.why}. Next: ${r.who}.`); process.exit(1); }
} else {
  console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').filter(l => l.startsWith('//')).join('\n'));
  process.exit(cmd ? 2 : 0);
}
