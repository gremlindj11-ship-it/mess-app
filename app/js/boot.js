// Mess · boot.js · Start-up: runs last, once everything above is loaded.
// Loaded in this order by index.html: store.js, safety.js, intake.js, links.js, ai.js, flow.js, tools.js, intro.js, today.js, practice.js, stats.js, topics.js, story.js, curricula.js, route.js, diagrams.js, placement.js, profile.js, import.js, packs.js, apps.js, boot.js.
// All files share one global scope (plain scripts, no build step).

// Check what was saved before drawing anything, so one damaged entry can't break a page.
try { db = cleanItems(db); syncMyTopics(db.myTopics); } catch (e) {}
// The one door for files: every file picked in Mess is checked (what it really is, and its size) before
// the part of Mess that asked for it sees it. Lecture and import files are checked in lecImport.
const INTAKE_INPUTS = { packfile: ['json'], tdfile: ['image', 'svg'], ankiapkg: ['zip'], libimport: ['text'], timport: ['json'], ics: ['text', 'zip'], memfile: ['text'], scorefile: ['pdf', 'text'], restore: ['json'] };
document.addEventListener('change', async (e) => { const t = e.target; if (!t || t.type !== 'file' || !t.files || !t.files.length || t._intakeOk) { if (t) t._intakeOk = false; return; } const k = Object.keys(INTAKE_INPUTS).find(x => t.dataset && x in t.dataset); if (!k) return; e.stopImmediatePropagation(); for (const f of [...t.files]) { const c = await intakeCheck(f, INTAKE_INPUTS[k]); if (!c.ok) { t.value = ''; ui.note = c.err; ui.tdnote = c.err; ui.ankiNote = c.err; ui.icsNote = c.err; toast(c.err); render(); return; } } t._intakeOk = true; t.dispatchEvent(new Event('change', { bubbles: true })); }, true);
fetch('assets/packs/osceblitz.json', { method: 'HEAD' }).then(r => { if (r.ok) { ui.packOk = true; render(); } }).catch(() => {});
setInterval(tick, 1000);
document.addEventListener('click', (e) => { const b = e.target.closest('[data-a]'); const shut = ui.askOpen && !e.target.closest('.panel, .ask') && getSelection().isCollapsed; if (shut) { ui.askOpen = false; ui.report = false; if (!b) render(); } if (!isWide() && paneOpen() && !e.target.closest('.panetoggle') && (!e.target.closest('.pane1') || (b && b.classList.contains('paneitem')))) { ui.p1 = false; if (!b && $('.pane1')) { render(); return; } } if (b) { const tw = b.closest('.twin'); if (tw) ui.calcId = tw.dataset.calc; act[b.dataset.a](b.dataset.v); if (shut && !ui.askOpen && $('.panel')) render(); return; } const o = e.target.closest('[data-open]'); if (o) { db.opens[o.dataset.open] = (db.opens[o.dataset.open] || 0) + 1; save(); } });
document.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && e.target.dataset && e.target.dataset.enter) { e.preventDefault(); act[e.target.dataset.enter](); } });
addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); ui.installEvt = e; if (ui.page === 'Profile') render(); });
if (window.claude && claude.use) claude.use('mcp').then(m => { if (!m) return; ui.mcp = m; const se = SKETCHES.find(x => x[0] === 'email'), sc = SKETCHES.find(x => x[0] === 'calendar'); if (se) se[2] = 'New email, search and AI actions'; if (sc) sc[2] = "Today's events on your day bar"; Object.keys(db.connOn || {}).forEach(connWatch); render(); }).catch(() => {});
document.addEventListener('click', (e) => { document.querySelectorAll('details.dd[open]:not(.ddinline)').forEach(d => { if (!d.contains(e.target)) d.open = false; }); });
document.addEventListener('change', (e) => { if (e.target.dataset && 'ownai' in e.target.dataset) { db.ownAI = e.target.value; save(); return; } const k = e.target.dataset && e.target.dataset.lookpick; if (k) lookApply(k, e.target.value); });
document.addEventListener('change', async (e) => { const t = e.target; if (!t.dataset || !('packfile' in t.dataset)) return; const f = t.files[0]; t.value = ''; if (!f) return; if (f.size > PACK_LIMITS.bytes) return packDone({ err: 'That pack is too big.' }); try { packDone(packInstall(JSON.parse(intakeIn(await f.text())))); } catch (e2) { packDone({ err: "That file isn't a Mess pack." }); } });
{ const base = syncMyTopics; syncMyTopics = (list) => base([...(list || []), ...packList().flatMap(p => p.topics)]); syncMyTopics(db.myTopics); }
 render = function () { renderBase(); paintMailDot(); drawMermaid(); demoTick(); };
