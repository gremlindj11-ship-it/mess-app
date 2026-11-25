// Consensus: a claim is agreed only when every checker confirms it and enough different models checked it.
const { execFileSync } = require('node:child_process');
const { mkdtempSync, writeFileSync, readFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os'); const { join } = require('node:path');
const d = mkdtempSync(join(tmpdir(), 'mess-cons-'));
try {
  const H = 'row,verdict,population,trigger,action,strength,numbers,alternatives,exceptions,safety,notes\n', ok = ',confirmed,yes,yes,yes,yes,yes,n.a.,n.a.,yes,fine\n';
  writeFileSync(join(d, 'claims.csv'), 'topic,subject\nA,one\nA,two\nA,three\nA,four\n');
  writeFileSync(join(d, 'factcheck.gpt.csv'), H + '2' + ok + '3' + ok + '4' + ok + '5' + ok);
  writeFileSync(join(d, 'factcheck.claude.csv'), H + '2' + ok + '3,disputed,yes,yes,yes,yes,yes,no,yes,yes,drops the second branch\n' + '4,confirmed,no,yes,yes,yes,yes,yes,yes,yes,scope missing\n');
  const o = execFileSync(process.execPath, ['tools/consensus.mjs', d], { encoding: 'utf8' }), c = readFileSync(join(d, 'consensus.csv'), 'utf8').split('\n');
  const st = (n) => c.find(l => l.startsWith(n + ',')).split(',')[1], bad = [];
  if (st(2) !== 'agreed') bad.push('both confirm → agreed');
  if (st(3) !== 'unresolved') bad.push('one disputes → unresolved');
  if (st(4) !== 'unresolved') bad.push('confirmed with a failed check → unresolved');
  if (st(5) !== 'unresolved') bad.push('only one checker → unresolved');
  if (!/1 agreed/.test(o) || !/3 unresolved/.test(o)) bad.push('summary counts');
  if (bad.length) { console.log('Error: ' + bad.join('; ')); process.exitCode = 1; } else console.log('Consensus works: agreed only when every checker confirms');
} finally { rmSync(d, { recursive: true, force: true }); }
