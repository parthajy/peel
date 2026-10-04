/* Peel – registries for adapters (site → structured data) and experiences (data → new UI). */
(function () {
  const Peel = (window.Peel = window.Peel || {});
  const adapters = [], experiences = [], editions = [];

  /**
   * Adapter shape:
   * { id, name, match(location) → bool, parse(document) → { kind, items, source, meta? } | null, priority? }
   * kinds: 'stories' | 'products' | 'posts' | 'article' | 'skin:<site>'
   */
  Peel.registerAdapter = (a) => { adapters.push(a); adapters.sort((x, y) => (y.priority || 0) - (x.priority || 0)); };

  /**
   * Experience ("peel") shape:
   * { id, name, emoji, tagline, accepts: [kind], mode: 'replace' | 'skin', css: 'path.css',
   *   variants: [{id,name}], options: [{id,name,default}],
   *   render(root, data, ctx)  // replace mode. root is inside a shadow DOM.
   *   apply(doc, data, ctx)    // skin mode. mutate page classes only.
   *   destroy?() }
   */
  Peel.registerExperience = (e) => experiences.push(e);

  /**
   * Edition shape (global look applied to every site):
   * { id, name, emoji, tagline, css: 'src/editions/x.css', invert?: bool,
   *   apply?(doc, ctx)   // optional JS effects. ctx.fx is a ShadowRoot of a fixed, click-through layer; ctx.onDestroy(fn)
   * }
   */
  Peel.registerEdition = (e) => editions.push(e);

  Peel.registry = {
    adapters, experiences, editions,
    edition(id) { return editions.find((e) => e.id === id) || null; },
    adapterFor(loc = location) { return adapters.find((a) => { try { return a.match(loc); } catch { return false; } }) || null; },
    /** First adapter (by priority) whose match() and parse() both succeed. */
    detect(loc = location, doc = document) {
      for (const a of adapters) {
        let ok = false; try { ok = a.match(loc); } catch {}
        if (!ok) continue;
        try { const data = a.parse(doc); if (data && (data.kind.startsWith('skin:') || (data.items && data.items.length))) return { adapter: a, data }; }
        catch (e) { console.warn('[Peel] adapter failed', a.id, e); }
      }
      return { adapter: null, data: null };
    },
    experiencesFor(kind) { return experiences.filter((e) => e.accepts.includes(kind)); },
    experience(id) { return experiences.find((e) => e.id === id) || null; },
  };
})();