document.addEventListener('selectionchange', showNBar);
{ let due = false; addEventListener('scroll', () => { if (!ui.askOpen || due) return; due = true; requestAnimationFrame(() => { due = false; askWhere(); }); }, { passive: true }); } // the ? names the step you have scrolled to
 libLoad();
document.addEventListener('mousedown', (e) => { if (e.target.closest('#nbar,.paintbar') && !e.target.matches('input')) e.preventDefault(); });
document.addEventListener('mouseup', paintUp);
 document.addEventListener('touchend', () => setTimeout(paintUp, 350));
document.addEventListener('input', (e) => { if (e.target.dataset && 'pcustom' in e.target.dataset) { db.pCol = e.target.value; save(); } });
document.addEventListener('change', (e) => { if (e.target.dataset && 'pcustom' in e.target.dataset) { const c = e.target.value; e.target.blur(); db.pCol = c; save(); if (ui.nsel) applyMark(db.pTool || 'h', c); else render(); } });
['qgo', 'qkind', 'qstage'].forEach(k => { const f = act[k]; if (f) act[k] = (v) => { ui.q.only = null; return f(v); }; });
document.addEventListener('change', async (e) => { const t = e.target, d = t.dataset || {};
  if ('aiprov' in d) { db.ai = t.value; db.aiLast = t.value; save(); render(); return; }
  if ('tdfile' in d) { const f = t.files[0]; t.value = ''; tdFile(f); return; }
  if ('lecfile' in d) { const fl = [...t.files]; t.value = ''; if (fl.length) lecImport(fl); return; }
  if ('lecsel' in d) { if (ui.lec && ui.lec.sel) ui.lec.sel[d.lecsel] = t.checked; return; }
  if ('ankiapkg' in d) { const f = t.files[0]; if (!f) return; ui.ankiNote = 'Reading ' + f.name + '...'; render(); try { const r = await ankiFileStats(f), n = Object.keys(r.out).length; if (!r.seen) ui.ankiNote = r.read ? "Those cards haven't been studied yet, or the file was exported without scheduling. Tick Include scheduling information and try again." : "That file has no cards in it. If you're on a new Anki, try ticking Support older Anki versions when you export."; else { db.ankiStats = r.out; save(); ui.ankiNote = 'Read ' + r.seen + ' studied cards across ' + n + ' topics.'; } } catch (e) { ui.ankiNote = "Couldn't read that file. It needs to be an Anki deck package (.apkg) or collection (.colpkg)."; } render(); return; }
  if ('libimport' in d) { const file = t.files[0]; if (file) libImport(file); return; }
  if ('timport' in d) { const file = t.files[0]; if (!file) return; try { ui.note = importMine(JSON.parse(await file.text())); syncMyTopics(db.myTopics); } catch (err) { ui.note = "Couldn't read that file. It needs to be one downloaded from Mess."; } render(); return; }
  if (d.change === 'calckind') { ui.calc = t.value; render(); }
  if (d.change === 'casefolder') { db.cases.find(x => x.id === ui.curId).folder = t.value; save(); render(); }
  if (d.otherfile !== undefined && t.value) { const o = db.other.splice(+d.otherfile, 1)[0], i = db.scores.findIndex(([k]) => k === t.value); if (i >= 0) db.scores[i][1] = o.v; else db.scores.push([t.value, o.v]); save(); render(); }
  if ('ics' in d) { try { const f = t.files[0]; let txt = ''; if (/\.zip$/i.test(f.name)) { const z = await intakeZip(await f.arrayBuffer()); for (const e of Object.values(z.files).filter(e => !e.dir && /\.ics$/i.test(e.name)).slice(0, 20)) txt += (await e.async('string')) + '\n'; } else txt = await f.text(); const ev = readICS(intakeText(txt)); ev.forEach(x => db.day.push(x)); db.todayOn.day = true; save(); ui.icsNote = ev.length ? 'Added ' + ev.length + ' from today.' : 'Nothing on today in that file.'; } catch (err) { ui.icsNote = "Couldn't read that file."; } render(); }
  if ('memfile' in d) { await readFiles(t.files); }
  if ('scorefile' in d && t.files[0]) { const f = t.files[0]; ui.note = 'Reading ' + f.name + '...'; render(); try { let text = ''; if (/\.pdf$/i.test(f.name)) { const pdf = await intakePDF(await f.arrayBuffer()); for (let p = 1; p <= Math.min(pdf.numPages, 30); p++) { const c = await (await pdf.getPage(p)).getTextContent(), lines = {}; c.items.forEach(it => { const y = Math.round(it.transform[5]); (lines[y] = lines[y] || []).push(it.str); }); text += Object.keys(lines).sort((a, b) => b - a).map(y => lines[y].join(' ')).join('\n') + '\n'; } } else text = await f.text(); const rows = text.split(/\r?\n/).map(l => l.replace(/[,;\t]+/g, ' ').trim()).filter(l => /\d/.test(l) && (scoreHits(l).length || fileTopic(l))); if (!rows.length) { ui.note = "Couldn't find any scores in that file. If it's a scan or a picture, type them in instead."; render(); return; } const box = $('#scorein'); box.value = rows.join('\n'); await act.scoreadd(); } catch (err) { ui.note = "Couldn't read that file. Try typing the scores in."; render(); } }
  if ('restore' in d) { try { const f = t.files[0]; t.value = ''; if (!f || f.size > 25e6) throw 0; const o = JSON.parse(await f.text()); if (!o || o.app !== 'med-school-os' || !o.data || typeof o.data !== 'object' || Array.isArray(o.data)) throw 0; try { localStorage.setItem(KEY + '.before', JSON.stringify({ d: new Date().toISOString(), db })); } catch (e) {} db = cleanBackup(o.data); syncMyTopics(db.myTopics); save(); theme(); ui.note = 'Backup restored. If it was the wrong one, Undo the restore is under it.'; render(); } catch (err) { ui.note = "That file isn't a backup from this app."; render(); } }
});
document.addEventListener('input', (e) => { const t = e.target, d = t.dataset || {};
  if ('note' in d) { const sel = getSelection(), n = sel.anchorNode; if (n && n.nodeType === 3 && e.data === ' ') { const before = n.nodeValue.slice(0, sel.anchorOffset), m = before.match(/(?:^|\s)(PC|HPC|PMH|DH|SH|FH|ROS|OE|IMP|PLAN)\/ $/i); if (m) { const r = document.createRange(), len = m[1].length + 2; r.setStart(n, sel.anchorOffset - len); r.setEnd(n, sel.anchorOffset); sel.removeAllRanges(); sel.addRange(r); document.execCommand('insertText', false, SHORT[m[1].toUpperCase()] + ': '); } } saveNote(t); }
  if (d.casefield) { const c = db.cases.find(x => x.id === ui.curId); c[d.casefield] = t.value; save(); if (d.casefield === 'title') { const on = $('.case.on'); if (on && on.firstChild) on.firstChild.textContent = t.value; } const f = flagOf(c), el = $('#flag'); if (el) el.innerHTML = f ? `<div class="warn" role="alert" style="margin-bottom:8px">${f}</div>` : ''; }
  if ('cv' in d) { const id = t.closest('.twin').dataset.calc, c = CALCS.find(x => x.id === id); ui.cv[id][d.cv] = t.value; const o = $('#out-' + id); if (o) o.innerHTML = calcOutHTML(c, calcResult(c, ui.cv[id])); }
  if ('cvs' in d) { const id = t.closest('.twin').dataset.calc, c = CALCS.find(x => x.id === id); ui.cv[id]['s' + d.cvs] = +t.value; const o = $('#out-' + id); if (o) o.innerHTML = calcOutHTML(c, calcResult(c, ui.cv[id])); }
  if ('oq' in d) { ui.oq = t.value; render(); }
  if ('tq' in d) { ui.tq = t.value; render(); }
  if ('rq' in d) { ui.rq = t.value; render(); }
  if ('calcq' in d) { ui.calcQ = t.value; render(); }
  if ('gsearch' in d) { const q = t.value.trim().toLowerCase(), box = $('#gresults'); if (!q || ui.report) { box.innerHTML = ''; return; } const r = [...tabs().filter(x => x.toLowerCase().includes(q)).map(x => `<button data-a="go" data-v="${x}"><small>Page</small>${x}</button>`), ...['OSCE', 'Questions', 'Prescribing', 'Flashcards', 'Consultant'].filter(x => x.toLowerCase().includes(q)).map(x => `<button data-a="goto" data-v="Practice/${x}"><small>Practice</small>${x}</button>`), ...practiceFind(q).slice(0, 3).map(x => `<button data-a="practiceopen" data-v="${esc(x.name)}"><small>${esc(PRACTICE_NAME)}</small>${esc(x.name)}</button>`), ...db.cases.filter(c => (c.title + ' ' + db.layout.map(([k]) => c[k] || '').join(' ')).toLowerCase().includes(q)).slice(0, 5).map(c => `<button data-a="caseopen" data-v="${c.id}"><small>Case</small>${esc(c.title)}</button>`), ...[['Calculators', 'Calculators'], ['Reference ranges', 'Ranges']].filter(x => x[0].toLowerCase().includes(q)).map(x => `<button data-a="goto" data-v="Tools/${x[1]}"><small>Tool</small>${x[0]}</button>`), ...LINKS.filter(l => (l.name + ' ' + l.why).toLowerCase().includes(q)).slice(0, 4).map(l => `<a href="${l.url}" target="_blank" rel="noopener"><small>Link</small>${esc(l.name)} ↗</a>`)]; box.innerHTML = r.length ? `<div class="gpanel">${r.slice(0, 5).join('')}</div>` : ''; }
  if ('search' in d) { ui.search = t.value; const p = t.selectionStart; render(); const n = $('#casesearch'); n.focus(); n.setSelectionRange(p, p); }
  if ('calc' in d && ui.calcForms[ui.calc]) { const [ls, fn] = ui.calcForms[ui.calc], vals = ls.map((_, i) => parseFloat($('#cf' + i).value)); $('#calcout').textContent = vals.every(x => x > 0) ? fn(...vals) : ''; }
  if (d.dayf && db.day[ui.dayOpen]) { const it = normDay(db.day[ui.dayOpen], ui.dayOpen); delete it.i; if (d.dayf === 'start' || d.dayf === 'end') { if (!t.value) return; const [a, b] = t.value.split(':').map(Number); it[d.dayf] = a * 60 + b; if (it.end <= it.start) it.end = it.start + 15; } else it[d.dayf] = t.value; db.day[ui.dayOpen] = it; save(); if (d.dayf !== 'notes' && d.dayf !== 'where') render(); }
  if (d.rx) { ui.rx[d.rx] = t.value; ui.rx.checked = false; rxSuggest(d.rx, t.value); }
});
document.addEventListener('mousedown', (e) => { const b = e.target.closest('[data-pick]'); if (b) { e.preventDefault(); const k = b.dataset.pick; ui.rx[k] = b.dataset.val; $('#rx-' + k).value = b.dataset.val; $('#tal-' + k).innerHTML = ''; } });
document.addEventListener('focusout', (e) => { if (e.target.dataset && e.target.dataset.rx) { const b = $('#tal-' + e.target.dataset.rx); if (b) b.innerHTML = ''; } });
document.addEventListener('dragover', (e) => { if (e.target.closest('[data-drop]')) { e.preventDefault(); return; } if (![...(e.dataTransfer.types || [])].includes('Files') || ui.page === 'intro' || ui.page === 'setup') return; e.preventDefault(); if (!ui.lec) { ui.lec = { drag: true }; lecPaint(); } const z = document.querySelector('[data-lecdrop]'); if (z) z.classList.add('over'); });
document.addEventListener('drop', (e) => { if (e.target.closest('[data-drop]')) { e.preventDefault(); readFiles(e.dataTransfer.files); return; } if (ui.lec && e.dataTransfer.files.length) { e.preventDefault(); lecImport([...e.dataTransfer.files]); } });
document.addEventListener('dragleave', (e) => { if (!e.relatedTarget && ui.lec && ui.lec.drag && !ui.lec.stage) { ui.lec = null; lecPaint(); } });
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
addEventListener('resize', () => { const band = isWide() ? 2 : isPhone() ? 0 : 1; if (band === lastBand) return; lastBand = band; ui.p1 = undefined; const tag = document.activeElement && document.activeElement.tagName; if (tag !== 'INPUT' && tag !== 'TEXTAREA') render(); });
if (matchMedia('(pointer:fine)').matches && !matchMedia('(prefers-reduced-motion:reduce)').matches) addEventListener('pointermove', (e) => { if (ui.page !== 'Profile') return; const r = document.documentElement.style; r.setProperty('--mx', e.clientX + 'px'); r.setProperty('--my', e.clientY + 'px'); }, { passive: true });
theme();
 render();
