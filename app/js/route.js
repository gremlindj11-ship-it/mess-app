// Mess · route.js · Each screen gets its own web address (e.g. /app/topic-copd), so the back button works,
// links can be shared, and visit counts (Cloudflare Web Analytics) show which pages and topics are used.
// Loaded in this order by index.html: store.js, safety.js, intake.js, links.js, ai.js, flow.js, tools.js, intro.js, today.js, practice.js, stats.js, topics.js, story.js, curricula.js, route.js, diagrams.js, placement.js, profile.js, import.js, packs.js, apps.js, boot.js.
// All files share one global scope (plain scripts, no build step).
//
// Privacy: only Mess's own page, topic and curriculum names ever appear in an address. A student's own
// topics show as "topic-yours" and cases as "placement", so nothing a student writes reaches the address bar.
// Addresses stay at the same folder level as index.html, so every relative file path keeps working.

const slug = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const ROUTE_PAGES = { Today: 'today', Practice: 'practice', Gaps: 'stats', Topics: 'topics', Placement: 'placement', Links: 'links', Profile: 'profile' };
const routeOn = () => !window.claude && /^https?:$/.test(location.protocol) && history.pushState;
const routeDir = () => location.pathname.replace(/[^/]*$/, '');
function routeNow() {
  if (ui.page === 'intro' || ui.page === 'setup') return 'welcome';
  if (ui.page === 'Topics') {
    if (ui.topic && TOPICS.has(ui.topic)) { const t = TOPICS.get(ui.topic); return t.mine ? 'topic-yours' : 'topic-' + slug(t.name); }
    if (ui.ptopic && PRACTICE.has(ui.ptopic)) return 'inpractice-' + slug(ui.ptopic);
    if (ui.citem) return 'map-' + slug(ui.citem.split('\u0001')[1]);
    return 'topics';
  }
  if (ui.page === 'Practice') return 'practice-' + slug(ui.mode || 'OSCE');
  return ROUTE_PAGES[ui.page] || 'today';
}
// Read an address back into Mess's state. Unknown addresses just open Today.
function routeRead(seg) {
  const s = slug(seg); if (!s || s === 'index-html' || !(db.setupDone || ui.guest)) return false;
  const page = Object.keys(ROUTE_PAGES).find(k => ROUTE_PAGES[k] === s);
  if (page) { ui.page = page; ui.topic = null; ui.ptopic = null; ui.citem = null; return true; }
  if (s.startsWith('practice-')) { const m = ['OSCE', 'Questions', 'Prescribing', 'Flashcards', 'Consultant'].find(x => slug(x) === s.slice(9)); ui.page = 'Practice'; if (m) ui.mode = m; return true; }
  if (s.startsWith('topic-')) { const t = [...TOPICS.values()].find(x => !x.mine && slug(x.name) === s.slice(6)); ui.page = 'Topics'; ui.topic = t ? t.name : null; ui.ptopic = null; ui.citem = null; return true; }
  if (s.startsWith('inpractice-')) { const p = [...PRACTICE.values()].find(x => slug(x.name) === s.slice(11)); ui.page = 'Topics'; ui.topic = null; ui.citem = null; ui.ptopic = p ? p.name : null; return true; }
  if (s.startsWith('map-') && typeof curNow === 'function') { const cur = curNow(); ui.page = 'Topics'; ui.topic = null; ui.ptopic = null; if (cur) { const it = curItems(cur).find(x => slug(x.label) === s.slice(4)); ui.citem = it ? it.area + '\u0001' + it.label : null; } return true; }
  return false;
}
let ROUTE_LAST = null;
function routeSync() { if (!routeOn()) return; const want = routeDir() + routeNow(); if (location.pathname === want || ROUTE_LAST === want) return; ROUTE_LAST = want; try { history.pushState({ mess: 1 }, '', want); } catch (e) { } }
if (routeOn()) {
  const seg = location.pathname.split('/').pop();
  // A shared link (like /app/topic-copd) opens that screen even on a first visit, instead of the welcome page.
  // Nothing is saved as "set up": opening Mess itself later still shows the welcome and setup.
  if (seg && seg !== 'index.html' && !/\.[a-z0-9]+$/i.test(seg)) { if (!db.setupDone && /^(topic|map|inpractice)-/.test(slug(seg))) ui.guest = true; if (!routeRead(seg)) ui.guest = false; }
  addEventListener('popstate', () => { ROUTE_LAST = location.pathname; routeRead(location.pathname.split('/').pop()); ui.from = null; ui.askOpen = false; ui.bmore = false; render(); });
}
