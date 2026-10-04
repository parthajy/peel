/* macOS – every card is a window with traffic lights, SF type, frosted glass, a menu bar up top and a dock below. */
Peel.registerEdition({ id: 'macos', name: 'macOS', emoji: '', tagline: 'Windows, traffic lights, a dock', pack: 'systems', css: 'src/editions/macos.css',
  apply(doc, ctx) {
    const bar = document.createElement('div'); bar.className = 'fx-macbar';
    const t = () => new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    bar.innerHTML = `<b></b><strong>${(location.hostname.replace(/^www\./, '').split('.')[0] || 'Peel')}</strong><span>File</span><span>Edit</span><span>View</span><span>Window</span><span>Help</span><em>${t()}</em>`;
    const iv = setInterval(() => { bar.querySelector('em').textContent = t(); }, 20000);
    const dock = document.createElement('div'); dock.className = 'fx-dock'; dock.innerHTML = ['🧭', '✉️', '📅', '🗒️', '🎵', '🖼️', '⚙️', '🗑️'].map((e) => `<i>${e}</i>`).join('');
    ctx.fx.append(bar, dock); ctx.onDestroy(() => clearInterval(iv));
  } });
