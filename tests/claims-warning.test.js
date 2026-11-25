const { execFileSync } = require('node:child_process');
const { mkdtempSync, rmSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');

const dir = mkdtempSync(join(tmpdir(), 'mess-claims-'));
const file = join(dir, 'claims.csv');
const quote = Array.from({ length: 261 }, (_, i) => 'word' + i).join(' ');
const header = ['topic', 'step', 'subject', 'relation', 'object', 'how_often_or_sure', 'condition_or_population', 'numbers', 'level', 'source', 'source_url', 'source_quote', 'checked_on', 'jurisdiction', 'status'];
const row = ['COPD', 'management', 'A treatment', 'is used for', 'a condition', 'should', 'People with COPD', '', 'core', 'NICE NG115', 'https://www.nice.org.uk/guidance/ng115', quote, '2026-11-12', 'UK', 'draft'];
const csv = (values) => values.map(x => `"${String(x).replace(/"/g, '""')}"`).join(',');
try {
  writeFileSync(file, csv(header) + '\n' + csv(row) + '\n');
  const output = execFileSync(process.execPath, ['tools/check-claims.mjs', file], { cwd: process.cwd(), encoding: 'utf8' });
  if (!output.includes('quote the recommendation that carries the fact')) throw new Error('long source_quote warning was not reported');
  console.log('Long source_quote warning passed');
  // Strength: "should be considered" in the quote must not become "can be considered" in the claim.
  const run = (r) => { writeFileSync(file, csv(header) + '\n' + csv(r) + '\n'); return execFileSync(process.execPath, ['tools/check-claims.mjs', file], { cwd: process.cwd(), encoding: 'utf8' }); };
  const weak = [...row]; weak[2] = 'In people with COPD, a treatment'; weak[3] = 'can be considered for'; weak[4] = 'a second episode'; weak[11] = 'A treatment should be considered for people with COPD after a second episode.';
  if (!run(weak).includes('strength: the quote says "should be considered"')) throw new Error('weakened strength was not reported');
  const same = [...weak]; same[3] = 'should be considered for';
  if (run(same).includes('strength:')) throw new Error('matching strength was reported as a problem');
  const nice = [...weak]; nice[11] = 'Consider a treatment for people with COPD after a second episode.';
  if (run(nice).includes('strength:')) throw new Error('"Consider" to "can be considered" is the agreed mapping and must not be reported');
  console.log('Strength warning passed');
} finally {
  rmSync(dir, { recursive: true, force: true });
}
