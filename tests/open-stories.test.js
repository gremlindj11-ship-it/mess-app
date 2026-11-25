// Open-source statements build into a story like a guideline's claims do, and a reworded statement loses its verdicts.
// - consensus: a verdict stamped with an earlier wording is set aside; an unstamped (older) one still counts;
// - the story builder reads statements.csv, tags each point with its source's short name, lists every source with its
//   credit line, needs "gaps", says it was not checked against a guideline, and keeps an unread story out of the app;
// - the guess-first question is read like any other summary.
// No browser and no network.
const { spawnSync } = require('node:child_process');
const { mkdtempSync, rmSync, writeFileSync, readFileSync, mkdirSync, existsSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const root = join(__dirname, '..'), tmp = mkdtempSync(join(tmpdir(), 'mess-open-')), dir = join(tmp, 'open', 'test'), out = join(tmp, 'stories.js'), errs = [];
mkdirSync(dir, { recursive: true });
const q = (s) => '"' + String(s).replace(/"/g, '""') + '"', node = (args) => spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8' });
const HEAD = ['topic', 'subject', 'relation', 'object', 'misconception', 'why_it_matters', 'mechanism_why', 'source', 'source_url', 'source_quote', 'source_id', 'source_at'];
const SRC = ['NHS website: High blood pressure', 'https://www.nhs.uk/conditions/high-blood-pressure/'];
const ROWS = [
  ['Test', 'High blood pressure', 'is usually considered present', 'at 140/90 or higher in clinic', '', '', '', ...SRC, 'High blood pressure is 140/90 or higher.', 'nhs-high-blood-pressure', 'b1.s1'],
  ['Test', 'High blood pressure', 'does not usually cause', 'symptoms', '', '', '', ...SRC, 'It does not usually cause symptoms.', 'nhs-high-blood-pressure', 'b1.s2'],
  ['Test', 'A diagnosis', 'should be confirmed', 'with home or ambulatory readings', '', '', '', ...SRC, 'Confirm it with home readings.', 'nhs-high-blood-pressure', 'b1.s3'],
  ['Test', 'A reworded statement', 'is', 'new wording', '', '', '', ...SRC, 'Quote.', 'nhs-high-blood-pressure', 'b1.s4']];
