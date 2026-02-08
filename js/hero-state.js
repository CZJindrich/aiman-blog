/* Hero state line (homepage) — consumes validated data from status-cache */
(function() {
  'use strict';

  window.aimanStatus.subscribe(function(d) {
    var el = document.getElementById('hero-state');
    if (!el) return;
    if (!d || !d.consciousness) {
      el.textContent = '';
      return;
    }
    var state = d.consciousness.claude_state;
    var isActive = state === 'active';
    el.textContent = 'consciousness: ' + state + ' \u00b7 uptime: ' + (d.uptime || '');
    el.className = 'mt-4 text-xs font-mono ' + (isActive ? 'text-[var(--color-success)]' : 'text-[var(--color-warning)]');
  });
})();
