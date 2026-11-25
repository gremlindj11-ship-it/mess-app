// Run every Mess test: node tests/run.mjs
//   --quiet       no line for a passing test, just the count; each failure gets its problem lines and the path of its full log
//   --only name   run only the tests whose file name contains "name" (for example --only story)
// Needs Node and Playwright (npm i playwright, then npx playwright install chromium).
// Starts a small local server for app/, copies the test files somewhere temporary,
// runs each *.test.js and says plainly what passed and what didn't.
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, cpSync, readdirSync, writeFileSync, readFileSync, statSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url)), app = join(here, '..', 'app');
const port = 8800 + Math.floor(Math.random() * 90), url = `http://localhost:${port}`;
const NOAPP = !existsSync(join(app, 'index.html')); // the public copy has no app, so only the tool tests run there
const server = NOAPP ? { kill() {} } : spawn('node', [join(here, 'serve.mjs'), app, String(port)], { stdio: 'ignore' });
await new Promise(r => setTimeout(r, 900));
const work = mkdtempSync(join(tmpdir(), 'mess-tests-'));
if (existsSync(join(here, 'fixtures'))) cpSync(join(here, 'fixtures'), work, { recursive: true });

// What counts as a failure in a test's output (missing files are expected: the OSCEBlitz pack isn't in the repo).
// "ERRS [" with anything in it fails. A long list is printed by Node over several lines, starting with a bare
// "ERRS [", which the old pattern (ERRS [ ') let through as a pass.
const bad = (out) => out.split('\n').filter(l => !/ 404 /.test(l)).filter(l =>
  /XSS ran|ERRS \[(?!\])|Error:|TimeoutError|HORIZONTAL|console: |^(desk|phone): /.test(l) || /^(Today|Practice|Gaps|Topics|Placement|Links|Profile) (?!390)\d+/.test(l));

const args = process.argv.slice(2), QUIET = args.includes('--quiet'), only = args.includes('--only') ? args[args.indexOf('--only') + 1] : '';
// The public copy (mess-app) has an empty app/assets/frozen.js. Tests marked PRIVATE-ONLY on their first line need
// what that file holds, so they are skipped there and counted out loud, never passed quietly.
const PUBLIC = NOAPP || statSync(join(app, 'assets/frozen.js')).size < 2000, skippedList = [];
let failed = 0, passed = 0;
for (const f of readdirSync(here).filter(f => f.endsWith('.test.js') && (!only || f.includes(only))).sort()) {
  if (PUBLIC && readFileSync(join(here, f), 'utf8').startsWith('// PRIVATE-ONLY')) { skippedList.push(f); continue; }
  const r = spawnSync('node', [join(here, f), work], { env: { ...process.env, MESS_URL: url }, encoding: 'utf8', timeout: 180000 });
  const out = (r.stdout || '') + (r.stderr || ''), problems = bad(out);
  if (r.status !== 0 || problems.length) { failed++; const log = join(work, f.replace(/\.js$/, '.log')); writeFileSync(log, out);
    const lines = problems.length ? problems : out.split('\n').slice(-6); console.log(`✗ ${f}\n  ${lines.slice(0, QUIET ? 15 : lines.length).join('\n  ')}${QUIET ? `\n  full output: ${log}` : ''}`); }
  else { passed++; if (!QUIET) console.log(`✓ ${f}`); }
}
server.kill();
if (skippedList.length) console.log(`\n${skippedList.length} not run here (they need content only the private repo has): ${skippedList.join(', ')}`);
console.log(failed ? `\n${passed} passed, ${failed} failed. Screenshots, files and logs are in ${work}` : `\nAll ${passed} passed.`);
process.exit(failed ? 1 : 0);
