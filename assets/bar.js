/**
 * The bar's road down the page. Scrolling types into the bar and its list answers: an app, a memo, a person.
 * With each of them the bar changes mode, as the app's does when it searches one kind of thing only.
 * Everything shown is markup in index.html; this file only decides how much of it shows at each point of the
 * road. Nothing runs on a timer: the picture depends on how far the page has scrolled and on nothing else, so
 * scrolling back plays it backwards.
 */
import { whenTextChanges } from './lang.js';
import { clamp01, followRoad } from './road.js';

const journey = document.querySelector('.journey');
const stage = journey.querySelector('.stage');
const launcher = stage.querySelector('.launcher');
const typed = launcher.querySelector('.launcher-typed');
const caret = launcher.querySelector('.launcher-caret');
const list = launcher.querySelector('.launcher-list');
const captions = [...stage.querySelectorAll('.does-step')];
/** What the bar shows of its mode: the mark on its mode button and the placeholder, one of each per mode (`data-in`). */
const modeParts = [...launcher.querySelectorAll('[data-in]')];

/**
 * The road is a stretch for each take, and before the first a short one in which the bar has arrived at its
 * place and nothing is typed yet: a beat to take the page's tempo in. It is this long, in takes.
 */
const LEAD = 0.15;
/** Of one take's stretch of the road, typing in fills the first part and typing back out the last. */
const TYPED_IN_BY = 0.42;
const ERASED_FROM = 0.86;
/**
 * The aura behind the bar shows whole on the first screen. While the bar rises to its place it settles to this
 * share of itself, which it keeps for the road, and over the last stretch of the road it goes out, so that the
 * stage scrolls on without it.
 */
const AURA_AT_WORK = 0.55;
const AURA_OUT_FROM = 0.88;
/** A row answers from the second letter, unless it names its own letters (data-from, data-until). */
const ANSWERS_FROM = 2;

/** A take: one query, the caption and the mode it goes with, the rows that answer it and the letters each row is there for. */
const takes = [...list.querySelectorAll('.take')].map(take => ({
  take,
  query: take.querySelector('.take-query'),
  caption: captions[Number(take.dataset.caption)],
  mode: take.dataset.mode,
  rows: [...take.querySelectorAll('.result')].map(row => ({
    row,
    from: Number(row.dataset.from ?? ANSWERS_FROM),
    until: Number(row.dataset.until ?? Infinity),
  })),
}));

/** The bar in its frame is this many of its own em tall, with a gap under it; a row of the list about this many. */
const BAR_EMS = 3.5;
const ROW_EMS = 3.375;

/** Where the road begins, as a scroll position: the aura goes by it too. */
let roadStart = 0;

/**
 * The road begins once the bar has risen to the place it is held at, and not before its longest list is in view
 * there: typing while the bar is still on its way up would have the first answer over before the bar has
 * settled, and typing from the very top of the page would drop that list off the bottom of the screen.
 */
function begin({ caughtAt, heldAt }) {
  const mostRows = Math.max(
    ...takes.flatMap(({ query, rows }) =>
      [...query.textContent].map((_, i) => rows.filter(({ from, until }) => i + 1 >= from && i + 1 < until).length),
    ),
  );
  const em = parseFloat(getComputedStyle(launcher).fontSize);
  const whereTheBarRests = caughtAt + heldAt; // from the top of the page: the stage starts with the bar
  const whereTheListFits = whereTheBarRests + em * (BAR_EMS + mostRows * ROW_EMS) + em - innerHeight;
  roadStart = Math.max(caughtAt, whereTheListFits, 0);
  return roadStart;
}

let glow;

/** How much of the aura shows: all of it at the top of the page, less on the road, none at the road's end. */
function light(progress, isHeld) {
  const risen = roadStart > 0 ? clamp01(scrollY / roadStart) : 1;
  const left = 1 - clamp01((progress - AURA_OUT_FROM) / (1 - AURA_OUT_FROM));
  const next = isHeld ? ((1 - (1 - AURA_AT_WORK) * risen) * left).toFixed(3) : '';
  if (next === glow) return;
  glow = next;
  // where there is no road the aura is as the styles have it
  if (next) stage.style.setProperty('--aura', next);
  else stage.style.removeProperty('--aura');
}

let drawn = '';

function draw(progress, isHeld) {
  light(progress, isHeld);

  const along = Math.max(0, progress * (takes.length + LEAD) - LEAD);
  const index = Math.min(Math.floor(along), takes.length - 1);
  const within = along - index;
  const { take, query, caption, mode, rows } = takes[index];
  const isLastTake = index === takes.length - 1;

  const letters = [...query.textContent];
  const typedIn = clamp01(within / TYPED_IN_BY);
  const erased = isLastTake ? 0 : clamp01((within - ERASED_FROM) / (1 - ERASED_FROM)); // the last answer stays
  const isErasing = erased > 0;
  // rounded so that the first letter comes at once, and the field stands empty for a beat before the next query
  const count = isErasing ? Math.floor(letters.length * (1 - erased)) : Math.ceil(letters.length * typedIn);
  const text = letters.slice(0, count).join('');

  const picture = `${index}:${text}:${isErasing}`;
  if (picture === drawn) return;
  drawn = picture;

  typed.textContent = text;
  launcher.toggleAttribute('data-typing', text !== '');

  // the list answers while the query is typed and held, and closes as it is typed back out
  let answering = 0;
  for (const { row, from, until } of rows) {
    row.hidden = isErasing || count < from || count >= until;
    // the first row of a list is the selected one, as in the app
    row.classList.toggle('is-selected', !row.hidden && answering === 0);
    if (!row.hidden) answering++;
  }
  list.hidden = answering === 0;
  for (const other of takes) other.take.hidden = other.take !== take;

  // A caption comes with the first letter and stays until the next kind of thing is being typed. While the list
  // is longer than one row it hangs over the caption's place, so the caption waits for it to narrow.
  const hasBegun = index > 0 || text !== '' || isErasing;
  const current = hasBegun && answering <= 1 ? caption : null;
  for (const other of captions) other.classList.toggle('is-current', other === current);

  // The bar is in its take's mode from that take's first letter until the next one's, the empty field in between
  // included. Before the first letter of all it searches everything.
  const shownMode = hasBegun ? mode : 'all';
  for (const part of modeParts) part.toggleAttribute('hidden', part.dataset.in !== shownMode);

  // a caret that has just moved shows solid, as in the app: its blink starts over
  caret.style.animationName = 'none';
  void caret.offsetWidth;
  caret.style.animationName = '';
}

const redraw = followRoad(journey, stage, draw, begin);

// the queries are page text: in another language the bar has other words to type, so it draws from scratch
whenTextChanges(() => {
  drawn = '';
  redraw();
});
