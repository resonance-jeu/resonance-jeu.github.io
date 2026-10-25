// Non-régression de la page entière : chargement sans erreur, parcours des modes, textes dans les 6 langues,
// niveaux et campagne inchangés, clés de sauvegarde, fichiers mis en cache par le service worker.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { racine, lire, scripts, styles, sourceJeu, chargerPage, parcours } = require('./outils-page.js');
const { fnv1a } = require('../defi.js');

const src = sourceJeu().replace(/\r\n/g, '\n');

test('la page se charge sans erreur et chaque mode se joue', () => {
  const p = chargerPage();
  assert.deepEqual(p.erreurs, []);
  assert.equal(typeof p.g.resonanceBack, 'function', 'pont du bouton retour Android absent');
  assert.equal(typeof p.g.Defi, 'object');
  assert.equal(typeof p.g.ShareCard, 'object');
  const modes = parcours(p);
  assert.ok(modes.length >= 12, 'boutons de mode trouvés : ' + modes);
  assert.deepEqual(p.erreurs, []);
  assert.equal(p.g.resonanceBack(), false, 'au menu, le retour Android doit laisser quitter');
});

test('la page démarre dans les 6 langues, et en anglais pour une langue inconnue', () => {
  const vus = new Set();
  for (const l of ['fr-FR', 'en-US', 'es-ES', 'de-DE', 'it-IT', 'pt-BR', 'ja-JP']) {
    const p = chargerPage({ langues: [l] });
    assert.deepEqual(p.erreurs, [], l);
    const lang = JSON.parse(p.etat()).lang;
    assert.equal(lang, l === 'ja-JP' ? 'en' : l.slice(0, 2));
    vus.add(p.etat());
  }
  assert.ok(vus.size >= 6, 'les textes de l\'accueil doivent changer selon la langue');
});

test('deux chargements identiques donnent exactement le même état (base de comparaison)', () => {
  const a = chargerPage(), b = chargerPage();
  parcours(a); parcours(b);
  assert.equal(a.etat(), b.etat());
});

// ---------- textes ----------
function i18n() {
  const p = chargerPage();
  return vm.runInContext('I18N', p.g);
}
const LANGUES = ['fr', 'en', 'es', 'de', 'it', 'pt'];
const forme = v => (v && typeof v === 'object' ? (Array.isArray(v) ? v.map(forme) : Object.fromEntries(Object.keys(v).map(k => [k, forme(v[k])]))) : typeof v);

test('textes : les 6 langues ont exactement les mêmes clés (et la même forme)', () => {
  const I = i18n();
  assert.deepEqual(Object.keys(I), LANGUES);
  for (const l of LANGUES) assert.deepEqual(forme(I[l]), forme(I.fr), 'langue ' + l);
});

test('textes : chaque clé utilisée par le jeu existe dans les 6 langues', () => {
  const I = i18n();
  const utilisees = new Set([
    ...[...src.matchAll(/\bt\('([a-zA-Z0-9_]+)'/g)].map(m => m[1]),
    ...[...src.matchAll(/data-ia?="([a-zA-Z0-9_]+)"/g)].map(m => m[1]),
    ...[...src.matchAll(/\?'([a-z]+_[a-z0-9_]+)':'([a-z]+_[a-z0-9_]+)'/g)].flatMap(m => [m[1], m[2]]),
  ]);
  // familles construites par le code : t('tl_'+outil), t('lb_'+mode) ; d: des autres jeux
  const outils = JSON.parse(/const TOOLS=(\[[^\]]*\])/.exec(src)[1].replace(/'/g, '"'));
  outils.forEach(o => utilisees.add('tl_' + o));
  [...src.matchAll(/d:'(o_[a-z]+)'/g)].forEach(m => utilisees.add(m[1]));
  ['lb_', 'tl_'].forEach(k => utilisees.delete(k));
  // écart connu (existant avant le découpage) : t('score') sur la carte image n'a pas de texte, il affiche « score »
  utilisees.delete('score');
  assert.ok(utilisees.size > 150, 'clés trouvées : ' + utilisees.size);
  for (const l of LANGUES) {
    const manque = [...utilisees].filter(k => !(k in I[l]));
    assert.deepEqual(manque, [], 'clés absentes en ' + l);
  }
});

// ---------- niveaux, campagne, thèmes ----------
const bloc = nom => {
  const m = new RegExp('const ' + nom + '\\s*=[\\s\\S]*?\\];\\n').exec(src);
  assert.ok(m, nom + ' introuvable');
  return m[0];
};
// empreintes FNV des données du jeu : à changer seulement si on modifie volontairement les niveaux
const EMPREINTES = { PUZZLES: 4288707579, WORLDS: 2111402137, TUTO: 1622002211, THEMES: 1826396846, DAILY_LEVELS: 3106552057, ACH: 833907628, MODES: 4053985306 };

test('niveaux, campagne, tutoriel, thèmes et succès inchangés', () => {
  const vu = {};
  for (const nom of Object.keys(EMPREINTES)) vu[nom] = fnv1a(nom === 'MODES' ? /const MODES=\{[^}]*\}/.exec(src)[0] : bloc(nom));
  assert.deepEqual(vu, EMPREINTES);
  assert.match(src, /STEP=1\/120, HOLD=0\.25, VERSION=6;/);
});

// ---------- sauvegarde ----------
test('clés de sauvegarde (localStorage) inchangées', () => {
  const cles = [...new Set([...src.matchAll(/'(resonance\.[a-z]+\.?)/g)].map(m => m[1]))].sort();
  assert.deepEqual(cles, ['resonance.ach', 'resonance.best', 'resonance.camp', 'resonance.chrono', 'resonance.coop',
    'resonance.daily.', 'resonance.dailyrun.', 'resonance.draft', 'resonance.melody', 'resonance.puzzle', 'resonance.rhythm',
    'resonance.settings', 'resonance.stats', 'resonance.surv', 'resonance.theme', 'resonance.total', 'resonance.tuto', 'resonance.zen']);
});

// ---------- fichiers ----------
test('chaque fichier local de la page est mis en cache par le SW et existe', () => {
  const html = lire('index.html');
  const sw = lire('sw.js');
  const FILES = JSON.parse(/const FILES = (\[[\s\S]*?\]);/.exec(sw)[1]);
  const locaux = [...scripts(html).filter(s => !s.nom.includes('#')).map(s => s.nom), ...styles(html)];
  for (const css of styles(html)) {
    for (const m of lire(css).matchAll(/url\(([^)]+)\)/g)) locaux.push(path.posix.join(path.posix.dirname(css), m[1]));
  }
  for (const m of html.matchAll(/url\((fonts\/[^)]+)\)/g)) locaux.push(m[1]);
  assert.ok(locaux.length >= 12);
  for (const f of locaux) {
    assert.ok(fs.existsSync(path.join(racine, f)), f + ' manquant');
    assert.ok(FILES.includes(f), f + ' absent de FILES (sw.js)');
  }
  for (const f of FILES) if (f !== './') assert.ok(fs.existsSync(path.join(racine, f)), 'FILES : ' + f + ' manquant');
});

test('manifest : id inchangé ; SW : seule la page du jeu remplace la copie hors ligne', () => {
  const man = JSON.parse(lire('resonance.webmanifest'));
  assert.equal(man.id, '/');
  const sw = lire('sw.js');
  assert.ok(sw.includes("url.pathname.endsWith('/') || url.pathname.endsWith('/index.html')"));
  assert.ok(sw.includes("k.startsWith('resonance-')"));
});
