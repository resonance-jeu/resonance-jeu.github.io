# Résonance — TRD (exigences techniques)

## Pile
- HTML + CSS + JavaScript classique (scripts sans `import`, portée globale partagée), **aucune dépendance npm**, aucun outil de construction.
- Rendu : un `<canvas>` plein écran (ondes, nœuds, obstacles) sous un HUD HTML fin ; menus et écrans en calques HTML `position: fixed`.
- Sons : WebAudio synthétisé. Polices locales (Unbounded, IBM Plex Mono).
- Ordre de chargement imposé : `defi.js` → `share-card.js` → `js/moteur.js` → `js/i18n.js` → `js/i18n/*.js` → `js/puzzles.js` → `js/socle.js` → … → `js/demarrage.js` (toujours dernier).

## PWA
- Hébergement : GitHub Pages, `https://resonance-jeu.github.io/` (organisation dédiée).
- `sw.js` : constante `VERSION` (`resonance-1.3.6` au 28/10/2026) ; les CSS/JS sont demandés en `?v=<VERSION>` (même valeur dans `index.html`, vérifiée par `tests/page.test.js`) ; ne purge que les caches `resonance-*`.
- Manifest `resonance.webmanifest`, `id: "/"` : ne jamais le changer.
- CSP en balise meta : `script-src 'self'` + empreintes `sha256` des deux scripts en ligne (enregistrement du service worker, compteur GoatCounter) + `https://gc.zgo.at` ; `connect-src`/`img-src` + `https://aulit42369.goatcounter.com`. Modifier un de ces scripts = recalculer son empreinte.

## Traceurs (28/10/2026)
- Aucun cookie. Seul traceur : **GoatCounter**, mesure d'audience sans cookie (compte `aulit42369.goatcounter.com`, le même que le Site et la vitrine de La Cabane), chemins préfixés `/resonance/…` (option `path`) pour distinguer le jeu dans le tableau de bord.
- Script d'une ligne en fin de `index.html` : charge `count.v4.js` (version figée + SRI `sha384`, comme le Site) **seulement** si `location.hostname` se termine par `github.io` (jamais dans une appli Android, une WebView, `file://` ni en local) et si `localStorage.skipgc` ≠ `'t'`. L'appli Android embarque une copie de `index.html` (WebView `file:///android_asset/`) : la garde `github.io` l'empêche de compter, elle ne doit jamais être retirée.
- CSP : empreinte `sha256` de ce script + `https://gc.zgo.at` dans `script-src`, `https://aulit42369.goatcounter.com` dans `connect-src` et `img-src`. Modifier le script = recalculer l'empreinte (`tests/statistiques.test.js` échoue sinon).
- Le SW ignore les requêtes d'autres origines : `count.js` et les envois ne sont jamais mis en cache.
- Opposition : bouton « Ne pas être compté » de `privacy.html` (toutes les langues), clé locale `skipgc` ; bouton masqué hors `github.io`.

## Android
- Appli **WebView** (Java, sans Gradle) qui embarque une copie de la PWA : `F:\Stream\files\JEUX\Resonance-PlayStore-1.1.0` (hors de ce dépôt).
- Version prête : 1.3.0 (code 4) ; pont `AndroidShare.shareImage` limité à une image PNG, `ImageProvider` maison, liens web ouverts dans le navigateur.
- À chaque version : copier `index.html`, `defi.js`, `privacy.html`, `share-card.js`, `css/`, `js/` (avec `js/i18n/`), `fonts/` dans `assets\` et retirer les `?v=`.

## Contraintes
- `defi.js` identique octet pour octet dans les 4 jeux (empreinte vérifiée) et toujours premier `<script>` (sans `?v=`).
- JSON-LD en fin de `<body>`.
- Accessibilité : `<main>` autour du canvas et des calques de jeu, un seul `<h1>` (menu), libellés `data-ia` traduits, palette daltonienne, couleur `dust` ≥ 4,5:1.
- Plein écran : tous les calques sont `position: fixed` ; pas de pied de page (il passerait sous le canvas plein écran) : le lien `privacy.html` est dans les Réglages.
- Tests : `node --test` à la racine (Node 24 ; jamais `node --test tests/`). `tests/outils-page.js` = faux navigateur, pas de rendu réel.
