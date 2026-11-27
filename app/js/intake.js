// Mess · intake.js · One way in: every file, paste, pack, backup and AI reply passes these checks.
// Loaded in this order by index.html: store.js, safety.js, intake.js, links.js, ai.js, flow.js, tools.js, intro.js, today.js, practice.js, stats.js, topics.js, story.js, curricula.js, route.js, diagrams.js, placement.js, profile.js, import.js, packs.js, apps.js, boot.js.
// All files share one global scope (plain scripts, no build step).
//
// The pipeline, in order (each step is one function below):
//   1. intakeCheck   what the file really is (its first bytes, not just its name) and whether it's a sane size
//   2. intakeZip     Word, PowerPoint and Anki files are zips: refuse zip bombs before unpacking
//   3. intakePDF     open PDFs with scripts and embedded fonts switched off (pdf.js CVE-2024-4367)
//   4. intakeText    clean the text: hidden characters, control codes, odd line endings, too long
//   5. piiScan       find patient details (NHS numbers, hospital numbers, dates of birth, names, contacts)
//   6. piiRedact     take them out, automatically, and say how many
//   7. format, parse, repair, check, skip repeats: the parsers in import.js, packs.js and safety.js
//   8. intakeSnap    keep what was there before, so any import can be undone
// The student is only asked something when a wrong guess would really hurt (see lecAskUser in import.js).

const INTAKE_LIMITS = {
  text: 10e6, json: 25e6, doc: 80e6, pdf: 120e6, image: 20e6, audio: 600e6, zip: 300e6,
  zipFiles: 4000, zipUnpacked: 400e6, zipRatio: 250, pdfPages: 300
};
const INTAKE_EXT = {
  pdf: /\.pdf$/i, zip: /\.(pptx|docx|apkg|colpkg|zip)$/i, json: /\.json$/i,
  image: /\.(png|jpe?g|webp|gif)$/i, svg: /\.svg$/i, audio: /\.(mp3|m4a|wav|ogg|webm|mp4|flac|aac|mpga|mpeg)$/i,
  text: /\.(txt|md|csv|tsv|vtt|srt|ics|mmd)$/i
};
const intakeKindOf = (name) => Object.keys(INTAKE_EXT).find(k => INTAKE_EXT[k].test(name || '')) || 'unknown';

