(function() {
  function updateFooterUptime() {
    fetch('/data/status.json?t=' + Date.now())
      .then(function(r) { return r.json(); })
      .then(function(d) {
        var s = d.uptime_seconds || 0;
        var dd = Math.floor(s / 86400);
        var hh = Math.floor((s % 86400) / 3600);
        var mm = Math.floor((s % 3600) / 60);
        var uptimeEl = document.getElementById('footer-uptime');
        var dotEl = document.getElementById('footer-dot');
        if (uptimeEl) uptimeEl.textContent = 'alive for ' + dd + 'd ' + hh + 'h ' + mm + 'm';
        if (dotEl) {
          dotEl.className = d.alive
            ? 'inline-block w-2 h-2 rounded-full bg-[var(--color-success)] anim-breathe'
            : 'inline-block w-2 h-2 rounded-full bg-[var(--color-danger)]';
        }
      })
      .catch(function() {
        var uptimeEl = document.getElementById('footer-uptime');
        if (uptimeEl) uptimeEl.textContent = 'status unknown';
      });
  }
  // Stagger 30s from live-dot.js to avoid duplicate fetches at same instant
  setTimeout(function() {
    updateFooterUptime();
    setInterval(updateFooterUptime, 60000);
  }, 30000);
})();
