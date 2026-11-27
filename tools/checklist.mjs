// The checklist rule (content/README.md, "Writing from open sources", step 2; Sofia, 25 Nov 2026).
// Every topic's coverage.csv has four extra groups beside its own: Confused with, Often missed and Why (two to four
// items each), and Elsewhere in the world (one to three). One place for the rule, so every tool reads it the same way.
export const GROUPS = [
  { name: 'Confused with', min: 2, max: 4 },
  { name: 'Often missed', min: 2, max: 4 },
  { name: 'Why', min: 2, max: 4 },
  { name: 'Elsewhere in the world', min: 1, max: 3 },
];

// items: the rows of coverage.csv as objects with a "group" field. Returns a list of problems; empty means it passes.
export function checklistProblems(items) {
  const count = {}, out = [];
  for (const it of items) { const g = String(it.group || '').trim().toLowerCase(); count[g] = (count[g] || 0) + 1; }
  for (const { name, min, max } of GROUPS) {
    const n = count[name.toLowerCase()] || 0;
    if (!n) out.push(`no "${name}" group (needs ${min} to ${max} items)`);
    else if (n < min || n > max) out.push(`"${name}" has ${n} item${n === 1 ? '' : 's'} (needs ${min} to ${max})`);
  }
  return out;
}
