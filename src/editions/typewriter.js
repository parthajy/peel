/* Typewriter – Courier on bond paper, ink that bleeds, headlines hammered out one letter at a time, keys that clack. */
Peel.registerEdition({ id: 'typewriter', name: 'Typewriter', emoji: '', tagline: 'Clack. Clack. Ding.', pack: 'systems', css: 'src/editions/typewriter.css',
  fx: ['paper:.3', 'vignette:.35', { type: 'enter', kind: 'typewriter' }, { type: 'burst', kind: 'ink' }],
  apply(doc, ctx) {
    // Clack on real typing and on scroll; a bell every so often.
    let n = 0; const key = (e) => { if (e.key && e.key.length === 1) { Peel.sound && Peel.sound.play('type'); if (++n % 40 === 0) Peel.sound && Peel.sound.play('ding'); } };
    doc.addEventListener('keydown', key, true); ctx.onDestroy(() => doc.removeEventListener('keydown', key, true));
  } });
