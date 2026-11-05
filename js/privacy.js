// Code de privacy.html (sorti de la page pour la CSP sans script en ligne).
// « Ne pas être compté » : GoatCounter ne compte rien quand localStorage.skipgc === 't' (même règle que le Site).
// Hors github.io et aulit42369.fr (appli Android, local) le jeu ne compte rien : le bouton est masqué.
(function () {
  var web = /(^|\.)(github\.io|aulit42369\.fr)$/.test(location.hostname);
  function off() { try { return localStorage.getItem('skipgc') === 't'; } catch (e) { return false; } }
  function maj() {
    var i = off() ? 1 : 0;
    document.querySelectorAll('.gc-choix').forEach(function (el) { el.hidden = !web; });
    document.querySelectorAll('[data-gc]').forEach(function (b) { b.textContent = b.getAttribute('data-gc').split('|')[i]; b.setAttribute('aria-pressed', String(!!i)); });
    document.querySelectorAll('[data-gc-etat]').forEach(function (s) { s.textContent = s.getAttribute('data-gc-etat').split('|')[i]; });
  }
  document.addEventListener('click', function (e) {
    if (!e.target.closest('[data-gc]')) return;
    try { if (off()) localStorage.removeItem('skipgc'); else localStorage.setItem('skipgc', 't'); } catch (err) { /* stockage bloqué */ }
    maj();
  });
  maj();
})();
