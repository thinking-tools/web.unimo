/**
 * Writes what a web server has to serve, and nothing else, into `dist/`:
 *
 *   node tools/dist.mjs      (or: bun tools/dist.mjs)
 *
 * The site has no build step, so this only copies: the page, its icons, and `assets/` without the files of the
 * page before the rebuild (index2.html's). Then it reads the copies and says so if one of them names a file of
 * the site that is not among them. `dist/` is what Caddy's `root` points at (README, "Publishing").
 */
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const site = fileURLToPath(new URL('../', import.meta.url));
const out = join(site, 'dist');

/** The page and what stands beside it at the site's root. */
const TOP = [
  'index.html',
  'favicon.ico',
  'favicon-16x16.png',
  'favicon-32x32.png',
  'apple-touch-icon.png',
  'android-chrome-192x192.png',
  'android-chrome-512x512.png',
  'site.webmanifest',
];
/** In `assets/`, the files of the page before the rebuild, and what a Mac leaves behind. */
const LEFT_OUT = new Set([
  'site.css',
  'main.js',
  'i18n.js',
  'bar-demo.js',
  'stages.js',
  'icons.svg',
  'rings.svg',
  '.DS_Store',
]);

rmSync(out, { recursive: true, force: true });
mkdirSync(out);
for (const name of TOP) cpSync(join(site, name), join(out, name));
cpSync(join(site, 'assets'), join(out, 'assets'), {
  recursive: true,
  filter: source => !LEFT_OUT.has(basename(source)),
});

/** Every file under a folder, as paths from `dist/`. */
function filesIn(folder) {
  return readdirSync(folder, { withFileTypes: true }).flatMap(entry =>
    entry.isDirectory() ? filesIn(join(folder, entry.name)) : [relative(out, join(folder, entry.name))],
  );
}

const files = filesIn(out);
const size = files.reduce((total, file) => total + statSync(join(out, file)).size, 0);

// A file of the site is named from its root ("/assets/…") in the page, its styles and its manifest, and from
// beside the script ("./…") in a script. Addresses made up while the page runs are not found this way: the
// language files, which lang.js names by their code.
const named = new Set();
for (const file of files.filter(name => /\.(html|css|js|webmanifest)$/.test(name))) {
  const text = readFileSync(join(out, file), 'utf8');
  for (const [, path] of text.matchAll(/["'(]\/((?:assets\/)?[\w./-]+\.\w+)["')]/g)) named.add(path);
  if (file.endsWith('.js'))
    for (const [, path] of text.matchAll(/["']\.\/([\w./-]+\.\w+)["']/g)) named.add(`assets/${path}`);
}
const missing = [...named].filter(path => !existsSync(join(out, path))).sort();

console.log(`dist/: ${files.length} files, ${(size / 1024 / 1024).toFixed(1)} MB`);
if (missing.length) {
  console.error(`named by the page but not in dist/:\n  ${missing.join('\n  ')}`);
  process.exit(1);
}
