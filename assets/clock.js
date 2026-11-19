/**
 * The clocks on the page's drawn devices (the desk's laptop and phone, the quiet phone) tell the visitor's time,
 * in the visitor's manner: 21:41 for some, 9:41 PM for others. They are set now and at the turn of every minute,
 * which is the one thing on the page that goes by a timer and not by scrolling. Without scripts they say 9:41.
 *
 * A clock is any element marked `data-clock`. One marked `data-clock="brief"` leaves out the AM or PM, as a
 * phone's status bar does.
 */
const clocks = [...document.querySelectorAll('[data-clock]')];
const timeOfDay = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
const MINUTE_MS = 60_000;

function tellTime() {
  const parts = timeOfDay.formatToParts(new Date());
  const written = kept => kept.reduce((text, part) => text + part.value, '').trim();
  const full = written(parts);
  const brief = written(parts.filter(part => part.type !== 'dayPeriod'));
  for (const clock of clocks) clock.textContent = clock.dataset.clock === 'brief' ? brief : full;
  setTimeout(tellTime, MINUTE_MS - (Date.now() % MINUTE_MS));
}

tellTime();
