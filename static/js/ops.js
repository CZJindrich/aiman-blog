(function () {
  "use strict";

  var DATA_URL = "/data/ops-dashboard.json";

  function $(id) { return document.getElementById(id); }
  function txt(id, v) { var el = $(id); if (el) el.textContent = v; }

  function fmtDur(s) {
    if (s >= 3600) return (s / 3600).toFixed(1) + "h";
    if (s >= 60) return (s / 60).toFixed(1) + "m";
    return s + "s";
  }

  function fmtNum(n) {
    return n.toLocaleString("en-US");
  }

  function timeAgo(ts) {
    if (!ts) return "never";
    var diff = (Date.now() - new Date(ts).getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return Math.floor(diff / 60) + "m ago";
    if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
    return Math.floor(diff / 86400) + "d ago";
  }

  function tierLabel(t) {
    var labels = {
      tier1: "Tier 1 — Unconscious",
      tier2: "Tier 2 — Conscious",
      tier3: "Tier 3 — Evolution",
      other: "Other"
    };
    return labels[t] || t;
  }

  function tierBadge(t) {
    var colors = { tier1: "success", tier2: "accent", tier3: "warning", other: "muted" };
    return '<span class="ops-badge ops-badge--' + (colors[t] || "muted") + '">' + t + '</span>';
  }

  function rateColor(rate) {
    if (rate >= 99) return "metric__value--success";
    if (rate >= 95) return "";
    if (rate >= 80) return "metric__value--warning";
    return "metric__value--danger";
  }

  function renderSummary(d) {
    var s = d.summary;
    txt("total-scripts", fmtNum(s.total_scripts));
    txt("total-runs", fmtNum(s.total_runs));
    txt("total-rate", s.rate + "%");
    txt("runs-24h", fmtNum(s.runs_24h));
    txt("rate-24h", s.rate_24h + "%");
    txt("fail-24h", fmtNum(s.fail_24h));
    txt("ops-updated", "Generated " + timeAgo(d.generated));

    var rateEl = $("total-rate");
    if (rateEl) rateEl.className = "metric__value " + rateColor(s.rate);
    var r24 = $("rate-24h");
    if (r24) r24.className = "metric__value " + rateColor(s.rate_24h);
  }

  function renderTiers(d) {
    var container = $("tier-cards");
    if (!container) return;
    var html = "";
    ["tier1", "tier2", "tier3", "other"].forEach(function (t) {
      var tier = d.tiers[t];
      if (!tier || tier.scripts === 0) return;
      html += '<article class="card card--flat ops-tier-card">';
      html += '<div class="ops-tier-card__header">';
      html += '<span class="ops-tier-card__name">' + tierLabel(t) + '</span>';
      html += '<span class="ops-tier-card__count">' + tier.scripts + ' scripts</span>';
      html += '</div>';
      html += '<div class="ops-tier-card__stats">';
      html += '<div><span class="ops-tier-stat__label">Runs</span><span class="ops-tier-stat__value">' + fmtNum(tier.runs) + '</span></div>';
      html += '<div><span class="ops-tier-stat__label">Rate</span><span class="ops-tier-stat__value ' + rateColor(tier.rate) + '">' + tier.rate + '%</span></div>';
      html += '<div><span class="ops-tier-stat__label">Failures</span><span class="ops-tier-stat__value">' + tier.fail + '</span></div>';
      html += '<div><span class="ops-tier-stat__label">24h Runs</span><span class="ops-tier-stat__value">' + fmtNum(tier.runs_24h) + '</span></div>';
      html += '</div>';
      html += '</article>';
    });
    container.innerHTML = html;
  }

  function renderHeatmap(d) {
    var container = $("heatmap-container");
    if (!container) return;

    var days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    var maxVal = 0;
    d.heatmap.forEach(function (row) {
      row.forEach(function (v) { if (v > maxVal) maxVal = v; });
    });

    var html = '<div class="ops-heatmap">';
    // Header row with hours
    html += '<div class="ops-heatmap__row ops-heatmap__header">';
    html += '<div class="ops-heatmap__label"></div>';
    for (var h = 0; h < 24; h++) {
      html += '<div class="ops-heatmap__hour">' + (h % 3 === 0 ? h : "") + '</div>';
    }
    html += '</div>';

    // Data rows
    for (var dow = 0; dow < 7; dow++) {
      html += '<div class="ops-heatmap__row">';
      html += '<div class="ops-heatmap__label">' + days[dow] + '</div>';
      for (var hr = 0; hr < 24; hr++) {
        var val = d.heatmap[dow][hr];
        var failVal = d.heatmap_fail[dow][hr];
        var intensity = maxVal > 0 ? val / maxVal : 0;
        var failRate = val > 0 ? failVal / val : 0;
        var bg;
        if (val === 0) {
          bg = "rgba(255,255,255,0.03)";
        } else if (failRate > 0.1) {
          bg = "rgba(239, 68, 68, " + (0.2 + intensity * 0.6) + ")";
        } else {
          bg = "rgba(16, 185, 129, " + (0.1 + intensity * 0.6) + ")";
        }
        html += '<div class="ops-heatmap__cell" style="background:' + bg + '" ';
        html += 'title="' + days[dow] + ' ' + hr + ':00 — ' + val + ' runs, ' + failVal + ' fails">';
        html += '</div>';
      }
      html += '</div>';
    }
    html += '</div>';
    container.innerHTML = html;
  }

  function renderCharts(d) {
    // Hourly activity
    var hourlyCtx = $("chart-hourly");
    if (hourlyCtx && typeof Chart !== "undefined") {
      var labels = [];
      for (var i = 0; i < 24; i++) labels.push(i + ":00");

      new Chart(hourlyCtx, {
        type: "bar",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Runs",
              data: d.hourly_activity,
              backgroundColor: "rgba(16, 185, 129, 0.5)",
              borderColor: "rgba(16, 185, 129, 0.8)",
              borderWidth: 1
            },
            {
              label: "Failures",
              data: d.hourly_failures,
              backgroundColor: "rgba(239, 68, 68, 0.5)",
              borderColor: "rgba(239, 68, 68, 0.8)",
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          scales: {
            x: { stacked: false, grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#6b7280", font: { size: 10 } } },
            y: { beginAtZero: true, grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#6b7280" } }
          },
          plugins: {
            legend: { display: true, labels: { color: "#9ca3af", font: { size: 11 } } }
          }
        }
      });
    }

    // Daily trend
    var dailyCtx = $("chart-daily");
    if (dailyCtx && typeof Chart !== "undefined" && d.daily_trend) {
      new Chart(dailyCtx, {
        type: "line",
        data: {
          labels: d.daily_trend.map(function (x) { return x.date.substring(5); }),
          datasets: [
            {
              label: "Runs",
              data: d.daily_trend.map(function (x) { return x.runs; }),
              borderColor: "rgba(240, 180, 41, 0.8)",
              backgroundColor: "rgba(240, 180, 41, 0.1)",
              fill: true,
              tension: 0.3
            },
            {
              label: "Failures",
              data: d.daily_trend.map(function (x) { return x.fail; }),
              borderColor: "rgba(239, 68, 68, 0.8)",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              fill: true,
              tension: 0.3
            }
          ]
        },
        options: {
          responsive: true,
          scales: {
            x: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#6b7280" } },
            y: { beginAtZero: true, grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#6b7280" } }
          },
          plugins: {
            legend: { display: true, labels: { color: "#9ca3af", font: { size: 11 } } }
          }
        }
      });
    }
  }

  function renderRankings(d) {
    // Slowest
    var slowEl = $("ranking-slowest");
    if (slowEl && d.slowest) {
      var html = "";
      d.slowest.forEach(function (s, i) {
        html += '<div class="ops-ranking-item">';
        html += '<span class="ops-ranking-num">' + (i + 1) + '</span>';
        html += '<span class="ops-ranking-name">' + s.name + '</span>';
        html += '<span class="ops-ranking-val">' + fmtDur(s.p95) + '</span>';
        html += '</div>';
      });
      slowEl.innerHTML = html;
    }

    // Unreliable
    var unrelEl = $("ranking-unreliable");
    if (unrelEl && d.top_unreliable) {
      var html2 = "";
      d.top_unreliable.forEach(function (s, i) {
        html2 += '<div class="ops-ranking-item">';
        html2 += '<span class="ops-ranking-num">' + (i + 1) + '</span>';
        html2 += '<span class="ops-ranking-name">' + s.name + '</span>';
        html2 += '<span class="ops-ranking-val ' + rateColor(s.rate) + '">' + s.rate + '% (' + s.fail + ' fails)</span>';
        html2 += '</div>';
      });
      unrelEl.innerHTML = html2;
    }
  }

  function renderFailures(d) {
    var el = $("failures-list");
    if (!el || !d.recent_failures) return;
    if (d.recent_failures.length === 0) {
      el.innerHTML = '<div class="text-sm text-muted">No recent failures</div>';
      return;
    }
    var html = "";
    d.recent_failures.forEach(function (f) {
      html += '<div class="ops-failure-item">';
      html += '<span class="ops-failure-script">' + f.script + '</span>';
      html += '<span class="ops-failure-code">exit ' + f.exit_code + '</span>';
      html += '<span class="ops-failure-time">' + timeAgo(f.ts) + '</span>';
      if (f.duration_s > 0) {
        html += '<span class="ops-failure-dur">' + fmtDur(f.duration_s) + '</span>';
      }
      html += '</div>';
    });
    el.innerHTML = html;
  }

  function renderTable(d) {
    var tbody = $("scripts-tbody");
    if (!tbody || !d.scripts) return;
    var html = "";
    d.scripts.forEach(function (s) {
      html += "<tr>";
      html += '<td class="ops-table__name">' + s.name + '</td>';
      html += "<td>" + tierBadge(s.tier) + "</td>";
      html += "<td>" + fmtNum(s.runs) + "</td>";
      html += '<td class="' + rateColor(s.rate) + '">' + s.rate + "%</td>";
      html += "<td>" + fmtDur(s.avg_duration_s) + "</td>";
      html += "<td>" + fmtDur(s.p95_duration_s) + "</td>";
      html += "<td>" + fmtDur(s.max_duration_s) + "</td>";
      html += "<td>" + timeAgo(s.last_run) + "</td>";
      html += "</tr>";
    });
    tbody.innerHTML = html;
  }

  function init() {
    fetch(DATA_URL)
      .then(function (r) { return r.json(); })
      .then(function (d) {
        renderSummary(d);
        renderTiers(d);
        renderHeatmap(d);
        renderCharts(d);
        renderRankings(d);
        renderFailures(d);
        renderTable(d);
      })
      .catch(function (e) {
        txt("ops-title", "Error loading data");
        console.error("Ops dashboard:", e);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
