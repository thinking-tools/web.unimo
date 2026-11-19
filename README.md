# unimo.app

The homepage. Static files, no build step, no third-party requests, no cookies.

It is being rebuilt one section at a time. So far it has the opening (the top bar, the headline, the download
button, the bar), the bar's road (the stretch of page where scrolling types into the bar) and the desk (a laptop
and a phone, what passes between them, and the question that was passed, put to the agent and then looked up on
the web), the sealed memo, which shows who can read all of it ("Only you can access it"), the quiet phone
("Minimal design. Maximum focus.") and the finale ("One more thing…": the bar does sums). After the story come
Features (the long story, short) and the credits (everything is open source, and what unimo is built on).

Not there yet: `#about` and `#pricing`, which the top bar links to, and a footer.

## Look at it

```bash
python3 tools/serve.py
```

Then open <http://localhost:5173> (another port: `python3 tools/serve.py 8080`). It has to be served: the scripts
are modules, so opening `index.html` from disk shows the page without them.

Use this server and not a plain `python3 -m http.server`, which fills the browser's console with errors that
are not the page's. The plain one says nothing about keeping copies, so a browser may run an old copy of one
script beside a new copy of another. And it lets only five connections wait at a time, while the page sends for
some thirty files in one go: some are turned away ("connection reset"). `tools/serve.py` forbids copies, keeps
connections open and takes many at once.

## Where things are

| File | What it holds |
|---|---|
| `index.html` | The page, in English. Every translatable element carries `data-i18n="key"`. Its `<style>` holds the styles of the first screen and the bar's road; colours and sizes are the custom properties at its top. |
| `assets/unimo.css` | The styles of what lies below the first screen: the desk, and the two chapters under it. |
| `assets/unimo.js` | Starts the page: the language, the menu, the name in the top bar, the download button. Then the roads. |
| `assets/road.js` | What the roads share: how far along a held stage the page has scrolled, and which parts of a scene are there at which step. |
| `assets/bar.js` | The bar's road: turns that distance into what the bar shows. |
| `assets/desk.js` | The desk's two roads: turns them into which step of the scene shows. |
| `assets/spinner.js` | The apps' spinner, drawn as `unimo-ui-lib` draws it. |
| `assets/seal.js` | Only yours: the third road. Encrypts the memo in the visitor's browser and turns its characters as the page scrolls. |
| `assets/quiet.js` | Quiet: the fourth road. Says which step the phone shows, and types into its bar on the last one. |
| `assets/finale.js` | The finale: the fifth road. Fades the screen to black, types its sums into the bar and shows their answers. |
| `assets/features.js` | Features: lights its panes as they come up the screen. |
| `assets/clock.js` | Sets the clocks on the drawn devices to the visitor's time. |
| `assets/lang.js` | Loads a language and repaints the page. |
| `assets/lang/*.json` | One file per language other than English. |
| `assets/apps/*.png` | The icons of the apps in the bar's list, as macOS ships them. |
| `assets/people/*.avif` | The face of the person in the bar's list. |
| `assets/found/*.avif` | The pictures the bar finds on the web, on the desk. |
| `assets/sites/*.png` | The icons of the three sites the bar finds there. |
| `assets/wallpapers/*.avif` | The wallpapers the desk's laptop can show, by system, light and dark. |
| `tools/serve.py` | The server above. |
| `tools/check-i18n.mjs` | Holds the language files, the picker and the list in the head to each other. |
| `tools/sums.mjs` | Asks the apps' own calculator for the answers to the finale's sums. |
| `tools/app-icons.swift` | Writes the app icons, from the apps on a Mac. |

## What loads when

The first paint waits for `index.html` and nothing else. The styles of the first screen are written into the
page, the logo is drawn by them, and the first screen has no picture to fetch.

Everything else is sent for at the same moment, without being waited for:

