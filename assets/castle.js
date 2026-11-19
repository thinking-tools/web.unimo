/**
 * The picture behind the page's last part: Prague Castle, drawn in characters. tools/castle.mjs made the two
 * drawings from a photograph: a wide one, and one for narrow screens that shows the middle of it at about the
 * same size of character. This file fetches the one the screen has room for, once the part comes near, and puts
 * it into the page as text. How large the characters are is the styles' business (.castle in unimo.css, which
 * knows how many columns and lines each drawing has).
 */
const art = document.querySelector('.castle');
/** the same width at which the styles change from one drawing's measures to the other's */
const isNarrow = matchMedia('(width < 45rem)');
const drawings = new Map();

const wanted = () => (isNarrow.matches ? art.dataset.narrow : art.dataset.wide);

/**
 * A drawing's text, fetched once. One that cannot be had is no picture, not an error on the page. And only plain
 * text is taken for a drawing: a server that answers every address it does not know with the page itself (as
 * one that bundles pages does, `bun index.html` for one) would otherwise have the page's source drawn here.
 */
function drawing(file) {
  if (!drawings.has(file)) {
    const isText = response => response.ok && response.headers.get('content-type')?.startsWith('text/plain');
    drawings.set(
      file,
      fetch(file)
        .then(response => (isText(response) ? response.text() : ''))
        .catch(() => ''),
    );
  }
  return drawings.get(file);
}

async function draw() {
  const file = wanted();
  const text = await drawing(file);
  if (file !== wanted()) return; // the screen has turned while the drawing was on its way
  art.textContent = text;
  art.hidden = text === ''; // without a drawing its room is given up too
}

new IntersectionObserver(
  (entries, observer) => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    observer.disconnect();
    isNarrow.addEventListener('change', draw);
    draw();
  },
  { rootMargin: '150% 0px' },
).observe(art);
