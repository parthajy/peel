const $ = (s) => document.querySelector(s);
const send = (msg) => new Promise((res) => chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  if (!tab || !tab.id) return res(null);
  chrome.tabs.sendMessage(tab.id, msg, (r) => res(chrome.runtime.lastError ? null : r));
}));
const h = (tag, props = {}, ...kids) => { const el = document.createElement(tag); for (const [k, v] of Object.entries(props)) { if (k === 'class') el.className = v; else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v); else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v); else if (v != null && v !== false) el.setAttribute(k, v === true ? '' : v); } for (const kid of kids.flat(Infinity)) if (kid != null && kid !== false) el.append(kid); return el; };
const later = (fn) => setTimeout(fn, 900);
const hue = (s) => { let n = 0; for (const c of s) n = (n * 31 + c.charCodeAt(0)) % 360; return n; };
const CAP = (s) => s[0].toUpperCase() + s.slice(1);
const tile = (id, emoji, name, on, click) => h('button', { class: 'tile' + (on ? ' on' : ''), title: name, onClick: click }, Peel.swatch(id, emoji), h('b', {}, name));
const FLIP = { curl: 'Curl', shatter: 'Shatter', burn: 'Burn', pixelate: 'Pixelate', tvoff: 'TV off', random: 'Random' };
const MOOD = { off: 'Off', shuffle: 'Shuffle', daily: 'Daily', seasonal: 'Seasonal', clock: 'Clock' };
const chipRow = (items, cur, onPick, labels) => h('div', { class: 'chips' }, items.map((k) => h('button', { class: 'chip' + (cur === k ? ' on' : ''), onClick: () => onPick(k) }, (labels && labels[k]) || CAP(k))));

async function draw() {
  const st = await send({ type: 'peel:status' });
  const main = $('#main');
  if (!st) {
    const { edition } = await new Promise((r) => chrome.storage.sync.get('edition', r));
    main.replaceChildren(h('p', { class: 'muted' }, 'Peel can’t run on this page (browser pages, the Web Store). Reload normal tabs after installing.'), h('p', { class: 'muted' }, edition ? `Current edition everywhere: ${edition}` : 'No edition active.'));
    return;
  }
  $('#site').textContent = st.host + (st.excluded ? ' · off' : '');
  const cur = st.edition || 'original';
  const pick = (id) => async () => { await send({ type: 'peel:edition', id }); later(draw); };
  const packs = st.packs.filter(([id]) => st.editions.some((e) => e.pack === id));
  main.replaceChildren(h('div', { class: 'body' },
    packs.map(([id, name], i) => {
      const list = st.editions.filter((e) => e.pack === id);
      const tiles = list.map((e) => tile(e.id, e.emoji, e.name, cur === e.id, pick(e.id)));
      if (i === 0) tiles.unshift(tile('original', '🌐', 'Original', cur === 'original', pick(null)));
      return [h('div', { class: 'sec' }, i === 0 ? 'Look' : name), h('div', { class: 'grid' }, tiles)];
    }),
    h('div', { class: 'sec' }, 'Flip'), chipRow(st.transitions, st.transition, async (t) => { await send({ type: 'peel:transition', t }); later(draw); }, FLIP),
    h('div', { class: 'sec' }, 'Mood'), chipRow(st.moods, st.mood, async (m) => { await send({ type: 'peel:mood', m }); later(draw); }, MOOD),
    st.toys && st.toys.length ? [h('div', { class: 'sec' }, 'Toys'), h('div', { class: 'grid' }, st.toys.map((t) => tile(t.id, t.emoji, t.name, st.toy === t.id, async () => { await send({ type: 'peel:toy', id: t.id }); window.close(); }))), h('div', { class: 'chips', style: { marginTop: '8px' } }, h('button', { class: 'chip' + (st.canRewind ? ' warn' : ''), onClick: () => send({ type: 'peel:rewind' }) }, '◀◀ Rewind'))] : null,
    st.modes.length ? [h('div', { class: 'sec' }, st.mode ? 'Rebuilt as' : 'This page can also be'), h('div', { class: 'chips' }, st.modes.map((m) => h('button', { class: 'chip' + (st.mode && st.mode.id === m.id ? ' on' : ''), onClick: async () => { await send(st.mode && st.mode.id === m.id ? { type: 'peel:unpeel' } : { type: 'peel:mode', id: m.id }); later(draw); } }, `${m.emoji} ${m.name}`)))] : null,
    h('label', { class: 'excl' }, h('input', { type: 'checkbox', checked: st.excluded ? true : null, onChange: async (e) => { await send({ type: 'peel:exclude', on: e.target.checked }); later(draw); } }), `Not on ${st.host}`),
  ));
}
chrome.storage.sync.get('prefs', ({ prefs = { fab: true, motion: true } }) => { $('#fab').checked = prefs.fab !== false; $('#motion').checked = prefs.motion !== false; $('#sound').checked = !!prefs.sound; $('#quips').checked = prefs.quips !== false; $('#patina').checked = !!prefs.patina; $('#demo').checked = !!prefs.demo; });
const setPref = (k, v) => chrome.storage.sync.get('prefs', ({ prefs = {} }) => chrome.storage.sync.set({ prefs: { ...prefs, [k]: v } }));
$('#fab').addEventListener('change', (e) => { setPref('fab', e.target.checked); send({ type: 'peel:fab', on: e.target.checked }); });
for (const k of ['motion', 'sound', 'quips', 'patina', 'demo']) $('#' + k).addEventListener('change', (e) => setPref(k, e.target.checked));
$('#gear').addEventListener('click', () => { $('#settings').hidden = !$('#settings').hidden; });
draw();
