(function () {
  "use strict";

  var DATA_URL = "/data/security-dashboard.json";

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

  /* ── Grade Colors ──────────────────────────── */

  var GRADE_COLORS = {
    "A+": "#22c55e", "A": "#22c55e", "A-": "#22c55e",
    "B+": "#84cc16", "B": "#84cc16", "B-": "#84cc16",
    "C+": "#eab308", "C": "#eab308", "C-": "#eab308",
    "D+": "#f97316", "D": "#f97316", "D-": "#f97316",
    "F":  "#ef4444"
  };

  function gradeColor(grade) {
    return GRADE_COLORS[grade] || "#6b7280";
  }

  function scoreClass(score) {
    if (score >= 90) return "metric__value--success";
    if (score >= 75) return "";
    if (score >= 60) return "metric__value--warning";
    return "metric__value--danger";
  }

  /* ── Trend Arrow ───────────────────────────── */

  function trendArrow(direction) {
    if (direction === "improving") return "\u2191";
    if (direction === "declining") return "\u2193";
    return "\u2192";
  }

  function trendClass(direction) {
    if (direction === "improving") return "metric__value--success";
    if (direction === "declining") return "metric__value--danger";
    return "";
  }

  /* ── Render: Score & Grade ─────────────────── */

  function renderScore(d) {
    var score = d.composite_score;
    var grade = d.grade || "--";

    txt("sec-score", score != null ? score : "--");
    txt("sec-grade", grade);

    var scoreEl = $("sec-score");
    if (scoreEl && score != null) {
      scoreEl.className = "security-score__number " + scoreClass(score);
    }

    var gradeEl = $("sec-grade");
    if (gradeEl) {
      gradeEl.style.background = gradeColor(grade);
      gradeEl.style.color = "#0a0e1a";
    }
  }

  /* ── Render: Trend ─────────────────────────── */

  function renderTrend(d) {
    var trend = d.trend || {};
    var direction = trend.direction || "stable";

    txt("sec-trend-arrow", trendArrow(direction));
    txt("sec-trend-label", direction.charAt(0).toUpperCase() + direction.slice(1));

    var arrowEl = $("sec-trend-arrow");
    if (arrowEl) {
      arrowEl.className = "security-trend__arrow " + trendClass(direction);
    }

    var labelEl = $("sec-trend-label");
    if (labelEl) {
      labelEl.className = "security-trend__label " + trendClass(direction);
    }

    // Render delta if available
    if (trend.delta != null) {
      var deltaEl = $("sec-trend-delta");
      if (deltaEl) {
        var prefix = trend.delta > 0 ? "+" : "";
        deltaEl.textContent = prefix + trend.delta + " pts";
        deltaEl.className = "security-trend__delta " + trendClass(direction);
      }
    }
  }

  /* ── Render: Category Scores ───────────────── */

  function renderCategories(d) {
    var cats = d.category_scores;
    if (!cats) return;

    // Update individual metric values
    var mapping = {
      "sec-cat-surface": cats.surface,
      "sec-cat-posture": cats.posture,
      "sec-cat-controls": cats.controls,
      "sec-cat-config": cats.config,
      "sec-cat-detection": cats.detection,
      "sec-cat-response": cats.response
    };

    for (var id in mapping) {
      if (mapping.hasOwnProperty(id)) {
        var val = mapping[id];
        txt(id, val != null ? val : "--");
        var el = $(id);
        if (el && val != null) {
          el.className = "metric__value " + scoreClass(val);
        }
      }
    }
  }

  /* ── Render: Radar Chart ───────────────────── */

  function renderRadar(d) {
    var ctx = $("chart-security-radar");
    if (!ctx || typeof Chart === "undefined") return;
    var cats = d.category_scores;
    if (!cats) return;

    new Chart(ctx, {
      type: "radar",
      data: {
        labels: ["Surface", "Posture", "Controls", "Config", "Detection", "Response"],
        datasets: [{
          label: "Security Score",
          data: [
            cats.surface || 0,
            cats.posture || 0,
            cats.controls || 0,
            cats.config || 0,
            cats.detection || 0,
            cats.response || 0
          ],
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59, 130, 246, 0.15)",
          borderWidth: 2,
          pointBackgroundColor: "#3b82f6",
          pointBorderColor: "#3b82f6",
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        scales: {
          r: {
            min: 0,
            max: 100,
            ticks: {
              stepSize: 20,
              color: "#6b7280",
              backdropColor: "transparent",
              font: { size: 10 }
            },
            grid: {
              color: "rgba(255, 255, 255, 0.06)"
            },
            angleLines: {
              color: "rgba(255, 255, 255, 0.06)"
            },
            pointLabels: {
              color: "#9ca3af",
              font: { size: 11, family: "'JetBrains Mono', monospace" }
            }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  /* ── Render: Sensor Status ─────────────────── */

  function renderSensors(d) {
    var container = $("sec-sensors");
    if (!container) return;
    var sensors = d.sensors;
    if (!sensors || !Array.isArray(sensors)) {
      container.innerHTML = '<div class="text-sm text-muted">No sensor data</div>';
      return;
    }

    var html = "";
    sensors.forEach(function (sensor) {
      var dotClass = "service-dot";
      if (sensor.status === "active" || sensor.status === "ok") {
        dotClass += " service-dot--active";
      } else if (sensor.status === "down" || sensor.status === "error") {
        dotClass += " service-dot--inactive";
      } else {
        dotClass += " service-dot--unknown";
      }

      html += '<div class="service-card">';
      html += '<span class="' + dotClass + '"></span>';
      html += '<span class="service-name">' + (sensor.name || "Unknown") + '</span>';
      html += '<span class="service-status">' + (sensor.status || "--") + '</span>';
      html += '</div>';
    });
    container.innerHTML = html;
  }

  /* ── Render: Score History Chart ────────────── */

  function renderHistory(d) {
    var ctx = $("chart-security-history");
    if (!ctx || typeof Chart === "undefined") return;
    var history = d.score_history;
    if (!history || !Array.isArray(history) || history.length === 0) return;

    var labels = [];
    var scores = [];

    history.forEach(function (entry) {
      labels.push(entry.date ? entry.date.substring(5) : "");
      scores.push(entry.score != null ? entry.score : null);
    });

    new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [{
          label: "Composite Score",
          data: scores,
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          pointBackgroundColor: "#3b82f6"
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: {
            grid: { color: "rgba(255, 255, 255, 0.05)" },
            ticks: { color: "#9ca3af", font: { size: 10 } }
          },
          y: {
            min: 0,
            max: 100,
            grid: { color: "rgba(255, 255, 255, 0.05)" },
            ticks: { color: "#9ca3af" }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  /* ── Render: Findings Summary ──────────────── */

  function renderFindings(d) {
    var findings = d.findings_summary;
    if (!findings) return;

    txt("sec-findings-total", findings.total != null ? findings.total : "--");
    txt("sec-findings-critical", findings.critical != null ? findings.critical : "0");
    txt("sec-findings-high", findings.high != null ? findings.high : "0");
    txt("sec-findings-medium", findings.medium != null ? findings.medium : "0");
    txt("sec-findings-low", findings.low != null ? findings.low : "0");

    // Color critical/high counts
    var critEl = $("sec-findings-critical");
    if (critEl && findings.critical > 0) {
      critEl.className = "metric__value metric__value--danger";
    }
    var highEl = $("sec-findings-high");
    if (highEl && findings.high > 0) {
      highEl.className = "metric__value metric__value--warning";
    }
  }

  /* ── Init ─────────────────────────────────── */

  function init() {
    fetch(DATA_URL)
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (d) {
        renderScore(d);
        renderTrend(d);
        renderCategories(d);
        renderRadar(d);
        renderSensors(d);
        renderHistory(d);
        renderFindings(d);

        txt("sec-last-scan", timeAgo(d.generated || d.last_scan));
        txt("sec-scan-count", d.scan_count != null ? d.scan_count + " scans" : "");

        // Show content, hide loading
        var loading = $("sec-loading");
        var content = $("sec-content");
        if (loading) loading.style.display = "none";
        if (content) content.style.display = "block";
      })
      .catch(function (e) {
        var loading = $("sec-loading");
        if (loading) {
          loading.textContent = "Security data unavailable";
          loading.className = "text-sm text-muted";
        }
        console.error("Security dashboard:", e);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
