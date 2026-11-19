/**
 * The desk: a laptop and a phone, what passes between them, and then the question that was passed, put to the
 * agent in a bar of its own. The scene is markup in index.html, which also lists its steps and says at which of
 * them each part is there (road.js, stepsOf); this file only says which step it is. It also sets the scene's two
 * clocks and starts the agent's spinner.
 *
 * The steps are played on two roads, one after the other. The first holds the whole stage: the devices, and
 * under them the caption and the bar. Then the stage is let go and scrolls on, and its lower part (`.ask`, the
 * caption and the bar) is caught again further up the screen and held for a road of its own, on which the steps
 * from its `data-from` on are played.
 */
import { followRoad, stepsOf, stretch } from './road.js';
import { spin } from './spinner.js';

const desk = document.querySelector('.desk');
const stage = desk.querySelector('.desk-stage');
const ask = desk.querySelector('.ask');

/* ── the steps ────────────────────────────────────────── */

const steps = stepsOf(desk);
/** The first step of the second road; the ones before it are the first road's. */
const ASK_FROM = Number(ask.dataset.from);
/** Where there is no road to scroll along, the desk shows the step its markup names for that. */
const STILL = Number(desk.dataset.still);
/** The first road starts this many screens before the desk is caught, so its first step is the desk arriving. */
const LEAD_SCREENS = 0.3;

/** How far along each road the page has scrolled, from 0 to 1. */
const along = { desk: 0, ask: 0 };
let hasRoads = false;

function show() {
  // the second road has begun once the page has scrolled any way along it
  const played = along.ask > 0 ? ASK_FROM + stretch(along.ask, steps.count - ASK_FROM) : stretch(along.desk, ASK_FROM);
  steps.show(hasRoads ? played : STILL);
}

followRoad(
  desk,
  stage,
  (progress, isHeld) => {
    along.desk = progress;
    hasRoads = isHeld;
    show();
  },
  ({ caughtAt }) => caughtAt - LEAD_SCREENS * innerHeight,
);

// The second road is the stage's own distance, scrolled once the stage itself has been let go. It ends where
// the first does, at the end of the desk.
followRoad(
  desk,
  ask,
  progress => {
    along.ask = progress;
    show();
  },
  ({ caughtAt }) => caughtAt,
  stage,
);

/* ── the agent's spinner ──────────────────────────────── */

for (const canvas of desk.querySelectorAll('canvas.spinner')) spin(canvas);

/* ── the clocks ───────────────────────────────────────── */

const clocks = [...desk.querySelectorAll('[data-clock]')];
/** The time of day as the visitor's own devices write it: 21:41 for some, 9:41 PM for others. */
const timeOfDay = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
const MINUTE_MS = 60_000;

/**
 * Sets the clocks to the visitor's time, now and at the turn of every minute: the one thing on the page that goes
 * by a timer and not by scrolling. A clock marked `brief` leaves out the AM or PM, as a phone's status bar does.
 */
function tellTime() {
  const parts = timeOfDay.formatToParts(new Date());
  const written = kept => kept.reduce((text, part) => text + part.value, '').trim();
  const full = written(parts);
  const brief = written(parts.filter(part => part.type !== 'dayPeriod'));
  for (const clock of clocks) clock.textContent = clock.dataset.clock === 'brief' ? brief : full;
  setTimeout(tellTime, MINUTE_MS - (Date.now() % MINUTE_MS));
}

tellTime();
