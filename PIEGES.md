# Pièges — Résonance

- **Version du cache** : toute modification de `index.html`, d'un fichier `css/`, `js/` ou de `defi.js` doit s'accompagner d'un changement de `VERSION` dans `sw.js`,
  sinon les joueurs installés gardent l'ancienne version. Tout nouveau fichier va aussi dans `FILES`.
- **`defi.js` est commun aux 4 jeux** : ne jamais le modifier ici seul. Modifier les 4 copies ensemble puis mettre à jour
  la constante `EMPREINTE` de `tests/defi.test.js` dans les 4 dépôts.
- **`VERSION` de `index.html`** (pas celle du SW) : à monter quand la génération des niveaux du défi change, sinon le rejeu
  enregistré ne correspond plus aux niveaux.
- **Jour de déploiement** : le défi du jour change de niveaux le jour où une nouvelle génération est publiée (le record du jour reste).
- **Jour figé vs jour réel** : `S.defi` garde le jour du lancement (score, série, rejeu). Tout ce qui parle du *prochain* défi
  (compte à rebours) doit utiliser `Defi.today()`, sinon une partie finie après minuit affiche « 0 h 00 ».
- **URL de partage fixe** : dans l'appli Android (WebView `file:///android_asset/`), `location.href` donnerait un lien `file://`.
- **Appli Android** : elle embarque une copie de la PWA ; copier **tous** les fichiers web (`index.html`, `defi.js`, `share-card.js`, `privacy.html`, `css/`, `js/` avec `js/i18n/`, `fonts/`), sinon le jeu ne démarre pas.
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
- **Découpage du jeu (lot 18, 25/10)** : les scripts de `js/` sont des scripts classiques qui partagent leurs noms globaux. L'**ordre des balises compte** :
  un code exécuté au chargement (hors fonction) ne voit que les fichiers chargés avant lui. Tout appel d'initialisation va dans `js/demarrage.js` (le dernier).
  Ne jamais déclarer deux fois le même nom de premier niveau dans deux fichiers (erreur « already been declared », la page ne démarre plus),
  ne pas nommer une fonction globale `onload`, `onresize`… (elle deviendrait un gestionnaire de `window`), ni une variable `top`, `name`, `status`.
- **Nouveau fichier CSS/JS** : l'ajouter dans `index.html`, dans `FILES` de `sw.js` (le test `page.test.js` le vérifie) et dans `assets\` de l'appli Android.
- **CSS dans `css/`** : les chemins des polices sont relatifs à la feuille (`url(../fonts/…)`), pas à la page.
- **Mélange de versions après une mise à jour** : le SW sert les CSS/JS depuis son cache, la page `index.html` depuis le réseau. Pendant la
  visite qui installe la nouvelle version, une page nouvelle peut tourner avec les anciens scripts (jusqu'au rechargement suivant). Sans
  conséquence tant qu'une mise à jour ne renomme pas un id HTML utilisé par les scripts ; sinon prévoir un paramètre de version dans les `src`.
- **Tests de la page** : `tests/outils-page.js` est un faux navigateur minimal (pas de rendu réel). Le test `t('score')` est un écart connu
  exclu (voir `A_FAIRE.md`).
