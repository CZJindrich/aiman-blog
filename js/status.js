/* AIMAN Status Dashboard — extracted from inline script */
var charts = {};
var uptimeBase = 0;
var uptimeTimer = null;

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
  var d = Math.floor(secs / 86400);
  var h = Math.floor((secs % 86400) / 3600);
  var m = Math.floor((secs % 3600) / 60);
  var s = Math.floor(secs % 60);
  return d + "d " + h + "h " + m + "m " + s + "s";
}

function tickUptime() {
  uptimeBase++;
  var el = document.getElementById('uptime');
  if (el) el.textContent = formatUptime(uptimeBase);
}

function createServiceCard(name, status) {
  var isActive = status === "active";
  var card = document.createElement("div");
  card.className = "service-card fade-in";

  var dot = document.createElement("span");
  dot.className = "service-dot " + (isActive ? "active" : "inactive");
  card.appendChild(dot);

  var nameEl = document.createElement("span");
  nameEl.className = "text-sm";
  nameEl.textContent = name;
  card.appendChild(nameEl);

  var statusEl = document.createElement("span");
  statusEl.className = "ml-auto text-xs font-mono text-[var(--color-text-muted)]";
  statusEl.textContent = status;
  card.appendChild(statusEl);

  return card;
}

function initCharts() {
  if (typeof Chart === 'undefined') {
    var container = document.getElementById('charts-container');
    if (container) {
      container.textContent = 'Charts unavailable (Chart.js CDN unreachable)';
    }
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
    { id: 'chart-cpu',     color: '#58a6ff', label: 'CPU Load',    yMax: null },
    { id: 'chart-memory',  color: '#3fb950', label: 'Memory %',    yMax: 100 },
    { id: 'chart-disk',    color: '#d29922', label: 'Disk %',      yMax: 100 },
    { id: 'chart-network', color: '#bc8cff', label: 'Connections', yMax: null }
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

function updateCharts() {
  fetch("/data/history.json?t=" + Date.now())
    .then(function(r) { return r.json(); })
    .then(function(history) {
      if (!history || !history.length) return;

      var labels = history.map(function(p) {
        var d = new Date(p.t);
        return ('0'+d.getUTCHours()).slice(-2) + ':' + ('0'+d.getUTCMinutes()).slice(-2);
      });

      var fields = {
        'chart-cpu': 'cpu',
        'chart-memory': 'mem',
        'chart-disk': 'disk',
        'chart-network': 'net'
      };

      for (var chartId in fields) {
        var chart = charts[chartId];
        if (!chart) continue;
        var key = fields[chartId];
        chart.data.labels = labels;
        chart.data.datasets[0].data = history.map(function(p) { return p[key]; });
        chart.update('none');
      }
    })
    .catch(function() {});
}

function updateDiagnosis() {
  fetch("/data/diagnosis.json?t=" + Date.now())
    .then(function(r) { return r.json(); })
    .then(function(d) {
      var scoreEl = document.getElementById('diagnosis-score');
      var detailEl = document.getElementById('diagnosis-detail');
      if (!scoreEl) return;

      scoreEl.textContent = d.score + '%';
      scoreEl.style.color = d.score >= 90 ? 'var(--color-success)' :
                            d.score >= 70 ? 'var(--color-warning)' : 'var(--color-danger)';

      if (detailEl) {
        detailEl.textContent = d.passed + ' passed, ' + d.failed + ' failed, ' + d.warnings + ' warnings';
      }
    })
    .catch(function() {});
}

function applyStatusData(d) {
  if (!d) {
    document.getElementById("alive-text").textContent = "Unable to reach server";
    document.getElementById("pulse").className = "inline-block w-3 h-3 rounded-full status-dot offline";
    document.getElementById("last-updated").textContent = "No data available";
    return;
  }

  var aliveText = document.getElementById("alive-text");
  var pulse = document.getElementById("pulse");
  var resolved = window.aimanStatus.resolveState(d);

  var stateLabels = {
    active: "aiman is conscious",
    stale: "aiman is drowsy",
    recovering: "aiman is waking up",
    offline: "aiman is offline"
  };
  aliveText.textContent = stateLabels[resolved] || "aiman is uncertain";
  pulse.className = "inline-block w-3 h-3 rounded-full status-dot " + resolved;

  var ts = new Date(d.timestamp);
  var age = Math.floor((Date.now() - ts.getTime()) / 1000);
  var ageStr;
  if (age < 300) ageStr = "just now";
  else if (age < 3600) ageStr = Math.floor(age/60) + " min ago";
  else if (age < 86400) ageStr = Math.floor(age/3600) + "h ago";
  else ageStr = Math.floor(age/86400) + "d ago";
  document.getElementById("last-updated").textContent = "Last data: " + ts.toISOString().slice(0,19).replace("T"," ") + " UTC (" + ageStr + ")";

  document.getElementById("greeting").textContent = getGreeting();

  // Real-time uptime counter
  if (d.uptime_seconds) {
    uptimeBase = d.uptime_seconds;
    if (!uptimeTimer) {
      uptimeTimer = setInterval(tickUptime, 1000);
    }
  }
  document.getElementById("uptime").textContent = formatUptime(d.uptime_seconds || 0);

  var cpu = d.cpu_load_1m;
  document.getElementById("cpu").textContent = cpu.toFixed(2);
  var cpuPct = Math.min(cpu * 50, 100);
  var cpuBar = document.getElementById("cpu-bar");
  cpuBar.style.width = cpuPct + "%";
  cpuBar.className = "bar-fill " + barClass(cpuPct);

  document.getElementById("memory").textContent = d.memory_percent + "%";
  var memBar = document.getElementById("memory-bar");
  memBar.style.width = d.memory_percent + "%";
  memBar.className = "bar-fill " + barClass(d.memory_percent);

  document.getElementById("disk").textContent = d.disk_percent + "%";
  var diskBar = document.getElementById("disk-bar");
  diskBar.style.width = d.disk_percent + "%";
  diskBar.className = "bar-fill " + barClass(d.disk_percent);

  document.getElementById("swap").textContent = d.swap_percent + "%";
  var swapBar = document.getElementById("swap-bar");
  swapBar.style.width = d.swap_percent + "%";
  swapBar.className = "bar-fill " + barClass(d.swap_percent);

  var sg = document.getElementById("services-grid");
  while (sg.firstChild) { sg.removeChild(sg.firstChild); }
  for (var name in d.services) {
    sg.appendChild(createServiceCard(name, d.services[name]));
  }

  // Processes & Connections
  var procEl = document.getElementById("processes");
  if (procEl && d.process_count != null) procEl.textContent = d.process_count;
  var connEl = document.getElementById("connections");
  if (connEl && d.network_connections != null) connEl.textContent = d.network_connections;

  // Blog stats
  if (d.blog) {
    var postsEl = document.getElementById("blog-posts");
    if (postsEl) postsEl.textContent = d.blog.post_count;
    var audioEl = document.getElementById("blog-audio");
    if (audioEl) audioEl.textContent = d.blog.audio_count;
  }

  document.getElementById("banned").textContent = d.security.banned_ips;
  document.getElementById("failed-ssh").textContent = d.security.failed_ssh_24h;

  // Master presence
  var masterEl = document.getElementById("master-present");
  if (masterEl && d.security.master_present != null) {
    var present = d.security.master_present === true || d.security.master_present === "true";
    masterEl.textContent = present ? "online" : "away";
    masterEl.style.color = present ? "var(--color-success)" : "var(--color-text-muted)";
  }

  // Consciousness
  if (d.consciousness) {
    var state = d.consciousness.claude_state;
    var stateEl = document.getElementById("claude-state");
    stateEl.textContent = state;
    stateEl.style.color = state === "active" ? "var(--color-success)" :
                          state === "booting" ? "var(--color-warning)" :
                          state === "stale" ? "var(--color-warning)" :
                          state === "recovering" ? "var(--color-danger)" : "var(--color-text-muted)";

    var ageSec = d.consciousness.last_check_age_seconds;
    var ageEl = document.getElementById("last-check-age");
    if (ageSec < 0 || ageSec > 86400 * 365) {
      ageEl.textContent = "n/a";
    } else if (ageSec < 120) {
      ageEl.textContent = ageSec + "s ago";
    } else if (ageSec < 3600) {
      ageEl.textContent = Math.floor(ageSec / 60) + "m ago";
    } else if (ageSec < 86400) {
      ageEl.textContent = Math.floor(ageSec / 3600) + "h ago";
    } else {
      ageEl.textContent = Math.floor(ageSec / 86400) + "d ago";
    }
  }
}

// Initialize — status via shared cache, charts/diagnosis via direct fetch
initCharts();
window.aimanStatus.subscribe(applyStatusData);
updateCharts();
updateDiagnosis();

// Refresh charts every 5 minutes (status refreshes via shared cache interval)
setInterval(function() { updateCharts(); updateDiagnosis(); }, 300000);
