# 🍊 Peel

**Peel the web.** Same sites, sexier skins. Install one extension and read Hacker News as a 1920s broadsheet, shop Amazon like a dating app, and give LinkedIn a pulse.

No AI. No servers. No tracking. Peel never makes a network request, never clicks, posts, scrolls or fetches on your behalf. It reads what is already on the page and re-dresses it, the way a user stylesheet does. Your shortlist and settings live in your own browser storage.

## Editions

One edition, every site you open. Pick it once and it follows you everywhere, until you flip to another. Thirty built in, grouped in packs, plus whatever you remix.

| Pack | Editions |
|---|---|
| **Core** | ☀️ Light · 🌑 Dark · 🎞️ Noir · 📰 Paper (confident pages get a full newspaper or reader relayout) · 🔮 Glowy · 🛸 2100 |
| **Eras** | 💾 1996 (marquee, visitor counter, UNDER CONSTRUCTION) · 🫧 2007 (gloss, reflections, BETA) · 🖥️ 1984 (one-bit dither) · 🖳 Terminal (green phosphor, typed headlines) · 📼 VHS (tracking, fringing, timestamp) |
| **Materials** | 📐 Blueprint · ✏️ Sketch · 💥 Comic (POW on click) · 📸 Polaroid (every image an instant photo with its caption) |
| **Weather** | ❄️ Snow · 🌧️ Rain · 🐠 Underwater |
| **Weird** | 🪳 Pest Infected · 👻 Haunted (text rots, pictures change on hover) · 🕵️ Redacted (bars lift on hover) · 🟩 Matrix |
| **Systems** | macOS (traffic lights, menu bar, dock) · Windows 11 (Mica, centred taskbar) · Windows 95 (title bars, bevels, Start) · Typewriter (Courier on bond, clacks, headlines hammered out) |
| **Play** | 🪂 Gravity (click anything and it falls) · 🚀 Asteroids (arrows steer, space fires, G pauses; shoot the content) |
| **Focus** | 🔦 Focus (flashlight cursor) · 🔍 Big Type |
| *Secret* | Type the Konami code on any page |

## Remix

The picker's **Remix** tab builds your own edition from the effects library: pick a base look, add overlays (grain, scanlines, fog, light leaks, glitch…), a particle system (snow, rain, embers, bubbles, fireflies, confetti, leaves, stars, matrix, bugs), a cursor (comet, sparkle, flashlight, ripple), an entrance (rise, fade, slide, blur, stamp, flip, typewriter) and ambient motion (flicker, breathe, sway, hue drift, heartbeat, melt, twitch, decay). Also pick what happens on click, a companion, and an ambient sound. Preview, save to **Mine**, copy a `peel1.…` share code, paste someone else's to import.

## It plays back

- **Doomscroll meter.** The longer you keep scrolling, the more an edition leans in: snow falls harder, bugs multiply, Pest Infected tilts further, Haunted gets darker. Stop scrolling and it eases off.
- **Snow settles** on the tops of headlines, images and cards, and piles up along the bottom of the window.
- **Bugs are squishable.** Click one in Pest Infected: splat, a stain, a point. Your score per site is kept locally, and a new bug crawls in.
- **Click bursts.** Confetti in 2007, sparks in Terminal, ink in Sketch, splashes in Rain, bats in Haunted, a flash in Polaroid, pixels in 1996.
- **The corner talks**, rarely, with context ("It's 2am. Terminal?", "Okay, okay." after nine flips). Tap the bubble to dismiss. Turn it off in the popup. Left alone long enough, it wiggles.
- **A cat** walks the bottom of the window in Light, Snow and Polaroid, sits on headlines, sleeps on pictures, and bolts when clicked.
- **Sounds, off by default.** Everything is synthesized in the browser: paper rip on the curl, VHS clunk, typewriter clicks in Terminal, a modem handshake when 1996 loads, rain, wind and underwater loops, a splat per bug. One switch in the popup.

## Moods, patina, shots

- **Mood** (picker or popup): **Shuffle** picks a random edition per page load, **Daily** gives everyone a new one each day, **Seasonal** switches to Snow in December, Haunted at Halloween, Glowy for Diwali and so on, **Clock** goes Terminal after midnight, Light at breakfast, Dark in the evening, Noir late. Picking an edition by hand turns Mood off.
- **Patina** (off by default): sites you visit a lot slowly yellow and gather dust; a site you come back to after weeks has grown moss. Visit counts live in local storage only.
- **📷 in the picker** saves a PNG of the current look with a small Peel badge, and the share code if it's a remix.

## Toys

