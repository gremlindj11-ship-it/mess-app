// The public copy of Mess holds nothing from a frozen source and no secret.
// In the public repo this scans the repo itself. In the private repo (which has the frozen material) it does nothing
// here: tests/export-clean.test.js builds a copy and runs this on it. No browser, no network.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), errs = [];
if (fs.existsSync(path.join(root, 'tools', 'export-public.mjs'))) { console.log('private repo: the copy is checked by export-clean.test.js'); console.log('ERRS', errs); process.exit(0); }
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => ['.git', 'node_modules'].includes(e.name) ? [] : e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const all = walk(root).map(f => path.relative(root, f).split(path.sep).join('/'));
const VENDOR = /(\.min\.js|sql-asm\.js|pdf\.worker|fzstd\.js|rough\.js|ts-fsrs\.js|package-lock\.json)$/, BIN = /\.(png|jpg|jpeg|gif|webp|ico|woff2?|ttf|pdf|zip|apkg|sqlite|db)$/i;
const text = all.filter(f => !VENDOR.test(f) && !BIN.test(f)), read = (f) => fs.readFileSync(path.join(root, f), 'utf8');

// 1. Paths that must not exist.
for (const f of all) {
  if (/^content\/sources\//.test(f)) errs.push('saved guideline text: ' + f);
  if (/(^|\/)claims\.csv$/.test(f)) errs.push('an old guideline claims file: ' + f);
  if (/^content\/(?!open\/|open-sources\/|README\.md$|agents\.md$|rights\.json$|rights-frozen\.json$|topic-names\.txt$)/.test(f)) errs.push('content outside the open folders: ' + f);
  if (/^tools\/(dump-recs|fill-quotes|quotes-from-recs|export-public|frozen-text)\.mjs$/.test(f)) errs.push('a private-only tool: ' + f);
  if (/(^|\/)\.env(\.|$)|\.pem$|id_rsa|\.p12$/.test(f)) errs.push('a file that usually holds a secret: ' + f);
}
// 2. The frozen file is empty, and nothing is recorded as a frozen statement.
// The app is public since 27 Nov 2026 (Sofia: "Going public through mess-app"), but never with frozen material in it:
// no old evidence, no frozen packs, and the frozen stories file holds only comments (checked below).
for (const f of all) if (/^private\//.test(f) || /^packs\/(copd-set|af-essentials)/.test(f) || /^site-img\//.test(f)) errs.push('frozen material: ' + f);
const fz = fs.existsSync('app/assets/frozen.js') ? read('app/assets/frozen.js') : ''; if (/Object\.assign|STORIES|NOTES/.test(fz.replace(/^\/\/.*$/gm, ''))) errs.push('app/assets/frozen.js is not empty');
const ids = JSON.parse(read('content/rights-frozen.json')).ids; if (Object.values(ids).some(a => a.length)) errs.push('content/rights-frozen.json lists frozen statements');
// 3. No citation of a frozen source as the basis of content. A citation is a source tag: "NICE NG136", "[BTS 2023 ...]",
//    "source": "NICE ...", src: 'GOLD 2026'. Naming the bodies in rules, docs, code and tests is fine and expected; a link to a
//    guideline as "where to read it" is fine. So this looks only where content lives: the app's data, content/, packs/, the website.
const CONTENT = /^(app\/assets\/(?!curricula\.js)|app\/data\.js$|content\/open\/|content\/open-sources\/|packs\/|site-data\.js$|index\.html$|help\.html$)/;
const TAGS = [/\b(NICE|SIGN)\s+(NG|CG|TA|QS|PH|IPG)\s?\d+/, /\b(BTS|SIGN|GOLD|NICE)\b[^\n"']{0,40}\b(19|20)\d\d\b[^\n"']{0,12}(guideline|report|statement)?\s*[\]'"]/, /["']?(source|src|from)["']?\s*:\s*["'][^"']*\b(NICE|BTS|SIGN|GOLD)\b/, /\[(NICE|BTS|SIGN|GOLD)\b[^\]]*\]/, /\b(NICE|BTS|SIGN|GOLD)\s+(says|recommends|advises|guidance says)\b/];
for (const f of text.filter(f => CONTENT.test(f))) { const t = read(f); for (const re of TAGS) { const m = t.match(re); if (m) { errs.push(`a frozen or link-only source is cited in ${f}: "${t.slice(Math.max(0, m.index - 40), m.index + m[0].length + 20).replace(/\s+/g, ' ')}"`); break; } } }
// Every statement in the copy names a source the register lets a model read.
const reg = JSON.parse(read('content/rights.json')), blocked = reg.sources.filter(s => s.use !== 'write').flatMap(s => s.hosts || []);
for (const f of text.filter(f => /^content\/open\/.*statements\.csv$/.test(f))) for (const h of blocked) if (h && read(f).includes('//' + h)) errs.push(`${f} has a statement sourced from ${h}`);
// 4. Secrets. Key shapes of the services Mess uses, private keys, and anything assigned to a name like api_key.
const SECRET = [['Google API key', /AIza[0-9A-Za-z_-]{35}/], ['Groq key', /gsk_[0-9A-Za-z]{40,}/], ['Anthropic key', /sk-ant-[0-9A-Za-z_-]{20,}/], ['OpenAI key', /\bsk-(proj-)?[0-9A-Za-z_-]{32,}/], ['GitHub token', /\b(ghp|gho|ghu|ghs|ghr)_[0-9A-Za-z]{30,}|github_pat_[0-9A-Za-z_]{40,}/],
  ['Cloudflare token', /\b[0-9A-Za-z_-]{40}\b(?=.*cloudflare)/i], ['Slack token', /xox[baprs]-[0-9A-Za-z-]{10,}/], ['AWS key', /\bAKIA[0-9A-Z]{16}\b/], ['private key', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['a named secret', /(api[_-]?key|secret|passw(or)?d|auth[_-]?token|access[_-]?token|bearer)["']?\s*[:=]\s*["'][0-9A-Za-z_\-\/+=.]{24,}["']/i]];
// Known and public by design: the Cloudflare Web Analytics site token (it is in the page for anyone to read).
const PUBLIC_OK = ['cc681e866c4b4a9c9caa2afdfa295ae7'];
for (const f of text) { const t = read(f).split('\n'); t.forEach((line, i) => { for (const [name, re] of SECRET) { const m = line.match(re); if (m && !PUBLIC_OK.some(k => m[0].includes(k)) && !/test-not-a-key|example|dummy|your[-_ ]?key|xxxx|\$\{\{\s*secrets\./i.test(line)) errs.push(`${name} in ${f}:${i + 1}: ${m[0].slice(0, 12)}…`); } }); }
console.log(`scanned ${text.length} text files of ${all.length}`);
console.log('ERRS', errs);
process.exit(errs.length ? 1 : 0);
