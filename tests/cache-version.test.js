// Two rules every change under app/ must keep, checked without a browser:
//   1. If anything under app/ differs from main, the cache version on line 1 of app/sw.js must be higher than main's.
//      Otherwise phones that already have Mess keep the old files.
//   2. app/404.html is an exact copy of app/index.html (it is what opens Mess at addresses like /app/topic-copd).
// "Differs from main" means: changed since this branch left origin/main, committed or not, new files included.
// The version is compared with origin/main as it is now, so two branches that both took the same number can't both pass.
// The rules are first proved on small made-up repos (a check that can't fail is no check), then run on this repo.
const { spawnSync } = require('node:child_process'), fs = require('node:fs'), os = require('node:os'), { join } = require('node:path');

// Git is always told which folder to work in by cwd alone: a GIT_DIR left in the environment (a hook sets one) would
// otherwise point every command here, the made-up repos included, at the real repo.
const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^GIT_/.test(k)));
const git = (root, ...a) => { const r = spawnSync('git', a, { cwd: root, encoding: 'utf8', env }); return r.status === 0 ? r.stdout.trim() : null; };
const version = (text) => { const m = /^const C='mess-v(\d+)';/.exec(String(text || '').split('\n')[0]); return m ? Number(m[1]) : null; };

// Returns { errs: [...], note: '' }. base is the branch to compare with. Where the comparison can't be made it says so in
// note and passes, except on CI (strict), where a check that did not run is a failure.
function check(root, base = 'origin/main', strict = false) {
  const errs = [], app = join(root, 'app');
  if (!fs.existsSync(join(app, 'index.html'))) return { errs, note: 'no app here (the public copy), nothing to check' };

  if (!fs.existsSync(join(app, '404.html'))) errs.push('app/404.html is missing: copy app/index.html over it');
  else if (!fs.readFileSync(join(app, 'index.html')).equals(fs.readFileSync(join(app, '404.html')))) errs.push('app/404.html differs from app/index.html: copy index.html over 404.html');

  const now = version(fs.existsSync(join(app, 'sw.js')) ? fs.readFileSync(join(app, 'sw.js'), 'utf8') : '');
  if (now === null) { errs.push("line 1 of app/sw.js must start with const C='mess-v<number>';"); return { errs, note: '' }; }

  if (git(root, 'rev-parse', '--verify', '--quiet', base + '^{commit}') === null) {
    const why = `no ${base} to compare with, so the cache version was not checked`;
    if (strict) errs.push(why + ' (the workflow must fetch main: fetch-depth: 0)');
    return { errs, note: strict ? '' : why };
  }
  const was = version(git(root, 'show', `${base}:app/sw.js`));
  if (was === null) { errs.push(`${base} has no cache version on line 1 of app/sw.js to compare with`); return { errs, note: '' }; }
  // What this branch changed since it left main. A shallow clone sometimes can't say where that was; comparing with main
  // as it is now would then blame the branch for main's own changes, so it stops and says how to fix the clone instead.
  const from = git(root, 'merge-base', 'HEAD', base);
  if (from === null) { errs.push(`git can't tell where this branch left ${base} (a shallow clone): run "git fetch --depth=200 origin main" or merge main in, then run the tests again`); return { errs, note: '' }; }
  const diff = git(root, 'diff', '--name-only', from, '--', 'app'), staged = git(root, 'diff', '--name-only', '--cached', from, '--', 'app'), fresh = git(root, 'ls-files', '--others', '--exclude-standard', '--', 'app');
  if (diff === null || staged === null) { errs.push('git could not compare app/ with ' + base); return { errs, note: '' }; }
  const changed = [...new Set((diff + '\n' + staged + '\n' + (fresh || '')).split('\n').filter(Boolean))];
  if (changed.length && now <= was)
    errs.push(`${changed.length} file${changed.length > 1 ? 's' : ''} under app/ changed (${changed.slice(0, 5).join(', ')}${changed.length > 5 ? ', ...' : ''}) but the cache version is mess-v${now} and main has mess-v${was}: make line 1 of app/sw.js mess-v${was + 1}`);
  return { errs, note: '' };
}

