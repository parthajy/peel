/* Peel – tiny DOM helpers shared by adapters and experiences. Pure, read-only. */
(function () {
  const Peel = (window.Peel = window.Peel || {});
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const text = (el) => (el ? (el.textContent || '').replace(/\s+/g, ' ').trim() : '');
  const attr = (el, name) => (el ? el.getAttribute(name) || '' : '');
  const abs = (href) => { try { return new URL(href, location.href).href; } catch { return ''; } };
  const num = (s) => { const m = String(s || '').replace(/[,\s]/g, '').match(/\d+(?:\.\d+)?/); return m ? Number(m[0]) : null; };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const h = (tag, props = {}, ...kids) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat(Infinity)) {
      if (kid == null || kid === false) continue;
      el.appendChild(typeof kid === 'string' ? document.createTextNode(kid) : kid);
    }
    return el;
  };
  const BAD = /1x1|pixel|spacer|icon|logo|avatar|sprite|placeholder|blank\.|transparent|loading|lazy\.|data:image\/(gif|svg)/i;
  const fromSrcset = (ss) => {
    let best = '', bw = 0;
    for (const part of String(ss || '').split(',')) {
      const [u, d] = part.trim().split(/\s+/);
      const w = d ? parseFloat(d) * (d.endsWith('x') ? 1000 : 1) : 1;
      if (u && w >= bw) { bw = w; best = u; }
    }
    return best;
  };
  const imgSrc = (img) => {
    if (!img) return '';
    const cands = [img.currentSrc, fromSrcset(attr(img, 'srcset') || attr(img, 'data-srcset')), attr(img, 'data-src'), attr(img, 'data-lazy-src'), attr(img, 'data-original'), img.getAttribute('src')];
    const pic = img.closest('picture');
    if (pic) for (const src of $$('source', pic)) cands.push(fromSrcset(attr(src, 'srcset') || attr(src, 'data-srcset')));
    for (const c of cands) if (c && !BAD.test(c)) return abs(c);
    return '';
  };
  const bestImg = (root) => {
    if (!root) return '';
    let best = '', bestArea = 0;
    for (const img of $$('img', root)) {
      const src = imgSrc(img);
      if (!src) continue;
      const w = img.naturalWidth || img.width || Number(attr(img, 'width')) || 0;
      const hgt = img.naturalHeight || img.height || Number(attr(img, 'height')) || 0;
      const area = (w || 300) * (hgt || 200);
      if (area > bestArea) { bestArea = area; best = src; }
    }
    return best;
  };
  const timeAgo = (d) => {
    const t = d instanceof Date ? d.getTime() : Date.parse(d);
    if (!t) return '';
    const s = Math.max(0, (Date.now() - t) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };
  const uniqBy = (arr, key) => { const seen = new Set(); return arr.filter((x) => { const k = key(x); if (!k || seen.has(k)) return false; seen.add(k); return true; }); };
  const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  const compact = (n) => (n == null ? '' : n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(n >= 1e4 ? 0 : 1) + 'k' : String(n));
  const prettyDate = (d = new Date()) => d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const hostName = () => location.hostname.replace(/^(www|m|old|new)\./, '');
  const siteName = () => {
    const og = attr($('meta[property="og:site_name"]'), 'content');
    if (og) return og;
    const base = hostName().split('.')[0];
    return base.length <= 4 ? base.toUpperCase() : base.charAt(0).toUpperCase() + base.slice(1);
  };

  Peel.dom = { $, $$, text, attr, abs, num, esc, h, bestImg, imgSrc, timeAgo, uniqBy, debounce, compact, prettyDate, hostName, siteName };
})();