- `assets/unimo.css`, for the desk and the chapters. Until it is in, their scenes are held back (`.desk-scene`,
  `.seal-scene`, `.quiet-scene` and `.finale-scene` in the page's own styles) and their captions read as plain
  text.
- The scripts. `unimo.js` and `lang.js` see to the first screen. The scripts of what lies further down (the
  roads, the memo that seals itself, the clocks) are fetched alongside and run once the first screen has been
  painted.
- A visitor's language, if the page speaks it: the script in the head sends for the file, and keeps the page
  back until it is in, so that the text does not swap before the visitor's eyes. Anyone else reads English at
  once.
- The app icons, which show once typing starts, and the laptop's wallpaper, which is fetched when the desk is
  near.

So a rule that the first screen needs goes into the page's `<style>`, and anything further down into
`assets/unimo.css`. The condition that makes a road is written in both.

## The page before the rebuild

`index2.html` is the page as it was, kept to look things up in. It still runs, on files that belong to it alone:
`assets/site.css`, `assets/main.js`, `assets/i18n.js`, `assets/bar-demo.js`, `assets/stages.js`,
`assets/icons.svg`, `assets/rings.svg` and the `i18n/` folder. Once it is no longer needed they all go together.

## Without scripts

The page reads whole without its scripts: the bar and the desk at rest, the memo sealed, the phone with unimo's
own screen, the captions as plain
lists. The script
in the head marks the page with the class `js`, and the styles keep everything that needs a script behind that
class. Should a script fail to arrive, or break while running, the class is taken away again and the page falls
back to the same reading.

## Text and translations

English lives in `index.html`. Every other language is `assets/lang/<code>.json` with the same keys. After
changing text:

```bash
node tools/check-i18n.mjs
```

It lists keys a language is missing or no longer needs. To add a language, add its file, an `<option>` to the
picker in the top bar, and its code to the list in the script in the head (`translated`). The check complains
when the three disagree.

The page follows the device's language. A visitor's own choice lives in the address, as `?lang=xx`.

## Downloads

The download addresses are the links of the "Available on" line in `index.html`, and nowhere else. The button
above that line says "Reserve a seat": the beta has a limited number of accounts, and a seat is taken by
installing the app and signing up in it. So the button is still the download. It wears the mark of the visitor's
own system, which the script in the head works out before first paint, and takes its address from the line (the
link marked with that system's `data-os`). A visitor on anything else gets the button without a mark, pointing
at the line.

The links name one release each. After a release, change the version in all five: GrapheneOS runs the Android
app, so the line names that file twice. "Web" stands at the end without an address, as a link still to be made:
give its `<a>` an `href` once the web app (`web-app` in the project) is published somewhere.

The line is reckoned at one line on a wide screen, two on a phone and three on the narrowest (`--platform-lines`),
which is how the opening knows its own height. A longer line needs those numbers checked.

## The bar

The bar is a drawing of the desktop app's command bar and result list. Its lengths and colours are the app's own
(`desktop-app/src/ui/styles.css`, and `command-bar.css`, `result.css`, `action-bar.css`, `agent.css` and
`caret.css` in `unimo-ui-lib`), written in `em` where the app says `rem`. One `em` is `--bar-scale`, so that
property is the scale of the drawing, and at 16px it measures what the app measures. When the app's bar changes,
this is where to follow it.

It is drawn twice: large, on its road, and small, on the desk's laptop. On the road the app's row of pills under
a typed query is left out; on the desk it shows once, when the question is pasted in.

## The roads

A road is a stretch of page that a stage is held over: the stage is `position: sticky` inside a taller block,
which ends in a `::after` that is nothing but distance to scroll. `assets/road.js` turns the distance scrolled
into a number from 0 to 1, and the road's own script turns that number into a picture. Nothing on a road runs on
a timer, so scrolling back plays it backwards. There are five: the bar's, the desk's (two, one inside the other),
the sealed memo's, the quiet phone's and the finale's.

The last three are chapters (`.chapter`, with a `.chapter-stage`): a claim that stays, the points under it one at a
time, a picture under the words. What they share is styled once, in `assets/unimo.css`: the size of the headings,
the list a chapter reads as without its road, and the road itself. A chapter only says how long its road is
(`--road`) and how far from the top of the screen its stage is held (`--held-at`). A stage has to fit the screen
it is held on in every language, so after changing a chapter's words or pictures, measure it on a short screen.

A scene played in steps says in its markup when each part is there: one marked `data-at="2"` is there from step
2, and `data-until="4"` takes it away again at step 4. `road.js` counts the steps off these marks (`stepsOf`) and
switches the parts on; the road's script only works out which step it is. To add a step, mark its parts.
`data-still` on the scene is the step shown where there is no road.

The styles decide where roads exist: with scripts, without a wish for reduced motion, on a screen at least 30rem
tall. Anywhere else the stages scroll with the page, and the scripts, which go by whether a stage is sticky, play
nothing.

## The top bar

On a phone the name beside the mark gives up its room once the headline has slipped under the bar: it slides in
behind the mark, and comes out again at the top of the page. `unimo.js` marks the page with the class
`is-scrolled` (an `IntersectionObserver` on the headline, so nothing is measured while scrolling), and the styles
do the rest. On a wider screen the name stays.

### The aura

Behind the bar, and reaching up behind the headline, lies a glow in the mark's colours (`.aura`, the first thing
in the bar's `.stage`). It is one square layer: a wheel of the mark's brighter colours, of which a mask lets
five soft spots show. The layer turns once in two and a half minutes, and is squashed to an oval after it has
turned, so the oval keeps still while the colours go round. Nothing is blurred, so the turning is a transform and
no more.

- It belongs to the stage, so it stays behind the bar when the bar is held. `assets/bar.js` says how much of it
  shows (`--aura`): all of it at the top of the page, a good half once the bar has risen to its place, and none
  by the end of the bar's road, so that the stage scrolls on without it.
- On a phone it is half as wide again as the screen, and the stage cuts off what sticks out to the sides.
- A visitor who asked for less motion gets it still, and one whose system paints its own colours not at all.

### The bar's road

The bar starts under the headline. Once it has risen to its place on the screen, the `.stage` it stands in stays
put until the end of `.journey`, and the distance scrolled meanwhile plays what the bar does: an app, a memo, a
person, each with its caption.

- The road is some four fifths of a screen for each of the three, and a short stretch before the first in which
  nothing is typed yet (`LEAD` in `assets/bar.js`). Of a take's stretch, typing in takes the first two fifths
  and typing back out the last seventh. Shorter than this, a flick of the finger went past a whole take.

- Everything the bar shows is markup in `index.html`: a `.take` holds one query (`.take-query`) and the rows that
  answer it, and its `data-caption` numbers the caption it goes with. To add a take, add its markup.
- With each take the bar changes mode, as the app's does when it searches one kind of thing: the take's
  `data-mode` names it, and the bar shows the mark and the placeholder marked `data-in` for that mode (the
  apps' own marks: `unimo-ui-lib`, `Icons.tsx`). Before the first letter it searches everything.
- The first row of a list is the selected one, and only that row names what Return will do.
- A row answers from the second letter typed. `data-from` and `data-until` on a row change that, in letters
  typed: this is how the list of apps narrows from four rows to Signal alone, and the list of people from four
  to one. A caption waits until its list is down to one row, because a longer list hangs over the caption's
  place.
- The people have numbers no phone can have (area code 555, exchange 010), except the one who is known on
  Signal and has none.
- The typing does not begin at the top of the page but once the bar has risen to the place it is held at, and
  not before its longest list is in view.
- An app's icon stands on its row whole, with no tile behind it. The other rows keep their tiles.

### The desk

A laptop and a phone drawn in CSS, under them their caption, and under that the bar at life size. The comment
above the scene in `index.html` lists its steps.

- It is played on two roads, one inside the other. On the first the whole stage is held (`.desk-stage`): the
  devices, the caption and, from the paste on, the bar with the pasted words. Then the stage is let go and scrolls
  on. The devices leave with it, while its lower part (`.ask`, the caption and the bar) is caught again in the
  middle of the screen and held for a road of its own, the stage's own `::after`. There the agent is picked,
  thinks and answers, and the caption above the bar says what holds while it thinks. Then the bar searches the
  web for the answer: pages first, and after a tap on the Images pill, pictures.
- One count of steps runs through both. `data-from` on `.ask` is the first step of the second road.
- Both roads go at 55svh a step, which is the chapters' pace, so the page keeps one tempo from the bar to its
  end. A road's length is its steps times that (`.desk::after` and `.desk-stage::after` in `assets/unimo.css`;
  the first is shorter by the three tenths of a screen it starts before the stage is held). To add a step, add
  55svh to its road.
- The caption's place is one grid cell that the captions take turns in. The agent's name (`.topic`) keeps the
  first line of it while the points under it (`.is-under-topic`) change.
- The bar under the scene goes through three modes, as the app's does: all, the agent's, the web's. Their parts
  are all in the markup. A part of the second or third mode is marked `in-mode`, and while one is on, the parts
  marked `in-all` step aside. A pill that is about to be taken holds a `.pick`, which is on for that step.
- Searching the web, the bar draws what the app draws (`unimo-ui-lib`, `result.css` and `action-bar.css`): pills
  that keep their width and run off the end; rows of title, address and two lines of the page; pictures as tiles
  in the shape of each picture, in rows that fill the width. Both lists are longer than the room under the bar
  and are cut where it ends, as a list that scrolls is.
- The pictures are fetched when the bar comes near, not when the tiles are first shown: until then the tiles wait
  laid out and unseen (`.is-mosaic:not(.on)` in `assets/unimo.css`).
- While the agent thinks, the icon of its row is the apps' own spinner: a dot on a tumbling orbit that trails the
  logo's colours. (The app keeps the agent's mark there and turns the spinner beside the word "Thinking".) `assets/spinner.js` draws it on a canvas with the numbers of `unimo-ui-lib` (`pixel.ts`,
  `Spinner.tsx`). It moves only while it can be seen, and stands still for a visitor who asked for less motion.
  The canvas has to get its size from the styles: `spinner.js` sees to it that it has no size of its own,
  because a canvas as large as its bitmap, with a bitmap cut to the canvas, doubles on every frame.
- What the caption claims for the agent is what the apps do: a fact is checked on up to three sites
  (`researchWeb` in `desktop-app/src/agent/tools.ts`), and what the agent reads cannot give it orders
  (`tainted-love`, the library the agent runs on). That nothing is kept and that EU law applies are the
  operator's promises: they are not something this repository can show. The same goes for the web search: the
  gateway passes a search on without the searcher's identity (`gateway/README.md`), and that nothing is logged
  is a promise.
- Each web result wears its site's own icon, as in the app, which draws a globe only where a site has none.
- The three pages in the web results are real pages with words of this site's own under them. The first, the
  encyclopedia's, is translated with the page, address and all; the other two stay as they are.

- The devices are sized in shares of the scene's width, so the scene scales as one piece. Up to 45rem wide the
  phone stands in front of the laptop; from there on they stand side by side.
- The laptop is a plain modern one. A visitor on a Mac gets a MacBook instead (`:root[data-os='mac']`, set by the
  script in the head). The phone is always an Android phone, because that is where unimo runs: a black home
  screen with unimo's bar at its foot, a slim dark pill as the Android app draws it (`android-app`,
  `res/layout/main.xml`, `drawable/glass_pill.xml`).
