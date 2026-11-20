// Offline support: keeps a copy of the site so it still works if school Wi-Fi drops or crawls.
// Each file comes from the network if it arrives within 3 seconds (so updates show straight away);
// if it's slower than that, or there's no network, the saved copy is shown instead, and the new
// copy is saved when it does arrive.
// Bump VERSION when anything changes, and keep it the same as SITE.version in js/common.js.

const VERSION = 'physkit-v71';
// Written by scripts/build-quiz-bank.js: the pages that have quiz questions for their Practice tab
const QUIZ_PAGES = ['acceleration', 'atom', 'atom-history', 'background', 'black-body', 'bonding', 'brownian', 'circuits', 'colour', 'density', 'displacement', 'earth-field', 'echo', 'efficiency', 'electricity-cost', 'electrolysis', 'electromagnetism', 'em-spectrum', 'energy', 'fission', 'fluid-pressure', 'gas', 'generators', 'graph-plotter', 'grid', 'half-life', 'heat', 'infrared', 'insulation', 'levers', 'light-box', 'magnets', 'mains', 'moments', 'momentum', 'motion-graphs', 'nuclear', 'orbits', 'periodic-table', 'pinhole', 'planets', 'power', 'radiation', 'rates', 'reaction', 'reaction-profiles', 'redshift', 'resources', 'resultant-forces', 'ripple-tank', 'seismic', 'shc', 'sky', 'solid-pressure', 'solid-waves', 'sound', 'speed', 'speed-of-sound', 'springs', 'star-life', 'stars', 'states', 'static', 'stopping', 'terminal', 'third-law', 'transformers', 'uncertainty', 'units', 'uses', 'waves', 'weight', 'wire-resistance', 'work'];
const PRECACHE = [
  './',
  'index.html',
  'manifest.webmanifest',
  'terms.html',
  'privacy.html',
  'css/style.css',
  'icons/favicon.svg',
  'js/common.js',
  'js/catalogue.js',
  'js/resultant-forces.js',
  'js/third-law.js',
  'js/em-spectrum.js',
  'js/equations-data.js',
  'js/equations.js',
  'js/circuit-symbols.js',
  'js/circuits.js',
  'tools/circuits.html',
  'js/magnets.js',
  'tools/magnets.html',
  'js/energy.js',
  'tools/energy.html',
  'js/ripple-tank.js',
  'tools/ripple-tank.html',
  'js/light-box.js',
  'tools/light-box.html',
  'js/states.js',
  'tools/states.html',
  'js/gas.js',
  'tools/gas.html',
  'js/waves.js',
  'tools/waves.html',
  'js/electromagnetism.js',
  'tools/electromagnetism.html',
  'js/atom.js',
  'tools/atom.html',
  'js/atom-history.js',
  'tools/atom-history.html',
  'js/radiation.js',
  'tools/radiation.html',
  'js/half-life.js',
  'tools/half-life.html',
  'js/orbits.js',
  'tools/orbits.html',
  'js/star-life.js',
  'tools/star-life.html',
  'js/redshift.js',
  'tools/redshift.html',
  'js/motion-graphs.js',
  'tools/motion-graphs.html',
  'js/stopping.js',
  'tools/stopping.html',
  'js/springs.js',
  'tools/springs.html',
  'js/moments.js',
  'tools/moments.html',
  'js/efficiency.js',
  'tools/efficiency.html',
  'js/shc.js',
  'tools/shc.html',
  'js/acceleration.js',
  'tools/acceleration.html',
  'js/momentum.js',
  'tools/momentum.html',
  'js/weight.js',
  'tools/weight.html',
  'js/levers.js',
  'tools/levers.html',
  'js/speed.js',
  'tools/speed.html',
  'js/scope.js',
  'js/sound.js',
  'tools/sound.html',
  'js/echo.js',
  'tools/echo.html',
  'js/speed-of-sound.js',
  'tools/speed-of-sound.html',
  'js/reaction.js',
  'tools/reaction.html',
  'js/wire-resistance.js',
  'tools/wire-resistance.html',
  'js/earth-field.js',
  'tools/earth-field.html',
  'js/fluid-pressure.js',
  'tools/fluid-pressure.html',
  'js/solid-pressure.js',
  'tools/solid-pressure.html',
  'js/resolving.js',
  'js/displacement.js',
  'tools/displacement.html',
  'js/rates.js',
  'tools/rates.html',
  'js/reaction-profiles.js',
  'tools/reaction-profiles.html',
  'js/electrolysis.js',
  'tools/electrolysis.html',
  'js/black-body.js',
  'tools/black-body.html',
  'js/uncertainty.js',
  'tools/uncertainty.html',
  'js/graph-plotter.js',
  'tools/graph-plotter.html',
  'js/units.js',
  'tools/units.html',
  'js/brownian.js',
  'tools/brownian.html',
  'js/electricity-cost.js',
  'tools/electricity-cost.html',
  'js/power.js',
  'tools/power.html',
  'js/solid-waves.js',
  'tools/solid-waves.html',
  'js/generators.js',
  'tools/generators.html',
  'js/seismic.js',
  'tools/seismic.html',
  'js/colour.js',
  'tools/colour.html',
  'js/pinhole.js',
  'tools/pinhole.html',
  'js/planets.js',
  'tools/planets.html',
  'js/stars.js',
  'tools/stars.html',
  'js/infrared.js',
  'tools/infrared.html',
  'js/insulation.js',
  'tools/insulation.html',
  'js/density.js', 'js/practice.js',
  'js/terminal.js', 'js/grid.js', 'js/mains.js', 'js/heat.js', 'js/sky.js',
  'js/nuclear.js', 'js/uses.js', 'js/background.js', 'js/fission.js',
  'js/elements.js', 'js/periodic-table.js', 'js/bonding.js',
  'js/transformers.js', 'js/static.js', 'js/resources.js', 'js/work.js',
  'js/practice-core.js', 'js/practice-tab.js',
  'js/extras.js', 'js/glossary.js', 'js/spec-index-data.js', 'js/spec.js', 'tools/spec.html',
  'tools/density.html', 'tools/practice.html', 'tools/quiz.html', 'js/quiz.js', 'js/quiz-bank.js', 'js/quiz-images.js', 'js/quiz-core.js',
  'tools/terminal.html', 'tools/grid.html', 'tools/mains.html', 'tools/heat.html', 'tools/sky.html',
  'tools/nuclear.html', 'tools/uses.html', 'tools/background.html', 'tools/fission.html',
  'tools/periodic-table.html', 'tools/bonding.html',
  'tools/transformers.html', 'tools/static.html', 'tools/resources.html', 'tools/work.html',
  'tools/resultant-forces.html',
  'tools/third-law.html',
  'tools/em-spectrum.html',
  'tools/equations.html',
  'js/qrcode.min.js',
  'icons/apple-touch-icon.png',
  'js/search.js',
  'js/search-words.js',
].concat(QUIZ_PAGES.map((p) => `js/quiz-pages/${p}.js`));
// PRECACHE is the whole site. Only these few files, which every page needs, are fetched as soon as a
// new version arrives. The rest is saved as it's used, and downloaded slowly in the background by
// the page (see js/common.js), so a class of iPads opening the site after an update don't all
// download the whole site at once.
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'css/style.css', 'icons/favicon.svg', 'icons/apple-touch-icon.png', 'js/common.js', 'js/catalogue.js', 'js/extras.js', 'js/glossary.js', 'js/spec-index-data.js', 'js/search-words.js', 'js/search.js'];
// One cache that lasts from version to version, so an update never throws away the saved copies
const CACHE = 'physkit-files';
// How long to wait for the network before showing the saved copy instead
const WAIT_MS = 3000;
// The same page with a different ?s=… set-up is the same file
const keyOf = (url) => { const u = new URL(url, self.location.href); return u.origin + u.pathname; };

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => Promise.all(CORE.map((f) => fetch(f, { cache: 'no-cache' })
        .then((res) => (res.ok ? cache.put(keyOf(f), res) : null))
        .catch(() => null))))   // one file failing mustn't stop the update
      .then(() => self.skipWaiting()),
  );
});

