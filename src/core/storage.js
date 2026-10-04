/* Peel – settings + shortlist storage. Everything stays in the browser. */
(function () {
  const Peel = (window.Peel = window.Peel || {});
  const sync = chrome.storage.sync, local = chrome.storage.local;
  const get = (area, key, fallback) => new Promise((res) => area.get(key, (o) => res(o && o[key] !== undefined ? o[key] : fallback)));
  const set = (area, key, value) => new Promise((res) => area.set({ [key]: value }, res));

  const host = () => location.hostname.replace(/^(www|m|old|new)\./, '');

  Peel.store = {
    // { [host]: { auto: 'broadsheet', variant: 'classic', options: {...} } }
    async sites() { return get(sync, 'sites', {}); },
    async site() { return (await this.sites())[host()] || {}; },
    async setSite(patch) {
      const sites = await this.sites();
      sites[host()] = { ...(sites[host()] || {}), ...patch };
      return set(sync, 'sites', sites);
    },
    async prefs() { return get(sync, 'prefs', { fab: true, motion: true }); },
    // Global edition + per-site exclusions.
    global() { return new Promise((res) => sync.get(['edition', 'excluded', 'prefs'], (o) => res({ edition: (o && o.edition) || null, excluded: (o && o.excluded) || {}, prefs: (o && o.prefs) || { fab: true, motion: true } }))); },
    setGlobal(patch) { return new Promise((res) => sync.set(patch, res)); },
    async setExcluded(h, on) { const ex = await get(sync, 'excluded', {}); if (on) ex[h] = true; else delete ex[h]; return set(sync, 'excluded', ex); },
    async setPrefs(patch) { return set(sync, 'prefs', { ...(await this.prefs()), ...patch }); },
    // Shortlist from Swipe mode, per host. Local only: it can get big.
    async shortlist() { return (await get(local, 'shortlist', {}))[host()] || []; },
    async setShortlist(items) {
      const all = await get(local, 'shortlist', {});
      all[host()] = items.slice(0, 200);
      return set(local, 'shortlist', all);
    },
    async seen() { return (await get(local, 'seen', {}))[host()] || []; },
    async setSeen(urls) {
      const all = await get(local, 'seen', {});
      all[host()] = urls.slice(-800);
      return set(local, 'seen', all);
    },
    async bugScore(h) { return (await get(local, 'bugScore', {}))[h] || 0; },
    async setBugScore(h, n) { const all = await get(local, 'bugScore', {}); all[h] = n; return set(local, 'bugScore', all); },
    // Visit log for Patina: count, first, last, and the previous last (so a long gap shows as moss on return).
    async visit(h) { const all = await get(local, 'visits', {}); const v = all[h] || { n: 0, first: Date.now(), last: Date.now() }; v.prevLast = v.last; v.last = Date.now(); v.n++; all[h] = v; await set(local, 'visits', all); return v; },
    // Spray-paint walls, one PNG data URL per site, newest 20 kept.
    // One-time wipe of walls saved before walls became opt-in.
    async migrate() { const v = await get(local, 'schema', 0); if (v < 2) { await set(local, 'graffiti', {}); await set(local, 'schema', 2); } },
    async graffiti(h) { const g = (await get(local, 'graffiti', {}))[h]; return g ? g.url : null; },
    async setGraffiti(h, url) { const all = await get(local, 'graffiti', {}); if (url) all[h] = { url, t: Date.now() }; else delete all[h]; const keys = Object.keys(all).sort((a, b) => all[b].t - all[a].t); for (const k of keys.slice(20)) delete all[k]; return set(local, 'graffiti', all); },
    onChange(fn) { chrome.storage.onChanged.addListener(fn); },
  };
})();
