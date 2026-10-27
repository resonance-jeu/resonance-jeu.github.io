# À faire — Résonance

## Fait

- **24/10** — Défi du jour unifié (idée 14) : module commun `defi.js` (même fichier que ÉCHO, LUMEN, Fragments),
  jour qui change à minuit heure de Paris, graine `Defi.seed('resonance', jour, niveau)`, numéro `#n`, série de jours
  consécutifs (picto flamme), écran de fin avec aperçu, « Partager le résultat » (partage natif, puis copie, puis texte à copier),
  « Prochain défi dans … », textes dans les 6 langues. `VERSION` 5 → 6, cache `resonance-1.2.0`. Tests `node --test` (16 verts).
- **24/10** — Correctif relecture : « Prochain défi dans … » calculé sur le jour réel (`Defi.today()`), plus sur le jour figé du défi
  (un défi lancé à 23 h 58 et fini après minuit affichait « 0 h 00 »). Test de non-régression ajouté.
- **24/10** — Création de `ARCHITECTURE.md`, `A_FAIRE.md`, `PIEGES.md`, README complété.

- **25/10** — Checklist « avant lancement » : `privacy.html` complétée dans les 6 langues (version web, cookies, partage, conditions d'utilisation, mentions légales, contact = tickets GitHub au lieu de `[TON E-MAIL DE CONTACT]`), lien dans les Réglages (clé `legal`), `<title>` remis dans `<head>` + Open Graph + `og-image.png` 1200×630 + préchargement de la police titre, `404.html`, `robots.txt` + `sitemap.xml`, couleurs `dust` des thèmes Abysse/Braise/Lichen/Papier au contraste AA, correctif SW (une navigation vers `privacy.html` ou une 404 n'écrase plus la copie hors ligne du jeu), cache `resonance-1.2.1`.
- **25/10** — Appli Android reconstruite : **1.2.0 (code 3)**, AAB signé avec la clé d'importation d'origine (empreinte vérifiée) dans `F:\Stream\files\JEUX\Resonance-PlayStore-1.1.0\Resonance-PlayStore-1.1.0\1-A-ENVOYER-SUR-PLAY\Resonance-1.2.0.aab` ; `assets/` = `index.html`, `defi.js`, `privacy.html` du 25/10. Reste : envoi sur la Play Console.
- **25/10** — Titre « Résonance » du menu : il débordait à droite sur téléphone (15vw, ≈ 6,9× la taille de police). Ramené à `clamp(34px,12vw,92px)` pour le seul `<h1>`, mesuré dans Chrome de 320 à 768 px : tient partout. `VERSION` `resonance-1.2.3`.
- **25/10** — Passe SEO éditoriale (requête « jeu de réflexion gratuit ») : `<title>`, description, Open Graph alignés ; un seul `<h1>` (le sur-titre traduit `kicker`, devenu « Jeu de réflexion gratuit · ondes » dans les 6 langues, est placé dans le `<h1>` du menu ; les 4 autres titres d'écran passent en `<h2 class="big">`, même rendu) ; paragraphe `<noscript>` ; données structurées `VideoGame` en fin de `<body>` ; `VERSION` `resonance-1.2.2`. L'appli Android embarque ces fichiers : reportés dans la 1.2.0 (25/10).

- **25/10** — Lot 4 : bouton « Partager l'image » sur l'écran de fin du Défi du jour : carte 1080×1920 (logo, ondes croisées, « Défi du jour #N », score, grille des 6 niveaux, série, URL) aux couleurs de la palette active, préparée dès l'écran de fin ; module `share-card.js` (pont Android, sinon partage natif avec fichier, sinon téléchargement ; si le pont échoue, repli sur le partage du texte). Lot 6 : carte « Les autres jeux d'Aulit » dans le menu (ÉCHO, LUMEN, Fragments ; constante `AUTRES_JEUX`), 6 langues. Lot 5 (avis dans l'appli) non fait : voir Décisions. Cache `resonance-1.3.0`, tests 23 verts.
- **25/10** — Appli Android **1.3.0 (code 4)** : pont de partage d'image + `ImageProvider`, liens web ouverts dans le navigateur, correctif du build Windows (les polices étaient perdues dans la 1.2.0 : `assets/fonts_…`). La 1.2.0 jamais publiée est supprimée.
- **25/10** — Lot 18 : refactorisation pure de `index.html` (2 408 → 206 lignes) en `css/` (2 fichiers) et `js/` (15 fichiers, le plus gros 244 lignes), sans changement de comportement, de textes, de clés de sauvegarde ni d'id du manifest. Tests ajoutés d'abord (`tests/page.test.js` : chargement sans erreur, parcours des 13 modes, 6 langues, clés i18n, empreintes des niveaux, clés localStorage, fichiers du SW) ; état complet de la page comparé à l'original à chaque étape : identique. Cache `resonance-1.3.1`. Appli Android 1.3.0 (code 4) reconstruite avec les nouveaux fichiers.
- **25/10** — Suite du lot 18 : texte `score` ajouté dans les 6 langues (même mot que `sc_score` : Score, Puntos, Punkte, Punti, Pontos ; la carte image affichait « score »), exception du test retirée. CSS/JS demandés en `?v=<VERSION>` (même valeur que la version du cache, vérifiée par un test ; SW simulé hors ligne sur ces URL), cache `resonance-1.3.2`. Appli 1.3.0 (code 4) reconstruite (`?v=` retirés de `assets/index.html`).

- **25/10** — Contact **aulit42369@gmail.com** dans `privacy.html` (6 langues, lien `mailto:`, tickets GitHub en second), dans `4-FICHE-PLAY-STOREprivacy-policy.html` (remplace `[TON E-MAIL DE CONTACT]`) et en fin des 6 `full-description.txt`. Cache `resonance-1.3.3` (et `?v=` de `index.html`). Appli 1.3.0 (code 4) reconstruite avec la nouvelle `privacy.html` (empreinte SHA-256 du certificat vérifiée, 32 assets dont 10 polices, aucun `?v=`).
- **26/10** : politique conforme LCEN/RGPD : mentions légales complètes (éditeur et directeur de la publication Aulit42369, personne physique non professionnelle anonyme, identité communiquée à l'hébergeur ; GitHub, Inc. avec adresse, téléphone, page de contact), transferts hors UE (DPF / clauses types) dans « Hébergement », contact et réclamation CNIL dans « Vos droits », ajout des rubriques « Enfants » et « Tes droits », 6 langues, le français fait foi. Cache et `?v=` `resonance-1.3.4`.
- **28/10** : accessibilité : tout le jeu (canvas, HUD, menus, écrans) enveloppé dans `<main>` (comme Fragments), rendu et comportement identiques (positions comparées avant/après dans Chromium sans tête, 0 erreur console) ; script en ligne inchangé donc empreinte CSP inchangée ; pas de pied de page. Cache et `?v=` `resonance-1.3.5`. Docs de cadrage créées dans `docs/`. Appli Android : reporter `index.html` à la prochaine version.

## En cours

## À faire
- Appli Android : recopier le nouveau `privacy.html` dans `assets\` à la prochaine version ; vérifier la fiche « Sécurité des données » de la Play Console.

- Appli 1.3.0 : tester sur téléphone (partage de l'image vers une appli, lien d'un autre jeu qui ouvre le navigateur, polices du jeu, retour depuis la Confidentialité, un mode de chaque type depuis le découpage du lot 18), puis envoyer `Resonance-1.3.0.aab` sur la Play Console. À chaque mise à jour : copier `index.html`, `defi.js`, `privacy.html`, `share-card.js`, `css/`, `js/` (avec `js/i18n/`) et `fonts/` dans `5-SOURCES\android\assets\`, retirer les `?v=` de `assets\index.html` (commande dans le GUIDE), monter `versionCode`.
- Quand ÉCHO / LUMEN / Fragments seront sur le Play Store : remplacer les liens de `AUTRES_JEUX`.
- Purger un jour les anciennes clés `resonance.daily.*` / `resonance.dailyrun.*` (une par jour, jamais supprimées).

- **URL de politique du Play Store à vérifier** dans la Play Console : `https://resonance-jeu.github.io/privacy.html` (l'exemple du guide `aulit42369.github.io/Site/resonance/privacy.html` renvoie 404).
- Mesure d'audience : rien d'installé (à décider ; option sans cookie si oui).
- Accueil : 13 modes ; un seul est mis en avant (`.mode.primary` : Tutoriel puis Campagne), à garder.

## Décisions prises
- 25/10 : pas d'avis dans l'appli (In-App Review) : il faut la bibliothèque Play Core, impossible simplement sans Gradle. Alternative possible, non faite : un bouton qui ouvre la fiche Play Store.
- 25/10 : FileProvider d'AndroidX remplacé par `ImageProvider` (≈ 60 lignes, un seul fichier fixe) : pas d'AndroidX sans Gradle, donc pas de `res/xml` de chemins.
- 25/10 (décision d'Olivier) : contact public = **aulit42369@gmail.com** (lien `mailto:` dans `privacy.html`, toutes les langues), les tickets GitHub restent proposés en second. CGU et mentions légales dans `privacy.html` (URL déjà connue du Play Store).

- 24/10 : le jour du défi change à minuit **heure de Paris** pour tout le monde (Q1, option sûre appliquée).
- 24/10 : texte partagé traduit dans la langue du joueur (Q4) ; nom, `#n`, emoji et URL non traduits.
- 24/10 : les 6 niveaux sont groupés par 2 sur 3 lignes dans le texte partagé (le module commun limite la grille à 5 lignes).
- 24/10 : les clés de record existantes (`resonance.daily.*`) sont gardées, aucune migration.
- 24/10 : score et série restent comptés pour le jour du lancement ; seul le compte à rebours suit le jour réel.
