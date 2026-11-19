/**
 * The apps' spinner, drawn here as the apps draw it (unimo-ui-lib: `pixel.ts`, `Spinner.tsx`, and the canvas
 * upkeep of `Pixel.tsx`): one tiny dot on a tumbling orbit, trailing a hair-thin line in the colours of the logo's
 * ring. Every number below is the library's own; when its spinner changes, this is where to follow it.
 *
 * The trail is the dot's own path a moment earlier, so nothing is kept between frames.
 */

/** The bright stops of the logo's ring, in ring order: for a dark surface. */
const RING = [
  [200, 50, 40],
  [251, 136, 65],
  [211, 221, 146],
  [89, 130, 79],
  [40, 116, 215],
  [153, 194, 255],
];
/** The same stops deepened for a light surface, where the bright ones wash out. */
const RING_ON_LIGHT = [
  [214, 40, 32],
  [242, 106, 27],
  [163, 181, 45],
  [62, 140, 66],
  [29, 105, 224],
  [86, 150, 255],
];
/** A dark dot on light weighs more than a bright one on dark, so there it is this share of its size. */
const DOT_ON_LIGHT = 0.75;
/** The dot's radius as a share of the box's shorter side, and the least it may be, in CSS pixels. */
const DOT = 1 / 32;
const SMALLEST_DOT = 0.8;
/** How far behind the dot its trail reaches, drawn a frame's travel at a time. */
const TRAIL_SECONDS = 0.7;
const SEGMENTS_A_SECOND = 60;
/** How far along the ring the trail's colours reach, dot to tip, and how fast they drift round it, in turns a second. */
const TRAIL_HUES = 0.75;
const HUE_DRIFT = 0.07;
/** The trail's width at the dot, in dot radii; it thins to 40% of that at its tip. */
const TRAIL_WIDTH = 1.5;

const stillness = matchMedia('(prefers-reduced-motion: reduce)');
const now = () => performance.now() / 1000;

/** The ring's colour `turns` of the way round it, blended between its stops. */
function ringColor(ring, turns) {
  const at = (turns - Math.floor(turns)) * ring.length;
  const stop = Math.floor(at) % ring.length;
  const next = ring[(stop + 1) % ring.length];
  const channels = ring[stop].map((channel, index) => Math.round(channel + (next[index] - channel) * (at % 1)));
  return `rgb(${channels.join(' ')})`;
}

let probe;

/**
 * Reads a CSS colour by painting it, because computed colours come in too many notations to parse. The dot takes
 * the colour of the text beside it, and dark text tells of a light surface behind it.
 */
function inkOf(color) {
  probe ??= document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  probe.clearRect(0, 0, 1, 1);
  probe.fillStyle = color;
  probe.fillRect(0, 0, 1, 1);
  const [red, green, blue] = probe.getImageData(0, 0, 1, 1).data;
  return { color, isDark: 0.2126 * red + 0.7152 * green + 0.0722 * blue < 128 };
}

/**
 * Where the dot is `seconds` in, as -1 to 1 from the middle: a circle of wobbling radius, tilted about two axes
 * at unrelated speeds and seen in perspective, like a laser pointer in a restless hand.
 */
function orbit(seconds) {
  const turn = 7.0 * seconds;
  const tiltX = 1.45 * seconds + 1.3 * Math.sin(0.94 * seconds);
  const tiltY = 0.94 * seconds + 1.1 * Math.sin(0.71 * seconds + 1);
  const radius = 0.8 + 0.2 * Math.sin(1.96 * seconds + 0.5);
  const x = radius * Math.cos(turn);
  const y = radius * Math.sin(turn);
  const z = y * Math.sin(tiltX);
  const near = (z * Math.cos(tiltY) - x * Math.sin(tiltY) + 1) / 2;
  const scale = 0.72 + 0.2 * near; // nearer is larger; at its widest a small dot still fits inside -1..1
  return [(x * Math.cos(tiltY) + z * Math.sin(tiltY)) * scale, y * Math.cos(tiltX) * scale];
}

