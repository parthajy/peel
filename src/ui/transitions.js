/* Peel – screenshot transitions besides the curl. Each takes the snapshot data URL and a canvas, resolves when done.
   The new look is already live underneath; these only animate the old one away. */
(function () {
  const Peel = (window.Peel = window.Peel || {});
  const load = (url) => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = url; });
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  function prep(canvas) {
    const W = innerWidth, H = innerHeight, dpr = devicePixelRatio;
    canvas.width = W * dpr; canvas.height = H * dpr; canvas.style.width = W + 'px'; canvas.style.height = H + 'px'; canvas.style.display = 'block';
    const g = canvas.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { g, W, H };
  }
  const anim = (ms, frame) => new Promise((res) => { const t0 = performance.now(); const step = (now) => { const k = Math.min(1, (now - t0) / ms); frame(k); if (k < 1) requestAnimationFrame(step); else res(); }; requestAnimationFrame(step); });

  async function shatter(url, canvas) {
    const im = await load(url); const { g, W, H } = prep(canvas);
    const cols = 10, rows = 7, cw = W / cols, ch = H / rows, sx = im.width / W, sy = im.height / H;
    const shards = []; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) shards.push({ x: c * cw, y: r * ch, vx: (Math.random() - .5) * 6, vy: -Math.random() * 6 - 2, rot: 0, vr: (Math.random() - .5) * .2, delay: (c + r) * 25 + Math.random() * 120 });
    g.drawImage(im, 0, 0, W, H);
    await anim(1250, (k) => {
      const t = k * 1250; g.clearRect(0, 0, W, H);
      for (const s of shards) {
        const dt = Math.max(0, (t - s.delay) / 16);
        const x = s.x + s.vx * dt, y = s.y + s.vy * dt + .35 * dt * dt, rot = s.vr * dt;
        if (y > H + ch) continue;
        g.save(); g.translate(x + cw / 2, y + ch / 2); g.rotate(rot); g.globalAlpha = Math.max(0, 1 - dt / 90);
        g.drawImage(im, s.x * sx, s.y * sy, cw * sx, ch * sy, -cw / 2, -ch / 2, cw + 1, ch + 1); g.restore();
      }
    });
    canvas.style.display = 'none';
  }
  async function burn(url, canvas) {
    const im = await load(url); const { g, W, H } = prep(canvas);
    const D = Math.hypot(W, H); const pts = 90; const jit = Array.from({ length: pts }, () => .85 + Math.random() * .3);
    await anim(1300, (k) => {
      const r = ease(k) * D * 1.15; g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.clearRect(0, 0, W, H); g.drawImage(im, 0, 0, W, H);
      g.globalCompositeOperation = 'destination-out'; g.beginPath();
      for (let i = 0; i <= pts; i++) { const a = (i / pts) * Math.PI * 2, rr = r * jit[i % pts] * (1 + .04 * Math.sin(a * 9 + k * 20)); const x = W + Math.cos(a) * rr, y = H + Math.sin(a) * rr; i ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.closePath(); g.fill();
      // glowing edge
      g.globalCompositeOperation = 'source-atop'; g.lineWidth = 26; g.strokeStyle = 'rgba(255,90,0,.9)'; g.shadowColor = '#ff9a1a'; g.shadowBlur = 30; g.stroke();
      g.lineWidth = 8; g.strokeStyle = 'rgba(40,10,0,.95)'; g.shadowBlur = 0; g.stroke();
      g.globalCompositeOperation = 'source-over';
    });
    canvas.style.display = 'none';
  }
  async function pixelate(url, canvas) {
    const im = await load(url); const { g, W, H } = prep(canvas);
    const off = document.createElement('canvas'); const og = off.getContext('2d');
    g.imageSmoothingEnabled = false;
    await anim(900, (k) => {
      const f = Math.max(1, Math.floor(1 + ease(k) * 60)); off.width = Math.max(1, Math.floor(W / f)); off.height = Math.max(1, Math.floor(H / f));
      og.imageSmoothingEnabled = true; og.drawImage(im, 0, 0, off.width, off.height);
      g.clearRect(0, 0, W, H); g.globalAlpha = k < .7 ? 1 : 1 - (k - .7) / .3; g.drawImage(off, 0, 0, off.width, off.height, 0, 0, W, H);
    });
    canvas.style.display = 'none';
  }
  async function tvoff(url, canvas) {
    const im = await load(url); const { g, W, H } = prep(canvas);
    await anim(700, (k) => {
      g.clearRect(0, 0, W, H); g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
      const sh = k < .6 ? H * (1 - ease(k / .6)) : 3, sw = k < .6 ? W : W * (1 - ease((k - .6) / .4));
      g.drawImage(im, (W - sw) / 2, (H - sh) / 2, sw, Math.max(1, sh));
      if (k > .5) { g.fillStyle = `rgba(255,255,255,${(k - .5) * 1.6})`; g.fillRect((W - sw) / 2, H / 2 - 1.5, sw, 3); }
    });
    canvas.style.display = 'none';
  }
  Peel.transitions = { shatter, burn, pixelate, tvoff, list: ['curl', 'shatter', 'burn', 'pixelate', 'tvoff'] };
})();
