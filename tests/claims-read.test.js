// A by-hand claims check (a model with no key here, such as ChatGPT or Codex): planted faults are mixed in, and the check is only saved if every one was caught.
// No network and no key.
const { spawnSync } = require('node:child_process');
const { mkdtempSync, rmSync, readFileSync, writeFileSync, existsSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');

const dir = mkdtempSync(join(tmpdir(), 'mess-claims-read-')), pk = join(dir, 'packet.json'), an = join(dir, 'answers.json'), out = join(dir, 'factcheck.gpt.csv');
const env = { ...process.env }; for (const k of ['GEMINI_API_KEY', 'GROQ_API_KEY', 'ANTHROPIC_API_KEY']) delete env[k];
const run = (...a) => spawnSync(process.execPath, ['tools/ai-factcheck.mjs', dir, '--packet', pk, ...a], { cwd: process.cwd(), encoding: 'utf8', env });
const COLS = ['population', 'trigger', 'action', 'strength', 'numbers', 'alternatives', 'exceptions', 'safety'];
const line = (row, ok) => ({ row, verdict: ok ? 'confirmed' : 'disputed', ...Object.fromEntries(COLS.map(c => [c, ok || c !== 'strength' ? 'yes' : 'no'])), notes: 'Test row ' + row + '.' });
const record = (t) => writeFileSync(join(dir, 'extraction-record.md'), t);
try {
  const N = 20, claim = (n) => `In adults with condition ${n}, treatment ${n}`;
  writeFileSync(join(dir, 'claims.csv'), '"subject","relation","object","source_quote"\n' + Array.from({ length: N }, (_, i) => `"${claim(i + 1)}","should be offered","for ${i + 30} days","Offer treatment ${i + 1} for ${i + 30} days to adults with condition ${i + 1}."`).join('\n') + '\n');
  record('# Record\nWriter: Codex.\n'); let r = run('--name', 'gpt'); if (r.status !== 1 || !r.stdout.includes("can't check them")) throw new Error('GPT was given claims Codex wrote: ' + r.stdout + r.stderr);
  rmSync(join(dir, 'extraction-record.md')); r = run('--name', 'gpt'); if (r.status !== 1 || !r.stdout.includes("doesn't say who wrote")) throw new Error('claims with no recorded writer were handed out: ' + r.stdout + r.stderr);
  record('# Record\nWriter: Claude.\n'); r = run(); if (r.status !== 1 || !r.stdout.includes('say who is reading')) throw new Error('a claims packet was made for nobody: ' + r.stdout + r.stderr);
  record('# Record\nWriter: Claude.\n\n## Rows rewritten by gpt\n4-5\n'); r = run('--name', 'gpt'); if (r.status !== 0) throw new Error('no packet was made: ' + r.stdout + r.stderr);
  const p = JSON.parse(readFileSync(pk, 'utf8')), real = new Set(Array.from({ length: N }, (_, i) => `${claim(i + 1)} should be offered for ${i + 30} days`)), plants = p.items.filter(x => !real.has(x.claim));
  if (plants.length < 3 || plants.length !== p.planted) throw new Error('the packet should hold at least 3 planted faults: ' + plants.length);
  if (p.items.length !== N - 2 + plants.length || p.items.some(x => /condition (3|4),/.test(x.claim))) throw new Error('rows the reader rewrote should be left out of its packet');
  if (p.items.some(x => 'planted' in x) || !p.instructions || !/population/.test(p.answer_format)) throw new Error('the packet is marked, or lacks its instructions');

  writeFileSync(an, JSON.stringify(p.items.map(x => line(x.row, true)))); r = run('--answers', an, '--name', 'gpt');
  if (r.status !== 1 || !r.stdout.includes('planted wrong claims') || existsSync(out)) throw new Error('a check that confirmed everything was saved: ' + r.stdout + r.stderr);
  writeFileSync(out, 'row,verdict,population,trigger,action,strength,numbers,alternatives,exceptions,safety,notes\n99,"confirmed","yes","yes","yes","yes","yes","yes","yes","yes","Old line past the end."\n2,"disputed","yes","yes","yes","no","yes","yes","yes","yes","Old verdict."\n');
  writeFileSync(an, JSON.stringify(p.items.map(x => line(x.row, real.has(x.claim))))); r = run('--answers', an, '--name', 'gpt'); if (r.status !== 0) throw new Error('a good check was not saved: ' + r.stdout + r.stderr);
  const lines = readFileSync(out, 'utf8').trim().split('\n'), rows = lines.slice(1).map(l => Number(l.split(',')[0]));
  if (rows.length !== N - 2 || rows.includes(4) || rows.includes(5) || rows.includes(99) || rows[0] !== 2 || !lines[1].includes('"confirmed"')) throw new Error('the saved check should hold the 18 rows read, under their real row numbers, replacing old verdicts: ' + rows.join(' '));
  r = spawnSync(process.execPath, ['tools/check-factcheck.mjs', out], { cwd: process.cwd(), encoding: 'utf8' }); if (r.status !== 0) throw new Error('the saved check does not pass check-factcheck: ' + r.stdout + r.stderr);
  console.log('by-hand claims check passed');
} finally { rmSync(dir, { recursive: true, force: true }); }
