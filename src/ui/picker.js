/* Peel – the picker (tap the corner). One fluid scroll: Look, packs, Flip, Mood, Toys, page modes, Remix, settings behind a gear. */
(function () {
  const Peel = (window.Peel = window.Peel || {});
  const { h } = Peel.dom;
  const CAP = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const FLIP = { curl: 'Curl', shatter: 'Shatter', burn: 'Burn', pixelate: 'Pixelate', tvoff: 'TV off', random: 'Random' };
  const MOOD = { off: 'Off', shuffle: 'Shuffle', daily: 'Daily', seasonal: 'Seasonal', clock: 'Clock' };
  Peel.picker = Object.assign(Peel.picker || {}, {
    mount(root, getStatus, actions) {
      const panel = h('div', { class: 'panel' }); root.appendChild(panel);
      let open = false, draft = null, notice = '', showRemix = false, showSettings = false, scrollMemo = 0;
      const blank = () => ({ name: '', base: 'light', baseFx: true, overlays: {}, particles: '', cursor: '', enter: '', ambient: {}, burst: '', companion: '', loop: '' });
      const toRecipe = (d) => [...Object.entries(d.overlays).filter(([, v]) => v).map(([k]) => k), ...(d.particles ? [{ type: 'particles', preset: d.particles }] : []), ...(d.cursor ? [{ type: 'cursor', kind: d.cursor }] : []), ...(d.enter ? [{ type: 'enter', kind: d.enter }] : []), ...(Object.values(d.ambient).some(Boolean) ? [{ type: 'ambient', kinds: Object.keys(d.ambient).filter((k) => d.ambient[k]) }] : []), ...(d.burst ? [{ type: 'burst', kind: d.burst }] : []), ...(d.companion ? [{ type: 'companion', kind: d.companion }] : []), ...(d.loop ? [{ type: 'sound', loop: d.loop }] : [])];
      const fromDef = (id, c) => { const d = blank(); d.id = id; d.name = c.name; d.base = c.base; d.baseFx = c.baseFx !== false; for (const it of c.fx || []) { if (typeof it === 'string') d.overlays[it.split(':')[0]] = true; else if (it.type === 'particles') d.particles = it.preset; else if (it.type === 'cursor') d.cursor = it.kind; else if (it.type === 'enter') d.enter = it.kind; else if (it.type === 'ambient') for (const k of it.kinds || [it.kind]) d.ambient[k] = true; else if (it.type === 'burst') d.burst = it.kind; else if (it.type === 'companion') d.companion = it.kind; else if (it.type === 'sound') d.loop = it.loop; } return d; };
      const def = (d) => ({ id: d.id, name: d.name, base: d.base, baseFx: d.baseFx, fx: toRecipe(d), emoji: '🧪' });
      const tile = (id, emoji, name, on, click, extra) => h('div', { class: 'tile-wrap' }, h('button', { class: 'tile' + (on ? ' on' : ''), title: name, onClick: click }, Peel.swatch(id, emoji), h('b', {}, name)), extra);
      const sec = (t, hint) => h('div', { class: 'sec' }, t, hint && h('small', {}, hint));
      const chipRow = (items, cur, onPick, labels) => h('div', { class: 'chips' }, items.map((k) => h('button', { class: 'chip' + (cur === k ? ' on' : ''), onClick: () => onPick(k) }, (labels && labels[k]) || CAP(k))));

      const draw = () => {
        const st = getStatus(); const cur = st.edition || null;
        scrollMemo = panel.scrollTop;
        const pick = (id) => () => actions.edition(id);
        const packs = st.packs.filter(([id]) => st.editions.some((e) => e.pack === id));
        panel.replaceChildren(h('div', { class: 'glow' }), h('div', { class: 'pbody' },
          h('div', { class: 'head' }, h('img', { class: 'logo', src: st.icon, alt: '' }), h('strong', {}, 'peel'), h('span', { class: 'site' }, st.host),
            h('button', { class: 'icon', title: 'Save a screenshot of this look', onClick: () => actions.shot() }, '📷'),
            h('button', { class: 'icon' + (showSettings ? ' on' : ''), title: 'Settings', onClick: () => { showSettings = !showSettings; draw(); } }, '⚙'),
            h('button', { class: 'icon', onClick: () => api.close() }, '×')),
          showSettings && h('div', { class: 'settings' },
            h('label', { class: 'row' }, h('input', { type: 'checkbox', checked: st.patina ? true : null, onChange: (ev) => actions.patina(ev.target.checked) }), 'Patina: sites age as you visit'),
            h('label', { class: 'row' }, h('input', { type: 'checkbox', checked: st.excluded ? true : null, onChange: (ev) => actions.exclude(ev.target.checked) }), `Turn Peel off on ${st.host}`),
            h('span', { class: 'dim' }, 'Sounds, motion and the talking corner live in the toolbar popup.')),
          packs.map(([id, name], i) => {
            const list = st.editions.filter((e) => e.pack === id);
            const tiles = list.map((e) => tile(e.id, e.emoji, e.name, cur === e.id, pick(e.id), e.custom && h('div', { class: 'mini' },
              h('button', { title: 'Edit', onClick: () => { draft = fromDef(e.id, st.custom[e.id]); showRemix = true; draw(); } }, '✎'),
              h('button', { title: 'Copy share code', onClick: async () => { try { await navigator.clipboard.writeText(actions.remix.code(e.id)); notice = 'Code copied'; } catch { notice = actions.remix.code(e.id); } showRemix = true; draw(); } }, '⧉'),
              h('button', { title: 'Delete', onClick: () => { if (confirm(`Delete “${e.name}”?`)) actions.remix.remove(e.id); } }, '🗑'))));
            if (i === 0) tiles.unshift(tile('original', '🌐', 'Original', !cur, pick(null)));
            return [sec(i === 0 ? 'Look' : name), h('div', { class: 'grid' }, tiles)];
          }),
          sec('Flip', 'how the old look leaves'), chipRow(st.transitions, st.transition, (t) => actions.transition(t), FLIP),
          sec('Mood', 'let the clock or chance pick'), chipRow(st.moods, st.mood, (m) => actions.mood(m), MOOD),
          sec('Toys', 'Esc drops · R rewinds'),
          h('div', { class: 'grid' }, st.toys.map((t) => tile(t.id, t.emoji, t.name, st.toy === t.id, () => actions.toy(t.id)))),
          h('div', { class: 'chips', style: { marginTop: '8px' } },
            st.toy && h('button', { class: 'chip', onClick: () => actions.dropToy() }, 'Drop tool'),
            h('button', { class: 'chip' + (st.canRewind || st.hasWall ? ' warn' : ''), onClick: () => actions.rewind() }, '◀◀ Rewind'),
            st.hasWall && h('button', { class: 'chip', onClick: () => actions.clearWall() }, 'Clear saved wall')),
          st.toy && h('p', { class: 'dim' }, (st.toys.find((t) => t.id === st.toy) || {}).hint),
          st.modes.length ? [sec(st.mode ? 'This page is rebuilt as' : 'This page can also be'),
            h('div', { class: 'chips' }, st.modes.map((m) => h('button', { class: 'chip' + (st.mode && st.mode.id === m.id ? ' on' : ''), onClick: () => (st.mode && st.mode.id === m.id ? actions.unpeel() : actions.mode(m.id)) }, `${m.emoji} ${m.name}`)),
              st.mode && st.mode.variants && st.mode.variants.length > 1 && h('button', { class: 'chip', onClick: () => actions.flip() }, '↻ Look'),
              st.mode && h('button', { class: 'chip warn', onClick: () => actions.unpeel() }, 'Peel back'))] : null,
          sec('Remix', 'mix your own'),
          showRemix ? remixPane(st) : h('button', { class: 'chip', onClick: () => { showRemix = true; draw(); } }, '🧪 Open the mixer'),
          h('div', { class: 'foot dim' }, 'Drag the corner for the next edition · Shift+F next · Shift+P original')));
        panel.scrollTop = scrollMemo;
      };
      const remixPane = (st) => {
        if (!draft) draft = blank();
        const d = draft, o = st.fxOptions;
        const chips = (items, get, set) => h('div', { class: 'chips' }, items.map((k) => h('button', { class: 'chip sm' + (get(k) ? ' on' : ''), onClick: () => { set(k, !get(k)); draw(); } }, k)));
        const sel = (items, val, set, none = 'none') => h('select', { onChange: (ev) => { set(ev.target.value); } }, h('option', { value: '' }, none), items.map((k) => h('option', { value: k, selected: val === k ? true : null }, CAP(k))));
        return h('div', { class: 'remix' },
          h('div', { class: 'rrow' }, h('input', { class: 'name', placeholder: 'Name your remix', value: d.name, onInput: (ev) => { d.name = ev.target.value; } }),
            h('label', {}, 'Base ', sel(st.editions.filter((e) => !e.custom).map((e) => e.id), d.base, (v) => { d.base = v || 'light'; }, 'Light')),
            h('label', { class: 'row' }, h('input', { type: 'checkbox', checked: d.baseFx ? true : null, onChange: (ev) => { d.baseFx = ev.target.checked; } }), 'keep its effects')),
          h('div', { class: 'rlabel' }, 'Overlays'), chips(o.overlays, (k) => d.overlays[k], (k, v) => { d.overlays[k] = v; }),
          h('div', { class: 'rrow' },
            h('label', {}, 'Particles ', sel(o.particles, d.particles, (v) => { d.particles = v; })),
            h('label', {}, 'Cursor ', sel(o.cursors, d.cursor, (v) => { d.cursor = v; })),
            h('label', {}, 'Enter ', sel(o.enters, d.enter, (v) => { d.enter = v; }))),
          h('div', { class: 'rlabel' }, 'Ambient'), chips(o.ambients, (k) => d.ambient[k], (k, v) => { d.ambient[k] = v; }),
          h('div', { class: 'rrow' },
            h('label', {}, 'On click ', sel(o.bursts, d.burst, (v) => { d.burst = v; })),
            h('label', {}, 'Companion ', sel(o.companions, d.companion, (v) => { d.companion = v; })),
            h('label', {}, 'Sound ', sel(o.loops, d.loop, (v) => { d.loop = v; }))),
          h('div', { class: 'rrow' },
            h('button', { class: 'chip', onClick: () => actions.remix.preview(def(d)) }, '👁 Preview'),
            h('button', { class: 'chip on', onClick: async () => { const id = await actions.remix.save(def(d)); draft = fromDef(id, st.custom[id] || def(d)); notice = 'Saved to Mine'; draw(); } }, '💾 Save'),
            h('button', { class: 'chip', onClick: () => { draft = blank(); draw(); } }, 'New'),
            h('button', { class: 'chip', onClick: () => { showRemix = false; draw(); } }, 'Hide')),
          h('div', { class: 'rrow' }, h('input', { class: 'code', placeholder: 'Paste a peel1.… share code', onKeyDown: async (ev) => { if (ev.key === 'Enter') { const id = await actions.remix.import(ev.target.value); notice = id ? 'Imported' : 'That code did not parse'; draw(); } } }), h('span', { class: 'dim' }, '↵ to import')),
          notice && h('div', { class: 'notice' }, notice));
      };
      const api = {
        open() { open = true; notice = ''; draw(); panel.classList.add('open'); },
        close() { open = false; panel.classList.remove('open'); },
        toggle() { open ? api.close() : api.open(); },
        refresh() { if (open) draw(); },
        isOpen: () => open,
      };
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) api.close(); }, true);
      return api;
    },
  });
})();