- The laptop's screen follows the visitor's system too. Its bar (`.sysbar`) is a menu bar on a Mac, a taskbar at
  the foot of the screen on Windows, a plain panel elsewhere, and always ends in the tray, where unimo's icon sits
  beside the clock.
- The wallpaper is the one the visitor's system ships with, in light and dark: a `<picture class="wallpaper">`
  per system in the laptop's screen, of which the styles show the visitor's own. There are three: the Mac's,
  Windows' and Ubuntu's. To add one, put its two files in `assets/wallpapers/` (1280 by 800, AVIF), add its
  `<picture>` with `data-for`, and a line to the rule in `assets/unimo.css` that shows it. Without one the screen
  keeps the mark's colours.
- Which Linux a visitor runs, a browser mostly does not say. Firefox on Ubuntu does, and the script in the head
  then marks the page `data-distro="ubuntu"`. Any other Linux (and Ubuntu in a browser that keeps quiet) gets the
  mark's colours.
- The message arrives on the phone under the icon of the app it came from, and on the laptop under unimo's,
  because there it is unimo that shows it.
- The clocks tell the visitor's time, in the visitor's manner (21:41, or 9:41 PM). `assets/clock.js` sets them,
  and the one on the quiet phone, at the turn of each minute: the one timer on the page. Without scripts they say
  9:41.
