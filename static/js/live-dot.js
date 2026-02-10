(function() {
  'use strict';

  var dot = document.getElementById('nav-pulse');
  if (!dot) return;

  window.aimanStatus.subscribe(function(d) {
    var state = window.aimanStatus.resolveState(d);
    dot.className = 'pulse-dot';
    if (state === 'stale') {
      dot.className = 'pulse-dot pulse-dot--stale';
    } else if (state === 'offline') {
      dot.className = 'pulse-dot pulse-dot--offline';
    }
  });
})();
