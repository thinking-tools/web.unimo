/**
 * Starts the page. The language, the menu, the name in the top bar and the download button belong to the first
 * screen and are seen to at once; what lies further down (the bar's road, the desk's, the memo that seals itself)
 * starts once that screen has been painted.
 */
import { lang, setLang } from './lang.js';

const root = document.documentElement;
const picker = document.getElementById('lang');
const pickerName = document.querySelector('.lang-name');
const menu = document.getElementById('menu');
const menuButton = document.querySelector('.menu-button');
const isWide = matchMedia('(width >= 45rem)');

/* ── language ─────────────────────────────────────────── */

/** The picker's options are the list of languages the page speaks. */
const spoken = code => ([...picker.options].some(option => option.value === code) ? code : 'en');
const twoLetters = tag => tag.slice(0, 2).toLowerCase();

const deviceLang = spoken(twoLetters(navigator.language || 'en'));
const askedLang = new URLSearchParams(location.search).get('lang');

async function showLang(code) {
  await setLang(code);
  picker.value = lang();
  pickerName.textContent = picker.selectedOptions[0].textContent;
}

/** A choice lives in the address as ?lang=xx, and only when it differs from what the device would get anyway. */
function rememberLang() {
  const url = new URL(location.href);
  if (lang() === deviceLang) url.searchParams.delete('lang');
  else url.searchParams.set('lang', lang());
  history.replaceState(null, '', url);
}

picker.addEventListener('change', async () => {
  closeMenu();
  await showLang(picker.value);
  rememberLang();
});

/* ── the menu the links wait in on a phone ────────────── */

function closeMenu() {
  if (menu.matches(':popover-open')) menu.hidePopover();
}

menu.addEventListener('toggle', event => menuButton.setAttribute('aria-expanded', String(event.newState === 'open')));
// a link was followed: the menu has done its work
menu.addEventListener('click', event => {
  if (event.target.closest('a')) closeMenu();
});

/* ── the name in the top bar ──────────────────────────── */

const topBar = document.querySelector('.top');
const headline = document.getElementById('hero-title');
let headlineWatch;

/**
 * Once the headline has slipped under the top bar the page counts as scrolled, and on a phone the name beside the
 * mark gives up its room (the stylesheet in index.html). The browser reports the crossing, so nothing is measured
 * while the page scrolls. The line that is crossed is the bar's lower edge, so the watch is set up again when
 * the bar changes height.
 */
function watchHeadline() {
  headlineWatch?.disconnect();
  headlineWatch = new IntersectionObserver(
    entries => {
      const { boundingClientRect, rootBounds } = entries.at(-1);
      root.classList.toggle('is-scrolled', boundingClientRect.top < rootBounds.top);
    },
    { rootMargin: `-${topBar.offsetHeight}px 0px 0px`, threshold: 1 },
  );
  headlineWatch.observe(headline);
}

isWide.addEventListener('change', () => {
  // on a wide screen the links stand in the bar, where an open popover would lift them out of it
  if (isWide.matches) closeMenu();
  watchHeadline(); // the bar is taller there
});

/* ── the download button ──────────────────────────────── */

/** The button takes the address of the visitor's own system from the list under it. */
function aimDownload() {
  const os = root.dataset.os; // named by the script in the head, before first paint
  const mine = os && document.querySelector(`.platforms a[data-os="${os}"]`);
  if (mine) document.getElementById('download').href = mine.href;
}

aimDownload();
watchHeadline();
await showLang(askedLang ? spoken(twoLetters(askedLang)) : deviceLang);

/* ── what lies further down ───────────────────────────── */

// The roads and the memo that seals itself lie below the first screen, so their scripts wait for it to be
// painted: for the next frame, and one turn of the event loop past it. Should they fail to arrive, the page falls
// back to how it reads without scripts.
requestAnimationFrame(() =>
  setTimeout(async () => {
    try {
      await Promise.all([import('./bar.js'), import('./desk.js'), import('./seal.js')]);
    } catch (e) {
      console.error('[unimo] the scripts further down could not start', e);
      root.classList.remove('js');
    }
  }),
);
