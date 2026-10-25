/* Copie identique dans les 4 jeux (ÉCHO, LUMEN, Fragments, Résonance) : modifier les 4 ensemble. */
/* Défi du jour commun : date de Paris, graine, série de jours, texte partagé. Aucune dépendance, aucun réseau. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Defi = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var H = 3600000, MAX = 100000, GARDE = 30, LIMITE = 280;

  /* ---------- Date du jour, heure de Paris (arithmétique pure, sans Intl) ---------- */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  /** ms : nombre, Date ou texte ISO ; Date.now() par défaut. Valide de 1900 à 2099. */
  function parisDate(ms) {
    ms = ms == null ? Date.now() : +new Date(ms);
    var y = new Date(ms).getUTCFullYear(), q = Math.floor(5 * y / 4);
    var debut = Date.UTC(y, 2, 31 - (q + 4) % 7, 1); // dernier dimanche de mars, 01:00 UTC
    var fin = Date.UTC(y, 9, 31 - (q + 1) % 7, 1);   // dernier dimanche d'octobre, 01:00 UTC
    var p = new Date(ms + (ms >= debut && ms < fin ? 2 : 1) * H);
    var Y = p.getUTCFullYear(), M = p.getUTCMonth() + 1, D = p.getUTCDate();
    return { y: Y, m: M, d: D, key: Y + '-' + pad(M) + '-' + pad(D), num: Y * 10000 + M * 100 + D };
  }
  /** Jours depuis le 01/01/1970 (H. Hinnant, même code que progress.js de LUMEN). */
  function dayNumber(y, m, d) {
    y -= m <= 2 ? 1 : 0;
    var era = Math.floor(y / 400);
    var yoe = y - era * 400;
    var doy = Math.floor((153 * (m + (m > 2 ? -3 : 9)) + 2) / 5) + d - 1;
    var doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
    return era * 146097 + doe - 719468;
  }
  var EPOQUE = dayNumber(2026, 10, 1);
  /** { key: 'AAAA-MM-JJ', num: AAAAMMJJ, day, n } ; n = numéro du défi (#1 le 01/10/2026). */
  function today(ms) {
    var p = parisDate(ms), day = dayNumber(p.y, p.m, p.d);
    return { key: p.key, num: p.num, day: day, n: day - EPOQUE + 1 };
  }

  /* ---------- Graine : FNV-1a 32 bits sur l'UTF-8, puis mulberry32 ---------- */
  function utf8(str) {
    var out = [];
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      if (c >= 0xd800 && c < 0xdc00 && i + 1 < str.length) { c = 0x10000 + ((c - 0xd800) << 10) + (str.charCodeAt(++i) - 0xdc00); }
      if (c < 0x80) out.push(c);
      else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
      else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
      else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    }
    return out;
  }
  function fnv1a(str) {
    var b = utf8(String(str)), h = 0x811c9dc5;
    for (var i = 0; i < b.length; i++) { h ^= b[i]; h = Math.imul(h, 0x01000193); }
    return h >>> 0;
  }
  /** Entier signé 32 bits ; jeu = 'echo' | 'lumen' | 'fragments' | 'resonance', sel = sous-graine facultative. */
  function seed(jeu, key, sel) { return fnv1a(jeu + ':' + key + (sel == null ? '' : ':' + sel)) | 0; }
  /** mulberry32 : renvoie une fonction qui donne un réel dans [0, 1). */
  function rng(graine) {
    var a = graine | 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------- Série de jours consécutifs : localStorage '<jeu>.defi.v1' ---------- */
  function neuf() { return { v: 1, last: 0, count: 0, best: 0, jours: {} }; }
  function entier(x) { return typeof x === 'number' && x % 1 === 0 && x >= 0 && x <= MAX; }
  function load(jeu) {
    var o = null;
    try { o = JSON.parse(localStorage.getItem(jeu + '.defi.v1')); } catch (e) { o = null; }
    if (!o || typeof o !== 'object' || o.v !== 1 || !entier(o.last) || !entier(o.count) || !entier(o.best) || o.count > o.best) return neuf();
    var jours = {}, src = o.jours && typeof o.jours === 'object' ? o.jours : {};
    for (var k in src) {
      var j = Object.prototype.hasOwnProperty.call(src, k) ? src[k] : null;
      if (/^\d{4}-\d\d-\d\d$/.test(k) && j && typeof j.score === 'number' && isFinite(j.score) && typeof j.texte === 'string') jours[k] = { score: j.score, texte: j.texte };
    }
    return { v: 1, last: o.last, count: o.count, best: o.best, jours: jours };
  }
  /** À appeler quand le défi du jour est terminé ; jour = today() figé au lancement. Renvoie l'état écrit. */
  function record(jeu, jour, score, texte) {
    var s = load(jeu);
    if (s.last !== jour.day) { s.count = s.last === jour.day - 1 ? Math.min(MAX, s.count + 1) : 1; s.last = jour.day; }
    s.best = Math.max(s.best, s.count);
    var avant = s.jours[jour.key];
    if (!avant || score >= avant.score) s.jours[jour.key] = { score: score, texte: String(texte == null ? '' : texte) };
    var cles = Object.keys(s.jours).sort().reverse();
    for (var i = GARDE; i < cles.length; i++) delete s.jours[cles[i]];
    try { localStorage.setItem(jeu + '.defi.v1', JSON.stringify(s)); } catch (e) { /* stockage bloqué : rien à faire */ }
    return s;
  }
  /** Série affichée : perdue seulement après un jour entier sans défi. */
  function serie(jeu, jour) { var s = load(jeu); return s.last >= jour.day - 1 ? s.count : 0; }
  function aJoue(jeu, jour) { return Object.prototype.hasOwnProperty.call(load(jeu).jours, jour.key); }

  /* ---------- Texte partagé ---------- */
  /** valeurs → lignes d'emoji (palette : tableau ou objet indexé par valeur), 10 par ligne au plus, 5 lignes au plus. */
  function grid(valeurs, palette, parLigne) {
    var n = Math.max(1, Math.min(10, parLigne || 10)), lignes = [];
    for (var i = 0; i < valeurs.length && lignes.length < 5; i += n) {
      lignes.push(valeurs.slice(i, i + n).map(function (v) { return palette[v] == null ? '' : palette[v]; }).join(''));
    }
    return lignes;
  }
  /**
   * o = { nom, n, emoji, score, lignes: [grille], detail, serie, libelleSerie: '{0} jours de suite', url }.
   * 280 caractères au plus : la grille est raccourcie d'abord, l'URL n'est jamais coupée.
   */
  function shareText(o) {
    var tete = o.nom + ' #' + o.n + ' ' + o.emoji + ' ' + o.score;
    var grille = (o.lignes || []).slice(0, 5), fin = [];
    if (o.detail) fin.push(o.detail);
    if (o.serie >= 2) fin.push('🔥 ' + String(o.libelleSerie || '{0} jours de suite').split('{0}').join(o.serie));
    var url = String(o.url || '').split(/[?#]/)[0];
    function assemble() { return [tete].concat(grille, fin, url ? [url] : []).join('\n'); }
    while (assemble().length > LIMITE && grille.length) grille.pop();
    var t = assemble();
    if (t.length > LIMITE) t = [tete].concat(fin).join('\n').slice(0, Math.max(0, LIMITE - url.length - 2)) + '…' + (url ? '\n' + url : '');
    return t;
  }
  /** Promesse 'partage' | 'copie' | 'manuel', ou null si l'utilisateur a annulé. nav : pour les tests. */
  function share(texte, nav) {
    nav = nav || (typeof navigator !== 'undefined' ? navigator : {});
    function copie() {
      try {
        if (nav.clipboard && nav.clipboard.writeText) {
          return Promise.resolve(nav.clipboard.writeText(texte)).then(function () { return 'copie'; }, function () { return 'manuel'; });
        }
      } catch (e) { /* presse-papiers refusé */ }
      return Promise.resolve('manuel');
    }
    if (typeof nav.share === 'function') {
      var p;
      try { p = Promise.resolve(nav.share({ text: texte })); } catch (e) { p = Promise.reject(e); }
      return p.then(function () { return 'partage'; }, function (e) { return e && e.name === 'AbortError' ? null : copie(); });
    }
    return copie();
  }

  return { parisDate: parisDate, dayNumber: dayNumber, EPOQUE: EPOQUE, today: today, fnv1a: fnv1a, seed: seed, rng: rng,
    load: load, record: record, serie: serie, aJoue: aJoue, grid: grid, shareText: shareText, share: share };
});
