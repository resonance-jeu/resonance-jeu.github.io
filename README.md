# Résonance

Jeu d'ondes tactile (PWA hors ligne, 6 langues), publié sur https://resonance-jeu.github.io/ et sur le Play Store
(appli Android WebView qui embarque une copie de la PWA, dans `F:\Stream\files\JEUX\Resonance-PlayStore-1.1.0`).

## Fichiers

- `index.html` : tout le jeu (moteur, modes, textes `I18N`, interface).
- `defi.js` : module commun du Défi du jour (copie identique dans ÉCHO, LUMEN, Fragments et Résonance).
- `sw.js` : service worker (cache hors ligne). **Changer `VERSION` à chaque mise à jour.**
- `resonance.webmanifest`, `icons/`, `fonts/`, `privacy.html`.
- `tests/` : tests automatiques.

## Tests

À la racine du dépôt (Node 24, aucune dépendance) :

```
node --test
```

Ne pas écrire `node --test tests/` (échoue sous Node 24).

## Défi du jour

6 niveaux identiques pour tout le monde, qui changent à **minuit heure de Paris**. Numéro `#n` commun aux 4 jeux
(#1 = 01/10/2026). Série de jours consécutifs (`resonance.defi.v1`), partage : partage natif du téléphone,
sinon copie, sinon texte à copier à la main.
