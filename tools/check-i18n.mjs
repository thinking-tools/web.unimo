#!/usr/bin/env node
/**
 * Checks that every language file has exactly the keys the page asks for, and that the language picker, the
 * list in the page's head and the language files all name the same languages.
 * Run from the repository root:  node tools/check-i18n.mjs
 */
import { readFileSync, readdirSync } from 'node:fs';

const LANG_DIR = 'assets/lang';
const html = readFileSync('index.html', 'utf8');

const wanted = new Set();
for (const [, key] of html.matchAll(/data-i18n="([^"]+)"/g)) wanted.add(key);
for (const [, pairs] of html.matchAll(/data-i18n-attr="([^"]+)"/g))
  for (const pair of pairs.split(';')) wanted.add(pair.trim().split(':')[1]);

// English is the page itself, so the picker offers one language more than there are files
const picker = html.match(/<select id="lang"[\s\S]*?<\/select>/)[0];
const offered = [...picker.matchAll(/<option value="([^"]+)"/g)].map(([, code]) => code).filter(code => code !== 'en');
const files = readdirSync(LANG_DIR)
  .filter(name => name.endsWith('.json'))
  .map(name => name.slice(0, -'.json'.length));

// the script in the page's head sends for a visitor's language before the picker exists, from a list of its own
const [, listed] = html.match(/var translated = \[([^\]]*)\]/) ?? [];
const sentFor = [...(listed ?? '').matchAll(/'([^']+)'/g)].map(([, code]) => code);

let problems = 0;
for (const code of offered.filter(code => !files.includes(code))) {
  problems++;
  console.log(`${code}: offered in the picker, but ${LANG_DIR}/${code}.json does not exist`);
}
if ([...sentFor].sort().join() !== [...files].sort().join()) {
  problems++;
  console.log(`the head of index.html lists [${sentFor}] as translated, but ${LANG_DIR}/ holds [${files}]`);
}
for (const code of files) {
  const have = new Set(Object.keys(JSON.parse(readFileSync(`${LANG_DIR}/${code}.json`, 'utf8'))));
  const missing = [...wanted].filter(key => !have.has(key));
  const unused = [...have].filter(key => !wanted.has(key));
  const isUnlisted = !offered.includes(code);
  problems += missing.length + unused.length + (isUnlisted ? 1 : 0);
  console.log(
    `${code}.json: ${have.size} keys` +
      (missing.length ? `, missing: ${missing.join(', ')}` : '') +
      (unused.length ? `, unused: ${unused.join(', ')}` : '') +
      (isUnlisted ? ', not offered in the picker' : ''),
  );
}
process.exit(problems ? 1 : 0);
