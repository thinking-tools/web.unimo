/**
 * Only yours: the memo from the bar, shown where it is. On the phone it reads as it was written. As it leaves it
 * is sealed, and on our server that is all there is of it. A laptop of the visitor's opens it again. The mark of
 * the video it links to goes with it, and is a shapeless blob while the memo is sealed. Then come three things
 * about the account. The scene is markup in index.html, which lists the steps and says at which of
 * them each part is there (road.js, stepsOf). This file says which step it is, and between the steps it turns
 * the memo's characters, one for one, as the page scrolls.
 *
 * The sealing is real. The memo is encrypted here, in the visitor's browser, with the cipher the apps use for
 * what they keep (AES-256-GCM) and a key made for this visit that never leaves the page. What the scene shows as
 * sealed is the beginning of what comes out, a character for each of the memo's own. Where a browser will not
 * encrypt (a page that was not served securely has no `crypto.subtle`), the scene keeps the characters the
 * markup has, which were sealed the same way when the page was written.
 */
import { clamp01, followRoad, stepsOf, stretch } from './road.js';

const band = document.querySelector('.seal');
const stage = band.querySelector('.seal-stage');
const memo = band.querySelector('.seal-text');
const lines = [...memo.querySelectorAll('.seal-line')];
const places = band.querySelector('.seal-places');
const placeNames = [...places.querySelectorAll('[data-i18n]')];
const cargo = places.querySelector('.seal-cargo-shape');

/* ── the memo, a character at a time ──────────────────── */

/**
 * Every character of the memo has a cell, which shows it as it was written or as it is sealed. The memo's pieces
 * are its lines and the space between two of them, each with its words in `data-plain`.
 */
const cells = [...memo.querySelectorAll('[data-plain]')].flatMap(piece => {
  const sealed = piece.textContent;
  piece.textContent = '';
  return [...piece.dataset.plain].map((plain, i) => ({
    cell: piece.appendChild(document.createElement('span')),
    plain,
    sealed: sealed[i],
  }));
});

/** The turning passes over the memo as a wave. This many characters at its front wear the mark's colours. */
const WAVE = 8;

/** Where the memo is: 0 on the phone, 1 on our server, 2 on the laptop, and in between on its way. */
let where;

/**
 * Sealing and opening both pass over the memo from its first character to its last. On the way to the server
 * the characters behind the wave's front are sealed; on the way to the laptop they are readable again.
 */
function turnCells() {
  const isOpening = where > 1;
  const front = (isOpening ? where - 1 : where) * (cells.length + WAVE);
  cells.forEach((entry, i) => {
    const isBehind = i < front;
    const isPlain = isBehind === isOpening;
    const char = isPlain ? entry.plain : entry.sealed;
    const look = isBehind && i >= front - WAVE ? 'is-turning' : isPlain ? 'is-plain' : 'is-sealed';
    if (entry.char === char && entry.look === look) return;
    entry.char = entry.cell.textContent = char;
    entry.look = entry.cell.className = look;
  });
}

/* ── what stands for the memo ─────────────────────────── */

/**
 * Over the places stands the mark of what the memo links to, a video. The markup draws its outline as our server
 * has it, a blob, and keeps the video's own in `data-plain`: the same curves with other numbers. So every outline
 * on the way from one to the other is the numbers in between.
 */
const NUMBER = /-?\d+(?:\.\d+)?/g;
const numbersOf = path => path.match(NUMBER).map(Number);
const outline = { plain: numbersOf(cargo.dataset.plain), sealed: numbersOf(cargo.getAttribute('d')) };

/** `sealed` runs from 0, the video's mark, to 1, the blob. */
function shapeCargo(sealed) {
  const numbers = outline.plain.map((plain, i) => plain + (outline.sealed[i] - plain) * sealed);
  cargo.setAttribute(
    'd',
    cargo.dataset.plain.replace(NUMBER, () => numbers.shift().toFixed(2)),
  );
}

function carry(to) {
  if (to === where) return;
  where = to;
  places.style.setProperty('--place', where); // the mark stands over the place, or between two
  const sealed = 1 - Math.abs(where - 1); // the further from our server, the more itself
  places.style.setProperty('--sealed', sealed); // its colour and what it shows inside are the styles'
  shapeCargo(sealed);
  const nearest = Math.round(where);
  placeNames.forEach((name, i) => name.classList.toggle('is-here', i === nearest));
  turnCells();
}

/* ── the road ─────────────────────────────────────────── */

const steps = stepsOf(band);
/** Where there is no road to scroll along, the scene shows the step its markup names for that. */
const STILL = Number(band.dataset.still);
/** The memo leaves the phone this far into the first step, and is open on the laptop this far into the third. */
const LEAVES_AT = 0.35;
const OPEN_BY = 0.65;

/** `played` counts steps and the part of one that has been scrolled: 1.5 is halfway through the second. */
const whereAt = played =>
  played < 1 ? clamp01((played - LEAVES_AT) / (1 - LEAVES_AT)) : 1 + clamp01((played - 2) / OPEN_BY);

followRoad(
  band,
  stage,
  (progress, isHeld) => {
    steps.show(isHeld ? stretch(progress, steps.count) : STILL);
    carry(whereAt(isHeld ? progress * steps.count : STILL));
  },
  ({ caughtAt }) => caughtAt,
);

/* ── the sealing ──────────────────────────────────────── */

const CIPHER = 'AES-GCM';
/** AES-GCM is given a number it has never used with this key before; what a server holds begins with it. */
const NONCE_BYTES = 12;

/** The memo as a server would hold it: that number and the sealed bytes, written out in base64. */
async function seal(memo) {
  const key = await crypto.subtle.generateKey({ name: CIPHER, length: 256 }, false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(NONCE_BYTES));
  const written = new TextEncoder().encode(memo);
  const sealed = new Uint8Array(await crypto.subtle.encrypt({ name: CIPHER, iv }, key, written));
  return btoa(String.fromCharCode(...iv, ...sealed));
}

// a browser that refuses keeps the scene as the markup has it, the same as one that cannot
const held = crypto.subtle && (await seal(lines.map(line => line.dataset.plain).join(' ')).catch(() => null));

if (held) {
  cells.forEach((entry, i) => (entry.sealed = held[i]));
  band.classList.add('is-live'); // the styles show the line that says so
  turnCells();
}
