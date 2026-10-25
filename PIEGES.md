# Pièges — Résonance

- **Version du cache** : toute modification de `index.html` ou `defi.js` doit s'accompagner d'un changement de `VERSION` dans `sw.js`,
  sinon les joueurs installés gardent l'ancienne version. Tout nouveau fichier va aussi dans `FILES`.
- **`defi.js` est commun aux 4 jeux** : ne jamais le modifier ici seul. Modifier les 4 copies ensemble puis mettre à jour
  la constante `EMPREINTE` de `tests/defi.test.js` dans les 4 dépôts.
- **`VERSION` de `index.html`** (pas celle du SW) : à monter quand la génération des niveaux du défi change, sinon le rejeu
  enregistré ne correspond plus aux niveaux.
- **Jour de déploiement** : le défi du jour change de niveaux le jour où une nouvelle génération est publiée (le record du jour reste).
- **Jour figé vs jour réel** : `S.defi` garde le jour du lancement (score, série, rejeu). Tout ce qui parle du *prochain* défi
  (compte à rebours) doit utiliser `Defi.today()`, sinon une partie finie après minuit affiche « 0 h 00 ».
- **URL de partage fixe** : dans l'appli Android (WebView `file:///android_asset/`), `location.href` donnerait un lien `file://`.
- **Appli Android** : elle embarque une copie de la PWA ; penser à copier `defi.js` en plus d'`index.html`, sinon le jeu ne démarre pas.
- **`404.html` est servie à n'importe quelle profondeur** (`/a/b/c`) : tous ses liens, polices et icônes en chemin absolu (`/…`), jamais relatif. Elle n'est pas mise en cache par le SW.
- **Aperçus de liens** : `og:image` doit rester une URL absolue (`https://resonance-jeu.github.io/og-image.png`) ; après modification de l'image, Facebook/Discord gardent l'ancienne en cache plusieurs jours.
- **Lien des Réglages vers `privacy.html` relatif** : dans l'appli Android, `privacy.html` doit être copié dans `assets\` avec `index.html` et `defi.js`.
- **Couleur `dust` des thèmes** : texte secondaire, garder ≥ 4,5:1 sur l'`ink` du thème (vérifié le 25/10).
- **`node --test tests/`** échoue sous Node 24 : lancer `node --test` à la racine.
- **`id` du manifest** (`/`) : ne jamais le modifier (Chrome ne le met pas à jour après installation).
- **JSON-LD en fin de `<body>`** (25/10) : `tests/defi.test.js` exige que `defi.js` soit le **premier** `<script>` de `index.html` ; un bloc `application/ld+json` dans le `<head>` fait échouer le test.

- **Fichier `google9ad7f8bd44912903.html` (25/10)** : validation Google Search Console (propriété + sitemap envoyé). Ne jamais le supprimer ni le renommer, sinon la propriété perd sa validation.
- **Carte image (25/10)** : `share-card.js` doit être dans `FILES` de `sw.js` **et** copié dans `assets\` de l'appli Android. La carte est préparée dès l'écran de fin : le partage natif exige un geste récent du joueur, ne pas la générer seulement au clic.
- **Pont `AndroidShare`** : limité au partage d'une image PNG (en-tête PNG vérifié, nom de fichier fixe, texte coupé à 1 000 caractères). Ne jamais y ajouter d'accès fichier générique : toute page chargée dans la WebView peut l'appeler.
- **Liens externes dans l'appli** : `shouldOverrideUrlLoading` ne garde que `file:///android_asset/` ; un lien http(s) touché s'ouvre dans le navigateur, le reste est bloqué.
- **Build Android sous Windows** : ne pas remettre `aapt2 link -A assets` : `aapt2.exe` écrit `assets/fonts\x.woff2` et `unzip` en fait `assets/fonts_x.woff2` (polices perdues dans la 1.2.0). Vérifier après build : `unzip -Z1 <apk> | grep assets/fonts/`.
