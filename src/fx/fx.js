/* Peel – effects library. Editions declare a recipe; this runs it and returns a destroy function.
   Recipe items: 'grain:.12' | 'vignette' | { type:'particles', preset:'snow', count: 80 } | { type:'cursor', kind:'comet' }
   | { type:'enter', kind:'rise' } | { type:'ambient', kinds:['flicker','breathe'] } | 'filters' | { type:'skew' } */
(function () {
  const Peel = (window.Peel = window.Peel || {});
  const OVERLAYS = new Set(['grain', 'scanlines', 'vignette', 'halftone', 'paper', 'haze', 'leaks', 'dust', 'fog', 'streaks', 'crt', 'glitch', 'mold', 'web', 'sky', 'hud', 'caustics', 'grid', 'tracking', 'stamp', 'frost', 'static']);
  const parse = (item) => {
    if (typeof item !== 'string') return item;
    const [type, v] = item.split(':');
    return { type, v: v === undefined ? undefined : (isNaN(parseFloat(v)) ? v : parseFloat(v)) };
  };

  /* ---------- SVG filter bank (lives in the page document so CSS url(#id) can reach it) ---------- */
  const BANK = `
<filter id="peel-posterize"><feComponentTransfer><feFuncR type="discrete" tableValues="0 .2 .4 .6 .8 1"/><feFuncG type="discrete" tableValues="0 .2 .4 .6 .8 1"/><feFuncB type="discrete" tableValues="0 .2 .4 .6 .8 1"/></feComponentTransfer></filter>
<filter id="peel-dither" x="0" y="0" width="100%" height="100%"><feColorMatrix type="saturate" values="0" result="g"/><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="1" seed="3" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 .5 0 0 0 0 .5 0 0 0 0 .5 0 0 0 0 1" result="n2"/><feComposite in="g" in2="n2" operator="arithmetic" k2="1" k3=".9" k4="-.45" result="m"/><feComponentTransfer in="m"><feFuncR type="discrete" tableValues="0 1"/><feFuncG type="discrete" tableValues="0 1"/><feFuncB type="discrete" tableValues="0 1"/></feComponentTransfer></filter>
<filter id="peel-duotone-blue"><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="table" tableValues="0.02 0.95"/><feFuncG type="table" tableValues="0.2 0.98"/><feFuncB type="table" tableValues="0.55 1"/></feComponentTransfer></filter>
<filter id="peel-duotone-riso"><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="table" tableValues="0.1 1"/><feFuncG type="table" tableValues="0.1 0.3"/><feFuncB type="table" tableValues="0.5 0.3"/></feComponentTransfer></filter>
<filter id="peel-sketch"><feColorMatrix type="saturate" values="0" result="g"/><feConvolveMatrix in="g" order="3" kernelMatrix="-1 -1 -1 -1 8 -1 -1 -1 -1" preserveAlpha="true" result="e"/><feComponentTransfer in="e"><feFuncR type="table" tableValues="1 0"/><feFuncG type="table" tableValues="1 0"/><feFuncB type="table" tableValues="1 0"/></feComponentTransfer><feComponentTransfer><feFuncR type="gamma" exponent="2.2"/><feFuncG type="gamma" exponent="2.2"/><feFuncB type="gamma" exponent="2.2"/></feComponentTransfer></filter>
<filter id="peel-wobble"><feTurbulence type="turbulence" baseFrequency=".012" numOctaves="2" seed="7" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="6" xChannelSelector="R" yChannelSelector="G"/></filter>
<filter id="peel-ripple"><feTurbulence type="turbulence" baseFrequency=".006" numOctaves="1" seed="2" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="2.5" xChannelSelector="R" yChannelSelector="G"/></filter>
<filter id="peel-aberration"><feOffset in="SourceGraphic" dx="-2" dy="0" result="l"/><feColorMatrix in="l" type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="r"/><feOffset in="SourceGraphic" dx="2" dy="0" result="rr"/><feColorMatrix in="rr" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0" result="b"/><feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0" result="g"/><feBlend in="r" in2="g" mode="screen" result="rg"/><feBlend in="rg" in2="b" mode="screen"/></filter>
<filter id="peel-vhs"><feOffset in="SourceGraphic" dx="-3" result="l"/><feColorMatrix in="l" type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="r"/><feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0" result="gb"/><feBlend in="r" in2="gb" mode="screen" result="m"/><feGaussianBlur in="m" stdDeviation=".6 0"/></filter>`;
  function filters(doc) {
    if (doc.getElementById('peel-filters')) return () => {};
    const svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.id = 'peel-filters'; svg.setAttribute('width', '0'); svg.setAttribute('height', '0'); svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    svg.innerHTML = BANK; doc.body.appendChild(svg);
    return () => svg.remove();
  }

  /* ---------- overlays: click-through fixed layers in the fx shadow root ---------- */
  function overlay(ctx, name, v) {
    const el = document.createElement('div'); el.className = 'fx-' + name; el.dataset.fx = name;
    if (v !== undefined) el.style.setProperty('--o', v);
    if (name === 'hud') el.innerHTML = '<i></i><i></i><i></i><i></i><b>PEEL · ' + (new Date().getFullYear() + 74) + ' · ' + location.hostname.toUpperCase() + '</b>';
    if (name === 'stamp') el.textContent = ctx.stampText || 'CLASSIFIED';
    ctx.fx.appendChild(el);
    return () => el.remove();
  }

  /* ---------- page motion (styles live in motion.css, injected into the page document) ---------- */
  function motionStyle(doc) {
    let st = doc.getElementById('peel-motion-style');
    if (st) { st._refs = (st._refs || 0) + 1; return () => { if (--st._refs <= 0) st.remove(); }; }
    st = doc.createElement('style'); st.id = 'peel-motion-style'; st.textContent = Peel.css['src/fx/motion.css'] || ''; st._refs = 1;
    (doc.head || doc.documentElement).appendChild(st);
    return () => { if (--st._refs <= 0) st.remove(); };
  }
  const SEL = 'article, section > *, main > *, h1, h2, h3, p, img, li, figure, [class*="card"], [class*="post"], [class*="item"]';
  function enter(ctx, spec) {
    const doc = document, kind = spec.kind || 'rise';
    const un = motionStyle(doc);
    doc.documentElement.dataset.peelEnter = kind;
    const targets = Array.from(doc.querySelectorAll(spec.selector || SEL)).filter((t) => t.closest('#peel-ui, #peel-fx, #peel-root') == null).slice(0, 800);
    let i = 0; for (const t of targets) { t.setAttribute('data-peel-out', ''); t.style.setProperty('--i', String(i++ % 12)); if (kind === 'typewriter' && /^H[1-3]$/.test(t.tagName)) t.style.setProperty('--n', String(Math.min(60, (t.textContent || '').trim().length))); }
    const io = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) { e.target.setAttribute('data-peel-in', ''); io.unobserve(e.target);
      if (kind === 'typewriter' && /^H[1-3]$/.test(e.target.tagName) && Peel.sound && Peel.sound.enabled()) { const n = Math.min(12, Number(e.target.style.getPropertyValue('--n')) || 8); for (let k = 0; k < n; k++) setTimeout(() => Peel.sound.play('type'), 60 + k * 70); } } }, { rootMargin: '0px 0px -6% 0px' });
    for (const t of targets) io.observe(t);
    const safety = setTimeout(() => { for (const t of targets) t.setAttribute('data-peel-in', ''); }, 2500);
    return () => { io.disconnect(); clearTimeout(safety); un(); delete doc.documentElement.dataset.peelEnter; for (const t of targets) { t.removeAttribute('data-peel-out'); t.removeAttribute('data-peel-in'); t.style.removeProperty('--i'); t.style.removeProperty('--n'); } };
  }
  function ambient(ctx, spec) {
    const doc = document, kinds = spec.kinds || [spec.kind];
    const un = motionStyle(doc);
    doc.documentElement.dataset.peelAmbient = kinds.join(' ');
    const stops = [un, () => delete doc.documentElement.dataset.peelAmbient];
    if (kinds.includes('melt') && ctx.motion) {
      const t0 = performance.now(), dur = (spec.minutes || 4) * 60000;
      const tick = () => { doc.documentElement.style.setProperty('--peel-melt', String(Math.min(1, (performance.now() - t0) / dur))); };
      const iv = setInterval(tick, 1500); tick();
      stops.push(() => { clearInterval(iv); doc.documentElement.style.removeProperty('--peel-melt'); });
    }
    if (kinds.includes('twitch') && ctx.motion) {
      let tt = 0; const go = () => { tt = setTimeout(() => { try { doc.body.animate([{ transform: 'translate(0,0)' }, { transform: 'translate(2px,-1px)' }, { transform: 'translate(-2px,1px)' }, { transform: 'none' }], { duration: 220 }); } catch {} go(); }, 6000 + Math.random() * 9000); }; go();
      stops.push(() => clearTimeout(tt));
    }
    if (kinds.includes('decay') && ctx.motion) {
      const originals = new Map(); const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.nodeValue.trim().length > 24 && !n.parentElement.closest('script, style, #peel-ui, #peel-fx, #peel-root, input, textarea') ? 1 : 2) });
      const nodes = []; let n; while ((n = walker.nextNode()) && nodes.length < 600) nodes.push(n);
      const ROT = '▒░▓#@*&§¤';
      let count = 0; const iv = setInterval(() => {
        for (let k = 0; k < 3 && count < (spec.max || 400) && nodes.length; k++) {
          const node = nodes[Math.floor(Math.random() * nodes.length)]; if (!node.isConnected) continue;
          if (!originals.has(node)) originals.set(node, node.nodeValue);
          const s = node.nodeValue, i = Math.floor(Math.random() * s.length); if (/\s/.test(s[i])) continue;
          node.nodeValue = s.slice(0, i) + ROT[Math.floor(Math.random() * ROT.length)] + s.slice(i + 1); count++;
        }
      }, spec.every || 2500);
      stops.push(() => { clearInterval(iv); for (const [node, s] of originals) { try { node.nodeValue = s; } catch {} } });
    }
    return () => stops.forEach((f) => { try { f(); } catch {} });
  }
  function skew(ctx) {
    const doc = document; const un = motionStyle(doc); doc.documentElement.dataset.peelSkew = '';
    let last = scrollY, v = 0, raf = 0;
    const tick = () => { const d = scrollY - last; last = scrollY; v = v * 0.85 + d * 0.15; doc.documentElement.style.setProperty('--peel-skew', String(Math.max(-6, Math.min(6, v * 0.08)))); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); un(); delete doc.documentElement.dataset.peelSkew; doc.documentElement.style.removeProperty('--peel-skew'); };
  }

  /* ---------- cursor effects ---------- */
  function cursor(ctx, spec) {
    const kind = spec.kind || 'comet', doc = document;
    if (kind === 'flashlight') {
      const el = document.createElement('div'); el.className = 'fx-flashlight'; el.style.setProperty('--r', (spec.radius || 190) + 'px'); ctx.fx.appendChild(el);
      const move = (e) => { el.style.setProperty('--x', e.clientX + 'px'); el.style.setProperty('--y', e.clientY + 'px'); };
      doc.addEventListener('pointermove', move, { passive: true });
      return () => { el.remove(); doc.removeEventListener('pointermove', move); };
    }
    const c = document.createElement('canvas'); c.className = 'fx-canvas'; if (spec.blend) c.style.mixBlendMode = spec.blend; ctx.fx.appendChild(c);
    const g = c.getContext('2d'); const pts = []; let raf = 0;
    const size = () => { c.width = innerWidth * devicePixelRatio; c.height = innerHeight * devicePixelRatio; c.style.width = innerWidth + 'px'; c.style.height = innerHeight + 'px'; g.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); };
    size(); addEventListener('resize', size);
    const move = (e) => { if (kind === 'sparkle') { for (let i = 0; i < 2; i++) pts.push({ x: e.clientX + (Math.random() - .5) * 14, y: e.clientY + (Math.random() - .5) * 14, t: performance.now(), r: 2 + Math.random() * 3, h: Math.random() * 360, vy: -.3 - Math.random() * .6 }); } else pts.push({ x: e.clientX, y: e.clientY, t: performance.now() }); if (pts.length > 60) pts.shift(); };
    const click = (e) => { if (kind === 'ripple' || spec.ripple) pts.push({ x: e.clientX, y: e.clientY, t: performance.now(), ripple: true }); };
    doc.addEventListener('pointermove', move, { passive: true }); doc.addEventListener('pointerdown', click, { passive: true });
    const hue = spec.hue ?? 190;
    const tick = () => {
      g.clearRect(0, 0, innerWidth, innerHeight); const now = performance.now();
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i], age = (now - p.t) / (p.ripple ? 700 : 600); if (age > 1) continue;
        if (p.ripple) { g.beginPath(); g.arc(p.x, p.y, age * 60, 0, 7); g.strokeStyle = `hsla(${hue},100%,70%,${1 - age})`; g.lineWidth = 2; g.stroke(); continue; }
        if (kind === 'sparkle') { p.y += p.vy; const r = p.r * (1 - age); g.save(); g.translate(p.x, p.y); g.rotate(age * 3); g.fillStyle = `hsla(${p.h},100%,75%,${1 - age})`; g.beginPath(); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, rr = k % 2 ? r * .4 : r * 1.6; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); g.fill(); g.restore(); continue; }
        const r = (1 - age) * 7 * (i / pts.length + .3); g.beginPath(); g.arc(p.x, p.y, r, 0, 7); g.fillStyle = `hsla(${hue + i * 4},100%,70%,${(1 - age) * .55})`; g.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    const vis = () => { if (doc.hidden) cancelAnimationFrame(raf); else raf = requestAnimationFrame(tick); };
    doc.addEventListener('visibilitychange', vis); raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); c.remove(); removeEventListener('resize', size); doc.removeEventListener('pointermove', move); doc.removeEventListener('pointerdown', click); doc.removeEventListener('visibilitychange', vis); };
  }

  /* ---------- doomscroll meter: 0 → 1 as you keep scrolling; recovers when you stop ---------- */
  let doomV = 0, doomOn = false, doomTotal = 0, doomLastY = 0, doomLastT = 0;
  function doomStart() {
    if (doomOn) return; doomOn = true; doomLastY = scrollY; doomLastT = performance.now();
    addEventListener('scroll', () => { const d = Math.abs(scrollY - doomLastY); doomLastY = scrollY; doomTotal += d; doomLastT = performance.now(); }, { passive: true });
    setInterval(() => { const idle = performance.now() - doomLastT; if (idle > 4000) doomTotal = Math.max(0, doomTotal - 120); doomV = Math.min(1, doomTotal / 9000); document.documentElement.style.setProperty('--peel-doom', doomV.toFixed(3)); }, 500);
  }
  /* ---------- landing surfaces (top edges of headings, images, cards) for snow and the cat ---------- */
  let surfCache = { t: 0, list: [] };
  function surfaces() {
    const now = performance.now(); if (now - surfCache.t < 500) return surfCache.list;
    const out = []; const H = innerHeight;
    for (const el of document.querySelectorAll('h1, h2, h3, img, video, article, [class*="card"], button, nav')) {
      if (out.length >= 90) break; if (el.closest('#peel-ui, #peel-fx, #peel-root')) continue;
      const r = el.getBoundingClientRect(); if (r.width < 30 || r.height < 10 || r.bottom < 0 || r.top > H) continue;
      out.push({ el, left: r.left, right: r.right, top: r.top, width: r.width });
    }
    surfCache = { t: now, list: out }; return out;
  }

  /* ---------- click bursts ---------- */
  const EMO = { bats: ['🦇', '🦇', '👻'], hearts: ['❤️', '💖', '💗'], snow: ['❄️', '❅', '•'] };
  function burst(ctx, spec) {
    const kind = spec.kind || 'confetti'; const doc = document;
    if (kind === 'flash') { const f = document.createElement('div'); f.className = 'fx-flash'; ctx.fx.appendChild(f); const on = () => { f.classList.remove('go'); void f.offsetWidth; f.classList.add('go'); Peel.sound && Peel.sound.play('flash'); }; doc.addEventListener('pointerdown', on, { passive: true }); return () => { f.remove(); doc.removeEventListener('pointerdown', on); }; }
    const c = document.createElement('canvas'); c.className = 'fx-canvas'; ctx.fx.appendChild(c);
    const g = c.getContext('2d'); let ps = [], raf = 0, running = false;
    const size = () => { c.width = innerWidth * devicePixelRatio; c.height = innerHeight * devicePixelRatio; c.style.width = innerWidth + 'px'; c.style.height = innerHeight + 'px'; g.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); };
    size(); addEventListener('resize', size);
    const COL = { confetti: ['#ff3d81', '#ffd400', '#2bd1ff', '#7cff6b', '#ff7a1a', '#b57bff'], sparks: ['#fff7a8', '#ffd166', '#ff8c42', '#fff'], ink: ['#1b1b1b', '#2a2522', '#333'], splash: ['rgba(170,210,255,.9)', 'rgba(220,240,255,.9)'], puff: ['rgba(255,255,255,.9)'], pixels: ['#0000ee', '#ff0000', '#00aa00', '#ff00ff', '#000080'], holi: ['#ff2d75', '#ffd400', '#00c2ff', '#7cff6b', '#ff7a1a', '#b57bff'] };
    const spawn = (x, y) => {
      const n = kind === 'ink' ? 10 : kind === 'bats' ? 5 : kind === 'hearts' ? 7 : kind === 'snow' ? 10 : 26;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, v = kind === 'ink' ? Math.random() * 3 : kind === 'holi' ? 2 + Math.random() * 7 : 1.5 + Math.random() * 5;
        ps.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (kind === 'confetti' || kind === 'holi' ? 3 : 0), t: 0, life: 40 + Math.random() * 30, r: kind === 'ink' ? 3 + Math.random() * 9 : kind === 'holi' ? 6 + Math.random() * 14 : 2 + Math.random() * 4, c: (COL[kind] || COL.confetti)[Math.floor(Math.random() * (COL[kind] || COL.confetti).length)], e: EMO[kind] ? EMO[kind][Math.floor(Math.random() * EMO[kind].length)] : null, rot: Math.random() * 7 });
      }
      if (!running) { running = true; raf = requestAnimationFrame(tick); }
      Peel.sound && Peel.sound.play(kind === 'ink' || kind === 'holi' ? 'splat' : kind === 'sparks' || kind === 'pixels' ? 'type' : 'pop');
    };
    const tick = () => {
      g.clearRect(0, 0, innerWidth, innerHeight);
      for (const p of ps) {
        p.t++; p.x += p.vx; p.y += p.vy; if (kind !== 'ink' && kind !== 'holi') p.vy += kind === 'bats' || kind === 'hearts' ? -.05 : .18; else p.vx *= .85, p.vy *= .85;
        const k = 1 - p.t / p.life; if (k <= 0) continue; g.globalAlpha = Math.min(1, k * 1.5);
        if (p.e) { g.font = `${p.r * 6}px serif`; g.textAlign = 'center'; g.fillText(p.e, p.x, p.y); continue; }
        g.fillStyle = p.c;
        if (kind === 'confetti') { g.save(); g.translate(p.x, p.y); g.rotate(p.rot + p.t * .2); g.fillRect(-p.r, -p.r * .6, p.r * 2, p.r * 1.2); g.restore(); }
        else if (kind === 'pixels') g.fillRect(Math.round(p.x / 4) * 4, Math.round(p.y / 4) * 4, 4, 4);
        else if (kind === 'sparks') { g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - p.vx * 2, p.y - p.vy * 2); g.strokeStyle = p.c; g.lineWidth = 2; g.stroke(); }
        else { g.beginPath(); g.arc(p.x, p.y, p.r * (kind === 'holi' ? 1 + p.t / 30 : 1), 0, 7); g.fill(); }
      }
      g.globalAlpha = 1; ps = ps.filter((p) => p.t < p.life);
      if (ps.length) raf = requestAnimationFrame(tick); else { running = false; g.clearRect(0, 0, innerWidth, innerHeight); }
    };
    const down = (e) => { if (e.button) return; spawn(e.clientX, e.clientY); };
    doc.addEventListener('pointerdown', down, { passive: true });
    return () => { cancelAnimationFrame(raf); c.remove(); removeEventListener('resize', size); doc.removeEventListener('pointerdown', down); };
  }

  /* ---------- dispatcher ---------- */
  Peel.fx = {
    overlays: [...OVERLAYS],
    doom: () => doomV, surfaces,
    bursts: ['confetti', 'holi', 'sparks', 'ink', 'splash', 'puff', 'pixels', 'bats', 'hearts', 'snow', 'flash'],
    run(recipe, ctx) {
      const stops = []; doomStart();
      for (const raw of recipe || []) {
        const spec = parse(raw); if (!spec) continue;
        try {
          if (OVERLAYS.has(spec.type)) stops.push(overlay(ctx, spec.type, spec.v));
          else if (spec.type === 'filters') stops.push(filters(document));
          else if (spec.type === 'particles') { if (ctx.motion && Peel.particles) stops.push(Peel.particles.start(ctx, spec)); }
          else if (spec.type === 'cursor') { if (ctx.motion) stops.push(cursor(ctx, spec)); }
          else if (spec.type === 'enter') { if (ctx.motion) stops.push(enter(ctx, spec)); }
          else if (spec.type === 'ambient') stops.push(ambient(ctx, spec));
          else if (spec.type === 'skew') { if (ctx.motion) stops.push(skew(ctx)); }
          else if (spec.type === 'burst') { if (ctx.motion) stops.push(burst(ctx, spec)); }
          else if (spec.type === 'companion') { if (ctx.motion && Peel.companions) stops.push(Peel.companions.start(ctx, spec)); }
          else if (spec.type === 'sound') { if (Peel.sound) stops.push(Peel.sound.loop(spec.loop)); }
        } catch (e) { console.warn('[Peel] fx failed', spec, e); }
      }
      return () => { for (const s of stops.splice(0)) { try { s(); } catch {} } };
    },
  };
})();
