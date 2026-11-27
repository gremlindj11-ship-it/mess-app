// Mess · inpractice.js · "In practice": what the exam tests that is not a diagnosis or a drug.
// Law and ethics, certificates and duties, prevention, safe practice, consultation skills, evidence and projects.
// Loaded after curricula.js and before route.js. All files share one global scope (plain scripts, no build step).
//
// The items live in PRACTICE (assets/topics.js), apart from the conditions and drugs in TOPICS, because they link
// to conditions by situation, not physiology. Nothing here tags a student's notes, counts towards stats or the
// curriculum map, or gets taught with the condition headings. A page says "Not written yet" until its content has
// been through the checked process; until then it gives the official source and the conditions it comes up with.

const pChip = (n, big) => `<button class="tag${big ? ' big' : ''}" data-a="practiceopen" data-v="${esc(n)}">${esc(n)}</button>`;
const pTopicChip = (n) => `<button class="tag big" data-a="topicopen" data-v="${esc(n)}">${esc(n)}</button>`;
const practiceOpen = () => !(ui.topic && TOPICS.has(ui.topic)) && ui.ptopic && PRACTICE.has(ui.ptopic) ? PRACTICE.get(ui.ptopic) : null;

// The tiny ?: sits beside something confusing and opens the main ? with a question already written.
// Nothing is sent until the student presses Ask. One per screen, never beside a button.
const tinyQ = (prompt) => `<button class="tinyq" data-a="tinyq" data-v="${esc(prompt)}" title="Ask about this" aria-label="Ask about this"><span aria-hidden="true">?</span></button>`;

const P_NATIONS = ['England', 'Wales', 'Scotland', 'Northern Ireland'];
const pJoin = (l) => l.length > 1 ? l.slice(0, -1).join(', ') + ' and ' + l[l.length - 1] : l[0] || '';
// The nations a source leaves out, when the source itself says which ones it covers.
const practiceOthers = (p) => !p.where || p.where === 'UK' ? [] : P_NATIONS.filter(x => !new RegExp('\\b' + x + '\\b').test(p.where));

// The list on the Topics page: its own section, grouped by the six groups, never inside a body-system area.
function practiceList() {
  return `<p class="s m" style="margin:0 0 4px;max-width:640px">What comes up that isn't a diagnosis or a drug. None of these is written yet. Each one opens its official source and the conditions it comes up with.</p>` + PRACTICE_GROUPS.map(g => { const l = [...PRACTICE.values()].filter(p => p.area === g).sort((a, b) => a.name.localeCompare(b.name)); return l.length ? `<h3 class="pgh">${esc(g)}</h3><div class="tlist">${l.map(p => `<button data-a="practiceopen" data-v="${esc(p.name)}">${esc(p.name)}</button>`).join('')}</div>` : ''; }).join('');
}

// One folded row on a condition or drug page. Nothing else on the page moves.
function practiceRow(n, isDrug) {
  const l = practiceFor(n); if (!l.length) return '';
  return `<details class="dd ddinline prow"><summary class="tlink">Also for this ${isDrug ? 'drug' : 'condition'} <span class="m">${l.length}</span> ▾</summary><p class="s m" style="margin:4px 0 7px">${esc(PRACTICE_NAME)}: the rules, checks and conversations it comes up in.</p><div class="row" style="gap:5px">${l.map(p => pChip(p.name)).join('')}</div></details>`;
}

// Search results on the Topics page, shown under the conditions and drugs.
function practiceHits(q) { const l = practiceFind(q); return l.length ? `<div class="row" style="gap:6px;margin-top:10px"><span class="s m">${esc(PRACTICE_NAME)}</span>${l.slice(0, 12).map(p => pChip(p.name, true)).join('')}</div>` : ''; }
const practiceNamed = (q) => { q = String(q || '').trim().toLowerCase(); return q ? [...PRACTICE.values()].find(p => p.name.toLowerCase() === q || p.al.some(a => a.toLowerCase() === q)) : null; };

