/**
 * Page text. English is the markup itself; every other language is one file in /assets/lang/.
 * No cookies, no storage: which language to show is the caller's to decide and to remember.
 *
 * In the markup:
 *   data-i18n="key"                     the element's content
 *   data-i18n-attr="attr:key; attr:key" attributes
 */
const root = document.documentElement;
const textEls = [...document.querySelectorAll('[data-i18n]')];
const attrEls = [...document.querySelectorAll('[data-i18n-attr]')];

const attrPairs = el => el.dataset.i18nAttr.split(';').map(pair => pair.trim().split(':'));

/** English, read off the page before anything repaints it. */
const english = {};
for (const el of textEls) english[el.dataset.i18n] ??= el.innerHTML;
for (const el of attrEls) for (const [attr, key] of attrPairs(el)) english[key] ??= el.getAttribute(attr);

/** Every language shown so far, by its code: a language is fetched once. */
const dicts = new Map([['en', english]]);
const listeners = [];
let current = 'en';
let latestRequest = 0;

export const lang = () => current;

/** Has `listener` called each time the page's text has been replaced: for a script that has read text off the page. */
export function whenTextChanges(listener) {
  listeners.push(listener);
}

function paint() {
  const dict = dicts.get(current);
  const text = key => dict[key] ?? english[key];
  root.lang = current;
  // every string comes from this site's own files, never from a visitor, so innerHTML is safe here
  for (const el of textEls) el.innerHTML = text(el.dataset.i18n);
  for (const el of attrEls) for (const [attr, key] of attrPairs(el)) el.setAttribute(attr, text(key));
}

async function load(code) {
  if (dicts.has(code)) return;
  // the script in the head has already sent for the language the visitor arrives with: this picks that answer up
  const response = await fetch(new URL(`./lang/${code}.json`, import.meta.url));
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  dicts.set(code, await response.json());
}

/** Shows the page in `code`, or in English when that language cannot be loaded. */
export async function setLang(code) {
  const request = ++latestRequest;
  let next = code;
  try {
    await load(code);
  } catch (e) {
    console.error('[lang] could not load', code, e);
    next = 'en';
  }
  if (request !== latestRequest) return; // a later choice is on its way: this one no longer counts
  // the page is written in English, so a visitor who reads English is shown it as it came: nothing is repainted
  if (next !== current) {
    current = next;
    paint();
    for (const listener of listeners) listener();
  }
  root.classList.remove('lang-wait');
}
