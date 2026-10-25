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

## En cours

## À faire

- Appli Android (Play Store) : copier `index.html` **et** `defi.js` dans `5-SOURCES\android\assets\`, monter `versionCode`, refaire l'AAB signé.
- Revue L99 : découper `index.html` (≈ 2 300 lignes).
- Purger un jour les anciennes clés `resonance.daily.*` / `resonance.dailyrun.*` (une par jour, jamais supprimées).

- **Appli Play Store** : en plus d'`index.html` et `defi.js`, copier **`privacy.html`** dans `5-SOURCES\android\assets\` (le lien des Réglages est relatif), monter `versionCode`, refaire l'AAB.
- **URL de politique du Play Store à vérifier** dans la Play Console : `https://resonance-jeu.github.io/privacy.html` (l'exemple du guide `aulit42369.github.io/Site/resonance/privacy.html` renvoie 404).
- Ajouter une adresse e-mail de contact publique dans `privacy.html` si souhaité.
- Mesure d'audience : rien d'installé (à décider ; option sans cookie si oui).
- Accueil : 13 modes ; un seul est mis en avant (`.mode.primary` : Tutoriel puis Campagne), à garder.

## Décisions prises
- 25/10 : contact = page « Issues » du dépôt GitHub ; CGU et mentions légales dans `privacy.html` (URL déjà connue du Play Store).

- 24/10 : le jour du défi change à minuit **heure de Paris** pour tout le monde (Q1, option sûre appliquée).
- 24/10 : texte partagé traduit dans la langue du joueur (Q4) ; nom, `#n`, emoji et URL non traduits.
- 24/10 : les 6 niveaux sont groupés par 2 sur 3 lignes dans le texte partagé (le module commun limite la grille à 5 lignes).
- 24/10 : les clés de record existantes (`resonance.daily.*`) sont gardées, aucune migration.
- 24/10 : score et série restent comptés pour le jour du lancement ; seul le compte à rebours suit le jour réel.
