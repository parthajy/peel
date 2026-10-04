/* Generic news adapter. Two modes:
   - Article pages (og:type=article or a long <article>) → kind 'article' for the Hush reader.
   - Front pages → kind 'stories' via headline-link heuristics. Only activates when the page
     really looks like news, so random sites are left alone. */
(function () {
  const { $, $$, text, attr, abs, uniqBy, bestImg, siteName } = Peel.dom;
  const NEWSY = /(bbc|guardian|nytimes|cnn|reuters|ndtv|indiatimes|thehindu|hindustantimes|techcrunch|theverge|arstechnica|wired|indianexpress|livemint|economictimes|bloomberg|aljazeera|apnews|washingtonpost|news|times|post|herald|tribune|gazette|journal|daily|express|chronicle|telegraph|independent|scroll\.in|theprint|thewire|firstpost|moneycontrol|engadget|zdnet|cnet|mashable|vox\.com|axios|politico|npr\.org|ft\.com|wsj|economist|mojo|scroll|print|wire|mint|live|today|report|bulletin|observer|standard|sun|mirror|star|voice|monitor|dispatch|courier|sentinel|ledger|review|insider|digest|outlook|india|bharat|desh|samachar|khabar|varta|patrika|jagran|bhaskar|lokmat|sakal|malayala|dinamalar|eenadu|sakshi|prabhat|pratidin|tribune)/i;
  const SKIP = /(login|signin|signup|subscribe|privacy|terms|cookie|contact|about|careers|advertis|newsletter|account|profile|settings|help|faq|sitemap|rss|share|comment|tag\/|topic\/|author\/|video\/|photos?\/|gallery|live-?blog)/i;

  Peel.registerAdapter({
    id: 'news', name: 'News', priority: 0,
    match: (loc) => {
      // Any site may be news; parse() decides. Skip apps and tools where a false positive would annoy.
      return !/(youtube|google|facebook|instagram|twitter|x\.com|tiktok|github|gitlab|stackoverflow|wikipedia|localhost|mail\.|docs\.|notion|figma|slack|discord|whatsapp|netflix|spotify|amazon|flipkart|linkedin|reddit|ycombinator)/.test(loc.hostname);
    },
    parse(doc) {
      const articleMeta = attr($('meta[property="og:type"]', doc), 'content') === 'article' || !!attr($('meta[property="article:published_time"]', doc), 'content');
      if (articleMeta) return parseArticle(doc, false) || parseFront(doc);
      return parseFront(doc) || parseArticle(doc, true);
    },
  });

  function parseArticle(doc, strict) {
    const candidates = $$('article, [itemprop="articleBody"], main, [role="main"], .article-body, .story-body, .entry-content, .post-content', doc);
    let body = null, max = 0;
    for (const c of candidates) {
      const len = $$('p', c).reduce((n, p) => n + text(p).length, 0);
      if (len > max) { max = len; body = c; }
    }
    if (!body || max < (strict ? 2500 : 800)) return null;
    if (strict && (!$('h1', doc) || $$('h2 a, h3 a, a h2, a h3', body).length > 8)) return null;
    const clone = body.cloneNode(true);
    for (const bad of $$('script, style, iframe, noscript, nav, aside, form, button, svg, [aria-hidden="true"], .ad, .ads, .advert, [class*="newsletter"], [class*="related"], [class*="share"], [class*="social"], [class*="promo"], [class*="recirc"], [class*="paywall"], [id*="newsletter"]', clone)) bad.remove();
    for (const el of $$('*', clone)) { for (const a of Array.from(el.attributes)) if (!/^(href|src|srcset|alt|title|datetime)$/.test(a.name)) el.removeAttribute(a.name); }
    for (const img of $$('img', clone)) { const s = attr(img, 'src'); if (s) img.setAttribute('src', abs(s)); }
    for (const a of $$('a', clone)) { const s = attr(a, 'href'); if (s) { a.setAttribute('href', abs(s)); a.setAttribute('target', '_blank'); } }
    const title = attr($('meta[property="og:title"]', doc), 'content') || text($('h1', doc)) || doc.title;
    return {
      kind: 'article', source: siteName(),
      items: [{
        type: 'story', title, url: location.href,
        image: attr($('meta[property="og:image"]', doc), 'content') || bestImg(body),
        summary: attr($('meta[name="description"], meta[property="og:description"]', doc), 'content'),
        author: attr($('meta[name="author"], meta[property="article:author"]', doc), 'content') || text($('[rel="author"], [itemprop="author"], .byline, .author', doc)).replace(/^by\s+/i, ''),
        time: attr($('meta[property="article:published_time"]', doc), 'content') || attr($('time', doc), 'datetime'),
        section: attr($('meta[property="article:section"]', doc), 'content') || sectionFromPath(location.pathname),
        body: clone.innerHTML, words: Math.round(max / 5.5),
      }],
    };
  }

  function parseFront(doc) {
    const seen = new Map();
    for (const a of $$('a[href]', doc)) {
      const href = abs(attr(a, 'href'));
      if (!href || !href.startsWith('http')) continue;
      let u; try { u = new URL(href); } catch { continue; }
      if (u.hostname.replace(/^www\./, '') !== location.hostname.replace(/^www\./, '')) continue;
      if (u.pathname.length < 8 || SKIP.test(u.pathname) || u.hash) continue;
      const heading = a.closest('h1,h2,h3,h4,[class*="headline"],[class*="title"]') || a.querySelector('h1,h2,h3,h4,[class*="headline"],[class*="title"]');
      const t = text(heading) || text(a);
      if (t.length < 28 || t.length > 180 || /^(read more|more|continue|watch|listen)/i.test(t)) continue;
      const container = a.closest('article, li, [class*="card"], [class*="story"], [class*="teaser"], [class*="item"], [class*="post"], div') || a;
      let rank = 0;
      if (heading) rank += 3;
      const img = bestImg(container);
      if (img) rank += 2;
      if (/\d{4}\/\d{2}/.test(u.pathname) || /-\d{5,}|\/\d{6,}/.test(u.pathname)) rank += 1;
      const summaryEl = container.querySelector('p, [class*="summary"], [class*="standfirst"], [class*="dek"], [class*="desc"]');
      const existing = seen.get(u.href);
      if (existing && existing._rank >= rank) continue;
      seen.set(u.href, {
        type: 'story', _rank: rank, title: t, url: u.href, image: img,
        summary: text(summaryEl).slice(0, 300),
        section: sectionFromPath(u.pathname),
        author: text(container.querySelector('[class*="byline"], [class*="author"], [rel="author"]')).replace(/^by\s+/i, '').slice(0, 60),
        time: attr(container.querySelector('time'), 'datetime') || text(container.querySelector('time, [class*="time"], [class*="date"]')).slice(0, 40),
        source: siteName(),
      });
    }
    let items = Array.from(seen.values()).filter((i) => i._rank >= 3);
    if (items.length < 8) return null;
    const withImg = items.filter((i) => i.image).length;
    const newsy = NEWSY.test(location.hostname) || !!$('meta[property="article:publisher"], meta[name="news_keywords"], link[type="application/rss+xml"]', doc);
    if (withImg < 4 && !newsy) return null;
    if (items.length < 12 && !newsy) return null;
    items = uniqBy(items, (i) => i.title.toLowerCase()).slice(0, 80);
    return { kind: 'stories', items, source: siteName(), edition: 'Peeled Edition' };
  }

  function sectionFromPath(p) {
    const seg = (p.split('/').filter(Boolean)[0] || '').replace(/[-_]/g, ' ');
    if (!seg || /\d/.test(seg) || seg.length > 18) return 'News';
    return seg.replace(/\b\w/g, (c) => c.toUpperCase());
  }
})();