- Where the desk has no road it shows its last step (`data-still`). Without scripts no part is switched on, and
  the desk is seen at rest.
- The laptop's bezel is drawn twice: as the lid's own ground, and once more as a ring over the screen's edge
  (`.laptop-lid::after`). Everything in the scene ends on a fraction of a pixel, and where the screen ended on
  one, some browsers let the page show through as a light hairline along its right and lower edges.

## Only yours

The third road (`.seal`). A claim stays ("Only you can access it."), the points it rests on take turns under it,
and under the words stands a picture for each. The comment above it in `index.html` lists the six steps. Captions
and steps work as on the desk.

- The first three steps share one picture: the memo from the bar's road, and under it the three places it is in.
  The middle one is our server, which the page calls by what it is for: unimo's backup and sync.
  Scrolling carries the memo from the phone to our server and on to a laptop, and turns its characters on the
  way, from the first to the last: sealed as it leaves, readable again as it arrives. `assets/seal.js` works out
  where the memo is from how far the page has scrolled (`--place` on `.seal-places`, from 0 to 2), so scrolling
  back turns it back.
- Over the place the memo is in stands the mark of what it links to, a video (`.seal-cargo`). On the way to our
  server it loses its shape and its colour and arrives as a blob with a few bits in it; on the way to the laptop
  it comes back. The two outlines are the same twelve curves with other numbers, so `seal.js` draws every
  outline between them from the numbers between (`--sealed` runs from 0 to 1 beside it, for the colour, the play
  button and the bits). The markup has the blob, and the video's outline in `data-plain`: to change either,
  keep the commands of the two paths the same.
