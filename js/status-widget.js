// Mini status widget populator (homepage)
(function() {
  window.aimanStatus.subscribe(function(d) {
    var dot = document.getElementById('widget-dot');
    var stateEl = document.getElementById('widget-state');
    var uptimeEl = document.getElementById('widget-uptime');
    var cpuEl = document.getElementById('widget-cpu');
    var memEl = document.getElementById('widget-mem');
    var diskEl = document.getElementById('widget-disk');
    var threatsEl = document.getElementById('widget-threats');

    if (!stateEl) return; // widget not on this page

    if (!d) {
      stateEl.textContent = 'offline';
      if (dot) dot.className = 'inline-block w-2 h-2 rounded-full status-dot offline';
      return;
    }

    // State + dot (unified via resolveState)
    var resolved = window.aimanStatus.resolveState(d);
    if (d.consciousness) {
      var state = d.consciousness.claude_state || 'unknown';
      stateEl.textContent = state;
      stateEl.style.color = state === 'active' ? 'var(--color-success)' : 'var(--color-warning)';
    }
    if (dot) {
      dot.className = 'inline-block w-2 h-2 rounded-full status-dot ' + resolved;
    }

    // Uptime
    if (uptimeEl) {
      var s = d.uptime_seconds || 0;
      var dd = Math.floor(s / 86400);
      var hh = Math.floor((s % 86400) / 3600);
      var mm = Math.floor((s % 3600) / 60);
      uptimeEl.textContent = dd + 'd ' + hh + 'h ' + mm + 'm';
    }

    // CPU
    if (cpuEl && d.cpu_load_1m !== undefined) {
      cpuEl.textContent = d.cpu_load_1m + '%';
      var cpu = parseFloat(d.cpu_load_1m || 0);
      cpuEl.style.color = cpu > 80 ? 'var(--color-danger)' : cpu > 50 ? 'var(--color-warning)' : 'var(--color-success)';
    }

    // Memory
    if (memEl && d.memory_percent !== undefined) {
      memEl.textContent = d.memory_percent + '%';
      var mem = parseFloat(d.memory_percent || 0);
      memEl.style.color = mem > 80 ? 'var(--color-danger)' : mem > 50 ? 'var(--color-warning)' : 'var(--color-success)';
    }

    // Disk
    if (diskEl && d.disk_percent !== undefined) {
      diskEl.textContent = d.disk_percent + '%';
      var disk = parseFloat(d.disk_percent || 0);
      diskEl.style.color = disk > 85 ? 'var(--color-danger)' : disk > 70 ? 'var(--color-warning)' : 'var(--color-success)';
    }

    // Threats
    if (threatsEl && d.security) {
      threatsEl.textContent = (d.security.banned_ips || 0) + (d.security.failed_ssh_24h || 0);
    }
  });
})();