if (window.claude && claude.use) claude.use('sample').then(sm => { if (sm) { ui.sample = sm; render(); } }).catch(() => {});
// Move and resize pulled-out tools. They always stay fully on screen.
document.addEventListener('pointerdown', (e) => {
  const el = e.target.closest('.twin'); if (!el || el.classList.contains('full')) return;
  const id = el.dataset.win, w = (db.wins || []).find(x => x.id === id), grip = e.target.closest('[data-grip]'), head = e.target.closest('[data-drag]');
  const idx = db.wins.indexOf(w); if (idx !== db.wins.length - 1) { db.wins.push(db.wins.splice(idx, 1)[0]); document.querySelectorAll('.twin').forEach(n => { n.style.zIndex = 50 + db.wins.findIndex(x => x.id === n.dataset.win); }); }
  if (!grip && (!head || e.target.closest('button'))) return; e.preventDefault();
  const r = el.getBoundingClientRect(), sx = e.clientX, sy = e.clientY;
  const mv = (m) => { const dx = m.clientX - sx, dy = m.clientY - sy; if (grip) { el.style.width = Math.max(260, Math.min(r.width + dx, innerWidth - r.left - 6)) + 'px'; el.style.height = Math.max(170, Math.min(r.height + dy, innerHeight - r.top - 6)) + 'px'; } else { const b = el.getBoundingClientRect(); el.style.left = Math.max(6, Math.min(r.left + dx, innerWidth - b.width - 6)) + 'px'; el.style.top = Math.max(6, Math.min(r.top + dy, innerHeight - b.height - 6)) + 'px'; } };
  const up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); const b = el.getBoundingClientRect(); w.x = b.left; w.y = b.top; w.w = b.width; if (grip) w.h = b.height; save(); };
  addEventListener('pointermove', mv); addEventListener('pointerup', up);
});
addEventListener('resize', () => { clearTimeout(ui.rzT); ui.rzT = setTimeout(fitWins, 120); });
document.addEventListener('selectionchange', showHlBar);
document.addEventListener('pointerdown', (e) => { const xp = e.target.closest('[data-xp]'); if (xp) { e.preventDefault(); const t = getSelection().toString().trim(); if (t) explainPhrase(t); return; } const h = e.target.closest('[data-hl]'); if (h) { e.preventDefault(); applyHl(h.dataset.hl); return; } if (!e.target.closest('#linkpop') && !e.target.closest('mark')) hideLinkPop(); });
document.addEventListener('click', (e) => { const m = e.target.closest('.noteed mark'); if (m && getSelection().isCollapsed) showLinkPop(m); });
document.addEventListener('paste', (e) => { if (!e.target.closest || !e.target.closest('.noteed')) return; e.preventDefault(); document.execCommand('insertText', false, e.clipboardData.getData('text/plain')); });
// Any link to Claude, ChatGPT or Gemini with a prompt in it: copy the prompt as well, in case the app drops it.
document.addEventListener('click', (e) => { const a = e.target.closest && e.target.closest('a[href]'); if (!a) return; let u; try { u = new URL(a.href); } catch (x) { return; } const q = u.searchParams.get('q') || u.searchParams.get('query'), name = /claude\.ai$/.test(u.hostname) ? 'Claude' : /chatgpt\.com$/.test(u.hostname) ? 'ChatGPT' : /gemini\.google\.com$/.test(u.hostname) ? 'Gemini' : null; if (!q || !name) return; e.preventDefault(); openOwn(name, q); }, true);