Tools you pick up, in the picker's **Toys** tab. They work on top of any edition. **Esc** drops the tool, **R** (or ◀◀ Rewind) puts everything back with a VHS whirr.

- 💥 **Blast.** Click, or hold to charge. Everything within reach flies outward, tumbles and settles.
- 🔨 **Hammer.** Whack an element: it dents and cracks. Third hit, it shatters into falling shards (clones with clip-path, so text breaks too).
- 📄 **Tear.** Drag in from any edge. A jagged rip opens along your path, and what shows through is the page in your previous edition. Tear far enough and both halves fall away: you've flipped.
- 🕳️ **Black hole.** Click to open one. Nearby elements stretch and spiral in. Click it again and it spits them back.
- 🎨 **Spray paint.** Tag the page, drips included. Paint lasts for the visit; press **Keep** in the spray bar to save the wall for that site. Rewind wipes it either way.

## Transitions

The flip between editions is a page curl by default. Pick **Shatter**, **Burn**, **Pixelate**, **TV off** or **Random** in the picker. Dragging the corner always curls.

## How you flip

Every page has a lifted sticker corner at the bottom-right.

- **Drag the corner** up and to the left: the current look curls off like a page and the next edition is underneath. Let go past a third of the way to finish; let go early and it snaps back.
- **Tap the corner** for the picker: all editions, "Not on this site", and page modes.
- **Shift+F** next edition. **Shift+P** toggles the original.
- Changing the edition in one tab changes it in every open tab.

The flip is a real page curl over a local screenshot of the old look, taken by the extension and discarded immediately. Nothing leaves the browser.

## Page modes

Where a page is understood, the picker also offers a full rebuild: **📰 Front page** (Hacker News, Reddit, news fronts), **💘 Swipe** (Amazon and Flipkart search results, with a shortlist and best-value badges), **🌙 Reader** (article pages). Drag the corner on a rebuilt page to peel it back off.

## Ship it

`scripts/pack.sh` builds `dist/peel-<version>.zip` for the Chrome Web Store. Listing copy, permission explanations and the privacy policy are in [STORE.md](STORE.md).

## Install (developer mode)

1. Open `chrome://extensions`, turn on **Developer mode**.
2. **Load unpacked** → pick this folder.
3. Open any site, drag the corner.

If you edit any `.css` file, run `python3 scripts/bundle-css.py` and reload the extension. CSS is inlined into `src/styles.js` so Peel never fetches anything, which keeps it working on strict-CSP sites.

## How it is built

- `src/editions/*` are the global looks: a CSS file scoped to `html[data-peel-edition="id"]` plus a short `fx` recipe. Invert-based editions (Dark, Glowy, 2100, Terminal, Matrix, Blueprint) flip luminance on the root element with media re-inverted; their colours are authored in flipped-luminance space.
- `src/fx/` is the effects library: `fx.js` (dispatcher, overlays, SVG filter bank, scroll entrance, ambient motion, cursors), `particles.js` (one engine, eleven presets), `overlays.css` and `motion.css`. A recipe looks like `['grain:.12', 'vignette', { type: 'particles', preset: 'snow' }]`.
- `src/ui/transitions.js` animates the old look's screenshot away: shatter, burn, pixelate, TV off.
- `src/early.js` runs at `document_start` and applies your edition's CSS before the page paints.
- `src/ui/curl.js` is the page curl: pure geometry (fold line = perpendicular bisector between the corner and your pointer) driving `clip-path` polygons and three fixed layers. No canvas.
- `src/adapters/*` read a page into plain objects; `src/experiences/*` render page modes into `#peel-root`, a fixed overlay with its own scroll and shadow DOM.
- `src/core/peel.js` ties it together: editions, modes, drag, keyboard, popup messages, cross-tab sync.

### Adding an edition

```js
Peel.registerEdition({
  id: 'vapor', name: 'Vaporwave', emoji: '🌴', tagline: 'A E S T H E T I C', pack: 'weird', css: 'src/editions/vapor.css',
  fx: ['grid:.3', 'scanlines:.08', { type: 'particles', preset: 'stars' }, { type: 'ambient', kinds: ['hue'] }],
  apply(doc, ctx) { /* optional extras: add elements to ctx.fx, register ctx.onDestroy(fn) */ },
});
```

Scope every rule in the CSS to `html[data-peel-edition="vapor"]`, add the script to `manifest.json` before `src/ui/curl.js`, run the CSS bundler.

## Staying on the right side of every site

- Only CSS, DOM reads and local screenshots. No automation, no API calls, no scraping to anywhere.
- The original page keeps running underneath; Original is one flip away.
- Links always go to the real site, opened by you.
