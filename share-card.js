// Carte image du Défi du jour (1080×1920, format story) et son partage.
// Ordre de partage : pont de l'appli Android (window.AndroidShare), sinon partage natif avec fichier, sinon téléchargement.
// Aucune dépendance ; chargeable dans le navigateur (window.ShareCard) et sous Node (tests).
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ShareCard = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var W = 1080, H = 1920, X = 90;
  var DISPLAY = '"Unbounded", "Arial Black", sans-serif', MONO = '"IBM Plex Mono", ui-monospace, monospace';
  var FLAMME = 'M4.6 0C5 2.4 8.6 4 8.6 7.6A4.1 4.1 0 0 1 .4 7.6C.4 5.6 1.7 4.4 2.5 3.4c.1 1.3.7 2.1 1.5 2.4C3.6 3.9 3.9 1.9 4.6 0z';

  function rgba(hex, a) {
    var n = parseInt(String(hex).replace('#', ''), 16);
    return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  // réduit la police jusqu'à ce que le texte tienne dans « max » pixels
  function fit(ctx, txt, police, taille, max) {
    ctx.font = police(taille);
    while (taille > 12 && ctx.measureText(txt).width > max) { taille -= 4; ctx.font = police(taille); }
    return taille;
  }

  // deux émetteurs dont les ondes se croisent sur un nœud allumé (le principe du jeu)
  function ondes(ctx, c) {
    var A = { x: 170, y: 560 }, B = { x: 930, y: 380 }, N = { x: 610, y: 700 };
    [[A, c.acc], [B, c.p2]].forEach(function (e) {
      var d = Math.hypot(N.x - e[0].x, N.y - e[0].y);
      for (var r = d % 64 || 64; r < 1500; r += 64) {
        var proche = Math.abs(r - d) < 1;
        ctx.strokeStyle = rgba(e[1], proche ? 0.85 : Math.max(0.05, 0.34 * (1 - r / 1500)));
        ctx.lineWidth = proche ? 5 : 2.5;
        ctx.beginPath(); ctx.arc(e[0].x, e[0].y, r, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.fillStyle = e[1]; ctx.beginPath(); ctx.arc(e[0].x, e[0].y, 14, 0, Math.PI * 2); ctx.fill();
    });
    var g = ctx.createRadialGradient(N.x, N.y, 0, N.x, N.y, 150);
    g.addColorStop(0, rgba(c.acc, 0.9)); g.addColorStop(0.25, rgba(c.acc, 0.35)); g.addColorStop(1, rgba(c.acc, 0));
    ctx.fillStyle = g; ctx.fillRect(N.x - 150, N.y - 150, 300, 300);
    ctx.fillStyle = c.bone; ctx.beginPath(); ctx.arc(N.x, N.y, 20, 0, Math.PI * 2); ctx.fill();
    // fondu vers l'encre : la zone de texte reste lisible
    var f = ctx.createLinearGradient(0, 860, 0, 1120);
    f.addColorStop(0, rgba(c.ink, 0)); f.addColorStop(1, rgba(c.ink, 1));
    ctx.fillStyle = f; ctx.fillRect(0, 860, W, H - 860);
  }

  // o : { kicker, titre, scoreLbl, score, niveaux:[{used,max,extra}], serie (texte ou ''), url,
  //       couleurs:{ ink, bone, acc, rose, dust, p2 } (palette active du joueur) }
  function draw(ctx, o) {
    var c = o.couleurs;
    ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    ctx.fillStyle = c.ink; ctx.fillRect(0, 0, W, H);
    ondes(ctx, c);

    // logo « Réso·nance », la seconde moitié en couleur d'accent comme dans le menu
    ctx.font = '900 112px ' + DISPLAY;
    ctx.fillStyle = c.bone; ctx.fillText('Réso', X, 230);
    var w = ctx.measureText('Réso').width;
    ctx.fillStyle = c.acc; ctx.fillText('nance', X + w, 230);

    ctx.fillStyle = c.acc; ctx.font = '500 34px ' + MONO;
    ctx.fillText(String(o.kicker).toUpperCase(), X, 1110);
    ctx.fillStyle = c.bone;
    fit(ctx, o.titre, function (s) { return '700 ' + s + 'px ' + DISPLAY; }, 84, W - 2 * X);
    ctx.fillText(o.titre, X, 1210);

    ctx.fillStyle = c.dust; ctx.font = '400 32px ' + MONO;
    ctx.fillText(String(o.scoreLbl).toUpperCase(), X, 1300);
    ctx.fillStyle = c.acc;
    fit(ctx, o.score, function (s) { return '900 ' + s + 'px ' + DISPLAY; }, 190, W - 2 * X);
    ctx.fillText(o.score, X, 1480);

    // grille : 6 niveaux, 2 par ligne (comme le texte partagé) ; carré plein = onde utilisée
    var nv = o.niveaux || [], plus = 1;
    nv.forEach(function (n) { if (n) plus = Math.max(plus, n.max); });
    var col = (W - 2 * X) / 2, pas = Math.min(46, (col - 80) / plus), cote = pas - 8;
    nv.forEach(function (n, i) {
      if (!n) return;
      var x = X + (i % 2) * col, y = 1550 + Math.floor(i / 2) * 72;
      ctx.fillStyle = c.dust; ctx.font = '500 30px ' + MONO; ctx.fillText(String(i + 1), x, y + cote - 4);
      for (var k = 0; k < n.max; k++) {
        var cx = x + 48 + k * pas;
        if (k < n.used) { ctx.fillStyle = c.acc; ctx.fillRect(cx, y, cote, cote); }
        else { ctx.strokeStyle = rgba(c.bone, 0.35); ctx.lineWidth = 2; ctx.strokeRect(cx + 1, y + 1, cote - 2, cote - 2); }
      }
      if (n.extra) { ctx.fillStyle = c.rose; ctx.font = '500 24px ' + MONO; ctx.fillText(n.extra, x + 48 + n.max * pas + 4, y + cote - 6); }
    });

    if (o.serie) {
      if (typeof Path2D === 'function') {
        ctx.save(); ctx.translate(X, 1742); ctx.scale(4, 4); ctx.fillStyle = c.acc; ctx.fill(new Path2D(FLAMME)); ctx.restore();
      }
      ctx.fillStyle = c.bone; ctx.font = '500 40px ' + MONO; ctx.fillText(o.serie, X + 56, 1786);
    }
    ctx.fillStyle = c.acc; ctx.fillRect(X, 1824, 64, 4);
    ctx.fillStyle = c.dust; ctx.font = '400 30px ' + MONO; ctx.fillText(o.url, X, 1874);
  }

  // charge les polices du jeu puis dessine la carte ; renvoie { canvas, blob }
  function render(doc, o) {
    var polices = doc.fonts && doc.fonts.load
      ? Promise.all(['900 112px Unbounded', '700 84px Unbounded', '400 32px "IBM Plex Mono"', '500 32px "IBM Plex Mono"']
          .map(function (p) { return doc.fonts.load(p, 'Résonance #0123456789').catch(function () {}); }))
      : Promise.resolve();
    return polices.then(function () {
      var cv = doc.createElement('canvas'); cv.width = W; cv.height = H;
      draw(cv.getContext('2d'), o);
      return new Promise(function (ok) { cv.toBlob(function (b) { ok({ canvas: cv, blob: b }); }, 'image/png'); });
    });
  }

  function telecharge(env, blob, nom) {
    var u = env.URL.createObjectURL(blob), a = env.doc.createElement('a');
    a.href = u; a.download = nom; env.doc.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { env.URL.revokeObjectURL(u); }, 10000);
    return 'telechargement';
  }

  // carte : { canvas, blob } (de render) ; renvoie 'partage', 'telechargement', 'echec' ou null (annulé par le joueur)
  function share(carte, texte, nom, env) {
    env = env || { win: self, nav: navigator, doc: document, URL: URL, File: typeof File === 'function' ? File : null };
    var pont = env.win && env.win.AndroidShare;
    if (pont && typeof pont.shareImage === 'function') {
      var b64 = carte.canvas.toDataURL('image/png').split(',')[1];
      return Promise.resolve(pont.shareImage(b64, texte) ? 'partage' : 'echec');
    }
    var nav = env.nav || {}, fichier = null;
    try { if (env.File) fichier = new env.File([carte.blob], nom, { type: 'image/png' }); } catch (e) { fichier = null; }
    if (fichier && typeof nav.share === 'function' && typeof nav.canShare === 'function' && nav.canShare({ files: [fichier] })) {
      var p;
      try { p = Promise.resolve(nav.share({ files: [fichier], text: texte })); } catch (e) { p = Promise.reject(e); }
      return p.then(function () { return 'partage'; },
        function (e) { return e && e.name === 'AbortError' ? null : telecharge(env, carte.blob, nom); });
    }
    return Promise.resolve(telecharge(env, carte.blob, nom));
  }

  return { W: W, H: H, draw: draw, render: render, share: share };
});
