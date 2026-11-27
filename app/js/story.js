// Mess · story.js · Understand view: a topic told as a story, in the order that builds understanding.
// Loaded in this order by index.html: store.js, safety.js, intake.js, links.js, ai.js, flow.js, tools.js, intro.js, today.js, practice.js, stats.js, topics.js, story.js, curricula.js, route.js, diagrams.js, placement.js, profile.js, import.js, packs.js, apps.js, boot.js.
// All files share one global scope (plain scripts, no build step).
//
// Why: understanding beats memorising facts. The story gives the big idea first (Ausubel's advance
// organiser), builds each step on the one before (the illness script: who gets it → what goes wrong →
// what that causes → how you prove it → what you do and why), keeps steps short (Mayer's segmenting),
// and ends with what matters most. The reference headings are still one tap away for looking things up.

const STORY = typeof STORIES === 'object' && STORIES ? STORIES : {};
// Mess's own stories first, then any from packs the student added (labelled as such).
function storyGet(n) { if (STORY[n]) return STORY[n]; for (const p of (typeof packList === 'function' ? packList() : [])) { const s = (p.stories || {})[n]; if (s) return { ...s, status: 'From the pack ' + p.name + ' by ' + p.author + '. Check it against your own sources.' }; } return null; }
const storyHas = (n) => !!storyGet(n);
// Topics whose story and notes were taken offline on 26 Nov 2026 (they had been written from guidelines Mess may not
// use that way) and are being written again from open sources. The topic page says so instead of just looking empty.
// A name stops counting the moment Mess has a story for it again, so this list can be trimmed whenever.
const REWRITING = ['Pleural effusion', 'Atrial fibrillation', 'Asthma', 'Respiratory failure', 'COPD'];
const rewriting = (n) => REWRITING.includes(n) && !storyHas(n); // a story back from Mess, or one from a pack the student added, ends it
const storyOn = (n) => storyHas(n) && (db.topicView !== 'ref' || !!(ui.fixAt && ui.fixAt.n === n));
// Topic and drug names in a story become links, the first time each one appears. A name inside a
// different term isn't linked: "pulmonary hypertension" is not Hypertension.
let STORY_RE = null;
function storyLinkRe() {
  if (STORY_RE) return STORY_RE;
  const names = [...TOPICS.keys()].filter(x => x.length > 2).sort((a, b) => b.length - a.length).map(x => esc(x).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  STORY_RE = names.length ? new RegExp('(^|[^A-Za-z0-9&#])(' + names.join('|') + ')(?![A-Za-z0-9])', 'gi') : /$^/;
  return STORY_RE;
}
const SRC_TAIL = /\s*\[([^\]]{2,120})\]\s*$/, srcOf = (t) => (String(t || '').match(SRC_TAIL) || [])[1] || '', noSrc = (t) => String(t || '').replace(SRC_TAIL, '');
function storyText(t, self, seen) {
  let h = esc(t);
  // The source label at the end of a point ("[NHS]") stays in the data but is not drawn after the point: the page
  // reads clean, and every label is listed in the one Sources fold at the bottom (storySources). Sofia, 25 Nov 2026.
  const src = h.match(SRC_TAIL); if (src) h = h.slice(0, src.index);
  h = h.replace(storyLinkRe(), (m, pre, name, at, all) => { if (/(pulmonary|portal|intracranial|ocular|idiopathic intracranial)\s+$/i.test(all.slice(Math.max(0, at - 30), at + pre.length))) return m; const real = [...TOPICS.keys()].find(k => esc(k).toLowerCase() === name.toLowerCase()); if (!real || real === self || seen.has(real)) return m; seen.add(real); return `${pre}<button class="slink" data-a="topicopen" data-v="${esc(real)}">${name}</button>`; });
  return h;
}
// A point is a string, or { t, why } where "why" says why it matters clinically (e.g. why ethnicity
// changes the first-line drug). Everyone gets the same facts; the why lines show by default in years
// 1 to 3 (and when no year is set), and fold away in later years. Anyone can switch them.
const ptT = (p) => typeof p === 'string' ? p : (p && p.t) || '';
const ptWhy = (p) => p && typeof p === 'object' ? p.why || '' : '';
const whyOn = () => db.whyOn !== undefined ? db.whyOn : !/^(4th|final)/i.test(db.profile.year || '');
// A point can also carry "full": the whole recommendation, one tap away, when "t" is a shorter version of it.
const ptFull = (p) => p && typeof p === 'object' && typeof p.full === 'string' ? p.full : '';
// A step can carry one table: { cap, head: [..], rows: [[..]], src }. Every cell is plain text and is escaped.
function storyTable(tb, n, seen) {
  if (!tb || !Array.isArray(tb.head) || !Array.isArray(tb.rows) || tb.head.length < 2 || tb.head.length > 4) return '';
  const rows = tb.rows.filter(r => Array.isArray(r) && r.length === tb.head.length).slice(0, 12); if (!rows.length) return '';
  return `<div class="stable"><table>${tb.cap ? `<caption>${esc(String(tb.cap))}</caption>` : ''}<thead><tr>${tb.head.map(h => `<th scope="col">${esc(String(h))}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((c, i) => i ? `<td>${storyText(String(c), n, seen)}</td>` : `<th scope="row">${storyText(String(c), n, seen)}</th>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
// A step can carry one diagram: { cap, steps: [{ t } | { ask, paths: [{ if, then }] }], src }. It reads top to bottom:
// a box, an arrow, the next box. A question lists its answers under it, each with what follows. Plain text, escaped.
function storyFlow(f, n, seen) {
  if (!f || !Array.isArray(f.steps)) return '';
  const steps = f.steps.filter(x => x && (typeof x.t === 'string' || (typeof x.ask === 'string' && Array.isArray(x.paths)))).slice(0, 8); if (steps.length < 2) return '';
  const box = (x) => typeof x.t === 'string' ? `<div class="sfbox">${storyText(x.t, n, seen)}</div>` : `<div class="sfbox sfask">${storyText(x.ask, n, seen)}</div><ul class="sfpaths">${x.paths.filter(p => p && typeof p.if === 'string').slice(0, 4).map(p => `<li><span class="sfif">${esc(p.if)}</span>${typeof p.then === 'string' && p.then ? `<span class="sfthen">${storyText(p.then, n, seen)}</span>` : '<span class="sfon" aria-label="carry on">↓</span>'}</li>`).join('')}</ul>`;
  return `<figure class="sflow">${f.cap ? `<figcaption>${esc(String(f.cap))}</figcaption>` : ''}${steps.map((x, i) => (i ? '<div class="sfarrow" aria-hidden="true">↓</div>' : '') + box(x)).join('')}</figure>`;
}
const ptHTML = (p, n, seen) => `<li>${storyText(ptT(p), n, seen)}${ptFull(p) ? `<details class="dd ddinline sfull"><summary class="tlink s">Full wording ▾</summary><span class="sfulltext">${storyText(ptFull(p), n, seen)}</span></details>` : ''}${ptWhy(p) && whyOn() ? `<span class="swhy"><b>Why it matters:</b> ${storyText(ptWhy(p), n, seen)}</span>` : ''}</li>`;
// Stories built from open sources (content/open/<topic>/) say what no open source covered, with where to read it,
// and list every source with the credit its licence asks for. Mess's own stories only: a pack can't add links here.
const httpsOk = (u) => typeof u === 'string' && /^https:\/\/[^\s"'<>]+$/.test(u);
function storyGaps(n, s) {
  if (!STORY[n] || !Array.isArray(s.gaps) || !s.gaps.length) return '';
  const gs = s.gaps.filter(g => g && g.t), urls = [...new Set(gs.map(g => httpsOk(g.url) ? g.url : ''))], one = urls.length === 1 && urls[0];
  return `<div class="sgaps"><h3>Not covered by an open source yet</h3><p class="s m" style="margin:0 0 6px">Mess only writes from sources that allow it. Read these in the guidance your course uses${one ? `: <a class="rlink" href="${esc(one)}" target="_blank" rel="noopener">where to read them ↗</a>` : ''}.</p><ul>${gs.map(g => `<li>${esc(String(g.t))}${!one && httpsOk(g.url) ? ` <a class="rlink" href="${esc(g.url)}" target="_blank" rel="noopener">Where to read it ↗</a>` : ''}</li>`).join('')}</ul></div>`;
}
function storySources(n, s) {
  const own = !!STORY[n]; // a pack's story lists its labels too, but can't add credit lines or links here
  // Every label in the story, in reading order, with the point it belongs to.
  const rows = [], add = (where, t, src) => { const lab = src || srcOf(t); if (lab) rows.push([where, noSrc(t), lab]); };
  add('The big idea', s.idea || '');
  (s.steps || []).forEach((st) => { if (!st || !st.h) return; for (const p of [...(st.pts || []), ...(st.more || [])]) { add(st.h, ptFull(p) || ptT(p)); }
    if (st.table && st.table.src) add(st.h, 'Table: ' + (st.table.cap || ''), String(st.table.src)); if (st.flow && st.flow.src) add(st.h, 'Diagram: ' + (st.flow.cap || ''), String(st.flow.src));
    if (st.table && Array.isArray(st.table.rows)) for (const r of st.table.rows) if (Array.isArray(r)) for (const c of r) add(st.h, String(c)); });
  (s.remember || []).forEach(r => add('If you remember nothing else', r));
  const credits = own && Array.isArray(s.sources) ? s.sources.filter(x => x && x.t) : [];
  // A story without credit lines (written before open sources) lists each source once, by its label without the paragraph number.
  const names = credits.length ? [] : [...new Set(rows.map(r => r[2].split(/;\s*/)).flat().map(l => l.replace(/\s+\d+(\.\d+)+.*$/, '').trim()).filter(Boolean))];
  if (!credits.length && !names.length) return '';
  let last = null;
  return `<details class="dd ddinline ssources"><summary class="tlink s">Sources (${credits.length || names.length}) ▾</summary>
    <ul class="s">${credits.map(x => `<li>${esc(String(x.t))}${httpsOk(x.url) ? ` <a class="rlink" href="${esc(x.url)}" target="_blank" rel="noopener">Open ↗</a>` : ''}</li>`).join('')}${names.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
    ${rows.length ? `<details class="dd ddinline strace"><summary class="tlink s">Which source each point comes from (${rows.length}) ▾</summary><dl class="s">${rows.map(r => `${r[0] !== last ? `<dt>${esc(last = r[0])}</dt>` : ''}<dd>${esc(r[1])} <span class="ssrc">${esc(r[2])}</span></dd>`).join('')}</dl></details>` : ''}
  </details>`;
}
function storyHTML(t) {
  const n = t.name, s = storyGet(n), seen = new Set(), steps = (s.steps || []).filter(x => x && x.h && Array.isArray(x.pts)).map(x => ({ ...x, pts: x.pts.filter(ptT), more: (x.more || []).filter(ptT) }));
  const testAt = (t.kind === 'd' ? TEACH_D : TEACH_C).findIndex(x => x[0] === 'Test me');
  return `<div class="story" data-n="${esc(n)}">
    ${predTop(n, s)}<p class="sidea">${storyText(s.idea || '', n, seen)}</p>${steps.some(st => [...st.pts, ...(st.more || [])].some(ptWhy)) ? `<p class="s" style="margin:-6px 0 14px"><button class="tlink" data-a="whytoggle" aria-pressed="${whyOn()}">${whyOn() ? 'Hide why each point matters' : 'Show why each point matters'}</button></p>` : ''}
    <ol class="ssteps">${steps.map((st, k) => `${k && st.bridge ? `<li class="sbridge" aria-hidden="true"><span>↓</span> ${esc(st.bridge)}</li>` : k ? '<li class="sbridge" aria-hidden="true"><span>↓</span></li>' : ''}<li class="sstep${fixHere(n, k) ? ' sfix' : ''}" id="sstep${k}">${fixHere(n, k) ? fixNoteHTML(n, k) : fixPast(n, k)}<h2><span class="snum">${k + 1}</span>${esc(st.h)}</h2><ul class="nlist">${st.pts.map(p => ptHTML(p, n, seen)).join('')}</ul>${storyFlow(st.flow, n, seen)}${storyTable(st.table, n, seen)}${predReveal(n, s, k)}${(st.more || []).length ? `<details class="dd ddinline smore"><summary class="tlink s">Go deeper ▾</summary><ul class="nlist">${st.more.map(p => ptHTML(p, n, seen)).join('')}</ul></details>` : ''}</li>`).join('')}</ol>
    ${(s.remember || []).length ? `<div class="sremember"><h3>If you remember nothing else</h3><ol>${s.remember.map(r => `<li>${storyText(r, n, seen)}</li>`).join('')}</ol></div>` : ''}
    ${storyGaps(n, s)}
    <div class="row" style="margin-top:18px">${testAt >= 0 ? `<button class="btn pri" data-a="tteach" data-v="${testAt}">✦ Test me${aiReady() ? '' : ' ↗'}</button>` : ''}<button class="btn" data-a="tview">Reference headings</button></div>
    <p class="s m" style="margin:14px 0 0">${esc(s.status || '')}</p>${storySources(n, s)}${topicChat(n)}
  </div>`;
}
// Swap the topic page's reading area for the story; the side column (drugs, links, cards, questions) stays.
{ const base = topicPage; topicPage = function (t) {
  const html = base(t); if (!t || ui.tfedit === t.name || !storyHas(t.name)) return html;
  const a = html.indexOf('<div class="tgrid"><div style="min-width:0">'), b = html.indexOf('<aside class="tside">'); if (a < 0 || b < 0) return html;
  if (!storyOn(t.name)) return html.slice(0, a) + '<p class="s" style="margin:-4px 0 12px"><button class="tlink" data-a="tview">✦ Read it as a story</button></p>' + html.slice(a);
  return html.slice(0, a) + '<div class="tgrid"><div style="min-width:0">' + storyHTML(t) + topicAdd(t.name) + '</div>\n  ' + html.slice(b);
}; }
Object.assign(act, {
  whytoggle: () => { db.whyOn = !whyOn(); save(); render(); },
  tview: () => { if (ui.fixAt && db.topicView === 'ref') { ui.fixAt = null; window.scrollTo(0, 0); render(); return; } ui.fixAt = null; db.topicView = db.topicView === 'ref' ? 'story' : 'ref'; save(); window.scrollTo(0, 0); render(); }
});

// ---------- The page bundle: what is on this page, in Mess's own words, with where it came from
// One function for everything that hands the page to an AI: the ? (now), the no-AI prompt, highlight to ask and the
// connector (later). Plan and sources: claude/ask-and-ai-teardown.md, sections 3 and 4.
// Hard rule: frozen guideline wording (NICE, BTS, SIGN, GOLD) never goes into a bundle. bundleOpen() fails closed:
// if any one of its checks does not hold, or anything about the story is an odd shape, there is no bundle and the ?
// behaves as it did before. The checks, in order of how much they are relied on:
//   1. the story was in stories.js before frozen.js ran, and is still word for word what it was then (openmark.js);
//   2. it has credit lines, which only a story built from open sources has, and none names a frozen body;
//   3. every point names its source, and no tag anywhere is a frozen or link-only one (a deny list, so the weakest).
const BUNDLE_MAX = 2400, BUNDLE_NOTES_MAX = 600, BUNDLE_IDEA_MAX = 400, BUNDLE_CREDITS_MAX = 1200;
const FROZEN_TAG = /\b(NICE|BTS|SIGN|GOLD|BNF|CKS)|\b(nice|bts|bnf|cks)\b|\bsign[-_ ]?\d|\bgold[-_ ]?(\d|report|guideline|strategy)|\b(NG|CG|TA|QS|PH|KTT|HST|DG|IPG|MTG|ES)[-_ ]?\d{1,4}\b|\b(ng|cg|qs)[-_ ]?\d{1,4}\b|british thoracic|scottish intercollegiate|global initiative for (chronic )?obstructive|national institute for health and care/;
const frozenTag = (t) => { const x = String(t || ''); return FROZEN_TAG.test(x) || FROZEN_TAG.test(x.toLowerCase()); };
const FROZEN_URL = /nice\.org\.uk|brit-thoracic\.org\.uk|thorax\.bmj\.com|sign\.ac\.uk|goldcopd\.org/i;
const bundlePts = (s) => storySteps(s).flatMap(st => [...st.pts, ...(Array.isArray(st.more) ? st.more : [])].map(ptT)).filter(Boolean);
function bundleOpen(n) {
  try {
    const s = STORY[n]; // Mess's own stories only: a pack's story is of unknown origin, so it stays out
    if (!s || typeof OPEN_AT_LOAD === 'undefined' || !OPEN_AT_LOAD.get(n) || OPEN_AT_LOAD.get(n) !== JSON.stringify(s)) return false;
    const credits = Array.isArray(s.sources) ? s.sources.filter(x => x && x.t) : [];
    if (!credits.length || credits.some(x => frozenTag(x.t) || FROZEN_URL.test(String(x.t) + ' ' + String(x.url || '')))) return false;
    if (!storySteps(s).length) return false;
    if ([s.idea || '', ...(Array.isArray(s.remember) ? s.remember : [])].some(t => frozenTag(srcOf(t)))) return false; // the big idea and the last list are Mess's own summaries, so they carry no tag; a frozen one is still refused
    return bundlePts(s).every(t => { const tag = srcOf(t); return !!tag && !frozenTag(tag); });
  } catch (e) { return false; }
}
// The story on screen right now, if it is this topic's (the page can be mid-change, in the editor or in the reference view).
const storyDom = (n) => { const el = document.querySelector('.story'); return el && el.dataset.n === n && el.querySelector('.sstep') ? el : null; };
// The step being read: the one the selection sits in, else the first step down the page that is at least half on
// screen (half of the step, or half of the screen for a long one). If none is, the one with the most of the screen.
function storyStepAt(root) {
  const sel = typeof getSelection === 'function' ? getSelection() : null, an = sel && !sel.isCollapsed && sel.anchorNode, el = an && (an.nodeType === 1 ? an : an.parentElement), inStep = el && el.closest && el.closest('.story .sstep');
  if (inStep && root.contains(inStep)) return +inStep.id.slice(5) || 0;
  let most = 0, best = 0; for (const x of root.querySelectorAll('.sstep')) { const r = x.getBoundingClientRect(), seen = Math.min(r.bottom, innerHeight) - Math.max(r.top, 0), k = +x.id.slice(5) || 0; if (seen > 0 && seen >= Math.min(r.height, innerHeight) / 2) return k; if (seen > best) { best = seen; most = k; } } return most;
}
// The student's own lines only, across the topic's sections (noteFromMess in topics.js leaves out Mess's own notes).
function bundleNotes(n) {
  const bad = noteFromMess(n), out = []; let len = 0, secs = (db.myNotes || {})[n]; secs = secs && typeof secs === 'object' ? Object.values(secs) : [];
  for (const sec of secs) { const keep = (Array.isArray(sec) ? sec : []).map(l => String(l || '').trim()).filter(t => t && !bad(t)); if (keep.length > 1 && (typeof frozenCopy !== 'function' || frozenCopy(keep.join(' ')))) continue; for (const t of keep) { if (len + t.length > BUNDLE_NOTES_MAX) return out; out.push(t); len += t.length; } }
  return out;
}
// o.k: a step to use instead of the one on screen. o.sel: selected text (highlight to ask fills this in later).
function pageBundle(o = {}) {
  try {
    if (ui.page !== 'Topics' || !ui.topic || !storyOn(ui.topic) || !bundleOpen(ui.topic)) return null;
    const n = ui.topic, root = storyDom(n); if (!root) return null;
    const s = STORY[n], steps = storySteps(s), k = Math.max(0, Math.min(Number.isInteger(o.k) ? o.k : storyStepAt(root), steps.length - 1)), st = steps[k];
    const pts = []; let len = 0, cut = false;
    for (const [p, deeper] of [...st.pts.map(p => [p, false]), ...(Array.isArray(st.more) ? st.more : []).map(p => [p, true])]) { const raw = ptT(p), t = noSrc(raw); if (!t) continue; if (len + t.length > BUNDLE_MAX) { cut = true; continue; } pts.push({ t, src: srcOf(raw), deeper }); len += t.length; }
    if (!pts.length) return null;
    const credits = []; let cl = 0, more = false; for (const x of s.sources.filter(x => x && x.t)) { const t = String(x.t); if (cl + t.length > BUNDLE_CREDITS_MAX) { more = true; continue; } credits.push({ t, url: httpsOk(x.url) ? x.url : '' }); cl += t.length; }
    const guess = predOk(s) && !predState()[n]; // a guess-first question they have not answered: its answer is in these points
    return { topic: n, k, step: String(st.h), steps: steps.length, idea: noSrc(s.idea || '').slice(0, BUNDLE_IDEA_MAX), points: pts, cut, credits, moreCredits: more, guess, sel: String(o.sel || '').slice(0, 400), notes: bundleNotes(n) };
  } catch (e) { return null; }
}
// The bundle as plain text for a model.
function bundleText(b) {
  return `the topic ${b.topic}, step ${b.k + 1} of ${b.steps}: "${b.step}".\nThe big idea of the page: ${b.idea}\nMess's points for this step, each with its source in brackets:\n${b.points.map(p => '- ' + p.t + ' [' + p.src + ']' + (p.deeper ? ' (go deeper)' : '')).join('\n')}${b.cut ? '\n(More points on this step were left out for length.)' : ''}\nSources: ${b.credits.map(c => c.t).join(' | ')}${b.moreCredits ? ' | (more are listed on the page)' : ''}${b.guess ? '\nThis page opens with a guess-first question they have not answered yet. Do not give its answer away unless they ask for it.' : ''}${b.sel ? '\nThey selected this text: "' + b.sel + '"' : ''}${b.notes.length ? '\nTheir own notes on this topic (written by the student, not checked by Mess): ' + b.notes.join(' ') : ''}`;
}
const BUNDLE_RULE = ' If their question is about this page, answer from Mess\'s points for this step first. If you add anything that is not in those points, say plainly that it is not from Mess\'s page and that they should check it.';
// The two lines under "Ask or search" that say where the ? thinks you are. Redrawn after every render and on scroll,
// so they always name the step that would be sent.
function askWhere() {
  const el = document.getElementById('askwhere'); if (!el) return;
  const bn = pageBundle(), html = bn ? esc(' · step ' + (bn.k + 1) + ', ' + bn.step) + (aiReady() ? `<div id="askfrom">Answers start from this step's ${bn.points.length} point${bn.points.length === 1 ? '' : 's'}.</div>` : '') : '';
  if (el.innerHTML !== html) el.innerHTML = html;
}

// ---------- Fix a mistake from anywhere
// Students get things wrong in other question banks, on the ward and in teaching. On Today they type (or paste)
// what tripped them up, and Mess opens the story step that explains it. Built from how the best do it, then
// revised after Fable's review (claude/fable-review-2.md):
// - "What was the right answer?" is weighted above a pasted stem, because stems are mostly the patient story;
// - matching is BM25 over the story's steps, with field boosts (heading > bridge > points > deeper > why), an
//   abbreviation table and light stemming, in two stages: the condition, then the step. Offline, no AI;
// - a wrong match is worse than none, so the top step opens with two alternatives and "none of these";
// - the card is built from Mess's step (its points and why lines), not the pasted question;
// - an optional cause, only for questions, and each cause changes what Mess does (error-log practice; the
//   commonest real cause, "familiar but couldn't work it out", gets an explain card);
// - steps remember mistakes (like AMBOSS Learning Radar); Stats shows the commonest cause; undo removes it all.
// Patient details are removed first. All of it stays on the device.
const storySteps = (s) => (s.steps || []).filter(x => x && x.h && Array.isArray(x.pts));
const fixHere = (n, k) => !!(ui.fixAt && ui.fixAt.n === n && ui.fixAt.k === k);
const missLog = () => Array.isArray(db.missLog) ? db.missLog : (db.missLog = []);
const FIX_FROM = [['q', 'A question'], ['ward', 'The ward'], ['teach', 'Teaching']];
const FIX_WHY = [
  ['never', 'Never knew it', 'The story is open at the step that teaches it, and there’s a flashcard for tomorrow.'],
  ['recall', 'Knew it, couldn’t recall it', 'A flashcard for tomorrow, so it comes back before you forget it again.'],
  ['familiar', 'Looked familiar, couldn’t work it out', 'Your card asks you to explain the reasoning, not just recall the fact. This is the commonest cause of wrong answers.'],
  ['two', 'Down to two, picked the wrong one', 'Your card asks what tells the right answer apart from the one you picked.'],
  ['misread', 'Misread what was asked', 'Your knowledge was fine, so no card. Read the last line first, and pull out ages, timings and numbers before the options.'],
  ['bad', 'The question was wrong', 'No card. Check it against the sources on this step. If Mess agrees with what you chose, the question may be out of date: report it to the question bank.']
];
const FIX_OLD = { know: 'never', forgot: 'recall', trap: 'two', slip: 'misread' };
const fixReason = (e) => FIX_OLD[e.reason] || e.reason || '';
const fixShort = (t, n = 160) => t.length > n ? t.slice(0, n - 3).trim() + '…' : t;
const dayLabel = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

// Words: lower case, abbreviations expanded, light stemming so "exacerbations" meets "exacerbation".
const FIX_ABBR = { o2: 'oxygen', sats: 'saturations', spo2: 'saturations oxygen', co2: 'carbon dioxide hypercapnia', abg: 'arterial blood gas', vbg: 'venous blood gas', niv: 'non-invasive ventilation', bipap: 'non-invasive ventilation', ltot: 'long-term oxygen', abx: 'antibiotics', ics: 'inhaled corticosteroid', laba: 'long-acting beta agonist', lama: 'long-acting muscarinic antagonist', saba: 'short-acting beta agonist', fev1: 'fev1 spirometry', fvc: 'fvc spirometry', cxr: 'chest x-ray', ecg: 'ecg electrocardiogram', mi: 'myocardial infarction', pe: 'pulmonary embolism', aki: 'acute kidney injury', ckd: 'chronic kidney disease', bp: 'blood pressure', hr: 'heart rate', rr: 'respiratory rate', dx: 'diagnosis', mx: 'management', ix: 'investigations', sx: 'symptoms', tx: 'treatment', hx: 'history', pred: 'prednisolone steroid', steroids: 'steroid corticosteroid', a1at: 'alpha-1 antitrypsin', aat: 'alpha-1 antitrypsin', iv: 'intravenous', po: 'oral' };
const FIX_STOP = new Set('the and for was how why not too but its are you can did has had who use got one two all any about after again also because been being could does doing done from have into just know like make more most much need only other over should some than that their them then there these they this thought what when where which while with would wrong answer question said asked didn gave forgot today patient picked chose instead right correct year old man woman male female presents presenting history following best next likely most which'.split(' '));
const fixStem = (w) => { if (w.length < 6) return w.replace(/s$/, ''); for (const x of ['ations', 'ation', 'ising', 'izing', 'ing', 'ness', 'ment', 'ies', 'es', 's', 'ed']) if (w.endsWith(x) && w.length - x.length >= 4) return w.slice(0, -x.length); return w; };
const fixWords = (t) => String(t).toLowerCase().replace(/\[[^\]]*\]/g, ' ').replace(/[^a-z0-9%.\-]+/g, ' ').split(/\s+/).flatMap(w => { w = w.replace(/^[.\-]+|[.\-]+$/g, ''); return FIX_ABBR[w] ? FIX_ABBR[w].split(' ') : [w]; }).filter(w => w.length > 2 && !FIX_STOP.has(w)).map(fixStem);

// Stage 1, the condition: count topic mentions, the right answer weighted 3 times the stem. Topics with a story win ties.
function fixTopic(stem, right) {
  const score = {}; [[right, 3], [stem, 1]].forEach(([t, w]) => { if (!t) return; topicsIn(t).forEach(n => { const c = topicRe.filter(x => x[1] === n).reduce((a, [re]) => a + (String(t).match(new RegExp(re.source, 'gi')) || []).length, 0) || 1; score[n] = (score[n] || 0) + c * w; }); });
  return Object.keys(score).sort((a, b) => (score[b] + (storyHas(b) ? .5 : 0)) - (score[a] + (storyHas(a) ? .5 : 0)))[0] || null;
}
// Stage 2, the step: BM25 over the story's steps, fields boosted.
const FIX_FIELDS = [['h', 3], ['bridge', 1.5], ['pts', 1], ['more', .7], ['why', .5]];
function fixRank(n, stem, right) {
  const s = storyGet(n); if (!s) return [];
  const steps = storySteps(s), docs = steps.map(st => ({ h: fixWords(st.h), bridge: fixWords(st.bridge || ''), pts: fixWords(st.pts.map(ptT).join(' ')), more: fixWords((st.more || []).map(ptT).join(' ')), why: fixWords([...st.pts, ...(st.more || [])].map(ptWhy).join(' ')) }));
  const nameWords = new Set(fixWords(n)), q = {};
  [[right, 2], [stem, 1]].forEach(([t, w]) => fixWords(t || '').forEach(x => { if (!nameWords.has(x)) q[x] = Math.max(q[x] || 0, w); }));
  const N = docs.length, avg = {}; FIX_FIELDS.forEach(([f]) => { avg[f] = docs.reduce((a, d) => a + d[f].length, 0) / N || 1; });
  const has = (d, w) => FIX_FIELDS.some(([f]) => d[f].includes(w));
  return docs.map((d, k) => {
    let sc = 0; Object.entries(q).forEach(([w, wq]) => { const df = docs.filter(x => has(x, w)).length; if (!df) return; const idf = Math.log(1 + (N - df + .5) / (df + .5));
      FIX_FIELDS.forEach(([f, boost]) => { const tf = d[f].filter(x => x === w).length; if (tf) sc += wq * boost * idf * tf * 2.2 / (tf + 1.2 * (.25 + .75 * d[f].length / avg[f])); }); });
    return { k, score: sc };
  }).filter(r => r.score > 0).sort((a, b) => b.score - a.score);
}
// The points in a step that best match, with their why lines, for the card's back.
function fixPoints(n, k, stem, right) {
  const st = storySteps(storyGet(n))[k]; if (!st) return [];
  const q = new Set([...fixWords(right || ''), ...fixWords(stem || '')]);
  const all = [...st.pts, ...(st.more || [])].filter(ptT).map(p => ({ t: ptT(p), why: ptWhy(p), sc: fixWords(ptT(p) + ' ' + ptWhy(p)).filter(w => q.has(w)).length }));
  const hit = all.filter(p => p.sc).sort((a, b) => b.sc - a.sc).slice(0, 2);
  return (hit.length ? hit : all.slice(0, 2)).map(p => ({ t: p.t, why: p.why }));
}
// When nothing names the condition (a vignette usually doesn't), search every story's steps instead.
const storyNames = () => [...new Set([...Object.keys(STORY), ...(typeof packList === 'function' ? packList() : []).flatMap(p => Object.keys(p.stories || {}))])].filter(storyHas);
function fixFind(stem, right) {
  let n = fixTopic(stem, right);
  if (!n) { const best = storyNames().map(x => [x, (fixRank(x, stem, right)[0] || { score: 0 }).score]).sort((a, b) => b[1] - a[1])[0]; if (best && best[1] >= 3) n = best[0]; }
  if (!n) return null;
  if (!storyHas(n)) return { n, ranked: [], hit: false };
  const ranked = fixRank(n, stem, right); return { n, ranked: ranked.slice(0, 3).map(r => r.k), hit: ranked.length > 0 };
}

function fixNoteHTML(n, k) {
  const e = missLog().find(x => x.id === ui.fixAt.id); if (!e) return '';
  const r = fixReason(e), why = FIX_WHY.find(w => w[0] === r), steps = storySteps(storyGet(n)), qs = fixQs(n).length;
  const alts = (e.alts || []).filter(a => a !== k && steps[a]);
  return `<div class="sfixnote"><p style="margin:0 0 6px"><b>What you got wrong:</b> ${esc(fixShort(e.text))}</p>${e.right ? `<p style="margin:0 0 6px"><b>Right answer:</b> ${esc(fixShort(e.right, 200))}</p>` : ''}
  <p class="s" style="margin:0 0 8px">${alts.length ? 'Not this step? ' + alts.map(a => `<button class="tlink" data-a="fixstep" data-v="${a}">${esc(steps[a].h)}</button>`).join(' · ') + ' · ' : ''}<button class="tlink" data-a="fixnone">None of these</button></p>
  ${e.from === 'q' ? `<details class="dd ddinline fixwhyd"${ui.fixWhyOpen ? ' open' : ''}><summary class="tlink s">${why ? 'Why: ' + esc(why[1]) + ' · change ▾' : 'Why did you get it wrong? (optional) ▾'}</summary><div class="fixwhy" role="group" aria-label="Why did you get it wrong?">${FIX_WHY.map(([v, l]) => `<button class="seg ${r === v ? 'on' : ''}" aria-pressed="${r === v}" data-a="fixwhy" data-v="${v}">${l}</button>`).join('')}</div></details>` : ''}${why ? `<p class="s" style="margin:6px 0 0">${esc(why[2])}</p>` : e.card ? '<p class="s" style="margin:6px 0 0">There’s a flashcard for tomorrow, made from this step.</p>' : ''}
  <div class="row" style="gap:6px;margin-top:10px"><button class="btn sm" data-a="fixai">✦ Ask AI about it${aiReady() ? '' : ' ↗'}</button>${qs ? `<button class="btn sm" data-a="fixqs" data-v="${esc(n)}">Practise ${qs} ${qs === 1 ? 'question' : 'questions'} on this</button>` : ''}<button class="tlink s" data-a="fixundo">Undo</button></div></div>`;
}
// Steps you've got wrong before carry a quiet mark, newest first.
function fixPast(n, k) { const e = missLog().find(x => x.n === n && x.k === k); return e ? `<p class="spast s">You got this wrong on ${esc(dayLabel(e.d))}: ${esc(fixShort(e.right || e.text, 120))}</p>` : ''; }
const fixQs = (n) => typeof allQs === 'function' ? allQs().filter(Q => qTags(Q).includes(n)) : [];
// The commonest cause so far, once there are a few, with its tip (shown in Stats).
function fixPattern() {
  const done = missLog().filter(fixReason); if (done.length < 3) return null;
  const c = {}; done.forEach(x => { const r = fixReason(x); c[r] = (c[r] || 0) + 1; }); const [r, k] = Object.entries(c).sort((a, b) => b[1] - a[1])[0], w = FIX_WHY.find(x => x[0] === r);
  return w ? { label: w[1], k, of: done.length, tip: w[2].replace(/^(Your knowledge was fine, so no card\. |No card\. )/, '') } : null;
}
function fixBox() {
  const from = ui.fixFrom || 'q';
  return `<section aria-label="Got something wrong?" class="tsec fixbox"><button class="xsec" data-a="secoff" data-v="fix" aria-label="Remove this section">×</button><h2>Got something wrong today?</h2><p class="s m" style="margin:-4px 0 10px">Mess opens the step that explains it and makes you a flashcard for tomorrow.</p>
  <div class="ssrange fixfrom" role="group" aria-label="Where was it?">${FIX_FROM.map(([v, l]) => `<button class="seg ${from === v ? 'on' : ''}" aria-pressed="${from === v}" data-a="fixfrom" data-v="${v}">${l}</button>`).join('')}</div>
  <div class="fixin"><input class="f" id="fixin" maxlength="3000" aria-label="${from === 'q' ? 'What tripped you up? You can paste the question' : 'What did you get wrong or see?'}" placeholder="${from === 'q' ? 'What tripped you up? Or paste the question' : from === 'ward' ? 'e.g. gave high-flow oxygen to a COPD patient' : 'e.g. didn’t know why spirometry ratio matters'}" data-enter="fixgo">${from === 'q' ? '<input class="f" id="fixright" maxlength="400" aria-label="What was the right answer? (optional)" placeholder="The right answer (optional)" data-enter="fixgo">' : ''}<button class="btn pri" data-a="fixgo">Explain it</button></div></section>`;
}
const fixStep = (e) => { const s = storyGet(e.n); return s && e.k >= 0 ? storySteps(s)[e.k] : null; };
function fixCardText(e) {
  const st = fixStep(e), r = fixReason(e), pts = e.pts || [], what = e.right ? '“' + fixShort(e.right, 140) + '”' : 'what you got wrong';
  const back = (pts.length ? pts.map(p => p.t.replace(/\s*\[[^\]]+\]\s*$/, '') + (p.why ? '\nWhy: ' + p.why : '')).join('\n\n') : (e.right || '')) + (st ? '\n(' + e.n + ': ' + st.h + ')' : '');
  const place = st ? e.n + ', ' + st.h.toLowerCase() : e.n;
  const front = r === 'familiar' ? 'Explain the reasoning (' + place + '): why is ' + what + ' right?' : r === 'two' ? 'You were down to two (' + place + '). What tells ' + what + ' apart from the option you picked?' : e.right ? place + ': why is it ' + what + '?' : place + ': you got this wrong: “' + fixShort(e.text, 120) + '”. What’s right, and why?';
  return { front, back };
}
function fixCard(e) {
  if (['misread', 'bad'].includes(fixReason(e))) return fixDropCard(e);
  if (!e.pts || !e.pts.length) { if (!e.right) return; }
  const { front, back } = fixCardText(e), c = (db.cards || []).find(x => x.id === e.card);
  if (c) { c.f = front; c.b = back; return; }
  if (addCard(front, back, 'Got wrong', e.n)) { const nc = db.cards[db.cards.length - 1]; nc.due = Date.now() + 864e5; e.card = nc.id; }
}
const fixDropCard = (e) => { if (e.card) { db.cards = (db.cards || []).filter(c => c.id !== e.card); e.card = ''; } };
const fixEntry = () => ui.fixAt && missLog().find(x => x.id === ui.fixAt.id);
const fixScrollTo = (k) => setTimeout(() => { const el = document.getElementById('sstep' + k); if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' }); }, 60);
Object.assign(act, {
  fixfrom: (v) => { ui.fixFrom = v; render(); },
  fixgo: () => {
    const raw = val('fixin'), rawR = val('fixright') || ''; if (!raw && !rawR) return;
    const text = intakeIn(raw || rawR, 3000).replace(/\s+/g, ' ').trim(), right = raw && rawR ? intakeIn(rawR, 400).replace(/\s+/g, ' ').trim() : '', from = ui.fixFrom || 'q'; if (!text) return;
    db.missed = [fixShort(right || text), ...(db.missed || []).filter(x => x !== fixShort(right || text))].slice(0, 30);
    const f = fixFind(text, right);
    if (!f) { save(); const q = 'I got this wrong (or saw it) today: "' + text + '".' + (right ? ' The right answer was: "' + right + '".' : '') + ' Explain it so I understand it: the big idea first, then why the right answer is right, the clue that decides it, and one rule to remember. Say where you are unsure.'; if (aiReady()) { ui.askOpen = true; render(); ask(q); } else openOwn(db.ownAI || 'Claude', buildPrompt(q)); return; }
    const k = f.hit ? f.ranked[0] : -1;
    const e = { id: 'm' + Date.now(), d: new Date().toISOString(), text, right, from, n: f.n, k, alts: f.ranked.slice(1), pts: k >= 0 ? fixPoints(f.n, k, text, right) : [], reason: '', card: '' };
    if (k >= 0) fixCard(e);
    missLog().unshift(e); db.missLog = missLog().slice(0, 200);
    ui.fixAt = k >= 0 ? { n: f.n, k, text, id: e.id } : null; ui.fixWhyOpen = false; save(); act.topicopen(f.n);
    if (k >= 0) fixScrollTo(k);
    toast(!storyHas(f.n) && rewriting(f.n) ? 'The story for ' + f.n + ' is being rewritten from open sources, so here is its topic page. No flashcard was made.' : !storyHas(f.n) ? 'Mess hasn’t written a story for ' + f.n + ' yet, so here are its notes.' : k < 0 ? 'Here’s the story for ' + f.n + '. Mess couldn’t tell which step, so start from the top.' : 'This step should explain it. Not right? Pick another just above it.');
  },
  fixstep: (v) => { const e = fixEntry(); if (!e) return; const k = +v; e.alts = [e.k, ...(e.alts || []).filter(a => a !== k)].slice(0, 2); e.k = k; e.pts = fixPoints(e.n, k, e.text, e.right); fixCard(e); ui.fixAt.k = k; save(); render(); fixScrollTo(k); },
  // None of these: a content gap. The card keeps their own right answer, if they gave one.
  fixnone: () => { const e = fixEntry(); if (!e) return; e.k = -1; e.gap = true; e.pts = []; if (e.right) fixCard(e); else fixDropCard(e); ui.fixAt = null; save(); window.scrollTo(0, 0); render(); toast('Noted as a gap in Mess’s notes.' + (e.card ? ' Your right answer is a flashcard for tomorrow.' : '')); },
  fixwhy: (v) => { const e = fixEntry(); if (!e) return; e.reason = fixReason(e) === v ? '' : v; ui.fixWhyOpen = false; fixCard(e); save(); render(); },
  fixundo: () => {
    const e = fixEntry(); if (!e) return;
    fixDropCard(e); db.missLog = missLog().filter(x => x !== e); db.missed = (db.missed || []).filter(x => x !== fixShort(e.right || e.text));
    ui.fixAt = null; save(); go('Today'); toast('Undone. Nothing was kept.');
  },
  fixai: () => {
    const e = fixEntry(), st = e && fixStep(e); if (!st) return;
    if (STORY[e.n] && typeof bundleOpen === 'function' && !bundleOpen(e.n)) return toast('This story isn\'t one Mess can send to an AI. Ask about it in your own words.'); // Mess's own story, not built from open sources
    const pts = [...st.pts, ...(st.more || [])].map(p => '- ' + ptT(p) + (ptWhy(p) ? ' (why it matters: ' + ptWhy(p) + ')' : '')).join('\n');
    const q = 'I got this wrong: "' + e.text + '".' + (e.right ? ' The right answer was: "' + e.right + '".' : '') + '\n\nHere is the relevant step from my notes on ' + e.n + ' (' + st.h + '), written from current guidance:\n' + pts + '\n\nUsing these notes as the source of truth, explain why I went wrong, the clue that decides it, and one rule to remember. If my notes don\'t cover it, say so plainly instead of guessing.';
    if (aiReady()) { ui.askOpen = true; render(); ask(q); } else openOwn(db.ownAI || 'Claude', buildPrompt(q));
  },
  fixqs: (n) => { const qs = fixQs(n); if (!qs.length) return; ui.fixAt = null; Object.assign(ui.q, { only: qs, extra: [], i: 0, pick: null, score: 0, stage: 'session' }); ui.mode = 'Questions'; go('Practice'); }
});

// ---------- Guess first, explain later
// Each story can carry one question asked before reading and one explain question a week later. From the
// research (Pan & Carpenter 2023; St. Hilaire & Carpenter 2020; Dunlosky et al. 2013; Fable's review, claude/fable-review-2.md):
// - one prequestion, multiple choice with tempting wrong options taken from common misconceptions, on a fact
//   the story states directly (inference questions work less well); the student taps an answer (overt beats covert);
// - it only helps if they find the answer, so Mess says which step answers it and reveals it there;
// - wrong guesses don't stick if they're corrected, and students avoid guessing unless told why, so one line says so;
// - the stronger half is retrieval a week later: they type an explanation, then tick a checklist, which suggests
//   the grade (all ticked Good, some Hard, none Again). Skippable, asked once per story, stored on the device.
const predSteps = (s) => (s.steps || []).filter(x => x && x.h && Array.isArray(x.pts));
const predState = () => db.predict && typeof db.predict === 'object' && !Array.isArray(db.predict) ? db.predict : (db.predict = {});
const predOk = (s) => { const p = s && s.predict; return !!(p && p.q && Array.isArray(p.opts) && p.opts.length >= 2 && Number.isInteger(p.a) && p.opts[p.a] && Number.isInteger(p.step) && predSteps(s)[p.step]); };
// Show the options in a fixed but mixed order, so the right one isn't always first.
const predOrder = (n, k) => { let h = 0; for (const c of n) h = (h * 31 + c.charCodeAt(0)) >>> 0; return [...Array(k).keys()].sort((a, b) => ((a * 7 + h) % 11) - ((b * 7 + h) % 11)); };
function predTop(n, s) {
  if (!predOk(s)) return ''; const p = s.predict, st = predState()[n], step = predSteps(s)[p.step];
  if (!st) return `<section class="spred" aria-label="Before you read"><p class="s m" style="margin:0 0 4px"><b>Before you read: one question.</b> Guess first, even if you're not sure. Guessing, then finding the answer, makes it stick.</p><p class="spq">${esc(p.q)}</p><div class="spopts">${predOrder(n, p.opts.length).map(i => `<button class="opt" data-a="predpick" data-v="${i}">${esc(p.opts[i])}</button>`).join('')}</div><p class="s" style="margin:8px 0 0"><button class="tlink" data-a="predskip">Skip</button></p></section>`;
  if (st.skip) return '';
  return `<p class="spred spdone s">You guessed: <b>${esc(p.opts[st.pick] || '')}</b>. Look for the answer as you read: it's in step ${p.step + 1}, <button class="tlink" data-a="predjump" data-v="${p.step}">${esc(step.h)} ↓</button></p>`;
}
function predReveal(n, s, k) {
  if (!predOk(s) || s.predict.step !== k) return ''; const p = s.predict, st = predState()[n]; if (!st || st.skip) return '';
  const right = st.pick === p.a;
  return `<div class="spans ${right ? 'ok' : 'no'}"><p style="margin:0 0 4px"><b>${right ? 'You guessed right.' : 'Before reading, you guessed: ' + esc(p.opts[st.pick] || '') + '.'}</b>${right ? '' : ' The answer: ' + esc(p.opts[p.a]) + '.'}</p>${p.why ? `<p class="s" style="margin:0">${esc(p.why)}</p>` : ''}</div>`;
}
// The explain card: due in a week, typed then checked against a short list.
function predExplainCard(n, s) {
  const e = s.explain; if (!e || !e.q || !Array.isArray(e.check) || !e.check.length) return;
  if (addCard(e.q, e.check.map(c => '• ' + c).join('\n'), 'Explain', n)) { const c = db.cards[db.cards.length - 1]; c.kind = 'explain'; c.check = e.check.slice(0, 4); c.due = Date.now() + 7 * 864e5; }
}
Object.assign(act, {
  predpick: (v) => { const n = ui.topic, s = storyGet(n); if (!predOk(s)) return; predState()[n] = { pick: +v, d: new Date().toISOString().slice(0, 10) }; predExplainCard(n, s); save(); render(); },
  predskip: () => { const n = ui.topic, s = storyGet(n); if (!predOk(s)) return; predState()[n] = { skip: true, d: new Date().toISOString().slice(0, 10) }; predExplainCard(n, s); save(); render(); },
  predjump: (v) => { const el = document.getElementById('sstep' + v); if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' }); }
});
