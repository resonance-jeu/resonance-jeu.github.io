// Service worker de Résonance : met tout le jeu en cache pour qu'il fonctionne hors ligne.
// Change VERSION à chaque mise à jour du jeu pour que les joueurs reçoivent la nouvelle version.
const VERSION = 'resonance-1.3.3';
// Code du jeu : index.html le demande avec ?v=<VERSION> (même valeur, vérifiée par tests/page.test.js), pour qu'une page
// nouvelle ne tourne jamais avec d'anciens scripts restés en cache. À chaque version : changer VERSION ici ET les ?v= de index.html.
const CODE = [
  "share-card.js",
  "css/polices.css",
  "css/jeu.css",
  "js/moteur.js",
  "js/i18n.js",
  "js/i18n/fr.js",
  "js/i18n/en.js",
  "js/i18n/es.js",
  "js/i18n/de.js",
  "js/i18n/it.js",
  "js/i18n/pt.js",
  "js/puzzles.js",
  "js/socle.js",
  "js/niveaux.js",
  "js/partie.js",
  "js/fins.js",
  "js/ecrans.js",
  "js/rendu.js",
  "js/demarrage.js"
];
const FILES = [
  "./",
  "index.html",
  "defi.js",
  ...CODE.map(f => f + '?v=' + VERSION),
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

// cache d'abord (jeu hors ligne), puis réseau ; la page elle-même passe par le réseau quand il est là, pour récupérer les mises à jour.
// Seule une vraie page du jeu (200, racine ou index.html) remplace la copie hors ligne './' : ni privacy.html ni une 404 ne doivent l'écraser.
self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  if (req.mode === 'navigate' || url.pathname.endsWith('.webmanifest')) {
    const jeu = req.mode === 'navigate' && (url.pathname.endsWith('/') || url.pathname.endsWith('/index.html'));
    const cle = jeu ? './' : req;
    e.respondWith(
      fetch(req).then(res => { if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(cle, copy)); } return res; })
        .catch(() => caches.match(cle, { ignoreSearch: true }).then(r => r || caches.match('./')))
    );
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
