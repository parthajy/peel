/* 1996 – Times New Roman, blue links, grey bevels, a marquee and a visitor counter. Best viewed in Netscape. */
(function () {
  Peel.registerEdition({
    id: 'y1996', name: '1996', emoji: '💾', tagline: 'Best viewed in Netscape 3.0', pack: 'eras', css: 'src/editions/y1996.css', fx: [{ type: 'burst', kind: 'pixels' }, 'filters'],
    apply(doc, ctx) {
      const host = location.hostname.replace(/^www\./, '');
      const bar = document.createElement('div'); bar.className = 'fx-marquee';
      const txt = `★ Welcome to ${host}!!! ★ Best viewed in Netscape Navigator 3.0 at 800×600 ★ This page is UNDER CONSTRUCTION ★ Sign my guestbook ★ Click here to download Shockwave ★ Add me to your bookmarks (Ctrl+D) ★ `;
      bar.innerHTML = `<span>${txt.repeat(3)}</span>`;
      const counter = document.createElement('div'); counter.className = 'fx-counter';
      let n = 1337 + Math.floor(Math.random() * 400);
      const draw = () => { counter.innerHTML = `You are visitor <b>${String(n).padStart(7, '0').split('').map((d) => `<i>${d}</i>`).join('')}</b>`; };
      draw(); const t = setInterval(() => { n++; draw(); }, 4000 + Math.random() * 6000);
      const uc = document.createElement('div'); uc.className = 'fx-construction'; uc.textContent = 'UNDER CONSTRUCTION';
      ctx.fx.append(bar, counter, uc);
      const modem = () => { Peel.sound && Peel.sound.play('modem'); doc.removeEventListener('pointerdown', modem, true); }; doc.addEventListener('pointerdown', modem, true);
      ctx.onDestroy(() => { clearInterval(t); doc.removeEventListener('pointerdown', modem, true); });
    },
  });
})();
