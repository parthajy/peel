/* Glossy – stories as a magazine wall. Big images, bold type, section chips. */
(function () {
  const { h, compact, timeAgo } = Peel.dom;
  const HUES = {};
  const hue = (s) => { if (!(s in HUES)) { let n = 0; for (const c of s) n = (n * 31 + c.charCodeAt(0)) % 360; HUES[s] = n; } return HUES[s]; };
  Peel.registerExperience({
    id: 'glossy', name: 'Glossy', emoji: '✨', tagline: 'Magazine wall, big pictures',
    accepts: ['stories'], mode: 'replace', css: 'src/experiences/cards.css',
    variants: [{ id: 'light', name: 'Gloss' }, { id: 'noir', name: 'Noir' }, { id: 'pop', name: 'Pop Art' }],
    render(root, data, ctx) {
      const items = data.items.slice().sort((a, b) => (b.image ? 1 : 0) - (a.image ? 1 : 0));
      const sections = [...new Set(items.map((i) => i.section || 'News'))];
      let active = null;
      const wall = h('main', { class: 'wall' });
      const draw = () => {
        wall.replaceChildren(...items.filter((i) => !active || (i.section || 'News') === active).map((s, i) => card(s, i)));
      };
      const chips = h('nav', { class: 'chips' },
        h('button', { class: 'chip on', onClick: (e) => { active = null; sel(e.target); } }, 'All'),
        sections.slice(0, 14).map((sec) => h('button', { class: 'chip', style: { '--h': hue(sec) }, onClick: (e) => { active = sec; sel(e.target); } }, sec)));
      const sel = (btn) => { for (const c of chips.children) c.classList.toggle('on', c === btn); draw(); };
      root.append(
        h('header', { class: 'head' },
          h('h1', {}, data.source, h('small', {}, data.edition || 'Peeled')),
          h('span', { class: 'count' }, `${items.length} stories`)),
        chips, wall,
        h('footer', { class: 'foot' }, h('a', { href: '#', onClick: (e) => { e.preventDefault(); ctx.unpeel(); } }, 'Back to the original page')));
      draw();
    },
  });
  function card(s, i) {
    const big = i % 7 === 0 && s.image;
    return h('article', { class: 'card' + (big ? ' big' : '') + (s.image ? ' has-img' : ' text'), style: { '--h': hue(s.section || 'News') } },
      s.image && h('a', { class: 'pic', href: s.url, target: '_blank' }, h('img', { src: s.image, alt: '', loading: 'lazy' })),
      h('div', { class: 'body' },
        h('span', { class: 'sec' }, s.section || 'News', s.tag ? ` · ${s.tag}` : ''),
        h('h2', {}, h('a', { href: s.url, target: '_blank' }, s.title)),
        s.summary && h('p', {}, s.summary),
        h('div', { class: 'meta' },
          s.author && h('span', {}, s.author),
          s.time && h('span', {}, timeAgo(s.time) || s.time),
          s.score != null && h('span', {}, `▲ ${compact(s.score)}`),
          s.comments != null && h('a', { href: s.commentsUrl || s.url, target: '_blank' }, `💬 ${compact(s.comments)}`))));
  }
})();
