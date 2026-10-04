/* Gravity – click anything and it falls off the page, bouncing on the way down. Flip away and everything climbs back. */
Peel.registerEdition({ id: 'gravity', name: 'Gravity', emoji: '🪂', tagline: 'Click it. Watch it drop.', pack: 'play', css: 'src/editions/gravity.css', fx: ['vignette:.4', { type: 'burst', kind: 'puff' }],
  apply(doc, ctx) {
    const SEL = 'img, video, h1, h2, h3, h4, p, li, blockquote, figure, button, [role="button"], a, label, td, th, span';
    const falling = new Map(); let raf = 0; const H = () => innerHeight;
    const down = (e) => {
      if (e.button || e.target.closest('#peel-ui, #peel-fx, #peel-root, input, textarea, select')) return;
      let el = e.target.closest(SEL); if (!el || falling.has(el)) return;
      if (el.tagName === 'SPAN' && el.textContent.trim().length < 2) return;
      e.preventDefault(); e.stopPropagation();
      const r = el.getBoundingClientRect();
      falling.set(el, { y: 0, vy: -2 - Math.random() * 3, vx: (e.clientX - (r.left + r.width / 2)) / r.width * -4, x: 0, rot: 0, vr: (Math.random() - .5) * .25, floor: H() - r.bottom - 4, bounces: 0, t: 0, prevStyle: el.getAttribute('style') });
      el.style.setProperty('position', getComputedStyle(el).position === 'static' ? 'relative' : getComputedStyle(el).position, 'important');
      el.style.setProperty('z-index', '2147483000', 'important'); el.style.setProperty('pointer-events', 'none', 'important'); el.style.setProperty('transform-origin', 'center', 'important');
      el.addEventListener('click', (ev) => { ev.preventDefault(); ev.stopPropagation(); }, { once: true, capture: true });
      Peel.sound && Peel.sound.play('pop');
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const tick = () => {
      let alive = false;
      for (const [el, f] of falling) {
        f.t++; if (f.t > 900) continue; alive = true;
        f.vy += .55; f.y += f.vy; f.x += f.vx; f.rot += f.vr; f.vx *= .995;
        if (f.y > f.floor) { f.y = f.floor; f.vy = -f.vy * .45; f.vr *= .6; f.vx *= .8; f.bounces++; if (f.bounces > 6 && Math.abs(f.vy) < 1.2) { f.vy = 0; f.t = 1000; } else if (Math.abs(f.vy) > 2) Peel.sound && Peel.sound.play('clunk'); }
        el.style.setProperty('transform', `translate(${f.x.toFixed(1)}px, ${f.y.toFixed(1)}px) rotate(${f.rot.toFixed(3)}rad)`, 'important');
      }
      raf = alive ? requestAnimationFrame(tick) : 0;
    };
    doc.addEventListener('pointerdown', down, true);
    ctx.onDestroy(() => { cancelAnimationFrame(raf); doc.removeEventListener('pointerdown', down, true); for (const [el, f] of falling) { if (f.prevStyle == null) el.removeAttribute('style'); else el.setAttribute('style', f.prevStyle); } falling.clear(); });
  } });
