// Stamps the offline cache name on line 1 of app/sw.js from what is in app/, so nobody bumps it by hand.
//
//   node tools/stamp-cache.mjs           write the stamp into app/sw.js (Cloudflare's build runs this: wrangler.jsonc "build")
//   node tools/stamp-cache.mjs --print   only print the name it would write
//
// In the repo, line 1 is always the placeholder  const C='mess-dev';  and it stays that way: the stamp is written
// only into the copy Cloudflare builds and deploys. The name is "mess-" and the first 12 hex digits of a SHA-256 over
// every file under app/ (path and bytes, in path order), with sw.js's line 1 read as the placeholder. So any change
// under app/ gives a new name and phones fetch the new files; a change elsewhere leaves it alone.
// If line 1 is not a cache name at all it stops with an error, which stops the deploy. A stamped line must not be
// committed: tests/cache-version.test.js fails on one.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

export const PLACEHOLDER = "const C='mess-dev';";
const LINE1 = /^const C='mess-[^']*';/;
// files: [[path relative to app/ with "/" separators, Buffer]].
export function stampOf(files) {
  const h = createHash('sha256');
  for (const [p, b] of [...files].sort((a, c) => (a[0] < c[0] ? -1 : a[0] > c[0] ? 1 : 0))) {
    const bytes = p === 'sw.js' ? Buffer.from(b.toString('utf8').replace(LINE1, PLACEHOLDER)) : b;
    h.update(p + '\0' + bytes.length + '\0'); h.update(bytes);
  }
  return 'mess-' + h.digest('hex').slice(0, 12);
}
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]);
export const appFiles = (app) => walk(app).map(f => [relative(app, f).split(sep).join('/'), readFileSync(f)]);

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const app = join(dirname(fileURLToPath(import.meta.url)), '..', 'app'), sw = join(app, 'sw.js');
  const text = readFileSync(sw, 'utf8'), name = stampOf(appFiles(app));
  if (process.argv.includes('--print')) { console.log(name); process.exit(0); }
  // Running it again (wrangler dev rebuilds) restamps. Line 1 in any other shape stops the build.
  if (!LINE1.test(text)) { console.error(`✗ line 1 of app/sw.js must start with ${PLACEHOLDER}`); process.exit(1); }
  writeFileSync(sw, text.replace(LINE1, `const C='${name}';`));
  console.log(`✓ app/sw.js cache name: ${name}`);
}
