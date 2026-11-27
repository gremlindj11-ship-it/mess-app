// The rights register and its gate: no statement may cite a source the register does not allow, nothing new or
// reworded may come from a frozen source, and the tools that fetch a page, send rows to a model or fill a packet for one refuse sources a model may not read.
// Run by tests/run.mjs, or: node tests/rights.test.js (from the repo's top folder).
const { spawnSync } = require('node:child_process');
const { mkdtempSync, mkdirSync, writeFileSync, copyFileSync, rmSync, existsSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');

const root = process.cwd(), errs = [];
const gate = (dir) => { const r = spawnSync(process.execPath, [join(root, 'tools', 'check-rights.mjs'), ...(dir ? [dir] : [])], { cwd: root, encoding: 'utf8' }); return { code: r.status, out: (r.stdout || '') + (r.stderr || '') }; };
const tree = (files) => { const d = mkdtempSync(join(tmpdir(), 'mess-rights-')); mkdirSync(join(d, 'content'), { recursive: true }); copyFileSync(join(root, 'content', 'rights-frozen.json'), join(d, 'content', 'rights-frozen.json')); for (const [p, t] of Object.entries(files)) { mkdirSync(join(d, p, '..'), { recursive: true }); writeFileSync(join(d, p), t); } return d; };
const HEAD = 'topic,step,subject,relation,object,source,source_url,jurisdiction\n';
const saved = (register, url, licence) => JSON.stringify({ id: 'test-source', register, url, title: 'Test', fetched: '2026-11-21', licence, licence_evidence: 'test', credit: 'test', sha256: 'x', blocks: [] });
const temps = [];
const expect = (name, files, pass, say) => { const d = tree(files); temps.push(d); const r = gate(d); if ((r.code === 0) !== pass || (say && !say.test(r.out))) errs.push(`${name}: expected ${pass ? 'a pass' : 'a failure'}${say ? ' saying ' + say : ''}, got exit ${r.code}: ${r.out.trim().split('\n').slice(-3).join(' / ')}`); };

try {
  // The repo as it stands passes.
  const real = gate(); if (real.code !== 0) errs.push('the repo fails the gate: ' + real.out.trim().split('\n').slice(-6).join(' / '));
  if (!/frozen/.test(real.out) || !/In practice links/.test(real.out)) errs.push('the gate did not report what it checked: ' + real.out.slice(0, 200));

  // A new statement from a frozen source fails. So does one from a link-only source, and one from a site nobody has entered.
  expect('new NICE claim', { 'content/x/y/claims.csv': HEAD + 'Asthma,management,A made-up subject,should,be refused,NICE NG245 1.1.1,https://www.nice.org.uk/guidance/ng245,UK\n' }, false, /new or reworded statement from NICE/);
  expect('new GOLD claim', { 'content/x/y/claims.csv': HEAD + 'COPD,management,A made-up subject,should,be refused,GOLD 2026 report p1,https://goldcopd.org/2026-gold-report/,UK\n' }, false, /frozen/);
  expect('link-only source', { 'content/x/y/claims.csv': HEAD + 'Asthma,management,A made-up subject,should,be refused,Geeky Medics asthma,https://geekymedics.com/asthma/,UK\n' }, false, /link only/);
  expect('unknown source', { 'content/x/y/claims.csv': HEAD + 'Asthma,management,A made-up subject,should,be refused,Some blog,https://example.org/asthma,UK\n' }, false, /not in the rights register/);
  expect('open source through the old door', { 'content/x/y/claims.csv': HEAD + 'Asthma,management,A made-up subject,should,be refused,NHS website asthma,https://www.nhs.uk/conditions/asthma/,UK\n' }, false, /content\/open/);
  // Taking frozen statements down is allowed: a tree with none of them passes.
  expect('frozen statements taken down', { 'content/x/y/claims.csv': HEAD }, true);
  // A statement in the app that is not in any claims file is still caught.
  expect('new statement in the app', { 'app/assets/evidence.js': 'const EVIDENCE = {"Asthma":[{"id":"claim-0000000000000000","topic":"Asthma","source":"NICE NG245 1.1.1","source_url":"https://www.nice.org.uk/guidance/ng245"}]};' }, false, /evidence\.js.*frozen|frozen/);

  // Since NICE's reply (26 Nov 2026) even a statement that existed at the stop may not be in the app, and the live
  // frozen.js and pack library stay empty of frozen material. An open-source statement built by build-evidence passes.
  const oldId = require(join(root, 'content', 'rights-frozen.json')).ids.nice[0];
  expect('a pre-stop NICE statement in the app', { 'app/assets/evidence.js': `const EVIDENCE = {"Asthma":[{"id":"${oldId}","topic":"Asthma","source":"NICE NG245 1.1.1","source_url":"https://www.nice.org.uk/guidance/ng245"}]};` }, false, /Since 26 Nov 2026 nothing from a frozen source is served/);
  expect('an open statement in the app', { 'app/assets/evidence.js': 'const EVIDENCE = {"Hypertension":[{"id":"open-0000000000000000","topic":"Hypertension","source":"NHS website: High blood pressure","source_url":"https://www.nhs.uk/conditions/high-blood-pressure-hypertension/"}]};' }, true);
  expect('an app statement not built from open statements', { 'app/assets/evidence.js': 'const EVIDENCE = {"Hypertension":[{"id":"claim-0000000000000000","topic":"Hypertension","source":"NHS website: High blood pressure","source_url":"https://www.nhs.uk/conditions/high-blood-pressure-hypertension/"}]};' }, false, /not an open-source statement/);
  expect('frozen.js with stories in it', { 'app/assets/frozen.js': '// comment\nObject.assign(STORIES, {});\n' }, false, /frozen\.js holds more than comments/);
  expect('frozen.js with comments only', { 'app/assets/frozen.js': '// empty on purpose\n' }, true);
  expect('a frozen pack in the library', { 'packs/index.json': '{"packs":[{"id":"x","file":"x.mess-pack.json"}]}', 'packs/x.mess-pack.json': '{"cards":[{"src":"NICE NG115"}]}' }, false, /names a frozen source/);
  expect('a frozen pack nobody listed', { 'packs/index.json': '{"packs":[]}', 'packs/y.mess-pack.json': '{"cards":[{"url":"https://www.nice.org.uk/guidance/ng115"}]}' }, false, /y\.mess-pack\.json names a frozen source/);
  expect('a pack citing only a guideline number', { 'packs/z.mess-pack.json': '{"cards":[{"src":"NG115 1.2.3"}]}' }, false, /names a frozen source/);
  expect('a pack with ordinary words', { 'packs/w.mess-pack.json': '{"cards":[{"q":"A nice sign of a gold standard test"}]}' }, true);

  // New-process statements: allowed only from a saved source that a model may read, under an open licence.
  const S = 'topic,step,subject,relation,object,source,source_url,source_id\nHypertension,management,A made-up subject,should,pass,Test,https://www.nhs.uk/conditions/x/,test-source\n';
  expect('open statement, allowed', { 'content/open/t/statements.csv': S, 'content/open-sources/test-source.json': saved('nhs-website', 'https://www.nhs.uk/conditions/x/', 'OGL-UK-3.0') }, true);
  expect('open statement, no saved source', { 'content/open/t/statements.csv': S }, false, /no saved copy/);
  expect('open statement, frozen source', { 'content/open/t/statements.csv': S, 'content/open-sources/test-source.json': saved('nice', 'https://www.nice.org.uk/guidance/ng136', 'OGL-UK-3.0') }, false, /may not read|does not allow/);
  expect('open statement, non-commercial licence', { 'content/open/t/statements.csv': S, 'content/open-sources/test-source.json': saved('open-access-article', 'https://www.ebi.ac.uk/europepmc/x', 'CC-BY-NC-4.0') }, false, /not an open licence/);
  expect('open statement, address from another site', { 'content/open/t/statements.csv': S, 'content/open-sources/test-source.json': saved('nhs-website', 'https://www.nice.org.uk/guidance/ng136', 'OGL-UK-3.0') }, false, /does not belong/);
  // An In practice link to a site nobody has entered fails.
  expect('In practice link outside the register', { 'app/assets/topics.js': 'const PRACTICE = new Map([["X", { name: "X", url: "https://example.org/x" }]]);' }, false, /not in the rights register/);

  // The fetch tools ask the register first.
  const ask = spawnSync(process.execPath, ['--input-type=module', '-e', `import { allowFetch, refuseFrozenFile } from ${JSON.stringify('file://' + join(root, 'tools', 'rights.mjs'))};
    const t = (f) => { try { f(); return 'ok'; } catch (e) { return 'no'; } };
    console.log([['https://www.nice.org.uk/guidance/ng136', 'https://www.brit-thoracic.org.uk/x', 'https://www.sign.ac.uk/x', 'https://goldcopd.org/x', 'https://geekymedics.com/x', 'https://example.org/x', 'http://www.gov.uk/x', 'https://www.gmc-uk.org/x'].map(u => t(() => allowFetch(u))).join(''), ['https://www.gov.uk/guidance/x', 'https://www.legislation.gov.uk/ukpga/2005/9', 'https://www.nhs.uk/conditions/x/', 'https://www.ebi.ac.uk/europepmc/webservices/rest/PMC1/fullTextXML'].map(u => t(() => allowFetch(u))).join(''), t(() => refuseFrozenFile('content/sources/ng136.csv')), t(() => refuseFrozenFile('content/open-sources/x.json'))].join('|'));`], { cwd: root, encoding: 'utf8' });
  if ((ask.stdout || '').trim() !== 'nononononononono|okokokok|no|ok') errs.push('the fetch guard is wrong: ' + (ask.stdout || ask.stderr).trim().slice(0, 300));
  for (const [tool, a] of [['dump-recs.mjs', ['https://www.nice.org.uk/guidance/ng136/chapter/Recommendations', join(tmpdir(), 'mess-never.csv')]], ['quotes-from-recs.mjs', [join(tmpdir(), 'mess-none.csv'), 'content/sources/ng136.csv']]].filter(([t]) => existsSync('tools/' + t))) {
    const r = spawnSync(process.execPath, [join(root, 'tools', tool), ...a], { cwd: root, encoding: 'utf8' });
    if (r.status === 0 || !/rights register|frozen source/.test(r.stdout || '')) errs.push(`${tool} did not refuse a frozen source: ${(r.stdout || r.stderr || '').trim().slice(0, 160)}`);
  }
  // The tools that send rows to a model, or fill a packet for one, ask the register too. Made-up rows, no network, no key.
  const send = mkdtempSync(join(tmpdir(), 'mess-send-')); temps.push(send);
  const env = { ...process.env }; for (const k of ['GEMINI_API_KEY', 'GROQ_API_KEY', 'ANTHROPIC_API_KEY']) delete env[k];
  const CH = 'topic,subject,relation,object,source,source_url,source_quote\n', row = (src, url) => `T,A made-up subject,should be,offered,${src},${url},Made-up words.\n`, pk = join(send, 'packet.json');
  const tool = (name, args, e) => { const r = spawnSync(process.execPath, [join(root, 'tools', name), send, ...args], { cwd: root, encoding: 'utf8', env: e || env }); return { code: r.status, out: (r.stdout || '') + (r.stderr || '') }; };
  for (const [what, src, url] of [['a frozen source', 'NICE NG1 1.1', ''], ['a frozen source named only by its link', 'A guideline', 'https://www.brit-thoracic.org.uk/x'], ['a link-only source', 'Geeky Medics', ''], ['a source nobody has entered', 'Some blog', 'https://example.org/x']]) {
    writeFileSync(join(send, 'claims.csv'), CH + row(src, url)); rmSync(pk, { force: true });
    let r = tool('ai-factcheck.mjs', ['--packet', pk, '--name', 'gpt']);
    if (r.code !== 1 || !/Not sent: the rights register/.test(r.out) || existsSync(pk)) errs.push(`a claims packet was made from ${what}: ${r.out.trim().slice(0, 160)}`);
    r = tool('ai-factcheck.mjs', ['--provider', 'gemini'], { ...env, GEMINI_API_KEY: 'test-not-a-key' });
    if (r.code !== 1 || !/Not sent: the rights register/.test(r.out)) errs.push(`rows from ${what} got past the register on the way to a model: ${r.out.trim().slice(0, 160)}`);
    writeFileSync(join(send, 'questions.json'), JSON.stringify({ writer: 'claude', questions: [] }));
    r = tool('check-questions.mjs', ['--packet', pk]);
    if (r.code !== 1 || !/Not sent: the rights register/.test(r.out) || existsSync(pk)) errs.push(`a question packet was made resting on ${what}: ${r.out.trim().slice(0, 160)}`);
    rmSync(join(send, 'questions.json'));
  }
  writeFileSync(join(send, 'claims.csv'), CH + row('GOV.UK Assessing fitness to drive', 'https://www.gov.uk/guidance/x')); rmSync(pk, { force: true });
  const fine = tool('ai-factcheck.mjs', ['--packet', pk, '--name', 'gpt']);
  // (The tool may still stop for its own reasons, such as too few rows to plant a fault in. Only the register's refusal matters here.)
  if (/rights register/.test(fine.out)) errs.push('the register refused a GOV.UK row: ' + fine.out.trim().slice(0, 200));
} finally { temps.forEach(d => rmSync(d, { recursive: true, force: true })); }
console.log('ERRS', errs);
if (errs.length) process.exit(1);
