/* Peel – one particle engine, many presets. Draws into a click-through canvas in the fx layer. */
(function () {
  const Peel = (window.Peel = window.Peel || {});
  const R = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const PRESETS = {
    snow:      { count: 110, settle: true, make: (W, H) => ({ x: R(0, W), y: R(-H, H), r: R(1.2, 3.8), vy: R(.5, 1.4), ph: R(0, 7), a: R(.5, .95) }), step: (p, t, w) => { p.py = p.y; p.y += p.vy; p.x += Math.sin(t / 900 + p.ph) * .5 + w; }, draw: (g, p) => { g.fillStyle = `rgba(255,255,255,${p.a})`; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 7); g.fill(); } },
    rain:      { count: 160, make: (W, H) => ({ x: R(0, W), y: R(-H, H), l: R(10, 24), vy: R(10, 18), a: R(.25, .6) }), step: (p, t, w) => { p.y += p.vy; p.x += w * 3 - 1.2; }, draw: (g, p) => { g.strokeStyle = `rgba(190,215,255,${p.a})`; g.lineWidth = 1.2; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - 1.5, p.y + p.l); g.stroke(); } },
    embers:    { count: 55, blend: 'screen', make: (W, H) => ({ x: R(0, W), y: R(H * .4, H + 40), r: R(1, 3), vy: R(-.5, -1.6), ph: R(0, 7), c: pick(['#ff7a1a', '#ffb347', '#ff4d00', '#ffd27a']) }), step: (p, t) => { p.y += p.vy; p.x += Math.sin(t / 600 + p.ph) * .7; }, draw: (g, p, t) => { const f = .6 + .4 * Math.sin(t / 120 + p.ph); g.shadowBlur = 12; g.shadowColor = p.c; g.fillStyle = p.c; g.globalAlpha = f; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 7); g.fill(); g.globalAlpha = 1; g.shadowBlur = 0; } },
    bubbles:   { count: 42, make: (W, H) => ({ x: R(0, W), y: R(0, H + 60), r: R(3, 11), vy: R(-.4, -1.3), ph: R(0, 7) }), step: (p, t) => { p.y += p.vy; p.x += Math.sin(t / 700 + p.ph) * .6; }, draw: (g, p) => { g.strokeStyle = 'rgba(210,240,255,.75)'; g.lineWidth = 1.2; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 7); g.stroke(); g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.arc(p.x - p.r * .35, p.y - p.r * .35, p.r * .25, 0, 7); g.fill(); } },
    fireflies: { count: 30, blend: 'screen', make: (W, H) => ({ x: R(0, W), y: R(0, H), a: R(0, 7), s: R(.2, .6), ph: R(0, 7) }), step: (p) => { p.a += (Math.random() - .5) * .4; p.x += Math.cos(p.a) * p.s; p.y += Math.sin(p.a) * p.s; }, draw: (g, p, t) => { const f = Math.max(0, Math.sin(t / 500 + p.ph)); g.shadowBlur = 14; g.shadowColor = '#d9ff6a'; g.fillStyle = `rgba(217,255,106,${f})`; g.beginPath(); g.arc(p.x, p.y, 2.2, 0, 7); g.fill(); g.shadowBlur = 0; } },
    confetti:  { count: 130, make: (W, H) => ({ x: R(0, W), y: R(-H, 0), w: R(5, 10), h: R(8, 14), vy: R(1.2, 3), rot: R(0, 7), vr: R(-.1, .1), c: pick(['#ff3d81', '#ffd400', '#2bd1ff', '#7cff6b', '#ff7a1a', '#b57bff']) }), step: (p, t, w) => { p.y += p.vy; p.x += Math.sin(t / 500 + p.rot) * 1.2 + w; p.rot += p.vr; }, draw: (g, p) => { g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.fillStyle = p.c; g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.rot * 2))); g.restore(); } },
    leaves:    { count: 36, make: (W, H) => ({ x: R(0, W), y: R(-H, H), s: R(14, 26), vy: R(.5, 1.3), rot: R(0, 7), vr: R(-.03, .03), ph: R(0, 7), gl: pick(['🍂', '🍁', '🍃']) }), step: (p, t, w) => { p.y += p.vy; p.x += Math.sin(t / 800 + p.ph) * 1.1 + w; p.rot += p.vr; }, draw: (g, p) => { g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.font = `${p.s}px serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(p.gl, 0, 0); g.restore(); } },
    dust:      { count: 70, make: (W, H) => ({ x: R(0, W), y: R(0, H), r: R(.6, 1.8), a: R(0, 7), s: R(.05, .25), ph: R(0, 7) }), step: (p) => { p.a += (Math.random() - .5) * .2; p.x += Math.cos(p.a) * p.s; p.y += Math.sin(p.a) * p.s; }, draw: (g, p, t) => { g.fillStyle = `rgba(255,255,255,${.25 + .35 * Math.sin(t / 900 + p.ph)})`; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 7); g.fill(); } },
    stars:     { count: 220, blend: 'screen', make: (W, H) => ({ x: R(0, W), y: R(0, H), r: R(.4, 1.6), d: R(.1, .6), ph: R(0, 7) }), step: () => {}, draw: (g, p, t, W, H) => { const y = ((p.y - scrollY * p.d) % H + H) % H; g.fillStyle = `rgba(255,255,255,${.4 + .6 * Math.abs(Math.sin(t / 1200 + p.ph))})`; g.beginPath(); g.arc(p.x, y, p.r, 0, 7); g.fill(); } },
    matrix:    { count: 0, special: 'matrix' },
    bugs:      { count: 11, special: 'bugs' },
  };

  function start(ctx, spec) {
    const preset = PRESETS[spec.preset || 'snow'] || PRESETS.snow;
    const c = document.createElement('canvas'); c.className = 'fx-canvas'; if (preset.blend) c.style.mixBlendMode = preset.blend; if (spec.opacity != null) c.style.opacity = spec.opacity; ctx.fx.appendChild(c);
    const g = c.getContext('2d'); let W = innerWidth, H = innerHeight, raf = 0;
    const size = () => { W = innerWidth; H = innerHeight; c.width = W * devicePixelRatio; c.height = H * devicePixelRatio; c.style.width = W + 'px'; c.style.height = H + 'px'; g.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); };
    size(); addEventListener('resize', size);
    const wind = spec.wind ?? 0.2;
    let mouse = { x: -1e4, y: -1e4 }; const move = (e) => { mouse = { x: e.clientX, y: e.clientY }; };
    document.addEventListener('pointermove', move, { passive: true });
    let ps = [], cols = [], bugs = [];
    const count = Math.min(spec.count ?? preset.count, 400);
    if (!preset.special) ps = Array.from({ length: count }, () => preset.make(W, H));
    if (preset.special === 'matrix') { const n = Math.ceil(W / 18); cols = Array.from({ length: n }, (_, i) => ({ x: i * 18, y: R(-H, 0), v: R(2, 7), len: R(8, 30) })); }
    if (preset.special === 'bugs') bugs = Array.from({ length: spec.count || 11 }, () => ({ x: R(0, W), y: R(0, H), a: R(0, 7), s: R(.6, 2), g: pick(['🪳', '🐜', '🐜', '🕷️', '🪲']), size: R(16, 28), pause: 0 }));
    const GL = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉ0123456789ABCDEFZ';
    const doom = () => (Peel.fx && Peel.fx.doom ? Peel.fx.doom() : 0);
    // Settling snow: piles keyed by the element they sit on, in 4px columns from its left edge; plus a ground pile.
    const piles = new Map(), ground = new Float32Array(Math.ceil(4000 / 4));
    const land = (p) => {
      if (p.py == null) return false;
      const cap = 7 + doom() * 9;
      if (p.y >= H - 2) { const i = Math.floor(p.x / 4); if (i >= 0 && i < ground.length && ground[i] < cap * 1.6) { ground[i] += 1; if (i > 0) ground[i - 1] += .5; if (i + 1 < ground.length) ground[i + 1] += .5; return true; } return false; }
      for (const sf of Peel.fx.surfaces()) {
        if (p.x < sf.left || p.x > sf.right || p.py >= sf.top || p.y < sf.top) continue;
        let arr = piles.get(sf.el); if (!arr) { arr = new Float32Array(Math.ceil(sf.width / 4) + 1); piles.set(sf.el, arr); }
        const i = Math.floor((p.x - sf.left) / 4); if (i < 0 || i >= arr.length) return false;
        const nb = (arr[i - 1] || 0) + (arr[i + 1] || 0); if (arr[i] < cap && arr[i] <= nb / 2 + 2) { arr[i] += .9; if (i > 0) arr[i - 1] = Math.min(cap, arr[i - 1] + .45); if (i + 1 < arr.length) arr[i + 1] = Math.min(cap, arr[i + 1] + .45); return true; }
        return false;
      }
      return false;
    };
    const drawPiles = () => {
      g.fillStyle = 'rgba(255,255,255,.96)'; g.shadowColor = 'rgba(120,150,190,.5)'; g.shadowBlur = 3;
      for (const sf of Peel.fx.surfaces()) { const arr = piles.get(sf.el); if (!arr) continue; for (let i = 0; i < arr.length; i++) if (arr[i] > .5) { g.beginPath(); g.roundRect(sf.left + i * 4, sf.top - arr[i], 4.5, arr[i] + 1, [2, 2, 0, 0]); g.fill(); } }
      for (let i = 0; i < ground.length; i++) if (ground[i] > .5) { g.beginPath(); g.roundRect(i * 4, H - ground[i], 4.5, ground[i] + 2, [2, 2, 0, 0]); g.fill(); }
      g.shadowBlur = 0;
    };
    // Squishable bugs: a click on a bug splats it, scores a point, and a new one crawls in later.
    const stains = []; let score = 0, scoreEl = null; const hostKey = location.hostname.replace(/^www\./, '');
    const showScore = () => { if (!scoreEl) { scoreEl = document.createElement('div'); scoreEl.className = 'fx-score'; ctx.fx.appendChild(scoreEl); } scoreEl.textContent = `🪳 ${score} squished`; scoreEl.classList.add('bump'); setTimeout(() => scoreEl && scoreEl.classList.remove('bump'), 160); };
    if (preset.special === 'bugs' && Peel.store && Peel.store.bugScore) Peel.store.bugScore(hostKey).then((n) => { if (n) { score = n; showScore(); } });
    const squish = (e) => {
      if (preset.special !== 'bugs' || e.button) return;
      const i = bugs.findIndex((b) => Math.hypot(b.x - e.clientX, b.y - e.clientY) < b.size * .75 + 6);
      if (i < 0) return;
      e.preventDefault(); e.stopPropagation();
      const b = bugs.splice(i, 1)[0]; stains.push({ x: b.x, y: b.y, r: b.size * .6, rot: b.a, t: performance.now(), blobs: Array.from({ length: 6 }, () => ({ dx: R(-1, 1), dy: R(-1, 1), k: R(.3, .8) })) });
      if (stains.length > 40) stains.shift();
      score++; showScore(); Peel.sound && Peel.sound.play('splat'); Peel.store && Peel.store.setBugScore && Peel.store.setBugScore(hostKey, score);
      setTimeout(() => { if (bugs.length < 40) bugs.push({ x: Math.random() < .5 ? -20 : W + 20, y: R(0, H), a: R(0, 7), s: R(.6, 2), g: pick(['🪳', '🐜', '🐜', '🕷️', '🪲']), size: R(16, 28), pause: 0 }); }, 1500 + Math.random() * 2500);
    };
    if (preset.special === 'bugs') document.addEventListener('pointerdown', squish, true);
    const drawStains = () => { for (const st of stains) { g.save(); g.translate(st.x, st.y); g.rotate(st.rot); g.fillStyle = 'rgba(70,60,20,.55)'; for (const bl of st.blobs) { g.beginPath(); g.ellipse(bl.dx * st.r, bl.dy * st.r, st.r * bl.k, st.r * bl.k * .7, bl.dx, 0, 7); g.fill(); } g.fillStyle = 'rgba(120,140,40,.5)'; g.beginPath(); g.arc(0, 0, st.r * .5, 0, 7); g.fill(); g.restore(); } };
    let baseBugs = bugs.length, baseCount = ps.length;
    let simT = 0;
    const frame = (tSim) => {
      const t = tSim != null ? (simT += 16) : performance.now(); g.clearRect(0, 0, W, H);
      if (preset.special === 'matrix') {
        g.font = '15px ui-monospace, Menlo, monospace'; g.textAlign = 'center';
        for (const col of cols) { for (let k = 0; k < col.len; k++) { const y = col.y - k * 18; if (y < -20 || y > H + 20) continue; const a = k === 0 ? 1 : Math.max(0, 1 - k / col.len); g.fillStyle = k === 0 ? `rgba(220,255,220,${a})` : `rgba(0,255,90,${a * .8})`; g.fillText(GL[(Math.floor(t / 90) + k * 7 + Math.floor(col.x)) % GL.length], col.x + 9, y); } col.y += col.v; if (col.y - col.len * 18 > H) { col.y = R(-200, 0); col.v = R(2, 7); col.len = R(8, 30); } }
      } else if (preset.special === 'bugs') {
        drawStains();
        const want = Math.min(40, baseBugs + Math.floor(doom() * baseBugs * 2.2));
        if (bugs.length < want && Math.random() < .03) bugs.push({ x: Math.random() < .5 ? -20 : W + 20, y: R(0, H), a: R(0, 7), s: R(.6, 2), g: pick(['🪳', '🐜', '🐜', '🕷️', '🪲']), size: R(16, 28), pause: 0 });
        for (const b of bugs) {
          const dx = b.x - mouse.x, dy = b.y - mouse.y, d = Math.hypot(dx, dy);
          if (d < 95) { b.a = Math.atan2(dy, dx) + (Math.random() - .5) * .6; b.pause = 0; b.x += Math.cos(b.a) * 5; b.y += Math.sin(b.a) * 5; }
          else if (b.pause > 0) b.pause--; else { if (Math.random() < .02) b.pause = 20 + Math.random() * 90; b.a += (Math.random() - .5) * .5; b.x += Math.cos(b.a) * b.s; b.y += Math.sin(b.a) * b.s; }
          if (b.x < -30) b.x = W + 20; if (b.x > W + 30) b.x = -20; if (b.y < -30) b.y = H + 20; if (b.y > H + 30) b.y = -20;
          g.save(); g.translate(b.x, b.y); g.rotate(b.a + Math.PI / 2); g.font = `${b.size}px serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 4; g.shadowOffsetY = 2; g.fillText(b.g, 0, 0); g.restore();
        }
      } else {
        if (preset.settle) drawPiles();
        const want = Math.min(400, baseCount + Math.floor(doom() * baseCount * (preset.settle ? 1.2 : .8)));
        if (ps.length < want) ps.push(preset.make(W, H));
        for (const p of ps) {
          preset.step(p, t, wind);
          if (preset.settle && land(p)) { p.y = -30; p.x = R(0, W); p.py = null; continue; }
          preset.draw(g, p, t, W, H);
          if (p.y > H + 40) { p.y = -30; p.x = R(0, W); } if (p.y < -60) { p.y = H + 30; p.x = R(0, W); }
          if (p.x > W + 40) p.x = -30; if (p.x < -40) p.x = W + 30;
        }
      }
    };
    const tick = () => { frame(); raf = requestAnimationFrame(tick); };
    Peel.particles.last = { frame: (n = 1) => { for (let i = 0; i < n; i++) frame(true); }, state: () => ({ ps, bugs, piles, ground, stains, score }) };
    const vis = () => { if (document.hidden) cancelAnimationFrame(raf); else raf = requestAnimationFrame(tick); };
    document.addEventListener('visibilitychange', vis); raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); c.remove(); scoreEl && scoreEl.remove(); removeEventListener('resize', size); document.removeEventListener('pointermove', move); document.removeEventListener('pointerdown', squish, true); document.removeEventListener('visibilitychange', vis); };
  }
  Peel.particles = { start, presets: Object.keys(PRESETS) };
})();
