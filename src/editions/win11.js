/* Windows 11 – Mica, Segoe, soft corners, a centred taskbar with a Start button. */
Peel.registerEdition({ id: 'win11', name: 'Windows 11', emoji: '', tagline: 'Mica, rounded, centred Start', pack: 'systems', css: 'src/editions/win11.css',
  apply(doc, ctx) {
    const tb = document.createElement('div'); tb.className = 'fx-taskbar';
    const t = () => { const d = new Date(); return `<b>${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</b><small>${d.toLocaleDateString()}</small>`; };
    tb.innerHTML = `<div class="c"><i class="start"></i><i>🔍</i><i>🗂️</i><i>🌐</i><i>📁</i><i>✉️</i></div><div class="r"><span>▲</span><span>🔊</span><span>📶</span><time>${t()}</time></div>`;
    const iv = setInterval(() => { tb.querySelector('time').innerHTML = t(); }, 20000);
    ctx.fx.append(tb); ctx.onDestroy(() => clearInterval(iv));
  } });
