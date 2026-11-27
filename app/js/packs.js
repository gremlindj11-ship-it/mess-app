// Mess · packs.js · Packs: community content, checked and capped.
// Loaded in this order by index.html: store.js, safety.js, intake.js, links.js, ai.js, flow.js, tools.js, intro.js, today.js, practice.js, stats.js, topics.js, story.js, curricula.js, route.js, diagrams.js, placement.js, profile.js, import.js, packs.js, apps.js, boot.js.
// All files share one global scope (plain scripts, no build step).

// ---------- Packs: community content anyone can make and share.
// Data only: a pack can never run code. Everything is checked and capped
// when it's added, kept under its own id, and removed cleanly.
const PACK_LIMITS = { bytes: 5e6, cards: 5000, questions: 2000, stations: 300, mnemonics: 500, topics: 500, str: 2000 };
function packCheck(o) {
  const errs = [], S = (x, n = PACK_LIMITS.str) => typeof x === 'string' && x.trim() ? x.trim().slice(0, n) : '', A = (x) => Array.isArray(x) ? x : [];
  if (!o || typeof o !== 'object' || o.mess !== 'pack') return { errs: ["That isn't a Mess pack."] };
  const id = S(o.id, 60).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, ''), name = S(o.name, 80);
  if (!id) errs.push('It needs an id.'); if (!name) errs.push('It needs a name.');
  const out = { id, name, version: S(o.version, 20) || '1', author: S(o.author, 80) || 'Unknown', description: S(o.description, 400), licence: S(o.licence, 60), source: /^https:\/\//.test(S(o.source)) ? S(o.source, 300) : '', added: Date.now() };
  out.cards = A(o.cards).slice(0, PACK_LIMITS.cards).map(c => c && { f: S(c.f, 600), b: S(c.b, 600), topic: S(c.topic, 80) }).filter(c => c && c.f && c.b);
  out.questions = A(o.questions).slice(0, PACK_LIMITS.questions).map(q => { if (!q) return null; const opts = A(q.opts).map(x => S(x, 300)).filter(Boolean).slice(0, 5); return opts.length >= 2 && Number.isInteger(q.a) && q.a >= 0 && q.a < opts.length && S(q.stem) ? { stem: S(q.stem), opts, a: q.a, why: S(q.why, 800), topic: S(q.topic, 80) } : null; }).filter(Boolean);
  out.topics = A(o.topics).slice(0, PACK_LIMITS.topics).map(t => t && S(t.name, 80) ? { name: S(t.name, 80), kind: t.kind === 'd' ? 'd' : 'c', area: S(t.area, 60) || 'From packs', al: A(t.al).map(x => S(x, 60)).filter(Boolean).slice(0, 10), rel: A(t.rel).map(x => S(x, 80)).filter(Boolean).slice(0, 20), drugs: A(t.drugs).map(x => S(x, 80)).filter(Boolean).slice(0, 20) } : null).filter(Boolean);
  out.notes = {}; if (o.notes && typeof o.notes === 'object') Object.entries(o.notes).slice(0, 500).forEach(([t, secs]) => { if (!secs || typeof secs !== 'object') return; Object.entries(secs).forEach(([h, pts]) => { const l = A(pts).map(x => S(x, 400)).filter(Boolean).slice(0, 20); if (l.length) ((out.notes[S(t, 80)] = out.notes[S(t, 80)] || {})[S(h, 60)] = l); }); });
  out.mnemonics = A(o.mnemonics).slice(0, PACK_LIMITS.mnemonics).map(m => S(m && m.text || m, 600)).filter(Boolean);
  const SL = (x, n) => A(x).map(y => S(y, n)).filter(Boolean);
  out.stations = A(o.stations).slice(0, PACK_LIMITS.stations).filter(s => s && S(s.label) && S(s.task)).map((s, k) => { const t = s.teach && typeof s.teach === 'object' ? s.teach : {}; return { id: 'pk-' + id + '-' + (S(s.id, 40) || k), cat: S(s.cat, 60) || 'From packs', label: S(s.label, 80), focus: S(s.focus, 160) || S(s.label, 80), who: S(s.who, 120), task: S(s.task, 600), open: S(s.open, 600), sections: A(s.sections).filter(x => Array.isArray(x) && S(x[0])).slice(0, 30).map(([h, l]) => [S(h, 80), SL(l, 600).slice(0, 20)]), gates: A(s.gates).filter(x => Array.isArray(x) && Array.isArray(x[0])).slice(0, 60).map(([ks, r]) => [SL(ks, 60).slice(0, 20), S(r, 800)]), marks: A(s.marks).filter(x => Array.isArray(x) && S(x[0])).slice(0, 40).map(([m, re]) => [S(m, 120), S(re, 300)]), teach: { dx: S(t.dx, 200), ddx: SL(t.ddx, 120).slice(0, 10), next: SL(t.next, 300).slice(0, 10), points: SL(t.points, 300).slice(0, 10) } }; });
  // Stories: a topic told in order for understanding (see assets/stories.js). Text only, checked and capped.
  const PT = (l) => A(l).map(q => typeof q === 'string' ? S(q, 400) : q && S(q.t, 400) ? (S(q.why, 300) ? { t: S(q.t, 400), why: S(q.why, 300) } : S(q.t, 400)) : '').filter(Boolean);
  out.stories = {}; if (o.stories && typeof o.stories === 'object' && !Array.isArray(o.stories)) Object.entries(o.stories).slice(0, 300).forEach(([t, st]) => { if (!st || typeof st !== 'object') return; const steps = A(st.steps).slice(0, 12).map(x => x && S(x.h, 80) ? { h: S(x.h, 80), bridge: S(x.bridge, 200), pts: PT(x.pts).slice(0, 8), more: PT(x.more).slice(0, 12) } : null).filter(x => x && x.pts.length); if (!S(t, 80) || !steps.length) return; const pr = st.predict && typeof st.predict === 'object' ? st.predict : null, po = pr ? SL(pr.opts, 200).slice(0, 5) : [], ex = st.explain && typeof st.explain === 'object' ? st.explain : null, ck = ex ? SL(ex.check, 200).slice(0, 4) : [];
    out.stories[S(t, 80)] = { shape: S(st.shape, 20), idea: S(st.idea, 400), steps, remember: SL(st.remember, 300).slice(0, 5),
      ...(pr && S(pr.q, 300) && po.length >= 2 && Number.isInteger(pr.a) && pr.a >= 0 && pr.a < po.length && Number.isInteger(pr.step) && pr.step >= 0 && pr.step < steps.length ? { predict: { q: S(pr.q, 300), opts: po, a: pr.a, step: pr.step, why: S(pr.why, 400) } } : {}),
      ...(ex && S(ex.q, 300) && ck.length ? { explain: { q: S(ex.q, 300), check: ck } } : {}) }; });
  const n = out.cards.length + out.questions.length + out.topics.length + Object.keys(out.notes).length + out.mnemonics.length + out.stations.length + Object.keys(out.stories).length;
  if (!n) errs.push("There's nothing in it Mess can use.");
  return { errs, pack: out };
}
// Library packs taken out of Mess on 26 Nov 2026 (made from guidelines Mess may not use that way; see
// claude/nice-reply-26nov.md). A student who added one keeps it, but hidden: packWithdraw() moves the pack, its cards
// and its memory items into db.withdrawn, so its story, notes, cards, questions, stations and mnemonics stop showing
// and stop going to any AI. Nothing is deleted until the student taps "Remove it". Their own notes, cards and
// progress elsewhere are not touched. A held card keeps its review progress, in case a rewritten pack comes back.
const WITHDRAWN = { 'mess-copd-set': 'COPD cards and questions', 'mess-af-essentials': 'AF essentials' };
const isWithdrawn = (id) => typeof id === 'string' && Object.prototype.hasOwnProperty.call(WITHDRAWN, id);
// Text made from a withdrawn pack outside the pack itself: Explain and "Got wrong" cards built from its story, the stems
// of its questions in the missed list, and story points kept in the mistake log. Matched by the pack's own text.
const pkFlat = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
function pkTexts(pack) { const out = new Set(), add = (x) => { if (typeof x === 'string') { const f = pkFlat(x.replace(/\s*\[[^\]]{1,120}\]\s*$/, '')); if (f.split(' ').length >= 4) out.add(f); } else if (Array.isArray(x)) x.forEach(add); else if (x && typeof x === 'object') Object.values(x).forEach(add); }; add([pack.stories, pack.notes, pack.questions, pack.cards, pack.mnemonics, pack.stations]); return [...out]; }
const pkHas = (texts, s) => { const f = pkFlat(s); return !!f && texts.some(t => f.includes(t)); };
const WITHDRAWN_LINE = 'This pack was withdrawn while Mess rewrites it from open sources.';
function packWithdraw() {
  try {
    if (!db || typeof db !== 'object') return;
    const held = db.withdrawn && typeof db.withdrawn === 'object' && !Array.isArray(db.withdrawn) ? db.withdrawn : {}; let moved = false;
    for (const id of Object.keys(WITHDRAWN).filter(isWithdrawn)) {
      const pack = (Array.isArray(db.packs) ? db.packs : []).find(x => x && x.id === id), texts = pack ? pkTexts(pack) : [];
      const mine = (c) => c && c.packId === id, made = (c) => c && !c.packId && texts.length && (pkHas(texts, c.f) || pkHas(texts, c.b));
      const cards = (Array.isArray(db.cards) ? db.cards : []).filter(c => mine(c) || made(c)), memory = (Array.isArray(db.memory) ? db.memory : []).filter(m => m && m.packId === id);
      const missed = texts.length && Array.isArray(db.missed) ? db.missed.filter(x => typeof x === 'string' && pkHas(texts, x.replace(/\.\.\.$/, ''))) : [];
      const logPts = texts.length && Array.isArray(db.missLog) ? db.missLog.filter(e => e && Array.isArray(e.pts) && e.pts.some(x => pkHas(texts, x))) : [];
      if (!pack && !cards.length && !memory.length && !missed.length && !logPts.length) continue;
      const h = held[id] && typeof held[id] === 'object' ? held[id] : { at: new Date().toISOString(), cards: [], memory: [] };
      h.name = String((pack && pack.name) || h.name || WITHDRAWN[id]).slice(0, 200);
      if (pack) { h.pack = pack; h.topics = [...new Set([...(pack.topics || []), ...Object.keys(pack.stories || {}), ...Object.keys(pack.notes || {}), ...(pack.questions || []).map(q => q.topic), ...(pack.cards || []).map(c => c.topic)].filter(x => typeof x === 'string' && x))]; }
      const ids = new Set((Array.isArray(h.cards) ? h.cards : []).map(c => c && c.id));
      h.cards = [...(Array.isArray(h.cards) ? h.cards : []), ...cards.filter(c => !ids.has(c.id))]; h.memory = [...(Array.isArray(h.memory) ? h.memory : []), ...memory];
      h.missed = [...(Array.isArray(h.missed) ? h.missed : []), ...missed];
      h.logPts = [...(Array.isArray(h.logPts) ? h.logPts : []), ...logPts.map(e => ({ id: e.id, pts: e.pts.filter(x => pkHas(texts, x)) }))];
      logPts.forEach(e => { e.pts = e.pts.filter(x => !pkHas(texts, x)); });
      held[id] = h; moved = true;
      const gone = new Set(cards);
      db.packs = (db.packs || []).filter(x => !(x && x.id === id)); db.cards = (db.cards || []).filter(c => !gone.has(c)); db.memory = (db.memory || []).filter(m => !(m && m.packId === id)); if (missed.length) db.missed = db.missed.filter(x => !missed.includes(x));
    }
    if (moved) { db.withdrawn = held; if (typeof save === 'function') save(); }
  } catch (e) {}
}
const packHeld = () => { const h = db && db.withdrawn; return h && typeof h === 'object' && !Array.isArray(h) ? Object.entries(h).filter(([id, x]) => isWithdrawn(id) && x && typeof x === 'object').map(([id, x]) => [id, { ...x, name: String(x.name || WITHDRAWN[id]), topics: Array.isArray(x.topics) ? x.topics.filter(t => typeof t === 'string') : [] }]) : []; };
// What the held pack had, in words, for the panel (only what it really had).
const packHeldWhat = (x) => { const P = x.pack && typeof x.pack === 'object' ? x.pack : {}, n = (k) => Array.isArray(P[k]) ? P[k].length : P[k] && typeof P[k] === 'object' ? Object.keys(P[k]).length : 0, l = [[n('stories'), 'story', 'stories'], [n('notes'), 'topic of notes', 'topics of notes'], [Array.isArray(x.cards) ? x.cards.length : 0, 'card', 'cards'], [n('questions'), 'question', 'questions'], [n('stations'), 'OSCE station', 'OSCE stations'], [Array.isArray(x.memory) ? x.memory.length : 0, 'mnemonic', 'mnemonics']].filter(([k]) => k).map(([k, a, b]) => k + ' ' + (k === 1 ? a : b)); return l.length ? 'Hidden: ' + l.join(', ') + '.' : ''; };
// On a topic page: the line and the button, for a withdrawn pack that had something on this topic.
const packHeldNote = (n) => packHeld().filter(([, x]) => (x.topics || []).includes(n)).map(([id, x]) => `<div class="pkheld" style="margin:0 0 12px"><p class="s m" style="margin:0 0 6px"><b style="font-weight:600;color:var(--text)">${esc(x.name)}.</b> ${WITHDRAWN_LINE}</p><button class="btn sm" style="white-space:nowrap" data-a="packheldrm" data-v="${esc(id)}">Remove it</button></div>`).join('');
// Every reader of packs goes through here, so a withdrawn pack never shows, even if it came back in a backup.
const packList = () => (db.packs || []).filter(p => !(p && isWithdrawn(p.id)));
// Anything that replaces the saved data (start-up, restore, undo, sample) calls syncMyTopics, so withdraw there too.
{ const base = syncMyTopics; syncMyTopics = (list) => { packWithdraw(); return base(list); }; }
packWithdraw();
const packCounts = (p) => [[p.cards.length, 'card'], [p.questions.length, 'question'], [Object.keys(p.notes).length, 'topic of notes', 'topics of notes'], [p.topics.length, 'new topic'], [p.stations.length, 'OSCE station'], [Object.keys(p.stories || {}).length, 'story', 'stories'], [p.mnemonics.length, 'mnemonic']].filter(x => x[0]).map(([k, w, pl]) => k + ' ' + (k === 1 ? w : pl || w + 's')).join(' · ');
function packInstall(o) {
  if (o && typeof o === 'object' && isWithdrawn(o.id)) return { err: WITHDRAWN_LINE + ' It can\'t be added.' };
  const { errs, pack } = packCheck(o); if (errs.length) return { err: errs.join(' ') };
  if (isWithdrawn(pack.id)) return { err: WITHDRAWN_LINE + ' It can\'t be added.' };
  db.packs = packList().filter(p => p.id !== pack.id); packStrip(pack.id);
  db.packs.push(pack);
  db.cards = db.cards || []; pack.cards.forEach((c, k) => { if (!db.cards.some(x => x.f === c.f)) db.cards.push({ id: 'pk' + pack.id + k, f: c.f, b: c.b, src: pack.name, topic: c.topic, due: 0, packId: pack.id }); });
  db.memory = db.memory || []; pack.mnemonics.forEach(t => db.memory.push({ text: t, name: '', folder: 'Mnemonics and teaching points', packId: pack.id }));
  syncMyTopics(db.myTopics); save(); return { ok: pack };
}
function packStrip(id) { db.cards = (db.cards || []).filter(c => c.packId !== id); db.memory = (db.memory || []).filter(m => m.packId !== id); }
function packRemove(id) { packStrip(id); db.packs = packList().filter(p => p.id !== id); syncMyTopics(db.myTopics); save(); }
const packQs = () => packList().flatMap(p => p.questions.map((q, k) => ({ id: 'pq-' + p.id + '-' + k, kind: 'SBA', topic: q.topic && TOPICS.has(q.topic) ? areaOf(q.topic) : '', stem: q.stem, opts: q.opts, a: q.a, why: q.why, tp: q.topic, pack: p.name })));
function packNotes(n, i) { const t = TOPICS.get(n); if (!t) return ''; const label = (t.kind === 'd' ? TEACH_D : TEACH_C)[i][0], from = packList().map(p => [p, ((p.notes[n] || {})[label]) || []]).filter(x => x[1].length); if (!from.length) return ''; return `<details class="dd ddinline packnotes"><summary class="tlink s">From packs (${from.reduce((k, x) => k + x[1].length, 0)})</summary>${from.map(([p, l]) => `<div class="packn"><small>${esc(p.name)} · ${esc(p.author)}</small><ul class="nlist">${l.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`).join('')}</details>`; }
// Packs listed in the Mess library. Anyone can add one by pull request: see PACKS.md.
async function packIndex() { for (const u of ['packs/index.json', '../packs/index.json']) { try { const r = await fetch(u, { cache: 'no-cache' }); if (r.ok) { const j = await r.json(); if (Array.isArray(j.packs)) return j.packs.map(x => ({ ...x, url: new URL(x.file, new URL(u, location.href)).href })); } } catch (e) {} } return null; }
// On a topic page: offer a library pack made for this topic, added in one tap. The library list is fetched once
// per visit; if it can't be reached (offline, or inside another app) nothing shows.
function packOffer(n) {
  if (ui.pkIdx === undefined) { ui.pkIdx = null; packIndex().then(l => { ui.pkIdx = l || []; if ((ui.pkIdx).some(x => Array.isArray(x.topics))) render(); }).catch(() => { ui.pkIdx = []; }); return ''; }
  const have = new Set(packList().map(p => p.id)), l = (ui.pkIdx || []).filter(x => !isWithdrawn(x.id) && Array.isArray(x.topics) && x.topics.includes(n) && !have.has(x.id));
  return l.map(x => `<div class="pkoffer"><h3>Ready-made</h3><p class="s m" style="margin:0 0 8px">${esc(x.description || x.name)}</p><button class="lp strong" data-a="packadd" data-v="${esc(x.url)}">${ui.pkBusy === x.url ? 'Adding...' : 'Add these to my Mess'}</button></div>`).join('');
}
function packsHTML() {
  const P = ui.pk || {}, mine = packList();
  return `<div class="mbox ibox lbox"><div class="ihead"><h2>Packs</h2><button class="ib" data-a="packclose" aria-label="Close">×</button></div><p class="s m" style="margin:4px 0 14px">Cards, questions, notes and OSCE stations made by other students and societies. They sit alongside your own stuff, and you can remove a pack in one tap.</p>
  ${P.msg ? `<div class="mairesult">${esc(P.msg)}</div>` : ''}
  <h3 class="lh">Library</h3>${P.index === undefined ? '<p class="s m">Loading...</p>' : P.index === null ? '<p class="s m">The library isn\'t reachable from here. You can still add a pack file below.</p>' : P.index.filter(x => !isWithdrawn(x.id)).length ? `<div class="ilist">${P.index.filter(x => !isWithdrawn(x.id)).map(x => { const have = mine.find(p => p.id === x.id); return `<div class="pkrow"><div><b>${esc(x.name)}</b><small>${esc(x.author || '')}${x.licence ? ' · ' + esc(x.licence) : ''}</small><span>${esc(x.description || '')}</span></div><button class="btn sm ${have ? '' : 'pri'}" data-a="packget" data-v="${esc(x.url)}">${have ? (have.version !== String(x.version) ? 'Update' : 'Reinstall') : 'Add'}</button></div>`; }).join('')}</div>` : '<p class="s m">No packs yet.</p>'}
  <details class="dd ddinline" style="margin-top:12px"><summary class="tlink s">+ Add a pack file</summary><p class="s m" style="margin:8px 0">Someone sent you a .json pack? Add it here.</p><label class="btn" style="display:inline-flex;align-items:center;cursor:pointer">Choose the file<input type="file" accept=".json,application/json" data-packfile hidden></label></details>
  ${packHeld().length ? `<h3 class="lh" style="margin-top:18px">Withdrawn</h3><div>${packHeld().map(([id, x]) => `<div class="pkrow"><div><b>${esc(x.name)}</b><span>${WITHDRAWN_LINE} ${esc(packHeldWhat(x))} Your own notes and other cards are untouched.</span></div><button class="btn sm" style="white-space:nowrap" data-a="packheldrm" data-v="${esc(id)}">Remove it</button></div>`).join('')}</div>` : ''}
  ${mine.length ? `<h3 class="lh" style="margin-top:18px">Added</h3><div class="ilist">${mine.map(p => `<div class="pkrow"><div><b>${esc(p.name)}</b><small>${esc(p.author)} · version ${esc(p.version)}${p.licence ? ' · ' + esc(p.licence) : ''}</small><span>${esc(packCounts(p))}</span></div><button class="btn sm" data-a="packrm" data-v="${esc(p.id)}">Remove</button></div>`).join('')}</div>` : ''}
  <details class="dd ddinline" style="margin-top:16px"><summary class="tlink s">Make your own pack</summary><p class="s m" style="margin:8px 0">Turn everything you've added to Mess into a pack: your topics, notes, flashcards and questions. Share the file, or add it to the library for everyone.</p><div class="row" style="flex-wrap:nowrap"><input class="f grow" id="pkname" placeholder="Pack name, like Renal in 10 minutes"><button class="btn pri" data-a="packmake">Download</button></div><p class="s m" style="margin:8px 0 0">Your own words only, never from question banks, books or past papers, and no patient details.</p></details></div>`;
}
function packPaint() { let m = $('#packbox'); if (!ui.pk) { if (m) m.remove(); return; } if (!m) { m = document.createElement('div'); m.id = 'packbox'; m.className = 'overlay'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-label', 'Packs'); document.body.appendChild(m); } m.innerHTML = packsHTML(); }
function packDone(r) { ui.pk.msg = r.err ? r.err : 'Added ' + r.ok.name + ': ' + packCounts(r.ok) + '.'; packPaint(); render(); }
Object.assign(act, {
  packopen: async () => { ui.pk = { index: undefined }; packPaint(); ui.pk.index = await packIndex(); packPaint(); },
  packclose: () => { ui.pk = null; packPaint(); },
  packget: async (v) => { ui.pk.msg = 'Adding...'; packPaint(); try { const r = await fetch(v); if (!r.ok) throw 0; const t = await r.text(); if (t.length > PACK_LIMITS.bytes) return packDone({ err: 'That pack is too big.' }); packDone(packInstall(JSON.parse(intakeIn(t)))); } catch (e) { packDone({ err: "Couldn't get that pack. Try again in a bit." }); } },
  packadd: async (v) => { if (ui.pkBusy) return; ui.pkBusy = v; render(); let r; try { const res = await fetch(v); if (!res.ok) throw 0; const t = await res.text(); r = t.length > PACK_LIMITS.bytes ? { err: 'That pack is too big.' } : packInstall(JSON.parse(intakeIn(t))); } catch (e) { r = { err: "Couldn't get that pack. Try again in a bit." }; } ui.pkBusy = null; render(); toast(r.err ? r.err : 'Added ' + packCounts(r.ok) + '. Remove them any time in Topics, More, Packs.'); },
  packheldrm: (v) => { if (!isWithdrawn(v) || !db.withdrawn || !db.withdrawn[v]) return; const name = String(db.withdrawn[v].name || WITHDRAWN[v] || 'the pack'); delete db.withdrawn[v]; save(); if (ui.pk) ui.pk.msg = 'Removed ' + name + ' and the cards that came from it. Your own notes and other cards are untouched.'; else toast('Removed ' + name + ' and the cards that came from it. Your own notes and other cards are untouched.'); packPaint(); render(); },
  packrm: (v) => { const p = packList().find(x => x.id === v); packRemove(v); ui.pk.msg = p ? 'Removed ' + p.name + '. Your own stuff is untouched.' : ''; packPaint(); render(); },
  packmake: () => { const name = val('pkname') || 'My Mess pack', mine = exportMine(), qs = (mine.myQs || []).filter(q => q.stem && q.opts), notes = {}; Object.entries(mine.myNotes || {}).forEach(([t, secs]) => { const T = TOPICS.get(t); if (!T) return; const steps = T.kind === 'd' ? TEACH_D : TEACH_C; const bad = noteFromMess(t); Object.entries(secs).forEach(([i, pts]) => { const l = steps[+i], keep = (Array.isArray(pts) ? pts : []).filter(x => typeof x === 'string' && !bad(x)); if (l && keep.length && !(keep.length > 1 && frozenCopy(keep.join(' ')))) (notes[t] = notes[t] || {})[l[0]] = keep; }); /* lines copied from Mess's old notes stay out of a shared pack */ }); const pack = { mess: 'pack', format: 1, id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50) + '-' + Date.now().toString(36), name, version: '1', author: (db.profile.name || '').trim() || 'A Mess user', description: '', licence: 'CC BY 4.0', topics: mine.myTopics || [], notes, cards: (db.cards || []).filter(c => !c.packId && c.src !== 'Anki' && !frozenCopy(c.f) && !frozenCopy(c.b)).map(c => ({ f: c.f, b: c.b, topic: c.topic || '' })), questions: qs.map(q => ({ stem: q.stem, opts: q.opts, a: q.a, why: q.why, topic: q.tp || '' })) }; if (!pack.cards.length && !pack.questions.length && !Object.keys(notes).length && !pack.topics.length) { ui.pk.msg = "There's nothing of yours to pack yet. Add some notes, cards or questions first."; packPaint(); return; } saveFile(pack.id.replace(/-[a-z0-9]+$/, '') + '.mess-pack.json', JSON.stringify(pack, null, 1)); ui.pk.msg = 'Downloaded. Share the file, or see PACKS.md on GitHub to add it to the library.'; packPaint(); }
});
