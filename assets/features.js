/**
 * Features: the long story, short. The panes and the lines round them are markup in index.html and are whole
 * without this file. This file only lights them as they come up the screen: a pane at once (`data-lights`),
 * the heading and the last line a word at a time (`data-lights-by-word`), and puts them out again when the
 * page is scrolled back. The styles decide what lit looks like (a lit pane's picture moves, for one), and
 * light everything themselves where a visitor asked for less motion.
 *
 * Nothing is measured while the page scrolls. Where everything stands is worked out once, and again when the
 * page changes shape or language; scrolling only compares those places with how far the page has come.
 */
import { whenTextChanges } from './lang.js';

const section = document.querySelector('.features');
const wholes = [...section.querySelectorAll('[data-lights]')];
const texts = [...section.querySelectorAll('[data-lights-by-word]')];
const motionIsWelcome = matchMedia('(prefers-reduced-motion: no-preference)');

/** A thing is lit once it is above this share of the screen's height. */
const LIT_ABOVE = 0.82;

/** What lights, with the place down the page at which it does, from the first to the last. */
let places = [];

/* ── the ciphers' names ───────────────────────────────── */

/** What a name is made of before it is itself: the characters sealed text is written in. */
const NOISE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
/** A name takes this long to come out of the noise, from its first character to its last. */
const DECODES_IN_MS = 900;

/**
 * The names in a pane (`data-decodes`) come out of noise when the pane lights. The markup has the name, and it
 * is only ever replaced from inside a frame, so where no frames are drawn the name simply stands.
 */
function decode(card) {
  if (!motionIsWelcome.matches) return;
  for (const el of card.querySelectorAll('[data-decodes]')) {
    const name = (el.dataset.decodes ||= el.textContent);
    const letters = [...name];
    const began = performance.now();
    cancelAnimationFrame(el.decoding);
    const frame = now => {
      const settled = Math.floor(((now - began) / DECODES_IN_MS) * letters.length);
      if (settled >= letters.length) {
        el.textContent = name;
        return;
      }
      el.textContent = letters
        .map((letter, i) =>
          i < settled || !/\w/.test(letter) ? letter : NOISE[Math.floor(Math.random() * NOISE.length)],
        )
        .join('');
      el.decoding = requestAnimationFrame(frame);
    };
    el.decoding = requestAnimationFrame(frame);
  }
}

/* ── the last line, a word at a time ──────────────────── */

/** The words of a text, each in a span of its own. A text the page has just repainted is plain again. */
function wordsOf(text) {
  if (text.firstElementChild) return [...text.children];
  const words = text.textContent.trim().split(/\s+/);
  text.textContent = '';
  text.classList.add('is-split'); // from here on its words are dim or lit, not the text as a whole
  return words.map((word, i) => {
    if (i) text.append(' ');
    const span = document.createElement('span');
    span.textContent = word;
    text.append(span);
    return span;
  });
}

/* ── where things stand, and what is lit ──────────────── */

/**
 * A pane's place is the middle of its picture, so that it lights with its picture in view. A word's place is
 * the top of its line, and then as much of a line further down as the word stands along it: so the words of
 * one line light one after the other, from its first to its last, while a line's height is scrolled.
 */
function measure() {
  const found = wholes.map(el => {
    const picture = el.querySelector('.art');
    // read off the layout, not the screen: a place must not depend on anything a pane does while it is unlit
    const top = el.offsetTop + el.offsetParent.getBoundingClientRect().top + scrollY;
    return { el, at: top + (picture ? picture.offsetHeight / 2 : 0) };
  });
  for (const text of texts) {
    const words = wordsOf(text);
    const box = text.getBoundingClientRect();
    const line = parseFloat(getComputedStyle(text).lineHeight);
    for (const el of words) {
      const { top, left } = el.getBoundingClientRect();
      found.push({ el, at: top + scrollY + ((left - box.left) / box.width) * line });
    }
  }
  places = found.sort((a, b) => a.at - b.at);
  light();
}

/** Lights what has come far enough and puts out the rest. Only what changes is touched. */
function light() {
  const front = scrollY + innerHeight * LIT_ABOVE;
  for (const { el, at } of places) {
    const isLit = at < front;
    if (isLit === el.classList.contains('is-lit')) continue;
    el.classList.toggle('is-lit', isLit);
    if (isLit) decode(el);
  }
}

addEventListener('scroll', light, { passive: true });
// the places move whenever the page around them changes height, and the words are new in another language
new ResizeObserver(measure).observe(document.body);
whenTextChanges(measure);
measure();
