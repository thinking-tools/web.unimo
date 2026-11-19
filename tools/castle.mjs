/**
 * Draws a photograph in characters, for the picture behind the page's last part (assets/castle-*.txt, which
 * assets/castle.js puts on the page). The darker a spot of the photograph, the denser the character that
 * stands for it; the sky, which is blue and neither light nor dark, is left empty.
 *
 *   node tools/castle.mjs <photo> <columns> <left> <top> <right> <bottom> > assets/castle-wide.txt
 *
 * `left` … `bottom` say which part of the photograph to draw, each as a share of its width or height (0 to 1).
 * The number of lines follows from the part's shape and from the shape of a character on the page (CELL).
 *
 * It needs `sips`, which a Mac has, to read the photograph: sips cuts the part out and scales it to one pixel
 * for each character, and this file reads the result.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/** How many times taller than wide a character's place is on the page: the styles' line height over a
    monospace face's advance (.castle in assets/unimo.css). */
const CELL = 1.15 / 0.6;
/** The characters, from the lightest to the densest. */
const RAMP = ' .·:-=+*#%@';
/** Sky is either very blue, or a little blue and light at once (a slate roof is a little blue too, and dark).
    For each of the three: from where a spot counts as sky at all, and from where as nothing but sky. Blue is
    measured as how much more blue than red there is in the spot. */
const SKY_DEEP_FROM = 40;
const SKY_DEEP_FULL = 80;
const SKY_BLUE_FROM = 4;
const SKY_BLUE_FULL = 22;
const SKY_LIGHT_FROM = 0.3;
const SKY_LIGHT_FULL = 0.5;
/** Of the darkness found in the part, this share at each end is taken for none and for all of it. */
const CLIP = 0.02;
/** Darkness below this is left empty: paper, not a faint dot. And a spot lighter than PAPER_FROM is paper
    whatever its colour: a white wall, or the haze over the roofs. */
const EMPTY_BELOW = 0.12;
const PAPER_FROM = 0.8;
/** Above 1 this takes darkness out of the middle tones, so that walls open up between the roofs and the trees. */
const TONE = 1.3;
/** How much a spot is set off against the spots round it, so that roofs and towers keep an edge. */
const SHARPEN = 0.7;

const [photo, columnsText, ...sides] = process.argv.slice(2);
const columns = Number(columnsText);
const [left, top, right, bottom] = sides.map(Number);
if (!photo || !columns || sides.length !== 4 || sides.some(Number.isNaN)) {
  console.error('usage: node tools/castle.mjs <photo> <columns> <left> <top> <right> <bottom>');
  process.exit(1);
}

const sips = (...args) => execFileSync('sips', args, { encoding: 'utf8' });
const measure = name => Number(sips('-g', name, photo).match(new RegExp(`${name}: (\\d+)`))[1]);
const width = measure('pixelWidth');
const height = measure('pixelHeight');

const partWidth = Math.round((right - left) * width);
const partHeight = Math.round((bottom - top) * height);
const rows = Math.round((columns * partHeight) / partWidth / CELL);

const work = mkdtempSync(join(tmpdir(), 'castle-'));
const part = join(work, 'part.png');
const png = ['-s', 'format', 'png'];
const small = join(work, 'small.bmp');
let pixels;
try {
  const offset = [Math.round(top * height), Math.round(left * width)];
  sips('-c', partHeight, partWidth, '--cropOffset', ...offset, ...png, photo, '--out', part);
  sips('-z', rows, columns, '-s', 'format', 'bmp', part, '--out', small);
  pixels = readFileSync(small);
} finally {
  rmSync(work, { recursive: true, force: true });
}

// a BMP file: where the pixels start, how many there are, and how many bits each takes; its lines run from
// the bottom up unless its height is negative, and each is filled up to a multiple of four bytes
const start = pixels.readUInt32LE(10);
const bmpWidth = pixels.readInt32LE(18);
const bmpHeight = pixels.readInt32LE(22);
const bytes = pixels.readUInt16LE(28) / 8;
const line = Math.ceil((bmpWidth * bytes) / 4) * 4;
const isBottomUp = bmpHeight > 0;
const lines = Math.abs(bmpHeight);

const clamp01 = value => Math.min(Math.max(value, 0), 1);

/** How dark each spot is, from 0 to 1, with the sky taken out. */
const dark = [];
for (let y = 0; y < lines; y++) {
  const row = start + (isBottomUp ? lines - 1 - y : y) * line;
  for (let x = 0; x < bmpWidth; x++) {
    const blue = pixels[row + x * bytes];
    const green = pixels[row + x * bytes + 1];
    const red = pixels[row + x * bytes + 2];
    const light = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
    const sky = Math.max(
      clamp01((blue - red - SKY_DEEP_FROM) / (SKY_DEEP_FULL - SKY_DEEP_FROM)),
      clamp01((blue - red - SKY_BLUE_FROM) / (SKY_BLUE_FULL - SKY_BLUE_FROM)) *
        clamp01((light - SKY_LIGHT_FROM) / (SKY_LIGHT_FULL - SKY_LIGHT_FROM)),
    );
    dark.push(light > PAPER_FROM ? 0 : (1 - light) * (1 - sky));
  }
}

// from the lightest to the darkest the part has, not the photograph's own range
const sorted = [...dark].sort((a, b) => a - b);
const least = sorted[Math.floor(sorted.length * CLIP)];
const most = sorted[Math.ceil(sorted.length * (1 - CLIP)) - 1];
const spread = dark.map(value => clamp01((value - least) / (most - least)) ** TONE);

const at = (x, y) => spread[clamp(y, lines) * bmpWidth + clamp(x, bmpWidth)];
function clamp(index, count) {
  return Math.min(Math.max(index, 0), count - 1);
}

let text = '';
for (let y = 0; y < lines; y++) {
  for (let x = 0; x < bmpWidth; x++) {
    let around = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) around += at(x + dx, y + dy);
    const value = clamp01(at(x, y) + SHARPEN * (at(x, y) - around / 9));
    text += value < EMPTY_BELOW ? ' ' : RAMP[Math.min(Math.floor(value * RAMP.length), RAMP.length - 1)];
  }
  text += '\n';
}
process.stdout.write(text);
