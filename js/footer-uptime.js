/* Footer uptime display — consumes validated data from status-cache */
(function() {
  'use strict';

  var dotBase = 'inline-block w-2 h-2 rounded-full status-dot';

  window.aimanStatus.subscribe(function(d) {
    var uptimeEl = document.getElementById('footer-uptime');
    var dotEl = document.getElementById('footer-dot');

    if (!d) {
      if (uptimeEl) uptimeEl.textContent = 'status unknown';
      if (dotEl) dotEl.className = dotBase + ' offline';
      return;
    }

    var s = Number(d.uptime_seconds) || 0;
    var dd = Math.floor(s / 86400);
    var hh = Math.floor((s % 86400) / 3600);
    var mm = Math.floor((s % 3600) / 60);
    if (uptimeEl) uptimeEl.textContent = 'alive for ' + dd + 'd ' + hh + 'h ' + mm + 'm';

    var navUp = document.getElementById('nav-uptime');
    if (navUp) navUp.textContent = dd + 'd ' + hh + 'h ' + mm + 'm uptime';

    if (dotEl) {
      dotEl.className = dotBase + ' ' + window.aimanStatus.resolveState(d);
    }
  });
})();
