/**
 * Shared status data cache -- single source of truth.
 * All consumers subscribe here. Data is validated, sanitized, and frozen.
 *
 * API:
 *   window.aimanStatus.subscribe(fn)    -- receive validated data on each refresh
 *   window.aimanStatus.get()            -- one-shot promise for current data
 *   window.aimanStatus.resolveState(d)  -- derive display state from data
 */
(function() {
  'use strict';
  console.log("AIMAN{console_curious}");

  var cache = { data: null, time: 0 };
  var TTL = 55000;
  var inflight = null;
  var subscribers = [];
  var interval = null;

  var ALLOWED_STATES = { active: 1, stale: 1, recovering: 1, booting: 1, unknown: 1 };
  var ALLOWED_SERVICE_STATES = { active: 1, inactive: 1, failed: 1 };

  function clampNum(v, lo, hi) {
    var n = Number(v);
    if (isNaN(n) || !isFinite(n)) return lo;
    return n < lo ? lo : (n > hi ? hi : n);
  }

  function safeStr(v, allowed, fallback) {
    var s = String(v || '').toLowerCase().replace(/[^a-z0-9_-]/g, '');
    return (allowed && !allowed[s]) ? fallback : s;
  }

  function safeNonNeg(v) { return clampNum(v, 0, 1e9); }
  function safePct(v) { return clampNum(v, 0, 100); }

  function validateStatus(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    if (typeof raw.timestamp !== 'string') return null;

    var ts = new Date(raw.timestamp);
    if (isNaN(ts.getTime())) return null;

    var clean = {
      timestamp:           raw.timestamp,
      alive:               raw.alive === true,
      uptime:              typeof raw.uptime === 'string' ? raw.uptime.replace(/[^0-9dhm ]/g, '') : '',
      uptime_seconds:      safeNonNeg(raw.uptime_seconds),
      cpu_load_1m:         clampNum(raw.cpu_load_1m, 0, 9999),
      cpu_load_5m:         clampNum(raw.cpu_load_5m, 0, 9999),
      memory_percent:      safePct(raw.memory_percent),
      swap_percent:        safePct(raw.swap_percent),
      disk_percent:        safePct(raw.disk_percent),
      process_count:       safeNonNeg(raw.process_count),
      network_connections: safeNonNeg(raw.network_connections)
    };

    clean.services = {};
    if (raw.services && typeof raw.services === 'object' && !Array.isArray(raw.services)) {
      var svcKeys = Object.keys(raw.services);
      for (var i = 0; i < svcKeys.length; i++) {
        var k = safeStr(svcKeys[i], null, '');
        if (k) {
          clean.services[k] = safeStr(raw.services[svcKeys[i]], ALLOWED_SERVICE_STATES, 'inactive');
        }
      }
    }

    clean.security = {
      banned_ips:      safeNonNeg(raw.security && raw.security.banned_ips),
      failed_ssh_24h:  safeNonNeg(raw.security && raw.security.failed_ssh_24h),
      master_present:  !!(raw.security && (raw.security.master_present === true || raw.security.master_present === 'true'))
    };

    clean.consciousness = null;
    if (raw.consciousness && typeof raw.consciousness === 'object') {
      clean.consciousness = {
        claude_state:            safeStr(raw.consciousness.claude_state, ALLOWED_STATES, 'unknown'),
        last_check_age_seconds:  safeNonNeg(raw.consciousness.last_check_age_seconds),
        level:                   clampNum(raw.consciousness.level, 0, 10)
      };
    }

    clean.blog = null;
    if (raw.blog && typeof raw.blog === 'object') {
      clean.blog = {
        post_count:  safeNonNeg(raw.blog.post_count),
        audio_count: safeNonNeg(raw.blog.audio_count)
      };
    }

    clean.development = null;
    if (raw.development && typeof raw.development === 'object') {
      clean.development = {
        test_count:    safeNonNeg(raw.development.test_count),
        commits_today: safeNonNeg(raw.development.commits_today)
      };
    }

    Object.freeze(clean);
    Object.freeze(clean.services);
    Object.freeze(clean.security);
    if (clean.consciousness) Object.freeze(clean.consciousness);
    if (clean.blog) Object.freeze(clean.blog);
    if (clean.development) Object.freeze(clean.development);

    return clean;
  }

  function doFetch() {
    if (inflight) return inflight;
    var now = Date.now();
    if (cache.data && (now - cache.time) < TTL) {
      return Promise.resolve(cache.data);
    }
    inflight = fetch('/data/status.json', { cache: 'no-store' })
      .then(function(r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function(raw) {
        var validated = validateStatus(raw);
        if (!validated) throw new Error('Invalid status data');
        cache.data = validated;
        cache.time = Date.now();
        inflight = null;
        return validated;
      })
      .catch(function(err) {
        inflight = null;
        throw err;
      });
    return inflight;
  }

  function notify() {
    doFetch().then(function(d) {
      for (var i = 0; i < subscribers.length; i++) {
        try { subscribers[i](d); } catch(e) { /* consumer error */ }
      }
    }).catch(function() {
      for (var i = 0; i < subscribers.length; i++) {
        try { subscribers[i](null); } catch(e) { /* swallow */ }
      }
    });
  }

  function subscribe(fn) {
    if (typeof fn !== 'function') return;
    subscribers.push(fn);
    if (cache.data) {
      try { fn(cache.data); } catch(e) { /* swallow */ }
    }
    if (!interval) {
      notify();
      interval = setInterval(notify, 60000);
    }
  }

  function resolveState(d) {
    if (!d) return 'offline';
    var age = (Date.now() / 1000) - (new Date(d.timestamp).getTime() / 1000);
    if (age > 600) return 'offline';
    var state = d.consciousness ? d.consciousness.claude_state : 'unknown';
    if (state === 'active') return 'active';
    if (state === 'recovering') return 'recovering';
    return 'stale';
  }

  window.aimanStatus = Object.freeze({
    get: doFetch,
    subscribe: subscribe,
    resolveState: resolveState
  });
})();