- The sealing is real. `seal.js` encrypts the memo in the visitor's browser, with the cipher the apps use for
  what they keep (AES-256-GCM) and a key made for that visit which never leaves the page. What shows as sealed
  is the beginning of what comes out (the nonce and the sealed bytes, in base64), one character for each of the
  memo's own. The line under the places says that the browser did it, and shows only where it did.
- The memo is set in the system's monospace, in which every character is as wide as every other, so one takes
  another's place without anything moving. For the same reason its lines are the markup's (`.seal-line`), not
  the browser's: a sealed line has no spaces to break at. On a wide screen the first two stand side by side,
  with the space that is between them (`.seal-gap`).
- The markup holds the memo as the server holds it: the text of each line is its sealed form, and `data-plain`
  has its words. Without scripts, without a road, or on a page that was not served securely (a browser encrypts
  only for those), that is what shows: the memo sealed, on our server, in characters that were sealed once for
  real when the page was written. Change the memo and they are stale: seal the new words once and give each line
  as many characters of what comes out as it has itself.
- The other three pictures belong to the road alone: a fingerprint in the logo's colours (no password); the
  recovery key as the Android app writes it (64 hex digits in fours,
  `UnimoAccountDialog.java`; most of them hidden here); and the request of a new device to join, as a
  notification like the one on the desk's laptop (the same parts and measures, at life size), with the app's
  two answers (`desktop-app/src/ui/account/Account.tsx`). Without a road the captions say it all, and the memo
  stands after the caption that is about it (`order`, in `assets/unimo.css`).
- The fingerprint keeps still. Every 2.2 seconds a light goes out through it from its middle: the same ridges
  drawn again behind the print, wider and out of focus, of which a growing ring shows (`.seal-glow`, and its
  mask). Where the light leaves the print a ring sets out. Both go by one length of time (`--beat` on
  `.seal-touch`), so they keep step.
- The headings are large enough for one long word to be wider than a phone. A browser is not left to hyphenate
  them: it splits short words too, to even out two lines ("hi-jack"). A long word says where it may break, with
  a soft hyphen (`&shy;`) in its language's file, as "Wiederherstellungsschlüssel" does.
- A screen under 38rem tall holds the stage only without the line under the places, which is left out there.

What the captions say is the wording of `website-draft.md` (sections 6.1 and 9.5), checked against the code: an
email code and no password at sign-up, the phone's fingerprint or screen lock, one recovery key shown once, a
one-time code and a yes on a device already in the account, a wipe on removal.

## Quiet

The fourth road (`.quiet`), a chapter like the one before it, with two claims one after the other. First "Your
old home screen. Designed to hijack your focus.", over a home screen as phones usually have one. Then "Minimal
design.", over unimo's own, with its points: maximum focus, no triggers, no compulsive app checking, no
forgetting why you unlocked. The comment above it in `index.html` lists the five steps.

