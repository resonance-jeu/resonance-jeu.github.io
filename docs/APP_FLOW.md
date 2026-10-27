# Résonance — parcours (écran par écran)

Tout le jeu est dans le `<main>` de `index.html` : un canvas plein écran et des calques HTML (`.overlay`, HUD, bandeaux) affichés ou masqués par `hidden`.

1. **Écran d'entrée** (`#splash`) : titre animé « Résonance », toucher pour entrer (démarre l'audio).
2. **Menu** (`#menu`) : sur-titre + titre (`<h1>`), règle en une phrase, grille des 13 modes (le mode mis en avant : Tutoriel puis Campagne),
   palettes (points cumulés), « Les autres jeux d'Aulit », liens Succès et Réglages. Une démo d'ondes tourne derrière.
3. **Campagne** (`#campView`) : mondes et niveaux avec étoiles → partie.
4. **Partie** : canvas + HUD (bouton menu, niveau, impulsions restantes, score) ; bouton Gel selon le mode ; conseils (`#tip`), bandeau, toasts.
   - **Duel** : deux HUD tête-bêche (`#duelTop`, `#duelBot`).
   - **Éditeur** : barre d'outils (`#edTop`, `#edTools`), nombre d'impulsions, Tester, Code.
5. **Fin** (`#end`) : titre, message, boutons selon le mode (Rejouer, Suivant, Menu…) ; pour le Défi du jour : aperçu, série,
   « Partager le résultat », « Partager l'image », « Prochain défi dans … », zone de texte à copier en dernier recours.
6. **Réglages** (`#setView`) : langue (6), son, vibrations, vitesse, mode daltonien, lien Confidentialité → `privacy.html`, Retour.
7. **Statistiques et succès** (`#statsView`) → Retour.
8. **Retour Android** : `window.resonanceBack` ramène au menu.
9. **Pages annexes** : `privacy.html` (6 langues), `404.html`.
