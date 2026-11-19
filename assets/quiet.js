/**
 * Quiet: a home screen as phones usually have one, cleared until unimo's own is left, and then what the visitor
 * picked the phone up for, typed into it. The scene is markup in index.html, which lists the steps and says at
 * which of them each part is there (road.js, stepsOf). This file says which step it is. On the first step it
 * takes the clutter away piece by piece as the page scrolls, and on the steps that have words to type it types
 * them the same way.
 */
import { clamp01, followRoad, stepsOf, stretch } from './road.js';

const band = document.querySelector('.quiet');
const stage = band.querySelector('.quiet-stage');
const steps = stepsOf(band);
/** Where there is no road to scroll along, the scene shows the step its markup names for that. */
const STILL = Number(band.dataset.still);

/* ── the clutter ──────────────────────────────────────── */

/** What usually fills the screen, in the order it leaves: the widget, the apps row by row, the dock. */
const clutter = [...band.querySelectorAll('.quiet-widget, .quiet-apps i, .quiet-dock')];
/** It starts to leave this far into the first step, and the last of it is gone as that step ends. */
const CLEARS_FROM = 0.3;

/* ── the words ────────────────────────────────────────── */

/** A take is one step's words for the bar, and what they find. */
const takes = [...band.querySelectorAll('.quiet-take')].map(take => ({
  take,
  at: Number(take.dataset.at),
  until: Number(take.dataset.until ?? Infinity),
  query: take.querySelector('.quiet-query'),
}));
/** Where in the bar they are typed. */
const typed = band.querySelector('.quiet-typed');
/** The words are all there this far into their step, and what they find shows from then on. */
const TYPED_BY = 0.5;

/* ── the road ─────────────────────────────────────────── */

/** How far the road has been played, in steps and the part of one: 1.5 is halfway through the second. */
let played = STILL;

function draw() {
  const gone = Math.round(clamp01((played - CLEARS_FROM) / (1 - CLEARS_FROM)) * clutter.length);
  clutter.forEach((piece, i) => piece.classList.toggle('is-gone', i < gone));

  let text = '';
  for (const { take, at, until, query } of takes) {
    const letters = [...query.textContent];
    const isItsStep = played >= at && played < until;
    const count = isItsStep ? Math.ceil(clamp01((played - at) / TYPED_BY) * letters.length) : 0;
    if (isItsStep) text = letters.slice(0, count).join('');
    take.classList.toggle('is-found', count === letters.length); // the styles show what the words find
  }
  if (typed.textContent !== text) typed.textContent = text;
}

followRoad(
  band,
  stage,
  (progress, isHeld) => {
    played = isHeld ? progress * steps.count : STILL;
    steps.show(isHeld ? stretch(progress, steps.count) : STILL);
    draw();
  },
  ({ caughtAt }) => caughtAt,
);
