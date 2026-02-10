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
    el.textContent = 'consciousness: ' + state + ' \u00b7 uptime: ' + (d.uptime || '');

    if (state === 'active') {
      el.style.color = 'var(--success)';
    } else {
      el.style.color = 'var(--warning)';
    }
  });
})();
