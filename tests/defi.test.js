// Tests du module commun defi.js : fichier identique dans les 4 jeux, sauf la ligne CHEMIN.
// Lancer depuis la racine du dépôt : node --test
'use strict';
const CHEMIN = '../defi.js';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Defi = require(CHEMIN);

// FNV-1a du fichier defi.js (fins de ligne normalisées) : même constante dans les 4 dépôts.
const EMPREINTE = 1049909846;

const racine = path.join(__dirname, '..');
const ms = iso => Date.parse(iso);

// Faux localStorage en mémoire
function fauxStockage(casse) {
  const m = new Map();
  return {
    getItem: k => { if (casse) throw new Error('bloqué'); return m.has(k) ? m.get(k) : null; },
    setItem: (k, v) => { if (casse) throw new Error('bloqué'); m.set(k, String(v)); },
    _m: m,
  };
}
function avecStockage(s) { Object.defineProperty(globalThis, 'localStorage', { value: s, configurable: true, writable: true }); return s; }
const jour = day => ({ day, key: new Date(day * 86400000).toISOString().slice(0, 10), n: 0, num: 0 });

test('vecteurs de référence : FNV, graines, tirages', () => {
  assert.equal(Defi.fnv1a(''), 2166136261);
  assert.equal(Defi.fnv1a('a'), 3826002220);
  assert.equal(Defi.fnv1a('é'), 513665217);
  const attendu = {
    echo: [-865318257, '0.755243 0.117907 0.014958'],
    lumen: [208002005, '0.061935 0.510495 0.702154'],
    fragments: [-114963483, '0.851766 0.575351 0.005461'],
    resonance: [-1926653410, '0.035216 0.575482 0.973542'],
  };
  for (const [jeu, [graine, tirages]] of Object.entries(attendu)) {
    assert.equal(Defi.seed(jeu, '2026-10-24'), graine, jeu);
    const r = Defi.rng(graine);
    assert.equal([r(), r(), r()].map(x => x.toFixed(6)).join(' '), tirages, jeu);
  }
  assert.deepEqual([1, 2, 3, 4, 5, 6].map(l => Defi.seed('resonance', '2026-10-24', l)),
    [919423271, 936200890, 952978509, 835535176, 852312795, 869090414]);
});

test('date de Paris aux changements d\'heure et au 31/12', () => {
  const cas = [
    ['2026-10-24T21:59:59Z', '2026-10-24'], ['2026-10-24T22:00:00Z', '2026-10-25'],
    ['2026-10-25T22:59:59Z', '2026-10-25'], ['2026-10-25T23:00:00Z', '2026-10-26'],
    ['2027-03-27T23:00:00Z', '2027-03-28'], ['2027-03-28T22:00:00Z', '2027-03-29'],
    ['2026-12-31T23:00:00Z', '2027-01-01'],
  ];
  for (const [iso, key] of cas) assert.equal(Defi.parisDate(ms(iso)).key, key, iso);
  const d = Defi.parisDate(ms('2026-10-24T10:00:00Z'));
  assert.deepEqual([d.y, d.m, d.d, d.num], [2026, 10, 24, 20261024]);
  const t = Defi.today('2026-10-24T10:00Z');
  assert.deepEqual([t.key, t.num, t.day, t.n], ['2026-10-24', 20261024, 20750, 24]);
  assert.equal(Defi.EPOQUE, 20727);
});

test('graine identique toute la journée, change à minuit heure de Paris', () => {
  const g = iso => Defi.seed('echo', Defi.today(iso).key);
  assert.equal(g('2026-10-23T22:00:00Z'), g('2026-10-24T21:59:59Z'));
  assert.notEqual(g('2026-10-24T21:59:59Z'), g('2026-10-24T22:00:00Z'));
});

test('parisDate = Intl Europe/Paris, toutes les heures de 2026 à 2035', () => {
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' });
  let ecarts = 0;
  for (let t = Date.UTC(2026, 0, 1); t < Date.UTC(2036, 0, 1); t += 3600000) if (fmt.format(t) !== Defi.parisDate(t).key) ecarts++;
  assert.equal(ecarts, 0);
});

test('rng : déterministe et dans [0, 1)', () => {
  const a = Defi.rng(12345), b = Defi.rng(12345);
  for (let i = 0; i < 5000; i++) { const x = a(); assert.equal(x, b()); assert.ok(x >= 0 && x < 1); }
});

test('série de jours consécutifs', () => {
  const s = avecStockage(fauxStockage());
  assert.equal(Defi.record('t', jour(100), 50, 'a').count, 1);
  let r = Defi.record('t', jour(100), 30, 'b');
  assert.equal(r.count, 1);
  assert.deepEqual(r.jours[jour(100).key], { score: 50, texte: 'a' }, 'meilleur score gardé');
  assert.equal(Defi.record('t', jour(101), 10, '').count, 2);
  assert.equal(Defi.record('t', jour(102), 10, '').count, 3);
  r = Defi.record('t', jour(104), 10, '');
  assert.equal(r.count, 1, 'un jour sauté');
  assert.equal(r.best, 3, 'record conservé');
  assert.equal(Defi.serie('t', jour(105)), 1);
  assert.equal(Defi.serie('t', jour(106)), 0, 'deux jours sans jouer');
  assert.ok(Defi.aJoue('t', jour(104)));
  assert.ok(!Defi.aJoue('t', jour(105)));
  assert.ok(s._m.has('t.defi.v1'));
  for (let d = 200; d < 240; d++) r = Defi.record('t', { day: d, key: '2027-01-' + String(d - 190).padStart(2, '0') }, d, '');
  assert.equal(Object.keys(r.jours).length, 30);
  assert.equal(Object.keys(Defi.load('t').jours).length, 30);
});

