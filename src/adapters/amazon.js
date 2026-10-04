/* Amazon search results → products. Works across amazon.* storefronts. */
(function () {
  const { $, $$, text, attr, abs, num } = Peel.dom;
  Peel.registerAdapter({
    id: 'amazon', name: 'Amazon', priority: 10,
    match: (loc) => /(^|\.)amazon\.[a-z.]+$/.test(loc.hostname),
    parse(doc) {
      const items = $$('div[data-component-type="s-search-result"]', doc).map((card) => {
        const link = $('h2 a, a.a-link-normal.s-link-style, a.a-link-normal.s-no-outline', card);
        const title = text($('h2', card)) || attr($('img.s-image', card), 'alt');
        if (!title || !link) return null;
        const priceEl = $('.a-price .a-offscreen', card);
        const priceText = text(priceEl) || text($('.a-price', card));
        const rating = num((text($('i[class*="a-icon-star"] .a-icon-alt', card)) || attr($('[aria-label*="out of 5"]', card), 'aria-label')).split(' ')[0]);
        const reviewsEl = $('[aria-label$="ratings"], [aria-label$="rating"], span.a-size-base.s-underline-text, a[href*="customerReviews"] span', card);
        const sponsored = !!$('[aria-label="Sponsored"], .puis-sponsored-label-text, [data-component-type="sp-sponsored-result"]', card) || /Sponsored/.test(text($('.a-row.a-spacing-micro', card)));
        return {
          type: 'product', id: attr(card, 'data-asin'),
          title, url: abs(attr(link, 'href')),
          image: attr($('img.s-image', card), 'src'),
          price: num(priceText), priceText,
          currency: (priceText.match(/^[^\d\s]+/) || [''])[0],
          rating, reviews: num(text(reviewsEl)),
          badge: text($('.a-badge-text, [data-a-badge-type] .a-badge-label-inner', card)),
          prime: !!$('.a-icon-prime, [aria-label="Amazon Prime"]', card),
          delivery: text($('[data-cy="delivery-recipe"] .a-text-bold, .udm-primary-delivery-message .a-text-bold', card)),
          sponsored,
          source: 'Amazon',
        };
      }).filter(Boolean);
      if (!items.length) return null;
      const q = new URLSearchParams(location.search).get('k') || text($('#searchQuery, .s-breadcrumb')) || 'Results';
      return { kind: 'products', items, source: 'Amazon', query: q };
    },
  });
})();
