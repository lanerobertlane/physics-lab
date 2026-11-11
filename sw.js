// Offline support: keeps a copy of the site so it still works if school Wi-Fi drops.
// Network first (so updates show straight away), falling back to the saved copy.
// Bump VERSION when anything changes, and keep it the same as SITE.version in js/common.js.

const VERSION = 'physkit-v57';
// Written by scripts/build-quiz-bank.js: the pages that have quiz questions for their Practice tab
const QUIZ_PAGES = ['acceleration', 'atom', 'atom-history', 'background', 'bonding', 'circuits', 'density', 'displacement', 'earth-field', 'echo', 'efficiency', 'electromagnetism', 'em-spectrum', 'energy', 'fission', 'fluid-pressure', 'gas', 'grid', 'half-life', 'heat', 'infrared', 'insulation', 'levers', 'light-box', 'magnets', 'mains', 'moments', 'momentum', 'motion-graphs', 'nuclear', 'orbits', 'periodic-table', 'radiation', 'reaction', 'redshift', 'resources', 'resultant-forces', 'ripple-tank', 'shc', 'sky', 'solid-pressure', 'sound', 'speed', 'speed-of-sound', 'springs', 'star-life', 'states', 'static', 'stopping', 'terminal', 'third-law', 'transformers', 'uses', 'waves', 'weight', 'wire-resistance', 'work'];
const PRECACHE = [
  './',
  'index.html',
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
].concat(QUIZ_PAGES.map((p) => `js/quiz-pages/${p}.js`));

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    // 'no-cache' asks the server whether the file has changed, so updates show straight away.
    fetch(req, { cache: 'no-cache' })
      .then((res) => {
        const copy = res.clone();
        if (res.ok) caches.open(VERSION).then((cache) => cache.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match('index.html'))),
  );
});
