// Contrôles propres à Résonance : chargement de defi.js, service worker, textes du défi dans les 6 langues.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const racine = path.join(__dirname, '..');
const { scripts, sourceJeu, textes } = require('./outils-page.js');
const html = sourceJeu(); // index.html + CSS + scripts du jeu
const sw = fs.readFileSync(path.join(racine, 'sw.js'), 'utf8');

test('index.html charge defi.js avant le script du jeu', () => {
  const ordre = scripts();
  const ou = mot => ordre.findIndex(s => s.code.includes(mot));
  assert.equal(ordre[0].nom, 'defi.js');
  assert.ok(ou('/*ENGINE*/') > 0 && ou('const I18N') > 0);
});

test('service worker : defi.js en cache, version resonance- changée', () => {
  assert.match(sw, /"defi\.js"/);
  const v = /const VERSION = '([^']+)'/.exec(sw)[1];
  assert.match(v, /^resonance-/);
  assert.notEqual(v, 'resonance-1.1.2');
});

test('le défi n\'utilise plus l\'heure locale', () => {
  assert.ok(!/DAILY_SEED/.test(html));
  assert.match(html, /Defi\.seed\('resonance',\(S\.defi\|\|TD\)\.key,S\.level\)/);
  assert.match(html, /VERSION=6/);
  assert.ok(html.includes("SHARE_URL='https://resonance-jeu.github.io/'"));
});

test('nouveaux textes présents dans les 6 langues', () => {
  const I18N = textes();
  const cles = ['share_res', 'daily_todo', 'daily_done', 'a_streak', 'dy_streak', 'dy_next', 'sh_streak', 'st_shared', 'st_copied', 'st_manual', 'a_sum', 'sh_chain', 'sh_retries'];
  for (const l of ['fr', 'en', 'es', 'de', 'it', 'pt']) {
    for (const k of cles) assert.equal(typeof I18N[l][k], 'string', `${l}.${k}`);
    assert.ok(I18N[l].daily_todo.startsWith('#{n}'), l);
    assert.ok(I18N[l].sh_streak.startsWith('{n}'), l);
  }
});

test('compte à rebours : calculé sur le jour réel, pas sur le jour figé du défi', () => {
  const Defi = require('../defi.js');
  const src = /function untilNext\(key\)\{[\s\S]*?\}; \}/.exec(html)[0];
  const maintenant = Date.parse('2026-10-25T00:01:00+02:00'); // 00 h 01 à Paris, défi lancé la veille à 23 h 58
  const untilNext = new Function('Defi', 'Date', src + ';return untilNext;')(Defi, { UTC: Date.UTC, now: () => maintenant });
  assert.deepEqual(untilNext('2026-10-24'), { h: 0, m: '00' }); // l'ancien calcul (jour figé) affichait 0 h 00
  assert.deepEqual(untilNext(Defi.today(maintenant).key), { h: 24, m: '59' }); // 25/10 : passage à l'heure d'hiver, jour de 25 h
  assert.match(html, /nx=untilNext\(Defi\.today\(\)\.key\)/);
});
