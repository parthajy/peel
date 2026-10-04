/* Hush – a quiet reader for article pages. */
(function () {
  const { h, prettyDate, timeAgo } = Peel.dom;
  Peel.registerExperience({
    id: 'hush', name: 'Hush', emoji: '🌙', tagline: 'Just the article, beautifully set',
    accepts: ['article'], mode: 'replace', css: 'src/experiences/hush.css',
    variants: [{ id: 'paper', name: 'Paper' }, { id: 'sepia', name: 'Kindle' }, { id: 'night', name: 'Night' }],
    render(root, data, ctx) {
      const a = data.items[0];
      const minutes = Math.max(1, Math.round((a.words || 600) / 230));
      root.append(
        h('article', { class: 'read' },
          h('div', { class: 'kicker' }, a.section || data.source, ' · ', `${minutes} min read`),
          h('h1', {}, a.title),
          a.summary && h('p', { class: 'standfirst' }, a.summary),
          h('div', { class: 'byline' }, a.author ? `By ${a.author}` : data.source, a.time ? ` · ${new Date(a.time).toLocaleDateString(undefined, { dateStyle: 'long' })}` : ''),
          a.image && h('figure', {}, h('img', { src: a.image, alt: '' })),
          h('div', { class: 'body', html: a.body }),
          h('footer', {}, h('a', { href: '#', onClick: (e) => { e.preventDefault(); ctx.unpeel(); } }, 'Show the original page'), ' · Peeled on ', prettyDate())));
      const bar = h('div', { class: 'progress' });
      root.append(bar);
      const sc = ctx.scroller || document.documentElement, tgt = ctx.scroller || window;
      const onScroll = () => { bar.style.width = `${Math.min(100, (sc.scrollTop / Math.max(1, sc.scrollHeight - sc.clientHeight)) * 100)}%`; };
      tgt.addEventListener('scroll', onScroll, { passive: true });
      ctx.onDestroy(() => tgt.removeEventListener('scroll', onScroll));
    },
  });
})();
