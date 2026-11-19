/**
 * The finale: "One more thing…", and then sums, typed into the bar as the page scrolls, each with its answer
 * under it as large as the screen takes. The scene is markup in index.html, which lists the steps and says at
 * which of them each part is there (road.js, stepsOf). This file says which step it is and types the step's sum.
 *
 * The answers are not worked out here. Each sum carries, in `data-answers`, what the apps' own calculator
 * answers once so many of its characters are typed (tools/sums.mjs prints that), and this file shows the one
 * that goes with what is typed so far.
 *
 * The chapter is played on black whatever the visitor's theme, and the page gets there by fading: while the
 * stretch before the chapter (`.dusk`) is scrolled through, the whole screen goes dark at once. This file says
 * how dark (`--night` on the page, from 0 to 1), and marks the page `is-night` from halfway, which is when the
 * top bar, faded out by then, turns dark.
 *
 * At the end of the night the page comes back to white the same way: while its last stretch (`.dawn`) is
 * scrolled through, the whole screen goes white. This file says how white (`--day`), and from halfway marks the
 * page `is-day` and no longer `is-night`, which is when the top bar, faded out once more, turns light.
 */
import { clamp01, followRoad, stepsOf, stretch } from './road.js';

const root = document.documentElement;
const band = document.querySelector('.finale');
const stage = band.querySelector('.finale-stage');
const dusk = document.querySelector('.dusk');
const dawn = document.querySelector('.dawn');
const launcher = band.querySelector('.launcher');
const typed = launcher.querySelector('.launcher-typed');
const answer = band.querySelector('.sum-answer');

const steps = stepsOf(band);
/** Where there is no road to scroll along, the scene shows the step its markup names for that, its sum whole. */
const STILL = Number(band.dataset.still);
/** This far into a step every sum is whole. */
const WHOLE = 0.999;
/** A sum is all typed this far into its step, unless it says otherwise (`data-typed-by`). */
const TYPED_BY = 0.55;
/** A character the sum lingers on takes this many times as long to arrive as another. */
const LINGER = 3;

/**
 * A sum is one step's words for the bar, and the answers on the way to its last, the latest first. `chars` is
 * the length of its longest answer: the answers of one sum are all set at the size that one takes, so that a
 * figure which grows as the sum is typed grows in place.
 *
 * The characters arrive evenly, unless the sum says from which of them on it lingers (`data-lingers-from`, a
 * count of characters): where every further character changes the answer, there is something to watch.
 * `arrives` holds, for each character, how far through the typing it comes: 0 for the first, and less than 1
 * for the last.
 */
const sums = [...band.querySelectorAll('.sum')].map(sum => {
  const letters = [...sum.textContent];
  const answers = Object.entries(JSON.parse(sum.dataset.answers))
    .map(([length, text]) => ({ length: Number(length), text }))
    .reverse();
  const lingersFrom = Number(sum.dataset.lingersFrom ?? Infinity);
  const takes = letters.map((_, i) => (i >= lingersFrom ? LINGER : 1));
  const all = takes.reduce((total, time) => total + time, 0);
  let elapsed = 0;
  const arrives = takes.map(time => {
    const arrival = elapsed / all;
    elapsed += time;
    return arrival;
  });
  return {
    at: Number(sum.dataset.at),
    until: Number(sum.dataset.until ?? Infinity),
    typedBy: Number(sum.dataset.typedBy ?? TYPED_BY),
    letters,
    arrives,
    answers,
    chars: Math.max(...answers.map(({ text }) => [...text].length)),
  };
});

/** `played` counts steps and the part of one that has been scrolled: 1.5 is halfway through the second. */
function write(played) {
  const sum = sums.find(({ at, until }) => played >= at && played < until);
  // the first character comes as soon as the typing starts, and with the typing done they are all there
  const typedSoFar = sum ? clamp01((played - sum.at) / sum.typedBy) : 0;
  const count = sum ? sum.arrives.filter(arrival => arrival < typedSoFar).length : 0;
  const text = sum ? sum.letters.slice(0, count).join('') : '';
  const found = sum?.answers.find(({ length }) => length <= count)?.text ?? '';

  if (typed.textContent !== text) {
    typed.textContent = text;
    launcher.toggleAttribute('data-typing', text !== '');
  }
  if (answer.textContent !== found) {
    answer.textContent = answer.dataset.answer = found; // the styles draw its glow from the attribute
    answer.style.setProperty('--chars', sum?.chars ?? 1); // and size it by the length of the sum's longest answer
  }
}

/** How much of a stretch has come up the screen: none until its first line reaches the foot, all once its last does. */
function risen(stretch) {
  const { top, height } = stretch.getBoundingClientRect();
  return clamp01((innerHeight - top) / height);
}

/**
 * Night falls while the dusk comes up the screen, and is complete when the chapter itself comes into view. Day
 * breaks the same way while the dawn comes up, and is complete when what follows the night does.
 */
function dim() {
  const night = risen(dusk);
  const day = risen(dawn);
  root.style.setProperty('--night', night);
  root.style.setProperty('--day', day);
  root.classList.toggle('is-night', night >= 0.5 && day < 0.5);
  root.classList.toggle('is-day', day >= 0.5);
}

followRoad(
  band,
  stage,
  (progress, isHeld) => {
    steps.show(isHeld ? stretch(progress, steps.count) : STILL);
    write(isHeld ? progress * steps.count : STILL + WHOLE);
    dim();
  },
  ({ caughtAt }) => caughtAt,
);
