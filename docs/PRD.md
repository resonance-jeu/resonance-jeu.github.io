# Résonance — PRD (cahier des charges produit)

Rédigé le 28/10/2026 d'après le code et les docs du dépôt (`README.md`, `ARCHITECTURE.md`, `A_FAIRE.md`).

## Concept
Jeu de réflexion tactile : toucher l'écran lance une onde ; deux ondes venues de directions différentes qui arrivent
au même instant sur un nœud l'allument, et il émet à son tour une onde. Gratuit, hors ligne, sans compte.

## Joueurs visés
- Joueurs mobiles qui cherchent un « jeu de réflexion gratuit » (requête SEO visée), en 6 langues.
- Communauté du stream d'Aulit42369 (Défi du jour commun aux 4 jeux, partage du résultat).
- Profil estimé : 12 ans et plus, surtout France et pays francophones, le reste du monde via les 6 langues du jeu (proposé par Claude le 29/10/2026, à corriger si besoin).

## Fonctions (présentes dans le code)
| Fonction | Détail |
|---|---|
| 13 modes | Tutoriel, Campagne (150 étoiles), Arcade, Défi du jour, Puzzles (12), Contre-la-montre, Survie, Rythme, Mélodie, Coop, Duel (2 joueurs, 1 écran), Zen, Éditeur |
| Défi du jour | 6 niveaux identiques pour tous, changent à minuit heure de Paris, numéro `#n` commun aux 4 jeux, série, rejeu du meilleur essai |
| Progression | Records par mode, palettes à débloquer (points cumulés), succès, statistiques |
| Partage | Texte (partage natif → copie → zone à copier) et image 1080×1920 aux couleurs de la palette |
| Éditeur | Créer un niveau et le partager par code |
| Réglages | Langue (6), son, vibrations, vitesse, mode daltonien, lien Confidentialité |
| Autres jeux | Carte « Les autres jeux d'Aulit » dans le menu |

## Hors périmètre
- Pas de serveur, de compte, de classement en ligne ni de multijoueur en réseau (Duel et Coop sur un seul écran).
- Pas d'achat intégré ni de publicité. Pas de demande d'avis dans l'appli (décision du 25/10 : il faudrait Play Core).
- Pas de mesure d'audience (non décidé).

## Critères de réussite
À confirmer par Olivier (ex. : installations Play Store, joueurs quotidiens du Défi du jour).
