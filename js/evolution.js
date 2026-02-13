(function () {
  "use strict";

  var DATA_URL = "/data/evolution-dashboard.json";

  function $(id) { return document.getElementById(id); }
  function txt(id, v) { var el = $(id); if (el) el.textContent = v; }

  function timeAgo(ts) {
    if (!ts) return "never";
    var diff = (Date.now() - new Date(ts).getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return Math.floor(diff / 60) + "m ago";
    if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
    return Math.floor(diff / 86400) + "d ago";
  }

  function rateColor(rate) {
    if (rate >= 99) return "metric__value--success";
    if (rate >= 95) return "";
    if (rate >= 80) return "metric__value--warning";
    return "metric__value--danger";
  }

  function resultColor(result) {
    if (result === "commit") return "metric__value--success";
    if (result === "rollback") return "metric__value--danger";
    if (result === "env_failure") return "metric__value--warning";
    return "";
  }

  function resultBg(result) {
    if (result === "commit") return "rgba(16, 185, 129, 0.08)";
    if (result === "rollback") return "rgba(239, 68, 68, 0.08)";
    if (result === "env_failure") return "rgba(240, 180, 41, 0.08)";
    return "rgba(107, 114, 128, 0.05)";
  }

  function resultBorder(result) {
    if (result === "commit") return "var(--success)";
    if (result === "rollback") return "var(--danger)";
    if (result === "env_failure") return "var(--warning)";
    return "var(--text-muted)";
  }

  function resultLabel(result) {
    if (result === "commit") return "COMMIT";
    if (result === "rollback") return "ROLLBACK";
    if (result === "env_failure") return "ENV FAIL";
    if (result === "skip") return "SKIP";
    return result ? result.toUpperCase() : "UNKNOWN";
  }

  function fmtPct(v) {
    if (v === null || v === undefined) return "--";
    return v + "%";
  }

  /* ── Render: Overview Metrics ─────────────── */

  function renderSummary(d) {
    var h = d.health || {};
    txt("evo-iterations", h.total_iterations != null ? h.total_iterations : "--");
    txt("evo-success-rate", fmtPct(h.success_rate));
    txt("evo-commits", h.commits != null ? h.commits : "--");
    txt("evo-death-spiral", h.death_spiral_risk || "--");
    txt("evo-env-rate", fmtPct(h.env_failure_rate));
    txt("evo-weaknesses", h.unique_weaknesses != null ? h.unique_weaknesses : "--");
    txt("evo-updated", "Generated " + timeAgo(d.generated));

    // Color the success rate
    var srEl = $("evo-success-rate");
    if (srEl && h.success_rate != null) {
      srEl.className = "metric__value " + rateColor(h.success_rate);
    }

    // Color the env failure rate (invert: high = bad)
    var efEl = $("evo-env-rate");
    if (efEl && h.env_failure_rate != null) {
      var invRate = 100 - h.env_failure_rate;
      efEl.className = "metric__value " + rateColor(invRate);
    }

    // Color death spiral risk
    var dsEl = $("evo-death-spiral");
    if (dsEl && h.death_spiral_risk) {
      var risk = h.death_spiral_risk.toLowerCase();
      if (risk === "low" || risk === "none") {
        dsEl.className = "metric__value metric__value--success";
      } else if (risk === "medium") {
        dsEl.className = "metric__value metric__value--warning";
      } else {
        dsEl.className = "metric__value metric__value--danger";
      }
    }
  }

  /* ── Render: Failure Taxonomy (Donut) ─────── */

  function renderTaxonomy(d) {
    var ctx = $("chart-taxonomy");
    if (!ctx || typeof Chart === "undefined") return;
    var tax = d.taxonomy;
    if (!tax || !tax.categories) return;

    var labels = [];
    var values = [];
    var colors = [
      "rgba(239, 68, 68, 0.7)",
      "rgba(240, 180, 41, 0.7)",
      "rgba(107, 114, 128, 0.5)",
      "rgba(16, 185, 129, 0.7)",
      "rgba(59, 130, 246, 0.7)",
      "rgba(168, 85, 247, 0.7)",
      "rgba(236, 72, 153, 0.7)",
      "rgba(34, 211, 238, 0.7)",
      "rgba(245, 158, 11, 0.7)",
      "rgba(99, 102, 241, 0.7)"
    ];

    var cats = tax.categories;
    for (var key in cats) {
      if (cats.hasOwnProperty(key)) {
        labels.push(key);
        values.push(cats[key]);
      }
    }

    new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: colors.slice(0, labels.length),
          borderColor: "rgba(0,0,0,0.3)",
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        cutout: "55%",
        plugins: {
          legend: {
            position: "right",
            labels: {
              color: "#9ca3af",
              font: { size: 11 },
              padding: 12
            }
          }
        }
      }
    });
  }

  /* ── Render: Daily Trend (Stacked Bar) ────── */

  function renderTrend(d) {
    var ctx = $("chart-trend");
    if (!ctx || typeof Chart === "undefined") return;
    var trend = d.trend;
    if (!trend || !trend.days) return;

    var labels = [];
    var commits = [];
    var rollbacks = [];
    var envFailures = [];
    var skips = [];

    trend.days.forEach(function (day) {
      labels.push(day.date ? day.date.substring(5) : "");
      commits.push(day.commits || 0);
      rollbacks.push(day.rollbacks || 0);
      envFailures.push(day.env_failures || 0);
      skips.push(day.skips || 0);
    });

    new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Commits",
            data: commits,
            backgroundColor: "rgba(16, 185, 129, 0.7)",
            borderColor: "rgba(16, 185, 129, 0.9)",
            borderWidth: 1
          },
          {
            label: "Rollbacks",
            data: rollbacks,
            backgroundColor: "rgba(239, 68, 68, 0.7)",
            borderColor: "rgba(239, 68, 68, 0.9)",
            borderWidth: 1
          },
          {
            label: "Env Failures",
            data: envFailures,
            backgroundColor: "rgba(240, 180, 41, 0.7)",
            borderColor: "rgba(240, 180, 41, 0.9)",
            borderWidth: 1
          },
          {
            label: "Skips",
            data: skips,
            backgroundColor: "rgba(107, 114, 128, 0.5)",
            borderColor: "rgba(107, 114, 128, 0.7)",
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          x: {
            stacked: true,
            grid: { color: "rgba(255,255,255,0.05)" },
            ticks: { color: "#9ca3af", font: { size: 10 } }
          },
          y: {
            stacked: true,
            beginAtZero: true,
            grid: { color: "rgba(255,255,255,0.05)" },
            ticks: { color: "#9ca3af" }
          }
        },
        plugins: {
          legend: {
            display: true,
            labels: { color: "#9ca3af", font: { size: 11 } }
          }
        }
      }
    });
  }

  /* ── Render: Filter Cascade (Funnel) ──────── */

  function renderCascade(d) {
    var container = $("cascade-funnel");
    if (!container) return;
    var cascade = d.cascade;
    if (!cascade) return;

    var stages = [
      { key: "analyzed", label: "Analyzed" },
      { key: "reached_fix", label: "Reached Fix" },
      { key: "reached_test", label: "Reached Test" },
      { key: "full_suite", label: "Full Suite" },
      { key: "committed", label: "Committed" }
    ];

    var html = "";
    var prev = 0;

    stages.forEach(function (stage, i) {
      var count = cascade[stage.key] != null ? cascade[stage.key] : 0;
      var pct = "";
      if (i > 0 && prev > 0) {
        pct = Math.round((count / prev) * 100) + "%";
      } else if (i === 0) {
        pct = "100%";
      } else {
        pct = "0%";
      }

      // Width tapers from 100% down to proportional
      var widthPct = 100;
      if (cascade[stages[0].key] > 0) {
        widthPct = Math.max(20, Math.round((count / cascade[stages[0].key]) * 100));
      }

      html += '<div style="';
      html += "display:flex;align-items:center;gap:var(--sp-3);margin-bottom:var(--sp-2);";
      html += '">';
      html += '<div style="';
      html += "flex-shrink:0;width:120px;font-family:var(--font-mono);font-size:var(--text-sm);color:var(--text-muted);text-align:right;";
      html += '">' + stage.label + '</div>';
      html += '<div style="';
      html += "flex:1;height:32px;position:relative;";
      html += '">';
      html += '<div style="';
      html += "width:" + widthPct + "%;height:100%;border-radius:var(--radius-sm);";
      html += "background:rgba(16, 185, 129, " + (0.15 + (1 - i / stages.length) * 0.35) + ");";
      html += "display:flex;align-items:center;padding:0 var(--sp-3);";
      html += "transition:width 0.5s ease;";
      html += '">';
      html += '<span style="font-family:var(--font-mono);font-size:var(--text-sm);color:var(--text-primary);font-weight:600;">';
      html += count;
      html += '</span>';
      html += '<span style="font-family:var(--font-mono);font-size:var(--text-xs);color:var(--text-muted);margin-left:var(--sp-2);">';
      html += pct;
      html += '</span>';
      html += '</div>';
      html += '</div>';
      html += '</div>';

      prev = count;
    });

    container.innerHTML = html;
  }

  /* ── Render: Weakness Leaderboard ─────────── */

  function renderLeaderboard(d) {
    var tbody = $("leaderboard-tbody");
    if (!tbody || !d.leaderboard) return;

    if (d.leaderboard.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-sm text-muted">No data yet</td></tr>';
      return;
    }

    var html = "";
    d.leaderboard.forEach(function (w, i) {
      var failRate = w.attempts > 0 ? Math.round((w.failures / w.attempts) * 100) : 0;
      html += "<tr>";
      html += '<td class="ops-table__name">' + (i + 1) + "</td>";
      html += "<td>" + (w.weakness || "--") + "</td>";
      html += "<td>" + (w.attempts || 0) + "</td>";
      html += "<td>" + (w.failures || 0) + "</td>";
      html += '<td class="' + rateColor(100 - failRate) + '">' + failRate + "%</td>";
      html += "<td>" + (w.stuck ? '<span class="metric__value--danger">YES</span>' : '<span class="metric__value--success">no</span>') + "</td>";
      html += "<td>" + (w.dominant_failure || "--") + "</td>";
      html += "</tr>";
    });
    tbody.innerHTML = html;
  }

  /* ── Render: Recent Timeline ──────────────── */

  function renderTimeline(d) {
    var el = $("timeline-list");
    if (!el || !d.timeline) return;

    if (d.timeline.length === 0) {
      el.innerHTML = '<div class="text-sm text-muted">No recent iterations</div>';
      return;
    }

    var html = "";
    d.timeline.forEach(function (item) {
      var result = item.result || "unknown";
      html += '<div class="ops-failure-item" style="';
      html += "background:" + resultBg(result) + ";";
      html += "border-left-color:" + resultBorder(result) + ";";
      html += '">';
      html += '<span class="ops-failure-time" style="min-width:60px;">' + timeAgo(item.timestamp) + "</span>";
      html += '<span class="ops-failure-script" style="flex:1;">' + (item.weakness || "--") + "</span>";
      html += '<span class="ops-badge" style="';
      html += "background:" + resultBg(result) + ";";
      html += "color:" + resultBorder(result) + ";";
      html += '">' + resultLabel(result) + "</span>";
      if (item.approach) {
        html += '<span class="ops-failure-dur" style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="' + item.approach.replace(/"/g, "&quot;") + '">';
        html += item.approach.length > 40 ? item.approach.substring(0, 40) + "..." : item.approach;
        html += "</span>";
      }
      html += "</div>";
    });
    el.innerHTML = html;
  }

  /* ── Render: Experience Pool ──────────────── */

  function renderPool(d) {
    var pool = d.experience_pool;
    if (!pool) return;
    txt("pool-entries", pool.entries != null ? pool.entries : "--");
    txt("pool-diversity", pool.diversity_score != null ? pool.diversity_score : "--");
    txt("pool-hashes", pool.unique_hashes != null ? pool.unique_hashes : "--");
  }

  /* ── Init ─────────────────────────────────── */

  function init() {
    fetch(DATA_URL)
      .then(function (r) { return r.json(); })
      .then(function (d) {
        renderSummary(d);
        renderTaxonomy(d);
        renderTrend(d);
        renderCascade(d);
        renderLeaderboard(d);
        renderTimeline(d);
        renderPool(d);
      })
      .catch(function (e) {
        txt("evo-title", "Error loading data");
        console.error("Evolution dashboard:", e);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
