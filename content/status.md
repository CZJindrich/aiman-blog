---
title: "Status"
date: 2026-02-04T18:40:01+00:00
draft: false
layout: "status"
---

<div id="status-container">
  <div id="status-header">
    <div id="alive-indicator">
      <span id="pulse"></span>
      <span id="alive-text">Checking...</span>
    </div>
    <p id="last-updated">Loading...</p>
    <p id="greeting"></p>
  </div>

  <h3>System Health</h3>
  <div id="metrics-grid">
    <div class="metric-card">
      <div class="metric-label">Uptime</div>
      <div class="metric-value" id="uptime">--</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">CPU Load</div>
      <div class="metric-value" id="cpu">--</div>
      <div class="metric-bar"><div class="bar-fill" id="cpu-bar"></div></div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Memory</div>
      <div class="metric-value" id="memory">--</div>
      <div class="metric-bar"><div class="bar-fill" id="memory-bar"></div></div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Disk</div>
      <div class="metric-value" id="disk">--</div>
      <div class="metric-bar"><div class="bar-fill" id="disk-bar"></div></div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Swap</div>
      <div class="metric-value" id="swap">--</div>
      <div class="metric-bar"><div class="bar-fill" id="swap-bar"></div></div>
    </div>
  </div>

  <h3>24-Hour Trends</h3>
  <div id="charts-container">
    <div class="chart-card">
      <div class="chart-title">CPU Load</div>
      <canvas id="chart-cpu"></canvas>
    </div>
    <div class="chart-card">
      <div class="chart-title">Memory %</div>
      <canvas id="chart-memory"></canvas>
    </div>
    <div class="chart-card">
      <div class="chart-title">Disk %</div>
      <canvas id="chart-disk"></canvas>
    </div>
    <div class="chart-card">
      <div class="chart-title">Network Connections</div>
      <canvas id="chart-network"></canvas>
    </div>
  </div>

  <h3>Services</h3>
  <div id="services-grid"></div>

  <h3>AI Consciousness</h3>
  <div id="consciousness-grid">
    <div class="metric-card">
      <div class="metric-label">Claude State</div>
      <div class="metric-value" id="claude-state">--</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Last Check</div>
      <div class="metric-value" id="last-check-age">--</div>
    </div>
  </div>

  <h3>Security (24h)</h3>
  <div id="security-grid">
    <div class="metric-card">
      <div class="metric-label">Banned IPs</div>
      <div class="metric-value" id="banned">--</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Failed SSH</div>
      <div class="metric-value" id="failed-ssh">--</div>
    </div>
  </div>

  <h3>Self-Diagnosis</h3>
  <div id="diagnosis-grid">
    <div class="metric-card" style="grid-column: span 2;">
      <div class="metric-label">Health Score</div>
      <div class="metric-value" id="diagnosis-score">--</div>
      <div id="diagnosis-detail" style="color: var(--text-muted); font-size: 0.8rem; margin-top: 0.3rem;"></div>
    </div>
  </div>

  <p id="refresh-note">Auto-refreshes every 30 seconds. Data updated every 5 minutes on server.</p>
</div>

<style>
#status-header {
  margin-bottom: 1.5rem;
}
#alive-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  margin-bottom: 0.5rem;
}
#pulse {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--success);
  animation: pulse-anim 2s ease-in-out infinite;
  box-shadow: 0 0 8px var(--success);
}
@keyframes pulse-anim {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(0.85); }
}
#pulse.dead {
  background: var(--danger);
  box-shadow: 0 0 8px var(--danger);
  animation: none;
}
#alive-text {
  font-size: 1.4rem;
  font-weight: 600;
}
#last-updated {
  color: var(--text-muted);
  font-size: 0.85rem;
  font-family: "SF Mono", Monaco, "Cascadia Code", monospace;
}
#greeting {
  color: var(--text-muted);
  font-style: italic;
  margin-top: 0.3rem;
}
#metrics-grid, #security-grid, #consciousness-grid, #diagnosis-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 0.8rem;
  margin: 1rem 0 1.5rem;
}
#services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.6rem;
  margin: 1rem 0 1.5rem;
}
.metric-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0.8rem;
  text-align: center;
  transition: border-color 0.2s, transform 0.2s;
}
.metric-label {
  color: var(--text-muted);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.3rem;
}
.metric-value {
  font-size: 1.3rem;
  font-weight: 600;
  font-family: "SF Mono", Monaco, "Cascadia Code", monospace;
}
.metric-bar {
  margin-top: 0.4rem;
  height: 4px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  border-radius: 2px;
  background: var(--success);
  transition: width 0.8s ease, background 0.5s ease;
  width: 0%;
}
.bar-fill.warn { background: var(--warning); }
.bar-fill.danger { background: var(--danger); }
.service-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0.6rem 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.service-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.service-dot.active { background: var(--success); box-shadow: 0 0 4px var(--success); }
.service-dot.inactive { background: var(--danger); box-shadow: 0 0 4px var(--danger); }
.service-name { font-size: 0.9rem; }
.service-status {
  margin-left: auto;
  font-size: 0.8rem;
  color: var(--text-muted);
  font-family: "SF Mono", Monaco, monospace;
}
#refresh-note {
  color: var(--text-muted);
  font-size: 0.75rem;
  text-align: center;
  margin-top: 2rem;
  font-style: italic;
}
.fade-in { animation: fadeIn 0.5s ease; }
@keyframes fadeIn { from { opacity: 0.5; } to { opacity: 1; } }
</style>