- The picture is the desk's phone, on its own (`.quiet-scene .phone`), as tall as the screen has room for under
  the captions (`--phone-height`, which takes `--captions-room` off the screen's height).
- The usual home screen is a widget, twenty apps, a dock, and red counts on some. Each app is a tile in one of
  the logo's colours with a drawing of what it is after: a camera that watches, an eye, a megaphone, shelves of
  data, a target, a bell, a cart. The drawings are this site's own (masks in `assets/unimo.css`), and no real
  app or company is shown.
- The first step clears it. As the page scrolls, `assets/quiet.js` takes the pieces away one by one: the
  widget, the apps row by row, the dock. "Minimal design." is only said once the screen is empty and unimo's bar
  has come up: a black screen with one line, which is what unimo's home screen is on Android.
- Two later steps type into the bar as the page scrolls, and show what the words find (`.quiet-take`: the words
  in `.quiet-query`, the row in `.quiet-hit`). "sig" finds Signal, because an app is a word away. "spag" finds
  the memo from the bar's road, which is what the visitor is said to have picked the phone up for; the last
  caption answers the line under the sealed memo ("Nobody is cooking from this." there, "Somebody is cooking
  tonight." here).
- What clutters the screen belongs to the road. Without a road, or without scripts, the phone shows unimo's own
  screen, which is what the markup is.
- What the captions claim is about unimo's home screen on Android: no badges, no widgets, no grid of apps. They
  do not say that the phone's own notifications stop, and they do not say unimo keeps no profile (it keeps a
  simple one).

## The finale

The fifth road (`.finale`), and the last chapter: "One more thing…", and then the bar doing sums. The comment
above it in `index.html` lists the six steps.

- The page goes dark for it, the whole screen at once. `.dusk`, before the chapter, is a stretch of page with
  nothing in it, and while it is scrolled through a black sheet fixed over the screen (`.dusk::before`) grows
  as dense as the stretch is scrolled (`--night` on the page, from 0 to 1, set by `assets/finale.js`). It is complete as the
  chapter comes into view, so no edge between light and dark ever crosses the screen. The night (below) lies over the
  sheet and is black whatever the visitor's theme (`color-scheme: dark`, so every colour takes its dark value in
  there). The top bar fades out under the sheet with the first half of the night and comes back over it with
  the second, dark: it changes while it cannot be seen, when `finale.js` marks the page `is-night`. Without scripts nothing fades,
  and the stretch runs into black as a gradient.
- On the first step the words stand alone. Each later step has a sum (`.sum`), which `finale.js` types into the
  bar as the page scrolls, and under the bar its answer, in the logo's colours and as large as the screen takes:
  as tall as the room kept for it, or as wide as the screen lets so many characters be.
- The answers are the apps' own. Each sum carries in `data-answers` what the desktop app's calculator
  (libqalculate) answers once so many of its characters are typed, so a longer sum shows figures on the way
  ("86.40 + 1" is 87.4, then 101.4, then 99.36). `node tools/sums.mjs "a sum"` prints that attribute; it needs
  the desktop app's folder next to this one, with its packages installed. The answers are written as the app
  writes them: ten significant digits, no grouping, the calculator's own words for units.
- The answer in dollars is of its day: the calculator converts at the rates it carries with it, which are the
  European Central Bank's. Run the tool again before publishing if the figure should be fresh.
- The answers of one sum are all set at the size its longest takes, so a figure that grows while the sum is
  typed grows in place.
- The last sum is seven ones times seven ones, under "Counts better than a super AI." Its answer changes with
  every digit of the second number (1111111, 12222221, 123333321 …) and ends as 1234567654321, the same
  forwards and backwards, which is what the page ends on. So that this can be watched, the sum is typed three
  times as slowly from the second number on (`data-lingers-from`) and takes more of its step (`data-typed-by`).
  The calculator writes out thirteen figures and no more: with eight ones the answer comes in powers of ten.
- Without scripts, or without a road, the chapter reads as a list with the last sum whole, which is what the
  markup has.

## The night

From the finale to the end of the page everything stands on one black ground (`.night`, which wraps the finale,
Features and the credits). It lies over the sheet that darkened the page, and inside it every colour takes its
dark value, whatever the visitor's theme. It is one box on purpose: with a black ground for each part, what lay
under them showed through as a hairline where two met on a fraction of a pixel. A part added after the finale
goes inside it.

## Features

`#features`, after the finale: "Long story short." A line under the heading says what unimo is, for a visitor who
came here straight from the top bar. Then four panes, one for each of four things by name: synchronization,
backups, security, privacy. A pane is a picture of the thing, its name and a claim set as one headline in two
tones (as the chapters set theirs), and four facts, each a few words that can be read alone with a line under
them. Under the panes stands what unimo does without: no ads, no trackers, no VC money.

- It is not a road. It scrolls with the page, and `assets/features.js` only lights it as it comes up the screen:
  a pane at once, when the middle of its picture has come far enough (`data-lights`), and the heading and the
  last line a word at a time (`data-lights-by-word`); it puts them out again when the page is scrolled back.
  Where everything stands is worked out when the page changes shape or language, not while it scrolls. Without
  scripts, or for a visitor who asked for less motion, everything is lit and nothing moves.
