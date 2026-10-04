/* Reddit (new + old) → stories. Subreddit becomes the section. */
(function () {
  const { $, $$, text, attr, abs, num, imgSrc } = Peel.dom;
  Peel.registerAdapter({
    id: 'reddit', name: 'Reddit', priority: 10,
    match: (loc) => /(^|\.)reddit\.com$/.test(loc.hostname) && !/\/comments\//.test(loc.pathname),
    parse(doc) {
      let items = [];
      // New Reddit: <shreddit-post> web components carry everything as attributes.
      for (const p of $$('shreddit-post', doc)) {
        const title = attr(p, 'post-title') || text($('[slot="title"]', p));
        if (!title) continue;
        const href = attr(p, 'content-href') || attr(p, 'permalink');
        const img = $('img[slot="thumbnail"], [slot="post-media-container"] img, shreddit-player img, img', p);
        const flair = text($('[slot="post-flair"], shreddit-post-flair', p));
        items.push({
          type: 'story', id: attr(p, 'id'),
          title, url: abs(href), commentsUrl: abs(attr(p, 'permalink')),
          image: imgSrc(img),
          summary: text($('[slot="text-body"]', p)).slice(0, 400),
          section: (attr(p, 'subreddit-prefixed-name') || attr(p, 'subreddit-name') || '').replace(/^r\//, '') || 'Reddit',
          author: attr(p, 'author'), score: num(attr(p, 'score')), comments: num(attr(p, 'comment-count')),
          time: attr(p, 'created-timestamp'), tag: flair,
          source: attr(p, 'domain') || 'reddit.com',
        });
      }
      // Old Reddit
      if (!items.length) {
        for (const t of $$('#siteTable .thing.link', doc)) {
          const a = $('a.title', t);
          if (!a) continue;
          const thumb = $('a.thumbnail img', t);
          items.push({
            type: 'story', id: attr(t, 'data-fullname'),
            title: text(a), url: abs(attr(a, 'href')), commentsUrl: abs(attr(t, 'data-permalink')),
            image: thumb ? abs(thumb.src) : '',
            summary: text($('.expando .md', t)).slice(0, 400),
            section: attr(t, 'data-subreddit') || 'Reddit', author: attr(t, 'data-author'),
            score: num(attr(t, 'data-score')), comments: num(attr(t, 'data-comments-count')),
            time: attr($('time', t), 'datetime'), tag: text($('.linkflairlabel', t)),
            source: attr(t, 'data-domain') || 'reddit.com',
          });
        }
      }
      items = items.filter((i) => i.title && !/^\s*(promoted|advertisement)/i.test(i.title));
      if (!items.length) return null;
      const sub = (location.pathname.match(/\/r\/([^/]+)/) || [])[1];
      return { kind: 'stories', items, source: sub ? `r/${sub}` : 'Reddit', edition: sub ? 'Community Edition' : 'Front Page' };
    },
  });
})();