// 1. What is it really? Look at the first bytes.
async function intakeSniff(f) {
  let b; try { b = new Uint8Array(await f.slice(0, 4096).arrayBuffer()); } catch (e) { return 'unreadable'; }
  const s = (i, t) => [...t].every((c, k) => b[i + k] === c.charCodeAt(0));
  if (s(0, '%PDF')) return 'pdf';
  if (b[0] === 0x50 && b[1] === 0x4B && (b[2] === 3 || b[2] === 5) && (b[3] === 4 || b[3] === 6)) return 'zip';
  if (b[0] === 0x89 && s(1, 'PNG')) return 'png';
  if (b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) return 'jpeg';
  if (s(0, 'RIFF') && s(8, 'WEBP')) return 'webp';
  if (s(0, 'RIFF') && s(8, 'WAVE')) return 'audio';
  if (s(0, 'GIF8')) return 'gif';
  if (s(0, 'ID3') || (b[0] === 0xFF && (b[1] & 0xE0) === 0xE0) || s(0, 'OggS') || s(0, 'fLaC') || s(4, 'ftyp') || (b[0] === 0x1A && b[1] === 0x45 && b[2] === 0xDF && b[3] === 0xA3)) return 'audio';
  if (s(0, 'SQLite format 3')) return 'sqlite';
  if (!b.length) return 'empty';
  let nul = 0; for (let i = 0; i < b.length; i++) if (b[i] === 0) nul++;
  if (nul > 2) return 'binary';
  const head = new TextDecoder('utf-8', { fatal: false }).decode(b).replace(/^﻿/, '').trimStart().slice(0, 200).toLowerCase();
  if (/^<svg|^<\?xml[^>]*>\s*(<!--[\s\S]*?-->\s*)*<svg/.test(head)) return 'svg';
  if (/^<!doctype html|^<html|^<head|^<script/.test(head)) return 'html';
  if (/^[{[]/.test(head)) return 'json';
  return 'text';
}
// What each kind of file is allowed to really be.
const INTAKE_OK = { pdf: ['pdf'], zip: ['zip'], json: ['json'], image: ['png', 'jpeg', 'webp', 'gif'], svg: ['svg'], audio: ['audio'], text: ['text', 'json', 'empty'] };
const INTAKE_SAY = {
  big: (n) => n + ' is too big to bring in here. Split it into smaller files.',
  empty: (n) => n + ' is empty.',
  fake: (n) => n + " isn't really the kind of file its name says, so Mess won't open it. Save or export it again and try once more.",
  type: (n) => "Mess can't read " + n + '.',
  zip: (n) => n + ' unpacks to something far bigger than it looks, so Mess won\'t open it. Export it again.'
};
// Returns { ok: true, kind } or { ok: false, err } with a message to show the student.
async function intakeCheck(f, allowed) {
  if (!f) return { ok: false, err: 'No file came through.' };
  const name = String(f.name || 'That file').slice(0, 120), kind = intakeKindOf(name);
  if (allowed && !allowed.includes(kind)) return { ok: false, err: INTAKE_SAY.type(name) };
  if (kind === 'unknown') return { ok: false, err: INTAKE_SAY.type(name) };
  const cap = INTAKE_LIMITS[kind] || INTAKE_LIMITS.doc; if (f.size > cap) return { ok: false, err: INTAKE_SAY.big(name) };
  if (f.size === 0) return { ok: false, err: INTAKE_SAY.empty(name) };
  const real = await intakeSniff(f);
  if (!(INTAKE_OK[kind] || []).includes(real)) return { ok: false, err: real === 'empty' ? INTAKE_SAY.empty(name) : INTAKE_SAY.fake(name), real };
  return { ok: true, kind, real };
}
// 2. Zips: count and size every entry from the zip's own directory before unpacking anything.
async function intakeZip(buf) {
  await loadScript('assets/jszip.min.js', () => window.JSZip);
  const z = await JSZip.loadAsync(buf), files = Object.values(z.files);
  if (files.length > INTAKE_LIMITS.zipFiles) throw new Error('zipbomb');
  let total = 0; for (const e of files) { const d = e._data || {}, u = +d.uncompressedSize || 0, c = +d.compressedSize || 0; total += u; if (u > INTAKE_LIMITS.zipUnpacked || (c > 0 && u / c > INTAKE_LIMITS.zipRatio && u > 5e6)) throw new Error('zipbomb'); }
  if (total > INTAKE_LIMITS.zipUnpacked) throw new Error('zipbomb');
  return z;
}
// 3. PDFs: never let a PDF run code. pdf.js 3.x can be made to run JavaScript through a crafted font
// (CVE-2024-4367); switching off eval and font loading closes that, and Mess only needs the text.
const INTAKE_PDF = Object.freeze({ isEvalSupported: false, disableFontFace: true, enableXfa: false, stopAtErrors: false });
async function intakePDF(buf) {
  await loadScript('assets/pdf.min.js', () => window.pdfjsLib); pdfjsLib.GlobalWorkerOptions.workerSrc = 'assets/pdf.worker.min.js';
  return pdfjsLib.getDocument({ data: buf, ...INTAKE_PDF }).promise;
}
// 4. Clean text: remove hidden characters (zero-width and direction marks can hide instructions meant
// for an AI, or make two identical cards look different), control codes and Windows line endings.
function intakeText(t, max) {
  let s = String(t == null ? '' : t);
  if (max && s.length > max) s = s.slice(0, max);
  s = s.replace(/^﻿/, '').replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/[​-‏‪-‮⁠-⁤⁦-⁩﻿­]/g, '');
  try { s = s.normalize('NFC'); } catch (e) { }
  return s;
}
// 5. Patient details. Patterns plus context words plus a check digit, the way Microsoft Presidio does it:
// "high" ones are almost certainly identifiers; "medium" ones usually are in a case, but can be innocent in a lecture.
const nhsOK = (d) => { const n = d.replace(/\D/g, ''); if (n.length !== 10 || /^(\d)\1+$/.test(n)) return false; let s = 0; for (let i = 0; i < 9; i++) s += +n[i] * (10 - i); const c = 11 - (s % 11), chk = c === 11 ? 0 : c; return chk !== 10 && chk === +n[9]; };
const PII = [
  ['NHS number', 'high', /\b\d{3}[ -]?\d{3}[ -]?\d{4}\b/g, (m) => nhsOK(m)],
  ['hospital number', 'high', /\b(?:MRN|hosp(?:ital)?\.?\s*(?:no|num(?:ber)?)|unit\s*no|patient\s*(?:id|no))\.?\s*[:#]?\s*[A-Z]{0,3}\d{5,10}\b/gi],
  ['date of birth', 'high', /\b(?:d\.?o\.?b\.?|date\s+of\s+birth|born(?:\s+on)?)\s*[:\-]?\s*(?:\d{1,2}[\/.\- ]\d{1,2}[\/.\- ]\d{2,4}|\d{1,2}(?:st|nd|rd|th)?\s+[A-Z][a-z]{2,8}\s+\d{2,4})/gi],
  ['address', 'medium', /\b\d{1,4}\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\s+(?:Road|Rd|Street|Avenue|Ave|Lane|Close|Drive|Crescent|Grove|Place|Court|Terrace)\b,?(?:\s+[A-Z][a-z]+)*,?\s*(?:[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})?/g],
  ['name', 'medium', /\b(?:Mr|Mrs|Ms|Miss|Mx|Master)\.?\s+[A-Z][a-z'’-]+(?:[- ][A-Z][a-z'’-]+)?/g],
  ['name', 'medium', /\b(?:patient|pt|lady|gentleman|man|woman|boy|girl)\s+(?:called|named)\s+[A-Z][a-z'’-]+(?:\s+[A-Z][a-z'’-]+)?/gi],
  ['postcode', 'medium', /\b(?:[A-Z]{1,2}\d[A-Z\d]?)\s*\d[A-Z]{2}\b/g],
  ['phone number', 'medium', /(?:\+44\s?7\d{3}|\b07\d{3})\s?\d{3}\s?\d{3}\b|(?:\+44\s?|\b0)(?:1\d{2,3}|2\d)\s?\d{3,4}\s?\d{3,4}\b/g],
  ['email', 'medium', /\b[\w.+-]+@[\w-]+(?:\.[\w-]+)+\b/g]
];
// Returns [{ kind, level, start, end, text }], longest-first with overlaps removed.
function piiScan(t, levels) {
  const s = String(t || ''), want = levels || ['high', 'medium'], hits = [];
  PII.forEach(([kind, level, re, ok]) => { if (!want.includes(level)) return; re.lastIndex = 0; let m; while ((m = re.exec(s))) { if (!ok || ok(m[0])) hits.push({ kind, level, start: m.index, end: m.index + m[0].length, text: m[0] }); if (re.lastIndex === m.index) re.lastIndex++; } });
  hits.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));
  const out = []; hits.forEach(h => { const last = out[out.length - 1]; if (!last || h.start >= last.end) out.push(h); });
  return out;
}
// 6. Take them out. Returns { text, removed: { 'NHS number': 2, ... }, n }.
function piiRedact(t, levels) {
  const s = String(t || ''), hits = piiScan(s, levels), removed = {}; if (!hits.length) return { text: s, removed, n: 0 };
  let out = '', at = 0; hits.forEach(h => { out += s.slice(at, h.start) + '[' + h.kind + ' removed]'; at = h.end; removed[h.kind] = (removed[h.kind] || 0) + 1; });
  return { text: out + s.slice(at), removed, n: hits.length };
}
const piiSay = (removed) => { const k = Object.entries(removed); if (!k.length) return ''; return k.map(([w, n]) => n + ' ' + w + (n === 1 ? '' : (/s$/.test(w) ? '' : 's'))).join(', '); };
// What's brought in and kept on this device: take out only the near-certain identifiers.
// What's sent to an AI: take out the likely ones too, since it leaves the device.
function intakeIn(t, max) { const r = piiRedact(intakeText(t, max), ['high']); intakeNote(r.removed, 'in'); return r.text; }
function intakeOut(t, notify = true) { if (typeof t !== 'string') return t; const r = piiRedact(intakeText(t), ['high', 'medium']); if (notify) intakeNote(r.removed, 'out'); return r.text; }
const INTAKE_LOG = { in: {}, out: {}, at: 0 };
function intakeNote(removed, way) {
  if (!Object.keys(removed).length) return; Object.entries(removed).forEach(([k, n]) => { INTAKE_LOG[way][k] = (INTAKE_LOG[way][k] || 0) + n; });
  clearTimeout(INTAKE_LOG.t); INTAKE_LOG.t = setTimeout(() => { const o = piiSay(INTAKE_LOG.out), i = piiSay(INTAKE_LOG.in); INTAKE_LOG.out = {}; INTAKE_LOG.in = {};
    const msg = [o && 'Took out ' + o + ' before sending to the AI.', i && 'Took out ' + i + ' from what you brought in.'].filter(Boolean).join(' ');
    if (!msg) return; ui.intakeMsg = msg; if (ui.lec) { ui.lecPrivacy = [ui.lecPrivacy, msg].filter(Boolean).join(' '); try { lecPaint(); } catch (e) { } } else { try { toast(msg); } catch (e) { } } }, 60);
}
// Mermaid code comes from AIs and students, so strip what could change how it's drawn or run:
// setup directives (%%{init}%%), click and link lines, HTML tags (except line breaks) and javascript: links.
function mmdClean(src) { return intakeText(src, 20000).replace(/%%\{[\s\S]*?\}%%/g, '').split('\n').filter(l => !/^\s*(click|callback|link|href)\b/i.test(l)).join('\n').replace(/<(?!br\s*\/?>)\/?[a-z][^>]*>/gi, '').replace(/javascript\s*:/gi, ''); }
// 8. Undo for anything brought in: keep a copy of everything from just before (for 7 days).
function intakeSnap(label) { try { localStorage.setItem(KEY + '.beforeIntake', JSON.stringify({ d: new Date().toISOString(), label: String(label || 'that').slice(0, 120), db })); return true; } catch (e) { return false; } }
function intakeLast() { try { const o = JSON.parse(localStorage.getItem(KEY + '.beforeIntake') || 'null'); return o && o.db && Date.now() - new Date(o.d) < 7 * 864e5 ? o : null; } catch (e) { return null; } }
function intakeUndo() { const o = intakeLast(); if (!o) return false; db = cleanBackup(o.db); syncMyTopics(db.myTopics); save(); try { localStorage.removeItem(KEY + '.beforeIntake'); } catch (e) { } return o.label; }
Object.assign(act, {
  intakeundo: () => { const l = intakeUndo(); if (!l) return; ui.lec = null; try { lecPaint(); } catch (e) { } ui.note = 'Took out ' + l + ' again.'; toast('Undone. Took out ' + l + '.'); render(); }
});
