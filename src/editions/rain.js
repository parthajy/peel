/* Rain – grey afternoon, streaks on the glass, drops falling. */
Peel.registerEdition({ id: 'rain', name: 'Rain', emoji: '🌧️', tagline: 'A grey afternoon', pack: 'weather', css: 'src/editions/rain.css', fx: [{ type: 'burst', kind: 'splash' }, { type: 'sound', loop: 'rain' }, 'streaks:.12', 'fog:.3', 'vignette:.7', { type: 'particles', preset: 'rain', count: 170, wind: .2 }] });
