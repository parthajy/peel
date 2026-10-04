/* Konami – the secret one. ↑↑↓↓←→←→BA on any page unlocks it. */
Peel.registerEdition({ id: 'konami', name: 'Konami', emoji: '🕹️', tagline: 'You found it. 30 lives.', pack: 'weird', hidden: true, css: 'src/editions/konami.css',
  fx: ['scanlines:.05', { type: 'particles', preset: 'stars', count: 160 }, { type: 'particles', preset: 'confetti', count: 40, opacity: .7 }, { type: 'cursor', kind: 'sparkle' }, { type: 'burst', kind: 'confetti' }, { type: 'ambient', kinds: ['hue', 'heartbeat'] }, { type: 'enter', kind: 'stamp' }] });
