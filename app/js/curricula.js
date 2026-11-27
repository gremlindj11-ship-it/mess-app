// Mess · curricula.js · Topics laid out by the student's own curriculum, with every section there.
// Loaded in this order by index.html: store.js, safety.js, intake.js, links.js, ai.js, flow.js, tools.js, intro.js, today.js, practice.js, stats.js, topics.js, story.js, curricula.js, route.js, diagrams.js, placement.js, profile.js, import.js, packs.js, apps.js, boot.js.
// All files share one global scope (plain scripts, no build step).
//
// Mess has one topic web; a curriculum is a view onto it (assets/curricula.js). Pick yours and Topics
// shows its areas and items in its own words. Items Mess hasn't written yet still show, so nothing in the
// curriculum is missing: open one to have it taught, bring in your own notes, or make it one of your topics.

const CURS = typeof CURRICULA === 'object' && CURRICULA ? CURRICULA : {};
function curNow() { const c = db.profile.curriculum || ''; const id = Object.keys(CURS).find(k => CURS[k].exams && CURS[k].exams.test(c)); return id ? { id, ...CURS[id] } : null; }
const curItems = (cur) => Object.entries(cur.areas).flatMap(([area, list]) => list.map(([label, tops, part]) => ({ area, label, part: !!part, tops: (tops || []).filter(t => TOPICS.has(t)) })));
// An item counts as written when it points at a Mess topic, or the student has made it one of theirs.
const curTopicFor = (it) => it.tops[0] || (TOPICS.has(it.label) ? it.label : null);
function curStats(cur) { const all = curItems(cur), has = all.filter(curTopicFor); return { all: all.length, done: has.filter(x => !x.part || !x.tops.length).length, part: has.filter(x => x.part && x.tops.length).length }; }

