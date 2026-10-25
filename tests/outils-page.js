// Outil des tests (pas un test) : lit index.html et ses scripts locaux dans l'ordre, et charge la page
// dans un faux navigateur minimal (node:vm, aucune dépendance) pour vérifier qu'elle démarre sans erreur.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const racine = path.join(__dirname, '..');
const lire = f => fs.readFileSync(path.join(racine, f), 'utf8');

const sansParam = u => u.replace(/\?.*$/, ''); // « js/x.js?v=resonance-… » → fichier « js/x.js »
// scripts de index.html dans l'ordre d'exécution : { nom (fichier), url (avec ?v=), code } (le JSON-LD n'est pas un script)
function scripts(html = lire('index.html')) {
  return [...html.matchAll(/<script(?:\s+src="([^"]+)")?(\s+type="[^"]*")?>([\s\S]*?)<\/script>/g)]
    .filter(m => !m[2])
    .map((m, i) => (m[1] ? { nom: sansParam(m[1]), url: m[1], code: lire(sansParam(m[1])) } : { nom: 'index.html#' + i, code: m[3] }));
}
// feuilles de style locales de index.html : URL telles qu'écrites (avec ?v=)
const urlsStyles = (html = lire('index.html')) => [...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)].map(m => m[1]);
const styles = (html = lire('index.html')) => urlsStyles(html).map(sansParam);

// exécute sw.js avec un faux environnement de service worker : { VERSION, FILES, installer(), requete(url, enLigne) }
function serviceWorker() {
  const ecoute = {}; const cache = new Map(); // un seul cache suffit ici : clé = URL absolue complète (avec ?v=)
  const base = 'https://resonance-jeu.github.io/';
  const g = { self: { location: { origin: 'https://resonance-jeu.github.io' }, addEventListener: (t, f) => (ecoute[t] = f), skipWaiting: () => Promise.resolve(),
      clients: { claim: () => Promise.resolve() } }, URL, Promise, console,
    caches: { open: () => Promise.resolve({ addAll: l => { l.forEach(u => cache.set(new URL(u, base).href, 'cache:' + u)); return Promise.resolve(); },
        put: (k, v) => { cache.set(typeof k === 'string' ? new URL(k, base).href : k.url, v); return Promise.resolve(); } }),
      match: (r, o = {}) => { const u = typeof r === 'string' ? new URL(r, base).href : r.url; return Promise.resolve(cache.get(o.ignoreSearch ? u.replace(/\?.*$/, '') : u)); },
      keys: () => Promise.resolve([]), delete: () => Promise.resolve(true) },
    fetch: () => Promise.reject(new Error('hors ligne')) };
  vm.createContext(g);
  vm.runInContext(lire('sw.js') + ';this.VERSION=VERSION;this.FILES=FILES;', g);
  return { VERSION: g.VERSION, FILES: g.FILES,
    installer: () => new Promise(ok => ecoute.install({ waitUntil: p => p.then(ok) })),
    requete: url => new Promise(ok => { let rep = null; ecoute.fetch({ request: { url: new URL(url, base).href, method: 'GET', mode: 'no-cors' }, respondWith: p => { rep = p; } });
      ok(rep ? rep : Promise.resolve('réseau (pas de réponse du SW)')); }) };
}

// tout le code du jeu (HTML + CSS + scripts locaux, sauf defi.js et share-card.js), pour les contrôles de texte
function sourceJeu() {
  const html = lire('index.html');
  return [html, ...styles(html).map(lire), ...scripts(html).filter(s => !s.nom.includes('#') && !/^(defi|share-card)\.js$/.test(s.nom)).map(s => s.code)].join('\n');
}

// ---------- faux navigateur ----------
function fauxCtx2d() {
  const o = { measureText: s => ({ width: String(s).length * 7 }), getImageData: () => ({ data: new Uint8ClampedArray(4) }) };
  const deg = () => ({ addColorStop() {} });
  o.createLinearGradient = o.createRadialGradient = o.createConicGradient = o.createPattern = deg;
  return new Proxy(o, { get: (t, k) => (k in t ? t[k] : () => {}), set: (t, k, v) => { t[k] = v; return true; } });
}

