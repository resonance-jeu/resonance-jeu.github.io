# Résonance — brief de design (identité réelle)

## Direction
Ondes concentriques sur fond d'encre chaude, nœuds safran qui s'allument. Interface sobre en mono, gros titre « Réso**nance** »
(seconde moitié en italique/accent). HUD fin pour laisser la place au canvas.

## Couleurs (`css/jeu.css`, `:root`, palette « Seiche » par défaut)
| Rôle | Valeur |
|---|---|
| Fond | `--ink` #13100e |
| Texte | `--bone` #efe3cf ; secondaire `--dust` #8a7d6c (≥ 4,5:1 vérifié par thème) |
| Accent | `--saffron` #f2a541 (nœuds, mode mis en avant) |
| Second accent | `--rose` #d9776b ; joueur 2 (Duel) `--p2` #6fc2c0 |

Autres palettes déblocables par points cumulés (dont Abysse, Braise, Lichen, Papier) dans `THEMES` de `js/socle.js`.

## Typographie
- Titres : **Unbounded** (900 pour le titre, fichiers locaux, latin + latin étendu).
- Texte, chiffres, boutons : **IBM Plex Mono** 400/500 (fichiers locaux).

## Formes et mouvement
Cartes de mode à bords arrondis (bordure fine, mode principal plein safran), ondes animées au canvas, démo animée derrière le menu.
Carte de partage 1080×1920 (logo, ondes croisées, grille des 6 niveaux) aux couleurs de la palette active.

## Accessibilité
Mode daltonien (réglage `cb`), libellés traduits sur les boutons-icônes (`data-ia`), statut de partage annoncé (`role="status"`),
`<main>` + un seul `<h1>`.
