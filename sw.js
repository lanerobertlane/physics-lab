// Offline support: keeps a copy of the site so it still works if school Wi-Fi drops.
// Network first (so updates show straight away), falling back to the saved copy.
// Bump VERSION when adding new files to PRECACHE.

const VERSION = 'physkit-v6';
const PRECACHE = [
  './',
  'index.html',
  'css/style.css',
  'icons/favicon.svg',
  'js/common.js',
  'js/catalogue.js',
  'js/resultant-forces.js',
  'js/third-law.js',
  'js/em-spectrum.js',
  'js/equations-data.js',
  'js/equations.js',
  'js/circuits.js',
  'tools/circuits.html',
  'tools/resultant-forces.html',
  'tools/third-law.html',
  'tools/em-spectrum.html',
  'tools/equations.html',
];

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
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        if (res.ok) caches.open(VERSION).then((cache) => cache.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match('index.html'))),
  );
});
