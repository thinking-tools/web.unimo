/**
 * The feature stages: a phone and a laptop, drawn, each playing one short scene on a loop.
 *
 * A scene is markup. Inside a `.stage`:
 *   data-at="n"       the element switches on at step n …
 *   data-until="m"    … and off again at step m
 *   data-go="n"       a packet crosses over during step n (class "plain": its text stays readable)
 * The stage names its scene (data-scene); SCENES says how long each of its steps lasts.
 * This file keeps time and nothing else; the stylesheet does the moving.
 */
import { tr, onLang } from './i18n.js';

/** How long each step of a scene lasts, in ms. */
const RELAYED = [500, 1100, 1000, 700, 1100, 900, 3400]; // typed, sealed to unimo, passed on, received, answered
const SCENES = {
  clip: [700, 800, 800, 700, 1000, 600, 2600],
  notif: [600, 1100, 1000, 3000],
  call: [500, 1200, 1000, 3200],
  ask: RELAYED,
  ai: RELAYED,
};
const SCRAMBLE_EVERY_MS = 80;
const VISIBLE_SHARE = 0.35;

const isApple = /Mac|iPhone|iPad/.test(navigator.userAgent);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Four random bytes, as a sealed packet's face: what travels is unreadable on the way. */
const scrambled = () =>
  [...crypto.getRandomValues(new Uint8Array(4))].map(byte => byte.toString(16).padStart(2, '0')).join('·');

function initStage(stage) {
  const steps = SCENES[stage.dataset.scene];
  const toggle = stage.parentElement.querySelector('.stage-toggle');
  const packets = [...stage.querySelectorAll('[data-go]')];
  const timed = [...stage.querySelectorAll('[data-at]')];

  let timers = [];
  let paused = false;
  let inView = false;

  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const stopClock = () => {
    timers.forEach(clearTimeout);
    timers = [];
    for (const packet of packets) packet.classList.remove('go');
    stage.classList.remove('playing');
  };
  const canPlay = () => !reducedMotion && !paused && inView && !document.hidden;

  /** Puts the scene at one step. With a duration the step plays; without, it is simply shown. */
  function showStep(step, duration) {
    stage.dataset.step = step;
    for (const el of timed) el.classList.toggle('on', step >= +el.dataset.at && step < +(el.dataset.until ?? Infinity));
    if (duration) for (const packet of packets) if (step === +packet.dataset.go) send(packet, duration);
  }

  function send(packet, duration) {
    packet.style.setProperty('--run', `${duration}ms`);
    packet.classList.add('go');
    if (!packet.classList.contains('plain'))
      for (let t = 0; t < duration; t += SCRAMBLE_EVERY_MS) later(() => { packet.textContent = scrambled(); }, t);
    later(() => packet.classList.remove('go'), duration);
  }

  /** The scene's last frame, still: for a paused stage, reduced motion, and while out of sight. */
  function rest() {
    stopClock();
    showStep(steps.length - 1);
  }

  function play() {
    stopClock();
    if (!canPlay()) return rest();

    let elapsed = 0;
    steps.forEach((duration, step) => {
      later(() => showStep(step, duration), elapsed);
      elapsed += duration;
    });
    later(play, elapsed);
    stage.classList.add('playing');
  }

  function labelToggle() {
    toggle.setAttribute('aria-label', tr(paused ? 'st.play' : 'st.pause'));
    toggle.setAttribute('aria-pressed', String(paused));
  }

  toggle.addEventListener('click', () => {
    paused = !paused;
    labelToggle();
    play();
  });
  document.addEventListener('visibilitychange', play);
  new IntersectionObserver(
    ([entry]) => {
      inView = entry.intersectionRatio >= VISIBLE_SHARE;
      play();
    },
    { threshold: VISIBLE_SHARE },
  ).observe(stage);
  onLang(labelToggle);

  labelToggle();
  toggle.hidden = reducedMotion;
  stage.classList.add('live');
  rest();
}

/** On a Mac the paste shortcut is ⌘V. Translation has just rewritten the key, so this runs after each language change. */
function namePasteKey() {
  if (isApple) for (const key of document.querySelectorAll('.paste-key')) key.textContent = '⌘';
}

export function initStages() {
  onLang(namePasteKey);
  namePasteKey();
  document.querySelectorAll('.stage').forEach(initStage);
}