function curItemPage(cur, it) {
  return `<section class="tpage"><button class="tlink s" data-a="curback">← ${esc(it.area)}</button><h1 style="margin:8px 0 2px;font-size:clamp(28px,4vw,44px)">${esc(it.label)}</h1><div class="s m" style="margin-bottom:16px">${esc(cur.short)} · ${esc(it.area)}</div>
  <div class="card" style="max-width:640px"><p style="margin:0 0 6px"><b>Mess hasn't written notes for this yet.</b></p><p class="s m" style="margin:0 0 14px">It's on the ${esc(cur.name)} (${esc(cur.version)}), so it's here for you. Learn it now, bring in notes you already have, or make it one of your topics so everything you add links to it.</p>
  <div class="row"><button class="btn pri" data-a="curteach">✦ Teach me${aiReady() ? '' : ' ↗'}</button><button class="btn" data-a="lecopen">Bring in your notes</button><button class="btn" data-a="curmake">Make it one of my topics</button></div></div></section>`;
}
function curTopics(cur) {
  const q = (ui.tq || '').toLowerCase(), items = curItems(cur), areaNames = Object.keys(cur.areas), st = curStats(cur);
  const area = ui.carea && (areaNames.includes(ui.carea) || ui.carea === 'Drugs' || ui.carea === PRACTICE_NAME) ? ui.carea : areaNames[0];
  const btn = (it) => { const t = curTopicFor(it); return t ? `<button class="cbtn" data-a="topicopen" data-v="${esc(t)}">${esc(it.label)}${it.part && it.tops.length ? ' <span class="m s">· partly</span>' : it.tops.length > 1 ? ` <span class="m s">· ${it.tops.length} topics</span>` : ''}</button>` : `<button class="cbtn cunwritten" data-a="curopen" data-v="${esc(it.area + '\u0001' + it.label)}">${esc(it.label)} <span class="m s">· not written yet</span></button>`; };
  const list = area === 'Drugs' ? [...TOPICS.values()].filter(t => t.kind === 'd').sort((a, b) => a.name.localeCompare(b.name)).map(t => `<button data-a="topicopen" data-v="${esc(t.name)}">${esc(t.name)}</button>`).join('') : (cur.areas[area] || []).map(([label]) => items.find(x => x.area === area && x.label === label)).map(btn).join('');
  const found = q ? items.filter(it => it.label.toLowerCase().includes(q) && !curTopicFor(it)) : [];
  return { area, areaNames, st, list, found };
}
// Wrap the Topics page: same header, search and "Yours so far", but the areas and lists come from the curriculum.
{ const base = topics; topics = function () {
  const cur = curNow(); if (!cur || ui.tnew || (ui.topic && TOPICS.has(ui.topic)) || (ui.ptopic && PRACTICE.has(ui.ptopic))) return base();
  if (ui.citem) { const [a, l] = ui.citem.split('\u0001'), it = curItems(cur).find(x => x.area === a && x.label === l); if (it && !curTopicFor(it)) return curItemPage(cur, it); ui.citem = null; }
  const html = base(), v = curTopics(cur), q = (ui.tq || '').trim();
  const cov = `<p class="s m ccov">${esc(cur.short)}: Mess covers <b>${v.st.done}</b> of ${v.st.all} conditions${v.st.part ? ' and partly covers ' + v.st.part : ''}. The rest are listed so you can learn them now and bring your own notes. <a href="${cur.source}" target="_blank" rel="noopener">Source ↗</a></p>`;
  if (q) { if (!v.found.length) return html; const extra = `<div class="row" style="gap:6px;margin-top:10px"><span class="s m">On the ${esc(cur.short)}, not written yet:</span>${v.found.slice(0, 12).map(it => `<button class="tag big cunwritten" data-a="curopen" data-v="${esc(it.area + '\u0001' + it.label)}">${esc(it.label)}</button>`).join('')}</div>`; const i = html.lastIndexOf('</div>'); return i > 0 ? html.slice(0, i) + extra + html.slice(i) : html + extra; }
  const a = html.indexOf('<div class="tlearn">'); if (a < 0) return html;
  return html.slice(0, a) + cov + (isPhone() ? `<label class="s m" for="careapick">Area</label><select class="f" id="careapick" data-careapick style="margin:4px 0 14px">${[...v.areaNames, 'Drugs', PRACTICE_NAME].map(x => `<option ${x === v.area ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select>` : '') + `<div class="tlearn">${isPhone() ? '' : `<nav class="trail" aria-label="Areas">${[...v.areaNames, 'Drugs', PRACTICE_NAME].map(x => `<button class="${x === v.area ? 'on' : ''}" data-a="careaset" data-v="${esc(x)}">${esc(x)}</button>`).join('')}</nav>`}<div class="tcontent"><h2 style="margin:0 0 10px">${esc(v.area)}</h2>${v.area === PRACTICE_NAME ? practiceList() : `<div class="tlist">${v.list}</div><p class="s m" style="margin:16px 0 0">${esc(cur.licence)}</p>`}</div></div>`;
}; }
Object.assign(act, {
  careaset: (v) => { ui.carea = v; ui.citem = null; render(); },
  curopen: (v) => { ui.citem = v; ui.topic = null; window.scrollTo(0, 0); render(); },
  curback: () => { ui.citem = null; render(); },
  curteach: () => { const cur = curNow(), [, l] = (ui.citem || '').split('\u0001'); if (!cur || !l) return; const q = 'Teach me ' + l + ' for the ' + cur.name + '. Use ' + cur.guidance + '. Start with the big idea, then build it step by step so each part explains the next: who gets it, what goes wrong, what that causes, how you prove it, what you do and why. Say where you are unsure.'; if (aiReady()) { ui.askOpen = true; render(); ask(q); } else openOwn(db.ownAI || 'Claude', buildPrompt(q)); },
  curmake: () => { const cur = curNow(), [a, l] = (ui.citem || '').split('\u0001'); if (!cur || !l) return; db.myTopics = db.myTopics || []; if (!TOPICS.has(l)) { db.myTopics.push({ name: l, kind: 'c', area: a, al: [], rel: [], drugs: [] }); syncMyTopics(db.myTopics); } save(); ui.citem = null; act.topicopen(l); toast('Added to your topics. Anything you write about ' + l + ' links here now.'); }
});
{ const g = act.go; act.go = (v) => { ui.citem = null; return g(v); }; }
document.addEventListener('change', (e) => { if (e.target && e.target.dataset && 'careapick' in e.target.dataset) act.careaset(e.target.value); });
// Guidance follows the curriculum: Mess's AI prompts are written for UK students (NICE, BNF; the copy-and-paste
// prompts and the in-app ones say "where UK guidance matters, name the guideline"). For a student on
// another country's curriculum, they're rewritten on the way out to name that country and its own guidance.
function guideText(t) {
  const cur = curNow() || (courseCountry() ? { country: courseCountry() } : null); if (typeof t !== 'string' || !cur || !cur.country || cur.country === 'UK') return t;
  const g = cur.guidance || ('current national guidance in ' + cur.country);
  return t.replace(/\bUK (final-year )?medical student/g, (m, f) => 'medical student in ' + cur.country + (f ? ' (final year)' : ''))
    .replace(/\b(following|Follow|Use) (UK guidance \()?NICE(,| and)( the)? BNF\)?/g, (m, v) => v + ' ' + g)
    .replace(/\b(where|Where) UK guidance matters\b/g, (m, w) => w + ' ' + g + ' matters').replace(/\bper UK guidance\b/g, 'per ' + g)
    .replace(/\bfollowing NICE\b/g, 'following ' + g).replace(/\bUse UK spelling\.?\s*/g, '');
}
