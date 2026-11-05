// CSP (Content-Security-Policy) : identique dans les 4 jeux. Chaque page HTML porte sa CSP en balise <meta>
// (marche sur le serveur OVH comme sur la copie GitHub Pages), sans aucun script en ligne ni attribut on*=.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const racine = path.join(__dirname, '..');
// fichiers de validation Google (google*.html) : pas des pages du jeu
const pages = fs.readdirSync(racine).filter((f) => f.endsWith('.html') && !/^google[0-9a-f]+\.html$/.test(f));
const META = /<meta http-equiv="Content-Security-Policy" content="([^"]+)">/;

function directives(csp) {
  const d = {};
  for (const part of csp.split(';').map((s) => s.trim()).filter(Boolean)) {
    const [nom, ...valeurs] = part.split(/\s+/);
    d[nom] = valeurs;
  }
  return d;
}

test('les pages index.html, privacy.html et 404.html existent', () => {
  for (const f of ['index.html', 'privacy.html', '404.html']) assert.ok(pages.includes(f), f);
});

for (const f of pages) {
  const html = fs.readFileSync(path.join(racine, f), 'utf8');
  test(f + ' : CSP stricte en <meta>, avant tout script ou feuille de style', () => {
    const m = html.match(META);
    assert.ok(m, 'CSP absente');
    const d = directives(m[1]);
    assert.deepStrictEqual(d['default-src'], ["'self'"]);
    assert.deepStrictEqual(d['object-src'], ["'none'"]);
    assert.deepStrictEqual(d['base-uri'], ["'none'"]);
    assert.deepStrictEqual(d['form-action'], ["'none'"]);
    const scripts = (d['script-src'] || d['default-src']).join(' ');
    assert.doesNotMatch(scripts, /unsafe-inline|unsafe-eval|unsafe-hashes|sha\d+-|nonce-|\*|https?:(?!\/\/gc\.zgo\.at)/, 'script-src trop large');
    assert.ok(!d['frame-ancestors'], 'frame-ancestors est ignoré dans une <meta>');
    const avant = html.slice(0, m.index);
    assert.doesNotMatch(avant, /<script|<link[^>]+stylesheet|<style/, 'la CSP doit précéder les ressources');
  });
  test(f + ' : aucun script en ligne ni attribut on*=, scripts locaux présents', () => {
    const inline = html.match(/<script(?![^>]*\ssrc=)(?![^>]*type="application\/ld\+json")[^>]*>/g) || [];
    assert.deepStrictEqual(inline, []);
    assert.doesNotMatch(html, /<[a-z][^>]*\son[a-z]+\s*=/i);
    assert.doesNotMatch(html, /javascript:/i);
    for (const [, src] of html.matchAll(/<script src="([^"]+)"/g)) {
      if (/^https?:/.test(src)) continue;
      assert.ok(fs.existsSync(path.join(racine, src.replace(/^\//, '').replace(/\?.*$/, ''))), src + ' introuvable');
    }
  });
}

test('index.html : GoatCounter (script + envoi) autorisé, rien d\'autre en externe', () => {
  const d = directives(fs.readFileSync(path.join(racine, 'index.html'), 'utf8').match(META)[1]);
  assert.deepStrictEqual(d['script-src'], ["'self'", 'https://gc.zgo.at']);
  for (const nom of ['connect-src', 'img-src']) assert.ok(d[nom].includes('https://aulit42369.goatcounter.com'), nom);
  for (const nom of ['worker-src', 'manifest-src']) assert.deepStrictEqual(d[nom], ["'self'"], nom);
});
