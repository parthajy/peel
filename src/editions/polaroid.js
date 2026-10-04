/* Polaroid – every image is an instant photo, tilted, with a handwritten caption. */
Peel.registerEdition({ id: 'polaroid', name: 'Polaroid', emoji: '📷', tagline: 'Shake it like a…', pack: 'materials', css: 'src/editions/polaroid.css', fx: [{ type: 'burst', kind: 'flash' }, { type: 'companion', kind: 'cat', color: 'white' }, 'leaks:.35', 'dust:.35'],
  apply(doc, ctx) {
    // Caption from alt text, set as a data attribute the CSS can print. Only images big enough to be a photo.
    const seen = [];
    const tag = () => { for (const img of doc.querySelectorAll('img:not([data-peel-cap])')) { if (img.closest('#peel-ui, #peel-fx, #peel-root')) continue; const r = img.getBoundingClientRect(); if (r.width < 120 || r.height < 90) continue; const cap = (img.alt || img.title || '').trim().slice(0, 48); img.setAttribute('data-peel-cap', cap || ' '); img.style.setProperty('--tilt', ((Math.random() * 6) - 3).toFixed(1) + 'deg'); seen.push(img); } };
    tag(); const mo = new MutationObserver(Peel.dom.debounce(tag, 400)); mo.observe(doc.body, { childList: true, subtree: true });
    ctx.onDestroy(() => { mo.disconnect(); for (const img of seen) { img.removeAttribute('data-peel-cap'); img.style.removeProperty('--tilt'); } });
  } });
