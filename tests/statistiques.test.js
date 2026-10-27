// Statistiques GoatCounter sans cookie : identique dans les 4 jeux, seul PREFIXE change.
// Vérifie la garde github.io (jamais dans l'appli ni en local), skipgc, la CSP et le chemin préfixé.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const vm = require('vm');

const PREFIXE = '/resonance';
const racine = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(racine, 'index.html'), 'utf8');
const js = (html.match(/<script>([^<]*goatcounter[^<]*)<\/script>/) || [])[1];
const csp = html.match(/Content-Security-Policy" content="([^"]+)"/)[1];
const directive = (nom) => (csp.split(';').map((d) => d.trim()).find((d) => d.startsWith(nom + ' ')) || '');

// Exécute le script en ligne dans un faux navigateur ; renvoie le script ajouté (ou null) et window.goatcounter.
function lancer(hostname, skipgc) {
  let ajoute = null;
  const el = { setAttribute(k, v) { this[k] = v; } };
  const win = {
    location: { hostname },
    localStorage: { getItem: (k) => (k === 'skipgc' ? skipgc : null) },
    document: { createElement: () => el, head: { appendChild: (s) => { ajoute = s; } } },
  };
  win.window = win;
  vm.runInNewContext(js, win);
  return { ajoute, gc: win.goatcounter };
}

test('script GoatCounter présent, empreinte et domaines autorisés par la CSP', () => {
  assert.ok(js, 'script en ligne GoatCounter absent');
  const h = "'sha256-" + crypto.createHash('sha256').update(js).digest('base64') + "'";
  assert.ok(directive('script-src').includes(h), 'empreinte du script absente de script-src');
  assert.ok(directive('script-src').includes('https://gc.zgo.at'));
  assert.ok(directive('connect-src').includes('https://aulit42369.goatcounter.com'));
  assert.ok(directive('img-src').includes('https://aulit42369.goatcounter.com'));
});

test('compte seulement sur github.io, avec count.v4.js figé + SRI et le chemin préfixé', () => {
  const { ajoute, gc } = lancer('exemple.github.io', null);
  assert.ok(ajoute, 'rien chargé sur github.io');
  assert.strictEqual(ajoute.src, 'https://gc.zgo.at/count.v4.js');
  assert.match(ajoute.integrity, /^sha384-/);
  assert.strictEqual(ajoute.crossOrigin, 'anonymous');
  assert.strictEqual(ajoute['data-goatcounter'], 'https://aulit42369.goatcounter.com/count');
  const canon = new URL(html.match(/rel="canonical" href="([^"]+)"/)[1]).pathname;
  assert.strictEqual(gc.path(canon), PREFIXE + '/');
});

test('ne compte jamais hors github.io (appli Android, WebView, fichier, local)', () => {
  for (const h of ['', 'localhost', '127.0.0.1', 'appassets.androidplatform.net', 'github.io.exemple.com', 'faux-github.io.net']) {
    assert.strictEqual(lancer(h, null).ajoute, null, 'compté sur « ' + h + ' »');
  }
});

test('respecte « Ne pas être compté » (skipgc) et propose le bouton dans privacy.html', () => {
  assert.strictEqual(lancer('exemple.github.io', 't').ajoute, null);
  const privacy = fs.readFileSync(path.join(racine, 'privacy.html'), 'utf8');
  assert.match(privacy, /GoatCounter/);
  assert.match(privacy, /data-gc="Ne pas être compté\|Être compté de nouveau"/);
  assert.match(privacy, /localStorage\.setItem\('skipgc', 't'\)/);
});

test('le service worker ne met pas count.js en cache', () => {
  assert.doesNotMatch(fs.readFileSync(path.join(racine, 'sw.js'), 'utf8'), /gc\.zgo\.at|goatcounter/);
});
