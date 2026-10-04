/* Peel – companions. A cat that walks the bottom of the window, sits on headlines, sleeps on pictures, and bolts when clicked. */
(function () {
  const Peel = (window.Peel = window.Peel || {});
  const R = (a, b) => a + Math.random() * (b - a);
  // 12x8 pixel cat, two walk frames + sit + sleep. 1 = body, 2 = eye, 3 = ear/tail highlight.
  const F = {
    walk1: ['..3......3..', '.11111111...', '111211211...', '111111111...', '.1111111111.', '.11111111..1', '.1..1..1....', '1...1...1...'],
    walk2: ['..3......3..', '.11111111...', '111211211...', '111111111...', '.1111111111.', '.11111111...', '..1.1..1.1.1', '..1.1..1.1..'],
    sit:   ['..3......3..', '.11111111...', '111211211...', '111111111...', '..111111....', '..111111..1.', '..111111.11.', '..11..11.1..'],
    sleep: ['............', '............', '..3....3....', '.111111111..', '1111111111..', '1111111111.1', '.111111111.1', '..1111111.1.'],
  };
  function draw(g, frame, x, y, s, dir, col) {
    const rows = F[frame]; g.save(); g.translate(x, y); if (dir < 0) { g.scale(-1, 1); g.translate(-12 * s, 0); }
    for (let r = 0; r < rows.length; r++) for (let c = 0; c < rows[r].length; c++) { const ch = rows[r][c]; if (ch === '.') continue; g.fillStyle = ch === '2' ? '#9ef01a' : ch === '3' ? col.ear : col.body; g.fillRect(c * s, r * s, s, s); }
    g.restore();
  }
  function cat(ctx, spec) {
    const c = document.createElement('canvas'); c.className = 'fx-canvas'; ctx.fx.appendChild(c);
    const g = c.getContext('2d'); let W = innerWidth, H = innerHeight;
    const size = () => { W = innerWidth; H = innerHeight; c.width = W * devicePixelRatio; c.height = H * devicePixelRatio; c.style.width = W + 'px'; c.style.height = H + 'px'; g.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); g.imageSmoothingEnabled = false; };
    size(); addEventListener('resize', size);
    const s = spec.size || 4, col = spec.color === 'orange' ? { body: '#e07b2a', ear: '#f5b58a' } : spec.color === 'white' ? { body: '#f2f2f2', ear: '#f7c6d0' } : { body: '#222', ear: '#f7a' };
    const cat = { x: R(60, W - 100), y: 0, dir: 1, state: 'walk', t: 0, frame: 0, perch: null, speed: 1.1 };
    const ground = () => H - 8 * s - 4;
    cat.y = ground();
    let raf = 0, last = performance.now();
    const pickPerch = () => { const surf = Peel.fx.surfaces ? Peel.fx.surfaces() : []; const cands = surf.filter((r) => r.top > 80 && r.top < H - 60 && r.width > 14 * s); return cands.length ? cands[Math.floor(Math.random() * cands.length)] : null; };
    const tick = (now) => {
      const dt = Math.min(50, now - last) / 16; last = now; cat.t += dt;
      g.clearRect(0, 0, W, H);
      if (cat.state === 'walk') {
        cat.x += cat.dir * cat.speed * dt; cat.frame = Math.floor(cat.t / 8) % 2;
        if (cat.x < 10) cat.dir = 1; if (cat.x > W - 12 * s - 10) cat.dir = -1;
        if (cat.perch) { // walking toward a perch: when under it, hop up
          const px = cat.perch.left + 10; if (Math.abs(cat.x - px) < 4) { cat.state = 'hop'; cat.t = 0; } else cat.dir = px > cat.x ? 1 : -1;
        } else if (Math.random() < .002) { const p = pickPerch(); if (p) cat.perch = p; else if (Math.random() < .5) { cat.state = 'sit'; cat.t = 0; } }
      } else if (cat.state === 'hop') {
        const k = Math.min(1, cat.t / 24); const target = cat.perch.top - 8 * s; cat.y = ground() + (target - ground()) * k - Math.sin(k * Math.PI) * 40;
        if (k >= 1) { cat.state = Math.random() < .5 ? 'sit' : 'sleep'; cat.t = 0; cat.y = target; }
      } else if (cat.state === 'sit' || cat.state === 'sleep') {
        if (cat.perch) { const r = cat.perch.el.getBoundingClientRect(); if (r.width === 0 || r.top < -40 || r.top > H + 40) { cat.perch = null; cat.state = 'fall'; cat.t = 0; } else { cat.y = r.top - 8 * s; cat.x = Math.min(Math.max(cat.x, r.left), r.right - 12 * s); } }
        if (cat.t > (cat.state === 'sleep' ? 1400 : 500) + Math.random() * 600) { cat.state = cat.perch ? 'fall' : 'walk'; cat.t = 0; cat.perch = null; }
      } else if (cat.state === 'fall') {
        cat.y = Math.min(ground(), cat.y + 6 * dt); if (cat.y >= ground()) { cat.state = 'walk'; cat.t = 0; }
      } else if (cat.state === 'bolt') {
        cat.x += cat.dir * 7 * dt; cat.frame = Math.floor(cat.t / 3) % 2; cat.y = Math.min(ground(), cat.y + 8 * dt);
        if (cat.x < -14 * s || cat.x > W + 14 * s) { cat.state = 'gone'; cat.t = 0; }
      } else if (cat.state === 'gone') { if (cat.t > 600) { cat.state = 'walk'; cat.t = 0; cat.x = cat.dir > 0 ? -12 * s : W + 12 * s; cat.y = ground(); } }
      if (cat.state !== 'gone') {
        const frame = cat.state === 'sleep' ? 'sleep' : cat.state === 'sit' ? 'sit' : cat.frame ? 'walk2' : 'walk1';
        draw(g, frame, cat.x, cat.y, s, cat.dir, col);
        if (cat.state === 'sleep' && Math.floor(cat.t / 40) % 2) { g.fillStyle = 'rgba(255,255,255,.9)'; g.font = `${s * 3}px monospace`; g.fillText('z', cat.x + (cat.dir > 0 ? 12 * s : -3 * s), cat.y - 2); }
      }
      raf = requestAnimationFrame(tick);
    };
    const down = (e) => { if (cat.state === 'gone' || cat.state === 'bolt') return; const inside = e.clientX > cat.x - 6 && e.clientX < cat.x + 12 * s + 6 && e.clientY > cat.y - 6 && e.clientY < cat.y + 8 * s + 6; if (!inside) return; e.preventDefault(); e.stopPropagation(); cat.state = 'bolt'; cat.t = 0; cat.perch = null; cat.dir = e.clientX < cat.x + 6 * s ? 1 : -1; Peel.sound && Peel.sound.play('meow'); };
    document.addEventListener('pointerdown', down, true);
    const vis = () => { if (document.hidden) cancelAnimationFrame(raf); else { last = performance.now(); raf = requestAnimationFrame(tick); } };
    document.addEventListener('visibilitychange', vis); raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); c.remove(); removeEventListener('resize', size); document.removeEventListener('pointerdown', down, true); document.removeEventListener('visibilitychange', vis); };
  }
  Peel.companions = { start(ctx, spec) { return (spec.kind || 'cat') === 'cat' ? cat(ctx, spec) : () => {}; }, kinds: ['cat'] };
})();
