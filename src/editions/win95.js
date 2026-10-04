/* Windows 95 – title bars on every card, bevels everywhere, teal desktop, a Start bar. It has been a long day. */
Peel.registerEdition({ id: 'win95', name: 'Windows 95', emoji: '', tagline: 'Start me up', pack: 'systems', css: 'src/editions/win95.css',
  apply(doc, ctx) {
    const tb = document.createElement('div'); tb.className = 'fx-tb95';
    const t = () => new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    tb.innerHTML = `<button class="start"><i></i>Start</button><span class="task">${location.hostname.replace(/^www\./, '')} - Netscape</span><span class="tray">🔊 ${t()}</span>`;
    const iv = setInterval(() => { tb.querySelector('.tray').textContent = '🔊 ' + t(); }, 20000);
    ctx.fx.append(tb); ctx.onDestroy(() => clearInterval(iv));
    // Title text for each window comes from its first heading.
    const label = () => { for (const el of doc.querySelectorAll('article, [class*="card"], [class*="post"], aside')) { if (el.dataset.peel95 || el.closest('#peel-ui, #peel-fx, #peel-root')) continue; const hd = el.querySelector('h1, h2, h3, h4'); el.dataset.peel95 = ((hd && hd.textContent.trim()) || 'Untitled').slice(0, 42); } };
    label(); const mo = new MutationObserver(Peel.dom.debounce(label, 400)); mo.observe(doc.body, { childList: true, subtree: true });
    ctx.onDestroy(() => { mo.disconnect(); for (const el of doc.querySelectorAll('[data-peel95]')) delete el.dataset.peel95; });
  } });
