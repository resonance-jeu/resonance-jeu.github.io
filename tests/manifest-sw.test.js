// Test commun aux 4 jeux (ÉCHO, LUMEN, Fragments, Résonance) et à CRA : copie IDENTIQUE dans chaque projet.
// Vérifie manifest + service worker sans navigateur : le SW est exécuté dans un bac à sable (vm) avec un faux `caches`.
// Lancement : node --test
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const RACINE = path.join(__dirname, '..');
const lire = f => fs.readFileSync(path.join(RACINE, f), 'utf8');
const html = lire('index.html');
const lienManifest = html.match(/<link[^>]+rel="manifest"[^>]*>/)[0].match(/href="([^"]+)"/)[1];
const manifest = JSON.parse(lire(lienManifest));
// préfixe de cache attendu = premier mot du nom court, sans accent ni majuscule (ÉCHO -> echo, CRA IZENCIA -> cra)
const prefixe = manifest.short_name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().split(/\s+/)[0] + '-';
// Identités déjà publiées : ne JAMAIS les changer (une autre identité = une autre appli pour Chrome, l'ancienne installation est orpheline).
const IDS = { 'echo-': '/Echo/', 'lumen-': '/', 'fragments-': '/fragments/', 'resonance-': '/', 'cra-': '/Cra/' };

// Exécute sw.js, déclenche install puis activate, et rend le nom du cache, les fichiers demandés et les caches supprimés.
async function lancerSW() {
  const ecrits = []; const supprimes = []; const noms = []; const ecouteurs = {};
  const caches = {
    open: async nom => { noms.push(nom); return {
      addAll: async l => { ecrits.push(...l.map(u => (typeof u === 'string' ? u : u.url))); },
      add: async u => { ecrits.push(typeof u === 'string' ? u : u.url); },
      put: async () => {}, match: async () => undefined }; },
    keys: async () => [prefixe + 'ancien', 'autre-depot-1', 'zz-' + prefixe + 'x'],
    delete: async k => { supprimes.push(k); return true; },
  };
  const sw = { addEventListener: (t, f) => { ecouteurs[t] = f; }, skipWaiting: () => Promise.resolve(), clients: { claim: () => Promise.resolve() }, location: { origin: 'https://x.test' } };
  const ctx = vm.createContext({ self: sw, caches, URL, Request: class { constructor(u) { this.url = u; } }, Response: class {}, location: sw.location, console, setTimeout, clearTimeout, fetch: async () => ({}) });
  vm.runInContext(lire('sw.js'), ctx);
  for (const t of ['install', 'activate']) {
    let p; ecouteurs[t]({ waitUntil: x => { p = x; } }); await p;
  }
  return { cache: noms[0], fichiers: ecrits, supprimes };
}

test('manifest : id présent et identique à l\'identité déjà publiée', () => {
  assert.ok(manifest.id, 'id manquant');
  assert.equal(manifest.id, IDS[prefixe]);
});

test('manifest : start_url et scope cohérents', () => {
  const base = new URL(lienManifest, 'https://x.test' + manifest.id.replace(/[^/]*$/, ''));
  const start = new URL(manifest.start_url, base), scope = new URL(manifest.scope, base);
  assert.ok(start.pathname.startsWith(scope.pathname), 'start_url hors du scope');
  assert.ok(manifest.lang && manifest.lang.length >= 2, 'lang manquant');
});

test('manifest : chaque icône existe, dont une maskable', () => {
  for (const i of manifest.icons) assert.ok(fs.existsSync(path.join(RACINE, i.src)), i.src + ' introuvable');
  assert.ok(manifest.icons.some(i => i.purpose === 'maskable'));
});

test('service worker : cache préfixé par le nom de l\'appli, suppression limitée à ce préfixe', async () => {
  const r = await lancerSW();
  assert.ok(r.cache.startsWith(prefixe), r.cache + ' ne commence pas par ' + prefixe);
  assert.deepEqual(r.supprimes, [prefixe + 'ancien'], 'seuls les anciens caches de CETTE appli peuvent être supprimés');
});

test('service worker : chaque fichier listé existe', async () => {
  const r = await lancerSW();
  assert.ok(r.fichiers.length > 5);
  for (const f of r.fichiers) {
    const p = f.split('?')[0].replace(/^\.\//, '') || 'index.html';
    assert.ok(fs.existsSync(path.join(RACINE, p)), f + ' introuvable');
  }
});

test('service worker : le manifest et les icônes du manifest sont en cache', async () => {
  const r = await lancerSW();
  const liste = r.fichiers.map(f => f.split('?')[0].replace(/^\.\//, ''));
  assert.ok(liste.includes(lienManifest));
  for (const i of manifest.icons) assert.ok(liste.includes(i.src), i.src + ' absente du cache');
});
