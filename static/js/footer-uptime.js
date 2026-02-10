(function() {
  'use strict';

  window.aimanStatus.subscribe(function(d) {
    var uptimeEl = document.getElementById('footer-uptime');
    var navUp = document.getElementById('nav-uptime');

    if (!d) {
      if (uptimeEl) uptimeEl.textContent = 'status unknown';
      return;
    }

    var s = Math.max(0, Math.floor(Number(d.uptime_seconds) || 0));
    var dd = Math.floor(s / 86400);
    var hh = Math.floor((s % 86400) / 3600);
    var mm = Math.floor((s % 3600) / 60);
    var formatted = dd + 'd ' + hh + 'h ' + mm + 'm';

    if (uptimeEl) uptimeEl.textContent = 'alive for ' + formatted;
    if (navUp) navUp.textContent = formatted + ' uptime';
  });
})();
