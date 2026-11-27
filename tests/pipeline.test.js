// tools/pipeline.mjs, on a made-up repo: each gate stops a topic for the reason it should, "status" and "next"
// change nothing, "next" prefers work a script can do on a started topic, and "advance" moves one stage at a time,
// refuses a failing gate, and moves a topic back when an earlier gate fails again.
// The made-up sources are saved as NHS website and open-access article entries, which the rights register allows.
// Their addresses only have to belong to those entries: nothing here fetches them.
const { spawnSync } = require('node:child_process'), fs = require('node:fs'), os = require('node:os'), { join } = require('node:path'), crypto = require('node:crypto');
const real = join(__dirname, '..'), errs = [], made = [];
const ok = (name, cond, info) => { if (!cond) errs.push(name + (info ? ': ' + String(info).slice(0, 400) : '')); };

function repo() {
  const root = fs.mkdtempSync(join(os.tmpdir(), 'mess-pipeline-')); made.push(root);
  const w = (f, t) => { fs.mkdirSync(join(root, f, '..'), { recursive: true }); fs.writeFileSync(join(root, f), t); };
  fs.cpSync(join(real, 'tools'), join(root, 'tools'), { recursive: true });
  fs.rmSync(join(root, 'tools', 'check-numbers.mjs'), { force: true }); // stage 5 is tested with a stand-in below
  w('content/rights.json', fs.readFileSync(join(real, 'content', 'rights.json'), 'utf8'));
  const src = (id, register, kind, licence, sentences) => w(`content/open-sources/${id}.json`, JSON.stringify({ id, register, kind, url: kind === 'nhs' ? `https://www.nhs.uk/conditions/${id}/` : `https://europepmc.org/article/PMC/${id}`, title: 'Made-up ' + id, licence_evidence: 'made up for a test', credit: 'Made up for a test', sha256: '0'.repeat(64), authors: 'Doe J', journal: 'Made-up Journal', year: '2024', updated: '2024-01-01', fetched: '2026-11-26', licence, blocks: [{ at: 'b1', path: 'Top > About', kind: 'p', s: sentences }] }));
  src('nhs-made-up-a', 'nhs-website', 'nhs', 'OGL-UK-3.0', ['Made-up disease causes a dull ache in the left knee.', 'It is more common after the age of 40.']);
  src('pmc-made-up-b', 'open-access-article', 'article', 'CC-BY-4.0', ['The ache is caused by swelling of the knee lining.']);
  src('pmc-made-up-w', 'open-access-article', 'article', 'CC-BY-4.0', ['In parts of West Africa it is often caused by a parasite.']);
  w('content/open/queue.md', ['# Queue', '', '## Made-up', '| Folder | Topic name in Mess | Saved sources |', '|---|---|---|',
    '| alpha | Alpha | nhs-made-up-a, pmc-made-up-b |', '| beta | Beta | |', '', '### Elsewhere in the world: made-up',
    '| Saved source | What it covers | Topics it serves |', '|---|---|---|', '| pmc-made-up-w | A parasite | alpha |', ''].join('\n'));
  const items = [['Presentation', 'The knee ache'], ['Presentation', 'Age'], ['Pathophysiology', 'Swelling'], ['Confused with', 'Gout'], ['Confused with', 'Injury'],
    ['Often missed', 'Older people'], ['Often missed', 'The other knee'], ['Why', 'Why it aches'], ['Why', 'Why age'], ['Elsewhere in the world', 'A parasite']];
  w('content/open/alpha/coverage.csv', 'n,group,item\n' + items.map((x, i) => `${i + 1},${x[0]},${x[1]}`).join('\n') + '\n');
  w('content/open/alpha/extraction-record.md', '# Alpha\nWriter: GPT (through Codex), 26 Nov 2026.\n');
  w('content/open/alpha/statements.src.txt', ['# Alpha: made-up statements for a test. Writer: GPT.', '# Sources: N nhs-made-up-a, R pmc-made-up-b, W pmc-made-up-w.',
    '1 | clinical features | usually | core | N | b1.s1 | Made-up disease | causes | a dull ache in the left knee, as the page puts it.',
    '2 | risk factors | often | core | N | b1.s2 | Made-up disease | is | more common in people over 40.',
    '3 | pathophysiology | usually | core | R | b1.s1 | The knee ache | comes from | swelling of the lining of the knee.',
    '10 | risk factors | often | extension | W | b1.s1 | In parts of West Africa, made-up disease | is | often caused by a parasite.', ''].join('\n'));
  const t = (...a) => spawnSync(process.execPath, a, { cwd: root, encoding: 'utf8' });
  const fill = t('tools/check-open.mjs', 'content/open/alpha', '--fill');
  if (fill.status !== 0) errs.push('the made-up topic does not fill: ' + fill.stdout + fill.stderr);
  const pipe = (...a) => { const r = t('tools/pipeline.mjs', ...a); return { code: r.status, out: (r.stdout || '') + (r.stderr || '') }; };
  return { root, w, t, pipe, alpha: join(root, 'content/open/alpha') };
}
const lineOf = (out, topic) => (out.split('\n').find(l => l.startsWith(topic + ' ')) || '');
const hashAll = (dir) => { const h = crypto.createHash('sha256'); const walk = (d) => { for (const n of fs.readdirSync(d).sort()) { const p = join(d, n); if (fs.statSync(p).isDirectory()) walk(p); else h.update(p + '\0' + fs.readFileSync(p)); } }; walk(dir); return h.digest('hex'); };

