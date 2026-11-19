/**
 * A road is a stretch of page that a stage is held over: the stage is `position: sticky` inside a taller block,
 * and that block ends in a `::after` which is nothing but distance to scroll. This file turns how far the page
 * has scrolled along a road into a number from 0 to 1, and hands it to whoever draws the stage.
 *
 * Whether a road exists at all is the styles' decision (they hold the stages only with scripts, on a tall enough
 * screen, where motion is welcome). Where the stage is not sticky there is no road, and the drawing is told so.
 */
export const clamp01 = value => Math.min(Math.max(value, 0), 1);

/** Which of `steps` equal stretches of a road `progress` lies in. */
export const stretch = (progress, steps) => Math.min(Math.floor(progress * steps), steps - 1);

/**
 * A scene played in steps says in its markup when each part is there: one marked `data-at="2"` from step 2 on,
 * and one that also has `data-until="4"` is gone again at step 4. This reads those marks. It returns how many
 * steps the scene has (`count`: the last is the latest at which any part arrives) and `show(step)`, which gives
 * the parts that are there at that step the class `on` and tells the scene the step in `data-step`.
 */
export function stepsOf(scene) {
  const timed = [...scene.querySelectorAll('[data-at]')].map(part => ({
    part,
    at: Number(part.dataset.at),
    until: Number(part.dataset.until ?? Infinity),
  }));
  let shown;

  return {
    count: 1 + Math.max(...timed.map(({ at }) => at)),
    show(step) {
      if (step === shown) return;
      shown = step;
      scene.dataset.step = step;
      for (const { part, at, until } of timed) part.classList.toggle('on', step >= at && step < until);
    },
  };
}

/**
 * Calls `draw(progress, isHeld)` now and whenever the answer may have changed, and returns a function that asks
 * again (for when the stage's own content has changed).
 *
 * `begin` says where the road starts, as a scroll position. It is given where the stage is caught (`caughtAt`)
 * and how far from the top of the screen it is held (`heldAt`). The default starts the road at the top of the
 * page.
 *
 * A stage may be held inside another stage: the outer one is let go, and the inner one stays behind for a
 * distance of its own. `road` is then still the block that stands still in the page, the outer one's, which is
 * where both end, and `distance` is the block whose `::after` is the inner stage's distance.
 */
export function followRoad(road, stage, draw, begin = () => 0, distance = road) {
  let start = 0;
  let end = 0;

  function measure() {
    const stageStyle = getComputedStyle(stage);
    if (stageStyle.position !== 'sticky') {
      start = end = 0;
      return;
    }
    // the stage is let go when the block's end reaches the stage's own, and was caught one track earlier
    const heldAt = parseFloat(stageStyle.top);
    const track = parseFloat(getComputedStyle(distance, '::after').height);
    const releasedAt = road.getBoundingClientRect().bottom + scrollY - stage.offsetHeight - heldAt;
    const caughtAt = releasedAt - track;
    const pageEnd = document.documentElement.scrollHeight - innerHeight;
    start = Math.max(0, begin({ caughtAt, heldAt }));
    end = Math.min(releasedAt, pageEnd); // a page that ends with the road still plays it to the end
  }

  function update() {
    // false too where the measures came out as no numbers at all: such a stage has no road either
    const isHeld = end > start;
    draw(isHeld ? clamp01((scrollY - start) / (end - start)) : 0, isHeld);
  }

  function refresh() {
    measure();
    update();
  }

  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', refresh);
  // a road moves and changes length whenever the page around it changes height
  new ResizeObserver(refresh).observe(document.body);
  refresh();
  return refresh;
}