// Anything going to an AI leaves the device, so patient details are taken out of what the student sends first
// (the system prompt is Mess's own words and the station scripts, so it's left alone).
{ const base = callAI; callAI = (system, turns, o) => base(guideText(system), (turns || []).map(t => t && typeof t.content === 'string' && t.role !== 'assistant' ? { ...t, content: guideText(intakeOut(t.content)) } : t), o); }
{ const base = manualAI; manualAI = (system, user) => base(guideText(system), guideText(intakeOut(user))); }
{ const base = openOwn; openOwn = (name, prompt) => base(name, guideText(intakeOut(prompt))); }
// If a page fails to draw, show a way out instead of a blank screen.
{ const draw = render; render = function () { try { return draw.apply(this, arguments); } catch (e) { oops(e, 'drawing ' + ui.page); const a = document.getElementById('app'); if (a && !a.querySelector('.oops')) a.insertAdjacentHTML('beforeend', `<div class="oops" role="alert"><b>This page didn't load properly.</b> Your work is saved.<div class="row" style="margin-top:10px"><button class="btn pri" data-a="go" data-v="Today">Go to Today</button></div></div>`); } }; }

// Section tabs on a phone scroll sideways: keep the current one in view, and fade the edge only while there's more.
const ttabsFit = () => { const tt = document.querySelector('.ttabs'); if (!tt) return; const on = tt.querySelector('.on'); if (on && tt.scrollWidth > tt.clientWidth) tt.scrollLeft = Math.max(0, on.offsetLeft - tt.offsetLeft - 24); tt.classList.toggle('atend', tt.scrollLeft + tt.clientWidth >= tt.scrollWidth - 4); };
{ const draw = render; render = function () { const r = draw.apply(this, arguments); try { ttabsFit(); } catch (e) { } try { markFrom(); } catch (e) { } try { routeSync(); } catch (e) { } return r; }; }
// Escape closes the ? panel.
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && ui.askOpen) { ui.askOpen = false; ui.report = false; render(); const a = $('.ask'); if (a) a.focus(); } });
document.addEventListener('scroll', (e) => { const t = e.target; if (t && t.classList && t.classList.contains('ttabs')) t.classList.toggle('atend', t.scrollLeft + t.clientWidth >= t.scrollWidth - 4); }, true);
// Ask the browser to keep Mess's data instead of clearing it when space runs low.
try { if (db.setupDone && navigator.storage && navigator.storage.persist) navigator.storage.persisted().then(p => p || navigator.storage.persist()).catch(() => {}); } catch (e) {}
// Delete everything in another tab: reload, so this tab can't save its old copy back.
window.addEventListener('storage', e => { if (e.key === 'mess-wipe' && e.newValue) location.reload(); });