(async () => {
try {
  // A complete made-up topic gets as far as the numbers check (not built in this copy); an empty row is at stage 0.
  let R = repo(), before = hashAll(R.root), s = R.pipe('status');
  ok('status runs', s.code === 0, s.out);
  ok('alpha stops at numbers', /5 numbers .*builder.*check-numbers\.mjs is not built/.test(lineOf(s.out, 'alpha')), lineOf(s.out, 'alpha'));
  ok('beta is not started', /0 pick .*runner.*not started/.test(lineOf(s.out, 'beta')), lineOf(s.out, 'beta'));
  const n = R.pipe('next');
  ok('next starts beta when no started topic has script work', /^beta: stage 0/.test(n.out), n.out);
  ok('status and next change nothing', hashAll(R.root) === before);
  ok('one topic shows every gate', /^ 4 quote check +✓/m.test(R.pipe('status', 'alpha').out) && /^ 9 PR +✗/m.test(R.pipe('status', 'alpha').out));

  // Each gate stops the topic for its own reason.
  const stage = (R) => lineOf(R.pipe('status').out, 'alpha');
  R = repo(); R.w('content/open/queue.md', fs.readFileSync(join(R.root, 'content/open/queue.md'), 'utf8').replace(/### Elsewhere[\s\S]*/, ''));
  ok('gate 1: no "Elsewhere in the world" source, for the writer (choosing sources is not a script\'s job)', /1 sources .*writer.*missing an "Elsewhere in the world" source/.test(stage(R)), stage(R));
  R = repo(); R.w('content/open/queue.md', fs.readFileSync(join(R.root, 'content/open/queue.md'), 'utf8').replace('nhs-made-up-a, pmc-made-up-b', 'pmc-made-up-b, pmc-gone'));
  ok('gate 1: a listed source that is not saved', /1 sources .*pmc-gone is not saved/.test(stage(R)), stage(R));
  R = repo(); R.w('content/open/alpha/coverage.csv', fs.readFileSync(join(R.alpha, 'coverage.csv'), 'utf8').replace(/\n\d+,Why,[^\n]*/g, ''));
  ok('gate 2: no "Why" group', /2 checklist .*no "Why" group/.test(stage(R)), stage(R));
  R = repo(); R.w('content/open/alpha/coverage.csv', fs.readFileSync(join(R.alpha, 'coverage.csv'), 'utf8') + '11,Elsewhere in the world,B\n12,Elsewhere in the world,C\n13,Elsewhere in the world,D\n');
  ok('gate 2: too many "Elsewhere in the world" items', /2 checklist .*"Elsewhere in the world" has 4 items/.test(stage(R)), stage(R));
  R = repo(); fs.rmSync(join(R.alpha, 'statements.src.txt'));
  ok('gate 3: no statements.src.txt, for the writer', /3 statements .*writer.*no statements\.src\.txt/.test(stage(R)), stage(R));
  R = repo(); R.w('content/open/alpha/statements.src.txt', fs.readFileSync(join(R.alpha, 'statements.src.txt'), 'utf8').replace('over 40.', 'over 41.'));
  ok('gate 3: statements.csv not refilled, for the runner', /3 statements .*runner.*not what --fill builds/.test(stage(R)), stage(R));
  ok('next takes the started topic a script can move', /^alpha: stage 3/.test(R.pipe('next').out), R.pipe('next').out);
  R = repo(); R.w('content/open/alpha/statements.src.txt', fs.readFileSync(join(R.alpha, 'statements.src.txt'), 'utf8').replace('The knee ache | comes from', 'The knee ache (NICE NG226) | comes from')); R.t('tools/check-open.mjs', 'content/open/alpha', '--fill');
  ok('gate 4: a statement that names NICE', /4 quote check .*writer.*may not read/.test(stage(R)), stage(R));

  // Stage 6 onwards, with a stand-in numbers check that passes.
  R = repo(); R.w('tools/check-numbers.mjs', 'process.exit(0);\n'); R.t('tools/check-open.mjs', 'content/open/alpha');
  ok('gate 6: no checks yet', /6 two checkers .*checkers.*no check by gemini or qwen/.test(stage(R)), stage(R));
  const { stamp, objs } = await import('file://' + join(R.root, 'tools', 'rights.mjs'));
  const st = objs(fs.readFileSync(join(R.alpha, 'statements.csv'), 'utf8'));
  const check = (model, verdict = () => 'confirmed') => R.w(`content/open/alpha/factcheck.${model}.csv`, 'row,verdict,population,trigger,action,strength,numbers,alternatives,exceptions,safety,notes,stamp\n' +
    st.map((c, i) => [i + 2, verdict(i + 2), 'yes', 'n.a.', 'yes', 'yes', 'n.a.', 'n.a.', 'n.a.', 'n.a.', `${model} read row ${i + 2}: ${c.object}`, stamp(c)].map(x => `"${x}"`).join(',')).join('\n') + '\n');
  check('gemini'); check('qwen', (r) => r === 3 ? 'disputed' : 'confirmed');
  ok('gate 6: a disputed row goes back to the writer, round 1', /6 two checkers .*writer.*rows 3 disputed.*round 1 of 2/.test(stage(R)), stage(R));
  R.w('content/open/alpha/status.json', JSON.stringify({ stage: 6, rounds: 2 }));
  ok('gate 6: after two rounds it is listed for Sofia', /6 two checkers .*Sofia.*still disputed after 2 rounds/.test(stage(R)), stage(R));
  check('qwen');
  ok('gate 6: consensus.csv not rerun after the checks', /6 two checkers .*runner.*consensus\.csv is out of date/.test(stage(R)), stage(R));
  R.t('tools/consensus.mjs', 'content/open/alpha');
  ok('gate 6: agreed, but no planted-fault record (run-checkers.mjs not built: the builder)', /6 two checkers .*builder.*no record that gemini and qwen caught a planted fault/.test(stage(R)), stage(R));
  R.w('content/open/alpha/status.json', JSON.stringify({ stage: 6, checks: [{ model_role: 'gemini', planted_total: 1, planted_caught: 1 }, { model_role: 'qwen', planted_total: 1, planted_caught: 0 }] }));
  ok('gate 6: a planted fault that got through', /no record that qwen caught/.test(stage(R)), stage(R));
  R.w('content/open/alpha/status.json', JSON.stringify({ stage: 6, checks: [{ model_role: 'gemini', planted_total: 1, planted_caught: 1 }, { model_role: 'qwen', planted_total: 2, planted_caught: 2 }] }));
  ok('gate 7: coverage.md out of date once agreed', /7 coverage .*runner.*coverage\.md is out of date/.test(stage(R)), stage(R));
  R.t('tools/check-open.mjs', 'content/open/alpha');
  ok('gate 8: no story yet', /8 story .*writer.*no story\.json/.test(stage(R)), stage(R));
  fs.writeFileSync(join(R.alpha, 'extraction-record.md'), 'Writer: Qwen\n');
  ok('gate 6: a writer that is one of the counting checkers', /6 two checkers .*Sofia.*the writer is qwen/.test(stage(R)), stage(R));
  fs.writeFileSync(join(R.alpha, 'extraction-record.md'), '# Alpha\nThe writer was not noted.\n');
  ok('gate 6: no "Writer:" line goes to Sofia', /6 two checkers .*Sofia.*no "Writer:" line/.test(stage(R)), stage(R));
  fs.writeFileSync(join(R.alpha, 'extraction-record.md'), 'Writer: Codex\n'); check('gpt');
  ok('gate 6: a check file in the writer\'s name (Codex is GPT) goes to Sofia', /6 two checkers .*Sofia.*factcheck\.gpt\.csv: the writer checked its own rows/.test(stage(R)), stage(R));
  fs.rmSync(join(R.alpha, 'factcheck.gpt.csv'));
  // Writer lines are read whole: every model named counts, and a line naming none goes to Sofia.
  for (const [line, want] of [['Writer: GPT and Gemini', /the writer is gemini/], ['Writer: Qwen3-32B', /the writer is qwen/], ['Writer: gemini-2.5-pro', /the writer is gemini/], ['Writer: unknown', /names no model/], ['Writers: a person', /names no model/], ['Writer: GPT-4.1 and Gemini', /the writer is gemini/], ['Writer: Claude (a chat). Claude cannot check. Checkers: Gemini and Qwen.', /no check by|disputed|agreed|consensus|planted|coverage|story/]]) {
    fs.writeFileSync(join(R.alpha, 'extraction-record.md'), line + '\n'); ok('gate 6 reads "' + line + '"', (line.startsWith('Writer: Claude') || /6 two checkers .*Sofia/.test(stage(R))) && want.test(stage(R)), stage(R));
  }
  fs.writeFileSync(join(R.alpha, 'extraction-record.md'), 'Writer: Codex\n'); check('GPT');
  ok('gate 6: a capitalised check file in the writer\'s name is still the writer\'s', /factcheck\.gpt\.csv: the writer checked its own rows/i.test(stage(R)), stage(R));
  fs.rmSync(join(R.alpha, 'factcheck.GPT.csv'));

  // advance: one stage a call, refuses a failing gate, moves back when an earlier gate fails again.
  R = repo();
  let a = R.pipe('advance', 'beta');
  ok('advance picks beta: makes its folder and records stage 1', a.code === 0 && JSON.parse(fs.readFileSync(join(R.root, 'content/open/beta/status.json'), 'utf8')).stage === 1, a.out);
  a = R.pipe('advance', 'beta');
  ok('advance refuses beta at sources', a.code === 1 && /stage 1 \(sources\) does not pass/.test(a.out) && JSON.parse(fs.readFileSync(join(R.root, 'content/open/beta/status.json'), 'utf8')).stage === 1, a.out);
  for (let i = 0; i < 5; i++) R.pipe('advance', 'alpha');
  let rec = JSON.parse(fs.readFileSync(join(R.alpha, 'status.json'), 'utf8'));
  ok('advance takes alpha one stage a call, up to numbers', rec.stage === 5 && rec.history.length === 5, JSON.stringify(rec));
  R.w('content/open/alpha/coverage.csv', fs.readFileSync(join(R.alpha, 'coverage.csv'), 'utf8').replace(/\n\d+,Why,[^\n]*/g, ''));
  a = R.pipe('advance', 'alpha'); rec = JSON.parse(fs.readFileSync(join(R.alpha, 'status.json'), 'utf8'));
  ok('advance moves alpha back to the checklist', a.code === 1 && /moved back from 5/.test(a.out) && rec.stage === 2, a.out);
  ok('status shows the recorded stage only when it differs', !/status\.json says/.test(lineOf(R.pipe('status').out, 'alpha')), lineOf(R.pipe('status').out, 'alpha'));
  a = R.pipe('advance', 'gamma'); ok('advance refuses a topic it does not know', a.code === 1, a.out);
  // status.json that is not a usable record is reported, never guessed at.
  for (const bad of ['null', '[]', '{"stage":"3"}', '{"stage":2.5}', '{"stage":99}']) {
    R.w('content/open/alpha/status.json', bad); a = R.pipe('advance', 'alpha');
    ok('advance refuses status.json ' + bad, a.code === 1 && /status\.json can't be read/.test(a.out), a.out);
    ok('status says status.json can\'t be read: ' + bad, /status\.json can't be read/.test(lineOf(R.pipe('status').out, 'alpha')), lineOf(R.pipe('status').out, 'alpha'));
  }
  R.w('content/open/alpha/status.json', '{"stage":1}'); a = R.pipe('advance', 'alpha', '--pr', 'x');
  ok('advance refuses a --pr that is not a number', a.code === 1 && /--pr needs a pull request number/.test(a.out), a.out);
  // Odd status.json fields are reported, not crashed on.
  for (const bad of ['{"stage":1,"history":{}}', '{"stage":1,"pr":"abc"}', '{"stage":1,"checks":{}}', '{"stage":1,"rounds":-1}']) {
    R.w('content/open/alpha/status.json', bad); a = R.pipe('advance', 'alpha');
    ok('advance refuses status.json ' + bad, a.code === 1 && /status\.json can't be read/.test(a.out), a.out);
    const s2 = R.pipe('status'); ok('status still runs with status.json ' + bad, s2.code === 0 && /status\.json can't be read/.test(lineOf(s2.out, 'alpha')), s2.out);
  }
  R.w('content/open/alpha/status.json', ''); a = R.pipe('advance', 'alpha');
  ok('advance refuses an empty status.json', a.code === 1 && /status\.json can't be read/.test(a.out), a.out);
  const sb = repo().pipe('status', 'beta');
  ok('status for a topic with no folder shows every gate, later ones blocked', sb.code === 0 && /^ 9 PR +✗ blocked: not started/m.test(sb.out), sb.out);
  // A source the register does not allow is Sofia's, not the runner's, so next never hands it out.
  R = repo(); R.w('content/open-sources/pmc-made-up-b.json', fs.readFileSync(join(R.root, 'content/open-sources/pmc-made-up-b.json'), 'utf8').replace('"open-access-article"', '"nice"').replace('"CC-BY-4.0"', '"all-rights-reserved"'));
  ok('gate 1: a source the register does not allow, for Sofia', /1 sources .*Sofia.*pmc-made-up-b is not one a model may write from/.test(stage(R)), stage(R));
  ok('next does not hand that to the runner', !/^alpha/.test(R.pipe('next').out), R.pipe('next').out);
} catch (e) { errs.push('could not run: ' + e.message); }
finally { for (const d of made) fs.rmSync(d, { recursive: true, force: true }); }
console.log('ERRS', errs);
if (errs.length) process.exit(1);
})();
