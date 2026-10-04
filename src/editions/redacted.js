/* Redacted – words under black bars, CLASSIFIED stamps, typewriter paper. Nothing is actually removed: the bars lift on hover. */
Peel.registerEdition({ id: 'redacted', name: 'Redacted', emoji: '🕵️', tagline: '[REDACTED] on [REDACTED]', pack: 'weird', css: 'src/editions/redacted.css', fx: [{ type: 'burst', kind: 'ink' }, 'paper:.25', 'stamp', 'vignette:.5'],
  apply(doc, ctx) {
    const wrapped = []; const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.nodeValue.trim().length > 30 && !n.parentElement.closest('script, style, a, button, input, textarea, code, pre, #peel-ui, #peel-fx, #peel-root') ? 1 : 2) });
    const nodes = []; let n; while ((n = walker.nextNode()) && nodes.length < 400) nodes.push(n);
    for (const node of nodes) {
      const words = node.nodeValue.split(/(\s+)/); if (words.length < 6) continue;
      let hit = false; const frag = doc.createDocumentFragment();
      for (const w of words) { if (/^[A-Za-z][A-Za-z'’-]{4,}$/.test(w) && Math.random() < .18) { const s = doc.createElement('mark'); s.className = 'peel-redact'; s.textContent = w; frag.appendChild(s); hit = true; } else frag.appendChild(doc.createTextNode(w)); }
      if (hit) { const marker = doc.createComment('peel-redact'); node.parentNode.insertBefore(marker, node); node.parentNode.replaceChild(frag, node); wrapped.push({ marker, text: node.nodeValue }); }
    }
    ctx.onDestroy(() => { for (const { marker, text } of wrapped) { const p = marker.parentNode; if (!p) continue; let sib = marker.nextSibling; const t = doc.createTextNode(text); let len = 0; while (sib && len < text.length) { const next = sib.nextSibling; len += (sib.textContent || '').length; p.removeChild(sib); sib = next; } p.replaceChild(t, marker); } });
  } });
