# Architecture — Résonance (cas 1 : mobile PWA + Android)

Rédigé le 24/10/2026 à partir du code réel (le dépôt n'avait pas de document d'architecture).

## 1. Modules

| Fichier | Rôle | Lignes |
|---|---|---|
| `index.html` | jeu complet : CSS, HTML, moteur (`/*ENGINE*/`), textes `I18N`, logique des modes, menus | ≈ 2 300 (**écart** : bien au-delà de 400, historique) |
| `defi.js` | Défi du jour : date de Paris, graine, série, texte et partage | 145 |
| `sw.js` | cache hors ligne | 50 |
| `privacy.html` | politique de confidentialité (Play Store) | 85 |
| `tests/defi.test.js` | tests du module commun (identique dans les 4 jeux, sauf la ligne `CHEMIN`) | 161 |
| `tests/resonance-defi.test.js` | contrôles propres à Résonance | 39 |

Écart connu : `index.html` mélange plusieurs responsabilités. Le Défi du jour a été sorti dans `defi.js` pour ne pas le grossir
davantage ; un découpage complet (moteur / textes / interface) est à proposer lors d'une revue L99.

## 2. Sources de vérité uniques

- Textes : objet `I18N` de `index.html` (fr, en, es, de, it, pt). Le nom du jeu, `#n` et les emoji ne se traduisent pas.
- Thèmes : tableau `THEMES` de `index.html`.
- Date du jour, graine, série, format du texte partagé : `defi.js`, **commun aux 4 jeux** (empreinte FNV vérifiée par le test).
- URL de partage : `SHARE_URL` dans `index.html` (`https://resonance-jeu.github.io/`, jamais `location.href`).

## 3. Persistance (localStorage de l'appareil, rien sur serveur)

| Clé | Contenu |
|---|---|
| `resonance.settings`, `resonance.theme` | réglages |
| `resonance.best`, `.chrono`, `.surv`, `.puzzle`… | records par mode |
| `resonance.daily.AAAA-MM-JJ` | meilleur score du défi de ce jour (date de Paris) |
| `resonance.dailyrun.AAAA-MM-JJ` | rejeu du meilleur défi (`{v: VERSION, …}`) ; masqué si `v` ≠ `VERSION` |
| `resonance.defi.v1` | série du défi (`last`, `count`, `best`, `jours` sur 30 jours) |

## 4. Sécurité

Aucun secret, aucun réseau en dehors du chargement de la page. Le texte partagé ne contient ni donnée personnelle ni paramètre d'URL.

## 5. Identité

- Organisation GitHub `resonance-jeu`, dépôt `resonance-jeu.github.io`.
- Manifest : `id: "/"` (**ne jamais changer**), `scope` et `start_url` `./`.
- Caches : préfixe `resonance-` (version actuelle `resonance-1.2.0`) ; le SW ne supprime que les caches `resonance-*`.
- Jeu dans `defi.js` : `'resonance'`.

## 6. Dépendances externes

Aucune. Partage natif (`navigator.share`) et presse-papiers facultatifs : repli sur une zone de texte à copier.

## 7. Plan de tests

`node --test` à la racine. Couvre : vecteurs FNV/graines/tirages, date de Paris (minuit, heures d'été/hiver, comparaison
avec `Intl` toutes les heures 2026-2035), série (faux localStorage), texte partagé (≤ 280 caractères, URL en dernière ligne),
partage (natif / annulé / copie / manuel), copie identique de `defi.js`, chargement de `defi.js` et SW, textes dans les 6 langues.
Le reste (gameplay) : vérification manuelle sur téléphone.

## 8. Risques connus

Voir `PIEGES.md`.
