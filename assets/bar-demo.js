/**
 * The bar in the opening: a working miniature of unimo. It types a few queries by itself,
 * rests, and from the first click it is the visitor's. Nothing typed here leaves the page.
 */
import { tr, onLang } from './i18n.js';

const byId = id => document.getElementById(id);
const input = byId('q');
const list = byId('results');
const demo = byId('demo');
const caret = byId('bar-caret');
const barRow = byId('bar-row');
const modeBtn = byId('mode');
const modeIcon = byId('mode-icon');
const clearBtn = byId('clear');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/** CZK per EUR, fixed: this is a demonstration, not a quote. */
const CZK_PER_EUR = 24.3;
const CARET_HEIGHT = 18;
const INPUT_PADDING_LEFT = 6;

const escapeHtml = s =>
  s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
/** Lower case, accents dropped, so "Mama" finds "Máma". */
const fold = s => s.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');

/* ── rows ─────────────────────────────────────────────── */

const ICONS = {
  app: '<circle cx="12" cy="12" r="9"/>',
  person: '<circle cx="12" cy="8" r="4"/><path d="M4 20c0-3.3 3.6-5.5 8-5.5s8 2.2 8 5.5v.5H4V20z"/>',
  note: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  calc: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M9 12h.01M12 12h.01M15 12h.01M9 15.5h.01M12 15.5h.01M15 15.5h.01"/>',
  gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3z"/>',
};
const FILLED = new Set(['app', 'person']);
const RINGS = '<span class="mark"></span>';

const iconSvg = kind => {
  const paint = FILLED.has(kind) ? 'fill="currentColor"' : 'fill="none" stroke="currentColor" stroke-width="1.8"';
  return `<svg viewBox="0 0 24 24" ${paint}>${ICONS[kind]}</svg>`;
};

/** A row's strings are this site's own text, or visitor input that was escaped where the row was made. */
function rowHtml(r) {
  const text = r.calc
    ? `<span class="expr">${r.calc.expr}</span><span class="value">${r.calc.value}</span>`
    : (r.title ? `<span class="t">${r.title}</span>` : '') +
      (r.sub ? `<span class="sub">${r.sub}</span>` : '') +
      (r.desc ? `<span class="desc">${r.desc}</span>` : '');
  const hint = r.hint ? `<span class="hint" aria-hidden="true">${r.hint}<kbd>↵</kbd></span>` : '';
  const tile = `<span class="tile${r.round ? ' round' : ''}" aria-hidden="true">${iconSvg(r.icon)}</span>`;
  return `<li class="row">${tile}<span class="txt">${text}</span>${hint}</li>`;
}

/* ── the calculator ───────────────────────────────────── */

/** + - * / and brackets, parsed by hand, so nothing a visitor types is ever run as code. */
function arithmetic(source) {
  const tokens = source.match(/\d+(?:\.\d+)?|[-+*/()]/g) ?? [];
  let at = 0;
  const peek = () => tokens[at];
  const take = () => tokens[at++];
  const atom = () => {
    const token = take();
    if (token === '(') {
      const inner = sum();
      if (take() !== ')') throw new SyntaxError('unclosed bracket');
      return inner;
    }
    if (token === '-') return -atom();
    if (!/^\d/.test(token ?? '')) throw new SyntaxError('number expected');
    return parseFloat(token);
  };
  const product = () => {
    let value = atom();
    while (peek() === '*' || peek() === '/') value = take() === '*' ? value * atom() : value / atom();
    return value;
  };
  const sum = () => {
    let value = product();
    while (peek() === '+' || peek() === '-') value = take() === '+' ? value + product() : value - product();
    return value;
  };
  const value = sum();
  if (at < tokens.length) throw new SyntaxError('unexpected ' + peek());
  return value;
}

const money = (amount, locale, currency) => new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);

