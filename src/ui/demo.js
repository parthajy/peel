/* Peel – Demo mode. Draws what screen recorders miss: a cursor halo, click ripples, key badges, and a caption naming each flip.
   Everything lives in Peel's own UI layer, so it is captured as part of the page. */
(function () {
  const Peel = (window.Peel = window.Peel || {});
  let on = false, stop = null;
  function start(root) {
    const halo = document.createElement('div'); halo.className = 'demo-halo';
    const keys = document.createElement('div'); keys.className = 'demo-keys';
    const cap = document.createElement('div'); cap.className = 'demo-cap';
    root.append(halo, keys, cap);
    let hideT = 0;
    const move = (e) => { halo.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`; halo.classList.add('on'); };
    const down = (e) => { halo.classList.add('press'); const r = document.createElement('div'); r.className = 'demo-ripple'; r.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`; root.appendChild(r); setTimeout(() => r.remove(), 700); };
    const up = () => halo.classList.remove('press');
    const KEYN = { ' ': 'Space', ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', Escape: 'Esc', Shift: 'Shift', Meta: '⌘', Control: 'Ctrl', Alt: '⌥', Enter: '↵' };
    const key = (e) => {
      if (['Shift', 'Meta', 'Control', 'Alt'].includes(e.key) && !e.repeat) return;
      const parts = []; if (e.metaKey) parts.push('⌘'); if (e.ctrlKey) parts.push('Ctrl'); if (e.altKey) parts.push('⌥'); if (e.shiftKey) parts.push('Shift');
      parts.push(KEYN[e.key] || (e.key.length === 1 ? e.key.toUpperCase() : e.key));
      const b = document.createElement('kbd'); b.textContent = parts.join(' + '); keys.appendChild(b); while (keys.children.length > 4) keys.firstChild.remove();
      setTimeout(() => { b.classList.add('out'); setTimeout(() => b.remove(), 300); }, 1800);
    };
    document.addEventListener('pointermove', move, true); document.addEventListener('pointerdown', down, true); document.addEventListener('pointerup', up, true); document.addEventListener('keydown', key, true);
    const caption = (text) => { clearTimeout(hideT); cap.textContent = text; cap.classList.add('on'); hideT = setTimeout(() => cap.classList.remove('on'), 2600); };
    Peel.demoCaption = caption;
    return () => { document.removeEventListener('pointermove', move, true); document.removeEventListener('pointerdown', down, true); document.removeEventListener('pointerup', up, true); document.removeEventListener('keydown', key, true); halo.remove(); keys.remove(); cap.remove(); Peel.demoCaption = null; };
  }
  Peel.demo = {
    set(enabled, root) { if (enabled === on) return; on = enabled; if (stop) { stop(); stop = null; } if (on && root) stop = start(root); },
    on: () => on,
    caption: (t) => { if (on && Peel.demoCaption) Peel.demoCaption(t); },
  };
})();
