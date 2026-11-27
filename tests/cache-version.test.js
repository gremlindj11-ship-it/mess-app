// The offline cache name changes whenever anything under app/ changes, so phones that already have Mess get the new
// files. Since 27 Nov 2026 nobody bumps it by hand: Cloudflare's build runs tools/stamp-cache.mjs, which writes a name
// made from the contents of app/ onto line 1 of app/sw.js. Checked without a browser:
//   1. The stamp changes when any file under app/ changes (added, edited, deleted, renamed), and not otherwise.
//   2. In the repo, line 1 of app/sw.js is the placeholder const C='mess-dev'; (a stamped line must not be committed),
//      and wrangler.jsonc runs the stamp at build time; the stamp stops the build if line 1 is not a cache name.
//   3. This branch's stamp differs from main's whenever app/ differs from main.
//   4. app/404.html is an exact copy of app/index.html (it is what opens Mess at addresses like /app/topic-copd).
const { spawnSync } = require('node:child_process'), fs = require('node:fs'), os = require('node:os'), { join } = require('node:path');
const root = join(__dirname, '..'), errs = [], made = [];
const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^GIT_/.test(k)));
const git = (cwd, ...a) => { const r = spawnSync('git', a, { cwd, encoding: 'buffer', env, maxBuffer: 1 << 28 }); return r.status === 0 ? r.stdout : null; };
(async () => {
  if (!fs.existsSync(join(root, 'app', 'index.html'))) { console.log('note: no app here (the public copy), nothing to check'); console.log('ERRS', []); return; }
  const T = await import(join(root, 'tools', 'stamp-cache.mjs'));
  const B = (s) => Buffer.from(s);
  // 1. On made-up trees.
  const base = [['index.html', B('<p>Mess</p>')], ['404.html', B('<p>Mess</p>')], ['sw.js', B("const C='mess-dev';const F=['./'];\n")], ['js/a.js', B('let a=1;')]];
  const s0 = T.stampOf(base), with_ = (f) => T.stampOf(f(base.map(x => [...x])));
  if (!/^mess-[0-9a-f]{12}$/.test(s0)) errs.push('the stamp is not mess- and 12 hex digits: ' + s0);
  if (with_(f => f) !== s0) errs.push('the same files gave a different stamp');
  if (with_(f => f.reverse()) !== s0) errs.push('the order files are read in changed the stamp');
  if (with_(f => (f[3][1] = B('let a=2;'), f)) === s0) errs.push('an edited file did not change the stamp');
  if (with_(f => [...f, ['js/new.js', B('')]]) === s0) errs.push('a new (even empty) file did not change the stamp');
  if (with_(f => f.slice(0, 3)) === s0) errs.push('a deleted file did not change the stamp');
  if (with_(f => (f[3][0] = 'js/z.js', f)) === s0) errs.push('a renamed file did not change the stamp');
  if (with_(f => (f[2][1] = B("const C='mess-0123456789ab';const F=['./'];\n"), f)) !== s0) errs.push('stamping line 1 changed the stamp itself');
  if (with_(f => (f[2][1] = B("const C='mess-dev';const F=['./','x'];\n"), f)) === s0) errs.push('a change to the rest of sw.js did not change the stamp');
  // The command on a copy: it stamps the placeholder, and refuses a line that is already stamped.
  const d = fs.mkdtempSync(join(os.tmpdir(), 'mess-stamp-')); made.push(d);
  fs.mkdirSync(join(d, 'tools')); fs.copyFileSync(join(root, 'tools/stamp-cache.mjs'), join(d, 'tools/stamp-cache.mjs'));
  fs.mkdirSync(join(d, 'app')); for (const [p, b] of base) { fs.mkdirSync(join(d, 'app', p, '..'), { recursive: true }); fs.writeFileSync(join(d, 'app', p), b); }
  const run = () => spawnSync(process.execPath, ['tools/stamp-cache.mjs'], { cwd: d, encoding: 'utf8' });
  let r = run(); const line = fs.readFileSync(join(d, 'app/sw.js'), 'utf8').split('\n')[0];
  if (r.status !== 0 || line !== `const C='${s0}';const F=['./'];`) errs.push('the build did not stamp line 1: ' + (r.stdout + r.stderr).trim());
  r = run(); if (r.status !== 0 || fs.readFileSync(join(d, 'app/sw.js'), 'utf8').split('\n')[0] !== line) errs.push('running the stamp again should give the same line');
  fs.writeFileSync(join(d, 'app/sw.js'), "const C = 'mess-v9';\n"); if (run().status === 0) errs.push('the stamp ran on line 1 in another shape (it must stop the build)');

  // 2. The repo as committed.
  const sw = fs.readFileSync(join(root, 'app/sw.js'), 'utf8');
  if (!sw.startsWith(T.PLACEHOLDER)) errs.push(`line 1 of app/sw.js must start with ${T.PLACEHOLDER} (the stamp is written only at build time; was a stamped line committed?)`);
  const wr = fs.readFileSync(join(root, 'wrangler.jsonc'), 'utf8').replace(/^\s*\/\/.*$/gm, '');
  let build = ''; try { build = (JSON.parse(wr).build || {}).command || ''; } catch { errs.push('wrangler.jsonc does not parse'); }
  if (!/^node tools\/stamp-cache\.mjs$/.test(build)) errs.push('wrangler.jsonc must run "node tools/stamp-cache.mjs" as its build command, got: ' + JSON.stringify(build));

  // 3. Against main: if app/ differs, the stamp differs.
  const baseRef = process.env.MESS_BASE || 'origin/main';
  const list = git(root, 'ls-tree', '-r', '--name-only', baseRef, '--', 'app');
  if (list === null) { const why = `no ${baseRef} to compare with, so the stamp was not compared`; if (process.env.CI) errs.push(why); else console.log('note: ' + why); }
  else {
    const mainFiles = list.toString().split('\n').filter(Boolean).map(p => [p.slice(4), git(root, 'show', `${baseRef}:${p}`)]);
    const here = T.appFiles(join(root, 'app')), mainStamp = T.stampOf(mainFiles), hereStamp = T.stampOf(here);
    const key = (fs_) => fs_.map(([p, b]) => p + ':' + (p === 'sw.js' ? b.toString().replace(/^const C='mess-[^']*';/, '') : b.toString('base64'))).sort().join('|');
    // The stamp reads every file git tracks under app/ (none skipped).
    const tracked = (git(root, 'ls-files', '--', 'app') || Buffer.from('')).toString().split('\n').filter(Boolean).map(p => p.slice(4)), seen = new Set(here.map(f => f[0]));
    const missed = tracked.filter(p => !seen.has(p)); if (missed.length) errs.push('the stamp skips tracked files: ' + missed.slice(0, 5).join(', '));
    const differs = key(mainFiles) !== key(here);
    if (differs && mainStamp === hereStamp) errs.push('app/ differs from main but the cache name would not change');
    if (!differs && mainStamp !== hereStamp) errs.push('app/ is the same as main but the cache name would change');
  }

  // 4.
  if (!fs.existsSync(join(root, 'app/404.html'))) errs.push('app/404.html is missing: copy app/index.html over it');
  else if (!fs.readFileSync(join(root, 'app/index.html')).equals(fs.readFileSync(join(root, 'app/404.html')))) errs.push('app/404.html differs from app/index.html: copy index.html over 404.html');
  for (const d of made) fs.rmSync(d, { recursive: true, force: true });
  console.log('ERRS', errs);
})();
