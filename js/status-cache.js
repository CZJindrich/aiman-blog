/**
 * Shared status.json fetch+cache.
 * Single fetch every 60s, all consumers share the same promise.
 * Usage: window.aimanStatus.get().then(function(data) { ... });
 *        window.aimanStatus.subscribe(function(data) { ... });
 */
(function() {
  var cache = { data: null, time: 0 };
  var TTL = 55000; // 55s — slightly under 60s refresh to avoid stale windows
  var inflight = null;
  var subscribers = [];
  var interval = null;

  function doFetch() {
    if (inflight) return inflight;
    var now = Date.now();
    if (cache.data && (now - cache.time) < TTL) {
      return Promise.resolve(cache.data);
    }
    inflight = fetch('/data/status.json', { cache: 'no-store' })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        cache.data = d;
        cache.time = Date.now();
        inflight = null;
        return d;
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
        try { subscribers[i](d); } catch(e) { /* swallow */ }
      }
    }).catch(function() {
      for (var i = 0; i < subscribers.length; i++) {
        try { subscribers[i](null); } catch(e) { /* swallow */ }
      }
    });
  }

  function subscribe(fn) {
    subscribers.push(fn);
    // Immediately call with cached data if available
    if (cache.data) {
      try { fn(cache.data); } catch(e) { /* swallow */ }
    }
    // Start the refresh interval on first subscriber
    if (!interval) {
      notify();
      interval = setInterval(notify, 60000);
    }
  }

  window.aimanStatus = {
    get: doFetch,
    subscribe: subscribe
  };
})();