class El {
  constructor(tag, attrs = {}) {
    this.tagName = tag.toUpperCase(); this.id = attrs.id || ''; this.children = []; this.parent = null;
    this.hidden = 'hidden' in attrs; this.textContent = ''; this._html = ''; this.className = attrs.class || '';
    this.value = ''; this.disabled = false; this.scrollTop = 0; this.width = 300; this.height = 150; this.attrs = {};
    this.dataset = {}; for (const k in attrs) if (k.startsWith('data-')) this.dataset[k.slice(5)] = attrs[k];
    const st = {}; this.style = Object.assign(st, { setProperty: (k, v) => { st[k] = v; } });
    const cl = this; this.classList = {
      add: (...c) => c.forEach(x => { if (!cl._cls().includes(x)) cl.className = (cl.className + ' ' + x).trim(); }),
      remove: (...c) => { cl.className = cl._cls().filter(x => !c.includes(x)).join(' '); },
      toggle: (c, f) => { const on = f === undefined ? !cl._cls().includes(c) : !!f; on ? cl.classList.add(c) : cl.classList.remove(c); return on; },
      contains: c => cl._cls().includes(c),
    };
    this._ecoute = {};
  }
  _cls() { return this.className.split(/\s+/).filter(Boolean); }
  get innerHTML() { return this._html; }
  set innerHTML(v) { this._html = String(v); this.children = []; }
  appendChild(c) { if (c && typeof c === 'object') { c.parent = this; this.children.push(c); } return c; }
  append(...c) { c.forEach(x => this.appendChild(typeof x === 'string' ? Object.assign(new El('#text'), { textContent: x }) : x)); }
  prepend(...c) { this.append(...c); }
  replaceChildren(...c) { this.children = []; this.append(...c); }
  insertBefore(c) { return this.appendChild(c); }
  remove() { if (this.parent) this.parent.children = this.parent.children.filter(x => x !== this); }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }
  removeAttribute(k) { delete this.attrs[k]; }
  addEventListener(t, f) { (this._ecoute[t] = this._ecoute[t] || []).push(f); }
  removeEventListener() {}
  envoyer(t, e = {}) { (this._ecoute[t] || []).forEach(f => f(Object.assign({ preventDefault() {}, target: this, pointerId: 1 }, e))); }
  querySelectorAll(sel) {
    const out = []; const tous = n => n.children.forEach(c => { if (c.tagName === sel.toUpperCase()) out.push(c); tous(c); });
    tous(this); return out;
  }
  querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
  closest() { return null; } matches() { return false; } contains() { return false; }
  focus() {} blur() {} select() {} click() { if (this.onclick) this.onclick({}); } scrollTo() {} scrollIntoView() {}
  getContext() { return this._ctx || (this._ctx = fauxCtx2d()); }
  toDataURL() { return 'data:image/png;base64,iVBORw0KGgo='; }
  toBlob(f) { f(null); }
  getBoundingClientRect() { return { left: 0, top: 0, right: 390, bottom: 844, width: 390, height: 844, x: 0, y: 0 }; }
  get offsetWidth() { return 390; } get offsetHeight() { return 844; } get clientWidth() { return 390; } get clientHeight() { return 844; }
  // état lisible, pour comparer deux versions de la page
  etat() {
    return { t: this.tagName, id: this.id, h: this.hidden, tx: this.textContent, html: this._html, c: this.className, v: this.value,
      d: this.disabled, a: this.attrs, ds: this.dataset, s: Object.keys(this.style).filter(k => k !== 'setProperty').map(k => k + ':' + this.style[k]),
      ch: this.children.map(c => c.etat()) };
  }
}

function fauxStockage() {
  const m = new Map();
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k),
    key: i => [...m.keys()][i] ?? null, get length() { return m.size; }, _m: m };
}

