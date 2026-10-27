# Résonance — plan de mise en œuvre

## État au 28/10/2026
- PWA en ligne (cache `resonance-1.3.5`), 34 tests `node --test` verts.
- Fait : Défi du jour commun, partage texte + image, 6 langues, autres jeux, lot 18 (découpage de `index.html`),
  `?v=` sur les CSS/JS, politique LCEN/RGPD, CSP, `<main>` autour du jeu (28/10).
- Android 1.3.0 (code 4) construite, pas encore envoyée sur la Play Console.

## Prochaines étapes (d'après `A_FAIRE.md`)
1. Tester l'appli 1.3.0 sur téléphone (partage de l'image, lien d'un autre jeu, polices, retour depuis la Confidentialité, un mode de chaque type), puis envoyer `Resonance-1.3.0.aab`.
2. À la prochaine version Android : recopier les fichiers web dans `assets\` (dont `privacy.html` et `index.html` avec `<main>`), retirer les `?v=`, monter `versionCode`.
3. Vérifier dans la Play Console l'URL de politique `https://resonance-jeu.github.io/privacy.html` et la fiche « Sécurité des données ».
4. Remplacer les liens de `AUTRES_JEUX` par les liens Play Store quand les autres jeux seront publiés.
5. Purger un jour les anciennes clés `resonance.daily.*` / `resonance.dailyrun.*`.

## Décisions en attente (Olivier)
- Mesure d'audience : rien d'installé (option sans cookie si oui).
- Bouton « Noter sur le Play Store » à la place d'un avis dans l'appli : proposé, non fait.