writeFileSync(join(dir, 'statements.csv'), HEAD.map(q).join(',') + '\n' + ROWS.map(r => r.map(q).join(',')).join('\n') + '\n');
try {
  // 1. Stamps. Work them out with the same helper the tools use.
  const r0 = spawnSync(process.execPath, ['--input-type=module', '-e', `import { stamp, objs } from './tools/rights.mjs'; import { readFileSync } from 'node:fs'; console.log(JSON.stringify(objs(readFileSync(${JSON.stringify(join(dir, 'statements.csv'))}, 'utf8')).map(stamp)))`], { cwd: root, encoding: 'utf8' });
  const st = JSON.parse(r0.stdout), FC = 'row,verdict,population,trigger,action,strength,numbers,alternatives,exceptions,safety,notes,stamp\n', ok = (n, s, note) => `${n},"confirmed","yes","yes","yes","yes","yes","n.a.","n.a.","n.a.","${note}","${s}"\n`;
  writeFileSync(join(dir, 'factcheck.alpha.csv'), FC + ok(2, st[0], 'a2') + ok(3, st[1], 'a3') + ok(4, st[2], 'a4') + ok(5, 'feedbeef0000', 'a5 on the old wording'));
  writeFileSync(join(dir, 'factcheck.beta.csv'), FC + ok(2, st[0], 'b2') + ok(3, '', 'b3 written before stamps') + ok(4, st[2], 'b4') + ok(5, st[3], 'b5'));
  let r = node(['tools/consensus.mjs', dir]); const cons = readFileSync(join(dir, 'consensus.csv'), 'utf8');
  if (!/^2,agreed/m.test(cons) || !/^3,agreed/m.test(cons) || !/^4,agreed/m.test(cons)) errs.push('rows checked on their current wording should be agreed: ' + cons);
  if (!/^5,unresolved/m.test(cons) || !/row 5: alpha read an earlier wording/.test(r.stdout)) errs.push('a verdict on an earlier wording still counted: ' + cons + r.stdout);

  // 2. The story.
  writeFileSync(join(dir, 'story-plan.md'), [1, 2, 3, 4, 5, 6, 7, 8].map(i => `${i}. **Question ${i}.** An answer.`).join('\n') + '\n');
  const good = () => ({ writer: 'claude', topic: 'Open test', shape: 'presentation', from: 'the NHS website', covers: 'It covers diagnosis.', not_covered: 'It does not cover stages.', idea: 'One reading is not a diagnosis.', idea_rows: [2, 4],
    steps: [{ h: 'What counts', pts: [{ row: 2 }] }, { h: 'Silent', bridge: 'Next', pts: [{ row: 3 }] }, { h: 'Confirm', bridge: 'So', pts: [{ row: 4 }] }],
    remember: ['140/90 in clinic.', 'Confirm it at home.'], gaps: [{ t: 'Stages', url: 'https://example.org/guideline' }],
    predict: { q: 'A reading is raised. What next?', opts: ['Start a drug', 'Confirm it at home'], a: 1, step: 2, why: 'A diagnosis should be confirmed with home readings.', rows: [4] } });
  const run = (s, extra = []) => { writeFileSync(join(dir, 'story.json'), JSON.stringify(s)); return node(['tools/build-story.mjs', dir, '--out', out, ...extra]); };
  r = run(good()); if (r.status !== 0 || existsSync(out) && readFileSync(out, 'utf8').includes('Open test')) errs.push('an unread story went into the app: ' + r.stdout);
  if (!/stays out of the app/.test(r.stdout)) errs.push('the builder did not say why the story stayed out: ' + r.stdout);
  r = run(good(), ['--draft']); if (r.status !== 0) errs.push('a good open story did not build: ' + r.stdout);
  else { const S = new Function(readFileSync(out, 'utf8') + '; return STORIES')()['Open test'];
    if (!/\[NHS\]$/.test(S.steps[0].pts[0])) errs.push('a point is not tagged with its source\'s short name: ' + S.steps[0].pts[0]);
    if (!S.sources || S.sources.length !== 1 || !/Open Government Licence/.test(S.sources[0].t) || S.sources[0].url !== SRC[1]) errs.push('the source and its credit line are missing: ' + JSON.stringify(S.sources));
    if (!/not been checked against a clinical guideline/.test(S.status) || /against the guideline text/.test(S.status)) errs.push('the status line does not say what it was checked against: ' + S.status);
    if (!S.gaps || S.gaps[0].t !== 'Stages' || !S.predict || S.predict.a !== 1) errs.push('gaps or the guess-first question did not reach the story'); }
  r = run({ ...good(), steps: [{ h: 'What counts', pts: [{ row: 5 }] }, ...good().steps.slice(1)] }, ['--check']);
  if (!/row 5 is not agreed/.test(r.stdout)) errs.push('a statement reworded after its check was allowed in: ' + r.stdout);
  r = run((({ gaps, ...s }) => s)(good()), ['--check']); if (!/"gaps" must list/.test(r.stdout)) errs.push('an open story without "gaps" was accepted');
  r = run({ ...good(), predict: { ...good().predict, why: 'It should be confirmed within 3 days.' } }, ['--check']); if (!/number 3/.test(r.stdout)) errs.push('the guess-first answer brought in a number: ' + r.stdout);
  writeFileSync(join(dir, 'story.json'), JSON.stringify(good())); r = node(['tools/build-story.mjs', dir, '--check', '--items', join(tmp, 'items.json')]);
  const items = JSON.parse(readFileSync(join(tmp, 'items.json'), 'utf8')).items; if (!items.some(x => /guess-first/.test(x.kind))) errs.push('the guess-first question is not read by the story check');
} finally { rmSync(tmp, { recursive: true, force: true }); }
console.log('ERRS', errs);
