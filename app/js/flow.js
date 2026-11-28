// Mess · flow.js · Moving around: the shell, page switching, the ? panel, shared helpers and global listeners.
// Loaded in this order by index.html: store.js, safety.js, intake.js, links.js, ai.js, flow.js, tools.js, intro.js, today.js, practice.js, stats.js, topics.js, story.js, curricula.js, route.js, diagrams.js, placement.js, profile.js, import.js, packs.js, apps.js, boot.js.
// All files share one global scope (plain scripts, no build step).

const $ = (sel) => document.querySelector(sel);
function toast(t) { ui.note = t; const el = $('#note'); if (el && el.offsetParent) { el.textContent = t; return; } let f = $('#ftoast'); if (!f) { f = document.createElement('div'); f.id = 'ftoast'; f.setAttribute('role', 'status'); document.body.appendChild(f); } f.textContent = t; f.classList.add('show'); clearTimeout(ui.ftT); ui.ftT = setTimeout(() => f.classList.remove('show'), 6000); }
function theme() { const c = db.theme === 'custom' && db.customColour ? genTheme(db.customColour, db.customHi) : (THEMES[db.theme] || THEMES.clean).c; VARS.forEach((v, i) => document.documentElement.style.setProperty(v, c[i])); const sf = getComputedStyle(document.documentElement).getPropertyValue('--surface').trim(), m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(sf), dark = m && (parseInt(m[1], 16) * .3 + parseInt(m[2], 16) * .59 + parseInt(m[3], 16) * .11) < 100; document.documentElement.style.colorScheme = dark ? 'dark' : 'light'; }
const tabs = () => ['Today', 'Practice', 'Gaps', 'Topics', 'Placement', 'Links', 'Profile'].filter(t => db.pages[t] !== false);
// Sidebar icons from Lucide (ISC licence): https://lucide.dev
const ICON = { Today: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/>', Practice: '<path d="M11 2v2"/><path d="M5 2v2"/><path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1"/><path d="M8 15a6 6 0 0 0 12 0v-3"/><circle cx="20" cy="10" r="2"/>', Gaps: '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>', Topics: '<rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/>', Placement: '<path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/>', Links: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>', Profile: '<path d="M18 20a6 6 0 0 0-12 0"/><circle cx="12" cy="10" r="4"/><circle cx="12" cy="12" r="10"/>', Search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>', Tools: '<rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/>' };
const icon = (n) => `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[n]}</svg>`;
const isWide = () => innerWidth >= 1100, isPhone = () => innerWidth < 760;
const paneOpen = () => ui.p1 === undefined ? isWide() : ui.p1;
function panesTop(label, what) { const open = paneOpen(); return `${!open || !isWide() ? `<div class="panebar"><button class="btn pri panetoggle" data-a="p1toggle" aria-expanded="${open}" aria-label="${esc(what)}: ${esc(label)}. Change"><small>${esc(what)}</small> ${esc(label)} ▾</button></div>` : ''}<div class="panes ${open ? 'p1open' : 'p1closed'}">`; }
const hideP1 = () => isWide() ? '<button class="hidep1" data-a="p1toggle" aria-label="Hide this panel">‹ Hide</button>' : '';
function shell(body) {
  return `<div class="frame"><nav class="rail" aria-label="Main"><button class="mark" data-a="go" data-v="Today" aria-label="Mess, go to Today"><span class="full">Mess</span><span class="short">M</span></button><div class="railmain">${tabs().map(t => `<button class="railb ${ui.page === t ? 'on' : ''}" data-a="go" data-v="${t}" ${ui.page === t ? 'aria-current="page"' : ''}>${icon(t)}<span>${t === 'Profile' && (db.profile.name || '').trim() ? esc(db.profile.name.trim()) : t === 'Gaps' ? 'Stats' : t}</span></button>`).join('')}</div><div class="railend">${db.pages.Tools !== false ? `<button class="railtool ${ui.toolsOpen ? 'open' : ''}" data-a="tools" aria-expanded="${ui.toolsOpen}" title="Ranges, calculators and pinned links">${icon('Tools')}<span>Tools <i>▾</i></span></button>` : ''}</div></nav><div class="work">${ui.toolsOpen ? tools() : ''}${winsHTML()}<main class="sheet ${['Placement', 'Practice', 'Links'].includes(ui.page) ? 'split' : ''}">${body}</main></div></div>${askUI()}${isPhone() ? bbarHTML() : ''}`;
}
// On a phone the side rail becomes a bottom bar: the four pages used most, and More for the rest.
const BBAR_MAIN = ['Today', 'Topics', 'Practice', 'Gaps'];
function bbarHTML() {
  const all = tabs(), main = all.filter(t => BBAR_MAIN.includes(t)).slice(0, 4), rest = all.filter(t => !main.includes(t)), tools = db.pages.Tools !== false, moreOn = ui.bmore || (rest.includes(ui.page) && !main.includes(ui.page)) || ui.toolsOpen;
  const lab = (t) => t === 'Profile' && (db.profile.name || '').trim() ? esc(db.profile.name.trim()) : t === 'Gaps' ? 'Stats' : t;
  const b = (t) => `<button class="${ui.page === t && !ui.bmore && !ui.toolsOpen ? 'on' : ''}" data-a="go" data-v="${t}" ${ui.page === t ? 'aria-current="page"' : ''}>${icon(t)}<span>${lab(t)}</span></button>`;
  const more = rest.length || tools ? `<button class="${moreOn ? 'on' : ''}" data-a="bmore" aria-expanded="${!!ui.bmore}"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true"><circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></svg><span>More</span></button>` : '';
  const sheet = ui.bmore ? `<div class="bsheet" role="menu">${rest.map(t => `<button role="menuitem" class="${ui.page === t ? 'on' : ''}" data-a="go" data-v="${t}">${icon(t)}<span>${lab(t)}</span></button>`).join('')}${tools ? `<button role="menuitem" data-a="tools">${icon('Tools')}<span>Tools</span></button>` : ''}</div>` : '';
  return `${ui.bmore ? '<button class="bscrim" data-a="bmore" aria-label="Close"></button>' : ''}${sheet}<nav class="bbar" aria-label="Main">${main.map(b).join('')}${more}</nav>`;
}
Object.assign(act, { bmore: () => { ui.bmore = !ui.bmore; ui.toolsOpen = false; render(); } });
function msg(m, who) { return `<div class="msg ${m.me ? 'me' : 'them'}"><span class="who">${m.me ? 'You' : who}</span>${esc(m.text)}${m.sent ? sentFold(m.sent) : ''}${m.prompt ? ownBox(m) + '<button class="gobtn" data-a="askback">Save the answer to Mess</button>' : ''}${(m.go || []).map(g => g.url ? `<a class="gobtn" href="${g.url}" target="_blank" rel="noopener">${esc(g.label)} ↗</a>` : g.a ? `<button class="gobtn" data-a="${g.a}" data-v="${esc(g.v || '')}">${esc(g.label)}</button>` : `<button class="gobtn" data-a="goto" data-v="${esc(g.to)}">${esc(g.label)} →</button>`).join('')}</div>`; }
function askUI() {
  if (ui.page === 'Practice' && ui.mode === 'Consultant') return '';
  const xt = ui.xpThis && !getSelection().isCollapsed; return `<button class="ask${xt ? ' askthis' : ''}" data-a="ask"${xt ? ' data-xp="1"' : ''} aria-expanded="${ui.askOpen}" aria-label="${xt ? 'Ask about this (the selected text)' : ui.askOpen ? 'Close' : 'Ask a question'}" title="${xt ? 'Ask about this (the selected text)' : ui.askOpen ? 'Close' : 'Ask a question'}">${xt ? 'Ask about this' : ui.askOpen ? '×' : '?'}</button>${ui.askOpen ? `<aside class="panel" role="dialog" aria-label="Ask a question" tabindex="-1"><div style="padding:13px 15px;border-bottom:1px solid var(--line)"><b style="font-weight:600">Ask or search</b><div class="s m" id="askon">You're on: ${esc(ui.page === 'Topics' && ui.topic ? ui.topic : ui.page === 'Topics' && practiceOpen() ? ui.ptopic : ui.page === 'Gaps' ? 'Stats' : ui.page)}<span id="askwhere"></span></div><div class="msgs" id="asklog">${ui.askLog.map(m => msg(m, 'Answer')).join('')}</div><div id="gresults"></div><div class="row" style="padding:9px 12px 0"><button class="btn s" style="min-height:36px" data-a="askcheck">Double check this</button><button class="btn s" style="min-height:36px" data-a="askreport">Report a problem</button></div><div class="row" style="padding:11px 12px;flex-wrap:nowrap"><input class="f grow" id="askin" aria-label="Your question" placeholder="${ui.report ? "What's wrong?" : 'Ask or search anything'}" autocomplete="off" data-gsearch data-enter="asksend"><button class="btn pri" data-a="asksend">Ask</button></div></aside>` : ''}`;
}
function context(quiet) {
  if (ui.page === 'Practice') {
    if (ui.mode === 'Questions' && ui.q.stage === 'session') { const q = pool()[ui.q.i]; if (q) { const s = 'Question: ' + q.stem + (ui.q.pick !== null ? ' Answer: ' + q.opts[q.a] + '. ' + q.why : ''); return QUESTIONS.includes(q) ? s : aiOut(s, !quiet); } }
    if (ui.mode === 'OSCE' && ui.o.st) return 'OSCE: ' + ui.o.st.label;
    return 'Practice, ' + ui.mode;
  }
  if (ui.page === 'Placement') { const c = db.cases.find(x => x.id === ui.curId); return c ? aiOut('Case: ' + c.title + '. ' + db.layout.map(([k, l]) => c[k] ? l + ': ' + c[k] : '').filter(Boolean).join(' '), !quiet) : 'Placement'; }
  if (ui.page === 'Topics' && ui.topic) { const t = TOPICS.get(ui.topic), st = (t.kind === 'd' ? TEACH_D : TEACH_C)[Math.min(ui.tsec || 0, (t.kind === 'd' ? TEACH_D : TEACH_C).length - 1)][0], i = ui.tsec || 0, nt = noteOwn(ui.topic, i); return 'the topic ' + ui.topic + ', section: ' + st + (nt ? '. My notes say: ' + aiOut(nt.join(' '), false) : ''); }
  if (ui.page === 'Topics' && practiceOpen()) { const p = practiceOpen(); return p.name + ', under ' + p.area + ' (not a condition or a drug)' + (p.src ? '. Its official source is: ' + p.src : '') + (p.where && p.where !== 'UK' ? ', which covers ' + p.where : '') + '. Mess has not written this yet'; }
  if (ui.page === 'Gaps') { const low = db.scores.slice().sort((a, b) => a[1] - b[1]).slice(0, 3); return 'my study stats' + (low.length ? '. Weakest: ' + low.map(([a, v]) => a + ' ' + v + '%').join(', ') : ''); }
  return ui.page === 'Topics' ? 'my list of topics' : ui.page === 'Today' ? 'my plan for today' : ui.page;
}
// A topic page where nothing on the page goes to an AI (no bundle, and no notes of the student's own in this section):
// "Double check this" must not sound as if the page was checked.
const askBlind = () => ui.page === 'Topics' && !!ui.topic && TOPICS.has(ui.topic) && !(typeof pageBundle === 'function' && pageBundle()) && !noteOwn(ui.topic, ui.tsec || 0);
async function copyText(t) { try { await navigator.clipboard.writeText(t); return true; } catch (e) { const a = document.createElement('textarea'); a.value = t; a.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(a); a.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (e2) { } a.remove(); return ok; } }
async function saveFile(name, text) { if (window.claude) { try { const dl = await claude.use('downloads'); if (dl) { await dl.save({ filename: name, data: text }); toast('Saved. In your downloads.'); return; } } catch (e) { if (!e || e.code !== 'declined') toast("Couldn't save that here. Try again."); return; } } const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' })); a.download = name; a.click(); toast('Downloaded.'); }
const loadScript = (src, test) => new Promise((ok, no) => { if (test()) return ok(); const sc = document.createElement('script'); sc.src = src; sc.onload = ok; sc.onerror = no; document.head.appendChild(sc); });
// ---------- render
function render() {
  const pages = { Today: today, Practice: practice, Gaps: gaps, Topics: topics, Placement: placement, Links: links, Profile: profile };
  document.body.classList.toggle('editpage', ui.page === 'Profile');
  const sx = window.scrollY, fa = document.activeElement, fid = fa && fa.id && /^(INPUT|TEXTAREA)$/.test(fa.tagName) ? fa.id : null, fv = fid ? fa.value : '', fp = fid && fa.type !== 'number' && fa.type !== 'time' ? fa.selectionStart : null;
  $('#app').classList.toggle('fresh', ui.fresh !== false); ui.fresh = false;
  $('#app').innerHTML = ui.page === 'intro' ? intro() : ui.page === 'setup' ? setup() : shell((SAMPLE ? '<div class="samplebar" role="status"><span><b>Sample data.</b> A made-up student, so you can see everything working. Nothing here is yours.</span><button class="btn sm" data-a="sampleoff">Back to my Mess</button></div>' : '') + pages[ui.page]());
  window.scrollTo(0, sx);
  fitWins();
  drawSketches();
  if (ui.page === 'Topics' && ui.topic && $('#wikisum')) wikiSum(ui.topic);
  if (!ui.blinked && $('.mark')) { ui.blinked = true; if (!matchMedia('(prefers-reduced-motion:reduce)').matches) $('.mark').animate([{ color: '#FFF' }, { color: '#FFE94A', offset: .12 }, { color: '#FFF', offset: .3 }, { color: '#FFE94A', offset: .42 }, { color: '#FFF', offset: .6 }, { color: '#FFF' }], { duration: 1100, delay: 150, easing: 'steps(1)' }); }
  if (fid) { const n = $('#' + fid); if (n) { if (n.type !== 'file') n.value = fv; n.focus({ preventScroll: true }); if (fp !== null && n.setSelectionRange) n.setSelectionRange(fp, fp); } }
  ['#asklog', '#olog', '#clog'].forEach(s => { const e = $(s); if (e) e.scrollTop = e.scrollHeight; });
  if (ui.o.stage === 'live') tick();
  if (ui.askOpen && typeof askWhere === 'function') askWhere();
}
const go = (page) => { ui.bmore = false; ui.searchOpen = false; ui.page = page; ui.fresh = true; ui.askOpen = false; ui.askLog = []; ui.report = false; ui.toolsOpen = false; ui.note = ''; window.scrollTo(0, 0); render(); };
function tick() { const e = $('#clock'); if (e) { const left = Math.max(0, 480 - Math.floor((Date.now() - ui.o.started) / 1000)); e.textContent = Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0'); } }
const val = (id) => { const e = $('#' + id); const v = e ? e.value.trim() : ''; if (e) e.value = ''; return v; };
const ROUTES = [
  [/calculat/, 'Tools/Calculators', 'Calculators'], [/reference|range|normal value/, 'Tools/Ranges', 'Reference ranges'],
  [/\bbnf\b/, 'url:https://bnf.nice.org.uk/', 'Open the BNF'], [/x-?ray|radiolog|\bct\b|imaging|\becgs?\b.*(more|practi|library)|free resource|\blinks?\b|guideline/, 'Links', 'Links'],
  [/osce|station|history taking|patient simulator/, 'Practice/OSCE', 'OSCE practice'], [/prescri|\bpsa\b|drug chart/, 'Practice/Prescribing', 'Prescribing'], [/consultant|talk.*through/, 'Practice/Consultant', 'Your consultant'], [/question|quiz|\bsba\b|\babg\b|mock/, 'Practice/Questions', 'Questions'],
  [/score|result|gap|weak|stats|passmed|quesmed/, 'Gaps', 'Your stats'], [/case|portfolio|folder|block|placement|reflection|clerk/, 'Placement', 'Your cases'],
  [/plan|task|my day|timetable|today|exam date/, 'Today', 'Today'], [/colou?r|theme|look|\bkey\b|\bai\b|groq|claude|backup|restore|memory|mnemonic|lecture|slides|past paper|profile|instruction|layout|turn off|hide (a )?page/, 'Profile', 'Profile']
];
const routeFor = (t) => { const l = t.toLowerCase(), r = ROUTES.find(([re]) => re.test(l)); if (!r) return null; return r[1].startsWith('url:') ? { url: r[1].slice(4), label: r[2] } : { to: r[1], label: 'Go to ' + r[2] }; };
const isNav = (t) => /where|how (do|can) i|find|go to|take me|open|add|change|upload|show me|get to|need/i.test(t);
function goTo(v) { const [p, sub] = v.split('/'); if (p === 'Tools') { ui.askOpen = false; if (sub === 'Ranges') openWin('ranges'); else { ui.toolsOpen = true; render(); } return; } if (p === 'Practice' && sub) ui.mode = sub; go(p); }
// No signal, or the AI couldn't be reached for that reason: say so, and give the question as a prompt to keep (job 4).
const OFFLINE_MSG = "You're offline, so your AI can't answer right now. Here's your question as a prompt: copy it, or send it once you have a signal.";
const NONET_MSG = (e) => e.message + " Here's your question as a prompt: copy it into your AI, or send it again later.";
// Intents that make a second AI request; their answer would not match the first request's record, so no fold.
const AI_AGAIN = ['cards', 'test', 'diagram'];
async function ask(text) {
  if (!text) return;
  if (ui.report) { const pg = context(true); db.reports.push({ page: pg, text, at: new Date().toISOString() }); save(); ui.report = false; ui.askLog.push({ me: true, text }, { me: false, text: 'Saved on this device. Send it to the creator too?', go: [{ url: 'mailto:hello@messmed.co.uk?subject=' + encodeURIComponent('Mess: problem report') + '&body=' + encodeURIComponent('Page: ' + ui.page + '\n\n' + aiOut(text, false)), label: 'Email the creator' }] }); render(); return; }
  const it = parseIntent(text); if (it) return intentReply(text, it);
  const dest = routeFor(text), nav = dest && isNav(text);
  if (!aiReady()) { const known = explainLocal(text), hasDef = !/Claude isn't reachable/.test(known); ui.askLog.push({ me: true, text }, nav || (dest && !hasDef) ? { me: false, text: "That's here:", go: [dest] } : hasDef ? { me: false, text: known } : { me: false, text: "Here's a prompt with your context. Change anything, then send it to your AI.", prompt: buildPrompt(text, { page: true }), pid: 'op' + Date.now(), go: [{ to: 'Profile', label: 'AI settings' }] }); render(); return; }
  if (aiOffline()) { ui.askLog.push({ me: true, text }, { me: false, text: OFFLINE_MSG, prompt: buildPrompt(text, { page: true }), pid: 'op' + Date.now(), go: nav ? [dest] : [] }); render(); return; } // no signal: say so, and give the prompt to keep
  const bundle = typeof pageBundle === 'function' ? pageBundle() : null; // read before the page is redrawn
  ui.askLog.push({ me: true, text }, { me: false, text: '...', go: nav ? [dest] : [] }); render();
  const log = ui.askLog.slice(0, -1);
  const pend = ui.askLog[ui.askLog.length - 1];
  let sent = null;
  try { const reply = await callAI('You help a UK medical student revise, inside their study app, Mess, for education only. Reply in under 80 words, plainly. They are looking at: ' + (bundle ? bundleText(bundle) + '\n' + BUNDLE_RULE : context() + '.') + ' If unsure, say so. If what they want is genuinely unclear and a wrong guess would waste their time, ask one short question instead of answering; otherwise never ask, just do it. Never invent citations. Do not reveal the answer to a question they have not answered unless asked. Mess has its own place for their work, so build it there rather than doing it in chat. If they are asking Mess to do something, reply with only this JSON and nothing else: {"do":"test|cards|task|day|score|note|exam|diagram|stats","topic":"topic name if any","text":"the task, event, score or note in their words"}. test means quiz them, cards means make flashcards, day means add to their calendar, note means save to their topic notes. Otherwise answer normally.', toTurns(log), { onSent: (r) => { sent = r; pend.sent = r; } }); const j = reply.trim().match(/^\{[\s\S]*"do"[\s\S]*\}$/); let o = null; if (j) { try { o = JSON.parse(j[0]); } catch (e) {} } if (o && INTENTS.includes(o.do)) { if (AI_AGAIN.includes(o.do)) delete pend.sent; pend.text = '...'; Object.assign(pend, await runIntent({ do: o.do, topic: TOPICS.has(o.topic) ? o.topic : (topicsIn(o.topic || '')[0] || topicsIn(text)[0] || ctxTopic()), text: o.text || text }, text)); } else { pend.text = reply; pend.go = [...(pend.go || []), ...answerChips(text, reply)]; } }
  catch (e) { if (aiOffline() || (e && e.net)) { pend.text = aiOffline() ? OFFLINE_MSG : NONET_MSG(e); pend.prompt = buildPrompt(text, { page: true, b: bundle }); pend.pid = 'op' + Date.now(); } else pend.text = aiMsg(e); }
  if (ui.askOpen) render();
}
function pressKey(k) { let { disp, acc, op, fresh } = ui.basic; const ap = (a, b, o) => o === '+' ? a + b : o === '−' ? a - b : o === '×' ? a * b : o === '÷' ? (b === 0 ? NaN : a / b) : b; if (/\d/.test(k)) { disp = fresh || disp === '0' ? k : disp + k; fresh = false; } else if (k === '.') { if (fresh) { disp = '0.'; fresh = false; } else if (!disp.includes('.')) disp += '.'; } else if (k === 'C') { disp = '0'; acc = null; op = null; fresh = true; } else { const c = parseFloat(disp), r = acc !== null && op && !fresh ? ap(acc, c, op) : c, sh = isNaN(r) ? 'Error' : String(+r.toFixed(6)); disp = sh; if (k === '=') { acc = null; op = null; } else { acc = isNaN(r) ? null : r; op = k; } fresh = true; } ui.basic = { disp, acc, op, fresh }; render(); }
Object.assign(act, {
  searchtoggle: () => { ui.searchOpen = !ui.searchOpen; render(); if (ui.searchOpen) $('#gsearch').focus(); }
});
Object.assign(act, {
  go: (v) => { if (v === 'Topics') { ui.topic = null; ui.tnew = null; ui.tfedit = null; ui.tform = null; } go(v); },
  goto: (v) => { if (v.startsWith('Topic/')) { act.topicopen(v.slice(6)); return; } goTo(v); }
});
Object.assign(act, {
  key: pressKey,
  ask: () => {
    if (ui.xpSwallow) { ui.xpSwallow = false; return; } // the follow-on click of the "Ask about this" tap: it already opened the answer
    const b = $('.ask'); if (b && 'xp' in b.dataset) { const t = getSelection().toString().trim(); if (t) return explainPhrase(t); if (ui.xpText) return explainPhrase(ui.xpText, ui.xpBundle); } // Enter or Space on "Ask about this"
    ui.askOpen = !ui.askOpen; ui.askFocus = ui.askOpen ? 'open' : 'closed'; render();
  },
  asksend: () => ask(val('askin')),
  askcheck: () => { if (askBlind()) { ui.askLog.push({ me: true, text: 'Double check this' }, { me: false, text: 'This page is not sent to an AI, so it has nothing here to check. Check it against the guideline your course uses, or ask about a point in your own words.', go: [{ to: 'Links', label: 'Go to Links' }] }); render(); return; } ask('Double check what is on this page. Say what you are confident in, what you are not, and which guideline to check it against. Do not invent citations.'); },
  askreport: () => { ui.report = true; ui.askLog.push({ me: false, text: "What's wrong? Tell me and I'll save it with this page." }); render(); },
  asktopic: () => { ui.askOpen = true; ask('Teach me the key things to learn from this case, one step at a time.'); }
});
Object.assign(act, {
  mode: (v) => { ui.mode = v; ui.askOpen = false; ui.askLog = []; ui.note = ''; render(); }
});
Object.assign(act, {
  p1toggle: () => { ui.p1 = !paneOpen(); render(); }
});
Object.assign(act, {
  install: async () => { const e = ui.installEvt; if (!e) return; e.prompt(); await e.userChoice; ui.installEvt = null; render(); }
});
Object.assign(act, {
  askundo: () => { if (!ui.undo) return; db = JSON.parse(ui.undo); ui.undo = null; syncMyTopics(db.myTopics); save(); ui.askLog.push({ me: false, text: 'Undone.' }); render(); },
  askdo: async (v) => { const [d, t] = v.split('|'), it = { do: d, topic: t, fromLast: d === 'note', useLast: d === 'cards' }; const last = lastAnswer(); ui.askLog.push({ me: false, text: '...' }); render(); const m = ui.askLog[ui.askLog.length - 1]; const keep = ui.askLog.pop(); ui.askLog.push(keep); try { if (d === 'note') it.text = last; Object.assign(m, await runIntent(it, '')); } catch (e) { m.text = aiMsg(e); } render(); }
});
const renderBase = render;
let lastBand = isWide() ? 2 : isPhone() ? 0 : 1;
