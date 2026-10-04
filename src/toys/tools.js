/* Peel – the toys themselves: Blast, Hammer, Tear, Black hole, Spray paint. */
(function () {
  const Peel = (window.Peel = window.Peel || {});
  const R = (a, b) => a + Math.random() * (b - a);
  const eat = (e) => { e.preventDefault(); e.stopPropagation(); };
  const inUI = (e) => e.target && e.target.closest && e.target.closest('#peel-ui, #peel-toys');

  /* ---------- Blast ---------- */
  Peel.toys.register({ id: 'blast', name: 'Blast', emoji: '💥', tagline: 'Click. Hold for bigger.', hint: 'Click anywhere. Hold to charge.',
    start(ctx) {
      const { c, g, destroy } = ctx.canvas(); let rings = [], dust = [], charge = null, raf = 0;
      const down = (e) => { if (e.button || inUI(e)) return; eat(e); charge = { x: e.clientX, y: e.clientY, t0: performance.now() }; loop(); };
      const up = (e) => { if (!charge) return; eat(e); const held = Math.min(1, (performance.now() - charge.t0) / 1400); const r = 150 + held * 300; boom(charge.x, charge.y, r, held); charge = null; };
      const boom = (x, y, r, held) => {
        rings.push({ x, y, r: 0, max: r, t: 0 });
        for (const o of ctx.around(x, y, r, 80)) { const k = 1 - o.d / r; const a = Math.atan2(o.cy - y, o.cx - x); const sp = (9 + held * 10) * (0.35 + k); ctx.fling(o.el, Math.cos(a) * sp, Math.sin(a) * sp - 5 * k - 2, (Math.random() - .5) * .35 * (0.5 + k)); }
        for (let i = 0; i < 40 + held * 60; i++) { const a = R(0, 7), v = R(1, 7 + held * 6); dust.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, t: 0, r: R(2, 6), c: Math.random() < .5 ? 'rgba(90,80,70,.8)' : 'rgba(255,170,60,.9)' }); }
        Peel.sound && Peel.sound.play('boom'); try { document.body.animate([{ transform: 'translate(0,0)' }, { transform: `translate(${4 + held * 8}px,-${3 + held * 6}px)` }, { transform: `translate(-${3 + held * 6}px,${2 + held * 4}px)` }, { transform: 'none' }], { duration: 260 }); } catch {}
        loop();
      };
      const loop = () => { if (!raf) raf = requestAnimationFrame(tick); };
      const tick = () => {
        g.clearRect(0, 0, innerWidth, innerHeight); let alive = false;
        if (charge) { alive = true; const held = Math.min(1, (performance.now() - charge.t0) / 1400); g.beginPath(); g.arc(charge.x, charge.y, 150 + held * 300, 0, 7); g.strokeStyle = `rgba(255,120,30,${.25 + held * .4})`; g.setLineDash([6, 8]); g.lineWidth = 2; g.stroke(); g.setLineDash([]); g.fillStyle = `rgba(255,120,30,${.08 + held * .12})`; g.fill(); }
        for (const r of rings) { r.t++; r.r = r.max * (1 - Math.pow(1 - Math.min(1, r.t / 28), 3)); if (r.t < 36) { alive = true; g.beginPath(); g.arc(r.x, r.y, r.r, 0, 7); g.lineWidth = 14 * (1 - r.t / 36); g.strokeStyle = `rgba(255,255,255,${1 - r.t / 36})`; g.stroke(); } }
        for (const d of dust) { d.t++; d.x += d.vx; d.y += d.vy; d.vy += .12; d.vx *= .96; if (d.t < 60) { alive = true; g.globalAlpha = 1 - d.t / 60; g.fillStyle = d.c; g.beginPath(); g.arc(d.x, d.y, d.r, 0, 7); g.fill(); } }
        g.globalAlpha = 1; rings = rings.filter((r) => r.t < 36); dust = dust.filter((d) => d.t < 60);
        raf = alive ? requestAnimationFrame(tick) : 0;
      };
      document.addEventListener('pointerdown', down, true); document.addEventListener('pointerup', up, true);
      return () => { cancelAnimationFrame(raf); destroy(); document.removeEventListener('pointerdown', down, true); document.removeEventListener('pointerup', up, true); };
    } });

  /* ---------- Hammer ---------- */
  Peel.toys.register({ id: 'hammer', name: 'Hammer', emoji: '🔨', tagline: 'Three hits and it shatters', hint: 'Whack things. Third hit breaks them.',
    start(ctx) {
      const { g, destroy } = ctx.canvas(); const hits = new Map(); const cracks = []; let raf = 0;
      const crack = (x, y, n) => { const segs = []; for (let i = 0; i < 3 + n * 2; i++) { let px = x, py = y, a = R(0, 7); const pts = [[px, py]]; for (let k = 0; k < 4 + n * 2; k++) { a += R(-.7, .7); px += Math.cos(a) * R(8, 22); py += Math.sin(a) * R(8, 22); pts.push([px, py]); } segs.push(pts); } cracks.push({ segs, sy: scrollY, t: 0 }); draw(); };
      const draw = () => { g.clearRect(0, 0, innerWidth, innerHeight); g.strokeStyle = 'rgba(20,20,20,.75)'; g.lineWidth = 1.4; g.shadowColor = 'rgba(255,255,255,.6)'; g.shadowBlur = 1; for (const c of cracks) { const dy = c.sy - scrollY; for (const pts of c.segs) { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y + dy) : g.moveTo(x, y + dy))); g.stroke(); } } };
      const onScroll = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; draw(); }); };
      const down = (e) => {
        if (e.button || inUI(e)) return; const el = ctx.target(e); eat(e);
        try { document.body.animate([{ transform: 'translate(0,0)' }, { transform: 'translate(0,3px)' }, { transform: 'none' }], { duration: 120 }); } catch {}
        if (!el) { crack(e.clientX, e.clientY, 0); Peel.sound && Peel.sound.play('clunk'); return; }
        const n = (hits.get(el) || 0) + 1; hits.set(el, n); ctx.remember(el);
        if (n >= 3) { hits.delete(el); ctx.shatter(el, e.clientX, e.clientY - 40); crack(e.clientX, e.clientY, 2); return; }
        crack(e.clientX, e.clientY, n); Peel.sound && Peel.sound.play('clunk');
        el.style.setProperty('transition', 'transform .18s cubic-bezier(.2,.9,.3,1.4)', 'important'); el.style.setProperty('transform', `scale(${1 - n * .03}) skew(${R(-3, 3)}deg, ${R(-2, 2)}deg) translateY(${n * 2}px)`, 'important'); el.style.setProperty('filter', `contrast(${1 + n * .08}) brightness(${1 - n * .05})`, 'important');
      };
      document.addEventListener('pointerdown', down, true); addEventListener('scroll', onScroll, { passive: true });
      ctx.onRewind(() => { cracks.length = 0; hits.clear(); draw(); });
      return () => { destroy(); document.removeEventListener('pointerdown', down, true); removeEventListener('scroll', onScroll); };
    } });

  /* ---------- Tear ---------- */
  Peel.toys.register({ id: 'tear', name: 'Tear', emoji: '📄', tagline: 'Drag in from an edge', hint: 'Start at an edge and drag across. Underneath is your previous edition.',
    start(ctx) {
      const fx = ctx.fx; let tear = null; const EDGE = 48;
      const edgeOf = (x, y) => (x < EDGE ? 'L' : x > innerWidth - EDGE ? 'R' : y < EDGE ? 'T' : y > innerHeight - EDGE ? 'B' : null);
      const onEdge = (x, y) => ({ L: [0, y], R: [innerWidth, y], T: [x, 0], B: [x, innerHeight] });
      const corners = [[0, 0], [innerWidth, 0], [innerWidth, innerHeight], [0, innerHeight]];  // clockwise TL TR BR BL
      const param = ([x, y]) => { const W = innerWidth, H = innerHeight; if (y <= 0.5) return x; if (x >= W - .5) return W + y; if (y >= H - .5) return W + H + (W - x); return 2 * W + H + (H - y); };
      const cornerParams = [0, innerWidth, innerWidth + innerHeight, 2 * innerWidth + innerHeight], P = 2 * (innerWidth + innerHeight);
      const between = (a, b) => { const out = []; for (let i = 0; i < 4; i++) { const p = cornerParams[i]; const inside = a <= b ? (p > a && p < b) : (p > a || p < b); if (inside) out.push(i); } return out.sort((i, j) => ((cornerParams[i] - a + P) % P) - ((cornerParams[j] - a + P) % P)); };
      const down = async (e) => {
        if (e.button || inUI(e) || tear) return; const edge = edgeOf(e.clientX, e.clientY); if (!edge) return; eat(e);
        const start = onEdge(e.clientX, e.clientY)[edge];
        const snap = Peel.capture ? await Peel.capture() : null;
        const imgs = [0, 1].map(() => { const im = document.createElement('img'); im.className = 'toy-snap'; if (snap) im.src = snap; else im.style.background = '#ddd'; fx.appendChild(im); return im; });
        const fib = ctx.canvas('toy-fibres');
        tear = { start, edge, pts: [start], jit: [Math.random()], imgs, fib, w: 14 };
        Peel.sound && Peel.sound.play('rip');
        Peel.tearUnder && Peel.tearUnder();          // switch what is underneath to the previous edition
        draw();
      };
      const move = (e) => { if (!tear) return; eat(e); const last = tear.pts[tear.pts.length - 1]; if (Math.hypot(e.clientX - last[0], e.clientY - last[1]) < 9) return; tear.pts.push([e.clientX, e.clientY]); tear.jit.push(Math.random()); tear.w = Math.min(34, tear.w + .4); if (tear.pts.length % 6 === 0 && Peel.sound) Peel.sound.play('rip'); draw(); };
      const draw = () => {
        const t = tear; const pts = t.pts; const last = pts[pts.length - 1];
        const endEdge = (() => { const d = [last[0], innerWidth - last[0], last[1], innerHeight - last[1]]; const i = d.indexOf(Math.min(...d)); return ['L', 'R', 'T', 'B'][i]; })();
        const end = onEdge(last[0], last[1])[endEdge];
        const path = [t.start, ...pts.slice(1), end];
        const side = (s) => path.map((p, i) => { const q = path[Math.min(path.length - 1, i + 1)], o = path[Math.max(0, i - 1)]; let dx = q[0] - o[0], dy = q[1] - o[1]; const L = Math.hypot(dx, dy) || 1; dx /= L; dy /= L; const n = [-dy, dx]; const j = (t.jit[i % t.jit.length] - .5) * t.w * .9; const off = s * t.w / 2 + j; return [p[0] + n[0] * off, p[1] + n[1] * off]; });
        const a = param(t.start), b = param(end);
        const A = side(1), B = side(-1);
        const polyA = [...A, ...between(b, a).map((i) => corners[i])];            // right-hand piece: boundary clockwise end→start
        const polyB = [...B, ...between(a, b).reverse().map((i) => corners[i])];  // left-hand piece: boundary counter-clockwise end→start
        t.imgs[0].style.clipPath = `polygon(${polyA.map((p) => `${p[0]}px ${p[1]}px`).join(',')})`;
        t.imgs[1].style.clipPath = `polygon(${polyB.map((p) => `${p[0]}px ${p[1]}px`).join(',')})`;
        const g = t.fib.g; g.clearRect(0, 0, innerWidth, innerHeight); g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 1;
        for (let i = 1; i < path.length; i++) for (let k = 0; k < 3; k++) { const p = path[i]; const ang = R(0, 7); g.beginPath(); g.moveTo(p[0] + R(-t.w / 2, t.w / 2), p[1] + R(-t.w / 2, t.w / 2)); g.lineTo(p[0] + Math.cos(ang) * R(3, 9), p[1] + Math.sin(ang) * R(3, 9)); g.stroke(); }
      };
      const up = async (e) => {
        if (!tear) return; eat(e); const t = tear; tear = null;
        const len = t.pts.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - t.pts[i - 1][0], p[1] - t.pts[i - 1][1]) : 0), 0);
        t.fib.destroy();
        if (len < Math.min(innerWidth, innerHeight) * .45) { t.imgs.forEach((im) => im.remove()); Peel.tearCancel && Peel.tearCancel(); Peel.sound && Peel.sound.play('pop'); return; }
        t.imgs[0].style.transition = t.imgs[1].style.transition = 'transform 1.1s cubic-bezier(.4,0,.8,.4), opacity 1s';
        t.imgs[0].style.transform = `translate(60px, ${innerHeight * .9}px) rotate(14deg)`; t.imgs[1].style.transform = `translate(-60px, ${innerHeight * .9}px) rotate(-12deg)`; t.imgs[0].style.opacity = t.imgs[1].style.opacity = '0';
        Peel.sound && Peel.sound.play('rip'); Peel.tearCommit && Peel.tearCommit();
        setTimeout(() => t.imgs.forEach((im) => im.remove()), 1200);
      };
      document.addEventListener('pointerdown', down, true); document.addEventListener('pointermove', move, true); document.addEventListener('pointerup', up, true);
      return () => { if (tear) { tear.imgs.forEach((im) => im.remove()); tear.fib.destroy(); Peel.tearCancel && Peel.tearCancel(); tear = null; } document.removeEventListener('pointerdown', down, true); document.removeEventListener('pointermove', move, true); document.removeEventListener('pointerup', up, true); };
    } });

  /* ---------- Black hole ---------- */
  Peel.toys.register({ id: 'hole', name: 'Black hole', emoji: '🕳️', tagline: 'Click to open. Click it to spit out.', hint: 'Click to place one. Click it again to give everything back.',
    start(ctx) {
      const { g, destroy } = ctx.canvas(); let hole = null, raf = 0, rot = 0;
      const down = (e) => {
        if (e.button || inUI(e)) return; eat(e);
        if (hole && Math.hypot(e.clientX - hole.x, e.clientY - hole.y) < 70) { release(); return; }
        if (hole) release(true);
        hole = { x: e.clientX, y: e.clientY, sy: scrollY, r: 0, t: 0, caught: [] };
        Peel.sound && Peel.sound.play('whoosh'); if (!raf) raf = requestAnimationFrame(tick);
      };
      const release = (quiet) => {
        if (!hole) return; const h = hole; hole = null;
        for (const c of h.caught) { try { c.el.style.setProperty('transition', 'transform .7s cubic-bezier(.2,1.4,.3,1), opacity .4s, visibility 0s', 'important'); c.el.style.setProperty('transform', 'none', 'important'); c.el.style.setProperty('opacity', '1', 'important'); c.el.style.setProperty('visibility', 'visible', 'important'); } catch {} }
        if (!quiet) Peel.sound && Peel.sound.play('boom');
      };
      const tick = () => {
        g.clearRect(0, 0, innerWidth, innerHeight); rot += .05;
        if (hole) {
          const h = hole; h.t++; h.r = Math.min(320, h.r + 3); const hy = h.y - (scrollY - h.sy);
          if (h.t % 10 === 0) for (const o of ctx.around(h.x, hy, h.r, 12)) if (!h.caught.some((c) => c.el === o.el)) { ctx.remember(o.el); o.el.style.setProperty('transition', 'none', 'important'); o.el.style.setProperty('transform-origin', 'center', 'important'); o.el.style.setProperty('pointer-events', 'none', 'important'); o.el.style.setProperty('z-index', '2147483000', 'important'); if (getComputedStyle(o.el).position === 'static') o.el.style.setProperty('position', 'relative', 'important'); h.caught.push({ el: o.el, cx: o.cx, cy: o.cy, sy: scrollY, k: 0, a: Math.atan2(o.cy - hy, o.cx - h.x) }); }
          for (const c of h.caught) {
            if (c.k >= 1) continue; c.k = Math.min(1, c.k + .012); const ease = c.k * c.k; const cx = c.cx - (scrollY - c.sy) * 0, cy = c.cy - (scrollY - c.sy);
            const ang = c.a + ease * 6; const dist = Math.hypot(cx - h.x, cy - hy) * (1 - ease);
            const tx = h.x + Math.cos(ang) * dist - cx, ty = hy + Math.sin(ang) * dist - cy;
            c.el.style.setProperty('transform', `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) rotate(${(ease * 8).toFixed(2)}rad) scale(${(1 - ease * .97).toFixed(3)})`, 'important');
            c.el.style.setProperty('opacity', String(1 - ease * .6), 'important');
            if (c.k >= 1) { c.el.style.setProperty('visibility', 'hidden', 'important'); Peel.sound && Peel.sound.play('pop'); }
          }
          const rr = 26 + Math.min(h.t, 60) * .5;
          g.save(); g.translate(h.x, hy); g.rotate(rot);
          const grd = g.createRadialGradient(0, 0, rr * .6, 0, 0, rr * 2.4); grd.addColorStop(0, 'rgba(0,0,0,1)'); grd.addColorStop(.5, 'rgba(120,60,255,.55)'); grd.addColorStop(.8, 'rgba(255,160,60,.25)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
          g.fillStyle = grd; g.beginPath(); g.ellipse(0, 0, rr * 2.4, rr * 1.6, 0, 0, 7); g.fill();
          g.fillStyle = '#000'; g.beginPath(); g.arc(0, 0, rr, 0, 7); g.fill(); g.strokeStyle = 'rgba(255,220,120,.9)'; g.lineWidth = 2; g.shadowColor = '#ffb347'; g.shadowBlur = 16; g.stroke(); g.restore();
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      document.addEventListener('pointerdown', down, true);
      ctx.onRewind(() => { release(true); });
      return () => { cancelAnimationFrame(raf); release(true); destroy(); document.removeEventListener('pointerdown', down, true); };
    } });

  /* ---------- Spray paint ---------- */
  Peel.toys.register({ id: 'spray', name: 'Spray paint', emoji: '🎨', tagline: 'Tag the page. It stays.', hint: 'Hold and move. Your tag is saved for this site.',
    start(ctx) {
      const fx = ctx.fx; const hostKey = location.hostname.replace(/^www\./, '');
      const { c, g, destroy } = ctx.canvas('toy-spray'); c.style.pointerEvents = 'auto'; c.style.cursor = 'crosshair';
      const H = Math.min(8000, Math.max(innerHeight, document.documentElement.scrollHeight)); const off = document.createElement('canvas'); off.width = innerWidth; off.height = H; const og = off.getContext('2d');
      let color = '#ff2d75', size = 14, down = false, drips = [], hiss = null, dirty = false;
      const bar = document.createElement('div'); bar.className = 'toy-bar';
      const colors = ['#ff2d75', '#ffd400', '#2bd1ff', '#7cff6b', '#ff7a1a', '#ffffff', '#111111'];
      let keep = false;
      bar.innerHTML = colors.map((k) => `<button class="sw" data-c="${k}" style="background:${k}"></button>`).join('') + `<button class="sz" data-s="8">S</button><button class="sz on" data-s="14">M</button><button class="sz" data-s="26">L</button><button class="keep" title="Save this wall for ${hostKey} so it is here next visit">Keep</button><button class="clear">Clear</button>`;
      bar.addEventListener('pointerdown', (e) => { e.stopPropagation(); const b = e.target.closest('button'); if (!b) return; if (b.dataset.c) { color = b.dataset.c; bar.querySelectorAll('.sw').forEach((x) => x.classList.toggle('on', x === b)); } if (b.dataset.s) { size = Number(b.dataset.s); bar.querySelectorAll('.sz').forEach((x) => x.classList.toggle('on', x === b)); } if (b.classList.contains('keep')) { keep = !keep; b.classList.toggle('on', keep); if (keep) save(); else { Peel.store && Peel.store.setGraffiti && Peel.store.setGraffiti(hostKey, null); Peel.wallChanged && Peel.wallChanged(false); } } if (b.classList.contains('clear')) { og.clearRect(0, 0, off.width, off.height); drips = []; dirty = true; render(); save(); } });
      fx.appendChild(bar);
      const render = () => { g.clearRect(0, 0, innerWidth, innerHeight); g.drawImage(off, 0, -scrollY); for (const d of drips) { g.fillStyle = d.c; g.beginPath(); g.ellipse(d.x, d.y - scrollY, d.w, d.len, 0, 0, 7); g.fill(); } };
      const spray = (x, y) => { const py = y + scrollY; og.fillStyle = color; for (let i = 0; i < size * 1.6; i++) { const a = R(0, 7), r = Math.pow(Math.random(), .6) * size; og.globalAlpha = R(.25, .8); og.beginPath(); og.arc(x + Math.cos(a) * r, py + Math.sin(a) * r, R(.6, 1.6), 0, 7); og.fill(); } og.globalAlpha = 1; if (Math.random() < .03) drips.push({ x: x + R(-size / 2, size / 2), y: py, w: R(1.5, 3), len: 2, max: R(12, 60), c: color }); dirty = true; };
      let last = null;
      const pd = (e) => { if (e.button) return; e.stopPropagation(); down = true; last = null; spray(e.clientX, e.clientY); if (Peel.sound && !hiss) hiss = Peel.sound.loop('hiss'); };
      const pm = (e) => { if (!down) return; if (last) { const n = Math.ceil(Math.hypot(e.clientX - last[0], e.clientY - last[1]) / 4); for (let i = 1; i <= n; i++) spray(last[0] + (e.clientX - last[0]) * i / n, last[1] + (e.clientY - last[1]) * i / n); } else spray(e.clientX, e.clientY); last = [e.clientX, e.clientY]; };
      const pu = () => { if (!down) return; down = false; last = null; if (hiss) { hiss(); hiss = null; } save(); };
      c.addEventListener('pointerdown', pd); c.addEventListener('pointermove', pm); c.addEventListener('pointerup', pu); c.addEventListener('pointercancel', pu);
      let raf = 0; const tick = () => { for (const d of drips) if (d.len < d.max) { d.len += .35; d.y += .3; og.fillStyle = d.c; og.globalAlpha = .9; og.beginPath(); og.arc(d.x, d.y + d.len / 2, d.w, 0, 7); og.fill(); og.globalAlpha = 1; dirty = true; } if (dirty || down) { render(); dirty = false; } raf = requestAnimationFrame(tick); }; raf = requestAnimationFrame(tick);
      const onScroll = () => { dirty = true; }; addEventListener('scroll', onScroll, { passive: true });
      let saveT = 0; const save = () => { if (!keep) return; clearTimeout(saveT); saveT = setTimeout(() => { try { const url = off.toDataURL('image/png'); Peel.store && Peel.store.setGraffiti && Peel.store.setGraffiti(hostKey, url.length > 50000 * 40 ? null : url); Peel.wallChanged && Peel.wallChanged(); } catch {} }, 1200); };
      if (Peel.store && Peel.store.graffiti) Peel.store.graffiti(hostKey).then((url) => { if (!url) return; keep = true; bar.querySelector('.keep').classList.add('on'); const im = new Image(); im.onload = () => { og.drawImage(im, 0, 0); dirty = true; }; im.src = url; });
      ctx.onRewind(async () => { og.clearRect(0, 0, off.width, off.height); drips = []; dirty = true; render(); clearTimeout(saveT); if (Peel.store && Peel.store.setGraffiti) await Peel.store.setGraffiti(hostKey, null); Peel.wallChanged && Peel.wallChanged(false); });
      return () => { cancelAnimationFrame(raf); if (hiss) hiss(); destroy(); bar.remove(); removeEventListener('scroll', onScroll); };
    } });
})();