// Up to v67 there was a separate cache for each version, and an update threw the old one away.
// Move anything saved in an old cache into the lasting one (no downloading), then remove it.
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    for (const name of await caches.keys()) {
      if (name === CACHE) continue;
      const old = await caches.open(name);
      for (const req of await old.keys()) {
        const key = keyOf(req.url);
        if (await cache.match(key)) continue;
        const res = await old.match(req);
        if (res) await cache.put(key, res);
      }
      await caches.delete(name);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  const key = keyOf(req.url);
  // 'no-cache' asks the server whether the file has changed, so updates show straight away.
  // The copy for saving is taken straight away, before the page starts reading the file.
  let saving = null;
  const network = fetch(req, { cache: 'no-cache' }).then((res) => {
    if (res.ok) { const copy = res.clone(); saving = caches.open(CACHE).then((cache) => cache.put(key, copy)); }
    return res;
  });
  // Save the new copy when it arrives, even if the saved one has already been shown
  event.waitUntil(network.then(() => saving, () => null).catch(() => null));
  event.respondWith((async () => {
    const saved = await caches.match(key);
    if (!saved) {
      try { return await network; } catch {
        return (req.mode === 'navigate' && (await caches.match(keyOf('index.html')))) || Response.error();
      }
    }
    // There's a saved copy: give the network a few seconds, then show the saved copy
    const fresh = await Promise.race([network.catch(() => null), new Promise((r) => setTimeout(r, WAIT_MS, null))]);
    return fresh && fresh.ok ? fresh : saved;
  })());
});

// The page asks which files aren't saved yet, to download them slowly in the background
self.addEventListener('message', (event) => {
  if (!event.data || event.data.type !== 'missing' || !event.ports || !event.ports[0]) return;
  event.waitUntil(caches.open(CACHE).then(async (cache) => {
    const out = [];
    for (const f of PRECACHE) if (!(await cache.match(keyOf(f)))) out.push(f);
    event.ports[0].postMessage(out);
  }));
});
