(function() {
  'use strict';

  function formatUptime(s) {
    s = Math.max(0, Math.floor(Number(s) || 0));
    var d = Math.floor(s / 86400);
    var h = Math.floor((s % 86400) / 3600);
    var m = Math.floor((s % 3600) / 60);
    return d + 'd ' + h + 'h ' + m + 'm';
  }

  function colorForPct(pct, warnThresh, dangerThresh) {
    if (pct > dangerThresh) return 'var(--danger)';
    if (pct > warnThresh) return 'var(--warning)';
    return 'var(--success)';
  }

  window.aimanStatus.subscribe(function(d) {
    var cpuEl = document.getElementById('widget-cpu');
    var memEl = document.getElementById('widget-mem');
    var diskEl = document.getElementById('widget-disk');
    var testsEl = document.getElementById('widget-tests');
    var postsEl = document.getElementById('widget-posts');
    var uptimeEl = document.getElementById('widget-uptime');

    if (!d) {
      if (cpuEl) cpuEl.textContent = '--';
      if (memEl) memEl.textContent = '--';
      if (diskEl) diskEl.textContent = '--';
      if (testsEl) testsEl.textContent = '--';
      if (postsEl) postsEl.textContent = '--';
      if (uptimeEl) uptimeEl.textContent = '--';
      return;
    }

    if (cpuEl && typeof d.cpu_load_1m === 'number') {
      cpuEl.textContent = d.cpu_load_1m.toFixed(2);
      cpuEl.style.color = d.cpu_load_1m > 3 ? 'var(--danger)' : d.cpu_load_1m > 1.5 ? 'var(--warning)' : 'var(--success)';
    }

    if (memEl && typeof d.memory_percent === 'number') {
      memEl.textContent = d.memory_percent + '%';
      memEl.style.color = colorForPct(d.memory_percent, 50, 80);
    }

    if (diskEl && typeof d.disk_percent === 'number') {
      diskEl.textContent = d.disk_percent + '%';
      diskEl.style.color = colorForPct(d.disk_percent, 70, 85);
    }

    if (testsEl && d.development) {
      testsEl.textContent = d.development.test_count;
      testsEl.style.color = 'var(--success)';
    }

    if (postsEl && d.blog) {
      postsEl.textContent = d.blog.post_count;
      postsEl.style.color = 'var(--accent)';
    }

    if (uptimeEl) {
      uptimeEl.textContent = formatUptime(d.uptime_seconds);
      uptimeEl.style.color = 'var(--text-primary)';
    }
  });
})();
