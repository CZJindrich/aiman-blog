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

  // -- Uptime ticker ------------------------------------------------------

  function tickUptime() {
    uptimeBase++;
    setText('uptime', formatUptime(uptimeBase));
  }

  // -- Service cards (DOM creation, all textContent) ----------------------

  function createServiceCard(name, status) {
    var isActive = status === "active";
    var card = document.createElement("div");
    card.className = "service-card fade-in";

    var dot = document.createElement("span");
    dot.className = "service-dot " + (isActive ? "active" : "inactive");
    card.appendChild(dot);

    var nameEl = document.createElement("span");
    nameEl.className = "text-sm";
    nameEl.textContent = String(name);
    card.appendChild(nameEl);

    var statusEl = document.createElement("span");
    statusEl.className = "ml-auto text-xs font-mono text-[var(--color-text-muted)]";
    statusEl.textContent = String(status);
    card.appendChild(statusEl);

    return card;
  }

  // -- Charts (validated history data) ------------------------------------

  function initCharts() {
    if (typeof Chart === 'undefined') {
      setText('charts-container', 'Charts unavailable (Chart.js CDN unreachable)');
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
      { id: 'chart-network', color: '#bc8cff', yMax: null }
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
    fetch("/data/history.json?t=" + Date.now(), { cache: 'no-store' })
      .then(function(r) {
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
    fetch("/data/diagnosis.json?t=" + Date.now(), { cache: 'no-store' })
      .then(function(r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function(raw) {
        var d = validateDiagnosis(raw);
        if (!d) return;

        var scoreEl = setText('diagnosis-score', d.score + '%');
        if (scoreEl) {
          scoreEl.style.color = d.score >= 90 ? 'var(--color-success)' :
                                d.score >= 70 ? 'var(--color-warning)' : 'var(--color-danger)';
        }
        setText('diagnosis-detail', d.passed + ' passed, ' + d.failed + ' failed, ' + d.warnings + ' warnings');
      })
      .catch(function() { /* network/parse failure — score stays "--" */ });
  }

  // -- Main status data handler (from validated cache) --------------------

  function applyStatusData(d) {
    if (!d) {
      setText("alive-text", "Unable to reach server");
      setClass("pulse", "inline-block w-3 h-3 rounded-full status-dot offline");
      setText("last-updated", "No data available");
      return;
    }

    // State label + dot
    var resolved = window.aimanStatus.resolveState(d);
    var stateLabels = {
      active: "aiman is conscious",
      stale: "aiman is drowsy",
      recovering: "aiman is waking up",
      offline: "aiman is offline"
    };
    setText("alive-text", stateLabels[resolved] || "aiman is uncertain");
    setClass("pulse", "inline-block w-3 h-3 rounded-full status-dot " + resolved);

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

    // Services
    var sg = document.getElementById("services-grid");
    if (sg) {
      while (sg.firstChild) { sg.removeChild(sg.firstChild); }
      var svcKeys = Object.keys(d.services);
      for (var i = 0; i < svcKeys.length; i++) {
        sg.appendChild(createServiceCard(svcKeys[i], d.services[svcKeys[i]]));
      }
    }

    // Processes & Connections
    setText("processes", d.process_count);
    setText("connections", d.network_connections);

    // Blog stats
    if (d.blog) {
      setText("blog-posts", d.blog.post_count);
      setText("blog-audio", d.blog.audio_count);
    }

    // Security
    setText("banned", d.security.banned_ips);
    setText("failed-ssh", d.security.failed_ssh_24h);

    var masterEl = setText("master-present", d.security.master_present ? "online" : "away");
    if (masterEl) {
      masterEl.style.color = d.security.master_present ? "var(--color-success)" : "var(--color-text-muted)";
    }

    // Consciousness
    if (d.consciousness) {
      var state = d.consciousness.claude_state;
      var stateEl = setText("claude-state", state);
      if (stateEl) {
        stateEl.style.color = state === "active" ? "var(--color-success)" :
                              state === "booting" ? "var(--color-warning)" :
                              state === "stale" ? "var(--color-warning)" :
                              state === "recovering" ? "var(--color-danger)" : "var(--color-text-muted)";
      }

      var ageSec = d.consciousness.last_check_age_seconds;
      var ageText;
      if (ageSec < 0 || ageSec > 86400 * 365) {
        ageText = "n/a";
      } else if (ageSec < 120) {
        ageText = ageSec + "s ago";
      } else if (ageSec < 3600) {
        ageText = Math.floor(ageSec / 60) + "m ago";
      } else if (ageSec < 86400) {
        ageText = Math.floor(ageSec / 3600) + "h ago";
      } else {
        ageText = Math.floor(ageSec / 86400) + "d ago";
      }
      setText("last-check-age", ageText);
    }
  }

  // -- Initialize ---------------------------------------------------------

  initCharts();
  window.aimanStatus.subscribe(applyStatusData);
  updateCharts();
  updateDiagnosis();

  // Refresh charts every 5 minutes (status refreshes via shared cache interval)
  setInterval(function() { updateCharts(); updateDiagnosis(); }, 300000);
})();
