# Architecture — Résonance (cas 1 : mobile PWA + Android)

Rédigé le 24/10/2026 à partir du code réel (le dépôt n'avait pas de document d'architecture).

## 1. Modules

| Fichier | Rôle | Lignes |
|---|---|---|
| `index.html` | jeu complet : CSS, HTML, moteur (`/*ENGINE*/`), textes `I18N`, logique des modes, menus | ≈ 2 300 (**écart** : bien au-delà de 400, historique) |
| `defi.js` | Défi du jour : date de Paris, graine, série, texte et partage | 145 |
| `share-card.js` | carte image 1080×1920 du Défi du jour (palette active, polices, ondes) + partage : pont Android `window.AndroidShare`, sinon `navigator.share({files,text})`, sinon téléchargement | ≈ 150 |
| `sw.js` | cache hors ligne | 55 |
| `privacy.html` | confidentialité + conditions d'utilisation + mentions légales, 6 langues (URL du Play Store, ne pas renommer) | ≈ 130 |
| `404.html`, `robots.txt`, `sitemap.xml`, `og-image.png` | page introuvable (chemins absolus), référencement, aperçu des liens 1200×630 | |
| `tests/defi.test.js` | tests du module commun (identique dans les 4 jeux, sauf la ligne `CHEMIN`) | 161 |
| `tests/resonance-defi.test.js` | contrôles propres à Résonance | 39 |
| `tests/share-card.test.js` | carte image (contexte 2D factice), ordre de partage, constante des autres jeux, textes 6 langues | ≈ 110 |

### Plan de découpage (lot 18, 25/10/2026) — écrit avant de déplacer le code

Refactorisation pure : le code est **déplacé tel quel**, sans changer comportement, rendu, textes, clés de sauvegarde ni id du manifest.
Pas de bundler : fichiers statiques chargés par des balises classiques, dans l'ordre d'origine (`defi.js` reste le premier script).

| Étape | Contenu d'origine (`index.html`) | Nouveau fichier |
|---|---|---|
| 1 | `<style>` des polices (une ligne) | `css/polices.css` (chemins `url(../fonts/…)`) |
| 1 | `<style>` principal | `css/jeu.css` ; les deux `<link>` à la fin du `<head>`, après le style critique |
| 2 | script `/*ENGINE*/` | `js/moteur.js` |
| 3 | `const I18N = {…}` + fonctions `t`, `tip`, `fmt`… | `js/i18n.js` (objet `I18N` + fonctions) puis `js/i18n/fr.js` … `pt.js` (`I18N.fr = {…};`, même ordre fr, en, es, de, it, pt) |
| 4 | IIFE du jeu, découpée à ses commentaires de section | `js/puzzles.js`, `js/socle.js`, `js/niveaux.js`, `js/partie.js`, `js/fins.js`, `js/ecrans.js`, `js/rendu.js`, `js/demarrage.js` |
| 5 | `sw.js` | nouveaux fichiers dans `FILES`, `VERSION` montée |

Point délicat de l'étape 4 : l'IIFE `(() => { … })()` est retirée, ses 156 noms deviennent des globaux de la page.
Vérifié avant (analyse syntaxique) : aucun nom en collision avec `defi.js`, `share-card.js`, le moteur, les textes, ni avec
`window` (`top`, `name`, `status`, `on…`) ; aucun `var`, aucun `return` au premier niveau. Les fichiers gardent l'ordre
d'origine, donc tout code exécuté au chargement ne voit que des déclarations des fichiers précédents (les appels
d'initialisation sont tous dans `js/demarrage.js`, le dernier).

Contrôle à chaque étape : `node --test` + comparaison de l'état complet de la page (faux navigateur `tests/outils-page.js`,
parcours de tous les modes en 3 langues) avec la version d'avant le découpage : doit être **identique**.

Écart connu (avant lot 18) : `index.html` mélange plusieurs responsabilités. Le Défi du jour a été sorti dans `defi.js` pour ne pas le grossir
davantage ; un découpage complet (moteur / textes / interface) est à proposer lors d'une revue L99.

## 2. Sources de vérité uniques

- Textes : objet `I18N` de `index.html` (fr, en, es, de, it, pt). Le nom du jeu, `#n` et les emoji ne se traduisent pas.
- Thèmes : tableau `THEMES` de `index.html`.
- Date du jour, graine, série, format du texte partagé : `defi.js`, **commun aux 4 jeux** (empreinte FNV vérifiée par le test).
- Liens des autres jeux d'Aulit : constante `AUTRES_JEUX` de `index.html` (une seule ; à remplacer par les liens Play Store quand les applis seront publiées) ; descriptions dans `I18N` (`o_echo`, `o_lumen`, `o_frag`).
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
- Caches : préfixe `resonance-` (version actuelle `resonance-1.3.0`) ; seule une navigation vers la racine ou `index.html` (réponse 200) remplace la copie hors ligne `./` ; le SW ne supprime que les caches `resonance-*`.
- Jeu dans `defi.js` : `'resonance'`.

## 6. Dépendances externes

Aucune. Appli Android : pont JavaScript `AndroidShare.shareImage(base64Png, texte)` (`MainActivity.java`) limité à une image PNG écrite sous un nom fixe dans le cache, servie par `ImageProvider` (non exporté, lecture seule, autorisation ponctuelle) ; les liens web touchés s'ouvrent dans le navigateur. Partage natif (`navigator.share`) et presse-papiers facultatifs : repli sur une zone de texte à copier.

## 7. Plan de tests

`node --test` à la racine. Couvre : vecteurs FNV/graines/tirages, date de Paris (minuit, heures d'été/hiver, comparaison
avec `Intl` toutes les heures 2026-2035), série (faux localStorage), texte partagé (≤ 280 caractères, URL en dernière ligne),
partage (natif / annulé / copie / manuel), copie identique de `defi.js`, chargement de `defi.js` et SW, textes dans les 6 langues.
Le reste (gameplay) : vérification manuelle sur téléphone.

## 8. Risques connus

Voir `PIEGES.md`.
