/* Broadsheet – stories rendered as a newspaper front page. */
(function () {
  const { h, esc, compact, prettyDate, timeAgo } = Peel.dom;
  Peel.registerExperience({
    id: 'broadsheet', name: 'Broadsheet', emoji: '📰', tagline: 'Front page, hot off the press',
    accepts: ['stories'], mode: 'replace', css: 'src/experiences/broadsheet.css',
    variants: [
      { id: 'classic', name: 'Morning Edition' },
      { id: 'pink', name: 'Pink Paper' },
      { id: 'tabloid', name: 'Tabloid' },
    ],
    render(root, data, ctx) {
      const items = data.items.slice();
      const lead = pickLead(items);
      const rest = items.filter((i) => i !== lead);
      const sections = groupBy(rest, (i) => i.section || 'News');
      const vol = Math.floor((Date.now() / 864e5) % 999) + 1;

      root.append(
        h('header', { class: 'masthead' },
          h('div', { class: 'ears' },
            h('span', {}, data.edition || 'Peeled Edition'),
            h('span', {}, prettyDate()),
            h('span', {}, `Vol. ${vol} · ${items.length} stories`)),
          h('h1', { class: 'paper' }, paperName(data.source)),
          h('div', { class: 'rule double' })),
        lead && h('section', { class: 'lead' + (lead.image ? ' has-img' : '') },
          lead.image && h('a', { href: lead.url, target: '_blank', class: 'hero' }, h('img', { src: lead.image, alt: '' }),
            h('figcaption', {}, lead.source && lead.source !== data.source ? lead.source : lead.section || '')),
          h('div', { class: 'lead-text' },
            h('div', { class: 'kicker' }, lead.section || 'Top Story'),
            h('h2', {}, h('a', { href: lead.url, target: '_blank' }, lead.title)),
            lead.summary && h('p', { class: 'deck' }, lead.summary),
            byline(lead))),
        h('div', { class: 'rule' }),
        h('main', { class: 'columns' },
          sections.map(([name, list]) => h('section', { class: 'sec' },
            h('h3', { class: 'sec-head' }, name),
            list.map((s, i) => story(s, i === 0 && !!s.image))))),
        h('footer', { class: 'colophon' },
          `Printed locally in your browser by Peel · Nothing was sent anywhere · `,
          h('a', { href: '#', onClick: (e) => { e.preventDefault(); ctx.unpeel(); } }, 'Read the original')));
    },
  });

  function story(s, withImg) {
    return h('article', { class: 'story' + (withImg ? ' with-img' : '') },
      withImg && h('a', { href: s.url, target: '_blank' }, h('img', { src: s.image, alt: '', loading: 'lazy' })),
      h('h4', {}, h('a', { href: s.url, target: '_blank' }, s.title)),
      s.summary && h('p', { class: 'dropcap' }, s.summary),
      byline(s));
  }
  function byline(s) {
    const bits = [];
    if (s.author) bits.push(`By ${s.author}`);
    if (s.source && s.source !== Peel.dom.siteName() && !/^(reddit|hacker)/i.test(s.source)) bits.push(s.source);
    if (s.time) bits.push(timeAgo(s.time) || s.time);
    if (s.score != null) bits.push(`${compact(s.score)} points`);
    if (s.comments != null) bits.push(h('a', { href: s.commentsUrl || s.url, target: '_blank' }, `${compact(s.comments)} comments`));
    if (!bits.length) return null;
    const el = h('div', { class: 'byline' });
    bits.forEach((b, i) => { if (i) el.append(' · '); el.append(b); });
    return el;
  }
  function pickLead(items) {
    const withImg = items.filter((i) => i.image);
    if (withImg.length) return withImg.sort((a, b) => (b.score || 0) - (a.score || 0))[0] === withImg[0] ? withImg[0] : withImg[0];
    return items.slice().sort((a, b) => (b.score || 0) + (b.comments || 0) - (a.score || 0) - (a.comments || 0))[0] || items[0];
  }
  function groupBy(list, key) {
    const m = new Map();
    for (const x of list) { const k = key(x); if (!m.has(k)) m.set(k, []); m.get(k).push(x); }
    // Big sections first, tiny ones merge into "In Brief"
    const out = [], brief = [];
    for (const [k, v] of [...m.entries()].sort((a, b) => b[1].length - a[1].length)) (v.length >= 2 || m.size <= 3 ? out : brief).push([k, v]);
    if (brief.length) out.push(['In Brief', brief.flatMap(([, v]) => v)]);
    return out;
  }
  function paperName(src) {
    const s = (src || 'The Web').replace(/^r\//, '').replace(/\.(com|org|net|in|co\.uk)$/, '');
    if (/^the\b/i.test(s)) return s;
    return `The ${s.charAt(0).toUpperCase()}${s.slice(1)} ${/news|times|post|herald/i.test(s) ? '' : 'Times'}`.trim();
  }
})();
