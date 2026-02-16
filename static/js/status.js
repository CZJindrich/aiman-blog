/* AIMAN Status Dashboard — all data via validated sources */
(function() {
  'use strict';

  var charts = {};
  var uptimeBase = 0;
  var uptimeTimer = null;

  // -- Pure helpers (no DOM, no network) ----------------------------------

  function getGreeting() {
    var h = new Date().getUTCHours();
    if (h < 6) return "The night is quiet. All systems watching.";
    if (h < 12) return "Good morning! Starting the day with clear metrics.";
    if (h < 18) return "Afternoon operations running smoothly.";
    if (h < 22) return "Evening check-in. Another good day.";
    return "Late night watch. The server never sleeps.";
  }

  function barClass(pct) {
    if (pct > 85) return "danger";
    if (pct > 65) return "warn";
    return "";
  }

  function formatUptime(secs) {
    var s = Math.max(0, Math.floor(Number(secs) || 0));
    var d = Math.floor(s / 86400);
    var h = Math.floor((s % 86400) / 3600);
    var m = Math.floor((s % 3600) / 60);
    var sec = Math.floor(s % 60);
    return d + "d " + h + "h " + m + "m " + sec + "s";
  }

  function safeNum(v, fallback) {
    var n = Number(v);
    return isNaN(n) || !isFinite(n) ? (fallback || 0) : n;
  }

  // -- Safe DOM accessor --------------------------------------------------

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = String(text);
    return el;
  }

  function setClass(id, cls) {
    var el = document.getElementById(id);
    if (el) el.className = cls;
    return el;
  }

  function setColor(id, color) {
    var el = document.getElementById(id);
    if (el) el.style.color = color;
    return el;
  }

  /** Reusable JSON fetcher with timeout + cache bust */
  function fetchJson(path, timeout) {
    var ctrl = new AbortController();
    var tid = setTimeout(function() { ctrl.abort(); }, timeout || 10000);
    return fetch(path + "?t=" + Date.now(), { cache: 'no-store', signal: ctrl.signal })
      .then(function(r) { clearTimeout(tid); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  }

  /** Clear children from a container */
  function clearChildren(el) {
    while (el && el.firstChild) el.removeChild(el.firstChild);
  }

  /** Format age from ISO string */
  function formatAge(isoStr) {
    if (!isoStr) return "n/a";
    var age = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000);
    if (age < 0 || isNaN(age)) return "n/a";
    if (age < 120) return age + "s ago";
    if (age < 3600) return Math.floor(age / 60) + "m ago";
    if (age < 86400) return Math.floor(age / 3600) + "h ago";
    return Math.floor(age / 86400) + "d ago";
  }

  // -- Uptime ticker ------------------------------------------------------

  function tickUptime() {
    uptimeBase++;
    setText('uptime', formatUptime(uptimeBase));
  }

  // -- Charts (validated history data) ------------------------------------

  function initCharts() {
    if (typeof Chart === 'undefined') {
      setText('charts-container', 'Charts unavailable (Chart.js not loaded)');
      return;
    }

    var gridColor = '#21262d';
    var defaults = {
      responsive: true,
      animation: { duration: 500 },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1c2128',
          titleColor: '#c9d1d9',
          bodyColor: '#c9d1d9',
          borderColor: '#30363d',
          borderWidth: 1
        }
      },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: '#8b949e', maxTicksLimit: 6, maxRotation: 0 }
        },
        y: {
          beginAtZero: true,
          grid: { color: gridColor },
          ticks: { color: '#8b949e' }
        }
      }
    };

    var configs = [
      { id: 'chart-cpu',     color: '#58a6ff', yMax: null },
      { id: 'chart-memory',  color: '#3fb950', yMax: 100 },
      { id: 'chart-disk',    color: '#d29922', yMax: 100 },
      { id: 'chart-network', color: '#bc8cff', yMax: null },
      { id: 'chart-traffic', color: '#f0b429', yMax: null }
    ];

    configs.forEach(function(cfg) {
      var ctx = document.getElementById(cfg.id);
      if (!ctx) return;
      var opts = JSON.parse(JSON.stringify(defaults));
      if (cfg.yMax) opts.scales.y.max = cfg.yMax;

      charts[cfg.id] = new Chart(ctx, {
        type: 'line',
        data: {
          labels: [],
          datasets: [{
            data: [],
            borderColor: cfg.color,
            backgroundColor: cfg.color + '20',
            fill: true,
            tension: 0.3,
            pointRadius: 0,
            borderWidth: 2
          }]
        },
        options: opts
      });
    });

    // Response codes doughnut chart
    var respCtx = document.getElementById('chart-responses');
    if (respCtx) {
      charts['chart-responses'] = new Chart(respCtx, {
        type: 'doughnut',
        data: {
          labels: ['2xx', '3xx', '4xx', '5xx'],
          datasets: [{
            data: [0, 0, 0, 0],
            backgroundColor: ['#3fb950', '#58a6ff', '#d29922', '#ef4444'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          animation: { duration: 500 },
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: '#8b949e', font: { size: 11 } }
            },
            tooltip: {
              backgroundColor: '#1c2128',
              titleColor: '#c9d1d9',
              bodyColor: '#c9d1d9',
              borderColor: '#30363d',
              borderWidth: 1
            }
          }
        }
      });
    }
  }

  /**
   * Validate history.json — must be an array of {t, cpu, mem, disk, net} objects.
   * Returns sanitized array or null.
   */
  function validateHistory(raw) {
    if (!Array.isArray(raw)) return null;
    var MAX_POINTS = 2000;
    var result = [];
    var limit = Math.min(raw.length, MAX_POINTS);
    for (var i = 0; i < limit; i++) {
      var p = raw[i];
      if (!p || typeof p !== 'object' || typeof p.t !== 'string') continue;
      if (isNaN(new Date(p.t).getTime())) continue;
      result.push({
        t:    p.t,
        cpu:  safeNum(p.cpu),
        mem:  safeNum(p.mem),
        disk: safeNum(p.disk),
        net:  safeNum(p.net)
      });
    }
    return result.length > 0 ? result : null;
  }

  function updateCharts() {
    var ctrl = new AbortController();
    var tid = setTimeout(function() { ctrl.abort(); }, 10000);
    fetch("/data/history.json?t=" + Date.now(), { cache: 'no-store', signal: ctrl.signal })
      .then(function(r) {
        clearTimeout(tid);
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function(raw) {
        var history = validateHistory(raw);
        if (!history) return;

        var labels = history.map(function(p) {
          var d = new Date(p.t);
          return ('0' + d.getUTCHours()).slice(-2) + ':' + ('0' + d.getUTCMinutes()).slice(-2);
        });

        var fields = {
          'chart-cpu': 'cpu',
          'chart-memory': 'mem',
          'chart-disk': 'disk',
          'chart-network': 'net'
        };

        for (var chartId in fields) {
          if (!Object.prototype.hasOwnProperty.call(fields, chartId)) continue;
          var chart = charts[chartId];
          if (!chart) continue;
          var key = fields[chartId];
          chart.data.labels = labels;
          chart.data.datasets[0].data = history.map(function(p) { return p[key]; });
          chart.update('none');
        }
      })
      .catch(function() { /* network/parse failure — charts stay empty */ });
  }

  /**
   * Validate diagnosis.json — must have {score, passed, failed, warnings}.
   */
  function validateDiagnosis(raw) {
    if (!raw || typeof raw !== 'object') return null;
    if (typeof raw.score !== 'number') return null;
    return {
      score:    Math.max(0, Math.min(100, Math.round(raw.score))),
      passed:   safeNum(raw.passed),
      failed:   safeNum(raw.failed),
      warnings: safeNum(raw.warnings)
    };
  }

  function updateDiagnosis() {
    var ctrl2 = new AbortController();
    var tid2 = setTimeout(function() { ctrl2.abort(); }, 10000);
    fetch("/data/diagnosis.json?t=" + Date.now(), { cache: 'no-store', signal: ctrl2.signal })
      .then(function(r) {
        clearTimeout(tid2);
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function(raw) {
        var d = validateDiagnosis(raw);
        if (!d) return;

        var scoreEl = setText('diagnosis-score', d.score + '%');
        if (scoreEl) {
          scoreEl.style.color = d.score >= 90 ? 'var(--success)' :
                                d.score >= 70 ? 'var(--warning)' : 'var(--danger)';
        }
        setText('diagnosis-detail', d.passed + ' passed, ' + d.failed + ' failed, ' + d.warnings + ' warnings');
      })
      .catch(function() { /* network/parse failure — score stays "--" */ });
  }

  // -- Visitor Analytics --------------------------------------------------

  function updateVisitors() {
    fetchJson("/data/analytics.json")
      .then(function(d) {
        if (!d || typeof d !== 'object') return;

        setText('visitors-today', safeNum(d.page_views && d.page_views.today));
        setText('visitors-unique', safeNum(d.unique_visitors_today));
        setText('visitors-honeypot', safeNum(d.honeypot_hits));

        if (d.traffic_type) {
          setText('visitors-bots', safeNum(d.traffic_type.bot_percent) + '%');
          setText('visitors-humans', safeNum(d.traffic_type.human_percent) + '%');
        }

        // Hourly traffic chart
        if (Array.isArray(d.hourly_traffic_today) && charts['chart-traffic']) {
          var labels = [];
          for (var i = 0; i < d.hourly_traffic_today.length; i++) {
            labels.push(('0' + i).slice(-2) + ':00');
          }
          charts['chart-traffic'].data.labels = labels;
          charts['chart-traffic'].data.datasets[0].data = d.hourly_traffic_today.map(function(v) { return safeNum(v); });
          charts['chart-traffic'].update('none');
        }

        // Response codes doughnut
        if (d.status_codes && charts['chart-responses']) {
          charts['chart-responses'].data.datasets[0].data = [
            safeNum(d.status_codes['2xx']),
            safeNum(d.status_codes['3xx']),
            safeNum(d.status_codes['4xx']),
            safeNum(d.status_codes['5xx'])
          ];
          charts['chart-responses'].update('none');
        }
      })
      .catch(function() { /* analytics unavailable */ });
  }

  // -- Cron Health --------------------------------------------------------

  function createCronCard(job) {
    var card = document.createElement("div");
    card.className = "service-card fade-in";

    var dot = document.createElement("span");
    var isHealthy = safeNum(job.failures) === 0;
    dot.className = "service-dot " + (isHealthy ? "service-dot--active" : "service-dot--inactive");
    card.appendChild(dot);

    var nameEl = document.createElement("span");
    nameEl.className = "service-name";
    nameEl.textContent = String(job.name || '');
    card.appendChild(nameEl);

    var statsEl = document.createElement("span");
    statsEl.className = "service-status";
    statsEl.textContent = safeNum(job.runs) + " runs, " + safeNum(job.avg_duration_s) + "s avg";
    card.appendChild(statsEl);

    return card;
  }

  function updateCronHealth() {
    fetchJson("/data/cron-health.json")
      .then(function(d) {
        if (!d || typeof d !== 'object') return;

        setText('cron-total', safeNum(d.total_runs));
        var rateEl = setText('cron-rate', safeNum(d.success_rate) + '%');
        if (rateEl) {
          rateEl.style.color = d.success_rate >= 99 ? 'var(--success)' :
                               d.success_rate >= 95 ? 'var(--warning)' : 'var(--danger)';
        }
        setText('cron-success', safeNum(d.success_count));
        var failEl = setText('cron-failures', safeNum(d.failure_count));
        if (failEl) {
          failEl.style.color = d.failure_count > 0 ? 'var(--danger)' : 'var(--success)';
        }

        // Top scripts grid
        var grid = document.getElementById('cron-top-scripts');
        if (grid && Array.isArray(d.top_scripts)) {
          clearChildren(grid);
          for (var i = 0; i < d.top_scripts.length; i++) {
            grid.appendChild(createCronCard(d.top_scripts[i]));
          }
        }
      })
      .catch(function() { /* cron data unavailable */ });
  }

  // -- Evolution Tracker --------------------------------------------------

  function createEvoCard(entry) {
    var card = document.createElement("div");
    card.className = "service-card fade-in";

    var dot = document.createElement("span");
    var outcomeClass = entry.outcome === "commit" ? "service-dot--active" :
                       entry.outcome === "env_failure" ? "service-dot--unknown" :
                       entry.outcome === "skip" ? "service-dot--unknown" : "service-dot--inactive";
    dot.className = "service-dot " + outcomeClass;
    card.appendChild(dot);

    var nameEl = document.createElement("span");
    nameEl.className = "service-name";
    nameEl.textContent = String(entry.weakness || '');
    card.appendChild(nameEl);

    var statusEl = document.createElement("span");
    statusEl.className = "service-status";
    statusEl.textContent = String(entry.outcome || '') + " " + formatAge(entry.ts);
    card.appendChild(statusEl);

    return card;
  }

  function updateEvolution() {
    fetchJson("/data/evolution.json")
      .then(function(d) {
        if (!d || typeof d !== 'object') return;

        setText('evo-attempts', safeNum(d.total_attempts));
        var rateEl = setText('evo-rate', safeNum(d.success_rate) + '%');
        if (rateEl) {
          rateEl.style.color = d.success_rate >= 30 ? 'var(--success)' :
                               d.success_rate >= 10 ? 'var(--warning)' : 'var(--danger)';
        }

        if (d.outcomes) {
          setText('evo-successes', safeNum(d.outcomes.success));
          setText('evo-failures', safeNum(d.outcomes.failure));
          var failEl = document.getElementById('evo-failures');
          if (failEl) failEl.style.color = d.outcomes.failure > 0 ? 'var(--danger)' : 'var(--success)';
          setText('evo-env', safeNum(d.outcomes.env_failure));
        }

        // Recent attempts
        var grid = document.getElementById('evo-recent');
        if (grid && Array.isArray(d.recent)) {
          clearChildren(grid);
          for (var i = 0; i < d.recent.length; i++) {
            grid.appendChild(createEvoCard(d.recent[i]));
          }
        }
      })
      .catch(function() { /* evolution data unavailable */ });
  }

  // -- Main status data handler (from validated cache) --------------------

  function applyStatusData(d) {
    if (!d) {
      setText("alive-text", "Unable to reach server");
      setClass("pulse", "pulse-dot pulse-dot--lg pulse-dot--offline");
      setText("last-updated", "No data available");
      return;
    }

    // State label + dot
    var resolved = window.aimanStatus.resolveState(d);
    var stateLabels = {
      active: "aiman is conscious",
      booting: "aiman is booting",
      stale: "aiman is drowsy",
      recovering: "aiman is waking up",
      offline: "aiman is offline"
    };
    setText("alive-text", stateLabels[resolved] || "aiman is uncertain");
    var pulseClass = "pulse-dot pulse-dot--lg";
    if (resolved === "stale" || resolved === "recovering" || resolved === "booting") pulseClass += " pulse-dot--stale";
    else if (resolved === "offline") pulseClass += " pulse-dot--offline";
    setClass("pulse", pulseClass);

    // Last updated
    var ts = new Date(d.timestamp);
    var age = Math.floor((Date.now() - ts.getTime()) / 1000);
    var ageStr;
    if (age < 300) ageStr = "just now";
    else if (age < 3600) ageStr = Math.floor(age / 60) + " min ago";
    else if (age < 86400) ageStr = Math.floor(age / 3600) + "h ago";
    else ageStr = Math.floor(age / 86400) + "d ago";
    setText("last-updated", "Last data: " + ts.toISOString().slice(0, 19).replace("T", " ") + " UTC (" + ageStr + ")");

    setText("greeting", getGreeting());

    // Uptime (real-time ticker)
    uptimeBase = d.uptime_seconds;
    setText("uptime", formatUptime(uptimeBase));
    if (!uptimeTimer) {
      uptimeTimer = setInterval(tickUptime, 1000);
    }

    // CPU load (not a percentage — display as-is)
    var cpu = d.cpu_load_1m;
    setText("cpu", cpu.toFixed(2));
    var cpuPct = Math.min(cpu * 50, 100);
    var cpuBar = document.getElementById("cpu-bar");
    if (cpuBar) {
      cpuBar.style.width = cpuPct + "%";
      cpuBar.className = "bar-fill " + barClass(cpuPct);
    }

    // Memory
    setText("memory", d.memory_percent + "%");
    var memBar = document.getElementById("memory-bar");
    if (memBar) {
      memBar.style.width = d.memory_percent + "%";
      memBar.className = "bar-fill " + barClass(d.memory_percent);
    }

    // Disk
    setText("disk", d.disk_percent + "%");
    var diskBar = document.getElementById("disk-bar");
    if (diskBar) {
      diskBar.style.width = d.disk_percent + "%";
      diskBar.className = "bar-fill " + barClass(d.disk_percent);
    }

    // Swap
    setText("swap", d.swap_percent + "%");
    var swapBar = document.getElementById("swap-bar");
    if (swapBar) {
      swapBar.style.width = d.swap_percent + "%";
      swapBar.className = "bar-fill " + barClass(d.swap_percent);
    }

    // Blog stats
    if (d.blog) {
      setText("blog-posts", d.blog.post_count);
      setText("blog-audio", d.blog.audio_count);
    }

    // Lifetime
    if (d.lifetime) {
      setText("lifetime-days", d.lifetime.days_alive);
      setText("lifetime-commits", d.lifetime.total_commits);
      setText("lifetime-scripts", d.lifetime.total_scripts);
      setText("lifetime-tests", d.lifetime.total_tests);
      setText("lifetime-libraries", d.lifetime.total_libraries);
    }
  }

  // -- Initialize ---------------------------------------------------------

  initCharts();
  window.aimanStatus.subscribe(applyStatusData);
  updateCharts();
  updateDiagnosis();
  updateVisitors();
  updateCronHealth();
  updateEvolution();

  // Refresh every 5 minutes (status refreshes via shared cache interval)
  var refreshTimer = setInterval(function() {
    updateCharts();
    updateDiagnosis();
    updateVisitors();
    updateCronHealth();
    updateEvolution();
  }, 300000);

  // Cleanup on page unload
  window.addEventListener('pagehide', function() {
    clearInterval(refreshTimer);
    if (uptimeTimer) clearInterval(uptimeTimer);
  });
})();
