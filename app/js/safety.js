// Mess · safety.js · Security and stability: escaping, cleaning SVGs and imports, checking backups, catching errors.
// Loaded in this order by index.html: store.js, safety.js, intake.js, links.js, ai.js, flow.js, tools.js, intro.js, today.js, practice.js, stats.js, topics.js, story.js, curricula.js, route.js, diagrams.js, placement.js, profile.js, import.js, packs.js, apps.js, boot.js.
// All files share one global scope (plain scripts, no build step).

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const SAFE_RE = (re) => { re = String(re || ''); if (re.length > 300 || /\([^)]*[+*][^)]*\)[+*{]/.test(re)) return /$^/; try { return new RegExp(re, 'i'); } catch (e) { return /$^/; } };
const cleanField = (h) => { const x = new DOMParser().parseFromString(String(h).replace(/<br\s*\/?>|<\/div>|<\/li>/gi, ' '), 'text/html'); return (x.body.textContent || '').replace(/\[sound:[^\]]*\]/g, '').replace(/\s+/g, ' ').trim(); };
const IMG_OK = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;
const SVG_EL = new Set(['svg', 'g', 'path', 'circle', 'ellipse', 'rect', 'line', 'polyline', 'polygon', 'text', 'tspan', 'defs', 'lineargradient', 'radialgradient', 'stop']), SVG_AT = new Set(['viewBox', 'd', 'fill', 'stroke', 'stroke-width', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'fx', 'fy', 'dx', 'dy', 'width', 'height', 'points', 'transform', 'opacity', 'fill-opacity', 'stroke-opacity', 'stop-opacity', 'stop-color', 'offset', 'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin', 'text-anchor', 'font-size', 'font-weight', 'id', 'gradientUnits', 'font-family', 'font-style', 'fill-rule', 'clip-rule', 'stroke-miterlimit', 'dominant-baseline', 'alignment-baseline', 'xmlns']);
function cleanSVG(str) { const doc = new DOMParser().parseFromString(str, 'image/svg+xml'), root = doc.documentElement; if (!root || root.nodeName.toLowerCase() !== 'svg' || doc.querySelector('parsererror')) return ''; const walk = (el) => { [...el.children].forEach(c => { if (!SVG_EL.has(c.nodeName.toLowerCase())) c.remove(); else walk(c); }); [...el.attributes].forEach(a => { if (!SVG_AT.has(a.name) || /javascript:|url\((?!['"]?#)/i.test(a.value)) el.removeAttribute(a.name); }); }; walk(root); if (!root.getAttribute('viewBox')) { const w = parseFloat(root.getAttribute('width')), h = parseFloat(root.getAttribute('height')); root.setAttribute('viewBox', w > 0 && h > 0 ? '0 0 ' + w + ' ' + h : '0 0 640 400'); } root.removeAttribute('width'); root.removeAttribute('height'); return root.children.length ? new XMLSerializer().serializeToString(root) : ''; }
// A backup can come from anywhere, so check it before trusting it.
function cleanBackup(data) {
  const d = { ...FRESH() }, hex = /^#[0-9a-f]{6}$/i, fresh = FRESH();
  Object.keys(data).forEach(k => { if (/^(__proto__|constructor|prototype)$/.test(k)) return; const v = data[k]; if (k in fresh && v !== null && typeof v !== typeof fresh[k]) return; if (Array.isArray(fresh[k]) && !Array.isArray(v)) return; d[k] = v; });
  ['customColour', 'customHi', 'pCol'].forEach(k => { if (d[k] && !hex.test(d[k])) d[k] = ''; });
  if (d.theme !== 'custom' && !THEMES[d.theme]) d.theme = 'clean';
  d.profile = { ...fresh.profile, ...(d.profile && typeof d.profile === 'object' ? d.profile : {}) };
  Object.keys(d.profile).forEach(k => { if (typeof d.profile[k] !== 'string') d.profile[k] = ''; else d.profile[k] = d.profile[k].slice(0, 200); });
  d.packs = (Array.isArray(data.packs) ? data.packs : []).map(p => packCheck({ ...p, mess: 'pack' }).pack).filter(p => p && p.id);
  return cleanItems(d);
}

// Check every saved list item by item, so one damaged entry (from an old or edited backup, or a browser glitch)
// can't break a page. Damaged entries are dropped; missing fields get safe defaults.
function cleanItems(d) {
  const O = (x) => !!x && typeof x === 'object' && !Array.isArray(x), S = (x) => typeof x === 'string', N = (x) => typeof x === 'number' && isFinite(x);
  const strs = (a) => Array.isArray(a) ? a.filter(S) : [];
  const objs = (k, fix) => { d[k] = Array.isArray(d[k]) ? d[k].filter(O).map(x => fix ? fix(x) : x).filter(Boolean) : (k in FRESH() ? [] : d[k]); };
  ['missed', 'folders'].forEach(k => { if (k in d) d[k] = strs(d[k]); });
  if (!Array.isArray(d.layout) || !d.layout.every(r => Array.isArray(r) && r.length >= 2 && r.every(S))) d.layout = FRESH().layout;
  objs('tasks', x => S(x.t) || S(x.text) ? x : null);
  objs('day'); objs('other'); objs('memory', x => S(x.text) ? x : null); objs('reports');
  if (Array.isArray(d.scores)) d.scores = d.scores.filter(x => Array.isArray(x) && S(x[0]) && N(x[1])); else d.scores = [];
  objs('history', x => !(S(x.d) && !isNaN(new Date(x.d))) ? null : ({ ...x, topic: S(x.topic) ? x.topic : '', ts: strs(x.ts) }));
  objs('cases', x => !Object.keys(x).some(k => S(x[k]) && x[k].trim()) ? null : ({ ...x, id: S(x.id) ? x.id : 'c' + Date.now() + Math.random().toString(36).slice(2, 6), title: S(x.title) ? x.title : 'Untitled case', folder: S(x.folder) ? x.folder : '', ...(x.tags ? { tags: strs(x.tags) } : {}) }));
  if ('cards' in d) objs('cards', x => S(x.f) && S(x.b) ? { ...x, id: S(x.id) ? x.id : 'k' + Date.now() + Math.random().toString(36).slice(2, 6), due: N(x.due) ? x.due : 0, topic: S(x.topic) ? x.topic : '', src: S(x.src) ? x.src : '', ai: x.ai === true, checked: S(x.checked) ? x.checked.slice(0, 10) : '' } : null);
  if ('myQs' in d) objs('myQs', x => { const opts = strs(x.opts); return S(x.stem) && opts.length >= 2 && Number.isInteger(x.a) && x.a >= 0 && x.a < opts.length ? { ...x, opts, why: S(x.why) ? x.why : '', topic: S(x.topic) ? x.topic : '' } : null; });
  if ('myTopics' in d) objs('myTopics', x => S(x.name) && x.name.trim() ? { ...x, area: S(x.area) ? x.area : '', al: strs(x.al), rel: strs(x.rel), drugs: strs(x.drugs) } : null);
  if ('lectures' in d) objs('lectures', x => ({ ...x, name: S(x.name) ? x.name : 'Lecture', ...(x.title !== undefined && !S(x.title) ? { title: 'Lecture' } : {}), ...(x.topics ? { topics: strs(x.topics) } : {}) }));
  if ('myNotes' in d) { const m = O(d.myNotes) ? d.myNotes : {}; d.myNotes = {}; Object.entries(m).forEach(([n, secs]) => { if (!O(secs)) return; Object.entries(secs).forEach(([i, pts]) => { const l = strs(pts); if (l.length) (d.myNotes[n] = d.myNotes[n] || {})[i] = l; }); }); }
  if ('myDiagrams' in d) { const m = O(d.myDiagrams) ? d.myDiagrams : {}; d.myDiagrams = {}; Object.entries(m).forEach(([n, secs]) => { if (!O(secs)) return; Object.entries(secs).forEach(([i, list]) => { const l = Array.isArray(list) ? list.filter(x => O(x) && S(x.kind)) : []; if (l.length) (d.myDiagrams[n] = d.myDiagrams[n] || {})[i] = l; }); }); }
  if ('predict' in d) { const m = O(d.predict) ? d.predict : {}; d.predict = {}; Object.entries(m).slice(0, 2000).forEach(([n, v]) => { if (!O(v)) return; d.predict[String(n).slice(0, 120)] = v.skip === true ? { skip: true, d: S(v.d) ? v.d.slice(0, 10) : '' } : Number.isInteger(v.pick) ? { pick: v.pick, d: S(v.d) ? v.d.slice(0, 10) : '' } : null; if (!d.predict[String(n).slice(0, 120)]) delete d.predict[String(n).slice(0, 120)]; }); }
  if (Array.isArray(d.cards)) d.cards.forEach(c => { if (c.kind !== undefined && c.kind !== 'explain') delete c.kind; if (c.kind === 'explain') { c.check = strs(c.check).map(x => x.slice(0, 300)).slice(0, 6); if (!c.check.length) delete c.kind; } });
  if ('missLog' in d) d.missLog = Array.isArray(d.missLog) ? d.missLog.filter(x => O(x) && S(x.text) && S(x.n)).map(x => ({ id: S(x.id) ? x.id : 'm' + Math.random().toString(36).slice(2, 8), d: S(x.d) && !isNaN(new Date(x.d)) ? x.d : new Date().toISOString(), text: x.text.slice(0, 3000), right: S(x.right) ? x.right.slice(0, 400) : '', from: ['q', 'ward', 'teach'].includes(x.from) ? x.from : 'q', n: x.n, k: Number.isInteger(x.k) ? x.k : -1, alts: Array.isArray(x.alts) ? x.alts.filter(Number.isInteger).slice(0, 2) : [], pts: (Array.isArray(x.pts) ? x.pts : []).map(p => S(p) ? { t: p, why: '' } : O(p) && S(p.t) ? { t: p.t, why: S(p.why) ? p.why : '' } : null).filter(Boolean).slice(0, 4), gap: x.gap === true, reason: S(x.reason) ? x.reason : '', card: S(x.card) ? x.card : '' })).slice(0, 200) : [];
  if (!O(d.profile)) d.profile = FRESH().profile;
  if (!S(d.examDate)) d.examDate = ''; else d.examDate = d.examDate.slice(0, 80);
  return d;
}

// ---------- Safety net
// If something breaks, say so kindly, keep the student's work, and keep a note of it so it can be reported
// (Profile, More, Export reports). Nothing is sent anywhere.
const SAFETY = { last: 0 };
function oops(err, where) {
  const m = String((err && (err.message || err.reason && err.reason.message)) || err || 'Unknown problem').slice(0, 300);
  if (/ResizeObserver|Script error\.?$|cancel/.test(m)) return;
  try { db.reports = db.reports || []; db.reports.push({ d: new Date().toISOString(), kind: 'error', where: where || ui.page || '', text: m }); db.reports = db.reports.slice(-40); localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {}
  if (Date.now() - SAFETY.last > 8000) { SAFETY.last = Date.now(); try { toast('Something went wrong there. Your work is saved. If it keeps happening, report it from the ?.'); } catch (e) {} }
}
addEventListener('error', (e) => oops(e.error || e.message, 'page'));
addEventListener('unhandledrejection', (e) => oops(e.reason, 'background'));
