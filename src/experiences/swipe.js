/* Swipe – products as a card deck. Left: pass. Right: shortlist. Tap: open the real page.
   Nothing here talks to the shop; it only reads cards already on the page. */
(function () {
  const { h, compact } = Peel.dom;
  let state = null;

  Peel.registerExperience({
    id: 'swipe', name: 'Swipe', emoji: '💘', tagline: 'Shop like it’s a dating app',
    accepts: ['products'], mode: 'replace', css: 'src/experiences/swipe.css',
    variants: [
      { id: 'sunset', name: 'Sunset' },
      { id: 'midnight', name: 'Midnight' },
      { id: 'candy', name: 'Candy' },
    ],
    options: [{ id: 'hideSponsored', name: 'Skip sponsored', default: true }],
    async render(root, data, ctx) {
      const seen = new Set(await Peel.store.seen());
      let shortlist = await Peel.store.shortlist();
      const liked = new Set(shortlist.map((p) => p.url));
      const all = data.items.filter((p) => !(ctx.options.hideSponsored && p.sponsored));
      const deck = all.filter((p) => !seen.has(p.url) && !liked.has(p.url));
      if (!deck.length) deck.push(...all);
      state = { deck, idx: 0, history: [], shortlist };

      const stack = h('div', { class: 'stack' });
      const counter = h('div', { class: 'counter' });
      const tray = h('aside', { class: 'tray' });
      const toast = h('div', { class: 'toast' });
      root.append(
        h('header', { class: 'top' },
          h('div', { class: 'brand' }, h('span', { class: 'dot' }), `Swiping ${data.source}`),
          h('h1', {}, data.query || 'Products'),
          counter),
        h('main', { class: 'arena' },
          stack,
          h('div', { class: 'controls' },
            h('button', { class: 'ctl nope', title: 'Pass (←)', onClick: () => act('nope') }, '✕'),
            h('button', { class: 'ctl undo', title: 'Undo (↩)', onClick: undo }, '↩'),
            h('button', { class: 'ctl like', title: 'Shortlist (→)', onClick: () => act('like') }, '♥')),
          h('p', { class: 'hint' }, 'Drag the card, or use ← → keys. Tap a card to open it on the real site.')),
        tray, toast);

      const renderStack = () => {
        stack.replaceChildren();
        const cards = state.deck.slice(state.idx, state.idx + 3).reverse();
        cards.forEach((p, i) => {
          const top = i === cards.length - 1;
          const card = productCard(p, top);
          card.style.setProperty('--depth', cards.length - 1 - i);
          if (top) attachDrag(card, p);
          stack.append(card);
        });
        counter.textContent = state.idx < state.deck.length ? `${state.idx + 1} / ${state.deck.length}` : 'Done';
        if (!cards.length) stack.append(h('div', { class: 'empty' }, h('div', { class: 'big' }, '🎉'), h('h2', {}, 'You swiped everything'), h('p', {}, `${state.shortlist.length} in your shortlist`),
          h('button', { class: 'btn', onClick: () => { state.deck = all.slice(); state.idx = 0; renderStack(); } }, 'Start over')));
      };

      const renderTray = () => {
        const list = state.shortlist;
        const ranks = rank(list);
        tray.replaceChildren(
          h('div', { class: 'tray-head' }, h('h2', {}, `Shortlist`, h('span', { class: 'n' }, String(list.length))),
            list.length ? h('button', { class: 'link', onClick: async () => { state.shortlist = []; await Peel.store.setShortlist([]); renderTray(); } }, 'Clear') : null),
          list.length ? h('ul', {}, list.slice().reverse().map((p) => h('li', {},
            h('a', { href: p.url, target: '_blank' }, h('img', { src: p.image, alt: '' }),
              h('div', { class: 'meta' }, h('div', { class: 't' }, p.title), h('div', { class: 'p' }, p.priceText || '', p.rating ? ` · ⭐ ${p.rating}` : ''),
                h('div', { class: 'tags' }, (ranks.get(p.url) || []).map((t) => h('span', { class: 'tag ' + t.id }, t.name)))))))
          ) : h('p', { class: 'tray-empty' }, 'Swipe right to save things here. Best value, cheapest and top rated get badges.'));
      };

      const flash = (msg, cls) => { toast.textContent = msg; toast.className = 'toast show ' + (cls || ''); setTimeout(() => (toast.className = 'toast'), 700); };

      async function act(kind, fromDrag) {
        const p = state.deck[state.idx];
        if (!p) return;
        if (!fromDrag) { const top = stack.lastElementChild; if (top) { top.classList.add(kind === 'like' ? 'fly-right' : 'fly-left'); await wait(260); } }
        state.history.push({ p, kind });
        if (kind === 'like') { state.shortlist = [...state.shortlist.filter((x) => x.url !== p.url), p]; await Peel.store.setShortlist(state.shortlist); flash('Saved ♥', 'like'); }
        else flash('Nope', 'nope');
        seen.add(p.url); Peel.store.setSeen([...seen]);
        state.idx++;
        renderStack(); renderTray();
      }
      async function undo() {
        const last = state.history.pop();
        if (!last) return;
        state.idx = Math.max(0, state.idx - 1);
        if (last.kind === 'like') { state.shortlist = state.shortlist.filter((x) => x.url !== last.p.url); await Peel.store.setShortlist(state.shortlist); }
        renderStack(); renderTray();
      }
      function attachDrag(card, p) {
        let sx = 0, sy = 0, dx = 0, dy = 0, dragging = false, moved = false;
        card.addEventListener('pointerdown', (e) => { if (e.button) return; dragging = true; moved = false; sx = e.clientX; sy = e.clientY; card.setPointerCapture(e.pointerId); card.classList.add('grab'); });
        card.addEventListener('pointermove', (e) => {
          if (!dragging) return; dx = e.clientX - sx; dy = e.clientY - sy;
          if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
          card.style.transform = `translate(${dx}px, ${dy * 0.4}px) rotate(${dx / 18}deg)`;
          card.style.setProperty('--dx-like', Math.max(0, Math.min(1, dx / 120)));
          card.style.setProperty('--dx-nope', Math.max(0, Math.min(1, -dx / 120)));
        });
        const end = (e) => {
          if (!dragging) return; dragging = false; card.classList.remove('grab');
          if (!moved) { card.style.transform = ''; return; }
          if (dx > 110) { card.classList.add('fly-right'); setTimeout(() => act('like', true), 220); }
          else if (dx < -110) { card.classList.add('fly-left'); setTimeout(() => act('nope', true), 220); }
          else { card.style.transform = ''; card.style.setProperty('--dx-like', 0); card.style.setProperty('--dx-nope', 0); }
          dx = dy = 0;
        };
        card.addEventListener('pointerup', end); card.addEventListener('pointercancel', end);
        card.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); } });
      }
      const onKey = (e) => {
        if (e.target && /input|textarea/i.test(e.target.tagName)) return;
        if (e.key === 'ArrowRight') act('like'); else if (e.key === 'ArrowLeft') act('nope'); else if (e.key === 'Backspace' || e.key === 'z') undo();
        else if (e.key === 'ArrowUp' || e.key === 'Enter') { const p = state.deck[state.idx]; if (p) window.open(p.url, '_blank'); }
      };
      window.addEventListener('keydown', onKey);
      ctx.onDestroy(() => window.removeEventListener('keydown', onKey));
      renderStack(); renderTray();
    },
  });

  function productCard(p, top) {
    return h('a', { class: 'card' + (top ? ' top' : ''), href: p.url, target: '_blank', draggable: 'false' },
      h('div', { class: 'stamp like' }, 'SAVE'), h('div', { class: 'stamp nope' }, 'NOPE'),
      h('div', { class: 'img' }, p.image ? h('img', { src: p.image, alt: '', draggable: 'false' }) : h('div', { class: 'noimg' }, '🛍️'),
        p.badge && h('span', { class: 'badge' }, p.badge),
        p.discount ? h('span', { class: 'off' }, `${p.discount}% off`) : null),
      h('div', { class: 'body' },
        h('h3', {}, p.title),
        h('div', { class: 'row' },
          h('span', { class: 'price' }, p.priceText || 'Price on site'),
          p.mrp && p.mrp > (p.price || 0) ? h('s', { class: 'mrp' }, `${p.currency || ''}${p.mrp.toLocaleString()}`) : null),
        h('div', { class: 'row small' },
          p.rating ? h('span', { class: 'rating' }, `★ ${p.rating}`) : h('span', { class: 'rating none' }, 'No rating yet'),
          p.reviews ? h('span', {}, `${compact(p.reviews)} reviews`) : null,
          p.prime ? h('span', { class: 'chip' }, 'Prime') : null,
          p.delivery ? h('span', { class: 'chip' }, p.delivery) : null)));
  }
  function rank(list) {
    const m = new Map();
    const add = (p, t) => { if (!p) return; if (!m.has(p.url)) m.set(p.url, []); m.get(p.url).push(t); };
    const priced = list.filter((p) => p.price);
    add(priced.slice().sort((a, b) => a.price - b.price)[0], { id: 'cheap', name: 'Cheapest' });
    add(list.filter((p) => p.rating).sort((a, b) => b.rating - a.rating || (b.reviews || 0) - (a.reviews || 0))[0], { id: 'rated', name: 'Top rated' });
    const value = priced.filter((p) => p.rating).map((p) => ({ p, v: (p.rating * Math.log10((p.reviews || 1) + 9)) / Math.log10(p.price + 9) }));
    add(value.sort((a, b) => b.v - a.v)[0]?.p, { id: 'value', name: 'Best value' });
    return m;
  }
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
})();