test('lecture défensive et stockage bloqué', () => {
  const s = avecStockage(fauxStockage());
  for (const brut of ['{pas du json', '"x"', '{"v":1,"last":1.5,"count":1,"best":1,"jours":{}}',
    '{"v":1,"last":-1,"count":1,"best":1,"jours":{}}', '{"v":1,"last":5,"count":200000,"best":200000,"jours":{}}',
    '{"v":2,"last":5,"count":1,"best":1,"jours":{}}']) {
    s.setItem('t.defi.v1', brut);
    assert.deepEqual(Defi.load('t'), { v: 1, last: 0, count: 0, best: 0, jours: {} }, brut);
  }
  avecStockage(fauxStockage(true));
  assert.doesNotThrow(() => Defi.record('t', jour(1), 1, ''));
  assert.equal(Defi.serie('t', jour(1)), 0);
});

test('shareText : série, URL, longueur', () => {
  const base = { nom: 'JEU', n: 24, emoji: '🦇', score: '7 420', lignes: Defi.grid([1, 0, 1], ['▫️', '💎']), detail: '⏱ 1:42', url: 'https://exemple.github.io/' };
  let t = Defi.shareText({ ...base, serie: 1 });
  assert.ok(!t.includes('🔥'));
  assert.equal(t.split('\n')[0], 'JEU #24 🦇 7 420');
  assert.equal(t.split('\n')[1], '💎▫️💎');
  t = Defi.shareText({ ...base, serie: 4 });
  assert.ok(t.includes('🔥 4 jours de suite'));
  assert.equal(t.split('\n').pop(), base.url);
  const enorme = Defi.shareText({ ...base, serie: 9, lignes: Array.from({ length: 50 }, () => '🟩'.repeat(80)) });
  assert.ok(enorme.length <= 280);
  assert.equal(enorme.split('\n').pop(), base.url);
  const sale = Defi.shareText({ ...base, serie: 0, url: 'https://exemple.github.io/?score=1#x' });
  const url = sale.split('\n').pop();
  assert.ok(!url.includes('?') && !url.includes('#'));
  assert.equal(Defi.grid(Array(60).fill(0), ['x']).length, 5);
  assert.equal(Defi.grid(Array(12).fill(0), ['x'])[0].length, 10);
});

test('share : partage natif, annulation, copie, repli manuel', async () => {
  let recu = null;
  assert.equal(await Defi.share('T', { share: o => { recu = o; return Promise.resolve(); } }), 'partage');
  assert.deepEqual(recu, { text: 'T' });
  const abort = Object.assign(new Error('annulé'), { name: 'AbortError' });
  assert.equal(await Defi.share('T', { share: () => Promise.reject(abort), clipboard: { writeText: () => Promise.resolve() } }), null);
  assert.equal(await Defi.share('T', { clipboard: { writeText: () => Promise.resolve() } }), 'copie');
  assert.equal(await Defi.share('T', { share: () => Promise.reject(new Error('non')), clipboard: { writeText: () => Promise.resolve() } }), 'copie');
  assert.equal(await Defi.share('T', {}), 'manuel');
  assert.equal(await Defi.share('T', { clipboard: { writeText: () => Promise.reject(new Error('refus')) } }), 'manuel');
});

test('copie identique de defi.js dans les 4 jeux', () => {
  const src = fs.readFileSync(path.join(__dirname, CHEMIN), 'utf8').replace(/\r\n/g, '\n');
  assert.ok(src.startsWith('/* Copie identique dans les 4 jeux'));
  assert.equal(Defi.fnv1a(src), EMPREINTE, 'defi.js diffère de la copie commune : modifier les 4 jeux ensemble');
});

test('index.html charge defi.js avant le script du jeu ; sw.js le met en cache', () => {
  const html = fs.readFileSync(path.join(racine, 'index.html'), 'utf8');
  const nom = path.relative(racine, path.join(__dirname, CHEMIN)).split(path.sep).join('/');
  const i = html.indexOf('<script src="' + nom + '"></script>');
  assert.ok(i > 0, 'balise <script src="' + nom + '"> absente');
  assert.equal(html.indexOf('<script'), i, 'defi.js doit être le premier script');
  const sw = fs.readFileSync(path.join(racine, 'sw.js'), 'utf8');
  assert.ok(sw.includes(nom), 'sw.js ne met pas ' + nom + ' en cache');
  assert.match(sw, /['"](echo|lumen|fragments|resonance)-v?\d+(\.\d+)*['"]/);
});
