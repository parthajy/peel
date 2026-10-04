/* 2007 – Web 2.0: gloss, reflections, rounded badges, everything is in beta. */
Peel.registerEdition({ id: 'y2007', name: '2007', emoji: '🫧', tagline: 'Web 2.0, still in beta', pack: 'eras', css: 'src/editions/y2007.css', fx: [{ type: 'burst', kind: 'confetti' }],
  apply(doc, ctx) { const b = document.createElement('div'); b.className = 'fx-beta'; b.textContent = 'BETA'; ctx.fx.appendChild(b); ctx.onDestroy(() => b.remove()); } });
