/* Comic – bold outlines, halftone, headlines in speech bubbles, POW on hover. */
Peel.registerEdition({ id: 'comic', name: 'Comic', emoji: '💥', tagline: 'POW. BAM. Scroll.', pack: 'materials', css: 'src/editions/comic.css', fx: ['halftone:.22', { type: 'cursor', kind: 'ripple', hue: 50 }],
  apply(doc, ctx) {
    const words = ['POW!', 'BAM!', 'ZAP!', 'WHAM!', 'KRAK!', 'BOOM!'];
    const on = (e) => { const t = e.target.closest && e.target.closest('a, button, [role="button"]'); if (!t || Math.random() > .35) return; const b = document.createElement('div'); b.className = 'fx-pow'; b.textContent = words[Math.floor(Math.random() * words.length)]; b.style.left = e.clientX + 'px'; b.style.top = e.clientY + 'px'; b.style.setProperty('--r', (Math.random() * 30 - 15) + 'deg'); ctx.fx.appendChild(b); setTimeout(() => b.remove(), 800); };
    doc.addEventListener('pointerdown', on, { passive: true }); ctx.onDestroy(() => doc.removeEventListener('pointerdown', on));
  } });
