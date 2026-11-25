// A model never checks its own writing: the Claude checker refuses claims Claude wrote and skips rows Claude rewrote.
// No network: every case here stops before any request is sent.
const { spawnSync } = require('node:child_process');
const { mkdtempSync, rmSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');

const dir = mkdtempSync(join(tmpdir(), 'mess-writer-'));
const run = (record, rows) => { if (record === null) rmSync(join(dir, 'extraction-record.md'), { force: true }); else writeFileSync(join(dir, 'extraction-record.md'), record);
  return spawnSync(process.execPath, ['tools/ai-factcheck.mjs', dir, '--provider', 'claude', ...(rows ? ['--rows', rows] : [])], { cwd: process.cwd(), encoding: 'utf8', env: { ...process.env, ANTHROPIC_API_KEY: 'test-not-a-key' } }); };
try {
  writeFileSync(join(dir, 'claims.csv'), '"subject","relation","object","source_quote"\n' + [1, 2, 3].map(n => `"In adults, treatment ${n}","should be","offered","Offer treatment ${n} to adults."`).join('\n') + '\n');
  let r = run('# Record\nWriter: Claude, 16 November 2026.\n');
  if (r.status !== 1 || !r.stdout.includes("Claude wrote these claims")) throw new Error('Claude was allowed to check claims Claude wrote: ' + r.stdout + r.stderr);
  r = run(null);
  if (r.status !== 1 || !r.stdout.includes("doesn't say who wrote")) throw new Error('Claude was allowed to check claims with no recorded writer: ' + r.stdout + r.stderr);
  r = run('# Record\nWriter: Codex.\n\n## Rows rewritten by claude\n2-3, 4\n', '2-4');
  if (r.status !== 0 || !r.stdout.includes('Skipping rows Claude rewrote: 2, 3, 4') || !r.stdout.includes('nothing for Claude to check')) throw new Error('rows Claude rewrote were not skipped: ' + r.stdout + r.stderr);
  console.log('Claude checker writer guard passed');
} finally { rmSync(dir, { recursive: true, force: true }); }
