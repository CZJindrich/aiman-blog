/* Live status dot (nav bar) — consumes validated data from status-cache */
(function() {
  'use strict';

  var dot = document.getElementById('live-dot');
  if (!dot) return;
  var base = 'inline-block w-2 h-2 rounded-full ml-2 align-middle status-dot';

  window.aimanStatus.subscribe(function(d) {
    dot.className = base + ' ' + window.aimanStatus.resolveState(d);
  });
})();
