// "Elsewhere in the world" statements carry the geography their quote is about, never "UK" by default; every other
// statement is the UK's. Checked by filling a copy of the atrial fibrillation folder with one Elsewhere line. No browser.
const { spawnSync } = require('node:child_process'), fs = require('node:fs'), os = require('node:os'), { join } = require('node:path');
const root = join(__dirname, '..'), real = join(root, 'content/open/atrial-fibrillation'), errs = [];
const tmp = fs.mkdtempSync(join(os.tmpdir(), 'mess-geo-'));
const run = (dir, ...a) => { const r = spawnSync(process.execPath, [join(root, 'tools/check-open.mjs'), dir, ...a], { cwd: root, encoding: 'utf8' }); return { code: r.status, out: (r.stdout || '') + (r.stderr || '') }; };
const rowsOf = (d) => { const t = fs.readFileSync(join(d, 'statements.csv'), 'utf8').trim().split('\n'); const h = t[0].split('","').map(x => x.replace(/"/g, '')); return t.slice(1).map(l => Object.fromEntries(l.slice(1, -1).split('","').map((v, i) => [h[i], v]))); };
const make = (name, line) => { const d = join(tmp, name); fs.cpSync(real, d, { recursive: true });
  fs.appendFileSync(join(d, 'coverage.csv'), '99,Elsewhere in the world,A made-up item\n');
  if (line) fs.appendFileSync(join(d, 'statements.src.txt'), line + '\n'); return d; };
try {
  const base = '99 | consequences | often | extension | pmc8878614 | b41.s1 | Symptomatic rheumatic heart disease | is | a burden.';
  // The source's own geography (pmc8878614 is about low- and middle-income countries).
  let d = make('source', base), r = run(d, '--fill'); const last = (d) => rowsOf(d).pop();
  if (r.code !== 0) errs.push('fill failed: ' + r.out.slice(0, 200));
  else { if (last(d).jurisdiction !== 'LMIC') errs.push('an Elsewhere line took ' + last(d).jurisdiction + ', not its source\'s LMIC');
    const before = rowsOf(real).map(x => x.jurisdiction).join('|');
    if (rowsOf(d).slice(0, -1).map(x => x.jurisdiction).join('|') !== before) errs.push('the other statements changed jurisdiction');
    if (run(d).code !== 0) errs.push('the filled folder does not pass check-open'); }
  // The line's own geography wins, and "p" (partly) still counts as covering the item.
  d = make('own', base.replace(/^99 /, '99p ') + ' | @sub-Saharan Africa'); r = run(d, '--fill');
  if (r.code !== 0 || last(d).jurisdiction !== 'sub-Saharan Africa') errs.push('a line\'s own "@sub-Saharan Africa" was not used: ' + (r.code ? r.out.slice(0, 200) : last(d).jurisdiction));
  // A source with no geography and no "@": refused.
  d = make('none', '99 | consequences | often | extension | nhs-atrial-fibrillation | b1.s1 | Atrial fibrillation | is | a condition.'); r = run(d, '--fill');
  if (r.code === 0 || !/covers an "Elsewhere in the world" item/.test(r.out)) errs.push('an Elsewhere line with no geography was not refused');
  // A made-up geography, and a geography on a line that is not Elsewhere: refused.
  d = make('bad', base + ' | @Narnia'); if (run(d, '--fill').code === 0) errs.push('"@Narnia" was accepted');
  d = make('notaway', base.replace(/^99 /, '1 ') + ' | @LMIC'); if (run(d, '--fill').code === 0) errs.push('a geography on a UK line was accepted');
  // A filled Elsewhere row left as "UK" (an old fill) fails check-open.
  d = make('stale', base); run(d, '--fill'); const f = join(d, 'statements.csv'); const t = fs.readFileSync(f, 'utf8').trim().split('\n');
  t[t.length - 1] = t[t.length - 1].replace('"LMIC"', '"UK"'); fs.writeFileSync(f, t.join('\n') + '\n');
  if (!/can't be "UK"/.test(run(d).out)) errs.push('an Elsewhere row marked UK passed check-open');
} finally { fs.rmSync(tmp, { recursive: true, force: true }); }
console.log('ERRS', errs);
