/* Matrix – glyph rain behind a green monochrome page. */
Peel.registerEdition({ id: 'matrix', name: 'Matrix', emoji: '🟩', tagline: 'There is no spoon', pack: 'weird', css: 'src/editions/matrix.css', invert: true, fx: [{ type: 'burst', kind: 'sparks' }, 'scanlines:.08', 'vignette', { type: 'particles', preset: 'matrix', opacity: .45 }, { type: 'enter', kind: 'typewriter' }] });
