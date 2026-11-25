// Content from open sources: saving a source, setting aside what a model may not read, copying quotes by address,
// and checking every quote word for word. No network. Run by tests/run.mjs, or: node tests/open-sources.test.js
const { spawnSync } = require('node:child_process');
const { mkdtempSync, cpSync, readFileSync, writeFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');

(async () => {
  const root = process.cwd(), errs = [], ok = (name, cond, got) => { if (!cond) errs.push(name + (got !== undefined ? ': ' + JSON.stringify(got).slice(0, 220) : '')); };
  const F = await import('file://' + join(root, 'tools', 'fetch-open.mjs'));

  // Sentences: short forms don't split; lettered footnotes under a figure do.
  const s = F.sentences('Use a cuff, e.g. a large one. Then rest. See Fig. 2 for details. Done (yes). 3 readings follow.');
  ok('sentences', s.length === 5 && s[0] === 'Use a cuff, e.g. a large one.' && s[2] === 'See Fig. 2 for details.', s);
  const n = F.number([{ text: 'Fig. 1 A pathway. a Consider lifestyle first. b Check for postural hypotension.', kind: 'caption' }, { text: 'BIHS recommends treatment. NICE recommends something else in NG136. The BNF lists doses. Signs of GOLD standard care are nice.', kind: 'p' }, { text: F.SET_ASIDE_ART, kind: 'aside' }]);
  ok('footnotes split', n.blocks[0].s.length === 3 && n.blocks[0].s[1] === 'Consider lifestyle first.', n.blocks[0].s);
  ok('restricted sentences set aside', n.blocks[1].s.join('|') === ['BIHS recommends treatment.', F.SET_ASIDE, F.SET_ASIDE, 'Signs of GOLD standard care are nice.'].join('|') && n.set_aside === 3 && n.kept === 5, [n.blocks[1].s, n.set_aside, n.kept]);
  for (const t of ['NICE says so', 'see NG136', 'SIGN 158', 'the British National Formulary', 'BTS guideline', 'GOLD 2026 report', 'CKS topic']) ok('restricted: ' + t, F.RESTRICTED.test(t));
  for (const t of ['a nice result', 'signs of disease', 'the gold standard', 'a SIGN of improvement', 'ESC/ESH guidelines', 'the MHRA']) ok('not restricted: ' + t, !F.RESTRICTED.test(t));

  // An article's own licence decides. Anything non-commercial or no-derivatives is not open.
  const lic = (t) => F.jatsLicence(`<license>${t}</license>`).id;
  ok('CC BY by words', lic('<license-p>This article is licensed under a Creative Commons Attribution 4.0 International License, which permits use.</license-p>') === 'CC-BY-4.0');
  ok('a data waiver is not the licence', lic('<license-p>This article is licensed under a Creative Commons Attribution 4.0 International License. The Creative Commons Public Domain Dedication waiver (http://creativecommons.org/publicdomain/zero/1.0/) applies to the data made available in this article.</license-p>') === 'CC-BY-4.0');
  ok('CC0 by link alone', lic('<ali:license_ref>https://creativecommons.org/publicdomain/zero/1.0/</ali:license_ref>') === 'CC0-1.0');
  ok('CC BY by link', lic('<ali:license_ref>https://creativecommons.org/licenses/by/4.0/</ali:license_ref>') === 'CC-BY-4.0');
  ok('NC by link', lic('<ali:license_ref>https://creativecommons.org/licenses/by-nc-nd/4.0/</ali:license_ref>') === 'CC-BY-NC-ND-4.0');
  ok('NC by words', /NC/.test(lic('<license-p>Creative Commons Attribution-NonCommercial 4.0 International License</license-p>')), lic('<license-p>Creative Commons Attribution-NonCommercial 4.0 International License</license-p>'));
  ok('no licence', lic('<license-p>All rights reserved.</license-p>') === '');

  // An article: references, declarations and citation marks go; a figure credited to someone else is set aside whole.
  const xml = `<article><front><abstract><p>Short summary.</p></abstract></front><body><sec><title>Intro</title><p>Blood pressure matters <xref ref-type="bibr" rid="r1">1</xref>. It is common.</p><sec><title>Detail</title><p>Second level.</p></sec></sec><sec><title>Tables</title><table-wrap><label>Table 1</label><caption><p>Our own table.</p></caption><table><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table></table-wrap><fig><label>Fig. 1</label><caption><p>Algorithm reproduced with permission from someone else.</p></caption></fig></sec><sec><title>References</title><p>1. A paper.</p></sec><sec><title>Competing interests</title><p>None.</p></sec></body></article>`;
  const jb = F.jatsBlocks(xml), text = jb.map(b => b.text).join(' || ');
  ok('article blocks', /Short summary\./.test(text) && /Blood pressure matters\. It is common\./.test(text) && !/A paper|None\./.test(text) && jb.some(b => b.path === 'Intro > Detail') && jb.some(b => b.kind === 'row' && b.text === '1 | 2'), jb);
  ok('credited figure set aside', jb.some(b => b.kind === 'aside' && b.text === F.SET_ASIDE_ART) && !/Algorithm/.test(text), text);
  const hb = F.htmlBlocks('<main><h1>High blood pressure</h1><nav><li>skip</li></nav><h2>Symptoms</h2><p>Usually none.</p><ul><li>headaches</li></ul><script>x()</script></main>');
  ok('html blocks', hb.length === 2 && hb[1].path === 'High blood pressure > Symptoms' && hb[1].kind === 'li' && hb[1].text === 'headaches', hb);

  // Quotes are fetched by address.
  const doc = { blocks: [{ at: 'b1', path: 'Top > Indications to screen', s: ['One.', 'Two.', 'Three.'] }, { at: 'b2', path: 'Top > NICE guidance', s: ['Four.'] }] };
  ok('quoteAt', F.quoteAt(doc, 'b1.s2') === 'Two.' && F.quoteAt(doc, 'b1.s2-s3') === 'Two. Three.' && F.quoteAt(doc, 'b1') === 'One. Two. Three.' && F.quoteAt(doc, 'b1.s1+b2') === 'One. Four.' && F.quoteAt(doc, 'b1.h+b1.s1') === 'Indications to screen One.', [F.quoteAt(doc, 'b1.h+b1.s1')]);
  ok('quoteAt refuses', F.quoteAt(doc, 'b1.s4') === null && F.quoteAt(doc, 'b9') === null && F.quoteAt(doc, 'b2.h') === null && F.quoteAt(doc, 'b1.s1+b9') === null);

  // The fetcher asks the rights register before anything else.
  for (const u of ['https://www.nice.org.uk/guidance/ng136', 'https://geekymedics.com/hypertension/', 'https://example.org/x']) { let said = ''; try { await F.fetchOpen(u); } catch (e) { said = e.message; } ok('fetch refused: ' + u, /rights register/.test(said), said); }

  // The statements in the repo pass, and a changed quote, a restricted name or a claimed status is caught.
  const run = (dir) => { const r = spawnSync(process.execPath, [join(root, 'tools', 'check-open.mjs'), dir], { cwd: root, encoding: 'utf8' }); return { code: r.status, out: (r.stdout || '') + (r.stderr || '') }; };
  const real = join(root, 'content', 'open', 'hypertension'), r0 = run(real);
  ok('repo statements pass', r0.code === 0 && /word for word/.test(r0.out), r0.out.slice(-300));
  const tmp = mkdtempSync(join(tmpdir(), 'mess-open-'));
  try {
    const breakIt = (name, change, say) => { const d = join(tmp, name); cpSync(real, d, { recursive: true }); const f = join(d, 'statements.csv'); writeFileSync(f, change(readFileSync(f, 'utf8'))); const r = run(d); ok(name, r.code !== 0 && say.test(r.out), r.out.slice(-260)); };
    breakIt('changed quote', t => t.replace('140/90 or higher when checked', '150/95 or higher when checked'), /not, word for word/);
    breakIt('claimed status', t => t.replace('"draft"', '"checked by a doctor"'), /status must be draft/);
    breakIt('restricted name in a statement', t => t.replace('"High blood pressure","is usually considered', '"High blood pressure (NICE NG136)","is usually considered'), /may not read/);
    breakIt('wrong address', t => t.replace('"b42+b43+b44"', '"b41"'), /not, word for word/);
  } finally { rmSync(tmp, { recursive: true, force: true }); }

  console.log('ERRS', errs);
  if (errs.length) process.exit(1);
})();
