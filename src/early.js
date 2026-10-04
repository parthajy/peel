/* Peel – runs at document_start so pages load already wearing your edition (no flash of the original). */
(function () {
  if (window.top !== window) return;
  const Peel = (window.Peel = window.Peel || {});
  const host = location.hostname.replace(/^(www|m|old|new)\./, '');
  Peel.early = { edition: null, applied: false };
  chrome.storage.sync.get(['edition', 'excluded', 'custom'], (o) => {
    let id = o && o.edition; const excluded = (o && o.excluded) || {}; const custom = (o && o.custom) || {};
    Peel.early.edition = id || null;
    if (!id || excluded[host]) return;
    const base = custom[id] ? custom[id].base : id;      // custom editions borrow a base edition's CSS
    const css = base && Peel.css && Peel.css['src/editions/' + base + '.css'];
    if (!css) return;
    const st = document.createElement('style'); st.id = 'peel-edition-style'; st.textContent = css;
    (document.head || document.documentElement).appendChild(st);
    document.documentElement.dataset.peelEdition = base;
    Peel.early.applied = true;
  });
})();
