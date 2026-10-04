/* Flipkart search → products. Class names are obfuscated and rotate, so this is heuristic:
   find product links, then read price/rating from their nearest card container. */
(function () {
  const { $, $$, text, attr, abs, num, uniqBy } = Peel.dom;
  Peel.registerAdapter({
    id: 'flipkart', name: 'Flipkart', priority: 10,
    match: (loc) => /(^|\.)flipkart\.com$/.test(loc.hostname),
    parse(doc) {
      const links = $$('a[href*="/p/itm"]', doc);
      const cards = uniqBy(links.map((a) => {
        // Climb until the container holds both an image and a ₹ price.
        let el = a;
        for (let i = 0; i < 8 && el && el !== doc.body; i++) {
          if ($('img', el) && /₹\s?[\d,]+/.test(el.textContent)) return { el, a };
          el = el.parentElement;
        }
        return null;
      }).filter(Boolean), (c) => c.el);
      const items = cards.map(({ el, a }) => {
        const img = $('img', el);
        const title = attr(a, 'title') || attr(img, 'alt') || text($('[title]', el)) || text(a);
        if (!title) return null;
        const raw = el.textContent;
        const prices = raw.match(/₹\s?[\d,]+/g) || [];
        const price = prices.length ? num(prices[0]) : null;
        const mrp = prices.length > 1 ? num(prices[1]) : null;
        const ratingEl = $$('div,span', el).find((n) => n.children.length <= 1 && /^\s*\d\.\d\s*$/.test(n.textContent));
        const rev = raw.match(/([\d,]+)\s*Ratings/i) || raw.match(/\(([\d,]+)\)/);
        const off = raw.match(/(\d+)%\s*off/i);
        return {
          type: 'product', id: (attr(a, 'href').match(/pid=([A-Z0-9]+)/) || [])[1] || attr(a, 'href'),
          title, url: abs(attr(a, 'href')),
          image: img ? (img.currentSrc || img.src) : '',
          price, priceText: prices[0] || '', currency: '₹', mrp,
          discount: off ? Number(off[1]) : (mrp && price && mrp > price ? Math.round((1 - price / mrp) * 100) : null),
          rating: ratingEl ? num(ratingEl.textContent) : null,
          reviews: rev ? num(rev[1]) : null,
          badge: /Assured/i.test(raw) ? 'Assured' : '',
          sponsored: /Sponsored|Ad\b/.test(raw.slice(0, 40)),
          source: 'Flipkart',
        };
      }).filter(Boolean);
      if (items.length < 4) return null;
      const q = new URLSearchParams(location.search).get('q') || 'Results';
      return { kind: 'products', items, source: 'Flipkart', query: q };
    },
  });
})();
