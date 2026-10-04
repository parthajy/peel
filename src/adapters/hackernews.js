/* Hacker News → stories. The most stable DOM on the internet. */
(function () {
  const { $, $$, text, attr, abs, num } = Peel.dom;
  Peel.registerAdapter({
    id: 'hackernews', name: 'Hacker News', priority: 10,
    match: (loc) => loc.hostname === 'news.ycombinator.com' && !/^\/(item|user|submit|login|reply)/.test(loc.pathname),
    parse(doc) {
      const items = $$('tr.athing', doc).map((row) => {
        const a = $('.titleline > a', row) || $('.titleline a', row);
        const sub = row.nextElementSibling;
        const site = text($('.sitestr', row));
        const commentsA = sub ? $$('a', sub).find((x) => /comment|discuss/.test(x.textContent)) : null;
        const title = text(a);
        if (!a || !title) return null;
        return {
          type: 'story',
          id: attr(row, 'id'),
          title, url: abs(attr(a, 'href')),
          source: site || 'news.ycombinator.com',
          section: /Show HN/i.test(title) ? 'Show' : /Ask HN/i.test(title) ? 'Ask' : /Launch HN/i.test(title) ? 'Launch' : /\.pdf$/i.test(attr(a, 'href')) ? 'Papers' : sectionFor(site),
          score: num(text($('.score', sub))),
          author: text($('.hnuser', sub)),
          time: attr($('.age', sub), 'title').split(' ')[0] || text($('.age', sub)),
          comments: commentsA ? (num(text(commentsA)) || 0) : 0,
          commentsUrl: abs(`item?id=${attr(row, 'id')}`),
          rank: num(text($('.rank', row))),
        };
      }).filter(Boolean);
      return items.length ? { kind: 'stories', items, source: 'Hacker News', edition: titleFor(location.pathname) } : null;
    },
  });
  function sectionFor(site) {
    if (!site) return 'Front Page';
    if (/github|gitlab|sourcehut|codeberg/.test(site)) return 'Code';
    if (/arxiv|nature|science|acm|ieee|\.edu$/.test(site)) return 'Science';
    if (/nytimes|bbc|theguardian|reuters|bloomberg|wsj|ft\.com|economist|apnews|washingtonpost/.test(site)) return 'World';
    if (/youtube|vimeo/.test(site)) return 'Video';
    if (/wikipedia|britannica/.test(site)) return 'Reference';
    if (/substack|medium|blogspot|wordpress|bearblog|\.blog$|ghost\.io/.test(site)) return 'Essays';
    return 'Technology';
  }
  function titleFor(path) {
    if (/^\/newest/.test(path)) return 'Late Edition';
    if (/^\/best/.test(path)) return 'Weekend Review';
    if (/^\/show/.test(path)) return 'Show Edition';
    if (/^\/ask/.test(path)) return 'Letters';
    if (/^\/jobs/.test(path)) return 'Classifieds';
    return 'Morning Edition';
  }
})();
