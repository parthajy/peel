/* Peel – orchestrator. One global edition on every site (built-in or remixed); page modes on top where a page allows it.
   The lifted corner: drag = next edition in the current pack (or peel a mode back), tap = picker. */
(function () {
  if (window.top !== window) return;
  const Peel = window.Peel;
  const { h } = Peel.dom;
  Peel.loadCss = async (path) => (Peel.css && Peel.css[path]) || '';

  const Z = 2147483640;
  const PACKS = [['core', 'Core'], ['eras', 'Eras'], ['materials', 'Materials'], ['weather', 'Weather'], ['weird', 'Weird'], ['systems', 'Systems'], ['play', 'Play'], ['focus', 'Focus'], ['mine', 'Mine']];
  const S = { adapter: null, data: null, edition: null, globalEdition: null, lastEdition: null, lastPack: 'core', excluded: false, prefs: {}, custom: {}, fxHost: null, edStop: null,
    mode: null, variant: null, options: {}, modeAuto: false, root: null, scrollY: 0, busy: false, ui: null, curl: null, picker: null, canvas: null, lastUrl: location.href };
  const host = () => location.hostname.replace(/^(www|m|old|new)\./, '');
  // Invert-based editions flip the whole root; Peel's own layers get the inverse so they look normal. Inline, because the hosts use all:initial.
  const counterFilter = (ed) => (ed && ed.invert ? (ed.counter || 'invert(1) hue-rotate(180deg)') : '');
  const applyCounter = (ed) => { const f = counterFilter(ed); for (const id of ['peel-ui', 'peel-fx', 'peel-root', 'peel-patina', 'peel-toys']) { const el = document.getElementById(id); if (el) el.style.filter = f; } };
  Peel.counterFilter = () => counterFilter(resolveEdition(S.edition));
  const snd = (n) => { if (Peel.sound && S.prefs.sound) Peel.sound.play(n); };
  const motionOK = () => S.prefs.motion !== false && !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---------- editions: built-in + custom (remixed) ---------- */
  function resolveEdition(id) {
    if (!id) return null;
    const built = Peel.registry.edition(id); if (built) return built;
    const c = S.custom[id]; if (!c) return null;
    const base = Peel.registry.edition(c.base) || Peel.registry.edition('light');
    return { id, name: c.name || 'Remix', emoji: c.emoji || '🧪', tagline: `Remix of ${base.name}`, pack: 'mine', base: base.id, css: base.css, invert: base.invert, counter: base.counter, relayout: base.relayout,
      fx: [...(c.baseFx !== false ? base.fx || [] : []), ...(c.fx || [])], apply: c.baseFx !== false ? base.apply : null, custom: true };
  }
  const allEditions = () => [...Peel.registry.editions.filter((e) => !e.hidden || S.prefs.secret), ...Object.keys(S.custom).filter((k) => k !== 'custom-preview').map(resolveEdition).filter(Boolean)];
  const packOf = (id) => { const e = resolveEdition(id); return (e && e.pack) || 'core'; };
  function ringNext() {
    const pack = S.edition ? packOf(S.edition) : S.lastPack;
    const ids = allEditions().filter((e) => e.pack === pack).map((e) => e.id);
    if (!ids.length) return Peel.registry.editions[0].id;
    const ring = [...ids, null];
    return ring[(ring.indexOf(S.edition) + 1) % ring.length];
  }

  /* ---------- status / detection ---------- */
  function status() {
    const modes = S.data ? Peel.registry.experiencesFor(S.data.kind).filter((e) => e.mode === 'replace').map((e) => ({ id: e.id, name: e.name, emoji: e.emoji, tagline: e.tagline, variants: e.variants })) : [];
    return { host: host(), edition: S.edition, globalEdition: S.globalEdition, excluded: S.excluded, packs: PACKS, mood: S.prefs.mood || 'off', moods: ['off', 'shuffle', 'daily', 'seasonal', 'clock'], patina: !!S.prefs.patina, visits: S.visits, icon: chrome.runtime.getURL('icons/peel128.png'),
      editions: allEditions().map((e) => ({ id: e.id, name: e.name, emoji: e.emoji, tagline: e.tagline, pack: e.pack || 'core', custom: !!e.custom, base: e.base })),
      custom: S.custom, transition: S.prefs.transition || 'curl', transitions: ['curl', ...(Peel.transitions ? Peel.transitions.list.filter((t) => t !== 'curl') : []), 'random'],
      fxOptions: { overlays: Peel.fx ? Peel.fx.overlays.filter((o) => !['hud', 'stamp', 'web', 'mold', 'sky'].includes(o)) : [], particles: Peel.particles ? Peel.particles.presets : [], cursors: ['comet', 'sparkle', 'flashlight', 'ripple'], enters: ['rise', 'fade', 'slide', 'blur', 'stamp', 'flip', 'typewriter'], ambients: ['flicker', 'breathe', 'sway', 'hue', 'heartbeat', 'melt', 'twitch', 'decay'], bursts: Peel.fx ? Peel.fx.bursts : [], companions: Peel.companions ? Peel.companions.kinds : [], loops: Peel.sound ? Peel.sound.list.loops : [] },
      toys: Peel.toys ? Peel.toys.list() : [], toy: Peel.toys ? Peel.toys.current() : null, canRewind: !!(Peel.toys && Peel.toys.canUndo()), hasWall: !!S.hasWall,
      kind: S.data && S.data.kind, count: S.data ? S.data.items.length : 0, modes, mode: S.mode ? { id: S.mode.id, variant: S.variant, variants: S.mode.variants } : null,
      confident: !!(S.data && (S.data.kind === 'article' || (S.adapter && (S.adapter.priority || 0) >= 10))) };
  }
  function detect() { const r = Peel.registry.detect(location, document); S.adapter = r.adapter; S.data = r.data; S.picker && S.picker.refresh(); }

  /* ---------- apply / teardown ---------- */
  function teardownEdition() {
    if (S.edStop) { try { S.edStop(); } catch {} S.edStop = null; }
    if (S.fxHost) { S.fxHost.remove(); S.fxHost = null; }
    document.getElementById('peel-edition-style')?.remove();
    delete document.documentElement.dataset.peelEdition; delete document.documentElement.dataset.peelCustom;
    document.documentElement.removeAttribute('data-peel-already-dark');
    S.edition = null; applyCounter(null);
  }
  function setEditionInstant(id) {
    const leavingRelayout = S.modeAuto && S.edition && resolveEdition(S.edition)?.relayout;
    teardownEdition();
    const ed = resolveEdition(id);
    if (leavingRelayout && !(ed && ed.relayout)) unpeelHard();
    if (!ed) { refresh(); Peel.demo && Peel.demo.caption('🌐 Original'); return; }
    const css = Peel.css[ed.css] || '';
    const st = document.createElement('style'); st.id = 'peel-edition-style'; st.textContent = css; (document.head || document.documentElement).appendChild(st);
    document.documentElement.dataset.peelEdition = ed.base || ed.id;
    if (ed.custom) document.documentElement.dataset.peelCustom = ed.id;
    const fxHost = h('div', { id: 'peel-fx' }); fxHost.setAttribute('style', `all:initial;position:fixed;inset:0;z-index:${Z + 2};pointer-events:none;`);
    const fx = fxHost.attachShadow({ mode: 'open' }); const fst = document.createElement('style'); fst.textContent = (Peel.css['src/fx/overlays.css'] || '') + '\n' + css; fx.appendChild(fst);
    document.body.appendChild(fxHost); S.fxHost = fxHost;
    S.edition = ed.id; S.lastPack = ed.pack || 'core';
    applyCounter(ed); Peel.demo && Peel.demo.caption(`${ed.emoji ? ed.emoji + ' ' : ''}${ed.name}`);
    const stops = []; const ctx = { fx, motion: motionOK(), onDestroy: (fn) => stops.push(fn) };
    try { stops.push(Peel.fx.run(ed.fx || [], ctx)); } catch (e) { void e; }
    try { ed.apply && ed.apply(document, ctx); } catch (e) { void e; }
    S.edStop = () => { for (const fn of stops.splice(0)) { try { fn(); } catch {} } };
    refresh();
  }
  const relayoutNow = () => { if (S.edition) maybeAutoRelayout(resolveEdition(S.edition)); };
  function refresh() { S.picker && S.picker.refresh(); chrome.runtime.sendMessage({ type: 'peel:state', active: S.edition || (S.mode && S.mode.id) }).catch?.(() => {}); }
  const capture = () => new Promise((res) => {
    if (S.ui) S.ui.style.visibility = 'hidden';
    try { chrome.runtime.sendMessage({ type: 'peel:capture' }, (r) => { if (S.ui) S.ui.style.visibility = ''; res((r && r.dataUrl) || null); }); }
    catch { if (S.ui) S.ui.style.visibility = ''; res(null); }
  });
  Peel.capture = capture;
  const withBusy = async (fn) => { if (S.busy) return; S.busy = true; try { await fn(); } finally { S.busy = false; S.curl && S.curl.rest(); } };
  function pickTransition() { let t = S.prefs.transition || 'curl'; if (t === 'random') { const l = ['curl', ...Peel.transitions.list.filter((x) => x !== 'curl')]; t = l[Math.floor(Math.random() * l.length)]; } return t; }
  async function switchEdition(id, { animate = true, persist = true } = {}) {
    if (id === S.edition && !S.excluded) return;
    await withBusy(async () => {
      S.picker && S.picker.close();
      const t = pickTransition();
      const snap = animate ? await capture() : null;
      if (S.edition) S.lastEdition = S.edition;
      if (snap && t !== 'curl' && Peel.transitions && Peel.transitions[t] && S.canvas) {
        setEditionInstant(id); snd(t === 'tvoff' ? 'clunk' : t === 'shatter' ? 'splat' : 'rip'); quips.flipped();
        try { await Peel.transitions[t](snap, S.canvas); } catch (e) { S.canvas.style.display = 'none'; }
        return;
      }
      if (snap) S.curl.showSnap(snap); else if (animate) S.curl.setLayer(null);
      setEditionInstant(id);
      if (animate) { snd('rip'); quips.flipped(); await S.curl.fly(true, snap ? 750 : 550); }
      S.curl.hideSnap();
    });
    if (persist && id !== 'custom-preview') { S.globalEdition = id; Peel.store.setGlobal({ edition: id }); }
    relayoutNow();
  }
  async function setExcluded(on) {
    S.excluded = on; await Peel.store.setExcluded(host(), on);
    if (on) { if (S.mode) unpeelHard(); teardownEdition(); refresh(); }
    else if (S.globalEdition) { setEditionInstant(S.globalEdition); relayoutNow(); }
    S.picker && S.picker.refresh();
  }

  /* ---------- remix (custom editions) ---------- */
  const encode = (def) => 'peel1.' + btoa(unescape(encodeURIComponent(JSON.stringify({ name: def.name, base: def.base, fx: def.fx, baseFx: def.baseFx !== false, emoji: def.emoji }))));
  const decode = (code) => { try { const m = String(code).trim().match(/^peel1\.(.+)$/); const d = JSON.parse(decodeURIComponent(escape(atob(m[1])))); if (!d.base || !Array.isArray(d.fx)) return null; return d; } catch { return null; } };
  const remix = {
    preview(def) { S.custom['custom-preview'] = def; switchEdition('custom-preview', { persist: false }); },
    async save(def) {
      const id = def.id && S.custom[def.id] ? def.id : 'custom-' + Date.now().toString(36);
      const clean = { name: (def.name || 'My remix').slice(0, 40), base: def.base, fx: def.fx || [], baseFx: def.baseFx !== false, emoji: def.emoji || '🧪' };
      S.custom[id] = clean; delete S.custom['custom-preview'];
      const all = { ...S.custom }; delete all['custom-preview'];
      await Peel.store.setGlobal({ custom: all });
      await switchEdition(id, { animate: S.edition !== 'custom-preview' });
      if (S.edition !== id) { setEditionInstant(id); S.globalEdition = id; Peel.store.setGlobal({ edition: id }); }
      return id;
    },
    async remove(id) { delete S.custom[id]; const all = { ...S.custom }; delete all['custom-preview']; await Peel.store.setGlobal({ custom: all }); if (S.edition === id) switchEdition(null); S.picker && S.picker.refresh(); },
    code(id) { const c = S.custom[id]; return c ? encode(c) : ''; },
    async import(code) { const d = decode(code); if (!d) return null; return remix.save(d); },
  };

  /* ---------- page modes (overlay relayouts) ---------- */
  function pageStyle() {
    let st = document.getElementById('peel-page-style');
    if (!st) { st = document.createElement('style'); st.id = 'peel-page-style'; document.documentElement.appendChild(st); }
    st.textContent = `html[data-peel-mode="replace"] body > *:not(#peel-root):not(#peel-ui):not(#peel-fx):not(#peel-filters) { display: none !important; }
html[data-peel-mode] { overflow: hidden !important; }
html[data-peel-mode="replace"] body { overflow: hidden !important; }`;
  }
  const setMode = (m) => { if (m) document.documentElement.dataset.peelMode = m; else delete document.documentElement.dataset.peelMode; };
  async function buildRoot(exp, variant, options) {
    const css = await Peel.loadCss(exp.css);
    const root = h('div', { id: 'peel-root' });
    root.setAttribute('style', `all:initial;display:block;position:fixed;inset:0;overflow:auto;z-index:${Z};background:#fff;overscroll-behavior:contain;`);
    root.style.filter = counterFilter(resolveEdition(S.edition));
    const shadow = root.attachShadow({ mode: 'open' });
    const st = document.createElement('style'); st.textContent = css;
    const page = h('div', { class: 'peel-page', 'data-variant': variant });
    shadow.append(st, page);
    const destroyers = [];
    const ctx = { variant, options, scroller: root, unpeel: () => unpeel(), onDestroy: (fn) => destroyers.push(fn), rerender: () => applyMode(exp.id, variant, options) };
    root._peel = { exp, variant, options, destroyers };
    await exp.render(page, S.data, ctx);
    return root;
  }
  function dropRoot(root) { if (!root) return; for (const fn of (root._peel?.destroyers || []).splice(0)) { try { fn(); } catch {} } root.remove(); }
  function commitReplace(root, exp, variant, options) { S.root = root; S.mode = exp; S.variant = variant; S.options = options; pageStyle(); setMode('replace'); document.documentElement.dataset.peel = exp.id; Peel.store.setSite({ last: exp.id, variant }); refresh(); }
  function restoreOriginal() { setMode(null); delete document.documentElement.dataset.peel; window.scrollTo(0, S.scrollY); S.root = null; S.mode = null; S.modeAuto = false; refresh(); }
  async function applyMode(id, variant, options, { animate = true, auto = false } = {}) {
    const exp = Peel.registry.experience(id);
    if (!exp || !S.data || !exp.accepts.includes(S.data.kind) || exp.mode !== 'replace') return;
    variant = variant || (exp.variants && exp.variants[0].id);
    options = { ...Object.fromEntries((exp.options || []).map((o) => [o.id, o.default])), ...(options || {}) };
    await withBusy(async () => {
      S.picker && S.picker.close();
      const curl = S.curl;
      if (!S.root) S.scrollY = window.scrollY;
      const fresh = await buildRoot(exp, variant, options);
      if (S.root) {
        fresh.style.zIndex = Z - 1; document.body.insertBefore(fresh, S.root);
        if (animate) { curl.setLayer(S.root, 'remain'); await curl.fly(true, 700); curl.setLayer(null); }
        const old = S.root; dropRoot(old); fresh.style.zIndex = Z;
      } else {
        document.body.appendChild(fresh);
        if (animate) { curl.setLayer(fresh, 'reveal'); await curl.fly(true, 800); curl.setLayer(null); }
      }
      commitReplace(fresh, exp, variant, options); S.modeAuto = auto;
    });
  }
  async function peelBackAnimated() {
    if (!S.root) return;
    setMode('peeling'); window.scrollTo(0, S.scrollY);
    S.curl.setLayer(S.root, 'remain'); await S.curl.fly(true, 700);
    const old = S.root; S.curl.setLayer(null); dropRoot(old); restoreOriginal();
  }
  async function unpeel() { if (!S.root) return; await withBusy(peelBackAnimated); }
  function unpeelHard() { if (S.root) { dropRoot(S.root); restoreOriginal(); } S.curl && S.curl.setLayer(null); }
  function maybeAutoRelayout(ed) {
    if (!ed || !ed.relayout || S.mode || !S.data) return;
    if (S.data.kind === 'article') applyMode('hush', 'paper', null, { animate: false, auto: true });
    else if (S.data.kind === 'stories' && (S.adapter.priority || 0) >= 10) applyMode('broadsheet', 'classic', null, { animate: false, auto: true });
  }

  /* ---------- the corner ---------- */
  let drag = null;
  const dragHandlers = {
    async onStart() {
      S.picker && S.picker.close();
      const curl = S.curl;
      if (S.root) { setMode('peeling'); window.scrollTo(0, S.scrollY); curl.setLayer(S.root, 'remain'); drag = { kind: 'mode-out' }; return; }
      if (S.excluded) { curl.setLayer(null); curl.setHint(`Peel is off on ${host()}`); drag = { kind: 'none' }; return; }
      const snap = await capture();
      if (snap) curl.showSnap(snap); else curl.setLayer(null);
      const prev = S.edition, next = ringNext(); const ed = resolveEdition(next);
      curl.setHint(ed ? `${ed.emoji} ${ed.name}` : '🌐 Original');
      setEditionInstant(next);
      drag = { kind: 'edition', prev };
    },
    async onCommit() {
      const d = drag; drag = null; const curl = S.curl; curl.hideSnap(); curl.setLayer(null); curl.setHint('');
      if (!d) return;
      if (d.kind === 'mode-out') { dropRoot(S.root); restoreOriginal(); }
      else if (d.kind === 'edition') { if (d.prev) S.lastEdition = d.prev; S.globalEdition = S.edition; Peel.store.setGlobal({ edition: S.edition }); setTimeout(relayoutNow, 50); quips.flipped(); }
      snd('rip');
    },
    async onCancel() {
      const d = drag; drag = null; const curl = S.curl; curl.hideSnap(); curl.setLayer(null); curl.setHint('');
      if (!d) return;
      if (d.kind === 'mode-out') setMode('replace');
      else if (d.kind === 'edition') setEditionInstant(d.prev);
    },
    onTap() { S.picker && S.picker.toggle(); },
  };

  /* ---------- moods: let the calendar, the clock or chance pick ---------- */
  function moodEdition() {
    const mood = S.prefs.mood || 'off'; const ids = Peel.registry.editions.filter((e) => !e.hidden && !['focus', 'bigtype', 'asteroids', 'gravity'].includes(e.id)).map((e) => e.id);
    const d = new Date(), m = d.getMonth(), day = d.getDate(), h = d.getHours();
    if (mood === 'shuffle') return ids[Math.floor(Math.random() * ids.length)];
    if (mood === 'daily') { const n = d.getFullYear() * 400 + m * 31 + day; return ids[n % ids.length]; }
    if (mood === 'seasonal') {
      if (m === 11) return 'snow'; if (m === 9 && day >= 24) return 'haunted'; if (m === 10 && day <= 14) return 'glowy'; if (m === 0 && day === 1) return 'y2007'; if (m === 3 && day === 1) return 'pest'; if (m === 2 && day >= 8 && day <= 16) return 'comic';
      return S.globalEdition;
    }
    if (mood === 'clock') { if (h < 5) return 'terminal'; if (h < 9) return 'light'; if (h >= 22) return 'noir'; if (h >= 18) return 'dark'; return S.globalEdition; }
    return undefined;   // off: keep the user's choice
  }
  /* ---------- patina: sites you visit a lot slowly age; ones you ignore grow moss ---------- */
  function patina() {
    document.getElementById('peel-patina')?.remove();
    if (!S.prefs.patina || S.excluded) return;
    const v = S.visits || { n: 1, last: Date.now(), first: Date.now() };
    const age = Math.min(1, (v.n - 1) / 40), moss = Math.min(1, Math.max(0, (Date.now() - (v.prevLast || v.last)) / 864e5 - 10) / 30);
    if (age < .05 && moss < .05) return;
    const el = h('div', { id: 'peel-patina' }); el.setAttribute('style', `all:initial;position:fixed;inset:0;z-index:${Z + 1};pointer-events:none;`);
    const sh = el.attachShadow({ mode: 'open' }); const st = document.createElement('style'); st.textContent = Peel.css['src/fx/overlays.css'] || '';
    const layer = document.createElement('div'); layer.className = 'fx-patina'; layer.style.setProperty('--age', age.toFixed(2)); layer.style.setProperty('--moss', moss.toFixed(2));
    sh.append(st, layer); el.style.filter = counterFilter(resolveEdition(S.edition)); document.body.appendChild(el);
  }
  /* ---------- the secret ---------- */
  const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']; let kpos = 0;
  document.addEventListener('keydown', (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; kpos = k === KONAMI[kpos] ? kpos + 1 : (k === KONAMI[0] ? 1 : 0);
    if (kpos === KONAMI.length) { kpos = 0; if (!S.prefs.secret) { S.prefs = { ...S.prefs, secret: true }; Peel.store.setPrefs({ secret: true }); } Peel.sound && Peel.sound.play('ding'); S.curl && S.curl.say('30 lives. And this. 🕹️', 6000); switchEdition('konami'); }
  }, true);
  /* ---------- share a shot: screenshot of the current look with a small badge, saved as PNG ---------- */
  async function shareShot() {
    S.picker && S.picker.close(); await new Promise((r) => setTimeout(r, 250));
    const snap = await capture(); if (!snap) { S.curl && S.curl.say('Could not grab the screen here.'); return; }
    const im = new Image(); await new Promise((res, rej) => { im.onload = res; im.onerror = rej; im.src = snap; });
    const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d'); g.drawImage(im, 0, 0);
    const ed = resolveEdition(S.edition); const k = im.width / innerWidth; const label = `Peel · ${ed ? ed.emoji + ' ' + ed.name : 'Original'}${ed && ed.custom ? ' · ' + remix.code(ed.id).slice(0, 28) + '…' : ''}`;
    g.font = `${Math.round(13 * k)}px -apple-system, system-ui, sans-serif`; const tw = g.measureText(label).width + 28 * k, th = 30 * k, x = im.width - tw - 16 * k, y = im.height - th - 16 * k;
    g.fillStyle = 'rgba(17,17,17,.85)'; g.beginPath(); g.roundRect(x, y, tw, th, 15 * k); g.fill(); g.fillStyle = '#fff'; g.textBaseline = 'middle'; g.fillText(label, x + 14 * k, y + th / 2);
    const a = document.createElement('a'); a.download = `peel-${(ed ? ed.id : 'original')}-${host()}.png`; a.href = c.toDataURL('image/png'); document.body.appendChild(a); a.click(); a.remove();
    snd('flash'); S.curl && S.curl.say('Saved. Go show someone.', 4000);
  }

  /* ---------- the corner talks (rarely) and gets restless ---------- */
  const quips = (() => {
    let flips = 0, lastAt = 0, lastTouch = Date.now(), timer = 0;
    const said = new Set();
    const canTalk = () => S.prefs.quips !== false && S.curl && !S.busy && Date.now() - lastAt > 90000;
    const say = (key, text, ms) => { if (!canTalk() || said.has(key)) return false; said.add(key); lastAt = Date.now(); S.curl.say(text, ms || 7000); return true; };
    const pick = () => {
      const h = new Date().getHours(), d = new Date(), m = d.getMonth(), day = d.getDate(), ed = S.edition, host = location.hostname.replace(/^www\./, '');
      if (m === 9 && day === 31 && ed !== 'haunted') return say('halloween', 'It is Halloween. You know what to do. 👻');
      if (m === 11 && day >= 20 && ed !== 'snow') return say('xmas', 'Snow is one flip away. ❄️');
      if (h >= 1 && h < 5 && ed !== 'terminal' && ed !== 'dark') return say('late', `It's ${h}am. Terminal? Dark? Sleep?`);
      if (h >= 6 && h < 9 && ed && ed !== 'light' && ed !== 'paper') return say('morning', 'Morning. Paper goes well with coffee.');
      if (!ed && S.data && S.data.kind === 'stories') return say('news', 'This page would look good on Paper. Tap me.');
      if (!ed && /github|stackoverflow|docs\./.test(host)) return say('code', 'Terminal edition. Just saying.');
      if (ed === 'pest') return say('pest', 'Click the bugs. They count.', 9000);
      if (ed === 'snow') return say('snow', 'Keep scrolling. It piles up.');
      if (ed === 'redacted') return say('redact', 'Hover the bars. ███ is still there.');
      if (ed === 'terminal' && h >= 23) return say('respect', 'Terminal at this hour. Respect.');
      if (!ed && S.lastEdition) return say('back', 'Original, huh. I’ll be here.');
      return false;
    };
    const arm = () => { clearTimeout(timer); timer = setTimeout(() => { if (Date.now() - lastTouch > 110000 && !pick()) { S.curl && S.curl.wiggle(); lastTouch = Date.now(); } arm(); }, 120000 + Math.random() * 60000); };
    document.addEventListener('pointerdown', () => { lastTouch = Date.now(); }, { passive: true, capture: true });
    return {
      start() { setTimeout(() => pick(), 2500 + Math.random() * 2500); arm(); },
      flipped() { flips++; lastTouch = Date.now(); if (flips === 9) say('nine', 'Okay, okay.'); else if (flips === 20) say('twenty', 'You can also just pick one, you know.'); else if (flips === 40) say('forty', 'I respect the commitment.'); },
    };
  })();

  /* ---------- toys hooks: tearing reveals the previous edition; the spray wall persists per site ---------- */
  let tearFrom = null;
  Peel.tearUnder = () => { tearFrom = S.edition; const under = S.lastEdition && S.lastEdition !== S.edition ? S.lastEdition : null; setEditionInstant(under); };
  Peel.tearCancel = () => { if (tearFrom !== null && tearFrom !== S.edition) setEditionInstant(tearFrom); tearFrom = null; };
  Peel.tearCommit = () => { const from = tearFrom; tearFrom = null; if (from) S.lastEdition = from; S.globalEdition = S.edition; Peel.store.setGlobal({ edition: S.edition }); relayoutNow(); S.curl && S.curl.say(S.edition ? 'Torn. That was underneath.' : 'Torn down to the original.', 4000); };
  async function wall() {
    document.getElementById('peel-wall')?.remove();
    const url = await Peel.store.graffiti(host()); S.hasWall = !!url; S.picker && S.picker.refresh();
    if (!url || (Peel.toys && Peel.toys.current() === 'spray')) return;
    const im = h('img', { id: 'peel-wall', src: url, alt: '' }); im.setAttribute('style', 'all:initial;position:absolute;left:0;top:0;width:100vw;height:auto;pointer-events:none;z-index:2147483100;'); document.body.appendChild(im);
  }
  Peel.wallChanged = (has = true) => { S.hasWall = has; if (!has) document.getElementById('peel-wall')?.remove(); S.picker && S.picker.refresh(); };
  Peel.picker.refreshAll = () => S.picker && S.picker.refresh();

  /* ---------- actions ---------- */
  const actions = {
    edition: (id) => { if ((S.prefs.mood || 'off') !== 'off') { S.prefs = { ...S.prefs, mood: 'off' }; Peel.store.setPrefs({ mood: 'off' }); } return switchEdition(id); },
    next: () => switchEdition(ringNext()),
    toggleOriginal: () => switchEdition(S.edition ? null : (S.lastEdition || Peel.registry.editions[0].id)),
    exclude: (on) => setExcluded(on),
    mood: (m) => { S.prefs = { ...S.prefs, mood: m }; Peel.store.setPrefs({ mood: m }); const id = moodEdition(); if (id !== undefined && id !== S.edition && !S.excluded) switchEdition(id, { persist: false }); S.picker && S.picker.refresh(); },
    patina: (on) => { S.prefs = { ...S.prefs, patina: on }; Peel.store.setPrefs({ patina: on }); patina(); S.picker && S.picker.refresh(); },
    shot: () => shareShot(),
    toy: (id) => { if (!Peel.toys) return; if (Peel.toys.current() === id) Peel.toys.drop(); else { document.getElementById('peel-wall')?.remove(); Peel.toys.pick(id); S.picker && S.picker.close(); const t = Peel.toys.list().find((x) => x.id === id); S.curl && S.curl.say(t ? `${t.emoji} ${t.hint}  (Esc drops it · R rewinds)` : '', 7000); Peel.demo && t && Peel.demo.caption(`${t.emoji} ${t.name}`); } if (id !== 'spray') wall(); S.picker && S.picker.refresh(); },
    dropToy: () => { Peel.toys && Peel.toys.drop(); wall(); S.picker && S.picker.refresh(); },
    rewind: async () => { Peel.demo && Peel.demo.caption('◀◀ Rewind'); if (Peel.toys) await Peel.toys.rewind(); if (S.hasWall && Peel.toys && Peel.toys.current() !== 'spray') { await Peel.store.setGraffiti(host(), null); Peel.wallChanged(false); } },
    clearWall: async () => { await Peel.store.setGraffiti(host(), null); wall(); },
    transition: (t) => { S.prefs = { ...S.prefs, transition: t }; Peel.store.setPrefs({ transition: t }); S.picker && S.picker.refresh(); },
    mode: (id) => Peel.store.site().then((site) => applyMode(id, site.last === id ? site.variant : undefined)),
    flip: () => { if (!S.mode || !S.mode.variants) return; const vs = S.mode.variants; const i = vs.findIndex((x) => x.id === S.variant); applyMode(S.mode.id, vs[(i + 1) % vs.length].id, S.options); },
    unpeel: () => unpeel(),
    rescan: () => detect(),
    remix,
  };

  /* ---------- mount / boot ---------- */
  async function mountUI() {
    if (S.ui) return;
    const ui = h('div', { id: 'peel-ui' });
    ui.setAttribute('style', `all:initial;position:fixed;inset:0;z-index:${Z + 5};pointer-events:none;`);
    const shadow = ui.attachShadow({ mode: 'open' });
    const st = document.createElement('style'); st.textContent = (await Peel.loadCss('src/ui/ui.css')) + '\n' + (await Peel.loadCss('src/ui/tiles.css'));
    shadow.append(st);
    const canvas = document.createElement('canvas'); canvas.className = 'curl-transition'; shadow.appendChild(canvas); S.canvas = canvas;
    document.body.appendChild(ui);
    S.ui = ui;
    S.curl = new Peel.Curl(shadow, dragHandlers);
    S.curl.size(true);
    S.picker = Peel.picker.mount(shadow, status, actions);
    S.demoRoot = shadow; Peel.demo && Peel.demo.set(!!S.prefs.demo, shadow);
    if (S.prefs.fab === false) ui.style.display = 'none';
    document.addEventListener('keydown', (e) => {
      if ((e.target && /input|textarea|select/i.test(e.target.tagName)) || e.target?.isContentEditable) return;
      if (e.shiftKey && (e.key === 'P' || e.key === 'p')) { e.preventDefault(); actions.toggleOriginal(); }
      if (e.shiftKey && (e.key === 'F' || e.key === 'f')) { e.preventDefault(); actions.next(); }
    });
  }
  async function boot() {
    try { await Peel.store.migrate(); } catch {}
    detect();
    const g = await Peel.store.global();
    S.prefs = g.prefs || {}; S.globalEdition = g.edition || null; S.excluded = !!(g.excluded && g.excluded[host()]); S.custom = g.custom || {};
    Peel.sound && Peel.sound.setEnabled(!!S.prefs.sound);
    S.visits = await Peel.store.visit(host());
    await mountUI();
    const moodId = moodEdition();
    const startId = moodId !== undefined ? moodId : S.globalEdition;
    if (startId && !S.excluded) { setEditionInstant(startId); relayoutNow(); }
    patina(); wall();
    quips.start();
    if (!g.prefs || !g.prefs.hello) { setTimeout(() => S.curl && S.curl.say('Hi. I’m Peel. Drag my corner, or tap it. 🍊', 9000), 1200); Peel.store.setPrefs({ hello: true }); }
  }
  Peel.store.onChange((ch, area) => {
    if (area !== 'sync') return;
    if (ch.custom) S.custom = ch.custom.newValue || {};
    if (ch.edition) { S.globalEdition = ch.edition.newValue || null; if (!S.excluded && !S.busy && S.globalEdition !== S.edition) { setEditionInstant(S.globalEdition); relayoutNow(); } }
    if (ch.excluded) { const ex = !!((ch.excluded.newValue || {})[host()]); if (ex !== S.excluded) { S.excluded = ex; if (ex) { if (S.mode) unpeelHard(); teardownEdition(); refresh(); } else if (S.globalEdition) { setEditionInstant(S.globalEdition); relayoutNow(); } } }
    if (ch.prefs) { const was = S.prefs; S.prefs = ch.prefs.newValue || {}; if (S.ui) S.ui.style.display = S.prefs.fab === false ? 'none' : ''; if (Peel.sound) Peel.sound.setEnabled(!!S.prefs.sound); if ((!!was.sound !== !!S.prefs.sound || !!was.motion !== !!S.prefs.motion) && S.edition) setEditionInstant(S.edition); if (!!was.patina !== !!S.prefs.patina) patina(); if (Peel.demo && S.demoRoot) Peel.demo.set(!!S.prefs.demo, S.demoRoot); }
  });
  const watch = Peel.dom.debounce(() => {
    if (S.busy || S.curl?.dragging) return;
    if (location.href !== S.lastUrl) { S.lastUrl = location.href; unpeelHard(); Peel.toys && Peel.toys.drop(); detect(); relayoutNow(); wall(); return; }
    if (!S.data) { detect(); if (S.data) relayoutNow(); }
    for (const el of [S.ui, S.fxHost]) if (el && !el.isConnected) document.body.appendChild(el);
  }, 700);
  new MutationObserver(watch).observe(document.documentElement, { childList: true, subtree: true });
  setInterval(watch, 1500);

  chrome.runtime.onMessage.addListener((msg, _s, reply) => {
    if (msg.type === 'peel:status') { reply(status()); return; }
    if (msg.type === 'peel:edition') { actions.edition(msg.id || null); reply({ ok: true }); return; }
    if (msg.type === 'peel:exclude') { setExcluded(!!msg.on).then(() => reply({ ok: true })); return true; }
    if (msg.type === 'peel:transition') { actions.transition(msg.t); reply({ ok: true }); return; }
    if (msg.type === 'peel:mood') { actions.mood(msg.m); reply({ ok: true }); return; }
    if (msg.type === 'peel:shot') { shareShot(); reply({ ok: true }); return; }
    if (msg.type === 'peel:toy') { actions.toy(msg.id); reply({ ok: true }); return; }
    if (msg.type === 'peel:rewind') { actions.rewind(); reply({ ok: true }); return; }
    if (msg.type === 'peel:mode') { actions.mode(msg.id); reply({ ok: true }); return; }
    if (msg.type === 'peel:unpeel') { unpeel(); reply({ ok: true }); return; }
    if (msg.type === 'peel:fab') { if (S.ui) S.ui.style.display = msg.on ? '' : 'none'; reply({ ok: true }); return; }
    if (msg.type === 'peel:rescan') { detect(); reply(status()); return; }
    if (msg.type === 'peel:remix:save') { remix.save(msg.def).then((id) => reply({ id })); return true; }
    if (msg.type === 'peel:remix:import') { remix.import(msg.code).then((id) => reply({ id })); return true; }
  });

  if (document.readyState === 'complete') boot(); else window.addEventListener('load', boot, { once: true });
})();