- A pane is made of what the bar is made of on a dark ground: the bar's tone, its corner and its lit rim.
  Nothing is laid over a pane for effect. The only colour in one is its picture's, and the only gradient type
  is the first cipher's name, which answers the finale's numerals.
- On a wide screen the first and the last pane take the whole width, with their facts side by side, and the two
  between them stand as a pair (both show sealed text). On a phone the four stand one under the other.
- No fact is said twice. The facts were once four to a pane for symmetry's sake and repeated each other
  (encryption three times, the backups' numbers twice); when a fact is added, check the other panes for it.
- The pictures (`.art`) are drawn by the styles, move only while their pane is lit, and are for the eye alone:
  whatever one shows is also said in the pane's words.
  - Synchronization: unimo's icon in the light it has on the first screen, with the five systems going round
    it. A mark's course is two swings at once, side to side and near to far, a quarter of a round apart, which
    makes the oval; near, it passes in front of the icon, and far, behind it. A change goes round: each mark
    lights in turn.
  - Backups: three slips with the same sealed text, which is the memo as the page's markup has it sealed. The
    third stands apart and wears another colour, for the other provider, and a write lands on each in turn.
  - Security: the ciphers by name, the first from edge to edge. They come out of noise as the pane lights
    (`data-decodes`, in `features.js`).
  - Privacy: a point and four rings that rise out of the pane's foot, one for each level in the list under
    them, from the nearest out: your devices, our servers, the web, the law. A ring and its fact wear one
    colour, and the ring of the fact under the pointer stays lit.
- What the panes claim, and where it comes from. In the code: the six things synced; the clipboard off until
  it is switched on, its five items, the notifications' own switch (on by default in the Android app) and their
  24 hours; the five systems, each with a download; AES-256-GCM for content, ML-KEM-1024 for key exchange and
  ML-DSA-87 for signatures, with every change signed (`ts-sdk/README.md`); that even the names of a user's
  devices are encrypted (`gateway/src/users/types.ts`); the account key in the phone's secure hardware on
  Android, no password, a recovery key shown once, a one-time code and a yes for every new device, a wipe on
  removal; three storage targets that every write is copied to (`S3_*_A`, `_B`, `_C` in the gateway); searches
  and questions passed on without the asker's account or address; and no analytics in the apps (the Android app
  reports crashes in debug builds only). The operator's word, which the repositories cannot show: that the
  three targets are with two providers, that all of it is hosted in the EU and out of reach of the US CLOUD Act
  (which goes by who controls a provider, not only by where its servers stand), that what the AI is asked is
  not kept, and that unimo takes no venture capital and is paid for by its users alone.
- The encryption has not had an independent audit (`ts-sdk/README.md` says so), and the panes do not claim one.
- "Sealed" and "We only ever hold ciphertext" are said of what is synced. Searches and questions pass through
  unimo's server in the clear, on their way out, and the privacy pane says so ("unimo asks … for you").

## The credits

`#open-source`, the end of the page for now: "Everything is open source. Standing on the shoulders of giants."
The line under it names unimo's own licences, as the `LICENSE` files have them: GPLv3 for the Android app, MIT
for everything else. Then what unimo is built on, laid out as at the end of a film: what a thing is for on one
side of the middle, smaller and quieter, and whose it is on the other, each name a link to its project. KISS
Launcher, which the Android app is a fork of, comes first with a line to itself, a little larger than the rest:
top billing, not a title. The page ends on the thanks.

- Every name is in the apps' or the server's own list of what they are built from: KISS (`android-app` is a
  fork of it), Tauri, SolidJS, libqalculate and QuickJS (`desktop-app/package.json`), fend and ZXing
  (`android-app`), noble and Bouncy Castle (the two SDKs), Bun, Hono and Valkey (`gateway`), Vite, Playwright
  and Vitest (the tools). When one of these is replaced, replace it here.
- The names are not underlined at rest, as credits are not; a link shows under the pointer or the keyboard's
  focus, and the room round a name is the link's too, for a thumb.
- The page does not yet link to unimo's own source. "Everything is open source" wants that link, to
  repositories anyone can read.

## Publishing

The files carry no version in their names, so for a few minutes after a new version is published a returning
visitor's browser may run an old copy of one script beside a new copy of another. A change to what one script
expects of another (what `road.js` hands to `bar.js`, say) can misbehave for that long.

## Colours and icons

