// The story builder: a story may only use agreed claims, a short version may not change a claim's strength or
// bring in a number, a wrong idea must come from the claim, and the built stories in the app must be up to date.
// No browser and no network.
const { spawnSync } = require('node:child_process');
const { mkdtempSync, rmSync, writeFileSync, mkdirSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');

const root = join(__dirname, '..'), tmp = mkdtempSync(join(tmpdir(), 'mess-story-')), dir = join(tmp, 'area', 'cond'), out = join(tmp, 'stories.js');
mkdirSync(dir, { recursive: true });
const q = (s) => '"' + String(s).replace(/"/g, '""') + '"';
const HEAD = ['topic', 'subject', 'relation', 'object', 'misconception', 'why_it_matters', 'mechanism_why', 'source', 'source_quote'];
const CLAIMS = [
  ['Test', 'People with the condition and a score of 2 or above', 'should be offered', 'drug A, taking bleeding risk into account, with drugs B, C and D as options when used in line with the relevant guidance and local policy on prescribing and review', '', '', '', 'GOV.UK NG1 1.1.1', 'Offer drug A to people with a score of 2 or above.'],
  ['Test', 'Drug E', 'should not be offered', 'solely for prevention', 'Drug E is an option solely for prevention.', '', '', 'GOV.UK NG1 1.1.2', 'Do not offer drug E solely for prevention.'],
  ['Test', 'For people with a score of 1, drug A', 'can be considered', '', '', '', '', 'GOV.UK NG1 1.1.3', 'Consider drug A for people with a score of 1.'],
  ['Test', 'An unchecked claim', 'should be', 'left out', '', '', '', 'GOV.UK NG1 1.1.4', 'Leave it out.']];
writeFileSync(join(dir, 'claims.csv'), HEAD.map(q).join(',') + '\n' + CLAIMS.map(r => r.map(q).join(',')).join('\n') + '\n');
writeFileSync(join(dir, 'consensus.csv'), 'row,status\n2,agreed\n3,agreed\n4,agreed\n5,unresolved\n');
writeFileSync(join(dir, 'story-plan.md'), [1, 2, 3, 4, 5, 6, 7, 8].map(i => `${i}. **Question ${i}.** An answer.`).join('\n') + '\n');
const good = () => ({ writer: 'claude', topic: 'Test topic', shape: 'presentation', from: 'GOV.UK NG1', covers: 'It covers treatment.', not_covered: 'It does not cover causes.', idea: 'Treatment depends on the score.', idea_rows: [2],
  steps: [{ h: 'Who is treated', pts: [{ row: 2, short: 'A score of 2 or above: drug A should be offered' }], table: { cap: 'By score', head: ['Score', 'Drug A'], rows: [['1', 'Can be considered'], ['2 or above', 'Should be offered']], claims: [2, 4] } },
    { h: 'Often got wrong', bridge: 'One idea to drop', pts: [{ row: 3, kind: 'wrong' }] },
    { h: 'Lower scores', bridge: 'Below the threshold', pts: [{ row: 4 }], flow: { cap: 'Which score?', claims: [2, 4], steps: [{ t: 'Work out the score' }, { ask: 'What is it?', paths: [{ if: '1', then: 'Drug A can be considered' }, { if: '2 or above', then: 'Drug A should be offered' }] }] } }],
  remember: ['A score of 2 or above: offer drug A.', 'Drug E is not for prevention alone.'] });
const run = (story, extra = []) => { writeFileSync(join(dir, 'story.json'), JSON.stringify(story)); return spawnSync(process.execPath, ['tools/build-story.mjs', dir, '--out', out, ...extra], { cwd: root, encoding: 'utf8' }); };
const expectFail = (name, change, needle) => { const s = good(); change(s); const r = run(s, ['--check']); if (r.status !== 1 || !r.stdout.includes(needle)) throw new Error(`${name}: expected a failure mentioning "${needle}", got ${r.status}: ${r.stdout}${r.stderr}`); };
try {
  let r = run(good(), ['--draft']); if (r.status !== 0) throw new Error('a good story did not build: ' + r.stdout + r.stderr);
  const js = require('node:fs').readFileSync(out, 'utf8'), S = new Function(js + '; return STORIES')()['Test topic'];
  if (!S || S.steps.length !== 3 || !S.steps[0].pts[0].full || !/\[GOV.UK NG1 1\.1\.1\]$/.test(S.steps[0].pts[0].t)) throw new Error('built story is the wrong shape: ' + js.slice(0, 400));
  if (!/^Often thought: drug E is an option solely for prevention\. In fact, drug E should not be offered solely for prevention \[GOV.UK NG1 1\.1\.2\]$/.test(S.steps[1].pts[0])) throw new Error('"often got wrong" was not built from the claim: ' + S.steps[1].pts[0]);
  if (S.steps[0].table.src !== 'GOV.UK NG1 1.1.1, 1.1.3' || !S.steps[2].flow || !/independent AI models/.test(S.status)) throw new Error('table source, diagram or status missing');
  r = run(good(), ['--check']); if (r.status !== 0) throw new Error('--check failed on an up-to-date story: ' + r.stdout);
  expectFail('row not agreed', s => { s.steps[2].pts.push({ row: 5 }); }, 'row 5 is not agreed');
  expectFail('strength changed', s => { s.steps[0].pts[0].short = 'A score of 2 or above: drug A can be considered'; }, 'says "can be considered" but the claim does not');
  expectFail('number brought in', s => { s.steps[0].pts[0].short = 'A score of 3 or above: drug A should be offered'; }, 'has the number 3');
  expectFail('long point with no short version', s => { delete s.steps[0].pts[0].short; }, 'needs a "short" version');
  expectFail('invented wrong idea', s => { s.steps[1].pts[0] = { row: 4, kind: 'wrong' }; }, 'never invents a wrong idea');
  expectFail('table cell stronger than its claims', s => { s.steps[0].table.rows[0][1] = 'Should not be offered'; }, 'says "should not" but none of its claims does');
  expectFail('no plan', s => { writeFileSync(join(dir, 'story-plan.md'), '1. **Only one.** Answer.\n'); }, 'no answer to question 2');
  // A second model's reading of the summaries: the writer can't be the reader, a dispute is reported, and a reworded summary counts as unread.
  const SC = 'row,verdict,strength,numbers,nothing_added,not_misleading,notes,text\n';
  writeFileSync(join(dir, 'story-plan.md'), [1, 2, 3, 4, 5, 6, 7, 8].map(i => `${i}. **Question ${i}.** An answer.`).join('\n') + '\n');
  writeFileSync(join(dir, 'storycheck.claude.csv'), SC); r = run(good(), ['--check']); if (r.status !== 1 || !r.stdout.includes("the writer of a story can't be its checker")) throw new Error('the writer was allowed to check its own story: ' + r.stdout);
  rmSync(join(dir, 'storycheck.claude.csv'));
  writeFileSync(join(dir, 'storycheck.gemini.csv'), SC + '1,"disputed","no","yes","yes","yes","Stronger than the claim.","A score of 2 or above: drug A should be offered"\n'); r = run(good(), ['--check']);
  if (!r.stdout.includes('gemini disputes this short version of one claim') || !r.stdout.includes('gemini has not read')) throw new Error('a dispute or an unread summary was not reported: ' + r.stdout);
  rmSync(join(dir, 'storycheck.gemini.csv'));
  // Story mode of the checker refuses the story's writer before any request is sent.
  r = spawnSync(process.execPath, ['tools/ai-factcheck.mjs', dir, '--story', '--provider', 'claude'], { cwd: root, encoding: 'utf8', env: { ...process.env, ANTHROPIC_API_KEY: 'test-not-a-key' } });
  if (r.status !== 1 || !r.stdout.includes("claude wrote this story, so it can't check it")) throw new Error('Claude was allowed to check a story Claude wrote: ' + r.stdout + r.stderr);
  // The real stories in the app match their sources.
  r = run(good(), ['--check', '--ship']); if (r.status !== 1 || !r.stdout.includes("so it can't ship")) throw new Error('a story no second model has read was allowed to ship: ' + r.stdout);
  r = spawnSync(process.execPath, ['tools/build-story.mjs', 'content', '--check', '--ship'], { cwd: root, encoding: 'utf8' });
  if (r.status !== 0) throw new Error('app/assets/stories.js is out of date, a story.json has a fault, or a story has summaries no second model has confirmed; run node tools/build-story.mjs content\n' + r.stdout);
  console.log('Story builder passed');
} finally { rmSync(tmp, { recursive: true, force: true }); }