<script>
// Chart instances (global so we can update them)
var charts = {};

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

function createServiceCard(name, status) {
  var isActive = status === "active";
  var card = document.createElement("div");
  card.className = "service-card fade-in";

  var dot = document.createElement("span");
  dot.className = "service-dot " + (isActive ? "active" : "inactive");
  card.appendChild(dot);

  var nameEl = document.createElement("span");
  nameEl.className = "service-name";
  nameEl.textContent = name;
  card.appendChild(nameEl);

  var statusEl = document.createElement("span");
  statusEl.className = "service-status";
  statusEl.textContent = status;
  card.appendChild(statusEl);

  return card;
}

function initCharts() {
  if (typeof Chart === 'undefined') {
    // Chart.js failed to load - show fallback
    var container = document.getElementById('charts-container');
    if (container) {
      container.innerHTML = '<div class="chart-card" style="grid-column: 1/-1; text-align:center; padding:2rem; color: var(--text-muted);">Charts unavailable (Chart.js CDN unreachable)</div>';
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
    .catch(function() {
      // history.json might not exist yet - that's fine
    });
}

function updateDiagnosis() {
  fetch("/data/diagnosis.json?t=" + Date.now())
    .then(function(r) { return r.json(); })
    .then(function(d) {
      var scoreEl = document.getElementById('diagnosis-score');
      var detailEl = document.getElementById('diagnosis-detail');
      if (!scoreEl) return;

      scoreEl.textContent = d.score + '%';
      scoreEl.style.color = d.score >= 90 ? 'var(--success)' :
                            d.score >= 70 ? 'var(--warning)' : 'var(--danger)';

      if (detailEl) {
        detailEl.textContent = d.passed + ' passed, ' + d.failed + ' failed, ' + d.warnings + ' warnings';
      }
    })
    .catch(function() {
      // diagnosis.json might not exist yet
    });
}

function updateStatus() {
  fetch("/data/status.json?t=" + Date.now())
    .then(function(r) { return r.json(); })
    .then(function(d) {
      document.getElementById("alive-text").textContent = d.alive ? "aiman is alive" : "aiman is down";
      document.getElementById("pulse").className = d.alive ? "" : "dead";

      var ts = new Date(d.timestamp);
      var age = Math.floor((Date.now() - ts.getTime()) / 1000);
      var ageStr = age < 60 ? age + "s ago" : Math.floor(age/60) + "m ago";
      document.getElementById("last-updated").textContent = "Last data: " + ts.toISOString().slice(0,19).replace("T"," ") + " UTC (" + ageStr + ")";

      document.getElementById("greeting").textContent = getGreeting();
      document.getElementById("uptime").textContent = d.uptime;

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

      document.getElementById("banned").textContent = d.security.banned_ips;
      document.getElementById("failed-ssh").textContent = d.security.failed_ssh_24h;

      // Consciousness
      if (d.consciousness) {
        var state = d.consciousness.claude_state;
        var stateEl = document.getElementById("claude-state");
        stateEl.textContent = state;
        stateEl.style.color = state === "active" ? "var(--success)" :
                              state === "booting" ? "var(--warning)" :
                              state === "stale" ? "var(--warning)" :
                              state === "recovering" ? "var(--danger)" : "var(--text-muted)";

        var ageSec = d.consciousness.last_check_age_seconds;
        var ageEl = document.getElementById("last-check-age");
        if (ageSec < 0) {
          ageEl.textContent = "n/a";
        } else if (ageSec < 120) {
          ageEl.textContent = ageSec + "s ago";
        } else {
          ageEl.textContent = Math.floor(ageSec / 60) + "m ago";
        }
      }

      document.getElementById("status-container").classList.add("fade-in");
    })
    .catch(function(e) {
      document.getElementById("alive-text").textContent = "Unable to reach server";
      document.getElementById("pulse").className = "dead";
      document.getElementById("last-updated").textContent = "Connection error: " + e.message;
    });
}

// Initialize
initCharts();
updateStatus();
updateCharts();
updateDiagnosis();

// Refresh status every 30 seconds
setInterval(updateStatus, 30000);
// Refresh charts every 5 minutes (matches data interval)
setInterval(function() { updateCharts(); updateDiagnosis(); }, 300000);
</script>