function calculate(text) {
  const answer = value => ({ kind: 'calc', icon: 'calc', calc: { expr: escapeHtml(text), value }, hint: tr('demo.copy') });

  const conversion = text.match(/^(\d+(?:[.,]\d+)?)\s*(eur|€|czk|kč|kc)\s*(?:in|to|na)\s*(eur|€|czk|kč|kc)$/i);
  if (conversion) {
    const isEuro = unit => /eur|€/i.test(unit);
    const amount = parseFloat(conversion[1].replace(',', '.'));
    const euros = isEuro(conversion[2]) ? amount : amount / CZK_PER_EUR;
    return answer(isEuro(conversion[3]) ? money(euros, 'en-IE', 'EUR') : money(euros * CZK_PER_EUR, 'cs-CZ', 'CZK'));
  }

  const isSum = /^[\d\s+\-*/().]+$/.test(text) && /\d/.test(text) && /[+\-*/]/.test(text);
  if (!isSum) return null;
  try {
    const value = arithmetic(text);
    return Number.isFinite(value) ? answer(String(Math.round(value * 100) / 100)) : null;
  } catch {
    return null; // half-typed, like "2 +"
  }
}

/* ── what unimo would answer ──────────────────────────── */

const webSearch = text => ({
  kind: 'web', icon: 'globe', title: tr('demo.websearch', { q: escapeHtml(text) }), hint: tr('demo.open'),
});

/**
 * Each rule: the query it answers, how many letters wake it, and its rows.
 * What the device already knows shows after a few letters; an answer from the web waits for the whole question.
 */
const rules = text => [
  ['sp', 2, () => [
    { kind: 'app', icon: 'app', round: true, title: tr('demo.spotify'), hint: tr('demo.open') },
    { kind: 'note', icon: 'note', desc: tr('demo.spaghetti') },
    webSearch(text),
  ]],
  [tr('persona.query'), 2, () => [
    { kind: 'contact', icon: 'person', round: true, title: tr('persona.name'), sub: tr('persona.phone'), hint: tr('demo.call') },
    { kind: 'note', icon: 'note', desc: tr('demo.memo') },
    webSearch(text),
  ]],
  [tr('st.memo'), 3, () => [{ kind: 'note', icon: 'note', title: tr('demo.saved'), desc: tr('demo.savedsub') }]],
  ['wifi', 2, () => [{ kind: 'setting', icon: 'gear', title: tr('demo.wifi'), desc: tr('demo.wifisub'), hint: tr('demo.open') }]],
  [tr('demo.q.rice'), tr('demo.q.rice').length, () => [
    { kind: 'web', icon: 'globe', title: tr('demo.rice'), desc: tr('demo.ricesub'), hint: tr('demo.open') },
    webSearch(text),
  ]],
  [tr('demo.trains'), tr('demo.trains').length, () => [
    { kind: 'web', icon: 'globe', title: tr('demo.trains'), desc: tr('demo.trainsub'), hint: tr('demo.open') },
    webSearch(text),
  ]],
];

function answersFor(text) {
  const sum = calculate(text.toLowerCase());
  if (sum) return [sum];
  const typed = fold(text);
  const matches = ([query, wakeAt]) => {
    const wanted = fold(query);
    return typed.length >= wakeAt && (wanted.startsWith(typed) || typed.startsWith(wanted));
  };
  const rule = rules(text).find(matches);
  return rule ? rule[2]() : [webSearch(text)];
}

/* ── the list and its selection ───────────────────────── */

const MODES = [
  { label: 'all', kinds: null },
  { label: 'web', kinds: ['web'], icon: 'globe' },
  { label: 'notes', kinds: ['note'], icon: 'note' },
  { label: 'apps', kinds: ['app'], icon: 'app' },
];
let mode = MODES[0];
let rows = [];
let selected = 0;

function select(index) {
  const items = list.children;
  if (!items.length) return;
  selected = Math.max(0, Math.min(index, items.length - 1));
  [...items].forEach((item, i) => item.classList.toggle('sel', i === selected));
}

function render(candidates) {
  rows = mode.kinds ? candidates.filter(r => mode.kinds.includes(r.kind)) : candidates;
  list.innerHTML = rows.map(rowHtml).join('');
  select(0);
  clearBtn.hidden = input.value === '';
}

const refresh = () => render(input.value.trim() ? answersFor(input.value.trim()) : []);

function labelMode() {
  modeBtn.setAttribute('aria-label', tr('demo.searchin', { x: tr(`demo.modes.${mode.label}`) }));
  input.placeholder = tr(`demo.ph.${mode.label}`);
}