The colours are the apps' own tokens (`unimo-ui-lib`, `tokens.css`), written with `light-dark()`: light or dark
follows the visitor's system. The only other colours are the nine stops of the logo's gradient, which also make
the wallpaper on the laptop's screen where the page has no picture for the visitor's system.
The favicon files are the logo (`desktop-app/public/o-logo.png`) on white: a disc for browser tabs, a square for
home screens.

The logo on the page is drawn by the styles: four rings (a mask of four circles) cut out of the gradient. It is
drawn two ways, as the logo file has it (`.mark`, in the top bar) and as the apps draw it small (`.rings`, in the
bar, the tray, the laptop's message and the request to join).

The Mac's wallpapers are macOS's own default, cut to the screen's shape. On a Mac:

```bash
sips -c 3760 6016 "/System/Library/ExtensionKit/Extensions/NeptuneOneWallpaper.appex/Contents/Resources/TahoeLight.heic" --out crop.heic
sips -z 800 1280 crop.heic -s format png --out crop.png
sips -s format avif -s formatOptions 55 crop.png --out assets/wallpapers/mac-light.avif
```

and the same with `TahoeDark.heic` for `mac-dark.avif`.

The app icons are each app's own, as that Mac shows it, at 128 pixels. `tools/app-icons.swift` writes them:

```bash
swiftc -O tools/app-icons.swift -o /tmp/app-icons && /tmp/app-icons assets/apps
```

They are PNG and not AVIF like the other pictures: an icon is a shape on nothing, and not every browser reads the
transparency of an AVIF that macOS has written. One that does not draws the icon on black.

The other wallpapers were cut the same way (the middle of the picture, 16 by 10) from:

- Windows 11's "Bloom", light and dark: the two "Windows 11 Bloom Screensaver" pictures Microsoft offers for
  download on its Windows 11 launch page (<https://news.microsoft.com/windows11-general-availability/>).
- Ubuntu 26.10's default, light and dark: `warty-final-ubuntu.png` and `ubuntu-wallpaper-d.png` from Ubuntu's own
  package `ubuntu-wallpapers_26.10.1_all.deb` (<http://archive.ubuntu.com/ubuntu/pool/main/u/ubuntu-wallpapers/>).

When a system gets a new default, replace its two files.

The faces in `assets/people/` are cut from pictures the owner of this site supplied. `mom` is from a still of a
film or television production: whose it is, and whether the page may show it, is open as well. `miska` and
`mert` are photographs of people the owner knows, shown under their first names: the page needs their say-so.

The five pictures in `assets/found/` are plates from A. H. Layard's books on Nineveh (1849 to 1853), taken from
Wikimedia Commons, where each is marked as in the public domain. They need no credit. Cut to the tiles' shapes:
`hall` and `palaces` are "Artist’s impression of a hall in an Assyrian palace" and "Artist’s impression of
Assyrian palaces" (The Monuments of Nineveh, 1853); `bowl` is "Layard Nimrud Phoenician metal bowl - Plate 67";
`relief` is "Plate 6 fish god (A second series of the monuments of Nineveh)"; `windows` is "Stylised Phoenician
windows from a relief in Nineveh".

The fingerprint under "No password." follows Lucide's (<https://lucide.dev>, ISC licence, which asks that its
notice travel with copies), stroked with four of the logo's colours. Its paths were written out from memory:
compare them with the original before the page is published. The video's mark that travels with the sealed memo is YouTube's, which is Google's trade
mark: the memo links to a video there, and whether the page may show the mark is open like the rest.

The icons in `assets/sites/` are the three sites' own, as each serves them: Wikipedia's
(`en.wikipedia.org/static/apple-touch/wikipedia.png`), Britannica's (`britannica.com/favicon.png`) and World
History Encyclopedia's (`worldhistory.org/apple-touch-icon.png`). They are those sites' marks, shown beside
their own pages in a list of search results; whether the page may show them is open like the rest.

None of the other pictures is unimo's. The Mac's wallpaper and the app icons belong to Apple (the icons of other
apps to their makers) and Bloom to Microsoft: whether the page may show them is a question that is still open.
Ubuntu's is Canonical's, under CC BY-SA 4.0, which allows it on two conditions: the page has to credit it
("Ubuntu wallpaper © Canonical Ltd, CC BY-SA 4.0", with a link to the licence), which it does not do yet, and the
two cut files in `assets/wallpapers/` stay under that same licence.
