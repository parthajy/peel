/* Terminal – green phosphor, CRT curve, headlines typed out. */
Peel.registerEdition({ id: 'terminal', name: 'Terminal', emoji: '⌨️', tagline: 'Green phosphor, 80 columns', pack: 'eras', css: 'src/editions/terminal.css', invert: true,
  fx: [{ type: 'burst', kind: 'sparks' }, { type: 'sound', loop: 'hum' }, 'scanlines:.12', 'crt', 'static:.05', { type: 'enter', kind: 'typewriter' }, { type: 'ambient', kinds: ['flicker'] }] });
