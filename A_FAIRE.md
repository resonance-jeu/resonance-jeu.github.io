# À faire — Résonance

## Fait

- **24/10** — Défi du jour unifié (idée 14) : module commun `defi.js` (même fichier que ÉCHO, LUMEN, Fragments),
  jour qui change à minuit heure de Paris, graine `Defi.seed('resonance', jour, niveau)`, numéro `#n`, série de jours
  consécutifs (picto flamme), écran de fin avec aperçu, « Partager le résultat » (partage natif, puis copie, puis texte à copier),
  « Prochain défi dans … », textes dans les 6 langues. `VERSION` 5 → 6, cache `resonance-1.2.0`. Tests `node --test` (16 verts).
- **24/10** — Correctif relecture : « Prochain défi dans … » calculé sur le jour réel (`Defi.today()`), plus sur le jour figé du défi
  (un défi lancé à 23 h 58 et fini après minuit affichait « 0 h 00 »). Test de non-régression ajouté.
- **24/10** — Création de `ARCHITECTURE.md`, `A_FAIRE.md`, `PIEGES.md`, README complété.

## En cours

## À faire

- Appli Android (Play Store) : copier `index.html` **et** `defi.js` dans `5-SOURCES\android\assets\`, monter `versionCode`, refaire l'AAB signé.
- Revue L99 : découper `index.html` (≈ 2 300 lignes).
- Purger un jour les anciennes clés `resonance.daily.*` / `resonance.dailyrun.*` (une par jour, jamais supprimées).

## Décisions prises

- 24/10 : le jour du défi change à minuit **heure de Paris** pour tout le monde (Q1, option sûre appliquée).
- 24/10 : texte partagé traduit dans la langue du joueur (Q4) ; nom, `#n`, emoji et URL non traduits.
- 24/10 : les 6 niveaux sont groupés par 2 sur 3 lignes dans le texte partagé (le module commun limite la grille à 5 lignes).
- 24/10 : les clés de record existantes (`resonance.daily.*`) sont gardées, aucune migration.
- 24/10 : score et série restent comptés pour le jour du lancement ; seul le compte à rebours suit le jour réel.