function practicePage(p) {
  const n = p.name, country = courseCountry(), others = practiceOthers(p), flag = !country && others.length > 0, safe = /^https:\/\//.test(p.url);
  const askNation = `${n}: what applies in ${pJoin(others)}, and is it different from ${p.where}?`;
  const askTeach = `Teach me ${n} for finals, step by step, with the official source for each point.`;
  const where = country && p.where ? `<p class="s m abroad" style="margin:0 0 12px;max-width:640px">This is a UK source. Check what applies in ${esc(country)}.</p>`
    : flag ? `<p class="s m pwhere" style="margin:0 0 12px;max-width:640px">The source below covers ${esc(p.where)}. ${esc(pJoin(others))} ${others.length > 1 ? 'are' : 'is'} covered separately.${tinyQ(askNation)}</p>` : '';
  const source = safe ? `<p class="s m" style="margin:0 0 2px">Official source</p><p style="margin:0"><a class="rlink" href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.src || p.url)} ↗</a></p>` : `<p class="s m" style="margin:0">No source is pinned for this one yet.</p>`;
  return `<section class="tpage ppage"><button class="tlink s" data-a="practiceback">← ${esc(PRACTICE_NAME)}</button><h1 style="margin:8px 0 2px;font-size:clamp(28px,4vw,44px)">${esc(n)}</h1><div class="s m" style="margin-bottom:12px">${esc(PRACTICE_NAME)} · ${esc(p.area)}${p.al.length ? ' · also ' + esc(p.al.slice(0, 3).join(', ')) : ''}</div>${where}
  <div class="card" style="max-width:640px"><p style="margin:0 0 6px"><b>Not written yet</b>${flag ? '' : tinyQ(askTeach)}</p><p class="s m" style="margin:0 0 14px">Mess hasn't written this one. ${safe ? 'Until it has, read it at the source.' : 'It is listed so you know it comes up.'}</p>${source}</div>
  ${p.rel.length ? `<h3 class="pgh">Comes up with</h3><div class="row" style="gap:6px">${p.rel.filter(x => TOPICS.has(x)).map(pTopicChip).join('')}</div>` : ''}${p.drugs.length ? `<h3 class="pgh">Drugs</h3><div class="row" style="gap:6px">${p.drugs.filter(x => TOPICS.has(x)).map(pTopicChip).join('')}</div>` : ''}</section>`;
}

Object.assign(act, {
  practiceopen: (v) => { if (!PRACTICE.has(v)) return; if (typeof rememberTopicChat === 'function') rememberTopicChat(); ui.ptopic = v; ui.topic = null; ui.citem = null; ui.tform = null; ui.tnew = null; ui.tfedit = null; ui.tdel = null; ui.note = ''; ui.askOpen = false; if (typeof hideLinkPop === 'function') hideLinkPop(); if (ui.page === 'Topics') { ui.fresh = true; window.scrollTo(0, 0); render(); } else go('Topics'); },
  practiceback: () => { ui.ptopic = null; ui.tq = ''; ui.tarea = PRACTICE_NAME; ui.carea = PRACTICE_NAME; window.scrollTo(0, 0); render(); },
  // Open the main ? with the question written in. The student reads it, changes it if they like, then sends it.
  tinyq: (v) => { ui.report = false; ui.askOpen = true; render(); const i = $('#askin'); if (i) { i.value = v; i.focus(); try { i.setSelectionRange(0, 0); } catch (e) { } i.scrollLeft = 0; } }
});
// Leaving for a condition, a curriculum item, a new topic or the Topics list closes the open item.
['topicopen', 'curopen', 'tnew'].forEach(k => { const f = act[k]; if (typeof f === 'function') act[k] = (v) => { ui.ptopic = null; return f(v); }; });
{ const g = act.go; act.go = (v) => { if (v === 'Topics') ui.ptopic = null; return g(v); }; }
// Adding your own topic with a name Mess already uses here opens that item instead of making a second one.
{ const s = act.tfsave; act.tfsave = () => { const e = $('#tfn'), p = e && !ui.tfedit ? practiceNamed(e.value.replace(/\s+/g, ' ')) : null; if (!p) return s(); ui.tnew = null; ui.tq = ''; act.practiceopen(p.name); toast(`That one is in ${PRACTICE_NAME}, so here it is.`); }; }

// Arriving by a link, anywhere in Mess: the page you land on shows the link back to where you came from,
// highlighted, and opens the fold it sits in. From Fitness to drive to Stroke, Stroke's "Also for this condition"
// row is open with Fitness to drive picked out. It lasts until you go somewhere else.
const linkPageNow = () => ui.page !== 'Topics' ? null : ui.topic && TOPICS.has(ui.topic) ? ui.topic : practiceOpen() ? ui.ptopic : null;
['topicopen', 'practiceopen'].forEach(k => { const f = act[k]; act[k] = (v) => { const from = linkPageNow(); ui.from = from && from !== v ? from : null; return f(v); }; });
['go', 'topicback', 'practiceback', 'curopen', 'tnew'].forEach(k => { const f = act[k]; if (typeof f === 'function') act[k] = (v) => { ui.from = null; return f(v); }; });
function markFrom() {
  const here = linkPageNow(); if (!ui.from || !here || here === ui.from) return;
  document.querySelectorAll('.tpage [data-a="topicopen"], .tpage [data-a="practiceopen"]').forEach(b => { if (b.dataset.v !== ui.from) return; b.classList.add('camefrom'); b.setAttribute('aria-current', 'true'); const d = b.closest('details'); if (d) d.open = true; });
  // If that link sits below the first screen (a phone), or the page has no link back, say where you came from under the title.
  const marked = [...document.querySelectorAll('.tpage .camefrom')], h = document.querySelector('.tpage h1'), sub = h && ((h.closest('.thead') || h).nextElementSibling);
  if (!sub || marked.some(b => b.getBoundingClientRect().top + scrollY < innerHeight - 60)) return;
  const p = document.createElement('p'); p.className = 's m fromtop'; p.textContent = 'From '; const c = document.createElement('button'); c.className = 'tag camefrom'; c.dataset.a = PRACTICE.has(ui.from) ? 'practiceopen' : 'topicopen'; c.dataset.v = ui.from; c.textContent = ui.from; p.appendChild(c); sub.before(p);
}