// charge index.html dans le faux navigateur. Renvoie { g, erreurs, el, avancer, images, etat }.
function chargerPage({ maintenant = Date.UTC(2026, 9, 25, 10, 0), langues = ['fr-FR'], stockage } = {}) {
  const html = lire('index.html');
  const corps = html.slice(html.indexOf('<body>')).replace(/<script\b[\s\S]*?<\/script>/g, ''); // le code n'est pas du HTML
  const els = new Map(); const tous = [];
  for (const m of corps.matchAll(/<([a-zA-Z][\w-]*)((?:\s+[\w-]+(?:="[^"]*")?)*)\s*\/?>/g)) {
    const attrs = {}; for (const a of m[2].matchAll(/([\w-]+)(?:="([^"]*)")?/g)) attrs[a[1]] = a[2] ?? '';
    const e = new El(m[1], attrs); tous.push(e); if (attrs.id) els.set(attrs.id, e);
  }
  const erreurs = []; let horloge = 0; let minuteurs = []; let idMin = 1; let images = [];
  const ecoute = {};
  const documentElement = new El('html');
  const document = {
    documentElement, body: new El('body'), hidden: false, fonts: { load: () => Promise.resolve([]) },
    getElementById: id => els.get(id) || null,
    createElement: tag => new El(tag),
    querySelectorAll: sel => { const m = /^\[([\w-]+)\]$/.exec(sel); return m ? tous.filter(e => m[1].slice(5) in e.dataset) : []; },
    querySelector: () => null,
    addEventListener: (t, f) => (ecoute['doc:' + t] = ecoute['doc:' + t] || []).push(f),
  };
  const g = {
    document, console, Intl, JSON, Math: Object.create(Math), URL, Promise, Uint8Array, Uint8ClampedArray, Blob: class {}, File: class {},
    localStorage: stockage || fauxStockage(),
    navigator: { language: langues[0], languages: langues, vibrate: () => true, clipboard: undefined },
    location: { href: 'https://resonance-jeu.github.io/', search: '', hash: '', origin: 'https://resonance-jeu.github.io' },
    history: { pushState() {}, replaceState() {}, back() {} },
    innerWidth: 390, innerHeight: 844, devicePixelRatio: 2,
    matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
    performance: { now: () => horloge },
    setTimeout: (f, ms = 0) => { minuteurs.push({ id: idMin, t: horloge + ms, f }); return idMin++; },
    clearTimeout: id => { minuteurs = minuteurs.filter(m => m.id !== id); },
    setInterval: () => 0, clearInterval() {},
    requestAnimationFrame: f => { images.push(f); return images.length; }, cancelAnimationFrame() {},
    addEventListener: (t, f) => (ecoute[t] = ecoute[t] || []).push(f), removeEventListener() {},
    atob: s => Buffer.from(s, 'base64').toString('binary'), btoa: s => Buffer.from(s, 'binary').toString('base64'),
    TextEncoder, TextDecoder, encodeURIComponent, decodeURIComponent,
  };
  g.window = g; g.self = g;
  vm.createContext(g);
  // date figée et hasard reproductible : deux chargements donnent exactement le même état
  vm.runInContext(`(() => { const D = Date, T = ${maintenant};
    Date = class extends D { constructor(...a) { a.length ? super(...a) : super(T); } static now() { return T; } };
    let s = 12345; Math.random = () => { s = s + 0x6D2B79F5 | 0; let x = Math.imul(s ^ s >>> 15, 1 | s); x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; };
  })();`, g);
  const garde = (nom, f) => { try { f(); } catch (e) { erreurs.push(nom + ' : ' + (e && e.stack || e)); } };
  for (const s of scripts(html)) garde(s.nom, () => vm.runInContext(s.code, g, { filename: s.nom }));
  garde('load', () => (ecoute.load || []).forEach(f => f({})));
  const avancer = ms => {
    const fin = horloge + ms;
    for (;;) {
      minuteurs.sort((a, b) => a.t - b.t || a.id - b.id);
      const m = minuteurs[0]; if (!m || m.t > fin) break;
      minuteurs.shift(); horloge = Math.max(horloge, m.t); garde('minuteur', m.f);
    }
    horloge = fin;
  };
  const faireImages = n => {
    for (let i = 0; i < n; i++) { avancer(1000 / 60); const f = images; images = []; f.forEach(cb => garde('image', () => cb(horloge))); }
  };
  const etat = () => JSON.stringify({ els: tous.filter(e => !/^(STYLE|SCRIPT|LINK|META)$/.test(e.tagName)).map(e => e.etat()), lang: documentElement.lang, stock: [...g.localStorage._m || []] });
  return { g, erreurs, el: id => els.get(id), avancer, images: faireImages, etat, garde };
}

// parcours d'un joueur : écran d'accueil, chaque mode joué quelques secondes avec des tirs, puis retour au menu
function parcours(p) {
  p.avancer(2000); p.images(20);
  const modes = [...'mTuto mArcade mDaily mPuzzle mChrono mSurv mRhythm mMelody mCoop mDuel mZen mCamp mEditor'.split(' ')]
    .filter(id => p.el(id) && p.el(id).onclick);
  for (const id of modes) {
    p.garde(id, () => p.el(id).onclick({}));
    p.images(40);
    for (const [x, y] of [[120, 300], [270, 520], [195, 420]]) {
      p.garde('tir', () => { p.el('c').envoyer('pointerdown', { clientX: x, clientY: y }); p.el('c').envoyer('pointerup', { clientX: x, clientY: y }); });
      p.images(30);
    }
    p.images(240);
    p.garde('retour', () => { while (p.g.resonanceBack() !== false) p.avancer(600); });
    p.avancer(1000); p.images(5);
  }
  for (const [o, f] of [['openSet', 'closeSet'], ['openStats', 'closeStats']]) {
    p.garde(o, () => { p.el(o).onclick({}); p.el(f).onclick({}); });
  }
  return modes;
}

// objet I18N tel que la page le construit
const textes = () => vm.runInContext('I18N', chargerPage().g);

module.exports = { racine, lire, scripts, styles, urlsStyles, serviceWorker, sourceJeu, chargerPage, parcours, textes };
