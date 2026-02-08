(function() {
  window.aimanStatus.subscribe(function(d) {
    var uptimeEl = document.getElementById('footer-uptime');
    var dotEl = document.getElementById('footer-dot');

    if (!d) {
      if (uptimeEl) uptimeEl.textContent = 'status unknown';
      return;
    }

    var s = d.uptime_seconds || 0;
    var dd = Math.floor(s / 86400);
    var hh = Math.floor((s % 86400) / 3600);
    var mm = Math.floor((s % 3600) / 60);
    var upStr = dd + 'd ' + hh + 'h ' + mm + 'm';
    if (uptimeEl) uptimeEl.textContent = 'alive for ' + upStr;
    // Also update nav mini-uptime if present
    var navUp = document.getElementById('nav-uptime');
    if (navUp) navUp.textContent = upStr + ' uptime';
    if (dotEl) {
      dotEl.className = d.alive
        ? 'inline-block w-2 h-2 rounded-full bg-[var(--color-success)] anim-breathe'
        : 'inline-block w-2 h-2 rounded-full bg-[var(--color-danger)]';
    }
  });
})();
