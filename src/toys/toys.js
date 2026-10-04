/* Peel – Toys. Tools you pick up and use on the page, on top of any edition. Everything is reversible: Rewind puts it all back.
   Shared here: the registry, the physics engine (fling real elements around), the undo stack, targeting, and the toy layer. */
(function () {
  const Peel = (window.Peel = window.Peel || {});
  const tools = [];
  const T = { current: null, stop: null, host: null, fx: null, undo: [], phys: new Map(), raf: 0, listeners: [] };
  const TARGET = 'img, video, h1, h2, h3, h4, p, li, blockquote, figure, button, [role="button"], a, label, td, th, pre, code, span, small, strong, em, time, svg';
  const skip = (el) => !el || el.closest('#peel-ui, #peel-fx, #peel-root, #peel-toys, #peel-patina, input, textarea, select, [contenteditable="true"]');

  /* ---------- layer ---------- */
  function layer() {
    if (T.host && T.host.isConnected) return T.fx;
    const host = document.createElement('div'); host.id = 'peel-toys';
    host.setAttribute('style', 'all:initial;position:fixed;inset:0;z-index:2147483643;pointer-events:none;');
    const sh = host.attachShadow({ mode: 'open' }); const st = document.createElement('style'); st.textContent = (Peel.css['src/fx/overlays.css'] || '') + '\n' + (Peel.css['src/toys/toys.css'] || ''); sh.appendChild(st);
    document.body.appendChild(host); T.host = host; T.fx = sh;
    if (Peel.counterFilter) host.style.filter = Peel.counterFilter();
    return sh;
  }
  function canvas(cls) {
    const c = document.createElement('canvas'); c.className = 'toy-canvas ' + (cls || ''); layer().appendChild(c);
    const g = c.getContext('2d');
    const size = () => { c.width = innerWidth * devicePixelRatio; c.height = innerHeight * devicePixelRatio; c.style.width = innerWidth + 'px'; c.style.height = innerHeight + 'px'; g.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); };
    size(); addEventListener('resize', size);
    return { c, g, destroy: () => { c.remove(); removeEventListener('resize', size); } };
  }
  function pageStyle(on) {
    let st = document.getElementById('peel-toys-style');
    if (!on) { st && st.remove(); return; }
    if (!st) { st = document.createElement('style'); st.id = 'peel-toys-style'; st.textContent = Peel.css['src/toys/toys.css'] || ''; (document.head || document.documentElement).appendChild(st); }
  }

  /* ---------- targeting ---------- */
  function target(e) {
    const el = e.target && e.target.closest ? e.target.closest(TARGET) : null;
    if (skip(el)) return null;
    if (el.tagName === 'SPAN' && el.textContent.trim().length < 2) return null;
    return el;
  }
  /** Innermost targets whose centre lies within r of (x,y). */
  function around(x, y, r, max = 60) {
    const out = [];
    for (const el of document.querySelectorAll(TARGET)) {
      if (skip(el) || T.phys.has(el)) continue;
      const b = el.getBoundingClientRect(); if (!b.width || !b.height || b.width > innerWidth * .9) continue;
      const cx = b.left + b.width / 2, cy = b.top + b.height / 2; const d = Math.hypot(cx - x, cy - y);
      if (d <= r) out.push({ el, cx, cy, d, b });
      if (out.length > 400) break;
    }
    const inner = out.filter((o) => !out.some((p) => p !== o && o.el.contains(p.el)));
    return inner.sort((a, b) => a.d - b.d).slice(0, max);
  }

  /* ---------- undo ---------- */
  const remember = (el) => { if (T.undo.some((u) => u.el === el)) return; T.undo.push({ el, style: el.getAttribute('style') }); };
  const restoreStyle = (u) => { if (u.style == null) u.el.removeAttribute('style'); else u.el.setAttribute('style', u.style); };

  /* ---------- physics: fling real elements, bounce on the floor ---------- */
  function fling(el, vx, vy, vr, opts = {}) {
    if (!el || skip(el)) return; remember(el);
    const b = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    if (cs.position === 'static') el.style.setProperty('position', 'relative', 'important');
    el.style.setProperty('z-index', '2147483000', 'important'); el.style.setProperty('pointer-events', 'none', 'important'); el.style.setProperty('transform-origin', 'center', 'important'); el.style.setProperty('transition', 'none', 'important');
    T.phys.set(el, { x: 0, y: 0, vx, vy, vr, rot: 0, floor: innerHeight - b.bottom - 4, t: 0, bounces: 0, fade: !!opts.fade, g: opts.gravity ?? .55 });
    if (!T.raf) T.raf = requestAnimationFrame(step);
  }
  function step() {
    let alive = false;
    for (const [el, f] of T.phys) {
      if (f.done) continue; alive = true; f.t++;
      f.vy += f.g; f.y += f.vy; f.x += f.vx; f.rot += f.vr; f.vx *= .995;
      if (f.y > f.floor) { f.y = f.floor; f.vy = -f.vy * .42; f.vr *= .6; f.vx *= .8; f.bounces++; if (f.bounces > 5 && Math.abs(f.vy) < 1.2) { f.vy = 0; f.done = true; } else if (Math.abs(f.vy) > 2.5 && Peel.sound) Peel.sound.play('clunk'); }
      if (f.t > 1200) f.done = true;
      el.style.setProperty('transform', `translate(${f.x.toFixed(1)}px, ${f.y.toFixed(1)}px) rotate(${f.rot.toFixed(3)}rad)`, 'important');
      if (f.fade) el.style.setProperty('opacity', String(Math.max(0, 1 - f.t / 90)), 'important');
    }
    T.raf = alive ? requestAnimationFrame(step) : 0;
  }

  /* ---------- shards: clone an element into falling pieces (no screenshot needed) ---------- */
  function shatter(el, originX, originY) {
    if (!el || skip(el)) return; remember(el);
    const b = el.getBoundingClientRect(); if (!b.width || !b.height) return;
    const cols = b.width > 300 ? 4 : 3, rows = b.height > 200 ? 3 : 2;
    const jit = (i, j) => ({ x: (i / cols) * 100 + (i > 0 && i < cols ? (Math.random() - .5) * 18 : 0), y: (j / rows) * 100 + (j > 0 && j < rows ? (Math.random() - .5) * 18 : 0) });
    const grid = []; for (let j = 0; j <= rows; j++) { grid[j] = []; for (let i = 0; i <= cols; i++) grid[j][i] = jit(i, j); }
    const frag = document.createDocumentFragment(); const pieces = [];
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const p = [grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i]];
      const clone = el.cloneNode(true); clone.removeAttribute('id'); clone.style.cssText += `;position:fixed !important;left:${b.left}px !important;top:${b.top}px !important;width:${b.width}px !important;height:${b.height}px !important;margin:0 !important;box-sizing:border-box !important;pointer-events:none !important;z-index:2147483100 !important;clip-path:polygon(${p.map((q) => `${q.x}% ${q.y}%`).join(',')}) !important;transform-origin:${(p[0].x + p[2].x) / 2}% ${(p[0].y + p[2].y) / 2}% !important;transition:none !important;opacity:1 !important;visibility:visible !important;max-width:none !important;`;
      const cx = b.left + b.width * (p[0].x + p[2].x) / 200, cy = b.top + b.height * (p[0].y + p[2].y) / 200;
      const ang = Math.atan2(cy - (originY ?? cy - 1), cx - (originX ?? cx)); const sp = 3 + Math.random() * 5;
      pieces.push({ clone, x: 0, y: 0, vx: Math.cos(ang) * sp + (Math.random() - .5) * 3, vy: Math.sin(ang) * sp - 4 - Math.random() * 4, rot: 0, vr: (Math.random() - .5) * .3, t: 0 });
      frag.appendChild(clone);
    }
    document.body.appendChild(frag);
    el.style.setProperty('visibility', 'hidden', 'important');
    let raf = 0; const floor = innerHeight;
    const tick = () => {
      let alive = false;
      for (const s of pieces) { s.t++; if (s.t > 140) continue; alive = true; s.vy += .6; s.x += s.vx; s.y += s.vy; s.rot += s.vr; s.clone.style.setProperty('transform', `translate(${s.x}px, ${s.y}px) rotate(${s.rot}rad)`, 'important'); s.clone.style.setProperty('opacity', String(Math.max(0, 1 - Math.max(0, s.t - 80) / 60)), 'important'); }
      if (alive) raf = requestAnimationFrame(tick); else for (const s of pieces) s.clone.remove();
    };
    raf = requestAnimationFrame(tick);
    Peel.sound && Peel.sound.play('crack');
  }

  /* ---------- rewind: everything back, with a VHS whirr ---------- */
  async function rewind() {
    const fx = layer();
    const osd = document.createElement('div'); osd.className = 'toy-osd'; osd.innerHTML = '<b>◀◀ REW</b>'; const st = document.createElement('div'); st.className = 'fx-static'; st.style.setProperty('--o', '.18'); fx.append(st, osd);
    Peel.sound && Peel.sound.play('rewind');
    for (const fn of T.rewinders.splice(0)) { try { await fn(); } catch {} }
    const items = T.undo.splice(0).reverse(); T.phys.clear();
    for (const u of items) { try { u.el.style.setProperty('transition', 'transform .6s cubic-bezier(.2,.8,.2,1), opacity .4s', 'important'); u.el.style.setProperty('transform', 'none', 'important'); u.el.style.setProperty('opacity', '1', 'important'); u.el.style.setProperty('visibility', 'visible', 'important'); } catch {} }
    await new Promise((r) => setTimeout(r, 650));
    for (const u of items) { try { restoreStyle(u); } catch {} }
    osd.remove(); st.remove();
  }
  T.rewinders = [];

  /* ---------- manager ---------- */
  function pick(id) {
    drop();
    const tool = tools.find((t) => t.id === id); if (!tool) return;
    T.current = tool; pageStyle(true); document.documentElement.dataset.peelToy = tool.id;
    const stops = []; const ctx = { fx: layer(), canvas, target, around, fling, shatter, remember, undo: T.undo, onRewind: (fn) => T.rewinders.push(fn), onStop: (fn) => stops.push(fn), skip };
    try { const s = tool.start(ctx); if (typeof s === 'function') stops.push(s); } catch (e) { console.warn('[Peel] toy failed', id, e); }
    T.stop = () => { for (const fn of stops.splice(0)) { try { fn(); } catch {} } };
    Peel.sound && Peel.sound.play('pop');
  }
  function drop() { if (T.stop) { T.stop(); T.stop = null; } T.current = null; delete document.documentElement.dataset.peelToy; pageStyle(false); }
  document.addEventListener('keydown', (e) => {
    if ((e.target && /input|textarea|select/i.test(e.target.tagName)) || e.target?.isContentEditable) return;
    if (e.key === 'Escape' && T.current) { drop(); Peel.picker && Peel.picker.refreshAll && Peel.picker.refreshAll(); }
    if ((e.key === 'r' || e.key === 'R') && !e.metaKey && !e.ctrlKey && (T.current || T.undo.length)) { e.preventDefault(); rewind(); }
  }, true);

  Peel.toys = { register: (t) => tools.push(t), hasUndo: () => T.undo.length > 0, list: () => tools.map((t) => ({ id: t.id, name: t.name, emoji: t.emoji, tagline: t.tagline, hint: t.hint })), pick, drop, rewind, current: () => T.current && T.current.id, canUndo: () => T.undo.length > 0 || T.rewinders.length > 0, layer, canvas, fling, shatter, around, target };
})();
