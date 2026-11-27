// Mess · openmark.js · remembers which stories were loaded before app/assets/frozen.js ran, and exactly what they said.
// index.html loads this between assets/stories.js and assets/frozen.js. The frozen stories (written from NICE, BTS,
// SIGN and GOLD before those were stopped) add themselves to STORIES afterwards, so they are never in this list.
// pageBundle() in story.js uses it: only a story listed here, and still word for word what it was here, can be handed
// to an AI. A copy of the text is kept (not the object), so a story changed in place later no longer matches.
const OPEN_AT_LOAD = new Map(Object.entries(typeof STORIES === 'object' && STORIES ? STORIES : {}).map(([n, s]) => { try { return [n, JSON.stringify(s)]; } catch (e) { return [n, null]; } }));

// ---------- Fingerprints of Mess's old notes (app/assets/frozen-marks.js, built by tools/frozen-marks.mjs)
// The old notes, stories, evidence and packs were taken offline on 26 Nov 2026, so the app no longer has their text to
// compare against. A student may still have a line copied from them in their own notes (the editor started from Mess's
// lines, and "Go deeper" and "Your version" copied them). frozenCopy(text) says whether a piece of text holds such a
// line, using hashes only: a whole line or sentence of 6+ words, or 2 different runs of 5 words in a row (the rule
// MAP.md gives). norm and hash must stay exactly as in tools/frozen-marks.mjs; tests/frozen-marks-gate.test.js pins them.
// If the fingerprints did not load, it says yes to everything: nothing from the student's notes goes to an AI.
const FM_GREEK = { 'α': 'alpha', 'β': 'beta', 'γ': 'gamma', 'δ': 'delta', 'ε': 'epsilon', 'κ': 'kappa', 'λ': 'lambda', 'μ': 'mu', 'µ': 'mu', 'π': 'pi', 'σ': 'sigma', 'τ': 'tau', 'ω': 'omega', 'ß': 'ss', 'æ': 'ae', 'œ': 'oe', 'ø': 'o', 'ł': 'l', 'đ': 'd', 'þ': 'th' };
const fmNorm = (s) => String(s || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[\u00ad\u200b-\u200d\u2060\ufeff]/g, '')
  .toLowerCase().replace(/[αβγδεκλμµπστωßæœøłđþ]/g, c => FM_GREEK[c]).replace(/[^a-z0-9]+/g, ' ').trim();
const fmHash = (s) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193); return (h >>> 0).toString(16).padStart(8, '0'); };
const fmIn = (all, h) => { let lo = 0, hi = all.length / 8 - 1; while (lo <= hi) { const mid = (lo + hi) >> 1, x = all.slice(mid * 8, mid * 8 + 8); if (x === h) return true; if (x < h) lo = mid + 1; else hi = mid - 1; } return false; };
// The file must be exactly what the tool writes: whole 8-digit lowercase hex records, and a whole-number minLine. A
// damaged or hand-edited file would otherwise miss every lookup and let everything through. Checked once per file.
// Also sorted and unique (the lookup is a binary search), and minLine at most 6 (the tool writes 6; a bigger one would
// switch the line check off). Re-checked whenever any of the values changes, not just when the object does.
let fmKey = [], fmOk = false;
const fmSorted = (s) => { for (let i = 8; i < s.length; i += 8) if (s.slice(i - 8, i) >= s.slice(i, i + 8)) return false; return true; };
function fmValid(M) {
  if (!M || typeof M !== 'object') return false;
  const key = [M, M.v, M.run, M.minLine, M.lines, M.runs]; if (key.every((x, i) => x === fmKey[i])) return fmOk;
  fmOk = false; fmKey = key;
  fmOk = M.v === 2 && M.run === 5 && Number.isInteger(M.minLine) && M.minLine >= 1 && M.minLine <= 6 && typeof M.lines === 'string' && typeof M.runs === 'string' && M.lines.length > 0 && M.runs.length > 0 && M.lines.length % 8 === 0 && M.runs.length % 8 === 0 && /^[0-9a-f]*$/.test(M.lines) && /^[0-9a-f]*$/.test(M.runs) && fmSorted(M.lines) && fmSorted(M.runs);
  return fmOk;
}
function frozenCopy(text) {
  try {
    const M = typeof self === 'object' && self.MESS_FROZEN_MARKS;
    if (!fmValid(M)) return true; // fail closed
    const minLine = M.minLine, run = M.run, lines = M.lines, runs = M.runs; // read once, so a change mid-call can't slip past
    const raw = String(text || ''), n = fmNorm(raw); if (!n) return false;
    // The whole text, each line of it (a heading above a copied sentence), and each sentence of each line.
    const pieces = [raw, ...raw.split(/[\r\n\u0085\u2028\u2029]+/)].flatMap(x => [x, ...x.split(/(?<=[.;:!?])\s+/)]);
    for (const l of new Set(pieces.map(fmNorm))) if (l.split(' ').length >= minLine && fmIn(lines, fmHash(l))) return true;
    const w = n.split(' '), hit = new Set();
    for (let i = 0; i + run <= w.length; i++) { const h = fmHash(w.slice(i, i + run).join(' ')); if (fmIn(runs, h)) { hit.add(h); if (hit.size >= 2) return true; } }
    return false;
  } catch (e) { return true; }
}
