/* Peel – the page curl. A lifted sticker corner at bottom-right; drag it to peel the page off.
   Pure geometry + a few fixed layers. No canvas, no libraries. */
(function () {
  const Peel = (window.Peel = window.Peel || {});
  const clampN = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  /** Geometry for pointer P with the page corner at (W,H). Pure; unit-testable. */
  function geom(W, H, P) {
    const C = { x: W, y: H };
    let dx = C.x - P.x, dy = C.y - P.y, len = Math.hypot(dx, dy);
    if (len < 1) { dx = dy = 1; len = Math.SQRT2; }
    const n = { x: dx / len, y: dy / len };                     // normal, pointing at the corner
    const M = { x: (C.x + P.x) / 2, y: (C.y + P.y) / 2 };       // a point on the fold
    const side = (X) => (X.x - M.x) * n.x + (X.y - M.y) * n.y;  // >0: already peeled (revealed)
    const rect = [{ x: 0, y: 0 }, { x: W, y: 0 }, { x: W, y: H }, { x: 0, y: H }];
    const clip = (poly, f) => {
      const out = [];
      for (let i = 0; i < poly.length; i++) {
        const A = poly[i], B = poly[(i + 1) % poly.length], fa = f(A), fb = f(B);
        if (fa >= 0) out.push(A);
        if ((fa >= 0) !== (fb >= 0)) { const k = fa / (fa - fb); out.push({ x: A.x + (B.x - A.x) * k, y: A.y + (B.y - A.y) * k }); }
      }
      return out;
    };
    const revealed = clip(rect, side);
    const remainder = clip(rect, (X) => -side(X));
    const flap = revealed.map((X) => { const s = side(X); return { x: X.x - 2 * s * n.x, y: X.y - 2 * s * n.y }; });
    const D = Math.hypot(W, H);
    const t = clampN((dx * W + dy * H) / D / (2 * D), 0, 1);
    return { C, P, n, M, D, len, t, revealed, remainder, flap, side, full: remainder.length === 0, none: revealed.length === 0 };
  }

  const poly = (pts) => (pts.length ? `polygon(${pts.map((p) => `${p.x.toFixed(1)}px ${p.y.toFixed(1)}px`).join(',')})` : 'polygon(0 0, 0 0, 0 0)');

  class Curl {
    /** @param root ShadowRoot to draw layers in. @param h handlers: onStart, onCommit, onCancel, onTap, onMove */
    constructor(root, h) {
      this.h = h || {}; this.layer = null; this.mode = 'reveal'; this.lift = 56; this.P = null; this.anim = null; this.dragging = false;
      const mk = (cls) => { const el = document.createElement('div'); el.className = 'curl-' + cls; root.appendChild(el); return el; };
      this.snap = document.createElement('img'); this.snap.className = 'curl-snap'; this.snap.draggable = false; root.appendChild(this.snap);
      this.base = mk('base'); this.shade = mk('shade'); this.flap = mk('flap'); this.tip = mk('tip'); this.hint = mk('hint');
      this.say_ = mk('say'); this.say_.addEventListener('pointerdown', (e) => { e.stopPropagation(); this.say(''); });
      this.tip.textContent = 'PEEL';
      this.hint.textContent = 'Drag me ↖';
      this.W = innerWidth; this.H = innerHeight;
      addEventListener('resize', () => { this.W = innerWidth; this.H = innerHeight; if (!this.anim && !this.dragging && !this.layer) this.rest(); else this.draw(); });
      this.bindDrag();
      this.rest();
    }
    /** Which element is being clipped. mode 'reveal' = el is the new page appearing; 'remain' = el is the old page leaving. */
    setLayer(el, mode) { if (this.layer && this.layer !== el) this.layer.style.clipPath = ''; this.layer = el; this.mode = mode || 'reveal'; this.base.style.visibility = el ? 'hidden' : ''; this.draw(); }
    /** Show a screenshot of the current look as the top layer (it is what gets peeled off). */
    showSnap(dataUrl) { this.snap.src = dataUrl; this.snap.style.display = 'block'; this.setLayer(this.snap, 'remain'); }
    hideSnap() { if (this.layer === this.snap) this.setLayer(null); this.snap.style.display = 'none'; this.snap.removeAttribute('src'); }
    setBase(style) { Object.assign(this.base.style, { background: '', opacity: '' }, style || {}); }
    setLift(px) { this.lift = px; if (!this.anim && !this.dragging) this.rest(); }
    setHint(text) { this.hint.textContent = text; this.hint.classList.toggle('on', !!text); }
    restP() { return { x: this.W - this.lift, y: this.H - this.lift }; }
    rest() { this.P = this.restP(); this.draw(); }
    setP(P) { this.P = { x: clampN(P.x, -this.W * 2, this.W + 20), y: clampN(P.y, -this.H * 2, this.H + 20) }; this.draw(); }
    geom() { return geom(this.W, this.H, this.P || this.restP()); }
    draw() {
      const g = this.geom(); this.g = g;
      const { n, M, D } = g;
      if (this.layer) this.layer.style.clipPath = poly(this.mode === 'reveal' ? g.revealed : g.remainder);
      this.base.style.clipPath = poly(g.revealed);
      // Strip helper: a long element whose local x-axis runs along unit vector v from the fold point M.
      const strip = (el, v, L) => {
        const th = Math.atan2(v.y, v.x) * 180 / Math.PI;
        Object.assign(el.style, { left: M.x + 'px', top: M.y + 'px', width: L + 'px', height: 2 * D + 'px', transform: `rotate(${th}deg) translate(0,${-D}px)` });
        return { v, w: { x: -v.y, y: v.x } };
      };
      // Flap = back of the paper, folded over onto the un-peeled side (direction -n).
      const f = strip(this.flap, { x: -n.x, y: -n.y }, D);
      this.flap.style.clipPath = poly(g.flap.map((X) => ({ x: (X.x - M.x) * f.v.x + (X.y - M.y) * f.v.y, y: (X.x - M.x) * f.w.x + (X.y - M.y) * f.w.y + D })));
      // Shade on the revealed side, right under the lifted paper.
      strip(this.shade, n, Math.min(110, 30 + g.len * 0.25));
      // Tip label sits on the flap near its point (which is at P), rotated along the fold.
      const th = Math.atan2(n.y, n.x) * 180 / Math.PI - 90;
      const tipAt = { x: g.P.x + n.x * Math.min(34, g.len * 0.28), y: g.P.y + n.y * Math.min(34, g.len * 0.28) };
      Object.assign(this.tip.style, { left: tipAt.x + 'px', top: tipAt.y + 'px', transform: `translate(-50%,-50%) rotate(${th}deg)`, opacity: g.len < 40 ? 0 : 1 });
      Object.assign(this.hint.style, { left: g.P.x - 10 + 'px', top: g.P.y - 10 + 'px' });
      Object.assign(this.say_.style, { right: Math.max(12, this.W - g.P.x + 8) + 'px', bottom: Math.max(12, this.H - g.P.y + 8) + 'px' });
      this.h.onMove && this.h.onMove(g);
    }
    /** Animate to fully open (page gone) or back to rest. Resolves when done. */
    fly(open, ms = 800) {
      if (this.anim) cancelAnimationFrame(this.anim.raf);
      const from = this.P || this.restP();
      const r = this.restP();
      const to = open ? { x: this.W - this.W * 2.3, y: this.H - this.H * 2.3 } : r;
      const t0 = performance.now();
      return new Promise((res) => {
        const step = (now) => {
          const k = ease(clampN((now - t0) / ms, 0, 1));
          this.P = { x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k };
          this.draw();
          if (k < 1) this.anim = { raf: requestAnimationFrame(step) }; else { this.anim = null; res(); }
        };
        this.anim = { raf: requestAnimationFrame(step) };
      });
    }
    bindDrag() {
      const el = this.flap; let start = null, grab = null, moved = false, started = false, last = [];
      el.addEventListener('pointerdown', (e) => {
        if (e.button) return; e.preventDefault(); e.stopPropagation();
        if (this.anim) { cancelAnimationFrame(this.anim.raf); this.anim = null; }
        start = { x: e.clientX, y: e.clientY }; grab = { x: this.P.x - e.clientX, y: this.P.y - e.clientY };
        moved = false; started = false; last = []; el.setPointerCapture(e.pointerId); this.dragging = true; this.setHint('');
      });
      el.addEventListener('pointermove', async (e) => {
        if (!start) return;
        if (!moved && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 5) { moved = true; }
        if (!moved) return;
        if (!started) { started = true; this.h.onStart && (await this.h.onStart()); }
        last.push({ x: e.clientX, y: e.clientY, t: performance.now() }); if (last.length > 6) last.shift();
        this.setP({ x: e.clientX + grab.x, y: e.clientY + grab.y });
      });
      const end = async (e) => {
        if (!start) return; const wasMoved = moved; start = null; this.dragging = false;
        if (!wasMoved) { this.h.onTap && this.h.onTap(e); return; }
        const g = this.geom();
        const a = last[0], b = last[last.length - 1];
        const vel = a && b && b.t > a.t ? Math.hypot(b.x - a.x, b.y - a.y) / (b.t - a.t) : 0;   // px/ms
        const towards = a && b ? ((a.x - b.x) + (a.y - b.y)) > 0 : false;                       // moving up-left?
        const commit = g.t > 0.26 || (g.t > 0.08 && vel > 0.9 && towards);
        if (commit) { await this.fly(true, 650 - Math.min(300, vel * 200)); this.h.onCommit && (await this.h.onCommit()); this.rest(); }
        else { await this.fly(false, 420); this.h.onCancel && (await this.h.onCancel()); this.rest(); }
      };
      el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
      el.addEventListener('pointerenter', () => { if (!this.dragging && !this.anim) { this.setLift(Math.max(this.lift, 72)); this.hint.classList.add('on'); } });
      el.addEventListener('pointerleave', () => { if (!this.dragging && !this.anim) { this.setLift(this.baseLift || 56); this.hint.classList.remove('on'); } });
    }
    /** A speech bubble from the corner. Empty text hides it. */
    say(text, ms = 7000) { clearTimeout(this.sayT); this.say_.textContent = text || ''; this.say_.classList.toggle('on', !!text); if (text) this.sayT = setTimeout(() => this.say(''), ms); }
    /** A restless wiggle: lift twice, settle. */
    wiggle() { if (this.anim || this.dragging) return; const base = this.baseLift || 56; let i = 0; const step = () => { this.setLift(i % 2 ? base : base + 26); if (++i < 4) setTimeout(step, 160); else this.setLift(base); }; step(); }
    size(big) { this.baseLift = big ? 56 : 24; this.setLift(this.baseLift); this.tip.style.display = big ? '' : 'none'; }
  }
  Peel.Curl = Curl; Peel.curlGeom = geom;
})();
