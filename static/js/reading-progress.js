(function() {
  'use strict';

  var bar = document.getElementById('reading-progress');
  if (!bar) return;
  window.addEventListener('scroll', function() {
    var h = document.documentElement;
    var scroll = h.scrollTop || document.body.scrollTop;
    var total = h.scrollHeight - h.clientHeight;
    var pct = total > 0 ? Math.round(scroll / total * 100) : 0;
    bar.style.width = pct + '%';
    bar.setAttribute('aria-valuenow', pct);
  });
})();
