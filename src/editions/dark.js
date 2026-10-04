/* Dark – luminance flipped, hues kept, images left alone. Pages that are already dark are left as they are. */
(function () {
  const lum = (el) => {
    const m = getComputedStyle(el).backgroundColor.match(/[\d.]+/g);
    if (!m || (m.length === 4 && Number(m[3]) === 0)) return null;
    const [r, g, b] = m.map(Number); return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  };
  Peel.registerEdition({
    id: 'dark', name: 'Dark', emoji: '🌙', tagline: 'Lights off, everywhere', pack: 'core', css: 'src/editions/dark.css', invert: true,
    apply(doc) {
      const l = lum(doc.body) ?? lum(doc.documentElement) ?? 1;
      doc.documentElement.toggleAttribute('data-peel-already-dark', l < 0.35);
    },
  });
})();
