// tools/check-links.mjs: an area's links.csv passes only with the right columns, known types and statuses, row
// references that point at real claims, and both sides filled for a pair marked "backed". Uses a made-up folder.
const { spawnSync } = require('node:child_process');
const { mkdtempSync, mkdirSync, rmSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');

const dir = mkdtempSync(join(tmpdir(), 'mess-links-')), r = {};
const HEAD = 'from,to,type,why_it_helps,from_rows,to_rows,status';
const run = (body, head = HEAD) => { const f = join(dir, 'links.csv'); writeFileSync(f, head + '\n' + body + '\n'); const p = spawnSync(process.execPath, ['tools/check-links.mjs', f], { encoding: 'utf8' }); return { code: p.status, out: p.stdout + p.stderr }; };
try {
  for (const [c, n] of [['alpha', 4], ['beta', 3]]) { mkdirSync(join(dir, c)); writeFileSync(join(dir, c, 'claims.csv'), 'topic,subject\n' + Array.from({ length: n - 1 }, (_, i) => `X,"fact ${i}, with a comma"`).join('\n') + '\n'); }
  const good = 'Alpha,Beta,mimic,Both look alike,alpha r2;alpha r4,beta r3,backed\nAlpha,Beta,trap,Same picture,,,needs claim';
  r['good file passes'] = run(good).code === 0;
  r['1 columns out of order'] = /columns should be/.test(run(good, 'to,from,type,why_it_helps,from_rows,to_rows,status').out) && run(good, 'from,to,type').code === 1;
  r['2 unknown type'] = /type "lookalike"/.test(run('Alpha,Beta,lookalike,x,alpha r2,beta r2,backed').out);
  r['3a no such folder'] = /no gamma\/claims.csv/.test(run('Alpha,Beta,mimic,x,gamma r2,beta r2,backed').out);
  r['3b line past the end'] = /rows 2 to 3/.test(run('Alpha,Beta,mimic,x,alpha r2,beta r9,backed').out);
  r['3c header line'] = /rows 2 to 4/.test(run('Alpha,Beta,mimic,x,alpha r1,beta r2,backed').out);
  r['3d badly written reference'] = /should look like/.test(run('Alpha,Beta,mimic,x,alpha 12,beta r2,backed').out);
  r['4 backed with one side empty'] = /to_rows is empty/.test(run('Alpha,Beta,mimic,x,alpha r2,,backed').out);
  r['5 unknown status'] = /status "done"/.test(run('Alpha,Beta,mimic,x,alpha r2,beta r2,done').out);
  r['fails exit 1'] = run('Alpha,Beta,mimic,x,alpha r2,,backed').code === 1;
  r['quoted commas counted as one row'] = run('Alpha,Beta,mimic,x,alpha r4,beta r3,backed').code === 0;
} finally { rmSync(dir, { recursive: true, force: true }); }
console.log(Object.entries(r).map(([k, v]) => k + ': ' + v).join(' | '));
if (Object.values(r).some(v => !v)) { console.log('Error: check-links failed'); process.exit(1); }
