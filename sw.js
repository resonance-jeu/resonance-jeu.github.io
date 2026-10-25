// Service worker de Résonance : met tout le jeu en cache pour qu'il fonctionne hors ligne.
// Change VERSION à chaque mise à jour du jeu pour que les joueurs reçoivent la nouvelle version.
const VERSION = 'resonance-1.2.0';
const FILES = [
  "./",
  "index.html",
  "defi.js",
  "resonance.webmanifest",
  "privacy.html",
  "icons/apple-touch-icon.png",
  "icons/favicon-48.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "fonts/ibm-plex-mono-latin-400-normal.woff2",
  "fonts/ibm-plex-mono-latin-500-normal.woff2",
  "fonts/ibm-plex-mono-latin-ext-400-normal.woff2",
  "fonts/ibm-plex-mono-latin-ext-500-normal.woff2",
  "fonts/unbounded-latin-400-normal.woff2",
  "fonts/unbounded-latin-700-normal.woff2",
  "fonts/unbounded-latin-900-normal.woff2",
  "fonts/unbounded-latin-ext-400-normal.woff2",
  "fonts/unbounded-latin-ext-700-normal.woff2",
  "fonts/unbounded-latin-ext-900-normal.woff2"
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('resonance-') && k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// cache d'abord (jeu hors ligne), puis réseau ; la page elle-même passe par le réseau quand il est là, pour récupérer les mises à jour
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === 'navigate' || new URL(req.url).pathname.endsWith('.webmanifest')) {
    e.respondWith(
      fetch(req).then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req.mode === 'navigate' ? './' : req, copy)); return res; })
        .catch(() => caches.match(req.mode === 'navigate' ? './' : req).then(r => r || caches.match('index.html')))
    );
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
