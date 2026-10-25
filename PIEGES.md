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
