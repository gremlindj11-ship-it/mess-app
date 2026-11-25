// Meaning check: did a rewrite keep the meaning? The cheap, certain half of the check.
// It pulls out the parts of a sentence where meaning hides and a rewrite most often breaks it:
// numbers and units, negatives, how-often and how-sure words, comparisons, the conditions and
// drugs named, and the source tag. Then it lists anything lost or added.
// (The other half, an AI from a different model re-reading the claim, catches paraphrase it can't.)
//
// Run:  node tools/meaning.mjs "original sentence" "rewritten sentence"
//   or: node tools/meaning.mjs pairs.json      (a list of [original, rewrite] pairs)
// Exit code 1 if any pair changed meaning, so agents and scripts can stop on it.
import { readFileSync, existsSync } from 'node:fs';

// Every topic and drug name Mess knows, so "COPD" turning into "asthma" is caught.
const topicsSrc = readFileSync(new URL('../app/assets/topics.js', import.meta.url), 'utf8').split('`');
const NAMES = [...topicsSrc[1].trim().split('\n'), ...topicsSrc[3].trim().split('\n')].flatMap(l => { const [n, al] = l.split('|'); return [n, ...(al || '').split(',')]; }).map(s => s.trim()).filter(s => s.length > 2);

// Words that carry meaning on their own. Losing or swapping one changes the claim.
const HEDGES = {
  all: /\b(always|all|every|invariably)\b/i, most: /\b(most|mostly|usually|mainly|main|majority|typically|commonly|often|most often|predominantly|main cause)\b/i,
  some: /\b(some|sometimes|occasionally|can|may|might|possible|possibly)\b/i, few: /\b(rarely|rare|uncommon|seldom|few)\b/i,
  none: /\b(never|none|no one)\b/i, only: /\b(only|solely|exclusively)\b/i,
  must: /\b(must|should|always give|required|offer)\b/i, avoid: /\b(avoid|contraindicated|should not|(do not|don't) (give|use|offer|prescribe|start)|not be (given|used))\b/i,
  cause: /\b(because|causes?|caused by|due to|leads? to|results? in|drives?|so that|therefore|which is why)\b/i
};
const NEG = /\b(not|no|never|without|absent|cannot|can't|doesn't|does not|isn't|is not|don't|won't|fails? to|excludes?)\b/gi;
const COMPARE = /\b(more|less|higher|lower|greater|fewer|above|below|over|under|at least|at most|exceeds?|before|after|first-line|second-line)\b|[<>≤≥]/gi;
const NUM = /(\d+(?:[.,]\d+)?)\s*(%|kpa|mmhg|mmol\/l|mg|g|mcg|micrograms?|ml|l|kg|units?|days?|weeks?|months?|years?|hours?|minutes?|times?)?/gi;

function parts(text) {
  const t = String(text || ''), low = t.toLowerCase();
  const nums = [...t.matchAll(NUM)].map(m => (m[1].replace(',', '.') + (m[2] ? ' ' + m[2].toLowerCase().replace(/s$/, '') : ''))).filter(x => !/^0?\.?$/.test(x));
  const hedges = Object.keys(HEDGES).filter(k => HEDGES[k].test(t));
  const negs = (t.match(NEG) || []).length;
  const compare = [...new Set((t.match(COMPARE) || []).map(x => x.toLowerCase().replace(/^(over|above|exceeds?)$/, '>').replace(/^(under|below)$/, '<')))];
  const names = [...new Set(NAMES.filter(n => new RegExp('(^|[^a-z0-9])' + n.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![a-z0-9])').test(low)).map(n => n.toLowerCase()))];
  const source = (t.match(/\[([^\]]+)\]\s*$/) || [])[1] || '';
  return { nums, hedges, negs, compare, names, source };
}
const diff = (a, b) => ({ lost: a.filter(x => !b.includes(x)), added: b.filter(x => !a.includes(x)) });
export function meaningCheck(before, after) {
  const A = parts(before), B = parts(after), out = [];
  const n = diff(A.nums, B.nums); if (n.lost.length || n.added.length) out.push(`numbers changed: ${n.lost.join(', ') || '-'} → ${n.added.join(', ') || '-'}`);
  const h = diff(A.hedges, B.hedges); if (h.lost.length || h.added.length) out.push(`how often / how sure changed: lost [${h.lost.join(', ')}], added [${h.added.join(', ')}]`);
  if ((A.negs > 0) !== (B.negs > 0) || Math.abs(A.negs - B.negs) > 1) out.push(`negatives changed: ${A.negs} → ${B.negs}`);
  const c = diff(A.compare, B.compare); if (c.lost.length || c.added.length) out.push(`comparison changed: lost [${c.lost.join(', ')}], added [${c.added.join(', ')}]`);
  const m = diff(A.names, B.names); if (m.lost.length) out.push(`condition or drug dropped: ${m.lost.join(', ')}`); if (m.added.length) out.push(`condition or drug added: ${m.added.join(', ')}`);
  if (A.source && A.source !== B.source) out.push(`source changed: ${A.source} → ${B.source || 'none'}`);
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [x, y] = process.argv.slice(2);
  const pairs = y !== undefined ? [[x, y]] : existsSync(x || '') ? JSON.parse(readFileSync(x, 'utf8')) : null;
  if (!pairs) { console.log('Usage: node tools/meaning.mjs "original" "rewrite"   or   node tools/meaning.mjs pairs.json'); process.exit(2); }
  let bad = 0;
  pairs.forEach(([a, b], i) => { const r = meaningCheck(a, b); if (r.length) { bad++; console.log(`✗ ${i + 1}. ${b}\n   was: ${a}\n   ${r.join('\n   ')}`); } else console.log(`✓ ${i + 1}. ${b}`); });
  console.log(bad ? `\n${bad} of ${pairs.length} changed meaning. Fix the wording, or check the change is deliberate and sourced.` : `\nAll ${pairs.length} kept their meaning.`);
  process.exit(bad ? 1 : 0);
}
