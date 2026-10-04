/* Peel – tile swatches: a tiny CSS preview of each edition, so the picker shows the look rather than an emoji. */
(function () {
  const Peel = (window.Peel = window.Peel || {});
  const lines = (c, w = 2, gap = 6) => `repeating-linear-gradient(0deg, ${c} 0 ${w}px, transparent ${w}px ${gap}px)`;
  const dots = (c, s = 6) => `radial-gradient(${c} 1px, transparent 1.6px) 0 0 / ${s}px ${s}px`;
  // Each swatch: { bg, fg (text sample colour), sample (short text), font?, extra? (inner element class) }
  Peel.swatches = {
    original:   { bg: 'linear-gradient(135deg,#fff,#eef1f6)', fg: '#222', sample: 'Aa', chrome: true },
    light:      { bg: 'linear-gradient(160deg,#fbfbfa,#f1efe9)', fg: '#1b1b1b', sample: 'Aa' },
    dark:       { bg: 'linear-gradient(160deg,#17171c,#2a2a33)', fg: '#f3f3f3', sample: 'Aa' },
    noir:       { bg: 'linear-gradient(160deg,#0b0b0b,#4a4a4a 60%,#d9d9d9)', fg: '#fff', sample: 'Aa', grain: true },
    paper:      { bg: `${lines('rgba(0,0,0,.08)',1,5)}, linear-gradient(160deg,#f6f1e4,#e9e1cf)`, fg: '#1a1a1a', sample: 'Aa', font: 'Georgia, serif' },
    glowy:      { bg: 'radial-gradient(60% 60% at 30% 30%,#ff2d75 0,transparent 60%), radial-gradient(50% 50% at 80% 80%,#00e5d4 0,transparent 60%), #0b0014', fg: '#fff', sample: 'Aa', glow: '#ff2d75' },
    y2100:      { bg: 'linear-gradient(135deg,#061a2b,#1a0a3a), radial-gradient(40% 40% at 70% 30%,#00c8ff55,transparent)', fg: '#9ff', sample: 'AA', font: '300 14px system-ui', scan: true },
    y1996:      { bg: '#c0c0c0', fg: '#0000ee', sample: 'Aa', font: '"Times New Roman", serif', bevel: true },
    y2007:      { bg: 'linear-gradient(180deg,#dff0ff,#8cc4ff 50%,#4a9be6 51%,#7fbcf2)', fg: '#fff', sample: 'Aa', font: '"Lucida Grande", sans-serif', gloss: true },
    mac1984:    { bg: `${dots('#000',3)}, #fff`, fg: '#000', sample: 'Aa', font: 'Monaco, monospace', border: '#000' },
    terminal:   { bg: `${lines('rgba(0,0,0,.35)',1,3)}, #061a06`, fg: '#39ff14', sample: '>_', font: 'Menlo, monospace', glow: '#39ff14' },
    vhs:        { bg: 'linear-gradient(160deg,#2b2b2b,#555), ' + lines('rgba(255,255,255,.08)',1,3), fg: '#fff', sample: '▶', font: 'Courier, monospace', fringe: true },
    blueprint:  { bg: `${lines('rgba(255,255,255,.18)',1,8)}, repeating-linear-gradient(90deg,rgba(255,255,255,.18) 0 1px,transparent 1px 8px), #0d3b8c`, fg: '#dff', sample: 'A', font: 'Futura, sans-serif' },
    sketch:     { bg: 'linear-gradient(160deg,#f7f3ea,#eee7d6)', fg: '#2a2522', sample: 'Aa', font: '"Bradley Hand", cursive', wobble: true },
    comic:      { bg: `${dots('#ffb020',4)}, #fff26b`, fg: '#111', sample: 'POW', font: '900 11px Impact, sans-serif', border: '#111' },
    polaroid:   { bg: 'linear-gradient(160deg,#efeae0,#e2dacb)', fg: '#333', sample: '', photo: true },
    snow:       { bg: `${dots('#fff',7)}, linear-gradient(180deg,#9fc4e8,#dfeefb)`, fg: '#1f3a5f', sample: 'Aa' },
    rain:       { bg: 'repeating-linear-gradient(100deg,transparent 0 6px,rgba(255,255,255,.35) 6px 7px), linear-gradient(180deg,#5d6b7c,#9aa6b4)', fg: '#eef', sample: 'Aa' },
    underwater: { bg: 'radial-gradient(30% 30% at 70% 30%,rgba(255,255,255,.5),transparent), linear-gradient(180deg,#5fc7d6,#0b3a5c)', fg: '#e6fbff', sample: 'Aa', bubbles: true },
    pest:       { bg: 'radial-gradient(40% 40% at 20% 20%,rgba(70,90,30,.6),transparent), radial-gradient(40% 40% at 85% 75%,rgba(60,40,10,.6),transparent), #efe9dc', fg: '#3b2f10', sample: '🪳' },
    haunted:    { bg: 'radial-gradient(50% 60% at 50% 100%,rgba(200,200,220,.35),transparent), #141216', fg: '#d8d0c8', sample: 'Aa', font: 'Baskerville, serif' },
    redacted:   { bg: `${lines('#111',3,7)}, #efeae0`, fg: '#111', sample: '', font: '"Courier New", monospace', stamp: true },
    matrix:     { bg: `repeating-linear-gradient(90deg,transparent 0 5px,rgba(0,255,90,.25) 5px 6px), #020a02`, fg: '#0f0', sample: '01', font: 'Menlo, monospace', glow: '#0f0' },
    konami:     { bg: 'linear-gradient(90deg,#ff004c,#ffb700,#00ff85,#00c2ff,#b000ff)', fg: '#fff', sample: '↑↑↓↓', font: '900 9px monospace' },
    gravity:    { bg: 'linear-gradient(180deg,#fff,#eef)', fg: '#222', sample: 'Aa', fall: true },
    asteroids:  { bg: `${dots('#fff',9)}, #05060c`, fg: '#fff', sample: '▲', font: 'Menlo, monospace' },
    focus:      { bg: 'radial-gradient(35% 35% at 50% 50%,#fff 0,#fff 40%,rgba(0,0,0,.85) 100%)', fg: '#111', sample: 'Aa' },
    bigtype:    { bg: '#fffdf7', fg: '#111', sample: 'Aa', font: '800 20px system-ui' },
    macos:      { bg: 'linear-gradient(160deg,#d9e6ff,#f6e9ff)', fg: '#111', sample: '', traffic: true },
    win11:      { bg: 'linear-gradient(160deg,#9bc3ff,#e1c7ff)', fg: '#111', sample: '', mica: true },
    win95:      { bg: '#008080', fg: '#000', sample: '', titlebar: true },
    typewriter: { bg: `${lines('rgba(0,0,0,.05)',1,6)}, #f4efe3`, fg: '#222', sample: 'Qwerty', font: '"Courier New", monospace', ink: true },
    // toys
    blast:      { bg: 'radial-gradient(40% 40% at 50% 50%,#ffb347,#ff5e3a 60%,transparent 62%), #fff3e8', fg: '#fff', sample: '' },
    hammer:     { bg: 'linear-gradient(160deg,#f6f6f7,#e2e2e6)', fg: '#111', sample: '🔨' },
    tear:       { bg: 'linear-gradient(135deg,#fff 0 48%,#ffd27a 48% 52%,#fff 52%)', fg: '#111', sample: '', torn: true },
    hole:       { bg: 'radial-gradient(45% 45% at 50% 50%,#000 0 40%,#7a3cff 60%,#ffb347 75%,transparent 80%), #0b0014', fg: '#fff', sample: '' },
    spray:      { bg: 'radial-gradient(30% 30% at 35% 45%,#ff2d75,transparent 70%), radial-gradient(30% 30% at 65% 55%,#2bd1ff,transparent 70%), #f6f6f7', fg: '#111', sample: '' },
  };
  Peel.swatch = (id, emoji) => {
    const sw = Peel.swatches[id] || { bg: `hsl(${[...id].reduce((n, c) => (n * 31 + c.charCodeAt(0)) % 360, 0)} 70% 94%)`, fg: '#222', sample: emoji || 'Aa' };
    const el = document.createElement('span'); el.className = 'sw'; el.style.background = sw.bg;
    if (sw.border) el.style.boxShadow = `inset 0 0 0 2px ${sw.border}`;
    if (sw.sample) { const t = document.createElement('i'); t.textContent = sw.sample; t.style.color = sw.fg; if (sw.font) t.style.font = sw.font.includes('px') ? sw.font : `700 15px ${sw.font}`; if (sw.glow) t.style.textShadow = `0 0 8px ${sw.glow}`; el.appendChild(t); }
    for (const k of ['chrome', 'grain', 'scan', 'bevel', 'gloss', 'fringe', 'wobble', 'photo', 'bubbles', 'stamp', 'fall', 'traffic', 'mica', 'titlebar', 'ink', 'torn']) if (sw[k]) el.classList.add('sw-' + k);
    return el;
  };
})();