// ---- prove it on made-up repos ----
const errs = [], made = [];
const sw = (n) => `const C='mess-v${n}';const F=['./'];\nself.addEventListener('fetch',()=>{});\n`;
function repo() {
  const d = fs.mkdtempSync(join(os.tmpdir(), 'mess-cache-')); made.push(d); const w = (f, t) => { fs.mkdirSync(join(d, f, '..'), { recursive: true }); fs.writeFileSync(join(d, f), t); };
  const g = (...a) => { const r = spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@example.com', '-c', 'commit.gpgsign=false', ...a], { cwd: d, encoding: 'utf8', env }); if (r.status !== 0) throw new Error('git ' + a.join(' ') + ': ' + (r.stderr || (r.error && r.error.message) || 'git did not run')); };
  const commit = (m) => { g('add', '-A'); g('commit', '-q', '-m', m); };
  g('init', '-q', '-b', 'main');
  w('app/index.html', '<p>Mess</p>\n'); w('app/404.html', '<p>Mess</p>\n'); w('app/sw.js', sw(7)); w('app/js/a.js', 'let a=1;\n'); w('README.md', 'x\n');
  commit('start'); g('update-ref', 'refs/remotes/origin/main', 'HEAD'); g('checkout', '-q', '-b', 'work');
  return { d, w, g, commit };
}
const expect = (name, r, want) => { const got = r.errs.join(' | '); if (want === null ? r.errs.length : !want.test(got)) errs.push(`self-test "${name}": expected ${want === null ? 'no problem' : want}, got: ${got || 'no problem'}`); };
try {
  let t = repo(); expect('nothing changed', check(t.d), null);
  t.w('README.md', 'y\n'); t.commit('docs'); expect('a change outside app/', check(t.d), null);
  t.w('app/js/a.js', 'let a=2;\n'); expect('app change, not committed, no bump', check(t.d), /app\/js\/a\.js.*mess-v8/);
  t.commit('app'); expect('app change, committed, no bump', check(t.d), /changed .*mess-v7 and main has mess-v7/);
  t.w('app/sw.js', sw(8)); expect('app change with the bump', check(t.d), null);
  t.w('app/sw.js', sw(6)); expect('version went down', check(t.d), /mess-v6 and main has mess-v7/);
  t.w('app/sw.js', "const C = 'mess-v9';\n"); expect('line 1 in another shape', check(t.d), /line 1 of app\/sw\.js/);

  t = repo(); t.w('app/js/new.js', 'let n=1;\n'); expect('a new file nobody added yet', check(t.d), /app\/js\/new\.js/);
  t = repo(); fs.rmSync(join(t.d, 'app/js/a.js')); expect('a deleted file', check(t.d), /app\/js\/a\.js/);
  t = repo(); t.w('app/index.html', '<p>Mess 2</p>\n'); t.w('app/sw.js', sw(8)); expect('index changed, 404 not copied', check(t.d), /404\.html differs/);
  t.w('app/404.html', '<p>Mess 2</p>\n'); expect('index changed, 404 copied, bumped', check(t.d), null);

  // Main moved on (another app change took v8) after this branch left it.
  t = repo(); t.g('checkout', '-q', 'main'); t.w('app/js/a.js', 'let a=3;\n'); t.w('app/sw.js', sw(8)); t.commit('main moves'); t.g('update-ref', 'refs/remotes/origin/main', 'HEAD'); t.g('checkout', '-q', 'work');
  expect('branch is only behind main', check(t.d), null);
  t.w('app/js/b.js', 'let b=1;\n'); t.w('app/sw.js', sw(8)); t.commit('took the same number'); expect('two branches took the same number', check(t.d), /mess-v8 and main has mess-v8.*mess-v9/);
  t.w('app/sw.js', sw(9)); expect('one above main as it is now', check(t.d), null);

  t = repo(); fs.rmSync(join(t.d, 'app/404.html')); expect('404.html missing', check(t.d), /404\.html is missing/);
  t = repo(); t.w('app/js/a.js', 'let a=2;\n'); t.g('add', '-A'); t.w('app/js/a.js', 'let a=1;\n'); expect('a change that is only staged', check(t.d), /app\/js\/a\.js/);
  t = repo(); t.g('mv', 'app/js/a.js', 'app/js/z.js'); expect('a renamed file', check(t.d), /app\/js\/z\.js/);

  // Main with no history in common with the branch: what a shallow clone looks like once main has moved on.
  t = repo(); t.g('checkout', '-q', '--orphan', 'elsewhere'); t.w('app/sw.js', sw(8)); t.commit('main, cut off'); t.g('update-ref', 'refs/remotes/origin/main', 'HEAD'); t.g('checkout', '-q', 'work');
  expect('cannot tell where the branch left main', check(t.d), /can't tell where this branch left/);

  t = repo(); t.g('update-ref', '-d', 'refs/remotes/origin/main'); t.w('app/js/a.js', 'let a=2;\n');
  let r = check(t.d); if (r.errs.length || !/not checked/.test(r.note)) errs.push('self-test "no main to compare with": should pass and say it was not checked, got ' + JSON.stringify(r));
  expect('no main to compare with, on CI', check(t.d, 'origin/main', true), /not checked/);
  t = repo(); fs.rmSync(join(t.d, 'app'), { recursive: true }); r = check(t.d); if (r.errs.length || !/no app here/.test(r.note)) errs.push('self-test "no app folder": ' + JSON.stringify(r));
} catch (e) { errs.push('self-test could not run: ' + e.message); }
finally { for (const d of made) fs.rmSync(d, { recursive: true, force: true }); }

// ---- this repo ----
const real = check(join(__dirname, '..'), process.env.MESS_BASE || 'origin/main', !!process.env.CI);
if (real.note) console.log('note: ' + real.note);
errs.push(...real.errs);
console.log('ERRS', errs);
