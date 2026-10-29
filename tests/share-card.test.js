// Carte image du Défi du jour (share-card.js) et carte « Les autres jeux d'Aulit ».
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ShareCard = require('../share-card.js');
const racine = path.join(__dirname, '..');
const { sourceJeu, textes } = require('./outils-page.js');
const html = sourceJeu(); // index.html + CSS + scripts du jeu
const sw = fs.readFileSync(path.join(racine, 'sw.js'), 'utf8');

// contexte 2D factice : note les textes écrits, mesure 0,6 × la taille de police par caractère
function fauxCtx() {
  const textes = [];
  const ctx = new Proxy({ textes, font: '10px x',
    measureText(s) { return { width: String(s).length * 0.6 * parseInt(/(\d+)px/.exec(this.font)[1], 10) }; },
    fillText(s, x) { textes.push({ s: String(s), x, font: this.font }); },
    createRadialGradient() { return { addColorStop() {} }; }, createLinearGradient() { return { addColorStop() {} }; } },
  { get(o, k) { return k in o ? o[k] : () => {}; }, set(o, k, v) { o[k] = v; return true; } });
  return ctx;
}
const COUL = { ink: '#13100e', bone: '#efe3cf', acc: '#f2a541', rose: '#d9776b', dust: '#8a7d6c', p2: '#6fc2c0' };
const carte = { kicker: '25/10/2026', titre: 'Défi du jour #25', scoreLbl: 'Score', score: '12 340',
  niveaux: [{ used: 2, max: 3, extra: '' }, { used: 3, max: 4, extra: 'chaîne ×2' }, null, { used: 1, max: 5 }, { used: 4, max: 6 }, { used: 6, max: 6 }],
  serie: '5 jours de suite', url: 'https://resonance-jeu.github.io/', couleurs: COUL };

test('carte : nom, défi #N, score, série, URL ; tout tient dans 1080 px', () => {
  const ctx = fauxCtx();
  ShareCard.draw(ctx, carte);
  const s = ctx.textes.map(t => t.s);
  for (const attendu of ['Réso', 'nance', 'Défi du jour #25', '12 340', '5 jours de suite', 'https://resonance-jeu.github.io/', 'chaîne ×2'])
    assert.ok(s.includes(attendu), attendu);
  assert.equal(ShareCard.W, 1080); assert.equal(ShareCard.H, 1920);
  const titre = ctx.textes.find(t => t.s === carte.titre);
  assert.ok(titre.x + ctx.measureText.call({ font: titre.font }, titre.s).width <= 1080 - 90, 'titre trop large');
});

test('carte : titre très long réduit, série vide non écrite', () => {
  const ctx = fauxCtx();
  ShareCard.draw(ctx, Object.assign({}, carte, { titre: 'Tägliche Aufgabe #1234567', serie: '' }));
  const titre = ctx.textes.find(t => t.s.startsWith('Tägliche'));
  assert.ok(ctx.measureText.call({ font: titre.font }, titre.s).width <= 900);
  assert.ok(!ctx.textes.some(t => t.s === ''));
});

const blob = { taille: 1 };
const canvas = { toDataURL: () => 'data:image/png;base64,QUJD' };
function env(o) {
  const clics = [];
  return Object.assign({ clics, win: {}, nav: {}, File: function (parts, nom, opt) { this.name = nom; this.type = opt.type; },
    URL: { createObjectURL: () => 'blob:x', revokeObjectURL() {} },
    doc: { body: { appendChild() {} }, createElement: () => ({ click() { clics.push(this.download); }, remove() {} }) } }, o);
}

test('partage : pont Android en priorité (base64 sans préfixe + texte)', async () => {
  let recu;
  const e = env({ win: { AndroidShare: { shareImage(b, t) { recu = [b, t]; return true; } } } });
  assert.equal(await ShareCard.share({ canvas, blob }, 'TXT', 'a.png', e), 'partage');
  assert.deepEqual(recu, ['QUJD', 'TXT']);
  const e2 = env({ win: { AndroidShare: { shareImage: () => false } } });
  assert.equal(await ShareCard.share({ canvas, blob }, 'TXT', 'a.png', e2), 'echec');
});

test('partage : natif avec fichier, annulation, erreur → téléchargement', async () => {
  let donnees;
  const nav = { canShare: d => !!d.files, share: d => { donnees = d; return Promise.resolve(); } };
  assert.equal(await ShareCard.share({ canvas, blob }, 'TXT', 'r.png', env({ nav })), 'partage');
  assert.equal(donnees.text, 'TXT'); assert.equal(donnees.files[0].name, 'r.png'); assert.equal(donnees.files[0].type, 'image/png');
  const annule = { canShare: () => true, share: () => Promise.reject(Object.assign(new Error(), { name: 'AbortError' })) };
  assert.equal(await ShareCard.share({ canvas, blob }, 'T', 'r.png', env({ nav: annule })), null);
  const e = env({ nav: { canShare: () => true, share: () => Promise.reject(new Error('x')) } });
  assert.equal(await ShareCard.share({ canvas, blob }, 'T', 'r.png', e), 'telechargement');
  assert.deepEqual(e.clics, ['r.png']);
});

test('partage : sans partage de fichiers → téléchargement', async () => {
  const e = env({ nav: { share: () => Promise.resolve(), canShare: () => false } });
  assert.equal(await ShareCard.share({ canvas, blob }, 'T', 'r.png', e), 'telechargement');
  assert.deepEqual(e.clics, ['r.png']);
});

test('share-card.js chargé après defi.js, mis en cache par le SW', () => {
  assert.ok(html.search(/<script src="share-card\.js(\?v=[^"]+)?"><\/script>/) > html.indexOf('<script src="defi.js"></script>'));
  assert.match(sw, /"share-card\.js"/);
});

test('autres jeux : une seule constante, 3 jeux, pas Résonance ; textes dans les 6 langues', () => {
  const m = /const AUTRES_JEUX=(\[[^\n]*\]);/.exec(html);
  assert.ok(m, 'constante AUTRES_JEUX absente');
  const jeux = new Function('return ' + m[1])();
  assert.deepEqual(jeux.map(j => j.url), ['https://echo-jeu.github.io/', 'https://lumen-jeu.github.io/', 'https://fragments-jeu.github.io/']);
  assert.ok(!jeux.some(j => /resonance/i.test(j.url)));
  assert.equal(html.split('lumen-jeu.github.io').length, 2, 'URL écrite ailleurs que dans la constante');
  const I18N = textes();
  for (const l of ['fr', 'en', 'es', 'de', 'it', 'pt'])
    for (const k of ['share_img', 'st_saved', 'others', 'o_echo', 'o_lumen', 'o_frag']) assert.equal(typeof I18N[l][k], 'string', `${l}.${k}`);
  assert.equal(I18N.fr.o_echo, "Un labyrinthe dans le noir, guidé par l'écho");
  assert.equal(I18N.fr.o_lumen, 'Reliez les orbes, faites monter la lumière');
  assert.equal(I18N.fr.o_frag, 'Party game : chacun tient une pièce du dossier');
});
