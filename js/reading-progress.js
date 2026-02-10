(function() {
  'use strict';

  var bar = document.getElementById('reading-progress');
  if (!bar) return;

  var ticking = false;
  window.addEventListener('scroll', function() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(function() {
        var h = document.documentElement;
        var scroll = h.scrollTop || document.body.scrollTop;
        var total = h.scrollHeight - h.clientHeight;
        var pct = total > 0 ? Math.round(scroll / total * 100) : 0;
        bar.style.width = pct + '%';
        bar.setAttribute('aria-valuenow', pct);
        ticking = false;
      });
    }
  });
})();