/** Draws the spinner as it is `seconds` in, on a cleared canvas `width` by `height`: its trail, tip first, then the dot. */
function draw(context, width, height, ink, seconds) {
  const side = Math.min(width, height);
  const dot = Math.max(side * DOT, SMALLEST_DOT);
  // the orbit fills the box with room for a dot of that share; a sturdier dot takes its extra off the orbit's reach
  const reach = side / 2 - (dot - side * DOT);
  const place = at => {
    const [x, y] = orbit(at);
    return [width / 2 + x * reach, height / 2 + y * reach];
  };
  const ring = ink.isDark ? RING_ON_LIGHT : RING;
  const segments = Math.round(TRAIL_SECONDS * SEGMENTS_A_SECOND);

  context.lineCap = 'round';
  let from = place(seconds - TRAIL_SECONDS);
  for (let segment = segments - 1; segment >= 0; segment--) {
    const age = segment / segments;
    const to = place(seconds - age * TRAIL_SECONDS);
    context.strokeStyle = ringColor(ring, seconds * HUE_DRIFT + age * TRAIL_HUES);
    context.lineWidth = dot * TRAIL_WIDTH * (1 - 0.6 * age);
    context.beginPath();
    context.moveTo(...from);
    context.lineTo(...to);
    // each stretch takes the place of what it covers of the one before: laid over it, their joints would show as beads
    context.globalCompositeOperation = 'destination-out';
    context.globalAlpha = 1;
    context.stroke();
    context.globalCompositeOperation = 'source-over';
    context.globalAlpha = 1 - age * age;
    context.stroke();
    from = to;
  }
  context.fillStyle = ink.color;
  context.globalAlpha = 1;
  context.beginPath();
  context.arc(...from, dot * (ink.isDark ? DOT_ON_LIGHT : 1), 0, 2 * Math.PI);
  context.fill();
}

/**
 * Keeps `canvas` painted with the spinner at the screen's sharpness: every frame while it can be seen, and once
 * whenever its box or the visitor's wish for stillness changes. A canvas without a box is left alone, one that
 * has scrolled out of view rests, and for a visitor who asked for reduced motion it is a single still frame.
 */
export function spin(canvas) {
  // The canvas takes its size from the styles and from nothing else. Left to itself it would be as large as its
  // bitmap, and the bitmap is cut to the canvas: without a size from the styles each would double the other,
  // frame after frame. With this, a canvas the styles have not reached yet has no box and is left alone.
  canvas.style.contain = 'size';
  const context = canvas.getContext('2d');
  const style = getComputedStyle(canvas);
  const epoch = now(); // every spinner starts elsewhere along the orbit
  let ink = inkOf(style.color);
  let seconds = 0;
  let movingSince;
  let nextFrame = 0;
  let isInView = false;

  function repaint() {
    cancelAnimationFrame(nextFrame);
    const time = now();
    if (movingSince !== undefined) seconds += time - movingSince;
    const { clientWidth: width, clientHeight: height } = canvas;
    const hasBox = width > 0 && height > 0;
    const isMoving = hasBox && isInView && !stillness.matches;
    movingSince = isMoving ? time : undefined;
    if (!hasBox) return;

    const sharp = { width: Math.round(width * devicePixelRatio), height: Math.round(height * devicePixelRatio) };
    if (canvas.width !== sharp.width || canvas.height !== sharp.height) Object.assign(canvas, sharp);
    context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    context.clearRect(0, 0, width, height);
    if (style.color !== ink.color) ink = inkOf(style.color); // the page went from light to dark, or back
    draw(context, width, height, ink, epoch + seconds);
    if (isMoving) nextFrame = requestAnimationFrame(repaint);
  }

  // each observer reports once as it starts, which paints the first frame
  new ResizeObserver(repaint).observe(canvas);
  new IntersectionObserver(entries => {
    isInView = entries.at(-1).isIntersecting;
    repaint();
  }).observe(canvas);
  stillness.addEventListener('change', repaint);
}
