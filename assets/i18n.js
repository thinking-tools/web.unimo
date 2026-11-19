/**
 * Page text. English is the markup itself; every other language is one file in /i18n/.
 * The page follows the device language and ?lang=xx overrides it. No cookies, no storage.
 *
 * In the markup:
 *   data-i18n="key"                     the element's content
 *   data-i18n-attr="attr:key; attr:key" attributes (and `value` for a form field)
 * Text that only scripts draw has its English in the JSON block with id="strings".
 */
const SUPPORTED = ['en', 'cs', 'de', 'es', 'fr', 'pl'];
const root = document.documentElement;
const textEls = [...document.querySelectorAll('[data-i18n]')];
const attrEls = [...document.querySelectorAll('[data-i18n-attr]')];

const attrPairs = el => el.dataset.i18nAttr.split(';').map(pair => pair.trim().split(':'));

function readEnglish() {
  const out = JSON.parse(document.getElementById('strings').textContent);
  for (const el of textEls) out[el.dataset.i18n] ??= el.innerHTML;
  for (const el of attrEls) for (const [attr, key] of attrPairs(el)) out[key] ??= el.getAttribute(attr);
  return out;
}

const english = readEnglish();
let dict = english;
let current = 'en';
const listeners = new Set();

export const lang = () => current;

/** The text for a key. `vars` fills {placeholders}; a caller passing visitor input must escape it first. */
export const tr = (key, vars = {}) =>
  (dict[key] ?? english[key] ?? key).replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? '');

/** Runs `fn(lang)` after every repaint, so a script can redraw what it drew. */
export const onLang = fn => listeners.add(fn);

export const preferredLang = () =>
  (new URLSearchParams(location.search).get('lang') || navigator.language || 'en').slice(0, 2).toLowerCase();

function paint() {
  root.lang = current;
  // every string comes from this site's own files, never from a visitor, so innerHTML is safe here
  for (const el of textEls) el.innerHTML = tr(el.dataset.i18n);
  for (const el of attrEls)
    for (const [attr, key] of attrPairs(el)) {
      if (attr === 'value') el.value = tr(key);
      else el.setAttribute(attr, tr(key));
    }
  for (const fn of listeners) fn(current);
}

export async function setLang(wanted) {
  const next = SUPPORTED.includes(wanted) ? wanted : 'en';
  try {
    dict = next === 'en' ? english : await (await fetch(`/i18n/${next}.json`)).json();
    current = next;
  } catch (e) {
    console.error('[i18n] could not load', next, e);
    dict = english;
    current = 'en';
  }
  paint();
  root.classList.remove('lang-wait');
}