function nextMode() {
  mode = MODES[(MODES.indexOf(mode) + 1) % MODES.length];
  modeIcon.style.rotate = 'y 90deg';
  setTimeout(() => {
    modeIcon.innerHTML = mode.icon ? iconSvg(mode.icon) : RINGS;
    modeIcon.style.rotate = 'y 0deg';
  }, 100);
  labelMode();
  refresh();
}

/** Enter on a sum copies its answer, as the app does. */
function activate() {
  const row = rows[selected];
  if (!row?.calc) return;
  const label = list.children[selected]?.querySelector('.hint')?.firstChild;
  const say = text => {
    if (!label) return;
    label.textContent = text;
    setTimeout(() => { label.textContent = row.hint; }, 1200);
  };
  if (!navigator.clipboard) return say(tr('demo.fail'));
  navigator.clipboard.writeText(row.calc.value).then(() => say(tr('demo.copied')), () => say(tr('demo.fail')));
}

/* ── the bar typing by itself ─────────────────────────── */

/** The drawn caret follows the text; a hidden twin of the input measures how wide the text is. */
const twin = document.createElement('span');
twin.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;left:-9999px;top:0';
document.body.append(twin);

function placeCaret() {
  twin.style.font = getComputedStyle(input).font;
  twin.textContent = input.value;
  const x = input.offsetLeft + INPUT_PADDING_LEFT + twin.getBoundingClientRect().width;
  const y = (barRow.clientHeight - CARET_HEIGHT) / 2;
  caret.style.transform = `translate(${x}px, ${y}px)`;
}

let timers = [];
let playing = false;
const later = (fn, ms) => timers.push(setTimeout(fn, ms));
/** Steady, with a small stumble now and then, the same every visit. */
const keyDelay = char => (char.charCodeAt(0) % 3 === 0 ? 150 : 60 + ((char.charCodeAt(0) * 7) % 40));

function stopPlaying() {
  timers.forEach(clearTimeout);
  timers = [];
  playing = false;
  demo.classList.remove('typing');
  barRow.removeAttribute('data-busy');
}

/** Types one query, a letter at a time, with the rows keeping up as they do in the app. */
function typeQuery(text, pause, done) {
  const asksTheWeb = text === tr('demo.q.rice');
  const type = length => {
    input.value = text.slice(0, length);
    placeCaret();
    const isWhole = length === text.length;
    if (asksTheWeb && isWhole) {
      // the web takes a moment, and the bar shows it
      barRow.setAttribute('data-busy', '');
      later(() => {
        barRow.removeAttribute('data-busy');
        refresh();
      }, 650);
    } else refresh();
    later(isWhole ? done : () => type(length + 1), isWhole ? pause : keyDelay(text[length]));
  };
  type(1);
}

function playScript() {
  const queries = ['sp', tr('st.memo'), '48 eur in czk', tr('demo.q.rice'), tr('persona.query')];
  playing = true;
  demo.classList.add('typing');
  const step = index => {
    if (index === queries.length) return stopPlaying();
    const isLast = index === queries.length - 1;
    typeQuery(queries[index], isLast ? 600 : 2300, () => step(index + 1));
  };
  later(() => step(0), 900);
}

/* ── wiring ───────────────────────────────────────────── */

export function initBarDemo() {
  input.value = tr('persona.query');
  labelMode();
  refresh();

  modeBtn.addEventListener('click', nextMode);
  input.addEventListener('input', () => {
    stopPlaying();
    refresh();
  });
  input.addEventListener('keydown', e => {
    const moves = { ArrowDown: 1, ArrowUp: -1 };
    if (e.key === 'Enter') activate();
    else if (e.key in moves) select(selected + moves[e.key]);
    else return;
    e.preventDefault();
  });
  // the first touch takes the bar over: whatever the demo was typing makes room for the visitor
  input.addEventListener('pointerdown', () => {
    if (!playing) return;
    stopPlaying();
    input.value = '';
    refresh();
  });
  input.addEventListener('focus', stopPlaying);
  clearBtn.addEventListener('click', () => {
    input.value = '';
    refresh();
    input.focus();
  });
  list.addEventListener('click', e => {
    const item = e.target.closest('.row');
    if (!item) return;
    select([...list.children].indexOf(item));
    activate();
  });
  addEventListener('resize', () => playing && placeCaret());

  onLang(() => {
    stopPlaying();
    input.value = tr('persona.query');
    labelMode();
    refresh();
  });

  if (!reducedMotion) playScript();
}
