/* Asteroids – fly a ship over the page and shoot the content. Arrows steer, space fires, G pauses. Everything comes back when you flip away. */
Peel.registerEdition({ id: 'asteroids', name: 'Asteroids', emoji: '🚀', tagline: 'Arrows steer · space fires · G pauses', pack: 'play', css: 'src/editions/asteroids.css', invert: true, fx: ['vignette:.5', { type: 'particles', preset: 'stars', count: 120 }],
  apply(doc, ctx) {
    if (!ctx.motion) return;
    const c = document.createElement('canvas'); c.className = 'fx-canvas'; ctx.fx.appendChild(c);
    const hud = document.createElement('div'); hud.className = 'fx-score'; ctx.fx.appendChild(hud);
    const g = c.getContext('2d'); let W = innerWidth, H = innerHeight;
    const size = () => { W = innerWidth; H = innerHeight; c.width = W * devicePixelRatio; c.height = H * devicePixelRatio; c.style.width = W + 'px'; c.style.height = H + 'px'; g.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); };
    size(); addEventListener('resize', size);
    const ship = { x: W / 2, y: H / 2, a: -Math.PI / 2, vx: 0, vy: 0 }; const keys = {}; let bullets = [], bits = [], score = 0, paused = false, raf = 0, lastShot = 0;
    const hit = new Map();
    const TARGET = 'img, video, h1, h2, h3, h4, p, li, blockquote, figure, button, a, td, span';
    const kd = (e) => { if (e.target && /input|textarea|select/i.test(e.target.tagName) || e.target?.isContentEditable) return; if (e.key === 'g' || e.key === 'G') { paused = !paused; draw(); return; } if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) { keys[e.key] = true; e.preventDefault(); } };
    const ku = (e) => { keys[e.key] = false; };
    doc.addEventListener('keydown', kd, true); doc.addEventListener('keyup', ku, true);
    const draw = () => { hud.textContent = `🚀 ${score}${paused ? ' · paused (G)' : ''}`; };
    draw();
    const tick = () => {
      if (!paused) {
        if (keys.ArrowLeft) ship.a -= .07; if (keys.ArrowRight) ship.a += .07;
        if (keys.ArrowUp) { ship.vx += Math.cos(ship.a) * .18; ship.vy += Math.sin(ship.a) * .18; }
        ship.vx *= .985; ship.vy *= .985; ship.x = (ship.x + ship.vx + W) % W; ship.y = (ship.y + ship.vy + H) % H;
        const now = performance.now();
        if (keys[' '] && now - lastShot > 160) { lastShot = now; bullets.push({ x: ship.x + Math.cos(ship.a) * 14, y: ship.y + Math.sin(ship.a) * 14, vx: Math.cos(ship.a) * 9 + ship.vx, vy: Math.sin(ship.a) * 9 + ship.vy, t: 0 }); Peel.sound && Peel.sound.play('type'); }
        for (const b of bullets) {
          b.x += b.vx; b.y += b.vy; b.t++;
          if (b.t % 2) continue;
          c.style.pointerEvents = 'none'; const el = doc.elementFromPoint(b.x, b.y);
          const t = el && el.closest && !el.closest('#peel-ui, #peel-fx, #peel-root') ? el.closest(TARGET) : null;
          if (t && !hit.has(t) && t.getBoundingClientRect().width < W * .9) {
            const r = t.getBoundingClientRect(); hit.set(t, { vis: t.style.getPropertyValue('visibility'), pri: t.style.getPropertyPriority('visibility') });
            t.style.setProperty('visibility', 'hidden', 'important'); score += Math.max(1, Math.round(60 / Math.max(10, Math.sqrt(r.width * r.height) / 6))); b.t = 999; draw(); Peel.sound && Peel.sound.play('splat');
            for (let i = 0; i < 18; i++) { const a = Math.random() * 7, v = 1 + Math.random() * 4; bits.push({ x: b.x, y: b.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, c: `hsl(${Math.random() * 60 + 10},100%,60%)` }); }
          }
        }
        bullets = bullets.filter((b) => b.t < 70 && b.x > -10 && b.x < W + 10 && b.y > -10 && b.y < H + 10);
        for (const p of bits) { p.x += p.vx; p.y += p.vy; p.vx *= .96; p.vy *= .96; p.t++; } bits = bits.filter((p) => p.t < 40);
      }
      g.clearRect(0, 0, W, H);
      g.save(); g.translate(ship.x, ship.y); g.rotate(ship.a); g.strokeStyle = '#fff'; g.lineWidth = 2; g.shadowColor = '#7df9ff'; g.shadowBlur = 10; g.beginPath(); g.moveTo(16, 0); g.lineTo(-12, -10); g.lineTo(-7, 0); g.lineTo(-12, 10); g.closePath(); g.stroke();
      if (keys.ArrowUp && !paused && Math.random() > .3) { g.strokeStyle = '#ffb347'; g.beginPath(); g.moveTo(-9, -4); g.lineTo(-20 - Math.random() * 10, 0); g.lineTo(-9, 4); g.stroke(); } g.restore();
      g.fillStyle = '#fff'; g.shadowBlur = 6; g.shadowColor = '#fff'; for (const b of bullets) { g.beginPath(); g.arc(b.x, b.y, 2.2, 0, 7); g.fill(); } g.shadowBlur = 0;
      for (const p of bits) { g.globalAlpha = 1 - p.t / 40; g.fillStyle = p.c; g.fillRect(p.x, p.y, 3, 3); } g.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    ctx.onDestroy(() => { cancelAnimationFrame(raf); c.remove(); hud.remove(); removeEventListener('resize', size); doc.removeEventListener('keydown', kd, true); doc.removeEventListener('keyup', ku, true); for (const [t, s] of hit) { if (s.vis) t.style.setProperty('visibility', s.vis, s.pri); else t.style.removeProperty('visibility'); } hit.clear(); });
  } });
