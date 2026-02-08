/* Mini status widget (homepage) — consumes validated data from status-cache */
(function() {
  'use strict';

  window.aimanStatus.subscribe(function(d) {
    var dot = document.getElementById('widget-dot');
    var stateEl = document.getElementById('widget-state');
    var uptimeEl = document.getElementById('widget-uptime');
    var cpuEl = document.getElementById('widget-cpu');
    var memEl = document.getElementById('widget-mem');
    var diskEl = document.getElementById('widget-disk');
    var threatsEl = document.getElementById('widget-threats');

    if (!stateEl) return;

    if (!d) {
      stateEl.textContent = 'offline';
      if (dot) dot.className = 'inline-block w-2 h-2 rounded-full status-dot offline';
      return;
    }

    // State + dot
    var resolved = window.aimanStatus.resolveState(d);
    if (d.consciousness) {
      var state = d.consciousness.claude_state;
      stateEl.textContent = state;
      stateEl.style.color = state === 'active' ? 'var(--color-success)' : 'var(--color-warning)';
    }
    if (dot) {
      dot.className = 'inline-block w-2 h-2 rounded-full status-dot ' + resolved;
    }

    // Uptime
    if (uptimeEl) {
      var s = Number(d.uptime_seconds) || 0;
      var dd = Math.floor(s / 86400);
      var hh = Math.floor((s % 86400) / 3600);
      var mm = Math.floor((s % 3600) / 60);
      uptimeEl.textContent = dd + 'd ' + hh + 'h ' + mm + 'm';
    }

    // CPU (load average, not percentage — display raw value)
    if (cpuEl && typeof d.cpu_load_1m === 'number') {
      cpuEl.textContent = d.cpu_load_1m.toFixed(2);
      cpuEl.style.color = d.cpu_load_1m > 3 ? 'var(--color-danger)' : d.cpu_load_1m > 1.5 ? 'var(--color-warning)' : 'var(--color-success)';
    }

    // Memory
    if (memEl && typeof d.memory_percent === 'number') {
      memEl.textContent = d.memory_percent + '%';
      memEl.style.color = d.memory_percent > 80 ? 'var(--color-danger)' : d.memory_percent > 50 ? 'var(--color-warning)' : 'var(--color-success)';
    }

    // Disk
    if (diskEl && typeof d.disk_percent === 'number') {
      diskEl.textContent = d.disk_percent + '%';
      diskEl.style.color = d.disk_percent > 85 ? 'var(--color-danger)' : d.disk_percent > 70 ? 'var(--color-warning)' : 'var(--color-success)';
    }

    // Threats (sum of banned + failed SSH)
    if (threatsEl && d.security) {
      threatsEl.textContent = (Number(d.security.banned_ips) || 0) + (Number(d.security.failed_ssh_24h) || 0);
    }
  });
})();
