# Résonance — schéma des données

**Aucun serveur, aucune base de données, aucun compte.** Tout est stocké sur l'appareil du joueur (localStorage du navigateur,
ou de la WebView de l'appli Android). Aucun appel réseau en dehors du chargement des fichiers du site.

## Stockage local (localStorage)
| Clé | Contenu | Écrit par |
|---|---|---|
| `resonance.settings` | Réglages (langue, son, vibrations, vitesse, daltonien) | `js/ecrans.js` |
| `resonance.theme`, `resonance.total` | Palette choisie, points cumulés (déblocage des palettes) | `js/demarrage.js` |
| `resonance.best`, `.chrono`, `.surv`, `.rhythm`, `.melody`, `.coop`, `.zen`, `.puzzle`, `.tuto` | Records et progression par mode | `js/ecrans.js`, `js/partie.js` |
| `resonance.camp` | Étoiles de la campagne | `js/partie.js` |
| `resonance.draft` | Brouillon de l'Éditeur | `js/ecrans.js` |
| `resonance.stats`, `resonance.ach` | Statistiques et succès | `js/socle.js` |
| `resonance.daily.AAAA-MM-JJ` | Meilleur score du défi de ce jour (date de Paris) | `js/fins.js` (lu par `js/ecrans.js`) |
| `resonance.dailyrun.AAAA-MM-JJ` | Rejeu du meilleur défi `{v: VERSION, …}` (masqué si la génération change) | `js/fins.js` |
| `resonance.defi.v1` | Série du défi `{last, count, best, jours}` (30 jours) | `defi.js` |

La liste exacte des clés est contrôlée par `tests/page.test.js`. Les clés `resonance.daily.*` / `dailyrun.*` (une par jour) ne sont jamais purgées.

## Données fixes
- `js/puzzles.js` : puzzles fixes ; campagne `WORLDS`, `TUTO`, palettes `THEMES` dans `js/socle.js` (empreintes vérifiées par les tests).
- Textes : `js/i18n/<langue>.js` (fr, en, es, de, it, pt).

## Cache hors ligne
Cache du service worker `resonance-1.3.5` : copie des fichiers du site, aucune donnée de joueur.

## Données partagées
Texte et image du Défi du jour, envoyés seulement quand le joueur appuie sur « Partager » (numéro, score, grille, série, lien fixe).
Code de niveau de l'Éditeur : copié par le joueur lui-même.
