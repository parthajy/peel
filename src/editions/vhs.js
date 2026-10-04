/* VHS – tracking lines, colour fringing, a timestamp. Be kind, rewind. */
Peel.registerEdition({ id: 'vhs', name: 'VHS', emoji: '📼', tagline: 'Be kind, rewind', pack: 'eras', css: 'src/editions/vhs.css', fx: ['filters', 'tracking:.7', 'scanlines:.1', 'static:.06', 'vignette:.6'],
  apply(doc, ctx) {
    const t = document.createElement('div'); t.className = 'fx-vhs-osd';
    const d = new Date(); const pad = (n) => String(n).padStart(2, '0');
    const draw = () => { const n = new Date(); t.innerHTML = `<b>▶ PLAY</b><span>SP ${pad(n.getHours())}:${pad(n.getMinutes())}:${pad(n.getSeconds())}</span><span>${d.toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase()}</span>`; };
    draw(); Peel.sound && Peel.sound.play('clunk'); const iv = setInterval(draw, 1000); ctx.fx.appendChild(t); ctx.onDestroy(() => { clearInterval(iv); t.remove(); });
  } });
