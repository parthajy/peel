# Chrome Web Store listing

**Name:** Peel
**Summary (132 chars max):** One look for every site. Paper, Dark, 1996, macOS, Typewriter and 25 more. Drag the corner to flip. No AI, no tracking.

**Category:** Fun · **Language:** English

## Description

Peel puts one look on every site you open.

Pick an edition and the whole web wears it: Paper prints everything like a newspaper, Dark flips the lights, 1996 brings back Times New Roman and a visitor counter, macOS gives every card traffic lights and a dock, Typewriter hammers headlines out letter by letter. Thirty editions in packs: Core, Eras, Materials, Weather, Weird, Systems, Play and Focus.

Flip between them by dragging the corner of any page. The old look curls off like a sticker; or choose Shatter, Burn, Pixelate or TV off.

Toys you can pick up: Blast, Hammer, Tear, Black hole, Spray paint. Everything comes back with Rewind.

Remix your own edition from a library of effects (grain, snow, fireflies, comets, typewriter entrances, a cat) and share it as a short code.

Moods let the clock or the calendar choose: Snow in December, Haunted at Halloween, Terminal after midnight.

Peel is pure fun and pure client side. It never reads your data, never contacts a server, never clicks or posts on your behalf. Sounds are off by default and synthesized in the browser.

## Permissions, in plain words

- **storage**: remembers your edition, remixes and settings (synced with your Chrome profile) and local things like your spray wall.
- **activeTab and access to pages you visit**: needed to restyle pages and to take a local screenshot of the tab for the flip animation. The screenshot stays in memory for under a second and is never saved or sent.

## Privacy policy

Peel does not collect, transmit or sell any data. All settings live in Chrome's extension storage on your devices. The extension makes no network requests of its own. Screenshots used for the flip animation are created and discarded locally. There are no analytics, no accounts and no third-party code.

## Screenshots to take (1280×800)

1. Hacker News in Paper, corner mid-curl revealing Dark.
2. The picker open over a news site, Systems pack visible.
3. Pest Infected with the bug score showing.
4. Tear mid-rip across LinkedIn.
5. The Remix mixer.

---

# Dashboard form answers

## Single purpose description

Peel restyles the web pages you visit with a chosen visual theme ("edition"), such as newspaper, dark, 1996 or macOS, and lets you switch themes with an animated page flip. All processing happens locally in the browser; the extension has no server component and collects no data.

## storage justification

Used to remember the user's chosen edition, custom remixes and preferences (synced via chrome.storage.sync so they follow the user's Chrome profile), and small local items in chrome.storage.local: sites where the user disabled Peel, optional per-site visit counts for the "Patina" effect, and spray-paint drawings the user explicitly chose to keep. No data is transmitted anywhere.

## activeTab justification

Grants access to the current tab when the user opens the toolbar popup, so the popup can read which edition is active on that page, apply the edition the user picks, and trigger the flip animation on that tab.

## Host permission justification

Peel's single purpose is to restyle any page the user visits, so its content script must run on all http/https pages to inject the theme CSS and the page-corner control. Broad host access is also required for chrome.tabs.captureVisibleTab, which produces the screenshot used to animate the transition between two looks when the user drags the page corner (a gesture that does not grant activeTab). The screenshot is kept in memory for under a second and discarded; it is never stored or transmitted. The extension makes no network requests of any kind.

## Remote code

No, I am not using remote code. All JavaScript and CSS ship inside the package; there is no eval, no external script tags and no dynamically loaded code.

## Data usage

Tick none of the data types. Certify all three disclosures. Peel does not collect, transmit or sell any user data; everything it stores stays in the browser's extension storage on the user's own devices.

## Privacy policy URL

Publish PRIVACY.md at a public URL (GitHub repo, GitHub Pages or a public Gist) and paste that link.
